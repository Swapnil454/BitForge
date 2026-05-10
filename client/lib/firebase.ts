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

  return navigator.serviceWorker.register(
    `/firebase-messaging-sw.js?${swParams.toString()}`
  );
};

export const getFirebasePushToken = async () => {
  const messaging = await getFirebaseMessaging();
  if (!messaging) return null;

  const registration = await registerMessagingServiceWorker();
  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
  if (!registration || !vapidKey) return null;

  return getToken(messaging, {
    vapidKey,
    serviceWorkerRegistration: registration,
  });
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
