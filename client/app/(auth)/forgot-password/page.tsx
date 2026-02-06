

"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { authAPI } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    setIsLoading(true);

    try {
      const response = await authAPI.forgotPassword(email);
      toast.success(response.message || "Reset code sent to your email!");

      router.push(`/reset-password?email=${encodeURIComponent(email)}`);
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          "Failed to send reset code. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#05050a] text-white flex items-center justify-center px-4 relative overflow-hidden">

      {/* BACKGROUND GLOW */}
      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-indigo-600/30 blur-[160px]" />
      <div className="absolute top-1/2 -right-40 w-[600px] h-[600px] rounded-full bg-cyan-500/20 blur-[180px]" />

      {/* CARD */}
      <div className="relative z-10 w-full max-w-md rounded-3xl p-8
        bg-white/5 backdrop-blur-xl border border-white/10
        shadow-[0_30px_120px_rgba(56,189,248,0.25)]
      ">

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

        <h1 className="text-2xl font-black text-center -mt-5 sm:-mt-8 lg:-mt-12 leading-none">Forgot password</h1>
        <p className="text-center text-sm text-white/60 mb-4 mt-1">
          Enter your email and we'll send a reset code
        </p>

        {/* FORM */}
        <form onSubmit={handleForgotPassword} className="space-y-5">

          {/* EMAIL */}
          <div>
            <label className="text-xs text-white/60">
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              disabled={isLoading}
              className="
                w-full mt-1
                px-4 py-3
                text-sm
                rounded-xl
                bg-white/5 border border-white/10
                outline-none
                focus:border-cyan-400
                focus:shadow-[0_0_0_2px_rgba(56,189,248,0.35)]
                transition
                disabled:opacity-50
              "
            />
          </div>

          {/* SUBMIT */}
          <button
            type="submit"
            disabled={isLoading}
            className="
              w-full py-3 rounded-xl
              font-bold text-black
              bg-gradient-to-r from-cyan-400 to-indigo-500
              shadow-[0_0_40px_rgba(56,189,248,0.6)]
              hover:scale-[1.02]
              transition
              disabled:opacity-60
            "
          >
            {isLoading ? "Sending..." : "Send reset code"}
          </button>
        </form>

        {/* BACK TO LOGIN */}
        <p className="text-center text-sm text-white/60 mt-6">
          Remembered your password?{" "}
          <Link href="/login" className="text-cyan-400 font-semibold">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
