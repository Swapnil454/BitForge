



"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/api";
import { showError, showSuccess } from "@/lib/toast";

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
    "w-full rounded-xl bg-[#0b0b14] border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 transition";

  /* ================= RENDER ================= */

  return (
    <main className="min-h-screen bg-[#05050a] text-white">
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-12">

        {/* ================= UPLOAD ================= */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h1 className="text-xl font-black">Upload Product</h1>
          <p className="text-sm text-white/60 mb-6">
            Add new digital content for sale
          </p>

          {loading ? (
            <UploadSkeleton />
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
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
              
              {/* Product Validation Fields */}
              <div className="bg-purple-500/5 border border-purple-500/20 rounded-xl p-4 space-y-4">
                <div className="flex items-center gap-2 text-xs text-purple-300 font-semibold">
                  <span>📋</span>
                  <span>Product Details (Required)</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Language">
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className={inputClass}
                      required
                    >
                      <option value="English">English</option>
                      <option value="Hindi">Hindi</option>
                      <option value="Spanish">Spanish</option>
                      <option value="French">French</option>
                      <option value="German">German</option>
                      <option value="Chinese">Chinese</option>
                      <option value="Other">Other</option>
                    </select>
                  </Field>

                  <Field label="Format">
                    <select
                      value={format}
                      onChange={(e) => setFormat(e.target.value)}
                      className={inputClass}
                      required
                    >
                      <option value="PDF">PDF</option>
                      <option value="EPUB">EPUB</option>
                      <option value="ZIP">ZIP</option>
                      <option value="DOCX">DOCX</option>
                      <option value="Other">Other</option>
                    </select>
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Page Count">
                    <input
                      type="number"
                      min="1"
                      value={pageCount}
                      onChange={(e) => setPageCount(+e.target.value)}
                      placeholder="e.g., 50"
                      className={inputClass}
                      required
                    />
                  </Field>

                  <Field label="Intended Audience">
                    <select
                      value={intendedAudience}
                      onChange={(e) => setIntendedAudience(e.target.value)}
                      className={inputClass}
                      required
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                      <option value="All Levels">All Levels</option>
                    </select>
                  </Field>
                </div>
              </div>

              {/* FINAL PRICE BAR */}
              <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm">
                <span className="text-white/60">
                  Final price (after discount)
                </span>
                <span className="font-semibold text-cyan-400">
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
                    w-full text-sm text-white/70
                    file:mr-4 file:rounded-lg
                    file:border-0 file:bg-cyan-500/20
                    file:px-4 file:py-2
                    file:text-sm file:font-medium
                    file:text-cyan-300
                    hover:file:bg-cyan-500/30
                    cursor-pointer
                  "
                />

                {file && (
                  <div className="mt-2 text-xs text-white/60">
                    📄 {file.name} •{" "}
                    {(file.size / 1024 / 1024).toFixed(2)} MB
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
                    w-full text-sm text-white/70
                    file:mr-4 file:rounded-lg
                    file:border-0 file:bg-purple-500/20
                    file:px-4 file:py-2
                    file:text-sm file:font-medium
                    file:text-purple-300
                    hover:file:bg-purple-500/30
                    cursor-pointer
                  "
                />

                {thumbnailPreview && (
                  <div className="mt-3 relative inline-block">
                    <img
                      src={thumbnailPreview}
                      alt="Thumbnail preview"
                      className="w-32 h-24 object-cover rounded-lg border border-white/10"
                    />
                    <button
                      type="button"
                      onClick={removeThumbnail}
                      className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </Field>

              {/* PREVIEW PDF - AUTOMATIC */}
              <div className="rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/30 p-4">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">✨</div>
                  <div>
                    <h4 className="font-semibold text-indigo-300 mb-1">Automatic Preview Generation</h4>
                    <p className="text-xs text-white/70 leading-relaxed">
                      <strong>No extra work needed!</strong> When you upload a PDF, our system automatically:
                    </p>
                    <ul className="text-xs text-white/60 mt-2 space-y-1 ml-4">
                      <li>• Detects total page count</li>
                      <li>• Generates watermarked preview pages based on document size</li>
                      <li>• Adds locked placeholder pages</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Terms & Conditions Checkbox */}
              <div className="mt-6 flex items-start gap-3 bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
                <input
                  type="checkbox"
                  id="termsCheckbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-1 w-4 h-4 accent-cyan-500 cursor-pointer"
                />
                <label htmlFor="termsCheckbox" className="text-sm text-slate-300 cursor-pointer">
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
                      ? "bg-cyan-600/20 border border-cyan-500/30 hover:bg-cyan-600/30"
                      : "bg-slate-700/20 border border-slate-600/30 cursor-not-allowed opacity-50"
                  }
                `}
              >
                {loading ? "Uploading..." : "Upload Product"}
              </button>

              {submitted && (
                <div className="text-xs text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 px-3 py-2 rounded-lg">
                  ⏳ Pending admin approval
                </div>
              )}
            </form>
          )}
        </div>

        {/* ================= PRODUCTS ================= */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <h2 className="text-lg font-black">My Products</h2>

            {!loadingProducts && products.length > 0 && (
              <div className="flex gap-2">
                <input
                  placeholder="Search products..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className={inputClass + " w-48"}
                />

                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as any)}
                  className={inputClass}
                >
                  <option value="all">All</option>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            )}
          </div>

          {loadingProducts ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-5 animate-pulse">
                  <div className="h-4 bg-white/10 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-white/10 rounded w-1/2 mb-4" />
                  <div className="h-8 bg-white/10 rounded w-1/3" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12 bg-white/5 border border-white/10 rounded-2xl">
              <p className="text-white/60">No products yet</p>
              <p className="text-sm text-white/40 mt-2">Upload your first product above</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence>
                {filteredProducts.map((p) => (
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
                <p className="text-sm text-white/50 col-span-full text-center py-8">
                  No products match your search
                </p>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ================= EDIT MODAL ================= */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#0b0b14] border border-white/10 rounded-2xl p-6 max-w-md w-full space-y-4"
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
            
            {/* Product Details */}
            <div className="bg-purple-500/5 border border-purple-500/20 rounded-xl p-3 space-y-3">
              <div className="text-xs text-purple-300 font-semibold">Product Details</div>
              
              <div className="grid grid-cols-2 gap-3">
                <Field label="Language">
                  <select
                    value={editLanguage}
                    onChange={(e) => setEditLanguage(e.target.value)}
                    className={inputClass}
                  >
                    <option value="English">English</option>
                    <option value="Hindi">Hindi</option>
                    <option value="Spanish">Spanish</option>
                    <option value="French">French</option>
                    <option value="German">German</option>
                    <option value="Chinese">Chinese</option>
                    <option value="Other">Other</option>
                  </select>
                </Field>

                <Field label="Format">
                  <select
                    value={editFormat}
                    onChange={(e) => setEditFormat(e.target.value)}
                    className={inputClass}
                  >
                    <option value="PDF">PDF</option>
                    <option value="EPUB">EPUB</option>
                    <option value="ZIP">ZIP</option>
                    <option value="DOCX">DOCX</option>
                    <option value="Other">Other</option>
                  </select>
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Page Count">
                  <input
                    type="number"
                    min="1"
                    value={editPageCount}
                    onChange={(e) => setEditPageCount(+e.target.value)}
                    className={inputClass}
                  />
                </Field>

                <Field label="Audience">
                  <select
                    value={editIntendedAudience}
                    onChange={(e) => setEditIntendedAudience(e.target.value)}
                    className={inputClass}
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                    <option value="All Levels">All Levels</option>
                  </select>
                </Field>
              </div>
            </div>

            <Field label="Update File (Optional)">
              <input
                type="file"
                onChange={handleEditFile}
                className="
                  w-full text-sm text-white/70
                  file:mr-4 file:rounded-lg
                  file:border-0 file:bg-cyan-500/20
                  file:px-4 file:py-2
                  file:text-sm file:font-medium
                  file:text-cyan-300
                  hover:file:bg-cyan-500/30
                  cursor-pointer
                "
              />

              {editFile && (
                <div className="mt-2 text-xs text-white/60">
                  📄 {editFile.name} • {(editFile.size / 1024 / 1024).toFixed(2)} MB
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
                  w-full text-sm text-white/70
                  file:mr-4 file:rounded-lg
                  file:border-0 file:bg-purple-500/20
                  file:px-4 file:py-2
                  file:text-sm file:font-medium
                  file:text-purple-300
                  hover:file:bg-purple-500/30
                  cursor-pointer
                "
              />

              {editThumbnailPreview && (
                <div className="mt-3 relative inline-block">
                  <img
                    src={editThumbnailPreview}
                    alt="Thumbnail preview"
                    className="w-32 h-24 object-cover rounded-lg border border-white/10"
                  />
                  <button
                    type="button"
                    onClick={removeEditThumbnail}
                    className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                  >
                    ✕
                  </button>
                </div>
              )}
            </Field>

            <div className="flex gap-2">
              <button
                onClick={() => setEditingProduct(null)}
                className="flex-1 py-2 px-4 bg-white/10 hover:bg-white/20 rounded-lg transition"
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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#0b0b14] border border-red-500/20 rounded-2xl p-6 max-w-md w-full space-y-4"
          >
            <h2 className="text-lg font-black text-red-400">Delete Product?</h2>
            <p className="text-sm text-white/60">
              This action cannot be undone. The product file will also be permanently deleted.
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => setDeletingProductId(null)}
                disabled={deleteLoading}
                className="flex-1 py-2 px-4 bg-white/10 hover:bg-white/20 rounded-lg transition disabled:opacity-50"
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
      <label className="text-xs text-white/60 mb-1 block">{label}</label>
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

  const canEdit = product.status !== "approved";

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:bg-white/10 transition">
      {/* Thumbnail */}
      {product.thumbnailUrl && (
        <div className="relative w-full h-40 bg-white/5">
          <img
            src={product.thumbnailUrl}
            alt={product.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      <div className="p-5 space-y-3">
        {/* Header with Status */}
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1">
            <h3 className="font-semibold text-white truncate">{product.title}</h3>
            <p className="text-xs text-white/60 mt-1 line-clamp-2">{product.description}</p>
          </div>

          <span
            className={`text-xs px-3 py-1 rounded-full border whitespace-nowrap
              ${
                product.status === "approved"
                  ? "bg-green-500/10 text-green-400 border-green-500/20"
                  : product.status === "pending"
                  ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                  : "bg-red-500/10 text-red-400 border-red-500/20"
              }`}
          >
            {product.status}
          </span>
        </div>

        {/* Price Info */}
        <div className="space-y-1">
          {product.discount > 0 ? (
            <div className="flex items-center gap-2">
              <p className="text-xs text-white/40 line-through">₹{product.price}</p>
              <p className="text-sm font-semibold text-cyan-400">₹{displayPrice}</p>
              <p className="text-xs bg-red-500/20 text-red-300 px-2 py-0.5 rounded">
                -{product.discount}%
              </p>
            </div>
          ) : (
            <p className="text-sm font-semibold text-cyan-400">₹{product.price}</p>
          )}
        </div>

        {/* Meta Info */}
        <div className="text-xs text-white/50 pt-2 border-t border-white/10">
          <p>Uploaded {new Date(product.createdAt).toLocaleDateString()}</p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          {canEdit && (
            <button
              onClick={() => onEdit(product)}
              className="flex-1 text-xs py-2 px-3 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 rounded-lg transition"
            >
              ✏️ Edit
            </button>
          )}
          <button
            onClick={() => onDelete(product._id)}
            className="flex-1 text-xs py-2 px-3 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 rounded-lg transition"
          >
            🗑️ Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function UploadSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-5 w-1/3 bg-white/10 rounded" />
      <div className="h-10 bg-white/10 rounded" />
      <div className="h-24 bg-white/10 rounded" />
      <div className="grid grid-cols-2 gap-4">
        <div className="h-10 bg-white/10 rounded" />
        <div className="h-10 bg-white/10 rounded" />
      </div>
      <div className="h-10 w-40 bg-white/10 rounded" />
    </div>
  );
}
