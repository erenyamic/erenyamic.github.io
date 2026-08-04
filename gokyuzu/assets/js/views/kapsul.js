/* ============================================================
   ZAMAN KAPSÜLÜ — bugün yaz, ileri bir tarihte birlikte açın
   ============================================================ */

Yol.ekle({
  id: 'kapsul',
  baslik: 'Zaman Kapsülü',
  ikon: '⏳',
  etiket: 'Geleceğe mektup',
  kisa: 'İleri bir tarihte açılsın',
  aciklama: 'Bugün yazıyorsun, açılış tarihini sen belirliyorsun. O gün gelene kadar kimse okuyamıyor — o gün ikinize birden açılıyor.',
  renk: '#c8a2ff',

  _coz: [],

  bugunAnahtar() {
    const d = new Date();
    return d.getFullYear() + '-' + iki(d.getMonth() + 1) + '-' + iki(d.getDate());
  },

  rozet() {
    const k = Kanal.durum.kapsul || [];
    if (!k.length) return null;
    const bugun = this.bugunAnahtar();
    const acilan = k.filter(x => x.acilis <= bugun).length;
    return acilan ? { yazi: acilan + ' açıldı' } : { yazi: k.length + ' kapsül', sessiz: true };
  },

  ciz() {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    const varsayilan = d.getFullYear() + '-' + iki(d.getMonth() + 1) + '-' + iki(d.getDate());
    const enErken = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

    return sayfaBasligi(this) + `
      <div class="cam" style="padding:26px">
        <form id="kapsulForm">
          <textarea id="kapsulMetin" rows="5" maxlength="1800"
            placeholder="Geleceğe ne söylemek istersin? O gün bunu okuyacaksınız…"></textarea>
          <div class="satir" style="margin-top:14px;align-items:center">
            <label class="sonuk" for="kapsulTarih" style="font-size:13.5px">Açılış tarihi:</label>
            <input type="date" id="kapsulTarih" min="${enErken}" value="${varsayilan}">
            <button class="dugme" type="submit" style="margin-left:auto">Kapsülü mühürle</button>
          </div>
        </form>
      </div>
      <div id="kapsulListe"></div>`;
  },

  tak(kap) {
    const self = this;
    const liste = $('#kapsulListe', kap);

    const kalanYazi = (acilis) => {
      const hedef = new Date(acilis + 'T00:00').getTime();
      const gun = Math.ceil((hedef - Date.now()) / 86400000);
      if (gun <= 0) return 'bugün açılıyor';
      if (gun === 1) return 'yarın açılıyor';
      if (gun < 30) return gun + ' gün kaldı';
      if (gun < 365) return Math.round(gun / 30) + ' ay kaldı';
      return (gun / 365).toFixed(1).replace('.', ',') + ' yıl kaldı';
    };

    const ciz = () => {
      if (!liste.isConnected) return;
      const hepsi = (Kanal.durum.kapsul || []).slice();
      const bugun = self.bugunAnahtar();
      const acik  = hepsi.filter(k => k.acilis <= bugun).sort((a, b) => b.acilis.localeCompare(a.acilis));
      const kilit = hepsi.filter(k => k.acilis > bugun).sort((a, b) => a.acilis.localeCompare(b.acilis));

      if (!hepsi.length) {
        liste.innerHTML = `<div class="yok-uyari" style="margin-top:22px">
          Henüz kapsül yok. İlkini sen mühürle — yıl dönümünüz iyi bir tarih olabilir.</div>`;
        return;
      }

      liste.innerHTML = `
        ${acik.length ? `<h2 class="bolum-bas">Açılanlar</h2>
          <div class="kapsul-agi">${acik.map((k, i) => `
            <article class="kapsul acik" style="animation-delay:${i * 50}ms">
              <span class="kapsul-tarih">🔓 ${new Date(k.acilis + 'T00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              <p class="kapsul-metin">${kacir(k.metin)}</p>
              <span class="kapsul-alt">${kacir(k.ad)} · ${k.t ? new Date(k.t * 1000).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) + ' tarihinde yazdı' : ''}</span>
            </article>`).join('')}</div>` : ''}

        ${kilit.length ? `<h2 class="bolum-bas">Mühürlü</h2>
          <div class="kapsul-agi">${kilit.map((k, i) => `
            <article class="kapsul kilitli" style="animation-delay:${i * 50}ms">
              <span class="kilit-ikon">🔒</span>
              <span class="kapsul-tarih">${new Date(k.acilis + 'T00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              <p class="kapsul-geri">${kalanYazi(k.acilis)}</p>
              <span class="kapsul-alt">${kacir(k.ad)} mühürledi</span>
              ${k.kim === Kanal.ben.id ? `<button class="ikon-dugme kapsul-sil" data-id="${kacir(k.id)}" title="Sil">×</button>` : ''}
            </article>`).join('')}</div>` : ''}`;

      $$('.kapsul-sil', liste).forEach(b => {
        b.onclick = () => Perde.goster({
          baslik: 'Kapsülü sil',
          metin: 'Bu mühürlü kapsül tamamen silinecek. Emin misin?',
          butonlar: [
            { yazi: 'Vazgeç', tur: 'hayalet' },
            { yazi: 'Sil', tikla: () => Kanal.yolla('kapsul-sil', { id: b.dataset.id }) }
          ]
        });
      });
    };

    $('#kapsulForm', kap).onsubmit = (e) => {
      e.preventDefault();
      const m = $('#kapsulMetin', kap).value.trim();
      const t = $('#kapsulTarih', kap).value;
      if (!m) { $('#kapsulMetin', kap).focus(); return; }
      if (!t || t <= self.bugunAnahtar()) {
        Bildirim.goster('Açılış tarihi bugünden sonra olmalı.', '📅');
        return;
      }
      Kanal.yolla('kapsul', { id: benzersiz('k'), metin: m, acilis: t });
      $('#kapsulMetin', kap).value = '';
      Konfeti.patlat(35);
      Muzik.efekt('basari');
      tikla(18);
    };

    ciz();
    this._coz = [
      Kanal.on('kapsul', ciz),
      Kanal.on('kapsul-sil', ciz),
      Kanal.on('*durum', ciz)
    ];
  },

  sok() { (this._coz || []).forEach(f => f && f()); this._coz = []; }
});
