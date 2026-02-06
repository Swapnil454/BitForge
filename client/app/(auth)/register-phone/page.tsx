"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { Eye, EyeOff, ChevronDown } from "lucide-react";
import api from "@/lib/api";
import { useRouter } from "next/navigation";

/* ================= COUNTRY CODES ================= */

const countryCodes = [
  { code: "+1", name: "United States", flag: "🇺🇸" },
  { code: "+44", name: "United Kingdom", flag: "🇬🇧" },
  { code: "+91", name: "India", flag: "🇮🇳" },
  { code: "+61", name: "Australia", flag: "🇦🇺" },
  { code: "+81", name: "Japan", flag: "🇯🇵" },
  { code: "+49", name: "Germany", flag: "🇩🇪" },
  { code: "+971", name: "UAE", flag: "🇦🇪" },
];

/* ================= PHONE FORMAT ================= */

const formatPhone = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)} ${digits.slice(5)}`;
};

export default function RegisterWithPhonePage() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("buyer");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"FORM" | "OTP">("FORM");
  const [selectedCountry, setSelectedCountry] = useState(countryCodes[2]);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowCountryDropdown(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  /* ================= LOGIC UNCHANGED ================= */

  const sendOtp = async () => {
    alert("OTP service not configured yet.");
  };

  const verifyOtp = async () => {
    const cleanPhone = phone.replace(/\D/g, "");
    await api.post("/oauth/phone/signup", {
      name,
      phone: `${selectedCountry.code}${cleanPhone}`,
      password,
      role,
      verificationToken: "placeholder",
    });
    alert("Registration successful!");
    router.push("/login");
  };

  /* ================= UI ================= */

  return (
    <div className="min-h-screen bg-[#05050a] text-white flex items-center justify-center px-4 relative overflow-hidden">

      {/* BACKGROUND GLOW */}
      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-indigo-600/30 blur-[160px]" />
      <div className="absolute top-1/2 -right-40 w-[600px] h-[600px] rounded-full bg-cyan-500/20 blur-[180px]" />

      {/* CARD */}
      <div className="relative z-10 w-full max-w-md rounded-3xl p-8 bg-white/5 backdrop-blur-xl border border-white/10 shadow-[0_30px_120px_rgba(56,189,248,0.25)]">

        {/* LOGO */}
        <div className="flex justify-center mb-5">
          <div className="h-14 w-14 rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-500 shadow-[0_0_40px_rgba(56,189,248,0.7)] flex items-center justify-center text-black font-black text-xl">
            💬
          </div>
        </div>

        <h1 className="text-2xl font-black text-center">Sign up with phone</h1>
        <p className="text-center text-sm text-white/60 mb-6">
          Create your BitForge account
        </p>

        {/* NAME */}
        <div className="mb-4">
          <label className="text-xs text-white/60">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="
              w-full mt-1
              px-3 py-2 sm:px-4 sm:py-3
              text-sm sm:text-base
              rounded-xl
              bg-white/5 border border-white/10
              outline-none
              focus:border-cyan-400
              focus:shadow-[0_0_0_2px_rgba(56,189,248,0.35)]
              transition
            "
          />
        </div>

        {/* ROLE */}
        <div className="mb-5">
          <label className="text-xs text-white/60 mb-2 block">Account type</label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { v: "buyer", l: "Buyer", i: "🛒" },
              { v: "seller", l: "Seller", i: "💼" },
              { v: "admin", l: "Admin", i: "👑" },
            ].map((r) => (
              <button
                key={r.v}
                type="button"
                onClick={() => setRole(r.v)}
                className={`rounded-xl p-3 border transition ${
                  role === r.v
                    ? "bg-cyan-400/10 border-cyan-400 text-cyan-400 shadow-[0_0_20px_rgba(56,189,248,0.35)]"
                    : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
                }`}
              >
                <div className="text-lg">{r.i}</div>
                <div className="text-xs font-semibold mt-1">{r.l}</div>
              </button>
            ))}
          </div>
        </div>

        {/* PHONE */}
        <div className="mb-4">
          <label className="text-xs text-white/60">Phone</label>
          <div className="flex gap-2 mt-1 items-center">

            {/* COUNTRY CODE (ONLY CODE SHOWN) */}
            <button
              type="button"
              onClick={() => setShowCountryDropdown(true)}
              className="
                px-3 py-2 sm:py-3
                text-sm sm:text-base
                rounded-xl
                bg-white/5 border border-white/10
                flex items-center justify-center
                transition
              "
            >
              {selectedCountry.code}
              <ChevronDown size={14} className="ml-1" />
            </button>

            {/* PHONE INPUT */}
            <input
              type="tel"
              inputMode="numeric"
              value={formatPhone(phone)}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone number"
              className="
                flex-1
                px-3 py-2 sm:px-4 sm:py-3
                text-sm sm:text-base
                rounded-xl
                bg-white/5 border border-white/10
                outline-none
                focus:border-cyan-400
                focus:shadow-[0_0_0_2px_rgba(56,189,248,0.35)]
                transition
              "
            />
          </div>
        </div>

        {/* PASSWORD */}
        <div className="mb-5">
          <label className="text-xs text-white/60">Password</label>
          <div className="relative mt-1">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create password"
              className="
                w-full
                px-3 py-2 sm:px-4 sm:py-3
                text-sm sm:text-base
                rounded-xl
                bg-white/5 border border-white/10
                pr-10
                outline-none
                focus:border-cyan-400
                focus:shadow-[0_0_0_2px_rgba(56,189,248,0.35)]
              "
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-2.5 sm:top-4 text-white/50"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* OTP */}
        {step === "OTP" && (
          <input
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="Enter OTP"
            className="w-full mb-4 px-3 py-2 sm:px-4 sm:py-3 rounded-xl bg-white/5 border border-white/10"
          />
        )}

        {/* SUBMIT */}
        <button
          onClick={step === "FORM" ? sendOtp : verifyOtp}
          className="w-full py-3 rounded-xl font-bold text-black bg-gradient-to-r from-cyan-400 to-indigo-500 shadow-[0_0_40px_rgba(56,189,248,0.6)] hover:scale-[1.02] transition"
        >
          {step === "FORM" ? "Register" : "Verify OTP"}
        </button>

        <p className="text-center text-sm text-white/60 mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-cyan-400 font-semibold">
            Login
          </Link>
        </p>
      </div>

      {showCountryDropdown && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowCountryDropdown(false)}
          />

          <div
            ref={dropdownRef}
            className="relative w-[90%] max-w-md max-h-[70vh] rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-[0_30px_100px_rgba(56,189,248,0.25)] overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-white/10">
              <h3 className="text-lg font-bold">Select country</h3>
              <p className="text-xs text-white/60">Scroll to find your country</p>
            </div>

            <div className="max-h-[50vh] overflow-y-auto divide-y divide-white/10">
              {countryCodes.map((c) => (
                <button
                  key={c.code}
                  onClick={() => {
                    setSelectedCountry(c);
                    setShowCountryDropdown(false);
                  }}
                  className="w-full px-5 py-4 flex items-center gap-4 hover:bg-white/5 transition"
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
    </div>
  );
}
