"use client";

import { motion, useSpring, useTransform, useScroll } from "framer-motion";
import { useEffect, useState, MouseEvent, ReactNode } from "react";

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isSmallScreen = window.matchMedia('(max-width: 768px)').matches;
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      setIsMobile(isTouchDevice || isSmallScreen || prefersReducedMotion);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}

export function CursorGlow() {
  const isMobile = useIsMobile();
  const mouseX = useSpring(0, { stiffness: 120, damping: 30 });
  const mouseY = useSpring(0, { stiffness: 120, damping: 30 });

  const cursorGlowBg = useTransform(
    [mouseX, mouseY],
    ([x, y]) => `radial-gradient(420px at ${x}px ${y}px, rgba(99,102,241,0.15), transparent 70%)`
  );

  useEffect(() => {
    if (isMobile) return;
    const move = (e: globalThis.MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, [mouseX, mouseY, isMobile]);

  if (isMobile) return null;

  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-0"
      style={{ background: cursorGlowBg }}
    />
  );
}

export function MagneticButton({
  children,
  className,
}: {
  children: ReactNode;
  className: string;
}) {
  const isMobile = useIsMobile();
  const x = useSpring(0, { stiffness: 300, damping: 20 });
  const y = useSpring(0, { stiffness: 300, damping: 20 });

  function onMove(e: MouseEvent<HTMLButtonElement>) {
    if (isMobile) return;
    const rect = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - rect.left - rect.width / 2) * 0.25);
    y.set((e.clientY - rect.top - rect.height / 2) * 0.25);
  }

  function reset() {
    x.set(0);
    y.set(0);
  }

  if (isMobile) {
    return <button className={className}>{children}</button>;
  }

  return (
    <motion.button
      onMouseMove={onMove}
      onMouseLeave={reset}
      style={{ x, y }}
      className={`will-change-transform ${className}`}
    >
      {children}
    </motion.button>
  );
}

export function ParallaxBackground() {
  const { scrollY } = useScroll();
  const isMobile = useIsMobile();
  
  const y1 = useTransform(scrollY, [0, 600], [0, 160]);
  const y2 = useTransform(scrollY, [0, 600], [0, -160]);

  if (isMobile) {
    return (
      <>
        <div className="absolute -top-40 -left-40 w-125 h-125 rounded-full bg-indigo-600/25 blur-[160px] z-0" />
        <div className="absolute top-1/3 -right-40 w-145 h-145 rounded-full bg-cyan-500/20 blur-[180px] z-0" />
      </>
    );
  }

  return (
    <>
      <motion.div
        style={{ y: y1 }}
        className="absolute -top-40 -left-40 w-125 h-125 rounded-full bg-indigo-600/25 blur-[160px] z-0"
      />
      <motion.div
        style={{ y: y2 }}
        className="absolute top-1/3 -right-40 w-145 h-145 rounded-full bg-cyan-500/20 blur-[180px] z-0"
      />
    </>
  );
}
