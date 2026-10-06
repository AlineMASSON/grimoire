// Service worker du grimoire : fonctionnement hors ligne + réception des fichiers partagés (sauvegarde, export Bookmory).
var VERSION = 'grimoire-v10';
var PARTAGE = 'grimoire-partage';
// couvertures et décorations à part, avec un plafond : ce cache ne grossit plus sans fin
var IMAGES = 'grimoire-images';
var IMAGES_MAX = 300;
// au-delà, la page gardée en cache s'ouvre (elle se met à jour dès que le réseau répond)
var ATTENTE_RESEAU = 3000;
// sql.js ne sert qu'à l'import Bookmory : il est mis en cache au premier usage
var FICHIERS = [
  './index.html',
  './manifest.webmanifest',
  './icone2-192.png',
  './icone2-512.png',
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
      return k !== VERSION && k !== PARTAGE && k !== IMAGES;
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
    var reseau = fetch(e.request.url, {cache: 'no-cache', credentials: 'same-origin'}).then(function (rep) {
      if (estAppli && rep.ok) {
        var copie = rep.clone();
        return caches.open(VERSION).then(function (c) {
          return c.put('./index.html', copie);
        }).then(function () {
          return rep;
        }, function () {
          return rep;
        });
      }
      return rep;
    });
    // le service worker reste éveillé jusqu'à ce que la nouvelle page soit rangée
    e.waitUntil(reseau.catch(function () {}));
    if (!estAppli) {
      e.respondWith(reseau.catch(function () {
        return caches.match('./index.html');
      }));
      return;
    }
    // réseau d'abord, mais pas plus de 3 s : avec un réseau faible, l'appli s'ouvre depuis le cache
    e.respondWith(new Promise(function (ok) {
      var fini = false;
      function repondre(rep) {
        if (!fini && rep) {
          fini = true;
          clearTimeout(minuteur);
          ok(rep);
        }
      }
      var minuteur = setTimeout(function () {
        caches.match('./index.html').then(repondre);
      }, ATTENTE_RESEAU);
      reseau.then(repondre, function () {
        caches.match('./index.html').then(function (c) {
          repondre(c || Response.error());
        });
      });
    }));
    return;
  }

  // Les API (Google Books, Open Library, relais de sauvegarde…) et le numéro de version : toujours le réseau.
  if (!cacheable(e.request, url) || url.pathname.endsWith('/version.txt')) {
    return;
  }

  // Images d'un autre site (couvertures, décorations) : cache d'abord, dans le cache plafonné.
  if (e.request.destination === 'image' && url.origin !== self.location.origin) {
    e.respondWith(imageEnCache(e, url));
    return;
  }

  // Le reste (bibliothèques, polices, icônes) : cache d'abord.
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

// Une image d'un autre site est redemandée en CORS (Amazon, Google, jsDelivr l'acceptent) : la réponse est lisible,
// donc on connaît sa vraie taille. Une réponse « opaque » compterait pour plusieurs Mo dans l'espace du téléphone :
// elle n'est jamais gardée.
function imageEnCache(e, url) {
  return caches.open(IMAGES).then(function (c) {
    return c.match(url.href).then(function (enCache) {
      if (enCache) {
        return enCache;
      }
      return fetch(new Request(url.href, {mode: 'cors', credentials: 'omit'})).then(function (rep) {
        if (rep.ok) {
          e.waitUntil(c.put(url.href, rep.clone()).then(function () {
            return plafonner(c);
          }).catch(function () {}));
        }
        return rep;
      }, function () {
        return fetch(e.request);
      });
    });
  });
}
// les plus anciennes images rangées partent en premier
function plafonner(c) {
  return c.keys().then(function (cles) {
    return Promise.all(cles.slice(0, Math.max(0, cles.length - IMAGES_MAX)).map(function (k) {
      return c.delete(k);
    }));
  });
}
