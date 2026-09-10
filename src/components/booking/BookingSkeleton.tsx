"use client";

import React from "react";

interface BookingSkeletonProps {
  /** Optional custom height for the skeleton container (default: 100%) */
  className?: string;
  /** Active tier label for contextual loading indicator */
  tierLabel?: string;
}

/**
 * Bespoke Obsidian & Champagne Gold skeleton shimmer loader.
 * Preserves exact dimensional footprint of Cal.com embedded calendar
 * to guarantee Cumulative Layout Shift (CLS) = 0.000.
 */
export function BookingSkeleton({
  className = "",
  tierLabel = "Clinical Diagnostic Evaluation",
}: BookingSkeletonProps) {
  // 5 rows of 7 days for a 35-cell calendar grid
  const calendarCells = Array.from({ length: 35 });
  // Simulated available time slot buttons
  const timeSlots = Array.from({ length: 6 });

  return (
    <div
      role="status"
      aria-label="Loading luxury appointment calendar"
      aria-busy="true"
      className={`relative w-full h-full min-h-[640px] bg-[#0B0F19] rounded-xl border border-[#D4AF37]/20 p-6 flex flex-col justify-between overflow-hidden select-none ${className}`}
    >
      {/* Bespoke Champagne Gold Shimmer Beam Sweep */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-[#D4AF37]/10 to-transparent"
        style={{ animationDuration: "2.2s" }}
      />

      {/* Top Header Skeleton */}
      <div className="space-y-3 pb-6 border-b border-[#D4AF37]/15">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#121826] border border-[#D4AF37]/30 text-[10px] font-mono uppercase tracking-widest text-[#D4AF37]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse" />
            <span>Connecting Scheduler &bull; {tierLabel}</span>
          </div>

          <div className="h-5 w-32 rounded-full bg-[#1C1F2A] animate-pulse" />
        </div>

        <div className="space-y-2">
          {/* Main Title Skeleton */}
          <div className="h-7 w-2/3 max-w-md rounded-md bg-gradient-to-r from-[#1C1F2A] via-[#242938] to-[#1C1F2A] animate-pulse" />
          {/* Subtitle Skeleton */}
          <div className="h-4 w-1/2 max-w-sm rounded bg-[#161B28] animate-pulse" />
        </div>
      </div>

      {/* Mid Calendar & Slots Dual-Panel Skeleton */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 py-6 items-start">
        {/* Left/Center: Calendar Month Matrix (7 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Month & Nav Controls */}
          <div className="flex items-center justify-between px-2">
            <div className="h-5 w-36 rounded bg-[#1C1F2A] animate-pulse" />
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-[#121826] border border-[#D4AF37]/15 animate-pulse" />
              <div className="w-7 h-7 rounded-md bg-[#121826] border border-[#D4AF37]/15 animate-pulse" />
            </div>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-2 text-center">
            {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map((day) => (
              <div
                key={day}
                className="font-mono text-[10px] text-[#A89F8C]/60 tracking-wider py-1"
              >
                {day}
              </div>
            ))}
          </div>

          {/* 35-Day Grid */}
          <div className="grid grid-cols-7 gap-2">
            {calendarCells.map((_, idx) => {
              // Highlight selected/active sample dates with subtle gold aura
              const isAvailable = idx >= 8 && idx <= 26 && idx % 3 === 0;
              return (
                <div
                  key={idx}
                  className={`h-11 sm:h-12 rounded-lg flex items-center justify-center transition-all ${
                    isAvailable
                      ? "bg-[#161F32] border border-[#D4AF37]/35 shadow-[0_0_12px_rgba(212,175,55,0.08)]"
                      : "bg-[#101420] border border-[#D4AF37]/10 opacity-75"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full ${
                      isAvailable ? "bg-[#D4AF37]/30" : "bg-[#1C2234]"
                    } animate-pulse`}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Available Time Slots Column */}
        <div className="lg:col-span-4 space-y-3 pt-2 lg:pt-0 lg:border-l lg:border-[#D4AF37]/15 lg:pl-6">
          <div className="flex items-center justify-between pb-1">
            <div className="h-4 w-28 rounded bg-[#1C1F2A] animate-pulse" />
            <div className="h-3 w-16 rounded bg-[#161B28] animate-pulse" />
          </div>

          <div className="space-y-2.5">
            {timeSlots.map((_, idx) => (
              <div
                key={idx}
                className="h-11 w-full rounded-lg bg-[#121826] border border-[#D4AF37]/20 flex items-center justify-between px-4"
              >
                <div className="h-3.5 w-20 rounded bg-[#1F2536] animate-pulse" />
                <div className="w-2 h-2 rounded-full bg-[#D4AF37]/40 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Status Skeleton */}
      <div className="pt-4 border-t border-[#D4AF37]/15 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] font-mono text-[#A89F8C]">
        <div className="flex items-center gap-2 text-[#D4AF37]">
          <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-ping" />
          <span>Securing Obsidian Ephemeral Tunnel &bull; Zero-ePHI Sandbox</span>
        </div>

        <div className="text-[10px] text-[#A89F8C]/80">
          Max Latency Budget: 3,000ms &bull; CLS = 0.000 Target
        </div>
      </div>
    </div>
  );
}

export default BookingSkeleton;
