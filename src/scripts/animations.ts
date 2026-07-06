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
 * Projects showcase deck:
 * 1. Section title does a SplitText word reveal (mirrors the other sections).
 * 2. Desktop: the deck pins and each project hands off to the next on scroll —
 *    the info column cascades out, the screenshot clips shut behind a vertical
 *    hairline that sweeps the full deck, the ghost index rolls over, and the
 *    next project un-clips from the opposite side. Direction alternates.
 * 3. Mobile / narrow: no pin — each stacked card gets a clip-reveal + cascade
 *    as it enters the viewport.
 */
function projects() {
  const deck = document.querySelector<HTMLElement>('[data-proj-deck]');
  const slides = gsap.utils.toArray<HTMLElement>('[data-proj-slide]');
  if (!deck || !slides.length) return;

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

  const info = (s: HTMLElement) => s.querySelectorAll<HTMLElement>('[data-proj-el]');
  const shot = (s: HTMLElement) => s.querySelector<HTMLElement>('[data-proj-clip]')!;

  const mm = gsap.matchMedia();

  // ── Desktop: deck pinned at screen center, depth hand-offs ─────────────
  // The active window recedes into the background (scales down, tips back,
  // fades) while the next one rises from below the fold and settles; the
  // info column cascades out/in and the index rolls over.
  mm.add('(min-width: 1024px)', () => {
    const stage = deck.querySelector<HTMLElement>('[data-proj-stage]')!;
    const countTrack = deck.querySelector<HTMLElement>('[data-proj-count]');
    const n = slides.length;

    // Depth of field so the rotateX recede/rise reads as real perspective.
    gsap.set(stage, { perspective: 1100 });

    // Only the first slide starts visible (CSS pre-hides the rest).
    slides.forEach((s, i) => gsap.set(s, { autoAlpha: i === 0 ? 1 : 0 }));

    // Entrance for the first slide: the window rises and settles, then the
    // info column cascades in.
    const first = slides[0];
    gsap.set(shot(first), { y: 70, scale: 0.94, autoAlpha: 0, transformOrigin: '50% 100%' });
    gsap.set(info(first), { y: 26, autoAlpha: 0 });

    gsap.timeline({
      defaults: { ease: 'power3.out' },
      scrollTrigger: { trigger: deck, start: 'top 75%', once: true },
    })
      .to(shot(first), { y: 0, scale: 1, autoAlpha: 1, duration: 0.9 })
      .to(info(first), { y: 0, autoAlpha: 1, stagger: 0.06, duration: 0.5 }, '-=0.5');

    // Scrubbed master timeline: one hand-off per project pair, pinned with
    // the card centered in the viewport.
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: deck,
        start: 'center center',
        end: () => `+=${(n - 1) * 85}%`,
        pin: true,
        scrub: 1,
        anticipatePin: 1,
      },
    });

    for (let i = 0; i < n - 1; i++) {
      const cur = slides[i];
      const next = slides[i + 1];

      // dwell so each project holds the stage before handing off
      tl.to({}, { duration: 0.55 })

        // ── exit: info cascades up, the window recedes into the back
        .to(info(cur), { y: -26, autoAlpha: 0, stagger: 0.04, duration: 0.35, ease: 'power2.in' })
        .to(shot(cur), {
          y: -46,
          scale: 0.88,
          rotateX: 9,
          autoAlpha: 0,
          transformOrigin: '50% 0%',
          duration: 0.5,
          ease: 'power2.in',
        }, '<0.05')

        .set(cur, { autoAlpha: 0 })
        .set(next, { autoAlpha: 1 })

        // ── rolling index
        .to(countTrack, {
          yPercent: -(100 / n) * (i + 1),
          duration: 0.4,
          ease: 'power2.inOut',
        }, '<')

        // ── enter: the next window rises from beneath and settles flat
        .fromTo(shot(next),
          { y: 95, scale: 0.94, rotateX: -9, autoAlpha: 0, transformOrigin: '50% 100%' },
          {
            y: 0, scale: 1, rotateX: 0, autoAlpha: 1,
            duration: 0.6, ease: 'power3.out', immediateRender: false,
          })
        .fromTo(info(next),
          { y: 26, autoAlpha: 0 },
          {
            y: 0, autoAlpha: 1, stagger: 0.05,
            duration: 0.4, ease: 'power3.out', immediateRender: false,
          }, '<0.15');
    }
    // final dwell so the last project isn't cut short
    tl.to({}, { duration: 0.55 });
  });

  // ── Mobile / narrow: stacked cards, window rises per card ──────────────
  mm.add('(max-width: 1023px)', () => {
    slides.forEach((slide) => {
      gsap.timeline({
        defaults: { ease: 'power3.out' },
        scrollTrigger: { trigger: slide, start: 'top 80%', once: true },
      })
        .from(shot(slide), { y: 50, scale: 0.96, autoAlpha: 0, duration: 0.8 })
        .from(info(slide), { y: 24, autoAlpha: 0, stagger: 0.06, duration: 0.5 }, '-=0.45');
    });
  });

  // Desktop hover: subtle 3D tilt on the screenshot window
  if (finePointer) {
    slides.forEach((slide) => tilt(shot(slide)));
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
    // Deck slides are pre-hidden/stacked by CSS on desktop; force them visible.
    gsap.set('[data-proj-slide],[data-proj-clip],[data-proj-el],[data-proj-num]', { clearProps: 'all', autoAlpha: 1 });
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
