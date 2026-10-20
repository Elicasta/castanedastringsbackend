"use client";

import { motion } from "framer-motion";
import { SectionLabel, NavButtons } from "@/components/inquire/ui/FormElements";
import { FormData } from "@/app/(public)/inquire/types";

const stagger = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.14 } } };
const fadeUp  = { hidden: { opacity: 0, y: 22 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } } };

function StoryField({ label, value, onChange, placeholder, hint }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder: string; hint?: string;
}) {
  return (
    <div className="mb-16">
      <div className="w-6 h-px bg-sand mb-7" />
      <h3 className="display-text text-3xl md:text-4xl text-matte-dark leading-tight mb-2">{label}</h3>
      {hint && <p className="body-text text-xs mb-6 opacity-60">{hint}</p>}
      <textarea value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder} rows={5} style={{ minHeight: 140 }}
        className="ec-input ec-textarea w-full px-5 py-5 rounded-sm text-sm leading-loose" />
      {value.length > 0 && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="label-text opacity-30 mt-2 text-right">{value.length} characters</motion.p>
      )}
    </div>
  );
}

export default function StorySection({
  data, onChange, onNext, onBack,
}: { data: FormData; onChange: (u: Partial<FormData>) => void; onNext: () => void; onBack: () => void }) {
  return (
    <section className="section-story min-h-screen pt-32 pb-24 px-6 md:px-10">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div animate={{ opacity: [0.08,0.18,0.08], scale: [1,1.04,1] }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full"
          style={{ background: "radial-gradient(ellipse, rgba(120,106,90,0.18) 0%, transparent 70%)", filter: "blur(90px)" }} />
      </div>

      <div className="relative max-w-2xl mx-auto">
        <SectionLabel label="Your Story" />

        <motion.p initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="accent-text text-xl text-stone leading-relaxed mb-20 max-w-sm">
          This is where we learn who you are. Take as much space as you need.
        </motion.p>

        <motion.div variants={stagger} initial="hidden" animate="visible">
          <motion.div variants={fadeUp}>
            <StoryField
              label="What makes this season meaningful to you?"
              value={data.meaningfulSeason}
              onChange={(v) => onChange({ meaningfulSeason: v })}
              placeholder="A new chapter, anticipation, a season you don't want to forget..."
            />
          </motion.div>

          <motion.div variants={fadeUp}>
            <div className="w-full h-px bg-gradient-to-r from-transparent via-sand/30 to-transparent mb-16" />
            <StoryField
              label="What do you want these photos to help you remember?"
              value={data.rememberYearsFromNow}
              onChange={(v) => onChange({ rememberYearsFromNow: v })}
              placeholder="The feeling of this season, the quiet moments, the way your family was right now..."
            />
          </motion.div>

          <motion.div variants={fadeUp}>
            <div className="w-full h-px bg-gradient-to-r from-transparent via-sand/30 to-transparent mb-16" />
            <StoryField
              label="If there's one image you hope exists at the end of this session, what does it feel like?"
              value={data.oneImageFeeling}
              onChange={(v) => onChange({ oneImageFeeling: v })}
              placeholder="Describe the light, the closeness, the moment — even if you can't name it..."
              hint="Don't overthink this. A feeling is enough."
            />
          </motion.div>

          <motion.div variants={fadeUp}>
            <div className="w-full h-px bg-gradient-to-r from-transparent via-sand/30 to-transparent mb-16" />
            <StoryField
              label="What made you choose EC Creative?"
              value={data.whyECCreative}
              onChange={(v) => onChange({ whyECCreative: v })}
              placeholder="A referral, something you saw, a feeling you got..."
              hint="Helps us understand how to best serve you."
            />
          </motion.div>

          {/* Pull quote */}
          <motion.div variants={fadeUp}>
            <div className="pl-5 border-l border-sand/30 mb-4 mt-4">
              <p className="accent-text text-base text-stone/60 leading-relaxed">
                "The photographs we make are not just images. They are the feeling of a moment held still."
              </p>
              <p className="label-text opacity-30 mt-3">EC Creative Studios</p>
            </div>
          </motion.div>
        </motion.div>

        <NavButtons onBack={onBack} onNext={onNext} nextLabel="Final Step" />
      </div>
    </section>
  );
}
