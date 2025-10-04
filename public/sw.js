const CACHE_NAME = 'malta-stock-v1';
const STATIC_CACHE = 'malta-static-v1';
const DYNAMIC_CACHE = 'malta-dynamic-v1';

// Assets para cache estático
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/malta-logo.webp',
  '/favicon.ico',
  '/favicon.svg',
  '/placeholder.svg'
];

// Instalar Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('Service Worker: Static assets cached');
        return self.skipWaiting();
      })
  );
});

// Ativar Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker: Activated');
      return self.clients.claim();
    })
  );
});

// Interceptar requisições
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar requisições para APIs externas e Supabase
  if (url.origin !== location.origin || 
      url.pathname.includes('/api/') ||
      url.hostname.includes('supabase')) {
    return;
  }

  // Cache First para assets estáticos
  if (request.destination === 'image' || 
      request.destination === 'style' || 
      request.destination === 'script' ||
      request.url.includes('.webp') ||
      request.url.includes('.png') ||
      request.url.includes('.svg') ||
      request.url.includes('.ico')) {
    
    event.respondWith(
      caches.match(request)
        .then((response) => {
          if (response) {
            return response;
          }
          return fetch(request).then((fetchResponse) => {
            const responseClone = fetchResponse.clone();
            caches.open(STATIC_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
            return fetchResponse;
          });
        })
        .catch(() => {
          // Fallback para imagens
          if (request.destination === 'image') {
            return caches.match('/placeholder.svg');
          }
        })
    );
    return;
  }

  // Network First para HTML e navegação
  if (request.mode === 'navigate' || 
      request.destination === 'document' ||
      request.headers.get('accept').includes('text/html')) {
    
    event.respondWith(
      fetch(request)
        .then((response) => {
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => {
          return caches.match(request).then((response) => {
            return response || caches.match('/index.html');
          });
        })
    );
    return;
  }

  // Stale While Revalidate para outros recursos
  event.respondWith(
    caches.match(request)
      .then((response) => {
        const fetchPromise = fetch(request).then((fetchResponse) => {
          const responseClone = fetchResponse.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
          return fetchResponse;
        });

        return response || fetchPromise;
      })
  );
});

// Limpar cache antigo periodicamente
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      event.ports[0].postMessage({ success: true });
    });
  }
});