/* ============================================================
   ATEŞ — Firebase Realtime Database taşıyıcısı
   ------------------------------------------------------------
   PHP'siz statik sunucular (GitHub Pages, Netlify, Vercel…)
   için gerçek zamanlı kanal. config.js içindeki
   teknik.firebase.databaseURL doluysa devreye girer.

   Veri düzeni:  /<yol>/<oda>/      (yol, config.js -> teknik.firebase.yol)
       y/<id>          yıldız
       b/<id>          takımyıldız bağı
       c/<id>          çizgi
       kp/<no>         kullanılmış kupon
       u/<soru>/<kim>  uyum cevabı
       s/<id>          fısıltı
       sn              senkron sayacı
       ck              son çark sonucu
       an/<kim>        anlık (imleç, basılı tutma) — bağlantı kopunca silinir
       ki/<kim>        kimler burada — bağlantı kopunca silinir
   ============================================================ */

const Ates = (function () {

  const SDK_SURUMLERI = ['10.12.2', '9.23.0'];
  let db = null, kok = null, ben = null, cagri = null, durum = null, oda = '';
  let hazir = false, nabizT = null, sayfa = '';
  const bilinen = { y: new Set(), b: new Set(), c: new Set(), s: new Set(), kp: new Set(), ks: new Set() };
  let sonSenkron = 0, sonCark = 0;

  /* ---------- SDK yükleme ---------- */
  function betikYukle(src) {
    return new Promise((tamam, hata) => {
      const s = document.createElement('script');
      s.src = src; s.async = true;
      s.onload = tamam;
      s.onerror = () => hata(new Error('yüklenemedi: ' + src));
      document.head.appendChild(s);
    });
  }

  async function sdkYukle() {
    if (window.firebase && window.firebase.database) return true;
    for (const s of SDK_SURUMLERI) {
      try {
        const kok = 'https://www.gstatic.com/firebasejs/' + s + '/';
        await betikYukle(kok + 'firebase-app-compat.js');
        await betikYukle(kok + 'firebase-database-compat.js');
        if (window.firebase && window.firebase.database) return true;
      } catch (e) { /* sıradaki sürümü dene */ }
    }
    return false;
  }

  /* ---------- yardımcılar ---------- */
  const simdi = () => Date.now() / 1000;

  function duzle(noktalar) {
    const d = [];
    (noktalar || []).forEach(p => { d.push(+(+p[0]).toFixed(4), +(+p[1]).toFixed(4)); });
    return d;
  }
  function acDuzlem(dizi) {
    const d = Array.isArray(dizi) ? dizi : Object.values(dizi || {});
    const n = [];
    for (let i = 0; i + 1 < d.length; i += 2) n.push([+d[i], +d[i + 1]]);
    return n;
  }

  function nesneDizi(v) { return v ? Object.entries(v) : []; }

  function olayYolla(tip, veri, kim, ad, t) {
    if (!hazir) return;
    cagri.olay({ tip, veri, kim: kim || '', ad: ad || '', t: t || simdi() });
  }

  /* ---------- anlık görüntüden durum kurma ---------- */
  function durumKur(anlik) {
    const v = anlik || {};
    durum.yildizlar = nesneDizi(v.y).map(([id, y]) => ({
      id, x: +y.x, y: +y.y, metin: y.metin || '', tur: y.tur || 'metin', mid: y.mid || '',
      kim: y.kim || '', ad: y.ad || '', t: y.t || 0
    })).sort((a, b) => (a.t || 0) - (b.t || 0));
    nesneDizi(v.y).forEach(([id]) => bilinen.y.add(id));

    durum.takimlar = nesneDizi(v.b).map(([id, b]) => ({ a: b.a, b: b.b, kim: b.kim || '' }));
    nesneDizi(v.b).forEach(([id]) => bilinen.b.add(id));

    durum.cizim = nesneDizi(v.c).map(([id, c]) => ({ n: acDuzlem(c.n), r: c.r, k: c.k }));
    nesneDizi(v.c).forEach(([id]) => bilinen.c.add(id));

    durum.kuponlar = {};
    nesneDizi(v.kp).forEach(([no, k]) => { durum.kuponlar[no] = { kim: k.kim, ad: k.ad, t: k.t }; bilinen.kp.add(no); });

    durum.uyum = {};
    nesneDizi(v.u).forEach(([soru, cevaplar]) => {
      durum.uyum[soru] = {};
      nesneDizi(cevaplar).forEach(([kim, c]) => { durum.uyum[soru][kim] = { c: +c.c, ad: c.ad || '' }; });
    });

    durum.sohbet = nesneDizi(v.s).map(([id, s]) => ({ metin: s.metin, kim: s.kim, ad: s.ad, t: s.t }))
      .sort((a, b) => (a.t || 0) - (b.t || 0));
    nesneDizi(v.s).forEach(([id]) => bilinen.s.add(id));

    durum.senkron = v.sn ? { sayi: +v.sn.sayi || 0, son: v.sn.son || 0 } : { sayi: 0, son: 0 };
    sonSenkron = durum.senkron.sayi;
    durum.cark = v.ck ? { no: +v.ck.no, ad: v.ck.ad || '', t: v.ck.t || 0 } : null;
    sonCark = durum.cark ? durum.cark.t : 0;

    durum.gunluk = {};
    nesneDizi(v.gn).forEach(([gun, cevaplar]) => {
      durum.gunluk[gun] = {};
      nesneDizi(cevaplar).forEach(([kim, c]) => {
        durum.gunluk[gun][kim] = { metin: c.metin || '', ad: c.ad || '', t: c.t || 0 };
      });
    });

    durum.kapsul = nesneDizi(v.ks).map(([id, k]) => ({
      id, metin: k.metin || '', acilis: k.acilis || '', kim: k.kim || '', ad: k.ad || '', t: k.t || 0
    })).sort((a, b) => String(a.acilis).localeCompare(String(b.acilis)));
    nesneDizi(v.ks).forEach(([id]) => bilinen.ks.add(id));
    durum.medya = durum.medya || {};
  }

  /* ---------- dinleyiciler ---------- */
  function dinleyicileriKur() {

    /* yıldızlar */
    kok.child('y').on('child_added', (s) => {
      const id = s.key, y = s.val() || {};
      if (bilinen.y.has(id)) return;
      bilinen.y.add(id);
      const kayit = { id, x: +y.x, y: +y.y, metin: y.metin || '', tur: y.tur || 'metin', mid: y.mid || '',
                      kim: y.kim || '', ad: y.ad || '', t: y.t || simdi() };
      durum.yildizlar.push(kayit);
      olayYolla('yildiz', { id, x: kayit.x, y: kayit.y, metin: kayit.metin, tur: kayit.tur, mid: kayit.mid },
                kayit.kim, kayit.ad, kayit.t);
    });
    kok.child('y').on('child_removed', (s) => {
      const id = s.key;
      bilinen.y.delete(id);
      durum.yildizlar = durum.yildizlar.filter(y => y.id !== id);
      durum.takimlar = durum.takimlar.filter(t => t.a !== id && t.b !== id);
      olayYolla('yildiz-sil', { id }, (s.val() || {}).kim, (s.val() || {}).ad);
    });

    /* bağlar */
    kok.child('b').on('child_added', (s) => {
      const id = s.key, b = s.val() || {};
      if (bilinen.b.has(id)) return;
      bilinen.b.add(id);
      if (!durum.takimlar.some(t => (t.a === b.a && t.b === b.b) || (t.a === b.b && t.b === b.a))) {
        durum.takimlar.push({ a: b.a, b: b.b, kim: b.kim || '' });
      }
      olayYolla('takim', { a: b.a, b: b.b }, b.kim, b.ad);
    });
    kok.child('b').on('child_removed', (s) => {
      bilinen.b.delete(s.key);
      const b = s.val() || {};
      durum.takimlar = durum.takimlar.filter(t => !(t.a === b.a && t.b === b.b));
    });

    /* çizim */
    kok.child('c').on('child_added', (s) => {
      const id = s.key, c = s.val() || {};
      if (bilinen.c.has(id)) return;
      bilinen.c.add(id);
      const kayit = { n: acDuzlem(c.n), r: c.r, k: c.k };
      durum.cizim.push(kayit);
      olayYolla('cizgi', kayit, c.kim, c.ad);
      budayabilirMi();
    });
    kok.child('c').on('child_removed', () => {
      if (!hazir) return;
      // tuval temizlendi (ya da budandı) — tamamını yeniden kur
      kok.child('c').once('value').then((s) => {
        const v = s.val();
        bilinen.c.clear();
        durum.cizim = nesneDizi(v).map(([id, c]) => { bilinen.c.add(id); return { n: acDuzlem(c.n), r: c.r, k: c.k }; });
        cagri.olay({ tip: 'cizim-temizle', veri: {}, kim: '', ad: '', t: simdi() });
      });
    });

    /* kuponlar */
    kok.child('kp').on('child_added', (s) => {
      const no = s.key, k = s.val() || {};
      if (bilinen.kp.has(no)) return;
      bilinen.kp.add(no);
      durum.kuponlar[no] = { kim: k.kim, ad: k.ad, t: k.t };
      olayYolla('kupon', { no: +no }, k.kim, k.ad, k.t);
    });
    kok.child('kp').on('child_removed', (s) => {
      bilinen.kp.delete(s.key);
      delete durum.kuponlar[s.key];
      olayYolla('kupon-sifirla', {}, '', '');
    });

    /* uyum */
    kok.child('u').on('value', (s) => {
      const v = s.val();
      const eskiSayi = Object.keys(durum.uyum || {}).length;
      durum.uyum = {};
      nesneDizi(v).forEach(([soru, cevaplar]) => {
        durum.uyum[soru] = {};
        nesneDizi(cevaplar).forEach(([kim, c]) => { durum.uyum[soru][kim] = { c: +c.c, ad: c.ad || '' }; });
      });
      if (!hazir) return;
      const yeniSayi = Object.keys(durum.uyum).length;
      if (yeniSayi === 0 && eskiSayi > 0) cagri.olay({ tip: 'uyum-sifirla', veri: {}, kim: '', ad: '', t: simdi() });
      else cagri.olay({ tip: 'uyum', veri: {}, kim: '', ad: '', t: simdi() });
    });

    /* senkron */
    kok.child('sn').on('value', (s) => {
      const v = s.val() || { sayi: 0, son: 0 };
      durum.senkron = { sayi: +v.sayi || 0, son: v.son || 0 };
      if (!hazir) return;
      if (durum.senkron.sayi > sonSenkron) {
        sonSenkron = durum.senkron.sayi;
        olayYolla('senkron-basarili', {}, v.kim || '', v.ad || '', durum.senkron.son);
      }
    });

    /* çark */
    kok.child('ck').on('value', (s) => {
      const v = s.val();
      if (!v) return;
      durum.cark = { no: +v.no, ad: v.ad || '', t: v.t || 0 };
      if (!hazir) return;
      if (durum.cark.t > sonCark) {
        sonCark = durum.cark.t;
        olayYolla('cark-sonuc', { no: durum.cark.no }, v.kim || '', v.ad || '', durum.cark.t);
      }
    });

    /* fısıltı */
    kok.child('s').on('child_added', (s) => {
      const id = s.key, m = s.val() || {};
      if (bilinen.s.has(id)) return;
      bilinen.s.add(id);
      durum.sohbet.push({ metin: m.metin, kim: m.kim, ad: m.ad, t: m.t });
      if (durum.sohbet.length > 150) durum.sohbet.shift();
      olayYolla('fisilti', { metin: m.metin }, m.kim, m.ad, m.t);
    });

    /* günlük soru */
    kok.child('gn').on('value', (s) => {
      const v = s.val();
      durum.gunluk = {};
      nesneDizi(v).forEach(([gun, cevaplar]) => {
        durum.gunluk[gun] = {};
        nesneDizi(cevaplar).forEach(([kim, c]) => {
          durum.gunluk[gun][kim] = { metin: c.metin || '', ad: c.ad || '', t: c.t || 0 };
        });
      });
      if (hazir) cagri.olay({ tip: 'gunluk', veri: {}, kim: '', ad: '', t: simdi() });
    });

    /* zaman kapsülü */
    kok.child('ks').on('child_added', (s) => {
      const id = s.key, k = s.val() || {};
      if (bilinen.ks.has(id)) return;
      bilinen.ks.add(id);
      durum.kapsul.push({ id, metin: k.metin || '', acilis: k.acilis || '', kim: k.kim || '', ad: k.ad || '', t: k.t || 0 });
      durum.kapsul.sort((a, b) => String(a.acilis).localeCompare(String(b.acilis)));
      olayYolla('kapsul', { id }, k.kim, k.ad, k.t);
    });
    kok.child('ks').on('child_removed', (s) => {
      bilinen.ks.delete(s.key);
      durum.kapsul = durum.kapsul.filter(k => k.id !== s.key);
      olayYolla('kapsul-sil', { id: s.key }, '', '');
    });

    /* anlık: imleç ve basılı tutma */
    const anlikIsle = (s) => {
      if (!hazir || s.key === ben.id) return;
      const v = s.val() || {};
      if (!v.tip) return;
      cagri.olay({ tip: v.tip, veri: v.veri || {}, kim: s.key, ad: v.ad || '', t: v.t || simdi() });
    };
    kok.child('an').on('child_added', anlikIsle);
    kok.child('an').on('child_changed', anlikIsle);

    /* kimler burada */
    kok.child('ki').on('value', (s) => {
      const v = s.val() || {};
      const su = Date.now();
      const eskiler = {};
      const liste = Object.entries(v).map(([id, k]) => {
        const yas = su - (k.t || 0);
        // çok eski kayıtlar (kopmuş oturumlar) temizlensin
        if (yas > 300000 && id !== ben.id) eskiler[id] = null;
        return {
          id, ad: k.ad || '', rol: k.rol || '', sayfa: k.sayfa || '',
          cevrimici: yas < 70000            // onDisconnect başarısız olursa diye
        };
      }).filter(k => !(k.id in eskiler));
      if (Object.keys(eskiler).length) { try { kok.child('ki').update(eskiler); } catch (e) {} }
      if (!liste.some(k => k.id === ben.id)) liste.push({ id: ben.id, ad: ben.ad, rol: ben.rol, sayfa, cevrimici: true });
      cagri.kisiler(liste, liste.filter(k => k.cevrimici).map(k => k.id).sort());
    });
  }

  /* eski çizgileri buda (sınırsız büyümesin) */
  let budaKilit = false;
  function budayabilirMi() {
    if (budaKilit || durum.cizim.length < 3200) return;
    const digerleri = (cagri.kisilerListesi ? cagri.kisilerListesi() : []).map(k => k.id);
    const hepsi = [ben.id].concat(digerleri).sort();
    if (hepsi[0] !== ben.id) return;         // sadece bir taraf budasın
    budaKilit = true;
    kok.child('c').orderByKey().limitToFirst(600).once('value').then((s) => {
      const guncelleme = {};
      s.forEach(ç => { guncelleme[ç.key] = null; });
      return kok.child('c').update(guncelleme);
    }).catch(() => {}).then(() => { setTimeout(() => { budaKilit = false; }, 15000); });
  }

  /* ---------- varlık ---------- */
  let baglantiRef = null;
  function varlikKur() {
    const benimRef = kok.child('ki').child(ben.id);
    const yaz = () => benimRef.set({ ad: ben.ad, rol: ben.rol, sayfa: sayfa, t: Date.now() });
    baglantiRef = db.ref('.info/connected');
    baglantiRef.on('value', (s) => {
      if (s.val() === false) return;
      benimRef.onDisconnect().remove();
      kok.child('an').child(ben.id).onDisconnect().remove();
      yaz();
    });
    if (nabizT) clearInterval(nabizT);
    nabizT = setInterval(yaz, 25000);
  }

  /* ---------- gönderme ---------- */
  function yolla(tip, veri) {
    if (!kok) return;
    veri = veri || {};
    const t = simdi();
    try {
      switch (tip) {
        case 'yildiz':
          kok.child('y').child(veri.id).set({
            x: +veri.x, y: +veri.y, metin: String(veri.metin || '').slice(0, 280),
            tur: veri.tur || 'metin', mid: veri.mid || '',
            kim: ben.id, ad: ben.ad, t
          });
          break;
        case 'gunluk':
          kok.child('gn').child(String(veri.gun)).child(ben.id)
             .set({ metin: String(veri.metin || '').slice(0, 1200), ad: ben.ad, t });
          break;
        case 'kapsul':
          kok.child('ks').child(veri.id).set({
            metin: String(veri.metin || '').slice(0, 2000), acilis: String(veri.acilis || ''),
            kim: ben.id, ad: ben.ad, t
          });
          break;
        case 'kapsul-sil':
          kok.child('ks').child(veri.id || veri).remove();
          break;
        case 'yildiz-sil': {
          const id = veri.id || veri;
          kok.child('y').child(id).remove();
          kok.child('b').once('value').then((s) => {
            const g = {};
            s.forEach(ç => { const b = ç.val(); if (b.a === id || b.b === id) g[ç.key] = null; });
            if (Object.keys(g).length) kok.child('b').update(g);
          });
          break;
        }
        case 'takim': {
          const anahtar = [veri.a, veri.b].sort().join('--').replace(/[.#$/\[\]]/g, '_');
          kok.child('b').child(anahtar).set({ a: veri.a, b: veri.b, kim: ben.id, ad: ben.ad });
          break;
        }
        case 'cizgi':
          kok.child('c').push({ n: duzle(veri.n), r: veri.r || '#ff8fab', k: +veri.k || 4, kim: ben.id, ad: ben.ad });
          break;
        case 'cizim-temizle':
          kok.child('c').remove();
          break;
        case 'kupon':
          kok.child('kp').child(String(veri.no)).set({ kim: ben.id, ad: ben.ad, t });
          break;
        case 'kupon-sifirla':
          kok.child('kp').remove();
          break;
        case 'uyum':
          kok.child('u').child(String(veri.soru)).child(ben.id).set({ c: +veri.cevap, ad: ben.ad });
          break;
        case 'uyum-sifirla':
          kok.child('u').remove();
          break;
        case 'senkron-basarili':
          kok.child('sn').transaction((m) => ({
            sayi: ((m && m.sayi) || 0) + 1, son: t, kim: ben.id, ad: ben.ad
          }));
          break;
        case 'cark-sonuc':
          kok.child('ck').set({ no: +veri.no, kim: ben.id, ad: ben.ad, t });
          break;
        case 'fisilti':
          kok.child('s').push({ metin: String(veri.metin || '').slice(0, 300), kim: ben.id, ad: ben.ad, t });
          break;
        case 'imlec':
        case 'basili':
          kok.child('an').child(ben.id).set({ tip, veri, ad: ben.ad, t });
          break;
        default:
          kok.child('an').child(ben.id).set({ tip, veri, ad: ben.ad, t });
      }
    } catch (e) { console.warn('[ates] gönderilemedi', tip, e); }
  }

  /* ---------- medya (ayrı düğüm; ilk yüklemede indirilmez) ---------- */
  function medyaYaz(mid, veriUrl) {
    if (!kok) return Promise.resolve();
    return kok.child('m').child(mid).set(String(veriUrl || ''));
  }
  async function medyaAl(mid) {
    if (!kok || !mid) return null;
    try { const s = await kok.child('m').child(mid).once('value'); return s.val(); }
    catch (e) { return null; }
  }

  /* ---------- başlat ---------- */
  async function baslat(secenek) {
    ben = secenek.ben; cagri = secenek.cagri; durum = secenek.durum;
    oda = String(secenek.oda || 'varsayilan').replace(/[.#$/\[\]]/g, '_');
    const fb = secenek.firebase || {};
    if (!fb.databaseURL) return false;
    // Verilerin duracağı üst yol (varsayılan: "o"). Paylaşılan bir veritabanında
    // kendi köşene çekilmek için config.js -> teknik.firebase.yol ile değiştirilir.
    const taban = String(fb.yol || 'o').replace(/[.#$\[\]]/g, '_').replace(/^\/+|\/+$/g, '') || 'o';
    if (!(await sdkYukle())) return false;

    try {
      const uygulama = window.firebase.apps && window.firebase.apps.length
        ? window.firebase.app()
        : window.firebase.initializeApp(fb);
      db = window.firebase.database(uygulama);
      kok = db.ref(taban + '/' + oda);
    } catch (e) { console.warn('[ates] başlatılamadı', e); return false; }

    // İlk tam görüntü — sonra dinleyiciler
    try {
      const s = await kok.once('value');
      durumKur(s.val());
    } catch (e) {
      console.warn('[ates] okunamadı (kural hatası olabilir)', e);
      return false;
    }

    dinleyicileriKur();
    varlikKur();
    hazir = true;
    cagri.hazir();
    return true;
  }

  function dur() {
    if (nabizT) { clearInterval(nabizT); nabizT = null; }
    try { if (baglantiRef) { baglantiRef.off(); baglantiRef = null; } } catch (e) {}
    try { if (kok) kok.off(); } catch (e) {}
  }

  function ayril() {
    try {
      if (!kok) return;
      // varlığın geri yazılmasın diye önce nabzı ve bağlantı dinleyicisini kes
      if (nabizT) { clearInterval(nabizT); nabizT = null; }
      if (baglantiRef) { baglantiRef.off(); baglantiRef = null; }
      kok.child('ki').child(ben.id).remove();
      kok.child('an').child(ben.id).remove();
    } catch (e) {}
  }

  function sayfaBildir(y) {
    sayfa = y;
    try { if (kok) kok.child('ki').child(ben.id).update({ sayfa: y, rol: ben.rol, t: Date.now() }); } catch (e) {}
  }

  async function odayiSil() {
    if (!kok) return;
    await kok.child('y').remove();
    await kok.child('b').remove();
    await kok.child('c').remove();
    await kok.child('kp').remove();
    await kok.child('u').remove();
    await kok.child('s').remove();
    await kok.child('sn').remove();
    await kok.child('ck').remove();
    await kok.child('gn').remove();
    await kok.child('ks').remove();
    await kok.child('m').remove();
    Object.values(bilinen).forEach(s => s.clear());
    const anlik = await kok.once('value');
    durumKur(anlik.val());
    cagri.hazir();
  }

  return { baslat, dur, yolla, ayril, sayfaBildir, odayiSil, medyaYaz, medyaAl };
})();
