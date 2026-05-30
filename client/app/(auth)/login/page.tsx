
"use client";

import Link from "next/link";
import Image from "next/image";
import { Suspense, useState, useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, ChevronDown } from "lucide-react";
import { FaGoogle, FaGithub } from "react-icons/fa";
import toast from "react-hot-toast";
import { authAPI } from "@/lib/api";
import { setCookie, removeCookie, getCookie, getStoredUser } from "@/lib/cookies";
import BannedModal from "@/app/components/BannedModal";
import ReactivationModal from "@/app/components/ReactivationModal";

/* ================= COUNTRY CODES ================= */

const countryCodes = [
  { code: "+1", name: "United States", flag: "🇺🇸" },
  { code: "+44", name: "United Kingdom", flag: "🇬🇧" },
  { code: "+91", name: "India", flag: "🇮🇳" },
  { code: "+61", name: "Australia", flag: "🇦🇺" },
  { code: "+81", name: "Japan", flag: "🇯🇵" },
  { code: "+49", name: "Germany", flag: "🇩🇪" },
  { code: "+33", name: "France", flag: "🇫🇷" },
  { code: "+971", name: "UAE", flag: "🇦🇪" },
];

/* ================= PHONE FORMATTER ================= */

const formatPhone = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)} ${digits.slice(5)}`;
};

/* ================= PAGE ================= */

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams?.get("next") || null;
  const { setTheme } = useTheme();

  const [showPassword, setShowPassword] = useState(false);
  const [loginMethod, setLoginMethod] = useState<"email" | "phone">("email");
  const [formData, setFormData] = useState({ email: "", phone: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);

  const [showRoleBadge, setShowRoleBadge] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [userRole, setUserRole] = useState<"buyer" | "seller" | "admin">("buyer");

  const [selectedCountry, setSelectedCountry] = useState(countryCodes[2]);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);

  // Status Modals
  const [showBannedModal, setShowBannedModal] = useState(false);
  const [bannedReason, setBannedReason] = useState("");
  const [showReactivationModal, setShowReactivationModal] = useState(false);
  const [reactivationEmail, setReactivationEmail] = useState("");

  const dropdownRef = useRef<HTMLDivElement>(null);

  const getDefaultRouteForUser = (user: any) => {
    const role = user?.role || "buyer";
    const isSellerApproved =
      user?.approvalStatus === "approved" || user?.isApproved === true;

    if (role === "buyer") return "/marketplace";
    if (role === "seller" && !isSellerApproved) return "/pending-approval";
    return `/dashboard/${role}`;
  };

  /* ================= AUTH CHECK ================= */
  useEffect(() => {
    const token = getCookie('token');
    const user = getStoredUser();
    if (token) {
      const role = user?.role || 'buyer';
      if (role === 'buyer' && nextPath) {
        router.replace(nextPath);
        return;
      }

      router.replace(getDefaultRouteForUser(user));
    }
  }, [router, nextPath]);

  /* ================= OUTSIDE CLICK ================= */

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowCountryDropdown(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  /* ================= HANDLERS ================= */

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(p => ({ ...p, [name]: value }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanPhone = formData.phone.replace(/\D/g, "");
    const loginId =
      loginMethod === "email"
        ? formData.email
        : `${selectedCountry.code}${cleanPhone}`;

    if (!loginId || !formData.password) {
      toast.error("Please fill all fields");
      return;
    }

    setIsLoading(true);

    try {
      const response = await authAPI.login(loginId, formData.password);

      setCookie("token", response.token, 7);
      setCookie("user", JSON.stringify(response.user), 7);
      
      if (response.user.theme) {
        setTheme(response.user.theme);
      }

      const role = response.user.role || "buyer";
      setUserRole(role);
      setShowRoleBadge(true);

      setTimeout(() => {
        setShowRoleBadge(false);
        setShowSkeleton(true);
      }, 800);

      setTimeout(() => {
        const isMarketplaceNext = nextPath && nextPath.startsWith("/marketplace/");

        if (nextPath && role === "buyer") {
          router.replace(nextPath);
          return;
        }

        if (isMarketplaceNext && role !== "buyer") {
          toast.error("Please log in as a buyer to purchase. Redirecting to your dashboard.");
        }

        router.replace(getDefaultRouteForUser(response.user));
      }, 1400);
    } catch (err: any) {
      const errResponse = err.response?.data;
      
      if (err.response?.status === 403) {
        if (errResponse?.accountStatus === 'banned') {
          if (errResponse?.token && errResponse?.user) {
            setCookie("token", errResponse.token, 7);
            setCookie("user", JSON.stringify(errResponse.user), 7);
          }
          setBannedReason(errResponse.bannedReason || "");
          setShowBannedModal(true);
          setIsLoading(false);
          return;
        }
        if (errResponse?.accountStatus === 'deleted') {
          setReactivationEmail(errResponse.email || formData.email);
          setShowReactivationModal(true);
          setIsLoading(false);
          return;
        }
      }

      toast.error(errResponse?.message || "Login failed");
      setIsLoading(false);
    }
  };

  const handleReactivationSuccess = (token: string, user: any) => {
    setShowReactivationModal(false);
    setCookie("token", token, 7);
    setCookie("user", JSON.stringify(user), 7);
    
    const role = user.role || "buyer";
    setUserRole(role);
    setShowRoleBadge(true);

    setTimeout(() => {
      setShowRoleBadge(false);
      setShowSkeleton(true);
    }, 800);

    setTimeout(() => {
      router.push(getDefaultRouteForUser(user));
    }, 1400);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#05050a] text-slate-900 dark:text-white flex items-center justify-center px-4 relative overflow-hidden">

      {/* BACKGROUND GLOW */}
      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-indigo-600/30 blur-[160px]" />
      <div className="absolute top-1/2 -right-40 w-[600px] h-[600px] rounded-full bg-cyan-500/20 blur-[180px]" />

      {/* CARD */}
      <div className="relative z-10 w-full max-w-md rounded-3xl p-8 bg-slate-100 dark:bg-white/5 backdrop-blur-xl border border-slate-200 dark:border-white/10 shadow-[0_30px_120px_rgba(56,189,248,0.25)]">

        {/* LOGO */}
        <div className="flex flex-col items-center justify-center ">
          <Image
            src="/bitforge_logo1.png"
            alt="BitForge logo"
            width={512}
            height={512}
            className="
              h-24        
              sm:h-32    
              md:h-40    
              lg:h-48     
              w-auto
              object-contain
              -mt-8
              block
            "
            priority
          />
        </div>

        <h1 className="text-2xl font-black text-center -mt-5 sm:-mt-8 lg:-mt-12 leading-none">Welcome back</h1>
        <p className="text-center text-sm text-slate-500 dark:text-white/60 mb-4 mt-1">
          Login to your <span className="font-semibold">BitForge</span> account
        </p>

        <form onSubmit={handleLogin} className="space-y-4">

          {/* METHOD SWITCH */}
          <div className="flex bg-slate-100 dark:bg-white/5 rounded-xl p-1">
            {["email", /* "phone" */].map(m => (
              <button
                key={m}
                type="button"
                onClick={() => setLoginMethod(m as any)}
                suppressHydrationWarning
                className={`flex-1 py-2 text-sm rounded-lg transition ${
                  loginMethod === m ? "bg-white text-black font-semibold" : "text-slate-500 dark:text-white/60"
                }`}
              >
                {m === "email" ? "Email" : "Phone"}
              </button>
            ))}
          </div>

          {/* EMAIL */}
          {loginMethod === "email" && (
            <input
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleInputChange}
              suppressHydrationWarning
              className="
                w-full px-3 py-2 sm:px-4 sm:py-3
                text-sm sm:text-base
                rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10
                outline-none focus:border-cyan-400
                focus:shadow-[0_0_0_2px_rgba(56,189,248,0.35)]
                transition
              "
            />
          )}

          {/* PHONE */}
          {/* {loginMethod === "phone" && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowCountryDropdown(true)}
                className="
                  px-3 py-2 sm:py-3
                  text-sm sm:text-base
                  rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10
                  flex items-center justify-center
                "
              >
                {selectedCountry.code}
                <ChevronDown size={14} className="ml-1" />
              </button>

              <input
                name="phone"
                inputMode="numeric"
                placeholder="Phone number"
                value={formatPhone(formData.phone)}
                onChange={e =>
                  setFormData(p => ({ ...p, phone: e.target.value }))
                }
                className="
                  flex-1 px-3 py-2 sm:px-4 sm:py-3
                  text-sm sm:text-base
                  rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10
                  outline-none focus:border-cyan-400
                  focus:shadow-[0_0_0_2px_rgba(56,189,248,0.35)]
                  transition
                "
              />
            </div>
          )} */}

          {/* PASSWORD */}
          <div className="relative">
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={formData.password}
              onChange={handleInputChange}
              suppressHydrationWarning
              className="
                w-full px-3 py-2 sm:px-4 sm:py-3
                text-sm sm:text-base
                rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10
                pr-10 outline-none focus:border-cyan-400
                focus:shadow-[0_0_0_2px_rgba(56,189,248,0.35)]
                transition
              "
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              suppressHydrationWarning
              className="absolute right-3 top-2.5 sm:top-3.5 text-white/50"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {/* SUBMIT */}
          <button
            type="submit"
            disabled={isLoading}
            suppressHydrationWarning
            className="w-full py-3 rounded-xl font-bold text-black bg-gradient-to-r from-cyan-400 to-indigo-500 shadow-[0_0_40px_rgba(56,189,248,0.6)] hover:scale-[1.02] transition"
          >
            {isLoading ? "Logging in..." : "Continue"}
          </button>

          {/*FORGOT PASSWORD (NEW) */}
          <div className="text-center">
            <Link
              href="/forgot-password"
              className="text-sm text-cyan-400 hover:underline"
            >
              Forgot your password?
            </Link>
          </div>
        </form>

        {/* OAUTH */}
        <div className="mt-6 space-y-3">
          <OAuthButton icon={<FaGoogle />} label="Google" />
          <OAuthButton icon={<FaGithub />} label="GitHub" />
        </div>

        <p className="text-center text-sm text-slate-500 dark:text-white/60 mt-6">
          New here?{" "}
          <Link href="/register" className="text-cyan-400 font-semibold">
            Create account
          </Link>
        </p>
      </div>

      {/* COUNTRY MODAL */}
      {showCountryDropdown && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-white dark:bg-black/60" onClick={() => setShowCountryDropdown(false)} />
          <div
            ref={dropdownRef}
            className="relative w-[90%] max-w-md max-h-[70vh] rounded-2xl bg-slate-100 dark:bg-white/5 backdrop-blur-xl border border-slate-200 dark:border-white/10 overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-slate-200 dark:border-white/10">
              <h3 className="text-lg font-bold">Select country</h3>
            </div>
            <div className="max-h-[50vh] overflow-y-auto divide-y divide-white/10">
              {countryCodes.map(c => (
                <button
                  key={c.code}
                  onClick={() => {
                    setSelectedCountry(c);
                    setShowCountryDropdown(false);
                  }}
                  className="w-full px-5 py-4 flex items-center gap-4 hover:bg-slate-100 dark:hover:bg-white/5"
                >
                  <span className="text-xl">{c.flag}</span>
                  <span className="flex-1 text-left">{c.name}</span>
                  <span className="text-cyan-400 font-semibold">{c.code}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ROLE BADGE */}
      {showRoleBadge && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-white dark:bg-black/70">
          <div className="px-8 py-4 rounded-2xl bg-slate-200 dark:bg-white/10 backdrop-blur-xl border border-slate-200 dark:border-white/10 text-xl font-black">
            {userRole.toUpperCase()} MODE
          </div>
        </div>
      )}

      {/* SKELETON */}
      {showSkeleton && (
        <div className="fixed inset-0 z-40 bg-slate-50 dark:bg-[#05050a] p-6 space-y-6">
          <div className="h-8 w-40 bg-slate-200 dark:bg-white/10 rounded animate-pulse" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-24 bg-slate-100 dark:bg-white/5 rounded-xl animate-pulse" />
            <div className="h-24 bg-slate-100 dark:bg-white/5 rounded-xl animate-pulse" />
          </div>
          <div className="h-64 bg-slate-100 dark:bg-white/5 rounded-xl animate-pulse" />
        </div>
      )}

      {/* MODALS */}
      {showBannedModal && (
        <BannedModal 
          bannedReason={bannedReason} 
          onClose={() => setShowBannedModal(false)} 
        />
      )}
      
      {showReactivationModal && (
        <ReactivationModal 
          email={reactivationEmail} 
          onClose={() => setShowReactivationModal(false)} 
          onSuccess={handleReactivationSuccess}
        />
      )}
    </div>
  );
}

function LoginPageFallback() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#05050a] text-slate-900 dark:text-white flex items-center justify-center px-4">
      <div className="text-sm text-slate-600 dark:text-white/70">Loading login...</div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageFallback />}>
      <LoginPageContent />
    </Suspense>
  );
}


function OAuthButton({ icon, label }: any) {
  return (
    <button
      type="button"
      onClick={() =>
        (window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/oauth/${label.toLowerCase()}`)
      }
      suppressHydrationWarning
      className="w-full flex items-center justify-center gap-3 py-3 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10 transition"
    >
      {icon}
      <span className="text-sm font-semibold">Continue with {label}</span>
    </button>
  );
}
