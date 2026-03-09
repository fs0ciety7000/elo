// ============================================================
// Service Worker — Antigravity Medical PWA
// v3 — Stratégie corrigée pour éviter les ChunkLoadError
// après un déploiement (stale chunks)
// ============================================================

// Bump ce numéro à chaque déploiement pour vider le cache précédent
const CACHE_VERSION = "antigravity-v3";

// Installation : skip waiting pour activer immédiatement
self.addEventListener("install", () => {
  self.skipWaiting();
});

// Activation : supprimer TOUS les anciens caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_VERSION)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorer les requêtes non-GET et les URLs cross-origin
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  // ── API : network-only (jamais de cache) ─────────────────
  if (url.pathname.startsWith("/api/")) {
    return; // laisser le navigateur gérer
  }

  // ── _next/static : cache-first (content-hashed, immutables)
  // Ces fichiers ont le hash dans le nom → safe à cacher indéfiniment
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.open(CACHE_VERSION).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const response = await fetch(request);
        if (response.ok) cache.put(request, response.clone());
        return response;
      })
    );
    return;
  }

  // ── Pages HTML + dashboard : network-first ────────────────
  // Toujours récupérer la page fraîche pour avoir les bons chunk-hashes
  // Fallback sur le cache uniquement si hors-ligne
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Ne pas mettre en cache les pages HTML pour éviter les stale chunks
        return response;
      })
      .catch(() => caches.match(request))
  );
});

// ── Notifications Push ────────────────────────────────────
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
