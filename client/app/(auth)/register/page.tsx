

"use client";

import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { FaGoogle, FaGithub } from "react-icons/fa";
import { FiPhone } from "react-icons/fi";
import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { authAPI } from "@/lib/api";
import Image from "next/image";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("buyer");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password) {
      toast.error("Please fill all fields");
      return;
    }

    const loadingToast = toast.loading("Creating your account...");
    try {
      setLoading(true);
      await authAPI.register(name, email, password, role);
      toast.dismiss(loadingToast);
      toast.success("Registration successful! Verify your email.");
      
      setTimeout(() => {
        router.push(`/verify-otp?email=${encodeURIComponent(email)}`);
      }, 500);
    } catch (err: any) {
      toast.dismiss(loadingToast);
      toast.error(err.response?.data?.message || "Something went wrong");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#05050a] text-white flex items-center justify-center px-4 relative overflow-hidden">

      {/* BACKGROUND GLOW */}
      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-indigo-600/30 blur-[160px]" />
      <div className="absolute top-1/2 -right-40 w-[600px] h-[600px] rounded-full bg-cyan-500/20 blur-[180px]" />

      {/* CARD */}
      <div className="relative z-10 mt-10 mb-10 w-full max-w-md rounded-3xl p-8 bg-white/5 backdrop-blur-xl border border-white/10 shadow-[0_30px_120px_rgba(56,189,248,0.25)]">

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

        <h1 className="text-2xl font-black text-center -mt-5 sm:-mt-8 lg:-mt-12 leading-none">Create account</h1>
        <p className="text-center text-sm text-white/60 mb-2 mt-1">
          Join <span className="font-semibold">BitForge</span> and start building
        </p>

        {/* NAME */}
        <div className="mb-4">
          <label className="text-xs text-white/60">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="w-full mt-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 outline-none focus:border-cyan-400 focus:shadow-[0_0_0_2px_rgba(56,189,248,0.35)] transition"
          />
        </div>

        {/* ROLE */}
        <div className="mb-4">
          <label className="text-xs text-white/60 mb-2 block">
            Account type
          </label>

          <div className="grid grid-cols-2 gap-3">
            {[
              { v: "buyer", l: "Buyer", i: "🛒" },
              { v: "seller", l: "Seller", i: "💼" },
              // { v: "admin", l: "Admin", i: "👑" },
            ].map((r) => (
              <button
                key={r.v}
                type="button"
                onClick={() => setRole(r.v)}
                className={`rounded-xl px-3 py-3 border transition flex items-center justify-center gap-2 ${
                  role === r.v
                    ? "bg-cyan-400/10 border-cyan-400 text-cyan-400 shadow-[0_0_20px_rgba(56,189,248,0.35)]"
                    : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
                }`}
              >
                <span className="text-lg leading-none">{r.i}</span>
                <span className="text-sm font-semibold leading-none">
                  {r.l}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* EMAIL */}
        <div className="mb-4">
          <label className="text-xs text-white/60">Email</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            className="w-full mt-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 outline-none focus:border-cyan-400 focus:shadow-[0_0_0_2px_rgba(56,189,248,0.35)] transition"
          />
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
              disabled={loading}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 pr-10 outline-none focus:border-cyan-400 focus:shadow-[0_0_0_2px_rgba(56,189,248,0.35)] transition disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              disabled={loading}
              className="absolute right-3 mt-1 top-3 text-white/50"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* REGISTER */}
        <button
          onClick={handleRegister}
          disabled={loading}
          className="w-full py-3 rounded-xl font-bold text-black bg-gradient-to-r from-cyan-400 to-indigo-500 shadow-[0_0_40px_rgba(56,189,248,0.6)] hover:scale-[1.02] transition"
        >
          {loading ? "Sending OTP..." : "Register"}
        </button>

        {/* DIVIDER */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-xs text-white/40">OR</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* OAUTH */}
        <div className="space-y-3">
          {/* <Link href="/register-phone">
            <button className="w-full mb-3 flex items-center justify-center gap-3 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition">
              <FiPhone /> Continue with Phone
            </button>
          </Link> */}

          <OAuthButton label="Google" role={role} />
          <OAuthButton label="GitHub" role={role} />
        </div>

        <p className="text-center text-sm text-white/60 mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-cyan-400 font-semibold">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}


function OAuthButton({ label, role }: any) {
  return (
    <button
      onClick={() =>
        (window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/oauth/${label.toLowerCase()}?role=${role}`)
      }
      className="w-full flex items-center justify-center gap-3 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:shadow-[0_0_30px_rgba(255,255,255,0.15)] transition"
    >
      {label === "Google" ? <FaGoogle /> : <FaGithub />}
      Continue with {label}
    </button>
  );
}
