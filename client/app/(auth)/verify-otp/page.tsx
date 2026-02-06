
"use client";

import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Suspense, useRef, useState, useEffect } from "react";
import toast from "react-hot-toast";
import { authAPI } from "@/lib/api";
import { removeCookie, setCookie } from "@/lib/cookies";

function VerifyOtpPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [email, setEmail] = useState<string | null>(null);
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [resendDisabled, setResendDisabled] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [shake, setShake] = useState(false);

  const inputsRef = useRef<HTMLInputElement[]>([]);

  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (!emailParam) {
      router.push("/register");
      return;
    }
    setEmail(emailParam);
  }, [searchParams, router]);

  useEffect(() => {
    if (countdown === 0) {
      setResendDisabled(false);
      return;
    }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleChange = (value: string, index: number) => {
    if (!/^\d?$/.test(value)) return;

    const updated = [...otp];
    updated[index] = value;
    setOtp(updated);

    if (value && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleBackspace = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const paste = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (paste.length < 6) return;

    const next = paste.split("");
    setOtp(next);

    next.forEach((v, i) => {
      if (inputsRef.current[i]) {
        inputsRef.current[i].value = v;
      }
    });

    inputsRef.current[5]?.focus();
  };

  const handleVerify = async () => {
    if (otp.join("").length !== 6) {
      triggerShake();
      toast.error("Please enter the 6-digit code");
      return;
    }

    const loadingToast = toast.loading("Verifying your email...");

    try {
      const result = await authAPI.verifyOtp(email!, otp.join(""));
      toast.dismiss(loadingToast);

      if (result.user && result.token) {
        setCookie("token", result.token, 7);
        setCookie("user", JSON.stringify(result.user), 7);
      } else if (result.user) {
        removeCookie("token");
        setCookie("user", JSON.stringify(result.user), 7);
      }

      setShowSuccess(true);

      setTimeout(() => {
        const role = result.user?.role || "buyer";
        router.push(`/dashboard/${role}`);
      }, 900);
    } catch (err: any) {
      toast.dismiss(loadingToast);
      triggerShake();
      toast.error(err.response?.data?.message || "Invalid verification code");
    }
  };

  const handleResendOtp = async () => {
    if (resendDisabled) return;

    const loadingToast = toast.loading("Sending new code...");
    try {
      setResendDisabled(true);
      await authAPI.resendOtp(email!);

      toast.dismiss(loadingToast);
      toast.success("New verification code sent!");

      setOtp(Array(6).fill(""));
      inputsRef.current[0]?.focus();
      setCountdown(60);
    } catch (err: any) {
      toast.dismiss(loadingToast);
      toast.error(err.response?.data?.message || "Failed to resend code");
      setResendDisabled(false);
    }
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };


  if (!email) {
    return (
      <div className="min-h-screen bg-[#05050a] text-white flex items-center justify-center px-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#05050a] text-white flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-indigo-600/30 blur-[160px]" />
      <div className="absolute top-1/2 -right-40 w-[600px] h-[600px] rounded-full bg-cyan-500/20 blur-[180px]" />

      <div className={`relative z-10 w-full max-w-md rounded-3xl p-8 bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg text-center ${shake ? "animate-[shake_0.4s]" : ""}`}>
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

        <h1 className="text-2xl font-black text-center -mt-5 sm:-mt-8 lg:-mt-12 leading-none">Verify your email</h1>
        <p className="text-center text-sm text-white/60 mb-4 mt-1">
          Enter the 6-digit code sent to<br />
          <span className="text-cyan-400 font-semibold">{email}</span>
        </p>

        <div className="flex justify-center gap-2 mt-8 mb-6">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                if (el) inputsRef.current[index] = el;
              }}
              defaultValue={digit}
              onChange={(e) => handleChange(e.target.value, index)}
              onKeyDown={(e) => handleBackspace(e, index)}
              onPaste={handlePaste}
              maxLength={1}
              inputMode="numeric"
              className="w-11 h-12 text-center text-lg font-bold rounded-xl bg-white/5 border border-white/10 outline-none focus:border-cyan-400 focus:shadow-lg transition"
            />
          ))}
        </div>

        <button
          onClick={handleVerify}
          className="w-full py-3 rounded-xl font-bold text-black bg-gradient-to-r from-cyan-400 to-indigo-500 shadow-lg hover:scale-[1.02] transition"
        >
          Verify email
        </button>

        <div className="flex justify-between text-sm mt-6 text-white/60">
          <button
            onClick={handleResendOtp}
            disabled={resendDisabled}
            className={`font-semibold ${resendDisabled ? "text-white/30 cursor-not-allowed" : "text-cyan-400 hover:underline"}`}
          >
            {resendDisabled ? `Resend in ${countdown}s` : "Resend code"}
          </button>
          <button onClick={() => router.push("/login")} className="hover:underline">
            Back to login
          </button>
        </div>
      </div>

      {showSuccess && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70">
          <div className="px-10 py-8 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/10 text-center shadow-lg">
            <div className="text-4xl mb-3">✅</div>
            <p className="text-xl font-black text-cyan-400">Email verified!</p>
            <p className="text-sm text-white/60 mt-1">Redirecting to dashboard…</p>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes shake {
          0% { transform: translateX(0); }
          25% { transform: translateX(-6px); }
          50% { transform: translateX(6px); }
          75% { transform: translateX(-6px); }
          100% { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}

function VerifyOtpFallback() {
  return (
    <div className="min-h-screen bg-[#05050a] text-white flex items-center justify-center px-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<VerifyOtpFallback />}>
      <VerifyOtpPageContent />
    </Suspense>
  );
}
