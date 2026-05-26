export interface DraftData {
  // We'll store a serialized version of the form state here
  // Files can't be directly serialized to localStorage, 
  // so we'll need to define exactly what gets saved (e.g., text fields, goals, colors).
  [key: string]: any;
}

export class DraftService {
  private static getKey(userId: string, productId: string): string {
    return `draft:promotion:${userId}:${productId}`;
  }

  static saveDraft(userId: string, productId: string, data: DraftData): void {
    if (!userId || !productId) return;
    try {
      // Exclude File objects before serializing (they won't survive stringify anyway)
      const serializableData = { ...data };
      
      // Specifically remove file objects or un-serializable states
      if (serializableData.floatingImages) {
        serializableData.floatingImages = serializableData.floatingImages.map((img: any) => ({
          ...img,
          file: undefined // Cannot serialize File
        }));
      }
      if (serializableData.mobileBanner) {
        serializableData.mobileBanner = {
          ...serializableData.mobileBanner,
          file: undefined
        };
      }

      const payload = JSON.stringify({
        ...serializableData,
        lastSavedAt: Date.now()
      });
      localStorage.setItem(this.getKey(userId, productId), payload);
    } catch (error) {
      console.error('Failed to save draft to localStorage', error);
    }
  }

  static getDraft(userId: string, productId: string): DraftData | null {
    if (!userId || !productId) return null;
    try {
      const payload = localStorage.getItem(this.getKey(userId, productId));
      if (!payload) return null;
      return JSON.parse(payload);
    } catch (error) {
      console.error('Failed to parse draft from localStorage', error);
      return null;
    }
  }

  static clearDraft(userId: string, productId: string): void {
    if (!userId || !productId) return;
    try {
      localStorage.removeItem(this.getKey(userId, productId));
    } catch (error) {
      console.error('Failed to clear draft from localStorage', error);
    }
  }
}
