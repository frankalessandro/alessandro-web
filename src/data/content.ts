// Shared copy used by both the main site (src/pages/index.astro) and its
// brutalist alter ego (src/pages/brutal.astro) — kept in one place so the two
// routes can never drift apart on real content.

export interface Job {
  company: string;
  role: string;
  roleEn: string;
  period: string;
  current?: boolean;
  labelsEs?: [string, string, string];
  labelsEn?: [string, string, string];
  problem: string;
  problemEn: string;
  solution: string;
  solutionEn: string;
  results: string[];
  resultsEn: string[];
}

export const jobs: Job[] = [
  {
    company: 'Freelance',
    role: 'Desarrollador Full Stack Independiente',
    roleEn: 'Independent Full Stack Developer',
    period: 'Ene 2026 – presente',
    current: true,
    labelsEs: ['Problema', 'Desarrollo', 'Solución'],
    labelsEn: ['Problem', 'Development', 'Solution'],
    problem:
      'Pequeños negocios y profesionales independientes necesitaban presencia web profesional y visibilidad en buscadores, pero sin equipo interno ni presupuesto para coordinar diseño, desarrollo y SEO por separado entre distintas agencias.',
    problemEn:
      'Small businesses and independent professionals needed a professional web presence and search visibility, but had no in-house team or budget to coordinate design, development and SEO across separate agencies.',
    solution:
      'Diseñé y desarrollé sitios web y landing pages con Astro, Tailwind CSS y prácticas de SEO técnico para 8 clientes, gestionando cada proyecto de extremo a extremo — arquitectura, desarrollo, optimización de performance y entrega — además de identidad visual y documentación comercial (cotizaciones, propuestas) para clientes de distintos sectores.',
    solutionEn:
      'I designed and built websites and landing pages with Astro, Tailwind CSS and technical SEO practices for 8 clients, managing each project end to end — architecture, development, performance optimization and delivery — plus visual identity and commercial documentation (quotes, proposals) for clients across different sectors.',
    results: [
      '8 proyectos entregados de extremo a extremo, desde la arquitectura hasta el despliegue en producción.',
      'Identidad de marca y documentación comercial alineadas con el desarrollo técnico en cada entrega.',
      'Infraestructura de posicionamiento orgánico (Google Business Profile, GA4, Search Console) configurada para cada cliente.',
    ],
    resultsEn: [
      '8 projects delivered end to end, from architecture to production deployment.',
      'Brand identity and commercial documentation aligned with technical development on every delivery.',
      'Organic search infrastructure (Google Business Profile, GA4, Search Console) configured for each client.',
    ],
  },
  {
    company: 'Valle Avanza',
    role: 'Desarrollador Frontend',
    roleEn: 'Frontend Developer',
    period: 'Jul 2025 – Dic 2025',
    problem:
      'El sistema SICAM tenía módulos core deteriorados — radicados, permisos y dashboards con deuda técnica acumulada, procesos administrativos con alta fricción y una arquitectura que no podía escalar a nuevas métricas sin romperse.',
    problemEn:
      'The SICAM system had deteriorated core modules — records, permissions and dashboards with accumulated technical debt, high-friction administrative processes, and an architecture that could not scale to new metrics without breaking.',
    solution:
      'Refactoricé los módulos core completos, implementé flujos end-to-end con formularios complejos y control dinámico de permisos por estado, construí dashboards data-driven con Chart.js y diseñé un sistema de componentes reutilizables (modales, formularios, layouts) con documentación.',
    solutionEn:
      'I fully refactored the core modules, implemented end-to-end flows with complex forms and dynamic permission control by state, built data-driven dashboards with Chart.js, and designed a reusable component system (modals, forms, layouts) with documentation.',
    results: [
      'Mantenibilidad y calidad del código en producción notablemente mejoradas.',
      'Reducción de errores operativos y fricción en procesos administrativos.',
      'Arquitectura de dashboards preparada para nuevas métricas y fuentes de datos.',
      'Menor duplicación de código, acelerando el desarrollo de nuevas funcionalidades.',
    ],
    resultsEn: [
      'Noticeably improved maintainability and code quality in production.',
      'Reduced operational errors and friction in administrative processes.',
      'Dashboard architecture prepared for new metrics and data sources.',
      'Less code duplication, accelerating the development of new features.',
    ],
  },
  {
    company: 'Instituto Colombiano Agropecuario',
    role: 'Desarrollador de Software',
    roleEn: 'Software Developer',
    period: 'Abr 2024 – Oct 2024',
    problem:
      'El sistema SIPCO corría sobre una arquitectura PHP/PostgreSQL ineficiente con limitaciones críticas de espacio en servidor y tiempos de carga inaceptables para usuarios rurales con conectividad limitada que gestionaban +100 registros diarios de commodities.',
    problemEn:
      'The SIPCO system ran on an inefficient PHP/PostgreSQL architecture with critical server space limitations and unacceptable load times for rural users with limited connectivity who managed 100+ daily commodity records.',
    solution:
      'Optimicé la arquitectura backend (PHP Yii2 + PostgreSQL) eliminando cuellos de botella de recursos, desarrollé features end-to-end para el sistema de control de plagas e implementé un pipeline de optimización de imágenes en el flujo de carga.',
    solutionEn:
      'I optimized the backend architecture (PHP Yii2 + PostgreSQL) eliminating resource bottlenecks, developed end-to-end features for the pest control system, and implemented an image optimization pipeline in the upload flow.',
    results: [
      '60% de reducción en consumo de recursos del servidor, eliminando las limitaciones críticas de espacio.',
      '40% de mejora en tiempos de carga, impactando directamente la UX en zonas rurales.',
      'Sistema estable gestionando +100 registros diarios de commodities a nivel nacional.',
    ],
    resultsEn: [
      '60% reduction in server resource consumption, eliminating critical space limitations.',
      '40% improvement in load times, directly impacting UX in rural areas.',
      'Stable system managing 100+ daily commodity records nationwide.',
    ],
  },
  {
    company: 'EstraDigital',
    role: 'Desarrollador Full Stack',
    roleEn: 'Full Stack Developer',
    period: 'May 2023 – May 2024',
    problem:
      'Las SPAs carecían de optimización de rendimiento, la autenticación era insegura sin manejo de refresh tokens, no existían componentes reutilizables entre plataformas y las integraciones con APIs externas no tenían manejo de errores robusto.',
    problemEn:
      'SPAs lacked performance optimization, authentication was insecure without refresh token handling, no reusable components existed across platforms, and external API integrations had no robust error handling.',
    solution:
      'Desarrollé SPAs con React, hooks avanzados, Redux y lazy loading; implementé autenticación JWT completa con refresh tokens y error boundaries; construí una librería de componentes compartidos con React Native e integré APIs REST con retry logic.',
    solutionEn:
      'I built SPAs with React, advanced hooks, Redux and lazy loading; implemented full JWT authentication with refresh tokens and error boundaries; built a shared component library with React Native and integrated REST APIs with retry logic.',
    results: [
      '35% de mejora en performance mediante lazy loading y optimización de renders.',
      'Autenticación segura para +50 usuarios activos con manejo robusto de sesiones.',
      'Reducción del tiempo de desarrollo cross-platform por reutilización de componentes.',
    ],
    resultsEn: [
      '35% performance improvement via lazy loading and render optimization.',
      'Secure authentication for 50+ active users with robust session management.',
      'Reduced cross-platform development time through component reuse.',
    ],
  },
  {
    company: 'Instituto Sistematizado de Educación Empresarial',
    role: 'Docente de Informática',
    roleEn: 'Computer Science Teacher',
    period: 'Abr 2024 – Dic 2024',
    problem:
      'Más de 50 estudiantes sin base sólida en herramientas tecnológicas ni en fundamentos de desarrollo de software, con métodos de enseñanza teóricos que no generaban retención práctica.',
    problemEn:
      'More than 50 students without a solid foundation in technology tools or software development fundamentals, with theoretical teaching methods that did not generate practical retention.',
    solution:
      'Diseñé y dictué un programa con metodología hands-on centrada en proyectos reales, donde los estudiantes construían software desde el primer día en lugar de solo ver teoría.',
    solutionEn:
      'I designed and taught a program with a hands-on methodology centered on real projects, where students built software from day one instead of just watching theory.',
    results: [
      'Formación efectiva de +50 estudiantes con habilidades técnicas aplicables.',
      'Mejora medible en retención del conocimiento frente a métodos tradicionales.',
    ],
    resultsEn: [
      'Effective training of 50+ students with applicable technical skills.',
      'Measurable improvement in knowledge retention compared to traditional methods.',
    ],
  },
];

export interface ProjectEntry {
  title: string;
  logo: string;
  shot: string;
  descEs: string;
  descEn: string;
  tags: string[];
  repo: string | null;
  demo: string | null;
  statusEs: string;
  statusEn: string;
  live: boolean;
  accent: string;
}

export const projects: ProjectEntry[] = [
  {
    title: 'Fut11 Fantasy',
    logo: '/projects/fut11-fav.svg',
    shot: '/projects/fut11.webp',
    descEs:
      'Fantasy sobre la Liga BetPlay: armás tu XI titular por jornada, cada jugador puntúa según su rating real de partido (estilo SofaScore), y competís en ligas privadas con mercado de compra/venta, pujas y ofertas directas entre managers.',
    descEn:
      'Fantasy league for the BetPlay League: build your starting XI each matchday, players score from real match ratings (SofaScore-style), and compete in private leagues with a buy/sell market, bidding and direct offers between managers.',
    tags: ['React', 'Supabase', 'Tailwind 4', 'Vite'],
    repo: null,
    demo: 'https://fut11-fantasy.vercel.app/',
    statusEs: 'EN PRODUCCIÓN',
    statusEn: 'IN PRODUCTION',
    live: true,
    accent: '#4ade80',
  },
  {
    title: 'Mind Roulette',
    logo: '/projects/mindroulette-fav.svg',
    shot: '/projects/mindroulette.webp',
    descEs:
      'Web app de estudio activo: elegís un nivel de dificultad, la app sortea al azar un concepto de un mazo de +200, y te guía con dos timers — investigar el tema y explicarlo en voz alta (técnica Feynman). Disponible en español, inglés, francés y portugués.',
    descEn:
      'Active-recall study web app: pick a difficulty level, the app draws a random concept from a deck of 200+, and guides you through two timers — researching the topic and explaining it out loud (Feynman technique). Available in Spanish, English, French and Portuguese.',
    tags: ['Astro', 'TypeScript', 'Tailwind', 'GSAP'],
    repo: 'https://github.com/frankalessandro/mindroulette',
    demo: 'https://mindroulette.vercel.app/',
    statusEs: 'EN PRODUCCIÓN',
    statusEn: 'IN PRODUCTION',
    live: true,
    accent: '#c2a878',
  },
  {
    title: 'Forge',
    logo: '/projects/forge-fav.svg',
    shot: '/projects/forge.webp',
    descEs:
      'Tracker de entrenamientos de gimnasio, en solitario o en grupo con amigos. Autenticación y datos sobre Supabase (PostgreSQL + RLS), formularios validados con Zod + React Hook Form y estado global con Zustand.',
    descEn:
      'Gym workout tracker, solo or in groups with friends. Auth and data on Supabase (PostgreSQL + RLS), forms validated with Zod + React Hook Form and global state with Zustand.',
    tags: ['React 19', 'Supabase', 'Zustand', 'Tailwind 4'],
    repo: 'https://github.com/frankalessandro/forge',
    demo: 'https://forge-phi-five.vercel.app/',
    statusEs: 'EN PRODUCCIÓN',
    statusEn: 'IN PRODUCTION',
    live: true,
    accent: '#f97316',
  },
  {
    title: 'Felinas Web',
    logo: '/projects/felinas-fav.svg',
    shot: '/projects/felinas.webp',
    descEs:
      'Sitio oficial de Pantera Felinas, academia de danza urbana femenina: landing con selector de sección, página de academia (estilos, planes, FAQ), sección de shows, animaciones on-scroll y agendamiento por WhatsApp.',
    descEn:
      'Official site for Pantera Felinas, a women’s urban dance academy: landing with section selector, academy page (styles, plans, FAQ), shows section, on-scroll animations and WhatsApp booking.',
    tags: ['Astro 6', 'React', 'Tailwind', 'GSAP'],
    repo: 'https://github.com/frankalessandro/felinas-web',
    demo: 'https://felinas-web.vercel.app/',
    statusEs: 'EN PRODUCCIÓN',
    statusEn: 'IN PRODUCTION',
    live: true,
    accent: '#a78bfa',
  },
  {
    title: 'Polla Mundialista 2026',
    logo: '/projects/polla-fav.png',
    shot: '/projects/polla.webp',
    descEs:
      'Quiniela para la fase de grupos del Mundial 2026: 72 predicciones por participante, puntos calculados con marcadores reales de TheSportsDB resueltos en build, clasificación con desempates y tablas filtrables. 100% estático.',
    descEn:
      'Prediction pool for the 2026 World Cup group stage: 72 picks per participant, points computed from real TheSportsDB scores resolved at build time, tie-break standings and filterable tables. 100% static.',
    tags: ['Astro', 'TypeScript', 'Tailwind 4', 'TheSportsDB'],
    repo: 'https://github.com/frankalessandro/polla-mundialista',
    demo: 'https://polla-mundialista-five-delta.vercel.app/',
    statusEs: 'FINALIZADO',
    statusEn: 'COMPLETED',
    live: false,
    accent: '#fbbf24',
  },
  {
    title: 'VotApp',
    logo: '/projects/votapp-fav.svg',
    shot: '/projects/votapp.webp',
    descEs:
      'Plataforma de votación electrónica con validación de identidad, usada por ~1200 aprendices del CBI Palmira. Redujo drásticamente el tiempo del proceso electoral frente al conteo manual.',
    descEn:
      'Electronic voting platform with identity validation, used by ~1200 CBI Palmira students. Dramatically reduced election time compared to manual counting.',
    tags: ['Astro', 'JavaScript', 'Tailwind'],
    repo: 'https://github.com/frankalessandro/VotApp',
    demo: 'https://vot-app.vercel.app',
    statusEs: 'FINALIZADO',
    statusEn: 'COMPLETED',
    live: false,
    accent: '#6ee7b7',
  },
];
