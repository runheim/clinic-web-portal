"use client";

import React, { useEffect } from "react";
import Link from "next/link";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  const correlationId = React.useMemo(() => {
    return error.digest || "ENC-882194-SEC";
  }, [error.digest]);

  useEffect(() => {
    // In a zero-ePHI architecture, technical errors are stripped of personal data before logging
    console.error("[Clinical Enclave Intercept]: Session isolated with correlation ID:", correlationId);
  }, [correlationId]);

  return (
    <div className="min-h-screen bg-canvas-obsidian text-text-surface flex flex-col justify-between selection:bg-champagne-gold selection:text-text-on-gold relative overflow-hidden">
      {/* Ambient Crimson / Gold Shield Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-red-950/20 blur-[130px] rounded-full pointer-events-none" />

      {/* Header Bar */}
      <header className="w-full border-b border-border-gold-subtle bg-canvas-obsidian/90 backdrop-blur-md px-6 lg:px-12 py-5">
        <div className="max-w-[1280px] mx-auto flex items-center justify-between">
          <Link href="/" className="font-display text-lg tracking-wider text-champagne-gold font-semibold">
            COGNITIVE EDGE CLINIC
          </Link>
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-red-400">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span>Isolation Quarantine: Active</span>
          </div>
        </div>
      </header>

      {/* Error Centerpiece */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-6 py-16">
        <div className="max-w-xl w-full text-center space-y-8 bg-surface-midnight/85 border border-red-950/70 rounded-2xl p-8 sm:p-12 shadow-[0_25px_60px_rgba(0,0,0,0.9)] backdrop-blur-xl">
          {/* Shield Icon / Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-canvas-obsidian border border-red-900/50 text-[10px] font-mono uppercase tracking-widest text-red-300">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
            <span>Session Integrity Isolation Protocol</span>
          </div>

          {/* Typography */}
          <div className="space-y-3">
            <h1 className="font-display text-3xl sm:text-4xl text-text-surface font-normal leading-tight">
              Encounter Exception Intercepted
            </h1>
            <p className="font-body text-sm sm:text-base text-text-surface-variant max-w-md mx-auto leading-relaxed">
              A system interruption has occurred. To protect data integrity, this session has been isolated.
            </p>
          </div>

          {/* Sanitized Cryptographic Correlation ID Panel */}
          <div className="p-4 rounded-xl bg-canvas-obsidian border border-border-midnight space-y-1.5 font-mono text-xs text-center">
            <span className="text-text-surface-muted text-[10px] uppercase tracking-wider block">
              Cryptographic Correlation ID:
            </span>
            <span className="text-champagne-gold font-bold tracking-widest select-all">
              {correlationId || "CALCULATING..."}
            </span>
            <p className="text-[10px] text-text-surface-muted pt-1">
              Stack traces and diagnostic dumps are sanitized under Zero-ePHI Quarantine.
            </p>
          </div>

          {/* Action CTAs */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => reset()}
              className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-champagne-gold hover:bg-champagne-gold-light text-text-on-gold font-mono text-xs font-bold uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(212,175,55,0.3)] hover:shadow-[0_0_25px_rgba(212,175,55,0.5)] btn-luxury-shimmer text-center cursor-pointer"
            >
              Re-establish Session
            </button>
            <a
              href="sms:+18005550199"
              className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-surface-midnight hover:bg-canvas-obsidian border border-border-gold-subtle hover:border-champagne-gold text-text-surface font-mono text-xs font-bold uppercase tracking-wider transition-all shadow-inner text-center"
            >
              Connect with Clinical Concierge
            </a>
          </div>

          {/* Governance Notice */}
          <div className="pt-6 border-t border-border-midnight text-center">
            <p className="font-mono text-[10px] text-text-surface-muted uppercase tracking-widest">
              Spruce Health Care Desk Active &bull; Emergency Direct: 911
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border-gold-subtle bg-surface-midnight/90 py-6 px-6 text-center font-mono text-xs text-text-surface-muted">
        &copy; 2026 COGNITIVE EDGE CLINICAL GROUP &bull; ZERO-ePHI SANITIZED ENCLAVE
      </footer>
    </div>
  );
}
