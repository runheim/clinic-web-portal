"use client";

import React from "react";
import Link from "next/link";

interface TopNavBarProps {
  onOpenBooking?: () => void;
}

export function TopNavBar({ onOpenBooking }: TopNavBarProps = {}) {
  void onOpenBooking;
  return (
    <header className="sticky top-0 z-40 w-full h-[81px] bg-canvas-obsidian/90 backdrop-blur-md border-b border-border-gold-subtle transition-colors">
      <div className="max-w-[1280px] mx-auto h-full px-6 lg:px-10 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex flex-col group">
          <span className="font-display text-lg tracking-[0.18em] text-champagne-gold-brand uppercase font-semibold transition-opacity group-hover:opacity-90">
            Cognitive Edge
          </span>
          <span className="font-mono text-[9px] tracking-[0.3em] text-text-surface-variant/80 uppercase -mt-1">
            Clinic
          </span>
        </Link>

        {/* Navigation Links: Services | Ledger | Briefings | Membership | Biographies | Diagnostic Vault */}
        <nav className="hidden lg:flex items-center gap-6 text-[12px] font-mono tracking-wider uppercase">
          <Link
            href="/services"
            className="text-text-surface-variant transition-colors hover:text-champagne-gold"
          >
            Services
          </Link>
          <Link
            href="/ledger"
            className="text-text-surface-variant transition-colors hover:text-champagne-gold"
          >
            Ledger
          </Link>
          <Link
            href="/briefings"
            className="text-text-surface-variant transition-colors hover:text-champagne-gold"
          >
            Briefings
          </Link>
          <Link
            href="/membership"
            className="text-text-surface-variant transition-colors hover:text-champagne-gold"
          >
            Membership
          </Link>
          <Link
            href="/biographies"
            className="text-text-surface-variant transition-colors hover:text-champagne-gold"
          >
            Biographies
          </Link>
          <a
            href="https://mycwXX.eclinicalworks.com/portal"
            target="_blank"
            rel="noopener noreferrer"
            className="text-text-surface-variant transition-colors hover:text-champagne-gold"
          >
            Diagnostic Vault
          </a>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-4">
          {/* Member Login Gateway */}
          <Link
            href="/login"
            className="hidden sm:inline-block font-mono text-[11px] uppercase tracking-widest text-champagne-gold/90 hover:text-champagne-gold transition-colors px-2 py-1"
          >
            Member Login
          </Link>

          {/* Client Portal Deep-Link: Muted Platinum with Gold Hover */}
          <Link
            href="/vault"
            className="font-mono text-[11px] uppercase tracking-widest text-[#DFE2F1] hover:text-champagne-gold transition-colors px-2 py-1"
          >
            Client Portal
          </Link>

          {/* Primary Assessment CTA: Routes to /assessment */}
          <Link
            href="/assessment"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-champagne-gold hover:bg-champagne-gold-light text-text-on-gold font-mono text-[11px] font-bold uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(212,175,55,0.25)] hover:shadow-[0_0_25px_rgba(212,175,55,0.4)] hover:scale-[1.02] active:scale-[0.98] btn-luxury-shimmer"
          >
            <span>Initiate Assessment</span>
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
              />
            </svg>
          </Link>
        </div>
      </div>
    </header>
  );
}
