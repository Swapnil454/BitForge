"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  AlertTriangle,
  BadgeAlert,
  CheckCircle2,
  ChevronDown,
  CreditCard,
  HelpCircle,
  Package,
  Paperclip,
  ShieldAlert,
  Upload,
  X,
} from "lucide-react";
import api from "@/lib/api";
import toast from "react-hot-toast";

const CATEGORIES = [
  { value: "item_not_delivered", label: "Item not delivered", icon: Package, color: "text-amber-400" },
  { value: "wrong_item", label: "Wrong item received", icon: AlertTriangle, color: "text-orange-400" },
  { value: "quality_issue", label: "Quality issue", icon: ShieldAlert, color: "text-yellow-400" },
  { value: "not_as_described", label: "Not as described", icon: BadgeAlert, color: "text-blue-400" },
  { value: "payment_issue", label: "Payment issue", icon: CreditCard, color: "text-purple-400" },
  { value: "other", label: "Other", icon: HelpCircle, color: "text-slate-400 dark:text-white/50" },
];

const MAX_FILES = 3;
const MAX_FILE_SIZE_MB = 5;
const MAX_CHARS = 500;
const MIN_CHARS = 10;

type UploadedFile = { file: File; preview?: string };

type Props = {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  orderNumber: string;
  productName: string;
  onSuccess?: () => void;
};

export default function RaiseDisputeModal(props: Props) {
  return (
    <AnimatePresence>
      {props.isOpen && <ModalShell {...props} />}
    </AnimatePresence>
  );
}

function ModalShell({ isOpen, onClose, orderId, orderNumber, productName, onSuccess }: Props) {
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<{ category?: string; description?: string; files?: string }>({});
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleClose = () => {
    if (submitting) return;
    setCategory(""); setDescription(""); setFiles([]); setErrors({}); setSubmitted(false);
    onClose();
  };

  const addFiles = (newFiles: FileList | File[]) => {
    const arr = Array.from(newFiles);
    const valid = arr.filter((f) => {
      if (!["image/jpeg", "image/png", "application/pdf"].includes(f.type)) {
        setErrors((e) => ({ ...e, files: `"${f.name}" must be JPG, PNG, or PDF.` })); return false;
      }
      if (f.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        setErrors((e) => ({ ...e, files: `"${f.name}" exceeds 5 MB.` })); return false;
      }
      return true;
    });
    if (files.length + valid.length > MAX_FILES) {
      setErrors((e) => ({ ...e, files: `Max ${MAX_FILES} files allowed.` })); return;
    }
    const mapped = valid.map((f) => ({ file: f, preview: f.type.startsWith("image/") ? URL.createObjectURL(f) : undefined }));
    setFiles((prev) => [...prev, ...mapped]);
    setErrors((e) => ({ ...e, files: undefined }));
  };

  const removeFile = (i: number) => {
    setFiles((prev) => { const c = [...prev]; if (c[i].preview) URL.revokeObjectURL(c[i].preview!); c.splice(i, 1); return c; });
  };

  const validate = () => {
    const errs: typeof errors = {};
    if (!category) errs.category = "Please select an issue type.";
    if (description.trim().length < MIN_CHARS) errs.description = `Minimum ${MIN_CHARS} characters required.`;
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("orderId", orderId);
      formData.append("category", category);
      formData.append("reason", description.trim());
      files.forEach((f) => formData.append("proofFiles", f.file));
      await api.post("/disputes", formData, { headers: { "Content-Type": "multipart/form-data" } });
      setSubmitted(true);
      onSuccess?.();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to submit dispute. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const sharedProps = { submitted, submitting, category, setCategory, description, setDescription, files, addFiles, removeFile, errors, dragging, setDragging, fileInputRef, orderNumber, productName, handleClose, handleSubmit };

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={handleClose}
        className="fixed inset-0 z-50 bg-white dark:bg-black/70 backdrop-blur-sm"
      />

      {/* Desktop Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ type: "spring", stiffness: 340, damping: 28 }}
        role="dialog" aria-modal="true"
        className="fixed inset-0 z-50 m-auto hidden sm:flex flex-col w-full max-w-lg max-h-[90vh] overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 bg-[#10121a] shadow-[0_32px_80px_rgba(0,0,0,0.6)]"
        style={{ height: "fit-content" }}
      >
        <ModalContent {...sharedProps} />
      </motion.div>

      {/* Mobile Bottom Sheet */}
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 380, damping: 34 }}
        role="dialog" aria-modal="true"
        className="fixed bottom-0 left-0 right-0 z-50 flex sm:hidden flex-col max-h-[92dvh] overflow-hidden rounded-t-3xl border-t border-slate-200 dark:border-white/10 bg-[#10121a] shadow-[0_-16px_60px_rgba(0,0,0,0.55)]"
      >
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="h-1 w-10 rounded-full bg-white/20" />
        </div>
        <ModalContent {...sharedProps} />
      </motion.div>
    </>
  );
}

/* ─── Custom Category Dropdown (centered panel, no scrim) ─── */

function CategoryDropdown({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const selected = CATEGORIES.find((c) => c.value === value);

  // Close on click outside the panel
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    // slight delay so the open-click doesn't immediately close
    const id = setTimeout(() => document.addEventListener("mousedown", handler), 50);
    return () => {
      clearTimeout(id);
      document.removeEventListener("mousedown", handler);
    };
  }, [open]);

  return (
    <>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`
          w-full flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm
          bg-white/[0.04] outline-none transition-all duration-200
          ${open
            ? "border-cyan-500/50 ring-1 ring-cyan-400/10"
            : error
            ? "border-red-500/50 hover:border-red-400/60"
            : "border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20"}
        `}
      >
        {selected ? (
          <span className="flex items-center gap-2.5 min-w-0">
            <selected.icon className={`h-4 w-4 shrink-0 ${selected.color}`} />
            <span className="text-slate-900 dark:text-white font-medium truncate">{selected.label}</span>
          </span>
        ) : (
          <span className="text-slate-300 dark:text-white/30">Select an option</span>
        )}
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="h-4 w-4 text-slate-300 dark:text-white/30 shrink-0" />
        </motion.div>
      </button>

      {/* Scrim + panel */}
      <AnimatePresence>
        {open && (
          <>
            {/* Dark overlay — instant, no fade, so form never shows through during panel animation */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-[60] bg-[#06070b]/80"
            />

            {/* Centered floating panel */}
            <motion.div
              ref={panelRef}
              initial={{ opacity: 0, scale: 0.93, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 10 }}
              transition={{ type: "spring", stiffness: 420, damping: 30 }}
              className="
                fixed z-[61]
                left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
                w-[min(320px,88vw)]
                overflow-hidden rounded-2xl
                border border-slate-200 dark:border-white/10
                bg-[#13151f]
                shadow-[0_24px_80px_rgba(0,0,0,0.9)]
              "
            >
              {/* Panel header */}
              <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400 dark:text-white/35">
                  Select Issue Type
                </p>
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-md p-1 text-slate-300 dark:text-white/30 hover:bg-white/8 hover:text-slate-600 dark:hover:text-white/70 transition"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Options */}
              <div className="py-1">
                {CATEGORIES.map((cat, idx) => {
                  const isSelected = value === cat.value;
                  return (
                    <motion.button
                      key={cat.value}
                      type="button"
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.028, duration: 0.18 }}
                      onClick={() => { onChange(cat.value); setOpen(false); }}
                      className={`
                        w-full flex items-center justify-between gap-3 px-3.5 py-2.5 text-sm
                        transition-all duration-150 group
                        ${isSelected ? "bg-white/[0.07]" : "hover:bg-white/[0.04]"}
                      `}
                    >
                      <span className="flex items-center gap-2.5 min-w-0">
                        <span className={`
                          flex h-7 w-7 items-center justify-center rounded-lg shrink-0 transition-colors
                          ${isSelected ? "bg-slate-200 dark:bg-white/10" : "bg-slate-100 dark:bg-white/[0.03] group-hover:bg-white/[0.06]"}
                        `}>
                          <cat.icon className={`h-3.5 w-3.5 transition-colors ${isSelected ? cat.color : "text-slate-300 dark:text-white/30 group-hover:text-white/55"}`} />
                        </span>
                        <span className={`font-medium text-sm truncate transition-colors ${isSelected ? "text-slate-900 dark:text-white" : "text-white/55 group-hover:text-white/85"}`}>
                          {cat.label}
                        </span>
                      </span>

                      {/* Radio */}
                      <span className={`
                        shrink-0 flex h-4 w-4 items-center justify-center rounded-full border-2 transition-all duration-200
                        ${isSelected ? "border-cyan-400 bg-cyan-400" : "border-white/15 group-hover:border-white/30"}
                      `}>
                        {isSelected && (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="h-1.5 w-1.5 rounded-full bg-[#0d0f16] block"
                          />
                        )}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>


      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
    </>
  );
}

/* ─── Modal content ──────────────────────────────────────── */


type ContentProps = {
  submitted: boolean; submitting: boolean;
  category: string; setCategory: (v: string) => void;
  description: string; setDescription: (v: string) => void;
  files: UploadedFile[]; addFiles: (f: FileList | File[]) => void; removeFile: (i: number) => void;
  errors: { category?: string; description?: string; files?: string };
  dragging: boolean; setDragging: (v: boolean) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  orderNumber: string; productName: string;
  handleClose: () => void; handleSubmit: () => void;
};

function ModalContent(p: ContentProps) {
  if (p.submitted) {
    return (
      <div className="flex flex-col items-center gap-4 px-6 py-10 text-center">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20"
        >
          <CheckCircle2 className="h-8 w-8 text-emerald-400" />
        </motion.div>
        <div>
          <p className="text-lg font-semibold text-slate-900 dark:text-white">Dispute Submitted</p>
          <p className="mt-1.5 text-sm text-slate-400 dark:text-white/50 leading-relaxed">
            We've received your dispute. Our team will review it within 24–48 hours.
          </p>
        </div>
        <div className="mt-1 w-full rounded-xl border border-white/8 bg-slate-100 dark:bg-white/[0.03] px-4 py-3 text-left text-sm">
          <div className="flex justify-between gap-2 text-slate-400 dark:text-white/35 text-[11px] mb-1.5 uppercase tracking-wider">
            <span>Order</span><span>#{p.orderNumber}</span>
          </div>
          <p className="text-slate-600 dark:text-white/70 font-medium truncate">{p.productName}</p>
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[11px] text-amber-400">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" /> Pending Review
          </div>
        </div>
        <button onClick={p.handleClose} className="mt-1 w-full rounded-xl bg-white/8 border border-slate-200 dark:border-white/10 py-3 text-sm font-medium text-slate-700 dark:text-white/80 hover:bg-white/12 hover:text-slate-900 dark:hover:text-white transition">
          Close
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 border-b border-white/8 px-5 py-4 shrink-0">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Raise a Dispute</h2>
          <p className="mt-0.5 text-xs text-slate-400 dark:text-white/40">Tell us what went wrong with your purchase.</p>
        </div>
        <button onClick={p.handleClose} className="shrink-0 mt-0.5 rounded-lg p-1.5 text-slate-400 dark:text-white/35 hover:bg-white/8 hover:text-slate-700 dark:hover:text-white/80 transition" aria-label="Close">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Context pill */}
      <div className="mx-5 mt-4 shrink-0 flex items-center gap-2.5 rounded-xl border border-white/8 bg-slate-100 dark:bg-white/[0.03] px-3.5 py-2.5">
        <AlertCircle className="h-4 w-4 text-red-400/70 shrink-0" />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-700 dark:text-white/80">{p.productName}</p>
          <p className="text-[11px] text-slate-300 dark:text-white/30">Order #{p.orderNumber}</p>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="overflow-y-auto px-5 pb-4 mt-4 flex flex-col gap-4">

        {/* Category — Custom Dropdown */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-white/55 uppercase tracking-wider">
            Issue Type <span className="text-red-400">*</span>
          </label>
          <CategoryDropdown value={p.category} onChange={p.setCategory} error={p.errors.category} />
        </div>

        {/* Description */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="text-xs font-medium text-white/55 uppercase tracking-wider">
              Describe your issue <span className="text-red-400">*</span>
            </label>
            <span className={`text-xs tabular-nums ${p.description.length > MAX_CHARS ? "text-red-400" : "text-white/25"}`}>
              {p.description.length}/{MAX_CHARS}
            </span>
          </div>
          <textarea
            value={p.description}
            onChange={(e) => { if (e.target.value.length <= MAX_CHARS) p.setDescription(e.target.value); }}
            rows={4}
            placeholder="Explain what happened, when it occurred, and what you expected."
            className={`
              w-full resize-none rounded-xl border px-4 py-3 text-sm
              bg-white/[0.04] text-slate-900 dark:text-white placeholder-white/20 outline-none transition
              focus:ring-1
              ${p.errors.description
                ? "border-red-500/50 focus:border-red-400 focus:ring-red-400/20"
                : "border-slate-200 dark:border-white/10 focus:border-cyan-500/50 focus:ring-cyan-400/10"}
            `}
          />
          {p.errors.description
            ? <p className="mt-1.5 text-xs text-red-400">{p.errors.description}</p>
            : <p className="mt-1.5 text-xs text-white/25">Be as specific as possible for faster resolution.</p>}
        </div>

        {/* File Upload */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-white/55 uppercase tracking-wider">
            Proof Upload <span className="text-slate-200 dark:text-white/20">(optional)</span>
          </label>
          <div
            onDragOver={(e) => { e.preventDefault(); p.setDragging(true); }}
            onDragLeave={() => p.setDragging(false)}
            onDrop={(e) => { e.preventDefault(); p.setDragging(false); p.addFiles(e.dataTransfer.files); }}
            onClick={() => p.fileInputRef.current?.click()}
            className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-5 cursor-pointer transition-all ${p.dragging ? "border-cyan-400/50 bg-cyan-400/5" : "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] hover:border-slate-300 dark:hover:border-white/20 hover:bg-white/[0.04]"}`}
          >
            <Upload className="h-5 w-5 text-white/25" />
            <div className="text-center">
              <p className="text-sm text-white/45"><span className="text-cyan-400 font-medium">Click to upload</span> or drag & drop</p>
              <p className="mt-0.5 text-xs text-slate-200 dark:text-white/20">JPG, PNG, PDF · Max 5MB · Up to 3 files</p>
            </div>
          </div>
          <input ref={p.fileInputRef} type="file" accept=".jpg,.jpeg,.png,.pdf" multiple className="hidden" onChange={(e) => e.target.files && p.addFiles(e.target.files)} />
          {p.errors.files && <p className="mt-1.5 text-xs text-red-400">{p.errors.files}</p>}
          {p.files.length > 0 && (
            <div className="mt-3 flex flex-col gap-2">
              {p.files.map((f, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl border border-white/8 bg-slate-100 dark:bg-white/[0.03] px-3 py-2.5">
                  {f.preview
                    ? <img src={f.preview} alt="" className="h-9 w-9 rounded-lg object-cover shrink-0 border border-slate-200 dark:border-white/10" />
                    : <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 shrink-0"><Paperclip className="h-4 w-4 text-slate-400 dark:text-white/35" /></div>}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white/75">{f.file.name}</p>
                    <p className="text-xs text-white/25">{(f.file.size / 1024).toFixed(0)} KB</p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); p.removeFile(i); }} className="shrink-0 rounded-lg p-1.5 text-white/25 hover:bg-white/8 hover:text-red-400 transition">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Action bar */}
      <div className="shrink-0 border-t border-white/8 px-5 py-4 flex gap-3">
        <button
          onClick={p.handleClose} disabled={p.submitting}
          className="flex-1 rounded-xl border border-slate-200 dark:border-white/10 bg-white/[0.04] py-3 text-sm font-medium text-white/55 hover:bg-white/8 hover:text-white/85 transition disabled:opacity-40"
        >
          Cancel
        </button>
        <button
          onClick={p.handleSubmit} disabled={p.submitting}
          className="flex-[2] rounded-xl bg-red-500 py-3 text-sm font-semibold text-slate-900 dark:text-white hover:bg-red-400 transition disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {p.submitting ? (
            <>
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
              Submitting…
            </>
          ) : "Submit Dispute"}
        </button>
      </div>
    </div>
  );
}
