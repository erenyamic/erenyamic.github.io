/* ============================================================
   PWA — telefona kurulum ve bildirimler
   ------------------------------------------------------------
   Not: Uygulama tamamen KAPALIYKEN bildirim göndermek için
   sunucu tarafı (Firebase Cloud Functions) gerekir. Burada
   yapılan, uygulama açık ya da arka plandayken bildirim
   göstermektir — telefonda ana ekrana eklendiyse fazlasıyla
   iş görür.
   ============================================================ */

const Kur = (function () {

  let kurulumOlayi = null;
  let kayit = null;

  const iosMu = () => /iphone|ipad|ipod/i.test(navigator.userAgent);
  const kuruluMu = () =>
    matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;

  /* ---------- servis çalışanı ---------- */
  async function servisiKur() {
    if (!('serviceWorker' in navigator)) return;
    if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') return;
    try {
      kayit = await navigator.serviceWorker.register('sw.js', { scope: './' });
      // yeni sürüm geldiyse sessizce devral
      kayit.addEventListener('updatefound', () => {
        const yeni = kayit.installing;
        if (!yeni) return;
        yeni.addEventListener('statechange', () => {
          if (yeni.state === 'installed' && navigator.serviceWorker.controller) {
            Bildirim.goster('Site güncellendi — yenilemek için dokun', '🔄', 9000);
          }
        });
      });
    } catch (e) { console.warn('[pwa] servis çalışanı kurulamadı', e); }
  }

  /* ---------- kurulum düğmesi ---------- */
  function dugmeyiGoster(goster) {
    const t = $('#kurTus');
    if (t) t.hidden = !goster;
  }

  function kurulumuBaslat() {
    if (kurulumOlayi) {
      kurulumOlayi.prompt();
      kurulumOlayi.userChoice.then(() => { kurulumOlayi = null; dugmeyiGoster(false); });
      return;
    }
    // iOS'ta tarayıcı sormuyor; elle anlatmak gerek
    Perde.goster({
      baslik: 'Telefona ekle',
      metin: iosMu()
        ? 'Safari\'de alttaki <b>Paylaş</b> düğmesine bas → <b>Ana Ekrana Ekle</b>. '
          + 'Böylece uygulama gibi açılır ve bildirim alabilir.'
        : 'Tarayıcı menüsünden <b>Uygulamayı yükle</b> / <b>Ana ekrana ekle</b> seçeneğini kullan.',
      butonlar: [{ yazi: 'Tamam' }]
    });
  }

  /* ---------- bildirimler ---------- */
  function izinDurumu() {
    if (!('Notification' in window)) return 'yok';
    return Notification.permission;   // default | granted | denied
  }

  async function izinIste() {
    if (!('Notification' in window)) {
      Bildirim.goster('Bu tarayıcı bildirimleri desteklemiyor.', '🔕');
      return false;
    }
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') {
      Perde.goster({
        baslik: 'Bildirimler kapalı',
        metin: 'Tarayıcı ayarlarından bu site için bildirimlere izin vermen gerekiyor.',
        butonlar: [{ yazi: 'Tamam' }]
      });
      return false;
    }
    const s = await Notification.requestPermission();
    if (s === 'granted') {
      gonder('Bildirimler açık ✨', 'Betül bir şey yaptığında haberin olacak.');
      return true;
    }
    return false;
  }

  function gonder(baslik, govde, etiket) {
    if (izinDurumu() !== 'granted') return;
    try {
      if (kayit && kayit.active) {
        kayit.active.postMessage({ tur: 'bildirim', baslik, govde, etiket, yol: location.href });
      } else {
        new Notification(baslik, { body: govde, icon: 'assets/img/ikon-192.png', tag: etiket || 'ag' });
      }
    } catch (e) { /* sessiz geç */ }
  }

  /* ---------- eş bir şey yaptığında ---------- */
  function olaylariBagla() {
    const A = window.AYAR;
    const bak = (tip, yaz) => Kanal.on(tip, (v, o) => {
      if (o.benMi) return;
      if (!document.hidden) return;          // ekrandaysa zaten görüyor
      const m = yaz(v, o);
      if (m) gonder(m[0], m[1], tip);
    });

    bak('yildiz',   (v, o) => [`${o.ad} bir yıldız bıraktı ✨`, v.metin || (v.tur === 'ses' ? 'Sesli bir anı' : 'Bir fotoğraf')]);
    bak('fisilti',  (v, o) => [`${o.ad}`, v.metin]);
    bak('kupon',    (v, o) => [`${o.ad} bir kupon kullandı 🎟️`, (A.kuponlar[v.no] || {}).baslik || '']);
    bak('gunluk',   (v, o) => [`${o.ad} günün sorusunu cevapladı 📔`, 'Senin cevabın da bekleniyor']);
    bak('kapsul',   (v, o) => [`${o.ad} bir zaman kapsülü mühürledi ⏳`, '']);
    bak('cark-sonuc', (v, o) => [`${o.ad} çarkı çevirdi 🎡`, A.carkSecenekleri[v.no] || '']);
    Kanal.on('katildi', (v, o) => {
      if (o.benMi || !document.hidden) return;
      gonder(`${o.ad} gökyüzüne girdi 💫`, 'Şu an ikiniz de buradasınız', 'katildi');
    });
  }

  /* ---------- başlat ---------- */
  function baslat() {
    servisiKur();

    addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      kurulumOlayi = e;
      if (!kuruluMu()) dugmeyiGoster(true);
    });
    addEventListener('appinstalled', () => {
      kurulumOlayi = null;
      dugmeyiGoster(false);
      Bildirim.goster('Uygulama telefonuna eklendi 🤍', '📱', 6000);
    });

    // iOS'ta beforeinstallprompt yok; kurulu değilse düğmeyi yine de göster
    if (iosMu() && !kuruluMu()) dugmeyiGoster(true);

    const kt = $('#kurTus');
    if (kt) kt.onclick = kurulumuBaslat;

    const bt = $('#bildirimTus');
    if (bt) {
      const tazele = () => {
        const d = izinDurumu();
        bt.hidden = (d === 'yok');
        bt.classList.toggle('aktif', d === 'granted');
        bt.textContent = d === 'granted' ? '🔔' : '🔕';
        bt.title = d === 'granted' ? 'Bildirimler açık' : 'Bildirimleri aç';
      };
      bt.onclick = async () => { await izinIste(); tazele(); };
      tazele();
    }

    olaylariBagla();
  }

  return { baslat, gonder, izinIste, izinDurumu, kuruluMu };
})();
