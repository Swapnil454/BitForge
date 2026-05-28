import { useEffect, useState, useRef } from 'react';
import { usePromotionFormStore, ProductMeta } from '../store';
import { SectionCard } from './SectionCard';
import { Megaphone, CheckCircle2, ChevronDown, Check, AlertCircle } from 'lucide-react';
import { productAPI } from "@/lib/api";
import { showError } from "@/lib/toast";

export function CardProductSelection() {
  const { selectedProductId, setProduct, setProductLoadingState, productLoadingState, targetLink, setBannerContent } = usePromotionFormStore();
  const [products, setProducts] = useState<{ _id: string; title: string; thumbnailUrl?: string; status: string }[]>([]);
  const [isEditing, setIsEditing] = useState(!selectedProductId);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // If a product is selected (e.g. from draft hydration) but target link is completely empty, auto-fill it
    if (selectedProductId && !targetLink) {
      setBannerContent({ targetLink: `/marketplace/${selectedProductId}` });
    }
  }, [selectedProductId, targetLink, setBannerContent]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchProducts = async () => {
    try {
      setProductLoadingState('loading');
      const data = await productAPI.getMyProducts();
      const approvedProducts = (data || []).filter(
        (p: any) => p.status === "approved" && p.changeRequest === "none" && !p.isDeleted
      );
      setProducts(approvedProducts);
      setProductLoadingState('success');
    } catch {
      showError("Failed to load your products");
      setProductLoadingState('error');
    }
  };

  useEffect(() => {
    if (productLoadingState === 'idle') {
      fetchProducts();
    }
  }, [productLoadingState, setProductLoadingState]);

  const handleSelect = (id: string) => {
    const p = products.find(p => p._id === id);
    if (!p) return;
    
    setProduct(id, {
      title: p.title,
      image: p.thumbnailUrl,
      status: p.status
    });
    
    // Auto-populate target link based on selected product
    usePromotionFormStore.getState().setBannerContent({ targetLink: `/marketplace/${id}` });
    
    setIsEditing(false);
  };

  const selectedProduct = products.find(p => p._id === selectedProductId);

  return (
    <SectionCard stepNumber={1} title="Select Product">
      {productLoadingState === 'loading' && (
        <div className="h-24 animate-pulse rounded-2xl bg-slate-100 dark:bg-white/5" />
      )}

      {productLoadingState === 'error' && (
        <div className="rounded-3xl border border-dashed border-red-300 px-6 py-8 text-center bg-red-50 dark:border-red-500/30 dark:bg-red-500/10">
          <AlertCircle className="mx-auto h-8 w-8 text-red-500 mb-3" />
          <h3 className="text-lg font-bold text-red-700 dark:text-red-400">Failed to load products</h3>
          <button 
            onClick={() => setProductLoadingState('idle')} // This will trigger re-render and re-fetch if we update the useEffect dependency or just do a manual fetch
            className="mt-4 px-4 py-2 bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300 rounded-lg font-semibold hover:bg-red-200 transition"
          >
            Retry
          </button>
        </div>
      )}

      {productLoadingState === 'success' && products.length === 0 && (
        <div className="rounded-3xl border border-dashed border-slate-300 px-6 py-14 text-center dark:border-white/15">
          <Megaphone className="mx-auto h-10 w-10 text-cyan-400" />
          <h3 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">No approved products yet</h3>
          <p className="mt-2 text-sm text-slate-500 dark:text-white/60">
            Products must be approved before they can be promoted.
          </p>
          <a href="/dashboard/seller/products/new" className="mt-6 inline-block font-semibold text-cyan-600 hover:text-cyan-500">
            Upload a product &rarr;
          </a>
        </div>
      )}

      {productLoadingState === 'success' && products.length > 0 && (isEditing || !selectedProduct) && (
        <div className="space-y-4">
          <label className="block text-sm font-bold text-slate-900 dark:text-white">
            Choose an approved product
          </label>
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className={`flex w-full items-center justify-between rounded-2xl border bg-white px-4 py-3 text-sm transition outline-none dark:bg-[#0a0a0f] ${
                isOpen ? 'border-cyan-400 ring-2 ring-cyan-500/20' : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'
              }`}
            >
              <span className={selectedProductId ? "text-slate-900 dark:text-white font-medium truncate" : "text-slate-500 dark:text-white/50"}>
                {selectedProductId ? products.find(p => p._id === selectedProductId)?.title : "Select a product..."}
              </span>
              <ChevronDown className={`w-5 h-5 text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
              <div className="absolute z-50 mt-2 w-full rounded-2xl border border-slate-200 bg-white py-2 shadow-xl dark:border-white/10 dark:bg-[#12121a] animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="max-h-60 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-200 dark:scrollbar-thumb-white/10 px-2">
                  {products.map(p => {
                    const isSelected = p._id === selectedProductId;
                    return (
                      <button
                        key={p._id}
                        type="button"
                        onClick={() => { handleSelect(p._id); setIsOpen(false); }}
                        className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition-colors mb-1 last:mb-0 ${
                          isSelected 
                            ? 'bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-400 font-bold' 
                            : 'text-slate-700 hover:bg-slate-100 dark:text-white/80 dark:hover:bg-white/5 font-medium'
                        }`}
                      >
                        <span className="truncate pr-4">{p.title}</span>
                        {isSelected && <Check className="w-4 h-4 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {productLoadingState === 'success' && products.length > 0 && !isEditing && selectedProduct && (
        <div className="flex items-center justify-between rounded-2xl border border-cyan-200 bg-cyan-50/50 p-4 dark:border-cyan-500/20 dark:bg-cyan-500/5">
          <div className="flex items-center gap-4">
            {selectedProduct.thumbnailUrl ? (
              <img src={selectedProduct.thumbnailUrl} alt={selectedProduct.title} className="w-16 h-16 rounded-xl object-cover bg-white dark:bg-slate-900" />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-slate-200 dark:bg-white/10 flex items-center justify-center">
                <Megaphone className="w-6 h-6 text-slate-400" />
              </div>
            )}
            <div>
              <p className="font-bold text-slate-900 dark:text-white text-lg">{selectedProduct.title}</p>
              <div className="flex items-center gap-1.5 mt-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4" /> Approved
              </div>
            </div>
          </div>
          <button 
            onClick={() => setIsEditing(true)}
            className="text-sm font-semibold text-cyan-600 dark:text-cyan-400 hover:underline"
          >
            Change
          </button>
        </div>
      )}
      
      {/* Readonly Ad Placement */}
      <div className="mt-6 pt-6 border-t border-slate-100 dark:border-white/5">
        <label className="block text-sm font-semibold text-slate-400 dark:text-white/40 mb-2">Ad Placement (Locked)</label>
        <div className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500 dark:border-white/5 dark:bg-white/5 dark:text-white/50 cursor-not-allowed">
          Marketplace Hero Banner
        </div>
      </div>
    </SectionCard>
  );
}
