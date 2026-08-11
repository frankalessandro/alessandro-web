import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(pointer: fine)').matches;

/**
 * Slam intro: the ink panel holds the stacked name for a beat, then the
 * whole thing gets shoved offscreen at an angle — like a rubber stamp
 * lifting off the page — instead of the main site's smooth veil sweep.
 */
function introSlam(onDone: () => void) {
  const intro = document.getElementById('brutal-intro');
  if (!intro) { onDone(); return; }

  const words = intro.querySelectorAll<HTMLElement>('.brutal-intro-word');
  let revealed = false;
  const reveal = () => {
    if (revealed) return;
    revealed = true;
    onDone();
  };

  const safety = window.setTimeout(() => {
    gsap.set(intro, { display: 'none' });
    reveal();
  }, 2600);

  gsap.set(words, { yPercent: 130, rotate: -6 });

  const tl = gsap.timeline({
    defaults: { ease: 'power4.out' },
    onComplete: () => {
      window.clearTimeout(safety);
      gsap.set(intro, { display: 'none' });
    },
  });

  tl.to(words, { yPercent: 0, rotate: 0, duration: 0.6, stagger: 0.08 })
    .to(intro, { duration: 0.35 }) // hold
    .to(intro, {
      x: '-110%',
      rotate: -4,
      duration: 0.55,
      ease: 'power3.in',
    })
    .add(reveal, '-=0.4');
}

/** Hero: headline slams up word by word, everything else snaps in behind it. */
function heroSlam() {
  const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });

  const words = gsap.utils.toArray<HTMLElement>('[data-brutal-hero-word]');
  if (words.length) {
    gsap.set(words, { autoAlpha: 1 });
    tl.from(words, {
      yPercent: 120,
      rotate: -3,
      duration: 0.7,
      stagger: 0.08,
    });
  }

  tl.from('[data-brutal-hero-badge]', { x: -30, autoAlpha: 0, duration: 0.4 }, '-=0.3')
    .from('[data-brutal-hero-desc]', { y: 20, autoAlpha: 0, duration: 0.5 }, '-=0.2')
    .from('[data-brutal-hero-actions] > *', { y: 16, autoAlpha: 0, duration: 0.4, stagger: 0.06 }, '-=0.25')
    .from('[data-brutal-hero-photo]', { scale: 0.85, rotate: 6, autoAlpha: 0, duration: 0.6 }, '-=0.5');
}

/**
 * Hero photo: a CMYK-style misregistration effect. On desktop the red/paper
 * duotone layer offsets away from the cursor with quickTo, snapping back to
 * dead-center on leave — a print-misprint feel instead of the main site's
 * coin flip.
 */
function heroPhotoGlitch() {
  const card = document.querySelector<HTMLElement>('[data-brutal-hero-photo]');
  const layer = card?.querySelector<HTMLElement>('[data-brutal-photo-ghost]');
  if (!card || !layer || !finePointer || reduce) return;

  const x = gsap.quickTo(layer, 'x', { duration: 0.25, ease: 'power3.out' });
  const y = gsap.quickTo(layer, 'y', { duration: 0.25, ease: 'power3.out' });

  card.addEventListener('mousemove', (e) => {
    const r = card.getBoundingClientRect();
    const dx = (e.clientX - r.left) / r.width - 0.5;
    const dy = (e.clientY - r.top) / r.height - 0.5;
    x(dx * 22);
    y(dy * 22);
  });
  card.addEventListener('mouseleave', () => { x(0); y(0); });
}

/**
 * Infinite marquee tracks: each [data-brutal-marquee-track] already contains
 * its content duplicated twice in the markup, so looping xPercent 0 -> -50
 * is seamless. Speed is derived from content width so short and long
 * marquees feel consistent.
 */
function marquees() {
  gsap.utils.toArray<HTMLElement>('[data-brutal-marquee-track]').forEach((track) => {
    const dir = track.dataset.brutalMarqueeTrack === 'reverse' ? 1 : -1;
    const width = track.scrollWidth / 2;
    const duration = Math.max(8, width / 90);
    gsap.fromTo(
      track,
      { xPercent: dir === -1 ? 0 : -50 },
      { xPercent: dir === -1 ? -50 : 0, duration, ease: 'none', repeat: -1 }
    );
  });
}

/** Generic scroll-snap reveal: blocks punch into place, no soft fades. */
function snapReveals() {
  gsap.utils.toArray<HTMLElement>('[data-brutal-reveal]').forEach((el) => {
    const dir = el.dataset.brutalReveal || 'up';
    const from: gsap.TweenVars =
      dir === 'left' ? { x: -60, autoAlpha: 0 }
      : dir === 'right' ? { x: 60, autoAlpha: 0 }
      : { y: 50, autoAlpha: 0 };

    gsap.from(el, {
      ...from,
      duration: 0.6,
      ease: 'power4.out',
      scrollTrigger: {
        trigger: el,
        start: 'top 85%',
        toggleActions: 'play none none reverse',
      },
    });
  });
}

/** Section titles: giant type slams up as one block on scroll. */
function titleSlams() {
  gsap.utils.toArray<HTMLElement>('[data-brutal-title]').forEach((el) => {
    gsap.from(el, {
      yPercent: 40,
      autoAlpha: 0,
      duration: 0.7,
      ease: 'back.out(1.7)',
      scrollTrigger: { trigger: el, start: 'top 85%' },
    });
  });
}

function init() {
  const fallback = () => {
    gsap.set('[data-brutal-hide],[data-brutal-hero-word],[data-brutal-title],[data-brutal-reveal]', { clearProps: 'all' });
    const intro = document.getElementById('brutal-intro');
    if (intro) intro.style.display = 'none';
  };

  if (reduce) {
    fallback();
    marquees();
    return;
  }

  try {
    introSlam(() => {
      heroSlam();
      heroPhotoGlitch();
    });

    const initScroll = () => {
      try {
        marquees();
        snapReveals();
        titleSlams();
        ScrollTrigger.refresh();
        if (document.fonts) document.fonts.ready.then(() => ScrollTrigger.refresh());
      } catch (err) {
        console.error('[brutal-animations] scroll init failed', err);
      }
    };

    if (document.readyState === 'complete') {
      initScroll();
    } else {
      window.addEventListener('load', initScroll, { once: true });
    }
  } catch (err) {
    console.error('[brutal-animations] init failed', err);
    fallback();
  }
}

init();
