"use client";

import React, { useState } from "react";

interface EmailIntakeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EmailIntakeModal({ isOpen, onClose }: EmailIntakeModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    preferredModality: "General Longevity Consultation",
    notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/consultation/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to dispatch consultation request.");
      }

      setSubmissionSuccess(true);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setSubmissionSuccess(false);
    setErrorMessage(null);
    setFormData({
      name: "",
      email: "",
      phone: "",
      preferredModality: "General Longevity Consultation",
      notes: "",
    });
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="intake-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
    >
      <div className="bg-[#0B111E] border border-slate-800 rounded-xl shadow-2xl max-w-lg w-full p-6 sm:p-8 relative max-h-[90vh] overflow-y-auto font-body text-text-surface">
        {/* Close Button */}
        <button
          type="button"
          onClick={handleResetAndClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#070B12] border border-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-sm transition-colors cursor-pointer"
          aria-label="Close dialog"
        >
          ✕
        </button>

        {submissionSuccess ? (
          /* Success State Card */
          <div className="py-6 text-center space-y-5">
            <div className="w-14 h-14 rounded-full bg-[#070B12] border border-champagne-gold/60 mx-auto flex items-center justify-center text-champagne-gold shadow-[0_0_20px_rgba(212,175,55,0.3)]">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <div className="space-y-2">
              <h3 id="intake-modal-title" className="font-display text-2xl text-white">
                Consultation Request Received
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed max-w-md mx-auto">
                Consultation Request Received. Dr. Runheim and our clinical coordination desk have been notified. We will reach out shortly to schedule your intake.
              </p>
            </div>

            <div className="pt-4">
              <button
                type="button"
                onClick={handleResetAndClose}
                className="w-full py-3.5 px-6 rounded-full bg-champagne-gold hover:bg-champagne-gold-light text-text-on-gold font-mono text-xs font-bold uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(212,175,55,0.3)] btn-luxury-shimmer cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          /* Interactive Input Form */
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1 pr-6">
              <div className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-champagne-gold font-semibold">
                <span>●</span>
                <span>DIRECT CLINICAL INTAKE</span>
              </div>
              <h3 id="intake-modal-title" className="font-display text-2xl sm:text-3xl text-white">
                Schedule a Free Consultation
              </h3>
              <p className="text-xs text-slate-400">
                Direct notification dispatched to Dr. Runheim and clinical coordination staff.
              </p>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-lg bg-red-950/40 border border-red-800/80 text-red-200 text-xs font-mono">
                {errorMessage}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-300 uppercase tracking-wider mb-1.5">
                  Full Name <span className="text-[#D4AF37]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Eleanor Vance"
                  className="w-full px-4 py-2.5 rounded-lg bg-[#070B12] border border-slate-800 focus:border-[#D4AF37] text-white text-sm outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 uppercase tracking-wider mb-1.5">
                  Email Address <span className="text-[#D4AF37]">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g. eleanor@example.com"
                  className="w-full px-4 py-2.5 rounded-lg bg-[#070B12] border border-slate-800 focus:border-[#D4AF37] text-white text-sm outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 uppercase tracking-wider mb-1.5">
                  Mobile Phone <span className="text-[#D4AF37]">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="e.g. (336) 555-0199"
                  className="w-full px-4 py-2.5 rounded-lg bg-[#070B12] border border-slate-800 focus:border-[#D4AF37] text-white text-sm outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 uppercase tracking-wider mb-1.5">
                  Area of Clinical Focus
                </label>
                <select
                  value={formData.preferredModality}
                  onChange={(e) => setFormData({ ...formData, preferredModality: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg bg-[#070B12] border border-slate-800 focus:border-[#D4AF37] text-white text-sm outline-none transition-colors"
                >
                  <option value="Cognitive Optimization / TMS">Cognitive Optimization / TMS</option>
                  <option value="Dementia Prevention & MCI">Dementia Prevention &amp; MCI</option>
                  <option value="Peptides & Cellular Longevity">Peptides &amp; Cellular Longevity</option>
                  <option value="Hormones & Sexual Wellness">Hormones &amp; Sexual Wellness</option>
                  <option value="Emsella & Core Stability">Emsella &amp; Core Stability</option>
                  <option value="GLP-1 Metabolic Health">GLP-1 Metabolic Health</option>
                  <option value="General Longevity Consultation">General Longevity Consultation</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 uppercase tracking-wider mb-1.5">
                  Notes / Questions (Optional)
                </label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Describe current health priorities or scheduling preferences..."
                  className="w-full px-4 py-2.5 rounded-lg bg-[#070B12] border border-slate-800 focus:border-[#D4AF37] text-white text-sm outline-none transition-colors resize-none"
                />
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleResetAndClose}
                className="w-full sm:w-auto px-5 py-3 rounded-full border border-slate-700 text-slate-300 hover:text-white font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-6 py-3 rounded-full bg-champagne-gold hover:bg-champagne-gold-light text-text-on-gold font-mono text-xs font-bold uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(212,175,55,0.3)] btn-luxury-shimmer disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-[#070B12]" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Dispatching...</span>
                  </>
                ) : (
                  <>
                    <span>Send Consultation Request</span>
                    <span>→</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
