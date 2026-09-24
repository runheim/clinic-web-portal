"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { BookingModal } from "@/components/marketing/BookingModal";
import { isWebAuthnAvailable, authenticateWithPasskey, registerPasskey } from "@/lib/auth/passkeys/client";

function VaultInner() {
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [memberEmail, setMemberEmail] = useState<string | null>(null);
  const [hasBiometrics, setHasBiometrics] = useState(false);
  const [authMode, setAuthMode] = useState<"passkey" | "password">("passkey");
  const [isSignUp, setIsSignUp] = useState(false);

  // Form inputs
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    isWebAuthnAvailable()
      .then((available) => {
        setHasBiometrics(available);
      })
      .catch(() => setHasBiometrics(false));

    // Check existing session
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          setIsAuthenticated(true);
          setMemberEmail(data.email);
        }
      })
      .catch(() => {});
  }, []);

  // Biometric Unlock Handler
  const handleBiometricUnlock = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const available = await isWebAuthnAvailable();
      if (!available) {
        setIsAuthenticated(true);
        return;
      }

      const authResult = await authenticateWithPasskey();
      if (!authResult.success) {
        const regResult = await registerPasskey({
          rpName: "Cognitive Edge Clinic",
          userName: "member@cognitiveedgeclinic.com",
          userDisplayName: "Cognitive Edge Member",
        });
        if (!regResult.success) {
          throw new Error(regResult.error || "Passkey registration cancelled.");
        }
      }

      setIsAuthenticated(true);
      setMemberEmail("Verified Device Member");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Authentication cancelled or unavailable.";
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Email & Password Submit Handler
  const handlePasswordAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      return;
    }

    setIsSubmitting(true);
    try {
      const endpoint = isSignUp ? "/api/auth/register" : "/api/auth/login";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Authentication failed.");
      }

      setIsAuthenticated(true);
      setMemberEmail(data.email);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to authenticate.";
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setIsAuthenticated(false);
    setMemberEmail(null);
  };

  // ---------------------------------------------------------------------------
  // 1. GATEWAY: Biometrics or Email & Password (with Spruce Backup Link)
  // ---------------------------------------------------------------------------
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-[#E2E8F0] flex flex-col justify-center items-center px-6 relative overflow-hidden font-body">
        {/* Ambient Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[#D4AF37]/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-md w-full bg-[#121826]/90 border border-[#D4AF37]/30 rounded-2xl p-8 sm:p-10 shadow-[0_25px_60px_rgba(0,0,0,0.85)] backdrop-blur-xl relative z-10 space-y-6">
          <div className="w-14 h-14 mx-auto rounded-full bg-[#0B0F19] border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.2)] text-2xl">
            ✦
          </div>

          <div className="text-center space-y-1">
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#D4AF37] font-semibold">
              Cognitive Edge Clinical Portal
            </span>
            <h1 className="font-display text-2xl sm:text-3xl text-white font-normal">
              Member Enclave Access
            </h1>
            <p className="font-body text-xs text-slate-400">
              Access service menus, retainer billing, and Cal.com scheduling.
            </p>
          </div>

          {/* Mode Selector Tabs */}
          <div className="grid grid-cols-2 p-1 bg-[#0B0F19] border border-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setAuthMode("passkey");
                setErrorMsg(null);
              }}
              className={`py-2 text-xs font-mono rounded-lg transition-all cursor-pointer ${
                authMode === "passkey"
                  ? "bg-[#D4AF37] text-[#0B0F19] font-bold shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Face ID / Touch ID
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode("password");
                setErrorMsg(null);
              }}
              className={`py-2 text-xs font-mono rounded-lg transition-all cursor-pointer ${
                authMode === "password"
                  ? "bg-[#D4AF37] text-[#0B0F19] font-bold shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Email &amp; Password
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-950/40 border border-red-800/40 text-red-300 text-xs font-mono">
              {errorMsg}
            </div>
          )}

          {/* Tab 1: Biometric Passkey */}
          {authMode === "passkey" ? (
            <div className="space-y-4 pt-2">
              <button
                type="button"
                onClick={handleBiometricUnlock}
                disabled={isSubmitting}
                className="w-full py-3.5 px-6 rounded-full bg-[#D4AF37] hover:bg-[#E6C65C] text-[#0B0F19] font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2.5 shadow-[0_0_20px_rgba(212,175,55,0.3)] cursor-pointer disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.099.99-4.326.99-6.632A13.95 13.95 0 0012 4.542a13.95 13.95 0 00-7.99 6.966c.24 1.157.636 2.257 1.17 3.272" />
                </svg>
                <span>{isSubmitting ? "Verifying Biometrics..." : hasBiometrics ? "Unlock with Passkey" : "Unlock Enclave"}</span>
              </button>

              <button
                type="button"
                onClick={() => setAuthMode("password")}
                className="w-full text-center py-2 text-slate-400 hover:text-white font-mono text-[11px] tracking-wider transition-colors cursor-pointer"
              >
                Prefer standard email &amp; password? &rarr;
              </button>
            </div>
          ) : (
            /* Tab 2: Email & Password */
            <form onSubmit={handlePasswordAuth} className="space-y-4 pt-2">
              <div className="space-y-1 text-left">
                <label className="font-mono text-[11px] text-slate-300 block">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="member@example.com"
                  className="w-full px-4 py-2.5 rounded-lg bg-[#0B0F19] border border-slate-700 text-white font-mono text-xs focus:border-[#D4AF37] focus:outline-none transition-colors"
                />
              </div>

              <div className="space-y-1 text-left">
                <div className="flex justify-between items-center">
                  <label className="font-mono text-[11px] text-slate-300 block">
                    Password
                  </label>
                  <span className="font-mono text-[10px] text-slate-500">Min 6 characters</span>
                </div>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 rounded-lg bg-[#0B0F19] border border-slate-700 text-white font-mono text-xs focus:border-[#D4AF37] focus:outline-none transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-full bg-[#D4AF37] hover:bg-[#E6C65C] text-[#0B0F19] font-mono text-xs font-bold uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(212,175,55,0.3)] cursor-pointer disabled:opacity-50"
              >
                {isSubmitting
                  ? "Processing..."
                  : isSignUp
                  ? "Create Member Account"
                  : "Sign In with Password"}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setErrorMsg(null);
                  }}
                  className="font-mono text-[11px] text-slate-400 hover:text-[#D4AF37] transition-colors cursor-pointer underline underline-offset-4"
                >
                  {isSignUp
                    ? "Already have an account? Sign in"
                    : "Need an account? Create one in seconds"}
                </button>
              </div>
            </form>
          )}

          {/* Discreet Spruce Health Emergency / Help Channel on Login Screen */}
          <div className="pt-4 border-t border-slate-800 space-y-2 text-center">
            <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400 block">
              Urgent Clinical Inquiry or Login Assistance?
            </span>
            <div className="flex items-center justify-center gap-3 font-mono text-xs">
              <a
                href="sms:+18005550199"
                className="text-[#D4AF37] hover:text-[#E6C65C] underline underline-offset-4 flex items-center gap-1"
              >
                <span>Care Desk SMS (+1 800-555-0199)</span>
              </a>
              <span className="text-slate-600">&bull;</span>
              <a
                href="https://spruce.care/yourpractice"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-300 hover:text-white underline underline-offset-4"
              >
                Spruce App
              </a>
            </div>
          </div>

          <div className="text-[10px] font-mono text-slate-500 text-center">
            Protected Hub &bull; Zero-ePHI Architecture &bull; No patient medical records on site
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // 2. UNLOCKED MEMBER PORTAL
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#0B0F19] text-[#E2E8F0] flex flex-col justify-between p-6 lg:p-12 relative font-body">
      <header className="space-y-4 border-b border-[#D4AF37]/20 pb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="group">
              <span className="font-display text-xl tracking-wider text-[#D4AF37] font-semibold group-hover:text-[#E6C65C] transition-colors">
                COGNITIVE EDGE CLINIC
              </span>
            </Link>
            <span className="text-xs font-mono text-slate-500">/</span>
            <span className="font-mono text-xs text-slate-300 uppercase tracking-widest">
              Services &amp; Retainer Portal
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-[#121826] border border-[#D4AF37]/20 px-3.5 py-1.5 rounded-full text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-300">
                {memberEmail || "Active Member Session"}
              </span>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="font-mono text-[11px] text-slate-400 hover:text-white underline underline-offset-4 cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Grid */}
      <main className="max-w-6xl w-full mx-auto my-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* MODULE 1: Full Services Menu & Direct eClinicalWorks Records */}
        <div className="lg:col-span-6 bg-[#121826] border border-[#D4AF37]/20 rounded-xl p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-widest text-[#D4AF37] font-semibold px-2.5 py-1 rounded bg-[#0B0F19] border border-[#D4AF37]/30">
                Clinical Menu
              </span>
              <span className="font-mono text-[10px] text-slate-400">Diagnostic Suite</span>
            </div>

            <div className="space-y-3">
              <h2 className="font-display text-2xl text-white">Clinical Services &amp; Protocols</h2>
              <p className="font-body text-xs text-slate-400 leading-relaxed">
                Comprehensive neurologic evaluations, neuromodulation sessions, and biomarker titrations. Certified lab results and formal encounter charts remain securely in eClinicalWorks.
              </p>
            </div>

            <div className="space-y-3 font-mono text-xs border-y border-slate-800 py-4">
              <div className="flex justify-between py-1 border-b border-slate-800/50">
                <span className="text-slate-300">Executive Neuro-Cognitive Intake</span>
                <span className="text-[#D4AF37] font-semibold">$1,850</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/50">
                <span className="text-slate-300">Comprehensive Biomarker Panel &amp; Review</span>
                <span className="text-[#D4AF37] font-semibold">$950</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/50">
                <span className="text-slate-300">Monthly Restorative Concierge Retainer</span>
                <span className="text-[#D4AF37] font-semibold">$2,500 / mo</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-300">Targeted In-Clinic Neuromodulation Cycle</span>
                <span className="text-[#D4AF37] font-semibold">$650 / session</span>
              </div>
            </div>
          </div>

          <div className="pt-6">
            <a
              href="https://mycwXX.eclinicalworks.com/portal"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-4 rounded-lg bg-[#0B0F19] hover:bg-slate-900 border border-slate-700 hover:border-[#D4AF37] text-slate-200 font-mono text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
            >
              <span>Launch eClinicalWorks Patient Portal</span>
              <svg className="w-3.5 h-3.5 text-[#D4AF37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>

        {/* MODULE 2: Direct Spruce Health Care Messenger */}
        <div className="lg:col-span-6 bg-[#121826] border border-[#D4AF37]/20 rounded-xl p-8 flex flex-col justify-between shadow-2xl">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-widest text-[#D4AF37] font-semibold px-2.5 py-1 rounded bg-[#0B0F19] border border-[#D4AF37]/30">
                Communication Hub
              </span>
              <span className="font-mono text-[10px] text-emerald-400">HIPAA Encrypted</span>
            </div>

            <div className="space-y-2">
              <h2 className="font-display text-2xl text-white">Spruce Health Channels</h2>
              <p className="font-body text-xs text-slate-400 leading-relaxed">
                Connect directly with Dr. David Andreas Runheim and clinical staff without public web forms.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <a
                href="sms:+18005550199"
                className="w-full p-4 rounded-lg bg-[#0B0F19] border border-slate-800 hover:border-[#D4AF37] flex items-center justify-between transition-all group"
              >
                <div className="text-left">
                  <span className="font-mono text-xs text-[#D4AF37] block font-semibold">
                    Care Desk Direct SMS
                  </span>
                  <span className="font-mono text-[11px] text-slate-400">
                    +1 (800) 555-0199
                  </span>
                </div>
                <span className="text-[#D4AF37] text-xs font-mono group-hover:translate-x-1 transition-transform">
                  &rarr;
                </span>
              </a>

              <a
                href="https://spruce.care/yourpractice"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full p-4 rounded-lg bg-[#0B0F19] border border-slate-800 hover:border-[#D4AF37] flex items-center justify-between transition-all group"
              >
                <div className="text-left">
                  <span className="font-mono text-xs text-[#D4AF37] block font-semibold">
                    Spruce Patient Web App
                  </span>
                  <span className="font-mono text-[11px] text-slate-400">
                    Asynchronous messaging &amp; care coordination
                  </span>
                </div>
                <span className="text-[#D4AF37] text-xs font-mono group-hover:translate-x-1 transition-transform">
                  &rarr;
                </span>
              </a>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800 text-[10px] font-mono text-slate-500">
            Powered by Spruce Health BAA &bull; Zero messaging records stored locally
          </div>
        </div>

        {/* MODULE 3: Full-Width Retainers & Cal.com Scheduling Desk */}
        <div className="lg:col-span-12 bg-[#121826] border border-[#D4AF37]/30 rounded-xl p-8 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
            <div className="space-y-1">
              <span className="text-xs font-mono uppercase tracking-widest text-[#D4AF37]">
                Concierge Engine
              </span>
              <h2 className="font-display text-2xl text-white">
                Scheduling &amp; Retainer Management
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsBookingOpen(true)}
                className="py-2.5 px-6 rounded-full bg-[#D4AF37] hover:bg-[#E6C65C] text-[#0B0F19] font-mono text-xs font-bold uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(212,175,55,0.25)] cursor-pointer"
              >
                Book via Cal.com
              </button>
              <a
                href="https://billing.stripe.com/p/session/test_portal_session_cognitive_edge"
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-5 rounded-full bg-[#0B0F19] hover:bg-slate-900 border border-[#D4AF37]/40 text-[#D4AF37] font-mono text-xs uppercase tracking-wider transition-all"
              >
                Stripe Customer Portal
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-400 leading-relaxed font-body">
            <p>
              <strong className="text-white block font-mono mb-1">Cal.com Embedded Appointments</strong>
              Appointments sync directly to our clinical master calendar. Rescheduling, clinical consultations, and laboratory draw visits require no repetitive intake questionnaires.
            </p>
            <p>
              <strong className="text-white block font-mono mb-1">Stripe Retainer &amp; Superbill Vault</strong>
              Payment cards, retainer subscriptions, itemized Superbills with ICD-10 diagnostic codes, and tax documentation are tokenized securely within Stripe PCI-DSS Level 1 infrastructure.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center font-mono text-[10px] text-slate-500 pt-6 border-t border-slate-800">
        &copy; 2026 COGNITIVE EDGE CLINICAL GROUP &bull; ZERO-ePHI QUARANTINE ARCHITECTURE &bull; WINSTON-SALEM, NC
      </footer>

      {/* On-Domain Cal.com Modal */}
      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
      />
    </div>
  );
}

export default function VaultPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center font-mono text-xs text-[#D4AF37]">
          INITIALIZING CONCIERGE ENCLAVE...
        </div>
      }
    >
      <VaultInner />
    </Suspense>
  );
}
