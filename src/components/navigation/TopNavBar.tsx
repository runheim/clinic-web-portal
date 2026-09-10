"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ClinicalSearchPalette } from "@/components/ClinicalSearchPalette";
import { BookingModal } from "@/components/marketing/BookingModal";

interface TopNavBarProps {
  onOpenBooking?: () => void;
}

export function TopNavBar({ onOpenBooking }: TopNavBarProps = {}) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [internalBookingOpen, setInternalBookingOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const drawerRef = useRef<HTMLDivElement>(null);
  const toggleButtonRef = useRef<HTMLButtonElement>(null);

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

  // Prevent background document scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }
    return () => {
      document.body.classList.remove("overflow-hidden");
    };
  }, [isMobileMenuOpen]);

  // Close mobile drawer on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobileMenuOpen]);

  // Close mobile drawer if viewport is resized to desktop (>= 1280px)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1280 && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isMobileMenuOpen]);

  // Focus trap & WCAG keyboard accessibility for mobile drawer
  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;

    const focusTimer = setTimeout(() => {
      if (drawerRef.current) {
        const focusable = drawerRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length > 0) {
          focusable[0].focus();
        }
      }
    }, 50);

    const handleFocusTrap = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || !drawerRef.current) return;

      const focusable = drawerRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first || document.activeElement === toggleButtonRef.current) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          if (toggleButtonRef.current) {
            toggleButtonRef.current.focus();
          } else {
            first.focus();
          }
        } else if (document.activeElement === toggleButtonRef.current) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener("keydown", handleFocusTrap);
    return () => {
      clearTimeout(focusTimer);
      window.removeEventListener("keydown", handleFocusTrap);
      if (previouslyFocused && typeof previouslyFocused.focus === "function") {
        previouslyFocused.focus();
      }
    };
  }, [isMobileMenuOpen]);

  return (
    <>
      <header className="sticky top-0 z-40 w-full h-16 xl:h-[81px] bg-canvas-obsidian/90 backdrop-blur-md border-b border-border-gold-subtle transition-colors">
        <div className="max-w-[1280px] mx-auto h-full px-4 sm:px-6 lg:px-10 flex items-center justify-between gap-2">
          {/* ========================================================= */}
          {/* DESKTOP NAVIGATION (>= 1280px): untouched horizontal bar */}
          {/* ========================================================= */}
          <div className="hidden xl:flex items-center justify-between w-full">
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
            <nav className="flex items-center gap-5 xl:gap-6 text-[12px] font-mono tracking-wider uppercase">
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
                <span className="text-text-surface-variant hover:text-[#D4AF37]">
                  Search
                </span>
                <kbd className="inline-flex items-center px-1.5 py-0.5 text-[9px] font-mono bg-[#0B0F19] text-[#99907C] border border-[#1C1F2A] rounded">
                  ⌘K
                </kbd>
              </button>

              {/* Member Login Gateway */}
              <Link
                href="/login"
                className="font-mono text-[11px] uppercase tracking-widest text-champagne-gold/90 hover:text-champagne-gold transition-colors px-1.5 py-1"
              >
                Member Login
              </Link>

              {/* Client Portal Deep-Link */}
              <Link
                href="/vault"
                className="font-mono text-[11px] uppercase tracking-widest text-[#DFE2F1] hover:text-champagne-gold transition-colors px-1.5 py-1"
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

          {/* ========================================================= */}
          {/* MOBILE NAVIGATION BAR (< 1280px)                          */}
          {/* ========================================================= */}
          <div className="flex xl:hidden items-center justify-between w-full">
            {/* Left: Compact brand insignia */}
            <Link
              href="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center group shrink-0"
              aria-label="Cognitive Edge Home"
            >
              <span className="font-display text-base tracking-[0.18em] text-champagne-gold-brand uppercase font-semibold transition-opacity group-hover:opacity-90">
                Cognitive Edge
              </span>
            </Link>

            {/* Right: Quick Search Trigger icon + Minimalist Luxury Menu Toggle */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* 1. Quick Search Trigger icon */}
              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                aria-label="Quick search clinical modalities, biomarkers, briefings, and actions (Cmd+K)"
                className="p-2 text-[#D4AF37] hover:text-[#F2CA50] transition-colors flex items-center justify-center cursor-pointer rounded-lg hover:bg-[#121826]/60"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </button>

              {/* 2. Minimalist luxury menu toggle: Two delicate Champagne Gold lines animating to 'X' */}
              <button
                ref={toggleButtonRef}
                type="button"
                onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                aria-expanded={isMobileMenuOpen}
                aria-controls="mobile-menu"
                aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
                className="w-10 h-10 flex flex-col justify-center items-center gap-[5px] focus:outline-none cursor-pointer rounded-lg hover:bg-[#121826]/60 transition-colors"
              >
                <span
                  className={`block h-[1.5px] w-6 bg-[#D4AF37] transition-all duration-300 ease-out origin-center ${
                    isMobileMenuOpen ? "rotate-45 translate-y-[3.25px]" : ""
                  }`}
                />
                <span
                  className={`block h-[1.5px] w-6 bg-[#D4AF37] transition-all duration-300 ease-out origin-center ${
                    isMobileMenuOpen ? "-rotate-45 -translate-y-[3.25px]" : ""
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ========================================================= */}
      {/* FULL-SCREEN LUXURY MOBILE SLIDE-OVER DRAWER               */}
      {/* ========================================================= */}
      <div
        id="mobile-menu"
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile Navigation"
        aria-hidden={!isMobileMenuOpen}
        className={`fixed inset-0 top-16 z-50 bg-[#0B0F19]/95 backdrop-blur-2xl xl:hidden transition-all duration-300 ease-out overflow-y-auto ${
          isMobileMenuOpen
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 -translate-y-4 pointer-events-none invisible"
        }`}
      >
        <div className="max-w-lg mx-auto min-h-[calc(100vh-4rem)] flex flex-col justify-between px-6 py-8">
          {/* Top Content: Categories 1 & 2 */}
          <div className="flex flex-col space-y-6">
            {/* Category 1: Clinical Modalities & Science */}
            <div>
              <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#99907C] block mb-3">
                Clinical Modalities & Science
              </span>
              <nav className="flex flex-col space-y-1">
                <Link
                  href="/services"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="font-['Cormorant_Garamond',var(--font-eb-garamond),serif] font-display text-xl tracking-wide text-[#DFE2F1] hover:text-[#D4AF37] transition-colors py-2 block"
                >
                  Services
                </Link>
                <Link
                  href="/ledger"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="font-['Cormorant_Garamond',var(--font-eb-garamond),serif] font-display text-xl tracking-wide text-[#DFE2F1] hover:text-[#D4AF37] transition-colors py-2 block"
                >
                  The Ledger
                </Link>
                <Link
                  href="/briefings"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="font-['Cormorant_Garamond',var(--font-eb-garamond),serif] font-display text-xl tracking-wide text-[#DFE2F1] hover:text-[#D4AF37] transition-colors py-2 block"
                >
                  Briefings
                </Link>
                <Link
                  href="/membership"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="font-['Cormorant_Garamond',var(--font-eb-garamond),serif] font-display text-xl tracking-wide text-[#DFE2F1] hover:text-[#D4AF37] transition-colors py-2 block"
                >
                  Membership
                </Link>
                <Link
                  href="/biographies"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="font-['Cormorant_Garamond',var(--font-eb-garamond),serif] font-display text-xl tracking-wide text-[#DFE2F1] hover:text-[#D4AF37] transition-colors py-2 block"
                >
                  Biographies
                </Link>
              </nav>
            </div>

            {/* Category 2: Member Enclaves (Hairline Gold Divider) */}
            <div>
              <div className="border-t border-[#D4AF37]/20 my-4" />
              <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#99907C] block mb-3">
                Member Enclaves
              </span>
              <nav className="flex flex-col space-y-1">
                <a
                  href="https://mycwXX.eclinicalworks.com/portal"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="font-mono text-xs uppercase tracking-widest text-[#DFE2F1]/80 hover:text-[#D4AF37] transition-colors py-2 flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] shadow-[0_0_6px_rgba(212,175,55,0.6)] shrink-0"
                      aria-hidden="true"
                    />
                    <span>Diagnostic Vault</span>
                  </div>
                  <svg
                    className="w-3.5 h-3.5 text-[#99907C] group-hover:text-[#D4AF37] transition-colors shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </a>
                <Link
                  href="/vault"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="font-mono text-xs uppercase tracking-widest text-[#DFE2F1]/80 hover:text-[#D4AF37] transition-colors py-2 flex items-center gap-3"
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] shadow-[0_0_6px_rgba(212,175,55,0.6)] shrink-0"
                    aria-hidden="true"
                  />
                  <span>Client Portal</span>
                </Link>
                <Link
                  href="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="font-mono text-xs uppercase tracking-widest text-[#DFE2F1]/80 hover:text-[#D4AF37] transition-colors py-2 flex items-center gap-3"
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] shadow-[0_0_6px_rgba(212,175,55,0.6)] shrink-0"
                    aria-hidden="true"
                  />
                  <span>Member Login</span>
                </Link>
              </nav>
            </div>
          </div>

          {/* Category 3: Primary Action & Concierge Triage */}
          <div className="pt-8 mt-auto border-t border-[#D4AF37]/10 flex flex-col items-center gap-3">
            <Link
              href="/assessment"
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full py-3.5 px-6 rounded-full bg-champagne-gold hover:bg-champagne-gold-light text-text-on-gold font-mono text-xs font-bold uppercase tracking-widest text-center transition-all shadow-[0_0_20px_rgba(212,175,55,0.25)] hover:shadow-[0_0_25px_rgba(212,175,55,0.4)] hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 btn-luxury-shimmer"
            >
              <span>Initiate Assessment →</span>
            </Link>
            <a
              href="tel:+18005550199"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-xs font-mono tracking-wider text-[#A89F8C] hover:text-[#D4AF37] transition-colors text-center block pt-1"
            >
              Clinical Concierge: +1 (800) 555-0199
            </a>
          </div>
        </div>
      </div>

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
