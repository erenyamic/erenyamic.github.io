/* ============================================================
   ANI DUVARI — fotoğraflı ve sesli yıldızların galerisi
   ============================================================ */

Yol.ekle({
  id: 'duvar',
  baslik: 'Anı Duvarı',
  ikon: '🖼️',
  etiket: 'Fotoğraflar ve sesler',
  kisa: 'Bıraktığınız her kare',
  aciklama: 'Gökyüzüne bıraktığınız fotoğraflar ve ses kayıtları burada birikiyor.',
  renk: '#ffb3c8',

  _coz: [],

  rozet() {
    const n = (Kanal.durum.yildizlar || []).filter(y => y.mid).length;
    return n ? { yazi: n + ' anı', sessiz: true } : null;
  },

  ciz() {
    return sayfaBasligi(this) + `<div id="duvarGovde"></div>`;
  },

  tak(kap) {
    const govde = $('#duvarGovde', kap);

    const cizAll = () => {
      if (!govde.isConnected) return;
      const liste = (Kanal.durum.yildizlar || []).filter(y => y.mid).slice().reverse();

      if (!liste.length) {
        govde.innerHTML = `<div class="yok-uyari">
          Duvar henüz boş.<br>
          <a href="#/yildizlar" style="color:var(--altın)">Yıldız Haritası</a>'na git,
          📷 ile fotoğraf ya da 🎙️ ile ses bırak — buraya düşecek.</div>`;
        return;
      }

      govde.innerHTML = `<div class="duvar-agi">${liste.map((y, i) => `
        <figure class="polaroid" data-mid="${kacir(y.mid)}" data-tur="${kacir(y.tur)}"
                style="animation-delay:${Math.min(i, 12) * 45}ms; --egim:${((i * 37) % 7) - 3}deg">
          <div class="polaroid-ic"><span class="sonuk" style="font-size:12px">yükleniyor…</span></div>
          <figcaption>
            ${y.metin ? `<span class="not">${kacir(y.metin)}</span>` : ''}
            <span class="alt">${kacir(y.ad || '')} · ${y.t ? new Date(y.t * 1000).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}</span>
          </figcaption>
        </figure>`).join('')}</div>`;

      // medyayı sırayla yükle (hepsini birden çekip bağlantıyı tıkamayalım)
      (async () => {
        for (const oge of $$('.polaroid', govde)) {
          if (!govde.isConnected) return;
          const veri = await Kanal.medyaAl(oge.dataset.mid);
          const ic = $('.polaroid-ic', oge);
          if (!ic) continue;
          if (!veri) { ic.innerHTML = `<span class="sonuk" style="font-size:12px">açılamadı</span>`; continue; }
          if (oge.dataset.tur === 'ses') {
            ic.classList.add('ses');
            ic.innerHTML = `<span class="ses-ikon">🎙️</span><audio controls preload="metadata" src="${veri}"></audio>`;
          } else {
            ic.innerHTML = `<img src="${veri}" alt="anı" loading="lazy">`;
            $('img', ic).onclick = () => {
              const p = document.createElement('div');
              p.className = 'perde foto-perde';
              p.innerHTML = `<img src="${veri}" alt="anı">`;
              p.onclick = () => p.remove();
              document.body.appendChild(p);
            };
          }
        }
      })();
    };

    cizAll();
    this._coz = [
      Kanal.on('yildiz', cizAll),
      Kanal.on('yildiz-sil', cizAll),
      Kanal.on('*durum', cizAll)
    ];
  },

  sok() { (this._coz || []).forEach(f => f && f()); this._coz = []; }
});
