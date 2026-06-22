"use client";

import { motion } from "framer-motion";
import { SectionLabel } from "@/components/inquire/ui/FormElements";
import { FormData, SESSION_TYPES } from "@/app/(public)/inquire/types";

const stagger = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.07 } } };
const fadeUp = { hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0, transition: { duration: 0.45 } } };

interface FinalSectionProps {
  data: FormData;
  onChange: (u: Partial<FormData>) => void;
  onSubmit: () => void;
  onBack: () => void;
  loading: boolean;
  error: string | null;
}

export default function FinalSection({ data, onChange, onSubmit, onBack, loading, error }: FinalSectionProps) {
  // This is the validation that was missing entirely when the flow only
  // rendered the old email-only FinalSection. A submission with no name and
  // no session type can't become a real inquiry record, so it can't pass.
  const canSubmit = data.fullName.trim() && data.email.trim().includes("@") && data.sessionType;

  return (
    <section className="section-final min-h-screen pt-32 pb-24 px-6 md:px-10">
      <div className="fixed inset-0 pointer-events-none">
        <motion.div animate={{ opacity: [0.15, 0.28, 0.15] }} transition={{ duration: 12, repeat: Infinity }}
          className="absolute bottom-0 left-0 right-0 h-[60vh]"
          style={{ background: "linear-gradient(to top, rgba(193,172,147,0.14) 0%, transparent 100%)" }} />
      </div>

      <div className="relative max-w-xl mx-auto">
        <SectionLabel label="Final Details" />

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.1 }} className="mb-12">
          <h2 className="display-text text-4xl md:text-5xl text-matte-dark mb-3 leading-none">One last thing.</h2>
          <p className="accent-text text-lg text-stone leading-relaxed">So we know who we're creating for.</p>
        </motion.div>

        <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-5">
          <motion.div variants={fadeUp}>
            <label className="label-text block mb-2">Full Name *</label>
            <input type="text" value={data.fullName} onChange={(e) => onChange({ fullName: e.target.value })}
              placeholder="Your full name" className="ec-input w-full px-5 py-4 rounded-sm text-sm" />
          </motion.div>

          <motion.div variants={fadeUp}>
            <label className="label-text block mb-2">Email Address *</label>
            <input type="email" value={data.email} onChange={(e) => onChange({ email: e.target.value })}
              placeholder="your@email.com" className="ec-input w-full px-5 py-4 rounded-sm text-sm" />
          </motion.div>

          <motion.div variants={fadeUp}>
            <label className="label-text block mb-2">Phone Number</label>
            <input type="tel" value={data.phone} onChange={(e) => onChange({ phone: e.target.value })}
              placeholder="(305) 000-0000" className="ec-input w-full px-5 py-4 rounded-sm text-sm" />
          </motion.div>

          <motion.div variants={fadeUp}>
            <label className="label-text block mb-2">Instagram Handle</label>
            <div className="relative">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-light text-sm font-light"
                style={{ fontFamily: "'Jost',sans-serif" }}>@</span>
              <input type="text" value={data.instagramHandle}
                onChange={(e) => onChange({ instagramHandle: e.target.value })}
                placeholder="yourhandle" className="ec-input w-full pl-9 pr-5 py-4 rounded-sm text-sm" />
            </div>
          </motion.div>

          <motion.div variants={fadeUp}>
            <label className="label-text block mb-2">Session Type *</label>
            <select value={data.sessionType} onChange={(e) => onChange({ sessionType: e.target.value })}
              className="ec-input w-full px-5 py-4 rounded-sm text-sm appearance-none cursor-pointer">
              <option value="" disabled>Select session type</option>
              {SESSION_TYPES.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
          </motion.div>

          <motion.div variants={fadeUp}>
            <label className="label-text block mb-2">Preferred Date or Date Range</label>
            <input type="text" value={data.preferredDates}
              onChange={(e) => onChange({ preferredDates: e.target.value })}
              placeholder="e.g. September 2026, or anytime before October"
              className="ec-input w-full px-5 py-4 rounded-sm text-sm" />
            <p className="text-xs text-stone-light mt-1.5 italic font-light" style={{ fontFamily: "'Jost',sans-serif" }}>
              Flexible is fine. We'll work with you.
            </p>
          </motion.div>
        </motion.div>

        {/* What happens next */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="mt-12 mb-10 pl-5 border-l border-sand/30">
          <p className="label-text mb-5">What happens next</p>
          {[
            "We review your session vision within 24 hours",
            "We send a personalized session plan with recommended dates",
            "We confirm your booking and begin creative preparation",
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-3 mb-3 last:mb-0">
              <div className="w-1 h-1 rounded-full bg-sand/60 mt-1.5 flex-shrink-0" />
              <p className="body-text text-xs leading-relaxed">{step}</p>
            </div>
          ))}
        </motion.div>

        {error && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-50 border border-red-200 rounded-sm">
            <p className="text-xs text-red-700 font-light" style={{ fontFamily: "'Jost',sans-serif" }}>{error}</p>
          </motion.div>
        )}

        <div className="flex items-center justify-between pt-8 border-t border-stone/10">
          <button type="button" onClick={onBack} className="btn-secondary px-6 py-3">Back</button>
          <motion.button type="button" onClick={onSubmit} disabled={loading || !canSubmit}
            whileHover={!loading && canSubmit ? { scale: 1.01 } : {}}
            whileTap={!loading && canSubmit ? { scale: 0.99 } : {}}
            className="btn-primary px-10 py-4 flex items-center gap-4 disabled:opacity-40 disabled:cursor-not-allowed">
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeOpacity="0.3" />
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                Sending...
              </span>
            ) : (
              <>Send My Session Vision <span className="text-sand/50 text-xs">→</span></>
            )}
          </motion.button>
        </div>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}
          className="label-text text-center mt-8 opacity-25">
          Your information is private
        </motion.p>
      </div>
    </section>
  );
}
