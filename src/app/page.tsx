"use client";

import React, { useState } from "react";
import Link from "next/link";
import { TopNavBar } from "@/components/navigation/TopNavBar";
import { HeroSection } from "@/components/marketing/HeroSection";
import { BookingModal } from "@/components/marketing/BookingModal";
import { TherapeuticProtocols } from "@/components/home/TherapeuticProtocols";

export default function Home() {
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  return (
    <div className="min-h-screen bg-canvas-obsidian text-text-surface flex flex-col selection:bg-champagne-gold selection:text-text-on-gold">
      {/* 
        1. Navigation: TopNavBar Component [4:2603] (H: 81px)
      */}
      <TopNavBar onOpenBooking={() => setIsBookingOpen(true)} />

      {/* 
        2. Hero Section: Hero Section [4:2640] (MinH: 921px)
      */}
      <main className="flex-1">
        <HeroSection onOpenBooking={() => setIsBookingOpen(true)} />

        {/* 
          3. Treatment Pillars Grid: Synchronized Centralized Modalities
        */}
        <TherapeuticProtocols />

      {/* 
        4. Scientific Paradigm Split Section [4:2663]
      */}
      <section id="philosophy" className="py-24 border-y border-border-gold-subtle bg-surface-midnight/50">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-6">
            <span className="font-mono text-xs uppercase tracking-widest text-vitality-sage">
              Scientific Paradigm &bull; The New Standard
            </span>
            <h2 className="font-display text-3xl sm:text-4xl text-text-surface leading-tight">
              Moving Beyond Reactive Pathology to Predictive Biomolecular Architecture
            </h2>
            <p className="font-body text-base text-text-surface-variant leading-relaxed">
              Standard clinical diagnostics operate within wide reference ranges designed only to detect acute disease. We establish your narrow biological corridors—optimizing substrate availability, neural signaling efficiency, and deep restorative sleep architecture.
            </p>
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="p-4 rounded-lg bg-canvas-obsidian border border-border-midnight">
                <div className="font-display text-2xl text-champagne-gold mb-1">40–100 &mu;M</div>
                <div className="font-mono text-[11px] uppercase tracking-wider text-text-surface-muted">Target Intracellular NAD+</div>
              </div>
              <div className="p-4 rounded-lg bg-canvas-obsidian border border-border-midnight">
                <div className="font-display text-2xl text-champagne-gold mb-1">&lt; 0.5%</div>
                <div className="font-mono text-[11px] uppercase tracking-wider text-text-surface-muted">Allowable Enzymatic Hysteresis</div>
              </div>
            </div>
          </div>

          <div className="p-8 rounded-xl bg-canvas-obsidian border border-border-gold-subtle space-y-6">
            <h3 className="font-display text-xl text-text-surface">
              Precision Diagnostic Corridor
            </h3>
            <ul className="space-y-4 text-sm font-body text-text-surface-variant">
              <li className="flex items-start gap-3">
                <span className="text-champagne-gold font-mono">&#10003;</span>
                <span>Direct coenzyme-ready methylation donors bypassing MTHFR / MTRR polymorphic bottlenecks.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-champagne-gold font-mono">&#10003;</span>
                <span>Continuous multi-spectral autonomic tone tracking &amp; cortical connectivity mapping.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-champagne-gold font-mono">&#10003;</span>
                <span>Non-invasive HIFEM neuro-visceral reinforcement restoring vagal reserve.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>
      </main>

      {/* 
        4. Footer Component [4:2773]
      */}
      <footer className="mt-auto border-t border-border-gold-subtle bg-surface-midnight/80 py-12 px-6 lg:px-10">
        <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center md:items-start">
            <span className="font-display text-base tracking-widest text-champagne-gold">
              COGNITIVE EDGE CLINIC
            </span>
            <span className="font-mono text-[10px] text-text-surface-muted tracking-wider mt-1">
              &copy; 2026 COGNITIVE EDGE CLINICAL GROUP &bull; ALL RIGHTS RESERVED
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 font-mono text-[11px] uppercase tracking-wider text-text-surface-variant">
            <Link href="#philosophy" className="hover:text-champagne-gold transition-colors">
              Ethical Guidelines
            </Link>
            <Link href="/vault" className="hover:text-champagne-gold transition-colors">
              Member Portal
            </Link>
            <span className="text-text-surface-muted">&bull;</span>
            <span className="text-text-surface-muted">HIPAA Compliant</span>
            <span className="text-text-surface-muted">SOC2 Type II</span>
          </div>
        </div>
      </footer>

      {/* 
        Cal.com Booking Modal Bridge [4:6747]
      */}
      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
      />
    </div>
  );
}
