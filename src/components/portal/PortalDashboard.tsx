"use client";

import React from "react";
import { ClinicalServicesProtocols } from "./ClinicalServicesProtocols";

export { ClinicalServicesProtocols };

export interface PortalDashboardProps {
  memberEmail?: string | null;
  memberRole?: "admin" | "client";
  onOpenBooking?: () => void;
  onLogout?: () => void;
}

export function PortalDashboard({
  memberEmail,
  memberRole = "client",
  onOpenBooking,
  onLogout,
}: PortalDashboardProps) {
  return (
    <div className="space-y-8">
      {/* 1. Member Status Telemetry */}
      <div className="flex items-center justify-between border-b border-[#D4AF37]/20 pb-4">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-mono text-xs uppercase tracking-wider text-slate-300">
            Active Session: {memberEmail || "Verified Member"} ({memberRole})
          </span>
        </div>
        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            className="font-mono text-xs text-slate-400 hover:text-white underline cursor-pointer"
          >
            Sign Out
          </button>
        )}
      </div>

      {/* 2. Top Row: Communication Hub & Concierge Engine */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Communication Hub */}
        <section className="lg:col-span-6 bg-[#121826] border border-[#D4AF37]/20 rounded-xl p-8 flex flex-col justify-between shadow-2xl space-y-6">
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
                href="sms:+17433330880?&body=Care%20coordination%20inquiry"
                className="w-full p-4 rounded-lg bg-[#0B0F19] border border-slate-800 hover:border-[#D4AF37] flex items-center justify-between transition-all group"
              >
                <div className="text-left">
                  <span className="font-mono text-xs text-[#D4AF37] block font-semibold">
                    Care Desk Direct SMS
                  </span>
                  <span className="font-mono text-[11px] text-slate-400">
                    +1 (743) 333-0880
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
        </section>

        {/* Concierge Engine */}
        <section className="lg:col-span-6 bg-[#121826] border border-[#D4AF37]/30 rounded-xl p-8 shadow-2xl flex flex-col justify-between space-y-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-widest text-[#D4AF37]">
                Concierge Engine
              </span>
              <span className="font-mono text-[10px] text-slate-400">PCI-DSS Level 1</span>
            </div>

            <div className="space-y-2">
              <h2 className="font-display text-2xl text-white">
                Scheduling &amp; Retainer Management
              </h2>
              <p className="font-body text-xs text-slate-400 leading-relaxed">
                Book clinical reviews and manage itemized Superbills with ICD-10 diagnostic codes and retainer subscriptions securely.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={onOpenBooking}
                className="w-full py-3.5 px-6 rounded-lg bg-[#D4AF37] hover:bg-[#E6C65C] text-[#0B0F19] font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(212,175,55,0.25)] cursor-pointer"
              >
                <span>Book via Cal.com Scheduling Desk</span>
                <span>&rarr;</span>
              </button>

              <a
                href="https://billing.stripe.com/p/session/test_portal_session_cognitive_edge"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 px-5 rounded-lg bg-[#0B0F19] hover:bg-slate-900 border border-[#D4AF37]/40 text-[#D4AF37] font-mono text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
              >
                <span>Stripe Customer &amp; Invoicing Portal</span>
                <span>&rarr;</span>
              </a>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800 text-[10px] font-mono text-slate-500">
            Appointments sync directly to our clinical master calendar with zero duplicate intake questionnaires.
          </div>
        </section>
      </div>

      {/* 3. Clinical Services & Protocols (Relocated Below Concierge Engine) */}
      <ClinicalServicesProtocols />
    </div>
  );
}

export default PortalDashboard;
