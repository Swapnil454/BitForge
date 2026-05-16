"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ImagePlus, Megaphone, Sparkles, GripVertical, Trash2 } from "lucide-react";
import PageHeader from "../../../buyer/transactions/components/PageHeader";
import { productAPI, promotionAPI } from "@/lib/api";
import { showError, showSuccess } from "@/lib/toast";
import {
  getPromotionErrorMessage,
  PLACEMENT_LABELS,
  type PromotionPlacement,
} from "@/lib/promotions";

type SellerProduct = {
  _id: string;
  title: string;
  status: string;
  changeRequest?: string;
  isDeleted?: boolean;
  thumbnailUrl?: string | null;
};

const inputClass =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/35";

function CreatePromotionForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedProductId = searchParams.get("productId") || "";

  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [productId, setProductId] = useState(preselectedProductId);
  const [placement, setPlacement] = useState<PromotionPlacement>("MARKETPLACE_HERO");
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [buttonText, setButtonText] = useState("View Product");
  const [targetLink, setTargetLink] = useState("");
  const [promotionGoal, setPromotionGoal] = useState("");
  const [requestedDurationDays, setRequestedDurationDays] = useState(7);
  const [sellerNote, setSellerNote] = useState("");
  const [heroBgColor, setHeroBgColor] = useState("#2563EB");
  const [adImages, setAdImages] = useState<File[]>([]);
  const [adImagePreviews, setAdImagePreviews] = useState<string[]>([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoadingProducts(true);
        const data = await productAPI.getMyProducts();
        const approvedProducts = (data || []).filter(
          (product: SellerProduct) =>
            product.status === "approved" &&
            product.changeRequest === "none" &&
            !product.isDeleted
        );
        setProducts(approvedProducts);
        const stillExists = approvedProducts.some((product: SellerProduct) => product._id === preselectedProductId);
        if (!stillExists && approvedProducts[0]) {
          setProductId(approvedProducts[0]._id);
        }
      } catch {
        showError("Failed to load your products");
      } finally {
        setLoadingProducts(false);
      }
    };

    void fetchProducts();
  }, [preselectedProductId]);

  const selectedProduct = useMemo(
    () => products.find((product) => product._id === productId) || null,
    [productId, products]
  );

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    if (adImages.length + files.length > 3) {
      showError("Maximum 3 images allowed");
      return;
    }

    const validFiles = files.filter(file => {
      if (!["image/png", "image/webp"].includes(file.type)) {
        showError(`${file.name} is not a supported format (PNG/WEBP only)`);
        return false;
      }
      if (file.size > 9 * 1024 * 1024) {
        showError(`${file.name} exceeds 9MB limit`);
        return false;
      }
      return true;
    });

    if (validFiles.length) {
      setAdImages(prev => [...prev, ...validFiles]);
      setAdImagePreviews(prev => [...prev, ...validFiles.map(f => URL.createObjectURL(f))]);
    }
    
    event.target.value = "";
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData("text/plain", index.toString());
  };
  
  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    const sourceIndex = parseInt(e.dataTransfer.getData("text/plain"), 10);
    if (sourceIndex === index || isNaN(sourceIndex)) return;
    
    const newImages = [...adImages];
    const [movedImage] = newImages.splice(sourceIndex, 1);
    newImages.splice(index, 0, movedImage);
    setAdImages(newImages);

    const newPreviews = [...adImagePreviews];
    const [movedPreview] = newPreviews.splice(sourceIndex, 1);
    newPreviews.splice(index, 0, movedPreview);
    setAdImagePreviews(newPreviews);
  };
  
  const removeImage = (index: number) => {
    setAdImages(prev => prev.filter((_, i) => i !== index));
    setAdImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!productId) {
      showError("Select a product");
      return;
    }

    if (!title.trim() || !subtitle.trim()) {
      showError("Title and subtitle are required");
      return;
    }

    if (adImages.length === 0) {
      showError("Upload at least one image");
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append("productId", productId);
      formData.append("placement", placement);
      formData.append("title", title.trim());
      formData.append("subtitle", subtitle.trim());
      formData.append("buttonText", buttonText.trim() || "View Product");
      formData.append("targetLink", targetLink.trim());
      formData.append("promotionGoal", promotionGoal.trim());
      formData.append("requestedDurationDays", requestedDurationDays.toString());
      formData.append("sellerNote", sellerNote);
      formData.append("heroBgColor", heroBgColor);

      adImages.forEach((file) => {
        formData.append("adImages", file);
      });

      const response = await promotionAPI.createSellerPromotion(formData);
      showSuccess("Promotion request submitted");
      router.push(`/dashboard/seller/promotions/${response.promotion._id}`);
    } catch (error) {
      showError(getPromotionErrorMessage(error, "Failed to submit promotion request"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-[#05050a] text-slate-900 dark:text-white">
      <PageHeader
        backHref="/dashboard/seller/promotions"
        backLabel="Promotions"
        title="Create Promotion"
        subtitle="One request promotes one approved product in the marketplace hero"
      />

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
          <div className="mb-6">
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-cyan-500">Seller Request</p>
            <h2 className="mt-2 text-2xl font-black">Promotion Details</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-white/60">
              Sellers can currently request only the marketplace hero banner. Admin will review pricing, duration, and final priority.
            </p>
          </div>

          {loadingProducts ? (
            <div className="h-96 animate-pulse rounded-3xl bg-slate-100 dark:bg-white/5" />
          ) : products.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 px-6 py-14 text-center dark:border-white/15">
              <Megaphone className="mx-auto h-10 w-10 text-cyan-400" />
              <h3 className="mt-4 text-xl font-bold">No approved products available</h3>
              <p className="mt-2 text-sm text-slate-500 dark:text-white/60">
                Upload and get at least one product approved before requesting a promotion.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              <Field label="Select Product">
                <select value={productId} onChange={(e) => setProductId(e.target.value)} className={inputClass}>
                  {products.map((product) => (
                    <option key={product._id} value={product._id}>
                      {product.title}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Ad Placement">
                <select
                  value={placement}
                  onChange={(e) => setPlacement(e.target.value as PromotionPlacement)}
                  className={inputClass}
                >
                  <option value="MARKETPLACE_HERO">{PLACEMENT_LABELS.MARKETPLACE_HERO}</option>
                </select>
              </Field>

              <div className="grid gap-5 md:grid-cols-2">
                <Field label="Banner Title">
                  <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
                </Field>
                <Field label="Button Text">
                  <input value={buttonText} onChange={(e) => setButtonText(e.target.value)} className={inputClass} />
                </Field>
              </div>

              <Field label="Banner Subtitle">
                <textarea
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  rows={3}
                  className={`${inputClass} resize-none`}
                />
              </Field>

              <div className="grid gap-5 md:grid-cols-2">
                <Field label="Target Link">
                  <input
                    value={targetLink}
                    onChange={(e) => setTargetLink(e.target.value)}
                    placeholder={selectedProduct ? `/marketplace/${selectedProduct._id}` : "/marketplace/product-id"}
                    className={inputClass}
                  />
                </Field>
                <Field label="Requested Duration (days)">
                  <input
                    type="number"
                    min={1}
                    value={requestedDurationDays}
                    onChange={(e) => setRequestedDurationDays(Number(e.target.value) || 1)}
                    className={inputClass}
                  />
                </Field>
              </div>

              <Field label="Promotion Goal">
                <input
                  value={promotionGoal}
                  onChange={(e) => setPromotionGoal(e.target.value)}
                  placeholder="Launch week push, seasonal sale, more visibility..."
                  className={inputClass}
                />
              </Field>

              <Field label="Notes for Admin">
                <textarea
                  value={sellerNote}
                  onChange={(e) => setSellerNote(e.target.value)}
                  rows={4}
                  className={`${inputClass} resize-none`}
                />
              </Field>

              <Field label="Background Color (Hex)">
                <div className="flex gap-4">
                  <input
                    type="color"
                    value={heroBgColor}
                    onChange={(e) => setHeroBgColor(e.target.value)}
                    className="h-12 w-12 flex-shrink-0 cursor-pointer appearance-none rounded-xl border-0 p-0"
                  />
                  <input
                    type="text"
                    value={heroBgColor}
                    onChange={(e) => setHeroBgColor(e.target.value)}
                    className={inputClass}
                    placeholder="#2563EB"
                  />
                </div>
              </Field>

              <Field label="Floating Product Images (Up to 3)">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 dark:border-white/10 dark:bg-white/5">
                  <div className="mb-4 text-sm text-slate-500 dark:text-white/60">
                    <p className="font-semibold text-slate-700 dark:text-white">Seller Guidelines for Premium Ads:</p>
                    <ul className="mt-2 list-disc pl-5 space-y-1">
                      <li>Use transparent PNG or WEBP images for the best floating effect.</li>
                      <li>Avoid text near the edges of your images.</li>
                      <li>Square or portrait crops work best.</li>
                      <li>Max 9MB per image. You can reorder images by dragging them.</li>
                    </ul>
                  </div>

                  {adImages.length > 0 && (
                    <div className="mb-4 grid gap-3">
                      {adImagePreviews.map((preview, idx) => (
                        <div 
                          key={preview}
                          draggable
                          onDragStart={(e) => handleDragStart(e, idx)}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => handleDrop(e, idx)}
                          className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition hover:border-cyan-400 dark:border-white/10 dark:bg-[#0a0a0f]"
                        >
                          <GripVertical className="h-5 w-5 cursor-grab text-slate-400" />
                          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100 dark:bg-white/5">
                            <img src={preview} alt="Upload preview" className="h-full w-full object-contain" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold">Image {idx + 1}</p>
                            <p className="text-xs text-slate-500 dark:text-white/50">{(adImages[idx].size / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                          <button
                            onClick={() => removeImage(idx)}
                            className="p-2 text-slate-400 hover:text-red-500 transition"
                            title="Remove image"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {adImages.length < 3 && (
                    <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-300 bg-white px-6 py-8 text-center transition hover:border-cyan-400/60 hover:bg-cyan-500/5 dark:border-white/15 dark:bg-[#0a0a0f]">
                      <ImagePlus className="h-8 w-8 text-cyan-400" />
                      <div>
                        <p className="font-semibold text-sm">Upload transparent image</p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-white/55">
                          PNG/WEBP up to 9MB ({3 - adImages.length} slots remaining)
                        </p>
                      </div>
                      <input type="file" accept="image/png, image/webp" multiple onChange={handleImageChange} className="hidden" />
                    </label>
                  )}
                </div>
              </Field>

              <button
                onClick={() => void handleSubmit()}
                disabled={submitting || products.length === 0}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-500 px-6 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Sparkles className="h-4 w-4" />
                {submitting ? "Submitting..." : "Submit Request"}
              </button>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <PreviewCard title="Product" subtitle={selectedProduct?.title || "Select a product first"}>
            {selectedProduct?.thumbnailUrl ? (
              <img
                src={selectedProduct.thumbnailUrl}
                alt={selectedProduct.title}
                className="h-48 w-full rounded-3xl object-cover"
              />
            ) : (
              <div className="flex h-48 items-center justify-center rounded-3xl bg-slate-100 text-slate-400 dark:bg-white/5">
                <Megaphone className="h-10 w-10" />
              </div>
            )}
          </PreviewCard>

          <PreviewCard title="Banner Preview" subtitle="This is how your request looks before admin review">
            <div className="relative overflow-hidden rounded-3xl" style={{ backgroundColor: heroBgColor }}>
              {/* Fake glow and bottom fade to simulate the real hero ad */}
              <div className="absolute -left-1/4 -top-1/4 h-1/2 w-1/2 rounded-full bg-white/20 blur-3xl mix-blend-overlay"></div>
              <div className="absolute -bottom-1/4 -right-1/4 h-1/2 w-1/2 rounded-full bg-black/20 blur-3xl mix-blend-overlay"></div>
              
              <div className="relative flex min-h-[300px] flex-col items-center justify-center p-8 text-white md:flex-row">
                
                {/* Left Images Area */}
                {adImagePreviews.length > 1 && (
                  <div className="hidden md:flex relative z-10 w-1/4 h-full items-end justify-start gap-2">
                    {adImagePreviews.slice(1, 3).map((preview, i) => (
                      <div
                        key={preview}
                        className="relative transition-all duration-500 ease-out flex-shrink-0 origin-bottom"
                        style={{ height: i === 0 ? "85%" : "70%", zIndex: 9 - i, marginLeft: i > 0 ? "-2rem" : "0" }}
                      >
                        <img src={preview} alt="" className="h-full w-auto object-contain drop-shadow-2xl" />
                      </div>
                    ))}
                  </div>
                )}

                {/* Content Area */}
                <div className="relative z-10 w-full md:flex-1 flex flex-col items-center text-center px-4">
                  <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em]">
                    Sponsored
                  </span>
                  <h3 className="mt-4 text-3xl font-black leading-tight drop-shadow-md">
                    {title || "Your banner title"}
                  </h3>
                  <p className="mt-4 text-base text-white/80 drop-shadow-md">
                    {subtitle || "Your banner subtitle will appear here."}
                  </p>
                  <button className="mt-8 rounded-full bg-white px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-slate-100 shadow-xl shadow-black/10">
                    {buttonText || "View Product"}
                  </button>
                </div>
                
                {/* Right Image Area */}
                <div className="relative mt-8 h-48 w-full md:mt-0 md:w-1/4 md:flex items-end justify-end">
                  {adImagePreviews.length > 0 ? (
                    <div className="relative h-full w-full flex justify-end" style={{ zIndex: 10 }}>
                      <img src={adImagePreviews[0]} alt="" className="h-full w-auto object-contain drop-shadow-2xl" />
                    </div>
                  ) : (
                    <div className="flex h-full w-full items-center justify-center rounded-2xl border-2 border-dashed border-white/30 bg-white/5 backdrop-blur-sm">
                      <ImagePlus className="h-8 w-8 text-white/50" />
                    </div>
                  )}
                </div>
              </div>
              
              <div className="absolute bottom-0 left-0 h-24 w-full bg-gradient-to-t from-slate-50 to-transparent dark:from-[#05050a]"></div>
            </div>
          </PreviewCard>
        </div>
      </section>
    </main>
  );
}

export default function CreatePromotionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 dark:bg-[#05050a] flex items-center justify-center">
        <div className="h-12 w-12 rounded-full border-4 border-cyan-400 border-t-transparent animate-spin" />
      </div>
    }>
      <CreatePromotionForm />
    </Suspense>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-600 dark:text-white/75">{label}</span>
      {children}
    </label>
  );
}

function PreviewCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-500">{title}</p>
      <p className="mt-2 text-sm text-slate-500 dark:text-white/60">{subtitle}</p>
      <div className="mt-5">{children}</div>
    </div>
  );
}
