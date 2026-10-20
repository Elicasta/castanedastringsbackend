"use client";

import { motion } from "framer-motion";
import { SectionId, SECTION_ORDER, PROGRESS_SECTIONS } from "@/app/(public)/inquire/types";

const LABELS: Record<string, string> = {
  feeling: "Feeling",
  visual:  "Vision",
  styling: "Styling",
  story:   "Story",
  final:   "Final",
};

// Map every section (including interstitials) to the nearest progress label
function getActiveLabel(current: SectionId): string {
  if (LABELS[current]) return LABELS[current];
  // interstitial — find the last real section before it
  const idx = SECTION_ORDER.indexOf(current);
  for (let i = idx - 1; i >= 0; i--) {
    if (LABELS[SECTION_ORDER[i]]) return LABELS[SECTION_ORDER[i]];
  }
  return "";
}

function getProgressPct(current: SectionId): number {
  const currentIdx = SECTION_ORDER.indexOf(current);
  // Find which progress section we're at or just passed
  let activeProgressIdx = -1;
  for (let i = 0; i < PROGRESS_SECTIONS.length; i++) {
    const si = SECTION_ORDER.indexOf(PROGRESS_SECTIONS[i] as SectionId);
    if (si <= currentIdx) activeProgressIdx = i;
  }
  if (activeProgressIdx < 0) return 0;
  return (activeProgressIdx / (PROGRESS_SECTIONS.length - 1)) * 100;
}

export default function ProgressBar({ current }: { current: SectionId }) {
  if (current === "hero") return null;

  const pct         = getProgressPct(current);
  const activeLabel = getActiveLabel(current);
  const currentIdx  = SECTION_ORDER.indexOf(current);

  return (
    <motion.div
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50"
    >
      {/* Progress line */}
      <div className="progress-track h-px w-full">
        <motion.div
          className="progress-fill h-full"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.9, ease: [0.4, 0, 0.2, 1] }}
        />
      </div>

      {/* Desktop chapter dots */}
      <div className="hidden md:flex items-center justify-center gap-8 py-3 bg-cream/80 backdrop-blur-md border-b border-sand-100/30">
        {PROGRESS_SECTIONS.map((id) => {
          const sectionIdx = SECTION_ORDER.indexOf(id as SectionId);
          const done   = sectionIdx < currentIdx && id !== current;
          const active = sectionIdx <= currentIdx;
          return (
            <div key={id} className="flex items-center gap-2">
              <motion.div
                animate={{ width: active ? 20 : 4, opacity: done ? 0.45 : active ? 1 : 0.2 }}
                transition={{ duration: 0.5 }}
                className="h-px bg-stone-warm rounded-full"
                style={{ minWidth: 4 }}
              />
              <span className={`label-text transition-all duration-500 ${
                active ? "text-matte-dark opacity-100" : "opacity-20"
              }`}>
                {LABELS[id]}
              </span>
            </div>
          );
        })}
      </div>

      {/* Mobile: current chapter + pip row */}
      <div className="flex md:hidden items-center justify-between px-6 py-2.5 bg-cream/85 backdrop-blur-md border-b border-sand-100/30">
        <span className="label-text text-stone-warm">{activeLabel}</span>
        <div className="flex gap-1.5 items-center">
          {PROGRESS_SECTIONS.map((id) => {
            const si = SECTION_ORDER.indexOf(id as SectionId);
            const active = si <= currentIdx;
            return (
              <motion.div key={id}
                animate={{ width: active ? 16 : 6, opacity: active ? 1 : 0.2 }}
                transition={{ duration: 0.4 }}
                className="h-px bg-stone-warm rounded-full"
                style={{ minWidth: 6 }}
              />
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
