/* ============================================================
   MEDYA — fotoğraf küçültme ve ses kaydı
   Hiçbir dış servis kullanmaz; her şey tarayıcıda olur.
   ============================================================ */

const Medya = (function () {

  const FOTO_EN_BOY = 1100;     // uzun kenar (piksel)
  const FOTO_KALITE = 0.68;
  const SES_SANIYE  = 15;       // en fazla kayıt süresi
  const SINIR_BAYT  = 420000;   // ~420 KB veri URL'i üst sınırı

  /* ---------- fotoğraf ---------- */
  function fotografSec() {
    return new Promise((tamam) => {
      const g = document.createElement('input');
      g.type = 'file';
      g.accept = 'image/*';
      g.style.display = 'none';
      g.onchange = async () => {
        const dosya = g.files && g.files[0];
        g.remove();
        if (!dosya) return tamam(null);
        try { tamam(await kucult(dosya)); }
        catch (e) { console.warn('[medya]', e); tamam(null); }
      };
      document.body.appendChild(g);
      g.click();
    });
  }

  function kucult(dosya) {
    return new Promise((tamam, hata) => {
      const okuyucu = new FileReader();
      okuyucu.onerror = () => hata(new Error('dosya okunamadı'));
      okuyucu.onload = () => {
        const resim = new Image();
        resim.onerror = () => hata(new Error('resim açılamadı'));
        resim.onload = () => {
          let { width: en, height: boy } = resim;
          const olcek = Math.min(1, FOTO_EN_BOY / Math.max(en, boy));
          en = Math.round(en * olcek); boy = Math.round(boy * olcek);

          const t = document.createElement('canvas');
          t.width = en; t.height = boy;
          const c = t.getContext('2d');
          c.fillStyle = '#0d0720'; c.fillRect(0, 0, en, boy);
          c.drawImage(resim, 0, 0, en, boy);

          let kalite = FOTO_KALITE, url = t.toDataURL('image/jpeg', kalite);
          // gerekirse kaliteyi düşürerek sınırın altına indir
          while (url.length > SINIR_BAYT && kalite > 0.32) {
            kalite -= 0.1;
            url = t.toDataURL('image/jpeg', kalite);
          }
          tamam({ url, en, boy, bayt: url.length });
        };
        resim.src = okuyucu.result;
      };
      okuyucu.readAsDataURL(dosya);
    });
  }

  /* ---------- ses ---------- */
  function desteklenenTur() {
    if (typeof MediaRecorder === 'undefined') return null;
    const adaylar = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'];
    for (const t of adaylar) {
      try { if (MediaRecorder.isTypeSupported(t)) return t; } catch (e) {}
    }
    return '';   // tarayıcı kendi seçsin
  }

  const sesDestekli = () => typeof MediaRecorder !== 'undefined'
    && !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);

  async function sesKaydiBaslat(ilerleme) {
    const tur = desteklenenTur();
    if (tur === null) throw new Error('Bu tarayıcı ses kaydını desteklemiyor.');
    const akis = await navigator.mediaDevices.getUserMedia({ audio: true });
    const kayitci = new MediaRecorder(akis, tur ? { mimeType: tur } : undefined);
    const parcalar = [];
    kayitci.ondataavailable = (e) => { if (e.data && e.data.size) parcalar.push(e.data); };

    const baslangic = Date.now();
    let sayacT = setInterval(() => {
      const gecen = (Date.now() - baslangic) / 1000;
      if (ilerleme) ilerleme(gecen, SES_SANIYE);
      if (gecen >= SES_SANIYE) bitir();
    }, 100);

    let bittiCoz = null;
    const bitti = new Promise(r => { bittiCoz = r; });

    function temizle() {
      if (sayacT) { clearInterval(sayacT); sayacT = null; }
      akis.getTracks().forEach(p => p.stop());
    }

    kayitci.onstop = () => {
      temizle();
      const yigin = new Blob(parcalar, { type: kayitci.mimeType || 'audio/webm' });
      const o = new FileReader();
      o.onload = () => bittiCoz({
        url: o.result,
        saniye: Math.round((Date.now() - baslangic) / 100) / 10,
        bayt: String(o.result).length
      });
      o.onerror = () => bittiCoz(null);
      o.readAsDataURL(yigin);
    };

    function bitir() { try { if (kayitci.state !== 'inactive') kayitci.stop(); } catch (e) { temizle(); bittiCoz(null); } }
    function iptal() { temizle(); try { kayitci.stop(); } catch (e) {} bittiCoz(null); }

    kayitci.start();
    return { bitir, iptal, bitti };
  }

  return { fotografSec, sesKaydiBaslat, sesDestekli, SINIR_BAYT, SES_SANIYE };
})();
