const headers = {
    'content-type': 'text/html'
};

const FILES_TO_CACHE = [
    '/',
    '/css/styles.css',
    '/favicon.ico',
    '/img/1.jpg',
    '/img/2.jpg',
    '/img/3.jpg',
    '/img/4.jpg',
    '/img/5.jpg',
    '/img/6.jpg',
    '/img/7.jpg',
    '/img/8.jpg',
    '/img/9.jpg',
    '/img/10.jpg',
    '/restaurant.html',
    '/index.html',
    '/js/restaurant_info.js',
    '/js/dbhelper.js',
    '/js/main.js',
    // '/js/bundle.js',
    '/node_modules/idb/lib/idb.js',
    // '/dist/js/idb.js',
    '/manifest.json'
];

const staticCacheName = 'restaurant-static-v246';

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