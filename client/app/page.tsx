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
              <Link href="register">
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

      {/* <footer className="relative z-10 py-8 text-center text-sm text-white/40 -mt-18">
          <p>help@bittforge.in</p>
        © {new Date().getFullYear()} BitForge — Built for the future
      </footer> */}
      <footer className=" -mt-12 relative z-10 border-t border-white/10 bg-black/30 backdrop-blur py-8">
  <div className="mx-auto max-w-6xl px-4 text-center text-sm text-white/50">
    
    {/* Email */}
    <p className="mb-2">
      <a
        href="mailto:help@bitforge.in"
        className="hover:text-white transition"
      >
        help@bitforge.in
      </a>
    </p>

    {/* Tagline */}
    <p className="mb-1 tracking-wide">
      Built for the future
    </p>

    {/* Copyright */}
    <p className="text-xs text-white/40">
      © {new Date().getFullYear()} <span className="font-semibold text-white/70">BitForge</span>. All rights reserved.
    </p>

  </div>

  {/* subtle top glow */}
  <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
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