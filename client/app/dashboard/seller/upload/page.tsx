



"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { showError, showSuccess } from "@/lib/toast";
import {
  Upload, Package, FileText, Image as ImageIcon, Tag,
  Globe, FileType, Users, Hash, Pencil, Trash2,
  CheckCircle, Clock, XCircle, ChevronLeft, Sparkles,
  ScrollText, IndianRupee, Percent, MoreVertical
} from "lucide-react";
import PageHeader from "../../buyer/transactions/components/PageHeader";

/* ================= CONSTANTS ================= */

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

/* ================= TYPES ================= */

type ProductStatus = "pending" | "approved" | "rejected";

interface Product {
  _id: string;
  title: string;
  price: number;
  discount: number;
  status: ProductStatus;
  description: string;
  fileKey: string;
  fileUrl: string;
  thumbnailKey?: string;
  thumbnailUrl?: string;
  createdAt: string;
  language?: string;
  format?: string;
  intendedAudience?: string;
  pageCount?: number;
  category?: string;
}

/* ================= PAGE ================= */

export default function UploadAndProductsPage() {
  const [loading, setLoading] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");

  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

  const [price, setPrice] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  
  // B. Structured validation fields
  const [language, setLanguage] = useState<string>("English");
  const [format, setFormat] = useState<string>("PDF");
  const [intendedAudience, setIntendedAudience] = useState<string>("All Levels");
  const [pageCount, setPageCount] = useState<number>(1);
  const [category, setCategory] = useState<string>("eBook");

  const [products, setProducts] = useState<Product[]>([]);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | ProductStatus>("all");

  // Edit modal state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editDiscount, setEditDiscount] = useState<number>(0);
  const [editLanguage, setEditLanguage] = useState<string>("English");
  const [editFormat, setEditFormat] = useState<string>("PDF");
  const [editCategory, setEditCategory] = useState<string>("eBook");
  const [editIntendedAudience, setEditIntendedAudience] = useState<string>("All Levels");
  const [editPageCount, setEditPageCount] = useState<number>(1);
  const [editFile, setEditFile] = useState<File | null>(null);
  const [editFileError, setEditFileError] = useState("");
  const [editThumbnail, setEditThumbnail] = useState<File | null>(null);
  const [editThumbnailPreview, setEditThumbnailPreview] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  // Delete confirmation state
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  /* ================= LOAD PRODUCTS ================= */
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoadingProducts(true);
        const response = await api.get("/products/mine");
        setProducts(response.data || []);
      } catch (error) {
        console.error("Failed to load products:", error);
        showError("Failed to load your products");
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchProducts();
  }, []);

  /* ================= DERIVED ================= */

  const finalPrice =
    price && discount ? Math.max(price - (price * discount) / 100, 0) : price;

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = p.title
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesFilter =
        filter === "all" ? true : p.status === filter;

      return matchesSearch && matchesFilter;
    });
  }, [products, search, filter]);

  /* ================= HANDLERS ================= */

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (selected.size > MAX_FILE_SIZE) {
      setFileError("File size must be under 100MB");
      setFile(null);
      return;
    }

    setFile(selected);
    setFileError("");
  };

  const handleThumbnail = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!selected.type.startsWith("image/")) {
      showError("Thumbnail must be an image file");
      return;
    }

    if (selected.size > 5 * 1024 * 1024) {
      showError("Thumbnail size must be under 5MB");
      return;
    }

    setThumbnail(selected);
    const reader = new FileReader();
    reader.onloadend = () => {
      setThumbnailPreview(reader.result as string);
    };
    reader.readAsDataURL(selected);
  };

  const removeThumbnail = () => {
    setThumbnail(null);
    setThumbnailPreview(null);
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    
    if (!acceptedTerms) {
      showError("Please accept the Seller Terms & Conditions to continue");
      return;
    }
    
    if (!file) {
      setFileError("Please select a file");
      return;
    }

    if (!price || price <= 0) {
      showError("Please enter a valid price");
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("title", e.target.title.value);
    formData.append("description", e.target.description.value);
    formData.append("price", String(price));
    formData.append("discount", String(discount || 0));
    formData.append("language", language);
    formData.append("format", format);
    formData.append("intendedAudience", intendedAudience);
    formData.append("pageCount", String(pageCount));
    formData.append("category", category);
    formData.append("file", file);
    if (thumbnail) {
      formData.append("thumbnail", thumbnail);
    }

    try {
      const response = await api.post("/products/upload", formData);

      showSuccess("Product uploaded successfully!");
      setSubmitted(true);

      // Add the new product to the list
      setProducts((prev) => [response.data.product, ...prev]);

      e.target.reset();
      setFile(null);
      setThumbnail(null);
      setThumbnailPreview(null);
      setPrice(0);
      setDiscount(0);
      setLanguage("English");
      setFormat("PDF");
      setIntendedAudience("All Levels");
      setPageCount(1);
      setCategory("eBook");
      setAcceptedTerms(false);
    } catch (error: any) {
      console.error("Upload error:", error);
      showError(error.response?.data?.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (product: Product) => {
    setEditingProduct(product);
    setEditTitle(product.title);
    setEditDescription(product.description);
    setEditPrice(product.price);
    setEditDiscount(product.discount);
    setEditLanguage((product as any).language || "English");
    setEditFormat((product as any).format || "PDF");
    setEditCategory((product as any).category || "eBook");
    setEditIntendedAudience((product as any).intendedAudience || "All Levels");
    setEditPageCount((product as any).pageCount || 1);
    setEditFile(null);
    setEditFileError("");
    setEditThumbnail(null);
    setEditThumbnailPreview(product.thumbnailUrl || null);
  };

  const handleEditFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) {
      setEditFile(null);
      setEditFileError("");
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      setEditFileError(`File too large (max ${MAX_FILE_SIZE / 1024 / 1024}MB)`);
      setEditFile(null);
      return;
    }

    setEditFileError("");
    setEditFile(selectedFile);
  };

  const handleEditThumbnail = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!selected.type.startsWith("image/")) {
      showError("Thumbnail must be an image file");
      return;
    }

    if (selected.size > 5 * 1024 * 1024) {
      showError("Thumbnail size must be under 5MB");
      return;
    }

    setEditThumbnail(selected);
    const reader = new FileReader();
    reader.onloadend = () => {
      setEditThumbnailPreview(reader.result as string);
    };
    reader.readAsDataURL(selected);
  };

  const removeEditThumbnail = async () => {
    if (!editingProduct) return;

    // If there's a new thumbnail file, just remove the preview
    if (editThumbnail) {
      setEditThumbnail(null);
      setEditThumbnailPreview(editingProduct.thumbnailUrl || null);
      return;
    }

    // If there's an existing thumbnail on the server, delete it
    if (editingProduct.thumbnailUrl) {
      try {
        const formData = new FormData();
        formData.append("title", editTitle);
        formData.append("description", editDescription);
        formData.append("price", editPrice.toString());
        formData.append("discount", editDiscount.toString());
        formData.append("deleteThumbnail", "true");

        const response = await api.patch(`/products/${editingProduct._id}`, formData);
        
        showSuccess("Thumbnail deleted");
        
        // Update products list and editing state with the response
        const updatedProduct = response.data.product;
        setProducts((prev) =>
          prev.map((p) => (p._id === editingProduct._id ? updatedProduct : p))
        );
        
        // Update the editing product state to reflect the null thumbnail
        setEditingProduct(updatedProduct);
        setEditThumbnailPreview(null);
      } catch (error: any) {
        console.error("Delete thumbnail error:", error);
        showError("Failed to delete thumbnail");
      }
    } else {
      // If no existing thumbnail, just clear the preview
      setEditThumbnail(null);
      setEditThumbnailPreview(null);
    }
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct) return;

    if (!editTitle || !editDescription || !editPrice || editPrice <= 0) {
      showError("Please fill all fields with valid values");
      return;
    }

    setEditLoading(true);
    try {
      const formData = new FormData();
      formData.append("title", editTitle);
      formData.append("description", editDescription);
      formData.append("price", editPrice.toString());
      formData.append("discount", editDiscount.toString());
      formData.append("language", editLanguage);
      formData.append("format", editFormat);
      formData.append("category", editCategory);
      formData.append("intendedAudience", editIntendedAudience);
      formData.append("pageCount", editPageCount.toString());
      if (editFile) {
        formData.append("file", editFile);
      }
      if (editThumbnail) {
        formData.append("thumbnail", editThumbnail);
      }

      const response = await api.patch(`/products/${editingProduct._id}`, formData);

      showSuccess("Product updated successfully!");
      setProducts((prev) =>
        prev.map((p) => (p._id === editingProduct._id ? response.data.product : p))
      );
      setEditingProduct(null);
      setEditFile(null);
      setEditThumbnail(null);
      setEditThumbnailPreview(null);
    } catch (error: any) {
      console.error("Update error:", error);
      showError(error.response?.data?.message || "Failed to update product");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteClick = (productId: string) => {
    setDeletingProductId(productId);
  };

  const handleConfirmDelete = async () => {
    if (!deletingProductId) return;

    setDeleteLoading(true);
    try {
      await api.delete(`/products/${deletingProductId}`);
      showSuccess("Product deleted successfully!");
      setProducts((prev) => prev.filter((p) => p._id !== deletingProductId));
      setDeletingProductId(null);
    } catch (error: any) {
      console.error("Delete error:", error);
      showError(error.response?.data?.message || "Failed to delete product");
    } finally {
      setDeleteLoading(false);
    }
  };

  /* ================= UI CLASSES ================= */

  const inputClass =
    "w-full rounded-xl bg-slate-100 dark:bg-[#18181b] border border-slate-200 dark:border-[#27272a] px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 hover:border-slate-300 dark:hover:border-zinc-600 focus:bg-white dark:focus:bg-[#1f1f22] focus:border-cyan-400 dark:focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-cyan-400 dark:focus:ring-zinc-500 transition-all shadow-sm dark:shadow-none";

  /* ================= RENDER ================= */

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-[#05050a] text-slate-900 dark:text-white">
      <PageHeader
        backHref="/dashboard/seller"
        backLabel="Dashboard"
        title="Upload Product"
        subtitle="Add new digital content for sale"
      />
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-8">

        {/* ================= UPLOAD FORM ================= */}
        <div className="w-full">
          {loading ? (
            <UploadSkeleton />
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Field label="Title">
                <input
                  name="title"
                  placeholder="React Admin Dashboard"
                  required
                  className={inputClass}
                />
              </Field>

              <Field label="Description">
                <textarea
                  name="description"
                  rows={4}
                  placeholder="Explain what the buyer will get..."
                  required
                  className={`${inputClass} resize-none`}
                />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Price (₹)">
                  <input
                    name="price"
                    type="number"
                    placeholder="1000"
                    onChange={(e) => setPrice(+e.target.value)}
                    className={inputClass}
                  />
                </Field>

                <Field label="Discount (%)">
                  <input
                    name="discount"
                    type="number"
                    placeholder="10"
                    onChange={(e) => setDiscount(+e.target.value)}
                    className={inputClass}
                  />
                </Field>
              </div>
              
              {/* Metadata Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Language">
                    <CustomSelect 
                      value={language} 
                      onChange={setLanguage} 
                      options={["English", "Hindi", "Spanish", "French", "German", "Chinese", "Other"]} 
                    />
                  </Field>
                  <Field label="Format">
                    <CustomSelect 
                      value={format} 
                      onChange={setFormat} 
                      options={["PDF", "EPUB", "ZIP", "DOCX", "Other"]} 
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Category">
                    <CustomSelect 
                      value={category} 
                      onChange={setCategory} 
                      options={["eBook", "Course", "Template", "Software", "Design Asset", "Other"]} 
                    />
                  </Field>
                  <Field label="Intended Audience">
                    <CustomSelect 
                      value={intendedAudience} 
                      onChange={setIntendedAudience} 
                      options={["Beginner", "Intermediate", "Advanced", "All Levels"]} 
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Page Count">
                    <input type="number" min="1" value={pageCount} onChange={(e) => setPageCount(+e.target.value)}
                      placeholder="e.g. 50" className={inputClass} required />
                  </Field>
                </div>

              {/* FINAL PRICE BAR */}
              <div className="flex items-center justify-between bg-slate-100 dark:bg-[#18181b] border border-slate-200 dark:border-[#27272a] rounded-xl px-5 py-4 text-sm mt-2 shadow-sm dark:shadow-none">
                <span className="text-slate-500 dark:text-zinc-400 font-medium">
                  Final price (after discount)
                </span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  ₹{finalPrice || 0}
                </span>
              </div>

              {/* FILE */}
              <Field label="Product File">
                <input
                  type="file"
                  name="file"
                  onChange={handleFile}
                  className="
                    w-full text-sm text-slate-600 dark:text-white/70
                    file:mr-4 file:rounded-lg
                    file:border-0 file:bg-slate-200 dark:bg-white/10
                    file:px-4 file:py-2.5
                    file:text-sm file:font-medium
                    file:text-slate-900 dark:text-white
                    hover:file:bg-white/20
                    cursor-pointer transition-all
                  "
                />

                {file && (
                  <div className="mt-2 text-xs text-slate-500 dark:text-white/60 flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-cyan-400" /> {file.name} • {(file.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                )}

                {fileError && (
                  <p className="text-xs text-red-400 mt-1">{fileError}</p>
                )}
              </Field>

              {/* THUMBNAIL */}
              <Field label="Product Thumbnail (Optional)">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnail}
                  className="
                    w-full text-sm text-slate-600 dark:text-white/70
                    file:mr-4 file:rounded-lg
                    file:border-0 file:bg-slate-200 dark:bg-white/10
                    file:px-4 file:py-2.5
                    file:text-sm file:font-medium
                    file:text-slate-900 dark:text-white
                    hover:file:bg-white/20
                    cursor-pointer transition-all
                  "
                />

                {thumbnailPreview && (
                  <div className="mt-3 relative inline-block">
                    <img
                      src={thumbnailPreview}
                      alt="Thumbnail preview"
                      className="w-32 h-24 object-cover rounded-lg border border-slate-200 dark:border-white/10"
                    />
                    <button
                      type="button"
                      onClick={removeThumbnail}
                      className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-slate-900 dark:text-white rounded-full w-5 h-5 flex items-center justify-center"
                    >
                      <XCircle className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </Field>

              <div className="rounded-xl border border-indigo-200 dark:border-indigo-500/20 bg-indigo-50 dark:bg-indigo-500/5 p-4">
                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 shrink-0 mt-0.5">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-indigo-700 dark:text-indigo-300 mb-1 text-sm">Automatic Preview Generation</h4>
                    <p className="text-xs text-slate-500 dark:text-white/60 leading-relaxed">
                      When you upload a PDF, our system automatically detects page count, generates watermarked previews, and adds locked placeholder pages.
                    </p>
                  </div>
                </div>
              </div>

              {/* Terms & Conditions Checkbox */}
              <div className="mt-6 flex items-start gap-3 bg-slate-100 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 rounded-xl p-4">
                <input
                  type="checkbox"
                  id="termsCheckbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-1 w-4 h-4 accent-cyan-500 cursor-pointer"
                />
                <label htmlFor="termsCheckbox" className="text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                  I have read and agree to the{" "}
                  <a
                    href="/seller-terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 hover:text-cyan-300 underline font-medium"
                  >
                    Seller Terms & Conditions
                  </a>
                  , including content security policies and preview disclosure rules.
                </label>
              </div>

              <button
                type="submit"
                disabled={!acceptedTerms || loading}
                className={`
                  mt-2 inline-flex items-center justify-center
                  rounded-xl px-6 py-2.5 font-semibold
                  transition
                  ${
                    acceptedTerms && !loading
                      ? "bg-cyan-600 text-white dark:bg-cyan-600/20 dark:text-cyan-100 border border-cyan-500/30 hover:bg-cyan-700 dark:hover:bg-cyan-600/30"
                      : "bg-slate-200 dark:bg-slate-700/20 text-slate-400 dark:text-slate-500 border border-slate-300 dark:border-slate-600/30 cursor-not-allowed opacity-50"
                  }
                `}
              >
                {loading ? "Uploading..." : "Upload Product"}
              </button>

              {submitted && (
                <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-2 rounded-lg">
                  <Clock className="w-3.5 h-3.5" /> Pending admin approval
                </div>
              )}
            </form>
          )}
        </div>

        {/* ================= RECENT PRODUCTS ================= */}
        <div className="pt-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight">Recent Products</h2>
          </div>

          {loadingProducts ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex flex-col bg-white dark:bg-[#0b0b14] border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden animate-pulse">
                  <div className="w-full aspect-video bg-slate-100 dark:bg-white/5" />
                  <div className="p-5 flex flex-col flex-1 gap-3">
                    <div className="h-4 bg-slate-200 dark:bg-white/10 rounded-md w-3/4" />
                    <div className="space-y-2 mt-1">
                      <div className="h-2.5 bg-slate-200 dark:bg-white/10 rounded-md w-full" />
                      <div className="h-2.5 bg-slate-200 dark:bg-white/10 rounded-md w-4/5" />
                    </div>
                    <div className="mt-auto pt-4 border-t border-slate-200 dark:border-white/5 flex items-end justify-between">
                      <div className="h-6 bg-slate-200 dark:bg-white/10 rounded-md w-1/3" />
                      <div className="h-3 bg-slate-200 dark:bg-white/10 rounded-md w-1/4" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl">
              <p className="text-slate-500 dark:text-white/60">No products yet</p>
              <p className="text-sm text-slate-400 dark:text-white/40 mt-2">Upload your first product above</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence>
                {filteredProducts.slice(0, 5).map((p) => (
                  <motion.div
                    key={p._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    <ProductCard 
                      product={p}
                      onEdit={handleEditClick}
                      onDelete={handleDeleteClick}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>

              {filteredProducts.length === 0 && (
                <p className="text-sm text-slate-400 dark:text-white/50 col-span-full text-center py-8">
                  No products match your search
                </p>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ================= EDIT MODAL ================= */}
      {editingProduct && (
        <div className="fixed inset-0 bg-white dark:bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-[#0b0b14] border border-slate-200 dark:border-white/10 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl"
          >
            <h2 className="text-lg font-black">Edit Product</h2>

            <Field label="Title">
              <input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className={inputClass}
              />
            </Field>

            <Field label="Description">
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={3}
                className={`${inputClass} resize-none`}
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Price (₹)">
                <input
                  type="number"
                  value={editPrice}
                  onChange={(e) => setEditPrice(+e.target.value)}
                  className={inputClass}
                />
              </Field>

              <Field label="Discount (%)">
                <input
                  type="number"
                  value={editDiscount}
                  onChange={(e) => setEditDiscount(+e.target.value)}
                  className={inputClass}
                />
              </Field>
            </div>
            
            {/* Metadata Fields */}
              <div className="grid grid-cols-2 gap-4">
                <Field label="Language">
                  <CustomSelect 
                    value={editLanguage} 
                    onChange={setEditLanguage} 
                    options={["English", "Hindi", "Spanish", "French", "German", "Chinese", "Other"]} 
                  />
                </Field>
                <Field label="Format">
                  <CustomSelect 
                    value={editFormat} 
                    onChange={setEditFormat} 
                    options={["PDF", "EPUB", "ZIP", "DOCX", "Other"]} 
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Category">
                  <CustomSelect 
                    value={editCategory} 
                    onChange={setEditCategory} 
                    options={["eBook", "Course", "Template", "Software", "Design Asset", "Other"]} 
                  />
                </Field>
                <Field label="Intended Audience">
                  <CustomSelect 
                    value={editIntendedAudience} 
                    onChange={setEditIntendedAudience} 
                    options={["Beginner", "Intermediate", "Advanced", "All Levels"]} 
                  />
                </Field>
              </div>

              <div className="w-1/2 pr-2">
                <Field label="Page Count">
                  <input
                    type="number"
                    min="1"
                    value={editPageCount}
                    onChange={(e) => setEditPageCount(+e.target.value)}
                    className={inputClass}
                  />
                </Field>
              </div>

            <Field label="Update File (Optional)">
              <input
                type="file"
                onChange={handleEditFile}
                className="
                  w-full text-sm text-slate-500 dark:text-zinc-400
                  file:mr-4 file:rounded-lg
                  file:border-0 file:bg-slate-200 dark:file:bg-[#27272a]
                  file:px-4 file:py-2.5
                  file:text-sm file:font-medium
                  file:text-slate-900 dark:file:text-white
                  hover:file:bg-slate-300 dark:hover:file:bg-[#3f3f46]
                  cursor-pointer transition-all
                "
              />

              {editFile && (
                <div className="mt-2 text-xs text-slate-500 dark:text-white/60 flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-cyan-400" /> {editFile.name} • {(editFile.size / 1024 / 1024).toFixed(2)} MB
                </div>
              )}

              {editFileError && (
                <p className="text-xs text-red-400 mt-1">{editFileError}</p>
              )}
            </Field>

            <Field label="Update Thumbnail (Optional)">
              <input
                type="file"
                accept="image/*"
                onChange={handleEditThumbnail}
                className="
                  w-full text-sm text-slate-600 dark:text-white/70
                  file:mr-4 file:rounded-lg
                  file:border-0 file:bg-purple-100 dark:file:bg-purple-500/20
                  file:px-4 file:py-2
                  file:text-sm file:font-medium
                  file:text-purple-700 dark:file:text-purple-300
                  hover:file:bg-purple-200 dark:hover:file:bg-purple-500/30
                  cursor-pointer
                "
              />

              {editThumbnailPreview && (
                <div className="mt-3 relative inline-block">
                  <img
                    src={editThumbnailPreview}
                    alt="Thumbnail preview"
                    className="w-32 h-24 object-cover rounded-lg border border-slate-200 dark:border-white/10"
                  />
                  <button
                    type="button"
                    onClick={removeEditThumbnail}
                    className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-slate-900 dark:text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                  >
                    ✕
                  </button>
                </div>
              )}
            </Field>

            <div className="flex gap-2">
              <button
                onClick={() => setEditingProduct(null)}
                className="flex-1 py-2 px-4 bg-slate-200 dark:bg-white/10 hover:bg-white/20 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateProduct}
                disabled={editLoading}
                className="flex-1 py-2 px-4 bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/30 rounded-lg transition disabled:opacity-50"
              >
                {editLoading ? "Updating..." : "Update"}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ================= DELETE CONFIRMATION ================= */}
      {deletingProductId && (
        <div className="fixed inset-0 bg-white dark:bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-[#0b0b14] border border-red-200 dark:border-red-500/20 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl"
          >
            <h2 className="text-lg font-black text-red-400">Delete Product?</h2>
            <p className="text-sm text-slate-500 dark:text-white/60">
              This action cannot be undone. The product file will also be permanently deleted.
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => setDeletingProductId(null)}
                disabled={deleteLoading}
                className="flex-1 py-2 px-4 bg-slate-200 dark:bg-white/10 hover:bg-white/20 rounded-lg transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleteLoading}
                className="flex-1 py-2 px-4 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-300 rounded-lg transition disabled:opacity-50"
              >
                {deleteLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </main>
  );
}

/* ================= UI ================= */

function Field({ label, children }: any) {
  return (
    <div>
      <label className="text-xs text-slate-500 dark:text-white/60 mb-1 block">{label}</label>
      {children}
    </div>
  );
}

function ProductCard({ 
  product, 
  onEdit,
  onDelete
}: {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (productId: string) => void;
}) {
  const displayPrice = product.discount
    ? Math.max(product.price - (product.price * product.discount) / 100, 0)
    : product.price;

  const statusConfig = {
    approved: { label: "Approved", cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", icon: CheckCircle },
    pending:  { label: "Pending",  cls: "bg-amber-500/10 text-amber-400 border-amber-500/20",   icon: Clock },
    rejected: { label: "Rejected", cls: "bg-red-500/10 text-red-400 border-red-500/20",         icon: XCircle },
  }[product.status];

  const StatusIcon = statusConfig.icon;

  return (
    <div className="rounded-xl border border-slate-200 dark:border-white/8 bg-slate-50 dark:bg-[#0e1018] hover:bg-white dark:hover:bg-[#12141c] hover:border-slate-300 dark:hover:border-white/15 transition-all overflow-hidden group">
      {product.thumbnailUrl && (
        <div className="relative w-full h-36 bg-slate-100 dark:bg-white/5 overflow-hidden">
          <img src={product.thumbnailUrl} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        </div>
      )}

      <div className="p-4 space-y-3">
        {/* Title + Status */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-slate-900 dark:text-white text-sm leading-tight line-clamp-2 flex-1">{product.title}</h3>
          <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full border whitespace-nowrap font-semibold ${statusConfig.cls}`}>
            <StatusIcon className="w-2.5 h-2.5" /> {statusConfig.label}
          </span>
        </div>

        {/* Description */}
        <p className="text-xs text-slate-500 dark:text-white/45 line-clamp-2">{product.description}</p>

        {/* Price row */}
        <div className="flex items-center gap-2">
          <span className="text-base font-bold text-cyan-300">₹{displayPrice.toLocaleString()}</span>
          {product.discount > 0 && (
            <>
              <span className="text-xs text-slate-400 dark:text-white/35 line-through">₹{product.price}</span>
              <span className="text-[10px] bg-red-500/15 text-red-300 px-1.5 py-0.5 rounded font-semibold">-{product.discount}%</span>
            </>
          )}
        </div>

        {/* Meta tags — inline chips */}
        <div className="flex flex-wrap gap-1.5">
          {product.category && (
            <Chip icon={<Tag className="w-2.5 h-2.5" />} label={product.category} />
          )}
          {product.language && (
            <Chip icon={<Globe className="w-2.5 h-2.5" />} label={product.language} />
          )}
          {product.format && (
            <Chip icon={<FileType className="w-2.5 h-2.5" />} label={product.format} />
          )}
          {product.intendedAudience && (
            <Chip icon={<Users className="w-2.5 h-2.5" />} label={product.intendedAudience} />
          )}
          {product.pageCount && product.pageCount > 1 && (
            <Chip icon={<Hash className="w-2.5 h-2.5" />} label={`${product.pageCount} pages`} />
          )}
        </div>

        {/* Footer: date + actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-white/6">
          <span className="text-[10px] text-slate-500 dark:text-white/30">{new Date(product.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
          <div className="flex gap-1.5">
            {product.status !== "approved" && (
              <button
                onClick={() => onEdit(product)}
                className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1.5 bg-slate-100 dark:bg-white/5 hover:bg-blue-500/20 text-slate-500 dark:text-white/60 hover:text-blue-300 border border-white/8 hover:border-blue-500/30 rounded-lg transition"
              >
                <Pencil className="w-3 h-3" /> Edit
              </button>
            )}
            <button
              onClick={() => onDelete(product._id)}
              className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1.5 bg-slate-100 dark:bg-white/5 hover:bg-red-500/20 text-slate-500 dark:text-white/60 hover:text-red-300 border border-white/8 hover:border-red-500/30 rounded-lg transition"
            >
              <Trash2 className="w-3 h-3" /> Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Chip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 dark:text-white/45 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/8 rounded-md px-1.5 py-0.5">
      {icon} {label}
    </span>
  );
}


function UploadSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-5 w-1/3 bg-slate-200 dark:bg-white/10 rounded" />
      <div className="h-10 bg-slate-200 dark:bg-white/10 rounded" />
      <div className="h-24 bg-slate-200 dark:bg-white/10 rounded" />
      <div className="grid grid-cols-2 gap-4">
        <div className="h-10 bg-slate-200 dark:bg-white/10 rounded" />
        <div className="h-10 bg-slate-200 dark:bg-white/10 rounded" />
      </div>
      <div className="h-10 w-40 bg-slate-200 dark:bg-white/10 rounded" />
    </div>
  );
}

function CustomSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (val: string) => void;
  options: string[];
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const handleClick = () => setOpen(false);
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [open]);

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between rounded-xl bg-slate-100 dark:bg-[#18181b] border border-slate-200 dark:border-[#27272a] px-4 py-3 text-sm text-slate-900 dark:text-white hover:border-slate-300 dark:hover:border-zinc-600 focus:bg-white dark:focus:bg-[#1f1f22] focus:outline-none focus:border-cyan-400 dark:focus:border-zinc-500 focus:ring-1 focus:ring-cyan-400 dark:focus:ring-zinc-500 transition-all shadow-sm dark:shadow-none"
      >
        <span>{value}</span>
        <ChevronLeft className={`w-4 h-4 text-slate-400 dark:text-white/40 transition-transform ${open ? 'rotate-90' : '-rotate-90'}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 mt-2 w-full rounded-xl border border-slate-200 dark:border-[#27272a] bg-white dark:bg-[#18181b] shadow-xl overflow-hidden"
          >
            <div className="max-h-56 overflow-y-auto p-1 custom-scrollbar">
              {options.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    onChange(opt);
                    setOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    value === opt ? "bg-slate-100 dark:bg-[#27272a] text-slate-900 dark:text-white font-medium" : "text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-[#27272a] hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
