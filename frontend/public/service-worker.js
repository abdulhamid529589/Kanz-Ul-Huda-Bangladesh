const CACHE_NAME = 'kanz-ul-huda-v1'
const ASSETS_TO_CACHE = ['/', '/index.html', '/manifest.json']

// Cache strategies
const CACHE_FIRST_PATHS = ['/assets/', '/favicon.ico']

const NETWORK_FIRST_PATHS = ['/api/']

// Install event - cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Service Worker: Caching assets')
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.error('Service Worker: Cache error', err)
      })
    }),
  )
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache', cacheName)
            return caches.delete(cacheName)
          }
        }),
      )
    }),
  )
  self.clients.claim()
})

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // Skip chrome extensions
  if (url.protocol === 'chrome-extension:') {
    return
  }

  // Cache-first strategy for static assets
  if (CACHE_FIRST_PATHS.some((path) => url.pathname.includes(path))) {
    event.respondWith(
      caches
        .match(request)
        .then((response) => {
          if (response) {
            return response
          }
          return fetch(request).then((response) => {
            if (response && response.status === 200) {
              const clonedResponse = response.clone()
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, clonedResponse)
              })
            }
            return response
          })
        })
        .catch(() => {
          return new Response('Offline - Asset not available', {
            status: 503,
            statusText: 'Service Unavailable',
          })
        }),
    )
    return
  }

  // Network-first strategy for API calls
  if (NETWORK_FIRST_PATHS.some((path) => url.pathname.includes(path))) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clonedResponse = response.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, clonedResponse)
            })
          }
          return response
        })
        .catch(() => {
          return caches.match(request).then((response) => {
            if (response) {
              return response
            }
            return new Response(
              JSON.stringify({
                error: 'You are offline. Some data may be outdated.',
                offline: true,
              }),
              {
                status: 503,
                headers: { 'Content-Type': 'application/json' },
              },
            )
          })
        }),
    )
    return
  }

  // Default: network-first
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.status === 200) {
          const clonedResponse = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, clonedResponse)
          })
        }
        return response
      })
      .catch(() => {
        return caches.match(request).then((response) => {
          if (response) {
            return response
          }
          return new Response('Offline - Resource not available', {
            status: 503,
            statusText: 'Service Unavailable',
          })
        })
      }),
  )
})

// Handle messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.delete(CACHE_NAME).then(() => {
      console.log('Service Worker: Cache cleared')
    })
  }
})
