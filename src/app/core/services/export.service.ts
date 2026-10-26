/**
 * @file export.service.ts
 * @description Servicio de exportación de datos a CSV y PDF profesional.
 * Utiliza jsPDF y jspdf-autotable para generar documentos con cabecera corporativa.
 */
import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Ticket } from '../models/ticket.model';
import { SummaryMetrics } from '../models/metric.model';

/** Metadatos del alumno para documentos PDF */
const STUDENT_METADATA = {
  name: 'Luis Lázaro Pimentel',
  module: 'Desarrollo de Interfaces - Código 0488',
  degree: '2º Grado Superior en Desarrollo de Aplicaciones Multiplataforma (DAM)',
  school: 'Instituto Nebrija de Formación Profesional',
  year: '2025-2026',
};

@Injectable({ providedIn: 'root' })
export class ExportService {
  /**
   * Exporta un array de tickets a archivo CSV y lo descarga automáticamente.
   * @param tickets - Lista de tickets a exportar
   * @param filename - Nombre del archivo (sin extensión)
   */
  exportTicketsToCsv(tickets: Ticket[], filename = 'tickets-export'): void {
    const headers = [
      'ID', 'Título', 'Estado', 'Prioridad', 'Categoría',
      'Creado Por', 'Fecha Creación', 'Última Actualización', 'Tags'
    ];

    const rows = tickets.map((t) => [
      t.id,
      `"${t.title.replace(/"/g, '""')}"`,
      this.translateStatus(t.status),
      this.translatePriority(t.priority),
      t.category,
      t.createdBy,
      this.formatDate(t.createdAt),
      this.formatDate(t.updatedAt),
      `"${t.tags.join(', ')}"`,
    ]);

    const csvContent = [
      `# EnterpriseHub PWA - Exportación de Tickets`,
      `# Generado: ${new Date().toLocaleString('es-ES')}`,
      `# Total registros: ${tickets.length}`,
      '',
      headers.join(';'),
      ...rows.map((r) => r.join(';')),
    ].join('\n');

    this.downloadFile(csvContent, `${filename}-${this.dateStamp()}.csv`, 'text/csv;charset=utf-8;');
  }

  /**
   * Exporta métricas del dashboard a PDF profesional con cabecera corporativa,
   * tabla formateada y numeración de páginas.
   * @param tickets - Tickets a incluir en el reporte
   * @param metrics - Métricas de resumen del sistema
   */
  exportDashboardToPdf(tickets: Ticket[], metrics: SummaryMetrics): void {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;

    // --- CABECERA CORPORATIVA ---
    doc.setFillColor(25, 42, 86); // Azul corporativo
    doc.rect(0, 0, pageWidth, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('EnterpriseHub PWA', margin, 16);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Sistema de Gestión Multiplataforma B2B', margin, 23);
    doc.text('Reporte de Infraestructura y Tickets Técnicos', margin, 29);

    doc.setFontSize(9);
    doc.text(`Generado: ${new Date().toLocaleString('es-ES')}`, pageWidth - margin, 16, { align: 'right' });
    doc.text(`Página 1`, pageWidth - margin, 23, { align: 'right' });

    // Línea decorativa
    doc.setDrawColor(99, 179, 237);
    doc.setLineWidth(1);
    doc.line(0, 40, pageWidth, 40);

    // --- METADATOS DEL ALUMNO ---
    doc.setTextColor(30, 30, 30);
    doc.setFillColor(245, 248, 255);
    doc.rect(margin, 46, pageWidth - 2 * margin, 32, 'F');
    doc.setDrawColor(200, 210, 240);
    doc.rect(margin, 46, pageWidth - 2 * margin, 32, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(25, 42, 86);
    doc.text('INFORMACIÓN DEL ALUMNO', margin + 4, 53);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(8.5);
    doc.text(`Alumno: ${STUDENT_METADATA.name}`, margin + 4, 60);
    doc.text(`Módulo: ${STUDENT_METADATA.module}`, margin + 4, 66);
    doc.text(`Grado: ${STUDENT_METADATA.degree}`, margin + 4, 72);
    doc.text(`Centro: ${STUDENT_METADATA.school} | Curso: ${STUDENT_METADATA.year}`, margin + 4, 78);

    // --- KPIs RESUMEN ---
    let yPos = 86;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(25, 42, 86);
    doc.text('Resumen Ejecutivo del Sistema', margin, yPos);
    yPos += 6;

    doc.setDrawColor(25, 42, 86);
    doc.setLineWidth(0.5);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 5;

    const kpis = [
      ['Servidores Totales', `${metrics.totalServers}`, 'Servidores Online', `${metrics.onlineServers}`],
      ['Uso CPU Promedio', `${metrics.avgCpuUsage.toFixed(1)}%`, 'Uso Memoria Promedio', `${metrics.avgMemoryUsage.toFixed(1)}%`],
      ['Total Tickets', `${metrics.totalTickets}`, 'Tickets Abiertos', `${metrics.openTickets}`],
      ['Alertas Críticas', `${metrics.criticalAlerts}`, 'Uptime Sistema', `${metrics.uptimePercent}%`],
    ];

    const kpiBoxW = (pageWidth - 2 * margin - 5) / 2;
    kpis.forEach((row, i) => {
      const xLeft = margin;
      const xRight = margin + kpiBoxW + 5;
      const yKpi = yPos + i * 14;

      [
        { x: xLeft, label: row[0], val: row[1] },
        { x: xRight, label: row[2], val: row[3] },
      ].forEach(({ x, label, val }) => {
        doc.setFillColor(240, 245, 255);
        doc.rect(x, yKpi, kpiBoxW, 11, 'F');
        doc.setDrawColor(200, 215, 240);
        doc.rect(x, yKpi, kpiBoxW, 11, 'S');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(80, 80, 100);
        doc.text(label, x + 3, yKpi + 5);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(25, 42, 86);
        doc.text(val, x + 3, yKpi + 10);
      });
    });

    yPos += kpis.length * 14 + 8;

    // --- TABLA DE TICKETS ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(25, 42, 86);
    doc.text('Listado de Tickets Técnicos', margin, yPos);
    yPos += 3;

    autoTable(doc, {
      startY: yPos,
      margin: { left: margin, right: margin },
      head: [['ID', 'Título', 'Estado', 'Prioridad', 'Categoría', 'Fecha']],
      body: tickets.map((t) => [
        t.id,
        t.title.substring(0, 35) + (t.title.length > 35 ? '…' : ''),
        this.translateStatus(t.status),
        this.translatePriority(t.priority),
        t.category,
        this.formatDate(t.createdAt),
      ]),
      styles: {
        font: 'helvetica',
        fontSize: 8,
        cellPadding: 3,
        textColor: [30, 30, 30],
      },
      headStyles: {
        fillColor: [25, 42, 86],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8.5,
      },
      alternateRowStyles: { fillColor: [245, 248, 255] },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 60 },
        2: { cellWidth: 22 },
        3: { cellWidth: 20 },
        4: { cellWidth: 22 },
        5: { cellWidth: 28 },
      },
      didDrawPage: (data) => {
        // Pie de página con numeración
        const pageCount = (doc.internal as any).getNumberOfPages?.() ?? 1;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(120, 120, 140);
        doc.text(
          `EnterpriseHub PWA | ${STUDENT_METADATA.module} | Página ${data.pageNumber} de ${pageCount}`,
          pageWidth / 2,
          pageHeight - 8,
          { align: 'center' }
        );
        doc.setDrawColor(200, 210, 240);
        doc.setLineWidth(0.3);
        doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
      },
    });

    doc.save(`enterprise-hub-report-${this.dateStamp()}.pdf`);
  }

  /** Descarga un archivo de texto en el navegador */
  private downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob(['\uFEFF' + content], { type: mimeType }); // BOM para Excel
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.setAttribute('aria-hidden', 'true');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /** Formatea una fecha a string legible */
  private formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('es-ES', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  }

  /** Traduce estado de ticket al español */
  private translateStatus(status: string): string {
    const map: Record<string, string> = {
      OPEN: 'Abierto', IN_PROGRESS: 'En progreso', RESOLVED: 'Resuelto', CLOSED: 'Cerrado'
    };
    return map[status] ?? status;
  }

  /** Traduce prioridad al español */
  private translatePriority(priority: string): string {
    const map: Record<string, string> = {
      LOW: 'Baja', MEDIUM: 'Media', HIGH: 'Alta', CRITICAL: 'Crítica'
    };
    return map[priority] ?? priority;
  }

  /** Genera timestamp para nombres de archivo */
  private dateStamp(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
