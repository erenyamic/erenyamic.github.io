/* ============================================================
   GÜNLÜK SORU — her gün bir soru, ikinizin cevabı, biriken arşiv
   ============================================================ */

Yol.ekle({
  id: 'gunluk',
  baslik: 'Günün Sorusu',
  ikon: '📔',
  etiket: 'Her gün yeni',
  kisa: 'Bugün ne diyorsun?',
  aciklama: 'Her gün yeni bir soru. İkiniz de cevaplayınca birbirinizinkini görüyorsunuz. Cevaplar birikiyor — bir yıl sonra bugüne dönüp bakacaksınız.',
  renk: '#a2ffe0',

  _coz: [], _arsivAcik: false,

  gunAnahtari(d) {
    const t = d || new Date();
    return t.getFullYear() + '-' + iki(t.getMonth() + 1) + '-' + iki(t.getDate());
  },

  soruSec(anahtar) {
    const S = window.AYAR.gunlukSorular || [];
    if (!S.length) return 'Bugün nasıl geçti?';
    // tarihten türetilen sabit bir seçim: aynı gün herkeste aynı soru
    let h = 0;
    for (let i = 0; i < anahtar.length; i++) h = (h * 31 + anahtar.charCodeAt(i)) >>> 0;
    return S[h % S.length];
  },

  rozet() {
    const bugun = this.gunAnahtari();
    const c = (Kanal.durum.gunluk || {})[bugun] || {};
    if (c[Kanal.ben.id]) return Object.keys(c).length >= 2
      ? { yazi: 'cevaplandı', sessiz: true } : { yazi: 'bekleniyor', sessiz: true };
    return { yazi: 'yeni soru' };
  },

  ciz() { return sayfaBasligi(this) + `<div id="gunlukGovde"></div>`; },

  tak(kap) {
    const self = this;
    const govde = $('#gunlukGovde', kap);

    const ciz = () => {
      if (!govde.isConnected) return;
      const bugun = self.gunAnahtari();
      const soru  = self.soruSec(bugun);
      const hepsi = Kanal.durum.gunluk || {};
      const c     = hepsi[bugun] || {};
      const benim = c[Kanal.ben.id];
      const esKisi = Kanal.es();
      const onun  = Object.entries(c).filter(([k]) => k !== Kanal.ben.id).map(([, v]) => v)[0];

      const gecmis = Object.keys(hepsi)
        .filter(g => g !== bugun && Object.keys(hepsi[g] || {}).length)
        .sort().reverse();

      // "geçen yıl bugün"
      const gecenYil = new Date();
      gecenYil.setFullYear(gecenYil.getFullYear() - 1);
      const gy = hepsi[self.gunAnahtari(gecenYil)];

      govde.innerHTML = `
        <div class="cam soru-kart" style="text-align:left">
          <span class="etiket">${new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          <h2 style="text-align:center">${kacir(soru)}</h2>

          ${benim ? `
            <div class="gunluk-cevap benim">
              <span class="kim">${kacir(Kanal.ben.ad)}</span>
              <p>${kacir(benim.metin)}</p>
            </div>
            ${onun ? `
              <div class="gunluk-cevap onun">
                <span class="kim">${kacir(onun.ad)}</span>
                <p>${kacir(onun.metin)}</p>
              </div>`
            : `<div class="bekleme-serit">
                 <span class="nokta-yukle"><i></i><i></i><i></i></span>
                 ${kacir((esKisi || {}).ad || 'Eşin')} henüz cevaplamadı — cevabı gelince burada belirecek
               </div>`}
            <div class="satir orta" style="margin-top:16px">
              <button class="dugme hayalet kucuk" id="gunlukDuzelt">Cevabımı değiştir</button>
            </div>`
          : `
            <form id="gunlukForm" style="margin-top:6px">
              <textarea id="gunlukMetin" rows="4" maxlength="1000"
                placeholder="Bugün için yaz…"></textarea>
              <div class="satir orta" style="margin-top:12px">
                <button class="dugme" type="submit">Cevabımı bırak</button>
              </div>
              <p class="sonuk orta" style="margin-top:10px">
                ${kacir((esKisi || {}).ad || 'Eşin')} cevaplayana kadar kimse seninkini görmeyecek.
              </p>
            </form>`}
        </div>

        ${gy ? `<div class="gecen-yil">
            <span class="etiket">Geçen yıl bugün</span>
            ${Object.values(gy).map(v => `<p><b>${kacir(v.ad)}:</b> ${kacir(v.metin)}</p>`).join('')}
          </div>` : ''}

        ${gecmis.length ? `
          <h2 class="bolum-bas">Arşiv <span class="sonuk" style="font-size:13px;font-weight:400">${gecmis.length} gün</span></h2>
          <div id="arsiv">${gecmis.slice(0, self._arsivAcik ? gecmis.length : 5).map(g => {
            const gc = hepsi[g];
            return `<div class="arsiv-gun">
              <span class="tarih">${new Date(g + 'T00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              <p class="soru">${kacir(self.soruSec(g))}</p>
              ${Object.values(gc).map(v => `<p class="cevap"><b>${kacir(v.ad)}:</b> ${kacir(v.metin)}</p>`).join('')}
            </div>`;
          }).join('')}</div>
          ${gecmis.length > 5 ? `<div class="satir orta" style="margin-top:14px">
            <button class="dugme hayalet kucuk" id="arsivTus">${self._arsivAcik ? 'Daha az göster' : 'Tümünü göster'}</button>
          </div>` : ''}` : ''}`;

      const form = $('#gunlukForm', govde);
      if (form) {
        form.onsubmit = (e) => {
          e.preventDefault();
          const t = $('#gunlukMetin', govde).value.trim();
          if (!t) return;
          Kanal.yolla('gunluk', { gun: bugun, metin: t });
          Muzik.efekt('yildiz');
          tikla(14);
        };
      }
      const duzelt = $('#gunlukDuzelt', govde);
      if (duzelt) duzelt.onclick = () => {
        const yeni = prompt('Cevabını güncelle:', benim.metin);
        if (yeni !== null && yeni.trim()) Kanal.yolla('gunluk', { gun: bugun, metin: yeni.trim() });
      };
      const arsivTus = $('#arsivTus', govde);
      if (arsivTus) arsivTus.onclick = () => { self._arsivAcik = !self._arsivAcik; ciz(); };
    };

    ciz();
    this._coz = [
      Kanal.on('gunluk', ciz),
      Kanal.on('*durum', ciz),
      Kanal.on('*kisiler', ciz)
    ];
  },

  sok() { (this._coz || []).forEach(f => f && f()); this._coz = []; }
});
