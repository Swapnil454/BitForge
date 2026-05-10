"use client";

import { useState } from "react";
import { userAPI } from "@/lib/api";
import { Mail, KeyRound, ArrowRight, Loader2, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";

interface ReactivationModalProps {
  email: string;
  onClose: () => void;
  onSuccess: (token: string, user: any) => void;
}

export default function ReactivationModal({ email, onClose, onSuccess }: ReactivationModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const requestOtp = async () => {
    setIsLoading(true);
    try {
      await userAPI.requestReactivationOtp(email);
      toast.success("Reactivation code sent to your email");
      setStep(2);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to send code");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReactivate = async () => {
    if (!otp || otp.length < 6) {
      toast.error("Please enter a valid 6-digit code");
      return;
    }
    setIsLoading(true);
    try {
      const response = await userAPI.reactivateAccount(email, otp);
      toast.success(response.message);
      onSuccess(response.token, response.user);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to reactivate account");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-white dark:bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md p-8 rounded-2xl bg-slate-50 dark:bg-[#0a0a0f] border border-cyan-500/30 shadow-[0_0_60px_-15px_rgba(34,211,238,0.2)] relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-cyan-500/10 blur-[50px] rounded-full pointer-events-none" />

        <div className="relative z-10">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center mb-6 border border-cyan-500/20">
            <RefreshCw className="w-6 h-6 text-cyan-400" />
          </div>

          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Reactivate Account</h2>
          <p className="text-slate-500 dark:text-white/60 text-sm mb-6">
            Your account is currently deactivated. Would you like to restore it?
          </p>

          {step === 1 ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center gap-3">
                <Mail className="w-5 h-5 text-slate-400 dark:text-white/40" />
                <span className="text-slate-900 dark:text-white font-medium">{email}</span>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 px-4 rounded-xl font-semibold text-slate-900 dark:text-white bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={requestOtp}
                  disabled={isLoading}
                  className="flex-1 py-3 px-4 rounded-xl font-semibold text-black bg-cyan-400 hover:bg-cyan-300 transition-colors flex items-center justify-center gap-2"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Send Code"}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-white/40" />
                <input
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full pl-12 pr-4 py-3 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white outline-none focus:border-cyan-400/50 focus:bg-slate-200 dark:focus:bg-white/10 transition-all font-mono text-lg tracking-widest"
                />
              </div>

              <div className="flex justify-between items-center px-1">
                <button onClick={requestOtp} className="text-xs text-cyan-400 hover:text-cyan-300">
                  Resend Code
                </button>
                <button onClick={() => setStep(1)} className="text-xs text-slate-400 dark:text-white/40 hover:text-slate-700 dark:hover:text-white/80">
                  Back
                </button>
              </div>

              <div className="pt-4">
                <button
                  onClick={handleReactivate}
                  disabled={isLoading || otp.length < 6}
                  className="w-full py-3 px-4 rounded-xl font-semibold text-black bg-gradient-to-r from-cyan-400 to-blue-500 hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(34,211,238,0.3)]"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                    <>
                      Reactivate <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
