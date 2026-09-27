"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email || !email.includes("@")) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to process password reset request.");
      }

      setSubmitted(true);
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : "Service temporarily unavailable. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas-obsidian text-text-surface flex flex-col justify-between p-6 relative overflow-hidden selection:bg-champagne-gold selection:text-text-on-gold">
      {/* Background Ambient Glow & Grid */}
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
            Password Recovery
          </span>
        </Link>

        <Link
          href="/login"
          className="font-mono text-xs uppercase tracking-wider text-text-surface-muted hover:text-champagne-gold transition-colors inline-flex items-center gap-1.5"
        >
          <span>&larr;</span>
          <span>Return to Sign In</span>
        </Link>
      </header>

      {/* Main Card */}
      <main className="relative z-10 flex-1 flex items-center justify-center py-12">
        <div className="w-full max-w-md rounded-2xl bg-[#121826]/95 backdrop-blur-xl border border-border-gold-accent shadow-[0_25px_60px_rgba(0,0,0,0.85)] overflow-hidden border-t-2 border-t-[#D4AF37]">
          {/* Card Header */}
          <div className="p-8 pb-6 border-b border-border-midnight/80 text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-canvas-obsidian border border-border-gold-accent flex items-center justify-center text-champagne-gold shadow-[0_0_20px_rgba(212,175,55,0.25)]">
              <svg className="w-6 h-6 text-champagne-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z"
                />
              </svg>
            </div>

            <h1 className="font-display text-2xl sm:text-3xl text-text-surface font-normal">
              Reset Your Password
            </h1>

            <p className="font-body text-xs text-text-surface-variant max-w-xs mx-auto leading-relaxed">
              Enter your clinical email address and we will dispatch a secure, single-use password reset authorization link.
            </p>
          </div>

          {/* Form Content */}
          <div className="p-8 space-y-6">
            {submitted ? (
              <div className="space-y-4 text-center">
                <div className="p-4 rounded-xl bg-canvas-obsidian border border-[#D4AF37]/50 space-y-2">
                  <div className="text-vitality-sage font-mono text-xs font-semibold">
                    ✓ Reset Link Dispatched
                  </div>
                  <p className="font-body text-xs text-slate-300 leading-relaxed">
                    If an account exists with this email address, a password reset link has been dispatched. Please inspect your inbox and follow the authorization instructions.
                  </p>
                </div>

                <div className="pt-2">
                  <Link
                    href="/login"
                    className="w-full py-3.5 px-6 rounded-full bg-champagne-gold hover:bg-champagne-gold-light text-[#120e00] font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(212,175,55,0.3)]"
                  >
                    <span>Return to Sign In</span>
                    <span>&rarr;</span>
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {errorMessage && (
                  <div
                    role="alert"
                    className="p-3 rounded-lg bg-red-950/40 border border-red-800/40 text-red-300 font-mono text-xs text-center"
                  >
                    {errorMessage}
                  </div>
                )}

                <div className="space-y-2 text-left">
                  <label
                    htmlFor="reset-email"
                    className="block font-mono text-[11px] uppercase tracking-wider text-text-surface-muted"
                  >
                    Clinical Communication Email
                  </label>
                  <input
                    id="reset-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@executive-domain.com"
                    className="w-full px-4 py-3 rounded-lg bg-canvas-obsidian border border-border-midnight text-text-surface font-mono text-xs placeholder:text-text-surface-muted/40 focus:outline-none focus:border-champagne-gold focus:ring-1 focus:ring-champagne-gold/40 transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-6 rounded-full bg-champagne-gold hover:bg-champagne-gold-light text-[#120e00] font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(212,175,55,0.3)] hover:shadow-[0_0_35px_rgba(212,175,55,0.5)] disabled:opacity-75 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-[#120e00] border-t-transparent rounded-full animate-spin" />
                      <span>Dispatching Link...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Password Reset Link</span>
                      <span>&rarr;</span>
                    </>
                  )}
                </button>

                <div className="text-center pt-2">
                  <Link
                    href="/login"
                    className="font-mono text-xs text-text-surface-muted hover:text-champagne-gold transition-colors underline underline-offset-4"
                  >
                    Remember your password? Sign In &rarr;
                  </Link>
                </div>
              </form>
            )}
          </div>

          {/* Card Footer */}
          <div className="px-8 py-4 bg-canvas-obsidian/70 border-t border-border-midnight flex items-center justify-between text-[10px] font-mono text-text-surface-muted">
            <span>Zero-ePHI Standard</span>
            <span>256-Bit Encrypted Token</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center font-mono text-[10px] text-text-surface-muted py-4">
        &copy; 2026 COGNITIVE EDGE CLINIC &bull; ENCRYPTED MEMBER ENCLAVE &bull; WINSTON-SALEM, NC
      </footer>
    </div>
  );
}
