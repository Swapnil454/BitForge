import { getApps, initializeApp } from "firebase/app";
import {
  deleteToken,
  getMessaging,
  getToken,
  isSupported,
  MessagePayload,
  onMessage,
} from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID!,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

const isExpectedPushServiceError = (error: unknown) => {
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

const waitForServiceWorkerActivation = async (
  registration: ServiceWorkerRegistration,
  timeoutMs = 10000
) => {
  if (registration.active) {
    return registration;
  }

  const activatingWorker =
    registration.installing || registration.waiting || registration.active;

  if (!activatingWorker) {
    throw new Error("Messaging service worker did not start installing.");
  }

  await new Promise<void>((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      reject(new Error("Messaging service worker activation timed out."));
    }, timeoutMs);

    const finish = () => {
      window.clearTimeout(timeoutId);
      resolve();
    };

    if (registration.active || activatingWorker.state === "activated") {
      finish();
      return;
    }

    const handleStateChange = () => {
      if (registration.active || activatingWorker.state === "activated") {
        activatingWorker.removeEventListener("statechange", handleStateChange);
        finish();
      }
    };

    activatingWorker.addEventListener("statechange", handleStateChange);
  });

  return registration;
};

export const isFirebaseMessagingAvailable = async () => {
  if (typeof window === "undefined") return false;
  return isSupported();
};

export const getFirebaseMessaging = async () => {
  if (!(await isFirebaseMessagingAvailable())) {
    return null;
  }

  return getMessaging(app);
};

export const registerMessagingServiceWorker = async () => {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }

  // Inject Firebase config as query params so the service worker can read them
  // via new URL(self.location.href).searchParams — avoids hardcoding in static file.
  const swParams = new URLSearchParams({
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID!,
  });

  const registration = await navigator.serviceWorker.register(
    `/firebase-messaging-sw.js?${swParams.toString()}`
  );

  await waitForServiceWorkerActivation(registration);
  return navigator.serviceWorker.ready;
};

export const getFirebasePushToken = async () => {
  const messaging = await getFirebaseMessaging();
  if (!messaging) return null;

  let registration: ServiceWorkerRegistration | null = null;

  try {
    registration = await registerMessagingServiceWorker();
  } catch (error) {
    console.error("Failed to activate messaging service worker:", error);
    return null;
  }

  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
  if (!registration || !vapidKey) return null;

  try {
    return await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration,
    });
  } catch (error) {
    if (isExpectedPushServiceError(error)) {
      console.warn("Push subscription is temporarily unavailable:", error);
      return null;
    }

    throw error;
  }
};

export const removeFirebasePushToken = async () => {
  const messaging = await getFirebaseMessaging();
  if (!messaging) return;
  await deleteToken(messaging);
};

export const subscribeToForegroundMessages = async (
  callback: (payload: MessagePayload) => void
) => {
  const messaging = await getFirebaseMessaging();
  if (!messaging) return () => {};
  return onMessage(messaging, callback);
};

export default app;
