// Service worker du grimoire : fonctionnement hors ligne + réception des fichiers partagés (sauvegarde, export Bookmory).
var VERSION = 'grimoire-v9';
var PARTAGE = 'grimoire-partage';
var FICHIERS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icone2-192.png',
  './icone2-512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/sql-wasm.js',
  'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/sql-wasm.wasm',
  'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js'
];

// cache: 'reload' : on prend les fichiers sur le serveur, pas une copie gardée par le navigateur ;
// fichier par fichier : si une bibliothèque ne répond pas, l'installation réussit quand même (sinon l'ancien
// service worker resterait en place et l'appli ne se mettrait plus à jour) ; elle sera mise en cache au premier usage
function precharger() {
  return caches.open(VERSION).then(function (c) {
    return Promise.all(FICHIERS.map(function (f) {
      return c.add(new Request(f, {cache: 'reload'})).catch(function () {});
    }));
  });
}
self.addEventListener('install', function (e) {
  e.waitUntil(precharger());
  self.skipWaiting();
});
// après une réparation (caches vidés, service worker conservé), l'appli redemande les fichiers hors ligne
self.addEventListener('message', function (e) {
  if (e.data === 'precharger') {
    e.waitUntil(precharger());
  }
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (cles) {
    return Promise.all(cles.filter(function (k) {
      return k !== VERSION && k !== PARTAGE;
    }).map(function (k) {
      return caches.delete(k);
    }));
  }).then(function () {
    return self.clients.claim();
  }));
});

// Seuls nos fichiers, les bibliothèques (adresses versionnées, donc immuables) et les ressources statiques
// (scripts, styles, polices, images) passent par le cache.
var BIBLIOTHEQUES = ['cdnjs.cloudflare.com', 'cdn.jsdelivr.net'];
function cacheable(req, url) {
  if (url.origin === self.location.origin || BIBLIOTHEQUES.indexOf(url.hostname) !== -1) {
    return true;
  }
  return ['script', 'style', 'font', 'image'].indexOf(req.destination) !== -1;
}

self.addEventListener('fetch', function (e) {
  var url = new URL(e.request.url);

  // Partager → Grimoire : on garde le fichier reçu puis on ouvre l'appli.
  if (e.request.method === 'POST' && url.pathname.endsWith('/partage')) {
    e.respondWith(e.request.formData().then(function (form) {
      var f = form.get('export');
      return caches.open(PARTAGE).then(function (c) {
        var nom = 'export';
        if (f && f.name) {
          nom = f.name;
        }
        return c.put(new URL('partage-recu', self.registration.scope).href, new Response(f, {headers: {'X-Nom': encodeURIComponent(nom)}}));
      });
    }).then(function () {
      return Response.redirect(new URL('./?partage=1', self.registration.scope).href, 303);
    }));
    return;
  }
  if (e.request.method !== 'GET') {
    return;
  }

  // La page : réseau d'abord (pour recevoir les mises à jour), cache si hors ligne.
  // cache: 'no-cache' : le navigateur redemande toujours au serveur (sinon il garde la page 10 min).
  // Seule la page de l'appli est gardée comme copie hors ligne (pas version.txt ni reparer.html ouverts dans Chrome).
  if (e.request.mode === 'navigate') {
    var page = new URL('./', self.registration.scope).pathname;
    var estAppli = url.pathname === page || url.pathname === page + 'index.html';
    e.respondWith(fetch(e.request.url, {cache: 'no-cache', credentials: 'same-origin'}).then(function (rep) {
      if (estAppli && rep.ok) {
        var copie = rep.clone();
        caches.open(VERSION).then(function (c) {
          c.put('./index.html', copie);
        });
      }
      return rep;
    }).catch(function () {
      return caches.match('./index.html');
    }));
    return;
  }

  // Les API (Google Books, Open Library, relais de sauvegarde…) et le numéro de version : toujours le réseau.
  if (!cacheable(e.request, url) || url.pathname.endsWith('/version.txt')) {
    return;
  }

  // Le reste (bibliothèques, polices, icônes, couvertures) : cache d'abord.
  e.respondWith(caches.match(e.request).then(function (enCache) {
    if (enCache) {
      return enCache;
    }
    return fetch(e.request).then(function (rep) {
      if (rep.ok || rep.type === 'opaque') {
        var copie = rep.clone();
        caches.open(VERSION).then(function (c) {
          c.put(e.request, copie);
        });
      }
      return rep;
    });
  }));
});
