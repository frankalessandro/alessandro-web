import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(ScrollTrigger, SplitText);

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(pointer: fine)').matches;

/**
 * Intro loader: the brand mark's two halves (`<` and `/>`) fly in and assemble,
 * hold for a beat, then the screen splits down the middle and slides open to
 * reveal the page. `onDone` fires as the panels part so the hero animates in
 * behind them. Resolves immediately if the loader markup isn't present.
 */
function introLoader(onDone: () => void) {
  const loader = document.getElementById('intro-loader');
  if (!loader) { onDone(); return; }

  const left   = loader.querySelector<SVGGElement>('.logo-left');
  const right  = loader.querySelector<SVGGElement>('.logo-right');
  const logo   = loader.querySelector<SVGSVGElement>('.intro-logo');
  const panelL = loader.querySelector<HTMLElement>('.intro-panel-l');
  const panelR = loader.querySelector<HTMLElement>('.intro-panel-r');
  const paths  = Array.from(loader.querySelectorAll<SVGPathElement>('.intro-logo path'));

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
  }, 4000);

  const tl = gsap.timeline({
    defaults: { ease: 'power3.out', force3D: true },
    onComplete: () => {
      window.clearTimeout(safety);
      gsap.set(loader, { display: 'none' });
      // Drop the promoted layers once we're done with them.
      gsap.set([logo, panelL, panelR], { clearProps: 'willChange' });
    },
  });

  // Prime each stroke to "undrawn" so the glyph can draw itself on.
  paths.forEach((p) => {
    const len = p.getTotalLength() || 100;
    gsap.set(p, { strokeDasharray: len, strokeDashoffset: len, autoAlpha: 1 });
  });
  gsap.set([left, right], { autoAlpha: 1, xPercent: 0 });
  gsap.set(logo, { scale: 0.82, autoAlpha: 1 });

  // 1. The glyph draws itself, stroke by stroke (`<` → `/` → `>`).
  tl.to(paths, {
    strokeDashoffset: 0,
    duration: 0.55,
    stagger: 0.13,
    ease: 'power2.inOut',
  })
    .to(logo, { scale: 1, duration: 0.5, ease: 'back.out(2.2)' }, '<0.1')

    // 2. A calm beat — a gentle breath so the mark reads before it leaves.
    .to(logo, { scale: 1.05, duration: 0.55, ease: 'sine.inOut' }, '+=0.1')

    // 3. Dissolve: the strokes un-draw themselves (a mirror of the entrance),
    //    last-drawn first, while the mark eases up and out. Striking but sober.
    .to(paths, {
      strokeDashoffset: (_i, t) => (t as SVGPathElement).getTotalLength() || 100,
      duration: 0.5,
      stagger: { each: 0.09, from: 'end' },
      ease: 'power2.in',
    }, '+=0.05')
    .to(logo, { scale: 1.18, y: -14, autoAlpha: 0, duration: 0.6, ease: 'power2.in' }, '<')

    // 4. The screen tears open as a diagonal shutter.
    .to(panelL, { xPercent: -32, yPercent: -125, rotate: -7, duration: 0.85, ease: 'power4.inOut' }, '<0.2')
    .to(panelR, { xPercent: 32, yPercent: 125, rotate: -7, duration: 0.85, ease: 'power4.inOut' }, '<')

    // Reveal the hero just before the panels finish clearing.
    .add(reveal, '-=0.5');
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
      // restore clean DOM once the flourish is done
      onComplete: () => split.revert(),
    }, '-=0.2');
  }

  tl.fromTo('[data-anim-hero="desc"]',
      { y: 18, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, duration: 0.7 }, '-=0.5')
    .fromTo('[data-anim-hero="avatar"]',
      { scale: 0.86, autoAlpha: 0, rotate: -3 },
      { scale: 1, autoAlpha: 1, rotate: 0, duration: 1 }, '-=0.9');
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

/** Strong: project cards rise and scale in as a stagger; tilt on hover. */
function projects() {
  const cards = gsap.utils.toArray<HTMLElement>('[data-project-card]');
  if (!cards.length) return;
  gsap.from(cards, {
    y: 60,
    autoAlpha: 0,
    scale: 0.96,
    duration: 0.7,
    ease: 'power3.out',
    stagger: 0.12,
    scrollTrigger: { trigger: '#projects', start: 'top 75%' },
  });
  if (finePointer) cards.forEach(tilt);
}

/** About section: label → title word reveal → paragraphs stagger → skills stagger. */
function aboutReveal() {
  if (!document.querySelector('[data-anim-about]')) return;

  const tl = gsap.timeline({
    scrollTrigger: { trigger: '#about', start: 'top 70%', once: true },
    defaults: { ease: 'power3.out' },
  });

  tl.fromTo('[data-anim-about="label"]',
    { y: 20, autoAlpha: 0 },
    { y: 0, autoAlpha: 1, duration: 0.55 });

  const titleEl = document.querySelector<HTMLElement>('[data-anim-about="title"]');
  if (titleEl) {
    gsap.set(titleEl, { autoAlpha: 1 });
    const split = new SplitText(titleEl, { type: 'words' });
    tl.fromTo(split.words,
      { yPercent: 110, autoAlpha: 0, rotateX: -60, transformOrigin: '50% 100%' },
      {
        yPercent: 0, autoAlpha: 1, rotateX: 0,
        stagger: 0.08, duration: 0.65, ease: 'back.out(1.4)',
        onComplete: () => split.revert(),
      }, '-=0.25');
  }

  tl.fromTo('[data-anim-about="para"]',
    { y: 22, autoAlpha: 0 },
    { y: 0, autoAlpha: 1, duration: 0.5, stagger: 0.1 },
    '-=0.35');

  tl.fromTo('[data-anim-about="skill-group"]',
    { x: 30, autoAlpha: 0 },
    { x: 0, autoAlpha: 1, duration: 0.5, stagger: 0.12 },
    '-=0.65');
}

/** Subtle: contact links slide in one after another. */
function contactReveal() {
  if (!document.querySelector('[data-anim-contact]')) return;
  gsap.from('[data-anim-contact] > a', {
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
    gsap.set('[data-anim-hero],[data-anim-about],[data-exp-company],[data-exp-role],[data-exp-num]',
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
