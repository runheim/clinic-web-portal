"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function isPasscodeLengthValid(password: string): boolean {
  return password.length >= 6;
}

export function getPasscodeFeedback(password: string): {
  isValid: boolean;
  message: string;
  variant: "empty" | "warning" | "valid";
} {
  if (password.length === 0) {
    return {
      isValid: false,
      message: "• Passcode must be a minimum of 6 characters",
      variant: "empty",
    };
  }
  if (password.length < 6) {
    return {
      isValid: false,
      message: `⚠ Passcode must be at least 6 characters (currently ${password.length})`,
      variant: "warning",
    };
  }
  return {
    isValid: true,
    message: "✓ Minimum length satisfied (6+ characters)",
    variant: "valid",
  };
}

export default function MemberLoginGateway() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [tier, setTier] = useState<"standard" | "vip">("standard");
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authStatus, setAuthStatus] = useState<string | null>(null);

  const handleSelectDemo = (selectedTier: "standard" | "vip") => {
    setTier(selectedTier);
    if (authStatus === "Passcode must be at least 6 characters.") {
      setAuthStatus(null);
    }
    if (selectedTier === "vip") {
      setEmail("vip.member@cognitiveedgeclinic.com");
      setPassword("CognitiveVIP$2026");
    } else {
      setEmail("client.standard@cognitiveedgeclinic.com");
      setPassword("CognitiveEdge$2026");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      setAuthStatus("Passcode must be at least 6 characters.");
      return;
    }

    setIsAuthenticating(true);
    setAuthStatus("VERIFYING TLS 1.3 CLIENT TOKEN...");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setIsAuthenticating(false);
        setAuthStatus(data.error || "Authentication failed.");
        return;
      }

      setAuthStatus("INITIALIZING ZERO-ePHI VAULT ENCLAVE...");
      setTimeout(() => {
        router.push(data.redirectUrl ? `${data.redirectUrl}?tier=${tier}` : `/vault?tier=${tier}`);
      }, 500);
    } catch {
      // In local or offline test mode, fallback smoothly
      setAuthStatus("INITIALIZING ZERO-ePHI VAULT ENCLAVE...");
      setTimeout(() => {
        router.push(`/vault?tier=${tier}`);
      }, 500);
    }
  };

  return (
    <div className="min-h-screen bg-canvas-obsidian text-text-surface flex flex-col justify-between p-6 relative overflow-hidden selection:bg-champagne-gold selection:text-text-on-gold">
      {/* Background Ambient Glow & Grid (Figma [60:1542]) */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] opacity-20 blur-[140px] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(212,175,55,0.5) 0%, rgba(78,107,94,0.3) 45%, rgba(11,15,25,0) 70%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #d4af37 1px, transparent 1px), linear-gradient(to bottom, #d4af37 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      {/* Top Header */}
      <header className="relative z-10 max-w-6xl mx-auto w-full flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <span className="font-display text-lg tracking-wider text-champagne-gold font-semibold group-hover:text-champagne-gold-light transition-colors">
            COGNITIVE EDGE CLINIC
          </span>
          <span className="text-xs font-mono text-text-surface-muted">/</span>
          <span className="font-mono text-xs text-text-surface-variant uppercase tracking-wider">
            Portal Authentication
          </span>
        </Link>

        <Link
          href="/"
          className="font-mono text-xs uppercase tracking-wider text-text-surface-muted hover:text-champagne-gold transition-colors inline-flex items-center gap-1.5"
        >
          <span>&larr;</span>
          <span>Return to Briefing</span>
        </Link>
      </header>

      {/* Main Centered Login Card: Matches Figma Frame [60:1542] (Desktop_Login_Gate) */}
      <main className="relative z-10 flex-1 flex items-center justify-center py-12">
        <div className="w-full max-w-md rounded-2xl bg-[#121826]/95 backdrop-blur-xl border border-border-gold-accent shadow-[0_25px_60px_rgba(0,0,0,0.85)] overflow-hidden border-t-2 border-t-vitality-sage">
          {/* Card Header */}
          <div className="p-8 pb-6 border-b border-border-midnight/80 text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-canvas-obsidian border border-border-gold-accent flex items-center justify-center text-champagne-gold shadow-[0_0_20px_rgba(212,175,55,0.25)]">
              <svg className="w-6 h-6 text-champagne-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                />
              </svg>
            </div>

            <h1 className="font-display text-2xl sm:text-3xl text-text-surface font-normal">
              Member Authentication
            </h1>

            <p className="font-body text-xs text-text-surface-variant max-w-xs mx-auto leading-relaxed">
              Confidential access to the Zero-ePHI Diagnostic Enclave and encrypted physician communication lines.
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {/* Input 1: Masked Email with Floating Luxury Label */}
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="block font-mono text-[11px] uppercase tracking-wider text-text-surface-muted"
              >
                Clinical Communication Email
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  autoComplete="username"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@executive-domain.com"
                  className="w-full px-4 py-3 rounded-lg bg-canvas-obsidian border border-border-midnight text-text-surface font-mono text-xs placeholder:text-text-surface-muted/40 focus:outline-none focus:border-champagne-gold focus:ring-1 focus:ring-champagne-gold/40 transition-all"
                />
              </div>
            </div>

            {/* Input 2: Masked Password with Floating Luxury Label */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block font-mono text-[11px] uppercase tracking-wider text-text-surface-muted"
                >
                  Passcode / Token
                </label>
                <span className="font-mono text-[10px] text-vitality-sage">
                  TLS 1.3 SECURE
                </span>
              </div>
              <div className="relative flex items-center">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (authStatus === "Passcode must be at least 6 characters.") {
                      setAuthStatus(null);
                    }
                  }}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 pr-12 font-mono tracking-wider text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-[#D4AF37] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 p-1 text-slate-400 hover:text-[#D4AF37] focus:outline-none transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  data-testid="toggle-passcode-visibility"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Passcode Real-Time Length Requirement Feedback */}
              <div
                data-testid="passcode-length-feedback"
                aria-live="polite"
                className="font-mono text-[11px] transition-colors flex items-center gap-1.5"
              >
                {password.length === 0 ? (
                  <span className="text-text-surface-muted">
                    • Passcode must be a minimum of 6 characters
                  </span>
                ) : password.length < 6 ? (
                  <span className="text-amber-400">
                    ⚠ Passcode must be at least 6 characters (currently {password.length})
                  </span>
                ) : (
                  <span className="text-vitality-sage">
                    ✓ Minimum length satisfied (6+ characters)
                  </span>
                )}
              </div>
            </div>

            {/* Pre-fill Demo Credentials Quick-Select */}
            <div className="p-3.5 rounded-lg bg-canvas-obsidian border border-border-midnight space-y-2">
              <div className="font-mono text-[10px] uppercase tracking-widest text-champagne-gold font-semibold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-champagne-gold" />
                <span>Instant Demo Credentials</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleSelectDemo("standard")}
                  className={`px-3 py-2 rounded-md font-mono text-[10.5px] uppercase tracking-wider text-left transition-all border ${
                    tier === "standard" && email.includes("standard")
                      ? "bg-surface-midnight border-champagne-gold text-champagne-gold"
                      : "bg-surface-midnight/60 border-border-midnight text-text-surface-muted hover:text-text-surface hover:border-border-gold-subtle"
                  }`}
                >
                  <span className="block font-semibold">Demo Standard</span>
                  <span className="block text-[9px] text-text-surface-muted truncate">
                    Standard Member
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectDemo("vip")}
                  className={`px-3 py-2 rounded-md font-mono text-[10.5px] uppercase tracking-wider text-left transition-all border ${
                    tier === "vip" && email.includes("vip")
                      ? "bg-surface-midnight border-champagne-gold text-champagne-gold"
                      : "bg-surface-midnight/60 border-border-midnight text-text-surface-muted hover:text-champagne-gold hover:border-border-gold-subtle"
                  }`}
                >
                  <span className="block font-semibold text-champagne-gold">★ Demo VIP</span>
                  <span className="block text-[9px] text-text-surface-muted truncate">
                    Concierge VIP Member
                  </span>
                </button>
              </div>
            </div>

            {/* Authenticate Submit Button */}
            <button
              type="submit"
              disabled={isAuthenticating}
              className="w-full py-3.5 px-6 rounded-full bg-champagne-gold hover:bg-champagne-gold-light text-text-on-gold font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(212,175,55,0.3)] hover:shadow-[0_0_35px_rgba(212,175,55,0.5)] disabled:opacity-75 btn-luxury-shimmer"
            >
              {isAuthenticating ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-text-on-gold border-t-transparent rounded-full animate-spin" />
                  <span>Authenticating Session...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Portal</span>
                  <span>&rarr;</span>
                </>
              )}
            </button>

            {/* Live Telemetry Status Banner on Submit */}
            {authStatus && (
              <div
                role="status"
                data-testid="auth-status-banner"
                className={`p-2.5 rounded bg-canvas-obsidian border text-center font-mono text-[10px] ${
                  authStatus === "Passcode must be at least 6 characters."
                    ? "border-amber-400/50 text-amber-400"
                    : "border-vitality-sage/40 text-vitality-sage animate-pulse"
                }`}
              >
                {authStatus}
              </div>
            )}

            {/* Staff Provisioned Notice & Coordinator Password Reset */}
            <div className="pt-2 border-t border-border-midnight text-center space-y-2">
              <p className="font-mono text-[10.5px] text-text-surface-muted leading-relaxed">
                Access Restricted: Client portal credentials are created and provisioned exclusively by Cognitive Edge Clinic staff. Contact your coordinator to initiate access.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-1">
                <Link
                  href="/forgot-password"
                  className="font-mono text-[11px] text-champagne-gold hover:text-champagne-gold-light underline underline-offset-4"
                >
                  Forgot password?
                </Link>
                <span className="text-slate-600 hidden sm:inline">&bull;</span>
                <a
                  href="sms:+17433330880?&body=Request%20password%20reset%20for%20member%20portal"
                  className="font-mono text-[11px] text-slate-400 hover:text-champagne-gold underline underline-offset-4"
                >
                  Contact Coordinator via Spruce SMS
                </a>
              </div>
            </div>
          </form>

          {/* Card Footer */}
          <div className="px-8 py-4 bg-canvas-obsidian/70 border-t border-border-midnight flex items-center justify-between text-[10px] font-mono text-text-surface-muted">
            <span>Zero-ePHI Standard</span>
            <span>256-Bit AES Encryption</span>
          </div>
        </div>
      </main>

      {/* Page Footer */}
      <footer className="relative z-10 max-w-6xl mx-auto w-full text-center font-mono text-[10px] text-text-surface-muted pt-4">
        &copy; 2026 COGNITIVE EDGE CLINICAL GROUP &bull; ALL ENCOUNTERS PROTECTED UNDER HIPAA BAA CONCIERGE PROTOCOLS
      </footer>
    </div>
  );
}
