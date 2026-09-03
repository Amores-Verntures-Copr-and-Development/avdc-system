// Kill-switch service worker.
//
// A previous PWA build (@ducanh2912/next-pwa, before the app switched to
// `next build --turbopack`, which does not run next-pwa's webpack plugin)
// registered a service worker that is still active in some browsers. Because
// the app no longer ships a worker, `/sw.js` started returning 404, so that
// stale worker can never update itself and keeps intercepting requests - which
// corrupted multipart uploads (`request.formData()` ->
// "Failed to parse body as FormData") and could serve stale/injected content.
//
// This file exists only to take over from that stale worker and remove it:
// it unregisters itself and clears all caches. Once every client has picked it
// up, the origin has no active service worker.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      try {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
      } catch (e) {
        // ignore - clearing caches is best-effort
      }
      await self.registration.unregister();
      const clients = await self.clients.matchAll({ type: "window" });
      clients.forEach((client) => client.navigate(client.url));
    })(),
  );
});
