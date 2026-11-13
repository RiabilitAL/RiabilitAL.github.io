/* RiabilitAL — home.
   Animazioni ricostruite dallo script in fondo a design/finale/FINALE-*.html (servRotate, studioB, studioBM, riabPans),
   più le interazioni decise il 12/11: schede della Strumentazione al tocco, FAQ una alla volta, movimento ridotto rispettato,
   tranne le tessere di Fisioterapia e l'orbita, che girano sempre (deroga a WCAG 2.2.2 voluta da Gabriele, 12/11).
   Ci si aggancia agli attributi data-*; le classi interne delle tessere (.pw .tb .ts …) sono quelle della tavola. */
(function () {
  'use strict';

  var desktopMq = window.matchMedia('(min-width: 1024px)');
  var calmoMq = window.matchMedia('(prefers-reduced-motion: reduce)');
  var arr = function (l) { return Array.prototype.slice.call(l); };

  /* ─── Fisioterapia: tessere che ruotano ogni 5 s (solo desktop) ─── */
  function servRotate() {
    var area = document.querySelector('[data-serv-area]');
    var big = document.querySelector('[data-serv-big]');
    var small = document.querySelector('[data-serv-small]');
    if (!area || !big || !small) return null;
    var cards = arr(area.querySelectorAll('.sc'));
    var N = cards.length; if (N < 3) return null;
    var origBig = cards.map(function (c) { return c.classList.contains('big'); });
    var DUR = 1100, EASE = 'cubic-bezier(.5,0,.15,1)', STEP = 5000;
    var INNER = ['pw', 'ico', 'tb', 'pc', 'lt', 'tg', 'ts', 'sl'];
    var slots = [], k = 0, timer = null, busy = false, stopped = false, started = false, tries = 0;

    function px(v) { return (Math.round(v * 100) / 100) + 'px'; }
    function q(c, n) { return c.querySelector('.' + n); }
    function isBig(i) { return i === 0 || i === N - 1; }
    function snap(c) {
      var cr = c.getBoundingClientRect(), bl = c.clientLeft, bt = c.clientTop, o = { card: cr, el: {} };
      INNER.forEach(function (n) {
        var e = q(c, n); if (!e) return;
        var vis = getComputedStyle(e).display !== 'none', r = e.getBoundingClientRect();
        o.el[n] = { x: r.left - cr.left - bl, y: r.top - cr.top - bt, w: r.width, h: r.height, vis: vis, fs: parseFloat(getComputedStyle(e).fontSize) };
      });
      return o;
    }
    function init() {
      var ar = area.getBoundingClientRect(), byK = {};
      cards.forEach(function (c) { byK[c.getAttribute('data-k')] = c; });
      for (var i = 0; i < N; i++) { var r = byK[i].getBoundingClientRect(); slots[i] = { x: r.left - ar.left, y: r.top - ar.top, w: r.width, h: r.height }; }
      area.style.position = 'relative'; area.style.height = px(ar.height); area.style.display = 'block';
      big.style.display = 'contents'; small.style.display = 'contents';
      cards.forEach(function (c) {
        var s = slots[c.getAttribute('data-k')];
        c.style.position = 'absolute'; c.style.left = px(s.x); c.style.top = px(s.y); c.style.width = px(s.w); c.style.height = px(s.h); c.style.margin = '0'; c.style.minHeight = '0';
      });
      timer = setInterval(tick, STEP);
    }
    function setAbs(e, p) { e.style.position = 'absolute'; e.style.left = px(p.x); e.style.top = px(p.y); e.style.width = px(p.w); e.style.margin = '0'; }
    function tick() {
      /* gira sempre: non si ferma col mouse sopra né col fuoco (deroga a WCAG 2.2.2 voluta da Gabriele, 12/11) */
      if (busy) return;
      busy = true;
      var ar = area.getBoundingClientRect();
      var before = cards.map(snap);
      k = (k + 1) % N;
      var wasBig = cards.map(function (c) { return c.classList.contains('big'); });
      cards.forEach(function (c) {
        var j = +c.getAttribute('data-k'), i = (j + k) % N, s = slots[i], wb = c.classList.contains('big'), nb = isBig(i);
        c.classList.toggle('big', nb); c.classList.toggle('small', !nb);
        c.style.left = px(s.x); c.style.top = px(s.y); c.style.width = px(s.w); c.style.height = px(s.h);
        c.style.zIndex = (nb && !wb) ? '3' : (wb && !nb) ? '2' : '1';
      });
      var after = cards.map(snap), anims = [], saved = [];
      function keep(e) { saved.push([e, e.getAttribute('style')]); }
      function anim(e, frames) { anims.push(e.animate(frames, { duration: DUR, easing: EASE })); }
      cards.forEach(function (c, n) {
        var b = before[n], a = after[n], cb = b.card, ca = a.card;
        anim(c, [{ left: px(cb.left - ar.left), top: px(cb.top - ar.top), width: px(cb.width), height: px(cb.height) },
                 { left: px(ca.left - ar.left), top: px(ca.top - ar.top), width: px(ca.width), height: px(ca.height) }]);
        var nowBig = c.classList.contains('big');
        if (nowBig === wasBig[n]) return;
        var padX = 20;
        var innerS = (wasBig[n] ? ca.width : cb.width) - 2 - 40;
        var E = {}; INNER.forEach(function (x) { E[x] = q(c, x); });
        var ph = q(c, 'ph');
        INNER.forEach(function (x) { if (E[x]) keep(E[x]); }); keep(ph);
        var fadeOut = [{ opacity: 1, offset: 0 }, { opacity: 0, offset: .55 }, { opacity: 0, offset: 1 }];
        var fadeIn = [{ opacity: 0, offset: 0 }, { opacity: 0, offset: .3 }, { opacity: 1, offset: 1 }];
        function move(e, from, to, extra) {
          if (getComputedStyle(e).display === 'none') e.style.display = e.classList.contains('pc') ? 'inline-flex' : e.classList.contains('tg') ? 'flex' : 'block';
          setAbs(e, to);
          var f0 = { left: px(from.x), top: px(from.y), width: px(from.w) }, f1 = { left: px(to.x), top: px(to.y), width: px(to.w) };
          var frames = [f0, f1];
          if (extra && extra.fs) { f0.fontSize = px(extra.fs[0]); f1.fontSize = px(extra.fs[1]); e.style.whiteSpace = 'nowrap'; }
          if (extra && extra.fade) {
            frames = extra.fade.map(function (fr, i) { var o = Object.assign({}, fr); if (i === 0) Object.assign(o, f0); if (i === extra.fade.length - 1) Object.assign(o, f1); return o; });
            e.style.opacity = String(extra.fade[extra.fade.length - 1].opacity);
          }
          anim(e, frames);
        }
        if (wasBig[n]) {
          /* grande -> piccola: la foto si chiude, titolo e testo scivolano al posto piccolo */
          var pwB = b.el.pw, pwT = { x: padX, y: 22, w: innerS, h: 0 };
          E.pw.style.display = 'block'; setAbs(E.pw, pwT); E.pw.style.height = px(0); E.pw.style.overflow = 'hidden';
          ph.style.width = px(pwB.w); ph.style.transformOrigin = '0 0';
          anim(E.pw, [{ left: px(pwB.x), top: px(pwB.y), width: px(pwB.w), height: px(pwB.h) }, { left: px(pwT.x), top: px(pwT.y), width: px(pwT.w), height: px(0) }]);
          anim(ph, [{ transform: 'scale(1)' }, { transform: 'scale(' + (innerS / pwB.w) + ')' }]);
          move(E.ico, b.el.ico, a.el.ico);
          move(E.tb, b.el.tb, { x: a.el.ts.x, y: a.el.ts.y, w: b.el.tb.w }, { fs: [b.el.tb.fs, a.el.ts.fs], fade: fadeOut });
          if (E.pc) move(E.pc, b.el.pc, b.el.pc, { fade: fadeOut });
          move(E.lt, b.el.lt, { x: a.el.sl.x, y: a.el.sl.y, w: b.el.lt.w }, { fade: fadeOut });
          if (E.tg) move(E.tg, b.el.tg, b.el.tg, { fade: fadeOut });
          move(E.ts, { x: b.el.tb.x, y: b.el.tb.y, w: a.el.ts.w }, a.el.ts, { fade: fadeIn });
          move(E.sl, { x: b.el.lt.x, y: b.el.lt.y, w: a.el.sl.w }, a.el.sl, { fade: fadeIn });
        } else {
          /* piccola -> grande: la foto si apre, titolo e testo scivolano al posto grande */
          var pwA = a.el.pw, pwF = { x: padX, y: 22, w: innerS, h: 0 };
          E.pw.style.display = 'block'; setAbs(E.pw, pwA); E.pw.style.height = px(pwA.h); E.pw.style.overflow = 'hidden';
          ph.style.width = px(pwA.w); ph.style.transformOrigin = '0 0';
          anim(E.pw, [{ left: px(pwF.x), top: px(pwF.y), width: px(pwF.w), height: px(0) }, { left: px(pwA.x), top: px(pwA.y), width: px(pwA.w), height: px(pwA.h) }]);
          anim(ph, [{ transform: 'scale(' + (innerS / pwA.w) + ')' }, { transform: 'scale(1)' }]);
          move(E.ico, b.el.ico, a.el.ico);
          move(E.tb, { x: b.el.ts.x, y: b.el.ts.y, w: a.el.tb.w }, a.el.tb, { fs: [b.el.ts.fs, a.el.tb.fs], fade: fadeIn });
          if (E.pc) move(E.pc, a.el.pc, a.el.pc, { fade: fadeIn });
          move(E.lt, { x: b.el.sl.x, y: b.el.sl.y, w: a.el.lt.w }, a.el.lt, { fade: fadeIn });
          if (E.tg) move(E.tg, a.el.tg, a.el.tg, { fade: fadeIn });
          move(E.ts, b.el.ts, { x: a.el.tb.x, y: a.el.tb.y, w: b.el.ts.w }, { fade: fadeOut });
          move(E.sl, b.el.sl, { x: a.el.lt.x, y: a.el.lt.y, w: b.el.sl.w }, { fade: fadeOut });
        }
      });
      Promise.all(anims.map(function (x) { return x.finished; })).then(done, done);
      function done() {
        saved.forEach(function (p) { if (p[1] === null) p[0].removeAttribute('style'); else p[0].setAttribute('style', p[1]); });
        cards.forEach(function (c) { c.style.zIndex = ''; });
        busy = false;
      }
    }
    function start() {
      if (started || stopped) return;
      var ar = area.getBoundingClientRect();
      if ((ar.width < 600 || ar.height < 200) && tries++ < 20) { setTimeout(start, 500); return; }
      started = true; init();
    }
    if (document.fonts && document.fonts.ready) { document.fonts.ready.then(start, start); setTimeout(start, 1500); } else { start(); }

    return {
      stop: function () {
        stopped = true; clearInterval(timer);
        cards.forEach(function (c, i) {
          c.getAnimations().forEach(function (a) { a.cancel(); });
          c.removeAttribute('style');
          c.classList.toggle('big', origBig[i]); c.classList.toggle('small', !origBig[i]);
        });
        [area, big, small].forEach(function (e) { e.removeAttribute('style'); });
      }
    };
  }

  /* ─── Studio: striscia in loop (desktop) ─── */
  function studioB() {
    var sec = document.getElementById('studio');
    var strip = sec && sec.querySelector('[data-studio-striscia]');
    if (!strip || strip.children.length < 3) return null;
    var dots = arr(sec.querySelectorAll('[data-dot]')), counter = sec.querySelector('[data-dots-count]');
    var n = strip.children.length, busy = false, DUR = 900, EASE = 'cubic-bezier(.5,0,.15,1)', an = null, sfuma = null;
    arr(strip.children).forEach(function (f, i) { if (!f.hasAttribute('data-n')) f.setAttribute('data-n', i); });
    function setDots(j) {
      dots.forEach(function (d, m) { d.classList.toggle('on', m === j); });
      if (counter) counter.textContent = '0' + (j + 1) + ' / 0' + n;
    }
    function step() {
      if (busy) return; busy = true;
      var a = strip.children[0], b = strip.children[1];
      var gap = parseFloat(getComputedStyle(strip).columnGap) || 16, wBig = a.getBoundingClientRect().width;
      setDots(+b.getAttribute('data-n'));
      var la = a.querySelector('.line'), lb = b.querySelector('.line');
      if (la) la.style.opacity = '0';
      if (lb) { lb.hidden = false; lb.style.opacity = '0'; lb.getBoundingClientRect(); lb.style.opacity = '1'; }
      b.classList.add('grande');
      an = strip.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(' + (-(wBig + gap)) + 'px)' }], { duration: DUR, easing: EASE, fill: 'forwards' });
      /* la foto che esce a sinistra sparisce in dissolvenza mentre scorre (12/11) */
      sfuma = a.animate([{ opacity: 1 }, { opacity: 0 }], { duration: DUR, easing: EASE, fill: 'forwards' });
      an.finished.then(function () {
        an.cancel(); an = null;
        strip.appendChild(a);
        if (sfuma) { sfuma.cancel(); sfuma = null; }
        a.style.transition = 'none'; a.classList.remove('grande');
        if (la) { la.hidden = true; la.style.opacity = ''; }
        a.getBoundingClientRect();
        a.style.transition = '';
        busy = false;
      }, function () { busy = false; });
    }
    var t = setInterval(step, 4000);
    return {
      stop: function () {
        clearInterval(t); if (an) an.cancel(); if (sfuma) sfuma.cancel();
        arr(strip.children).forEach(function (f, i) {
          f.classList.toggle('grande', i === 0); f.style.transition = '';
          var l = f.querySelector('.line'); if (l) { l.hidden = i !== 0; l.style.opacity = ''; }
        });
        setDots(+strip.children[0].getAttribute('data-n'));
        busy = false;
      }
    };
  }

  /* ─── Studio: la riga avanza da sola (mobile) ─── */
  function studioBM() {
    var row = document.querySelector('#studio .studio-binario');
    var strip = row && row.querySelector('[data-studio-striscia]');
    if (!strip || strip.children.length < 3) return null;
    row.style.scrollSnapType = 'none';
    var busy = false, DUR = 800, raf = 0;
    function ease(t) { return t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t; }
    function step() {
      if (busy) return; busy = true;
      var gap = parseFloat(getComputedStyle(strip).columnGap) || 12;
      var a = strip.children[0], w = a.getBoundingClientRect().width + gap, start = row.scrollLeft, t0 = null;
      function fr(ts) {
        if (t0 === null) t0 = ts;
        var p = Math.min(1, (ts - t0) / DUR); row.scrollLeft = start + w * ease(p);
        if (p < 1) raf = requestAnimationFrame(fr); else { strip.appendChild(a); row.scrollLeft = start; busy = false; }
      }
      raf = requestAnimationFrame(fr);
    }
    var t = setInterval(step, 4000);
    return { stop: function () { clearInterval(t); cancelAnimationFrame(raf); busy = false; row.style.scrollSnapType = ''; } };
  }

  /* ─── Riabilitazione: tre pannelli, uno aperto alla volta (desktop) ─── */
  var pannelli = (function () {
    var box = document.querySelector('[data-riab-pans]');
    if (!box) return { auto: function () {} };
    var pans = arr(box.querySelectorAll('.pan')), dots = arr(document.querySelectorAll('#riabilitazione .pdots span'));
    var n = pans.length, cur = 0, t = null;
    function show(i) {
      cur = i;
      pans.forEach(function (p, k) { p.classList.toggle('open', k === i); });
      dots.forEach(function (d, k) { d.classList.toggle('on', k === i); });
    }
    /* il mouse o il fuoco da tastiera aprono il pannello indicato */
    pans.forEach(function (p, k) {
      p.addEventListener('mouseenter', function () { show(k); });
      p.addEventListener('focus', function () { show(k); });
    });
    return {
      auto: function (on) {
        clearInterval(t); t = null;
        if (on) t = setInterval(function () {
          if (box.matches(':hover') || box.contains(document.activeElement)) return;
          show((cur + 1) % n);
        }, 4000);
      }
    };
  })();

  /* ─── Strumentazione: la scheda cambia al tocco ─── */
  (function () {
    var root = document.querySelector('[data-strumenti]'); if (!root) return;
    var bottoni = arr(root.querySelectorAll('button[data-macchina]'));
    var schede = arr(root.querySelectorAll('[data-scheda]'));
    var nome = root.querySelector('[data-modello-nome]');
    var modello = root.querySelector('[data-modello-macchina]');
    bottoni.forEach(function (b) {
      b.addEventListener('click', function () {
        var k = b.getAttribute('data-macchina'), testo = b.textContent.trim(), file = null;
        bottoni.forEach(function (x) { x.setAttribute('aria-pressed', String(x.getAttribute('data-macchina') === k)); });
        schede.forEach(function (s) {
          s.hidden = s.getAttribute('data-scheda') !== k;
          if (!s.hidden) file = s.getAttribute('data-modello');
        });
        if (nome) nome.textContent = testo;
        /* il modello 3D si carica solo adesso, al tocco: il file è scritto sulla scheda (data-modello) */
        if (modello && file && modello.getAttribute('src') !== file) {
          modello.setAttribute('src', file);
          modello.setAttribute('alt', 'Modello 3D di ' + testo + ': trascina per ruotarlo');
        }
      });
    });
  })();

  /* ─── FAQ: se ne apre una alla volta (riserva per i browser che ignorano details[name]) ─── */
  (function () {
    var faq = document.querySelector('[data-faq]'); if (!faq) return;
    faq.addEventListener('toggle', function (e) {
      var d = e.target; if (!d.open) return;
      arr(faq.querySelectorAll('details[open]')).forEach(function (x) { if (x !== d) x.open = false; });
    }, true);
  })();

  /* ─── Recensioni: le copie per il giro continuo (nascoste agli screen reader) ─── */
  function nastri(on) {
    arr(document.querySelectorAll('#recensioni .mq, #recensioni .mqr')).forEach(function (row) {
      arr(row.querySelectorAll('[data-copia]')).forEach(function (c) { c.remove(); });
      if (!on) return;
      arr(row.children).forEach(function (c) {
        var k = c.cloneNode(true);
        k.setAttribute('data-copia', ''); k.setAttribute('aria-hidden', 'true');
        row.appendChild(k);
      });
    });
  }

  /* ─── Menu del telefono (13/11): si apre e si chiude dal bottone, si chiude con Esc, scegliendo una voce o passando al desktop ─── */
  (function () {
    var bottone = document.querySelector('[data-menu-bottone]');
    var menu = document.querySelector('[data-menu-mobile]');
    if (!bottone || !menu) return;
    function chiudi() { menu.hidden = true; bottone.setAttribute('aria-expanded', 'false'); bottone.setAttribute('aria-label', 'Apri il menu'); }
    bottone.addEventListener('click', function () {
      var apri = menu.hidden;
      menu.hidden = !apri;
      bottone.setAttribute('aria-expanded', String(apri));
      bottone.setAttribute('aria-label', apri ? 'Chiudi il menu' : 'Apri il menu');
    });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) chiudi(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !menu.hidden) { chiudi(); bottone.focus(); } });
    var dMq = window.matchMedia('(min-width: 1024px)');
    if (dMq.addEventListener) dMq.addEventListener('change', chiudi); else dMq.addListener(chiudi);
  })();

  /* ─── Mappa: sul desktop parte spostata, col pin a destra della scheda dei contatti (13/11).
     L'iframe è lazy: qui non si è ancora caricato, si cambia solo l'indirizzo ─── */
  (function () {
    var m = document.querySelector('[data-mappa-desktop]');
    if (m && desktopMq.matches) m.src = m.getAttribute('data-mappa-desktop');
  })();

  /* ─── Barra di avanzamento della pagina (13/11): come nel sito di prova di Francesco, molla stiffness 100, damping 30;
     con il movimento ridotto segue lo scorrimento senza molla ─── */
  (function () {
    var barra = document.querySelector('[data-avanzamento]'); if (!barra) return;
    var x = 0, v = 0, meta = 0, t0 = 0, raf = 0;
    function letto() {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      return max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    }
    function disegna() { barra.style.transform = 'scaleX(' + x + ')'; }
    function passo(ts) {
      var dt = Math.min(0.064, (ts - (t0 || ts)) / 1000); t0 = ts;
      v += (100 * (meta - x) - 30 * v) * dt; x += v * dt;
      if (Math.abs(meta - x) < 0.001 && Math.abs(v) < 0.001) { x = meta; v = 0; raf = 0; t0 = 0; }
      else raf = requestAnimationFrame(passo);
      disegna();
    }
    function aggiorna() {
      meta = letto();
      if (calmoMq.matches) { x = meta; v = 0; disegna(); return; }
      if (!raf) raf = requestAnimationFrame(passo);
    }
    window.addEventListener('scroll', aggiorna, { passive: true });
    window.addEventListener('resize', aggiorna);
    aggiorna();
  })();

  /* ─── Avvio: dipende da larghezza e movimento ridotto ─── */
  var attivi = [];
  function avvia() {
    attivi.forEach(function (a) { if (a) a.stop(); });
    attivi = [];
    var calmo = calmoMq.matches, desk = desktopMq.matches;
    nastri(!calmo);
    pannelli.auto(desk && !calmo);
    /* modelli 3D: con il movimento ridotto non girano da soli, si trascinano e basta */
    arr(document.querySelectorAll('[data-modello-3d]')).forEach(function (m) { m.toggleAttribute('auto-rotate', !calmo); });
    /* le tessere di Fisioterapia ruotano sempre, anche con "riduci movimento" (deroga voluta, 12/11) */
    if (desk) attivi.push(servRotate());
    if (calmo) return;
    if (desk) attivi.push(studioB());
    else attivi.push(studioBM());
  }
  function ascolta(mq) { if (mq.addEventListener) mq.addEventListener('change', avvia); else mq.addListener(avvia); }
  ascolta(desktopMq); ascolta(calmoMq);
  /* la rotazione desktop misura le posizioni: se cambia la larghezza si riparte */
  var ultimaL = window.innerWidth, attesa = null;
  window.addEventListener('resize', function () {
    if (window.innerWidth === ultimaL) return;
    ultimaL = window.innerWidth;
    clearTimeout(attesa); attesa = setTimeout(avvia, 250);
  });
  avvia();
})();
