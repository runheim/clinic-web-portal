import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { getStore } from "@netlify/blobs";

export interface PathwayInquiryRecord {
  id: string;
  submitterEmail: string;
  targetRecipient: string;
  objectives: string[];
  submittedAt: string;
  formattedIntake: string;
  status: "dispatched" | "pending";
  metadata?: Record<string, unknown>;
}

/**
 * Resolves the Netlify Blobs store for pathway inquiry persistence.
 * Attempts:
 * 1. Auto-injected Netlify Blobs context (Netlify Functions & Next.js Runtime).
 * 2. Explicit siteID / token configuration (via NETLIFY_SITE_ID & NETLIFY_AUTH_TOKEN).
 * 3. Standard getStore("pathway_inquiries") in Netlify cloud environments.
 * Returns null if Blobs environment is unconfigured (enabling local dev/test fallback).
 */
export function getPathwayStore() {
  try {
    // 1. Automatic Netlify Blobs context injected by runtime
    if (process.env.NETLIFY_BLOBS_CONTEXT) {
      return getStore("pathway_inquiries");
    }

    // 2. Explicit site credentials or API token fallback
    const siteID =
      process.env.NETLIFY_SITE_ID || process.env.SITE_ID || "17273c6e-100f-403d-b963-d879bf47d66b";
    const token = process.env.NETLIFY_AUTH_TOKEN || process.env.NETLIFY_API_TOKEN;

    if (siteID && token) {
      return getStore({
        name: "pathway_inquiries",
        siteID,
        token,
      });
    }

    // 3. Standard call when running in Netlify production
    if (process.env.NETLIFY) {
      return getStore("pathway_inquiries");
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
    return path.join(localDir, "pathway_inquiries.json");
  } catch {
    return path.join(os.tmpdir(), "clinic-pathway-inquiries.json");
  }
}

export function readLocalPathwayFile(): Record<string, PathwayInquiryRecord> {
  try {
    const p = getLocalStorePath();
    if (fs.existsSync(p)) {
      return JSON.parse(fs.readFileSync(p, "utf8"));
    }
  } catch (err) {
    console.warn("Notice: Local pathway file read bypassed:", err);
  }
  return {};
}

export function writeLocalPathwayFile(data: Record<string, PathwayInquiryRecord>): void {
  try {
    const p = getLocalStorePath();
    fs.writeFileSync(p, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.warn("Notice: Local pathway file write bypassed:", err);
  }
}

/**
 * Persists pathway submission into Netlify Blobs store `pathway_inquiries`
 * with local disk fallback if Blobs is unconfigured or unavailable.
 */
export async function savePathwayInquiry(
  record: PathwayInquiryRecord
): Promise<{ storedIn: "netlify-blobs" | "local-disk" }> {
  const store = getPathwayStore();
  let savedToBlobs = false;

  if (store) {
    try {
      await store.setJSON(record.id, record);
      savedToBlobs = true;
    } catch (err) {
      console.warn("Notice: Netlify Blobs write failed, saving to local fallback:", err);
    }
  }

  // Local fallback for development and test suites, or if Blobs write failed
  if (!savedToBlobs || !process.env.NETLIFY) {
    const localData = readLocalPathwayFile();
    localData[record.id] = record;
    writeLocalPathwayFile(localData);
  }

  return {
    storedIn: savedToBlobs ? "netlify-blobs" : "local-disk",
  };
}

/**
 * Retrieves a pathway inquiry by ID from Blobs or local fallback
 */
export async function getPathwayInquiry(id: string): Promise<PathwayInquiryRecord | null> {
  const store = getPathwayStore();
  if (store) {
    try {
      const record = await store.get(id, { type: "json" });
      if (record) return record as PathwayInquiryRecord;
    } catch (err) {
      console.warn("Notice: Netlify Blobs read failed, checking fallback:", err);
    }
  }

  const localData = readLocalPathwayFile();
  return localData[id] || null;
}
