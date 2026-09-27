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
  firstName?: string;
  lastName?: string;
  phone?: string;
  membershipTier?: string;
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

export function parseNames(
  firstName?: string,
  lastName?: string,
  clientName?: string,
  email?: string
): { firstName: string; lastName: string } {
  if (firstName && lastName) {
    return { firstName: firstName.trim(), lastName: lastName.trim() };
  }
  if (clientName && clientName.trim()) {
    const parts = clientName.trim().split(/\s+/);
    if (parts.length === 1) {
      return { firstName: parts[0], lastName: "—" };
    }
    const last = parts[parts.length - 1];
    const first = parts.slice(0, parts.length - 1).join(" ");
    return { firstName: first, lastName: last };
  }
  if (email) {
    const namePart = email.split("@")[0];
    const parts = namePart.split(/[._-]/);
    if (parts.length >= 2) {
      const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
      return { firstName: cap(parts[0]), lastName: cap(parts[1]) };
    }
    return { firstName: namePart, lastName: "—" };
  }
  return { firstName: "—", lastName: "—" };
}

// In-memory cache for fast hot reload and test execution
declare global {
  var __CLINIC_USER_STORE_CACHE__: Map<string, UserRecord> | undefined;
}

export const DEFAULT_SEED_USERS: Record<string, UserRecord> = {
  "andreas.runheim@gmail.com": {
    email: "andreas.runheim@gmail.com",
    passwordHash: "$2b$10$A.ahaYKNGchENB.YoY.tCuLyDysttZrs9zNAsp6IXeHEHa3uiKvq2",
    salt: "392c2b54903318dde62bc03d52c5d710",
    hash: "de4fae1cd1ca06895b46c5084094dd72a2b01f15c407331b2d5f315355d776e98eb3c5841cc818349c818058868401507e85c9395b77c46555d8274d588203ac",
    role: "admin",
    clientName: "Dr. David Andreas Runheim",
    firstName: "David Andreas",
    lastName: "Runheim",
    phone: "+1 (743) 333-0880",
    membershipTier: "Clinical Enclave Admin",
    createdAt: "2026-09-27T15:26:40.333Z",
  },
  "coordinator@cognitiveedge.com": {
    email: "coordinator@cognitiveedge.com",
    passwordHash: "$2b$10$A.ahaYKNGchENB.YoY.tCuLyDysttZrs9zNAsp6IXeHEHa3uiKvq2",
    salt: "ee9b79b9f91752d47fcdccc93be7f309",
    hash: "f5940ce4e61d6f3d0817515f0597cfd7f974f8844b4b37491f03d536b12e9760d7daded13fa1d2784fa867888ce31bdd3016763d24a5ef1a74ca36456853d3d4",
    role: "admin",
    clientName: "Clinical Coordinator",
    firstName: "Care",
    lastName: "Coordinator",
    phone: "+1 (743) 333-0880",
    membershipTier: "Clinical Staff / Coordinator",
    createdAt: "2026-09-27T12:27:16.585Z",
  },
  "admin@cognitiveedgeclinic.com": {
    email: "admin@cognitiveedgeclinic.com",
    salt: "7304396fa3aabd9afac91c68d55fd220",
    hash: "3e8f8fc832232d8cf1404d6216cab718fcef606086c6cffa6ec50b9bd3fb24a39ce1873708bfde73f0a8d96ff6a40fb34bd01a31c5cbe3f14a2b115eeab98768",
    passwordHash: "7304396fa3aabd9afac91c68d55fd220:3e8f8fc832232d8cf1404d6216cab718fcef606086c6cffa6ec50b9bd3fb24a39ce1873708bfde73f0a8d96ff6a40fb34bd01a31c5cbe3f14a2b115eeab98768",
    role: "admin",
    clientName: "Clinical Administrator",
    firstName: "Clinical",
    lastName: "Administrator",
    phone: "+1 (743) 333-0880",
    membershipTier: "Clinical Enclave Admin",
    createdAt: "2026-09-27T15:00:00.000Z",
  },
  "vip.member@cognitiveedgeclinic.com": {
    email: "vip.member@cognitiveedgeclinic.com",
    salt: "a495f6f631754fa7d3f2f15fb532f6db",
    hash: "4fe492f1cdfb88e713dc5e107cccab44fd4d4042395c26d788be2f89d042c8a3de1a3998c8927e11122e983582909d50971aaf5e2e3092e1ec7db8cab141568e",
    passwordHash: "a495f6f631754fa7d3f2f15fb532f6db:4fe492f1cdfb88e713dc5e107cccab44fd4d4042395c26d788be2f89d042c8a3de1a3998c8927e11122e983582909d50971aaf5e2e3092e1ec7db8cab141568e",
    role: "client",
    clientName: "Alexander Vance",
    firstName: "Alexander",
    lastName: "Vance",
    phone: "+1 (336) 555-0142",
    membershipTier: "Concierge VIP",
    createdAt: "2026-09-27T15:00:00.000Z",
  },
  "client.standard@cognitiveedgeclinic.com": {
    email: "client.standard@cognitiveedgeclinic.com",
    salt: "75b31572eeee8dc1aac662b0440682ae",
    hash: "96e27e58603646d68e4dc1465fc5966cdd79486e9edaad899d58324602265d35e5a0680b54251efcbe350562618bd07939ad47ded225d3ecf262c7dfa11c6e74",
    passwordHash: "75b31572eeee8dc1aac662b0440682ae:96e27e58603646d68e4dc1465fc5966cdd79486e9edaad899d58324602265d35e5a0680b54251efcbe350562618bd07939ad47ded225d3ecf262c7dfa11c6e74",
    role: "client",
    clientName: "Marcus Sterling",
    firstName: "Marcus",
    lastName: "Sterling",
    phone: "+1 (336) 555-0189",
    membershipTier: "Foundation",
    createdAt: "2026-09-27T15:00:00.000Z",
  },
};

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
 * Find user by email across local disk storage, Netlify Blobs, and default seed repository.
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

  // 2. Query Netlify Blobs if configured (takes precedence in production so updates persist)
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
  }

  // 3. Always check local disk in development or when available
  const localUsers = getLocalUsers();
  if (localUsers[normalizedEmail]) {
    const u = localUsers[normalizedEmail];
    memoryStore.set(normalizedEmail, u);
    return {
      ...u,
      passwordHash: u.passwordHash || (u.salt && u.hash ? `${u.salt}:${u.hash}` : ""),
    };
  }

  // 4. Fallback to default pre-provisioned clinical seed users
  if (DEFAULT_SEED_USERS[normalizedEmail]) {
    const seedUser = DEFAULT_SEED_USERS[normalizedEmail];
    memoryStore.set(normalizedEmail, seedUser);

    // Opportunistically persist seed user to Netlify Blobs if connected
    try {
      const store = getSafeBlobStore("users");
      if (store) {
        await store.setJSON(normalizedEmail, seedUser);
      }
    } catch {
      // Non-fatal
    }

    return {
      ...seedUser,
      passwordHash: seedUser.passwordHash || (seedUser.salt && seedUser.hash ? `${seedUser.salt}:${seedUser.hash}` : ""),
    };
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
 * List all users across seed repository, local store, and memory
 */
export async function getAllUsers(): Promise<UserRecord[]> {
  const localUsers = getLocalUsers();
  const allUsersMap: Record<string, UserRecord> = {};

  // 1. Initialize with default seed repository
  for (const [email, seed] of Object.entries(DEFAULT_SEED_USERS)) {
    allUsersMap[email] = { ...seed };
  }

  // 2. Merge local storage records, preserving seed phone/tier if unset
  for (const [email, local] of Object.entries(localUsers)) {
    const existing = allUsersMap[email];
    if (existing) {
      allUsersMap[email] = {
        ...existing,
        ...local,
        phone: local.phone || existing.phone,
        membershipTier: local.membershipTier || existing.membershipTier,
        firstName: local.firstName || existing.firstName,
        lastName: local.lastName || existing.lastName,
      };
    } else {
      allUsersMap[email] = local;
    }
  }

  // 3. Merge in-memory records
  memoryStore.forEach((user, email) => {
    const existing = allUsersMap[email];
    if (existing) {
      allUsersMap[email] = {
        ...existing,
        ...user,
        phone: user.phone || existing.phone,
        membershipTier: user.membershipTier || existing.membershipTier,
        firstName: user.firstName || existing.firstName,
        lastName: user.lastName || existing.lastName,
      };
    } else {
      allUsersMap[email] = user;
    }
  });

  return Object.values(allUsersMap);
}
