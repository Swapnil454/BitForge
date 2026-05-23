import { create } from 'zustand';

export type ProductMeta = {
  image?: string;
  title: string;
  price?: number;
  category?: string;
  status: string;
};

export type AssetSlot = {
  file?: File;
  url?: string;
  uploadState: 'empty' | 'uploading' | 'success' | 'error';
  progress: number;
  errorMessage?: string;
};

export type MobileBannerSlot = AssetSlot & {
  aspectRatioWarning?: string;
};

export type ColorToken = {
  bg: string;
  textColor: string;
  ctaBg: string;
};

export interface PromotionFormState {
  // Product
  selectedProductId: string;
  selectedProductMeta: ProductMeta | null;
  productLoadingState: 'idle' | 'loading' | 'success' | 'error';

  // Banner Content
  bannerTitle: string;
  bannerSubtitle: string;
  ctaText: string;
  targetLink: string;

  // Campaign
  promotionGoal: string;
  goalChipSelected: string;
  requestedDuration: number;
  customDuration: string;
  adminNotes: string;

  // Style
  colorToken: ColorToken;
  customHex: string;

  // Assets
  floatingImages: [AssetSlot, AssetSlot, AssetSlot];
  mobileBanner: MobileBannerSlot;

  // Meta
  draftSaveState: 'idle' | 'saving' | 'saved' | 'error';
  lastSavedAt: number | null;
  formCompletion: number;
}

export interface PromotionFormActions {
  // Setters
  setProduct: (id: string, meta: ProductMeta | null) => void;
  setProductLoadingState: (state: PromotionFormState['productLoadingState']) => void;
  
  setBannerContent: (fields: Partial<Pick<PromotionFormState, 'bannerTitle' | 'bannerSubtitle' | 'ctaText' | 'targetLink'>>) => void;
  
  setCampaignDetails: (fields: Partial<Pick<PromotionFormState, 'promotionGoal' | 'goalChipSelected' | 'requestedDuration' | 'customDuration' | 'adminNotes'>>) => void;
  
  setStyle: (colorToken: ColorToken, customHex: string) => void;
  
  updateFloatingImage: (index: number, slot: Partial<AssetSlot>) => void;
  reorderFloatingImages: (sourceIndex: number, destIndex: number) => void;
  
  updateMobileBanner: (slot: Partial<MobileBannerSlot>) => void;
  
  setDraftState: (state: PromotionFormState['draftSaveState'], timestamp?: number) => void;
  
  // Computed (actions that trigger computation)
  calculateCompletion: () => void;
  
  // Reset
  hydrateFromDraft: (draft: Partial<PromotionFormState>) => void;
  resetForm: () => void;
}

const initialAssetSlot: AssetSlot = { uploadState: 'empty', progress: 0 };

const initialState: PromotionFormState = {
  selectedProductId: '',
  selectedProductMeta: null,
  productLoadingState: 'idle',

  bannerTitle: '',
  bannerSubtitle: '',
  ctaText: 'View Product',
  targetLink: '',

  promotionGoal: '',
  goalChipSelected: '',
  requestedDuration: 7,
  customDuration: '',
  adminNotes: '',

  colorToken: { bg: '#2563EB', textColor: '#FFFFFF', ctaBg: '#FFFFFF' },
  customHex: '#2563EB',

  floatingImages: [{ ...initialAssetSlot }, { ...initialAssetSlot }, { ...initialAssetSlot }],
  mobileBanner: { ...initialAssetSlot },

  draftSaveState: 'idle',
  lastSavedAt: null,
  formCompletion: 0,
};

export const usePromotionFormStore = create<PromotionFormState & PromotionFormActions>((set, get) => ({
  ...initialState,

  setProduct: (id, meta) => set({ selectedProductId: id, selectedProductMeta: meta }, false),
  setProductLoadingState: (state) => set({ productLoadingState: state }, false),

  setBannerContent: (fields) => set((state) => ({ ...state, ...fields }), false),
  
  setCampaignDetails: (fields) => set((state) => ({ ...state, ...fields }), false),

  setStyle: (colorToken, customHex) => set({ colorToken, customHex }, false),

  updateFloatingImage: (index, slot) => set((state) => {
    const newImages = [...state.floatingImages] as [AssetSlot, AssetSlot, AssetSlot];
    newImages[index] = { ...newImages[index], ...slot };
    return { floatingImages: newImages };
  }, false),

  reorderFloatingImages: (sourceIndex, destIndex) => set((state) => {
    const newImages = [...state.floatingImages] as [AssetSlot, AssetSlot, AssetSlot];
    const [moved] = newImages.splice(sourceIndex, 1);
    newImages.splice(destIndex, 0, moved);
    // Pad to 3 if needed (though splice on 3 items array will just shift them)
    while (newImages.length < 3) newImages.push({ ...initialAssetSlot });
    return { floatingImages: newImages as [AssetSlot, AssetSlot, AssetSlot] };
  }, false),

  updateMobileBanner: (slot) => set((state) => ({
    mobileBanner: { ...state.mobileBanner, ...slot }
  }), false),

  setDraftState: (draftSaveState, timestamp) => set((state) => ({
    draftSaveState,
    lastSavedAt: timestamp !== undefined ? timestamp : state.lastSavedAt
  }), false),

  calculateCompletion: () => set((state) => {
    let completed = 0;
    let total = 6; // Product, Title, Subtitle, Duration, DesktopImage(1), MobileImage

    if (state.selectedProductId) completed++;
    if (state.bannerTitle.trim().length > 0) completed++;
    if (state.bannerSubtitle.trim().length > 0) completed++;
    if (state.requestedDuration > 0) completed++;
    if (state.floatingImages.some(img => img.uploadState === 'success' || img.url)) completed++;
    if (state.mobileBanner.uploadState === 'success' || state.mobileBanner.url) completed++;

    return { formCompletion: Math.round((completed / total) * 100) };
  }, false),

  hydrateFromDraft: (draft) => set((state) => ({
    ...state,
    ...draft,
    // Ensure nested objects aren't partially corrupted
    colorToken: draft.colorToken || state.colorToken,
    floatingImages: draft.floatingImages?.length === 3 ? draft.floatingImages : state.floatingImages,
    mobileBanner: draft.mobileBanner || state.mobileBanner,
  }), false),

  resetForm: () => set({ ...initialState }, false),
}));
