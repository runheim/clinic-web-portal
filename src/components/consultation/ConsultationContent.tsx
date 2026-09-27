"use client";

import React, { useState } from "react";
import Link from "next/link";
import { TopNavBar } from "@/components/navigation/TopNavBar";
import { Footer } from "@/components/Footer";
import { CLINICAL_SERVICES } from "@/data/clinicalServices";

export function ConsultationContent() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    modality: "Deep Transcranial Magnetic Stimulation (TMS)",
    notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const emailStaffHref =
    "mailto:andreas.runheim@gmail.com?subject=Free%20Consultation%20Inquiry%20-%20Cognitive%20Edge%20Clinic&body=Hello%20Cognitive%20Edge%20Clinic%20Team%2C%0A%0AI%20would%20like%20to%20schedule%20a%20free%20consultation%20with%20your%20clinical%20coordinator%20to%20review%20treatment%20protocols.";
  const spruceSmsHref =
    "sms:+17433330880?&body=Schedule%20free%20consultation%20with%20our%20clinic%20coordinator";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!formData.name.trim()) {
      setErrorMessage("Please provide your full name.");
      return;
    }
    if (!formData.email.trim() && !formData.phone.trim()) {
      setErrorMessage("Please provide either an email address or mobile phone number.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/consultation/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to dispatch consultation inquiry.");
      }

      setSubmitSuccess(true);
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to connect to consultation intake service."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070B12] text-text-surface selection:bg-champagne-gold selection:text-text-on-gold flex flex-col font-body">
      <TopNavBar />

      <main className="flex-1 max-w-[1280px] mx-auto w-full px-6 lg:px-10 py-16 lg:py-24 flex flex-col justify-center items-center">
        {/* Editorial Header & Context */}
        <div className="text-center max-w-3xl mx-auto space-y-6 mb-16">
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[#0C121E] border border-[#D4AF37]/30 shadow-inner">
            <span className="w-2 h-2 rounded-full bg-champagne-gold animate-pulse shadow-[0_0_8px_rgba(212,175,55,0.8)]" />
            <span className="font-mono text-[10px] sm:text-[11px] font-semibold tracking-widest text-champagne-gold uppercase">
              ● DIRECT CLINICAL INTAKE
            </span>
          </div>

          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl text-white font-normal leading-tight">
            Schedule a Free Consultation
          </h1>

          <p className="font-body text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Connect directly with our clinical coordinator to begin your neuro-cellular and longevity evaluation.
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-4 text-xs font-mono text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="text-vitality-sage">✓</span> Direct Clinical Triage
            </span>
            <span>&bull;</span>
            <span className="flex items-center gap-1.5">
              <span className="text-vitality-sage">✓</span> HIPAA Spruce BAA Encrypted
            </span>
            <span>&bull;</span>
            <span className="flex items-center gap-1.5">
              <span className="text-vitality-sage">✓</span> Zero-ePHI Architecture
            </span>
          </div>
        </div>

        {/* Dual Action Cards (Side-by-Side on Desktop, Stacked on Mobile) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl w-full mb-16 items-start">
          {/* Card 1: Interactive Email Intake (Powered by Resend) */}
          <div className="rounded-2xl p-8 sm:p-10 bg-[#0C121E]/95 border border-slate-800 shadow-[0_20px_50px_rgba(0,0,0,0.7)] flex flex-col justify-between space-y-6 hover:border-[#D4AF37]/50 transition-all duration-300 relative overflow-hidden group">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs uppercase tracking-widest text-[#D4AF37] font-semibold px-2.5 py-1 rounded bg-[#070B12] border border-[#D4AF37]/30">
                  COGNITIVE EDGE CLINIC
                </span>
                <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
                  SECURE CLINICAL INTAKE
                </span>
              </div>

              <div>
                <h2 className="font-display text-2xl sm:text-3xl text-white">
                  Email Clinical Staff
                </h2>
                <p className="font-mono text-xs text-vitality-sage mt-1">
                  Direct Coordinator Email Channel
                </p>
              </div>

              {submitSuccess ? (
                <div className="p-6 rounded-xl bg-[#070B12] border border-[#D4AF37]/60 space-y-4 text-center animate-fadeIn">
                  <div className="w-12 h-12 rounded-full bg-champagne-gold/20 border border-champagne-gold flex items-center justify-center mx-auto text-champagne-gold text-xl">
                    ✓
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-display text-xl text-white">
                      Consultation Request Received
                    </h3>
                    <p className="font-body text-sm text-slate-300 leading-relaxed">
                      Consultation request received. Dr. Runheim and clinic staff have been notified.
                    </p>
                    <p className="font-mono text-xs text-slate-400 pt-1">
                      Our clinical coordination desk will contact you within 24 business hours.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSubmitSuccess(false);
                      setFormData({
                        name: "",
                        email: "",
                        phone: "",
                        modality: "Deep Transcranial Magnetic Stimulation (TMS)",
                        notes: "",
                      });
                    }}
                    className="font-mono text-xs text-champagne-gold hover:text-champagne-gold-light underline underline-offset-4 cursor-pointer pt-2 inline-block"
                  >
                    Submit another inquiry
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                  {errorMessage && (
                    <div className="p-3 rounded-lg bg-red-950/40 border border-red-800/40 text-red-300 font-mono text-xs">
                      {errorMessage}
                    </div>
                  )}

                  <div className="space-y-1.5 text-left">
                    <label
                      htmlFor="consultation-name"
                      className="block font-mono text-[11px] uppercase tracking-wider text-slate-400"
                    >
                      Full Name *
                    </label>
                    <input
                      id="consultation-name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Jane Doe"
                      className="w-full px-3.5 py-2.5 rounded-lg bg-[#070B12] border border-slate-700 text-white font-mono text-xs placeholder:text-slate-600 focus:outline-none focus:border-[#D4AF37] transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                    <div className="space-y-1.5">
                      <label
                        htmlFor="consultation-email"
                        className="block font-mono text-[11px] uppercase tracking-wider text-slate-400"
                      >
                        Email Address
                      </label>
                      <input
                        id="consultation-email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="patient@example.com"
                        className="w-full px-3.5 py-2.5 rounded-lg bg-[#070B12] border border-slate-700 text-white font-mono text-xs placeholder:text-slate-600 focus:outline-none focus:border-[#D4AF37] transition-colors"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label
                        htmlFor="consultation-phone"
                        className="block font-mono text-[11px] uppercase tracking-wider text-slate-400"
                      >
                        Mobile Phone
                      </label>
                      <input
                        id="consultation-phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="(336) 555-0199"
                        className="w-full px-3.5 py-2.5 rounded-lg bg-[#070B12] border border-slate-700 text-white font-mono text-xs placeholder:text-slate-600 focus:outline-none focus:border-[#D4AF37] transition-colors"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 text-left">
                    <label
                      htmlFor="consultation-modality"
                      className="block font-mono text-[11px] uppercase tracking-wider text-slate-400"
                    >
                      Clinical Modality Selector
                    </label>
                    <select
                      id="consultation-modality"
                      value={formData.modality}
                      onChange={(e) => setFormData({ ...formData, modality: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-lg bg-[#070B12] border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-[#D4AF37] transition-colors cursor-pointer"
                    >
                      {CLINICAL_SERVICES.map((s) => (
                        <option key={s.id} value={s.title} className="bg-[#0B0F19] text-white">
                          {s.number} | {s.title}
                        </option>
                      ))}
                      <option
                        value="General Neuro-Longevity Evaluation"
                        className="bg-[#0B0F19] text-white"
                      >
                        10 | General Neuro-Longevity Evaluation
                      </option>
                    </select>
                  </div>

                  <div className="space-y-1.5 text-left">
                    <label
                      htmlFor="consultation-notes"
                      className="block font-mono text-[11px] uppercase tracking-wider text-slate-400"
                    >
                      Clinical Notes / Primary Objectives (Optional)
                    </label>
                    <textarea
                      id="consultation-notes"
                      rows={3}
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Briefly describe your cognitive performance or longevity goals..."
                      className="w-full px-3.5 py-2.5 rounded-lg bg-[#070B12] border border-slate-700 text-white font-body text-xs placeholder:text-slate-600 focus:outline-none focus:border-[#D4AF37] transition-colors resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 px-6 rounded-full bg-champagne-gold hover:bg-champagne-gold-light text-text-on-gold font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(212,175,55,0.3)] hover:shadow-[0_0_30px_rgba(212,175,55,0.5)] cursor-pointer disabled:opacity-50 btn-luxury-shimmer"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-[#120e00] border-t-transparent rounded-full animate-spin" />
                        <span>Dispatching Intake...</span>
                      </>
                    ) : (
                      <>
                        <span>Email Cognitive Edge Clinic</span>
                        <span>→</span>
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* Verified recipient & mailto link */}
              <div className="pt-2 text-center space-y-1">
                <span className="text-[11px] font-mono text-slate-500 block">
                  Direct Inbox: andreas.runheim@gmail.com
                </span>
                <a
                  href={emailStaffHref}
                  className="font-mono text-[10.5px] text-slate-500 hover:text-champagne-gold transition-colors inline-block"
                >
                  Prefer desktop email client? Direct mailto link &rarr;
                </a>
              </div>
            </div>
          </div>

          {/* Card 2: Secure SMS via Spruce Health */}
          <div className="rounded-2xl p-8 sm:p-10 bg-[#0C121E]/95 border border-[#D4AF37]/40 shadow-[0_20px_50px_rgba(0,0,0,0.7)] flex flex-col justify-between space-y-6 hover:border-champagne-gold transition-all duration-300 relative overflow-hidden group">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs uppercase tracking-widest text-champagne-gold font-semibold px-2.5 py-1 rounded bg-[#070B12] border border-[#D4AF37]/30">
                  ENCRYPTED CARE MESSENGER
                </span>
                <span className="font-mono text-xs uppercase tracking-wider text-slate-400">
                  Spruce Health Telemetry
                </span>
              </div>

              <div>
                <h2 className="font-display text-2xl sm:text-3xl text-white">
                  Text Clinical Staff via Spruce Health
                </h2>
                <p className="font-mono text-xs text-vitality-sage mt-1">
                  Instant Mobile Coordination
                </p>
              </div>

              <p className="font-body text-xs sm:text-sm text-slate-300 leading-relaxed">
                Instant mobile coordination with clinical coordinator. Initiate a direct mobile text thread with our clinical desk via our secure Spruce Health channel for immediate questions and rapid scheduling.
              </p>

              <div className="p-4 rounded-lg bg-[#070B12] border border-slate-800 font-mono text-xs text-vitality-sage space-y-1">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider">
                  Active Clinical Desk Channel:
                </div>
                <div className="text-base text-champagne-gold">+1 (743) 333-0880</div>
                <div className="text-[10px] text-slate-400 pt-1">
                  Average response: &lt; 15 minutes during clinical hours
                </div>
              </div>
            </div>

            <div className="pt-4 space-y-3">
              <a
                href={spruceSmsHref}
                className="w-full py-4 px-6 rounded-full bg-champagne-gold hover:bg-champagne-gold-light text-text-on-gold font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(212,175,55,0.3)] hover:shadow-[0_0_30px_rgba(212,175,55,0.5)] hover:scale-[1.01] active:scale-[0.99] btn-luxury-shimmer text-center"
              >
                <span>Text Clinic Coordinator via Spruce</span>
                <span>→</span>
              </a>

              <p className="text-center font-mono text-[10.5px] text-slate-500">
                BAA Covered Entity &bull; No public chat logs preserved
              </p>
            </div>
          </div>
        </div>

        {/* Membership Context Banner & Return Navigation */}
        <div className="max-w-5xl w-full space-y-6">
          <div className="p-8 rounded-2xl bg-gradient-to-r from-[#0C121E] via-[#121826] to-[#0C121E] border border-[#D4AF37]/30 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center sm:text-left">
              <span className="font-mono text-[10px] uppercase tracking-widest text-champagne-gold font-semibold block">
                Continuous Clinical Protocols
              </span>
              <p className="font-body text-sm sm:text-base text-slate-200">
                Evaluating ongoing clinical care? Explore our membership tiers and concierge programs.
              </p>
            </div>
            <Link
              href="/membership"
              className="shrink-0 px-6 py-3 rounded-full bg-[#070B12] border border-[#D4AF37]/50 hover:border-champagne-gold text-champagne-gold hover:text-champagne-gold-light font-mono text-xs uppercase tracking-wider transition-all flex items-center gap-2"
            >
              <span>View Membership Options</span>
              <span>→</span>
            </Link>
          </div>

          <div className="text-center pt-2">
            <Link
              href="/"
              className="font-mono text-xs uppercase tracking-widest text-slate-400 hover:text-white transition-colors inline-flex items-center gap-1.5"
            >
              <span>← Return to Home (/)</span>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default ConsultationContent;
