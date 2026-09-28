import { PortfolioItem, ClientGallery, StudioConfig, ActivityNotification, BotKnowledge, ClientConversation, StudioAnnouncement, StudioCategory } from '../types';

export const INITIAL_STUDIO_CATEGORIES: StudioCategory[] = [
  {
    id: "bodas",
    label: "Bodas",
    description: "Coberturas completas, elopements y momentos espontáneos con luz natural y gradación de autor en Culiacán y destinos.",
    isCore: true,
    order: 1,
    coverImage: "/src/assets/images/hero_photographer_cinematic_1790312865168.jpg",
  },
  {
    id: "gastronomia",
    label: "Gastronomía",
    description: "Fotografía culinaria fine art para restaurantes, chefs de autor y marcas gastronómicas capturando textura y producto fresco.",
    isCore: true,
    order: 2,
    coverImage: "/src/assets/images/gastronomy_culinary_fineart_1790315306551.jpg",
  },
  {
    id: "arquitectura",
    label: "Arquitectura",
    description: "Documentación de proyectos residenciales, espacios contemporáneos y diseño interior con ópticas descentrables tilt-shift.",
    isCore: true,
    order: 3,
    coverImage: "/src/assets/images/architecture_minimalist_fineart_1790312918165.jpg",
  },
  {
    id: "retrato",
    label: "Retrato",
    description: "Retrato editorial de autor en formato medio con ópticas de máxima apertura y grano analógico para artistas y profesionales.",
    isCore: true,
    order: 4,
    coverImage: "/src/assets/images/portrait_editorial_highfashion_1790312877113.jpg",
  },
];

export const INITIAL_STUDIO_CONFIG: StudioConfig = {
  photographerName: "Mateo Valenzuela",
  studioName: "CADSTUDIO",
  tagline: "Fotografía de Autor, Gastronomía & Coberturas Visuales",
  bio: "Estudio visual de autor especializado en bodas emotivas, alta gastronomía, arquitectura y retratos con carácter en Culiacán, Sinaloa y disponibles en todo México. Trabajamos con ópticas de máxima apertura para entregar piezas visuales con textura analógica y máxima nitidez.",
  location: "Culiacán, Sinaloa",
  email: "contacto@cadstudio.mx",
  phone: "+52 667 123 4567",
  whatsapp: "+526671234567",
  instagram: "@cadstudio.foto",
  vimeo: "vimeo.com/cadstudio",
};

export const INITIAL_PORTFOLIO_ITEMS: PortfolioItem[] = [
  {
    id: "port-1",
    title: "Chiaroscuro Nocturne & Formato Medio",
    category: "retrato",
    aspectRatio: "16:9",
    mediaType: "image",
    url: "/src/assets/images/hero_photographer_cinematic_1790312865168.jpg",
    originalUrl: "/src/assets/images/hero_photographer_cinematic_1790312865168.jpg",
    client: "Leica Monochrom Series",
    year: "2026",
    exif: {
      camera: "Leica SL2-S",
      lens: "Noctilux-M 50mm f/0.95 ASPH",
      focalLength: "50mm",
      aperture: "f/1.2",
      shutter: "1/250s",
      iso: "400",
      resolution: "8368 × 4707 px · 39.4 MP"
    },
    colors: ["#121214", "#8c6b48", "#2a2826", "#e4ded7"],
    description: "Estudio de luces rasantes con claroscuro analógico en el taller visual, capturado en luz continua de tungsteno con óptica de apertura extrema.",
    featured: true
  },
  {
    id: "port-2",
    title: "Silueta Escultórica — Retrato de Estudio",
    category: "retrato",
    aspectRatio: "3:4",
    mediaType: "image",
    url: "/src/assets/images/portrait_editorial_highfashion_1790312877113.jpg",
    originalUrl: "/src/assets/images/portrait_editorial_highfashion_1790312877113.jpg",
    client: "Galería Central & Vogue",
    year: "2026",
    exif: {
      camera: "Hasselblad H6D-100c",
      lens: "HC 2,2/100mm",
      focalLength: "100mm",
      aperture: "f/4.0",
      shutter: "1/500s",
      iso: "100",
      resolution: "11600 × 8700 px · 100 MP"
    },
    colors: ["#0f0f11", "#d4af87", "#44342a", "#f2ede6"],
    description: "Retrato de alta moda explorando la pureza de la línea y el drapeado en ciclorama con reflectores de bronce.",
    featured: true
  },
  {
    id: "port-g1",
    title: "Alta Cocina Contemporánea — Texturas & Brillos",
    category: "gastronomia",
    aspectRatio: "3:4",
    mediaType: "image",
    url: "/src/assets/images/gastronomy_culinary_fineart_1790315306551.jpg",
    originalUrl: "/src/assets/images/gastronomy_culinary_fineart_1790315306551.jpg",
    client: "Restaurante Dos Cielos & Guía Michelin",
    year: "2026",
    exif: {
      camera: "Hasselblad X2D 100C",
      lens: "XCD 120mm f/3.5 Macro",
      focalLength: "120mm",
      aperture: "f/5.6",
      shutter: "1/160s",
      iso: "64",
      resolution: "11656 × 8742 px · 100 MP"
    },
    colors: ["#15110e", "#d87431", "#593318", "#f0d5be"],
    description: "Fotografía culinaria fine art capturando el detalle microscópico de salsas, hierbas frescas y vajilla artesanal de gres.",
    featured: true
  },
  {
    id: "port-g2",
    title: "El Arte del Emplatado — Manos del Chef",
    category: "gastronomia",
    aspectRatio: "16:9",
    mediaType: "image",
    url: "/src/assets/images/gastronomy_chef_plating_1790315321404.jpg",
    originalUrl: "/src/assets/images/gastronomy_chef_plating_1790315321404.jpg",
    client: "Atelier Culinario Barcelona",
    year: "2026",
    exif: {
      camera: "Sony α1",
      lens: "FE 50mm f/1.2 GM",
      focalLength: "50mm",
      aperture: "f/2.0",
      shutter: "1/400s",
      iso: "200",
      resolution: "8640 × 4860 px"
    },
    colors: ["#141416", "#8a582b", "#3d2b1f", "#e6c49e"],
    description: "Detalle en vivo del servicio gastronómico, captando la precisión en el montaje con luz lateral cálida.",
    featured: true
  },
  {
    id: "port-3",
    title: "Black Sands of Vik — Atmósfera Nórdica",
    category: "arquitectura",
    aspectRatio: "16:9",
    mediaType: "image",
    url: "/src/assets/images/landscape_cinematic_iceland_1790312897301.jpg",
    originalUrl: "/src/assets/images/landscape_cinematic_iceland_1790312897301.jpg",
    client: "National Geographic Traveler",
    year: "2025",
    exif: {
      camera: "Fujifilm GFX 100 II",
      lens: "GF 32-64mm f/4 R LM WR",
      focalLength: "45mm",
      aperture: "f/8.0",
      shutter: "1.2s",
      iso: "80",
      resolution: "11648 × 8736 px · 102 MP"
    },
    colors: ["#14171a", "#3c4349", "#8998a6", "#c3cdd4"],
    description: "Paisaje volcánico a baja velocidad durante el crepúsculo ártico, revelando el oleaje atlántico en suspensión y gradaciones monocromáticas.",
    featured: true
  },
  {
    id: "port-4",
    title: "Movimiento en Columnata — Reel Vertical 9:16",
    category: "bodas",
    aspectRatio: "9:16",
    mediaType: "video",
    url: "/src/assets/images/fashion_reel_vertical_1790312908204.jpg",
    originalUrl: "/src/assets/images/fashion_reel_vertical_1790312908204.jpg",
    videoSrc: "https://assets.mixkit.co/videos/preview/mixkit-woman-walking-on-a-wooden-pier-41584-large.mp4",
    client: "Boda & Evento Privado",
    year: "2026",
    exif: {
      camera: "Sony FX6",
      lens: "Sony FE 35mm f/1.4 GM",
      focalLength: "35mm",
      aperture: "f/1.8",
      shutter: "1/100s",
      iso: "800",
      resolution: "2160 × 3840 (Vertical 4K)"
    },
    colors: ["#18120d", "#d19a4d", "#7c552a", "#f5dcb0"],
    description: "Video vertical en 9:16 para redes sociales, con movimiento fluido en la hora dorada y gradación de color personalizada.",
    featured: true
  },
  {
    id: "port-5",
    title: "Brutalismo & Geometría Pura — Pabellón I",
    category: "arquitectura",
    aspectRatio: "1:1",
    mediaType: "image",
    url: "/src/assets/images/architecture_minimalist_fineart_1790312918165.jpg",
    originalUrl: "/src/assets/images/architecture_minimalist_fineart_1790312918165.jpg",
    client: "Architectural Digest Fine Art",
    year: "2026",
    exif: {
      camera: "Sony α1",
      lens: "FE 24mm f/1.4 GM",
      focalLength: "24mm",
      aperture: "f/11",
      shutter: "1/125s",
      iso: "100",
      resolution: "8640 × 8640 px · 74 MP"
    },
    colors: ["#1e1f21", "#5d6268", "#9fa5ab", "#e6eaee"],
    description: "Intersección geométrica entre hormigón armado y luz cenital difusa en el centro cultural de Lisboa.",
    featured: false
  },
  {
    id: "port-6",
    title: "Retrato Clásico en Luz Natural",
    category: "retrato",
    aspectRatio: "3:4",
    mediaType: "image",
    url: "/src/assets/images/portrait_editorial_highfashion_1790312877113.jpg",
    originalUrl: "/src/assets/images/portrait_editorial_highfashion_1790312877113.jpg",
    client: "Galería Senda",
    year: "2025",
    exif: {
      camera: "Leica M11",
      lens: "Summilux-M 35mm f/1.4",
      focalLength: "35mm",
      aperture: "f/1.4",
      shutter: "1/1000s",
      iso: "64",
      resolution: "9528 × 6328 px · 60 MP"
    },
    colors: ["#1a1918", "#9e7f5b", "#d9c4aa", "#ffffff"],
    description: "Retrato íntimo con luz indirecta de ventana septentrional. Textura de piel auténtica sin retoque destructivo.",
    featured: false
  },
  {
    id: "port-7",
    title: "Boda de Destino — Cap Rocat Mallorca",
    category: "bodas",
    aspectRatio: "16:9",
    mediaType: "video",
    url: "/src/assets/images/hero_photographer_cinematic_1790312865168.jpg",
    originalUrl: "/src/assets/images/hero_photographer_cinematic_1790312865168.jpg",
    videoSrc: "https://assets.mixkit.co/videos/preview/mixkit-set-of-plateaus-seen-from-the-sky-in-a-sunset-26070-large.mp4",
    client: "Elena & Christian",
    year: "2026",
    exif: {
      camera: "Sony FX6",
      lens: "Sony FE 50mm f/1.2 GM",
      focalLength: "50mm",
      aperture: "f/1.8",
      shutter: "1/50s",
      iso: "12800",
      resolution: "3840 × 2160 (4K 10-bit 4:2:2)"
    },
    colors: ["#1c1a17", "#6b4f2c", "#c29b63", "#fae8c8"],
    description: "Cobertura audiovisual en los acantilados de Mallorca, capturando la hora dorada mediterránea y momentos espontáneos.",
    featured: true
  }
];

export const INITIAL_CLIENT_GALLERIES: ClientGallery[] = [
  {
    id: "client-gal-1",
    token: "valeria-haute-2026",
    pin: "2026",
    clientName: "Valeria Ramos",
    clientEmail: "valeria.ramos@maisonv.com",
    title: "Campaña Colección Atelier Otoño/Invierno",
    subtitle: "Sesión Editorial en Estudio & Exterior Madrid",
    coverImage: "/src/assets/images/portrait_editorial_highfashion_1790312877113.jpg",
    eventDate: "2026-09-14",
    deliveryDate: "2026-09-20",
    expiryDate: "2026-12-31",
    status: "en_seleccion",
    totalDownloads: 48,
    selectedFileIds: ["file-1", "file-3"],
    allowFullDownload: true,
    selectionLimit: 25,
    clientNotes: "Nos encantan las tomas en claroscuro. Por favor enviar la selección con retoque de alta resolución para impresión en catálogo antes del viernes.",
    files: [
      {
        id: "file-1",
        title: "Atelier_Valeria_001_RAW",
        type: "image",
        previewUrl: "/src/assets/images/portrait_editorial_highfashion_1790312877113.jpg",
        originalUrl: "/src/assets/images/portrait_editorial_highfashion_1790312877113.jpg",
        aspectRatio: "3:4",
        fileSize: "54.8 MB RAW (.DNG)",
        dimensions: "11600 × 8700 px (100MP)",
        downloadsCount: 14
      },
      {
        id: "file-2",
        title: "Atelier_Valeria_002_Master",
        type: "image",
        previewUrl: "/src/assets/images/hero_photographer_cinematic_1790312865168.jpg",
        originalUrl: "/src/assets/images/hero_photographer_cinematic_1790312865168.jpg",
        aspectRatio: "16:9",
        fileSize: "48.2 MB RAW (.DNG)",
        dimensions: "8368 × 4707 px",
        downloadsCount: 22
      },
      {
        id: "file-3",
        title: "Atelier_Valeria_003_MotionReel",
        type: "video",
        previewUrl: "/src/assets/images/fashion_reel_vertical_1790312908204.jpg",
        originalUrl: "/src/assets/images/fashion_reel_vertical_1790312908204.jpg",
        videoSrc: "https://assets.mixkit.co/videos/preview/mixkit-woman-walking-on-a-wooden-pier-41584-large.mp4",
        aspectRatio: "9:16",
        fileSize: "420.5 MB (4K ProRes 422 HQ)",
        dimensions: "2160 × 3840 px (Vertical 4K)",
        downloadsCount: 9
      },
      {
        id: "file-4",
        title: "Atelier_Valeria_004_FineArt",
        type: "image",
        previewUrl: "/src/assets/images/architecture_minimalist_fineart_1790312918165.jpg",
        originalUrl: "/src/assets/images/architecture_minimalist_fineart_1790312918165.jpg",
        aspectRatio: "1:1",
        fileSize: "61.3 MB RAW (.DNG)",
        dimensions: "8640 × 8640 px",
        downloadsCount: 3
      }
    ]
  },
  {
    id: "client-gal-2",
    token: "lucas-elena-boda",
    pin: "1234",
    clientName: "Lucas Méndez & Elena Serrano",
    clientEmail: "lucas.mendez@outlook.com",
    title: "Boda de Destino en Cap Rocat",
    subtitle: "Ceremonia, Coctel & Fiesta al Atardecer",
    coverImage: "/src/assets/images/landscape_cinematic_iceland_1790312897301.jpg",
    eventDate: "2026-08-28",
    deliveryDate: "2026-09-10",
    expiryDate: "2027-01-30",
    status: "seleccion_enviada",
    totalDownloads: 112,
    selectedFileIds: ["boda-1", "boda-2", "boda-3"],
    allowFullDownload: true,
    selectionLimit: 50,
    clientNotes: "¡Quedamos fascinados con el video teaser! Hemos seleccionado nuestras favoritas para el álbum impreso.",
    files: [
      {
        id: "boda-1",
        title: "Boda_LucasElena_Ceremonia_042",
        type: "image",
        previewUrl: "/src/assets/images/landscape_cinematic_iceland_1790312897301.jpg",
        originalUrl: "/src/assets/images/landscape_cinematic_iceland_1790312897301.jpg",
        aspectRatio: "16:9",
        fileSize: "51.1 MB RAW (.DNG)",
        dimensions: "11648 × 8736 px",
        downloadsCount: 45
      },
      {
        id: "boda-2",
        title: "Boda_LucasElena_Retrato_Pareja_078",
        type: "image",
        previewUrl: "/src/assets/images/portrait_editorial_highfashion_1790312877113.jpg",
        originalUrl: "/src/assets/images/portrait_editorial_highfashion_1790312877113.jpg",
        aspectRatio: "3:4",
        fileSize: "49.6 MB RAW (.DNG)",
        dimensions: "11600 × 8700 px",
        downloadsCount: 38
      },
      {
        id: "boda-3",
        title: "Boda_LucasElena_FilmTeaser_4K",
        type: "video",
        previewUrl: "/src/assets/images/hero_photographer_cinematic_1790312865168.jpg",
        originalUrl: "/src/assets/images/hero_photographer_cinematic_1790312865168.jpg",
        videoSrc: "https://assets.mixkit.co/videos/preview/mixkit-set-of-plateaus-seen-from-the-sky-in-a-sunset-26070-large.mp4",
        aspectRatio: "16:9",
        fileSize: "1.2 GB (4K Master 10-bit)",
        dimensions: "3840 × 2160 px",
        downloadsCount: 29
      }
    ]
  },
  {
    id: "client-gal-3",
    token: "nomad-arquitectura",
    pin: "9988",
    clientName: "Nomad Arquitectura & Urbanismo",
    clientEmail: "proyectos@nomad-arq.es",
    title: "Documentación Espacial — Centro Cultural Lisboa",
    subtitle: "Fotografía de Arquitectura & Líneas Puras",
    coverImage: "/src/assets/images/architecture_minimalist_fineart_1790312918165.jpg",
    eventDate: "2026-07-15",
    deliveryDate: "2026-07-28",
    expiryDate: "2027-07-28",
    status: "completado",
    totalDownloads: 86,
    selectedFileIds: ["nomad-1"],
    allowFullDownload: true,
    selectionLimit: 30,
    clientNotes: "Material aprobado por la directiva y publicado en la bienal de arquitectura.",
    files: [
      {
        id: "nomad-1",
        title: "Nomad_Arq_Hormigon_Pabellon_01",
        type: "image",
        previewUrl: "/src/assets/images/architecture_minimalist_fineart_1790312918165.jpg",
        originalUrl: "/src/assets/images/architecture_minimalist_fineart_1790312918165.jpg",
        aspectRatio: "1:1",
        fileSize: "63.2 MB RAW",
        dimensions: "8640 × 8640 px",
        downloadsCount: 52
      },
      {
        id: "nomad-2",
        title: "Nomad_Arq_Atardecer_Fachada_02",
        type: "image",
        previewUrl: "/src/assets/images/landscape_cinematic_iceland_1790312897301.jpg",
        originalUrl: "/src/assets/images/landscape_cinematic_iceland_1790312897301.jpg",
        aspectRatio: "16:9",
        fileSize: "55.8 MB RAW",
        dimensions: "11648 × 8736 px",
        downloadsCount: 34
      }
    ]
  }
];

export const INITIAL_ACTIVITY_LOGS: ActivityNotification[] = [
  {
    id: "act-1",
    timestamp: "Hace 12 min",
    type: "selection",
    title: "Selección de fotos enviada",
    description: "Valeria Ramos marcó 2 archivos como favoritos y envió comentarios para retoque.",
    clientName: "Valeria Ramos"
  },
  {
    id: "act-2",
    timestamp: "Hace 45 min",
    type: "download",
    title: "Descarga individual en alta resolución",
    description: "Lucas Méndez descargó Boda_LucasElena_FilmTeaser_4K (1.2 GB)",
    clientName: "Lucas Méndez"
  },
  {
    id: "act-3",
    timestamp: "Hace 2 horas",
    type: "view",
    title: "Enlace privado consultado",
    description: "Acceso validado con PIN a la galería 'Campaña Colección Atelier Otoño/Invierno'.",
    clientName: "Valeria Ramos"
  },
  {
    id: "act-4",
    timestamp: "Hace 4 horas",
    type: "batch_download",
    title: "Descarga completa de archivos originales",
    description: "Nomad Arquitectura descargó todos los archivos originales directamente (118 MB).",
    clientName: "Nomad Arquitectura"
  },
  {
    id: "act-5",
    timestamp: "Ayer",
    type: "contact",
    title: "Nueva solicitud de presupuesto",
    description: "Interés en cobertura editorial para semana de la moda en Milán.",
    clientName: "Studio Garibaldi"
  }
];

export const INITIAL_BOT_KNOWLEDGE: BotKnowledge[] = [
  {
    id: "kb-1",
    title: "Tarifario y Estructura de Bodas 2026/2027",
    category: "precios",
    content: "Paquetes oficiales de Bodas en CADSTUDIO:\n- Cobertura Íntima / Elopement: 2.200€ (hasta 4h de cobertura continua, 150 fotos master retocadas).\n- Boda Completa Estándar: 2.900€ a 3.800€ (hasta 8h, preparativos a 1h de barra libre, 400+ fotos master).\n- Boda Destino / Weekend: 4.500€ a 6.500€ (2 fotógrafos, dron certificado, cobertura de pre-boda y fiesta, caja de lino con impresiones fine art).\nForma de pago: 40% al reservar la fecha en contrato, 60% la semana del enlace.",
    sourceType: "manual",
    isActive: true,
    createdAt: "2026-09-01T10:00:00Z",
    updatedAt: "2026-09-20T14:30:00Z"
  },
  {
    id: "kb-2",
    title: "Políticas de Entrega y Formato de Archivos Master",
    category: "politicas",
    content: "Política de entrega al cliente:\n- Plazos habituales de entrega: 10 a 20 días hábiles.\n- Los archivos se entregan a través de la Suite Privada CADSTUDIO protegida con token y PIN de acceso.\n- No comprimimos en archivos ZIP: las descargas se realizan directamente con los archivos originales en máxima calidad sin pérdida.\n- Se permite descargar fotos individuales o la carpeta completa en 1 solo clic.\n- Modo Selección: El cliente puede marcar sus favoritas y redactar notas de retoque antes de la entrega final.",
    sourceType: "manual",
    isActive: true,
    createdAt: "2026-09-05T11:00:00Z",
    updatedAt: "2026-09-22T09:15:00Z"
  },
  {
    id: "kb-3",
    title: "Equipamiento Técnico y Ópticas de Autor",
    category: "equipamiento",
    content: "Equipo fotográfico y técnico de CADSTUDIO:\n- Cuerpo principal: Formato medio digital Hasselblad X2D 100C y cámaras Sony Alpha de 61 MP para alta velocidad.\n- Ópticas fijas de máxima luminosidad: 35mm f/1.4 GM, 50mm f/1.2 GM, 85mm f/1.4 y 135mm f/1.8.\n- Para Arquitectura: Objetivos descentrables Canon TS-E 17mm y 24mm con adaptador para control de perspectiva sin distorsión.\n- Iluminación: Flashes Profoto B10X Plus y modeladores de luz suave para interiores y gastronomía.\n- Audio y Vídeo: Grabación 4K 10-bit S-Log3 con estabilización gimbal Ronin.",
    sourceType: "manual",
    isActive: true,
    createdAt: "2026-09-10T15:00:00Z",
    updatedAt: "2026-09-21T18:00:00Z"
  },
  {
    id: "kb-4",
    title: "Tarifas de Gastronomía, Restaurantes & Bodegas",
    category: "servicios",
    content: "Sesiones de Gastronomía de Autor:\n- Media jornada (hasta 4h): 1.400€ (fotografía de 8-12 platos estrella, retratos del chef y equipo en cocina).\n- Jornada completa (hasta 8h): 2.400€ a 3.200€ (menú degustación completo, bodega, arquitectura de sala, estilismo culinario e iluminación de ambiente).\n- Entrega con derechos de uso comercial y editorial para prensa y redes sociales.",
    sourceType: "manual",
    isActive: true,
    createdAt: "2026-09-12T16:00:00Z",
    updatedAt: "2026-09-23T11:45:00Z"
  }
];

export const INITIAL_CLIENT_CONVERSATIONS: ClientConversation[] = [
  {
    id: "conv-1",
    sessionId: "sess-valeria-981",
    clientName: "Valeria Ramos",
    clientEmail: "valeria@atelier-ramos.com",
    startedAt: "2026-09-24T18:30:00Z",
    lastUpdatedAt: "2026-09-24T18:42:00Z",
    leadStatus: "presupuesto_solicitado",
    summary: "Consulta sobre cobertura de pasarela y lookbook Otoño/Invierno. Pide presupuesto para sesión de 2 días.",
    topics: ["Retrato de Autor", "Moda Editorial", "Lookbook"],
    messages: [
      {
        id: "m-1",
        role: "user",
        content: "Hola, estoy preparando la nueva colección de alta costura para noviembre y necesito fotos editoriales y lookbook. ¿Qué precio tendría una sesión de dos jornadas en estudio y exteriores?",
        timestamp: "18:30"
      },
      {
        id: "m-2",
        role: "assistant",
        content: "¡Hola Valeria! Qué proyecto tan inspirador. Para campañas de moda y lookbook de autor con formato medio Hasselblad, una sesión de dos jornadas completas (estudio con iluminación Profoto + exteriores) se sitúa habitualmente en torno a 2.800€ - 3.400€, incluyendo dirección visual y entrega de archivos master en máxima resolución sin compresión en tu galería privada. ¿Tienes ya definido el estilismo y modelos?",
        timestamp: "18:31"
      },
      {
        id: "m-3",
        role: "user",
        content: "Sí, tenemos 3 modelos y 12 piezas de vestuario. ¿Incluye retoque de piel de alta gama?",
        timestamp: "18:35"
      },
      {
        id: "m-4",
        role: "assistant",
        content: "Por supuesto. Cada pieza seleccionada pasa por retoque digital por separación de frecuencias y color grading cinematográfico preservando la textura natural de la piel y de los tejidos. Además, te habilitamos el Modo Selección para que marques tus fotos predilectas antes del retoque final.",
        timestamp: "18:37"
      },
      {
        id: "m-5",
        role: "user",
        content: "Perfecto, me pondré en contacto con Mateo para apartar fechas en noviembre. Muchas gracias.",
        timestamp: "18:42"
      }
    ]
  },
  {
    id: "conv-2",
    sessionId: "sess-lucas-boda-442",
    clientName: "Lucas Méndez & Elena",
    clientEmail: "lucas.mendez@gmail.com",
    startedAt: "2026-09-23T14:10:00Z",
    lastUpdatedAt: "2026-09-23T14:25:00Z",
    leadStatus: "cita_propuesta",
    summary: "Interés en boda de destino en la Costa Brava para junio de 2027. Solicitan información sobre dron y segundo fotógrafo.",
    topics: ["Bodas", "Boda Destino", "Dron 4K"],
    messages: [
      {
        id: "m-201",
        role: "user",
        content: "Buenas tardes, nos casamos en junio en una masía en Girona (Costa Brava). Queremos saber el presupuesto para cobertura completa con dron y vídeo teaser.",
        timestamp: "14:10"
      },
      {
        id: "m-202",
        role: "assistant",
        content: "¡Enhorabuena Lucas y Elena! La Costa Brava ofrece una luz mediterránea bellísima para bodas. Para coberturas en masías con fin de semana, nuestro paquete Boda Destino Completa (4.500€ - 5.200€) incluye 2 fotógrafos durante todo el evento, tomas aéreas de dron con piloto certificado, teaser cinematográfico 4K y entrega de todos los archivos originales sin pérdida en vuestra suite privada con PIN. ¿Cuántos invitados esperáis?",
        timestamp: "14:12"
      },
      {
        id: "m-203",
        role: "user",
        content: "Seremos unas 140 personas. ¿Podríamos agendar una videollamada con Mateo esta semana para conocernos?",
        timestamp: "14:20"
      },
      {
        id: "m-204",
        role: "assistant",
        content: "¡Claro que sí! Con 140 invitados, dos fotógrafos garantizarán capturar tanto vuestras emociones como las reacciones espontáneas de vuestros seres queridos. Podéis escribirnos al WhatsApp +34 612 345 678 o dejarnos vuestro teléfono para coordinar la llamada en el horario que os sea más cómodo.",
        timestamp: "14:22"
      }
    ]
  },
  {
    id: "conv-3",
    sessionId: "sess-nomad-arq-109",
    clientName: "Nomad Arquitectura",
    clientEmail: "proyectos@nomadarq.com",
    startedAt: "2026-09-21T09:15:00Z",
    lastUpdatedAt: "2026-09-21T09:28:00Z",
    leadStatus: "resuelto",
    summary: "Fotografía de interiorismo y fachada de vivienda unifamiliar en Menorca.",
    topics: ["Arquitectura", "Tilt-Shift", "Interiorismo"],
    messages: [
      {
        id: "m-301",
        role: "user",
        content: "Hola, queremos documentar una vivienda de piedra y hormigón en Menorca. Necesitamos tomas diurnas y durante la hora azul.",
        timestamp: "09:15"
      },
      {
        id: "m-302",
        role: "assistant",
        content: "Hola Nomad Arquitectura. El trabajo de volúmenes con luz rasante y la hora azul es una de nuestras especialidades. Para proyectos residenciales singulares, la cobertura con ópticas descentrables tilt-shift para garantizar líneas ortogonales puras tiene un coste base de 1.800€, entregando archivos RAW/TIFF master de más de 60 megapíxeles listos para publicación en revistas de arquitectura como AD o Dezeen.",
        timestamp: "09:17"
      },
      {
        id: "m-303",
        role: "user",
        content: "Excelente. Justo buscábamos evitar la convergencia de líneas. Coordinamos las fechas para la semana próxima por correo.",
        timestamp: "09:25"
      }
    ]
  }
];

export const INITIAL_STUDIO_ANNOUNCEMENT: StudioAnnouncement = {
  id: "announcement-main",
  isActive: true,
  badge: "OFERTA EXCLUSIVA · CULIACÁN",
  title: "Temporada de Bodas & Sesiones 2026/2027: 15% de Descuento",
  message: "Reserva tu cobertura en Culiacán o todo Sinaloa este mes y recibe una sesión previa de autor de cortesía con entrega privada de fotos originales.",
  ctaText: "Aprovechar Oferta",
  ctaAction: "contact",
  theme: "rose",
  updatedAt: new Date().toISOString(),
  validUntil: "30 de Noviembre, 2026",
  discountCode: "CULIACAN2026",
  details: "Válido para bodas, coberturas gastronómicas y retratos de autor agendados directamente durante este mes.",
  imageUrl: "/src/assets/images/hero_photographer_cinematic_1790312865168.jpg",
};

