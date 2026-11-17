/* Tastefy Entrega · apresentação da final do Raio-X (17/11).
   Paradas por teclado: → ↓ espaço PageDown avançam; ← ↑ PageUp voltam; Home volta ao início; F tela cheia. */
(function () {
  'use strict';
  gsap.registerPlugin(DrawSVGPlugin, MotionPathPlugin, CustomEase);
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const SAI = 'power3.out', ENTRA = 'power2.inOut';

  // Cada parada = uma cena e um "tempo" dentro dela. cap = texto pequeno do topo.
  const STOPS = [
    { c: 'capa', b: 0, cap: 'Raio-X da Loja · NFB Cariacica' },
    { c: 'caderno', b: 0, cap: 'A dor' },
    { c: 'perguntas', b: 0, cap: 'A dor' },
    { c: 'visita', b: 0, cap: 'A loja · visita em 12/11' },
    { c: 'tres', b: 0, cap: 'A solução', cortina: true },
    { c: 'tres', b: 1, cap: 'A solução' },
    { c: 'tres', b: 2, cap: 'A solução' },
    { c: 'tres', b: 3, cap: 'A solução' },
    { c: 'video', b: 0, cap: 'A solução · 1 minuto' },
    { c: 'fluxo', b: 0, cap: 'A solução' },
    { c: 'rotas', b: 0, cap: 'A solução · rotas reais' },
    { c: 'numeros', b: 0, cap: 'O teste', cortina: true },
    { c: 'antes', b: 0, cap: 'Antes e depois' },
    { c: 'custo', b: 0, cap: 'Custo e setor' },
    { c: 'mais', b: 0, cap: '', cortina: true },
    { c: 'mais', b: 1, cap: '' },
    { c: 'fecho', b: 0, cap: 'Raio-X da Loja · NFB Cariacica' },
  ];
  const cena = (n) => $(`[data-cena="${n}"]`);

  /* ---------- utilidades ---------- */
  function conta(el, ate, dur = 1.4, sufixo = '') {
    const o = { v: 0 };
    return gsap.to(o, { v: ate, duration: dur, ease: 'power2.out', onUpdate: () => { el.textContent = Math.round(o.v) + sufixo; } });
  }
  function aparece(alvos, extra = {}) {
    return gsap.fromTo(alvos, { autoAlpha: 0, y: 28 }, { autoAlpha: 1, y: 0, duration: .8, ease: SAI, stagger: .12, ...extra });
  }

  /* ---------- rotas reais (canvas) ---------- */
  const R = window.ROTAS;
  const rot = { cv: $('#rotasCanvas'), ctx: null, W: 0, H: 0, img: new Image(), t: R ? R.w[0] : 0, raf: 0, pts: [], ent: [] };
  rot.img.src = 'assets/img/mapa-escuro.webp';
  const CORES = ['#FFCC00', '#A78BFA', '#F5F5F2', '#22C55E'];
  function rotPrepara() {
    const r = rot.cv.getBoundingClientRect(); if (!r.width) return false;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    rot.W = r.width; rot.H = r.height; rot.cv.width = Math.round(r.width * dpr); rot.cv.height = Math.round(r.height * dpr);
    rot.ctx = rot.cv.getContext('2d'); rot.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const S = 256 * Math.pow(2, R.z), [CX, CY, CW, CH] = R.crop;
    const gx = (lng) => (lng + 180) / 360 * S;
    const gy = (lat) => { const a = lat * Math.PI / 180; return (1 - Math.log(Math.tan(a) + 1 / Math.cos(a)) / Math.PI) / 2 * S; };
    rot.P = (dl, dg) => [(gx(R.store[1] + dg / 1e5) - CX) / CW * rot.W, (gy(R.store[0] + dl / 1e5) - CY) / CH * rot.H];
    rot.pts = R.c.map((c) => c.p.map((q) => { const [x, y] = rot.P(q[1], q[2]); return [q[0], x, y]; }));
    rot.ent = R.d.map((d) => ({ t0: d[0], te: d[3], tc: d[4], xy: rot.P(d[5], d[6]), c: d[7] }));
    return true;
  }
  function rotDesenha(t) {
    const c = rot.ctx; if (!c) return;
    c.clearRect(0, 0, rot.W, rot.H);
    if (rot.img.complete && rot.img.naturalWidth) c.drawImage(rot.img, 0, 0, rot.W, rot.H);
    c.fillStyle = 'rgba(11,11,12,.38)'; c.fillRect(0, 0, rot.W, rot.H);
    c.lineJoin = 'round'; c.lineCap = 'round';
    // rastros
    rot.pts.forEach((p, i) => {
      if (!p.length || t < p[0][0]) return;
      const cor = CORES[i % CORES.length];
      const path = new Path2D(); let ant = null, cab = null;
      for (let k = 0; k < p.length; k++) {
        const q = p[k]; if (q[0] > t) {
          if (ant && q[0] - ant[0] < 300) { const f = (t - ant[0]) / (q[0] - ant[0]); cab = [ant[1] + (q[1] - ant[1]) * f, ant[2] + (q[2] - ant[2]) * f]; path.lineTo(cab[0], cab[1]); }
          break;
        }
        if (!ant || q[0] - ant[0] > 300) path.moveTo(q[1], q[2]); else path.lineTo(q[1], q[2]);
        ant = q; cab = [q[1], q[2]];
      }
      c.strokeStyle = cor; c.globalAlpha = .18; c.lineWidth = 7; c.stroke(path);
      c.globalAlpha = .9; c.lineWidth = 2.2; c.stroke(path);
      c.globalAlpha = 1;
      if (cab && t - (ant ? ant[0] : 0) < 600) {
        c.fillStyle = cor; c.shadowColor = cor; c.shadowBlur = 16;
        c.beginPath(); c.arc(cab[0], cab[1], 5.5, 0, Math.PI * 2); c.fill(); c.shadowBlur = 0;
      }
    });
    // pedidos
    let n = 0;
    rot.ent.forEach((e) => {
      if (t < e.t0 || (e.tc != null && t >= e.tc)) return;
      const [x, y] = e.xy;
      if (e.te != null && t >= e.te) {
        n++;
        const idade = t - e.te;
        if (idade < 240) { c.strokeStyle = 'rgba(34,197,94,' + (1 - idade / 240) + ')'; c.lineWidth = 2; c.beginPath(); c.arc(x, y, 5 + idade / 12, 0, Math.PI * 2); c.stroke(); }
        c.fillStyle = '#22C55E'; c.beginPath(); c.arc(x, y, 3.6, 0, Math.PI * 2); c.fill();
      } else {
        c.strokeStyle = '#A78BFA'; c.lineWidth = 2; c.beginPath(); c.arc(x, y, 5, 0, Math.PI * 2); c.stroke();
      }
    });
    // loja
    const [lx, ly] = rot.P(0, 0);
    c.fillStyle = '#FFCC00'; c.beginPath(); c.arc(lx, ly, 9, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#111'; c.beginPath(); c.moveTo(lx - 4.5, ly + .5); c.lineTo(lx, ly - 4.5); c.lineTo(lx + 4.5, ly + .5); c.lineTo(lx + 4.5, ly + 4.5); c.lineTo(lx - 4.5, ly + 4.5); c.closePath(); c.fill();
    // relógio e contagem
    const s = 11 * 3600 + 30 * 60 + Math.floor(t), h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60);
    $('#rotasHora').textContent = String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
    $('#rotasEnt').textContent = n;
  }
  function rotPara() { cancelAnimationFrame(rot.raf); rot.raf = 0; }
  function rotToca(instantaneo) {
    rotPara(); if (!R || !rotPrepara()) return;
    const [W0, W1] = R.w, DUR = 16000;
    if (instantaneo) { rotDesenha(W1); return; }
    const ini = performance.now();
    const passo = (agora) => {
      try {
        const f = Math.min(1, (agora - ini) / DUR), e = f < .5 ? 2 * f * f : 1 - Math.pow(-2 * f + 2, 2) / 2;
        rotDesenha(W0 + (W1 - W0) * (0.06 + 0.94 * e));
        if (f < 1) rot.raf = requestAnimationFrame(passo); else rot.raf = 0;
      } catch (err) { console.error(err); rot.raf = 0; }
    };
    rot.raf = requestAnimationFrame(passo);
  }

  /* ---------- vídeo ---------- */
  const video = $('#video'), moldura = $('.video-moldura');
  video.addEventListener('error', () => moldura.classList.add('sem-video'));
  function videoToca(instantaneo) {
    if (moldura.classList.contains('sem-video') || !video.currentSrc && video.networkState === 3) {
      moldura.classList.add('sem-video');
      const tl = gsap.timeline();
      tl.fromTo('.vr-torre', { autoAlpha: 0, x: -60 }, { autoAlpha: 1, x: 0, duration: 1, ease: SAI })
        .fromTo('.vr-cel', { autoAlpha: 0, y: 60 }, { autoAlpha: 1, y: 0, duration: 1, ease: SAI }, .25);
      if (instantaneo) tl.progress(1);
      return;
    }
    try { video.currentTime = 0; } catch (e) { /* ainda carregando */ }
    if (!instantaneo) { const p = video.play(); if (p && p.catch) p.catch(() => {}); }
  }
  function videoPara() { try { video.pause(); } catch (e) { /* nada */ } }

  /* ---------- montagem de cada cena ----------
     Cada função recebe o tempo (b) e devolve uma timeline que sai do estado inicial e chega no final daquele tempo. */
  const MONTA = {
    capa() {
      const tl = gsap.timeline();
      tl.fromTo('.pino-capa', { scale: 0, xPercent: -50, yPercent: -50 }, { scale: 1, xPercent: -50, yPercent: -50, duration: .7, ease: 'back.out(2)' })
        .add(aparece(['.capa-txt .kicker', '.capa-txt .l1', '.capa-txt .l2', '.assina'], { stagger: .16 }), .2)
        .fromTo('.dica', { autoAlpha: 0 }, { autoAlpha: 1, duration: .8 }, 1.4)
        .to('.dica', { y: 6, duration: .9, ease: 'sine.inOut', yoyo: true, repeat: 5 }, 2.2);
      return tl;
    },
    caderno() {
      const tl = gsap.timeline(), n = $('[data-cena="caderno"] h2 .num');
      tl.fromTo('.caderno-foto', { autoAlpha: 0, y: 60, rotate: -9 }, { autoAlpha: 1, y: 0, rotate: -3, duration: 1.1, ease: SAI })
        .add(aparece(['.caderno-txt .kicker', '.caderno-txt h2', '.caderno-txt .sub']), .3)
        .add(conta(n, 70, 1.6), .45)
        .fromTo('.caderno-foto .risco path', { drawSVG: '0%' }, { drawSVG: '100%', duration: 1.6, ease: 'power2.inOut' }, 1.2);
      return tl;
    },
    perguntas() {
      const tl = gsap.timeline(), li = $$('.perg li');
      tl.add(aparece(li, { stagger: .7, duration: .7 }))
        .to(li, { color: 'rgba(245,245,242,.28)', duration: .6, ease: 'power1.out' }, '+=.5')
        .add(aparece('.perg-fim'), '<.1');
      return tl;
    },
    visita() {
      const tl = gsap.timeline();
      tl.fromTo('.visita-foto', { clipPath: 'inset(0 100% 0 0 round 22px)', autoAlpha: 1 }, { clipPath: 'inset(0 0% 0 0 round 22px)', duration: 1.2, ease: 'power3.inOut' })
        .fromTo('.visita-foto img', { scale: 1.12 }, { scale: 1, duration: 1.6, ease: SAI }, 0)
        .add(aparece(['.visita-txt .kicker', '.visita-txt h2', '.visita-num > div']), .5);
      tl.add(conta($('.visita-num [data-conta]'), 7, 1), .9);
      return tl;
    },
    tres(b) {
      const tl = gsap.timeline(), ti = $$('.ti');
      const icone = (el) => gsap.fromTo(el, { autoAlpha: 0, scale: .25, filter: 'blur(4px)' }, { autoAlpha: 1, scale: 1, filter: 'blur(0px)', duration: .7, ease: SAI });
      if (b === 0) { tl.add(aparece('.tres-hoje')).add(icone(ti[0]), .5); }
      if (b === 1) tl.add(icone(ti[1]));
      if (b === 2) tl.add(icone(ti[2])).fromTo('.ti-x', { drawSVG: '0%' }, { drawSVG: '100%', duration: .6, ease: 'power2.out' }, .5);
      if (b === 3) {
        tl.add(aparece('.tres-repete span', { stagger: .65, duration: .5 }))
          .to(['.tres-hoje', '.tres-repete'], { autoAlpha: 0, duration: .4 }, '+=.7')
          .to(ti, { x: (i) => (1 - i) * innerWidth * .18, scale: .3, autoAlpha: 0, filter: 'blur(6px)', duration: .7, ease: 'power3.in', stagger: .04 }, '<')
          .set('.tres-uma', { autoAlpha: 1 })
          .add(aparece('.tres-nao'))
          .fromTo('.tres-uma .logo-grande', { autoAlpha: 0, scale: .6, filter: 'blur(10px)' }, { autoAlpha: 1, scale: 1, filter: 'blur(0px)', duration: 1, ease: 'expo.out' }, '+=.5')
          .add(aparece('.tres-def'), '-=.4');
      }
      return tl;
    },
    video(b, inst) { videoToca(inst); return gsap.timeline().fromTo('.video-moldura', { autoAlpha: 0, scale: .96 }, { autoAlpha: 1, scale: 1, duration: .8, ease: SAI }); },
    fluxo() {
      const tl = gsap.timeline(), D = 5.2;
      tl.add(aparece('[data-cena="fluxo"] .kicker'))
        .fromTo('.fluxo-rota-viva', { drawSVG: '0%' }, { drawSVG: '100%', duration: D, ease: 'none' }, .2)
        .to('#fluxoMoto', { motionPath: { path: '#fluxoRota', align: '#fluxoRota', alignOrigin: [.5, .5] }, duration: D, ease: 'none', immediateRender: true }, .2);
      $$('.fp').forEach((el, i) => tl.add(aparece(el, { duration: .6 }), .2 + i * D / 4 - (i ? .15 : 0)));
      return tl;
    },
    rotas(b, inst) {
      const tl = gsap.timeline();
      tl.add(aparece(['.rotas-txt .kicker', '.rotas-txt h2', '.rotas-relogio', '.rotas-conta', '.rotas-txt .sub']))
        .fromTo('.rotas-mapa', { autoAlpha: 0, scale: .97 }, { autoAlpha: 1, scale: 1, duration: .9, ease: SAI }, 0);
      rotToca(inst);
      return tl;
    },
    numeros() {
      const tl = gsap.timeline(), n = $$('.n');
      tl.fromTo('.nums', { autoAlpha: 0 }, { autoAlpha: 1, duration: .4 }, 0).add(aparece('[data-cena="numeros"] .kicker'), 0);
      n.forEach((el, i) => { tl.add(aparece(el, { duration: .7 }), .3 + i * .45); const s = $('[data-ate]', el); tl.add(conta(s, +s.dataset.ate, 1.4), .35 + i * .45); });
      tl.add(aparece('.fonte'), '-=.6');
      return tl;
    },
    antes() {
      const tl = gsap.timeline();
      tl.add(aparece('[data-cena="antes"] .kicker'))
        .fromTo('.ah-antes', { autoAlpha: 0, x: -40, rotate: -6 }, { autoAlpha: 1, x: 0, rotate: -3, duration: .9, ease: SAI }, 0)
        .fromTo('.ah-risco path', { drawSVG: '0%' }, { drawSVG: '100%', duration: .5, ease: 'power2.out', stagger: .25 }, .8)
        .to('.ah-antes img', { filter: 'grayscale(1) brightness(.55)', duration: .6 }, 1.1)
        .fromTo('.ah-seta path', { drawSVG: '0%' }, { drawSVG: '100%', duration: .8, ease: 'power2.inOut' }, 1.3)
        .fromTo('.ah-seta circle', { scale: 0, transformOrigin: 'center' }, { scale: 1, duration: .35, ease: 'back.out(2)' }, 2)
        .fromTo('.ah-depois', { autoAlpha: 0, x: 50 }, { autoAlpha: 1, x: 0, duration: .9, ease: SAI }, 1.9)
        .fromTo('.ah-tela', { clipPath: 'inset(0 100% 0 0 round 16px)' }, { clipPath: 'inset(0 0% 0 0 round 16px)', duration: 1.1, ease: 'power3.inOut' }, 2)
        .add(aparece('.ah-frase'), 2.8);
      return tl;
    },
    custo() {
      const tl = gsap.timeline();
      tl.fromTo('.custo-zero b', { autoAlpha: 0, scale: .82, filter: 'blur(12px)' }, { autoAlpha: 1, scale: 1, filter: 'blur(0px)', duration: 1.1, ease: 'expo.out' })
        .add(aparece('.custo-zero span'), .4)
        .add(aparece('.custo-cards div', { stagger: .15 }), .9);
      return tl;
    },
    mais(b) {
      const tl = gsap.timeline();
      if (b === 0) tl.fromTo('.mais-1', { autoAlpha: 0 }, { autoAlpha: 1, duration: 1.2, ease: 'power1.inOut' });
      if (b === 1) {
        tl.to('.mais-1', { autoAlpha: 0, duration: .5 }).set('.mais-2', { autoAlpha: 1 })
          .fromTo('.m-num', { autoAlpha: 0, scale: .7 }, { autoAlpha: 1, scale: 1, duration: .9, ease: 'expo.out' })
          .add(conta($('.m-num b'), 88, 1.8), '<')
          .add(aparece('.mais-2 .m', { stagger: .6, duration: .8 }), '-=.4')
          .add(aparece('.mais-2 .mm'), '+=.2');
      }
      return tl;
    },
    fecho() {
      const tl = gsap.timeline();
      tl.fromTo('.pino-fecho', { scale: 0, xPercent: -50, yPercent: -50 }, { scale: 1, xPercent: -50, yPercent: -50, duration: .7, ease: 'back.out(2)' })
        .add(aparece(['.fecho-txt .logo-grande', '.fecho-txt h2', '.fecho-txt .sub'], { stagger: .2 }), .3);
      return tl;
    },
  };

  // Estado inicial de cada cena: tudo o que anima começa escondido (autoAlpha, para não pegar clique).
  function zera(nome) {
    const el = cena(nome);
    gsap.killTweensOf(el.querySelectorAll('*'));
    const com = el.querySelectorAll('[style]'); if (com.length) gsap.set(com, { clearProps: 'all' });
    if (nome === 'tres') gsap.set(['.ti', '.tres-hoje', '.tres-repete span', '.tres-uma'], { autoAlpha: 0 }), gsap.set('.tres-repete', { autoAlpha: 1 });
    if (nome === 'mais') gsap.set('.mais-2', { autoAlpha: 0 }), gsap.set('.mais-1', { autoAlpha: 0 });
    if (nome === 'rotas') rotPara();
    if (nome === 'video') videoPara();
  }

  /* ---------- motor de paradas ---------- */
  let atual = -1, tlAtual = null, trocando = false, capDesejado = '', atraso = null;
  const pontos = $('#estradaPontos');
  STOPS.forEach((s, i) => { const d = document.createElement('i'); d.style.left = (i / (STOPS.length - 1) * 100) + '%'; pontos.appendChild(d); });
  function estrada(i, inst) {
    const pct = i / (STOPS.length - 1) * 100;
    gsap.to('#moto', { left: pct + '%', duration: inst ? 0 : .9, ease: 'power2.inOut' });
    $$('#estradaPontos i').forEach((d, k) => d.classList.toggle('feito', k <= i));
    const hc = $('#hudCap'); capDesejado = STOPS[i].cap;
    if (hc.textContent === capDesejado) return;
    gsap.killTweensOf(hc);
    if (inst) { hc.textContent = capDesejado; gsap.set(hc, { autoAlpha: 1 }); return; }
    gsap.to(hc, { autoAlpha: 0, duration: .18, onComplete: () => { hc.textContent = capDesejado; gsap.to(hc, { autoAlpha: 1, duration: .3 }); } });
  }
  function montaAte(nome, b, inst) {
    zera(nome);
    for (let k = 0; k < b; k++) MONTA[nome](k, true).progress(1);
    const tl = MONTA[nome](b, inst);
    if (inst) tl.progress(1);
    return tl;
  }
  function vai(i, inst = false) {
    i = Math.max(0, Math.min(STOPS.length - 1, i));
    if (i === atual) return;
    const de = atual >= 0 ? STOPS[atual] : null, para = STOPS[i];
    const frente = i > atual;
    atual = i;
    try { history.replaceState(null, '', '#' + i); } catch (e) { /* file:// */ }
    estrada(i, inst);
    if (tlAtual && de && de.c === para.c) { tlAtual.progress(1); }
    if (de && de.c === para.c) {
      // mesma cena, outro tempo
      if (frente && para.b === de.b + 1) { tlAtual = MONTA[para.c](para.b, inst); if (inst) tlAtual.progress(1); }
      else tlAtual = montaAte(para.c, para.b, inst);
      return;
    }
    const sai = de ? cena(de.c) : null, entra = cena(para.c);
    if (atraso) { atraso.kill(); atraso = null; }
    if (de && de.c === 'video') videoPara();
    if (de && de.c === 'rotas') rotPara();
    gsap.killTweensOf(entra);
    const troca = () => {
      if (sai) { gsap.killTweensOf(sai); gsap.set(sai, { autoAlpha: 0 }); zera(de.c); }
      gsap.set(entra, { autoAlpha: 1 });
      tlAtual = montaAte(para.c, para.b, inst);
    };
    if (inst || !sai) { troca(); return; }
    if (false) {
      trocando = true;
      gsap.set('#cortina', { visibility: 'visible' });
      gsap.timeline({ onComplete: () => { gsap.set('#cortina', { visibility: 'hidden' }); trocando = false; } })
        .fromTo('#cortinaPath', { drawSVG: '0% 0%' }, { drawSVG: '0% 100%', duration: .6, ease: 'power2.in' })
        .add(troca)
        .to('#cortinaPath', { drawSVG: '100% 100%', duration: .6, ease: 'power2.out' }, '+=.06');
      return;
    }
    const nomeSai = de.c;
    gsap.to(sai, { autoAlpha: 0, duration: .3, ease: 'power1.out', onComplete: () => { if (STOPS[atual].c !== nomeSai) zera(nomeSai); } });
    gsap.set(entra, { autoAlpha: 1 });
    const tl = montaAte(para.c, para.b, false); tlAtual = tl; tl.pause();
    atraso = gsap.delayedCall(.18, () => { atraso = null; if (tlAtual === tl) tl.play(); });
  }

  /* ---------- a rota que não quebra ----------
     Uma linha só, da capa ao fecho, desenhada pela rolagem. Cada parada ocupa 100vh da página; no ponto de leitura
     da parada (rolagem = i * altura da tela) a cabeça da linha fica no meio da altura, na lateral livre da cena. */
  // Âncora de cada parada: [x, y] em fração da tela no ponto de leitura. Nas paradas internas de uma cena a linha
  // repete a âncora (trecho curto e reto). Onde a cena tem um alvo (pino, rabisco, passo 1, mapa), a linha emenda nele.
  const LADO = [0.08, 0.03, 0.94, 0.03, 0.95, 0.95, 0.95, 0.95, 0.035, 0, 0, 0.975, 0.04, 0.95, 0.05, 0.05, 0.5];
  const ALVO = { 1: 'risco', 9: 'fluxo', 10: 'mapa', 16: 'fecho' };
  const trilho = { cv: $('#rota'), ctx: null, W: 0, H: 0, pts: [], anc: [] };
  const logoMoto = new Image(); logoMoto.src = 'assets/img/logo-entrega.webp'; logoMoto.onload = () => trilhoDesenha();
  function ancoras() {
    const W = innerWidth, H = innerHeight;
    return LADO.map((x, i) => {
      const alvo = ALVO[i];
      if (alvo === 'risco') {
        const r = $('.caderno-foto').getBoundingClientRect(); if (r.width) return [(r.left + r.width * .08) / W, (r.top + r.height * 20 / 178) / H];
      }
      if (alvo === 'fluxo') {
        const r = $('.fp:nth-child(1) b').getBoundingClientRect(); if (r.width) return [(r.left + r.width / 2) / W, (r.top + r.height / 2) / H];
      }
      if (alvo === 'fecho') {
        const r = $('.pino-fecho').getBoundingClientRect(); if (r.width) return [(r.left + r.width / 2) / W, (r.top + r.height / 2) / H];
      }
      if (alvo === 'mapa') {
        const r = $('.rotas-mapa').getBoundingClientRect(); if (r.width) return [(r.left + 2) / W, .5];
      }
      return [x || .05, .5];
    });
  }
  function trilhoMonta() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    trilho.W = innerWidth; trilho.H = innerHeight;
    trilho.cv.width = Math.round(trilho.W * dpr); trilho.cv.height = Math.round(trilho.H * dpr);
    trilho.ctx = trilho.cv.getContext('2d'); trilho.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // mede as âncoras com as cenas no lugar (visibility não tira do layout)
    const anc = ancoras(); trilho.anc = anc;
    const pts = [];
    for (let i = 0; i < anc.length - 1; i++) {
      const A = [anc[i][0], i + anc[i][1]], B = [anc[i + 1][0], i + 1 + anc[i + 1][1]];
      const d = (B[1] - A[1]) * .55;
      for (let k = 0; k < 60; k++) {
        const t = k / 60, u = 1 - t;
        pts.push([u * u * u * A[0] + 3 * u * u * t * A[0] + 3 * u * t * t * B[0] + t * t * t * B[0],
                  u * u * u * A[1] + 3 * u * u * t * (A[1] + d) + 3 * u * t * t * (B[1] - d) + t * t * t * B[1]]);
      }
    }
    pts.push([anc[anc.length - 1][0], anc.length - 1 + anc[anc.length - 1][1]]);
    trilho.pts = pts;
  }
  function trilhoDesenha() {
    const c = trilho.ctx; if (!c || !trilho.pts.length) return;
    const W = trilho.W, H = trilho.H, rol = Math.max(0, scrollY / H);
    c.clearRect(0, 0, W, H);
    const sx = (p) => p[0] * W, sy = (p) => (p[1] - rol) * H;
    // a cabeça anda pela curva conforme a rolagem: na parada i ela está exatamente na âncora i
    const pos = Math.min(trilho.pts.length - 1, rol * 60);
    const k0 = Math.floor(pos), f = pos - k0, p0 = trilho.pts[k0], p1 = trilho.pts[Math.min(k0 + 1, trilho.pts.length - 1)];
    const head = [p0[0] + (p1[0] - p0[0]) * f, p0[1] + (p1[1] - p0[1]) * f];
    const feito = new Path2D(); let ini = true;
    for (let k = 0; k <= k0; k++) { const p = trilho.pts[k], y = sy(p); if (y < -120 && k < k0) continue; if (ini) { feito.moveTo(sx(p), y); ini = false; } else feito.lineTo(sx(p), y); }
    feito.lineTo(sx(head), sy(head));
    const frente = new Path2D(); frente.moveTo(sx(head), sy(head));
    for (let k = k0 + 1; k < Math.min(trilho.pts.length, k0 + 22); k++) frente.lineTo(sx(trilho.pts[k]), sy(trilho.pts[k]));
    c.lineJoin = 'round'; c.lineCap = 'round';
    c.setLineDash([2, 12]); c.strokeStyle = 'rgba(255,255,255,.1)'; c.lineWidth = 3; c.stroke(frente); c.setLineDash([]);
    c.strokeStyle = 'rgba(255,204,0,.16)'; c.lineWidth = 16; c.stroke(feito);
    c.strokeStyle = '#FFCC00'; c.lineWidth = 4; c.stroke(feito);
    // a bolinha some quando a linha chega num alvo da cena (pino, rabisco, passo 1, mapa)
    const i = Math.round(rol), perto = Math.abs(rol - i) < .04 && (ALVO[i] || i === 0 || i === LADO.length - 1);
    if (!perto) {
      const x = sx(head), y = sy(head);
      c.fillStyle = 'rgba(255,204,0,.16)'; c.beginPath(); c.arc(x, y, 26, 0, Math.PI * 2); c.fill();
      if (logoMoto.complete && logoMoto.naturalWidth) {
        const t = Math.max(52, Math.min(84, W * .042));
        c.drawImage(logoMoto, x - t / 2, y - t * .62, t, t);
      } else { c.fillStyle = '#FFCC00'; c.beginPath(); c.arc(x, y, 8, 0, Math.PI * 2); c.fill(); }
    }
  }

  /* ---------- rolagem: cada parada é 100vh; a cena troca quando a rolagem passa da metade ---------- */
  const paradas = $('#paradas');
  STOPS.forEach(() => { const d = document.createElement('div'); d.className = 'parada'; paradas.appendChild(d); });
  let rolando = null, quadro = 0;
  const indice = () => Math.max(0, Math.min(STOPS.length - 1, Math.round(scrollY / innerHeight)));
  function aoRolar() {
    if (quadro) return;
    quadro = requestAnimationFrame(() => {
      quadro = 0;
      try { trilhoDesenha(); if (!rolando) vai(indice()); } catch (err) { console.error(err); }
    });
  }
  addEventListener('scroll', aoRolar, { passive: true });
  function rolaPara(i, inst) {
    i = Math.max(0, Math.min(STOPS.length - 1, i));
    const alvo = i * innerHeight;
    if (rolando) rolando.kill();
    document.documentElement.classList.add('livre');
    if (inst) { scrollTo(0, alvo); document.documentElement.classList.remove('livre'); vai(i, true); trilhoDesenha(); return; }
    vai(i);
    const o = { y: scrollY };
    rolando = gsap.to(o, { y: alvo, duration: Math.min(1.6, .9 + Math.abs(alvo - scrollY) / innerHeight * .25), ease: 'power2.inOut',
      onUpdate: () => scrollTo(0, o.y),
      onComplete: () => { rolando = null; document.documentElement.classList.remove('livre'); trilhoDesenha(); } });
  }
  const proximo = (dir) => rolaPara((rolando ? atual : indice()) + dir);

  /* ---------- controles ---------- */
  addEventListener('keydown', (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const k = e.key;
    if (['ArrowRight', 'ArrowDown', 'PageDown', ' ', 'Enter'].includes(k)) { e.preventDefault(); proximo(1); }
    else if (['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace'].includes(k)) { e.preventDefault(); proximo(-1); }
    else if (k === 'Home') { e.preventDefault(); rolaPara(0); }
    else if (k === 'End') { e.preventDefault(); rolaPara(STOPS.length - 1); }
    else if (k === 'f' || k === 'F') telaCheia();
  });
  let rAcum = 0, rUlt = 0, rTrava = 0, rPausa = false;
  addEventListener('wheel', (e) => {
    if (e.ctrlKey) return;               // zoom do navegador continua funcionando
    e.preventDefault();
    const agora = performance.now(), folga = agora - rUlt; rUlt = agora;
    if (rPausa) { if (folga < 200) return; rPausa = false; }   // espera o fim da inércia do touchpad
    if (agora < rTrava) return;
    if (folga > 200) rAcum = 0;
    rAcum += e.deltaMode === 1 ? e.deltaY * 40 : e.deltaY;
    if (Math.abs(rAcum) >= 40) { proximo(rAcum > 0 ? 1 : -1); rAcum = 0; rTrava = agora + 900; rPausa = true; }
  }, { passive: false });
  addEventListener('click', (e) => {
    if (e.target.closest('#tela, .video-moldura')) return;   // clique no vídeo usa os controles dele, não troca de cena
    proximo(e.clientX < innerWidth * .25 ? -1 : 1);
  });
  function telaCheia() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => {});
    else document.exitFullscreen?.();
  }
  $('#tela').addEventListener('click', telaCheia);
  document.addEventListener('fullscreenchange', () => document.body.classList.toggle('cheia', !!document.fullscreenElement));
  let tRes = 0;
  addEventListener('resize', () => {
    clearTimeout(tRes);
    tRes = setTimeout(() => { trilhoMonta(); scrollTo(0, atual * innerHeight); trilhoDesenha(); if (STOPS[atual] && STOPS[atual].c === 'rotas' && !rot.raf) rotToca(true); }, 120);
  });

  /* ---------- gancho de teste e preloader ---------- */
  window.__site = { stops: STOPS.length, ready: false, go: (i) => rolaPara(i, true), next: (d) => proximo(d) };
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  gsap.set('.cena', { autoAlpha: 0 });
  gsap.fromTo('#preRota', { drawSVG: '0%' }, { drawSVG: '100%', duration: 1.2, ease: 'none', repeat: -1 });
  const imgs = $$('img').concat([rot.img]);
  Promise.all([document.fonts.ready, ...imgs.map((im) => (im.decode ? im.decode().catch(() => {}) : Promise.resolve()))]).then(() => {
    Object.keys(MONTA).forEach((n) => { if (n === 'video' || n === 'rotas') return; gsap.set(cena(n), { autoAlpha: 1 }); montaAte(n, n === 'tres' ? 3 : n === 'mais' ? 1 : 0, true); zera(n); gsap.set(cena(n), { autoAlpha: 0 }); });
    gsap.set(cena('rotas'), { autoAlpha: 1 }); if (R && rotPrepara()) rotDesenha(R.w[1]); gsap.set(cena('rotas'), { autoAlpha: 0 });
    trilhoMonta();
    gsap.to('#pre', { autoAlpha: 0, duration: .5, onComplete: () => gsap.killTweensOf('#preRota') });
    const h = parseInt((location.hash || '').slice(1), 10);
    window.__site.ready = true;
    if (!isNaN(h) && h > 0) rolaPara(h, true); else { scrollTo(0, 0); vai(0); trilhoDesenha(); }
  });
})();
