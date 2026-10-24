/* ============================================================
   THE FLOWER SHOP — script.js
   GSAP scroll choreography · CSS-3D blooming rose · petal canvas
   ============================================================ */
(function () {
  'use strict';

  const hasGsap = typeof window.gsap !== 'undefined';
  const hasST   = hasGsap && typeof window.ScrollTrigger !== 'undefined';
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine    = window.matchMedia('(pointer: fine)').matches;
  const $  = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => [...(c || document).querySelectorAll(s)];

  if (hasST) { gsap.registerPlugin(ScrollTrigger); ScrollTrigger.config({ ignoreMobileResize: true }); }
  else document.documentElement.classList.add('no-gsap');

  /* ---------- duplicate marquee group for a seamless loop ---------- */
  const mqTrack = $('#mqTrack');
  if (mqTrack && mqTrack.children.length === 1) mqTrack.appendChild(mqTrack.children[0].cloneNode(true));

  /* ---------- build the 3D rose (sepals → outer → inner petals) ---------- */
  const flower = $('#flower');
  if (flower) {
    const layers = [
      { cls: 's', n: 5,  offset: 36, tones: ['#5C7350', '#4F6746'] },
      { cls: 'o', n: 10, offset: 0,  tones: ['#C2604A', '#B5523B'] },
      { cls: 'i', n: 7,  offset: 25, tones: ['#A8402D', '#96341F'] }
    ];
    layers.forEach(L => {
      for (let k = 0; k < L.n; k++) {
        const pl = document.createElement('div');
        pl.className = 'pl ' + L.cls;
        pl.style.setProperty('--a', (360 / L.n * k + L.offset) + 'deg');
        const pf = document.createElement('div');
        pf.className = 'pf';
        pf.style.background = L.tones[k % L.tones.length];
        pl.appendChild(pf);
        flower.appendChild(pl);
      }
    });
  }

  /* ---------- toast ---------- */
  const toastEl = $('#toast');
  let toastTimer;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    clearTimeout(toastTimer);
    if (hasGsap) {
      gsap.killTweensOf(toastEl);
      gsap.fromTo(toastEl, { y: 16, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .35, ease: 'power2.out' });
      toastTimer = setTimeout(() => gsap.to(toastEl, { y: 10, autoAlpha: 0, duration: .35, ease: 'power2.in' }), 2200);
    } else {
      toastEl.style.opacity = 1;
      toastTimer = setTimeout(() => (toastEl.style.opacity = 0), 2200);
    }
  }

  /* ---------- custom cursor (fine pointers only) ---------- */
  if (fine && !reduced) {
    document.documentElement.classList.add('cursor-on');
    const dot = $('.cursor-dot'), ring = $('.cursor-ring'), tag = $('.cursor-tag');
    let tx = innerWidth / 2, ty = innerHeight / 2, rx = tx, ry = ty;
    window.addEventListener('mousemove', e => {
      tx = e.clientX; ty = e.clientY;
      dot.style.transform = `translate3d(${tx}px,${ty}px,0) translate(-50%,-50%)`;
    }, { passive: true });
    (function loop() {
      rx += (tx - rx) * .16; ry += (ty - ry) * .16;
      ring.style.transform = `translate3d(${rx}px,${ry}px,0) translate(-50%,-50%)`;
      if (tag) tag.style.transform = `translate3d(${rx + 18}px,${ry + 18}px,0)`;
      requestAnimationFrame(loop);
    })();
    document.addEventListener('mouseover', e => {
      const t = e.target.closest ? e.target.closest('[data-cursor]') : null;
      const link = e.target.closest ? e.target.closest('a,button,input,label') : null;
      if (t) {
        ring.classList.add('grow'); ring.classList.remove('mini');
        if (tag) { tag.textContent = t.dataset.cursor; tag.classList.add('show'); }
      } else {
        ring.classList.remove('grow');
        ring.classList.toggle('mini', !!link);
        if (tag) tag.classList.remove('show');
      }
    });
  }

  /* ---------- nav state ---------- */
  const nav = $('#nav');
  const onScrollNav = () => nav && nav.classList.toggle('scrolled', scrollY > 40);
  addEventListener('scroll', onScrollNav, { passive: true }); onScrollNav();

  /* ---------- mobile menu ---------- */
  const burger = $('#burger'), menu = $('#menu');
  let menuOpen = false;
  function setMenu(open) {
    menuOpen = open;
    burger.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open);
    menu.classList.toggle('open', open);
    menu.setAttribute('aria-hidden', !open);
    nav.classList.toggle('inverted', open);
    document.body.style.overflow = open ? 'hidden' : '';
    if (open && hasGsap && !reduced) {
      gsap.fromTo('.menu-links a, .menu-foot > *',
        { y: 40, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: .7, stagger: .06, ease: 'power3.out', delay: .18, clearProps: 'all' });
    }
  }
  if (burger) burger.addEventListener('click', () => setMenu(!menuOpen));

  /* ---------- smooth anchors ---------- */
  $$('a[data-scroll]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    const target = id && $(id);
    if (!target) return;
    e.preventDefault();
    if (menuOpen) setMenu(false);
    const y = id === '#hero' ? 0 : target.getBoundingClientRect().top + scrollY - 70;
    window.scrollTo({ top: Math.max(0, y), behavior: reduced ? 'auto' : 'smooth' });
  }));

  /* ---------- note writer → WhatsApp deep link ---------- */
  const noteInput = $('#noteInput'), noteText = $('#noteText'),
        noteCount = $('#noteCount'), waSend = $('#waSend');
  const DEFAULT_NOTE = noteText ? noteText.textContent : '';
  function buildWaHref(note) {
    const msg = 'Hi The Flower Shop! I would like to order a bouquet.\n\nMy note: "' + (note || DEFAULT_NOTE) + '"';
    return 'https://wa.me/962799239449?text=' + encodeURIComponent(msg);
  }
  if (noteInput && waSend) {
    const update = () => {
      const v = noteInput.value.trim();
      noteText.textContent = v || DEFAULT_NOTE;
      noteCount.textContent = noteInput.value.length + ' / 90';
      waSend.href = buildWaHref(v);
    };
    noteInput.addEventListener('input', update);
    waSend.href = buildWaHref('');
    update();

    /* gift-tag tilt */
    const card = $('#noteCard'), wrap = $('#noteWrap');
    if (card && wrap && fine && hasGsap && !reduced) {
      const rX = gsap.quickTo(card, 'rotationX', { duration: .6, ease: 'power2.out' });
      const rY = gsap.quickTo(card, 'rotationY', { duration: .6, ease: 'power2.out' });
      wrap.addEventListener('mousemove', e => {
        const r = wrap.getBoundingClientRect();
        rY(((e.clientX - r.left) / r.width - .5) * 10);
        rX(-((e.clientY - r.top) / r.height - .5) * 8);
      });
      wrap.addEventListener('mouseleave', () => { rX(0); rY(0); });
    }
  }

  /* ---------- lightbox ---------- */
  const lb = $('#lightbox'), lbImg = $('#lbImg'), lbCap = $('#lbCap'), lbClose = $('#lbClose');
  let lbOpenState = false;
  function openLB(src, cap, alt) {
    lbImg.src = src; lbImg.alt = alt || ''; lbCap.textContent = cap || '';
    lbOpenState = true;
    lb.classList.add('open');
    lb.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    if (hasGsap && !reduced) {
      gsap.fromTo(lb, { autoAlpha: 0 }, { autoAlpha: 1, duration: .4, ease: 'power2.out' });
      gsap.fromTo(lbImg, { scale: .92, y: 20 }, { scale: 1, y: 0, duration: .55, ease: 'power3.out' });
    }
    lbClose.focus();
  }
  function closeLB() {
    if (!lbOpenState) return;
    lbOpenState = false;
    const done = () => { lb.classList.remove('open'); lb.setAttribute('aria-hidden', 'true'); lbImg.src = ''; document.body.style.overflow = ''; };
    if (hasGsap && !reduced) gsap.to(lb, { autoAlpha: 0, duration: .3, ease: 'power2.in', onComplete: done });
    else done();
  }
  $$('.plate .ph').forEach(ph => ph.addEventListener('click', () => {
    const img = ph.querySelector('img');
    const fig = ph.closest('.plate');
    if (!img) return;
    const name = fig ? ($('.cap-name', fig) || {}).textContent || '' : '';
    const tagline = fig ? ($('.cap-tag', fig) || {}).textContent || '' : '';
    openLB(img.currentSrc || img.src, (name + ' — ' + tagline).replace(' — —', '—'), img.alt);
  }));
  if (lbClose) lbClose.addEventListener('click', closeLB);
  if (lb) lb.addEventListener('click', e => { if (e.target === lb) closeLB(); });
  addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeLB(); if (menuOpen) setMenu(false); }
  });

  /* ---------- videos: autoplay off-screen pause + tap for sound ---------- */
  const vids = $$('video');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => entries.forEach(en => {
      if (en.isIntersecting) en.target.play().catch(() => {});
      else en.target.pause();
    }), { threshold: .18 });
    vids.forEach(v => io.observe(v));
  } else vids.forEach(v => v.play().catch(() => {}));
  vids.forEach(v => v.addEventListener('click', () => {
    v.muted = !v.muted;
    if (!v.muted) v.play().catch(() => {});
    toast(v.muted ? 'Sound off' : 'Sound on — ambient shop noise');
  }));

  /* ---------- Amman clock & year ---------- */
  const clockEl = $('#clock');
  if (clockEl) {
    let fmt;
    try { fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Amman', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }); }
    catch (e) { fmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }); }
    const tick = () => (clockEl.textContent = fmt.format(new Date()));
    tick(); setInterval(tick, 1000);
  }
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- ambient falling petals (canvas, petal-shaped) ---------- */
  const canvas = $('#petals');
  if (canvas && !reduced) {
    const ctx = canvas.getContext('2d');
    const COLORS = ['#C2604A', '#A8402D', '#D98A73', '#E7DFCF'];
    let W, H, dpr, mouseVX = 0, lastMX = 0, t = 0, running = true;
    function size() {
      dpr = Math.min(devicePixelRatio || 1, 2);
      W = canvas.width = innerWidth * dpr;
      H = canvas.height = innerHeight * dpr;
      canvas.style.width = innerWidth + 'px';
      canvas.style.height = innerHeight + 'px';
    }
    size(); addEventListener('resize', size);
    const COUNT = innerWidth < 700 ? 10 : 20;
    const make = top => ({
      x: Math.random() * innerWidth, y: top ? -20 : Math.random() * innerHeight,
      s: 5 + Math.random() * 9, vy: .35 + Math.random() * .8,
      rot: Math.random() * Math.PI * 2, vr: (Math.random() - .5) * .03,
      ph: Math.random() * Math.PI * 2, sw: .4 + Math.random() * .9,
      c: COLORS[(Math.random() * COLORS.length) | 0], a: .16 + Math.random() * .28
    });
    const petals = Array.from({ length: COUNT }, () => make(false));
    window.addEventListener('mousemove', e => { mouseVX = e.clientX - lastMX; lastMX = e.clientX; }, { passive: true });
    document.addEventListener('visibilitychange', () => { running = !document.hidden; if (running) raf(); });
    function draw() {
      t += .012;
      ctx.clearRect(0, 0, W, H);
      mouseVX *= .92;
      petals.forEach((p, i) => {
        p.y += p.vy; p.rot += p.vr;
        p.x += Math.sin(t * p.sw + p.ph) * .5 + mouseVX * .06 * (p.s / 10);
        if (p.y > innerHeight + 30 || p.x < -40 || p.x > innerWidth + 40) petals[i] = make(true);
        ctx.save();
        ctx.translate(p.x * dpr, p.y * dpr);
        ctx.rotate(p.rot);
        ctx.scale(dpr, dpr);
        const s = p.s;
        ctx.beginPath();
        ctx.moveTo(0, -s);
        ctx.bezierCurveTo(s * .9, -s * .55, s * .75, s * .7, 0, s);
        ctx.bezierCurveTo(-s * .75, s * .7, -s * .9, -s * .55, 0, -s);
        ctx.globalAlpha = p.a;
        ctx.fillStyle = p.c;
        ctx.fill();
        ctx.restore();
      });
    }
    function raf() { if (!running) return; draw(); requestAnimationFrame(raf); }
    raf();
  }

  /* ============================================================
     GSAP choreography
     ============================================================ */
  const pre = $('#preloader');

  if (hasST && !reduced) {

    /* start as a closed bud */
    gsap.set('.pl.o .pf, .pl.i .pf', { rotationX: -86 });
    gsap.set('.pl.s .pf', { rotationX: 80 });
    gsap.set('#flowerTilt', { rotationX: 64 });
    gsap.set('#flower', { scale: .92 });
    gsap.set('#flowerScrub', { rotation: -18 });

    /* idle life */
    gsap.to('#flowerIdle', { rotation: 4.5, duration: 5.5, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    gsap.to('#flowerIdle', { y: -10, duration: 4.2, yoyo: true, repeat: -1, ease: 'sine.inOut' });

    /* hero intro */
    const intro = () => gsap.timeline({ defaults: { ease: 'power4.out' } })
      .from('.hero-title .mask-in', { yPercent: 112, duration: 1.15, stagger: .1 })
      .from('#heroKicker', { y: 18, autoAlpha: 0, duration: .8 }, '-=.75')
      .from('#heroSub', { y: 24, autoAlpha: 0, duration: .8 }, '-=.6')
      .from('#heroCta', { y: 24, autoAlpha: 0, duration: .8 }, '-=.62')
      .from('#stage', { autoAlpha: 0, scale: .94, duration: 1.2, ease: 'power3.out' }, '-=1.0')
      .from('.hero-ghost', { autoAlpha: 0, scale: .92, duration: 1.4, ease: 'power2.out' }, '-=1.1')
      .from('#bloomHint', { autoAlpha: 0, y: 12, duration: .7 }, '-=.8');

    if (pre) {
      document.body.style.overflow = 'hidden';
      gsap.set('.pre-petals ellipse', { scale: 0, svgOrigin: '60 60' });
      gsap.timeline()
        .to('.pre-petals ellipse', { scale: 1, duration: .55, stagger: .05, ease: 'back.out(2.2)' })
        .from('.pre-word .mask-in', { yPercent: 115, duration: .8, ease: 'power4.out' }, '-=.3')
        .from('.pre-sub', { autoAlpha: 0, y: 10, duration: .5 }, '-=.4')
        .to(pre, { clipPath: 'inset(0 0 100% 0)', duration: .9, ease: 'power4.inOut', delay: .3 })
        .add(intro(), '-=.5')
        .set(pre, { display: 'none' })
        .eventCallback('onComplete', () => {
          document.body.style.overflow = '';
          ScrollTrigger.refresh();
        });
    } else intro();

    /* the signature: scroll-driven bloom */
    const bloomLabel = $('#bloomLabel'), bloomFill = $('#bloomFill');
    let bloomed = false;
    gsap.timeline({
      scrollTrigger: {
        trigger: '#hero', start: 'top top', end: '+=170%',
        scrub: .7, pin: true, anticipatePin: 1,
        onUpdate(self) {
          if (bloomFill) bloomFill.style.transform = 'scaleY(' + self.progress + ')';
          if (self.progress > .92 && !bloomed) { bloomed = true; if (bloomLabel) bloomLabel.textContent = 'In full bloom'; }
          if (self.progress < .5 && bloomed) { bloomed = false; if (bloomLabel) bloomLabel.textContent = 'Scroll to bloom'; }
        }
      }
    })
      .to('.pl.o .pf, .pl.i .pf', { rotationX: -8, duration: 1, stagger: .05, ease: 'power2.inOut' }, 0)
      .to('.pl.s .pf', { rotationX: 14, duration: 1, stagger: .06, ease: 'sine.inOut' }, 0)
      .to('#flowerTilt', { rotationX: 36, duration: 1, ease: 'sine.inOut' }, 0)
      .to('#flowerScrub', { rotation: 26, duration: 1, ease: 'sine.inOut' }, 0)
      .to('#flower', { scale: 1.05, duration: 1 }, 0)
      .to('.hero-ghost', { scale: 1.18, duration: 1 }, 0)
      .to('.hero-copy', { y: -70, autoAlpha: 0, duration: .5, ease: 'power1.in' }, .58)
      .to('#ground', { scaleX: 1.18, autoAlpha: .6, duration: 1 }, 0);

    /* pointer tilt */
    if (fine) {
      const mY = gsap.quickTo('#flowerMouse', 'rotationY', { duration: .9, ease: 'power2.out' });
      const mX = gsap.quickTo('#flowerMouse', 'rotationX', { duration: .9, ease: 'power2.out' });
      window.addEventListener('mousemove', e => {
        mY((e.clientX / innerWidth - .5) * 22);
        mX(-(e.clientY / innerHeight - .5) * 12);
      }, { passive: true });
    }

    /* drag to spin the rose */
    const stage = $('#stage'), dragEl = $('#flowerDrag');
    if (stage && dragEl && fine) {
      let dragging = false, lastX = 0, vel = 0, rot = 0;
      stage.addEventListener('pointerdown', e => {
        dragging = true; lastX = e.clientX; vel = 0;
        try { stage.setPointerCapture(e.pointerId); } catch (err) {}
      });
      stage.addEventListener('pointermove', e => {
        if (!dragging) return;
        const dx = e.clientX - lastX; lastX = e.clientX;
        rot += dx * .5; vel = dx * .5;
        gsap.set(dragEl, { rotation: rot });
      });
      const release = () => {
        if (!dragging) return;
        dragging = false;
        gsap.to(dragEl, {
          rotation: rot + gsap.utils.clamp(-160, 160, vel * 26),
          duration: 1.4, ease: 'power3.out',
          onUpdate() { rot = gsap.getProperty(dragEl, 'rotation'); }
        });
      };
      stage.addEventListener('pointerup', release);
      stage.addEventListener('pointercancel', release);
    }

    /* generic reveals */
    $$('[data-reveal]').forEach(el => {
      gsap.from(el, {
        y: 34, autoAlpha: 0, duration: 1, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 88%' }
      });
    });
    $$('.mask-in').forEach(el => {
      if (el.closest('.hero') || el.closest('.preloader') || el.closest('.footer')) return;
      gsap.from(el, {
        yPercent: 115, duration: 1.15, ease: 'power4.out',
        scrollTrigger: { trigger: el, start: 'top 90%' }
      });
    });

    /* manifesto — words illuminate as you read */
    const man = $('#manifesto');
    if (man) {
      const words = man.textContent.trim().split(/\s+/);
      man.innerHTML = words.map(w => '<span class="w">' + w + '</span>').join(' ');
      gsap.fromTo('#manifesto .w', { y: 16, autoAlpha: .12 }, {
        y: 0, autoAlpha: 1, ease: 'none', stagger: .06,
        scrollTrigger: { trigger: man, start: 'top 78%', end: 'bottom 45%', scrub: .5 }
      });
    }

    /* collection — pinned sideways wall (desktop) */
    const track = $('#track'), trackFill = $('#trackFill');
    const mm = gsap.matchMedia();
    mm.add('(min-width: 861px)', () => {
      const dist = () => track.scrollWidth - window.innerWidth;
      const horiz = gsap.to(track, {
        x: () => -dist(), ease: 'none',
        scrollTrigger: {
          trigger: '#collection', start: 'top top', end: () => '+=' + dist(),
          scrub: .8, pin: true, anticipatePin: 1, invalidateOnRefresh: true,
          onUpdate(self) { if (trackFill) trackFill.style.transform = 'scaleX(' + self.progress + ')'; }
        }
      });
      $$('.plate').forEach(p => {
        const img = p.querySelector('img');
        if (!img) return;
        gsap.fromTo(img, { xPercent: -6 }, {
          xPercent: 6, ease: 'none',
          scrollTrigger: { trigger: p, containerAnimation: horiz, start: 'left right', end: 'right left', scrub: true }
        });
      });
    });
    mm.add('(max-width: 860px)', () => {
      const onScrollTrack = () => {
        const max = track.scrollWidth - track.clientWidth;
        const p = max > 0 ? track.scrollLeft / max : 0;
        if (trackFill) trackFill.style.transform = 'scaleX(' + p + ')';
      };
      track.addEventListener('scroll', onScrollTrack, { passive: true });
      onScrollTrack();
      return () => track.removeEventListener('scroll', onScrollTrack);
    });

    /* film reveals */
    gsap.from('.film-main', {
      clipPath: 'inset(12% 6% 12% 6%)', duration: 1.3, ease: 'power3.out',
      scrollTrigger: { trigger: '.film-main', start: 'top 82%' }
    });
    gsap.from('.film-main video', {
      scale: 1.18, duration: 1.6, ease: 'power2.out',
      scrollTrigger: { trigger: '.film-main', start: 'top 82%' }
    });

    /* footer wordmark drifts up into view */
    gsap.fromTo('#footMark', { yPercent: 24 }, {
      yPercent: 0, ease: 'none',
      scrollTrigger: { trigger: '.footer', start: 'top bottom', end: 'bottom bottom', scrub: true }
    });

    /* marquee speeds up with your scrolling (Web Animations API) */
    if (mqTrack) {
      try {
        const anim = mqTrack.getAnimations && mqTrack.getAnimations()[0];
        if (anim) {
          let target = 1, cur = 1;
          ScrollTrigger.create({
            onUpdate(self) { target = 1 + Math.min(Math.abs(self.getVelocity()) / 900, 3); }
          });
          gsap.ticker.add(() => {
            cur += (target - cur) * .06;
            target += (1 - target) * .02;
            anim.playbackRate = cur;
          });
        }
      } catch (e) { /* playbackRate not supported — CSS loop still runs */ }
    }

    document.fonts && document.fonts.ready.then(() => ScrollTrigger.refresh());
    addEventListener('load', () => ScrollTrigger.refresh());

  } else {
    /* no GSAP or reduced motion: show everything, bloom fully open */
    if (pre) pre.style.display = 'none';
  }
})();