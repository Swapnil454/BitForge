/* eslint-disable no-undef */
importScripts("https://www.gstatic.com/firebasejs/12.13.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.13.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyBeSU2Ey8VTeKw9__ia2M8IEGUli38NvCg",
  authDomain: "bitforge-102e9.firebaseapp.com",
  projectId: "bitforge-102e9",
  storageBucket: "bitforge-102e9.firebasestorage.app",
  messagingSenderId: "258171132847",
  appId: "1:258171132847:web:a86481431f03634033ad5a",
  measurementId: "G-H25K3L3JNZ",
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
