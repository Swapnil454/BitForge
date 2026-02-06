"use client";

import Link from "next/link";
import Image from "next/image";
import { Suspense, useState, useRef, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Eye, EyeOff, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import { authAPI } from "@/lib/api";

function ResetPasswordPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get("email") || "";

  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);

  const inputsRef = useRef<HTMLInputElement[]>([]);


  useEffect(() => {
    if (resendTimer === 0) return;
    const i = setInterval(() => setResendTimer(t => t - 1), 1000);
    return () => clearInterval(i);
  }, [resendTimer]);


  const handleOtpChange = (value: string, index: number) => {
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
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length !== 6) return;
    setOtp(pasted.split(""));
    setTimeout(() => inputsRef.current[5]?.focus(), 100);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    const otpCode = otp.join("");

    if (otpCode.length !== 6) {
      toast.error("Enter 6-digit reset code");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      const res = await authAPI.resetPassword(email, otpCode, newPassword);
      toast.success(res.message || "Password reset successful!");

      setShowSuccess(true);

      setTimeout(() => {
        router.push("/login");
      }, 1200);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Reset failed");
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendTimer > 0) return;

    try {
      await authAPI.forgotPassword(email);
      toast.success("New code sent!");
      setOtp(Array(6).fill(""));
      inputsRef.current[0]?.focus();
      setResendTimer(30);
    } catch {
      toast.error("Failed to resend code");
    }
  };

  if (!email) {
    return (
      <div className="min-h-screen bg-[#05050a] grid place-items-center text-white">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
          <p className="text-white/70 mb-4">Invalid reset request</p>
          <Link href="/forgot-password" className="text-cyan-400 font-semibold">
            Go back
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#05050a] text-white flex items-center justify-center px-4 relative overflow-hidden">

      {/* BACKGROUND GLOW */}
      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-indigo-600/30 rounded-full blur-[160px]" />
      <div className="absolute top-1/2 -right-40 w-[600px] h-[600px] bg-cyan-500/20 rounded-full blur-[180px]" />

      {/* SUCCESS OVERLAY */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm grid place-items-center">
          <div className="flex flex-col items-center gap-4 animate-[scaleIn_0.4s_ease-out]">
            <CheckCircle2 size={72} className="text-cyan-400" />
            <p className="text-xl font-bold">Password reset successful</p>
            <p className="text-sm text-white/60">Redirecting to login…</p>
          </div>
        </div>
      )}

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

        <h1 className="text-2xl font-black text-center -mt-5 sm:-mt-8 lg:-mt-12 leading-none">Reset password</h1>
        <p className="text-center text-sm text-white/60 mb-4 mt-1">
          Enter the code sent to <br />
          <span className="text-cyan-400 font-semibold">{email}</span>
        </p>

        <form onSubmit={handleResetPassword} className="space-y-5">

          {/* OTP */}
          <div>
            <label className="text-xs text-white/60 mb-2 block">Reset code</label>
            <div className="flex justify-center gap-2">
              {otp.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    if (el) inputsRef.current[i] = el;
                  }}
                  value={d}
                  onChange={e => handleOtpChange(e.target.value, i)}
                  onKeyDown={e => handleBackspace(e, i)}
                  onPaste={handlePaste}
                  maxLength={1}
                  inputMode="numeric"
                  disabled={isLoading}
                  className="
                    w-11 h-12 text-center text-lg font-bold
                    rounded-xl bg-white/5 border border-white/10
                    outline-none focus:border-cyan-400
                    focus:shadow-[0_0_0_2px_rgba(56,189,248,0.35)]
                    transition
                  "
                />
              ))}
            </div>
          </div>

          {/* PASSWORD */}
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="New password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 pr-10 outline-none focus:border-cyan-400 focus:shadow-[0_0_0_2px_rgba(56,189,248,0.35)]"
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className="absolute right-3 top-3 text-white/50"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {/* CONFIRM */}
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 pr-10 outline-none focus:border-cyan-400 focus:shadow-[0_0_0_2px_rgba(56,189,248,0.35)]"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(v => !v)}
              className="absolute right-3 top-3 text-white/50"
            >
              {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {/* SUBMIT */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl font-bold text-black
              bg-gradient-to-r from-cyan-400 to-indigo-500
              shadow-[0_0_40px_rgba(56,189,248,0.6)]
              hover:scale-[1.02] transition"
          >
            {isLoading ? "Resetting..." : "Reset password"}
          </button>
        </form>

        {/* RESEND */}
        <p className="text-center text-sm text-white/60 mt-5">
          {resendTimer > 0 ? (
            <>Resend in <span className="text-cyan-400 font-semibold">{resendTimer}s</span></>
          ) : (
            <>
              Didn't receive code?{" "}
              <button onClick={handleResendCode} className="text-cyan-400 font-semibold hover:underline">
                Resend
              </button>
            </>
          )}
        </p>

        <p className="text-center text-sm text-white/60 mt-4">
          <Link href="/login" className="text-cyan-400 font-semibold">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}

function ResetPasswordFallback() {
  return (
    <div className="min-h-screen bg-[#05050a] grid place-items-center text-white">
      <div className="h-10 w-10 border-4 border-white/20 border-t-cyan-400 rounded-full animate-spin" />
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordFallback />}>
      <ResetPasswordPageContent />
    </Suspense>
  );
}
