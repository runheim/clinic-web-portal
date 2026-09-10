"use client";

import React, { useEffect } from "react";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  const correlationId = React.useMemo(() => {
    return error.digest || "ROOT-982148-SEC";
  }, [error.digest]);

  useEffect(() => {
    console.error("[Root Clinical Exception]: Root layout isolated with correlation ID:", correlationId);
  }, [correlationId]);

  return (
    <html lang="en">
      <body className="bg-[#0B0F19] text-[#DFE2F1] min-h-screen flex flex-col justify-between selection:bg-[#D4AF37] selection:text-[#3C2F00] font-sans antialiased m-0 p-0">
        {/* Header Bar */}
        <header className="w-full border-b border-[#D4AF37]/20 bg-[#0B0F19]/90 px-6 py-5">
          <div className="max-w-[1280px] mx-auto flex items-center justify-between">
            <span className="font-serif text-lg tracking-wider text-[#D4AF37] font-semibold">
              COGNITIVE EDGE CLINIC
            </span>
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-red-400">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span>Root Enclave Protected</span>
            </div>
          </div>
        </header>

        {/* Centerpiece */}
        <main className="flex-1 flex items-center justify-center px-6 py-16">
          <div className="max-w-xl w-full text-center space-y-8 bg-[#121826] border border-red-950 rounded-2xl p-8 sm:p-12 shadow-[0_25px_60px_rgba(0,0,0,0.9)]">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0B0F19] border border-red-900/50 text-[10px] font-mono uppercase tracking-widest text-red-300">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
              <span>Root Enclave Interruption</span>
            </div>

            <div className="space-y-3">
              <h1 className="font-serif text-3xl sm:text-4xl text-[#DFE2F1] font-normal leading-tight">
                Encounter Exception Intercepted
              </h1>
              <p className="text-sm sm:text-base text-[#D0C5AF] max-w-md mx-auto leading-relaxed font-sans">
                A system interruption has occurred. To protect data integrity, this session has been isolated.
              </p>
            </div>

            {/* Sanitized Correlation Panel */}
            <div className="p-4 rounded-xl bg-[#0B0F19] border border-[#1C1F2A] space-y-1.5 font-mono text-xs text-center">
              <span className="text-[#99907C] text-[10px] uppercase tracking-wider block">
                Cryptographic Correlation ID:
              </span>
              <span className="text-[#D4AF37] font-bold tracking-widest select-all">
                {correlationId || "CALCULATING..."}
              </span>
              <p className="text-[10px] text-[#99907C] pt-1">
                Zero-ePHI Quarantine enforced &bull; Stacks sanitized
              </p>
            </div>

            {/* Actions */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => reset()}
                className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-[#D4AF37] hover:bg-[#F2CA50] text-[#3C2F00] font-mono text-xs font-bold uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(212,175,55,0.3)] cursor-pointer"
              >
                Re-establish Session
              </button>
              <a
                href="sms:+18005550199"
                className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-[#121826] hover:bg-[#0B0F19] border border-[#D4AF37]/30 text-[#DFE2F1] font-mono text-xs font-bold uppercase tracking-wider transition-all text-center"
              >
                Connect with Clinical Concierge
              </a>
            </div>
          </div>
        </main>

        <footer className="border-t border-[#D4AF37]/20 bg-[#121826] py-6 px-6 text-center font-mono text-xs text-[#99907C]">
          &copy; 2026 COGNITIVE EDGE CLINICAL GROUP &bull; ZERO-ePHI QUARANTINE STANDARD
        </footer>
      </body>
    </html>
  );
}
