/* ============================================================
   UYGULAMA — kapı, varlık çubuğu, fısıltı, eşin imleci, bildirimler
   ============================================================ */

(function () {
  const A = window.AYAR;

  /* ---------------------------------------------------------
     Kimlik
     --------------------------------------------------------- */
  function rolBilgi(rol) { return A.ikimiz[rol === 'o' ? 'o' : 'ben']; }
  function karsiBilgi(rol) { return A.ikimiz[rol === 'o' ? 'ben' : 'o']; }

  /* ---------------------------------------------------------
     KAPI — giriş perdesi
     --------------------------------------------------------- */
  const Kapi = {
    async ac() {
      const kapi = document.getElementById('kapi');
      kapi.hidden = false;

      // Adres satırında ?ben=ben / ?ben=o varsa kimliği o belirler.
      // (Tek bilgisayarda iki kişiyi denemek için pratiktir.)
      const zorla = new URLSearchParams(location.search).get('ben');
      let rolKayit = (zorla === 'ben' || zorla === 'o') ? zorla : Kayit.al('rol', null);
      if (zorla === 'ben' || zorla === 'o') Kayit.yaz('rol', zorla);

      const kilitGecti = Kayit.al('kilitGecti', false);

      // Daha önce girdiyse ve bu oturumda da açtıysa perdeyi bekletme
      if (rolKayit && sessionStorage.getItem('ag_oturum') === '1') {
        kapi.innerHTML = `<div class="kapi-ic">
            <span class="zarf"></span>
            <h1>${kacir(A.site.kapiBaslik)}</h1>
            <p class="kapi-ipucu"><span class="nokta-yukle"><i></i><i></i><i></i></span></p>
          </div>`;
        return rolKayit;
      }

      const rol = await this.adimlar(kapi, rolKayit, kilitGecti);
      sessionStorage.setItem('ag_oturum', '1');
      return rol;
    },

    adimlar(kapi, rolKayit, kilitGecti) {
      return new Promise((bitir) => {
        const goster = (html) => {
          kapi.innerHTML = `<div class="kapi-ic">${html}</div>`;
        };

        /* --- 1. adım: karşılama --- */
        const adim1 = () => {
          goster(`
            <span class="zarf"></span>
            <p class="kapi-ust">${kacir(A.site.kapiUstYazi)}</p>
            <h1>${kacir(A.site.kapiBaslik)}</h1>
            <p>${A.site.kapiMetin}</p>
            <div class="kapi-form"><button class="dugme" id="kapiAc">${kacir(A.site.kapiButon)}</button></div>`);
          $('#kapiAc').onclick = () => {
            Muzik.efekt('yildiz');
            Arkaplan.yildizYagdir(3);
            (A.kilit && A.kilit.aktif && !kilitGecti) ? adim2() : adim3();
          };
        };

        /* --- 2. adım: gizli soru --- */
        const adim2 = () => {
          goster(`
            <p class="kapi-ust">Küçük bir soru</p>
            <h1 style="font-size:clamp(26px,7vw,40px)">${kacir(A.kilit.soru)}</h1>
            <form class="kapi-form" id="kilitForm">
              <input id="kilitCevap" autocomplete="off" placeholder="cevabın…">
              <p class="kapi-ipucu" id="kilitIpucu"></p>
              <button class="dugme" type="submit">Devam</button>
              <button type="button" class="dugme hayalet kucuk" id="ipucuTus">İpucu ver</button>
            </form>`);
          let deneme = 0;
          const ipucu = $('#kilitIpucu');
          $('#ipucuTus').onclick = () => { ipucu.className = 'kapi-ipucu'; ipucu.textContent = A.kilit.ipucu; };
          $('#kilitForm').onsubmit = (e) => {
            e.preventDefault();
            const v = trNormal($('#kilitCevap').value);
            const dogru = (A.kilit.cevaplar || []).some(c => {
              const n = trNormal(c);
              return n && (v === n || v.includes(n) || n.includes(v));
            });
            if (dogru) { Kayit.yaz('kilitGecti', true); Konfeti.patlat(40); adim3(); return; }
            deneme++;
            ipucu.className = 'kapi-ipucu hata';
            ipucu.textContent = deneme >= 3
              ? 'Olmadı ama sorun değil — geçmek için tekrar "Devam"a bas.'
              : 'Hmm, o değil. Bir daha dene.';
            if (deneme >= 4) { Kayit.yaz('kilitGecti', true); adim3(); }
          };
        };

        /* --- 3. adım: sen kimsin --- */
        const adim3 = () => {
          if (rolKayit) { bitir(rolKayit); return; }
          const b = A.ikimiz.ben, o = A.ikimiz.o;
          goster(`
            <p class="kapi-ust">Son bir şey</p>
            <h1 style="font-size:clamp(30px,8vw,46px)">Sen kimsin?</h1>
            <p style="margin-bottom:26px">Böylece kimin ne bıraktığını bilebiliriz.</p>
            <div class="kim-secim">
              <button class="kim-kart" data-rol="ben">
                <span class="yuvarlak" style="background:${b.renk}">${kacir(b.harf)}</span>
                <span>${kacir(b.ad)}</span>
              </button>
              <button class="kim-kart" data-rol="o">
                <span class="yuvarlak" style="background:${o.renk}">${kacir(o.harf)}</span>
                <span>${kacir(o.ad)}</span>
              </button>
            </div>`);
          $$('.kim-kart').forEach(k => {
            k.onclick = () => {
              const rol = k.dataset.rol;
              Kayit.yaz('rol', rol);
              Konfeti.patlat(50);
              bitir(rol);
            };
          });
        };

        adim1();
      });
    },

    kapat() {
      const kapi = document.getElementById('kapi');
      if (!kapi) return;
      kapi.classList.add('kapan');
      setTimeout(() => kapi.remove(), 950);
    }
  };

  /* ---------------------------------------------------------
     VARLIK ÇUBUĞU
     --------------------------------------------------------- */
  const Varlik = {
    ilkBeraber: false,
    ciz() {
      const kutu = $('#kisilerKutu');
      const yazi = $('#durumYazi');
      if (!kutu) return;

      const rol = Kanal.ben.rol;
      const ben = rolBilgi(rol), karsi = karsiBilgi(rol);
      const es = Kanal.es();
      const esAcik = Kanal.esCevrimici();

      kutu.innerHTML = `
        <span class="rozet acik" style="--renk:${ben.renk}" title="${kacir(Kanal.ben.ad)}">${kacir(ben.harf)}</span>
        <span class="bag ${esAcik ? 'canli' : ''}"></span>
        <span class="rozet ${esAcik ? 'acik' : ''}" style="--renk:${karsi.renk}" title="${kacir((es && es.ad) || karsi.ad)}">${kacir(karsi.harf)}</span>`;

      if (yazi) {
        yazi.innerHTML = esAcik
          ? `<b>${kacir(es.ad)}</b> burada`
          : `${kacir((es && es.ad) || karsi.ad)} çevrimdışı`;
      }

      document.body.classList.toggle('beraber', esAcik);
      Arkaplan.yogunluk(esAcik);

      if (esAcik && !this.ilkBeraber) {
        this.ilkBeraber = true;
        Bildirim.goster(`<b>${kacir(es.ad)}</b> aynı gökyüzüne girdi ✨`, '💫', 6000);
        Konfeti.patlat(45);
        Arkaplan.yildizYagdir(4);
        Muzik.efekt('bildirim');
      } else if (!esAcik && this.ilkBeraber) {
        this.ilkBeraber = false;
      }
    }
  };

  /* ---------------------------------------------------------
     FISILTI — canlı sohbet
     --------------------------------------------------------- */
  const Fisilti = {
    acik: false,
    okunmamis: 0,

    kur() {
      $('#fisiltiTus').onclick = () => this.degistir();
      Kanal.on('fisilti', (v, olay) => {
        if (this.acik) { this.akisCiz(); }
        else if (!olay.benMi) {
          this.okunmamis++;
          this.rozetCiz();
          Bildirim.goster(`<b>${kacir(olay.ad)}:</b> ${kacir(v.metin)}`, '💬', 6500);
          Muzik.efekt('bildirim');
        }
      });
      Kanal.on('*durum', () => { if (this.acik) this.akisCiz(); });
    },

    rozetCiz() {
      const t = $('#fisiltiTus');
      let r = $('.sayac-nokta', t);
      if (this.okunmamis > 0) {
        if (!r) { r = document.createElement('span'); r.className = 'sayac-nokta'; t.appendChild(r); }
        r.textContent = this.okunmamis > 9 ? '9+' : this.okunmamis;
      } else if (r) r.remove();
    },

    degistir() { this.acik ? this.kapat() : this.ac(); },

    ac() {
      this.acik = true;
      this.okunmamis = 0;
      this.rozetCiz();
      const p = document.createElement('div');
      p.id = 'fisiltiPanel';
      p.innerHTML = `
        <div class="fisilti-bas">💬 <b style="font-weight:500">Fısıltı</b>
          <button class="kapat" aria-label="kapat">×</button></div>
        <div class="fisilti-akis" id="fisiltiAkis"></div>
        <div class="hizli">${(A.hizliFisiltilar || []).map(h => `<button data-h="${kacir(h)}">${kacir(h)}</button>`).join('')}</div>
        <form class="fisilti-alt" id="fisiltiForm">
          <input id="fisiltiGirdi" maxlength="280" autocomplete="off" placeholder="bir şey fısılda…">
          <button type="submit" aria-label="gönder">↑</button>
        </form>`;
      document.body.appendChild(p);
      $('.kapat', p).onclick = () => this.kapat();
      $('#fisiltiForm').onsubmit = (e) => { e.preventDefault(); this.yolla($('#fisiltiGirdi').value); };
      $$('.hizli button', p).forEach(b => b.onclick = () => this.yolla(b.dataset.h));
      this.akisCiz();
      setTimeout(() => { const g = $('#fisiltiGirdi'); if (g && innerWidth > 640) g.focus(); }, 60);
    },

    kapat() {
      this.acik = false;
      const p = $('#fisiltiPanel');
      if (p) p.remove();
    },

    yolla(metin) {
      const t = String(metin || '').trim();
      if (!t) return;
      Kanal.yolla('fisilti', { metin: t });
      const g = $('#fisiltiGirdi'); if (g) { g.value = ''; g.focus(); }
      tikla(10);
    },

    akisCiz() {
      const akis = $('#fisiltiAkis');
      if (!akis) return;
      const m = Kanal.durum.sohbet || [];
      if (!m.length) {
        akis.innerHTML = `<div class="fisilti-bos">Henüz hiç fısıltı yok.<br>İlk sözü sen söyle — anında karşı tarafa gider.</div>`;
        return;
      }
      akis.innerHTML = m.map(s => `
        <div class="balon ${s.kim === Kanal.ben.id ? 'ben' : 'o'}">
          ${kacir(s.metin)}<span class="an">${kacir(s.ad)} · ${saatBicim(s.t)}</span>
        </div>`).join('');
      akis.scrollTop = akis.scrollHeight;
    }
  };

  /* ---------------------------------------------------------
     EŞİN İMLECİ — kuyruklu yıldız
     --------------------------------------------------------- */
  const EsImlec = {
    son: 0, sonX: 0, sonY: 0, gizleT: null,

    kur() {
      if (!A.teknik.imlecPaylas) return;

      // Gönder (sadece gerçek fare ile)
      addEventListener('pointermove', (e) => {
        if (e.pointerType !== 'mouse') return;
        if (!Kanal.esCevrimici()) return;
        const simdi = Date.now();
        if (simdi - this.son < 260) return;
        const x = e.clientX / innerWidth, y = e.clientY / innerHeight;
        if (Math.abs(x - this.sonX) < .008 && Math.abs(y - this.sonY) < .008) return;
        this.son = simdi; this.sonX = x; this.sonY = y;
        Kanal.yolla('imlec', { x: +x.toFixed(4), y: +y.toFixed(4), s: Yol.suan() });
      }, { passive: true });

      // Al
      Kanal.on('imlec', (v, olay) => {
        if (olay.benMi || !v) return;
        const e = $('#esImlec');
        if (!e) return;
        if (v.s !== Yol.suan()) { e.style.display = 'none'; return; }
        e.style.display = 'block';
        e.style.transform = `translate(${v.x * innerWidth}px, ${v.y * innerHeight}px)`;
        const ad = $('.ad', e);
        const es = Kanal.es();
        if (ad && es) ad.textContent = es.ad;
        const renk = karsiBilgi(Kanal.ben.rol).renk;
        $('.kuyruk', e).style.background = renk;
        $('.kuyruk', e).style.boxShadow = `0 0 16px 5px ${renk}88`;
        if (ad) ad.style.background = renk;
        clearTimeout(this.gizleT);
        this.gizleT = setTimeout(() => { e.style.display = 'none'; }, 4000);
      });

      Kanal.on('*kisiler', () => {
        if (!Kanal.esCevrimici()) { const e = $('#esImlec'); if (e) e.style.display = 'none'; }
      });
    }
  };

  /* ---------------------------------------------------------
     GLOBAL BİLDİRİMLER
     --------------------------------------------------------- */
  function bildirimleriKur() {
    const git = (id) => `<a href="#/${id}" style="color:var(--altın)">bak →</a>`;

    Kanal.on('yildiz', (v, o) => {
      if (o.benMi) return;
      Arkaplan.yildizYagdir(1);
      Muzik.efekt('yildiz');
      if (Yol.suan() !== 'yildizlar')
        Bildirim.goster(`<b>${kacir(o.ad)}</b> gökyüzüne yeni bir yıldız bıraktı ${git('yildizlar')}`, '✨');
    });

    Kanal.on('takim', (v, o) => {
      if (o.benMi || Yol.suan() === 'yildizlar') return;
      Bildirim.goster(`<b>${kacir(o.ad)}</b> iki yıldızı birbirine bağladı ${git('yildizlar')}`, '✦');
    });

    Kanal.on('kupon', (v, o) => {
      if (o.benMi) return;
      const k = A.kuponlar[v.no];
      Bildirim.goster(`<b>${kacir(o.ad)}</b> bir kupon kullandı: <b>${kacir(k ? k.baslik : '')}</b>`, k ? k.ikon : '🎟️', 9000);
      Konfeti.patlat(35);
      Muzik.efekt('basari');
    });

    Kanal.on('cark-sonuc', (v, o) => {
      if (o.benMi || Yol.suan() === 'cark') return;
      Bildirim.goster(`<b>${kacir(o.ad)}</b> çarkı çevirdi: <b>${kacir(A.carkSecenekleri[v.no])}</b> ${git('cark')}`, '🎡', 8000);
    });

    Kanal.on('uyum', (v, o) => {
      if (o.benMi || Yol.suan() === 'uyum') return;
      Bildirim.goster(`<b>${kacir(o.ad)}</b> uyum testinde bir soruyu cevapladı ${git('uyum')}`, '🎯');
    });

    Kanal.on('cizgi', (v, o) => {
      if (o.benMi || Yol.suan() === 'ciz') return;
      const simdi = Date.now();
      if (simdi - (bildirimleriKur._cizim || 0) < 25000) return;
      bildirimleriKur._cizim = simdi;
      Bildirim.goster(`<b>${kacir(o.ad)}</b> tuvale bir şeyler çiziyor ${git('ciz')}`, '🎨');
    });

    Kanal.on('senkron-basarili', (v, o) => {
      if (Yol.suan() === 'senkron') return;
      Bildirim.goster('Kalpleriniz aynı anda attı 💗', '💗');
    });

    Kanal.on('katildi', (v, o) => {
      if (o.benMi) return;
      Varlik.ciz();
    });

    Kanal.on('*kisiler', () => Varlik.ciz());
  }

  /* ---------------------------------------------------------
     MÜZİK DÜĞMESİ
     --------------------------------------------------------- */
  function muzikKur() {
    const t = $('#muzikTus');
    const guncelle = () => {
      t.classList.toggle('aktif', Muzik.acikMi);
      t.textContent = Muzik.acikMi ? '🔊' : '🎵';
      t.title = Muzik.acikMi ? 'Müziği kapat' : 'Müziği aç';
    };
    t.onclick = () => { Muzik.degistir(); guncelle(); Kayit.yaz('muzik', Muzik.acikMi); };
    guncelle();
    if (Kayit.al('muzik', A.teknik.muzikVarsayilanAcik)) {
      // tarayıcılar kullanıcı etkileşimi ister; ilk tıklamada aç
      const ilk = () => { Muzik.ac(); guncelle(); removeEventListener('pointerdown', ilk); };
      addEventListener('pointerdown', ilk, { once: true });
    }
  }

  /* ---------------------------------------------------------
     KÜÇÜK SÜRPRİZ
     --------------------------------------------------------- */
  function surprizKur() {
    let n = 0, t = null;
    $('#marka').addEventListener('click', (e) => {
      n++;
      clearTimeout(t);
      t = setTimeout(() => n = 0, 900);
      if (n >= 5) {
        e.preventDefault();
        n = 0;
        Konfeti.patlat(120);
        Arkaplan.yildizYagdir(8);
        Muzik.efekt('basari');
        Perde.goster({
          baslik: 'Bunu buldun demek 🙂',
          metin: 'Gizli bir şey saklamıştım buraya: bu siteyi yapmak, sana ne kadar değer verdiğimi anlatmanın sadece bir yoluydu. Asıl olan, bunu birlikte açıyor olmamız.',
          butonlar: [{ yazi: 'Kapat' }]
        });
      }
    });
  }

  /* ---------------------------------------------------------
     İLK YILDIZLAR (gökyüzü tamamen boşsa)
     --------------------------------------------------------- */
  function tohumEk() {
    // Başlangıç yıldızlarını yalnızca siteyi hazırlayan taraf ekler.
    // (İkisi aynı anda girerse yıldızlar iki kez eklenmesin diye.)
    if (Kanal.ben.rol !== 'ben') return;
    if (Kayit.al('tohum', false)) return;
    if ((Kanal.durum.yildizlar || []).length) { Kayit.yaz('tohum', true); return; }
    (A.baslangicYildizlari || []).forEach((y, i) => {
      setTimeout(() => Kanal.yolla('yildiz', { id: benzersiz('y'), x: y.x, y: y.y, metin: y.metin }), i * 260);
    });
    Kayit.yaz('tohum', true);
  }

  /* ---------------------------------------------------------
     BAŞLAT
     --------------------------------------------------------- */
  async function baslat() {
    document.title = A.site.baslik;
    Arkaplan.baslat();

    const rol = await Kapi.ac();
    const bilgi = rolBilgi(rol);

    await Kanal.baslat({
      api: A.teknik.api,
      firebase: A.teknik.firebase,
      oda: A.oda,
      ad: bilgi.ad,
      rol: rol
    });

    Varlik.ciz();
    bildirimleriKur();
    Fisilti.kur();
    EsImlec.kur();
    muzikKur();
    surprizKur();
    tohumEk();

    Yol.basla();
    Kapi.kapat();

    if (Kanal.mod === 'yerel') {
      setTimeout(() => Bildirim.goster(
        'Sunucuya bağlanılamadı — çevrimdışı moddasın. Veriler bu cihazda saklanıyor.', '📡', 8000), 1800);
    }

    addEventListener('pagehide', () => Kanal.ayril());
    addEventListener('beforeunload', () => Kanal.ayril());
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) Kanal.sayfaBildir(Yol.suan());
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', baslat);
  else baslat();
})();
