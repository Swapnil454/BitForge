"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { getStoredUser, clearAuthStorage } from "@/lib/cookies";
import { userAPI } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { UploadCloud, FileType, X, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

type DocType = 'government_id' | 'passport' | 'drivers_license' | 'business_license' | 'utility_bill' | 'other';

interface SelectedFile {
  file: File;
  type: DocType;
  id: string;
}

export default function PendingApprovalPage() {
  const router = useRouter();
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

      // Keep polling while identity or seller approval is still pending.
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
      toast.success("Documents uploaded successfully!");
      setSelectedFiles([]);
      refetch();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to upload documents");
    }
  });

  const handleLogout = () => {
    clearAuthStorage();
    router.push("/login");
  };

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
    handleFiles(e.dataTransfer.files);
  };

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (files: FileList) => {
    const newFiles: SelectedFile[] = Array.from(files).map(file => ({
      file,
      type: 'government_id', // default
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
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950">
        <Loader2 className="w-10 h-10 animate-spin text-cyan-500" />
      </div>
    );
  }

  // If the seller is fully approved, UI is hidden while redirecting.
  if (isSellerApproved) return null;

  const isPending = statusData.status === 'pending' || isAwaitingSellerAccountApproval;
  const isRejected = statusData.status === 'rejected';
  const isUnverified = statusData.status === 'unverified' || !statusData.status;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-16 px-4 font-sans">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto"
      >
        <div className="bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 rounded-3xl p-8 md:p-12">
          
          {isPending && (
            <div className="text-center flex flex-col items-center">
              <div className="w-24 h-24 bg-cyan-100 dark:bg-cyan-900/30 rounded-full flex items-center justify-center mb-6">
                <Loader2 className="w-12 h-12 text-cyan-500 animate-spin" />
              </div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                {isAwaitingSellerAccountApproval ? "Seller Account Under Review" : "Identity Under Review"}
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-lg">
                {isAwaitingSellerAccountApproval
                  ? "Your identity has been verified. Your seller account is still awaiting final approval, and you'll get access as soon as the review is complete."
                  : "Your identity documents have been submitted and are currently being reviewed by our compliance team. This usually takes 24-48 hours."}
              </p>
              
              <div className="flex gap-4 w-full justify-center">
                <button
                  onClick={() => refetch()}
                  className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-semibold transition"
                >
                  Refresh Status
                </button>
                <button
                  onClick={handleLogout}
                  className="px-6 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  Logout
                </button>
              </div>
            </div>
          )}

          {(isUnverified || isRejected) && (
            <div className="flex flex-col">
              <div className="text-center mb-10">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                  Verify Your Identity
                </h1>
                <p className="text-slate-500 dark:text-slate-400">
                  Before you can start selling, we need to verify your identity to ensure a safe marketplace for everyone.
                </p>
              </div>

              {isRejected && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-5 mb-8 flex gap-4">
                  <AlertCircle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-red-800 dark:text-red-400 font-semibold mb-1">Previous Submission Rejected</h3>
                    <p className="text-red-600 dark:text-red-300 text-sm">
                      {statusData.rejectionReason || "Your previous documents were not accepted. Please upload clearer copies or different documents."}
                    </p>
                  </div>
                </div>
              )}

              {/* Upload Dropzone */}
              <div 
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
                  isDragging 
                    ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/10' 
                    : 'border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <UploadCloud className={`w-12 h-12 mb-4 ${isDragging ? 'text-cyan-500' : 'text-slate-400'}`} />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  Click or drag files here
                </h3>
                <p className="text-sm text-slate-500">
                  Support for JPG, PNG, WEBP, and PDF. Up to 5 files (Max 5MB each).
                </p>
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
                    className="mt-8 space-y-4"
                  >
                    <h4 className="font-semibold text-slate-900 dark:text-white">Selected Documents ({selectedFiles.length}/5)</h4>
                    {selectedFiles.map((f) => (
                      <div key={f.id} className="flex flex-col sm:flex-row gap-4 items-start sm:items-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-3 flex-1 overflow-hidden">
                          <div className="w-10 h-10 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg flex items-center justify-center shrink-0">
                            <FileType className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{f.file.name}</p>
                            <p className="text-xs text-slate-500">{(f.file.size / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0">
                          <select 
                            value={f.type}
                            onChange={(e) => updateFileType(f.id, e.target.value as DocType)}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-cyan-500 w-full sm:w-48"
                          >
                            <option value="government_id">Government ID</option>
                            <option value="passport">Passport</option>
                            <option value="drivers_license">Driver's License</option>
                            <option value="business_license">Business License</option>
                            <option value="utility_bill">Utility Bill (Proof of Address)</option>
                            <option value="other">Other Document</option>
                          </select>
                          <button 
                            onClick={(e) => { e.stopPropagation(); removeFile(f.id); }}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="mt-10 flex gap-4">
                <button
                  onClick={handleUpload}
                  disabled={uploadMutation.isPending || selectedFiles.length === 0}
                  className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-3 px-6 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploadMutation.isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5" />
                  )}
                  {uploadMutation.isPending ? "Uploading..." : "Submit Documents"}
                </button>
                <button
                  onClick={handleLogout}
                  className="px-6 py-3 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  Logout
                </button>
              </div>

            </div>
          )}

        </div>
      </motion.div>
    </div>
  );
}
