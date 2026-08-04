/* ============================================================
   KALP SENKRONU — ikiniz aynı anda basılı tutunca açılan sır
   ============================================================ */

Yol.ekle({
  id: 'senkron',
  baslik: 'Kalp Senkronu',
  ikon: '💗',
  etiket: 'Aynı anda',
  kisa: 'Aynı anda basılı tutun',
  aciklama: 'İkiniz de kalbe aynı anda basılı tuttuğunuzda bir şey açılıyor. Tek başına olmuyor — bu oyunun bütün meselesi bu.',
  renk: 'var(--gül)',

  _t: null, _nabizT: null, _coz: [],
  _benBasili: false, _oSon: 0, _ilerleme: 0, _kilit: false,

  rozet() {
    const n = (Kanal.durum.senkron || {}).sayi || 0;
    return n ? { yazi: n + '× senkron', sessiz: true } : null;
  },

  ciz() {
    const A = window.AYAR;
    const benRenk = A.ikimiz[Kanal.ben.rol === 'o' ? 'o' : 'ben'].renk;
    const oRenk   = A.ikimiz[Kanal.ben.rol === 'o' ? 'ben' : 'o'].renk;
    const esAd    = (Kanal.es() || {}).ad || A.ikimiz[Kanal.ben.rol === 'o' ? 'ben' : 'o'].ad;

    return sayfaBasligi(this) + `
      <div class="senkron-alan">
        <div class="iki-nabiz">
          <div class="nabiz-kutu" id="nabizBen" style="--renk:${benRenk};color:${benRenk}">
            <span class="top"></span><span>${kacir(Kanal.ben.ad)}</span>
          </div>
          <div class="nabiz-kutu" id="nabizO" style="--renk:${oRenk};color:${oRenk}">
            <span class="top"></span><span>${kacir(esAd)}</span>
          </div>
        </div>

        <button class="kalp-tus" id="kalpTus" aria-label="Basılı tut">
          <svg class="halka" viewBox="0 0 100 100" aria-hidden="true">
            <defs>
              <linearGradient id="kalpGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%"  stop-color="#7ee8fa"/>
                <stop offset="100%" stop-color="#ff8fab"/>
              </linearGradient>
            </defs>
            <circle class="iz"    cx="50" cy="50" r="45"/>
            <circle class="dolgu" cx="50" cy="50" r="45"
                    stroke-dasharray="282.74" stroke-dashoffset="282.74"/>
          </svg>
          <span class="kalp">💗</span>
        </button>

        <div class="senkron-durum" id="senkronDurum"></div>
        <div id="senkronMesajKutu"></div>
      </div>`;
  },

  tak(kap) {
    const self  = this;
    const tus   = $('#kalpTus', kap);
    const dolgu = $('.dolgu', tus);
    const durum = $('#senkronDurum', kap);
    const kutu  = $('#senkronMesajKutu', kap);
    const nBen  = $('#nabizBen', kap);
    const nO    = $('#nabizO', kap);
    const CEVRE = 282.74;
    const HEDEF = 3200;  // ms

    self._ilerleme = 0; self._benBasili = false; self._oSon = 0; self._kilit = false;

    const oBasiliMi = () => (Date.now() - self._oSon) < 2600;

    const durumYaz = () => {
      if (!durum.isConnected) return;
      const esAcik = Kanal.esCevrimici();
      const es = Kanal.es();
      const sayi = (Kanal.durum.senkron || {}).sayi || 0;
      let buyuk, kucuk;

      if (self._kilit) { buyuk = 'Senkron! 💥'; kucuk = 'Kalpleriniz aynı anda attı.'; }
      else if (!esAcik) {
        buyuk = 'Bekliyoruz…';
        kucuk = `${kacir((es || {}).ad || 'Eşin')} gökyüzüne girdiğinde bu kalp çalışacak. Linki ona gönder ve aynı anda basın.`;
      }
      else if (self._benBasili && oBasiliMi()) { buyuk = 'İkiniz de basılı tutuyorsunuz…'; kucuk = 'Bırakmayın.'; }
      else if (self._benBasili) { buyuk = 'Sen basıyorsun'; kucuk = `${kacir((es || {}).ad || '')} bırakmasın diye bekliyoruz…`; }
      else if (oBasiliMi()) { buyuk = `${kacir((es || {}).ad || 'Eşin')} basıyor!`; kucuk = 'Hemen sen de bas.'; }
      else { buyuk = 'Hazırsınız'; kucuk = 'Üçe kadar sayın ve aynı anda kalbe basılı tutun.'; }

      durum.innerHTML = `<p class="buyuk">${buyuk}</p><p class="kucuk">${kucuk}${sayi ? ` · bugüne kadar ${sayi} kez başardınız` : ''}</p>`;
      tus.classList.toggle('hazir', esAcik && !self._benBasili && !self._kilit);
      nBen.classList.toggle('aktif', self._benBasili);
      nO.classList.toggle('aktif', oBasiliMi());
    };

    const basariGoster = (mesaj) => {
      kutu.innerHTML = `<div class="acilan-mesaj"><span class="etiket">Açılan mesaj</span><p>${kacir(mesaj)}</p></div>`;
    };

    const basari = () => {
      if (self._kilit) return;
      self._kilit = true;
      self._ilerleme = HEDEF;
      Konfeti.patlat(90);
      Arkaplan.yildizYagdir(5);
      Muzik.efekt('basari');
      tikla([30, 60, 30]);

      // Aynı olayın iki kez sayılmaması için sadece bir taraf gönderir.
      const es = Kanal.es();
      const gonderenBenim = !es || [Kanal.ben.id, es.id].sort()[0] === Kanal.ben.id;
      if (gonderenBenim) Kanal.yolla('senkron-basarili', {});

      const A = window.AYAR;
      const n = ((Kanal.durum.senkron || {}).sayi || 0);
      basariGoster(A.senkronMesajlari[n % A.senkronMesajlari.length]);
      durumYaz();

      setTimeout(() => {
        self._kilit = false; self._ilerleme = 0;
        dolgu.style.strokeDashoffset = CEVRE;
        durumYaz();
      }, 4200);
    };

    /* --- ana döngü --- */
    self._t = setInterval(() => {
      if (!tus.isConnected) return;
      if (!self._kilit) {
        const ikisi = self._benBasili && oBasiliMi();
        if (ikisi) self._ilerleme = Math.min(HEDEF, self._ilerleme + 60);
        else self._ilerleme = Math.max(0, self._ilerleme - (self._benBasili ? 30 : 120));
        dolgu.style.strokeDashoffset = CEVRE * (1 - self._ilerleme / HEDEF);
        if (self._ilerleme >= HEDEF) basari();
      }
      durumYaz();
    }, 60);

    /* --- basılı tutma --- */
    const basla = (e) => {
      e.preventDefault();
      if (self._benBasili) return;
      self._benBasili = true;
      tus.classList.add('basili');
      Kanal.yolla('basili', { d: 1 });
      tikla(14);
      if (self._nabizT) clearInterval(self._nabizT);
      self._nabizT = setInterval(() => { if (self._benBasili) Kanal.yolla('basili', { d: 1 }); }, 1200);
      durumYaz();
    };
    const bitir = () => {
      if (!self._benBasili) return;
      self._benBasili = false;
      tus.classList.remove('basili');
      if (self._nabizT) { clearInterval(self._nabizT); self._nabizT = null; }
      Kanal.yolla('basili', { d: 0 });
      durumYaz();
    };

    tus.addEventListener('pointerdown', basla);
    addEventListener('pointerup', bitir);
    addEventListener('pointercancel', bitir);
    tus.addEventListener('contextmenu', e => e.preventDefault());
    self._bitir = bitir;

    /* --- karşı tarafın basışı --- */
    const dinle = Kanal.on('basili', (v, olay) => {
      if (olay.benMi) return;
      if (v && v.d) self._oSon = Date.now();
      else self._oSon = 0;
      durumYaz();
    });
    const dinle2 = Kanal.on('senkron-basarili', (v, olay) => {
      if (olay.benMi) return;
      if (!self._kilit) { self._kilit = true; Konfeti.patlat(70); Muzik.efekt('basari'); }
      const A = window.AYAR;
      const n = Math.max(0, ((Kanal.durum.senkron || {}).sayi || 1) - 1);
      basariGoster(A.senkronMesajlari[n % A.senkronMesajlari.length]);
      setTimeout(() => { self._kilit = false; self._ilerleme = 0; dolgu.style.strokeDashoffset = CEVRE; }, 4200);
    });
    const dinle3 = Kanal.on('*kisiler', durumYaz);

    self._coz = [dinle, dinle2, dinle3];
    durumYaz();
  },

  sok() {
    if (this._t) clearInterval(this._t);
    if (this._nabizT) clearInterval(this._nabizT);
    if (this._benBasili) { this._benBasili = false; Kanal.yolla('basili', { d: 0 }); }
    if (this._bitir) { removeEventListener('pointerup', this._bitir); removeEventListener('pointercancel', this._bitir); }
    (this._coz || []).forEach(f => f && f());
    this._coz = [];
  }
});
