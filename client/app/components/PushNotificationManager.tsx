"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { Bell, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import { usePathname, useRouter } from "next/navigation";
import { getCookie, getStoredUser } from "@/lib/cookies";
import { notificationAPI } from "@/lib/api";
import {
  getFirebasePushToken,
  isFirebaseMessagingAvailable,
  removeFirebasePushToken,
  subscribeToForegroundMessages,
} from "@/lib/firebase";

const DISMISS_KEY = "bitforge:push-prompt-dismissed-at";
const DEVICE_ID_KEY = "bitforge:push-device-id";
const TOKEN_KEY = "bitforge:push-token";
const PROMPT_COOLDOWN_MS = 3 * 24 * 60 * 60 * 1000;
const HEARTBEAT_MS = 60 * 1000;

const EXCLUDED_PATH_PREFIXES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
];

const isExpectedPushSetupError = (error: unknown) => {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return (
    error.name === "AbortError" ||
    message.includes("push service error") ||
    message.includes("registration failed") ||
    message.includes("subscription failed")
  );
};

const getDeviceId = () => {
  if (typeof window === "undefined") return "server";
  const existing = window.localStorage.getItem(DEVICE_ID_KEY);
  if (existing) return existing;

  const generated =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  window.localStorage.setItem(DEVICE_ID_KEY, generated);
  return generated;
};

const getBrowserName = () => {
  if (typeof navigator === "undefined") return "Unknown";
  const ua = navigator.userAgent;
  if (ua.includes("Edg")) return "Edge";
  if (ua.includes("Chrome")) return "Chrome";
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Safari")) return "Safari";
  return "Unknown";
};

export default function PushNotificationManager() {
  const router = useRouter();
  const pathname = usePathname();
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [showPrompt, setShowPrompt] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const user = getStoredUser<{ role?: string; name?: string }>();
  const token = getCookie("token");
  const isAuthenticated = Boolean(user && token);
  const shouldSkipPath = EXCLUDED_PATH_PREFIXES.some((prefix) => pathname?.startsWith(prefix));

  const syncPushToken = useCallback(async () => {
    if (!isAuthenticated || shouldSkipPath) return;

    try {
      setSyncing(true);
      const pushToken = await getFirebasePushToken();
      if (!pushToken) return false;

      await notificationAPI.registerPushToken({
        token: pushToken,
        deviceId: getDeviceId(),
        browserName: getBrowserName(),
        platform: "web",
      });

      window.localStorage.setItem(TOKEN_KEY, pushToken);
      return true;
    } catch (error) {
      if (!isExpectedPushSetupError(error)) {
        console.error("Failed to sync push token:", error);
      }
      return false;
    } finally {
      setSyncing(false);
    }
  }, [isAuthenticated, shouldSkipPath]);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      if (!isAuthenticated || shouldSkipPath || typeof window === "undefined") {
        if (mounted) setShowPrompt(false);
        return;
      }

      const supported = await isFirebaseMessagingAvailable();
      if (!mounted) return;

      setIsSupported(supported);
      setPermission(Notification.permission);

      if (!supported) return;

      if (Notification.permission === "granted") {
        await syncPushToken();
        return;
      }

      if (Notification.permission !== "default") {
        return;
      }

      const dismissedAt = Number(window.localStorage.getItem(DISMISS_KEY) || 0);
      if (Date.now() - dismissedAt > PROMPT_COOLDOWN_MS) {
        setShowPrompt(true);
      }
    };

    void init();

    return () => {
      mounted = false;
    };
  }, [isAuthenticated, shouldSkipPath, pathname, syncPushToken]);

  useEffect(() => {
    if (!isAuthenticated || shouldSkipPath) return;

    const sendHeartbeat = () => {
      notificationAPI.sendHeartbeat().catch((error) => {
        console.error("Notification heartbeat failed:", error);
      });
    };

    sendHeartbeat();
    const intervalId = window.setInterval(sendHeartbeat, HEARTBEAT_MS);

    const handleVisible = () => {
      if (document.visibilityState === "visible") {
        sendHeartbeat();
      }
    };

    window.addEventListener("focus", sendHeartbeat);
    document.addEventListener("visibilitychange", handleVisible);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", sendHeartbeat);
      document.removeEventListener("visibilitychange", handleVisible);
    };
  }, [isAuthenticated, shouldSkipPath]);

  useEffect(() => {
    if (!isAuthenticated || shouldSkipPath) return;

    let unsubscribe = () => {};
    void subscribeToForegroundMessages((payload) => {
      const actionUrl =
        payload.data?.actionUrl ||
        payload.fcmOptions?.link ||
        "/notifications";

      window.dispatchEvent(
        new CustomEvent("notification:new", {
          detail: payload.data || {},
        })
      );

      toast.custom(
        (toastInstance) => (
          <button
            onClick={() => {
              toast.dismiss(toastInstance.id);
              router.push(actionUrl);
            }}
            className="w-[min(24rem,calc(100vw-2rem))] rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-2xl transition hover:border-slate-300 dark:border-white/10 dark:bg-slate-950"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/5">
                <Image src="/icon.png" alt="BitForge" width={28} height={28} className="h-7 w-7 object-contain" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500 dark:text-white/45">
                  BitForge
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                  {payload.notification?.title || "New notification"}
                </p>
                <p className="mt-1 text-sm text-slate-600 dark:text-white/70">
                  {payload.notification?.body || "Open to view the latest update."}
                </p>
              </div>
            </div>
          </button>
        ),
        {
          duration: 6000,
        }
      );
    }).then((dispose) => {
      unsubscribe = dispose;
    });

    return () => unsubscribe();
  }, [isAuthenticated, shouldSkipPath, router]);

  useEffect(() => {
    if (permission !== "denied" || typeof window === "undefined") return;

    const previousToken = window.localStorage.getItem(TOKEN_KEY);
    if (!previousToken) return;

    void notificationAPI.unregisterPushToken(previousToken).catch((error) => {
      console.error("Failed to unregister push token:", error);
    });
    void removeFirebasePushToken().catch((error) => {
      console.error("Failed to clear firebase push token:", error);
    });
    window.localStorage.removeItem(TOKEN_KEY);
  }, [permission]);

  if (!isAuthenticated || shouldSkipPath || !isSupported || permission === "granted") {
    return null;
  }

  return showPrompt ? (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[9998] w-[min(24rem,calc(100vw-2rem))]">
      <div className="pointer-events-auto rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-2xl backdrop-blur dark:border-white/10 dark:bg-slate-950/90">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-slate-900">
            <Bell className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                Enable BitForge notifications
              </p>
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
            </div>
            <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-white/70">
              Get purchase updates, dispute decisions, payment alerts, and chat messages when you are away.
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={async () => {
              try {
                const nextPermission = await Notification.requestPermission();
                setPermission(nextPermission);
                setShowPrompt(false);

                if (nextPermission === "granted") {
                  const synced = await syncPushToken();
                  if (synced) {
                    toast.success("Browser notifications enabled");
                  } else {
                    toast("Notifications permission was granted, but push setup is still unavailable. Please try again in a moment.");
                  }
                } else {
                  window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
                }
              } catch (error) {
                if (!isExpectedPushSetupError(error)) {
                  console.error("Notification permission request failed:", error);
                }
              }
            }}
            disabled={syncing}
            className="inline-flex flex-1 items-center justify-center rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
          >
            {syncing ? "Enabling..." : "Enable"}
          </button>
          <button
            onClick={() => {
              window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
              setShowPrompt(false);
            }}
            className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:border-white/10 dark:text-white/70 dark:hover:bg-white/5"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  ) : null;
}
