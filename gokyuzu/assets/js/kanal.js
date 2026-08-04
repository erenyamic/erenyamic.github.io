/* ============================================================
   KANAL — gerçek zamanlı bağlantı katmanı
   ------------------------------------------------------------
   İki mod vardır:
     • "sunucu" : api/kanal.php bulunduğunda. Long-polling ile
                  cihazlar arası anlık iletişim.
     • "yerel"  : PHP yoksa. Aynı tarayıcıdaki sekmeler arası
                  çalışır, veriler tarayıcıda saklanır.
   ============================================================ */

const Kanal = (function () {

  const dinleyiciler = {};
  let ayar = { api: 'api/kanal.php', oda: 'varsayilan' };
  let ben  = { id: '', ad: '', rol: 'ben' };
  let mod  = 'baglaniyor';          // baglaniyor | firebase | sunucu | yerel
  let seq  = 0;
  let durum = bosDurum();
  let kisiler = [];
  let cevrimiciKume = '';
  let calisiyor = false;
  let hataSayisi = 0;
  let sayfa = '';
  let bc = null;
  let yerelNabiz = null;
  let iptal = null;

  function bosDurum() {
    return { yildizlar: [], takimlar: [], cizim: [], kuponlar: {}, uyum: {}, sohbet: [],
             senkron: { sayi: 0, son: 0 }, cark: null, gunluk: {}, kapsul: [], medya: {} };
  }

  /* ---------- olay dağıtımı ---------- */
  function on(tip, fn) {
    (dinleyiciler[tip] = dinleyiciler[tip] || []).push(fn);
    return () => off(tip, fn);
  }
  function off(tip, fn) {
    const l = dinleyiciler[tip]; if (!l) return;
    const i = l.indexOf(fn); if (i > -1) l.splice(i, 1);
  }
  function dagit(tip, ...arg) {
    (dinleyiciler[tip] || []).forEach(f => { try { f(...arg); } catch (e) { console.error('[kanal]', tip, e); } });
    if (tip !== '*') (dinleyiciler['*'] || []).forEach(f => { try { f(tip, ...arg); } catch (e) {} });
  }

  /* ---------- durum indirgeyici (sunucudaki mantığın aynısı) ---------- */
  function durumaYansit(d, olay) {
    const v = olay.veri || {};
    switch (olay.tip) {
      case 'yildiz':
        d.yildizlar.push({ id: v.id, x: v.x, y: v.y, metin: v.metin, tur: v.tur || 'metin', mid: v.mid || '',
                           kim: olay.kim, ad: olay.ad, t: olay.t });
        if (d.yildizlar.length > 400) d.yildizlar.shift();
        break;
      case 'yildiz-sil': {
        const h = v.id || v;
        d.yildizlar = d.yildizlar.filter(y => y.id !== h);
        d.takimlar  = d.takimlar.filter(t => t.a !== h && t.b !== h);
        break;
      }
      case 'takim': {
        if (!v.a || !v.b || v.a === v.b) break;
        const var_ = d.takimlar.some(t => (t.a === v.a && t.b === v.b) || (t.a === v.b && t.b === v.a));
        if (!var_) d.takimlar.push({ a: v.a, b: v.b, kim: olay.kim });
        break;
      }
      case 'cizgi':
        d.cizim.push({ n: v.n || [], r: v.r, k: v.k });
        if (d.cizim.length > 4000) d.cizim.shift();
        break;
      case 'cizim-temizle': d.cizim = []; break;
      case 'kupon': d.kuponlar[String(v.no)] = { kim: olay.kim, ad: olay.ad, t: olay.t }; break;
      case 'kupon-sifirla': d.kuponlar = {}; break;
      case 'uyum': {
        const s = String(v.soru);
        if (!d.uyum[s]) d.uyum[s] = {};
        d.uyum[s][olay.kim] = { c: v.cevap, ad: olay.ad };
        break;
      }
      case 'uyum-sifirla': d.uyum = {}; break;
      case 'senkron-basarili': d.senkron = { sayi: (d.senkron.sayi || 0) + 1, son: olay.t }; break;
      case 'cark-sonuc': d.cark = { no: v.no, ad: olay.ad, t: olay.t }; break;
      case 'fisilti':
        d.sohbet.push({ metin: v.metin, kim: olay.kim, ad: olay.ad, t: olay.t });
        if (d.sohbet.length > 150) d.sohbet.shift();
        break;
      case 'gunluk': {
        const g = String(v.gun || '');
        if (!d.gunluk[g]) d.gunluk[g] = {};
        d.gunluk[g][olay.kim] = { metin: v.metin, ad: olay.ad, t: olay.t };
        break;
      }
      case 'kapsul':
        d.kapsul.push({ id: v.id, metin: v.metin, acilis: v.acilis, kim: olay.kim, ad: olay.ad, t: olay.t });
        break;
      case 'kapsul-sil':
        d.kapsul = d.kapsul.filter(k => k.id !== (v.id || v));
        break;
      case 'medya':
        d.medya[v.mid] = v.veri;
        break;
    }
  }

  function olayIsle(olay) {
    olay.benMi = olay.kim === ben.id;
    durumaYansit(durum, olay);
    dagit(olay.tip, olay.veri, olay);
  }

  /* ---------- sunucu modu ---------- */
  async function istek(param, govde) {
    const u = new URL(ayar.api, location.href);
    Object.entries(param).forEach(([k, v]) => u.searchParams.set(k, v));
    const secenek = { cache: 'no-store' };
    if (govde) {
      secenek.method = 'POST';
      secenek.headers = { 'Content-Type': 'application/json' };
      secenek.body = JSON.stringify(govde);
    }
    const c = new AbortController();
    const zamanAsimi = setTimeout(() => c.abort(), param.aksiyon === 'senkron' ? 45000 : 12000);
    secenek.signal = c.signal;
    if (param.aksiyon === 'senkron') iptal = c;
    try {
      const r = await fetch(u.toString(), secenek);
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return await r.json();
    } finally { clearTimeout(zamanAsimi); }
  }

  function temelParam(ek) {
    return Object.assign({ oda: ayar.oda, kim: ben.id, ad: ben.ad, rol: ben.rol, sayfa }, ek || {});
  }

  async function anlikGoruntu() {
    const j = await istek(temelParam({ aksiyon: 'durum' }));
    seq = j.seq || 0;
    durum = Object.assign(bosDurum(), j.durum || {});
    // PHP boş nesneleri dizi olarak gönderebilir; normalize et
    ['kuponlar', 'uyum'].forEach(k => { if (Array.isArray(durum[k])) durum[k] = Object.assign({}, durum[k]); });
    ['yildizlar', 'takimlar', 'cizim', 'sohbet'].forEach(k => { if (!Array.isArray(durum[k])) durum[k] = []; });
    kisilerGuncelle(j.kisiler, j.cevrimici);
    dagit('*durum', durum);
  }

  function kisilerGuncelle(liste, online) {
    kisiler = Array.isArray(liste) ? liste : [];
    const yeniKume = (online || []).join(',');
    if (yeniKume !== cevrimiciKume) {
      cevrimiciKume = yeniKume;
      dagit('*kisiler', kisiler);
    } else {
      dagit('*kisiler-sessiz', kisiler);
    }
  }

  async function dongu() {
    while (calisiyor && mod === 'sunucu') {
      try {
        const j = await istek(temelParam({ aksiyon: 'senkron', since: seq, pset: cevrimiciKume }));
        hataSayisi = 0;
        if (j.kacirdi) { await anlikGoruntu(); continue; }
        if (j.seq != null) seq = j.seq;
        (j.olaylar || []).forEach(olayIsle);
        kisilerGuncelle(j.kisiler, j.cevrimici);
        if (mod !== 'sunucu') break;
        dagit('*baglanti', { mod, iyi: true });
      } catch (e) {
        if (!calisiyor) break;
        hataSayisi++;
        dagit('*baglanti', { mod, iyi: false, hata: hataSayisi });
        if (hataSayisi >= 6) { yerelModaGec('Sunucuya ulaşılamadı'); break; }
        await bekle(Math.min(9000, 600 * Math.pow(1.8, hataSayisi)));
      }
    }
  }

  async function yolla(tip, veri) {
    const olay = { tip, veri, kim: ben.id, ad: ben.ad, t: Date.now() / 1000 };
    if (mod === 'firebase') { Ates.yolla(tip, veri); return; }
    if (mod === 'sunucu') {
      try {
        await istek(temelParam({ aksiyon: 'yolla' }), { tip, veri });
      } catch (e) {
        // gönderilemedi: en azından yerelde göster
        console.warn('[kanal] gönderilemedi', e);
      }
      return;
    }
    // yerel mod: hemen uygula + diğer sekmelere duyur
    olay.s = ++seq;
    olayIsle(olay);
    yerelKaydet();
    if (bc) bc.postMessage({ tur: 'olay', olay });
  }

  /* ---------- yerel mod ---------- */
  function yerelAnahtar() { return 'yerel_' + ayar.oda; }
  function yerelKaydet() { Kayit.yaz(yerelAnahtar(), { seq, durum }); }
  function yerelYukle() {
    const k = Kayit.al(yerelAnahtar(), null);
    if (k && k.durum) { durum = Object.assign(bosDurum(), k.durum); seq = k.seq || 0; }
  }

  const yerelKisiler = new Map();

  function yerelKisileriTazele() {
    const simdi = Date.now();
    let degisti = false;
    yerelKisiler.forEach((k, id) => {
      const acik = simdi - k.son < 9000;
      if (k.acik !== acik) { k.acik = acik; degisti = true; }
    });
    const liste = [{ id: ben.id, ad: ben.ad, rol: ben.rol, sayfa, cevrimici: true }];
    yerelKisiler.forEach((k, id) => liste.push({ id, ad: k.ad, rol: k.rol, sayfa: k.sayfa, cevrimici: k.acik }));
    kisiler = liste;
    const kume = liste.filter(k => k.cevrimici).map(k => k.id).sort().join(',');
    if (kume !== cevrimiciKume || degisti) { cevrimiciKume = kume; dagit('*kisiler', kisiler); }
  }

  function yerelModaGec(sebep) {
    mod = 'yerel';
    calisiyor = true;
    yerelYukle();
    try {
      bc = new BroadcastChannel('ayni-gokyuzu-' + ayar.oda);
      bc.onmessage = (e) => {
        const m = e.data || {};
        if (m.tur === 'olay' && m.olay && m.olay.kim !== ben.id) {
          seq = Math.max(seq, m.olay.s || 0);
          olayIsle(m.olay);
          yerelKaydet();
        } else if (m.tur === 'nabiz' && m.id !== ben.id) {
          yerelKisiler.set(m.id, { ad: m.ad, rol: m.rol, sayfa: m.sayfa, son: Date.now(), acik: true });
          yerelKisileriTazele();
        } else if (m.tur === 'ayril' && m.id !== ben.id) {
          yerelKisiler.delete(m.id); yerelKisileriTazele();
        }
      };
      const nabiz = () => { if (bc) bc.postMessage({ tur: 'nabiz', id: ben.id, ad: ben.ad, rol: ben.rol, sayfa }); yerelKisileriTazele(); };
      nabiz();
      yerelNabiz = setInterval(nabiz, 3000);
    } catch (e) { /* BroadcastChannel yok */ }
    dagit('*durum', durum);
    yerelKisileriTazele();
    dagit('*baglanti', { mod, iyi: true, sebep: sebep || '' });
  }

  /* ---------- başlat ---------- */
  async function baslat(secenek) {
    ayar = Object.assign(ayar, secenek || {});
    ben.ad  = secenek.ad || 'Bilinmeyen';
    ben.rol = secenek.rol || 'ben';
    // Kimlik role göre saklanır: aynı tarayıcıda iki farklı kişiyi
    // denemek istersen ?ben=o ile ikinci kimliğe geçebilirsin.
    ben.id  = Kayit.al('kimlik_' + ben.rol, null) || benzersiz('k');
    Kayit.yaz('kimlik_' + ben.rol, ben.id);
    calisiyor = true;

    /* 1) Firebase ayarlıysa onu kullan (PHP'siz statik sunucular için) */
    const fb = (secenek.firebase || {});
    if (fb.databaseURL && typeof Ates !== 'undefined') {
      durum = bosDurum();
      const kuruldu = await Ates.baslat({
        oda: ayar.oda, ben, durum, firebase: fb,
        cagri: {
          olay: (o) => { o.benMi = o.kim === ben.id; dagit(o.tip, o.veri, o); },
          kisiler: (liste, online) => kisilerGuncelle(liste, online),
          kisilerListesi: () => kisiler,
          hazir: () => dagit('*durum', durum)
        }
      });
      if (kuruldu) {
        mod = 'firebase';
        dagit('*baglanti', { mod, iyi: true });
        return mod;
      }
      console.warn('[kanal] Firebase kurulamadı, diğer yollara bakılıyor.');
    }

    /* 2) Kendi sunucundaki PHP kanalı */
    let sunucuVar = false;
    try {
      const c = new AbortController();
      const t = setTimeout(() => c.abort(), 7000);
      const u = new URL(ayar.api, location.href);
      u.searchParams.set('aksiyon', 'ping');
      const r = await fetch(u.toString(), { cache: 'no-store', signal: c.signal });
      clearTimeout(t);
      if (r.ok) {
        const j = await r.json();
        sunucuVar = !!j.sunucu;
        if (sunucuVar && j.yazilir === false) {
          console.warn('[kanal] api/veri klasörü yazılabilir değil.');
          sunucuVar = false;
        }
      }
    } catch (e) { sunucuVar = false; }

    if (!sunucuVar) { yerelModaGec('PHP kanalı bulunamadı'); return mod; }

    mod = 'sunucu';
    try { await anlikGoruntu(); }
    catch (e) { yerelModaGec('İlk bağlantı başarısız'); return mod; }
    dongu();
    return mod;
  }

  function dur() {
    calisiyor = false;
    if (mod === 'firebase') { Ates.dur(); return; }
    if (iptal) { try { iptal.abort(); } catch (e) {} }
    if (yerelNabiz) clearInterval(yerelNabiz);
  }

  function ayril() {
    if (mod === 'firebase') { Ates.ayril(); return; }
    if (mod === 'sunucu') {
      try {
        const u = new URL(ayar.api, location.href);
        u.searchParams.set('aksiyon', 'ayril');
        u.searchParams.set('oda', ayar.oda);
        u.searchParams.set('kim', ben.id);
        navigator.sendBeacon ? navigator.sendBeacon(u.toString()) : fetch(u.toString(), { keepalive: true });
      } catch (e) {}
    } else if (bc) {
      try { bc.postMessage({ tur: 'ayril', id: ben.id }); } catch (e) {}
    }
  }

  function sayfaBildir(yeni) {
    if (sayfa === yeni) return;
    sayfa = yeni;
    if (mod === 'firebase') { Ates.sayfaBildir(yeni); }
    else if (mod === 'sunucu') { istek(temelParam({ aksiyon: 'varlik' })).catch(() => {}); }
    else if (bc) { try { bc.postMessage({ tur: 'nabiz', id: ben.id, ad: ben.ad, rol: ben.rol, sayfa }); } catch (e) {} }
  }

  /* Eşi bulurken kimliğe değil ROLE bakılır. Aynı kişi iki cihazdan
     girdiğinde (telefon + bilgisayar) kendini eş sanmasın diye. */
  /* ---------- medya (fotoğraf / ses) ---------- */
  async function medyaYaz(mid, veriUrl) {
    if (mod === 'firebase') return Ates.medyaYaz(mid, veriUrl);
    await yolla('medya', { mid, veri: veriUrl });
  }
  async function medyaAl(mid) {
    if (!mid) return null;
    if (durum.medya && durum.medya[mid]) return durum.medya[mid];
    if (mod === 'firebase') {
      const v = await Ates.medyaAl(mid);
      if (v) durum.medya[mid] = v;
      return v;
    }
    return null;
  }

  function es() {
    // 1. tercih: rolü benden farklı VE çevrimiçi olan
    // 2. tercih: rolü bilinmeyen ama çevrimiçi (eski sürümden bağlanmış olabilir)
    // 3-4. tercih: aynı sıra, çevrimdışı olanlar
    const digerRol  = kisiler.filter(k => k.rol && k.rol !== ben.rol);
    const rolsuzler = kisiler.filter(k => !k.rol && k.id !== ben.id);
    return digerRol.find(k => k.cevrimici)
        || rolsuzler.find(k => k.cevrimici)
        || digerRol[0]
        || rolsuzler[0]
        || null;
  }
  function esCevrimici() {
    const e = es();
    return !!(e && e.cevrimici);
  }

  async function odayiSil() {
    if (mod === 'firebase') { await Ates.odayiSil(); return; }
    if (mod === 'sunucu') {
      await istek(temelParam({ aksiyon: 'sil' }));
      await anlikGoruntu();
    } else {
      durum = bosDurum(); yerelKaydet();
      if (bc) bc.postMessage({ tur: 'olay', olay: { tip: 'sifirla', kim: ben.id, ad: ben.ad, t: Date.now() / 1000, s: ++seq } });
      dagit('*durum', durum);
    }
  }

  return {
    baslat, dur, on, off, yolla, ayril, sayfaBildir, odayiSil, medyaYaz, medyaAl,
    get mod() { return mod; },
    get ben() { return ben; },
    get durum() { return durum; },
    get kisiler() { return kisiler; },
    es, esCevrimici
  };
})();
