"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { reportAPI } from "@/lib/api";
import { useTheme } from "next-themes";
import { 
  AlertCircle, Upload, X, CheckCircle2, Loader2, ArrowLeft, ShieldAlert, FileText, ChevronDown, 
  Check, Edit2, User, Mail, Lock, CreditCard, AlertTriangle, HelpCircle, FileImage, File
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { getCookie } from "@/lib/cookies";

const ISSUE_TYPES = [
  { id: "wrongful_ban", label: "Account Suspended", description: "I believe my account was suspended by mistake", icon: Lock },
  { id: "account_restricted", label: "Account Restricted", description: "Cannot access purchasing or selling", icon: ShieldAlert },
  { id: "payment_issue", label: "Payment Issue", description: "Problems with billing or purchases", icon: CreditCard },
  { id: "login_issue", label: "Login / Access", description: "Having trouble logging into account", icon: User },
  { id: "technical_issue", label: "Technical Bug", description: "Platform is broken or not working", icon: AlertTriangle },
  { id: "other", label: "Other Inquiry", description: "General questions not listed above", icon: HelpCircle }
];

// Floating Label Input Component
const FloatingInput = ({ label, name, type = "text", value, onChange, error, required = false }: any) => {
  const [focused, setFocused] = useState(false);
  const isFilled = value.length > 0;
  
  return (
    <div className="relative w-full">
      <div className={`relative rounded-xl transition-all bg-[#F5F5F7] dark:bg-[rgba(255,255,255,0.04)] ${focused ? 'ring-[3px] ring-[#6C63FF]/15 border border-[#6C63FF]' : error ? 'border border-red-500' : 'border border-transparent border-b-2 border-b-[#E5E7EB] dark:border-b-[rgba(255,255,255,0.08)] hover:bg-[#E5E7EB]/50 dark:hover:bg-[rgba(255,255,255,0.06)]'}`}>
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="w-full px-4 pt-6 pb-2.5 bg-transparent outline-none transition-all text-slate-900 dark:text-white"
          required={required}
        />
        <label className={`absolute left-4 transition-all pointer-events-none flex gap-1 ${focused || isFilled ? 'top-1.5 text-[11px] font-semibold text-[#6C63FF]' : 'top-4 text-sm text-slate-500 dark:text-slate-400'}`}>
          {label} {required && <span className="text-red-400">*</span>}
        </label>
      </div>
      <AnimatePresence>
        {error && (
          <motion.p 
            initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
            className="text-xs text-red-500 mt-1.5 flex items-center gap-1"
          >
            <AlertCircle className="w-3.5 h-3.5" />{error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function ReportPage() {
  const router = useRouter();
  const { theme } = useTheme();
  
  // Wizard State
  const [currentStep, setCurrentStep] = useState(1);
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
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) {
      setErrors(prev => ({ ...prev, [e.target.name]: "" }));
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    handleInputChange(e);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 320)}px`;
    }
  };

  // Drag and Drop State
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);
    
    // Check total files
    if (files.length + fileArray.length > 5) {
      toast.error("You can only upload up to 5 files.");
      return;
    }
    
    setFiles(prev => [...prev, ...fileArray]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Step Validation
  const validateStep = (step: number) => {
    const newErrors: { [key: string]: string } = {};
    if (step === 1) {
      if (!formData.reporterName.trim()) newErrors.reporterName = "Full name is required";
      if (!formData.reporterEmail.trim()) newErrors.reporterEmail = "Email is required";
      else if (!/^\S+@\S+\.\S+$/.test(formData.reporterEmail)) newErrors.reporterEmail = "Invalid email format";
    }
    if (step === 2) {
      if (!formData.issueType) newErrors.issueType = "Please select an issue type";
      if (!formData.description.trim()) newErrors.description = "Description is required";
      else if (formData.description.length < 20) newErrors.description = "Description must be at least 20 characters";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const submitData = new FormData();
      submitData.append("reporterEmail", String(formData.reporterEmail).trim());
      submitData.append("reporterName", String(formData.reporterName).trim());
      submitData.append("issueType", String(formData.issueType));
      submitData.append("description", String(formData.description));
      
      files.forEach(file => {
        submitData.append("proofs", file);
      });

      const response = await reportAPI.submitReport(submitData as any);
      setReportId(response.reportId || `BF-${Math.floor(Math.random() * 100000)}`);
      setIsSuccess(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to submit report");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Navigation Helper
  const getAuthRole = () => {
    const token = getCookie('token');
    if (!token) return null;
    const userStr = getCookie('user');
    if (userStr) {
      try {
        return JSON.parse(userStr).role || 'buyer';
      } catch (e) {}
    }
    return 'buyer';
  };

  const role = getAuthRole();

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] dark:bg-[#0D0D0F] text-slate-900 dark:text-white flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-[#1A1A1F] border border-[#E5E7EB] dark:border-[rgba(255,255,255,0.08)] rounded-2xl shadow-sm p-8 sm:p-12 text-center max-w-[500px] w-full"
        >
          <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          
          <h2 className="text-2xl font-bold mb-3">Report Submitted</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8 text-sm">
            Thank you. We review every report manually and will follow up via email at <span className="font-semibold text-slate-900 dark:text-white">{formData.reporterEmail}</span>.
          </p>
          
          <div className="bg-[#F5F5F7] dark:bg-[rgba(255,255,255,0.03)] border border-[#E5E7EB] dark:border-[rgba(255,255,255,0.08)] rounded-xl p-4 mb-8">
            <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1 uppercase tracking-wider">Reference ID</span>
            <span className="text-lg font-mono text-[#6C63FF] font-bold">{reportId}</span>
          </div>
          
          <button
            onClick={() => role ? router.push(`/dashboard/${role}/reports`) : router.push("/login?next=/dashboard/buyer/reports")}
            className="w-full py-3.5 rounded-xl font-semibold text-white bg-[#6C63FF] hover:bg-[#5a52d6] transition-colors"
          >
            Track My Reports
          </button>
        </motion.div>
      </div>
    );
  }

  const steps = [
    { num: 1, label: "Contact" },
    { num: 2, label: "Issue" },
    { num: 3, label: "Evidence" }
  ];

  return (
    <div className="min-h-screen bg-[#F5F5F7] dark:bg-[#0D0D0F] text-slate-900 dark:text-white pb-24 sm:pb-12">
      
      {/* Frosted Glass Navbar */}
      <div className="sticky top-0 z-50 bg-white/70 dark:bg-[#1A1A1F]/70 backdrop-blur-xl border-b border-[#E5E7EB] dark:border-[rgba(255,255,255,0.08)]">
        <div className="max-w-[1200px] mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => role ? router.push(`/dashboard/${role}`) : router.push("/login")}
              className="p-2 -ml-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors text-slate-500 dark:text-slate-400"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-semibold text-[15px] sm:text-base leading-tight">Trust & Safety</h1>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 hidden sm:block">We review every report manually</p>
            </div>
          </div>
          <button 
            onClick={() => role ? router.push(`/dashboard/${role}/reports`) : router.push("/login?next=/dashboard/buyer/reports")}
            className="px-4 py-2 text-xs sm:text-sm font-medium border border-[#E5E7EB] dark:border-[rgba(255,255,255,0.08)] rounded-full hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-slate-700 dark:text-slate-300"
          >
            Track Reports
          </button>
        </div>
      </div>

      <div className="max-w-[680px] mx-auto px-4 pt-8">
        
        {/* Stepper */}
        <div className="mb-8">
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-[2px] bg-[#E5E7EB] dark:bg-[rgba(255,255,255,0.08)] -z-10 rounded-full" />
            <div 
              className="absolute left-0 top-1/2 -translate-y-1/2 h-[2px] bg-[#22C55E] transition-all duration-500 -z-10 rounded-full"
              style={{ width: `${((Math.min(currentStep, 3) - 1) / 2) * 100}%` }}
            />
            
            {steps.map((step) => {
              const isCompleted = currentStep > step.num || currentStep === 4;
              const isActive = currentStep === step.num;
              
              return (
                <div key={step.num} className="flex flex-col items-center gap-2 bg-[#F5F5F7] dark:bg-[#0D0D0F] px-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 border-2 ${
                    isCompleted 
                      ? "bg-[#22C55E] border-[#22C55E] text-white" 
                      : isActive 
                        ? "bg-[#6C63FF] border-[#6C63FF] text-white" 
                        : "bg-white dark:bg-[#1A1A1F] border-[#E5E7EB] dark:border-[rgba(255,255,255,0.15)] text-slate-400 dark:text-slate-500"
                  }`}>
                    {isCompleted ? <Check className="w-4 h-4" /> : step.num}
                  </div>
                  <span className={`text-[11px] sm:text-xs font-medium ${isActive || isCompleted ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white dark:bg-[#1A1A1F] border border-[#E5E7EB] dark:border-[rgba(255,255,255,0.08)] rounded-2xl p-6 sm:p-8 shadow-sm">
          <AnimatePresence mode="wait">
            
            {/* Step 1: Contact */}
            {currentStep === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                <h2 className="text-[18px] font-semibold mb-6">Contact Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <FloatingInput 
                    label="Full Name" 
                    name="reporterName" 
                    value={formData.reporterName} 
                    onChange={handleInputChange} 
                    error={errors.reporterName} 
                  />
                  <FloatingInput 
                    label="Email Address" 
                    name="reporterEmail" 
                    type="email" 
                    value={formData.reporterEmail} 
                    onChange={handleInputChange} 
                    error={errors.reporterEmail} 
                  />
                </div>
              </motion.div>
            )}

            {/* Step 2: Issue Details */}
            {currentStep === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                <h2 className="text-[18px] font-semibold mb-6">Issue Details</h2>
                
                <div className="space-y-6">
                  {/* Dropdown */}
                  <div className="relative" ref={dropdownRef}>
                    <button
                      type="button"
                      onClick={() => setDropdownOpen(!dropdownOpen)}
                      className={`w-full flex items-center justify-between px-4 py-4 bg-[#F5F5F7] dark:bg-[rgba(255,255,255,0.04)] border rounded-xl transition-all text-left ${errors.issueType ? 'border-red-500' : 'border border-transparent border-b-2 border-b-[#E5E7EB] dark:border-b-[rgba(255,255,255,0.08)] hover:bg-[#E5E7EB]/50 dark:hover:bg-[rgba(255,255,255,0.06)]'}`}
                    >
                      <div className="flex-1">
                        <div className="text-[11px] font-semibold text-[#6C63FF] mb-0.5">Issue Type *</div>
                        {formData.issueType ? (
                          <div className="text-sm font-medium text-slate-900 dark:text-white flex items-center gap-2">
                            {(() => {
                              const selected = ISSUE_TYPES.find(t => t.id === formData.issueType);
                              const Icon = selected?.icon || HelpCircle;
                              return <><Icon className="w-4 h-4 text-slate-400" /> {selected?.label}</>;
                            })()}
                          </div>
                        ) : (
                          <span className="text-sm text-slate-500">Select an issue...</span>
                        )}
                      </div>
                      <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {errors.issueType && <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{errors.issueType}</p>}

                    <AnimatePresence>
                      {dropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -5, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -5, scale: 0.98 }}
                          transition={{ duration: 0.15 }}
                          className="absolute left-0 right-0 mt-2 rounded-xl border border-[#E5E7EB] dark:border-[rgba(255,255,255,0.08)] bg-white dark:bg-[#1A1A1F] shadow-xl z-10 overflow-hidden"
                        >
                          <div className="max-h-[300px] overflow-y-auto p-1.5 space-y-0.5">
                            {ISSUE_TYPES.map(type => {
                              const isSelected = formData.issueType === type.id;
                              const Icon = type.icon;
                              return (
                                <button
                                  key={type.id}
                                  type="button"
                                  onClick={() => {
                                    setFormData(prev => ({ ...prev, issueType: type.id }));
                                    setErrors(prev => ({ ...prev, issueType: "" }));
                                    setDropdownOpen(false);
                                  }}
                                  className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors ${
                                    isSelected ? 'bg-[#6C63FF]/10 text-[#6C63FF] border-l-2 border-[#6C63FF]' : 'hover:bg-slate-50 dark:hover:bg-white/5 border-l-2 border-transparent'
                                  }`}
                                >
                                  <Icon className={`w-5 h-5 ${isSelected ? 'text-[#6C63FF]' : 'text-slate-400'}`} />
                                  <div>
                                    <div className={`text-sm font-medium ${isSelected ? 'text-[#6C63FF]' : 'text-slate-700 dark:text-slate-200'}`}>{type.label}</div>
                                    <div className={`text-xs ${isSelected ? 'text-[#6C63FF]/70' : 'text-slate-500 dark:text-slate-400'}`}>{type.description}</div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Textarea */}
                  <div>
                    <div className={`relative rounded-xl transition-all bg-[#F5F5F7] dark:bg-[rgba(255,255,255,0.04)] ${errors.description ? 'border border-red-500' : 'border border-transparent border-b-2 border-b-[#E5E7EB] dark:border-b-[rgba(255,255,255,0.08)] focus-within:ring-[3px] focus-within:ring-[#6C63FF]/15 focus-within:border-[#6C63FF]'}`}>
                      <div className="px-4 pt-3 pb-1 flex justify-between items-center">
                        <span className="text-[11px] font-semibold text-[#6C63FF]">Description *</span>
                        <span className={`text-[10px] font-medium ${
                          formData.description.length > 1950 ? 'text-red-500' : 
                          formData.description.length > 1800 ? 'text-orange-500' : 'text-slate-400'
                        }`}>
                          {formData.description.length} / 2000
                        </span>
                      </div>
                      <textarea
                        ref={textareaRef}
                        name="description"
                        value={formData.description}
                        onChange={handleTextareaChange}
                        placeholder="Please provide as much detail as possible..."
                        className="w-full px-4 py-2 bg-transparent outline-none text-sm text-slate-900 dark:text-white resize-none custom-scrollbar"
                        style={{ minHeight: "100px" }}
                        maxLength={2000}
                      />
                    </div>
                    {errors.description ? (
                      <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{errors.description}</p>
                    ) : (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 ml-1">Be specific — vague reports take longer to resolve.</p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 3: Evidence */}
            {currentStep === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                <h2 className="text-[18px] font-semibold mb-6">Supporting Evidence <span className="text-sm font-normal text-slate-400">(Optional)</span></h2>
                
                <div className="space-y-4">
                  <div 
                    className={`relative border-2 border-dashed rounded-xl p-8 transition-all duration-300 flex flex-col items-center justify-center cursor-pointer ${
                      isDragging 
                        ? 'border-[#6C63FF] bg-[#6C63FF]/5' 
                        : 'border-[#E5E7EB] dark:border-[rgba(255,255,255,0.15)] bg-[#F5F5F7]/50 dark:bg-[rgba(255,255,255,0.02)] hover:border-[#6C63FF]/50 hover:bg-[#6C63FF]/[0.02]'
                    }`}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      if (e.dataTransfer.files) handleFileChange(e.dataTransfer.files);
                    }}
                  >
                    <input
                      type="file"
                      multiple
                      accept="image/*,.pdf"
                      onChange={(e) => e.target.files && handleFileChange(e.target.files)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      disabled={files.length >= 5}
                    />
                    <Upload className={`w-8 h-8 mb-3 transition-colors ${isDragging ? 'text-[#6C63FF]' : 'text-slate-400'}`} />
                    <p className="font-medium text-sm text-slate-700 dark:text-slate-200 mb-1">Drag files here or click to browse</p>
                    <p className="text-xs text-slate-500">JPG, PNG, PDF (Max 5 files)</p>
                  </div>

                  {files.length > 0 && (
                    <div className="space-y-2">
                      {files.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-white dark:bg-[#1A1A1F] border border-[#E5E7EB] dark:border-[rgba(255,255,255,0.08)] rounded-xl shadow-sm">
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-8 h-8 bg-slate-100 dark:bg-white/5 rounded-lg flex items-center justify-center shrink-0">
                              {file.type.includes('image') ? <FileImage className="w-4 h-4 text-slate-500" /> : <File className="w-4 h-4 text-slate-500" />}
                            </div>
                            <div className="truncate">
                              <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{file.name}</p>
                              <p className="text-[10px] text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="p-2 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg text-slate-400 hover:text-red-500 transition-colors shrink-0"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Step 4: Review */}
            {currentStep === 4 && (
              <motion.div key="step4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                <h2 className="text-[18px] font-semibold mb-6">Review & Submit</h2>
                
                <div className="space-y-3">
                  <div className="bg-[#F5F5F7] dark:bg-[rgba(255,255,255,0.03)] border border-[#E5E7EB] dark:border-[rgba(255,255,255,0.08)] rounded-xl p-4 flex justify-between items-start gap-4">
                    <div className="min-w-0">
                      <div className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider mb-1">Contact</div>
                      <div className="text-sm font-medium text-slate-900 dark:text-white truncate">{formData.reporterName}</div>
                      <div className="text-xs text-slate-500 truncate">{formData.reporterEmail}</div>
                    </div>
                    <button onClick={() => setCurrentStep(1)} className="p-1.5 text-slate-400 hover:bg-white dark:hover:bg-white/10 rounded-lg hover:text-[#6C63FF] transition-colors shrink-0"><Edit2 className="w-3.5 h-3.5" /></button>
                  </div>

                  <div className="bg-[#F5F5F7] dark:bg-[rgba(255,255,255,0.03)] border border-[#E5E7EB] dark:border-[rgba(255,255,255,0.08)] rounded-xl p-4 flex justify-between items-start gap-4">
                    <div className="min-w-0">
                      <div className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider mb-1">Issue</div>
                      <div className="text-sm font-medium text-slate-900 dark:text-white truncate">{ISSUE_TYPES.find(t => t.id === formData.issueType)?.label}</div>
                      <div className="text-xs text-slate-500 line-clamp-2 mt-1">{formData.description.substring(0, 100)}{formData.description.length > 100 ? '...' : ''}</div>
                    </div>
                    <button onClick={() => setCurrentStep(2)} className="p-1.5 text-slate-400 hover:bg-white dark:hover:bg-white/10 rounded-lg hover:text-[#6C63FF] transition-colors shrink-0"><Edit2 className="w-3.5 h-3.5" /></button>
                  </div>

                  <div className="bg-[#F5F5F7] dark:bg-[rgba(255,255,255,0.03)] border border-[#E5E7EB] dark:border-[rgba(255,255,255,0.08)] rounded-xl p-4 flex justify-between items-start gap-4">
                    <div className="min-w-0">
                      <div className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider mb-1">Evidence</div>
                      <div className="text-sm font-medium text-slate-900 dark:text-white">{files.length} file(s) attached</div>
                    </div>
                    <button onClick={() => setCurrentStep(3)} className="p-1.5 text-slate-400 hover:bg-white dark:hover:bg-white/10 rounded-lg hover:text-[#6C63FF] transition-colors shrink-0"><Edit2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation Buttons */}
        <div className="mt-6 flex flex-col-reverse sm:flex-row items-center justify-end gap-3 sm:gap-4 sticky bottom-6 z-40 bg-[#F5F5F7]/80 dark:bg-[#0D0D0F]/80 backdrop-blur-md p-3 sm:p-0 rounded-2xl sm:bg-transparent sm:backdrop-blur-none sm:static border border-[#E5E7EB] dark:border-white/10 sm:border-transparent">
          {currentStep > 1 && (
            <button
              type="button"
              onClick={prevStep}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-6 py-3 rounded-xl font-semibold text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-white/5 transition-colors flex items-center justify-center gap-2 border sm:border-transparent border-slate-200 dark:border-white/10"
            >
              Back
            </button>
          )}
          
          {currentStep < 4 ? (
            <button
              type="button"
              onClick={nextStep}
              className="w-full sm:w-auto px-8 py-3 rounded-xl font-semibold text-white bg-[#6C63FF] hover:bg-[#5a52d6] transition-colors shadow-sm"
            >
              Continue
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-8 py-3 rounded-xl font-semibold text-white bg-[#6C63FF] hover:bg-[#5a52d6] transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {isSubmitting ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Submitting...</>
              ) : "Submit Report"}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
