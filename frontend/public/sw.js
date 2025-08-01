const CACHE_NAME = 'restro-manage-v3'; // Increment version to trigger update
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json'
];

// Install event - cache resources and skip waiting for auto-update
self.addEventListener('install', event => {
  console.log('PWA: Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('PWA: Service worker cache opened');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        // Skip waiting to activate immediately for auto-update
        console.log('PWA: Service Worker installed, skipping waiting...');
        return self.skipWaiting();
      })
      .catch(error => {
        console.log('PWA: Cache failed:', error);
      })
  );
});

// Activate event - clean up old caches and claim clients for auto-update
self.addEventListener('activate', event => {
  console.log('PWA: Service Worker activating...');
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              console.log('PWA: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        // Claim all clients to apply update immediately
        console.log('PWA: Service Worker activated, claiming clients...');
        return self.clients.claim();
      })
      .then(() => {
        // Notify all clients that update is available
        return self.clients.matchAll();
      })
      .then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'SW_UPDATED',
            message: 'App has been updated to the latest version!'
          });
        });
      })
  );
});

// Fetch event - serve cached content when offline with smart caching strategy
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // For HTML documents, use network-first strategy to get updates
  if (event.request.destination === 'document') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Clone the response to cache it
          const responseClone = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseClone);
            });
          return response;
        })
        .catch(() => {
          // If network fails, serve from cache
          return caches.match(event.request)
            .then(response => response || caches.match('/'));
        })
    );
  }
  // For other resources, use cache-first strategy
  else {
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          if (response) {
            return response;
          }
          
          // If not in cache, fetch from network and cache it
          return fetch(event.request)
            .then(response => {
              // Check if we received a valid response
              if (!response || response.status !== 200 || response.type !== 'basic') {
                return response;
              }
              
              // Clone the response to cache it
              const responseClone = response.clone();
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseClone);
                });
              
              return response;
            });
        })
        .catch(() => {
          // If both cache and network fail, show offline page for documents
          if (event.request.destination === 'document') {
            return caches.match('/');
          }
        })
    );
  }
});

// Handle messages from the client
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('PWA: Received SKIP_WAITING message, activating new service worker...');
    self.skipWaiting();
  }
});

// Background sync for offline actions
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    console.log('PWA: Background sync triggered');
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // Handle offline actions when connection is restored
  console.log('PWA: Performing background sync...');
}

// Push notifications (optional for future use)
self.addEventListener('push', event => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icon-192x192.png',
      badge: '/icon-72x72.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: 1
      }
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});
