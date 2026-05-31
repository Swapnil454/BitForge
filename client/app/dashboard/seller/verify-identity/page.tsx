"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { getStoredUser } from "@/lib/cookies";
import { userAPI } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  UploadCloud, 
  FileType, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ShieldCheck, 
  Lock, 
  Eye, 
  Trash2, 
  IdCard, 
  Car, 
  Building2, 
  Home, 
  FileText, 
  Book,
  Info,
  ChevronDown
} from "lucide-react";
import PageHeader from "../../buyer/transactions/components/PageHeader";

type DocType = 'government_id' | 'passport' | 'drivers_license' | 'business_license' | 'utility_bill' | 'other';

interface SelectedFile {
  file: File;
  type: DocType;
  id: string;
}

const DOC_TYPES: { id: DocType; label: string; icon: any }[] = [
  { id: 'government_id', label: 'Government ID', icon: IdCard },
  { id: 'passport', label: 'Passport', icon: Book },
  { id: 'drivers_license', label: 'Driver\'s License', icon: Car },
  { id: 'business_license', label: 'Business License', icon: Building2 },
  { id: 'utility_bill', label: 'Utility Bill', icon: Home },
  { id: 'other', label: 'Other', icon: FileText },
];

const TIPS: Partial<Record<DocType, string>> = {
  government_id: "Upload both front and back. Ensure the photo and ID number are clearly visible and not cropped.",
  passport: "Upload the main photo page. Make sure the MRZ lines at the bottom are readable.",
  drivers_license: "Upload both front and back. Make sure all corners are visible and no glare covers the text.",
  business_license: "Upload your official business registration certificate or license document.",
  utility_bill: "Must be dated within the last 3 months. Shows your name and residential address clearly.",
};

export default function PendingApprovalPage() {
  const router = useRouter();
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState<DocType>('government_id');
  const [isSuccess, setIsSuccess] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Authentication Check
  useEffect(() => {
    const stored = getStoredUser();
    if (!stored) {
      router.replace("/login");
      return;
    }
    if (stored.role !== "seller") {
      router.replace("/dashboard");
    }
  }, [router]);

  // Query Identity Status
  const { data: statusData, isLoading, refetch } = useQuery({
    queryKey: ['identityStatus'],
    queryFn: userAPI.getIdentityStatus,
    refetchInterval: (query) => {
      const data = query.state.data;
      const isApproved =
        data?.approvalStatus === "approved" || Boolean(data?.isApproved);

      return data?.status === "pending" || (data?.status === "verified" && !isApproved)
        ? 10000
        : false;
    },
  });

  const isSellerApproved =
    statusData?.approvalStatus === "approved" || Boolean(statusData?.isApproved);
  const isAwaitingSellerAccountApproval =
    statusData?.status === "verified" && !isSellerApproved;

  // Redirect only after the seller account itself is approved.
  useEffect(() => {
    if (isSellerApproved) {
      const congratsFlag = localStorage.getItem("sellerApprovedCongratsShown");
      if (!congratsFlag) {
        toast.success("Congratulations! Your identity has been verified. Redirecting to your dashboard...");
        localStorage.setItem("sellerApprovedCongratsShown", "true");
      }
      router.replace("/dashboard/seller");
    }
  }, [isSellerApproved, router]);

  // Upload Mutation
  const uploadMutation = useMutation({
    mutationFn: (formData: FormData) => userAPI.uploadIdentityDocuments(formData),
    onSuccess: () => {
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setSelectedFiles([]);
        refetch();
      }, 3000); // Wait 3s before resetting and refreshing to show the success state
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to upload documents");
    }
  });

  // Drag and Drop Handlers
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
    // Reset file input value to allow selecting same file again if removed
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  const handleFiles = (files: FileList) => {
    const newFiles: SelectedFile[] = Array.from(files).map(file => ({
      file,
      type: selectedDocType, // Pre-fill with the currently selected doc type
      id: Math.random().toString(36).substring(7)
    }));

    if (selectedFiles.length + newFiles.length > 5) {
      toast.error("You can only upload up to 5 documents per submission");
      return;
    }

    setSelectedFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (id: string) => {
    setSelectedFiles(prev => prev.filter(f => f.id !== id));
  };

  const updateFileType = (id: string, type: DocType) => {
    setSelectedFiles(prev => prev.map(f => f.id === id ? { ...f, type } : f));
  };

  const handleUpload = () => {
    if (selectedFiles.length === 0) {
      toast.error("Please select at least one document");
      return;
    }

    const hasGovId = selectedFiles.some(f => ['government_id', 'passport', 'drivers_license'].includes(f.type));
    if (!hasGovId) {
      toast.error("At least one primary ID (Government ID, Passport, or Driver's License) is required");
      return;
    }

    const formData = new FormData();
    const documentTypes = selectedFiles.map(f => f.type);
    formData.append("documentTypes", JSON.stringify(documentTypes));
    
    selectedFiles.forEach(f => {
      formData.append("documents", f.file);
    });

    uploadMutation.mutate(formData);
  };

  if (isLoading || !statusData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#0d0d0f]">
        <Loader2 className="w-10 h-10 animate-spin text-cyan-500" />
      </div>
    );
  }

  if (isSellerApproved) return null;

  const isPending = statusData.status === 'pending' || isAwaitingSellerAccountApproval;
  const isRejected = statusData.status === 'rejected';
  const isUnverified = statusData.status === 'unverified' || !statusData.status;

  const getDocTypeLabel = (id: DocType) => DOC_TYPES.find(d => d.id === id)?.label || 'Document';

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-[#05050a] text-slate-900 dark:text-white pb-24">
      <PageHeader
        backHref="/dashboard/seller"
        backLabel="Dashboard"
        title="Verify Your Identity"
        subtitle="Secure verification"
      />

      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {isPending ? (
            <div className="text-center flex flex-col items-center">
              <div className="w-24 h-24 bg-cyan-100 dark:bg-cyan-900/30 rounded-full flex items-center justify-center mb-6">
                <Loader2 className="w-12 h-12 text-cyan-500 animate-spin" />
              </div>
              <h2 className="text-2xl font-bold mb-3">
                {isAwaitingSellerAccountApproval ? "Seller Account Under Review" : "Identity Under Review"}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 mb-8 text-sm leading-relaxed">
                {isAwaitingSellerAccountApproval
                  ? "Your identity has been verified. Your seller account is still awaiting final approval."
                  : "Your identity documents have been submitted and are being reviewed. This usually takes 24-48 hours."}
              </p>
              
              <button
                onClick={() => refetch()}
                className="px-6 py-2.5 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-900 dark:text-white rounded-xl font-semibold transition"
              >
                Refresh Status
              </button>
            </div>
          ) : (
            <div className="flex flex-col space-y-4">
              {/* Top Trust Header Inline */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 rounded-2xl flex items-center justify-center shadow-sm">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">Verification Process</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Complete these steps to verify your identity</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="flex flex-col items-center gap-1.5 w-16 sm:w-20">
                    <div className="w-full h-1.5 bg-cyan-500 rounded-full"></div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">Upload</span>
                  </div>
                  <div className="flex flex-col items-center gap-1.5 w-16 sm:w-20 opacity-40">
                    <div className="w-full h-1.5 bg-slate-200 dark:bg-white/20 rounded-full"></div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Review</span>
                  </div>
                  <div className="flex flex-col items-center gap-1.5 w-16 sm:w-20 opacity-40">
                    <div className="w-full h-1.5 bg-slate-200 dark:bg-white/20 rounded-full"></div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Approved</span>
                  </div>
                </div>
              </div>

              {isRejected && (
                <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl p-5 mb-8 flex gap-4">
                  <AlertCircle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-red-800 dark:text-red-400 font-bold mb-1 text-sm">Previous Submission Rejected</h3>
                    <p className="text-red-600 dark:text-red-300/80 text-xs leading-relaxed">
                      {statusData.rejectionReason || "Your previous documents were not accepted. Please upload clearer copies."}
                    </p>
                  </div>
                </div>
              )}

              {/* Document Type Selection Card */}
              <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-5 md:p-6">
                <div className="mb-4">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">1. Document Type</h3>
                  {/* Desktop/Tablet: Pill Grid */}
                  <div className="hidden sm:flex flex-wrap gap-2">
                    {DOC_TYPES.map(doc => (
                      <button
                        key={doc.id}
                        onClick={() => setSelectedDocType(doc.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                          selectedDocType === doc.id
                            ? 'bg-cyan-50 dark:bg-cyan-500/15 border-cyan-200 dark:border-cyan-500/30 text-cyan-700 dark:text-cyan-400 shadow-sm'
                            : 'bg-slate-50 dark:bg-black/20 border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:border-slate-300 dark:hover:border-white/10'
                        }`}
                      >
                        <doc.icon className={`w-3.5 h-3.5 ${selectedDocType === doc.id ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-400'}`} />
                        {doc.label}
                      </button>
                    ))}
                  </div>

                  {/* Mobile: Custom Select Dropdown */}
                  <div className="sm:hidden relative" ref={dropdownRef}>
                    <button
                      onClick={() => setDropdownOpen(!dropdownOpen)}
                      className="w-full flex items-center justify-between bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-cyan-500 transition-shadow"
                    >
                      <div className="flex items-center gap-2">
                        {(() => {
                          const doc = DOC_TYPES.find(d => d.id === selectedDocType);
                          if (!doc) return null;
                          const Icon = doc.icon;
                          return (
                            <>
                              <Icon className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                              <span>{doc.label}</span>
                            </>
                          );
                        })()}
                      </div>
                      <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {dropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#1a1a1f] border border-slate-200 dark:border-white/10 rounded-xl shadow-xl overflow-hidden z-20"
                        >
                          {DOC_TYPES.map(doc => (
                            <button
                              key={doc.id}
                              onClick={() => {
                                setSelectedDocType(doc.id);
                                setDropdownOpen(false);
                              }}
                              className={`w-full flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                                selectedDocType === doc.id
                                  ? 'bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-400'
                                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5'
                              }`}
                            >
                              <doc.icon className={`w-4 h-4 ${selectedDocType === doc.id ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-400'}`} />
                              {doc.label}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Contextual Tip Box */}
                <AnimatePresence mode="wait">
                  {TIPS[selectedDocType] && (
                    <motion.div
                      key={selectedDocType}
                      initial={{ opacity: 0, height: 0, y: -5 }}
                      animate={{ opacity: 1, height: 'auto', y: 0 }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="flex items-start gap-1.5 text-[11px] leading-tight pt-1">
                        <Info className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0 mt-px" />
                        <p className="text-amber-700 dark:text-amber-400/90 font-medium">{TIPS[selectedDocType]}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Upload Dropzone Card */}
              <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-5 md:p-6">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">2. Upload Documents</h3>
                <div 
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-[1.5px] border-dashed rounded-[14px] flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 overflow-hidden ${
                  selectedFiles.length > 0 ? 'p-4 min-h-[100px]' : 'p-6 min-h-[140px]'
                } ${
                  isDragging 
                    ? 'border-cyan-500 bg-[rgba(6,182,212,0.06)]' 
                    : 'border-slate-300 dark:border-[rgba(255,255,255,0.12)] hover:bg-slate-50 dark:hover:bg-white/[0.02]'
                }`}
              >
                <motion.div 
                  animate={{ y: isDragging ? -5 : 0 }}
                  className="flex flex-col items-center"
                >
                  <UploadCloud className={`w-8 h-8 mb-3 transition-colors ${isDragging ? 'text-cyan-500' : 'text-slate-400 dark:text-slate-500'}`} />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5">
                    Drag files here or click to browse
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    JPG, PNG, WEBP, PDF up to 5MB
                  </p>
                </motion.div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={onFileInput}
                  className="hidden" 
                  multiple 
                  accept=".jpg,.jpeg,.png,.webp,.pdf"
                />
              </div>

              {/* Selected Files List */}
              <AnimatePresence>
                {selectedFiles.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-6 space-y-3"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Documents ({selectedFiles.length}/5)</h4>
                      <div className="flex gap-1">
                        {[1,2,3,4,5].map(i => (
                          <div key={i} className={`w-3 h-1.5 rounded-full ${i <= selectedFiles.length ? 'bg-cyan-500' : 'bg-slate-200 dark:bg-white/10'}`} />
                        ))}
                      </div>
                    </div>
                    
                    {selectedFiles.map((f) => {
                      const isPdf = f.file.type === 'application/pdf' || f.file.name.endsWith('.pdf');
                      return (
                        <div key={f.id} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center p-3 bg-white dark:bg-[#222229] rounded-xl border border-slate-200 dark:border-white/5 shadow-sm group">
                          <div className="flex items-center gap-3 flex-1 overflow-hidden min-w-0">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${isPdf ? 'bg-red-50 dark:bg-red-500/10 text-red-500' : 'bg-cyan-50 dark:bg-cyan-500/10 text-cyan-500'}`}>
                              <FileType className="w-5 h-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate" title={f.file.name}>{f.file.name}</p>
                              <p className="text-[11px] text-slate-500">{(f.file.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                            <select 
                              value={f.type}
                              onChange={(e) => updateFileType(f.id, e.target.value as DocType)}
                              onClick={(e) => e.stopPropagation()}
                              className="bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 text-slate-700 dark:text-slate-300 text-[11px] font-medium rounded-lg px-2 py-1.5 outline-none focus:ring-1 focus:ring-cyan-500 w-full sm:w-36 appearance-none cursor-pointer"
                            >
                              {DOC_TYPES.map(doc => (
                                <option key={doc.id} value={doc.id}>{doc.label}</option>
                              ))}
                            </select>
                            <button 
                              onClick={(e) => { e.stopPropagation(); removeFile(f.id); }}
                              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>

              </div>

              {/* Bottom Actions */}
              <div className="flex flex-col items-center pt-2">
                {/* Trust Strip */}
                <div className="flex items-center justify-center gap-2 sm:gap-6 mb-4 text-[9px] sm:text-[11px] font-medium text-slate-500 dark:text-[rgba(255,255,255,0.4)] whitespace-nowrap">
                  <div className="flex items-center gap-1 sm:gap-1.5">
                    <Lock className="w-3 h-3 sm:w-3.5 sm:h-3.5 opacity-80 shrink-0" />
                    <span>256-bit encrypted</span>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-1.5">
                    <Eye className="w-3 h-3 sm:w-3.5 sm:h-3.5 opacity-80 shrink-0" />
                    <span>Reviewed by humans</span>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-1.5">
                    <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 opacity-80 shrink-0" />
                    <span>Deleted after 30 days</span>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  onClick={handleUpload}
                  disabled={uploadMutation.isPending || selectedFiles.length === 0 || isSuccess}
                  className={`w-full max-w-md py-3 px-6 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all duration-300 ${
                    selectedFiles.length === 0 && !isSuccess
                      ? 'bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                      : isSuccess
                        ? 'bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                        : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-500/20'
                  }`}
                >
                  {isSuccess ? (
                    <>
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}>
                        <CheckCircle2 className="w-5 h-5" />
                      </motion.div>
                      Documents submitted — we'll review within 24-48 hrs
                    </>
                  ) : uploadMutation.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Uploading securely...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      Submit for Verification
                    </>
                  )}
                </button>
              </div>

            </div>
          )}
        </motion.div>
      </section>
    </main>
  );
}
