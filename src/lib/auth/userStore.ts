import fs from "fs";
import path from "path";
import { getStore } from "@netlify/blobs";

const LOCAL_STORAGE_DIR = path.join(process.cwd(), ".data");
const LOCAL_STORAGE_PATH = path.join(LOCAL_STORAGE_DIR, "members.json");

export interface UserRecord {
  email: string;
  passwordHash?: string;
  salt?: string;
  hash?: string;
  role: "client" | "admin";
  clientName?: string;
  createdAt: string;
  resetToken?: string | null;
  resetTokenExpiry?: number | null;
  passkeyCredentials?: Array<{
    id: string;
    publicKey: string;
    counter: number;
    createdAt: string;
  }>;
}

// In-memory cache for fast hot reload and test execution
declare global {
  var __CLINIC_USER_STORE_CACHE__: Map<string, UserRecord> | undefined;
}

const memoryStore: Map<string, UserRecord> =
  globalThis.__CLINIC_USER_STORE_CACHE__ ?? new Map<string, UserRecord>();
globalThis.__CLINIC_USER_STORE_CACHE__ = memoryStore;

function ensureLocalDir() {
  if (!fs.existsSync(LOCAL_STORAGE_DIR)) {
    fs.mkdirSync(LOCAL_STORAGE_DIR, { recursive: true });
  }
}

/**
 * Helper: Read local JSON store from .data/members.json
 */
export function getLocalUsers(): Record<string, UserRecord> {
  try {
    ensureLocalDir();
    if (fs.existsSync(LOCAL_STORAGE_PATH)) {
      const raw = fs.readFileSync(LOCAL_STORAGE_PATH, "utf-8");
      const parsed = JSON.parse(raw);
      // Synchronize in-memory cache
      for (const [key, val] of Object.entries(parsed)) {
        if (!memoryStore.has(key)) {
          memoryStore.set(key, val as UserRecord);
        }
      }
      return parsed;
    }
  } catch (err) {
    console.error("[AUTH_STORE] Error reading local members.json:", err);
  }

  // Fallback to in-memory store if disk read fails or file is absent
  const memData: Record<string, UserRecord> = {};
  memoryStore.forEach((value, key) => {
    memData[key] = value;
  });
  return memData;
}

/**
 * Helper: Write updated user records to .data/members.json
 */
export function writeLocalUsers(users: Record<string, UserRecord>): void {
  try {
    ensureLocalDir();
    fs.writeFileSync(LOCAL_STORAGE_PATH, JSON.stringify(users, null, 2), "utf-8");
    for (const [key, val] of Object.entries(users)) {
      memoryStore.set(key, val);
    }
  } catch (err) {
    console.error("[AUTH_STORE] Error writing to local members.json:", err);
  }
}

export const saveLocalUsers = writeLocalUsers;

/**
 * Resolve Netlify Blobs store safely without throwing on localhost.
 */
function getSafeBlobStore(storeName: string = "users") {
  try {
    if (process.env.NETLIFY_BLOBS_CONTEXT || process.env.NETLIFY) {
      return getStore(storeName);
    }
    const siteID = process.env.NETLIFY_SITE_ID || process.env.SITE_ID;
    const token = process.env.NETLIFY_AUTH_TOKEN || process.env.NETLIFY_API_TOKEN;
    if (siteID && token) {
      return getStore({ name: storeName, siteID, token });
    }
  } catch {
    // Suppress Netlify Blobs connection errors in pure localhost mode
  }
  return null;
}

/**
 * Find user by email across local disk storage and Netlify Blobs.
 */
export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const normalizedEmail = email.toLowerCase().trim();

  // 1. Check in-memory process cache first
  if (memoryStore.has(normalizedEmail)) {
    const u = memoryStore.get(normalizedEmail)!;
    return {
      ...u,
      passwordHash: u.passwordHash || (u.salt && u.hash ? `${u.salt}:${u.hash}` : ""),
    };
  }

  // 2. Always check local disk first in development or as fallback
  const localUsers = getLocalUsers();
  if (localUsers[normalizedEmail]) {
    const u = localUsers[normalizedEmail];
    memoryStore.set(normalizedEmail, u);
    return {
      ...u,
      passwordHash: u.passwordHash || (u.salt && u.hash ? `${u.salt}:${u.hash}` : ""),
    };
  }

  // 3. Query Netlify Blobs if configured (production or Netlify dev CLI)
  try {
    const store = getSafeBlobStore("users");
    if (store) {
      const blobUser = await store.get(normalizedEmail, { type: "json" });
      if (blobUser) {
        const u = blobUser as UserRecord;
        memoryStore.set(normalizedEmail, u);
        return {
          ...u,
          passwordHash: u.passwordHash || (u.salt && u.hash ? `${u.salt}:${u.hash}` : ""),
        };
      }
    }
  } catch {
    // Suppress Netlify Blobs connection errors in pure localhost mode
    console.warn("[AUTH_STORE] Netlify Blobs unavailable, using local store.");
  }

  return null;
}

/**
 * Unified auth store getter interface alias
 */
export async function getUser(email: string): Promise<UserRecord | null> {
  return findUserByEmail(email);
}

/**
 * Find user by valid unexpired reset token across stores.
 */
export async function findUserByResetToken(token: string): Promise<UserRecord | null> {
  if (!token) return null;
  const users = await getAllUsers();
  const now = Date.now();
  for (const user of users) {
    if (
      user.resetToken &&
      user.resetToken === token &&
      user.resetTokenExpiry &&
      user.resetTokenExpiry > now
    ) {
      return user;
    }
  }
  return null;
}

/**
 * Save user seamlessly across local disk storage and Netlify Blobs.
 */
export async function saveUser(userData: UserRecord): Promise<void> {
  const normalizedEmail = userData.email.toLowerCase().trim();
  const passwordHash =
    userData.passwordHash ||
    (userData.salt && userData.hash ? `${userData.salt}:${userData.hash}` : "");

  const record: UserRecord = {
    ...userData,
    email: normalizedEmail,
    passwordHash,
    role: userData.role || "client",
  };

  // Update in-memory cache
  memoryStore.set(normalizedEmail, record);

  // 1. Always write to local disk first
  try {
    const localUsers = getLocalUsers();
    localUsers[normalizedEmail] = record;
    writeLocalUsers(localUsers);
  } catch (err) {
    console.error("[AUTH_STORE] Error writing to local members.json:", err);
  }

  // 2. Write to Netlify Blobs if configured
  try {
    const store = getSafeBlobStore("users");
    if (store) {
      await store.setJSON(normalizedEmail, record);
    }
  } catch {
    // Suppress Netlify Blobs connection errors in pure localhost mode
    console.warn("[AUTH_STORE] Netlify Blobs unavailable for write, saved to local store.");
  }
}

/**
 * Delete user from storage
 */
export async function deleteUser(email: string): Promise<boolean> {
  const normalizedEmail = email.toLowerCase().trim();
  memoryStore.delete(normalizedEmail);

  try {
    const localUsers = getLocalUsers();
    if (localUsers[normalizedEmail]) {
      delete localUsers[normalizedEmail];
      writeLocalUsers(localUsers);
    }
  } catch (err) {
    console.error("[AUTH_STORE] Error deleting user from local store:", err);
  }

  try {
    const store = getSafeBlobStore("users");
    if (store) {
      await store.delete(normalizedEmail);
    }
  } catch {
    // Ignore blob delete errors on localhost
  }

  return true;
}

/**
 * List all users from local store
 */
export async function getAllUsers(): Promise<UserRecord[]> {
  const localUsers = getLocalUsers();
  return Object.values(localUsers);
}
