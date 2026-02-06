
"use client";

import { useState} from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

import { clearAuthStorage} from "@/lib/cookies";
import { userAPI } from "@/lib/api";
import toast from "react-hot-toast";

interface SettingsModalProps {
  user: any;
  onClose: () => void;
  allowDelete?: boolean; 
}


export default function SettingsModal({ user, onClose, allowDelete = true}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<"menu" | "password" | "reset" | "delete">("menu");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState(user.email);
  const [otp, setOtp] = useState("");
  const [showOtpField, setShowOtpField] = useState(false);
  const [loading, setLoading] = useState(false);
  const [delOtpSent, setDelOtpSent] = useState(false);
  const [delOtp, setDelOtp] = useState("");
  const [delReason, setDelReason] = useState("");
  const router = useRouter();

  const handleUpdatePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill all fields");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    try {
      setLoading(true);
      await userAPI.changePassword(oldPassword, newPassword, confirmPassword);
      toast.success("Password updated successfully");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    try {
      setLoading(true);
      await userAPI.requestPasswordReset(user.email);
      setShowOtpField(true);
      toast.success("OTP sent to your email. Valid for 15 minutes");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword || !otp) {
      toast.error("Please fill all fields");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    try {
      setLoading(true);
      await userAPI.resetPassword(user.email, otp, newPassword, confirmPassword);
      toast.success("Password reset successfully");
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-linear-to-br from-slate-800/80 via-slate-900/80 to-slate-800/80 border border-white/20 rounded-2xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto shadow-2xl shadow-indigo-500/20"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Settings</h2>
            <p className="text-xs text-white/70">Security and account options</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-lg bg-white/20 hover:bg-white/30 text-white/80 hover:text-white transition grid place-items-center"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Options Menu */}
        {activeTab === "menu" && (
          <div className="grid gap-3">
            <button
              onClick={() => setActiveTab("password")}
              className="w-full text-left px-4 py-3 rounded-2xl bg-linear-to-r from-cyan-500/15 to-blue-500/15 hover:from-cyan-500/25 hover:to-blue-500/25 border border-cyan-400/30 hover:border-cyan-400/50 transition flex items-center justify-between shadow-lg hover:shadow-cyan-500/30"
            >
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-lg bg-cyan-400/20 border border-cyan-400/30 grid place-items-center">
                  <svg className="w-4 h-4 text-cyan-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="10" rx="2" />
                    <path d="M7 11V8a5 5 0 0 1 10 0v3" />
                  </svg>
                </span>
                <div>
                  <div className="text-white font-semibold">Change Password</div>
                  <div className="text-xs text-white/70">Update your current password</div>
                </div>
              </div>
              <span className="w-8 h-8 rounded-full bg-cyan-400/15 border border-cyan-400/30 grid place-items-center text-cyan-100">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </button>
            <button
              onClick={() => setActiveTab("reset")}
              className="w-full text-left px-4 py-3 rounded-2xl bg-linear-to-r from-indigo-500/15 to-purple-500/15 hover:from-indigo-500/25 hover:to-purple-500/25 border border-indigo-400/30 hover:border-indigo-400/50 transition flex items-center justify-between shadow-lg hover:shadow-indigo-500/30"
            >
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-lg bg-indigo-400/20 border border-indigo-400/30 grid place-items-center">
                  <svg className="w-4 h-4 text-indigo-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 6h16v12H4z" />
                    <path d="m4 6 8 7 8-7" />
                  </svg>
                </span>
                <div>
                  <div className="text-white font-semibold">Reset Password</div>
                  <div className="text-xs text-white/70">Use email verification code</div>
                </div>
              </div>
              <span className="w-8 h-8 rounded-full bg-indigo-400/15 border border-indigo-400/30 grid place-items-center text-indigo-100">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </button>
            {allowDelete && (
              <button
                onClick={() => setActiveTab("delete")}
                className="w-full text-left px-4 py-3 rounded-2xl bg-red-500/10 hover:bg-red-500/20 border border-red-400/30 transition flex items-center justify-between shadow-lg hover:shadow-red-500/20"
              >
                <div className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-lg bg-red-500/15 border border-red-400/30 grid place-items-center">
                    <svg className="w-4 h-4 text-red-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18" />
                      <path d="M8 6V4h8v2" />
                      <path d="M6 6l1 14h10l1-14" />
                    </svg>
                  </span>
                  <div>
                    <div className="text-white font-semibold">Delete Account</div>
                    <div className="text-xs text-red-200/80">Permanent and irreversible</div>
                  </div>
                </div>
                <span className="w-8 h-8 rounded-full bg-red-500/20 border border-red-400/30 grid place-items-center text-red-200">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </button>
            )}
          </div>
        )}

        {/* Change Password Tab */}
        {activeTab === "password" && (
          <div className="space-y-4">
            <button
              onClick={() => setActiveTab("menu")}
              className="text-xs text-white/80 hover:text-white flex items-center gap-1 px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 w-fit"
            >
              ← Back
            </button>
            <div className="text-sm text-white/80 font-semibold">Change Password</div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Old Password</label>
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-white/20 border border-white/25 rounded-xl text-white placeholder-white/60 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40 shadow-inner shadow-black/20"
                placeholder="Enter old password"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-white/20 border border-white/25 rounded-xl text-white placeholder-white/60 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40 shadow-inner shadow-black/20"
                placeholder="Enter new password"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-white/20 border border-white/25 rounded-xl text-white placeholder-white/60 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40 shadow-inner shadow-black/20"
                placeholder="Confirm new password"
              />
            </div>
            <button
              onClick={handleUpdatePassword}
              disabled={loading}
              className="w-full px-4 py-2.5 bg-linear-to-r from-indigo-500 to-cyan-500 hover:from-indigo-400 hover:to-cyan-400 text-white rounded-xl transition disabled:opacity-50 mt-4 shadow-lg shadow-cyan-500/30"
            >
              {loading ? "Updating..." : "Update Password"}
            </button>
          </div>
        )}

        {/* Reset Password Tab */}
        {activeTab === "reset" && (
          <div className="space-y-4">
            <button
              onClick={() => setActiveTab("menu")}
              className="text-xs text-white/80 hover:text-white flex items-center gap-1 px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 w-fit"
            >
              ← Back
            </button>
            <div className="text-sm text-white/80 font-semibold">Reset Password</div>
            <p className="text-xs text-white/70">We'll send a verification code to your email</p>
            {!showOtpField ? (
              <button
                onClick={handleSendOtp}
                disabled={loading}
                className="w-full px-4 py-2.5 bg-linear-to-r from-blue-500 to-indigo-500 hover:from-blue-400 hover:to-indigo-400 text-white rounded-xl transition disabled:opacity-50 shadow-lg shadow-blue-500/30"
              >
                {loading ? "Sending..." : "Send Verification Code"}
              </button>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Verification Code</label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white/20 border border-white/25 rounded-xl text-white placeholder-white/60 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40 shadow-inner shadow-black/20"
                    placeholder="Enter code"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white/20 border border-white/25 rounded-xl text-white placeholder-white/60 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40 shadow-inner shadow-black/20"
                    placeholder="Enter new password"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Confirm Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white/20 border border-white/25 rounded-xl text-white placeholder-white/60 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40 shadow-inner shadow-black/20"
                    placeholder="Confirm new password"
                  />
                </div>
                <button
                  onClick={handleResetPassword}
                  disabled={loading}
                  className="w-full px-4 py-2.5 bg-linear-to-r from-indigo-500 to-cyan-500 hover:from-indigo-400 hover:to-cyan-400 text-white rounded-xl transition disabled:opacity-50 mt-2 shadow-lg shadow-cyan-500/30"
                >
                  {loading ? "Resetting..." : "Reset Password"}
                </button>
              </>
            )}
          </div>
        )}

        {/* Delete Account Tab */}
        {activeTab === "delete" && allowDelete && (
          <div className="space-y-4">
            <button
              onClick={() => setActiveTab("menu")}
              className="text-xs text-white/80 hover:text-white flex items-center gap-1 px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 w-fit"
            >
              ← Back
            </button>
            <div className="text-sm text-white/80 font-semibold">Delete Account</div>
            <div className="p-3 rounded-xl border border-red-500/40 bg-red-500/15 text-sm text-red-200">
              Deleting your account is permanent. Your profile and access will be removed.
            </div>

            {!delOtpSent ? (
              <button
                onClick={async () => {
                  try {
                    setLoading(true);
                    await userAPI.requestAccountDeletion();
                    setDelOtpSent(true);
                    toast.success("Verification code sent. Valid for 10 minutes");
                  } catch (error: any) {
                    toast.error(error.response?.data?.message || "Failed to send verification code");
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
                className="w-full px-4 py-2.5 bg-linear-to-r from-red-500 to-rose-500 hover:from-red-400 hover:to-rose-400 text-white rounded-xl transition disabled:opacity-50 shadow-lg shadow-red-500/30"
              >
                {loading ? "Sending..." : "Send Verification Code"}
              </button>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Verification Code</label>
                  <input
                    type="text"
                    value={delOtp}
                    onChange={(e) => setDelOtp(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white/20 border border-white/25 rounded-xl text-white placeholder-white/60 focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-400/40 shadow-inner shadow-black/20"
                    placeholder="Enter code"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Reason for deletion</label>
                  <textarea
                    value={delReason}
                    onChange={(e) => setDelReason(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2.5 bg-white/20 border border-white/25 rounded-xl text-white placeholder-white/60 focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-400/40 shadow-inner shadow-black/20"
                    placeholder="Tell us why you are deleting your account"
                  />
                </div>
                <button
                  onClick={async () => {
                    if (!delOtp || !delReason || delReason.trim().length < 3) {
                      toast.error("Code and a valid reason are required");
                      return;
                    }
                    try {
                      setLoading(true);
                      const result = await userAPI.confirmAccountDeletion(delOtp, delReason.trim());

                      // If backend indicates approval is required (seller), just show request-sent message
                      if ((result as any)?.requiresApproval) {
                        toast.success((result as any)?.message || "Deletion request sent to admin for approval");
                        onClose();
                      } else {
                        // Buyer flow: account deleted immediately
                        toast.success((result as any)?.message || "Account deleted successfully");
                        clearAuthStorage();
                        router.push("/register");
                      }
                    } catch (error: any) {
                      toast.error(error.response?.data?.message || "Failed to delete account");
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading}
                  className="w-full px-4 py-2.5 bg-linear-to-r from-red-500 to-rose-500 hover:from-red-400 hover:to-rose-400 text-white rounded-xl transition disabled:opacity-50 mt-2 shadow-lg shadow-red-500/30"
                >
                  {loading ? "Deleting..." : "Confirm Delete Account"}
                </button>
              </>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
