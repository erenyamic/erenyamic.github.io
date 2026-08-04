/* ============================================================
   Yardımcılar
   ============================================================ */

const $  = (s, k) => (k || document).querySelector(s);
const $$ = (s, k) => Array.from((k || document).querySelectorAll(s));

const Kayit = {
  on: 'ag_',
  al(k, v) {
    try { const h = localStorage.getItem(this.on + k); return h === null ? v : JSON.parse(h); }
    catch (e) { return v; }
  },
  yaz(k, v) { try { localStorage.setItem(this.on + k, JSON.stringify(v)); } catch (e) {} },
  sil(k)   { try { localStorage.removeItem(this.on + k); } catch (e) {} }
};

function kacir(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function trNormal(s) {
  return String(s || '')
    .toLocaleLowerCase('tr-TR')
    .replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g')
    .replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]/g, '');
}

const iki = (n) => String(n).padStart(2, '0');
const sayiTR = (n) => new Intl.NumberFormat('tr-TR').format(Math.round(n));

function karistir(a) {
  const d = a.slice();
  for (let i = d.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [d[i], d[j]] = [d[j], d[i]]; }
  return d;
}

const bekle = (ms) => new Promise(r => setTimeout(r, ms));

function tikla(sn) {
  try { if (navigator.vibrate) navigator.vibrate(sn || 12); } catch (e) {}
}

function saatBicim(t) {
  const d = new Date(t * 1000);
  return iki(d.getHours()) + ':' + iki(d.getMinutes());
}

function benzersiz(on) {
  return (on || 'x') + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
}

/* ---------- Bildirim (toast) ---------- */
const Bildirim = {
  goster(metin, ikon, sure) {
    const kap = $('#bildirimler');
    if (!kap) return;
    const d = document.createElement('div');
    d.className = 'bildirim';
    d.innerHTML = `<span class="ik">${ikon || '✨'}</span><span>${metin}</span>`;
    kap.appendChild(d);
    const kapat = () => {
      d.classList.add('gider');
      setTimeout(() => d.remove(), 340);
    };
    d.addEventListener('click', kapat);
    setTimeout(kapat, sure || 5200);
    while (kap.children.length > 4) kap.firstElementChild.remove();
  }
};

/* ---------- Modal ---------- */
const Perde = {
  goster({ baslik, metin, butonlar }) {
    const eski = $('.perde'); if (eski) eski.remove();
    const p = document.createElement('div');
    p.className = 'perde';
    p.innerHTML = `<div class="perde-kutu">
      ${baslik ? `<h2>${baslik}</h2>` : ''}
      ${metin ? `<p>${metin}</p>` : ''}
      <div class="satir orta"></div>
    </div>`;
    const satir = $('.satir', p);
    (butonlar || [{ yazi: 'Tamam' }]).forEach(b => {
      const t = document.createElement('button');
      t.className = 'dugme' + (b.tur === 'hayalet' ? ' hayalet' : '');
      t.textContent = b.yazi;
      t.onclick = () => { p.remove(); if (b.tikla) b.tikla(); };
      satir.appendChild(t);
    });
    p.addEventListener('click', e => { if (e.target === p) p.remove(); });
    document.body.appendChild(p);
    return p;
  },
  kapat() { const p = $('.perde'); if (p) p.remove(); }
};

/* ---------- Konfeti (kalp & yıldız yağmuru) ---------- */
const Konfeti = (function () {
  let tuval, ctx, parcalar = [], calisiyor = false;

  function hazirla() {
    tuval = $('#fx'); if (!tuval) return false;
    ctx = tuval.getContext('2d');
    const o = Math.min(window.devicePixelRatio || 1, 2);
    tuval.width = Math.floor(innerWidth * o);
    tuval.height = Math.floor(innerHeight * o);
    ctx.setTransform(o, 0, 0, o, 0, 0);
    return true;
  }

  function kalpCiz(c, x, y, b, don, renk, saydam) {
    c.save(); c.translate(x, y); c.rotate(don); c.scale(b / 10, b / 10);
    c.globalAlpha = saydam;
    c.beginPath();
    c.moveTo(0, 0);
    c.bezierCurveTo(0, -3.2, -5, -3.2, -5, .4);
    c.bezierCurveTo(-5, 4, 0, 6.4, 0, 10);
    c.bezierCurveTo(0, 6.4, 5, 4, 5, .4);
    c.bezierCurveTo(5, -3.2, 0, -3.2, 0, 0);
    c.closePath(); c.fillStyle = renk; c.fill();
    c.restore();
  }

  function yildizCiz(c, x, y, b, don, renk, saydam) {
    c.save(); c.translate(x, y); c.rotate(don);
    c.globalAlpha = saydam; c.beginPath();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 ? b * .42 : b;
      const a = (Math.PI / 5) * i - Math.PI / 2;
      c[i ? 'lineTo' : 'moveTo'](Math.cos(a) * r, Math.sin(a) * r);
    }
    c.closePath(); c.fillStyle = renk; c.fill(); c.restore();
  }

  const renkler = ['#ff8fab', '#c8a2ff', '#7ee8fa', '#ffd97d', '#8affc1', '#ffffff'];

  function patlat(adet, kaynak) {
    if (!tuval && !hazirla()) return;
    const n = adet || 60;
    const ox = kaynak ? kaynak.x : innerWidth / 2;
    const oy = kaynak ? kaynak.y : innerHeight * .34;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const h = 2 + Math.random() * 9;
      parcalar.push({
        x: ox + (Math.random() - .5) * 40,
        y: oy + (Math.random() - .5) * 30,
        vx: Math.cos(a) * h * (kaynak ? 1 : .6),
        vy: Math.sin(a) * h - (kaynak ? 3 : 6),
        b: 5 + Math.random() * 12,
        don: Math.random() * 6.3,
        vdon: (Math.random() - .5) * .22,
        renk: renkler[(Math.random() * renkler.length) | 0],
        omur: 1,
        tip: Math.random() < .55 ? 'kalp' : 'yildiz'
      });
    }
    if (!calisiyor) { calisiyor = true; requestAnimationFrame(dongu); }
  }

  function dongu() {
    if (!ctx) { calisiyor = false; return; }
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    for (let i = parcalar.length - 1; i >= 0; i--) {
      const p = parcalar[i];
      p.vy += .26; p.vx *= .992; p.vy *= .992;
      p.x += p.vx; p.y += p.vy; p.don += p.vdon;
      p.omur -= .0085;
      if (p.omur <= 0 || p.y > innerHeight + 60) { parcalar.splice(i, 1); continue; }
      const f = p.tip === 'kalp' ? kalpCiz : yildizCiz;
      f(ctx, p.x, p.y, p.b, p.don, p.renk, Math.max(0, Math.min(1, p.omur * 1.5)));
    }
    if (parcalar.length) requestAnimationFrame(dongu);
    else { calisiyor = false; ctx.clearRect(0, 0, innerWidth, innerHeight); }
  }

  addEventListener('resize', () => { if (tuval) hazirla(); });
  return { patlat };
})();

/* ---------- Zaman farkı ---------- */
function gecenSure(baslangicMs, simdiMs) {
  let fark = Math.max(0, (simdiMs || Date.now()) - baslangicMs);
  const sn = Math.floor(fark / 1000);
  const b = new Date(baslangicMs), s = new Date(simdiMs || Date.now());

  let yil = s.getFullYear() - b.getFullYear();
  let ay  = s.getMonth() - b.getMonth();
  let gun = s.getDate() - b.getDate();
  if (gun < 0) { ay--; gun += new Date(s.getFullYear(), s.getMonth(), 0).getDate(); }
  if (ay < 0)  { yil--; ay += 12; }

  return {
    yil, ay, gun,
    saat: Math.floor(sn / 3600) % 24,
    dakika: Math.floor(sn / 60) % 60,
    saniye: sn % 60,
    toplamGun: Math.floor(sn / 86400),
    toplamSaat: Math.floor(sn / 3600),
    toplamDakika: Math.floor(sn / 60),
    toplamSaniye: sn
  };
}
