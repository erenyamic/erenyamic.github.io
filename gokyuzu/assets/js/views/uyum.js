/* ============================================================
   UYUM TESTİ — ikiniz aynı anda cevaplıyor, aynı anda açılıyor
   ============================================================ */

Yol.ekle({
  id: 'uyum',
  baslik: 'Ne Kadar Uyumluyuz?',
  ikon: '🎯',
  etiket: 'Aynı anda cevaplayın',
  kisa: 'Cevaplar aynı anda açılır',
  aciklama: 'Aynı soruyu ikiniz de cevaplıyorsunuz. Kimse diğerininkini önceden göremiyor — ikiniz de cevaplayınca perde birlikte kalkıyor.',
  renk: 'var(--deniz)',

  _i: 0, _coz: [], _zaman: null,

  rozet() {
    const u = Kanal.durum.uyum || {};
    const bitti = Object.keys(u).filter(k => Object.keys(u[k] || {}).length >= 2).length;
    return bitti ? { yazi: bitti + '/' + window.AYAR.uyumSorulari.length, sessiz: true } : null;
  },

  _cevaplarim() {
    const u = Kanal.durum.uyum || {};
    return window.AYAR.uyumSorulari.map((_, i) => (u[String(i)] || {})[Kanal.ben.id]);
  },

  ciz() {
    const S = window.AYAR.uyumSorulari;
    const c = this._cevaplarim();
    let i = c.findIndex(x => !x);
    if (i === -1) i = S.length;      // hepsi cevaplandı
    this._i = i;
    return sayfaBasligi(this) + `<div id="uyumGovde"></div>`;
  },

  tak(kap) {
    const self = this;
    const govde = $('#uyumGovde', kap);
    const S = window.AYAR.uyumSorulari;

    const cevapAl = (i) => (Kanal.durum.uyum || {})[String(i)] || {};

    const puanHesapla = () => {
      let ayni = 0, tam = 0;
      S.forEach((_, i) => {
        const c = cevapAl(i);
        const k = Object.keys(c);
        if (k.length >= 2) {
          tam++;
          if (c[k[0]].c === c[k[1]].c) ayni++;
        }
      });
      return { ayni, tam };
    };

    const sonucCiz = () => {
      const { ayni, tam } = puanHesapla();
      const yuzde = tam ? Math.round((ayni / tam) * 100) : 0;
      let yorum;
      if (!tam) yorum = 'Henüz birlikte cevaplanan soru yok. Eşin girdiğinde perde kalkacak.';
      else if (yuzde >= 85) yorum = 'Bu artık uyum değil, telepati. Birbirinizin cümlesini bitiriyorsunuz herhalde.';
      else if (yuzde >= 60) yorum = 'Çok iyi. Aynı şeyleri istiyorsunuz, geri kalanı da konuşarak halledilir.';
      else if (yuzde >= 35) yorum = 'Farklısınız ama bu kötü değil — konuşacak çok şeyiniz var demek.';
      else yorum = 'Zıt kutuplar! Bu yüzden bu kadar iyi gidiyor olabilir. Bir de tartışın bakalım.';

      govde.innerHTML = `
        <div class="cam uyum-sonuc">
          <span class="etiket">Sonuç</span>
          <div class="uyum-yuzde">%${yuzde}</div>
          <p style="max-width:44ch;margin:12px auto 0;color:var(--mürekkep-yumusak);line-height:1.7">${yorum}</p>
          <p class="sonuk" style="margin-top:10px">${tam} soruda ${ayni} kez aynı cevabı verdiniz.</p>
          <div class="satir orta" style="margin-top:24px">
            <button class="dugme hayalet" id="uyumTekrar">Baştan başla</button>
          </div>
        </div>`;
      $('#uyumTekrar').onclick = () => {
        Perde.goster({
          baslik: 'Testi sıfırla',
          metin: 'İkinizin de bütün cevapları silinecek. Emin misin?',
          butonlar: [
            { yazi: 'Vazgeç', tur: 'hayalet' },
            { yazi: 'Sıfırla', tikla: () => { Kanal.yolla('uyum-sifirla', {}); self._i = 0; } }
          ]
        });
      };
      if (tam >= S.length) Konfeti.patlat(50);
    };

    const soruCiz = () => {
      if (!govde.isConnected) return;
      if (self._i >= S.length) { sonucCiz(); return; }

      const i = self._i;
      const s = S[i];
      const c = cevapAl(i);
      const benim = c[Kanal.ben.id];
      const esKisi = Kanal.es();
      const onun = esKisi ? c[esKisi.id] : Object.entries(c).filter(([k]) => k !== Kanal.ben.id).map(([, v]) => v)[0];
      const acik = !!(benim && onun);

      const secenekler = s.secenekler.map((sec, k) => {
        const benimMi = benim && benim.c === k;
        const onunMu  = acik && onun && onun.c === k;
        const sinif = [benimMi ? 'benim' : '', onunMu ? 'onun' : ''].filter(Boolean).join(' ');
        const isaret = (benimMi || onunMu) ? `<span class="isaret">
            ${benimMi ? `<i style="background:${window.AYAR.ikimiz[Kanal.ben.rol === 'o' ? 'o' : 'ben'].renk}"></i>` : ''}
            ${onunMu  ? `<i style="background:${window.AYAR.ikimiz[Kanal.ben.rol === 'o' ? 'ben' : 'o'].renk}"></i>` : ''}
          </span>` : '';
        return `<button class="secenek ${sinif}" data-k="${k}" ${benim ? 'disabled' : ''}>${kacir(sec)}${isaret}</button>`;
      }).join('');

      let alt = '';
      if (acik) {
        const ayniMi = benim.c === onun.c;
        alt = `<div class="bekleme-serit" style="color:${ayniMi ? 'var(--nane)' : 'var(--mürekkep-yumusak)'}">
            ${ayniMi ? '🎉 Aynı cevabı verdiniz!' : '🤔 Farklı düşünmüşsünüz — bunu konuşmak lazım.'}
          </div>
          <div class="satir orta" style="margin-top:16px">
            <button class="dugme" id="ileri">${i + 1 >= S.length ? 'Sonucu gör' : 'Sıradaki soru'} →</button>
          </div>`;
      } else if (benim) {
        const esAcik = Kanal.esCevrimici();
        alt = `<div class="bekleme-serit">
            <span class="nokta-yukle"><i></i><i></i><i></i></span>
            ${esAcik ? `${kacir((esKisi || {}).ad || 'Eşin')} cevaplıyor…` : `${kacir((esKisi || {}).ad || 'Eşin')} girdiğinde cevabı burada açılacak`}
          </div>
          ${!esAcik ? `<div class="satir orta" style="margin-top:14px"><button class="dugme hayalet kucuk" id="ileri">Beklemeden devam et</button></div>` : ''}`;
      } else {
        alt = `<div class="bekleme-serit">Cevabını seç — eşin cevaplayana kadar kimse görmeyecek.</div>`;
      }

      govde.innerHTML = `
        <div class="uyum-ust">
          <div class="ilerleme"><i style="width:${(i / S.length) * 100}%"></i></div>
          <span class="sayi">${i + 1} / ${S.length}</span>
        </div>
        <div class="cam soru-kart">
          <h2>${kacir(s.soru)}</h2>
          <div class="secenekler">${secenekler}</div>
          ${alt}
        </div>`;

      $$('.secenek', govde).forEach(b => {
        b.onclick = () => {
          if (benim) return;
          Kanal.yolla('uyum', { soru: i, cevap: +b.dataset.k });
          tikla(12);
          // sunucudan yankı gelene kadar anında geri bildirim
          b.classList.add('benim');
          $$('.secenek', govde).forEach(x => x.disabled = true);
        };
      });
      const ileri = $('#ileri', govde);
      if (ileri) ileri.onclick = () => { self._i++; soruCiz(); };
    };

    soruCiz();
    this._coz = [
      Kanal.on('uyum', soruCiz),
      Kanal.on('uyum-sifirla', () => { self._i = 0; soruCiz(); }),
      Kanal.on('*kisiler', soruCiz),
      Kanal.on('*durum', soruCiz)
    ];
  },

  sok() { (this._coz || []).forEach(f => f && f()); this._coz = []; }
});
