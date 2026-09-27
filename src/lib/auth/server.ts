import crypto from "node:crypto";
import { getStore } from "@netlify/blobs";
import { findUserByEmail, saveUser } from "./userStore";

export interface MemberRecord {
  email: string;
  salt: string;
  hash: string;
  passwordHash?: string;
  createdAt: string;
  role?: "admin" | "client";
  clientName?: string;
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
 * Resolves the Netlify Blobs store for member/user persistence.
 * Supports configurable storeName (defaults to "users" or "members").
 */
export function getMembersStore(storeName: string = "users") {
  try {
    // 1. Automatic Netlify Blobs context injected by runtime
    if (process.env.NETLIFY_BLOBS_CONTEXT) {
      return getStore(storeName);
    }

    // 2. Explicit site credentials or API token fallback
    const siteID =
      process.env.NETLIFY_SITE_ID || process.env.SITE_ID || "17273c6e-100f-403d-b963-d879bf47d66b";
    const token = process.env.NETLIFY_AUTH_TOKEN || process.env.NETLIFY_API_TOKEN;

    if (siteID && token) {
      return getStore({
        name: storeName,
        siteID,
        token,
      });
    }

    // 3. Standard call when running in Netlify production
    if (process.env.NETLIFY) {
      return getStore(storeName);
    }
  } catch {
    // Environment lacks Blobs configuration; gracefully fall back to local disk
    return null;
  }

  return null;
}

export async function getMember(email: string): Promise<MemberRecord | null> {
  const normalized = email.toLowerCase().trim();

  // 1. Process in-memory cache check
  if (memoryStore.has(normalized)) {
    return memoryStore.get(normalized)!;
  }

  // 2. Query unified dual-mode user store (Local disk + Netlify Blobs)
  const user = await findUserByEmail(normalized);
  if (user) {
    const salt =
      user.salt ||
      (user.passwordHash && user.passwordHash.includes(":")
        ? user.passwordHash.split(":")[0]
        : "");
    const hash =
      user.hash ||
      (user.passwordHash && user.passwordHash.includes(":")
        ? user.passwordHash.split(":")[1]
        : user.passwordHash || "");

    const rec: MemberRecord = {
      email: user.email,
      salt,
      hash,
      role: user.role,
      clientName: user.clientName,
      createdAt: user.createdAt,
      passkeyCredentials: user.passkeyCredentials,
    };
    memoryStore.set(normalized, rec);
    return rec;
  }

  return null;
}

export async function saveMember(member: MemberRecord): Promise<void> {
  const normalized = member.email.toLowerCase().trim();
  memoryStore.set(normalized, member);

  const passwordHash =
    member.salt && member.hash ? `${member.salt}:${member.hash}` : "";

  await saveUser({
    email: normalized,
    passwordHash,
    salt: member.salt,
    hash: member.hash,
    role: member.role || "client",
    clientName: member.clientName,
    createdAt: member.createdAt,
    passkeyCredentials: member.passkeyCredentials,
  });
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

export function createSessionToken(email: string, role: "admin" | "client" = "client"): string {
  const secret = process.env.CLINIC_AUTH_SECRET;
  if (!secret) {
    throw new Error("CLINIC_AUTH_SECRET must be configured in environment.");
  }
  const payload = Buffer.from(
    JSON.stringify({
      email: email.toLowerCase().trim(),
      role,
      exp: Date.now() + 1000 * 60 * 60 * 24 * 30, // 30-day session
    })
  ).toString("base64url");
  const signature = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function verifySessionToken(token: string): { email: string; role: "admin" | "client" } | null {
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
    return { email: data.email, role: (data.role as "admin" | "client") || "client" };
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
