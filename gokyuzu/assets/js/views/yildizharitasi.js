/* ============================================================
   YILDIZ HARİTASI — ortak, canlı, kalıcı anı gökyüzü
   ============================================================ */

Yol.ekle({
  id: 'yildizlar',
  baslik: 'Yıldız Haritamız',
  ikon: '✨',
  etiket: 'Ortak gökyüzü',
  kisa: 'Anıları gökyüzüne bırak',
  aciklama: 'Gökyüzünde bir yere dokun, oraya bir anı bırak. Eşin nerede olursa olsun o yıldızı anında görecek.',
  renk: 'var(--altın)',

  _bagMod: false,
  _secili: null,
  _bekleyen: null,
  _coz: [],

  rozet() {
    const n = (Kanal.durum.yildizlar || []).length;
    return n ? { yazi: n + ' yıldız', sessiz: true } : null;
  },

  ciz() {
    return sayfaBasligi(this) + `
      <div class="harita-sarmal">
        <div class="harita" id="harita">
          <svg class="baglar" id="baglar" viewBox="0 0 100 100" preserveAspectRatio="none"></svg>
        </div>
        <div class="harita-arac">
          <span class="bilgi" id="haritaBilgi"></span>
          <button class="dugme hayalet kucuk" id="bagTus">🔗 Takımyıldız kur</button>
        </div>
      </div>

      <form class="yildiz-form" id="yildizForm">
        <input id="yildizMetin" maxlength="200" autocomplete="off"
               placeholder="Bir anı, bir söz, bir itiraf…">
        <button class="dugme" type="submit">Gökyüzüne bırak</button>
      </form>
      <p class="sonuk orta" style="margin-top:12px">
        Önce gökyüzünde bir nokta seç, sonra yaz. Yer seçmezsen yıldız kendi yerini bulur.
      </p>`;
  },

  tak(kap) {
    const harita = $('#harita', kap);
    const svg    = $('#baglar', kap);
    const bilgi  = $('#haritaBilgi', kap);
    const form   = $('#yildizForm', kap);
    const metin  = $('#yildizMetin', kap);
    const bagTus = $('#bagTus', kap);
    const self   = this;

    /* --- çizim --- */
    const cizYildizlar = () => {
      if (!harita.isConnected) return;
      const yl = Kanal.durum.yildizlar || [];
      $$('.yildiz', harita).forEach(e => e.remove());
      const balon = $('.yildiz-balon', harita); if (balon) balon.remove();

      yl.forEach(y => {
        const t = document.createElement('button');
        t.className = 'yildiz';
        t.style.left = (y.x * 100) + '%';
        t.style.top  = (y.y * 100) + '%';
        t.style.setProperty('--renk', y.kim === Kanal.ben.id ? 'rgba(126,232,250,.75)' : 'rgba(255,143,171,.75)');
        t.dataset.id = y.id;
        t.setAttribute('aria-label', 'Yıldız: ' + (y.metin || ''));
        harita.appendChild(t);
      });

      // bekleyen konum işareti
      if (self._bekleyen) {
        const t = document.createElement('button');
        t.className = 'yildiz secili';
        t.style.left = (self._bekleyen.x * 100) + '%';
        t.style.top  = (self._bekleyen.y * 100) + '%';
        t.style.setProperty('--renk', 'rgba(255,217,125,.9)');
        t.dataset.bekleyen = '1';
        harita.appendChild(t);
      }

      // bağlar
      const harita_ = {};
      yl.forEach(y => harita_[y.id] = y);
      svg.innerHTML = (Kanal.durum.takimlar || []).map(t => {
        const a = harita_[t.a], b = harita_[t.b];
        if (!a || !b) return '';
        return `<line x1="${a.x * 100}" y1="${a.y * 100}" x2="${b.x * 100}" y2="${b.y * 100}" vector-effect="non-scaling-stroke"/>`;
      }).join('');

      bilgi.textContent = yl.length
        ? `${yl.length} yıldız · ${(Kanal.durum.takimlar || []).length} bağ`
        : 'Gökyüzü henüz boş. İlk yıldızı sen bırak.';
    };

    /* --- balon --- */
    const balonGoster = (yildiz, dugme) => {
      const eski = $('.yildiz-balon', harita); if (eski) eski.remove();
      const b = document.createElement('div');
      b.className = 'yildiz-balon';
      const benimMi = yildiz.kim === Kanal.ben.id;
      const d = new Date((yildiz.t || 0) * 1000);
      const tarih = yildiz.t ? d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
      b.innerHTML = `${benimMi ? '<button class="sil" title="Sil">×</button>' : ''}
        ${kacir(yildiz.metin || '(boş)')}
        <span class="kimden">${kacir(yildiz.ad || '')}${tarih ? ' · ' + tarih : ''}</span>`;
      if (benimMi) {
        $('.sil', b).onclick = (e) => {
          e.stopPropagation();
          Kanal.yolla('yildiz-sil', { id: yildiz.id });
          b.remove();
        };
      }
      harita.appendChild(b);

      // Balon harita dışına taşmasın: yatayda sınırla, üstte yer yoksa alta çevir.
      const hr = harita.getBoundingClientRect();
      const bw = b.offsetWidth, bh = b.offsetHeight;
      const yildizX = (yildiz.x || 0) * hr.width;
      const yildizY = (yildiz.y || 0) * hr.height;
      b.style.left = Math.round(Math.min(Math.max(yildizX, bw / 2 + 10), Math.max(bw / 2 + 10, hr.width - bw / 2 - 10))) + 'px';
      if (yildizY - bh - 30 < 0) b.classList.add('alt');
      b.style.top = Math.round(yildizY) + 'px';
    };

    /* --- tıklamalar --- */
    harita.addEventListener('click', (e) => {
      const yTus = e.target.closest('.yildiz');
      const balon = e.target.closest('.yildiz-balon');
      if (balon) return;

      if (yTus && !yTus.dataset.bekleyen) {
        e.stopPropagation();
        const y = (Kanal.durum.yildizlar || []).find(v => v.id === yTus.dataset.id);
        if (!y) return;

        if (self._bagMod) {
          if (!self._secili) {
            self._secili = y.id;
            yTus.classList.add('secili');
            bilgi.textContent = 'Şimdi bağlamak istediğin ikinci yıldıza dokun.';
          } else if (self._secili !== y.id) {
            Kanal.yolla('takim', { a: self._secili, b: y.id });
            self._secili = null;
            bilgi.textContent = 'Bağlandı ✦';
            Muzik.efekt('yildiz');
          }
          return;
        }
        balonGoster(y, yTus);
        return;
      }

      const eskiB = $('.yildiz-balon', harita); if (eskiB) { eskiB.remove(); return; }
      if (self._bagMod) return;

      const r = harita.getBoundingClientRect();
      self._bekleyen = {
        x: Math.min(.97, Math.max(.03, (e.clientX - r.left) / r.width)),
        y: Math.min(.96, Math.max(.04, (e.clientY - r.top) / r.height))
      };
      cizYildizlar();
      metin.focus();
    });

    bagTus.onclick = () => {
      self._bagMod = !self._bagMod;
      self._secili = null;
      bagTus.classList.toggle('aktif', self._bagMod);
      bagTus.textContent = self._bagMod ? '✓ Bağlama modu açık' : '🔗 Takımyıldız kur';
      bagTus.classList.toggle('hayalet', !self._bagMod);
      harita.style.cursor = self._bagMod ? 'pointer' : 'crosshair';
      bilgi.textContent = self._bagMod ? 'İki yıldıza sırayla dokun; aralarında bir çizgi belirsin.' : '';
      if (!self._bagMod) cizYildizlar();
    };

    form.onsubmit = (e) => {
      e.preventDefault();
      const t = metin.value.trim();
      if (!t) { metin.focus(); return; }
      const yer = self._bekleyen || {
        x: .1 + Math.random() * .8,
        y: .1 + Math.random() * .8
      };
      Kanal.yolla('yildiz', { id: benzersiz('y'), x: yer.x, y: yer.y, metin: t });
      metin.value = '';
      self._bekleyen = null;
      Muzik.efekt('yildiz');
      Arkaplan.yildizYagdir(1);
      tikla(18);
    };

    cizYildizlar();
    this._coz = [
      Kanal.on('yildiz', cizYildizlar),
      Kanal.on('yildiz-sil', cizYildizlar),
      Kanal.on('takim', cizYildizlar),
      Kanal.on('*durum', cizYildizlar)
    ];
  },

  sok() {
    (this._coz || []).forEach(f => f && f());
    this._coz = [];
    this._bagMod = false; this._secili = null; this._bekleyen = null;
  }
});
