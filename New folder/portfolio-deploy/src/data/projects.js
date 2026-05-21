// ─── Project Data ────────────────────────────────────────────────────────────
// Swap video paths with your real files from /assets/projects/
// Swap liveUrl / githubUrl with real links when ready

export const PROJECTS = [
  {
    id: 'seta-ecommerce',
    title: 'Seta E-Commerce Platform',
    category: 'Full Stack',
    description:
      'A high-performance fashion e-commerce platform built with Django REST Framework and Next.js 14. Features real-time inventory management, Stripe payment integration, and a 3D product viewer powered by Three.js.',
    longDescription:
      'Architected a full-stack solution handling 10k+ SKUs with dynamic filtering, wishlist, and order tracking. Implemented server-side rendering for SEO and lazy-loaded 3D previews for product pages.',
    tech: ['Django', 'Next.js', 'Three.js', 'PostgreSQL', 'Stripe', 'Redis'],
    video: '/assets/projects/seta-demo.mp4',
    thumbnail: '/assets/projects/seta-thumb.webp',
    liveUrl: '#',
    githubUrl: '#',
    color: '#6C63FF',
    year: '2025'
  },
  {
    id: 'madeinux-clone',
    title: 'MiUX Studio Clone',
    category: 'Frontend',
    description:
      'A pixel-perfect high-fidelity clone of MiUX Studio\'s website with GSAP-powered horizontal scroll, scroll-triggered animations, and complex CSS masking effects.',
    longDescription:
      'Reverse-engineered complex scroll sequences using GSAP ScrollTrigger. Implemented custom horizontal pinning, image reveal masks, and synchronized text animations that match the original frame-by-frame.',
    tech: ['Next.js', 'GSAP', 'ScrollTrigger', 'CSS Masking', 'Lenis'],
    video: '/assets/projects/madeinux-demo.mp4',
    thumbnail: '/assets/projects/madeinux-thumb.webp',
    liveUrl: '#',
    githubUrl: '#',
    color: '#FF6B6B',
    year: '2025'
  },
  {
    id: '3d-portfolio',
    title: '3D Interactive Portfolio',
    category: '3D / WebGL',
    description:
      'An immersive 3D bedroom portfolio built with Three.js. Features an interactive arcade machine, drag-and-drop furniture, raycaster interactions, and a cosmic particle system.',
    longDescription:
      'Built a fully navigable 3D room with GSAP camera transitions, baked lighting from Blender, and modular object architecture. Each furniture piece is a hotspot with distinct animations and interactions.',
    tech: ['Three.js', 'GSAP', 'Blender', 'Vite', 'GLSL'],
    video: '/assets/projects/portfolio-demo.mp4',
    thumbnail: '/assets/projects/portfolio-thumb.webp',
    liveUrl: '#',
    githubUrl: '#',
    color: '#00F2FE',
    year: '2026'
  },
  {
    id: 'cloth-sim',
    title: 'Interactive Cloth Simulation',
    category: '3D / Physics',
    description:
      'A real-time cloth simulation built with custom verlet integration physics running on the GPU. Users can grab, pin, and tear the fabric with mouse interaction.',
    longDescription:
      'Implemented Verlet integration for particle-based cloth simulation with constraint solving. Wind forces, gravity, and structural/shear/bend springs are computed each frame in JavaScript with Three.js rendering.',
    tech: ['Three.js', 'Verlet Physics', 'GLSL', 'WebGL'],
    video: '/assets/projects/cloth-demo.mp4',
    thumbnail: '/assets/projects/cloth-thumb.webp',
    liveUrl: '#',
    githubUrl: '#',
    color: '#43E97B',
    year: '2024'
  },
  {
    id: 'django-api',
    title: 'Django REST API',
    category: 'Backend',
    description:
      'A production-grade REST API built with Django REST Framework, featuring JWT authentication, rate limiting, Celery async tasks, and comprehensive API documentation.',
    longDescription:
      'Designed a scalable API architecture with custom permission classes, throttling, and serializer-level validation. Integrated Celery with Redis for background jobs like email notifications and data exports.',
    tech: ['Django', 'DRF', 'JWT', 'Celery', 'Redis', 'Swagger'],
    video: '/assets/projects/django-demo.mp4',
    thumbnail: '/assets/projects/django-thumb.webp',
    liveUrl: '#',
    githubUrl: '#',
    color: '#F093FB',
    year: '2024'
  },
  {
    id: 'react-dashboard',
    title: 'Analytics Dashboard',
    category: 'Frontend',
    description:
      'A real-time analytics dashboard with live data streaming, interactive charts, dark/light themes, and a fully responsive layout optimized for all screen sizes.',
    longDescription:
      'Built with React 18 and Recharts for complex data visualization. WebSocket integration for live data feeds. Custom hook architecture for shared state and performance-optimized renders with useMemo.',
    tech: ['React', 'TypeScript', 'Recharts', 'WebSocket', 'Zustand'],
    video: '/assets/projects/dashboard-demo.mp4',
    thumbnail: '/assets/projects/dashboard-thumb.webp',
    liveUrl: '#',
    githubUrl: '#',
    color: '#FA8231',
    year: '2024'
  },
  {
    id: 'nextjs-saas',
    title: 'SaaS Starter Kit',
    category: 'Full Stack',
    description:
      'A production-ready SaaS boilerplate with Next.js 14, multi-tenancy, subscription billing, team management, and a component library built from scratch.',
    longDescription:
      'Implemented subdomain-based multi-tenancy at the middleware level. Integrated LemonSqueezy for billing. Custom design system with Radix primitives, full dark mode, and accessibility compliance.',
    tech: ['Next.js', 'Prisma', 'PostgreSQL', 'LemonSqueezy', 'Radix UI'],
    video: '/assets/projects/saas-demo.mp4',
    thumbnail: '/assets/projects/saas-thumb.webp',
    liveUrl: '#',
    githubUrl: '#',
    color: '#FFD32A',
    year: '2025'
  },
  {
    id: 'gsap-landing',
    title: 'GSAP Motion Landing Page',
    category: 'Frontend',
    description:
      'A visually stunning marketing landing page featuring advanced GSAP animation choreography, WebGL-powered particle effects, and scroll-driven storytelling.',
    longDescription:
      'Crafted with ScrollTrigger pinning, staggered text reveals, and a custom WebGL particle field that responds to mouse movement. Lighthouse score: 98 performance with all animations.',
    tech: ['GSAP', 'ScrollTrigger', 'Three.js', 'HTML/CSS', 'Vite'],
    video: '/assets/projects/landing-demo.mp4',
    thumbnail: '/assets/projects/landing-thumb.webp',
    liveUrl: '#',
    githubUrl: '#',
    color: '#EE5A24',
    year: '2025'
  }
];

// Map real video files from Project-Sample to projects
// (auto-assigned in order — swap as needed)
const realVideos = [
  '/assets/projects/real/ScreenRecording2026_01_27at16_06_28_ezgif_com_video_to_gif_converter.mp4',
  '/assets/projects/real/ScreenRecording2026_04_22at12_15_19_ezgif_com_video_to_gif_converter.mp4',
  '/assets/projects/real/ScreenRecording2026_04_23at10_39_37_ezgif_com_video_to_gif_converter.mp4',
  '/assets/projects/real/ScreenRecording2026_04_24at11_01_38_ezgif_com_video_to_gif_converter.mp4',
  '/assets/projects/real/dd.mp4',
  '/assets/projects/real/prev.mp4',
  '/assets/projects/real/prev1-ezgif.com-video-to-gif-converter.mp4',
  '/assets/projects/real/video_2026-05-04_01-56-39.mp4',
];

// Assign real videos to each project
PROJECTS.forEach((project, i) => {
  if (realVideos[i]) {
    project.video = realVideos[i];
  }
});
