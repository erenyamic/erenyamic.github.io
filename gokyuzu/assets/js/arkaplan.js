/* ============================================================
   ARKA PLAN — yıldızlı gökyüzü, kayan yıldızlar, hafif paralaks
   ============================================================ */

const Arkaplan = (function () {
  let tuval, ctx, g = 1, en = 0, boy = 0;
  let yildizlar = [], kayanlar = [], toz = [];
  let fareX = 0, fareY = 0, hedefX = 0, hedefY = 0;
  let cerceve = null, yavas = false, yogun = false;

  function olcek() {
    en = innerWidth; boy = innerHeight;
    g = Math.min(devicePixelRatio || 1, 2);
    tuval.width = Math.floor(en * g);
    tuval.height = Math.floor(boy * g);
    tuval.style.width = en + 'px';
    tuval.style.height = boy + 'px';
    ctx.setTransform(g, 0, 0, g, 0, 0);
    uret();
  }

  function uret() {
    const adet = Math.min(230, Math.round((en * boy) / 7000));
    yildizlar = [];
    for (let i = 0; i < adet; i++) {
      const k = Math.random();
      yildizlar.push({
        x: Math.random() * en,
        y: Math.random() * boy,
        r: k < .82 ? .5 + Math.random() * .9 : 1.3 + Math.random() * 1.2,
        p: .25 + Math.random() * .65,
        hiz: .3 + Math.random() * 1.6,
        faz: Math.random() * Math.PI * 2,
        derinlik: k < .82 ? .35 : 1,
        renk: Math.random() < .12
          ? (Math.random() < .5 ? '255,200,220' : '190,205,255')
          : '255,255,255'
      });
    }
    toz = [];
    for (let i = 0; i < 26; i++) {
      toz.push({
        x: Math.random() * en, y: Math.random() * boy,
        r: 12 + Math.random() * 46,
        vx: (Math.random() - .5) * .09, vy: (Math.random() - .5) * .07,
        p: .012 + Math.random() * .03
      });
    }
  }

  function kayanEkle() {
    const soldan = Math.random() < .5;
    kayanlar.push({
      x: soldan ? -60 : en * (.25 + Math.random() * .7),
      y: Math.random() * boy * .5,
      vx: (soldan ? 1 : -1) * (5 + Math.random() * 5),
      vy: 2.4 + Math.random() * 2.4,
      uzun: 90 + Math.random() * 120,
      omur: 1
    });
  }

  function ciz(t) {
    cerceve = requestAnimationFrame(ciz);
    ctx.clearRect(0, 0, en, boy);

    fareX += (hedefX - fareX) * .045;
    fareY += (hedefY - fareY) * .045;

    // yumuşak nebula lekeleri
    for (const z of toz) {
      z.x += z.vx; z.y += z.vy;
      if (z.x < -80) z.x = en + 80; if (z.x > en + 80) z.x = -80;
      if (z.y < -80) z.y = boy + 80; if (z.y > boy + 80) z.y = -80;
      const gr = ctx.createRadialGradient(z.x, z.y, 0, z.x, z.y, z.r);
      gr.addColorStop(0, `rgba(190,170,255,${z.p * (yogun ? 1.7 : 1)})`);
      gr.addColorStop(1, 'rgba(190,170,255,0)');
      ctx.fillStyle = gr;
      ctx.beginPath(); ctx.arc(z.x, z.y, z.r, 0, 6.284); ctx.fill();
    }

    // yıldızlar
    for (const y of yildizlar) {
      const parla = .55 + .45 * Math.sin(t / 1000 * y.hiz + y.faz);
      const px = y.x + fareX * y.derinlik * 14;
      const py = y.y + fareY * y.derinlik * 14;
      const a = y.p * parla * (yogun ? 1.25 : 1);
      ctx.fillStyle = `rgba(${y.renk},${Math.min(1, a)})`;
      ctx.beginPath(); ctx.arc(px, py, y.r, 0, 6.284); ctx.fill();
      if (y.r > 1.3) {
        ctx.fillStyle = `rgba(${y.renk},${Math.min(1, a) * .16})`;
        ctx.beginPath(); ctx.arc(px, py, y.r * 3.6, 0, 6.284); ctx.fill();
      }
    }

    // kayan yıldızlar
    for (let i = kayanlar.length - 1; i >= 0; i--) {
      const k = kayanlar[i];
      k.x += k.vx; k.y += k.vy; k.omur -= .006;
      if (k.omur <= 0 || k.y > boy + 80 || k.x < -160 || k.x > en + 160) { kayanlar.splice(i, 1); continue; }
      const n = Math.hypot(k.vx, k.vy);
      const gx = k.x - (k.vx / n) * k.uzun, gy = k.y - (k.vy / n) * k.uzun;
      const gr = ctx.createLinearGradient(k.x, k.y, gx, gy);
      gr.addColorStop(0, `rgba(255,255,255,${.85 * k.omur})`);
      gr.addColorStop(.35, `rgba(255,190,215,${.35 * k.omur})`);
      gr.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.strokeStyle = gr; ctx.lineWidth = 1.9; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(k.x, k.y); ctx.lineTo(gx, gy); ctx.stroke();
    }

    if (!yavas && Math.random() < (yogun ? .0042 : .0018)) kayanEkle();
  }

  function baslat() {
    tuval = document.getElementById('gokyuzu');
    if (!tuval) return;
    ctx = tuval.getContext('2d');
    yavas = matchMedia('(prefers-reduced-motion: reduce)').matches;
    olcek();
    addEventListener('resize', olcek, { passive: true });
    if (!matchMedia('(hover: none)').matches) {
      addEventListener('pointermove', (e) => {
        hedefX = (e.clientX / innerWidth - .5) * 2;
        hedefY = (e.clientY / innerHeight - .5) * 2;
      }, { passive: true });
    }
    if (!yavas) cerceve = requestAnimationFrame(ciz);
    else ciz(0), cancelAnimationFrame(cerceve);
  }

  return {
    baslat,
    yildizYagdir(n) { for (let i = 0; i < (n || 3); i++) setTimeout(kayanEkle, i * 220); },
    yogunluk(v) { yogun = !!v; }
  };
})();
