/* ============================================================
   AŞK KUPONLARI — biri kullandığında diğerine anında düşer
   ============================================================ */

Yol.ekle({
  id: 'kuponlar',
  baslik: 'Aşk Kuponları',
  ikon: '🎟️',
  etiket: 'Tek kullanımlık',
  kisa: 'Kullan, anında haber gitsin',
  aciklama: 'Bir kuponu kullandığın anda eşinin ekranına bildirim düşer. Sözünü tutmak zorundasın.',
  renk: 'var(--altın)',

  _coz: [],

  rozet() {
    const k = Object.keys(Kanal.durum.kuponlar || {}).length;
    const t = window.AYAR.kuponlar.length;
    return { yazi: (t - k) + ' kupon', sessiz: k >= t };
  },

  ciz() {
    return sayfaBasligi(this) + `
      <div class="kupon-agi" id="kuponAgi"></div>
      <div class="satir orta" style="margin-top:26px">
        <button class="dugme hayalet kucuk" id="kuponSifirla">Tüm kuponları yenile</button>
      </div>`;
  },

  tak(kap) {
    const agi = $('#kuponAgi', kap);
    const K = window.AYAR.kuponlar;

    const cizAll = () => {
      if (!agi.isConnected) return;
      const kul = Kanal.durum.kuponlar || {};
      agi.innerHTML = K.map((k, i) => {
        const k2 = kul[String(i)];
        const tarih = k2 ? new Date(k2.t * 1000).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' }) : '';
        return `<article class="kupon ${k2 ? 'kullanildi' : ''}" style="animation-delay:${i * 40}ms">
          ${k2 ? '<span class="damga">Kullanıldı</span>' : ''}
          <span class="ikon">${k.ikon}</span>
          <h3>${kacir(k.baslik)}</h3>
          <p>${kacir(k.aciklama)}</p>
          ${k2
            ? `<span class="kim-kullandi">${kacir(k2.ad)} · ${tarih}</span>`
            : `<button class="dugme kucuk" data-no="${i}">Kullan</button>`}
        </article>`;
      }).join('');

      $$('.kupon .dugme', agi).forEach(b => {
        b.onclick = () => {
          const no = +b.dataset.no;
          Perde.goster({
            baslik: K[no].ikon + ' ' + K[no].baslik,
            metin: 'Bu kuponu şimdi kullanıyorsun. Eşinin ekranına anında bildirim gidecek — geri dönüşü yok.',
            butonlar: [
              { yazi: 'Şimdi değil', tur: 'hayalet' },
              { yazi: 'Kullan gitsin', tikla: () => {
                  Kanal.yolla('kupon', { no });
                  Konfeti.patlat(40);
                  Muzik.efekt('basari');
                  tikla(20);
                } }
            ]
          });
        };
      });
    };

    $('#kuponSifirla', kap).onclick = () => {
      Perde.goster({
        baslik: 'Kuponları yenile',
        metin: 'Kullanılmış bütün kuponlar tekrar kullanılabilir hale gelecek. Onaylıyor musun?',
        butonlar: [
          { yazi: 'Vazgeç', tur: 'hayalet' },
          { yazi: 'Yenile', tikla: () => Kanal.yolla('kupon-sifirla', {}) }
        ]
      });
    };

    cizAll();
    this._coz = [
      Kanal.on('kupon', cizAll),
      Kanal.on('kupon-sifirla', cizAll),
      Kanal.on('*durum', cizAll)
    ];
  },

  sok() { (this._coz || []).forEach(f => f && f()); this._coz = []; }
});
