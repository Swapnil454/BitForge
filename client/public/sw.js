/* eslint-disable no-undef */
importScripts("https://www.gstatic.com/firebasejs/12.13.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.13.0/firebase-messaging-compat.js");

try {
  firebase.initializeApp({
    apiKey: "AIzaSyBeSU2Ey8VTeKw9__ia2M8IEGUli38NvCg",
    authDomain: "bitforge-102e9.firebaseapp.com",
    projectId: "bitforge-102e9",
    storageBucket: "bitforge-102e9.firebasestorage.app",
    messagingSenderId: "258171132847",
    appId: "1:258171132847:web:a86481431f03634033ad5a",
    measurementId: "G-H25K3L3JNZ"
  });

  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    const data = payload?.data || {};
    const title = payload?.notification?.title || data.title || "BitForge";
    const body = payload?.notification?.body || data.body || "You have a new notification.";
    const actionUrl = data.actionUrl || "/";

    self.registration.showNotification(title, {
      body,
      icon: "/icon.png",
      badge: "/icon.png",
      data: {
        actionUrl,
      },
    });
  });

  self.addEventListener("notificationclick", (event) => {
    event.notification.close();

    const actionUrl = event.notification?.data?.actionUrl || "/";
    const destination = new URL(actionUrl, self.location.origin).href;

    event.waitUntil(
      clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
        for (const client of windowClients) {
          if ("focus" in client) {
            client.navigate(destination);
            return client.focus();
          }
        }

        if (clients.openWindow) {
          return clients.openWindow(destination);
        }

        return undefined;
      })
    );
  });
} catch (error) {
  console.error("Firebase Messaging SW init failed:", error);
}

const CACHE_NAME = "bitforge-pwa-v6";

const STATIC_ASSETS = [
  "/",
  "/offline.html",
  "/manifest.json",
  "/Android_Icon/mipmap-xxxhdpi/ic_launcher.png",
  "/Android_Icon/bitforge_fullname_icon_512.png",
  "/network_light.png",
  "/network_dark.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );

  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      );
    })
  );

  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  if (
    url.pathname.startsWith("/api") ||
    url.pathname.startsWith("/checkout") ||
    url.pathname.startsWith("/payment") ||
    url.pathname.startsWith("/dashboard") ||
    url.pathname.startsWith("/seller") ||
    url.pathname.startsWith("/admin") ||
    url.pathname.startsWith("/download")
  ) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        return caches.match("/offline.html") || Response.error();
      })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      return (
        cachedResponse ||
        fetch(request).then((networkResponse) => {
          return networkResponse;
        })
      );
    })
  );
});
