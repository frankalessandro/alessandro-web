import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(ScrollTrigger, SplitText);

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(pointer: fine)').matches;

/**
 * Intro loader exit. The entrance is pure CSS (glyph self-draws, caret blinks,
 * progress fills) so the loader is alive from the first paint even while this
 * bundle is still downloading — GSAP only choreographs the way out: complete
 * the progress, pop the mark up and off, sweep the veil away. `onDone` fires
 * mid-sweep so the hero animates in behind it.
 */
function introLoader(onDone: () => void) {
  const loader = document.getElementById('intro-loader');
  if (!loader) { onDone(); return; }

  const content = loader.querySelector<HTMLElement>('.intro-content');
  const veil    = loader.querySelector<HTMLElement>('.intro-veil');
  const fill    = loader.querySelector<HTMLElement>('.intro-progress-fill');

  let revealed = false;
  const reveal = () => {
    if (revealed) return;
    revealed = true;
    // Let the starfield know it can start drawing now that the overlay is gone.
    window.dispatchEvent(new Event('intro:done'));
    onDone();
  };

  // Safety net: never let the overlay get stuck if the timeline misfires.
  const safety = window.setTimeout(() => {
    gsap.set(loader, { display: 'none' });
    reveal();
  }, 3000);

  // Hold only long enough for the CSS draw to read (~1s from navigation start).
  // On slow connections the bundle arrives later than that, so hold is 0 and
  // we exit immediately — the CSS entrance already filled the wait.
  const hold = Math.max(0, 1 - performance.now() / 1000);

  // Take over the progress bar exactly where its CSS animation currently is,
  // then kill the animation so the GSAP tween isn't overridden by it.
  if (fill) {
    const m = new DOMMatrixReadOnly(getComputedStyle(fill).transform);
    fill.style.animation = 'none';
    gsap.set(fill, { scaleX: m.a });
  }
  // Same for the content pop-in (its final frame is identity, so no jump).
  if (content) content.style.animation = 'none';

  const tl = gsap.timeline({
    delay: hold,
    defaults: { ease: 'power3.out', force3D: true },
    onComplete: () => {
      window.clearTimeout(safety);
      gsap.set(loader, { display: 'none' });
      // Drop the promoted layers once we're done with them.
      gsap.set([content, veil], { clearProps: 'willChange' });
    },
  });

  // 1. Progress snaps to done and the mark gives a confident little pop.
  tl.to(fill, { scaleX: 1, duration: 0.2, ease: 'power1.inOut' })
    .to(content, { scale: 1.05, duration: 0.2, ease: 'power2.out' }, '<')

    // 2. The mark launches up and out…
    .to(content, { y: -48, autoAlpha: 0, duration: 0.35, ease: 'power2.in' }, '+=0.05')

    // 3. …and the veil sweeps up after it, its accent edge leading the wipe.
    .to(veil, { yPercent: -100.5, duration: 0.6, ease: 'power4.inOut' }, '-=0.22')

    // Reveal the hero mid-sweep so there's zero dead air.
    .add(reveal, '-=0.42');
}

/** Strong entrance: the name reveals char-by-char, everything else cascades in. */
function heroIntro() {
  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

  tl.fromTo('[data-anim-hero="badge"]',
      { y: 18, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, duration: 0.6 })
    .fromTo('[data-anim-hero="type"]',
      { y: 18, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, duration: 0.6 }, '-=0.35');

  const name = document.querySelector<HTMLElement>('#hero-name');
  if (name) {
    const split = new SplitText(name, { type: 'chars' });
    gsap.set(name, { autoAlpha: 1 });
    tl.from(split.chars, {
      yPercent: 120,
      autoAlpha: 0,
      rotateX: -80,
      transformOrigin: '50% 100%',
      stagger: 0.035,
      duration: 0.9,
      ease: 'back.out(1.6)',
      // restore clean DOM once the flourish is done, then arm the hover gravity
      onComplete: () => { split.revert(); heroNameHover(); },
    }, '-=0.2');
  }

  tl.fromTo('[data-anim-hero="desc"]',
      { y: 18, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, duration: 0.7 }, '-=0.5');

  // Avatar is optional (currently hidden until the photo is ready).
  const avatar = document.querySelector<HTMLElement>('[data-anim-hero="avatar"]');
  if (avatar) {
    tl.fromTo(avatar,
      { scale: 0.86, autoAlpha: 0, rotate: -3 },
      { scale: 1, autoAlpha: 1, rotate: 0, duration: 1 }, '-=0.9');
  }
}

/** Subtle: hero content drifts and fades as you scroll past it. */
function heroParallax() {
  const inner = document.querySelector<HTMLElement>('#hero > div');
  if (!inner) return;
  gsap.to(inner, {
    yPercent: 26,
    opacity: 0,
    ease: 'none',
    scrollTrigger: {
      trigger: '#hero',
      start: 'top top',
      end: 'bottom top',
      scrub: true,
    },
  });
}

/** Subtle: navbar drops in, then condenses into a solid pill once you scroll. */
function navbar() {
  const pill = document.getElementById('nav-pill');
  if (!pill) return;
  gsap.from('#navbar', { y: -24, autoAlpha: 0, duration: 0.8, delay: 0.2, ease: 'power3.out' });
  ScrollTrigger.create({
    start: 'top -80',
    onEnter: () => pill.classList.add('nav-scrolled'),
    onLeaveBack: () => pill.classList.remove('nav-scrolled'),
  });
}

/** A subtle 3D tilt that follows the cursor across a card. */
function tilt(card: HTMLElement) {
  gsap.set(card, { transformPerspective: 700, transformStyle: 'preserve-3d' });
  const rx = gsap.quickTo(card, 'rotationX', { duration: 0.5, ease: 'power2.out' });
  const ry = gsap.quickTo(card, 'rotationY', { duration: 0.5, ease: 'power2.out' });
  card.addEventListener('mousemove', (e) => {
    const r = card.getBoundingClientRect();
    const dx = (e.clientX - r.left) / r.width - 0.5;
    const dy = (e.clientY - r.top) / r.height - 0.5;
    ry(dx * 10);
    rx(-dy * 10);
  });
  card.addEventListener('mouseleave', () => { rx(0); ry(0); });
}

/**
 * Hover gravity on the hero name: each character is a tiny body with mass —
 * chars near the cursor lift and tilt away, then spring back. Char centers
 * are measured at rest on mouseenter so the effect never feedback-wobbles.
 */
function heroNameHover() {
  if (!finePointer || reduce) return;
  const name = document.querySelector<HTMLElement>('#hero-name');
  if (!name) return;

  const split = new SplitText(name, { type: 'chars' });
  const chars = split.chars as HTMLElement[];
  const bodies = chars.map((c) => ({
    y: gsap.quickTo(c, 'y', { duration: 0.35, ease: 'power3.out' }),
    r: gsap.quickTo(c, 'rotation', { duration: 0.45, ease: 'power3.out' }),
    cx: 0,
    cy: 0,
  }));

  const measure = () => {
    chars.forEach((c, i) => {
      const rect = c.getBoundingClientRect();
      bodies[i].cx = rect.left + rect.width / 2;
      bodies[i].cy = rect.top + rect.height / 2;
    });
  };

  const RADIUS = 130;
  name.addEventListener('mouseenter', measure);
  name.addEventListener('mousemove', (e) => {
    for (const b of bodies) {
      const dx = b.cx - e.clientX;
      const d = Math.hypot(dx, b.cy - e.clientY);
      if (d < RADIUS) {
        const f = 1 - d / RADIUS;
        b.y(-f * 24);
        b.r((dx >= 0 ? 1 : -1) * f * 9);
      } else {
        b.y(0);
        b.r(0);
      }
    }
  });
  name.addEventListener('mouseleave', () => {
    for (const b of bodies) { b.y(0); b.r(0); }
  });
}

/**
 * Scrambles a mission code (e.g. "MSN-03") through random glyphs before
 * settling on the real value — a tiny "decrypting telemetry" beat.
 */
function scrambleCode(el: HTMLElement, final: string, frames = 14) {
  const glyphs = 'ABCDEFGHIKMNSTVX0123456789-·';
  let f = 0;
  const id = setInterval(() => {
    if (f++ >= frames) { el.textContent = final; clearInterval(id); return; }
    el.textContent = Array.from(final, () =>
      glyphs[Math.floor(Math.random() * glyphs.length)]
    ).join('');
  }, 40);
}

/**
 * The projects "mission log" choreography:
 * 1. Section title does a SplitText word reveal (mirrors the other sections).
 * 2. Cards drop out of hyperspace: they fly in from deep z-space, blurred,
 *    and snap into focus with a stagger.
 * 3. As each card lands, its constellation draws itself stroke-by-stroke and
 *    its mission code scrambles into place.
 * 4. Hover: 3D tilt + a glow that tracks the cursor via CSS vars.
 */
function projects() {
  const cards = gsap.utils.toArray<HTMLElement>('[data-project-card]');
  if (!cards.length) return;

  // Title word reveal
  const titleEl = document.querySelector<HTMLElement>('[data-proj-title]');
  if (titleEl) {
    const split = new SplitText(titleEl, { type: 'words' });
    gsap.set(titleEl, { autoAlpha: 1 });
    gsap.from(split.words, {
      yPercent: 110,
      autoAlpha: 0,
      rotateX: -60,
      transformOrigin: '50% 100%',
      stagger: 0.08,
      duration: 0.75,
      ease: 'back.out(1.4)',
      scrollTrigger: {
        trigger: titleEl,
        start: 'top 85%',
        toggleActions: 'play none none reverse',
      },
    });
  }

  // Depth of field for the hyperspace entrance
  const grid = document.querySelector<HTMLElement>('#projects .proj-grid');
  if (grid) gsap.set(grid, { perspective: 900 });

  // Prime each constellation to "undrawn" (same dash trick as the intro logo)
  cards.forEach((card) => {
    card.querySelectorAll<SVGPathElement>('.proj-constellation path').forEach((p) => {
      const len = p.getTotalLength() || 120;
      gsap.set(p, { strokeDasharray: len, strokeDashoffset: len });
    });
    gsap.set(card.querySelectorAll('.proj-constellation circle'), { scale: 0, transformOrigin: '50% 50%' });
  });

  // 2. Hyperspace drop-in
  gsap.from(cards, {
    z: -420,
    y: 80,
    rotationX: 18,
    autoAlpha: 0,
    filter: 'blur(10px)',
    duration: 0.9,
    ease: 'power3.out',
    stagger: 0.1,
    scrollTrigger: { trigger: '#projects', start: 'top 72%' },
    onComplete: () => {
      // Drop the blur rasterization cost once the cards have landed.
      gsap.set(cards, { clearProps: 'filter' });
    },
  });

  // 3. Per-card: constellation draw + code scramble as each one enters view
  cards.forEach((card) => {
    const codeEl = card.querySelector<HTMLElement>('[data-proj-code]');
    const finalCode = codeEl?.textContent?.trim() ?? '';
    const lines = card.querySelectorAll<SVGPathElement>('.proj-constellation path');
    const stars = card.querySelectorAll('.proj-constellation circle');

    ScrollTrigger.create({
      trigger: card,
      start: 'top 85%',
      once: true,
      onEnter: () => {
        if (codeEl) scrambleCode(codeEl, finalCode);
        gsap.to(lines, { strokeDashoffset: 0, duration: 0.9, ease: 'power2.inOut', delay: 0.35 });
        gsap.to(stars, {
          scale: 1,
          duration: 0.4,
          stagger: 0.12,
          ease: 'back.out(2.5)',
          delay: 0.3,
        });
      },
    });
  });

  // 4. Desktop hover: 3D tilt + cursor-tracking glow
  if (finePointer) {
    cards.forEach((card) => {
      tilt(card);
      const setX = gsap.quickSetter(card, '--mx', 'px');
      const setY = gsap.quickSetter(card, '--my', 'px');
      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        setX(e.clientX - r.left);
        setY(e.clientY - r.top);
      });
    });
  }
}

/** About section: the whole block rises and fades in as one unit. */
function aboutReveal() {
  const section = document.querySelector<HTMLElement>('#about');
  if (!section) return;
  gsap.fromTo(section,
    { y: 36, autoAlpha: 0 },
    {
      y: 0, autoAlpha: 1, duration: 0.9, ease: 'power3.out',
      scrollTrigger: { trigger: section, start: 'top 75%', once: true },
    });
}

/** Subtle: contact links slide in one after another. */
function contactReveal() {
  const links = gsap.utils.toArray<HTMLElement>('[data-anim-contact] a');
  if (!links.length) return;
  gsap.from(links, {
    x: -20,
    autoAlpha: 0,
    duration: 0.6,
    stagger: 0.12,
    ease: 'power3.out',
    scrollTrigger: { trigger: '#contact', start: 'top 75%' },
  });
}

/** Subtle: section labels and titles fade up when they enter the viewport. */
function sectionHeads() {
  gsap.utils.toArray<HTMLElement>('[data-anim-head]').forEach((el) => {
    gsap.from(el, {
      y: 30,
      autoAlpha: 0,
      duration: 0.7,
      ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 85%' },
    });
  });
}

/**
 * Scrambles an element's text through random digits before resolving
 * to the final value. Duration ≈ frames × 40ms.
 */
function scrambleText(el: HTMLElement, final: string, frames = 16) {
  const chars = '0123456789';
  let f = 0;
  const id = setInterval(() => {
    if (f++ >= frames) { el.textContent = final; clearInterval(id); return; }
    el.textContent =
      chars[Math.floor(Math.random() * chars.length)] +
      chars[Math.floor(Math.random() * chars.length)];
  }, 40);
}

/**
 * The signature experience animation:
 * 1. Section title does a SplitText word-by-word reveal.
 * 2. Each card is pre-clipped; a bright scan line sweeps across it,
 *    revealing the card behind it. Content elements cascade in as
 *    the scan line passes.
 * 3. The number badge scrambles to its real value on settle.
 * 4. A brief green glow pulses on the border to signal "scanned".
 */
function experienceReveal() {
  const wraps = gsap.utils.toArray<HTMLElement>('[data-exp-card]');
  if (!wraps.length) return;

  // Section title word-by-word reveal (kept split so it can reverse on scroll-up)
  const titleEl = document.querySelector<HTMLElement>('[data-exp-title]');
  if (titleEl) {
    const split = new SplitText(titleEl, { type: 'words' });
    gsap.set(titleEl, { autoAlpha: 1 });
    gsap.from(split.words, {
      yPercent: 110,
      autoAlpha: 0,
      rotateX: -60,
      transformOrigin: '50% 100%',
      stagger: 0.08,
      duration: 0.75,
      ease: 'back.out(1.4)',
      scrollTrigger: {
        trigger: titleEl,
        start: 'top 85%',
        toggleActions: 'play none none reverse',
      },
    });
  }

  // Batch all offsetWidth reads before any GSAP writes to avoid forced reflow.
  const cardWidths = wraps.map((wrap) => wrap.offsetWidth);

  wraps.forEach((wrap, i) => {
    const side = wrap.dataset.side as 'left' | 'right';
    const card = wrap.querySelector<HTMLElement>('.exp-card')!;
    const scanLine = wrap.querySelector<HTMLElement>('.exp-scan-line')!;
    const company = wrap.querySelector<HTMLElement>('[data-exp-company]');
    const role = wrap.querySelector<HTMLElement>('[data-exp-role]');
    const numEl = wrap.querySelector<HTMLElement>('[data-exp-num]');
    const finalNum = numEl?.textContent?.trim() ?? '';

    // Pre-hide card with clip-path from the entry side
    const clipFrom = side === 'left' ? '0% 100% 0% 0%' : '0% 0% 0% 100%';
    gsap.set(card, { 'clip-path': `inset(${clipFrom} round 16px)` });

    // Scan line: always anchored to left:0 in CSS; we move it with `x` so
    // GSAP owns a single transform axis with no CSS property conflicts.
    const cardW = cardWidths[i];
    const xStart = side === 'left' ? -4 : cardW + 4;
    const xEnd   = side === 'left' ? cardW + 4 : -4;
    gsap.set(scanLine, { opacity: 0, x: xStart });

    // Pre-hide content that will stagger in
    if (company) gsap.set(company, { autoAlpha: 0, y: 12 });
    if (role)    gsap.set(role,    { autoAlpha: 0, y: 10 });
    if (numEl)   gsap.set(numEl,   { autoAlpha: 0, scale: 0.7 });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: wrap,
        start: 'top 78%',
        toggleActions: 'play none none reverse',
        onEnter: () => { if (numEl) scrambleText(numEl, finalNum); },
      },
    });

    // 1. Scan line fades in at the entry edge
    tl.to(scanLine, { opacity: 1, duration: 0.15, ease: 'none' });

    // 2. Sweep: clip-path opens AND scan line travels across simultaneously
    tl.to(card, {
      'clip-path': 'inset(0% 0% 0% 0% round 16px)',
      duration: 0.75,
      ease: 'power2.inOut',
    }, '<')
    .to(scanLine, {
      x: xEnd,
      duration: 0.75,
      ease: 'power2.inOut',
    }, '<');

    // 3. Scan line fades out as it exits
    tl.to(scanLine, { opacity: 0, duration: 0.18, ease: 'none' }, '-=0.18');

    // 4. Content cascades in behind the scan
    tl.to(company, { autoAlpha: 1, y: 0, duration: 0.45, ease: 'power3.out' }, '-=0.55')
      .to(role,    { autoAlpha: 1, y: 0, duration: 0.4,  ease: 'power3.out' }, '-=0.38')
      .to(numEl,   { autoAlpha: 1, scale: 1, duration: 0.35, ease: 'back.out(1.8)' }, '-=0.32');

    // 5. Brief green glow pulse on the card border (not reversed — glow just fades naturally)
    tl.to(card, {
      boxShadow: '0 0 0 1px rgba(110,231,183,0.7), 0 0 40px -8px rgba(110,231,183,0.5)',
      duration: 0.3,
      ease: 'power2.out',
    }, '-=0.1')
    .to(card, {
      boxShadow: '0 0 0 0px rgba(110,231,183,0), 0 0 0px 0px rgba(110,231,183,0)',
      duration: 0.6,
      ease: 'power2.inOut',
    });
  });
}

function init() {
  const fallback = () => {
    gsap.set('[data-anim-hero],#about,[data-exp-company],[data-exp-role],[data-exp-num],[data-proj-title]',
      { clearProps: 'all' });
    gsap.set('.exp-card', { clearProps: 'clip-path' });
  };

  if (reduce) {
    fallback();
    // No intro plays under reduced motion — release the starfield right away.
    window.dispatchEvent(new Event('intro:done'));
    return;
  }

  try {
    // Navbar drops in behind the loader; the intro loader plays first and
    // triggers the hero entrance as the screen splits open.
    navbar();
    introLoader(heroIntro);

    // All scroll-triggered animations are deferred to after load so they don't
    // inflate TBT during the critical rendering path.
    const initScroll = () => {
      try {
        heroParallax();
        // Cursor-following 3D tilt on the hero avatar (desktop only).
        const avatar = document.querySelector<HTMLElement>('[data-hero-avatar]');
        if (avatar && finePointer) tilt(avatar);
        aboutReveal();
        experienceReveal();
        projects();
        contactReveal();
        sectionHeads();
        ScrollTrigger.refresh();
        if (document.fonts) document.fonts.ready.then(() => ScrollTrigger.refresh());
      } catch (err) {
        console.error('[animations] scroll init failed', err);
        fallback();
      }
    };

    if (document.readyState === 'complete') {
      initScroll();
    } else {
      window.addEventListener('load', initScroll, { once: true });
    }
  } catch (err) {
    console.error('[animations] init failed', err);
    fallback();
  }
}

init();
