/* ============================================================
   BİRLİKTE ÇİZ — aynı tuvale, aynı anda, iki elden
   ============================================================ */

Yol.ekle({
  id: 'ciz',
  baslik: 'Birlikte Çiz',
  ikon: '🎨',
  etiket: 'Ortak tuval',
  kisa: 'Aynı tuvale beraber',
  aciklama: 'Aynı tuvali paylaşıyorsunuz. Sen çizerken eşin her çizgiyi anında görüyor.',
  renk: 'var(--lavanta)',

  _coz: [], _temizleT: null,

  rozet() {
    const n = (Kanal.durum.cizim || []).length;
    return n ? { yazi: 'çizim var', sessiz: true } : null;
  },

  ciz() {
    const renkler = ['#ff8fab', '#c8a2ff', '#7ee8fa', '#ffd97d', '#8affc1', '#ffa87d', '#ffffff'];
    return sayfaBasligi(this) + `
      <div class="tuval-sarmal">
        <canvas id="tuval" width="1200" height="750"></canvas>
        <div class="boya-cubuk">
          ${renkler.map((r, i) => `<button class="renk-tus ${i === 0 ? 'secili' : ''}" data-renk="${r}" style="background:${r}" aria-label="renk"></button>`).join('')}
          <span class="kalinlik">
            <input type="range" id="kalinlik" min="2" max="26" value="6" aria-label="kalınlık">
          </span>
          <button class="dugme hayalet kucuk" id="tuvalTemizle" style="margin-left:auto">Temizle</button>
        </div>
      </div>
      <p class="sonuk orta" style="margin-top:14px" id="cizimBilgi"></p>`;
  },

  tak(kap) {
    const self = this;
    const tuval = $('#tuval', kap);
    const ctx = tuval.getContext('2d');
    const bilgi = $('#cizimBilgi', kap);
    const EN = tuval.width, BOY = tuval.height;

    let renk = '#ff8fab', kalinlik = 6;
    let ciziyor = false, tampon = [], sonGonderim = 0;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    function cizgiCiz(c) {
      const n = c.n || [];
      if (n.length < 1) return;
      ctx.strokeStyle = c.r || '#fff';
      ctx.lineWidth = (c.k || 4) * (EN / 1200);
      ctx.beginPath();
      ctx.moveTo(n[0][0] * EN, n[0][1] * BOY);
      if (n.length === 1) ctx.lineTo(n[0][0] * EN + .1, n[0][1] * BOY + .1);
      else for (let i = 1; i < n.length; i++) ctx.lineTo(n[i][0] * EN, n[i][1] * BOY);
      ctx.stroke();
    }

    function hepsiniCiz() {
      ctx.clearRect(0, 0, EN, BOY);
      (Kanal.durum.cizim || []).forEach(cizgiCiz);
      bilgiYaz();
    }

    function bilgiYaz() {
      const n = (Kanal.durum.cizim || []).length;
      const es = Kanal.es();
      bilgi.textContent = Kanal.esCevrimici()
        ? `${es.ad} da tuvalde — birlikte çiziyorsunuz`
        : (n ? `${n} çizgi var. Eşin girdiğinde bunu görecek.` : 'Boş bir tuval. İlk çizgi senden.');
    }

    function konum(e) {
      const r = tuval.getBoundingClientRect();
      return [
        Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)),
        Math.max(0, Math.min(1, (e.clientY - r.top) / r.height))
      ];
    }

    function gonder(kapanis) {
      if (tampon.length < 1) return;
      const paket = { n: tampon.slice(), r: renk, k: kalinlik };
      Kanal.yolla('cizgi', paket);
      // devamlılık için son noktayı koru
      tampon = kapanis ? [] : tampon.slice(-1);
      sonGonderim = Date.now();
    }

    tuval.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      tuval.setPointerCapture(e.pointerId);
      ciziyor = true;
      tampon = [konum(e)];
      cizgiCiz({ n: tampon, r: renk, k: kalinlik });
    });

    tuval.addEventListener('pointermove', (e) => {
      if (!ciziyor) return;
      const p = konum(e);
      const onceki = tampon[tampon.length - 1];
      tampon.push(p);
      cizgiCiz({ n: [onceki, p], r: renk, k: kalinlik });
      if (Date.now() - sonGonderim > 230 || tampon.length > 60) gonder(false);
    });

    const bitir = (e) => {
      if (!ciziyor) return;
      ciziyor = false;
      gonder(true);
    };
    tuval.addEventListener('pointerup', bitir);
    tuval.addEventListener('pointerleave', bitir);
    tuval.addEventListener('pointercancel', bitir);

    $$('.renk-tus', kap).forEach(b => {
      b.onclick = () => {
        renk = b.dataset.renk;
        $$('.renk-tus', kap).forEach(x => x.classList.remove('secili'));
        b.classList.add('secili');
      };
    });
    $('#kalinlik', kap).oninput = (e) => { kalinlik = +e.target.value; };

    $('#tuvalTemizle', kap).onclick = () => {
      Perde.goster({
        baslik: 'Tuvali temizle',
        metin: 'İkinizin çizdiği her şey silinecek. Emin misin?',
        butonlar: [
          { yazi: 'Vazgeç', tur: 'hayalet' },
          { yazi: 'Sil gitsin', tikla: () => Kanal.yolla('cizim-temizle', {}) }
        ]
      });
    };

    hepsiniCiz();
    this._coz = [
      Kanal.on('cizgi', (v, olay) => { if (!olay.benMi) cizgiCiz(v); }),
      Kanal.on('cizim-temizle', hepsiniCiz),
      Kanal.on('*durum', hepsiniCiz),
      Kanal.on('*kisiler', bilgiYaz)
    ];
  },

  sok() { (this._coz || []).forEach(f => f && f()); this._coz = []; }
});
