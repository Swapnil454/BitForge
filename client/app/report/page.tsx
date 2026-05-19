"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { reportAPI } from "@/lib/api";
import { 
  AlertCircle, 
  Upload, 
  X, 
  CheckCircle2, 
  Loader2, 
  ArrowLeft,
  ShieldAlert,
  FileText,
  ChevronDown
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { getCookie, getStoredUser } from "@/lib/cookies";
import PageHeader from "@/app/dashboard/buyer/transactions/components/PageHeader";

const ISSUE_TYPES = [
  { id: "wrongful_ban", label: "Wrongful Account Suspension", description: "I believe my account was suspended by mistake" },
  { id: "account_restricted", label: "Account Feature Restriction", description: "I cannot access certain features like purchasing or selling" },
  { id: "login_issue", label: "Login / Access Issue", description: "I'm having trouble logging into my active account" },
  { id: "data_privacy", label: "Data & Privacy Concern", description: "Questions about how my data is handled or deletion requests" },
  { id: "technical_issue", label: "Technical Issue / Bug", description: "Something on the platform is broken or not working as expected" },
  { id: "other", label: "Other Inquiry", description: "General questions or issues not listed above" }
];

export default function ReportPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [reportId, setReportId] = useState("");

  const [formData, setFormData] = useState({
    reporterEmail: "",
    reporterName: "",
    issueType: "",
    description: "",
  });
  const [files, setFiles] = useState<File[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      if (files.length + newFiles.length > 5) {
        toast.error("You can only upload up to 5 files.");
        return;
      }
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.reporterEmail || !formData.issueType || formData.description.length < 20) {
      toast.error("Please fill in all required fields. Description needs at least 20 characters.");
      return;
    }

    setIsSubmitting(true);
    try {
      const submitData = new FormData();
      submitData.append("reporterEmail", formData.reporterEmail);
      submitData.append("reporterName", formData.reporterName);
      submitData.append("issueType", formData.issueType);
      submitData.append("description", formData.description);
      
      files.forEach(file => {
        submitData.append("proofs", file);
      });

      const response = await reportAPI.submitReport(submitData as any);
      setReportId(response.reportId);
      setIsSuccess(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to submit report");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#05050a] flex items-center justify-center p-4">
        <div className="w-full max-w-lg p-8 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-center relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-cyan-500/10 blur-[50px] rounded-full pointer-events-none" />
          
          <div className="w-20 h-20 bg-cyan-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-cyan-400" />
          </div>
          
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Report Submitted</h2>
          <p className="text-slate-500 dark:text-white/60 mb-6 leading-relaxed">
            Thank you for reaching out. Our Trust & Safety team has received your report and will review it shortly. We will contact you at <span className="text-slate-900 dark:text-white font-medium">{formData.reporterEmail}</span>.
          </p>
          
          <div className="bg-white dark:bg-black/30 border border-slate-200 dark:border-white/5 rounded-xl p-4 mb-8">
            <span className="text-sm text-slate-400 dark:text-white/40 block mb-1">Your Reference ID</span>
            <span className="text-xl font-mono text-cyan-400 font-bold tracking-wider">{reportId}</span>
          </div>
          
          <button
            onClick={() => router.push("/login")}
            className="w-full py-3 rounded-xl font-bold text-black bg-white hover:bg-white/90 transition-colors"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#05050a] text-slate-900 dark:text-white selection:bg-cyan-500/30">
      {/* Background accents */}
      <div className="fixed top-0 inset-x-0 h-[500px] bg-gradient-to-b from-cyan-900/20 to-transparent pointer-events-none" />
      <div className="fixed top-1/4 right-0 w-[500px] h-[500px] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />
      {/* Header */}
      <PageHeader 
        title="Trust & Safety Support"
        subtitle="Our team reviews all appeals manually."
        backHref="/login"
        backLabel="Back to Login"
        rightSlot={
          <button 
            type="button"
            onClick={() => {
              const token = getCookie('token');
              if (token) {
                const userStr = getCookie('user');
                let role = 'buyer';
                if (userStr) {
                  try {
                    role = JSON.parse(userStr).role || 'buyer';
                  } catch (e) {}
                }
                router.push(`/dashboard/${role}/reports`);
              } else {
                router.push("/login?next=/dashboard/buyer/reports");
              }
            }}
            className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 rounded-xl hover:bg-indigo-500/20 transition-all shadow-lg shadow-indigo-500/10 shrink-0"
          >
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Track My Reports</span>
          </button>
        }
      />

      <div className="relative max-w-4xl mx-auto px-4 py-8 sm:py-12">        {/* Form Container */}
        <div className="bg-slate-50 dark:bg-[#0a0a0f] border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl p-6 sm:p-10 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 to-blue-600" />
          
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Section 1: Contact Info */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold flex items-center gap-2 border-b border-slate-200 dark:border-white/5 pb-4">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 dark:bg-white/10 text-xs font-bold">1</span>
                Contact Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-600 dark:text-white/70">Full Name</label>
                  <input
                    type="text"
                    name="reporterName"
                    value={formData.reporterName}
                    onChange={handleInputChange}
                    placeholder="John Doe"
                    className="w-full px-4 py-3 bg-white dark:bg-black/40 border border-slate-300 dark:border-white/20 rounded-xl focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none transition-all duration-200 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/30"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-600 dark:text-white/70">Email Address <span className="text-red-400">*</span></label>
                  <input
                    type="email"
                    name="reporterEmail"
                    value={formData.reporterEmail}
                    onChange={handleInputChange}
                    required
                    placeholder="Email linked to your account"
                    className="w-full px-4 py-3 bg-white dark:bg-black/40 border border-slate-300 dark:border-white/20 rounded-xl focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none transition-all duration-200 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/30"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Issue Details */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold flex items-center gap-2 border-b border-slate-200 dark:border-white/5 pb-4">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 dark:bg-white/10 text-xs font-bold">2</span>
                Issue Details
              </h3>
              
              <div className="space-y-1.5 relative" ref={dropdownRef}>
                <label className="text-sm font-medium text-slate-600 dark:text-white/70">What do you need help with? <span className="text-red-400">*</span></label>
                
                {/* Custom Premium Dropdown Button */}
                <button
                  type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="w-full flex items-center justify-between px-4 py-3.5 bg-white dark:bg-[#0f1422] border border-slate-300 dark:border-white/20 rounded-xl hover:border-cyan-400 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none transition-all text-left group"
                >
                  <div className="flex-1 min-w-0 pr-4">
                    {formData.issueType ? (
                      <>
                        <div className="font-semibold text-slate-900 dark:text-white text-sm truncate">
                          {ISSUE_TYPES.find(t => t.id === formData.issueType)?.label}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-white/40 mt-0.5 truncate">
                          {ISSUE_TYPES.find(t => t.id === formData.issueType)?.description}
                        </div>
                      </>
                    ) : (
                      <span className="text-slate-400 dark:text-white/35 text-sm font-medium">Select an issue type...</span>
                    )}
                  </div>
                  <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 shrink-0 ${dropdownOpen ? 'rotate-180 text-cyan-400' : 'group-hover:text-slate-600 dark:group-hover:text-slate-300'}`} />
                </button>

                {/* Animated Dropdown Menu */}
                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.98 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                      className="absolute left-0 right-0 mt-2 rounded-2xl border border-slate-200 dark:border-white/10 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl p-1.5 shadow-2xl z-40 max-h-[320px] overflow-y-auto custom-scrollbar"
                    >
                      <div className="space-y-1">
                        {ISSUE_TYPES.map(type => {
                          const isSelected = formData.issueType === type.id;
                          return (
                            <button
                              key={type.id}
                              type="button"
                              onClick={() => {
                                setFormData(prev => ({ ...prev, issueType: type.id }));
                                setDropdownOpen(false);
                              }}
                              className={`w-full text-left p-3 rounded-xl transition-all flex items-center justify-between group ${
                                isSelected 
                                  ? 'bg-cyan-500/10 dark:bg-cyan-500/15 text-cyan-500 dark:text-cyan-400 font-semibold' 
                                  : 'hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-white/80'
                              }`}
                            >
                              <div className="pr-4 min-w-0 flex-1">
                                <span className={`block text-sm font-semibold truncate ${isSelected ? 'text-cyan-500 dark:text-cyan-400' : 'text-slate-900 dark:text-white'}`}>
                                  {type.label}
                                </span>
                                <span className={`block text-xs mt-0.5 truncate ${isSelected ? 'text-cyan-500/70 dark:text-cyan-400/60' : 'text-slate-500 dark:text-white/40'}`}>
                                  {type.description}
                                </span>
                              </div>
                              {isSelected && (
                                <div className="w-5 h-5 rounded-full bg-cyan-500 dark:bg-cyan-400 flex items-center justify-center shrink-0 shadow-lg shadow-cyan-500/25 ml-2">
                                  <svg className="w-3 h-3 text-white dark:text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="space-y-1.5 pt-4">
                <label className="text-sm font-medium text-slate-600 dark:text-white/70 flex justify-between">
                  <span>Description <span className="text-red-400">*</span></span>
                  <span className={`text-xs ${formData.description.length < 20 ? 'text-red-400' : 'text-green-400 font-semibold'}`}>
                    {formData.description.length}/2000
                  </span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows={5}
                  placeholder="Please provide as much detail as possible. If appealing a suspension, explain why you believe it was an error..."
                  className="w-full px-4 py-3 bg-white dark:bg-black/40 border border-slate-300 dark:border-white/20 rounded-xl focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none transition-all resize-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/30"
                  maxLength={2000}
                />
                {formData.description.length > 0 && formData.description.length < 20 && (
                  <p className="text-xs text-red-400 flex items-center gap-1 mt-1 font-medium animate-pulse">
                    <AlertCircle className="w-3.5 h-3.5" /> Minimum 20 characters required.
                  </p>
                )}
              </div>
            </div>

            {/* Section 3: Evidence (Optional) */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold flex items-center gap-2 border-b border-slate-200 dark:border-white/5 pb-4">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 dark:bg-white/10 text-xs font-bold">3</span>
                Supporting Evidence <span className="text-sm font-normal text-slate-400 dark:text-white/40 ml-2">(Optional)</span>
              </h3>
              
              <div className="space-y-4">
                <div className="relative border-2 border-dashed border-slate-300 dark:border-white/20 bg-slate-100/50 dark:bg-white/[0.02] rounded-2xl p-8 hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all duration-300 group flex flex-col items-center justify-center cursor-pointer">
                  <input
                    type="file"
                    multiple
                    accept="image/*,.pdf"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    disabled={files.length >= 5}
                  />
                  <div className="flex flex-col items-center justify-center text-center pointer-events-none">
                    <div className="w-12 h-12 bg-white dark:bg-white/5 rounded-full flex items-center justify-center mb-3 group-hover:bg-cyan-500/10 dark:group-hover:bg-cyan-500/15 group-hover:scale-105 group-hover:rotate-6 transition-all duration-300 shadow-sm border border-slate-200 dark:border-white/5">
                      <Upload className="w-6 h-6 text-slate-500 dark:text-white/60 group-hover:text-cyan-400 transition-colors" />
                    </div>
                    <p className="font-semibold text-slate-900 dark:text-white mb-1 group-hover:text-cyan-500 dark:group-hover:text-cyan-400 transition-colors">Click or drag files to upload</p>
                    <p className="text-xs text-slate-400 dark:text-white/40">JPG, PNG, PDF (Max 5 files)</p>
                  </div>
                </div>

                {/* Uploaded Files Preview */}
                {files.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-slate-600 dark:text-white/70">Attached Files ({files.length}/5)</p>
                    <div className="space-y-2">
                      {files.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-white dark:bg-white/[0.03] border border-slate-300 dark:border-white/20 rounded-xl transition-all hover:bg-slate-50 dark:hover:bg-white/[0.05]">
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-10 h-10 bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/5 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                              <span className="text-xs font-bold text-slate-400 dark:text-white/40 uppercase">{file.name.split('.').pop()}</span>
                            </div>
                            <div className="truncate">
                              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{file.name}</p>
                              <p className="text-xs text-slate-400 dark:text-white/40">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="p-2 hover:bg-red-500/10 dark:hover:bg-red-500/20 group/btn rounded-lg transition-colors flex-shrink-0"
                          >
                            <X className="w-4 h-4 text-slate-400 group-hover/btn:text-red-500 transition-colors" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Submit Actions */}
            <div className="pt-6 border-t border-slate-200 dark:border-white/5 flex items-center justify-end">
              <button
                type="submit"
                disabled={isSubmitting || !formData.issueType || formData.description.length < 20}
                className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-black bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 active:scale-[0.98] hover:scale-[1.01] disabled:scale-100 disabled:opacity-50 disabled:pointer-events-none transition-all duration-200 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(34,211,238,0.2)] dark:shadow-[0_0_25px_rgba(34,211,238,0.15)] hover:shadow-[0_0_25px_rgba(34,211,238,0.4)]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Report"
                )}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
