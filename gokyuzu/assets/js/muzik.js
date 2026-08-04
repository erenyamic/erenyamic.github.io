/* ============================================================
   MÜZİK — dosyasız, tarayıcıda üretilen müzik kutusu ezgisi
   (WebAudio ile sentezlenir; hiçbir ses dosyası gerekmez)
   ============================================================ */

const Muzik = (function () {
  let ctx = null, ana = null, suzgec = null, zamanlayici = null;
  let acik = false, siradaki = 0, nota = 0;

  const N = {
    C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, B4: 493.88,
    C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.00, C6: 1046.50,
    C3: 130.81, E3: 164.81, F3: 174.61, G3: 196.00, A3: 220.00
  };

  // ezgi: [frekans, süre(vuruş)] — null = sus
  const ezgi = [
    [N.E5,1],[N.G5,1],[N.A5,1],[N.G5,1],  [N.E5,1],[N.D5,1],[N.C5,2],
    [N.E5,1],[N.G5,1],[N.A5,1],[N.C6,1],  [N.A5,1],[N.G5,1],[N.E5,2],
    [N.D5,1],[N.E5,1],[N.G5,1],[N.E5,1],  [N.D5,1],[N.C5,1],[N.A4,2],
    [N.C5,1],[N.D5,1],[N.E5,1],[N.G5,1],  [N.E5,1],[N.D5,1],[N.C5,2]
  ];
  const bas = [N.A3, N.F3, N.C3, N.G3, N.A3, N.F3, N.C3, N.G3];
  const VURUS = 0.34;

  function kur() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    suzgec = ctx.createBiquadFilter();
    suzgec.type = 'lowpass';
    suzgec.frequency.value = 2600;
    ana = ctx.createGain();
    ana.gain.value = 0;
    suzgec.connect(ana);
    ana.connect(ctx.destination);
    return true;
  }

  function calNota(frekans, an, sure, ses, tur) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = tur || 'triangle';
    o.frequency.setValueAtTime(frekans, an);
    g.gain.setValueAtTime(0.0001, an);
    g.gain.exponentialRampToValueAtTime(ses, an + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, an + sure);
    o.connect(g); g.connect(suzgec);
    o.start(an); o.stop(an + sure + 0.04);
  }

  function zamanla() {
    if (!ctx) return;
    const ufuk = ctx.currentTime + 0.8;
    while (siradaki < ufuk) {
      const [f, u] = ezgi[nota % ezgi.length];
      const sure = u * VURUS;
      if (f) {
        calNota(f, siradaki, Math.min(1.5, sure * 2.3), 0.16, 'triangle');
        calNota(f * 2, siradaki, Math.min(0.9, sure * 1.4), 0.035, 'sine');
      }
      if (nota % 4 === 0) {
        calNota(bas[(nota / 4) % bas.length] / 2, siradaki, VURUS * 4.2, 0.075, 'sine');
      }
      siradaki += sure;
      nota++;
    }
  }

  function ac() {
    if (!ctx && !kur()) return false;
    if (ctx.state === 'suspended') ctx.resume();
    acik = true;
    siradaki = ctx.currentTime + 0.15;
    ana.gain.cancelScheduledValues(ctx.currentTime);
    ana.gain.setValueAtTime(Math.max(0.0001, ana.gain.value), ctx.currentTime);
    ana.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 1.6);
    zamanla();
    zamanlayici = setInterval(zamanla, 220);
    return true;
  }

  function kapa() {
    acik = false;
    if (zamanlayici) { clearInterval(zamanlayici); zamanlayici = null; }
    if (ctx && ana) {
      ana.gain.cancelScheduledValues(ctx.currentTime);
      ana.gain.setValueAtTime(ana.gain.value, ctx.currentTime);
      ana.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
    }
  }

  /* Küçük ses efektleri */
  function tin(frekans, sure, ses) {
    if (!ctx) { if (!kur()) return; }
    if (ctx.state === 'suspended') return;   // kullanıcı henüz izin vermedi
    const an = ctx.currentTime;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(frekans, an);
    g.gain.setValueAtTime(0.0001, an);
    g.gain.exponentialRampToValueAtTime(ses || 0.12, an + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, an + (sure || 0.4));
    o.connect(g); g.connect(ctx.destination);
    o.start(an); o.stop(an + (sure || 0.4) + 0.05);
  }

  return {
    degistir() { acik ? kapa() : ac(); return acik; },
    get acikMi() { return acik; },
    ac, kapa,
    efekt(tur) {
      if (tur === 'yildiz')   { tin(880, .5, .08); setTimeout(() => tin(1318, .45, .05), 70); }
      if (tur === 'basari')   { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tin(f, .5, .08), i * 90)); }
      if (tur === 'bildirim') { tin(660, .3, .06); }
    }
  };
})();
