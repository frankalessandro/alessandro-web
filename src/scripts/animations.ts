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
 * Hero photo card: cycles GitHub avatar → studio photo with
 * a single clean coin flip. The whole card — frame, corners, tag, hint —
 * rides one rigid plane (`.hero-photo-spin`) that lifts, turns exactly one
 * full turn, and drops back down with a soft landing bounce; the photo
 * underneath is only swapped while that plane is edge-on/back-facing
 * (backface-visibility: hidden), so the change itself is never actually
 * seen — just the flip.
 * Click/tap to flip forward, on desktop and touch alike (pulsing "tap" hint,
 * dismissed on first interaction). Enter/Space flips too.
 */
function heroPhotoSwap() {
  const card = document.querySelector<HTMLElement>('[data-hero-avatar]');
  if (!card) return;

  const spin = card.querySelector<HTMLElement>('[data-hero-spin]');
  const layers = [
    card.querySelector<HTMLElement>('.hero-photo-img--avatar'),
    card.querySelector<HTMLElement>('.hero-photo-img--studio'),
  ];
  const labels = ['avatar', 'studio'];
  const tag = card.querySelector<HTMLElement>('[data-hero-photo-tag]');
  const frame = card.querySelector<HTMLElement>('.hero-photo-frame');
  if (!spin || layers.some((l) => !l) || !tag || !frame) return;

  let idx = 0;
  let zCounter = 10;
  let spinAngle = 0;
  let animating = false;

  gsap.set(spin, { transformOrigin: '50% 50%' });

  const goTo = (next: number) => {
    if (next === idx || animating) return;
    animating = true;
    idx = next;
    const incoming = layers[idx]!;

    card.classList.toggle('is-active', idx !== 0);
    card.setAttribute('aria-pressed', String(idx !== 0));
    scrambleText(tag, labels[idx], 6, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ');

    // One full turn, always the same direction — ends back at a multiple of
    // 360° so the settled face reads right-side up. The photo swap rides
    // the single edge-on/back-facing window (mod 90–270); it's invisible.
    spinAngle += 360;
    let swapped = false;

    const DURATION = 0.58;

    const tl = gsap.timeline({ onComplete: () => { animating = false; } });
    tl.to(spin, {
      rotateY: spinAngle,
      duration: DURATION,
      ease: 'power2.inOut',
      onUpdate() {
        if (swapped) return;
        const cur = Number(gsap.getProperty(spin, 'rotateY'));
        const mod = ((cur % 360) + 360) % 360;
        if (mod > 90 && mod < 270) {
          swapped = true;
          zCounter += 1;
          gsap.set(incoming, { zIndex: zCounter });
          gsap.fromTo(frame,
            { boxShadow: '0 0 0 1px rgba(110,231,183,0.8), 0 0 30px 2px rgba(110,231,183,0.5)' },
            { boxShadow: '0 0 0 0px rgba(110,231,183,0), 0 0 0px 0px rgba(110,231,183,0)', duration: 0.5, ease: 'power2.out' }
          );
        }
      },
    }, 0)
      // Lift on the way up, soft-bounce landing on the way down.
      .to(spin, { y: -16, duration: DURATION / 2, ease: 'power2.out' }, 0)
      .to(spin, { y: 0, duration: DURATION / 2, ease: 'back.out(1.3)' }, DURATION / 2);
  };

  const dismissHint = () => card.classList.add('hint-dismissed');
  const advance = () => goTo((idx + 1) % layers.length);

  card.addEventListener('click', () => { dismissHint(); advance(); });

  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      dismissHint();
      advance();
    }
  });
}

/**
 * Projects showcase deck:
 * 1. Section title does a SplitText word reveal (mirrors the other sections).
 * 2. Desktop: the deck pins centered and each project hands off to the next on
 *    scroll — the active window recedes into the background while the incoming
 *    one arrives with its own entrance (rise, side slide, foreground settle…),
 *    the info column cascades out/in and the index rolls over.
 * 3. Mobile / narrow: no pin — each stacked card rises + cascades as it
 *    enters the viewport.
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

  const stage = deck.querySelector<HTMLElement>('[data-proj-stage]')!;
  const countTrack = deck.querySelector<HTMLElement>('[data-proj-count]');
  const n = slides.length;

  // ── Jump-to-project dots ──────────────────────────────────────────────
  // `deckTl` always points at whichever pinned timeline is currently live
  // (desktop/mobile rebuild it on breakpoint change via matchMedia below),
  // so a dot click can compute a scroll target against it at click time.
  const dots = gsap.utils.toArray<HTMLButtonElement>('[data-proj-dot]');
  let deckTl: gsap.core.Timeline | null = null;

  function setActiveDot(i: number) {
    dots.forEach((d, di) => d.setAttribute('aria-current', String(di === i)));
  }

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      if (!deckTl) return;
      const st = deckTl.scrollTrigger;
      if (!st) return;
      // swap{i-1} is the instant slide i becomes active; +0.85 time-units
      // lands past its ~0.6s enter animation, inside its steady dwell.
      const t = i === 0 ? 0 : Number(deckTl.labels[`swap${i - 1}`]) + 0.85;
      const frac = Math.min(1, Math.max(0, t / deckTl.duration()));
      window.scrollTo({ top: st.start + frac * (st.end - st.start), behavior: 'smooth' });
    });
  });

  // Identity target shared by every entrance — resets whatever axes the
  // preset displaced.
  const settled = { x: 0, y: 0, scale: 1, rotateX: 0, rotateY: 0, autoAlpha: 1 };

  type Entrance = { shot: gsap.TweenVars; info: gsap.TweenVars };

  /**
   * The pinned hand-off deck, shared by desktop and mobile. The deck pins
   * centered and each project cedes the stage to the next in place: the active
   * window recedes into the background (scales down, tips back, fades) while
   * the incoming one plays its own entrance and settles, the info column
   * cascades out/in and — where visible — the index rolls over.
   *
   *   entrances  per-project incoming moves, cycled so no two consecutive
   *              projects repeat a motion (transform/opacity only).
   *   endPct     scroll distance per hand-off, as a % of viewport height.
   *   withCounter animate the rolling index (desktop only — hidden on mobile).
   */
  function buildDeck(entrances: Entrance[], endPct: number, withCounter: boolean) {
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
        end: () => `+=${(n - 1) * endPct}%`,
        pin: true,
        scrub: 1,
        anticipatePin: 1,
        // A fast flick-scroll through a scrubbed pin can outrun the smoothed
        // scrub (scrub: 1 lags on purpose) — the pin then snaps to catch up,
        // which is the "salto" where the title flashes over the deck for a
        // frame. Finishing the scrub instantly past a fast scroll avoids it.
        fastScrollEnd: true,
      },
    });

    deckTl = tl;
    setActiveDot(0);
    tl.eventCallback('onUpdate', () => {
      const t = tl.time();
      let idx = 0;
      for (let k = 0; k < n - 1; k++) {
        const lbl = tl.labels[`swap${k}`];
        if (typeof lbl === 'number' && t >= lbl) idx = k + 1;
      }
      setActiveDot(idx);
    });

    for (let i = 0; i < n - 1; i++) {
      const cur = slides[i];
      const next = slides[i + 1];
      const e = entrances[(i + 1) % entrances.length];
      const swap = `swap${i}`;

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

        // ── swap: pre-place the incoming pieces (still invisible) in the same
        // frame the slide becomes active — this is what prevents the next card
        // from flashing fully-formed before its entrance plays.
        .addLabel(swap)
        .set(shot(next), { ...e.shot, autoAlpha: 0 }, swap)
        .set(info(next), { ...e.info, autoAlpha: 0 }, swap)
        .set(cur, { autoAlpha: 0 }, swap)
        .set(next, { autoAlpha: 1 }, swap);

      // ── rolling index (desktop only — the counter is hidden on mobile)
      if (withCounter && countTrack) {
        tl.to(countTrack, {
          yPercent: -(100 / n) * (i + 1),
          duration: 0.4,
          ease: 'power2.inOut',
        }, swap);
      }

      // ── enter: the window plays its own move, info follows the same axis
      tl.to(shot(next), { ...settled, duration: 0.6, ease: 'power3.out' }, `${swap}+=0.05`)
        .to(info(next), {
          x: 0, y: 0, autoAlpha: 1, stagger: 0.05,
          duration: 0.4, ease: 'power3.out',
        }, `${swap}+=0.22`);
    }
    // final dwell so the last project isn't cut short
    tl.to({}, { duration: 0.55 });
  }

  const mm = gsap.matchMedia();

  // ── Desktop: wide entrances that use the horizontal axis and panel hinges. ─
  mm.add('(min-width: 1024px)', () => {
    buildDeck([
      // rises from below and settles flat
      { shot: { y: 95, scale: 0.94, rotateX: -9, transformOrigin: '50% 100%' },
        info: { y: 26 } },
      // slides in from the right, hinging like a turning panel
      { shot: { x: 130, rotateY: -14, scale: 0.96, transformOrigin: '0% 50%' },
        info: { x: 34 } },
      // arrives from the foreground: oversized, settles back into place
      { shot: { scale: 1.12, y: 18, transformOrigin: '50% 40%' },
        info: { y: -26 } },
      // slides in from the left, mirroring the panel hinge
      { shot: { x: -130, rotateY: 14, scale: 0.96, transformOrigin: '100% 50%' },
        info: { x: -34 } },
      // drops from above and lands
      { shot: { y: -90, rotateX: 10, scale: 0.94, transformOrigin: '50% 0%' },
        info: { y: 26 } },
    ], 85, true);
  });

  // ── Mobile / narrow: same pinned hand-off, but entrances stay on the
  // vertical/scale/depth axes — no horizontal slides or Y-hinges that could
  // push content past a narrow viewport and cause sideways scroll. ──────────
  mm.add('(max-width: 1023px)', () => {
    buildDeck([
      // rises from below and settles flat
      { shot: { y: 90, scale: 0.94, rotateX: -8, transformOrigin: '50% 100%' },
        info: { y: 24 } },
      // drops from above and lands
      { shot: { y: -80, scale: 0.94, rotateX: 8, transformOrigin: '50% 0%' },
        info: { y: -24 } },
      // arrives from the foreground: oversized, settles back into place
      { shot: { scale: 1.1, y: 16, transformOrigin: '50% 40%' },
        info: { y: -22 } },
      // rises with a deeper compression
      { shot: { y: 74, scale: 0.9, rotateX: -6, transformOrigin: '50% 100%' },
        info: { y: 22 } },
    ], 80, false);
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
 * Scrambles an element's text through random characters before resolving
 * to the final value. Duration ≈ frames × 40ms.
 */
function scrambleText(el: HTMLElement, final: string, frames = 16, chars = '0123456789') {
  let f = 0;
  const id = setInterval(() => {
    if (f++ >= frames) { el.textContent = final; clearInterval(id); return; }
    el.textContent = Array.from(
      { length: final.length },
      () => chars[Math.floor(Math.random() * chars.length)]
    ).join('');
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
    gsap.set('[data-proj-slide],[data-proj-clip],[data-proj-el]', { clearProps: 'all', autoAlpha: 1 });
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
        heroPhotoSwap();
        // Cursor-following 3D tilt on the hero photo card (desktop only).
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
