/* ============================================================
   YILDIZ HARİTASI — ortak, canlı, kalıcı anı gökyüzü
   Yıldıza yazı, fotoğraf ya da ses bırakılabilir.
   ============================================================ */

Yol.ekle({
  id: 'yildizlar',
  baslik: 'Yıldız Haritamız',
  ikon: '✨',
  etiket: 'Ortak gökyüzü',
  kisa: 'Yazı, fotoğraf ya da ses bırak',
  aciklama: 'Gökyüzünde bir yere dokun; oraya bir anı, bir fotoğraf ya da sesini bırak. Eşin nerede olursa olsun anında görecek.',
  renk: 'var(--altın)',

  _bagMod: false,
  _secili: null,
  _bekleyen: null,
  _ekMedya: null,     // { tur:'foto'|'ses', url, bayt }
  _kayit: null,
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

      <div id="ekOnizleme"></div>

      <form class="yildiz-form" id="yildizForm">
        <input id="yildizMetin" maxlength="200" autocomplete="off"
               placeholder="Bir anı, bir söz, bir itiraf…">
        <button type="button" class="ikon-dugme buyukce" id="fotoTus" title="Fotoğraf ekle">📷</button>
        <button type="button" class="ikon-dugme buyukce" id="sesTus" title="Ses kaydet">🎙️</button>
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
    const onizle = $('#ekOnizleme', kap);
    const self   = this;

    self._ekMedya = null;

    /* --- çizim --- */
    const cizYildizlar = () => {
      if (!harita.isConnected) return;
      const yl = Kanal.durum.yildizlar || [];
      $$('.yildiz', harita).forEach(e => e.remove());
      const eskiB = $('.yildiz-balon', harita); if (eskiB) eskiB.remove();

      yl.forEach(y => {
        const t = document.createElement('button');
        t.className = 'yildiz' + (y.tur === 'foto' ? ' foto' : y.tur === 'ses' ? ' ses' : '');
        t.style.left = (y.x * 100) + '%';
        t.style.top  = (y.y * 100) + '%';
        t.style.setProperty('--renk', y.kim === Kanal.ben.id ? 'rgba(126,232,250,.75)' : 'rgba(255,143,171,.75)');
        t.dataset.id = y.id;
        t.setAttribute('aria-label', 'Yıldız: ' + (y.metin || y.tur || ''));
        harita.appendChild(t);
      });

      if (self._bekleyen) {
        const t = document.createElement('button');
        t.className = 'yildiz secili';
        t.style.left = (self._bekleyen.x * 100) + '%';
        t.style.top  = (self._bekleyen.y * 100) + '%';
        t.style.setProperty('--renk', 'rgba(255,217,125,.9)');
        t.dataset.bekleyen = '1';
        harita.appendChild(t);
      }

      const dizin = {};
      yl.forEach(y => dizin[y.id] = y);
      svg.innerHTML = (Kanal.durum.takimlar || []).map(t => {
        const a = dizin[t.a], b = dizin[t.b];
        if (!a || !b) return '';
        return `<line x1="${a.x * 100}" y1="${a.y * 100}" x2="${b.x * 100}" y2="${b.y * 100}" vector-effect="non-scaling-stroke"/>`;
      }).join('');

      const fotoSayi = yl.filter(y => y.tur === 'foto').length;
      const sesSayi  = yl.filter(y => y.tur === 'ses').length;
      bilgi.textContent = yl.length
        ? `${yl.length} yıldız · ${(Kanal.durum.takimlar || []).length} bağ`
          + (fotoSayi ? ` · ${fotoSayi} fotoğraf` : '') + (sesSayi ? ` · ${sesSayi} ses` : '')
        : 'Gökyüzü henüz boş. İlk yıldızı sen bırak.';
    };

    /* --- balon --- */
    const balonGoster = async (yildiz, dugme) => {
      const eski = $('.yildiz-balon', harita); if (eski) eski.remove();
      const b = document.createElement('div');
      b.className = 'yildiz-balon';
      const benimMi = yildiz.kim === Kanal.ben.id;
      const d = new Date((yildiz.t || 0) * 1000);
      const tarih = yildiz.t ? d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : '';

      b.innerHTML = `${benimMi ? '<button class="sil" title="Sil">×</button>' : ''}
        <div class="balon-medya" ${yildiz.mid ? '' : 'hidden'}>
          <span class="sonuk" style="font-size:12px">yükleniyor…</span>
        </div>
        ${yildiz.metin ? `<div>${kacir(yildiz.metin)}</div>` : ''}
        <span class="kimden">${kacir(yildiz.ad || '')}${tarih ? ' · ' + tarih : ''}</span>`;

      if (benimMi) {
        $('.sil', b).onclick = (e) => {
          e.stopPropagation();
          Kanal.yolla('yildiz-sil', { id: yildiz.id });
          b.remove();
        };
      }
      harita.appendChild(b);
      yerlestir(b, yildiz);

      if (yildiz.mid) {
        const kutu = $('.balon-medya', b);
        const veri = await Kanal.medyaAl(yildiz.mid);
        if (!b.isConnected) return;
        if (!veri) { kutu.innerHTML = `<span class="sonuk" style="font-size:12px">medya açılamadı</span>`; return; }
        kutu.innerHTML = yildiz.tur === 'ses'
          ? `<audio controls preload="metadata" src="${veri}"></audio>`
          : `<img src="${veri}" alt="anı" loading="lazy">`;
        const resim = $('img', kutu);
        if (resim) { resim.onload = () => yerlestir(b, yildiz); resim.onclick = () => buyukGoster(veri); }
        else yerlestir(b, yildiz);
      }
    };

    function yerlestir(b, yildiz) {
      const hr = harita.getBoundingClientRect();
      const bw = b.offsetWidth, bh = b.offsetHeight;
      const x = (yildiz.x || 0) * hr.width, y = (yildiz.y || 0) * hr.height;
      b.style.left = Math.round(Math.min(Math.max(x, bw / 2 + 10), Math.max(bw / 2 + 10, hr.width - bw / 2 - 10))) + 'px';
      b.classList.toggle('alt', y - bh - 30 < 0);
      b.style.top = Math.round(y) + 'px';
    }

    function buyukGoster(url) {
      const p = document.createElement('div');
      p.className = 'perde foto-perde';
      p.innerHTML = `<img src="${url}" alt="anı">`;
      p.onclick = () => p.remove();
      document.body.appendChild(p);
    }

    /* --- ek önizleme --- */
    const onizlemeCiz = () => {
      if (!self._ekMedya) { onizle.innerHTML = ''; return; }
      const m = self._ekMedya;
      onizle.innerHTML = `<div class="ek-onizleme">
        ${m.tur === 'foto' ? `<img src="${m.url}" alt="">` : `<audio controls src="${m.url}"></audio>`}
        <div class="ek-bilgi">
          <b>${m.tur === 'foto' ? '📷 Fotoğraf' : '🎙️ Ses'} hazır</b>
          <span class="sonuk">${Math.round(m.bayt / 1024)} KB · "Gökyüzüne bırak"a bas</span>
        </div>
        <button type="button" class="ikon-dugme" id="ekKaldir" title="Kaldır">×</button>
      </div>`;
      $('#ekKaldir', onizle).onclick = () => { self._ekMedya = null; onizlemeCiz(); };
    };

    /* --- tıklamalar --- */
    harita.addEventListener('click', (e) => {
      const yTus = e.target.closest('.yildiz');
      if (e.target.closest('.yildiz-balon')) return;

      if (yTus && !yTus.dataset.bekleyen) {
        e.stopPropagation();
        const y = (Kanal.durum.yildizlar || []).find(v => v.id === yTus.dataset.id);
        if (!y) return;
        if (self._bagMod) {
          if (!self._secili) {
            self._secili = y.id; yTus.classList.add('secili');
            bilgi.textContent = 'Şimdi bağlamak istediğin ikinci yıldıza dokun.';
          } else if (self._secili !== y.id) {
            Kanal.yolla('takim', { a: self._secili, b: y.id });
            self._secili = null; bilgi.textContent = 'Bağlandı ✦';
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

    /* --- fotoğraf --- */
    $('#fotoTus', kap).onclick = async () => {
      const m = await Medya.fotografSec();
      if (!m) return;
      if (m.bayt > Medya.SINIR_BAYT * 1.3) {
        Bildirim.goster('Fotoğraf çok büyük, biraz daha küçük bir tane dene.', '⚠️');
        return;
      }
      self._ekMedya = { tur: 'foto', url: m.url, bayt: m.bayt };
      onizlemeCiz();
      tikla(12);
    };

    /* --- ses --- */
    const sesTus = $('#sesTus', kap);
    if (!Medya.sesDestekli()) { sesTus.disabled = true; sesTus.title = 'Bu tarayıcı ses kaydını desteklemiyor'; }
    sesTus.onclick = async () => {
      if (self._kayit) { self._kayit.bitir(); return; }
      try {
        sesTus.classList.add('kaydediyor');
        sesTus.textContent = '⏹';
        self._kayit = await Medya.sesKaydiBaslat((gecen, en) => {
          sesTus.title = `${gecen.toFixed(1)} / ${en} sn — durdurmak için bas`;
          onizle.innerHTML = `<div class="ek-onizleme kayit">
            <span class="kirmizi-nokta"></span>
            <div class="ek-bilgi"><b>Kaydediliyor… ${gecen.toFixed(1)} sn</b>
            <span class="sonuk">Bitirmek için mikrofona tekrar bas (en fazla ${en} sn)</span></div></div>`;
        });
        const sonuc = await self._kayit.bitti;
        self._kayit = null;
        sesTus.classList.remove('kaydediyor');
        sesTus.textContent = '🎙️';
        if (!sonuc) { onizle.innerHTML = ''; return; }
        if (sonuc.bayt > Medya.SINIR_BAYT * 1.6) {
          Bildirim.goster('Kayıt çok uzun oldu, daha kısa bir tane dene.', '⚠️');
          onizle.innerHTML = ''; return;
        }
        self._ekMedya = { tur: 'ses', url: sonuc.url, bayt: sonuc.bayt };
        onizlemeCiz();
      } catch (e) {
        self._kayit = null;
        sesTus.classList.remove('kaydediyor');
        sesTus.textContent = '🎙️';
        onizle.innerHTML = '';
        Bildirim.goster('Mikrofona izin verilmedi.', '🎙️');
      }
    };

    /* --- gönder --- */
    form.onsubmit = async (e) => {
      e.preventDefault();
      const t = metin.value.trim();
      if (!t && !self._ekMedya) { metin.focus(); return; }

      const yer = self._bekleyen || { x: .1 + Math.random() * .8, y: .1 + Math.random() * .8 };
      const id = benzersiz('y');
      let tur = 'metin', mid = '';

      if (self._ekMedya) {
        tur = self._ekMedya.tur;
        mid = 'm' + id;
        const gonderTus = $('button[type="submit"]', form);
        gonderTus.disabled = true; gonderTus.textContent = 'Yükleniyor…';
        try { await Kanal.medyaYaz(mid, self._ekMedya.url); }
        catch (err) { Bildirim.goster('Medya yüklenemedi.', '⚠️'); }
        gonderTus.disabled = false; gonderTus.textContent = 'Gökyüzüne bırak';
      }

      Kanal.yolla('yildiz', { id, x: yer.x, y: yer.y, metin: t, tur, mid });
      metin.value = '';
      self._bekleyen = null;
      self._ekMedya = null;
      onizlemeCiz();
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
    if (this._kayit) { try { this._kayit.iptal(); } catch (e) {} this._kayit = null; }
    this._bagMod = false; this._secili = null; this._bekleyen = null; this._ekMedya = null;
  }
});
