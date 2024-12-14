const CACHE_NAME = 'golf-yardage-v2';
const STATIC_CACHE = 'static-v2';
const DYNAMIC_CACHE = 'dynamic-v2';
const API_CACHE = 'api-v2';

const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/weather.html',
    '/wind.html',
    '/styles.css',
    '/script.js',
    '/src/calculations/wind-calculations.js',
    '/src/calculations/altitude-calculations.js',
    '/src/calculations/air-density-calculations.js',
    '/src/managers/calculation-manager.js',
    '/src/managers/ui-manager.js',
    '/src/utils/validation.js',
    '/src/utils/error-handling.js',
    '/src/workers/calculations-worker.js',
    '/constants/club-data.js',
    '/icons/icon-72x72.png',
    '/icons/icon-96x96.png',
    '/icons/icon-128x128.png',
    '/icons/icon-144x144.png',
    '/icons/icon-152x152.png',
    '/icons/icon-192x192.png',
    '/icons/icon-384x384.png',
    '/icons/icon-512x512.png',
    'https://cdn.tailwindcss.com',
    'https://cdn.jsdelivr.net/npm/chart.js'
];

// Cache static assets during installation
self.addEventListener('install', event => {
    event.waitUntil(
        Promise.all([
            // Cache static assets
            caches.open(STATIC_CACHE).then(cache => {
                console.log('Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            }),
            // Create other caches
            caches.open(DYNAMIC_CACHE),
            caches.open(API_CACHE)
        ])
        .then(() => self.skipWaiting())
        .catch(error => {
            console.error('Service worker installation failed:', error);
        })
    );
});

// Clean up old caches during activation
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames
                        .filter(name => {
                            return name !== STATIC_CACHE && 
                                   name !== DYNAMIC_CACHE && 
                                   name !== API_CACHE;
                        })
                        .map(name => {
                            console.log('Deleting old cache:', name);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => {
                console.log('Service Worker activated');
                return self.clients.claim();
            })
            .catch(error => {
                console.error('Service worker activation failed:', error);
            })
    );
});

// Handle fetch requests with improved caching strategy
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);

    // Handle API requests
    if (request.url.includes('/api/')) {
        event.respondWith(handleApiRequest(request));
        return;
    }

    // Handle static assets
    if (STATIC_ASSETS.includes(url.pathname)) {
        event.respondWith(handleStaticAsset(request));
        return;
    }

    // Handle dynamic content
    event.respondWith(handleDynamicContent(request));
});

// Handle API requests with network-first strategy
async function handleApiRequest(request) {
    try {
        // Try network first
        const response = await fetch(request);
        const cache = await caches.open(API_CACHE);
        cache.put(request, response.clone());
        return response;
    } catch (error) {
        // If offline, try cache
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Return offline fallback for API
        return new Response(
            JSON.stringify({
                error: 'You are offline',
                cached: false,
                timestamp: new Date().toISOString()
            }),
            {
                status: 503,
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-store'
                }
            }
        );
    }
}

// Handle static assets with cache-first strategy
async function handleStaticAsset(request) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
        return cachedResponse;
    }
    
    try {
        const response = await fetch(request);
        const cache = await caches.open(STATIC_CACHE);
        cache.put(request, response.clone());
        return response;
    } catch (error) {
        console.error('Error fetching static asset:', error);
        return new Response('Static asset not available offline', { status: 404 });
    }
}

// Handle dynamic content with network-first strategy
async function handleDynamicContent(request) {
    try {
        const response = await fetch(request);
        const cache = await caches.open(DYNAMIC_CACHE);
        cache.put(request, response.clone());
        return response;
    } catch (error) {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        console.error('Error fetching dynamic content:', error);
        return new Response('Content not available offline', { status: 404 });
    }
}

// Handle errors
self.addEventListener('error', event => {
    console.error('Service Worker error:', event.error);
});

// Handle unhandled promise rejections
self.addEventListener('unhandledrejection', event => {
    console.error('Unhandled promise rejection:', event.reason);
});

// Periodic cache cleanup
setInterval(() => {
    Promise.all([
        cleanupCache(DYNAMIC_CACHE, 50), // Keep last 50 dynamic entries
        cleanupCache(API_CACHE, 20)      // Keep last 20 API responses
    ]).catch(error => {
        console.error('Cache cleanup failed:', error);
    });
}, 24 * 60 * 60 * 1000); // Run daily

async function cleanupCache(cacheName, maxItems) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    if (keys.length > maxItems) {
        for (let i = 0; i < keys.length - maxItems; i++) {
            await cache.delete(keys[i]);
        }
    }
}
