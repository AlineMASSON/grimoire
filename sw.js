// Service worker du grimoire : fonctionnement hors ligne + réception des exports partagés depuis Bookmory.
var VERSION = 'grimoire-v3';
var PARTAGE = 'grimoire-partage';
var FICHIERS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icone-192.png',
  './icone-512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/sql-wasm.js',
  'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/sql-wasm.wasm',
  'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js'
];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) {
    return c.addAll(FICHIERS);
  }));
  self.skipWaiting();
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

self.addEventListener('fetch', function (e) {
  var url = new URL(e.request.url);

  // Bookmory → Partager → Grimoire : on garde le fichier reçu puis on ouvre l'appli.
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
  if (e.request.mode === 'navigate') {
    e.respondWith(fetch(e.request).then(function (rep) {
      var copie = rep.clone();
      caches.open(VERSION).then(function (c) {
        c.put('./index.html', copie);
      });
      return rep;
    }).catch(function () {
      return caches.match('./index.html');
    }));
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
