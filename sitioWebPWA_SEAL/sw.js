// Service worker de Módulo Estudio.
// Al cambiar cualquier archivo del sitio, sube la versión (v1 -> v2) para que se actualice la caché.
const CACHE = 'modulo-estudio-v1';

// Rutas relativas: funcionan en localhost y también en GitHub Pages dentro de un subdirectorio.
const ARCHIVOS = [
  './',
  'index.html',
  'catalogo.html',
  'producto.html',
  'carrito.html',
  'contacto.html',
  '404.html',
  'offline.html',
  'manifest.json',
  'css/variables.css',
  'css/base.css',
  'css/components.css',
  'css/pages.css',
  'js/main.js',
  'js/inicio.js',
  'js/catalogo.js',
  'js/producto.js',
  'js/carrito.js',
  'js/contacto.js',
  'data/productos.json',
  'img/p1.svg', 'img/p2.svg', 'img/p3.svg', 'img/p4.svg',
  'img/p5.svg', 'img/p6.svg', 'img/p7.svg', 'img/p8.svg',
  'icons/icon-192.png',
  'icons/icon-512.png'
];

// Instalación: guarda los archivos en caché
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARCHIVOS)));
  self.skipWaiting();
});

// Activación: borra cachés antiguas
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Peticiones: caché primero; si no hay, red (y se guarda); si falla todo, página offline
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  e.respondWith(
    // ignoreSearch permite que producto.html?id=p3 use la copia de producto.html
    caches.match(req, { ignoreSearch: true }).then(cached => {
      if (cached) return cached;
      return fetch(req)
        .then(res => {
          // Guarda también las tipografías de Google Fonts y otros recursos visitados
          if (res && (res.ok || res.type === 'opaque')) {
            const copia = res.clone();
            caches.open(CACHE).then(c => c.put(req, copia));
          }
          return res;
        })
        .catch(() => (req.mode === 'navigate' ? caches.match('offline.html') : undefined));
    })
  );
});
