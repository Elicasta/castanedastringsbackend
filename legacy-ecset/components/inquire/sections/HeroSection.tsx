"use client";

import { motion } from "framer-motion";

export default function HeroSection({ onBegin }: { onBegin: () => void }) {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-8">
      {/* Ambient blobs */}
      <div className="absolute inset-0 pointer-events-none">
        {[
          { dur: 9,  x: "22%", y: "28%", w: 520, h: 420, color: "rgba(236,214,188,0.55)" },
          { dur: 12, x: "78%", y: "68%", w: 380, h: 380, color: "rgba(200,180,154,0.42)" },
          { dur: 15, x: "55%", y: "18%", w: 300, h: 260, color: "rgba(248,238,224,0.6)"  },
        ].map((b, i) => (
          <motion.div key={i}
            animate={{ scale: [1, 1.08, 1], opacity: [0.5, 0.75, 0.5] }}
            transition={{ duration: b.dur, repeat: Infinity, ease: "easeInOut", delay: i * 2 }}
            className="absolute rounded-full"
            style={{
              left: b.x, top: b.y, width: b.w, height: b.h,
              transform: "translate(-50%,-50%)",
              background: `radial-gradient(ellipse, ${b.color} 0%, transparent 70%)`,
              filter: "blur(60px)",
            }}
          />
        ))}
      </div>

      {/* Wordmark */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.4 }}
        className="mb-20 text-center"
      >
        <p className="label-text">EC Creative Studios</p>
      </motion.div>

      {/* Headline */}
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.4, delay: 0.2, ease: [0.4,0,0.2,1] }}
        className="text-center max-w-xl mb-10"
      >
        <h1 className="display-text text-5xl md:text-7xl text-matte-dark leading-none tracking-tight">
          Your session
          <br />
          <span className="accent-text text-stone" style={{ fontSize: "1.05em" }}>
            begins here.
          </span>
        </h1>
      </motion.div>

      {/* Hairline */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 1, delay: 0.9 }}
        className="w-8 h-px bg-sand mb-10"
        style={{ transformOrigin: "center" }}
      />

      {/* Subtext */}
      <motion.p
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, delay: 0.65 }}
        className="body-text text-center max-w-sm leading-relaxed mb-14"
      >
        We want to understand your vision, your story, and the feeling you want these photographs to hold.
      </motion.p>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 1.0 }}
      >
        <button type="button" onClick={onBegin} className="btn-primary px-12 py-4">
          Begin Creative Direction
        </button>
      </motion.div>

      {/* Breath line */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.5, duration: 1.2 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          className="w-px h-12 bg-gradient-to-b from-transparent via-sand/50 to-transparent mx-auto"
        />
      </motion.div>
    </section>
  );
}
