#!/usr/bin/env tsx
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { saveUser, findUserByEmail, UserRecord } from "../src/lib/auth/userStore";

function parseCliArgs(): {
  email?: string;
  password?: string;
  role: "admin" | "client";
  name?: string;
} {
  const args = process.argv.slice(2);
  const options: {
    email?: string;
    password?: string;
    role: "admin" | "client";
    name?: string;
  } = {
    role: "client",
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--email" && i + 1 < args.length) {
      options.email = args[++i];
    } else if (arg === "--password" && i + 1 < args.length) {
      options.password = args[++i];
    } else if (arg === "--role" && i + 1 < args.length) {
      const r = args[++i].toLowerCase();
      options.role = r === "admin" ? "admin" : "client";
    } else if ((arg === "--name" || arg === "--clientName") && i + 1 < args.length) {
      options.name = args[++i];
    }
  }

  return options;
}

async function main() {
  const { email, password, role, name } = parseCliArgs();

  if (!email || !password) {
    console.error("Usage: npm run auth:provision -- --email <email> --password <password> [--role <client|admin>] [--name <full_name>]");
    process.exit(1);
  }

  const normalizedEmail = email.toLowerCase().trim();
  console.log(`[PROVISION] Starting provisioning for: ${normalizedEmail} (Role: ${role})`);

  // Hash password with bcryptjs (10 rounds)
  const passwordHash = await bcrypt.hash(password, 10);
  
  // Legacy salt and scrypt hash for multi-engine compatibility
  const salt = crypto.randomBytes(16).toString("hex");
  const scryptHash = crypto.scryptSync(password, salt, 64).toString("hex");

  const record: UserRecord = {
    email: normalizedEmail,
    passwordHash,
    salt,
    hash: scryptHash,
    role,
    clientName: name || undefined,
    createdAt: new Date().toISOString(),
  };

  await saveUser(record);

  const existing = await findUserByEmail(normalizedEmail);
  if (existing) {
    console.log(`✓ [SUCCESS] Account provisioned and verified in store: ${normalizedEmail}`);
    console.log(`  Role: ${existing.role}`);
    console.log(`  Name: ${existing.clientName || "N/A"}`);
    console.log(`  Spruce Invite message:`);
    console.log(
      `  "Welcome to Cognitive Edge Clinic. Your secure portal credentials have been provisioned: Username: ${normalizedEmail} | Temporary Password: ${password}. Access your vault at https://cognitive-wellness.netlify.app/vault"`
    );
  } else {
    console.error("✗ [ERROR] Verification failed after saving user.");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("[PROVISION] Fatal error:", err);
  process.exit(1);
});
