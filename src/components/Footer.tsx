"use client";

import React from "react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border-gold-subtle bg-surface-midnight/90 backdrop-blur-md py-14 px-6 lg:px-10 text-text-surface selection:bg-champagne-gold selection:text-text-on-gold">
      <div className="max-w-[1280px] mx-auto space-y-10">
        {/* Main Footer Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand & Mission */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-col">
              <span className="font-display text-xl tracking-[0.16em] text-champagne-gold font-semibold uppercase">
                Cognitive Edge Clinic
              </span>
              <span className="font-mono text-[10px] tracking-[0.25em] text-text-surface-muted uppercase mt-0.5">
                Neuro-Metabolic Resuscitation &bull; Longevity Practice
              </span>
            </div>
            <p className="font-body text-xs text-text-surface-variant max-w-sm leading-relaxed">
              Transcending conventional pathology through stoichiometric cellular saturation, 
              lipophilic coenzyme kinetics, and non-invasive cortical neuromodulation. 
              Under the clinical direction of Dr. David Andreas Runheim, MD.
            </p>
            <div className="pt-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-canvas-obsidian border border-vitality-sage/40 text-[10px] font-mono text-vitality-sage">
                <span className="w-1.5 h-1.5 rounded-full bg-vitality-sage animate-pulse" />
                <span>Zero-ePHI Architecture Active</span>
              </div>
            </div>
          </div>

          {/* Navigation Column 1: Clinical Domains */}
          <div className="space-y-3 font-mono text-xs">
            <div className="text-champagne-gold uppercase tracking-wider font-semibold">
              Clinical Practice
            </div>
            <ul className="space-y-2 text-text-surface-variant">
              <li>
                <Link href="/services" className="hover:text-champagne-gold transition-colors">
                  Clinical Modalities
                </Link>
              </li>
              <li>
                <Link href="/ledger" className="hover:text-champagne-gold transition-colors">
                  Scientific Ledger
                </Link>
              </li>
              <li>
                <Link href="/briefings" className="hover:text-champagne-gold transition-colors">
                  Scientific Briefings
                </Link>
              </li>
              <li>
                <Link href="/membership" className="hover:text-champagne-gold transition-colors">
                  VIP Membership
                </Link>
              </li>
              <li>
                <Link href="/biographies" className="hover:text-champagne-gold transition-colors">
                  Medical Leadership
                </Link>
              </li>
              <li>
                <Link href="/assessment" className="hover:text-champagne-gold transition-colors">
                  Intake Assessment
                </Link>
              </li>
            </ul>
          </div>

          {/* Navigation Column 2: Governance & Security */}
          <div className="space-y-3 font-mono text-xs">
            <div className="text-champagne-gold uppercase tracking-wider font-semibold">
              Governance &amp; Privacy
            </div>
            <ul className="space-y-2 text-text-surface-variant">
              <li>
                <Link href="/governance" className="hover:text-champagne-gold transition-colors">
                  Transparency Charter
                </Link>
              </li>
              <li>
                <Link href="/governance#quarantine" className="hover:text-champagne-gold transition-colors">
                  Zero-ePHI Quarantine
                </Link>
              </li>
              <li>
                <Link href="/governance#spruce" className="hover:text-champagne-gold transition-colors">
                  Spruce BAA Encryption
                </Link>
              </li>
              <li>
                <Link href="/governance#financial" className="hover:text-champagne-gold transition-colors">
                  Cancellation &amp; Deposit
                </Link>
              </li>
              <li>
                <Link href="/governance#safety" className="hover:text-champagne-gold transition-colors">
                  Clinical Safety Gates
                </Link>
              </li>
            </ul>
          </div>

          {/* Navigation Column 3: Member Enclaves */}
          <div className="space-y-3 font-mono text-xs">
            <div className="text-champagne-gold uppercase tracking-wider font-semibold">
              Client Enclaves
            </div>
            <ul className="space-y-2 text-text-surface-variant">
              <li>
                <Link href="/vault" className="text-[#DFE2F1] hover:text-champagne-gold transition-colors">
                  Diagnostic Vault
                </Link>
              </li>
              <li>
                <Link href="/status" className="text-text-surface-muted hover:text-champagne-gold transition-colors flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-vitality-sage animate-pulse" />
                  <span>System Status &amp; Enclave Telemetry</span>
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-champagne-gold transition-colors">
                  Member Login
                </Link>
              </li>
              <li>
                <a
                  href="https://mycwXX.eclinicalworks.com/portal"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-champagne-gold transition-colors flex items-center gap-1.5"
                >
                  <span>eClinicalWorks Portal</span>
                  <svg className="w-3 h-3 text-text-surface-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </li>
              <li>
                <a
                  href="https://spruce.care/yourpractice"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-champagne-gold transition-colors flex items-center gap-1.5"
                >
                  <span>Spruce Care Web</span>
                  <svg className="w-3 h-3 text-text-surface-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Practice Compliance Watermark & Copyright */}
        <div className="pt-8 border-t border-border-midnight flex flex-col md:flex-row items-center justify-between gap-4 font-mono text-[10px] text-text-surface-muted">
          <div>
            &copy; 2026 COGNITIVE EDGE CLINICAL GROUP &bull; ALL RIGHTS RESERVED
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 text-center">
            <span>ZERO-ePHI QUARANTINE ENFORCED</span>
            <span>&bull;</span>
            <span>HIPAA BAA SECURED</span>
            <span>&bull;</span>
            <span>SOC2 TYPE II ENCLAVE</span>
            <span>&bull;</span>
            <span>eClinicalWorks &amp; Spruce Relay</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
