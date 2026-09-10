"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ClinicalSearchPalette } from "@/components/ClinicalSearchPalette";
import { BookingModal } from "@/components/marketing/BookingModal";

interface TopNavBarProps {
  onOpenBooking?: () => void;
}

export function TopNavBar({ onOpenBooking }: TopNavBarProps = {}) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [internalBookingOpen, setInternalBookingOpen] = useState(false);

  const handleOpenBooking = onOpenBooking || (() => setInternalBookingOpen(true));

  // Global Cmd+K / Ctrl+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-40 w-full h-[81px] bg-canvas-obsidian/90 backdrop-blur-md border-b border-border-gold-subtle transition-colors">
        <div className="max-w-[1280px] mx-auto h-full px-4 sm:px-6 lg:px-10 flex items-center justify-between gap-2">
          {/* Brand Logo */}
          <Link href="/" className="flex flex-col group shrink-0">
            <span className="font-display text-base sm:text-lg tracking-[0.18em] text-champagne-gold-brand uppercase font-semibold transition-opacity group-hover:opacity-90">
              Cognitive Edge
            </span>
            <span className="font-mono text-[9px] tracking-[0.3em] text-text-surface-variant/80 uppercase -mt-1">
              Clinic
            </span>
          </Link>

          {/* Navigation Links: Services | Ledger | Briefings | Membership | Biographies | Diagnostic Vault */}
          <nav className="hidden lg:flex items-center gap-5 xl:gap-6 text-[12px] font-mono tracking-wider uppercase">
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
          <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0">
            {/* Command-K Search Palette Trigger */}
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              aria-label="Search clinical modalities, biomarkers, briefings, and actions (Cmd+K)"
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#121826] border border-[#D4AF37]/30 text-[#DFE2F1] hover:border-[#D4AF37] hover:text-[#D4AF37] transition-all cursor-pointer font-mono text-[11px] shadow-[0_0_10px_rgba(212,175,55,0.1)] hover:shadow-[0_0_15px_rgba(212,175,55,0.25)]"
            >
              <svg
                className="w-3.5 h-3.5 text-[#D4AF37]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <span className="hidden md:inline text-text-surface-variant hover:text-[#D4AF37]">
                Search
              </span>
              <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[9px] font-mono bg-[#0B0F19] text-[#99907C] border border-[#1C1F2A] rounded">
                ⌘K
              </kbd>
            </button>

            {/* Member Login Gateway */}
            <Link
              href="/login"
              className="hidden md:inline-block font-mono text-[11px] uppercase tracking-widest text-champagne-gold/90 hover:text-champagne-gold transition-colors px-1.5 py-1"
            >
              Member Login
            </Link>

            {/* Client Portal Deep-Link */}
            <Link
              href="/vault"
              className="hidden sm:inline-block font-mono text-[11px] uppercase tracking-widest text-[#DFE2F1] hover:text-champagne-gold transition-colors px-1.5 py-1"
            >
              Client Portal
            </Link>

            {/* Primary Assessment CTA */}
            <Link
              href="/assessment"
              className="inline-flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-full bg-champagne-gold hover:bg-champagne-gold-light text-text-on-gold font-mono text-[10px] sm:text-[11px] font-bold uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(212,175,55,0.25)] hover:shadow-[0_0_25px_rgba(212,175,55,0.4)] hover:scale-[1.02] active:scale-[0.98] btn-luxury-shimmer"
            >
              <span>Assessment</span>
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

      {/* Global Command-K Search Palette */}
      <ClinicalSearchPalette
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onOpenBooking={handleOpenBooking}
      />

      {/* Internal Booking Modal fallback if not handled by parent */}
      {!onOpenBooking && (
        <BookingModal
          isOpen={internalBookingOpen}
          onClose={() => setInternalBookingOpen(false)}
        />
      )}
    </>
  );
}

export default TopNavBar;
