



"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { showError, showSuccess } from "@/lib/toast";
import { getStoredUser } from "@/lib/cookies";
import {
  Upload, FileText, Image as ImageIcon, Tag,
  Globe, FileType, Users, Hash, Pencil, Trash2,
  CheckCircle, Clock, XCircle, ChevronLeft, ClipboardCheck,
  Package, Star, Calendar, MoreVertical, Eye, Megaphone
} from "lucide-react";

/* ================= CONSTANTS ================= */

const MAX_FILE_SIZE = 1024 * 1024 * 1024; // 1GB
const SURFACE_CARD_CLASS =
  "rounded-2xl sm:rounded-[28px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-sm transition-all";

const categoryColors: Record<string, { pill: string }> = {
  Course: { pill: "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" },
  eBook: { pill: "bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400" },
  Template: { pill: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" },
  Software: { pill: "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" },
  "Design Asset": { pill: "bg-pink-50 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400" },
};
const defaultCat = { pill: "bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-400" };

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
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  // Upload Progress States
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSpeed, setUploadSpeed] = useState(0); // bytes per sec
  const [uploadedBytes, setUploadedBytes] = useState(0);
  const [totalBytes, setTotalBytes] = useState(0);

  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");

  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

  const [price, setPrice] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [ownershipAccepted, setOwnershipAccepted] = useState(false);

  // B. Structured validation fields
  const [language, setLanguage] = useState<string>("English");
  const [format, setFormat] = useState<string>("PDF");
  const [intendedAudience, setIntendedAudience] = useState<string>("All Levels");
  const [pageCount, setPageCount] = useState<number>(1);
  const [category, setCategory] = useState<string>("eBook");

  const [products, setProducts] = useState<Product[]>([]);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | ProductStatus>("all");


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

  const isApproved = user?.approvalStatus === "approved" || Boolean(user?.isApproved);
  const showVerificationWarning = user && !isApproved && products.length >= 2;

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

  const checklistItems = [
    { label: "Title added", missingLabel: "Title", complete: title.trim().length > 0 },
    { label: "Description added", missingLabel: "Description", complete: description.trim().length > 0 },
    { label: "Price set", missingLabel: "Price", complete: price > 0 },
    { label: "Thumbnail uploaded", missingLabel: "Thumbnail", complete: Boolean(thumbnailPreview) },
    { label: "Product file selected", missingLabel: "Product file", complete: Boolean(file) },
    { label: "Terms accepted", missingLabel: "Terms", complete: acceptedTerms && ownershipAccepted },
  ];

  const completedChecklistCount = checklistItems.filter((item) => item.complete).length;
  const completionPercentage = Math.round((completedChecklistCount / checklistItems.length) * 100);
  const isReadyForReview = checklistItems.every((item) => item.complete);
  const missingChecklistItems = checklistItems
    .filter((item) => !item.complete)
    .map((item) => item.missingLabel);
  const previewTags = [category, language, format, intendedAudience].filter(Boolean);
  const previewTitle = title.trim() || "Product Title";
  const previewDescription =
    description.trim() || "Product description preview will appear here.";

  /* ================= HANDLERS ================= */

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (selected.size > MAX_FILE_SIZE) {
      setFileError("File size must be under 1GB");
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

    if (!acceptedTerms || !ownershipAccepted) {
      showError("Please accept the ownership and policy terms to continue");
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
    formData.append("title", title);
    formData.append("description", description);
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
      let lastLoaded = 0;
      let lastTime = Date.now();

      const response = await new Promise<any>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `${process.env.NEXT_PUBLIC_API_URL}/products/upload`);
        xhr.withCredentials = true;

        // Add auth token
        const cookies = document.cookie.split(";");
        const tokenCookie = cookies.find((c) => c.trim().startsWith("token="));
        if (tokenCookie) {
          const token = tokenCookie.split("=")[1];
          xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        }

        xhr.upload.onprogress = (progressEvent) => {
          if (!progressEvent.lengthComputable) return;
          const loaded = progressEvent.loaded;
          const total = progressEvent.total;
          const percent = Math.floor((loaded * 100) / total);
          
          setUploadProgress(percent);
          setUploadedBytes(loaded);
          setTotalBytes(total);
          
          const now = Date.now();
          const timeDiff = (now - lastTime) / 1000;
          if (timeDiff > 0.3) {
            const bytesDiff = loaded - lastLoaded;
            setUploadSpeed(bytesDiff / timeDiff);
            lastLoaded = loaded;
            lastTime = now;
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              resolve({ data: JSON.parse(xhr.responseText) });
            } catch (e) {
              resolve({ data: xhr.responseText });
            }
          } else {
            try {
              reject({ response: { data: JSON.parse(xhr.responseText) } });
            } catch (e) {
              reject(new Error("Upload failed"));
            }
          }
        };

        xhr.onerror = () => reject(new Error("Network Error"));
        xhr.send(formData);
      });

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
      setUploadProgress(0);
      setUploadSpeed(0);
      setUploadedBytes(0);
      setTotalBytes(0);
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
    "w-full rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 hover:border-slate-300 dark:hover:border-slate-700 focus:bg-white dark:focus:bg-slate-950 focus:border-indigo-500 dark:focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all shadow-sm";

  /* ================= RENDER ================= */

  return (
    <>
      <div className="relative isolate min-h-screen bg-slate-50 dark:bg-[#05050a] text-slate-900 dark:text-white">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[280px] overflow-hidden">
          <div className="absolute left-[12%] top-[-140px] h-56 w-56 rounded-full bg-cyan-200/25 blur-3xl dark:hidden" />
          <div className="absolute right-[14%] top-[-60px] h-48 w-48 rounded-full bg-sky-200/25 blur-3xl dark:hidden" />
        </div>

        <header className="sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
          <div className="mx-auto max-w-7xl px-4 py-2 sm:px-6 lg:px-8">
            <div className="relative flex min-h-[40px] sm:min-h-[48px] items-center justify-center">
              <button
                onClick={() => router.push("/dashboard/seller")}
                className="absolute left-0 top-1/2 inline-flex -translate-y-1/2 items-center gap-1 sm:gap-2 rounded-full px-2 sm:px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white"
              >
                <ChevronLeft className="h-5 w-5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </button>

              <div className="min-w-0 px-12 sm:px-24 text-center">
                <h1 className="truncate text-lg sm:text-xl font-bold tracking-tight text-slate-950 dark:text-white">
                  Upload Product
                </h1>
                <p className="mt-1 hidden sm:block text-sm text-slate-500 dark:text-slate-400">
                  Create a digital product listing for marketplace review.
                </p>
              </div>

              
            </div>
          </div>
        </header>

        {/* Main upload area */}
        <main className="relative mx-auto grid max-w-7xl grid-cols-1 items-start gap-4 sm:gap-5 px-4 py-4 sm:px-6 lg:px-8 xl:grid-cols-[minmax(0,1fr)_380px] xl:gap-6">

          {/* Left form column */}
          <div className="min-w-0">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">

                {/* === CARD 1: BASIC DETAILS === */}
                <div className={SURFACE_CARD_CLASS}>
                  <SectionHeading
                    number="01"
                    title="Basic Details"
                    description="Tell buyers what this product is about."
                  />
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Title</label>
                      <input
                        name="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="React Admin Dashboard"
                        required
                        className={inputClass}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
                      <textarea
                        name="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        placeholder="Explain what the buyer will get..."
                        required
                        className={`${inputClass} min-h-[80px] resize-none`}
                      />
                    </div>
                  </div>
                </div>

                {/* === CARD 2: PRICING === */}
                <div className={SURFACE_CARD_CLASS}>
                  <SectionHeading
                    number="02"
                    title="Pricing"
                    description="Set your product price and optional discount."
                  />
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Original Price (&#8377;)</label>
                      <input
                        name="price"
                        type="number"
                        placeholder="1000"
                        min="0"
                        value={price || ""}
                        onChange={(e) => setPrice(+e.target.value)}
                        className={inputClass}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Discount (%)</label>
                      <input
                        name="discount"
                        type="number"
                        placeholder="10"
                        min="0"
                        max="100"
                        value={discount || ""}
                        onChange={(e) => setDiscount(+e.target.value)}
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between rounded-xl border border-indigo-100 bg-indigo-50/70 px-4 py-3 dark:border-indigo-500/10 dark:bg-indigo-500/5">
                    <span className="text-sm font-medium text-indigo-800 dark:text-indigo-400">Final Buyer Price</span>
                    <span className="text-lg font-bold text-indigo-700 dark:text-indigo-300">&#8377;{finalPrice || 0}</span>
                  </div>
                </div>

                {/* === CARD 3: PRODUCT METADATA === */}
                <div className={SURFACE_CARD_CLASS}>
                  <SectionHeading
                    number="03"
                    title="Product Metadata"
                    description="Help buyers discover your product through filters."
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Category</label>
                      <CustomSelect value={category} onChange={setCategory} options={["eBook", "Course", "Template", "Software", "Design Asset", "Other"]} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Format</label>
                      <CustomSelect value={format} onChange={setFormat} options={["PDF", "EPUB", "ZIP", "DOCX", "Other"]} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Language</label>
                      <CustomSelect value={language} onChange={setLanguage} options={["English", "Hindi", "Spanish", "French", "German", "Chinese", "Other"]} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Intended Audience</label>
                      <CustomSelect value={intendedAudience} onChange={setIntendedAudience} options={["Beginner", "Intermediate", "Advanced", "All Levels"]} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {category === "Course" ? "Lesson Count (Optional)" : 
                         (format === "ZIP" || category === "Software" || category === "Design Asset") ? "File Count (Optional)" : 
                         "Page Count (Optional)"}
                      </label>
                      <input type="number" min="1" value={pageCount || ""} onChange={(e) => setPageCount(+e.target.value)} placeholder="e.g. 50" className={inputClass} />
                    </div>
                  </div>
                </div>

                {/* === CARD 4: FILES & THUMBNAIL === */}
                <div className={SURFACE_CARD_CLASS}>
                  <SectionHeading
                    number="04"
                    title="Files & Thumbnail"
                    description="Upload your actual product and a preview image."
                  />

                  <div className="space-y-6">
                    {/* Product File Upload */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block">Product File</label>

                      <div className="relative overflow-hidden flex h-32 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-center transition hover:border-indigo-400 hover:bg-indigo-50/40 dark:border-slate-800 dark:bg-slate-900/50 dark:hover:border-indigo-500/50 dark:hover:bg-indigo-500/5">
                        <input
                          type="file"
                          name="file"
                          onChange={handleFile}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />

                        {!file ? (
                          <div className="flex flex-col items-center justify-center pointer-events-none">
                            <Upload className="w-6 h-6 text-slate-400 mb-2" />
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Click or drag file here</p>
                            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">PDF, ZIP, DOCX supported - Max 1GB</p>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center pointer-events-none z-20">
                            <FileText className="w-6 h-6 text-cyan-500 mb-2" />
                            <p className="text-sm font-medium text-slate-900 dark:text-white truncate max-w-[200px]">{file.name}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                            <button
                              type="button"
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setFile(null); setFileError(""); }}
                              className="text-xs font-semibold text-red-500 hover:text-red-600 mt-2 z-30 pointer-events-auto"
                            >
                              Remove file
                            </button>
                          </div>
                        )}
                      </div>
                      {fileError && <p className="text-xs text-red-500 font-medium px-1 mt-1">{fileError}</p>}
                    </div>

                    {/* Thumbnail Upload */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block">Thumbnail</label>
                      <div className="flex gap-4 items-start">
                        <div className="w-24 h-16 shrink-0 rounded-lg border border-slate-200 dark:border-white/10 overflow-hidden bg-slate-100 dark:bg-slate-900 flex items-center justify-center relative">
                          {thumbnailPreview ? (
                            <>
                              <img src={thumbnailPreview} alt="Thumbnail preview" className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={removeThumbnail}
                                className="absolute top-1 right-1 bg-black/50 hover:bg-red-500 text-white rounded-full p-0.5 transition-colors"
                              >
                                <XCircle className="w-3 h-3" />
                              </button>
                            </>
                          ) : (
                            <ImageIcon className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="relative inline-block">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleThumbnail}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <div className="h-9 px-4 inline-flex items-center justify-center rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-sm font-medium text-slate-700 dark:text-slate-300 transition-colors pointer-events-none">
                              Choose Image
                            </div>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">Recommended: 1200 x 675px (16:9)</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 xl:hidden">
                  <PublishStatusCard
                    completionPercentage={completionPercentage}
                    completedChecklistCount={completedChecklistCount}
                    isReadyForReview={isReadyForReview}
                    missingChecklistItems={missingChecklistItems}
                    totalChecklistItems={checklistItems.length}
                  />
                  <MarketplacePreviewCard
                    thumbnailPreview={thumbnailPreview}
                    category={category}
                    title={previewTitle}
                    description={previewDescription}
                    finalPrice={finalPrice}
                    price={price}
                    discount={discount}
                    tags={previewTags}
                  />
                  <ChecklistCard
                    checklistItems={checklistItems}
                    completedChecklistCount={completedChecklistCount}
                  />
                  <SellerTipsCard />
                </div>

                {/* === CARD 5: SELLER AGREEMENT === */}
                <div className={SURFACE_CARD_CLASS}>
                  <SectionHeading
                    number="05"
                    title="Seller Agreement"
                    description="Confirm ownership and marketplace policy compliance."
                  />

                  <div className="space-y-3">
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={ownershipAccepted}
                        onChange={(e) => setOwnershipAccepted(e.target.checked)}
                        className="mt-0.5 w-4 h-4 accent-cyan-500 cursor-pointer rounded border-slate-300"
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">
                        I confirm that I own this content or have explicit commercial rights to sell it.
                      </span>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={acceptedTerms}
                        onChange={(e) => setAcceptedTerms(e.target.checked)}
                        className="mt-0.5 w-4 h-4 accent-cyan-500 cursor-pointer rounded border-slate-300"
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">
                        I agree to the <a href="/seller-terms" target="_blank" rel="noreferrer" className="text-cyan-500 hover:underline">Seller Terms & Conditions</a>, including content security policies.
                      </span>
                    </label>
                  </div>
                </div>

                {/* === SUBMIT ACTIONS === */}
                <div>
                  {loading && (
                    <div className="mb-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-5 border border-slate-200 dark:border-white/10 shadow-sm space-y-4">
                      <div className="flex justify-between items-center text-sm font-medium">
                        <span className="text-slate-700 dark:text-slate-300 flex items-center gap-2">
                          <Upload className="w-4 h-4 animate-bounce text-cyan-500" /> 
                          Uploading... {uploadProgress}%
                        </span>
                        <span className="text-cyan-600 dark:text-cyan-400 font-bold">
                          {(uploadedBytes / 1024 / 1024).toFixed(1)} MB <span className="text-slate-400 dark:text-slate-500 font-normal">/ {(totalBytes / 1024 / 1024).toFixed(1)} MB</span>
                        </span>
                      </div>
                      <div className="h-2.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-300 relative" style={{ width: `${uploadProgress}%` }}>
                          <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5" /> Speed: {(uploadSpeed / 1024 / 1024).toFixed(1)} MB/s
                        </span>
                        <span className="flex items-center gap-1.5 text-emerald-500 dark:text-emerald-400">
                          <CheckCircle className="w-3.5 h-3.5" /> Full production ready
                        </span>
                      </div>
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={!acceptedTerms || !ownershipAccepted || loading}
                    className={`
                    h-11 w-full sm:w-auto px-6 rounded-xl font-medium flex items-center justify-center gap-2 transition-all
                    ${acceptedTerms && ownershipAccepted && !loading
                        ? "bg-cyan-600 text-white hover:bg-cyan-700 dark:bg-cyan-500 dark:hover:bg-cyan-600"
                        : "bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed"
                      }
                  `}
                  >
                    {loading ? "Uploading..." : "Upload Product"}
                  </button>
                  {submitted && (
                    <p className="mt-2 text-xs text-amber-500 flex items-center gap-1 font-medium"><Clock className="w-3.5 h-3.5" /> Pending admin approval</p>
                  )}
                </div>
              </form>
          </div>

          <aside className="hidden xl:block xl:sticky xl:top-24 space-y-4">
            <PublishStatusCard
              completionPercentage={completionPercentage}
              completedChecklistCount={completedChecklistCount}
              isReadyForReview={isReadyForReview}
              missingChecklistItems={missingChecklistItems}
              totalChecklistItems={checklistItems.length}
            />
            <MarketplacePreviewCard
              thumbnailPreview={thumbnailPreview}
              category={category}
              title={previewTitle}
              description={previewDescription}
              finalPrice={finalPrice}
              price={price}
              discount={discount}
              tags={previewTags}
            />
            <ChecklistCard
              checklistItems={checklistItems}
              completedChecklistCount={completedChecklistCount}
            />
            <SellerTipsCard />
          </aside>
        </main>

        {/* ================= RECENT PRODUCTS ================= */}
        <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-950 dark:text-white">Recent Products</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Your latest uploaded listings</p>
            </div>
          </div>

          {loadingProducts ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex flex-col bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl overflow-hidden animate-pulse">
                  <div className="w-full aspect-video bg-slate-100 dark:bg-white/5" />
                  <div className="p-4 flex flex-col flex-1 gap-3">
                    <div className="h-5 bg-slate-200 dark:bg-white/10 rounded-md w-3/4" />
                    <div className="space-y-2 mt-1">
                      <div className="h-3 bg-slate-200 dark:bg-white/10 rounded-md w-full" />
                      <div className="h-3 bg-slate-200 dark:bg-white/10 rounded-md w-4/5" />
                    </div>
                    <div className="mt-auto pt-4 flex items-end justify-between border-t border-slate-100 dark:border-white/5">
                      <div className="h-7 bg-slate-200 dark:bg-white/10 rounded-md w-1/3" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
              <Package className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
              <p className="text-slate-600 dark:text-white/60 font-medium">No products yet</p>
              <p className="text-sm text-slate-400 dark:text-white/40 mt-1">Upload your first product above</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              <AnimatePresence>
                {filteredProducts.slice(0, 6).map((p) => (
                  <motion.div
                    key={p._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    <ProductCard
                      product={p}
                      router={router}
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
        </section>

        {/* ================= VERIFICATION WARNING MODAL ================= */}
        {showVerificationWarning && (
          <div className="fixed inset-0 bg-white/20 dark:bg-[#05050a]/20 backdrop-blur-sm z-20 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-slate-900 border border-orange-200 dark:border-slate-800 rounded-[28px] p-8 sm:p-12 text-center shadow-xl max-w-lg w-full"
            >
              <div className="w-20 h-20 bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 rounded-full flex items-center justify-center mx-auto mb-6">
                <ClipboardCheck className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Verification Required</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-md mx-auto text-lg leading-relaxed">
                For more product uploads, please verify your identity.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={() => router.push("/dashboard/seller")}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Go Back
                </button>
                <button
                  onClick={() => router.push("/dashboard/seller/verify-identity")}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all"
                >
                  Verify Identity
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>


      {/* ================= DELETE CONFIRMATION ================= */}
      {deletingProductId && (
        <div className="fixed inset-0 bg-white dark:bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 border border-red-200 dark:border-red-500/20 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl"
          >
            <h2 className="text-lg font-black text-red-400">Delete Product?</h2>
            <p className="text-sm text-slate-500 dark:text-white/60">
              This action cannot be undone. The product file will also be permanently deleted.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setDeletingProductId(null)} disabled={deleteLoading} className="flex-1 py-2 px-4 bg-slate-200 dark:bg-white/10 hover:bg-white/20 rounded-lg transition disabled:opacity-50">Cancel</button>
              <button onClick={handleConfirmDelete} disabled={deleteLoading} className="flex-1 py-2 px-4 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-300 rounded-lg transition disabled:opacity-50">
                {deleteLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </>
  );
}

/* ================= UI ================= */

function SectionHeading({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-4 flex items-start gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200/80 bg-slate-50 text-sm font-semibold text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:shadow-none">
        {number}
      </div>
      <div>
        <h2 className="text-base font-semibold tracking-tight text-slate-950 dark:text-white">{title}</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>
      </div>
    </div>
  );
}

function PublishStatusCard({
  completionPercentage,
  completedChecklistCount,
  isReadyForReview,
  missingChecklistItems,
  totalChecklistItems,
}: {
  completionPercentage: number;
  completedChecklistCount: number;
  isReadyForReview: boolean;
  missingChecklistItems: string[];
  totalChecklistItems: number;
}) {
  return (
    <div className={SURFACE_CARD_CLASS}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
            Listing Status
          </p>
          <h3 className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">
            {isReadyForReview ? "Ready for Review" : "Draft"}
          </h3>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${isReadyForReview
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
              : "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"
            }`}
        >
          {isReadyForReview ? "Ready" : "Not Ready"}
        </span>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="text-slate-500 dark:text-slate-400">Completion</span>
          <span className="font-semibold text-slate-900 dark:text-white">{completionPercentage}%</span>
        </div>

        <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800">
          <div
            className="h-2 rounded-full bg-gradient-to-r from-cyan-500 to-violet-600"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
        {isReadyForReview
          ? "Everything required is in place. You can submit this listing for review now."
          : "Complete product details, upload your file, and accept seller policies before submitting."}
      </p>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-3 dark:border-white/10 dark:bg-slate-900">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
            Required Progress
          </span>
          <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
            {completedChecklistCount}/{totalChecklistItems}
          </span>
        </div>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          {missingChecklistItems.length > 0
            ? `Missing: ${missingChecklistItems.join(", ")}`
            : "All required fields are complete."}
        </p>
      </div>
    </div>
  );
}

function MarketplacePreviewCard({
  thumbnailPreview,
  category,
  title,
  description,
  finalPrice,
  price,
  discount,
  tags,
}: {
  thumbnailPreview: string | null;
  category: string;
  title: string;
  description: string;
  finalPrice: number;
  price: number;
  discount: number;
  tags: string[];
}) {
  return (
    <div className={SURFACE_CARD_CLASS}>
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
          Marketplace Preview
        </p>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Buyers will see a similar product card after approval.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900">
        <div className="relative aspect-[16/9] bg-slate-100 dark:bg-slate-800">
          <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-slate-700 shadow-sm dark:bg-slate-950/90 dark:text-slate-200">
            {category || "eBook"}
          </span>

          {thumbnailPreview ? (
            <img src={thumbnailPreview} alt="Preview thumbnail" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-slate-400 dark:text-slate-500">
              <div className="flex flex-col items-center gap-2">
                <ImageIcon className="h-8 w-8" />
                <span className="text-xs font-medium">Image preview</span>
              </div>
            </div>
          )}
        </div>

        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <h3 className="line-clamp-2 text-sm font-semibold text-slate-950 dark:text-white">
              {title}
            </h3>

            <span className="shrink-0 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
              Pending Review
            </span>
          </div>

          <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
            {description}
          </p>

          <div className="mt-3 flex items-center gap-2">
            <span className="text-lg font-bold text-cyan-600 dark:text-cyan-400">&#8377;{finalPrice || 0}</span>
            <span className="text-xs text-slate-400 line-through">&#8377;{price || 0}</span>
            <span className="rounded-md bg-rose-50 px-1.5 py-0.5 text-[11px] text-rose-600 dark:bg-rose-500/10 dark:text-rose-300">
              -{discount || 0}%
            </span>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] text-slate-600 dark:border-white/10 dark:bg-slate-800 dark:text-slate-300"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ChecklistCard({
  checklistItems,
  completedChecklistCount,
}: {
  checklistItems: Array<{ label: string; complete: boolean }>;
  completedChecklistCount: number;
}) {
  return (
    <div className={SURFACE_CARD_CLASS}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
          Upload Checklist
        </p>
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
          {completedChecklistCount}/{checklistItems.length}
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {checklistItems.map((item) => (
          <div key={item.label} className="flex items-center gap-3">
            {item.complete ? (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300">
                &#10003;
              </span>
            ) : (
              <span className="h-5 w-5 rounded-full border border-slate-300 dark:border-slate-700" />
            )}
            <span className={`text-sm ${item.complete ? "text-slate-700 dark:text-slate-300" : "text-slate-500 dark:text-slate-400"}`}>
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SellerTipsCard() {
  return (
    <div className="relative overflow-hidden rounded-2xl sm:rounded-[28px] border border-blue-200/80 bg-[linear-gradient(180deg,rgba(239,246,255,0.96)_0%,rgba(219,234,254,0.9)_100%)] p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:bg-none">
      <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-blue-950 dark:text-white">Seller Tips</h3>
      <ul className="mt-3 space-y-2 text-sm text-blue-900/85 dark:text-slate-400">
        <li>Use a clear, searchable product title.</li>
        <li>Add a clean 16:9 thumbnail image.</li>
        <li>Keep your description short and useful.</li>
        <li>Make sure the preview matches the actual file and policy rules.</li>
      </ul>
    </div>
  );
}

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
  router,
  onDelete
}: {
  product: Product;
  router: any;
  onDelete: (productId: string) => void;
}) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const approved = product.status === "approved";
  const finalPrice = product.discount > 0
    ? Math.max(product.price - (product.price * product.discount) / 100, 0)
    : product.price;
    
  const rating = (product as any).rating ? Number((product as any).rating).toFixed(1) : null;
  const catStyle = categoryColors[product.category || ""] ?? defaultCat;

  return (
    <div
      onClick={() => router.push(`/dashboard/seller/products/${product._id}`)}
      className={`
        w-full group bg-white dark:bg-slate-900/40 transition-all duration-300
        flex flex-col cursor-pointer
        rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm hover:shadow-lg hover:-translate-y-1
        ${!approved ? "opacity-90" : ""}
      `}
    >
      {/* TOP BAR */}
      <div className="w-full flex justify-between items-start px-3 pt-3 sm:px-4 sm:pt-4 pb-2 bg-transparent relative">
        <div className="flex items-center gap-2 flex-wrap z-10">
          <span
            className={`flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md shadow-sm
              ${
                approved
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
                  : product.status === "rejected"
                  ? "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400"
                  : "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400"
              }`}
          >
            {product.status}
          </span>
        </div>
        
        {/* Category pill */}
        <div className="absolute left-1/2 -translate-x-1/2 top-3 sm:top-4 z-0 pointer-events-none">
          <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-md ${catStyle.pill}`}>
            {product.category || "Product"}
          </span>
        </div>

        {/* MENU */}
        <div className="relative shrink-0 z-20">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              e.nativeEvent.stopImmediatePropagation();
              setOpenMenuId(openMenuId === product._id ? null : product._id);
            }}
            className="h-8 w-8 grid place-items-center rounded-full bg-transparent hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer -mt-1 -mr-1"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          <AnimatePresence>
            {openMenuId === product._id && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, transformOrigin: "top right" }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-1 w-40 bg-white dark:bg-[#18181b] border border-slate-200 dark:border-[#27272a] rounded-xl shadow-2xl z-30 overflow-hidden"
              >
                <div className="relative group">
                  <button
                    onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/seller/products/${product._id}`); }}
                    className="w-full flex items-center gap-2 text-left px-3 py-2.5 text-sm transition-colors text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white"
                  >
                    <Eye className="w-3.5 h-3.5" /> View Product
                  </button>
                </div>
                <div className="relative group">
                  <button
                    onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/seller/products/${product._id}/edit`); }}
                    className="w-full flex items-center gap-2 text-left px-3 py-2.5 text-sm transition-colors text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white"
                  >
                    <Pencil className="w-3.5 h-3.5" /> Edit Details
                  </button>
                </div>
                <div className="relative group">
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(product._id); }}
                    className="w-full flex items-center gap-2 text-left px-3 py-2.5 text-sm transition-colors text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-300"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete Product
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* BODY */}
      <div className="flex flex-row sm:flex-col items-start px-3 pb-3 sm:px-4 sm:pb-4 pt-1 sm:pt-0">
        <div className="relative w-1/3 sm:w-full shrink-0 aspect-square sm:aspect-video bg-gray-50 dark:bg-[#0A101D] overflow-hidden rounded-xl">
          {product.thumbnailUrl ? (
            <img
              src={product.thumbnailUrl}
              alt={product.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-[#0A101D]">
              <Package className="w-10 h-10 text-slate-300 dark:text-slate-700" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
        
        {/* INFO AREA */}
        <div className="flex flex-col flex-1 w-full pl-3 sm:pl-0 sm:pt-3 min-w-0">
          <h3 className="font-extrabold text-[15px] text-gray-900 dark:text-white line-clamp-2 leading-snug tracking-tight">
            {product.title}
          </h3>
          
          <p className="text-xs text-gray-500 dark:text-slate-400 line-clamp-2 mt-1 leading-relaxed">
            {product.description}
          </p>

          <div className="flex items-center gap-1.5 mt-2">
            {rating ? (
              <>
                <div className="flex items-center gap-0.5">
                  {[1,2,3,4,5].map((s) => (
                    <Star key={s} size={11} className={
                      s <= Math.round(Number(rating))
                        ? "fill-[#FFA41C] text-[#FFA41C]"
                        : "fill-gray-200 text-gray-200 dark:fill-slate-700 dark:text-slate-700"
                    } />
                  ))}
                </div>
                <span className="text-[10px] font-medium text-[#007185] dark:text-cyan-400 ml-0.5">
                  {rating} <span className="text-gray-400">({(product as any).buyers || 0})</span>
                </span>
              </>
            ) : (
              <span className="text-[10px] text-gray-400 dark:text-slate-500 italic">No ratings yet</span>
            )}
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 mt-auto pt-2 sm:pt-4 flex-wrap">
            <span className="font-extrabold text-base sm:text-lg text-gray-900 dark:text-white tracking-tight">
              <span className="text-[10px] sm:text-[11px] font-semibold mr-0.5">₹</span>
              {finalPrice.toLocaleString()}
            </span>
            {product.discount > 0 && (
              <span className="text-[10px] sm:text-[11px] text-gray-400 dark:text-slate-500 line-through">
                ₹{product.price.toLocaleString()}
              </span>
            )}
            {product.discount > 0 && (
              <span className="bg-[#CC0C39] text-white px-1 sm:px-1.5 py-0.5 rounded-md text-[8px] sm:text-[9px] font-bold tracking-wide">
                -{product.discount}%
              </span>
            )}
          </div>

          <div className="flex flex-row items-center justify-between gap-2 mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-slate-100 dark:border-white/5 w-full">
            <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-medium">
              <Calendar className="w-3 h-3" />
              {new Date(product.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>

            {approved && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/dashboard/seller/promotions/create?productId=${product._id}`);
                }}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-600 dark:text-cyan-300 transition hover:border-cyan-300/50 hover:bg-cyan-500/15"
              >
                <Megaphone className="h-3 w-3" />
                Promote
              </button>
            )}
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
        className="w-full flex items-center justify-between rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-white hover:border-slate-300 dark:hover:border-slate-700 focus:bg-white dark:focus:bg-slate-950 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-sm dark:shadow-none"
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
            className="absolute z-50 mt-2 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden"
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
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${value === opt ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-medium" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
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








