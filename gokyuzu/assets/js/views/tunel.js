/* ============================================================
   ZAMAN TÜNELİ — hikâyenin kilometre taşları
   ============================================================ */

Yol.ekle({
  id: 'tunel',
  baslik: 'Zaman Tüneli',
  ikon: '🕰️',
  etiket: 'Bizim hikâyemiz',
  kisa: 'Baştan bugüne',
  aciklama: 'İlk günden bugüne, en başa dönüp bir daha bakalım.',
  renk: '#9db8ff',

  _goz: null,

  ciz() {
    const T = window.AYAR.zamanTuneli || [];
    if (!T.length) {
      return sayfaBasligi(this) + `<div class="yok-uyari">Zaman tüneli henüz boş.<br>
        <code>assets/js/config.js</code> içindeki <b>zamanTuneli</b> listesine anılarınızı ekle.</div>`;
    }
    return sayfaBasligi(this) + `<div class="tunel">${
      T.map((o, i) => `
        <div class="tunel-oge ${i % 2 ? 'sag' : 'sol'}">
          <span class="tunel-nokta"></span>
          <div class="tunel-kart">
            ${o.foto ? `<img src="${kacir(o.foto)}" alt="" loading="lazy">` : ''}
            <span class="tarih">${kacir(o.tarih)}</span>
            <h3>${kacir(o.baslik)}</h3>
            <p>${kacir(o.metin)}</p>
          </div>
        </div>`).join('')
    }</div>
    <p class="orta sonuk" style="margin-top:20px">Devamı yazılıyor…</p>`;
  },

  tak(kap) {
    const kartlar = $$('.tunel-kart', kap);
    if (!('IntersectionObserver' in window)) {
      kartlar.forEach(k => k.classList.add('gorundu'));
      return;
    }
    this._goz = new IntersectionObserver((girdiler) => {
      girdiler.forEach(g => {
        if (g.isIntersecting) {
          g.target.classList.add('gorundu');
          this._goz.unobserve(g.target);
        }
      });
    }, { threshold: .18, rootMargin: '0px 0px -40px 0px' });
    kartlar.forEach(k => this._goz.observe(k));
  },

  sok() { if (this._goz) { this._goz.disconnect(); this._goz = null; } }
});
