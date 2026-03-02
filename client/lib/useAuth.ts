"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getCookie, getStoredUser } from "./cookies";

export interface AuthState {
  isAuthenticated: boolean;
  user: any | null;
  token: string | null;
}

export interface UseAuthReturn {
  /** Current auth state */
  auth: AuthState;
  /** Check if user is authenticated */
  isAuthenticated: boolean;
  /** Get current user */
  user: any | null;
  /** Whether auth modal is shown */
  showAuthModal: boolean;
  /** Action being performed (for modal context) */
  pendingAction: string | null;
  /** 
   * Execute an action that requires auth.
   * Shows modal if not authenticated, otherwise runs the callback.
   * @param action - Description of action (e.g., "add to cart", "buy")
   * @param callback - Function to run if authenticated
   */
  requireAuth: (action: string, callback: () => void | Promise<void>) => void;
  /** Close the auth modal */
  closeAuthModal: () => void;
  /** Navigate to login */
  goToLogin: (returnUrl?: string) => void;
  /** Navigate to register */
  goToRegister: (returnUrl?: string) => void;
}

/**
 * Hook for handling authentication requirements on user actions.
 * Returns auth state and methods to gate actions behind authentication.
 * 
 * @example
 * ```tsx
 * const { requireAuth, AuthModalComponent } = useAuth();
 * 
 * const handleAddToCart = (productId: string) => {
 *   requireAuth("add to cart", async () => {
 *     await cartAPI.addToCart(productId, 1);
 *     toast.success("Added to cart!");
 *   });
 * };
 * ```
 */
export function useAuth(): UseAuthReturn {
  const router = useRouter();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  // Get current auth state
  const getAuthState = useCallback((): AuthState => {
    if (typeof window === "undefined") {
      return { isAuthenticated: false, user: null, token: null };
    }
    const token = getCookie("token");
    const user = getStoredUser();
    return {
      isAuthenticated: !!token,
      user,
      token,
    };
  }, []);

  const auth = getAuthState();

  const requireAuth = useCallback(
    (action: string, callback: () => void | Promise<void>) => {
      const { isAuthenticated } = getAuthState();

      if (isAuthenticated) {
        // User is authenticated, run the callback
        callback();
      } else {
        // Show auth modal
        setPendingAction(action);
        setShowAuthModal(true);
      }
    },
    [getAuthState]
  );

  const closeAuthModal = useCallback(() => {
    setShowAuthModal(false);
    setPendingAction(null);
  }, []);

  const goToLogin = useCallback(
    (returnUrl?: string) => {
      closeAuthModal();
      const currentPath = typeof window !== "undefined" ? window.location.pathname : "";
      const next = returnUrl || currentPath;
      router.push(`/login?next=${encodeURIComponent(next)}`);
    },
    [router, closeAuthModal]
  );

  const goToRegister = useCallback(
    (returnUrl?: string) => {
      closeAuthModal();
      const currentPath = typeof window !== "undefined" ? window.location.pathname : "";
      const next = returnUrl || currentPath;
      router.push(`/register?next=${encodeURIComponent(next)}`);
    },
    [router, closeAuthModal]
  );

  return {
    auth,
    isAuthenticated: auth.isAuthenticated,
    user: auth.user,
    showAuthModal,
    pendingAction,
    requireAuth,
    closeAuthModal,
    goToLogin,
    goToRegister,
  };
}

export default useAuth;
