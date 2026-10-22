"use client";

import { motion } from "framer-motion";
import { VisionCard, PillTag, QuestionBlock, SectionLabel, NavButtons } from "@/components/inquire/ui/FormElements";
import { FormData, SESSION_FEELINGS, MOMENTS_THAT_MATTER, AVOID_FEELINGS } from "@/app/(public)/inquire/types";

function toggle(arr: string[], v: string) {
  return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
}

const stagger = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const fadeUp  = { hidden: { opacity: 0, y: 18 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } } };

const CARD_TEXTURES = [
  "linear-gradient(135deg, rgba(240,225,205,1) 0%, rgba(200,180,154,1) 100%)",
  "linear-gradient(160deg, rgba(180,160,135,1) 0%, rgba(220,205,185,1) 100%)",
  "linear-gradient(120deg, rgba(235,225,210,1) 0%, rgba(210,195,175,1) 100%)",
  "linear-gradient(145deg, rgba(245,238,228,1) 0%, rgba(195,180,160,1) 100%)",
  "linear-gradient(130deg, rgba(225,210,190,1) 0%, rgba(200,185,165,1) 100%)",
  "linear-gradient(155deg, rgba(190,172,150,1) 0%, rgba(235,222,205,1) 100%)",
];

export default function FeelingSection({
  data, onChange, onNext, onBack,
}: { data: FormData; onChange: (u: Partial<FormData>) => void; onNext: () => void; onBack: () => void }) {
  return (
    <section className="section-feeling min-h-screen pt-32 pb-24 px-6 md:px-10">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div animate={{ opacity: [0.3,0.55,0.3], scale: [1,1.06,1] }}
          transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-32 -left-24 w-[550px] h-[450px] rounded-full"
          style={{ background: "radial-gradient(ellipse, rgba(240,218,190,0.55) 0%, transparent 70%)", filter: "blur(80px)" }} />
        <motion.div animate={{ opacity: [0.2,0.38,0.2], x: [0,12,0] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut", delay: 4 }}
          className="absolute top-1/2 -right-16 w-[380px] h-[380px] rounded-full"
          style={{ background: "radial-gradient(ellipse, rgba(228,208,182,0.45) 0%, transparent 70%)", filter: "blur(65px)" }} />
      </div>

      <div className="relative max-w-3xl mx-auto">
        <SectionLabel label="The Feeling" />

        <motion.div variants={stagger} initial="hidden" animate="visible">
          <motion.div variants={fadeUp}>
            <QuestionBlock question="What kind of feeling are you envisioning?" hint="Select all that resonate">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SESSION_FEELINGS.map((f, i) => (
                  <VisionCard key={f.id} title={f.label} description={f.description}
                    texture={CARD_TEXTURES[i]}
                    selected={data.sessionFeelings.includes(f.id)}
                    onClick={() => onChange({ sessionFeelings: toggle(data.sessionFeelings, f.id) })} />
                ))}
              </div>
            </QuestionBlock>
          </motion.div>

          <motion.div variants={fadeUp}>
            <QuestionBlock question="What moments matter most to you?">
              <div className="flex flex-wrap gap-2.5">
                {MOMENTS_THAT_MATTER.map((m) => (
                  <PillTag key={m} label={m} selected={data.momentsThatMatter.includes(m)}
                    onClick={() => onChange({ momentsThatMatter: toggle(data.momentsThatMatter, m) })} />
                ))}
              </div>
            </QuestionBlock>
          </motion.div>

          <motion.div variants={fadeUp}>
            <QuestionBlock question="What do you not want this session to feel like?" hint="Just as important as what you love">
              <div className="flex flex-wrap gap-2.5 mb-6">
                {AVOID_FEELINGS.map((f) => (
                  <PillTag key={f} label={f} selected={data.avoidFeelings.includes(f)}
                    onClick={() => onChange({ avoidFeelings: toggle(data.avoidFeelings, f) })} />
                ))}
              </div>
              <textarea value={data.avoidOther} onChange={(e) => onChange({ avoidOther: e.target.value })}
                placeholder="Anything else we should know to avoid..."
                rows={3} className="ec-input ec-textarea w-full px-5 py-4 rounded-sm text-sm" />
            </QuestionBlock>
          </motion.div>
        </motion.div>

        <NavButtons onBack={onBack} onNext={onNext} />
      </div>
    </section>
  );
}
