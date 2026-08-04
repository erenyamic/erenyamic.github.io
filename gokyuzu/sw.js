/* ============================================================
   SERVİS ÇALIŞANI — çevrimdışı açılış ve hızlı yükleme
   ------------------------------------------------------------
   Site telefona kurulduğunda (ana ekrana eklendiğinde) burası
   devreye girer: dosyalar önbelleğe alınır, internet olmasa
   bile uygulama açılır (canlı veri tabii ki internet ister).

   ÖNEMLİ: Dosyaları güncellediğinde aşağıdaki SURUM sayısını
   bir artır ki eski önbellek temizlensin.
   ============================================================ */

const SURUM = 'ag-v4';
const KABUK = [
  './',
  './index.html',
  './manifest.webmanifest',
  './assets/css/style.css?s=4',
  './assets/js/config.js?s=4',
  './assets/js/utils.js?s=4',
  './assets/js/kanal-firebase.js?s=4',
  './assets/js/kanal.js?s=4',
  './assets/js/arkaplan.js?s=4',
  './assets/js/muzik.js?s=4',
  './assets/js/medya.js?s=4',
  './assets/js/router.js?s=4',
  './assets/js/views/ana.js?s=4',
  './assets/js/views/yildizharitasi.js?s=4',
  './assets/js/views/duvar.js?s=4',
  './assets/js/views/kalpsenkronu.js?s=4',
  './assets/js/views/uyum.js?s=4',
  './assets/js/views/cizim.js?s=4',
  './assets/js/views/cark.js?s=4',
  './assets/js/views/gunluk.js?s=4',
  './assets/js/views/kapsul.js?s=4',
  './assets/js/views/kuponlar.js?s=4',
  './assets/js/views/sayac.js?s=4',
  './assets/js/views/tunel.js?s=4',
  './assets/js/views/mektup.js?s=4',
  './assets/js/app.js?s=4',
  './assets/img/ikon-192.png',
  './assets/img/ikon-512.png'
];

self.addEventListener('install', (olay) => {
  olay.waitUntil((async () => {
    const onbellek = await caches.open(SURUM);
    // tek tek ekle: biri düşerse kurulum tamamen başarısız olmasın
    await Promise.all(KABUK.map(u => onbellek.add(u).catch(() => {})));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (olay) => {
  olay.waitUntil((async () => {
    const adlar = await caches.keys();
    await Promise.all(adlar.filter(a => a !== SURUM).map(a => caches.delete(a)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (olay) => {
  const istek = olay.request;
  if (istek.method !== 'GET') return;

  const url = new URL(istek.url);
  if (url.origin !== location.origin) return;          // Firebase / fontlar: dokunma

  // Sayfa açılışı: önce ağ, olmazsa önbellekteki kabuk
  if (istek.mode === 'navigate') {
    olay.respondWith((async () => {
      try {
        const cevap = await fetch(istek);
        const o = await caches.open(SURUM);
        o.put('./index.html', cevap.clone()).catch(() => {});
        return cevap;
      } catch (e) {
        return (await caches.match('./index.html')) || (await caches.match('./')) || Response.error();
      }
    })());
    return;
  }

  // Dosyalar: önbellekten ver, arka planda tazele
  olay.respondWith((async () => {
    const onbellek = await caches.open(SURUM);
    const varOlan = await onbellek.match(istek);
    const agdan = fetch(istek).then(cevap => {
      if (cevap && cevap.status === 200 && cevap.type === 'basic') {
        onbellek.put(istek, cevap.clone()).catch(() => {});
      }
      return cevap;
    }).catch(() => null);
    return varOlan || (await agdan) || Response.error();
  })());
});

/* Uygulamadan gelen bildirim isteği */
self.addEventListener('message', (olay) => {
  const m = olay.data || {};
  if (m.tur === 'bildirim' && self.registration.showNotification) {
    self.registration.showNotification(m.baslik || 'Aynı Gökyüzü', {
      body: m.govde || '',
      icon: './assets/img/ikon-192.png',
      badge: './assets/img/ikon-192.png',
      tag: m.etiket || 'ag',
      renotify: true,
      data: { yol: m.yol || './' }
    });
  }
  if (m.tur === 'guncelle') self.skipWaiting();
});

self.addEventListener('notificationclick', (olay) => {
  olay.notification.close();
  const yol = (olay.notification.data && olay.notification.data.yol) || './';
  olay.waitUntil((async () => {
    const pencereler = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const p of pencereler) {
      if (p.url.includes(self.registration.scope)) { await p.focus(); return; }
    }
    await self.clients.openWindow(yol);
  })());
});
