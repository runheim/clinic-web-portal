import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { getStore } from "@netlify/blobs";

export interface MemberRecord {
  email: string;
  salt: string;
  hash: string;
  createdAt: string;
  passkeyCredentials?: Array<{
    id: string;
    publicKey: string;
    counter: number;
    createdAt: string;
  }>;
}

// In-memory cache for fast warm hits
declare global {
  var __CLINIC_MEMBERS_CACHE__: Map<string, MemberRecord> | undefined;
}

const memoryStore: Map<string, MemberRecord> =
  globalThis.__CLINIC_MEMBERS_CACHE__ ?? new Map<string, MemberRecord>();
globalThis.__CLINIC_MEMBERS_CACHE__ = memoryStore;

/**
 * Resolves the Netlify Blobs store for member persistence.
 * Attempts:
 * 1. Auto-injected Netlify Blobs context (Netlify Functions & Next.js Runtime).
 * 2. Explicit siteID / token configuration (via NETLIFY_SITE_ID & NETLIFY_AUTH_TOKEN).
 * 3. Standard getStore("members") in Netlify cloud environments.
 * Returns null if Blobs environment is unconfigured (enabling local dev/test fallback).
 */
export function getMembersStore() {
  try {
    // 1. Automatic Netlify Blobs context injected by runtime
    if (process.env.NETLIFY_BLOBS_CONTEXT) {
      return getStore("members");
    }

    // 2. Explicit site credentials or API token fallback
    const siteID =
      process.env.NETLIFY_SITE_ID || process.env.SITE_ID || "17273c6e-100f-403d-b963-d879bf47d66b";
    const token = process.env.NETLIFY_AUTH_TOKEN || process.env.NETLIFY_API_TOKEN;

    if (siteID && token) {
      return getStore({
        name: "members",
        siteID,
        token,
      });
    }

    // 3. Standard call when running in Netlify production
    if (process.env.NETLIFY) {
      return getStore("members");
    }
  } catch {
    // Environment lacks Blobs configuration; gracefully fall back to local disk
    return null;
  }

  return null;
}

function getLocalStorePath(): string {
  try {
    const localDir = path.join(process.cwd(), ".data");
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    return path.join(localDir, "members.json");
  } catch {
    return path.join(os.tmpdir(), "clinic-members.json");
  }
}

function readLocalFile(): Record<string, MemberRecord> {
  try {
    const p = getLocalStorePath();
    if (fs.existsSync(p)) {
      return JSON.parse(fs.readFileSync(p, "utf8"));
    }
  } catch (err) {
    console.warn("Notice: Local file read bypassed:", err);
  }
  return {};
}

function writeLocalFile(data: Record<string, MemberRecord>): void {
  try {
    const p = getLocalStorePath();
    fs.writeFileSync(p, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.warn("Notice: Local file write bypassed:", err);
  }
}

export async function getMember(email: string): Promise<MemberRecord | null> {
  const normalized = email.toLowerCase().trim();

  // 1. Fast in-memory process cache
  if (memoryStore.has(normalized)) {
    return memoryStore.get(normalized)!;
  }

  // 2. Netlify Blobs Cloud Store
  const store = getMembersStore();
  if (store) {
    try {
      const record = await store.get(normalized, { type: "json" });
      if (record) {
        memoryStore.set(normalized, record as MemberRecord);
        return record as MemberRecord;
      }
    } catch (err) {
      console.warn("Notice: Netlify Blobs read failed, checking fallback:", err);
    }
  }

  // 3. Local/Tmp Fallback (Development & Test suites)
  const diskData = readLocalFile();
  if (diskData[normalized]) {
    memoryStore.set(normalized, diskData[normalized]);
    return diskData[normalized];
  }

  return null;
}

export async function saveMember(member: MemberRecord): Promise<void> {
  const normalized = member.email.toLowerCase().trim();
  memoryStore.set(normalized, member);

  // 1. Netlify Blobs Cloud Store (Permanent cloud persistence)
  const store = getMembersStore();
  let savedToBlobs = false;

  if (store) {
    try {
      await store.setJSON(normalized, member);
      savedToBlobs = true;
    } catch (err) {
      console.warn("Notice: Netlify Blobs write failed, saving to local fallback:", err);
    }
  }

  // 2. Local fallback for development and test suites, or if Blobs write failed
  if (!savedToBlobs || !process.env.NETLIFY) {
    const diskData = readLocalFile();
    diskData[normalized] = member;
    writeLocalFile(diskData);
  }
}

export function hashPassword(password: string): { salt: string; hash: string } {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return { salt, hash };
}

export function verifyPassword(password: string, salt: string, hash: string): boolean {
  if (!password || !salt || !hash) {
    return false;
  }
  try {
    const candidateBuf = crypto.scryptSync(password, salt, 64);
    const hashBuf = Buffer.from(hash, "hex");
    if (candidateBuf.length !== hashBuf.length) {
      return false;
    }
    return crypto.timingSafeEqual(candidateBuf, hashBuf);
  } catch {
    return false;
  }
}

export function createSessionToken(email: string): string {
  const secret = process.env.CLINIC_AUTH_SECRET;
  if (!secret) {
    throw new Error("CLINIC_AUTH_SECRET must be configured in environment.");
  }
  const payload = Buffer.from(
    JSON.stringify({
      email: email.toLowerCase().trim(),
      exp: Date.now() + 1000 * 60 * 60 * 24 * 30, // 30-day session
    })
  ).toString("base64url");
  const signature = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function verifySessionToken(token: string): { email: string } | null {
  try {
    const secret = process.env.CLINIC_AUTH_SECRET;
    if (!secret) return null;
    const [payloadB64, signature] = token.split(".");
    if (!payloadB64 || !signature) return null;
    const expectedSig = crypto.createHmac("sha256", secret).update(payloadB64).digest("base64url");
    const sigBuf = Buffer.from(signature, "utf8");
    const expBuf = Buffer.from(expectedSig, "utf8");
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }
    const data = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));
    if (Date.now() > data.exp) return null;
    return { email: data.email };
  } catch {
    return null;
  }
}

/**
 * Diagnostic utility to probe storage layer connectivity and configuration
 */
export async function diagnoseStorageEngine(): Promise<{
  engine: "netlify-blobs" | "local-disk";
  blobsConnected: boolean;
  storeName: string;
  hasAutoContext: boolean;
  siteId: string | null;
  hasAuthToken: boolean;
  isNetlifyEnv: boolean;
}> {
  const hasAutoContext = Boolean(process.env.NETLIFY_BLOBS_CONTEXT);
  const siteId =
    process.env.NETLIFY_SITE_ID || process.env.SITE_ID || (process.env.NETLIFY ? "17273c6e-100f-403d-b963-d879bf47d66b" : null);
  const hasAuthToken = Boolean(process.env.NETLIFY_AUTH_TOKEN || process.env.NETLIFY_API_TOKEN);
  const isNetlifyEnv = Boolean(process.env.NETLIFY);

  const store = getMembersStore();
  let blobsConnected = false;

  if (store) {
    try {
      await store.get("__probe_ping__", { type: "text" });
      blobsConnected = true;
    } catch {
      blobsConnected = false;
    }
  }

  return {
    engine: blobsConnected ? "netlify-blobs" : "local-disk",
    blobsConnected,
    storeName: "members",
    hasAutoContext,
    siteId,
    hasAuthToken,
    isNetlifyEnv,
  };
}
