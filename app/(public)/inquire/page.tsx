"use client";

import { useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FormData, defaultFormData, SectionId, SECTION_ORDER, INTERSTITIALS } from "@/app/(public)/inquire/types";
import { submitSessionVisionInquiry } from "@/app/(public)/inquire/actions";
import ProgressBar from "@/components/inquire/ui/ProgressBar";
import Interstitial from "@/components/inquire/ui/Interstitial";
import HeroSection from "@/components/inquire/sections/HeroSection";
import FeelingSection from "@/components/inquire/sections/FeelingSection";
import VisualSection from "@/components/inquire/sections/VisualSection";
import StylingSection from "@/components/inquire/sections/StylingSection";
import StorySection from "@/components/inquire/sections/StorySection";
import FinalSection from "@/components/inquire/sections/FinalSection";
import ConfirmationSection from "@/components/inquire/sections/ConfirmationSection";

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.4, 0, 0.2, 1] } },
  exit: { opacity: 0, y: -12, transition: { duration: 0.5, ease: [0.4, 0, 1, 1] } },
};

export default function InquirePage() {
  const [section, setSection] = useState<SectionId>("hero");
  const [confirmed, setConfirmed] = useState(false);
  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateForm = useCallback((updates: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  }, []);

  const goNext = () => {
    const idx = SECTION_ORDER.indexOf(section);
    if (idx < SECTION_ORDER.length - 1) {
      setSection(SECTION_ORDER[idx + 1]);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const goBack = () => {
    const idx = SECTION_ORDER.indexOf(section);
    if (idx > 0) {
      setSection(SECTION_ORDER[idx - 1]);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      // uploadedFiles (raw File objects) can't cross the server action
      // boundary as-is. uploadedFileNames already carries the filenames
      // through. Real file storage is a follow-up, not this pass.
      const { uploadedFiles, ...payload } = formData;
      const result = await submitSessionVisionInquiry(payload);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setConfirmed(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  if (confirmed) return <ConfirmationSection />;

  const shared = { data: formData, onChange: updateForm };

  return (
    <>
      <ProgressBar current={section} />
      <AnimatePresence mode="wait">
        <motion.div key={section} variants={pageVariants} initial="initial" animate="animate" exit="exit">
          {section === "hero" && <HeroSection onBegin={goNext} />}

          {section === "feeling" && <FeelingSection {...shared} onNext={goNext} onBack={goBack} />}

          {section === "interstitial-1" && (
            <Interstitial quote={INTERSTITIALS.beforeVisual} onContinue={goNext} />
          )}

          {section === "visual" && <VisualSection {...shared} onNext={goNext} onBack={goBack} />}

          {section === "interstitial-2" && (
            <Interstitial quote={INTERSTITIALS.beforeStyling} onContinue={goNext} />
          )}

          {section === "styling" && <StylingSection {...shared} onNext={goNext} onBack={goBack} />}

          {section === "interstitial-3" && (
            <Interstitial quote={INTERSTITIALS.beforeStory} onContinue={goNext} />
          )}

          {section === "story" && <StorySection {...shared} onNext={goNext} onBack={goBack} />}

          {section === "interstitial-4" && (
            <Interstitial quote={INTERSTITIALS.beforeFinal} onContinue={goNext} />
          )}

          {section === "final" && (
            <FinalSection {...shared} onSubmit={handleSubmit} onBack={goBack} loading={loading} error={error} />
          )}
        </motion.div>
      </AnimatePresence>
    </>
  );
}
