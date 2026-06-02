"use client";

import dynamic from "next/dynamic";

export const AnimatedTestimonials = dynamic(
  () => import('./AnimatedTestimonials').then(mod => mod.AnimatedTestimonials),
  { ssr: false }
);

export const CursorGlow = dynamic(
  () => import('./HeroInteractions').then((mod) => mod.CursorGlow),
  { ssr: false }
);

export const MagneticButton = dynamic(
  () => import('./HeroInteractions').then((mod) => mod.MagneticButton),
  { 
    ssr: false, 
    loading: () => <button className="mt-8 rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-500 px-9 py-4 text-lg font-bold text-black shadow-[0_0_60px_rgba(56,189,248,0.6)]">Create Your Free Store</button> 
  }
);

export const ParallaxBackground = dynamic(
  () => import('./HeroInteractions').then((mod) => mod.ParallaxBackground),
  { ssr: false }
);
