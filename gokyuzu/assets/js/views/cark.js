/* ============================================================
   ÇARK — biri çeviriyor, ikisinin ekranında aynı anda dönüyor
   ============================================================ */

Yol.ekle({
  id: 'cark',
  baslik: 'Kader Çarkı',
  ikon: '🎡',
  etiket: 'Senkron dönüş',
  kisa: 'Bu akşam ne yapsak?',
  aciklama: 'Biriniz çevirdiğinde çark ikinizin ekranında da aynı anda dönmeye başlıyor ve aynı yerde duruyor.',
  renk: 'var(--şeftali)',

  _coz: [], _don: 0, _animT: null, _doniyor: false,

  rozet() {
    const c = Kanal.durum.cark;
    if (!c) return null;
    const s = window.AYAR.carkSecenekleri[c.no];
    return s ? { yazi: s, sessiz: true } : null;
  },

  ciz() {
    return sayfaBasligi(this) + `
      <div class="cark-alan">
        <div class="cark-kutu">
          <div class="cark-ok"></div>
          <canvas id="cark" width="800" height="800"></canvas>
          <div class="cark-gobek">💫</div>
        </div>
        <button class="dugme" id="carkTus">Çarkı çevir</button>
        <div class="cark-sonuc" id="carkSonuc"></div>
      </div>`;
  },

  tak(kap) {
    const self = this;
    const tuval = $('#cark', kap);
    const ctx = tuval.getContext('2d');
    const tus = $('#carkTus', kap);
    const sonuc = $('#carkSonuc', kap);
    const S = window.AYAR.carkSecenekleri;
    const N = S.length;
    const dilim = (Math.PI * 2) / N;
    const B = tuval.width, M = B / 2, R = M - 14;

    const renkler = ['#ff8fab', '#c8a2ff', '#7ee8fa', '#ffd97d', '#8affc1', '#ffa87d',
                     '#ff9de2', '#9db8ff', '#ffe6a7', '#a2ffe0'];

    function ciz(don) {
      ctx.clearRect(0, 0, B, B);
      for (let i = 0; i < N; i++) {
        const b1 = i * dilim + don, b2 = (i + 1) * dilim + don;
        ctx.beginPath();
        ctx.moveTo(M, M);
        ctx.arc(M, M, R, b1, b2);
        ctx.closePath();
        ctx.fillStyle = renkler[i % renkler.length];
        ctx.globalAlpha = .92;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = 'rgba(10,5,22,.5)';
        ctx.lineWidth = 3;
        ctx.stroke();

        // yazı — sol yarıdaki dilimlerde ters durmasın diye 180° çevriliyor
        const orta = b1 + dilim / 2;
        ctx.save();
        ctx.translate(M, M);
        ctx.rotate(orta);
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#1a0d2b';
        ctx.font = '600 34px Outfit, system-ui, sans-serif';
        const ham = String(S[i] || '');
        const yazi = ham.length > 16 ? ham.slice(0, 15) + '…' : ham;
        if (Math.cos(orta) < 0) {           // dilim sola bakıyor
          ctx.rotate(Math.PI);
          ctx.textAlign = 'left';
          ctx.fillText(yazi, -(R - 26), 0);
        } else {
          ctx.textAlign = 'right';
          ctx.fillText(yazi, R - 26, 0);
        }
        ctx.restore();
      }
      // dış halka
      ctx.beginPath(); ctx.arc(M, M, R, 0, 6.2832);
      ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 6; ctx.stroke();
    }

    function hedefAci(no) {
      // seçilen dilimin ortası tam yukarıyı (-90°) göstersin
      return -Math.PI / 2 - (no * dilim + dilim / 2);
    }

    function sonucYaz(no, ad, taze) {
      if (!sonuc.isConnected) return;
      sonuc.innerHTML = `<p class="buyuk">${kacir(S[no])}</p>
        <p class="kucuk">${taze ? (ad ? kacir(ad) + ' çevirdi' : '') : 'son sonuç'} · itiraz yok 🙂</p>`;
    }

    function cevir(no, ad, benMi) {
      if (self._doniyor) return;
      self._doniyor = true;
      tus.disabled = true;
      sonuc.innerHTML = `<p class="buyuk">Dönüyor…</p><p class="kucuk">${ad ? kacir(ad) + ' çevirdi' : ''}</p>`;

      const baslangic = self._don;
      let hedef = hedefAci(no);
      const tam = Math.PI * 2;
      let fark = ((hedef - baslangic) % tam + tam) % tam;
      const bitis = baslangic + fark + tam * 6;
      const sure = 4600;
      const t0 = performance.now();

      function adim(t) {
        const p = Math.min(1, (t - t0) / sure);
        const e = 1 - Math.pow(1 - p, 4);
        self._don = baslangic + (bitis - baslangic) * e;
        ciz(self._don);
        if (p < 1) self._animT = requestAnimationFrame(adim);
        else {
          self._doniyor = false;
          tus.disabled = false;
          sonucYaz(no, ad, true);
          Konfeti.patlat(45);
          Muzik.efekt('basari');
          tikla(24);
        }
      }
      self._animT = requestAnimationFrame(adim);
    }

    tus.onclick = () => {
      if (self._doniyor) return;
      const no = Math.floor(Math.random() * N);
      tus.disabled = true;
      sonuc.innerHTML = `<p class="buyuk">Çevriliyor…</p><p class="kucuk">ikinizin ekranında birden başlayacak</p>`;
      Kanal.yolla('cark-sonuc', { no });
      // sunucu yankısı gelmezse (çevrimdışı) kilitlenmeyelim
      setTimeout(() => { if (!self._doniyor) tus.disabled = false; }, 2500);
    };

    // başlangıç durumu
    const onceki = Kanal.durum.cark;
    if (onceki && typeof onceki.no === 'number') {
      self._don = hedefAci(onceki.no);
      sonucYaz(onceki.no, onceki.ad, false);
    }
    ciz(self._don);

    this._coz = [
      Kanal.on('cark-sonuc', (v, olay) => cevir(v.no, olay.ad, olay.benMi))
    ];
  },

  sok() {
    if (this._animT) cancelAnimationFrame(this._animT);
    this._doniyor = false;
    (this._coz || []).forEach(f => f && f());
    this._coz = [];
  }
});
