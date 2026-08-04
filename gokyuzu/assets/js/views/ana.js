/* ============================================================
   ANA SAYFA — evrenin merkezi
   ============================================================ */

Yol.ekle({
  id: 'ana',
  baslik: 'Gökyüzü',
  ikon: '🌌',
  aciklama: 'Her şeyin başladığı yer.',
  renk: 'var(--gül)',
  _sayacT: null,
  _cozUyari: null,

  ciz() {
    const A = window.AYAR;
    const gun = Math.floor(Date.now() / 86400000);
    const mesaj = A.gunlukMesajlar[gun % A.gunlukMesajlar.length];
    const benAd = Kanal.ben.ad || A.ikimiz.ben.ad;

    const kureler = Sayfalar.filter(s => s.id !== 'ana').map((s, i) => `
      <a class="kure" href="#/${s.id}" style="--renk:${s.renk}; animation-delay:${i * 55}ms">
        <span class="ikon">${s.ikon}</span>
        <h3>${s.baslik}</h3>
        <p>${s.kisa || s.aciklama || ''}</p>
        <span class="rozetcik" data-rozet="${s.id}" hidden></span>
      </a>`).join('');

    return `
      <section class="giris-blok">
        <div class="fisilti-yazi">merhaba ${kacir(benAd)}</div>
        <h1>${kacir(window.AYAR.site.baslik)}</h1>
        <p>${kacir(window.AYAR.site.slogan)}</p>
        <div id="beraberSerit"></div>
        <div class="mini-sayac" id="miniSayac"></div>
      </section>

      <div class="kure-agi">${kureler}</div>

      <div class="gunun-mesaji">
        <span class="etiket">Günün mesajı</span>
        <p>${kacir(mesaj)}</p>
      </div>

      <p class="orta sonuk bosluk-ust" id="modBilgi"></p>
    `;
  },

  tak(kap) {
    const A = window.AYAR;
    const baslangic = new Date(String(A.baslangic).replace(' ', 'T')).getTime();

    /* --- canlı sayaç --- */
    const kutu = $('#miniSayac', kap);
    const yaz = () => {
      if (!kutu.isConnected) return;
      const s = gecenSure(baslangic);
      kutu.innerHTML = [
        [s.toplamGun, 'gün'],
        [s.saat, 'saat'],
        [s.dakika, 'dakika'],
        [s.saniye, 'saniye']
      ].map(([v, e]) => `<div><b>${sayiTR(v)}</b><span>${e}</span></div>`).join('');
    };
    yaz();
    this._sayacT = setInterval(yaz, 1000);

    /* --- beraberlik şeridi --- */
    const serit = $('#beraberSerit', kap);
    const seritYaz = () => {
      if (!serit || !serit.isConnected) return;
      const es = Kanal.es();
      const beraber = Kanal.esCevrimici();
      if (beraber) {
        const nerede = es.sayfa && es.sayfa !== 'ana'
          ? ` — şu an <b>${kacir((Sayfalar.find(x => x.id === es.sayfa) || {}).baslik || es.sayfa)}</b> odasında`
          : '';
        serit.innerHTML = `<div class="beraber-serit">✨ <span><b>${kacir(es.ad)}</b> şu anda seninle aynı gökyüzünde${nerede}</span></div>`;
      } else {
        const ad = es ? es.ad : (Kanal.ben.rol === 'ben' ? A.ikimiz.o.ad : A.ikimiz.ben.ad);
        serit.innerHTML = `<div class="beraber-serit yalniz">🌙 <span>${kacir(ad)} şu an burada değil — bıraktığın her şeyi geldiğinde görecek</span></div>`;
      }
    };
    seritYaz();
    this._cozUyari = Kanal.on('*kisiler', seritYaz);

    /* --- rozetler --- */
    const rozetleriYaz = () => {
      Sayfalar.forEach(s => {
        const e = kap.querySelector(`[data-rozet="${s.id}"]`);
        if (!e || typeof s.rozet !== 'function') return;
        const r = s.rozet();
        if (r && r.yazi) {
          e.textContent = r.yazi;
          e.className = 'rozetcik' + (r.sessiz ? ' sessiz' : '');
          e.hidden = false;
        } else { e.hidden = true; }
      });
    };
    rozetleriYaz();
    const c2 = Kanal.on('*', rozetleriYaz);
    const c3 = Kanal.on('*durum', rozetleriYaz);

    /* --- bağlantı modu bilgisi --- */
    const mb = $('#modBilgi', kap);
    if (mb) {
      const modYazi = {
        firebase: 'Canlı bağlantı açık (Firebase) · bıraktığın her iz anında karşı tarafa ulaşır',
        sunucu:   'Canlı bağlantı açık · bıraktığın her iz anında karşı tarafa ulaşır',
        yerel:    'Çevrimdışı mod — canlı kanala bağlanılamadı, veriler bu cihazda tutuluyor'
      };
      mb.innerHTML = (modYazi[Kanal.mod] || modYazi.yerel)
        + ' · <a href="#" id="kimlikDegis" style="color:inherit;text-decoration:underline">ben ' + kacir(Kanal.ben.ad) + ' değilim</a>';
      const kd = $('#kimlikDegis', mb);
      if (kd) kd.onclick = (e) => {
        e.preventDefault();
        Perde.goster({
          baslik: 'Kimliğini değiştir',
          metin: 'Bu cihazda kim olduğunu yeniden seçmek için sayfa yenilenecek.',
          butonlar: [
            { yazi: 'Vazgeç', tur: 'hayalet' },
            { yazi: 'Yeniden seç', tikla: () => {
                Kayit.sil('rol'); sessionStorage.removeItem('ag_oturum');
                location.href = location.pathname;
              } }
          ]
        });
      };
    }

    this._coz = [this._cozUyari, c2, c3];
  },

  sok() {
    if (this._sayacT) clearInterval(this._sayacT);
    (this._coz || []).forEach(f => f && f());
    this._coz = [];
  }
});
