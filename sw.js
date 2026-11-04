/* Service worker: gjør appen tilgjengelig uten nett.
   Cacher BARE appens egne statiske filer (listen under). Ingen brukerdata, ingen eksterne kall.
   Øk CACHE-versjonen ved hver endring i appen, ellers får brukerne den gamle versjonen fra cachen.
   tests/sw.test.js sjekker at alle filer i js/, css/, fonts/ og icons/ står i listen. */
const CACHE = "testbank-v11";
const ASSETS = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "css/app.css",
  "js/app.js",
  "js/registry.js",
  "js/lib/format.js",
  "js/lib/form.js",
  "js/lib/koos-hoos.js",
  "js/data/ledd-tekst.js",
  "js/modules/cfs.js",
  "js/modules/berg.js",
  "js/modules/ols.js",
  "js/modules/tug.js",
  "js/modules/sppb.js",
  "js/modules/sts30.js",
  "js/modules/10mwt.js",
  "js/modules/minibest.js",
  "js/modules/6mwt.js",
  "js/modules/nprs.js",
  "js/modules/psfs.js",
  "js/modules/pgic.js",
  "js/modules/koos.js",
  "js/modules/hoos.js",
  "js/modules/ikdc.js",
  "js/modules/aclrsi.js",
  "js/modules/tegner.js",
  "fonts/atkinson-hyperlegible-400-latin.woff2",
  "fonts/atkinson-hyperlegible-400-latin-ext.woff2",
  "fonts/atkinson-hyperlegible-700-latin.woff2",
  "fonts/atkinson-hyperlegible-700-latin-ext.woff2",
  "fonts/ibm-plex-mono-400-latin.woff2",
  "fonts/ibm-plex-mono-400-latin-ext.woff2",
  "fonts/ibm-plex-mono-500-latin.woff2",
  "fonts/ibm-plex-mono-500-latin-ext.woff2",
  "icons/icon.svg",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-512.png",
  "icons/apple-touch-icon.png"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

/* Ny versjon tar over, men siden lastes ikke automatisk på nytt (det ville slettet utfylte felt).
   Den nye versjonen brukes neste gang appen åpnes. */
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith("testbank-") && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

/* Cache først for egne filer, ellers nettet. Andre domener og andre metoder enn GET røres ikke. */
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(caches.open(CACHE).then(c => c.match(req).then(hit => hit || fetch(req))));
});
