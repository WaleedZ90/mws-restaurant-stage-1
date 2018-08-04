const headers = {
    'content-type': 'text/html'
};

const FILES_TO_CACHE = [
    '/',
    '/css/styles.css',
    '/favicon.ico',
    '/img/1.webp',
    '/img/2.webp',
    '/img/3.webp',
    '/img/4.webp',
    '/img/5.webp',
    '/img/6.webp',
    '/img/7.webp',
    '/img/8.webp',
    '/img/9.webp',
    '/img/10.webp',
    '/restaurant.html',
    '/index.html',
    '/js/restaurant_info.js',
    '/js/dbhelper.js',
    '/js/main.js',
    // '.dist/js/idb.js',
    // '.dist/js/indexBundle.js',
    // '.dist/js/detailsBundle.js',
    '/node_modules/idb/lib/idb.js',
    '/node_modules/lazyload/lazyload.js',
    '/manifest.json'
];

const staticCacheName = 'restaurant-static-v9';

self.addEventListener('install', function (event) {
    event.waitUntil(
        caches.open(staticCacheName).then(function (cache) {
            return cache.addAll(FILES_TO_CACHE)
        })
        .then(() => {
            console.log('Content cached!')
        })
        .catch(() => {
            console.log('Content not cached!')
        })
    );
});

self.addEventListener('activate', function (event) {
    event.waitUntil(
        caches.keys().then(function (cacheNames) {
            return Promise.all(
                cacheNames.filter(function (cacheName) {
                    return cacheName.startsWith('restaurnt-') && cacheName !== staticCacheName;
                }).map(function (cacheName) {
                    return cache.delete(cacheName);
                })
            );
        })
    );
})

self.addEventListener('fetch', function (event) {
    const url = new URL(event.request.url);
    if (url.pathname.startsWith('/restaurant.html')) {
        event.respondWith(
            caches.match('restaurant.html')
            .then(response => {
                return response || fetch(event.request);
            })
        );
    }

    event.respondWith(
        caches.match(event.request).then(function (response) {
            return response || fetch(event.request);
        })
    );
});