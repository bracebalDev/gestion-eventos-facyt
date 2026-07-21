import { Evento, Espacio } from '../types';
import { formatDateDDMMAAAA } from './dateFormatter';

export function exportAttendancePDF(evento: Evento, espacios: Espacio[]) {
  const space = espacios.find(s => s.id === evento.spaceId);
  const spaceName = space ? space.name : 'Espacio FaCyT';

  // Combinar asistentes invitados por cédula y los inscritos en aforo en vivo
  const confirmedAttendees: { name: string; lastName: string; cedula: string; department: string; status: string }[] = [];

  if (evento.attendees) {
    evento.attendees.forEach(a => {
      confirmedAttendees.push({
        name: a.name || 'Estudiante',
        lastName: a.lastName || 'FaCyT',
        cedula: a.cedula || 'V-00000000',
        department: a.department || 'COMPUTACION',
        status: a.status === 'aprobado' ? 'Confirmado' : a.status === 'pendiente' ? 'Pendiente' : 'Rechazado'
      });
    });
  }

  if (evento.publicRegistrations) {
    evento.publicRegistrations.forEach(r => {
      if (!confirmedAttendees.some(c => c.cedula === r.cedula)) {
        confirmedAttendees.push({
          name: r.name || 'Estudiante',
          lastName: r.lastName || 'Inscrito',
          cedula: r.cedula || 'V-00000000',
          department: r.department || 'GENERAL',
          status: 'Inscrito en Vivo'
        });
      }
    });
  }

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert("Por favor permita las ventanas emergentes en su navegador para descargar el PDF de asistencia.");
    return;
  }

  const rowsHtml = confirmedAttendees.length === 0
    ? `<tr><td colspan="4" style="text-align: center; color: #718096; padding: 25px; italic">No hay asistentes registrados o confirmados para este evento.</td></tr>`
    : confirmedAttendees.map(a => `
      <tr>
        <td style="padding: 10px 12px; border: 1px solid #cbd5e0; font-weight: 500; color: #2d3748;">${a.name}</td>
        <td style="padding: 10px 12px; border: 1px solid #cbd5e0; color: #2d3748;">${a.lastName}</td>
        <td style="padding: 10px 12px; border: 1px solid #cbd5e0; font-family: monospace; font-weight: bold; color: #1a202c;">${a.cedula}</td>
        <td style="padding: 10px 12px; border: 1px solid #cbd5e0; color: #4a5568;">${a.department}</td>
      </tr>
    `).join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8" />
      <title>Reporte de Asistentes - ${evento.title}</title>
      <style>
        @page {
          size: letter;
          margin: 15mm;
        }
        body {
          font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
          color: #2d3748;
          margin: 0;
          padding: 24px;
          background: #ffffff;
        }
        .header-letterhead {
          border-bottom: 3px solid #37352f;
          padding-bottom: 12px;
          margin-bottom: 20px;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
        }
        .institution-title {
          font-size: 16px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #1a202c;
        }
        .institution-subtitle {
          font-size: 12px;
          color: #4a5568;
          margin-top: 2px;
        }
        .report-badge {
          background-color: #edf2f7;
          border: 1px solid #cbd5e0;
          padding: 4px 10px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: bold;
          color: #2d3748;
        }
        .event-details-card {
          background-color: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 24px;
        }
        .event-title {
          font-size: 18px;
          font-weight: 700;
          color: #1a202c;
          margin-bottom: 12px;
        }
        .meta-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px 24px;
          font-size: 12px;
        }
        .meta-item strong {
          color: #4a5568;
          text-transform: uppercase;
          font-size: 10px;
          letter-spacing: 0.5px;
          display: block;
        }
        .meta-item span {
          color: #1a202c;
          font-weight: 600;
        }
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        .section-title {
          font-size: 13px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #2d3748;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
        }
        th {
          background-color: #edf2f7;
          color: #2d3748;
          font-weight: 700;
          text-transform: uppercase;
          font-size: 10px;
          letter-spacing: 0.5px;
          text-align: left;
          padding: 10px 12px;
          border: 1px solid #cbd5e0;
        }
        tr:nth-child(even) td {
          background-color: #f8fafc;
        }
        .footer {
          margin-top: 40px;
          padding-top: 12px;
          border-top: 1px solid #e2e8f0;
          font-size: 10px;
          color: #718096;
          display: flex;
          justify-content: space-between;
        }
        @media print {
          .no-print { display: none !important; }
        }
      </style>
    </head>
    <body>
      <div class="no-print" style="margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; background-color: #f7fafc; padding: 12px 16px; border-radius: 6px; border: 1px solid #e2e8f0;">
        <span style="font-size: 12px; color: #4a5568; font-weight: 500;">Vista previa de impresión y exportación a PDF</span>
        <button onclick="window.print()" style="padding: 8px 18px; background-color: #37352f; color: white; border: none; border-radius: 4px; font-weight: 700; cursor: pointer; font-size: 12px;">
          📄 Imprimir / Exportar a PDF
        </button>
      </div>

      <div class="header-letterhead">
        <div>
          <div class="institution-title">UNIVERSIDAD DE CARABOBO</div>
          <div class="institution-subtitle">Facultad Experimental de Ciencias y Tecnología (FaCyT)</div>
        </div>
        <div class="report-badge">
          LISTADO OFICIAL DE ASISTENTES
        </div>
      </div>

      <div class="event-details-card">
        <div class="event-title">${evento.title}</div>
        <div class="meta-grid">
          <div class="meta-item">
            <strong>Nombre del Evento</strong>
            <span>${evento.title}</span>
          </div>
          <div class="meta-item">
            <strong>Fecha y Hora de Realización</strong>
            <span>${formatDateDDMMAAAA(evento.date)} (${evento.startTime} - ${evento.endTime})</span>
          </div>
          <div class="meta-item">
            <strong>Lugar / Espacio</strong>
            <span>${spaceName}</span>
          </div>
          <div class="meta-item">
            <strong>Departamento Organizador</strong>
            <span>${evento.department || 'GENERAL'}</span>
          </div>
          <div class="meta-item">
            <strong>Responsable Académico</strong>
            <span>${evento.responsible}</span>
          </div>
          <div class="meta-item">
            <strong>Total Asistentes Registrados</strong>
            <span>${confirmedAttendees.length} personas</span>
          </div>
        </div>
      </div>

      <div class="section-header">
        <div class="section-title">Registro de Asistentes</div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Apellido</th>
            <th>Cédula / Identificación</th>
            <th>Departamento</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>

      <div class="footer">
        <span>Sistema de Gestión de Eventos y Espacios Físicos — FaCyT UC</span>
        <span>Generado el: ${new Date().toLocaleString()}</span>
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
}
