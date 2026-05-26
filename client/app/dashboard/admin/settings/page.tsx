"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { userAPI } from "@/lib/api";
import { getStoredUser, setCookie, clearAuthStorage } from "@/lib/cookies";
import toast from "react-hot-toast";
import PageHeader from "@/app/dashboard/buyer/transactions/components/PageHeader";
import { 
  UserRound, 
  ShieldCheck, 
  Trash2, 
  ChevronRight,
  Info,
  Mail,
  FileText,
  ShieldAlert,
  BookOpen,
  LifeBuoy,
  ChevronLeft,
  Pencil,
  Eye,
  EyeOff
} from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  profilePictureUrl?: string;
}

function SettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams?.get("tab");
  
  const [activeTab, setActiveTab] = useState<"main" | "profile" | "security" | "account">(
    (tabParam as "main" | "profile" | "security" | "account") || "main"
  );
  
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Profile States
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [name, setName] = useState("");
  const [profilePic, setProfilePic] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Security States
  const [securityTab, setSecurityTab] = useState<"menu" | "password" | "reset">("menu");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [showOtpField, setShowOtpField] = useState(false);
  const [securityLoading, setSecurityLoading] = useState(false);

  // Account States
  const [delOtpSent, setDelOtpSent] = useState(false);
  const [delOtp, setDelOtp] = useState("");
  const [delReason, setDelReason] = useState("");
  const [accountLoading, setAccountLoading] = useState(false);

  // UI States
  const [showPwd, setShowPwd] = useState({ old: false, new: false, confirm: false, resetNew: false, resetConfirm: false });

  useEffect(() => {
    const stored = getStoredUser<User>();
    if (!stored) {
      router.push("/login");
      return;
    }
    setUser(stored);
    setName(stored.name);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    if (tabParam && ["main", "profile", "security", "account"].includes(tabParam)) {
      setActiveTab(tabParam as "main" | "profile" | "security" | "account");
    } else if (!tabParam) {
      setActiveTab("main");
    }
  }, [tabParam]);

  // Profile Handlers
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePic(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      if (!name.trim() || name.trim().length < 2) {
        toast.error("Name must be at least 2 characters");
        return;
      }

      setProfileLoading(true);
      const formData = new FormData();
      formData.append("name", name.trim());
      if (profilePic) {
        formData.append("profilePicture", profilePic);
      }

      const response = await userAPI.updateProfile(formData);
      
      if (response.user) {
        const storedUser = getStoredUser();
        const updatedUser = { ...storedUser, ...response.user };
        setCookie("user", JSON.stringify(updatedUser), 7);
        if (typeof localStorage !== "undefined") {
          localStorage.setItem("user", JSON.stringify(updatedUser));
        }
        setUser(response.user);
      }

      toast.success("Profile updated successfully");
      setIsEditingProfile(false);
      setProfilePic(null);
      setPreview(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setProfileLoading(false);
    }
  };

  // Security Handlers
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
      setSecurityLoading(true);
      await userAPI.changePassword(oldPassword, newPassword, confirmPassword);
      toast.success("Password updated successfully");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSecurityTab("menu");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update password");
    } finally {
      setSecurityLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (!user) return;
    try {
      setSecurityLoading(true);
      await userAPI.requestPasswordReset(user.email);
      setShowOtpField(true);
      toast.success("OTP sent to your email. Valid for 15 minutes");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to send OTP");
    } finally {
      setSecurityLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!user) return;
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
      setSecurityLoading(true);
      await userAPI.resetPassword(user.email, otp, newPassword, confirmPassword);
      toast.success("Password reset successfully");
      setSecurityTab("menu");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to reset password");
    } finally {
      setSecurityLoading(false);
    }
  };

  // Account Deletion Handlers
  const handleRequestDeletion = async () => {
    try {
      setAccountLoading(true);
      await userAPI.requestAccountDeletion();
      setDelOtpSent(true);
      toast.success("Verification code sent. Valid for 10 minutes");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to send verification code");
    } finally {
      setAccountLoading(false);
    }
  };

  const handleConfirmDeletion = async () => {
    if (!delOtp || !delReason || delReason.trim().length < 3) {
      toast.error("Code and a valid reason are required");
      return;
    }
    try {
      setAccountLoading(true);
      const result = await userAPI.confirmAccountDeletion(delOtp, delReason.trim());

      if ((result as any)?.requiresApproval) {
        toast.success((result as any)?.message || "Deletion request sent to admin for approval");
        router.push("/dashboard/admin");
      } else {
        toast.success((result as any)?.message || "Account deleted successfully");
        clearAuthStorage();
        router.push("/register");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete account");
    } finally {
      setAccountLoading(false);
    }
  };

  const menuItems = [
    { id: "profile", label: "Profile", desc: "Personal Information", icon: UserRound, color: "text-indigo-400", bg: "bg-indigo-500/10" },
    { id: "security", label: "Security", desc: "Password & authentication", icon: ShieldCheck, color: "text-purple-400", bg: "bg-purple-500/10" },
    { id: "/about", label: "About Us", desc: "Our company and mission", icon: Info, color: "text-blue-400", bg: "bg-blue-400/10", isExternal: true },
    { id: "/contact", label: "Contact Support", desc: "Get help with your account", icon: Mail, color: "text-sky-400", bg: "bg-sky-400/10", isExternal: true },
    { id: "/legal/terms-and-conditions", label: "Terms & Conditions", desc: "Rules and guidelines", icon: FileText, color: "text-cyan-400", bg: "bg-cyan-400/10", isExternal: true },
    { id: "/legal/privacy-policy", label: "Privacy Policy", desc: "How we handle your data", icon: ShieldAlert, color: "text-teal-400", bg: "bg-teal-400/10", isExternal: true },
    { id: "/legal/refund-cancellation-policy", label: "Refund & Cancellation", desc: "Our policies", icon: LifeBuoy, color: "text-pink-400", bg: "bg-pink-400/10", isExternal: true },
    { id: "/trust-center", label: "Trust Center", desc: "Security and compliance", icon: ShieldCheck, color: "text-emerald-400", bg: "bg-emerald-400/10", isExternal: true },
    { id: "/docs", label: "Documentation", desc: "Guides and API docs", icon: BookOpen, color: "text-orange-400", bg: "bg-orange-400/10", isExternal: true },
    { id: "account", label: "Danger Zone", desc: "Account deletion", icon: Trash2, color: "text-red-400", bg: "bg-red-500/10", isDanger: true }
  ];

  if (loading || !user) {
    return (
      <main className="min-h-screen bg-slate-50 dark:bg-[#05050a] text-slate-900 dark:text-white">
        <PageHeader 
          title="Settings" 
          subtitle="Manage your account preferences" 
          backHref="/dashboard/admin" 
        />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 md:py-8 space-y-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="w-full flex items-center gap-4 p-4 md:p-5 rounded-2xl border border-slate-200 dark:border-white/5 bg-slate-100 dark:bg-white/5 animate-pulse">
              <div className="w-6 h-6 rounded-md bg-slate-200 dark:bg-white/10 shrink-0"></div>
              <div className="flex-1 space-y-2">
                <div className="h-5 bg-slate-200 dark:bg-white/10 rounded w-1/3"></div>
                <div className="h-3 bg-slate-100 dark:bg-white/5 rounded w-1/2"></div>
              </div>
              <div className="w-5 h-5 rounded bg-slate-100 dark:bg-white/5 shrink-0"></div>
            </div>
          ))}
        </div>
      </main>
    );
  }

  const handleHeaderBack = () => {
    if (activeTab === "main") {
      router.push("/dashboard/admin");
      return;
    }

    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }

    router.push("/dashboard/admin/settings?tab=main");
  };

  const title = activeTab === "main" 
    ? "Settings" 
    : menuItems.find(m => m.id === activeTab)?.label || "Settings";

  const subtitle = activeTab === "main" 
    ? "Manage your account preferences and security" 
    : "";

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-[#05050a] text-slate-900 dark:text-white">
      <PageHeader 
        title={title} 
        subtitle={subtitle} 
        backHref={activeTab === "main" ? "/dashboard/admin" : "/dashboard/admin/settings?tab=main"}
        onBack={handleHeaderBack}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 pb-28 md:py-8">
        <AnimatePresence mode="wait">
          
          {/* ================= MAIN LIST VIEW ================= */}
          {activeTab === "main" && (
            <motion.div
              key="main"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-3"
            >
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.isExternal) {
                      router.push(item.id);
                    } else {
                      router.push(`/dashboard/admin/settings?tab=${item.id}`);
                    }
                  }}
                  className={`w-full flex items-center gap-4 p-4 md:p-5 rounded-2xl transition-all duration-300 text-left group border backdrop-blur-sm shadow-lg ${
                    item.isDanger
                      ? "bg-red-500/5 hover:bg-red-500/10 border-red-500/20 hover:border-red-500/40 hover:shadow-red-500/10"
                      : "bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 hover:shadow-indigo-500/5"
                  }`}
                >
                  <div className={`grid place-items-center transition-transform group-hover:scale-110 shrink-0 ${item.color}`}>
                    <item.icon className="w-[26px] h-[26px]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-bold md:text-lg truncate ${item.isDanger ? "text-red-400" : "text-slate-900 dark:text-white"}`}>
                      {item.label}
                    </h3>
                    <p className={`text-xs md:text-sm truncate ${item.isDanger ? "text-red-400/60" : "text-slate-400 dark:text-white/50"}`}>
                      {item.desc}
                    </p>
                  </div>
                  <ChevronRight className={`w-5 h-5 shrink-0 transition-transform group-hover:translate-x-1 ${item.isDanger ? "text-red-400/60" : "text-slate-300 dark:text-white/30"}`} />
                </button>
              ))}
            </motion.div>
          )}

          {/* ================= PROFILE TAB ================= */}
          {activeTab === "profile" && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="p-1 sm:p-2 md:p-4"
            >
              <div className="space-y-5 sm:space-y-6">

                {!isEditingProfile ? (
                  <div className="relative bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-2xl p-4 sm:p-5 md:p-6 shadow-sm">
                    <button
                      onClick={() => setIsEditingProfile(true)}
                      className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 md:p-2.5 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white rounded-xl transition shadow-sm hover:shadow-md"
                      title="Edit Profile"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 mb-5 pb-5 sm:mb-6 sm:pb-6 border-b border-slate-100 dark:border-white/10">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full bg-linear-to-br from-cyan-400 to-indigo-500 flex items-center justify-center text-3xl md:text-5xl overflow-hidden shadow-xl shadow-indigo-500/20 shrink-0 border-4 border-white dark:border-slate-800">
                        {user.profilePictureUrl ? (
                          <img src={user.profilePictureUrl} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-white font-bold opacity-80">{user.name.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <div className="text-center sm:text-left mt-1 sm:mt-3">
                        <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-1 sm:mb-2">{user.name}</h3>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 sm:py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 text-[10px] sm:text-xs font-bold uppercase tracking-widest">
                          {user.role}
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:gap-5 sm:grid-cols-2">
                      <div className="bg-slate-50 dark:bg-white/5 rounded-xl p-4 sm:p-5 border border-slate-100 dark:border-transparent">
                        <label className="text-xs font-bold text-slate-400 dark:text-white/50 uppercase tracking-wider mb-2 block">Full Name</label>
                        <div className="text-slate-900 dark:text-white font-semibold text-lg">
                          {user.name}
                        </div>
                      </div>
                      <div className="bg-slate-50 dark:bg-white/5 rounded-xl p-4 sm:p-5 border border-slate-100 dark:border-transparent">
                        <label className="text-xs font-bold text-slate-400 dark:text-white/50 uppercase tracking-wider mb-2 block">Email Address</label>
                        <div className="text-slate-900 dark:text-white font-semibold text-base sm:text-lg truncate">
                          {user.email}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-indigo-300/70 mt-2 flex items-center gap-1.5 font-medium">
                          <Info className="w-3.5 h-3.5 shrink-0" /> Email cannot be changed.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-2xl p-4 sm:p-5 md:p-6 shadow-sm space-y-6">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 dark:text-white/80 uppercase tracking-wider mb-3 sm:mb-4">Profile Picture</label>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full bg-linear-to-br from-cyan-400 to-indigo-500 flex items-center justify-center text-3xl md:text-4xl overflow-hidden shadow-xl shadow-indigo-500/20 shrink-0 border-4 border-white dark:border-slate-800">
                          {preview ? (
                            <img src={preview} alt="preview" className="w-full h-full object-cover" />
                          ) : user.profilePictureUrl ? (
                            <img src={user.profilePictureUrl} alt={user.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-white font-bold opacity-80">{user.name.charAt(0).toUpperCase()}</span>
                          )}
                        </div>
                        <div className="flex-1">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="text-sm text-slate-700 dark:text-white/80 file:mr-4 file:bg-indigo-50 dark:file:bg-white/10 file:hover:bg-indigo-100 dark:file:hover:bg-white/20 file:border-0 file:rounded-xl file:px-5 file:py-2.5 file:text-indigo-700 dark:file:text-white file:cursor-pointer transition file:font-semibold w-full sm:w-auto"
                          />
                          <p className="text-xs text-slate-400 dark:text-white/40 mt-3">Recommended size: 256x256px. Max 2MB.</p>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 dark:border-white/10 pt-5 sm:pt-6">
                      <label className="block text-sm font-bold text-slate-700 dark:text-white/80 uppercase tracking-wider mb-2.5 sm:mb-3">Full Name</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-4 py-2.5 sm:py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/20 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/40 focus:border-indigo-500 focus:bg-white dark:focus:bg-white/5 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition font-medium"
                        placeholder="Your name"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-4 pt-4 border-t border-slate-100 dark:border-white/10 mt-2">
                      <button
                         onClick={() => {
                          setIsEditingProfile(false);
                          setName(user.name);
                          setProfilePic(null);
                          setPreview(null);
                        }}
                        className="text-xs text-slate-500 hover:text-slate-700 dark:text-white/50 dark:hover:text-white underline font-medium transition"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleUpdateProfile}
                        disabled={profileLoading}
                        className="px-4 py-2 bg-linear-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white rounded-lg transition font-bold shadow-sm disabled:opacity-50 text-center text-xs"
                      >
                        {profileLoading ? "Saving..." : "Save Changes"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ================= SECURITY TAB ================= */}
          {activeTab === "security" && (
            <motion.div
              key="security"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="p-2 md:p-6"
            >
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Security Settings</h2>
                  <p className="text-slate-500 dark:text-white/60 text-sm">Update your password and secure your account</p>
                </div>

                {securityTab === "menu" && (
                  <div className="flex flex-col">
                    <button
                      onClick={() => setSecurityTab("password")}
                      className="py-6 border-b border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 px-4 -mx-4 rounded-xl transition-all text-left group flex items-center justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <ShieldCheck className="w-6 h-6 text-cyan-400 group-hover:scale-110 transition shrink-0" />
                        <div>
                          <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-0.5 group-hover:text-cyan-400 transition-colors">Change Password</h3>
                          <p className="text-sm text-slate-400 dark:text-white/50">Update your current password if you remember it.</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-300 dark:text-white/30 group-hover:text-cyan-400 transition-colors" />
                    </button>
                    <button
                      onClick={() => setSecurityTab("reset")}
                      className="py-6 border-b border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 px-4 -mx-4 rounded-xl transition-all text-left group flex items-center justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <Mail className="w-6 h-6 text-indigo-400 group-hover:scale-110 transition shrink-0" />
                        <div>
                          <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-0.5 group-hover:text-indigo-400 transition-colors">Reset Password</h3>
                          <p className="text-sm text-slate-400 dark:text-white/50">Use an email verification code if you forgot it.</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-300 dark:text-white/30 group-hover:text-indigo-400 transition-colors" />
                    </button>
                  </div>
                )}

                {securityTab === "password" && (
                  <div className="max-w-xl space-y-4 md:space-y-5">
                    <button onClick={() => setSecurityTab("menu")} className="text-sm text-slate-500 hover:text-slate-900 dark:text-white/60 dark:hover:text-white mb-2 md:mb-4 inline-flex items-center gap-1.5 transition-colors font-medium">
                      <ChevronLeft className="w-4 h-4" /> Back
                    </button>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-white/80 mb-1.5 md:mb-2">Old Password</label>
                      <div className="relative">
                        <input
                          type={showPwd.old ? "text" : "password"}
                          value={oldPassword}
                          onChange={(e) => setOldPassword(e.target.value)}
                          className="w-full px-4 py-2.5 md:py-3.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/20 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition"
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPwd(prev => ({ ...prev, old: !prev.old }))}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition"
                        >
                          {showPwd.old ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-white/80 mb-1.5 md:mb-2">New Password</label>
                      <div className="relative">
                        <input
                          type={showPwd.new ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full px-4 py-2.5 md:py-3.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/20 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition"
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPwd(prev => ({ ...prev, new: !prev.new }))}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition"
                        >
                          {showPwd.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-white/80 mb-1.5 md:mb-2">Confirm New Password</label>
                      <div className="relative">
                        <input
                          type={showPwd.confirm ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full px-4 py-2.5 md:py-3.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/20 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition"
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPwd(prev => ({ ...prev, confirm: !prev.confirm }))}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition"
                        >
                          {showPwd.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={handleUpdatePassword}
                      disabled={securityLoading}
                      className="w-full py-3.5 bg-linear-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/25 transition disabled:opacity-50 mt-4 text-base"
                    >
                      {securityLoading ? "Updating..." : "Update Password"}
                    </button>
                  </div>
                )}

                {securityTab === "reset" && (
                  <div className="max-w-xl space-y-4 md:space-y-5">
                    <button onClick={() => setSecurityTab("menu")} className="text-sm text-slate-500 hover:text-slate-900 dark:text-white/60 dark:hover:text-white mb-2 md:mb-4 inline-flex items-center gap-1.5 transition-colors font-medium">
                     <ChevronLeft className="w-4 h-4" /> Back
                    </button>
                    
                    {!showOtpField ? (
                      <div className="space-y-4 sm:space-y-5 bg-slate-100 dark:bg-white/5 p-5 md:p-6 rounded-2xl border border-slate-200 dark:border-white/10 text-center">
                        <div className="w-12 h-12 md:w-16 md:h-16 bg-indigo-500/20 text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-2 md:mb-4">
                           <Mail className="w-6 h-6 md:w-8 md:h-8" />
                        </div>
                        <p className="text-slate-700 dark:text-white/80 leading-relaxed text-base md:text-lg">
                          We will send a 6-digit verification code to <br className="hidden md:block" /><strong className="text-slate-900 dark:text-white">{user.email}</strong>.
                        </p>
                        <p className="text-xs md:text-sm text-slate-400 dark:text-white/40">This code will be valid for 15 minutes.</p>
                        <button
                          onClick={handleSendOtp}
                          disabled={securityLoading}
                          className="w-full py-3 md:py-3.5 bg-linear-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/25 transition disabled:opacity-50 text-base"
                        >
                          {securityLoading ? "Sending Code..." : "Send Verification Code"}
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4 md:space-y-5">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-white/80 mb-1.5 md:mb-2">Verification Code</label>
                          <input
                            type="text"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            className="w-full px-4 py-2.5 md:py-3.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/20 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition"
                            placeholder="Enter 6-digit code"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-white/80 mb-1.5 md:mb-2">New Password</label>
                          <div className="relative">
                            <input
                              type={showPwd.resetNew ? "text" : "password"}
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              className="w-full px-4 py-2.5 md:py-3.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/20 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition"
                              placeholder="••••••••"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPwd(prev => ({ ...prev, resetNew: !prev.resetNew }))}
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition"
                            >
                              {showPwd.resetNew ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-white/80 mb-1.5 md:mb-2">Confirm New Password</label>
                          <div className="relative">
                            <input
                              type={showPwd.resetConfirm ? "text" : "password"}
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              className="w-full px-4 py-2.5 md:py-3.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/20 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition"
                              placeholder="••••••••"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPwd(prev => ({ ...prev, resetConfirm: !prev.resetConfirm }))}
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition"
                            >
                              {showPwd.resetConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                          </div>
                        </div>
                        <button
                          onClick={handleResetPassword}
                          disabled={securityLoading}
                          className="w-full py-3.5 bg-linear-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/25 transition disabled:opacity-50 mt-4 text-base"
                        >
                          {securityLoading ? "Resetting..." : "Reset Password"}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ================= ACCOUNT TAB (DANGER ZONE) ================= */}
          {activeTab === "account" && (
            <motion.div
              key="account"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/10 rounded-3xl p-6 md:p-8 shadow-sm"
            >
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Danger Zone</h2>
                  <p className="text-slate-500 dark:text-white/60 text-sm">Permanent actions regarding your account</p>
                </div>

                <div className="max-w-xl space-y-6">
                  <div className="p-5 sm:p-6 rounded-2xl border border-red-200/60 dark:border-red-500/30 bg-red-50/30 dark:bg-red-500/5">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 bg-red-100/80 dark:bg-red-500/20 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center shrink-0">
                         <ShieldAlert className="w-6 h-6 sm:w-7 sm:h-7" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-red-300 text-lg mb-1">Delete Account</h3>
                        <p className="text-sm text-slate-600 dark:text-red-200/70 leading-relaxed">
                          Deleting your account is permanent. All your data, purchases, and settings will be permanently removed. This action cannot be undone.
                        </p>
                      </div>
                    </div>
                  </div>

                  {!delOtpSent ? (
                    <button
                      onClick={handleRequestDeletion}
                      disabled={accountLoading}
                      className="w-full py-3.5 sm:py-4 bg-white dark:bg-red-500/10 hover:bg-red-50 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/30 rounded-xl font-bold transition disabled:opacity-50 text-sm sm:text-base shadow-sm"
                    >
                      {accountLoading ? "Requesting..." : "I understand, request deletion"}
                    </button>
                  ) : (
                    <div className="space-y-6 bg-slate-50 dark:bg-black/40 p-5 sm:p-6 rounded-2xl border border-slate-200/60 dark:border-red-500/20">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-white/80 mb-2">Verification Code</label>
                        <input
                          type="text"
                          value={delOtp}
                          onChange={(e) => setDelOtp(e.target.value)}
                          className="w-full px-4 py-3 sm:py-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-red-500/30 rounded-xl text-slate-900 dark:text-white focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-400/20"
                          placeholder="Enter 6-digit code sent to email"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-white/80 mb-2">Reason for leaving (Required)</label>
                        <textarea
                          value={delReason}
                          onChange={(e) => setDelReason(e.target.value)}
                          rows={3}
                          className="w-full px-4 py-3 sm:py-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-red-500/30 rounded-xl text-slate-900 dark:text-white focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-400/20 resize-none"
                          placeholder="We're sad to see you go. Please let us know why."
                        />
                      </div>
                      <button
                        onClick={handleConfirmDeletion}
                        disabled={accountLoading}
                        className="w-full py-3.5 sm:py-4 bg-red-600 hover:bg-red-700 dark:bg-red-600/80 dark:hover:bg-red-600 text-white rounded-xl font-bold shadow-sm transition disabled:opacity-50 text-sm sm:text-base"
                      >
                        {accountLoading ? "Processing..." : "Permanently Delete Account"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </main>
  );
}

export default function AdminSettingsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 dark:bg-[#05050a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <SettingsContent />
    </Suspense>
  );
}
