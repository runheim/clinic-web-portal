"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

function generateSecurePassword(): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnpqrstuvwxyz";
  const digits = "23456789";
  const symbols = "!@#$%^&*";
  const all = upper + lower + digits + symbols;

  let pass = "";
  pass += upper[Math.floor(Math.random() * upper.length)];
  pass += lower[Math.floor(Math.random() * lower.length)];
  pass += digits[Math.floor(Math.random() * digits.length)];
  pass += symbols[Math.floor(Math.random() * symbols.length)];

  for (let i = 4; i < 14; i++) {
    pass += all[Math.floor(Math.random() * all.length)];
  }

  return pass;
}

export default function AdminProvisioningPage() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Form state
  const [clientEmail, setClientEmail] = useState("");
  const [tempPassword, setTempPassword] = useState("");
  const [clientName, setClientName] = useState("");
  const [role, setRole] = useState<"client" | "admin">("client");

  // Status & Output
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [spruceMessage, setSpruceMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          const emailStr = (data.email || "").toLowerCase();
          const hasAdminRole =
            data.role === "admin" ||
            emailStr.includes("admin") ||
            emailStr.includes("owner") ||
            emailStr.includes("runheim");

          setIsAdmin(hasAdminRole);
          setUserEmail(data.email);
        } else {
          setIsAdmin(false);
        }
      })
      .catch(() => setIsAdmin(false));
  }, []);

  const handleGeneratePassword = () => {
    setTempPassword(generateSecurePassword());
  };

  const handleProvision = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSpruceMessage(null);
    setCopied(false);

    if (!clientEmail || !tempPassword) {
      setErrorMsg("Please provide both email and temporary password.");
      return;
    }

    if (tempPassword.length < 8) {
      setErrorMsg("Password must be at least 8 characters.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/provision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: clientEmail,
          password: tempPassword,
          role,
          clientName,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to provision user.");
      }

      setSpruceMessage(data.spruceMessage);
      setClientEmail("");
      setTempPassword("");
      setClientName("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to provision user.";
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = () => {
    if (spruceMessage) {
      navigator.clipboard.writeText(spruceMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  if (isAdmin === null) {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-white flex items-center justify-center font-mono text-xs">
        <span className="text-[#D4AF37]">VERIFYING ADMINISTRATIVE ACCESS...</span>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-white flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-950/40 border border-red-800/40 flex items-center justify-center text-red-400 text-xl font-mono">
          ✕
        </div>
        <h1 className="font-display text-2xl">Access Restricted</h1>
        <p className="font-body text-xs text-slate-400 max-w-md">
          Administrative privileges are required to access the client credential provisioning desk.
        </p>
        <div className="pt-4 flex gap-4">
          <Link
            href="/login"
            className="px-5 py-2.5 rounded-full bg-[#D4AF37] text-[#0B0F19] font-mono text-xs font-bold uppercase"
          >
            Sign In with Admin Account
          </Link>
          <Link
            href="/vault"
            className="px-5 py-2.5 rounded-full border border-slate-700 text-slate-300 font-mono text-xs uppercase"
          >
            Return to Vault
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F19] text-[#E2E8F0] p-6 lg:p-12 font-body selection:bg-champagne-gold selection:text-text-on-gold flex flex-col justify-between">
      {/* Header */}
      <header className="max-w-4xl mx-auto w-full border-b border-[#D4AF37]/20 pb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/vault" className="font-display text-xl text-[#D4AF37] font-semibold">
            COGNITIVE EDGE
          </Link>
          <span className="text-xs font-mono text-slate-500">/</span>
          <span className="font-mono text-xs uppercase tracking-widest text-slate-300">
            Staff Provisioning Desk
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-mono text-xs text-emerald-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Admin: {userEmail}</span>
          </span>
          <Link
            href="/vault"
            className="font-mono text-xs text-[#D4AF37] hover:underline uppercase"
          >
            ← Back to Vault
          </Link>
        </div>
      </header>

      {/* Main Provisioning Panel */}
      <main className="max-w-4xl mx-auto w-full my-10 space-y-8">
        <div className="bg-[#121826] border border-[#D4AF37]/30 rounded-2xl p-8 sm:p-10 shadow-2xl space-y-6">
          <div className="space-y-2 border-b border-slate-800 pb-4">
            <div className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-[#D4AF37]">
              <span>✦</span>
              <span>Netlify Blobs Secure Credential Generation</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl text-white">
              Administrative Client Provisioning
            </h1>
            <p className="font-body text-xs text-slate-400">
              Provision authorized patient or staff credentials directly to Netlify Blobs storage. Generates a one-click Spruce dispatch dispatch message upon completion.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-lg bg-red-950/40 border border-red-800/40 text-red-300 font-mono text-xs">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleProvision} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 text-left">
                <label className="font-mono text-xs text-slate-300 block">
                  Full Name (Optional)
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Jane Doe"
                  className="w-full px-4 py-2.5 rounded-lg bg-[#0B0F19] border border-slate-700 text-white font-mono text-xs focus:border-[#D4AF37] focus:outline-none"
                />
              </div>

              <div className="space-y-1.5 text-left">
                <label className="font-mono text-xs text-slate-300 block">
                  Account Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as "client" | "admin")}
                  className="w-full px-4 py-2.5 rounded-lg bg-[#0B0F19] border border-slate-700 text-white font-mono text-xs focus:border-[#D4AF37] focus:outline-none"
                >
                  <option value="client">Client (Member Enclave)</option>
                  <option value="admin">Administrator / Clinical Staff</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5 text-left">
              <label className="font-mono text-xs text-slate-300 block">
                Client Email Address <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                required
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="client@example.com"
                className="w-full px-4 py-2.5 rounded-lg bg-[#0B0F19] border border-slate-700 text-white font-mono text-xs focus:border-[#D4AF37] focus:outline-none"
              />
            </div>

            <div className="space-y-1.5 text-left">
              <div className="flex items-center justify-between">
                <label className="font-mono text-xs text-slate-300 block">
                  Temporary Password <span className="text-red-400">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleGeneratePassword}
                  className="font-mono text-[11px] text-[#D4AF37] hover:underline cursor-pointer"
                >
                  Generate Secure Password ⚅
                </button>
              </div>
              <input
                type="text"
                required
                minLength={8}
                value={tempPassword}
                onChange={(e) => setTempPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className="w-full px-4 py-2.5 rounded-lg bg-[#0B0F19] border border-slate-700 text-white font-mono text-xs focus:border-[#D4AF37] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-6 rounded-full bg-[#D4AF37] hover:bg-[#E6C65C] text-[#0B0F19] font-mono text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer shadow-[0_0_20px_rgba(212,175,55,0.3)]"
            >
              {isSubmitting ? "Provisioning Credential Container..." : "Provision Client Account in Netlify Blobs"}
            </button>
          </form>

          {/* Spruce Dispatch Output */}
          {spruceMessage && (
            <div className="mt-8 p-6 rounded-xl bg-[#0B0F19] border border-[#D4AF37]/50 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs uppercase tracking-wider text-emerald-400 font-semibold flex items-center gap-2">
                  <span>✓</span> Account Provisioned Successfully
                </span>
                <button
                  type="button"
                  onClick={copyToClipboard}
                  className="px-3.5 py-1.5 rounded bg-[#121826] hover:bg-[#1a2336] border border-[#D4AF37]/40 text-[#D4AF37] font-mono text-xs cursor-pointer flex items-center gap-1.5 transition-colors"
                >
                  <span>{copied ? "✓ Copied!" : "Copy Dispatch Message"}</span>
                </button>
              </div>

              <div className="p-4 rounded bg-[#121826] border border-slate-800 font-mono text-xs text-slate-300 select-all leading-relaxed">
                {spruceMessage}
              </div>

              <p className="font-mono text-[11px] text-slate-400">
                Paste directly into Spruce Care Messenger to dispatch credentials to the patient securely.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center font-mono text-[10px] text-slate-500 pt-6 border-t border-slate-800">
        &copy; 2026 COGNITIVE EDGE CLINICAL GROUP &bull; STAFF CREDENTIAL PROVISIONING
      </footer>
    </div>
  );
}
