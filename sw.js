/**
 * Service Worker pour Générateur de CV - PWA
 * Gère le cache et le fonctionnement hors ligne
 */

// Nom du cache avec version pour faciliter les mises à jour
const CACHE_NAME = 'generateur-cv-v1';

// Liste des fichiers à mettre en cache lors de l'installation
const FILES_TO_CACHE = [
  './',
  'index.html',
  'style.css',
  'script.js',
  'manifest.json',
  'logo.cv.png',
  'icons/icon-192x192.svg',
  'icons/icon-512x512.svg',
  'icons/icon-192x192.png',
  'icons/icon-512x512.png'
];

/**
 * Installation du service worker
 * Met en cache les fichiers statiques essentiels
 */
self.addEventListener('install', (event) => {
  console.log('[SW] Installation du service worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Mise en cache des fichiers');
        return cache.addAll(FILES_TO_CACHE);
      })
      .then(() => {
        console.log('[SW] Installation terminée, activation...');
        // Prendre le contrôle immédiatement sans attendre
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Erreur lors de la mise en cache:', error);
      })
  );
});

/**
 * Activation du service worker
 * Nettoie les anciens caches
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activation du service worker...');
  
  event.waitUntil(
    // Supprimer les anciens caches
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        );
      })
      .then(() => {
        console.log('[SW] Activation terminée');
        // Prendre le contrôle de toutes les pages
        return self.clients.claim();
      })
  );
});

/**
 * Interception des requêtes réseau
 * Stratégie: Cache First, puis Network (pour les fichiers statiques)
 *            Network First (pour le reste)
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Ne pas intercepter les requêtes non-GET
  if (request.method !== 'GET') {
    return;
  }
  
  // Ne pas intercepter les requêtes vers d'autres origines (sauf mêmes origines)
  if (url.origin !== location.origin) {
    return;
  }
  
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          // Si le fichier est en cache, le retourner
          // Mais aussi mettre à jour le cache en arrière-plan
          event.waitUntil(
            fetch(request)
              .then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200) {
                  caches.open(CACHE_NAME)
                    .then((cache) => cache.put(request, networkResponse));
                }
              })
              .catch(() => {
                // Erreur réseau, on garde le cache
              })
          );
          return cachedResponse;
        }
        
        // Sinon, faire une requête réseau
        return fetch(request)
          .then((response) => {
            // Si la réponse n'est pas valide, la retourner quand même
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Cloner la réponse pour la mettre en cache
            const responseToCache = response.clone();
            
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(request, responseToCache);
              });
            
            return response;
          })
          .catch(() => {
            // Si hors ligne et pas de cache, retourner la page principale en cache
            return caches.match('./');
          });
      })
  );
});

/**
 * Gestion des messages depuis l'application
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

/**
 * Background Sync pour les opérations hors ligne
 * (Optionnel - pour de futures fonctionnalités)
 */
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-cv-data') {
    event.waitUntil(
      // Logique de synchronisation ici
      Promise.resolve()
    );
  }
});