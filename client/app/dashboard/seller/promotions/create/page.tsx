"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ImagePlus, Megaphone, Sparkles } from "lucide-react";
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
  const [bannerImage, setBannerImage] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

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

  const handleBannerChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showError("Banner must be an image");
      return;
    }

    setBannerImage(file);
    setBannerPreview(URL.createObjectURL(file));
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

    if (!bannerImage) {
      showError("Upload a banner image");
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
      formData.append("requestedDurationDays", String(requestedDurationDays));
      formData.append("sellerNote", sellerNote.trim());
      formData.append("bannerImage", bannerImage);

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

              <Field label="Banner Image Upload">
                <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center transition hover:border-cyan-400/60 hover:bg-cyan-500/5 dark:border-white/15 dark:bg-white/5">
                  <ImagePlus className="h-10 w-10 text-cyan-400" />
                  <div>
                    <p className="font-semibold">Upload banner artwork</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-white/55">
                      Recommended wide image for hero placement
                    </p>
                  </div>
                  <input type="file" accept="image/*" onChange={handleBannerChange} className="hidden" />
                </label>
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
            {bannerPreview ? (
              <img src={bannerPreview} alt="Banner preview" className="h-56 w-full rounded-3xl object-cover" />
            ) : (
              <div className="flex h-56 items-center justify-center rounded-3xl bg-slate-100 text-slate-400 dark:bg-white/5">
                <ImagePlus className="h-10 w-10" />
              </div>
            )}

            <div className="mt-4 rounded-3xl bg-slate-950 px-6 py-6 text-white">
              <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em]">
                Sponsored
              </span>
              <h3 className="mt-4 text-2xl font-black">{title || "Your banner title"}</h3>
              <p className="mt-2 text-sm text-white/70">{subtitle || "Your banner subtitle will appear here."}</p>
              <button className="mt-5 rounded-full bg-white px-5 py-2 text-sm font-bold text-slate-950">
                {buttonText || "View Product"}
              </button>
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
