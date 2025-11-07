// public/sw.js - Service Worker para ElGuanteWeb PWA

const CACHE_NAME = 'elguanteweb-v1.0.0';
const STATIC_CACHE = 'elguanteweb-static-v1.0.0';
const DYNAMIC_CACHE = 'elguanteweb-dynamic-v1.0.0';
const API_CACHE = 'elguanteweb-api-v1.0.0';

// Recursos a cachear inicialmente
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/src/main.jsx',
  '/src/App.jsx',
  '/src/firebase.js'
];

// APIs a cachear
const API_ENDPOINTS = [
  '/api/products',
  '/api/categories',
  '/api/user/profile'
];

// Función para determinar si una URL es de API
const isApiRequest = (url) => {
  return API_ENDPOINTS.some(endpoint => url.includes(endpoint));
};

// Función para determinar si una URL es de imagen
const isImageRequest = (url) => {
  return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url);
};

// Función para determinar si una URL es de Firebase Storage
const isFirebaseStorageRequest = (url) => {
  return url.includes('firebasestorage.googleapis.com');
};

// Instalar Service Worker
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker instalándose...');

  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('📦 Cacheando recursos estáticos...');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('✅ Service Worker instalado correctamente');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ Error instalando Service Worker:', error);
      })
  );
});

// Activar Service Worker
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker activándose...');

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Eliminar caches antiguos
            if (cacheName !== STATIC_CACHE &&
                cacheName !== DYNAMIC_CACHE &&
                cacheName !== API_CACHE) {
              console.log('🗑️ Eliminando cache antiguo:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ Service Worker activado correctamente');
        return self.clients.claim();
      })
  );
});

// Estrategia de cache: Cache First para recursos estáticos
const cacheFirst = async (request) => {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.error('Error en estrategia Cache First:', error);
    throw error;
  }
};

// Estrategia de cache: Network First para APIs
const networkFirst = async (request) => {
  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(API_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log('🌐 Red no disponible, intentando cache...');

    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Si no hay cache, devolver respuesta de fallback
    return new Response(
      JSON.stringify({
        error: 'Sin conexión',
        message: 'No se pudo conectar al servidor y no hay datos en cache',
        offline: true
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

// Estrategia de cache: Stale While Revalidate para imágenes
const staleWhileRevalidate = async (request) => {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cachedResponse = await cache.match(request);

  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  });

  // Retornar cache si existe, sino esperar respuesta de red
  return cachedResponse || fetchPromise;
};

// Interceptar requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar requests no-GET
  if (request.method !== 'GET') {
    return;
  }

  // Ignorar requests de Chrome extension
  if (url.protocol === 'chrome-extension:') {
    return;
  }

  // Estrategia según tipo de request
  if (isApiRequest(request.url)) {
    // APIs: Network First
    event.respondWith(networkFirst(request));
  } else if (isImageRequest(request.url) || isFirebaseStorageRequest(request.url)) {
    // Imágenes: Stale While Revalidate
    event.respondWith(staleWhileRevalidate(request));
  } else if (STATIC_ASSETS.some(asset => request.url.includes(asset))) {
    // Recursos estáticos: Cache First
    event.respondWith(cacheFirst(request));
  } else {
    // Otros recursos: Network First con fallback a cache
    event.respondWith(
      networkFirst(request).catch(() => cacheFirst(request))
    );
  }
});

// Manejar mensajes del cliente
self.addEventListener('message', (event) => {
  const { type, data } = event.data;

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;

    case 'GET_CACHE_INFO':
      caches.keys().then((cacheNames) => {
        event.ports[0].postMessage({
          cacheNames,
          timestamp: Date.now()
        });
      });
      break;

    case 'CLEAR_CACHE':
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      }).then(() => {
        event.ports[0].postMessage({ success: true });
      }).catch((error) => {
        event.ports[0].postMessage({ error: error.message });
      });
      break;

    default:
      // Silenciar mensajes no reconocidos para evitar spam en consola
      // console.log('Mensaje no reconocido:', type);
  }
});

// Manejar notificaciones push (futuro)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();

    const options = {
      body: data.body,
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      vibrate: [100, 50, 100],
      data: data.data
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Manejar clicks en notificaciones
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.openWindow(event.notification.data?.url || '/')
  );
});

// Background sync para operaciones offline (futuro)
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // Implementar sincronización en background
  console.log('🔄 Ejecutando sincronización en background...');
}

// Periodic background sync (futuro)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'periodic-sync') {
    event.waitUntil(doPeriodicSync());
  }
});

async function doPeriodicSync() {
  // Implementar sincronización periódica
  console.log('🔄 Ejecutando sincronización periódica...');
}

console.log('🎯 Service Worker de ElGuanteWeb cargado');
