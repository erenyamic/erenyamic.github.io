/* ============================================================
   MEKTUP — zarfı aç, satırlar tek tek yazılsın
   ============================================================ */

Yol.ekle({
  id: 'mektup',
  baslik: 'Sana Bir Mektup',
  ikon: '💌',
  etiket: 'Kapanış',
  kisa: 'Zarfı açmayı unutma',
  aciklama: 'Bu sitedeki her şeyi bunun için yaptım. Zarfa dokun.',
  renk: '#ffe6a7',

  _t: null,

  ciz() {
    return sayfaBasligi(this) + `
      <div class="mektup-alan" id="mektupAlan">
        <button style="background:none;border:0;cursor:pointer;display:grid;place-items:center;gap:18px" id="zarfTus">
          <span class="zarf"></span>
          <span class="dugme">Zarfı aç</span>
        </button>
      </div>`;
  },

  tak(kap) {
    const alan = $('#mektupAlan', kap);
    const tus = $('#zarfTus', kap);
    const M = window.AYAR.mektup;
    const self = this;

    tus.onclick = () => {
      Konfeti.patlat(60);
      Muzik.efekt('basari');
      Arkaplan.yildizYagdir(4);
      tikla(20);

      alan.innerHTML = `<div class="mektup-kagit">
          <p class="hitap">${kacir(M.hitap)}</p>
          <div class="govde" id="mektupGovde"></div>
          <p class="imza" id="mektupImza" style="opacity:0">${kacir(M.imza)}</p>
        </div>`;

      const govde = $('#mektupGovde', kap);
      const imza = $('#mektupImza', kap);

      // <br> etiketlerini koruyarak daktilo etkisi
      const parcalar = String(M.metin).split(/(<br\s*\/?>)/i).filter(x => x !== '');
      let pi = 0, ci = 0, html = '';
      const imlec = '<span class="imlec-carp"></span>';

      const yaz = () => {
        if (pi >= parcalar.length) {
          govde.innerHTML = html;
          imza.style.transition = 'opacity 1.2s ease';
          imza.style.opacity = '1';
          if (self._t) { clearInterval(self._t); self._t = null; }
          return;
        }
        const p = parcalar[pi];
        if (/^<br/i.test(p)) { html += p; pi++; ci = 0; }
        else {
          const adim = 2;
          html += kacir(p.slice(ci, ci + adim));
          ci += adim;
          if (ci >= p.length) { pi++; ci = 0; }
        }
        govde.innerHTML = html + imlec;
        govde.scrollIntoView({ block: 'nearest' });
      };

      if (self._t) clearInterval(self._t);
      self._t = setInterval(yaz, 26);

      // sabırsızlar için: dokununca hepsini göster
      // (zarfı açan tıklama bu dinleyiciyi tetiklemesin diye biraz geciktiriyoruz)
      setTimeout(() => {
        alan.addEventListener('click', () => {
          if (!self._t) return;
          clearInterval(self._t); self._t = null;
          govde.innerHTML = M.metin;
          imza.style.transition = 'opacity .5s ease';
          imza.style.opacity = '1';
        }, { once: true });
      }, 500);
    };
  },

  sok() { if (this._t) { clearInterval(this._t); this._t = null; } }
});
