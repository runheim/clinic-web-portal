"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";

export interface TopNavBarProps {
  onOpenBooking?: () => void;
}

export function TopNavBar({ onOpenBooking }: TopNavBarProps = {}) {
  void onOpenBooking;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const drawerRef = useRef<HTMLDivElement>(null);
  const toggleButtonRef = useRef<HTMLButtonElement>(null);

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
      <header className="sticky top-0 z-40 w-full h-20 bg-canvas-obsidian/90 backdrop-blur-md border-b border-border-gold-subtle transition-colors">
        <div className="w-full max-w-[1400px] mx-auto h-full px-6 lg:px-12 flex items-center justify-between">
          {/* ========================================================= */}
          {/* DESKTOP NAVIGATION (>= 1280px): Refined Three-Zone Layout */}
          {/* ========================================================= */}
          <div className="hidden xl:flex items-center justify-between w-full">
            {/* Zone 1 (Left): Brand Identity */}
            <Link
              href="/"
              className="flex flex-col group shrink-0"
              aria-label="Cognitive Edge Clinic Home"
            >
              <span className="font-display text-base sm:text-lg tracking-[0.18em] text-champagne-gold-brand uppercase font-semibold transition-opacity group-hover:opacity-90">
                Cognitive Edge
              </span>
              <span className="font-mono text-[9px] tracking-[0.3em] text-text-surface-variant/80 uppercase -mt-1">
                Clinic
              </span>
            </Link>

            {/* Zone 2 (Center): Primary Navigation Links */}
            <nav
              aria-label="Primary Navigation"
              className="flex items-center gap-8 xl:gap-10 text-[12px] font-mono tracking-widest uppercase"
            >
              <Link
                href="/services"
                className="text-text-surface-variant transition-colors duration-200 hover:text-champagne-gold"
              >
                Services
              </Link>
              <Link
                href="/ledger"
                className="text-text-surface-variant transition-colors duration-200 hover:text-champagne-gold"
              >
                Ledger
              </Link>
              <Link
                href="/briefings"
                className="text-text-surface-variant transition-colors duration-200 hover:text-champagne-gold"
              >
                Briefings
              </Link>
              <Link
                href="/membership"
                className="text-text-surface-variant transition-colors duration-200 hover:text-champagne-gold"
              >
                Membership
              </Link>
              <Link
                href="/biographies"
                className="text-text-surface-variant transition-colors duration-200 hover:text-champagne-gold"
              >
                Biographies
              </Link>
            </nav>

            {/* Zone 3 (Right): Actions & Portal Access */}
            <div className="flex items-center gap-6 shrink-0">
              {/* Member Login Gateway */}
              <Link
                href="/login"
                className="font-mono text-[11px] uppercase tracking-widest text-champagne-gold/90 hover:text-champagne-gold transition-colors duration-200 py-1"
              >
                Member Login
              </Link>

              {/* Client Portal Deep-Link */}
              <Link
                href="/vault"
                className="font-mono text-[11px] uppercase tracking-widest text-[#DFE2F1] hover:text-champagne-gold transition-colors duration-200 py-1"
              >
                Client Portal
              </Link>

              {/* Primary Assessment Pill CTA */}
              <Link
                href="/assessment"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-champagne-gold hover:bg-champagne-gold-light text-text-on-gold font-mono text-[11px] font-bold uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(212,175,55,0.25)] hover:shadow-[0_0_25px_rgba(212,175,55,0.4)] hover:scale-[1.02] active:scale-[0.98] btn-luxury-shimmer"
              >
                <span>Assessment</span>
                <span aria-hidden="true">→</span>
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

            {/* Right: Minimalist luxury menu toggle */}
            <div className="flex items-center gap-2 shrink-0">
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
        className={`fixed inset-0 top-20 z-50 bg-[#0B0F19]/95 backdrop-blur-2xl xl:hidden transition-all duration-300 ease-out overflow-y-auto ${
          isMobileMenuOpen
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 -translate-y-4 pointer-events-none invisible"
        }`}
      >
        <div className="max-w-lg mx-auto min-h-[calc(100vh-5rem)] flex flex-col justify-between px-6 py-8">
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
    </>
  );
}

export default TopNavBar;
