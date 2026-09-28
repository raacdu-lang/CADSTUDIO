import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { ClientGallery, StudioConfig, ActivityNotification } from '../types';
import { StudioStats } from './storageService';

export const exportMonthlyReportPDF = (
  config: StudioConfig,
  stats: StudioStats,
  galleries: ClientGallery[],
  activities: ActivityNotification[]
): void => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  // Header Bar / Atelier Branding
  doc.setFillColor(8, 8, 9);
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(244, 244, 240);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(config.studioName.toUpperCase(), 15, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(180, 180, 185);
  doc.text(`${config.photographerName} · ${config.tagline}`, 15, 18);

  const reportDate = new Date().toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  doc.text(`INFORME MENSUAL DE AUDITORÍA Y ENTREGAS · ${reportDate.toUpperCase()}`, 15, 24);

  y = 38;

  // Section 1: Executive KPI Cards
  doc.setTextColor(20, 20, 22);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('1. MÉTRICAS CLAVE DEL ESTUDIO', 15, y);
  y += 6;

  // Draw 4 Metric Boxes
  const boxWidth = 42;
  const boxHeight = 20;
  const metrics = [
    { label: 'VISITAS TOTALES', value: stats.totalVisits.toLocaleString('es-ES') },
    { label: 'VISITAS CLIENTES', value: stats.clientViews.toLocaleString('es-ES') },
    { label: 'DESCARGAS MAESTRAS', value: stats.totalDownloads.toLocaleString('es-ES') },
    { label: 'GALERÍAS ACTIVAS', value: galleries.length.toString() },
  ];

  metrics.forEach((m, i) => {
    const x = 15 + i * (boxWidth + 3);
    doc.setFillColor(248, 248, 250);
    doc.setDrawColor(220, 220, 225);
    doc.roundedRect(x, y, boxWidth, boxHeight, 2, 2, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(110, 110, 120);
    doc.text(m.label, x + 4, y + 6);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 15, 18);
    doc.text(m.value, x + 4, y + 15);
  });

  y += 30;

  // Section 2: Client Delivery Status Table
  doc.setTextColor(20, 20, 22);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('2. AUDITORÍA DE ENTREGAS PRIVADAS & SEGUIMIENTO', 15, y);
  y += 6;

  // Table header
  doc.setFillColor(235, 235, 240);
  doc.rect(15, y, pageWidth - 30, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(40, 40, 45);
  doc.text('CLIENTE / PROYECTO', 18, y + 5.5);
  doc.text('FECHA', 75, y + 5.5);
  doc.text('ESTADO', 105, y + 5.5);
  doc.text('ARCHIVOS', 142, y + 5.5);
  doc.text('DESCARGAS', 170, y + 5.5);

  y += 9;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  const statusLabels: Record<string, string> = {
    entregado: 'Entregado',
    visto: 'Visto por Cliente',
    en_seleccion: 'En Selección',
    seleccion_enviada: 'Selección Enviada',
    completado: 'Completado',
  };

  galleries.forEach((gal, idx) => {
    if (idx % 2 === 1) {
      doc.setFillColor(250, 250, 252);
      doc.rect(15, y - 1, pageWidth - 30, 12, 'F');
    }

    doc.setTextColor(20, 20, 25);
    doc.setFont('helvetica', 'bold');
    doc.text(gal.clientName, 18, y + 3.5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(110, 110, 120);
    doc.setFontSize(7);
    doc.text(gal.title.substring(0, 32), 18, y + 8);

    doc.setFontSize(8);
    doc.setTextColor(60, 60, 70);
    doc.text(gal.deliveryDate || gal.eventDate, 75, y + 5);

    // Status pill
    const statusText = statusLabels[gal.status] || gal.status;
    doc.text(statusText, 105, y + 5);

    doc.text(`${gal.files.length} (${gal.selectedFileIds.length} favs)`, 142, y + 5);
    doc.text(`${gal.totalDownloads} descargas`, 170, y + 5);

    y += 12;
  });

  y += 8;

  // Section 3: Recent Activity Log Summary
  doc.setTextColor(20, 20, 22);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('3. REGISTRO RECIENTE DE ACTIVIDAD & DESCARGAS', 15, y);
  y += 6;

  activities.slice(0, 6).forEach((act) => {
    doc.setDrawColor(230, 230, 235);
    doc.line(15, y, pageWidth - 15, y);
    y += 4;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(30, 30, 35);
    doc.text(`[${act.timestamp}] ${act.title}`, 15, y);

    y += 4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 100, 110);
    doc.text(act.description.substring(0, 110), 15, y);

    y += 5;
  });

  // Footer
  doc.setFontSize(7);
  doc.setTextColor(140, 140, 150);
  doc.text(
    `Documento generado automáticamente por AURORA Visual Atelier Suite · ${config.email}`,
    15,
    285
  );
  doc.text('Página 1 de 1', pageWidth - 35, 285);

  doc.save(`Informe_Mensual_Aurora_Atelier_${new Date().toISOString().slice(0, 10)}.pdf`);
};

export const exportMonthlyReportExcel = (
  config: StudioConfig,
  stats: StudioStats,
  galleries: ClientGallery[],
  activities: ActivityNotification[]
): void => {
  const wb = XLSX.utils.book_new();

  // 1. Resumen General Sheet
  const summaryData = [
    ['AURORA VISUAL ATELIER — REPORTE MENSUAL DE OPERACIONES', ''],
    ['Estudio', config.studioName],
    ['Director Creativo', config.photographerName],
    ['Fecha de Generación', new Date().toLocaleString('es-ES')],
    ['', ''],
    ['MÉTRICA', 'VALOR'],
    ['Visitas Totales a la Web', stats.totalVisits],
    ['Aperturas de Galerías de Clientes', stats.clientViews],
    ['Total de Descargas de Archivos Originales', stats.totalDownloads],
    ['Total de Galerías de Clientes Activas', galleries.length],
    ['', ''],
    ['ENGAGEMENT POR CATEGORÍA', 'VISITAS ESTIMADAS'],
    ...stats.categoryEngagement.map((c) => [c.category, c.views]),
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  wsSummary['!cols'] = [{ wch: 35 }, { wch: 30 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumen');

  // 2. Client Deliveries Sheet
  const clientData = [
    [
      'ID Galería',
      'Cliente',
      'Email',
      'Proyecto',
      'Subtítulo',
      'Fecha Evento',
      'Fecha Entrega',
      'Vencimiento',
      'Estado',
      'Total Archivos',
      'Archivos Seleccionados',
      'Total Descargas',
      'Token Enlace Privado',
      'PIN Acceso',
      'Notas Cliente',
    ],
    ...galleries.map((g) => [
      g.id,
      g.clientName,
      g.clientEmail,
      g.title,
      g.subtitle,
      g.eventDate,
      g.deliveryDate,
      g.expiryDate,
      g.status,
      g.files.length,
      g.selectedFileIds.length,
      g.totalDownloads,
      g.token,
      g.pin || 'Sin PIN',
      g.clientNotes || '',
    ]),
  ];

  const wsClients = XLSX.utils.aoa_to_sheet(clientData);
  wsClients['!cols'] = [
    { wch: 15 },
    { wch: 22 },
    { wch: 25 },
    { wch: 32 },
    { wch: 30 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 18 },
    { wch: 14 },
    { wch: 20 },
    { wch: 15 },
    { wch: 24 },
    { wch: 10 },
    { wch: 45 },
  ];
  XLSX.utils.book_append_sheet(wb, wsClients, 'Entregas Clientes');

  // 3. Activity Log Sheet
  const activityData = [
    ['Fecha/Hora', 'Tipo de Evento', 'Cliente', 'Título', 'Descripción Detallada'],
    ...activities.map((a) => [
      a.timestamp,
      a.type,
      a.clientName || 'Público',
      a.title,
      a.description,
    ]),
  ];

  const wsActivity = XLSX.utils.aoa_to_sheet(activityData);
  wsActivity['!cols'] = [
    { wch: 18 },
    { wch: 18 },
    { wch: 22 },
    { wch: 35 },
    { wch: 60 },
  ];
  XLSX.utils.book_append_sheet(wb, wsActivity, 'Registro de Actividad');

  XLSX.writeFile(
    wb,
    `Auditoria_Aurora_Atelier_${new Date().toISOString().slice(0, 10)}.xlsx`
  );
};
