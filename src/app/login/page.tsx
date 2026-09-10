"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function MemberLoginGateway() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tier, setTier] = useState<"standard" | "vip">("standard");
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authStatus, setAuthStatus] = useState<string | null>(null);

  const handleSelectDemo = (selectedTier: "standard" | "vip") => {
    setTier(selectedTier);
    if (selectedTier === "vip") {
      setEmail("vip.member@cognitiveedgeclinic.com");
      setPassword("CognitiveVIP$2026");
    } else {
      setEmail("client.standard@cognitiveedgeclinic.com");
      setPassword("CognitiveEdge$2026");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);
    setAuthStatus("VERIFYING TLS 1.3 CLIENT TOKEN...");

    setTimeout(() => {
      setAuthStatus("INITIALIZING ZERO-ePHI VAULT ENCLAVE...");
    }, 400);

    setTimeout(() => {
      router.push(`/vault?tier=${tier}`);
    }, 900);
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
              <div className="relative">
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-4 py-3 rounded-lg bg-canvas-obsidian border border-border-midnight text-text-surface font-mono text-xs placeholder:text-text-surface-muted/40 focus:outline-none focus:border-champagne-gold focus:ring-1 focus:ring-champagne-gold/40 transition-all tracking-widest"
                />
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
                  <span>Authenticate Session</span>
                  <span>&rarr;</span>
                </>
              )}
            </button>

            {/* Live Telemetry Status Banner on Submit */}
            {authStatus && (
              <div className="p-2.5 rounded bg-canvas-obsidian border border-vitality-sage/40 text-center font-mono text-[10px] text-vitality-sage animate-pulse">
                {authStatus}
              </div>
            )}
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
