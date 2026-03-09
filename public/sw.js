// ============================================================
// Service Worker — Antigravity Medical PWA
// Cache statique + stratégie network-first pour l'API
// ============================================================

const CACHE_NAME = "antigravity-v1";
const STATIC_ASSETS = [
  "/",
  "/dashboard",
  "/manifest.json",
];

// Installation : pré-cache des assets statiques
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activation : nettoyage des anciens caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch : network-first pour API/pages, cache-first pour assets statiques
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorer les requêtes non-GET et les URLs externes
  if (request.method !== "GET" || !url.origin.includes(self.location.origin)) return;

  // Network-first pour les routes API et les pages dynamiques
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/dashboard")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Mettre en cache une copie fraîche
          const clone = response.clone();
          if (response.ok && !url.pathname.startsWith("/api/")) {
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Cache-first pour les assets statiques (_next/static, images, fonts)
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      });
    })
  );
});

// Notifications Push
self.addEventListener("push", (event) => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title ?? "Antigravity Medical", {
      body: data.body ?? "",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: data.tag ?? "notification",
      data: { url: data.url ?? "/dashboard" },
    })
  );
});

// Clic sur une notification
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/dashboard";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      const client = windowClients.find((c) => c.url.includes(url));
      if (client) return client.focus();
      return clients.openWindow(url);
    })
  );
});
