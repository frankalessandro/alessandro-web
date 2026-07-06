---
name: senior-frontend-design
description: Skill integral de desarrollo frontend senior — combina ingeniería (React, Next.js, TypeScript, Tailwind, GSAP) con diseño visual de alto nivel (tipografía, color, composición, motion). Úsala para construir features, optimizar rendimiento, maquetar UI/UX, animar interfaces con GSAP/ScrollTrigger y revisar código frontend.
---

# Senior Frontend + Design (con GSAP)

Toolkit unificado: ingeniería frontend sólida + dirección de diseño distintiva + animación experta con GSAP.

## Filosofía

No basta con que el código funcione: debe verse deliberado y sentirse fluido al interactuar.
Cada feature pasa por tres lentes antes de darse por terminada:

1. **¿Funciona bien?** — Código limpio, performante, mantenible.
2. **¿Se ve intencional?** — Dirección estética clara, nunca "genérico de IA".
3. **¿Se mueve con propósito?** — El motion refuerza la jerarquía, no es decoración suelta.

---

## 1. Quick Start — Scripts de automatización

```bash
# Generador de componentes
python scripts/component_generator.py <project-path> [options]

# Analizador de bundle
python scripts/bundle_analyzer.py <target-path> [--verbose]

# Scaffolder de frontend
python scripts/frontend_scaffolder.py [arguments] [options]
```

**Component Generator** — scaffolding automatizado, templates configurables, buenas prácticas incluidas.
**Bundle Analyzer** — análisis profundo, métricas de performance, recomendaciones, fixes automáticos.
**Frontend Scaffolder** — automatización de nivel experto, configuraciones custom, listo para integrar.

---

## 2. Dirección de diseño (antes de escribir código)

Antes de tocar el teclado, define:

- **Propósito**: ¿qué problema resuelve esta interfaz? ¿quién la usa?
- **Tono**: elige un extremo — brutalmente minimalista, maximalista, retro-futurista, orgánico, lujo/refinado, playful, editorial, brutalist/raw, art déco, pastel, industrial. No mezclar tibiamente varios.
- **Restricciones técnicas**: framework, performance, accesibilidad.
- **Diferenciador**: ¿qué hará que alguien la recuerde?

**Reglas duras:**
- Tipografía: nunca Arial/Inter/Roboto/system fonts por defecto. Pareja de fuente display distintiva + fuente de cuerpo refinada.
- Color: paleta cohesiva con variables CSS. Colores dominantes + acento agudo > paleta tibia y repartida por igual. Evitar gradientes morados sobre blanco.
- Composición: layouts inesperados, asimetría, overlap, flujo diagonal, ruptura de grid, espacio negativo generoso o densidad controlada.
- Fondo/textura: dar atmósfera y profundidad (gradient mesh, noise, patrones geométricos, transparencias en capas, sombras dramáticas) en vez de color sólido plano.
- La complejidad del código debe igualar la ambición estética: diseño maximalista → código con animaciones y efectos elaborados; diseño minimalista → restricción y precisión en spacing/tipografía.

---

## 3. GSAP — Experto en animación

GSAP es el motor de motion por defecto para interacciones que requieren control preciso de timing, secuenciación o scroll. Usar Motion/Framer solo si el proyecto ya lo tiene establecido; en React nuevo, GSAP con hooks es el estándar de esta skill.

### 3.1 Setup correcto en React

```jsx
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger, useGSAP);

function Hero() {
  const container = useRef(null);

  useGSAP(() => {
    gsap.from(".hero-line", {
      y: 60,
      opacity: 0,
      stagger: 0.08,
      duration: 0.9,
      ease: "power3.out",
    });
  }, { scope: container }); // scope evita colisiones de selector entre componentes

  return <section ref={container}>...</section>;
}
```

Reglas clave:
- **Siempre `useGSAP`**, nunca `useEffect` a mano para GSAP en React — maneja cleanup y contexto automáticamente.
- **Siempre `scope`** cuando animas por clase, para no pisar otros componentes montados.
- En Astro/vanilla JS: usar `gsap.context()` manualmente y hacer `ctx.revert()` en cleanup si el componente se desmonta.

### 3.2 Timelines (la herramienta principal, no `.to()` sueltos)

```js
const tl = gsap.timeline({ defaults: { ease: "power2.out", duration: 0.6 } });

tl.from(".nav", { y: -40, opacity: 0 })
  .from(".hero-title", { y: 30, opacity: 0 }, "-=0.3") // overlap con position parameter
  .from(".hero-sub", { opacity: 0 }, "-=0.4")
  .from(".hero-cta", { scale: 0.9, opacity: 0 }, "-=0.2");
```

- Usa **position parameters** (`"-=0.3"`, `"<"`, `">"`, labels) en vez de delays sueltos para orquestar secuencias creíbles.
- Un solo timeline bien orquestado en el load > múltiples animaciones sueltas y descoordinadas.

### 3.3 ScrollTrigger — patrones esenciales

```js
gsap.registerPlugin(ScrollTrigger);

// Reveal simple al entrar en viewport
gsap.from(".card", {
  scrollTrigger: {
    trigger: ".card",
    start: "top 80%",
    toggleActions: "play none none reverse",
  },
  y: 50,
  opacity: 0,
  duration: 0.7,
});

// Scroll-scrubbed (ligado al scroll, sin duration real)
gsap.to(".parallax-bg", {
  scrollTrigger: {
    trigger: ".section",
    start: "top bottom",
    end: "bottom top",
    scrub: 1, // suaviza con 1s de "lag"
  },
  yPercent: -30,
});

// Pin + timeline (storytelling por secciones)
ScrollTrigger.create({
  trigger: ".pin-section",
  start: "top top",
  end: "+=1500",
  pin: true,
  scrub: true,
  animation: gsap.timeline().to(".panel-1", { xPercent: -100 }).to(".panel-2", { xPercent: -100 }),
});
```

Checklist ScrollTrigger:
- `markers: true` solo en desarrollo, nunca en producción.
- Llamar `ScrollTrigger.refresh()` tras cambios de layout dinámico (imágenes lazy, fonts, contenido async).
- En componentes que se desmontan (SPA/React Router, Astro islands con view transitions), **matar los triggers**: `ScrollTrigger.getAll().forEach(t => t.kill())` dentro del cleanup de `useGSAP`/`ctx.revert()`.
- `scrub: true` para ligar 1:1 al scroll; `scrub: 1` (número) para suavizar con inercia — casi siempre preferible a `true` puro.

### 3.4 Performance y buenas prácticas

- Anima `transform` y `opacity` casi exclusivamente (GPU-accelerated). Evitar animar `width`, `height`, `top/left`, `box-shadow` en bucle.
- `will-change: transform` solo en el elemento que realmente se anima, y quitarlo después si es una animación única (no dejarlo permanente, penaliza memoria).
- `force3D: true` (default en GSAP) para forzar layer de composición en animaciones pesadas.
- Con `stagger`, preferir objetos de configuración (`stagger: { each: 0.05, from: "center" }`) sobre números sueltos cuando el efecto necesite dirección.
- Para listas largas o grids, usar `stagger` con `grid: "auto"` en vez de calcular delays manualmente.
- Respetar `prefers-reduced-motion`: envolver animaciones decorativas en `gsap.matchMedia()`.

```js
let mm = gsap.matchMedia();
mm.add("(prefers-reduced-motion: no-preference)", () => {
  gsap.from(".hero", { y: 40, opacity: 0, duration: 0.8 });
});
```

### 3.5 Errores comunes a evitar

- Registrar plugins múltiples veces en distintos componentes sin guard (usar un archivo `gsap-setup.js` central).
- Animar directamente en `useEffect` sin `gsap.context()`/`useGSAP` → memory leaks y animaciones fantasma tras desmontar.
- Mezclar CSS transitions y GSAP sobre la misma propiedad del mismo elemento → conflictos de estado.
- Usar `scrub: true` en animaciones que deberían tener personalidad propia de easing (scrub ignora el `ease` de duración real).
- Olvidar `ScrollTrigger.refresh()` después de fuentes web que cambian alturas al cargar (causa triggers desalineados).

---

## 4. Stack técnico

**Lenguajes:** TypeScript, JavaScript, Python, Go, Swift, Kotlin
**Frontend:** React, Next.js, Astro, React Native, Flutter
**Animación:** GSAP (+ ScrollTrigger, useGSAP), CSS-only para micro-interacciones simples
**Backend:** Node.js, Express, GraphQL, REST APIs
**Base de datos:** PostgreSQL, Prisma, NeonDB, Supabase
**DevOps:** Docker, Kubernetes, Terraform, GitHub Actions, CircleCI
**Cloud:** AWS, GCP, Azure

---

## 5. Flujo de trabajo

### Setup
```bash
npm install
cp .env.example .env
```

### Quality checks
```bash
python scripts/bundle_analyzer.py .
npm run lint
```

### Implementación
1. Definir dirección de diseño (sección 2).
2. Construir estructura/componentes (sección 1).
3. Orquestar motion con GSAP (sección 3) — solo después de que la maquetación estática esté sólida.
4. Revisar performance (bundle + animaciones en GPU).

---

## 6. Comandos comunes

```bash
# Desarrollo
npm run dev
npm run build
npm run test
npm run lint

# Análisis
python scripts/bundle_analyzer.py .
python scripts/frontend_scaffolder.py --analyze

# Deploy
docker build -t app:latest .
docker-compose up -d
kubectl apply -f k8s/
```

---

## 7. Checklist final antes de entregar

- [ ] Ningún font/color/layout "genérico de IA" (Inter, Roboto, gradiente morado, grid predecible).
- [ ] Timeline de GSAP con position parameters, no delays sueltos.
- [ ] `useGSAP` + `scope` en React; `gsap.context()` + `revert()` en vanilla/Astro.
- [ ] ScrollTriggers limpiados en cleanup; sin `markers: true` en producción.
- [ ] Animaciones solo sobre `transform`/`opacity`; `prefers-reduced-motion` respetado.
- [ ] Código y diseño en el mismo nivel de ambición (ninguno "carga" al otro).

## Recursos

- Patrones React: `references/react_patterns.md`
- Guía de optimización Next.js: `references/nextjs_optimization_guide.md`
- Buenas prácticas frontend: `references/frontend_best_practices.md`
- Scripts: directorio `scripts/`