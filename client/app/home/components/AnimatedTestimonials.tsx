"use client";

import { motion } from "framer-motion";
import { useIsMobile } from "./HeroInteractions";

const testimonials = [
  {
    name: "Aarav Patel",
    role: "Buyer",
    quote: "As a buyer, BitForge feels incredibly smooth — from payment to instant download.",
  },
  {
    name: "Neha Sharma",
    role: "UI Designer",
    quote: "I launched my first product in a day. The experience is unreal.",
  },
  {
    name: "Rohit Verma",
    role: "Full-stack Developer",
    quote: "Payments, payouts, downloads — everything just works.",
  },
];

export function AnimatedTestimonials() {
  const isMobile = useIsMobile();

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 px-5 md:px-6">
      {testimonials.map((t, i) =>
        isMobile ? (
          <div
            key={i}
            className="rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-6 backdrop-blur-xl animate-fade-in-up"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <p className="text-slate-600 dark:text-white/70">“{t.quote}”</p>
            <p className="mt-4 font-semibold">{t.name}</p>
            <p className="text-sm text-white/50">{t.role}</p>
          </div>
        ) : (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-6 backdrop-blur-xl"
          >
            <p className="text-slate-600 dark:text-white/70">“{t.quote}”</p>
            <p className="mt-4 font-semibold">{t.name}</p>
            <p className="text-sm text-white/50">{t.role}</p>
          </motion.div>
        )
      )}
    </div>
  );
}
