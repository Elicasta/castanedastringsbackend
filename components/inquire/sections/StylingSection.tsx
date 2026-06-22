"use client";

import { motion } from "framer-motion";
import { OptionCard, PillTag, QuestionBlock, SectionLabel, NavButtons } from "@/components/inquire/ui/FormElements";
import { FormData, STYLING_GUIDANCE, WARDROBE_DIRECTION, MOVEMENT_PREFERENCE, NERVOUS_ABOUT } from "@/app/(public)/inquire/types";

function toggle(arr: string[], v: string) {
  return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
}

const stagger = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.09 } } };
const fadeUp  = { hidden: { opacity: 0, y: 18 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6 } } };

export default function StylingSection({
  data, onChange, onNext, onBack,
}: { data: FormData; onChange: (u: Partial<FormData>) => void; onNext: () => void; onBack: () => void }) {
  return (
    <section className="section-styling min-h-screen pt-32 pb-24 px-6 md:px-10">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div animate={{ opacity: [0.18,0.35,0.18], x: [0,10,0], y: [0,-10,0] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-24 -right-24 w-[650px] h-[500px] rounded-full"
          style={{ background: "radial-gradient(ellipse, rgba(212,200,184,0.5) 0%, transparent 70%)", filter: "blur(90px)" }} />
        <motion.div animate={{ opacity: [0.14,0.28,0.14] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 6 }}
          className="absolute top-32 -left-16 w-80 h-80 rounded-full"
          style={{ background: "radial-gradient(ellipse, rgba(195,175,148,0.4) 0%, transparent 70%)", filter: "blur(60px)" }} />
      </div>

      <div className="relative max-w-3xl mx-auto">
        <SectionLabel label="Styling" />

        <motion.div variants={stagger} initial="hidden" animate="visible">
          <motion.div variants={fadeUp}>
            <QuestionBlock question="Would you like help with wardrobe and styling?">
              <div className="flex flex-col gap-3">
                {STYLING_GUIDANCE.map((o) => (
                  <OptionCard key={o.id} label={o.label} description={o.description}
                    selected={data.stylingGuidance === o.id}
                    onClick={() => onChange({ stylingGuidance: o.id })} />
                ))}
              </div>
            </QuestionBlock>
          </motion.div>

          <motion.div variants={fadeUp}>
            <QuestionBlock question="What wardrobe direction feels most like you?" hint="Starting points, not rules">
              <div className="flex flex-wrap gap-2.5">
                {WARDROBE_DIRECTION.map((w) => (
                  <PillTag key={w} label={w} selected={data.wardrobeDirection.includes(w)}
                    onClick={() => onChange({ wardrobeDirection: toggle(data.wardrobeDirection, w) })} />
                ))}
              </div>
            </QuestionBlock>
          </motion.div>

          <motion.div variants={fadeUp}>
            <QuestionBlock question="Do you prefer natural movement or more guided direction?">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {MOVEMENT_PREFERENCE.map((o) => (
                  <OptionCard key={o.id} label={o.label} description={o.description}
                    selected={data.movementPreference === o.id}
                    onClick={() => onChange({ movementPreference: o.id })} />
                ))}
              </div>
            </QuestionBlock>
          </motion.div>

          <motion.div variants={fadeUp}>
            <QuestionBlock question="Anything you're nervous about?" hint="Being honest helps us take care of you before you arrive">
              <div className="flex flex-wrap gap-2.5">
                {NERVOUS_ABOUT.map((n) => (
                  <PillTag key={n} label={n} selected={data.nervousAbout.includes(n)}
                    onClick={() => onChange({ nervousAbout: toggle(data.nervousAbout, n) })} />
                ))}
              </div>
            </QuestionBlock>
          </motion.div>
        </motion.div>

        <NavButtons onBack={onBack} onNext={onNext} />
      </div>
    </section>
  );
}
