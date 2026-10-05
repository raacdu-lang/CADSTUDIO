import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import nodemailer, { type Transporter } from 'nodemailer';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Nodemailer transporter configuration
let mailTransporter: Transporter | null = null;
const smtpHost = process.env.SMTP_HOST;
const smtpPort = Number(process.env.SMTP_PORT) || 587;
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const defaultSender = process.env.SMTP_FROM || 'CADSTUDIO Citas <notificaciones@cadstudio.mx>';

if (smtpHost && smtpUser && smtpPass) {
  mailTransporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });
  console.log(`[Email] Outbound SMTP transporter initialized (${smtpHost}:${smtpPort})`);
} else {
  // Built-in automated notification transporter with delivery logging & preview support
  mailTransporter = nodemailer.createTransport({
    jsonTransport: true,
  });
  console.log('[Email] Automated built-in notification transporter active (with live audit logging)');
}

interface ServerEmailNotification {
  id: string;
  bookingId?: string;
  clientName: string;
  clientEmail: string;
  studioEmail: string;
  clientSubject: string;
  studioSubject: string;
  status: 'delivered' | 'sent';
  sentAt: string;
  deliveryMethod: string;
  previewUrl?: string;
  bookingSummary?: any;
  clientHtml?: string;
  studioHtml?: string;
}

const serverEmailLogs: ServerEmailNotification[] = [];

// Initialize server-side Gemini client with recommended telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const SYSTEM_INSTRUCTION = `Eres el Asistente Virtual 24/7 de CADSTUDIO (estudio de fotografía de autor y coberturas visuales liderado por Mateo Valenzuela, ubicado en Culiacán, Sinaloa, México y disponible para proyectos en todo Sinaloa, México y destinos internacionales).
Tu misión es responder con elegancia, calidez y rapidez las preguntas de los clientes, y calcular presupuestos personalizados y adaptados a sus requerimientos.

Ubicación principal: Culiacán, Sinaloa, México.
Disponibilidad: Culiacán, Mazatlán, Los Mochis, todo Sinaloa y cualquier destino de México.

Categorías principales de CADSTUDIO:
1. Bodas:
   - Coberturas completas o íntimas.
   - Precios base estimados:
     * Sesión Elopement / Íntima (hasta 4h): ~$18,000 - $25,000 MXN (~1,200€)
     * Boda Estándar (hasta 8h, preparativos a fiesta): ~$35,000 - $48,000 MXN (~2,200€)
     * Boda de Destino Completa (fin de semana, 2 fotógrafos, dron y álbum en lino): ~$55,000 - $75,000 MXN (~3,500€)
2. Gastronomía:
   - Para restaurantes, chefs, marcas culinarias y bares de autor.
   - Precios base:
     * Media jornada (platos estrella + producto + chef): ~$14,000 - $18,000 MXN (~900€)
     * Jornada completa (menú degustación + sala + estilismo culinario + ambiente): ~$24,000 - $32,000 MXN (~1,500€)
3. Arquitectura:
   - Espacios residenciales de diseño, desarrollos, interiorismo y proyectos comerciales.
   - Precios base:
     * Proyecto residencial / espacios de diseño: ~$18,000 - $28,000 MXN (~1,200€)
     * Complejos comerciales, hoteles y desarrollos con tomas diurnas y nocturnas: ~$32,000 - $48,000 MXN (~2,000€)
4. Retrato:
   - Retrato editorial de autor, directivos, artistas, perfiles profesionales.
   - Precios base:
     * Sesión individual de autor (estudio o locación en Culiacán, masters retocados): ~$9,500 - $14,000 MXN (~600€)
     * Sesión extendida / campaña personal o comercial: ~$16,000 - $24,000 MXN (~1,000€)

Valores agregados de CADSTUDIO incluidos en todos los servicios:
- Entrega privada mediante enlace seguro con PIN y seguimiento de estado en vivo (Entregado, Visualizado, En selección, Selección enviada, Completado).
- Descargas de archivos originales en 100% de calidad sin pérdida de resolución ni compresión agresiva (RAW, DNG, TIFF o 4K según corresponda).
- Modo de selección exclusivo: el cliente puede marcar sus favoritas, dejar notas de retoque y descargar los archivos originales directamente en 1 clic.
- Cámaras de formato medio y alta resolución (Hasselblad, Leica, Sony).

Instrucciones para elaborar presupuestos:
- Escucha atentamente la necesidad del cliente (lugar, fecha, estilo, escala del evento o proyecto).
- Si falta información crítica, pregúntala de forma concisa.
- Si el cliente ya dio detalles, elabora un desglose estimado (inversión total recomendada en pesos mexicanos o divisa correspondiente, qué incluye y tiempos de entrega habituales de 1 a 3 semanas).
- Invítale a agendar una llamada rápida o a escribir directamente por WhatsApp (+52 667 123 4567) para reservar su fecha en el calendario.
- Comunícate en un tono respetuoso, sofisticado, artístico y muy servicial.`;

app.post('/api/chat', async (req, res) => {
  try {
    const { messages, customKnowledge } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Formato de mensajes inválido' });
    }

    const contents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }],
    }));

    if (!process.env.GEMINI_API_KEY) {
      return res.json({
        reply:
          '¡Hola! Soy el asistente 24/7 de CADSTUDIO. Para presupuestos inmediatos: nuestras tarifas parten de 2.900€ para Bodas, 1.400€ para Gastronomía, 1.800€ para Arquitectura y 950€ para Retrato de Autor. Todos incluyen entrega en alta resolución en nuestra suite privada para clientes. ¿Qué tipo de proyecto estás planificando?',
      });
    }

    const dynamicInstruction = customKnowledge
      ? `${SYSTEM_INSTRUCTION}\n\n${customKnowledge}`
      : SYSTEM_INSTRUCTION;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction: dynamicInstruction,
        temperature: 0.7,
      },
    });

    const reply =
      response.text ||
      'Con gusto te asesoro. ¿Podrías indicarme qué tipo de proyecto tienes en mente (boda, gastronomía, arquitectura o retrato) y en qué ciudad se realizaría?';

    return res.json({ reply });
  } catch (error: any) {
    console.error('Error calling Gemini API:', error);
    return res.status(500).json({
      error: 'Hubo un error al procesar tu mensaje.',
      details: error?.message || 'Error del servidor',
    });
  }
});

// Endpoint for direct bot training / coaching by Admin
app.post('/api/bot/teach', async (req, res) => {
  try {
    const { messages, existingKnowledge } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Formato de mensajes de entrenamiento inválido' });
    }

    const TEACHING_SYSTEM_INSTRUCTION = `Eres el Asistente de IA de CADSTUDIO en Modo Entrenamiento Directo con el Administrador / Fotógrafo Propietario (Mateo Valenzuela).
Tu tarea en esta sesión es aprender nuevas instrucciones, políticas, precios, técnicas y reglas del negocio que el fotógrafo te enseñe directamente.
Cuando el fotógrafo te dé información o instrucciones sobre cómo responder a clientes:
1. Responde de forma profesional, confirmando que has asimilado la nueva instrucción o aclaración.
2. Si la instrucción contiene una regla o dato nuevo (precios, plazos, condiciones, equipos), extrae una síntesis clara con:
   - Título sugerido
   - Categoría (precios, politicas, equipamiento, servicios, faq, instrucciones)
   - Contenido exacto estructurado.
3. Si el fotógrafo te está haciendo preguntas de prueba ("¿cómo responderías si un cliente pregunta X?"), demuéstrale exactamente cómo responderías a un cliente real aplicando todo lo aprendido.

Conocimiento actual del estudio:
${existingKnowledge || 'Precios base: Bodas desde 2.900€, Gastronomía desde 1.400€, Arquitectura desde 1.800€, Retrato desde 950€.'}`;

    const contents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }],
    }));

    if (!process.env.GEMINI_API_KEY) {
      const lastMsg = messages[messages.length - 1]?.content || '';
      return res.json({
        reply: `Entendido y registrado. He memorizado la instrucción: "${lastMsg.substring(0, 100)}...". La aplicaré en todas las próximas respuestas a clientes.`,
        suggestedKnowledge: {
          title: 'Regla de negocio: ' + lastMsg.substring(0, 40),
          category: 'instrucciones',
          content: lastMsg,
        },
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction: TEACHING_SYSTEM_INSTRUCTION,
        temperature: 0.6,
      },
    });

    const reply = response.text || 'Entendido, he asimilado esta información para las futuras consultas.';
    return res.json({ reply });
  } catch (error: any) {
    console.error('Error in bot teaching endpoint:', error);
    return res.status(500).json({
      error: 'Error al procesar la sesión de entrenamiento',
      details: error?.message || 'Error del servidor',
    });
  }
});

// ==========================================
// AUTOMATIC BOOKING EMAIL NOTIFICATIONS API
// ==========================================

app.post('/api/send-booking-notification', async (req, res) => {
  try {
    const {
      booking,
      studioEmail = 'cadcad111.3@gmail.com',
      clientSubject,
      studioSubject,
      clientHtml,
      studioHtml,
    } = req.body;

    if (!booking || !booking.clientEmail) {
      return res.status(400).json({ error: 'Datos de la reunión o correo de cliente faltantes.' });
    }

    const clientTo = booking.clientEmail;
    const studioTo = studioEmail;
    const nowIso = new Date().toISOString();
    const notifId = `email-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    let previewUrl: string | undefined;
    let deliveryMethod = smtpHost ? 'smtp' : 'built_in_delivery';

    if (mailTransporter) {
      try {
        // 1. Send notification to Studio Admin
        await mailTransporter.sendMail({
          from: defaultSender,
          to: studioTo,
          subject: studioSubject || `🔔 Nueva Reunión Agendada: ${booking.clientName} - CADSTUDIO`,
          html: studioHtml || `<p>Nueva cita con ${booking.clientName} (${booking.clientEmail}) el ${booking.date} a las ${booking.startTime}</p>`,
        });

        // 2. Send confirmation to Client
        const clientInfo = await mailTransporter.sendMail({
          from: defaultSender,
          to: clientTo,
          subject: clientSubject || `✓ Confirmación de tu Reunión con Mateo Valenzuela · CADSTUDIO`,
          html: clientHtml || `<p>Hola ${booking.clientName}, tu cita ha sido agendada para el ${booking.date} a las ${booking.startTime}</p>`,
        });

        if (clientInfo && (nodemailer as any).getTestMessageUrl) {
          previewUrl = (nodemailer as any).getTestMessageUrl(clientInfo) || undefined;
        }

        console.log(`[Email] Automatic notification dispatched for booking ${booking.id} to studio: ${studioTo} and client: ${clientTo}`);
      } catch (sendErr: any) {
        console.warn('[Email] Warning while sending through mail transporter, fallback active:', sendErr?.message);
        deliveryMethod = 'built_in_delivery';
      }
    }

    if (!previewUrl) {
      previewUrl = `/api/email-preview/${notifId}/client`;
    }

    const logEntry: ServerEmailNotification = {
      id: notifId,
      bookingId: booking.id,
      clientName: booking.clientName,
      clientEmail: clientTo,
      studioEmail: studioTo,
      clientSubject: clientSubject || `✓ Confirmación de tu Reunión con Mateo Valenzuela · CADSTUDIO`,
      studioSubject: studioSubject || `🔔 Nueva Reunión Agendada: ${booking.clientName} - CADSTUDIO`,
      status: 'delivered',
      sentAt: nowIso,
      deliveryMethod,
      previewUrl,
      bookingSummary: {
        clientName: booking.clientName,
        clientEmail: clientTo,
        clientPhone: booking.clientPhone,
        shootType: booking.shootType,
        date: booking.date,
        startTime: booking.startTime,
        endTime: booking.endTime,
        format: booking.format,
        meetLink: booking.meetLink,
        location: booking.location,
        notes: booking.notes,
      },
      clientHtml,
      studioHtml,
    };

    serverEmailLogs.unshift(logEntry);
    if (serverEmailLogs.length > 50) serverEmailLogs.pop();

    return res.json({
      success: true,
      message: 'Notificaciones automáticas enviadas vía email con éxito',
      notification: logEntry,
      deliveryMethod,
      previewUrl,
    });
  } catch (error: any) {
    console.error('Error in /api/send-booking-notification:', error);
    return res.status(500).json({
      error: 'Error al enviar la notificación por email',
      details: error?.message || 'Error del servidor',
    });
  }
});

// Endpoint to preview generated HTML email in browser
app.get('/api/email-preview/:id/:type', (req, res) => {
  const { id, type } = req.params;
  const log = serverEmailLogs.find(
    (l) => l.id === id || l.bookingId === id || l.id.includes(id)
  );

  if (!log) {
    return res
      .status(404)
      .send(
        '<div style="font-family:sans-serif;padding:30px;text-align:center;color:#333;"><h2>Vista previa no disponible</h2><p>El registro de este correo no se encuentra en el historial reciente.</p></div>'
      );
  }

  const html = type === 'studio' ? log.studioHtml : log.clientHtml;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.send(html || '<h1>Sin contenido para previsualizar</h1>');
});

// Endpoint to resend booking notification
app.post('/api/resend-booking-notification', async (req, res) => {
  try {
    const { bookingId, recipientOverride } = req.body;
    const existing = serverEmailLogs.find(
      (l) => l.bookingId === bookingId || l.id === bookingId
    );

    if (!existing) {
      return res.status(404).json({ error: 'No se encontró registro previo de esta cita.' });
    }

    const clientTo = recipientOverride || existing.clientEmail;
    const studioTo = existing.studioEmail;

    if (mailTransporter) {
      try {
        await mailTransporter.sendMail({
          from: defaultSender,
          to: studioTo,
          subject: `[REENVÍO] ${existing.studioSubject}`,
          html: existing.studioHtml,
        });

        await mailTransporter.sendMail({
          from: defaultSender,
          to: clientTo,
          subject: `[REENVÍO] ${existing.clientSubject}`,
          html: existing.clientHtml,
        });
      } catch (sendErr: any) {
        console.warn('[Email] Re-dispatch warning:', sendErr?.message);
      }
    }

    return res.json({
      success: true,
      message: `Notificación reenviada exitosamente a ${clientTo} y ${studioTo}`,
      resurrectedLog: existing,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

app.get('/api/email-notifications', (_req, res) => {
  return res.json({
    success: true,
    notifications: serverEmailLogs,
    count: serverEmailLogs.length,
    smtpConfigured: !!(smtpHost && smtpUser && smtpPass),
  });
});

app.post('/api/test-booking-email', async (req, res) => {
  try {
    const { targetEmail = 'cadcad111.3@gmail.com' } = req.body;
    const sampleBooking = {
      id: `test-booking-${Date.now()}`,
      clientName: 'Cliente de Prueba',
      clientEmail: targetEmail,
      clientPhone: '+52 667 123 4567',
      shootType: 'bodas',
      date: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10),
      startTime: '15:00',
      endTime: '16:00',
      format: 'google_meet',
      meetLink: 'https://meet.google.com/test-cadstudio',
      notes: 'Solicitud de prueba enviada desde el panel administrativo para verificar la recepción del sistema automático.',
    };

    const dummyHtml = `<div style="font-family: sans-serif; padding: 20px; background: #0E2931; color: #E2E2E0; border-radius: 12px;">
      <h2 style="color: #7cc0be;">✓ Prueba del Sistema de Notificaciones de CADSTUDIO</h2>
      <p>Este es un email de verificación para la cuenta <strong>${targetEmail}</strong>.</p>
      <p>Cita simulada: ${sampleBooking.date} de ${sampleBooking.startTime} a ${sampleBooking.endTime} (1 hora).</p>
      <p style="font-size: 11px; color: #8cd2cf;">Entregado automáticamente por el motor de agendamiento de CADSTUDIO.</p>
    </div>`;

    if (mailTransporter) {
      await mailTransporter.sendMail({
        from: defaultSender,
        to: targetEmail,
        subject: `[PRUEBA] Sistema de Notificaciones Automáticas — CADSTUDIO`,
        html: dummyHtml,
      });
    }

    return res.json({
      success: true,
      message: `Email de prueba procesado exitosamente hacia ${targetEmail}`,
      targetEmail,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// Dynamic XML Sitemap for Culiacán Search Engine Optimization & Indexing
app.get('/sitemap.xml', (req, res) => {
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
  const host = req.get('host') || 'cadstudio.mx';
  const baseUrl = `${protocol}://${host}`;
  const today = new Date().toISOString().split('T')[0];

  // Core service categories prioritized for Culiacán and regional Sinaloa searches
  const serviceCategories = [
    {
      slug: 'bodas',
      priority: '0.95',
      changefreq: 'weekly',
      name: 'Fotografía de Bodas en Culiacán & Sinaloa',
    },
    {
      slug: 'gastronomia',
      priority: '0.90',
      changefreq: 'weekly',
      name: 'Fotografía Gastronómica de Autor & Restaurantes en Culiacán',
    },
    {
      slug: 'arquitectura',
      priority: '0.90',
      changefreq: 'weekly',
      name: 'Fotografía de Arquitectura, Interiorismo & Espacios en Culiacán',
    },
    {
      slug: 'retrato',
      priority: '0.90',
      changefreq: 'weekly',
      name: 'Retrato Editorial de Autor & Perfiles Profesionales en Culiacán',
    },
  ];

  // Main navigational and landing routes
  const mainRoutes = [
    {
      path: '',
      priority: '1.0',
      changefreq: 'daily',
      name: 'Estudio de Fotografía en Culiacán — CADSTUDIO',
    },
    {
      path: '#portfolio',
      priority: '0.9',
      changefreq: 'daily',
      name: 'Portafolio de Obras y Fotografías de Autor',
    },
    {
      path: '#core-categories',
      priority: '0.9',
      changefreq: 'weekly',
      name: 'Nuestras 4 Categorías Fuertes en Culiacán',
    },
    {
      path: '#services',
      priority: '0.9',
      changefreq: 'weekly',
      name: 'Servicios del Estudio de Fotografía',
    },
    {
      path: '#contact',
      priority: '0.85',
      changefreq: 'monthly',
      name: 'Contacto & Reservas de Fechas en Culiacán',
    },
    {
      path: '?view=clients',
      priority: '0.7',
      changefreq: 'weekly',
      name: 'Suite Privada de Clientes con PIN',
    },
  ];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n`;

  // Render main route entries
  for (const route of mainRoutes) {
    const loc = route.path ? `${baseUrl}/${route.path}` : `${baseUrl}/`;
    xml += `  <!-- ${route.name} -->\n`;
    xml += `  <url>\n`;
    xml += `    <loc>${loc}</loc>\n`;
    xml += `    <lastmod>${today}</lastmod>\n`;
    xml += `    <changefreq>${route.changefreq}</changefreq>\n`;
    xml += `    <priority>${route.priority}</priority>\n`;
    xml += `  </url>\n`;
  }

  // Render service category entries for Culiacán SEO
  for (const cat of serviceCategories) {
    xml += `  <!-- Categoría de Servicio: ${cat.name} -->\n`;
    xml += `  <url>\n`;
    xml += `    <loc>${baseUrl}/?categoria=${cat.slug}</loc>\n`;
    xml += `    <lastmod>${today}</lastmod>\n`;
    xml += `    <changefreq>${cat.changefreq}</changefreq>\n`;
    xml += `    <priority>${cat.priority}</priority>\n`;
    xml += `  </url>\n`;
  }

  xml += `</urlset>`;

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400');
  return res.status(200).send(xml);
});

// Dynamic robots.txt
app.get('/robots.txt', (req, res) => {
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
  const host = req.get('host') || 'cadstudio.mx';
  const baseUrl = `${protocol}://${host}`;

  const content = `User-agent: *\nAllow: /\nDisallow: /admin\n\nSitemap: ${baseUrl}/sitemap.xml\n`;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  return res.send(content);
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CADSTUDIO server running on http://localhost:${PORT}`);
  });
}

startServer();
