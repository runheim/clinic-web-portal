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

function isNetlifyProduction(): boolean {
  return Boolean(process.env.NETLIFY && process.env.NETLIFY_BLOBS_CONTEXT);
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

  // 1. Fast memory cache
  if (memoryStore.has(normalized)) {
    return memoryStore.get(normalized)!;
  }

  // 2. Netlify Blobs Cloud Store
  if (isNetlifyProduction()) {
    try {
      const store = getStore("members");
      const record = await store.get(normalized, { type: "json" });
      if (record) {
        memoryStore.set(normalized, record as MemberRecord);
        return record as MemberRecord;
      }
    } catch (err) {
      console.warn("Notice: Netlify Blobs read failed, checking fallback:", err);
    }
  }

  // 3. Local/Tmp Fallback
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
  if (isNetlifyProduction()) {
    try {
      const store = getStore("members");
      await store.setJSON(normalized, member);
      return;
    } catch (err) {
      console.warn("Notice: Netlify Blobs write failed, saving to local fallback:", err);
    }
  }

  // 2. Local fallback for development and testing
  const diskData = readLocalFile();
  diskData[normalized] = member;
  writeLocalFile(diskData);
}

export function hashPassword(password: string): { salt: string; hash: string } {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return { salt, hash };
}

export function verifyPassword(password: string, salt: string, hash: string): boolean {
  try {
    const candidate = crypto.scryptSync(password, salt, 64).toString("hex");
    return crypto.timingSafeEqual(Buffer.from(candidate, "hex"), Buffer.from(hash, "hex"));
  } catch {
    return false;
  }
}

const AUTH_SECRET = process.env.CLINIC_AUTH_SECRET;

export function createSessionToken(email: string): string {
  if (!AUTH_SECRET) {
    throw new Error("CLINIC_AUTH_SECRET must be configured in environment.");
  }
  const payload = Buffer.from(
    JSON.stringify({
      email: email.toLowerCase().trim(),
      exp: Date.now() + 1000 * 60 * 60 * 24 * 30, // 30-day session
    })
  ).toString("base64url");
  const signature = crypto.createHmac("sha256", AUTH_SECRET).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function verifySessionToken(token: string): { email: string } | null {
  try {
    const [payloadB64, signature] = token.split(".");
    if (!payloadB64 || !signature) return null;
    if (!AUTH_SECRET) return null;
    const expectedSig = crypto.createHmac("sha256", AUTH_SECRET).update(payloadB64).digest("base64url");
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
