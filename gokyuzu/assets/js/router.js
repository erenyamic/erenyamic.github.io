/* ============================================================
   YÖNLENDİRİCİ — adres çubuğundaki #/... ile sayfa değiştirir
   (sunucu ayarı gerektirmez; her statik sunucuda çalışır)
   ============================================================ */

const Sayfalar = [];

const Yol = (function () {
  const kayit = {};
  let simdiki = null;
  let ilk = true;

  function ekle(sayfa) {
    kayit[sayfa.id] = sayfa;
    Sayfalar.push(sayfa);
  }

  function git(id) { location.hash = '#/' + id; }

  function suan() {
    const h = (location.hash || '').replace(/^#\/?/, '').split('?')[0].trim();
    return h || 'ana';
  }

  function coz() {
    const id = suan();
    const s = kayit[id] || kayit['ana'];
    if (!s) return;
    if (simdiki === s && !ilk) return;

    const kap = document.getElementById('uygulama');
    const yaz = () => {
      if (simdiki && simdiki.sok) { try { simdiki.sok(); } catch (e) { console.error(e); } }
      kap.innerHTML = typeof s.ciz === 'function' ? s.ciz() : '';
      kap.classList.remove('cikis');
      window.scrollTo({ top: 0, behavior: ilk ? 'auto' : 'instant' });
      simdiki = s;
      document.documentElement.style.setProperty('--vurgu', s.renk || 'var(--gül)');
      if (typeof Kanal !== 'undefined') Kanal.sayfaBildir(s.id);
      if (typeof s.tak === 'function') { try { s.tak(kap); } catch (e) { console.error(e); } }
      ilk = false;
    };

    if (ilk) { yaz(); return; }
    kap.classList.add('cikis');
    setTimeout(yaz, 190);
  }

  function basla() {
    addEventListener('hashchange', coz);
    coz();
  }

  return { ekle, git, basla, suan, coz, get sayfa() { return simdiki; } };
})();

/* Sayfa başlığı kalıbı */
function sayfaBasligi(s, altYazi) {
  return `<header class="sayfa-bas">
    <a class="geri" href="#/ana">← Gökyüzü</a>
    <span class="etiket">${s.etiket || ''}</span>
    <h1>${s.baslik}</h1>
    <p>${altYazi || s.aciklama || ''}</p>
  </header>`;
}
