import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  UserPlus, 
  UserMinus, 
  Search, 
  Building,
  Sparkles,
  Printer
} from 'lucide-react';
import { Evento, Espacio, Usuario } from '../types';
import { formatDateDDMMAAAA } from '../utils/dateFormatter';

interface RecentEventsViewProps {
  eventos: Evento[];
  espacios: Espacio[];
  currentUser: Usuario;
  onRegisterPublic: (eventId: string) => Promise<void>;
  onUnregisterPublic: (eventId: string) => Promise<void>;
  onSelectEvent: (evento: Evento) => void;
  onExportPdf?: (evento: Evento) => void;
}

export default function RecentEventsView({
  eventos,
  espacios,
  currentUser,
  onRegisterPublic,
  onUnregisterPublic,
  onSelectEvent,
  onExportPdf
}: RecentEventsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [loadingEventId, setLoadingEventId] = useState<string | null>(null);

  // Filtrar eventos creados exclusivamente por Decanato, Departamentos o Biblioteca
  const institutionalEvents = eventos.filter(evt => {
    const isInst = evt.isInstitutional || evt.department === 'GENERAL' || evt.department === 'BIBLIOTECA';
    const matchesSearch = 
      evt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evt.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evt.responsible.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDept = deptFilter === 'all' || evt.department === deptFilter;

    return isInst && matchesSearch && matchesDept;
  });

  const getSpaceName = (id: string) => {
    const sp = espacios.find(s => s.id === id);
    return sp ? sp.name : 'Espacio no asignado';
  };

  const handleToggleRegistration = async (evt: Evento, isRegistered: boolean) => {
    try {
      setLoadingEventId(evt.id);
      if (isRegistered) {
        await onUnregisterPublic(evt.id);
      } else {
        await onRegisterPublic(evt.id);
      }
    } catch (err: any) {
      alert("Error procesando inscripción: " + err.message);
    } finally {
      setLoadingEventId(null);
    }
  };

  return (
    <div id="recent-events-view" className="flex-1 overflow-y-auto bg-white p-6 font-sans">
      {/* Header */}
      <div id="recent-header" className="max-w-6xl mx-auto mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold tracking-tight text-[#37352F]">🌟 Eventos Recientes e Institucionales</h1>
            <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded font-mono text-[10px] font-bold">
              Aforo en Vivo
            </span>
          </div>
          <p className="text-xs text-[#8A8984] mt-0.5">
            Cartelera oficial de actividades académicas creadas exclusivamente por Decanato, Departamentos y Biblioteca FaCyT.
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div id="recent-filters-bar" className="max-w-6xl mx-auto border border-[#ececec] rounded bg-[#FBFBFA] p-3.5 mb-6 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#8A8984]" />
          <input
            id="recent-search-input"
            type="text"
            placeholder="Buscar por título de evento institucional o ponente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8.5 pr-4 py-1.5 border border-[#ececec] bg-white rounded text-xs text-[#37352F] focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Building className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Departamento:</span>
          <select
            id="recent-dept-select"
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="p-1.5 border border-[#ececec] bg-white rounded text-xs text-[#37352F] focus:outline-none font-medium"
          >
            <option value="all">Todos los Departamentos</option>
            <option value="GENERAL">Decanato (General)</option>
            <option value="COMPUTACION">Computación</option>
            <option value="BIOLOGIA">Biología</option>
            <option value="QUIMICA">Química</option>
            <option value="FISICA">Física</option>
            <option value="MATEMATICA">Matemática</option>
            <option value="BIBLIOTECA">Biblioteca FaCyT</option>
          </select>
        </div>
      </div>

      {/* Grid of Institutional Events */}
      <div id="recent-events-grid" className="max-w-6xl mx-auto space-y-4">
        {institutionalEvents.length === 0 ? (
          <div className="border border-[#ececec] rounded p-12 text-center bg-[#FAF9F6]">
            <Sparkles className="w-10 h-10 text-purple-300 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-[#37352F]">No se encontraron eventos institucionales</h3>
            <p className="text-xs text-gray-500 mt-1">Prueba ajustando los términos de búsqueda o filtros por departamento.</p>
          </div>
        ) : (
          institutionalEvents.map((evt) => {
            const regs = evt.publicRegistrations || [];
            const registeredCount = regs.length;
            const maxCapacity = evt.participantsCount || 50;
            const userCedula = currentUser.cedula;
            const isRegistered = regs.some(r => r.userId === currentUser.id || (Boolean(userCedula) && r.cedula === userCedula));
            const isFull = registeredCount >= maxCapacity;
            const percentFilled = Math.min(100, Math.round((registeredCount / maxCapacity) * 100));

            return (
              <div
                id={`recent-event-card-${evt.id}`}
                key={evt.id}
                className="border border-[#ececec] hover:border-purple-200 rounded-xl p-5 bg-white shadow-2xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-5"
              >
                {/* Left Event Details */}
                <div className="space-y-2 flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 text-[10px] font-bold border border-purple-100 uppercase tracking-wider">
                      {evt.department || 'INSTITUCIONAL'}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-gray-700 text-[10px] font-medium border border-slate-200">
                      {evt.activityType}
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono">
                      Estado: <strong className="text-emerald-600 font-bold uppercase">{evt.status}</strong>
                    </span>
                  </div>

                  <h3 
                    onClick={() => onSelectEvent(evt)}
                    className="text-base font-bold text-[#37352F] hover:text-purple-700 cursor-pointer leading-snug"
                  >
                    {evt.title}
                  </h3>

                  <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                    {evt.description || "Sin descripción física."}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 pt-1">
                    <span className="flex items-center font-semibold text-[#37352F]">
                      <Calendar className="w-3.5 h-3.5 text-purple-500 mr-1.5" />
                      {formatDateDDMMAAAA(evt.date)}
                    </span>
                    <span className="flex items-center">
                      <Clock className="w-3.5 h-3.5 text-gray-400 mr-1.5" />
                      {evt.startTime} - {evt.endTime}
                    </span>
                    <span className="flex items-center text-gray-700 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-gray-400 mr-1.5" />
                      {getSpaceName(evt.spaceId)}
                    </span>
                    <span className="flex items-center text-gray-500">
                      Organiza: <strong className="ml-1 text-gray-800">{evt.responsible}</strong>
                    </span>
                  </div>
                </div>

                {/* Right Capacity & Registration Widget */}
                <div className="w-full md:w-64 p-4 rounded-lg bg-[#FAF9F6] border border-[#ececec] space-y-3 flex flex-col justify-between flex-shrink-0">
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-gray-600 flex items-center space-x-1">
                        <Users className="w-3.5 h-3.5 text-gray-400" />
                        <span>Aforo en Vivo</span>
                      </span>
                      <span className={`font-bold font-mono ${isFull ? 'text-red-600' : 'text-purple-700'}`}>
                        {registeredCount} / {maxCapacity} inscritos
                      </span>
                    </div>

                    {/* Gauge bar */}
                    <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isFull ? 'bg-red-500' : percentFilled > 80 ? 'bg-amber-500' : 'bg-purple-600'
                        }`}
                        style={{ width: `${percentFilled}%` }}
                      ></div>
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-gray-400 font-mono">
                      <span>{percentFilled}% completado</span>
                      <span>{maxCapacity - registeredCount} puestos libres</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-1.5 pt-1">
                    {isRegistered ? (
                      <button
                        id={`btn-unregister-${evt.id}`}
                        disabled={loadingEventId === evt.id}
                        onClick={() => handleToggleRegistration(evt, true)}
                        className="w-full py-1.5 px-3 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded text-xs font-bold transition-colors flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <UserMinus className="w-3.5 h-3.5" />
                        <span>Cancelar Mi Puesto</span>
                      </button>
                    ) : isFull ? (
                      <button
                        disabled
                        className="w-full py-1.5 px-3 bg-gray-150 text-gray-500 border border-gray-200 rounded text-xs font-bold opacity-75 cursor-not-allowed text-center"
                      >
                        Aforo Completo
                      </button>
                    ) : (
                      <button
                        id={`btn-register-${evt.id}`}
                        disabled={loadingEventId === evt.id}
                        onClick={() => handleToggleRegistration(evt, false)}
                        className="w-full py-1.5 px-3 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs font-bold shadow-2xs transition-colors flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Reservar Puesto ({maxCapacity - registeredCount} disps.)</span>
                      </button>
                    )}

                    {onExportPdf && (
                      <button
                        id={`btn-pdf-recent-${evt.id}`}
                        onClick={() => onExportPdf(evt)}
                        className="w-full py-1 px-2 border border-[#ececec] bg-white hover:bg-gray-50 text-gray-700 rounded text-[11px] font-semibold transition-colors flex items-center justify-center space-x-1 cursor-pointer"
                      >
                        <Printer className="w-3 h-3 text-gray-400" />
                        <span>Lista Asistencia PDF</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
