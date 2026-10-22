"use client";

import { motion } from "framer-motion";

export default function ConfirmationSection() {
  return (
    <section className="min-h-screen flex flex-col items-center justify-center px-8 overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <motion.div initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 2.8, ease: "easeOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[700px] rounded-full"
          style={{
            background: "radial-gradient(ellipse, rgba(228,208,180,0.45) 0%, rgba(195,175,148,0.2) 45%, transparent 70%)",
            filter: "blur(70px)",
          }} />
      </div>

      <div className="relative text-center max-w-md mx-auto">
        <motion.div initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
          style={{ transformOrigin: "top" }}
          className="w-px h-16 bg-gradient-to-b from-transparent via-sand/50 to-transparent mx-auto mb-14" />

        <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.7 }} className="label-text mb-12">
          EC Creative Studios
        </motion.p>

        <motion.h2 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.4, delay: 0.9 }}
          className="display-text text-5xl md:text-6xl text-matte-dark leading-none mb-8">
          Your vision is<br />
          <span className="accent-text text-stone" style={{ fontSize: "1.04em" }}>taking shape.</span>
        </motion.h2>

        <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
          transition={{ duration: 0.9, delay: 1.5 }}
          className="w-8 h-px bg-sand mx-auto mb-8" />

        <motion.p initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1.7 }}
          className="body-text text-center leading-relaxed max-w-xs mx-auto mb-14">
          We'll review everything and reach out within 24 hours with a creative plan built around your story.
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 2.1 }}
          className="border border-sand/30 rounded-sm px-8 py-7 text-left inline-block">
          <p className="label-text mb-5">What happens next</p>
          {[
            "Session vision reviewed within 24 hours",
            "Personalized creative plan sent to your email",
            "Booking confirmed and preparation begins",
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-3 mb-3 last:mb-0">
              <div className="w-1 h-1 rounded-full bg-sand/60 mt-1.5 flex-shrink-0" />
              <p className="body-text text-xs leading-relaxed">{step}</p>
            </div>
          ))}
        </motion.div>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ duration: 1.5, delay: 2.8 }}
          className="accent-text text-base text-stone/50 mt-14">
          Talk soon.
        </motion.p>
      </div>
    </section>
  );
}
