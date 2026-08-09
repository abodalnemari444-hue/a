const CACHE_NAME = 'shami-restaurant-v3';
const CORE_ASSETS = [
  '/css/style.css',
  '/js/common.js',
  '/js/auth.js',
  '/js/menu.js',
  '/js/kitchen.js',
  '/js/settings.js',
  '/manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)).catch(() => {})
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

// لا نتدخل مطلقاً في اتصالات socket.io أو طلبات API - يجب أن تبقى حية دائماً
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.pathname.startsWith('/socket.io/') || url.pathname.startsWith('/api/')) return;
  if (event.request.method !== 'GET') return;

  // صفحات HTML (index / menu / kitchen) محمية بجلسة تسجيل الدخول على السيرفر،
  // فلازم تروح للشبكة أولاً حتى تنضبط إعادة التوجيه بين تسجيل الدخول والصفحات المحمية.
  // الكاش يُستخدم فقط كخطة بديلة عند انقطاع الاتصال.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request)
        .then((resp) => {
          if (resp && resp.status === 200) {
            const clone = resp.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return resp;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
