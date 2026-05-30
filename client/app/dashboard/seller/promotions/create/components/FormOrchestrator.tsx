import React, { useEffect, useState } from 'react';
import { usePromotionFormStore } from '../store';
import { DraftService } from '../DraftService';
import { CardProductSelection } from './CardProductSelection';
import { CardBannerContent } from './CardBannerContent';
import { CardCampaignDetails } from './CardCampaignDetails';
import { CardBannerStyle } from './CardBannerStyle';
import { CardDesktopImages } from './CardDesktopImages';
import { CardMobileBanner } from './CardMobileBanner';
import { LivePreviewPanel } from './LivePreviewPanel';
import { StickyActionBar } from './StickyActionBar';
import { PreviewBottomSheet } from './PreviewBottomSheet';
import { useLeaveGuard } from '../hooks/useLeaveGuard';
import { CheckCircle2, AlertTriangle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/useAuth';
import { promotionAPI } from '@/lib/api';
import { showError } from '@/lib/toast';
import { useSearchParams } from 'next/navigation';

export function FormOrchestrator() {
  const store = usePromotionFormStore();
  const { user } = useAuth(); // or equivalent to get userId
  const userId = user?._id || 'temp-user';
  const searchParams = useSearchParams();
  const renewId = searchParams?.get('renewId');
  
  const [isMobilePreviewOpen, setIsMobilePreviewOpen] = useState(false);
  const [submissionState, setSubmissionState] = useState<'idle' | 'submitting' | 'success' | 'error' | 'duplicate'>('idle');
  const [submittedPromotionId, setSubmittedPromotionId] = useState<string | null>(null);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [lastHydratedRenewId, setLastHydratedRenewId] = useState<string | null>(null);

  // Leave Guard
  useLeaveGuard(store.draftSaveState === 'idle' && store.formCompletion > 0 && submissionState !== 'success');

  // Renew Hydration
  useEffect(() => {
    if (renewId && renewId !== lastHydratedRenewId) {
      setLastHydratedRenewId(renewId);
      promotionAPI.getSellerPromotion(renewId).then(data => {
        const p = data.promotion;
        if (!p) return;
        
        const productId = typeof p.productId === 'string' ? p.productId : p.productId?._id;
        const productMeta = typeof p.productId === 'object' ? p.productId : { title: p.productTitle, status: 'active' };
        
        const initialAssetSlot = { uploadState: 'empty' as const, progress: 0 };
        const floatingImages: any = [
          { ...initialAssetSlot },
          { ...initialAssetSlot },
          { ...initialAssetSlot }
        ];

        if (p.adImages && Array.isArray(p.adImages)) {
          p.adImages.forEach((imgObj: any, idx: number) => {
            if (idx < 3) {
              const url = typeof imgObj === 'string' ? imgObj : imgObj?.url;
              if (url) {
                floatingImages[idx] = { ...initialAssetSlot, url, uploadState: 'success' as const };
              }
            }
          });
        }
        
        const mobileBanner = p.bannerImage 
          ? { ...initialAssetSlot, url: p.bannerImage, uploadState: 'success' as const }
          : { ...initialAssetSlot };
        
        usePromotionFormStore.setState({
          selectedProductId: productId,
          selectedProductMeta: productMeta,
          bannerTitle: p.title || '',
          bannerSubtitle: p.subtitle || '',
          targetLink: p.targetLink || '',
          promotionGoal: p.promotionGoal || '',
          requestedDuration: p.approvedDurationDays || p.requestedDurationDays || 7,
          layoutType: p.heroLayout === 'fullImage' ? 'fullImage' : 'modern',
          colorToken: {
            bg: p.heroBgColor || '#2563EB',
            textColor: p.heroTitleColor || '#FFFFFF',
            ctaBg: p.heroButtonBgColor || '#FFFFFF'
          },
          customHex: p.heroBgColor || '#2563EB',
          floatingImages,
          mobileBanner
        });
      }).catch(console.error);
    }
  }, [renewId, lastHydratedRenewId]);

  // Initial Draft Hydration (only if no renewId)
  useEffect(() => {
    if (store.selectedProductId && userId && !renewId) {
      const draft = DraftService.getDraft(userId, store.selectedProductId);
      if (draft) {
        store.hydrateFromDraft(draft);
      }
    }
  }, [store.selectedProductId, userId, renewId]);

  // Auto-save Draft
  useEffect(() => {
    if (!store.selectedProductId || !userId) return;

    store.setDraftState('saving');
    const timeoutId = setTimeout(() => {
      DraftService.saveDraft(userId, store.selectedProductId, store);
      store.setDraftState('saved', Date.now());
    }, 2000); // Debounce 2 seconds

    return () => clearTimeout(timeoutId);
  }, [
    store.selectedProductId, store.bannerTitle, store.bannerSubtitle, store.ctaText, 
    store.targetLink, store.promotionGoal, store.requestedDuration, store.customDuration,
    store.adminNotes, store.colorToken, store.customHex, store.floatingImages, store.mobileBanner
  ]);

  // Recalculate Completion
  useEffect(() => {
    store.calculateCompletion();
  }, [
    store.selectedProductId, store.bannerTitle, store.bannerSubtitle, store.requestedDuration,
    store.floatingImages, store.mobileBanner
  ]);

  const handleSubmit = async () => {
    if (store.formCompletion < 100) return;
    
    setSubmissionState('submitting');
    try {
      const formData = new FormData();
      if (renewId) {
        formData.append('renewId', renewId);
      }
      formData.append('productId', store.selectedProductId);
      formData.append('placement', 'MARKETPLACE_HERO');
      if (store.layoutType !== 'fullImage') {
        formData.append('title', store.bannerTitle);
        formData.append('subtitle', store.bannerSubtitle);
        if (store.ctaText) formData.append('buttonText', store.ctaText);
        if (store.targetLink) formData.append('targetLink', store.targetLink);
        
        formData.append('heroBgColor', store.customHex || store.colorToken.bg);
        const textHex = store.colorToken.textColor.toLowerCase();
        const isLightText = textHex === '#ffffff' || textHex === '#fef3c7' || textHex === '#f8fafc';
        formData.append('heroTextColor', isLightText ? 'light' : 'dark');
        formData.append('heroTitleColor', store.colorToken.textColor);
        formData.append('heroSubtitleColor', store.colorToken.textColor);
        formData.append('heroButtonBgColor', store.colorToken.ctaBg);
      }
      
      if (store.promotionGoal) formData.append('promotionGoal', store.promotionGoal);
      formData.append('requestedDurationDays', String(store.requestedDuration));
      if (store.adminNotes) formData.append('sellerNote', store.adminNotes);
      
      formData.append('heroLayout', store.layoutType === 'fullImage' ? 'fullImage' : 'floating');

      // Append floating images
      const existingAdImages: string[] = [];
      store.floatingImages.forEach((img) => {
        if (img.file) {
          formData.append('adImages', img.file);
        } else if (img.url && !img.url.startsWith('blob:')) {
          existingAdImages.push(img.url);
        }
      });
      
      if (existingAdImages.length > 0) {
        formData.append('existingAdImages', JSON.stringify(existingAdImages));
      }

      if (store.layoutType !== 'fullImage' && store.mobileBanner.url) {
        if (store.mobileBanner.file) {
          formData.append('bannerCard', store.mobileBanner.file);
        } else if (!store.mobileBanner.url.startsWith('blob:')) {
          formData.append('existingBannerImage', store.mobileBanner.url);
        }
      }

      const response = await promotionAPI.createSellerPromotion(formData);
      
      // Clear draft on success
      DraftService.clearDraft(userId, store.selectedProductId);
      setSubmittedPromotionId(response.promotion._id);
      setSubmissionState('success');
    } catch (error: any) {
      const msg = error?.response?.data?.message || '';
      if (msg.toLowerCase().includes('already has') || msg.toLowerCase().includes('duplicate')) {
        setSubmissionState('duplicate');
      } else {
        showError(msg || "Failed to submit promotion request");
        setSubmissionState('error');
      }
    }
  };

  const isLocked = !store.selectedProductId;

  if (submissionState === 'success') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-4">Request Submitted Successfully!</h1>
        <p className="text-slate-500 dark:text-white/60 max-w-md mx-auto mb-8">
          Your promotion request for <strong className="text-slate-900 dark:text-white">{store.selectedProductMeta?.title}</strong> has been sent to our review team. Estimated review time is 24-48 hours. Reference ID: #{submittedPromotionId ? submittedPromotionId.slice(-6).toUpperCase() : `PRM-${Math.floor(Math.random()*10000)}`}
        </p>
        <Link href="/dashboard/seller/promotions" className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-500 text-slate-950 font-bold rounded-xl hover:bg-cyan-400 transition">
          <ArrowLeft className="w-4 h-4" /> Back to Promotions
        </Link>
      </div>
    );
  }

  return (
    <>
      {submissionState === 'error' && (
        <div className="sticky top-0 z-[60] -mt-8 mb-8 mx-auto w-full max-w-4xl bg-red-500 text-white p-4 rounded-b-2xl shadow-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5" />
            <p className="font-semibold">Submission failed. Your draft was automatically saved.</p>
          </div>
          <button onClick={handleSubmit} className="px-4 py-1.5 bg-white text-red-500 font-bold rounded-lg text-sm hover:bg-red-50">
            Retry
          </button>
        </div>
      )}

      {submissionState === 'duplicate' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl max-w-md w-full shadow-2xl">
            <AlertTriangle className="w-12 h-12 text-amber-500 mb-4" />
            <h2 className="text-xl font-black mb-2">Duplicate Request</h2>
            <p className="text-slate-500 dark:text-white/60 mb-6">You already have a pending promotion request for this product. Please wait for it to be reviewed before submitting another.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setSubmissionState('idle')} className="px-6 py-2 bg-slate-100 dark:bg-white/10 font-bold rounded-xl">Dismiss</button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-6 pb-4">
        
        {/* Left Column: Form Cards */}
        <div className="space-y-4">
          <CardProductSelection />
          <div className={`space-y-4 transition-all duration-500 ${isLocked ? 'opacity-50 grayscale-[30%] pointer-events-none' : ''}`}>
            {store.layoutType === 'modern' && <CardBannerContent locked={isLocked} />}
            <CardCampaignDetails locked={isLocked} />
            {store.layoutType === 'modern' && <CardBannerStyle locked={isLocked} />}
            <CardDesktopImages locked={isLocked} />
            <CardMobileBanner locked={isLocked} />
          </div>
        </div>

        {/* Right Column: Live Preview */}
        <div className="hidden xl:block">
          <LivePreviewPanel />
        </div>

      </div>

      <StickyActionBar 
        onSubmit={handleSubmit} 
        onPreviewMobile={() => setIsMobilePreviewOpen(true)} 
      />

      <PreviewBottomSheet 
        isOpen={isMobilePreviewOpen} 
        onClose={() => setIsMobilePreviewOpen(false)} 
      />
    </>
  );
}
