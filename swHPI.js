/* Service worker do app HPI — funciona sem internet.
   Ao publicar uma nova versão do index.html, aumente o número em VERSAO
   para os aparelhos baixarem a atualização. */
const VERSAO = 'hpi-v1';
const ARQUIVOS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png'
];

// Instala: guarda todos os arquivos no aparelho
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSAO).then(c => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});

// Ativa: apaga versões antigas do cache
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== VERSAO).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Busca: responde do cache na hora e atualiza em segundo plano quando houver internet
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    caches.open(VERSAO).then(async cache => {
      const chave = req.mode === 'navigate' ? './index.html' : req;
      const emCache = await cache.match(chave, { ignoreSearch: true });
      const daRede = fetch(req).then(r => {
        if (r && r.ok) cache.put(chave, r.clone());
        return r;
      }).catch(() => null);
      return emCache || (await daRede) || new Response('Sem conexão', { status: 503 });
    })
  );
});
