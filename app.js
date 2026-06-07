'use strict';

/* ── Burger menu ── */
const burger   = document.getElementById('burger');
const navLinks = document.getElementById('nav-links');
burger.addEventListener('click', () => navLinks.classList.toggle('open'));
navLinks.querySelectorAll('a').forEach(l => l.addEventListener('click', () => navLinks.classList.remove('open')));

/* ── Header scroll ── */
const header = document.querySelector('.header');
window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });

/* ══════════════════════════════════════════════
   CANVAS PARTICULES — fond étoilé
   ══════════════════════════════════════════════ */
(function initCanvas() {
  const canvas = document.getElementById('heroCanvas');
  const ctx    = canvas.getContext('2d');
  let W, H, dots = [];

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }

  function mkDot() {
    return {
      x:  Math.random() * W,
      y:  Math.random() * H,
      r:  Math.random() * 1.8 + 0.4,
      a:  Math.random(),
      da: (Math.random() - 0.5) * 0.008,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
    };
  }

  resize();
  dots = Array.from({ length: 110 }, mkDot);
  window.addEventListener('resize', resize, { passive: true });

  function draw() {
    ctx.clearRect(0, 0, W, H);
    dots.forEach(d => {
      d.x += d.vx; d.y += d.vy; d.a += d.da;
      if (d.a < 0 || d.a > 1) d.da *= -1;
      if (d.x < 0) d.x = W; if (d.x > W) d.x = 0;
      if (d.y < 0) d.y = H; if (d.y > H) d.y = 0;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${d.a * 0.6})`;
      ctx.fill();
    });
    requestAnimationFrame(draw);
  }
  draw();
})();

/* ══════════════════════════════════════════════
   PARALLAX SOURIS — déplacement des couches 3D
   ══════════════════════════════════════════════ */
(function initMouseParallax() {
  const hero   = document.querySelector('[data-hero]');
  const layers = hero.querySelectorAll('.p-layer');
  let mx = 0, my = 0, cx = 0, cy = 0;
  let raf;

  hero.addEventListener('mousemove', e => {
    const r = hero.getBoundingClientRect();
    mx = (e.clientX - r.left) / r.width  - 0.5;
    my = (e.clientY - r.top)  / r.height - 0.5;
  }, { passive: true });

  hero.addEventListener('mouseleave', () => { mx = 0; my = 0; });

  function tick() {
    cx += (mx - cx) * 0.08;
    cy += (my - cy) * 0.08;

    layers.forEach(layer => {
      const depth = parseFloat(layer.dataset.depth || 0);
      const tx = cx * depth * 80;
      const ty = cy * depth * 60;
      layer.style.transform = `translate(${tx}px, ${ty}px)`;
    });
    raf = requestAnimationFrame(tick);
  }
  tick();
})();

/* ══════════════════════════════════════════════
   PERSPECTIVE MARQUEE — recréation fidèle du
   composant PerspectiveMarquee (Remotion/React)
   en JS natif avec requestAnimationFrame
   ══════════════════════════════════════════════ */
(function initPerspectiveMarquee() {
  const section = document.getElementById('pmarqueeSection');
  if (!section) return;

  /* — Paramètres identiques aux props du composant — */
  const ITEMS          = ['Chiens', 'Chats', 'Lapins', 'Rongeurs', 'Vaccins', 'Chirurgie', 'Santé'];
  const FONT_SIZE      = 48;
  const FONT_WEIGHT    = 700;
  const PX_PER_FRAME   = 2;
  const ROTATE_Y       = -28;
  const ROTATE_X       = 8;
  const PERSPECTIVE    = 1200;
  const COLOR          = '#ffffff';
  const ITEM_PADDING   = FONT_SIZE * 0.9;
  const FONT_FAMILY    = "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

  /* — Largeur approximative d'un cycle (même calcul que le composant) — */
  const approxItemWidth = ITEMS.reduce(
    (acc, item) => acc + item.length * FONT_SIZE * 0.6 + ITEM_PADDING, 0
  );

  /* — Conteneur avec perspective CSS (= outer div du composant) — */
  const perspEl = document.createElement('div');
  perspEl.className = 'pmarquee-perspective';
  perspEl.style.perspective = `${PERSPECTIVE}px`;

  /* — Div 3D rotaté (= middle div rotateX/rotateY) — */
  const rotEl = document.createElement('div');
  rotEl.className = 'pmarquee-rotate';
  rotEl.style.transform = `rotateX(${ROTATE_X}deg) rotateY(${ROTATE_Y}deg)`;

  /* — Track qui translate horizontalement — */
  const trackEl = document.createElement('div');
  trackEl.className = 'pmarquee-track';

  /* — 3 répétitions des items (même pattern que [...items, ...items, ...items]) — */
  const rendered = [...ITEMS, ...ITEMS, ...ITEMS];
  const spans = rendered.map(item => {
    const span = document.createElement('span');
    span.textContent = item;
    span.style.cssText = `
      display: inline-block;
      font-family: ${FONT_FAMILY};
      font-size: ${FONT_SIZE}px;
      font-weight: ${FONT_WEIGHT};
      color: ${COLOR};
      letter-spacing: -0.03em;
      padding-right: ${ITEM_PADDING}px;
      will-change: filter, opacity;
    `;
    return span;
  });

  spans.forEach(s => trackEl.appendChild(s));
  rotEl.appendChild(trackEl);
  perspEl.appendChild(rotEl);

  /* Insérer avant les fades (qui ont z-index:10) */
  section.insertBefore(perspEl, section.querySelector('.pmarquee-fade-x'));

  /* — Boucle d'animation (= useCurrentFrame * speed dans le composant) — */
  let frame = 0;

  function animate() {
    frame++;
    const offset = -((frame * PX_PER_FRAME) % approxItemWidth);
    trackEl.style.transform = `translateX(${offset}px)`;

    /* Calcul blur/opacity par item — même logique que le composant :
       norm = (itemCenter - 640) / 640  →  distance  →  blur & opacity */
    const W      = section.offsetWidth;
    const center = W / 2;

    spans.forEach((span, i) => {
      const slotW      = approxItemWidth / ITEMS.length;
      const itemCenter = i * slotW + slotW / 2 + offset;
      const norm       = (itemCenter - center) / center;
      const distance   = Math.min(1, Math.abs(norm));
      span.style.filter  = `blur(${distance * 6}px)`;
      span.style.opacity = String(1 - distance * 0.4);
    });

    requestAnimationFrame(animate);
  }

  animate();
})();

/* ══════════════════════════════════════════════
   TILT 3D — carte Dr PAYRIERE
   ══════════════════════════════════════════════ */
(function initAboutTilt() {
  const wrapper = document.querySelector('.about-card-wrapper');
  const card    = document.querySelector('.about-card');
  if (!wrapper || !card) return;

  let raf;
  let tx = 0, ty = 0, cx = 0, cy = 0;

  wrapper.addEventListener('mousemove', e => {
    const r = wrapper.getBoundingClientRect();
    tx = (e.clientX - r.left) / r.width  - 0.5;
    ty = (e.clientY - r.top)  / r.height - 0.5;
  }, { passive: true });

  wrapper.addEventListener('mouseleave', () => { tx = 0; ty = 0; });

  function tiltTick() {
    cx += (tx - cx) * 0.1;
    cy += (ty - cy) * 0.1;
    card.style.transform = `rotateY(${cx * 20}deg) rotateX(${-cy * 16}deg) translateZ(${Math.abs(cx) * 12 + Math.abs(cy) * 12}px)`;
    raf = requestAnimationFrame(tiltTick);
  }
  tiltTick();
})();

/* ══════════════════════════════════════════════
   GSAP ScrollTrigger — animations au scroll
   ══════════════════════════════════════════════ */
window.addEventListener('load', () => {
  if (typeof gsap === 'undefined') return;
  gsap.registerPlugin(ScrollTrigger);

  /* — Entrée héro — */
  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
  tl.from('[data-gsap-hero="tag"]',  { opacity: 0, y: 20, duration: .7 })
    .from('[data-gsap-hero="title"]', { opacity: 0, y: 40, duration: .9 }, '-=.3')
    .from('[data-gsap-hero="sub"]',   { opacity: 0, y: 30, duration: .7 }, '-=.5')
    .fromTo('[data-gsap-hero="pets"] span', { opacity: 0, y: 16 }, { opacity: 1, y: 0, stagger: .07, duration: .5, clearProps: 'all' }, '-=.4')
    .fromTo('[data-gsap-hero="cta"] a', { opacity: 0, y: 20 }, { opacity: 1, y: 0, stagger: .12, duration: .5, clearProps: 'all' }, '-=.3');

  /* — Parallax scroll sur le héro — */
  const layers = document.querySelectorAll('.p-layer');
  layers.forEach(layer => {
    const depth = parseFloat(layer.dataset.depth || 0);
    gsap.to(layer, {
      y: depth * -200,
      ease: 'none',
      scrollTrigger: {
        trigger: '[data-hero]',
        start: 'top top',
        end: 'bottom top',
        scrub: 1,
      }
    });
  });

  /* — Scale-out du héro au scroll — */
  gsap.to('.hero-content', {
    opacity: 0,
    y: -60,
    ease: 'power2.in',
    scrollTrigger: {
      trigger: '[data-hero]',
      start: 'center top',
      end: 'bottom top',
      scrub: 1,
    }
  });

  /* — Défilé des animaux — */
  gsap.utils.toArray('[data-parade]').forEach((el, i) => {
    gsap.to(el, {
      opacity: 1,
      y: 0,
      duration: .7,
      delay: i * 0.1,
      ease: 'back.out(1.5)',
      scrollTrigger: {
        trigger: '.animal-parade',
        start: 'top 80%',
        toggleActions: 'play none none none',
      }
    });
  });

  /* — Cartes services & témoignages — */
  gsap.utils.toArray('[data-gsap-card]').forEach((el, i) => {
    gsap.to(el, {
      opacity: 1,
      y: 0,
      duration: .6,
      delay: (i % 3) * 0.12,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: el,
        start: 'top 88%',
        toggleActions: 'play none none none',
      }
    });
  });

  /* — Reveal sections — */
  gsap.utils.toArray('[data-gsap-reveal]').forEach(el => {
    gsap.from(el, {
      opacity: 0,
      y: 40,
      duration: .8,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: el,
        start: 'top 85%',
        toggleActions: 'play none none none',
      }
    });
  });
});
