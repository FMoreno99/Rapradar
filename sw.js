const CACHE_NAME = 'rapradar-v1';
const urlsToCache = [
    './',
    './index.html',
    './style.css',
    './app.js',
    './icons/icon-192.png',
    './icons/icon-512.png',
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Instalación: guarda los archivos esenciales en la Cache
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Cache abierta con éxito');
                return cache.addAll(urlsToCache);
            })
    );
});

// Intercepción: intenta acceder a la cache primero (Offline)
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Si el archivo está en la cache, lo retorna. Si no, va a buscarlo a internet.
                return response || fetch(event.request);
            })
    );
});

// Activación: limpia caches antiguas si actualizás la app
self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});