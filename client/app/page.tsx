"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { useEffect, useState, type MouseEvent, type ReactNode } from "react";
import { marketplaceAPI } from "@/lib/api";
import { getStoredUser } from "@/lib/cookies";

type MarketplaceProduct = {
  _id: string;
  title: string;
  description: string;
  price: number;
  discount: number;
  category?: string;
  thumbnailUrl?: string;
};

/* ================= MAGNETIC BUTTON ================= */

function MagneticButton({
  children,
  className,
}: {
  children: ReactNode;
  className: string;
}) {
  const x = useSpring(0, { stiffness: 300, damping: 20 });
  const y = useSpring(0, { stiffness: 300, damping: 20 });

  function onMove(e: MouseEvent<HTMLButtonElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - rect.left - rect.width / 2) * 0.25);
    y.set((e.clientY - rect.top - rect.height / 2) * 0.25);
  }

  function reset() {
    x.set(0);
    y.set(0);
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

/* ================= PAGE ================= */

export default function LandingPage() {
  const { scrollY } = useScroll();
  const [activePlan, setActivePlan] = useState("Pro");
  const [featuredProduct, setFeaturedProduct] = useState<MarketplaceProduct | null>(null);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const router = useRouter();

  /* header visuals */
  const headerBg = useTransform(
    scrollY,
    [0, 60],
    ["rgba(5,5,10,0.7)", "rgba(5,5,10,0.95)"]
  );
  const headerShadow = useTransform(
    scrollY,
    [0, 60],
    ["0 0 0 rgba(0,0,0,0)", "0 10px 40px rgba(0,0,0,0.75)"]
  );

  /* cursor glow */
  const mouseX = useSpring(0, { stiffness: 120, damping: 30 });
  const mouseY = useSpring(0, { stiffness: 120, damping: 30 });

  useEffect(() => {
    const move = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener("mousemove", move as any);
    return () => window.removeEventListener("mousemove", move as any);
  }, [mouseX, mouseY]);

  useEffect(() => {
    const loadFeatured = async () => {
      try {
        const data = await marketplaceAPI.getAllProducts();
        const list = (data?.products || data || []) as MarketplaceProduct[];

        if (Array.isArray(list) && list.length > 0) {
          const randomIndex = Math.floor(Math.random() * list.length);
          setFeaturedProduct(list[randomIndex]);
        } else {
          setFeaturedProduct(null);
        }
      } catch (error) {
        console.error("Failed to load featured product", error);
        setFeaturedProduct(null);
      } finally {
        setLoadingFeatured(false);
      }
    };

    loadFeatured();
  }, []);

  const handleFeaturedBuy = () => {
    if (!featuredProduct) return;

    const target = `/marketplace/${featuredProduct._id}`;
    const user = getStoredUser<{ role?: string }>();

    if (!user) {
      const next = encodeURIComponent(target);
      router.push(`/login?next=${next}`);
      return;
    }

    const role = user.role || "buyer";

    if (role !== "buyer") {
      if (typeof window !== "undefined") {
        window.alert("Please log in as a buyer to purchase. Redirecting to your dashboard.");
      }
      router.push(`/dashboard/${role}`);
      return;
    }

    router.push(target);
  };

  const handleFooterMarketplaceClick = () => {
    const target = "/marketplace";
    const user = getStoredUser<{ role?: string }>();

    if (!user) {
      const next = encodeURIComponent(target);
      router.push(`/login?next=${next}`);
      return;
    }

    const role = user.role || "buyer";

    if (role !== "buyer") {
      router.push(`/dashboard/${role}`);
      return;
    }

    router.push(target);
  };

  return (
    <main className="relative min-h-screen bg-[#05050a] text-white overflow-x-hidden">
      {/* CURSOR GLOW */}
      <motion.div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background: useTransform(
            [mouseX, mouseY],
            ([x, y]) =>
              `radial-gradient(420px at ${x}px ${y}px, rgba(99,102,241,0.15), transparent 70%)`
          ),
        }}
      />

      <ParallaxBackground scrollY={scrollY} />

      {/* ================= HEADER (TRUE STICKY) ================= */}
      <motion.header
        style={{ background: headerBg, boxShadow: headerShadow }}
        className="
          fixed top-0 left-0 right-0 z-100
          h-16 sm:h-20
          backdrop-blur-xl
          border-b border-white/10
        "
      >
        <nav className="max-w-7xl mx-auto px-5 md:px-6 h-full flex items-center justify-between">
          <div className="flex items-center">
            <Image
              src="/bitforge_logo1.png"
              alt="BitForge logo"
              width={256}
              height={256}
              className="
                h-10 sm:h-20
                w-auto
                object-contain
                drop-shadow-[0_0_20px_rgba(56,189,248,0.45)]
              "
              priority
            />

            <span
              className="
                -ml-3 sm:-ml-6
                text-lg sm:text-3xl
                font-bold
                tracking-tight
                bg-linear-to-r from-cyan-400 to-indigo-400
                bg-clip-text text-transparent
                leading-tight
                translate-y-px
                pb-0.5
              "
            >
              BitForge
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className=" text-sm text-white/70 hover:text-white"
            >
              Login
            </Link>

            <Link
              href="/register"
              className="
                rounded-lg
                bg-linear-to-r from-cyan-400 to-indigo-500
                px-3 sm:px-4
                py-2
                text-sm font-bold
                text-black
                shadow-[0_0_30px_rgba(56,189,248,0.6)]
              "
            >
              Join BitForge
            </Link>
          </div>
        </nav>
      </motion.header>

      <section className="relative z-10 mt-4 max-w-7xl mx-auto px-5 md:px-6 pt-20 md:pt-28 pb-20 md:pb-28 grid grid-cols-1 md:grid-cols-2 gap-14 md:gap-20 items-center">
        <div>
          <h1 className="text-[36px] sm:text[36px] md:text-[64px] font-black leading-tight">
            Where Digital Products
            <span className="block mt-2 bg-linear-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">
              Take Shape
            </span>
          </h1>

          <p className="mt-5 text-base md:text-lg text-white/70 max-w-xl">
            A modern marketplace where creators launch digital products and buyers find what matters.
            Secure access, instant downloads, and real-time support — all in one place.
          </p>
        </div>

        {/* FEATURE CARD */}
        <motion.div
          whileHover={{ y: -8 }}
          transition={{ type: "spring", stiffness: 180, damping: 18 }}
          className="rounded-3xl bg-linear-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 shadow-[0_30px_100px_rgba(56,189,248,0.35)] p-6"
        >
          <div className="h-1 w-16 rounded-full bg-linear-to-r from-cyan-400 to-indigo-400 mb-3" />
          <p className="text-sm text-white/60">Featured Product</p>

          {loadingFeatured && !featuredProduct && (
            <div className="mt-4 h-24 rounded-2xl bg-white/10 animate-pulse" />
          )}

          {!loadingFeatured && !featuredProduct && (
            <>
              <h3 className="mt-3 text-xl font-semibold">
                No products available yet
              </h3>
              <p className="mt-2 text-white/70 text-sm">
                Once creators start publishing, we'll feature a live product here.
              </p>
              <div className="mt-5 flex justify-end">
                <button
                  onClick={() => router.push("/marketplace")}
                  className="bg-indigo-500 px-4 py-2 rounded-lg font-semibold hover:bg-indigo-600 transition"
                >
                  Browse Marketplace
                </button>
              </div>
            </>
          )}

          {featuredProduct && (
            <>
              {featuredProduct.thumbnailUrl && (
                <div className="w-full h-40 mt-4 mb-3 bg-black/20 rounded-2xl overflow-hidden flex items-center justify-center">
                  <img
                    src={featuredProduct.thumbnailUrl}
                    alt={featuredProduct.title}
                    className="w-full h-full object-contain"
                  />
                </div>
              )}

              <h3 className="mt-1 text-xl font-semibold line-clamp-1">
                {featuredProduct.title}
              </h3>
              <p className="mt-2 text-white/70 text-sm line-clamp-3">
                {featuredProduct.description}
              </p>

              <div className="mt-5 mb-1">
                {featuredProduct.discount > 0 ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-white/40 line-through">
                        ₹{featuredProduct.price.toLocaleString()}
                      </span>
                      <span className="text-xs bg-linear-to-r from-red-500 to-rose-500 text-white px-2 py-0.5 rounded-full font-semibold shadow-lg shadow-red-500/30">
                        -{featuredProduct.discount}% OFF
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-transparent bg-clip-text bg-linear-to-r from-cyan-300 to-indigo-300">
                      ₹{(() => {
                        const price = featuredProduct.price || 0;
                        const discount = featuredProduct.discount || 0;
                        const final =
                          discount > 0
                            ? Math.max(price - (price * discount) / 100, 0)
                            : price;
                        return final.toLocaleString();
                      })()}
                    </div>
                  </div>
                ) : (
                  <div className="text-2xl font-bold text-transparent bg-clip-text bg-linear-to-r from-cyan-300 to-indigo-300">
                    ₹{featuredProduct.price.toLocaleString()}
                  </div>
                )}
              </div>

              <div className="mt-2 flex justify-end items-center">
                <button
                  onClick={handleFeaturedBuy}
                  className="bg-indigo-500 px-4 py-2 rounded-lg font-semibold hover:bg-indigo-600 transition"
                >
                  Buy Now
                </button>
              </div>
            </>
          )}
        </motion.div>
      </section>

      <section className="relative z-10 py-16 sm:py-20 -mt-24 sm:-mt-32">
        <h2 className="text-center text-3xl md:text-4xl font-black mb-10 sm:mb-12">
          Built for Buyers & Sellers
        </h2>

        <div className="max-w-5xl mx-auto px-5 md:px-6 grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {/* BUYER CARD */}
          <motion.div
            whileHover={{ y: -6 }}
            className="
              rounded-2xl
              p-6 sm:p-8
              border border-white/10
              bg-white/5 backdrop-blur-xl
              hover:border-cyan-400
              transition-all duration-300
            "
          >
            <h3 className="text-xl sm:text-2xl font-bold mb-2">
              For Buyers
            </h3>

            <p className="text-sm sm:text-base text-white/60 mb-5 sm:mb-6">
              Discover and access digital products with zero friction.
            </p>

            <ul className="space-y-2 sm:space-y-3 text-sm sm:text-base text-white/80">
              <li>✔ No extra fees for buyers</li>
              <li>✔ Secure payments & instant downloads</li>
              <li>✔ Live help when you need it</li>
            </ul>

            <div className=" flex items-center justify-center">
              <MagneticButton
                className="
                  mt-6 sm:mt-8
                  w-50
                  rounded-xl
                  bg-linear-to-r from-cyan-400 to-indigo-500
                  px-6 py-3
                  text-sm sm:text-base
                  font-bold
                  text-black
                  shadow-[0_0_40px_rgba(56,189,248,0.6)]
                "
              >
                <Link href="register">
                  Browse Products
                </Link>
              </MagneticButton>
            </div>
          </motion.div>

          {/* SELLER CARD */}
          <motion.div
            whileHover={{ y: -6 }}
            className="
              rounded-2xl
              p-6 sm:p-8
              border border-white/10
              bg-white/5 backdrop-blur-xl
              hover:border-indigo-400
              transition-all duration-300
            "
          >
            <h3 className="text-xl sm:text-2xl font-bold mb-2">
              For Sellers
            </h3>

            <p className="text-sm sm:text-base text-white/60 mb-5 sm:mb-6">
              Launch, sell, and scale your digital products with ease.
            </p>

            <ul className="space-y-2 sm:space-y-3 text-sm sm:text-base text-white/80">
              <li>✔ Low, transparent platform fees</li>
              <li>✔ Instant withdrawals & automated payouts</li>
              <li>✔ Live help when you need it</li>
            </ul>

            <div className=" flex items-center justify-center">
              <MagneticButton
              className="
                mt-6 sm:mt-8
                w-50
                rounded-xl
                bg-linear-to-r from-cyan-400 to-indigo-500
                px-6 py-3
                text-sm sm:text-base
                font-bold
                text-black
                shadow-[0_0_40px_rgba(56,189,248,0.6)]
              "
            >
              <Link href="/register?role=seller">
                Start Selling
              </Link>
            </MagneticButton>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="relative z-10 py-20 -mt-28">
        <h2 className="text-center text-3xl md:text-4xl font-black mb-12">
          Loved by Creators
        </h2>

        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 px-5 md:px-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="rounded-2xl bg-white/5 border border-white/10 p-6 backdrop-blur-xl"
            >
              <p className="text-white/70">“{t.quote}”</p>
              <p className="mt-4 font-semibold">{t.name}</p>
              <p className="text-sm text-white/50">{t.role}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="relative z-10 py-24 text-center -mt-32">
        <h2 className="text-4xl md:text-5xl font-black">
          Build your digital empire
        </h2>
        <p className="mt-4 text-white/70">
          Join creators building the future of digital commerce.
        </p>

        <MagneticButton className="mt-8 rounded-xl bg-linear-to-r from-cyan-400 to-indigo-500 px-9 py-4 text-lg font-bold text-black shadow-[0_0_60px_rgba(56,189,248,0.6)]">
          <Link href={"/register"} >Enter Marketplace</Link>
        </MagneticButton>
      </section>

      <footer className="-mt-12 relative z-10 border-t border-white/10 bg-black/40 backdrop-blur">
        {/* subtle top glow */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/15 to-transparent" />

        <div className="mx-auto max-w-6xl px-4 md:px-6 pt-16 pb-12 sm:pt-24 sm:pb-16 space-y-8 sm:space-y-10">
          {/* Top row: columns */}
          <div className="flex flex-col md:flex-row gap-8 sm:gap-10 md:gap-16 justify-between">
            {/* BitForge column */}
            <div className="md:max-w-xs">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg font-semibold tracking-tight">BitForge</span>
                <span className="inline-flex items-center rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-white/60">
                  Digital Marketplace
                </span>
              </div>
              {/* Mobile: short one-liner for better scanability */}
              <p className="text-[13px] text-white/60 sm:hidden">
                A secure digital marketplace for creators and buyers.
              </p>
              {/* Desktop / tablet: full trust-focused paragraph */}
              <p className="hidden text-sm text-white/60 sm:block">
                A modern digital marketplace where creators sell and buyers securely purchase digital products with instant access and transparent payouts.
              </p>

              {/* Mobile-only socials directly under brand for early trust */}
              <div className="mt-4 flex items-center gap-3 text-white/60 sm:hidden">
                <span className="text-xs uppercase tracking-wide text-white/40">
                  Socials
                </span>
                <div className="flex items-center gap-3">
                  <a
                    href="https://github.com/Swapnil454"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="BitForge on GitHub"
                    className="transition duration-200 hover:text-cyan-400 hover:scale-105"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      className="h-5 w-5 fill-current"
                    >
                      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.2 11.39.6.11.82-.26.82-.58 0-.29-.01-1.05-.02-2.06-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.74.08-.74 1.2.09 1.84 1.23 1.84 1.23 1.07 1.84 2.8 1.31 3.49 1 .11-.78.42-1.31.76-1.61-2.66-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.17 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 3-.4c1.02 0 2.05.14 3 .4 2.28-1.55 3.29-1.23 3.29-1.23.66 1.65.24 2.87.12 3.17.77.84 1.23 1.91 1.23 3.22 0 4.61-2.81 5.63-5.49 5.93.43.37.81 1.1.81 2.22 0 1.6-.01 2.89-.01 3.28 0 .32.21.7.82.58C20.57 21.8 24 17.3 24 12 24 5.37 18.63 0 12 0Z" />
                    </svg>
                  </a>
                  <a
                    href="https://www.linkedin.com/in/swapnil-shelke-178096366"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="BitForge on LinkedIn"
                    className="transition duration-200 hover:text-cyan-400 hover:scale-105"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      className="h-5 w-5 fill-current"
                    >
                      <path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1 4.98 2.12 4.98 3.5zM.25 8.25h4.5V24h-4.5V8.25zM8.75 8.25h4.31v2.14h.06c.6-1.14 2.06-2.34 4.23-2.34 4.52 0 5.36 2.98 5.36 6.86V24h-4.5v-7.14c0-1.7-.03-3.88-2.36-3.88-2.36 0-2.72 1.84-2.72 3.75V24h-4.5V8.25z" />
                    </svg>
                  </a>
                  <a
                    href="https://instagram.com/bitforge.in"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="BitForge on Instagram"
                    className="transition duration-200 hover:text-cyan-400 hover:scale-105"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      className="h-5 w-5 fill-current"
                    >
                      <path d="M12 2.16c3.2 0 3.584.012 4.85.07 1.17.054 1.97.24 2.43.4.61.24 1.04.53 1.49.98.45.45.74.88.98 1.49.16.46.35 1.26.4 2.43.06 1.27.07 1.65.07 4.85s-.01 3.584-.07 4.85c-.05 1.17-.24 1.97-.4 2.43-.24.61-.53 1.04-.98 1.49-.45.45-.88.74-1.49.98-.46.16-1.26.35-2.43.4-1.27.06-1.65.07-4.85.07s-3.584-.01-4.85-.07c-1.17-.05-1.97-.24-2.43-.4-.61-.24-1.04-.53-1.49-.98-.45-.45-.74-.88-.98-1.49-.16-.46-.35-1.26-.4-2.43C2.17 15.78 2.16 15.4 2.16 12s.01-3.584.07-4.85c.05-1.17.24-1.97.4-2.43.24-.61.53-1.04.98-1.49.45-.45.88-.74 1.49-.98.46-.16 1.26-.35 2.43-.4C8.42 2.17 8.8 2.16 12 2.16m0-2.16C8.74 0 8.332.012 7.052.07 5.77.129 4.78.322 3.96.65 3.11.99 2.39 1.46 1.68 2.17.97 2.88.5 3.6.16 4.45c-.33.82-.52 1.81-.58 3.09C-.01 8.82 0 9.23 0 12c0 2.77-.01 3.18.08 4.46.06 1.28.25 2.27.58 3.09.34.85.81 1.57 1.52 2.28.71.71 1.43 1.18 2.28 1.52.82.33 1.81.52 3.09.58C8.82 23.99 9.23 24 12 24s3.18-.01 4.46-.08c1.28-.06 2.27-.25 3.09-.58.85-.34 1.57-.81 2.28-1.52.71-.71 1.18-1.43 1.52-2.28.33-.82.52-1.81.58-3.09.07-1.28.08-1.69.08-4.46s-.01-3.18-.08-4.46c-.06-1.28-.25-2.27-.58-3.09-.34-.85-.81-1.57-1.52-2.28C21.63 1.46 20.91.99 20.06.65 19.24.32 18.25.13 16.97.07 15.69.01 15.26 0 12 0z" />
                      <path d="M12 5.84A6.16 6.16 0 1 0 18.16 12 6.15 6.15 0 0 0 12 5.84zm0 10.16A4 4 0 1 1 16 12a4 4 0 0 1-4 4z" />
                      <circle cx="18.4" cy="5.6" r="1.44" />
                    </svg>
                  </a>
                  <a
                    href="https://x.com/me_swapnailed_"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="BitForge on X"
                    className="transition duration-200 hover:text-cyan-400 hover:scale-110"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      className="h-5 w-5 fill-current"
                    >
                      <path d="M3 3h4.9l4.6 6.2L18.1 3H21l-7.1 8.5L21.6 21h-4.9l-5-6.7L5.3 21H2.4l7.5-9L3 3Zm3.2 1.6 10.8 14.8h1.8L8 4.6H6.2Z"/>
                    </svg>
                  </a>
                </div>
              </div>
            </div>

            {/* Link columns */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-8 sm:gap-12 text-[13px] sm:text-sm">
              <div>
                <h4 className="mb-2 sm:mb-3 text-[11px] sm:text-xs font-bold tracking-wide text-white/60 uppercase">
                  Product
                </h4>
                <ul className="space-y-3 text-white/60">
                  <li>
                    <button
                      type="button"
                      onClick={handleFooterMarketplaceClick}
                      className="text-left text-white/60 hover:text-white hover:underline underline-offset-2 transition"
                    >
                      Marketplace
                    </button>
                  </li>
                  <li>
                    <Link href="/register" className="hover:text-white hover:underline underline-offset-2 transition">
                      For Buyers
                    </Link>
                  </li>
                  <li className="hidden sm:list-item">
                    <Link href="/register?role=seller" className="hover:text-white hover:underline underline-offset-2 transition">
                      For Sellers
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="mb-2 sm:mb-3 text-[11px] sm:text-xs font-bold tracking-wide text-white/60 uppercase">
                  Company
                </h4>
                <ul className="space-y-3 text-white/60">
                  <li>
                    <Link href="/about" className="hover:text-white hover:underline underline-offset-2 transition">
                      About Us
                    </Link>
                  </li>
                  <li>
                    <Link href="/contact" className="hover:text-white hover:underline underline-offset-2 transition">
                      Contact
                    </Link>
                  </li>
                  <li className="hidden sm:list-item">
                    <Link href="/careers" className="hover:text-white hover:underline underline-offset-2 transition">
                      Careers
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="mb-2 sm:mb-3 text-[11px] sm:text-xs font-bold tracking-wide text-white/60 uppercase">
                  Legal
                </h4>
                <ul className="space-y-3 text-white/60">
                  <li>
                    <Link href="/legal/terms-and-conditions" className="hover:text-white hover:underline underline-offset-2 transition">
                      Terms &amp; Conditions
                    </Link>
                  </li>
                  <li>
                    <Link href="/legal/privacy-policy" className="hover:text-white hover:underline underline-offset-2 transition">
                      Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <Link href="/legal/refund-cancellation-policy" className="hover:text-white hover:underline underline-offset-2 transition">
                      Refund &amp; Cancellation Policy
                    </Link>
                  </li>
                  <li>
                    <Link href="/trust-center" className="hover:text-white hover:underline underline-offset-2 transition">
                      Trust Center
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="mb-2 sm:mb-3 text-[11px] sm:text-xs font-bold tracking-wide text-white/60 uppercase">
                  Resources
                </h4>
                <ul className="space-y-3 text-white/60">
                  <li>
                    <Link href="/docs" className="hover:text-white hover:underline underline-offset-2 transition">
                      Docs
                    </Link>
                  </li>
                  <li>
                    <Link href="/status" className="hover:text-white hover:underline underline-offset-2 transition">
                      Status
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Bottom row */}
          <div className="border-t border-white/10 pt-4 space-y-3 text-xs sm:text-[13px] text-white/50">
            <p className="text-[11px] text-white/40">
              Secure payments powered by trusted payment partners.
            </p>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-1">
                <a
                  href="mailto:help@bittforge.in"
                  className="text-[13px] font-medium text-white/80 hover:text-cyan-400 hover:underline underline-offset-2 cursor-pointer transition"
                >
                  help@bittforge.in
                </a>
                <span className="text-[11px] text-white/45">
                  © {new Date().getFullYear()} BitForge. All rights reserved.
                </span>
              </div>

              <div className="hidden sm:flex items-center gap-4 text-white/60">
                <span className="text-[14px] uppercase tracking-wide text-white/40">
                  Socials
                </span>
                <div className="flex items-center gap-4">
                  <a
                    href="https://github.com/Swapnil454"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="BitForge on GitHub"
                    className="transition duration-200 hover:text-cyan-400 hover:scale-105"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      className="h-6 w-6 fill-current"
                    >
                      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.2 11.39.6.11.82-.26.82-.58 0-.29-.01-1.05-.02-2.06-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.74.08-.74 1.2.09 1.84 1.23 1.84 1.23 1.07 1.84 2.8 1.31 3.49 1 .11-.78.42-1.31.76-1.61-2.66-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.17 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 3-.4c1.02 0 2.05.14 3 .4 2.28-1.55 3.29-1.23 3.29-1.23.66 1.65.24 2.87.12 3.17.77.84 1.23 1.91 1.23 3.22 0 4.61-2.81 5.63-5.49 5.93.43.37.81 1.1.81 2.22 0 1.6-.01 2.89-.01 3.28 0 .32.21.7.82.58C20.57 21.8 24 17.3 24 12 24 5.37 18.63 0 12 0Z" />
                    </svg>
                  </a>
                  <a
                    href="https://www.linkedin.com/in/swapnil-shelke-178096366"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="BitForge on LinkedIn"
                    className="transition duration-200 hover:text-cyan-400 hover:scale-105"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      className="h-6 w-6 fill-current"
                    >
                      <path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1 4.98 2.12 4.98 3.5zM.25 8.25h4.5V24h-4.5V8.25zM8.75 8.25h4.31v2.14h.06c.6-1.14 2.06-2.34 4.23-2.34 4.52 0 5.36 2.98 5.36 6.86V24h-4.5v-7.14c0-1.7-.03-3.88-2.36-3.88-2.36 0-2.72 1.84-2.72 3.75V24h-4.5V8.25z" />
                    </svg>
                  </a>
                  <a
                    href="https://instagram.com/bitforge.in"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="BitForge on Instagram"
                    className="transition duration-200 hover:text-cyan-400 hover:scale-105"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      className="h-6 w-6 fill-current"
                    >
                      <path d="M12 2.16c3.2 0 3.584.012 4.85.07 1.17.054 1.97.24 2.43.4.61.24 1.04.53 1.49.98.45.45.74.88.98 1.49.16.46.35 1.26.4 2.43.06 1.27.07 1.65.07 4.85s-.01 3.584-.07 4.85c-.05 1.17-.24 1.97-.4 2.43-.24.61-.53 1.04-.98 1.49-.45.45-.88.74-1.49.98-.46.16-1.26.35-2.43.4-1.27.06-1.65.07-4.85.07s-3.584-.01-4.85-.07c-1.17-.05-1.97-.24-2.43-.4-.61-.24-1.04-.53-1.49-.98-.45-.45-.74-.88-.98-1.49-.16-.46-.35-1.26-.4-2.43C2.17 15.78 2.16 15.4 2.16 12s.01-3.584.07-4.85c.05-1.17.24-1.97.4-2.43.24-.61.53-1.04.98-1.49.45-.45.88-.74 1.49-.98.46-.16 1.26-.35 2.43-.4C8.42 2.17 8.8 2.16 12 2.16m0-2.16C8.74 0 8.332.012 7.052.07 5.77.129 4.78.322 3.96.65 3.11.99 2.39 1.46 1.68 2.17.97 2.88.5 3.6.16 4.45c-.33.82-.52 1.81-.58 3.09C-.01 8.82 0 9.23 0 12c0 2.77-.01 3.18.08 4.46.06 1.28.25 2.27.58 3.09.34.85.81 1.57 1.52 2.28.71.71 1.43 1.18 2.28 1.52.82.33 1.81.52 3.09.58C8.82 23.99 9.23 24 12 24s3.18-.01 4.46-.08c1.28-.06 2.27-.25 3.09-.58.85-.34 1.57-.81 2.28-1.52.71-.71 1.18-1.43 1.52-2.28.33-.82.52-1.81.58-3.09.07-1.28.08-1.69.08-4.46s-.01-3.18-.08-4.46c-.06-1.28-.25-2.27-.58-3.09-.34-.85-.81-1.57-1.52-2.28C21.63 1.46 20.91.99 20.06.65 19.24.32 18.25.13 16.97.07 15.69.01 15.26 0 12 0z" />
                      <path d="M12 5.84A6.16 6.16 0 1 0 18.16 12 6.15 6.15 0 0 0 12 5.84zm0 10.16A4 4 0 1 1 16 12a4 4 0 0 1-4 4z" />
                      <circle cx="18.4" cy="5.6" r="1.44" />
                    </svg>
                  </a>
                  <a
                    href="https://x.com/me_swapnailed_"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="BitForge on X"
                    className="transition duration-200 hover:text-cyan-400 hover:scale-110"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      className="h-6 w-6 fill-current"
                    >
                      <path d="M3 3h4.9l4.6 6.2L18.1 3H21l-7.1 8.5L21.6 21h-4.9l-5-6.7L5.3 21H2.4l7.5-9L3 3Zm3.2 1.6 10.8 14.8h1.8L8 4.6H6.2Z"/>
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>

    </main>
  );
}

function ParallaxBackground({ scrollY }: { scrollY: any }) {
  const y1 = useTransform(scrollY, [0, 600], [0, 160]);
  const y2 = useTransform(scrollY, [0, 600], [0, -160]);

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