import React, { useState } from 'react';
import { 
  BarChart3, 
  Calendar, 
  Clock, 
  MapPin, 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  Search, 
  Building, 
  Printer, 
  Filter,
  Users
} from 'lucide-react';
import { Evento, Espacio, Usuario } from '../types';
import { exportAttendancePDF } from '../utils/pdfGenerator';
import { formatDateDDMMAAAA } from '../utils/dateFormatter';

interface AnalysisViewProps {
  eventos: Evento[];
  espacios: Espacio[];
  currentUser: Usuario;
  onSelectEvent: (evento: Evento) => void;
}

export default function AnalysisView({
  eventos,
  espacios,
  currentUser,
  onSelectEvent
}: AnalysisViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const getSpaceName = (id: string) => {
    const sp = espacios.find(s => s.id === id);
    return sp ? sp.name : 'Espacio no asignado';
  };

  // Filtrar eventos agendados hasta la fecha segun autorizacion
  // Decanato ve todos los eventos, Coordinadores de Depto ven su departamento + GENERAL
  const authorizedEvents = eventos.filter(evt => {
    if (currentUser.department === 'GENERAL') return true;
    return evt.department === currentUser.department || evt.department === 'GENERAL';
  });

  const filteredEvents = authorizedEvents.filter(evt => {
    const matchesSearch = 
      evt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evt.responsible.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evt.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDept = deptFilter === 'all' || evt.department === deptFilter;
    const matchesStatus = statusFilter === 'all' || evt.status === statusFilter;

    return matchesSearch && matchesDept && matchesStatus;
  });

  const totalEvents = authorizedEvents.length;
  const approvedCount = authorizedEvents.filter(e => e.status === 'aprobado' || e.status === 'programado' || e.status === 'realizado').length;
  const pendingCount = authorizedEvents.filter(e => e.status === 'solicitado' || e.status === 'en revisión').length;
  const rejectedCount = authorizedEvents.filter(e => e.status === 'rechazado' || e.status === 'cancelado').length;
  const totalCapacity = authorizedEvents.reduce((acc, curr) => acc + (curr.participantsCount || 0), 0);

  return (
    <div id="analysis-management-view" className="flex-1 overflow-y-auto bg-white p-4 md:p-6 font-sans">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold tracking-tight text-[#37352F]">📊 Resumen y Análisis de Gestión de Eventos</h1>
            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-mono text-[10px] font-bold uppercase">
              Modo Directivo
            </span>
          </div>
          <p className="text-xs text-[#8A8984] mt-0.5">
            Consolidado general y tabla resumen de todos los eventos agendados hasta la fecha para encargados de área y autoridades FaCyT.
          </p>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="p-4 border border-[#ececec] rounded-lg bg-[#FAF9F6]">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Total Agendados</span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-bold text-[#37352F] font-mono">{totalEvents}</span>
            <span className="text-[11px] text-gray-400">eventos</span>
          </div>
        </div>

        <div className="p-4 border border-green-200 rounded-lg bg-green-50/50">
          <span className="text-xs font-semibold text-green-700 uppercase tracking-wider block flex items-center space-x-1">
            <CheckCircle className="w-3.5 h-3.5 text-green-600" />
            <span>Aprobados / Activos</span>
          </span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-bold text-green-800 font-mono">{approvedCount}</span>
            <span className="text-[11px] text-green-600 font-medium">confirmados</span>
          </div>
        </div>

        <div className="p-4 border border-amber-200 rounded-lg bg-amber-50/50">
          <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider block flex items-center space-x-1">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            <span>En Revisión</span>
          </span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-bold text-amber-800 font-mono">{pendingCount}</span>
            <span className="text-[11px] text-amber-600 font-medium">pendientes</span>
          </div>
        </div>

        <div className="p-4 border border-purple-200 rounded-lg bg-purple-50/50">
          <span className="text-xs font-semibold text-purple-700 uppercase tracking-wider block flex items-center space-x-1">
            <Users className="w-3.5 h-3.5 text-purple-600" />
            <span>Aforo Total Estimado</span>
          </span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-bold text-purple-900 font-mono">{totalCapacity}</span>
            <span className="text-[11px] text-purple-700 font-medium">personas</span>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="max-w-6xl mx-auto border border-[#ececec] rounded-lg bg-[#FBFBFA] p-3.5 mb-6 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#8A8984]" />
          <input
            type="text"
            placeholder="Buscar por código de evento, título o responsable..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8.5 pr-4 py-1.5 border border-[#ececec] bg-white rounded text-xs text-[#37352F] focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Dept Filter */}
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="p-1.5 border border-[#ececec] bg-white rounded text-xs text-[#37352F] font-medium focus:outline-none"
          >
            <option value="all">Todos los Departamentos</option>
            <option value="GENERAL">Decanato</option>
            <option value="COMPUTACION">Computación</option>
            <option value="BIOLOGIA">Biología</option>
            <option value="QUIMICA">Química</option>
            <option value="FISICA">Física</option>
            <option value="MATEMATICA">Matemática</option>
            <option value="BIBLIOTECA">Biblioteca</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-1.5 border border-[#ececec] bg-white rounded text-xs text-[#37352F] font-medium focus:outline-none"
          >
            <option value="all">Todos los Estatus</option>
            <option value="solicitado">Solicitado</option>
            <option value="en revisión">En Revisión</option>
            <option value="aprobado">Aprobado</option>
            <option value="programado">Programado</option>
            <option value="realizado">Realizado</option>
            <option value="cancelado">Cancelado</option>
            <option value="rechazado">Rechazado</option>
          </select>
        </div>
      </div>

      {/* Summary Table of All Scheduled Events */}
      <div className="max-w-6xl mx-auto border border-[#ececec] rounded-xl bg-white shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-[#ececec] bg-[#FBFBFA] flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#37352F]">
            📋 Tabla Resumen de Eventos Agendados hasta la Fecha ({filteredEvents.length})
          </h2>
        </div>

        {filteredEvents.length === 0 ? (
          <div className="p-12 text-center text-gray-500 bg-[#FAF9F6]">
            <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-[#37352F]">No hay eventos agendados para este criterio</h3>
            <p className="text-xs text-gray-500 mt-1">Prueba ajustando los filtros de búsqueda o estatus.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#FBFBFA] border-b border-[#ececec] text-[#8A8984] font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Cód. Evento</th>
                  <th className="py-3 px-4">Título del Evento</th>
                  <th className="py-3 px-4">Departamento</th>
                  <th className="py-3 px-4">Espacio Asignado</th>
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4">Horario</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-center">Aforo</th>
                  <th className="py-3 px-4">Responsable</th>
                  <th className="py-3 px-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ececec]">
                {filteredEvents.map((evt) => {
                  const spaceName = getSpaceName(evt.spaceId);

                  return (
                    <tr key={evt.id} className="hover:bg-[#FAF9F6] transition-colors">
                      {/* Código */}
                      <td className="py-3 px-4 font-mono font-bold text-gray-500 text-[11px]">
                        {evt.id}
                      </td>

                      {/* Título */}
                      <td 
                        onClick={() => onSelectEvent(evt)}
                        className="py-3 px-4 font-bold text-[#37352F] hover:text-blue-600 cursor-pointer max-w-xs truncate"
                      >
                        {evt.title}
                      </td>

                      {/* Departamento */}
                      <td className="py-3 px-4 font-medium text-gray-700">
                        {evt.department || 'GENERAL'}
                      </td>

                      {/* Espacio Asignado */}
                      <td className="py-3 px-4 text-gray-800 font-medium">
                        <span className="flex items-center space-x-1">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          <span className="truncate max-w-[140px]">{spaceName}</span>
                        </span>
                      </td>

                      {/* Fecha */}
                      <td className="py-3 px-4 font-mono text-gray-700">
                        {formatDateDDMMAAAA(evt.date)}
                      </td>

                      {/* Horario */}
                      <td className="py-3 px-4 font-mono text-gray-600 text-[11px]">
                        {evt.startTime} - {evt.endTime}
                      </td>

                      {/* Estado */}
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          evt.status === 'aprobado' || evt.status === 'programado' || evt.status === 'realizado' ? 'bg-green-100 text-green-800 border border-green-200' :
                          evt.status === 'rechazado' || evt.status === 'cancelado' ? 'bg-red-100 text-red-800 border border-red-200' :
                          'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}>
                          {evt.status}
                        </span>
                      </td>

                      {/* Aforo */}
                      <td className="py-3 px-4 text-center font-mono font-bold text-gray-700">
                        {evt.participantsCount}
                      </td>

                      {/* Responsable */}
                      <td className="py-3 px-4 text-gray-700 truncate max-w-[120px]">
                        {evt.responsible}
                      </td>

                      {/* Acción PDF */}
                      <td className="py-3 px-4 text-right">
                        {(evt.status === 'aprobado' || evt.status === 'programado' || evt.status === 'realizado') && (
                          <button
                            onClick={() => exportAttendancePDF(evt, espacios)}
                            className="p-1 px-2 bg-white border border-[#ececec] hover:bg-gray-100 text-gray-700 rounded text-[10px] font-semibold flex items-center space-x-1 ml-auto shadow-2xs"
                            title="Exportar Reporte en PDF"
                          >
                            <Printer className="w-3 h-3 text-gray-500" />
                            <span>PDF</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
