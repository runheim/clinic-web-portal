import React from "react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-canvas-obsidian text-text-surface flex flex-col justify-between selection:bg-champagne-gold selection:text-text-on-gold relative overflow-hidden">
      {/* Ambient Gold Nebula Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-champagne-gold/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Header Bar */}
      <header className="w-full border-b border-border-gold-subtle bg-canvas-obsidian/90 backdrop-blur-md px-6 lg:px-12 py-5">
        <div className="max-w-[1280px] mx-auto flex items-center justify-between">
          <Link href="/" className="font-display text-lg tracking-wider text-champagne-gold font-semibold">
            COGNITIVE EDGE CLINIC
          </Link>
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-vitality-sage">
            <span className="w-1.5 h-1.5 rounded-full bg-vitality-sage animate-pulse" />
            <span>Telemetry Status: Nominal</span>
          </div>
        </div>
      </header>

      {/* Editorial 404 Centerpiece */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-6 py-16">
        <div className="max-w-xl w-full text-center space-y-8 bg-surface-midnight/80 border border-border-gold-subtle rounded-2xl p-8 sm:p-12 shadow-[0_25px_60px_rgba(0,0,0,0.85)] backdrop-blur-xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-canvas-obsidian border border-[#D4AF37]/30 text-[10px] font-mono uppercase tracking-widest text-champagne-gold">
            <span>Coordinate Protocol &bull; Error 404</span>
          </div>

          {/* Typography */}
          <div className="space-y-3">
            <h1 className="font-display text-4xl sm:text-5xl text-text-surface font-normal leading-tight">
              Clinical Coordinate Undefined
            </h1>
            <p className="font-body text-sm sm:text-base text-text-surface-variant max-w-md mx-auto leading-relaxed">
              The requested clinical resource or portal coordinate does not exist. The enclave perimeter remains secured.
            </p>
          </div>

          {/* Action CTAs */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/"
              className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-champagne-gold hover:bg-champagne-gold-light text-text-on-gold font-mono text-xs font-bold uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(212,175,55,0.3)] hover:shadow-[0_0_25px_rgba(212,175,55,0.5)] btn-luxury-shimmer text-center"
            >
              Return to Clinical Sanctuary
            </Link>
            <Link
              href="/vault"
              className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-surface-midnight hover:bg-canvas-obsidian border border-border-gold-subtle hover:border-champagne-gold text-text-surface font-mono text-xs font-bold uppercase tracking-wider transition-all shadow-inner text-center"
            >
              Access Member Vault
            </Link>
          </div>

          {/* Zero-ePHI Quarantine Assurance */}
          <div className="pt-6 border-t border-border-midnight text-center">
            <p className="font-mono text-[10px] text-text-surface-muted uppercase tracking-widest">
              Zero-ePHI Isolation Enforced &bull; Winston-Salem Executive Enclave
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border-gold-subtle bg-surface-midnight/90 py-6 px-6 text-center font-mono text-xs text-text-surface-muted">
        &copy; 2026 COGNITIVE EDGE CLINICAL GROUP &bull; ALL CLINICAL ENDPOINTS MONITORED
      </footer>
    </div>
  );
}
