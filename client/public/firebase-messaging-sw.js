/* eslint-disable no-undef */
importScripts("https://www.gstatic.com/firebasejs/12.13.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.13.0/firebase-messaging-compat.js");

// Service workers cannot access process.env or Next.js env vars directly.
// The app injects the Firebase config via URL query parameters at registration time.
// See: app/lib/firebase.ts or wherever navigator.serviceWorker.register() is called.
const params = new URL(self.location.href).searchParams;

firebase.initializeApp({
  apiKey: params.get("apiKey"),
  authDomain: params.get("authDomain"),
  projectId: params.get("projectId"),
  storageBucket: params.get("storageBucket"),
  messagingSenderId: params.get("messagingSenderId"),
  appId: params.get("appId"),
  measurementId: params.get("measurementId"),
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
