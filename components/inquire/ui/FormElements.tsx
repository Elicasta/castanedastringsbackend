"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

// ─── Pill Tag ─────────────────────────────────────────────────────────────────
export function PillTag({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`pill-tag px-5 py-2.5 rounded-full text-sm font-light tracking-wide transition-all ${
        selected ? "selected text-matte-dark" : "text-matte-mid"
      }`}
    >
      {label}
    </motion.button>
  );
}

// ─── Vision Card ─────────────────────────────────────────────────────────────
export function VisionCard({
  title, description, selected, onClick, texture,
}: {
  title: string; description: string; selected: boolean; onClick: () => void; texture?: string;
}) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.985 }}
      onClick={onClick}
      className={`vision-card w-full text-left p-6 rounded-sm ${selected ? "selected" : ""}`}
    >
      {/* Optional texture overlay at ~6% opacity */}
      {texture && (
        <div className="absolute inset-0 rounded-sm overflow-hidden pointer-events-none">
          <div className="absolute inset-0" style={{
            background: texture,
            opacity: 0.06,
          }} />
        </div>
      )}

      <motion.div
        animate={{ width: selected ? 24 : 12 }}
        transition={{ duration: 0.4 }}
        className="h-px bg-sand mb-5"
      />
      <p className="display-text text-xl md:text-2xl text-matte-dark leading-tight mb-2">{title}</p>
      <p className="body-text text-xs leading-relaxed">{description}</p>

      {/* Selected indicator — no checkmark, just a subtle dot */}
      {selected && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="absolute top-4 right-4 w-1.5 h-1.5 rounded-full bg-stone-warm"
        />
      )}
    </motion.button>
  );
}

// ─── Option Card (radio-style) ────────────────────────────────────────────────
export function OptionCard({
  label, description, selected, onClick,
}: { label: string; description: string; selected: boolean; onClick: () => void }) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className={`vision-card w-full text-left p-6 rounded-sm ${selected ? "selected" : ""}`}
    >
      <p className="display-text text-xl text-matte-dark mb-1.5">{label}</p>
      <p className="body-text text-xs">{description}</p>
      {selected && (
        <motion.div
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          className="absolute top-4 right-4 w-1.5 h-1.5 rounded-full bg-stone-warm"
        />
      )}
    </motion.button>
  );
}

// ─── Environment Card ─────────────────────────────────────────────────────────
export function EnvironmentCard({
  label, description, selected, onClick,
}: { label: string; description: string; selected: boolean; onClick: () => void }) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`vision-card w-full text-left p-5 rounded-sm ${selected ? "selected" : ""}`}
    >
      <div className="mb-4">
        <motion.div
          animate={{ width: selected ? 20 : 8, opacity: selected ? 1 : 0.4 }}
          transition={{ duration: 0.35 }}
          className="h-px bg-stone"
        />
      </div>
      <p className="font-light text-sm text-matte-dark mb-1" style={{ fontFamily: "'Jost',sans-serif" }}>{label}</p>
      <p className="body-text text-xs opacity-70">{description}</p>
      {selected && (
        <motion.div
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-stone-warm"
        />
      )}
    </motion.button>
  );
}

// ─── Question Block ───────────────────────────────────────────────────────────
export function QuestionBlock({ question, hint, children, large }: {
  question: string; hint?: string; children: ReactNode; large?: boolean;
}) {
  return (
    <div className="mb-14">
      <div className="mb-7">
        <p className={`display-text text-matte-dark leading-snug mb-2 ${large ? "text-3xl md:text-4xl" : "text-2xl md:text-3xl"}`}>
          {question}
        </p>
        {hint && (
          <p className="label-text opacity-60 tracking-widest">{hint}</p>
        )}
      </div>
      {children}
    </div>
  );
}

// ─── Section Label ────────────────────────────────────────────────────────────
export function SectionLabel({ label }: { label: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8 }}
      className="flex items-center gap-4 mb-16"
    >
      <div className="section-divider" />
      <p className="label-text">{label}</p>
    </motion.div>
  );
}

// ─── Nav Buttons ──────────────────────────────────────────────────────────────
export function NavButtons({ onBack, onNext, nextLabel = "Continue", loading, disabled }: {
  onBack?: () => void; onNext: () => void; nextLabel?: string; loading?: boolean; disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between mt-16 pt-10 border-t border-stone/10">
      {onBack
        ? <button type="button" onClick={onBack} className="btn-secondary px-6 py-3">Back</button>
        : <div />
      }
      <motion.button
        type="button"
        onClick={onNext}
        disabled={loading || disabled}
        whileHover={!loading && !disabled ? { scale: 1.01 } : {}}
        whileTap={!loading && !disabled ? { scale: 0.99 } : {}}
        className="btn-primary px-9 py-4 flex items-center gap-4 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeOpacity="0.3"/>
              <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Sending...
          </span>
        ) : (
          <>
            {nextLabel}
            <motion.span
              animate={{ x: [0, 3, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="text-sand/50 text-xs"
            >
              →
            </motion.span>
          </>
        )}
      </motion.button>
    </div>
  );
}
