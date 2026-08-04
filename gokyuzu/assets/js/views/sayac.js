/* ============================================================
   SAYAÇ — birlikte geçen zaman ve eğlenceli hesaplar
   ============================================================ */

Yol.ekle({
  id: 'sayac',
  baslik: 'Birlikte Geçen Zaman',
  ikon: '⏳',
  etiket: 'Saniye saniye',
  kisa: 'İlk günden bu yana',
  aciklama: 'İlk günden bu yana geçen her saniye. Ve o saniyelerde olan birkaç şey.',
  renk: 'var(--nane)',

  _t: null,

  rozet() {
    const b = new Date(String(window.AYAR.baslangic).replace(' ', 'T')).getTime();
    const s = gecenSure(b);
    return { yazi: sayiTR(s.toplamGun) + ' gün', sessiz: true };
  },

  ciz() {
    const A = window.AYAR;
    const b = new Date(String(A.baslangic).replace(' ', 'T'));
    const tarihYazi = b.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
    return sayfaBasligi(this, `Her şey <b style="color:var(--altın);font-weight:500">${tarihYazi}</b> tarihinde başladı.`) + `
      <div class="buyuk-sayac" id="buyukSayac"></div>
      <h2 class="bolum-bas">Bu sürede…</h2>
      <div class="istatistik-agi" id="istatistikler"></div>
      <div class="cam" id="sonrakiDonum" style="margin-top:26px;padding:24px;text-align:center"></div>`;
  },

  tak(kap) {
    const A = window.AYAR;
    const baslangic = new Date(String(A.baslangic).replace(' ', 'T')).getTime();
    const buyuk = $('#buyukSayac', kap);
    const ist   = $('#istatistikler', kap);
    const don   = $('#sonrakiDonum', kap);

    /* --- iskeleti BİR KEZ kur (yoksa giriş animasyonu her saniye baştan başlar) --- */
    const birimler = [
      ['yil', 'yıl'], ['ay', 'ay'], ['gun', 'gün'],
      ['saat', 'saat'], ['dakika', 'dakika'], ['saniye', 'saniye']
    ];
    buyuk.innerHTML = birimler.map(([k, e]) =>
      `<div class="sayac-birim"><b data-b="${k}">00</b><span>${e}</span></div>`).join('');

    const olcumler = [
      ['💓', s => sayiTR(s.toplamDakika * 75 * 2), 'kez kalbimiz attı (ikisi birden)'],
      ['🌅', s => sayiTR(s.toplamGun),             'kez güneş doğdu, hepsi bizim'],
      ['🌕', s => sayiTR(s.toplamGun / 29.53),     'dolunay geçti üstümüzden'],
      ['☕', s => sayiTR(s.toplamGun * 2),         'fincan kahve içmişizdir, aşağı yukarı'],
      ['😴', s => sayiTR(s.toplamGun * 8),         'saat uyuduk, çoğu yan yana'],
      ['🌍', s => sayiTR(s.toplamGun * 2570000),   'km yol aldı dünya, biz üstündeyken'],
      ['💬', s => sayiTR(s.toplamGun * 3),         'kez "seni seviyorum" demişimdir, en az'],
      ['🎵', s => sayiTR(s.toplamGun * 6),         'şarkı dinledik, bazıları hep senin oldu']
    ];
    ist.innerHTML = olcumler.map(([ikon, , yazi], k) =>
      `<div class="istatistik" style="animation-delay:${k * 45}ms">
         <span class="ikon">${ikon}</span><b data-o="${k}">—</b><span>${yazi}</span>
       </div>`).join('');

    don.innerHTML = `<span class="etiket">Sıradaki dönüm noktası</span>
      <p style="margin:10px 0 0;font-size:16px;line-height:1.8;color:var(--mürekkep-yumusak)">
        <b style="color:#fff;font-weight:500" data-d="bin">—</b> sonra
        <span data-d="binHedef">—</span>. günümüz ·
        <b style="color:#fff;font-weight:500" data-d="yil">—</b> sonra yıl dönümümüz
      </p>`;

    const bAlan = {}; birimler.forEach(([k]) => bAlan[k] = $(`[data-b="${k}"]`, buyuk));
    const oAlan = olcumler.map((_, k) => $(`[data-o="${k}"]`, ist));
    const dAlan = { bin: $('[data-d="bin"]', don), binHedef: $('[data-d="binHedef"]', don), yil: $('[data-d="yil"]', don) };

    /* --- sadece değerleri tazele (DOM yeniden kurulmuyor) --- */
    let sonGun = -1;
    const yaz = () => {
      if (!buyuk.isConnected) return;
      const s = gecenSure(baslangic);

      birimler.forEach(([k]) => {
        const yeni = iki(s[k]);
        if (bAlan[k] && bAlan[k].textContent !== yeni) bAlan[k].textContent = yeni;
      });

      // gün değişmedikçe bu hesapları tekrar yapmaya gerek yok
      if (s.toplamGun !== sonGun) {
        sonGun = s.toplamGun;
        olcumler.forEach(([, hesap], k) => { if (oAlan[k]) oAlan[k].textContent = hesap(s); });

        const binler = Math.floor(s.toplamGun / 1000) * 1000 + 1000;
        const yilDonumu = new Date(baslangic);
        yilDonumu.setFullYear(new Date().getFullYear());
        if (yilDonumu.getTime() < Date.now()) yilDonumu.setFullYear(yilDonumu.getFullYear() + 1);

        dAlan.bin.textContent      = sayiTR(binler - s.toplamGun) + ' gün';
        dAlan.binHedef.textContent = sayiTR(binler);
        dAlan.yil.textContent      = sayiTR(Math.ceil((yilDonumu.getTime() - Date.now()) / 86400000)) + ' gün';
      }
    };

    yaz();
    this._t = setInterval(yaz, 1000);
  },

  sok() { if (this._t) { clearInterval(this._t); this._t = null; } }
});
