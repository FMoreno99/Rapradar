const CACHE_NAME = 'rapradar-v1';
const urlsToCache = [
    './',
    './index.html',
    './style.css',
    './app.js',
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Instalação: Guarda os ficheiros essenciais na Cache
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Cache aberta com sucesso');
                return cache.addAll(urlsToCache);
            })
    );
});

// Interceção: Tenta aceder à cache primeiro (Offline)
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Se o ficheiro estiver na cache, retorna-o. Caso contrário, vai buscá-lo à internet.
                return response || fetch(event.request);
            })
    );
});

// Ativação: Limpa caches antigas se atualizares a aplicação
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