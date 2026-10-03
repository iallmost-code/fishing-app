// Network first so the app is never stuck on an old version; the cache is
// only a fallback for opening the app with no signal.
const CACHE = "wtf-v1";
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) =>
  event.waitUntil(self.clients.claim()),
);
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  // Only this site's own files; weather, maps and water data go straight out.
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(() =>
        caches
          .match(request)
          .then(
            (hit) =>
              hit ??
              (request.mode === "navigate"
                ? caches.match("./")
                : Response.error()),
          ),
      ),
  );
});
