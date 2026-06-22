"use client";

import { motion } from "framer-motion";
import { useEffect } from "react";

interface InterstitialProps {
  quote: string;
  onContinue: () => void;
}

export default function Interstitial({ quote, onContinue }: InterstitialProps) {
  // Auto-advance after 3.5s
  useEffect(() => {
    const t = setTimeout(onContinue, 3500);
    return () => clearTimeout(t);
  }, [onContinue]);

  return (
    <section className="min-h-screen flex flex-col items-center justify-center px-8 relative overflow-hidden">
      {/* Ambient */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse 60% 40% at 50% 50%, rgba(200,180,154,0.15) 0%, transparent 70%)",
        }}
      />

      <div className="relative text-center max-w-lg mx-auto">
        {/* Top hairline */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
          className="w-8 h-px bg-sand mx-auto mb-16"
          style={{ transformOrigin: "left" }}
        />

        {/* Quote */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.4, ease: "easeOut" }}
          className="cinematic-quote text-2xl md:text-3xl text-matte-dark"
        >
          {quote}
        </motion.p>

        {/* Bottom hairline */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1.2, delay: 0.6, ease: "easeInOut" }}
          className="w-8 h-px bg-sand mx-auto mt-16 mb-12"
          style={{ transformOrigin: "right" }}
        />

        {/* Skip */}
        <motion.button
          type="button"
          onClick={onContinue}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4, duration: 0.8 }}
          className="label-text opacity-30 hover:opacity-60 transition-opacity"
        >
          Continue
        </motion.button>
      </div>
    </section>
  );
}
