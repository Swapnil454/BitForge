"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import api from "@/lib/api";
import { showError, showSuccess } from "@/lib/toast";
import { motion } from "framer-motion";
import PageHeader from "@/app/dashboard/buyer/transactions/components/PageHeader";
import { Pencil, Trash2, X, FileText, Image as ImageIcon, Save, ArrowLeft } from "lucide-react";

export default function EditProductPage() {
  const router = useRouter();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [category, setCategory] = useState("eBook");
  const [format, setFormat] = useState("PDF");
  const [language, setLanguage] = useState("English");
  const [pageCount, setPageCount] = useState(1);
  const [intendedAudience, setIntendedAudience] = useState("All Levels");
  
  const [editFile, setEditFile] = useState<File | null>(null);
  const [editThumbnail, setEditThumbnail] = useState<File | null>(null);
  const [editThumbnailPreview, setEditThumbnailPreview] = useState<string | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await api.get(`/products/${id}`);
        const p = res.data;
        setTitle(p.title || "");
        setDescription(p.description || "");
        setPrice(p.price || 0);
        setDiscount(p.discount || 0);
        setCategory(p.category || "eBook");
        setFormat(p.format || "PDF");
        setLanguage(p.language || "English");
        setPageCount(p.pageCount || 1);
        setIntendedAudience(p.intendedAudience || "All Levels");
        setEditThumbnailPreview(p.thumbnailUrl || null);
      } catch (err) {
        showError("Failed to load product details");
        router.push("/dashboard/seller/products");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id, router]);

  const handleEditThumbnail = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (!selected.type.startsWith("image/")) {
      showError("Thumbnail must be an image file");
      return;
    }
    if (selected.size > 5 * 1024 * 1024) {
      showError("Thumbnail must be under 5MB");
      return;
    }
    setEditThumbnail(selected);
    const reader = new FileReader();
    reader.onloadend = () => {
      setEditThumbnailPreview(reader.result as string);
    };
    reader.readAsDataURL(selected);
  };

  const removeEditThumbnail = () => {
    setEditThumbnail(null);
    setEditThumbnailPreview(null);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || price <= 0) {
      showError("Please fill out all required fields correctly.");
      return;
    }

    setSaving(true);
    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("price", String(price));
    formData.append("discount", String(discount));
    formData.append("category", category);
    formData.append("format", format);
    formData.append("language", language);
    formData.append("pageCount", String(pageCount));
    formData.append("intendedAudience", intendedAudience);
    
    if (editFile) formData.append("file", editFile);
    if (editThumbnail) formData.append("thumbnail", editThumbnail);

    try {
      await api.patch(`/products/${id}`, formData);
      showSuccess("Product updated successfully");
      router.push(`/dashboard/seller/products/${id}`);
    } catch (err: any) {
      showError(err.response?.data?.message || "Failed to update product");
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "w-full bg-slate-50 dark:bg-[#12141c] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all font-medium text-sm";
  const labelClass = "text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2 block";

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#05050a] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#05050a] pb-12">
      <PageHeader
        title="Edit Product"
        backLabel="Back to Product"
        onBack={() => router.push(`/dashboard/seller/products/${id}`)}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8">
        <form onSubmit={handleUpdate} className="space-y-6 sm:space-y-8">
          
          {/* Main Info Card */}
          <div className="bg-white dark:bg-[#0c0e14]/80 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <FileText className="w-5 h-5 text-cyan-500" />
              Basic Information
            </h2>
            
            <div className="space-y-5">
              <div>
                <label className={labelClass}>Product Title *</label>
                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={inputClass}
                  placeholder="e.g. Master React in 30 Days"
                />
              </div>

              <div>
                <label className={labelClass}>Description *</label>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={`${inputClass} resize-none`}
                  placeholder="Describe your product in detail..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className={labelClass}>Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Discount (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Details & Specifications */}
          <div className="bg-white dark:bg-[#0c0e14]/80 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <Pencil className="w-5 h-5 text-cyan-500" />
              Specifications
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <div>
                <label className={labelClass}>Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
                  <option value="eBook">eBook</option>
                  <option value="Course">Course</option>
                  <option value="Template">Template</option>
                  <option value="Software">Software</option>
                  <option value="Design Asset">Design Asset</option>
                </select>
              </div>
              
              <div>
                <label className={labelClass}>Format</label>
                <input value={format} onChange={(e) => setFormat(e.target.value)} className={inputClass} placeholder="e.g. PDF, MP4" />
              </div>

              <div>
                <label className={labelClass}>Language</label>
                <input value={language} onChange={(e) => setLanguage(e.target.value)} className={inputClass} placeholder="e.g. English" />
              </div>

              <div>
                <label className={labelClass}>Pages / Duration</label>
                <input type="number" value={pageCount} onChange={(e) => setPageCount(Number(e.target.value))} className={inputClass} />
              </div>

              <div>
                <label className={labelClass}>Audience Level</label>
                <select value={intendedAudience} onChange={(e) => setIntendedAudience(e.target.value)} className={inputClass}>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                  <option value="All Levels">All Levels</option>
                </select>
              </div>
            </div>
          </div>

          {/* Files & Media */}
          <div className="bg-white dark:bg-[#0c0e14]/80 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-cyan-500" />
              Media & Files
            </h2>
            
            <div className="space-y-8">
              <div>
                <label className={labelClass}>Update Product File (Optional)</label>
                <p className="text-xs text-slate-500 mb-3">Only upload a new file if you want to replace the existing one.</p>
                <input
                  type="file"
                  onChange={(e) => setEditFile(e.target.files?.[0] || null)}
                  className="w-full text-sm text-slate-500 dark:text-zinc-400 file:mr-4 file:rounded-lg file:border-0 file:bg-cyan-500/10 file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-cyan-600 dark:file:text-cyan-400 hover:file:bg-cyan-500/20 cursor-pointer transition-all border border-dashed border-slate-200 dark:border-white/20 p-4 rounded-xl"
                />
              </div>

              <div>
                <label className={labelClass}>Update Thumbnail (Optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleEditThumbnail}
                  className="w-full text-sm text-slate-500 dark:text-zinc-400 file:mr-4 file:rounded-lg file:border-0 file:bg-cyan-500/10 file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-cyan-600 dark:file:text-cyan-400 hover:file:bg-cyan-500/20 cursor-pointer transition-all border border-dashed border-slate-200 dark:border-white/20 p-4 rounded-xl mb-4"
                />
                
                {editThumbnailPreview && (
                  <div className="relative inline-block mt-2">
                    <img
                      src={editThumbnailPreview}
                      alt="Thumbnail preview"
                      className="w-48 aspect-[4/3] object-cover rounded-xl border-2 border-slate-200 dark:border-white/10"
                    />
                    <button
                      type="button"
                      onClick={removeEditThumbnail}
                      className="absolute -top-3 -right-3 bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center transition-transform hover:scale-110 shadow-lg"
                    >
                      <X className="w-4 h-4" strokeWidth={3} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4 pb-8 sticky bottom-0 bg-slate-50/80 dark:bg-[#05050a]/80 backdrop-blur-md p-4 rounded-2xl border border-slate-200 dark:border-white/10 z-10 shadow-xl">
            <button
              type="button"
              onClick={() => router.push(`/dashboard/seller/products/${id}`)}
              disabled={saving}
              className="flex-1 py-3.5 bg-slate-200 dark:bg-white/5 hover:bg-slate-300 dark:hover:bg-white/10 text-slate-900 dark:text-white rounded-xl font-bold transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-[2] py-3.5 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-cyan-500/25 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" />
              {saving ? "Saving Changes..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
