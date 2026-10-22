"use client";

import { motion } from "framer-motion";
import { useCallback } from "react";
import { EnvironmentCard, PillTag, QuestionBlock, SectionLabel, NavButtons } from "@/components/inquire/ui/FormElements";
import { FormData, ENVIRONMENTS, COLORS_TEXTURES } from "@/app/(public)/inquire/types";

function toggle(arr: string[], v: string) {
  return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
}

const stagger = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.09 } } };
const fadeUp  = { hidden: { opacity: 0, y: 18 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6 } } };

export default function VisualSection({
  data, onChange, onNext, onBack,
}: { data: FormData; onChange: (u: Partial<FormData>) => void; onNext: () => void; onBack: () => void }) {

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    onChange({
      uploadedFiles: [...data.uploadedFiles, ...files],
      uploadedFileNames: [...data.uploadedFileNames, ...files.map((f) => f.name)],
    });
  }, [data.uploadedFiles, data.uploadedFileNames, onChange]);

  const removeFile = (i: number) => {
    onChange({
      uploadedFiles: data.uploadedFiles.filter((_, idx) => idx !== i),
      uploadedFileNames: data.uploadedFileNames.filter((_, idx) => idx !== i),
    });
  };

  return (
    <section className="section-visual min-h-screen pt-32 pb-24 px-6 md:px-10">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div animate={{ opacity: [0.22,0.42,0.22], y: [0,-14,0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 -right-16 w-[480px] h-[480px] rounded-full"
          style={{ background: "radial-gradient(ellipse, rgba(195,175,148,0.45) 0%, transparent 70%)", filter: "blur(75px)" }} />
        <motion.div animate={{ opacity: [0.18,0.32,0.18], scale: [1,1.06,1] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 5 }}
          className="absolute bottom-24 -left-16 w-80 h-80 rounded-full"
          style={{ background: "radial-gradient(ellipse, rgba(228,218,205,0.5) 0%, transparent 70%)", filter: "blur(55px)" }} />
      </div>

      <div className="relative max-w-3xl mx-auto">
        <SectionLabel label="Visual Direction" />

        <motion.div variants={stagger} initial="hidden" animate="visible">
          <motion.div variants={fadeUp}>
            <QuestionBlock question="What environments feel most like you right now?">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {ENVIRONMENTS.map((env) => (
                  <EnvironmentCard key={env.id} label={env.label} description={env.description}
                    selected={data.environments.includes(env.id)}
                    onClick={() => onChange({ environments: toggle(data.environments, env.id) })} />
                ))}
              </div>
            </QuestionBlock>
          </motion.div>

          <motion.div variants={fadeUp}>
            <QuestionBlock question="What colors and textures draw you in?" hint="Think wardrobe, interiors, what catches your eye">
              <div className="flex flex-wrap gap-2.5">
                {COLORS_TEXTURES.map((c) => (
                  <PillTag key={c} label={c} selected={data.colorsTextures.includes(c)}
                    onClick={() => onChange({ colorsTextures: toggle(data.colorsTextures, c) })} />
                ))}
              </div>
            </QuestionBlock>
          </motion.div>

          <motion.div variants={fadeUp}>
            <QuestionBlock question="Share what inspires you." hint="Pinterest boards, screenshots, anything that feels like you">
              <textarea value={data.inspirationLinks}
                onChange={(e) => onChange({ inspirationLinks: e.target.value })}
                placeholder="Paste links here — Pinterest, Instagram, anything..."
                rows={3} className="ec-input ec-textarea w-full px-5 py-4 rounded-sm text-sm mb-5" />

              {/* Refined upload zone */}
              <label className="drop-zone block rounded-sm p-10 text-center relative overflow-hidden">
                <input type="file" multiple accept="image/*" className="sr-only" onChange={handleFileChange} />

                {/* Atmospheric inner gradient */}
                <div className="absolute inset-0 pointer-events-none"
                  style={{ background: "radial-gradient(ellipse at center, rgba(200,180,154,0.06) 0%, transparent 70%)" }} />

                <div className="relative flex flex-col items-center gap-4">
                  {/* Minimal line icon */}
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"
                    className="text-stone-light opacity-50">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  <div>
                    <p className="display-text text-lg text-matte-dark mb-1">Inspiration helps us understand your world.</p>
                    <p className="body-text text-xs opacity-70">
                      Pinterest boards, screenshots, unfinished ideas, saved images.<br />
                      Anything that feels like you.
                    </p>
                  </div>
                  <p className="label-text opacity-30">tap to browse</p>
                </div>
              </label>

              {data.uploadedFiles.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-5 flex flex-wrap gap-2">
                  {data.uploadedFiles.map((file, i) => (
                    <div key={i} className="relative group w-16 h-16 rounded-sm overflow-hidden border border-sand/30">
                      <img src={URL.createObjectURL(file)} alt={file.name} className="w-full h-full object-cover opacity-80" />
                      <button type="button" onClick={() => removeFile(i)}
                        className="absolute inset-0 bg-matte-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round">
                          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    </div>
                  ))}
                </motion.div>
              )}
            </QuestionBlock>
          </motion.div>
        </motion.div>

        <NavButtons onBack={onBack} onNext={onNext} />
      </div>
    </section>
  );
}
