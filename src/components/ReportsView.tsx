import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Calendar, 
  Download, 
  Filter 
} from 'lucide-react';
import { Evento, Espacio, Usuario } from '../types';
import { formatDateDDMMAAAA } from '../utils/dateFormatter';

interface ReportsViewProps {
  eventos: Evento[];
  espacios: Espacio[];
  currentUser: Usuario;
}

type Period = 'DIARIO' | 'SEMANAL' | 'MENSUAL';

export default function ReportsView({ eventos, espacios, currentUser }: ReportsViewProps) {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  const getSpaceName = (id: string) => {
    const sp = espacios.find(s => s.id === id);
    return sp ? sp.name : 'Espacio no asignado';
  };

  // Compute base approved events filtered by department
  const baseApprovedEvents = useMemo(() => {
    return eventos.filter(evt => {
      if (evt.status !== 'aprobado') return false;
      if (currentUser.department !== 'GENERAL' && evt.department !== currentUser.department) {
        return false;
      }
      return true;
    });
  }, [eventos, currentUser]);

  const getPeriodEvents = (period: Period) => {
    const dateObj = new Date(selectedDate + 'T00:00:00');
    
    return baseApprovedEvents.filter(evt => {
      if (period === 'DIARIO') {
        return evt.date === selectedDate;
      } 
      
      if (period === 'MENSUAL') {
        const monthPrefix = selectedDate.substring(0, 7);
        return evt.date.startsWith(monthPrefix);
      }
      
      if (period === 'SEMANAL') {
        const day = dateObj.getDay() || 7; // 1-7, 1=Monday
        const start = new Date(dateObj);
        start.setDate(dateObj.getDate() - (day - 1));
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        
        const evtDate = new Date(evt.date + 'T00:00:00');
        return evtDate >= start && evtDate <= end;
      }
      return false;
    });
  };

  const dailyEvents = getPeriodEvents('DIARIO');
  const weeklyEvents = getPeriodEvents('SEMANAL');
  const monthlyEvents = getPeriodEvents('MENSUAL');

  const generatePDF = (period: Period, filteredEvents: Evento[]) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Por favor permita las ventanas emergentes en su navegador para descargar el PDF.");
      return;
    }

    let periodText = '';
    const dateObj = new Date(selectedDate + 'T00:00:00');
    
    if (period === 'DIARIO') {
      periodText = `Día: ${formatDateDDMMAAAA(selectedDate)}`;
    } else if (period === 'SEMANAL') {
      const day = dateObj.getDay() || 7;
      const start = new Date(dateObj);
      start.setDate(dateObj.getDate() - (day - 1));
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      periodText = `Semana: ${formatDateDDMMAAAA(start.toISOString().split('T')[0])} al ${formatDateDDMMAAAA(end.toISOString().split('T')[0])}`;
    } else if (period === 'MENSUAL') {
      const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
      periodText = `Mes: ${monthNames[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
    }

    const rowsHtml = filteredEvents.length === 0
      ? `<tr><td colspan="9" style="text-align: center; color: #718096; padding: 25px; font-style: italic;">No hay eventos aprobados para este período.</td></tr>`
      : filteredEvents.map(evt => `
        <tr>
          <td style="padding: 8px; border: 1px solid #cbd5e0; font-weight: bold; color: #2d3748;">${evt.title}</td>
          <td style="padding: 8px; border: 1px solid #cbd5e0;">${formatDateDDMMAAAA(evt.date)}</td>
          <td style="padding: 8px; border: 1px solid #cbd5e0;">${evt.startTime}</td>
          <td style="padding: 8px; border: 1px solid #cbd5e0;">${evt.endTime}</td>
          <td style="padding: 8px; border: 1px solid #cbd5e0;">${getSpaceName(evt.spaceId)}</td>
          <td style="padding: 8px; border: 1px solid #cbd5e0;">${evt.responsible}</td>
          <td style="padding: 8px; border: 1px solid #cbd5e0;">${evt.department || 'GENERAL'}</td>
          <td style="padding: 8px; border: 1px solid #cbd5e0; text-transform: capitalize;">${evt.activityType}</td>
          <td style="padding: 8px; border: 1px solid #cbd5e0; text-align: center;">${evt.participantsCount}</td>
        </tr>
      `).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8" />
        <title>Reporte de Eventos - ${period}</title>
        <style>
          @page { size: landscape; margin: 15mm; }
          body {
            font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
            color: #2d3748;
            margin: 0;
            padding: 20px;
            background: #ffffff;
          }
          .header {
            border-bottom: 3px solid #37352f;
            padding-bottom: 12px;
            margin-bottom: 20px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
          }
          .title { font-size: 16px; font-weight: 800; text-transform: uppercase; color: #1a202c; }
          .subtitle { font-size: 12px; color: #4a5568; margin-top: 2px; }
          .badge {
            background-color: #edf2f7;
            border: 1px solid #cbd5e0;
            padding: 4px 10px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: bold;
            color: #2d3748;
          }
          .info-box {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 20px;
            display: flex;
            justify-content: space-between;
          }
          .info-item { font-size: 12px; }
          .info-item strong { color: #4a5568; text-transform: uppercase; font-size: 10px; display: block; }
          .info-item span { color: #1a202c; font-weight: 600; font-size: 13px; }
          table { width: 100%; border-collapse: collapse; font-size: 10px; }
          th {
            background-color: #edf2f7;
            color: #2d3748;
            font-weight: 700;
            text-transform: uppercase;
            text-align: left;
            padding: 10px 8px;
            border: 1px solid #cbd5e0;
          }
          tr:nth-child(even) td { background-color: #f8fafc; }
          .footer {
            margin-top: 30px;
            padding-top: 10px;
            border-top: 1px solid #e2e8f0;
            font-size: 10px;
            color: #718096;
            display: flex;
            justify-content: space-between;
          }
          @media print { .no-print { display: none !important; } }
        </style>
      </head>
      <body>
        <div class="no-print" style="margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; background-color: #f7fafc; padding: 12px; border-radius: 6px; border: 1px solid #e2e8f0;">
          <span style="font-size: 12px; color: #4a5568;">Vista previa de impresión</span>
          <button onclick="window.print()" style="padding: 8px 16px; background-color: #37352f; color: white; border: none; border-radius: 4px; font-weight: bold; cursor: pointer;">
            🖨️ Imprimir / Guardar PDF
          </button>
        </div>

        <div class="header">
          <div>
            <div class="title">UNIVERSIDAD DE CARABOBO</div>
            <div class="subtitle">Facultad Experimental de Ciencias y Tecnología (FaCyT)</div>
          </div>
          <div class="badge">REPORTE ${period} DE EVENTOS</div>
        </div>

        <div class="info-box">
          <div class="info-item">
            <strong>Filtro de Departamento</strong>
            <span>${currentUser.department === 'GENERAL' ? 'TODOS LOS DEPARTAMENTOS' : currentUser.department}</span>
          </div>
          <div class="info-item">
            <strong>Período Analizado</strong>
            <span>${periodText}</span>
          </div>
          <div class="info-item">
            <strong>Total de Eventos</strong>
            <span>${filteredEvents.length} eventos aprobados</span>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Título</th>
              <th>Fecha</th>
              <th>Inicio</th>
              <th>Fin</th>
              <th>Espacio</th>
              <th>Responsable</th>
              <th>Dept.</th>
              <th>Tipo</th>
              <th>Participantes</th>
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
  };

  return (
    <div className="flex-1 overflow-y-auto bg-white p-4 md:p-6 font-sans">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-2 mb-2">
            <h1 className="text-2xl font-bold tracking-tight text-[#37352F]">📄 Exportar Reportes</h1>
          </div>
          <p className="text-sm text-[#8A8984]">
            Genere reportes PDF de eventos aprobados por período
          </p>
        </div>

        {/* Filters */}
        <div className="bg-[#FBFBFA] border border-[#ececec] rounded-lg p-5 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-md">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#8A8984] uppercase tracking-wider mb-1">
                  Fecha de Referencia
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-1.5 border border-[#ececec] rounded-md text-sm text-[#37352F] font-medium focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 text-sm text-[#8A8984]">
              <Filter className="w-4 h-4" />
              <span>
                Mostrando eventos de: <strong>{currentUser.department === 'GENERAL' ? 'Todos los Departamentos' : currentUser.department}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Report Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Daily Report */}
          <div className="border border-[#ececec] rounded-xl p-5 hover:border-blue-200 hover:shadow-sm transition-all bg-white flex flex-col h-full">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-3">
                <FileText className="w-5 h-5 text-blue-500" />
                <h3 className="font-bold text-[#37352F]">Reporte Diario</h3>
              </div>
              <p className="text-xs text-[#8A8984] mb-4">
                Exporta los eventos aprobados correspondientes al día seleccionado.
              </p>
              <div className="bg-[#FAF9F6] border border-[#ececec] rounded p-3 mb-6">
                <div className="text-center">
                  <span className="block text-2xl font-bold text-[#37352F] font-mono">{dailyEvents.length}</span>
                  <span className="text-[10px] uppercase font-bold text-[#8A8984]">eventos encontrados</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => generatePDF('DIARIO', dailyEvents)}
              disabled={dailyEvents.length === 0}
              className="w-full flex items-center justify-center space-x-2 py-2 px-4 bg-[#37352F] hover:bg-[#2F2D27] disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white rounded-md text-sm font-semibold transition-colors mt-auto"
            >
              <Download className="w-4 h-4" />
              <span>Generar Diario</span>
            </button>
          </div>

          {/* Weekly Report */}
          <div className="border border-[#ececec] rounded-xl p-5 hover:border-green-200 hover:shadow-sm transition-all bg-white flex flex-col h-full">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-3">
                <FileText className="w-5 h-5 text-green-500" />
                <h3 className="font-bold text-[#37352F]">Reporte Semanal</h3>
              </div>
              <p className="text-xs text-[#8A8984] mb-4">
                Exporta los eventos de la semana (Lunes a Domingo) de la fecha indicada.
              </p>
              <div className="bg-[#FAF9F6] border border-[#ececec] rounded p-3 mb-6">
                <div className="text-center">
                  <span className="block text-2xl font-bold text-[#37352F] font-mono">{weeklyEvents.length}</span>
                  <span className="text-[10px] uppercase font-bold text-[#8A8984]">eventos encontrados</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => generatePDF('SEMANAL', weeklyEvents)}
              disabled={weeklyEvents.length === 0}
              className="w-full flex items-center justify-center space-x-2 py-2 px-4 bg-[#37352F] hover:bg-[#2F2D27] disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white rounded-md text-sm font-semibold transition-colors mt-auto"
            >
              <Download className="w-4 h-4" />
              <span>Generar Semanal</span>
            </button>
          </div>

          {/* Monthly Report */}
          <div className="border border-[#ececec] rounded-xl p-5 hover:border-purple-200 hover:shadow-sm transition-all bg-white flex flex-col h-full">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-3">
                <FileText className="w-5 h-5 text-purple-500" />
                <h3 className="font-bold text-[#37352F]">Reporte Mensual</h3>
              </div>
              <p className="text-xs text-[#8A8984] mb-4">
                Exporta todos los eventos programados para el mes de la fecha indicada.
              </p>
              <div className="bg-[#FAF9F6] border border-[#ececec] rounded p-3 mb-6">
                <div className="text-center">
                  <span className="block text-2xl font-bold text-[#37352F] font-mono">{monthlyEvents.length}</span>
                  <span className="text-[10px] uppercase font-bold text-[#8A8984]">eventos encontrados</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => generatePDF('MENSUAL', monthlyEvents)}
              disabled={monthlyEvents.length === 0}
              className="w-full flex items-center justify-center space-x-2 py-2 px-4 bg-[#37352F] hover:bg-[#2F2D27] disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white rounded-md text-sm font-semibold transition-colors mt-auto"
            >
              <Download className="w-4 h-4" />
              <span>Generar Mensual</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
