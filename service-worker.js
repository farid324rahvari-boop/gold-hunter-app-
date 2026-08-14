// Gold Hunter — Service Worker
// نقش: Offline Shell + کش کردن فایل‌های استاتیک برای اجرای PWA
// این Service Worker هرگز داده‌های بازار (قیمت/تحلیل) را کش نمی‌کند؛
// درخواست‌های /api/* همیشه از شبکه خوانده می‌شوند تا داده قدیمی به‌جای Live نمایش داده نشود.

const CACHE_NAME = 'gold-hunter-shell-v1';
const SHELL_FILES = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // هرگز داده API (قیمت/تحلیل/تقویم) را کش یا از کش سرو نکن — همیشه شبکه
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request).catch(
        () => new Response(JSON.stringify({ status: 'UNAVAILABLE', error: 'network-offline' }), {
          headers: { 'Content-Type': 'application/json' }
        })
      )
    );
    return;
  }

  // Shell استاتیک: Cache First با بازگشت به شبکه
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request).catch(() => cached))
  );
});
