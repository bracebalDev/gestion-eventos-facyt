import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  MapPin, 
  User, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  Trash2, 
  Edit, 
  Sparkles,
  ChevronDown,
  Tag,
  Grid,
  List as ListIcon
} from 'lucide-react';
import { Evento, Espacio, TipoActividad, EstadoEvento, Usuario } from '../types';
import { formatDateDDMMAAAA } from '../utils/dateFormatter';

interface EventsListViewProps {
  eventos: Evento[];
  espacios: Espacio[];
  currentUser: Usuario;
  onSelectEvent: (evento: Evento) => void;
  onEditEvent: (evento: Evento) => void;
  onDeleteEvent?: (id: string) => void;
  onUpdateStatus?: (id: string, newStatus: EstadoEvento) => void;
  onCreateEvent: () => void;
}

type ViewMode = 'table' | 'cards';

export default function EventsListView({
  eventos,
  espacios,
  onSelectEvent,
  onEditEvent,
  onDeleteEvent,
  onUpdateStatus,
  onCreateEvent,
  currentUser
}: EventsListViewProps) {
  // Estados para búsqueda y filtrado
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpace, setSelectedSpace] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('table');

  // Filtrado de eventos con REQUERIMIENTOS ESTUDIANTE 4 y DEPARTAMENTO
  const filteredEventos = eventos.filter(evt => {
    const isMyEvent = evt.solicitanteId === currentUser.id;
    const isMyDept = evt.department === currentUser.department;
    const isPublic = evt.scope === 'PUBLICO' || evt.department === 'GENERAL' || evt.isInstitutional;
    const isApproved = evt.status === 'aprobado' || evt.status === 'programado' || evt.status === 'realizado';

    if (currentUser.role === 'solicitante') {
      // 1. Creador directo ve su propio evento en cualquier estado (solicitado, rechazado, etc.)
      if (isMyEvent) return true;

      // 2. Eventos en solicitado, revisión o rechazado creados por otros NUNCA son visibles
      if (evt.status === 'solicitado' || evt.status === 'en revisión' || evt.status === 'rechazado') {
        return false;
      }

      // 3. Evento cancelado solo es visible para estudiantes previamente inscritos
      if (evt.status === 'cancelado') {
        const isRegistered = (evt.attendees && evt.attendees.some(a => a.cedula === currentUser.cedula)) ||
                             (evt.publicRegistrations && evt.publicRegistrations.some(r => r.userId === currentUser.id));
        return isRegistered;
      }

      // 4. Eventos aprobados/programados/realizados visibles si son públicos o de su departamento
      if (!isApproved) return false;
      return isMyDept || isPublic;
    } else if (currentUser.role === 'director' && currentUser.department !== 'GENERAL') {
      if (isMyEvent || isMyDept) return true;
      if (!isApproved) return false;
      return isPublic;
    }

    const matchesSearch = 
      evt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evt.responsible.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evt.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSpace = selectedSpace === 'all' || evt.spaceId === selectedSpace;
    const matchesType = selectedType === 'all' || evt.activityType === selectedType;
    const matchesStatus = selectedStatus === 'all' || evt.status === selectedStatus;

    return matchesSearch && matchesSpace && matchesType && matchesStatus;
  });

  const getStatusStyle = (status: EstadoEvento) => {
    const styles: Record<EstadoEvento, string> = {
      solicitado: 'bg-blue-50 text-blue-700 border-blue-100',
      'en revisión': 'bg-amber-50 text-amber-700 border-amber-100',
      aprobado: 'bg-indigo-50 text-indigo-700 border-indigo-100',
      programado: 'bg-teal-50 text-teal-700 border-teal-100',
      realizado: 'bg-emerald-50 text-emerald-700 border-emerald-100',
      cancelado: 'bg-red-50 text-red-600 border-red-100',
      rechazado: 'bg-gray-150 text-gray-600 border-gray-200'
    };
    return styles[status] || 'bg-gray-50 text-gray-700 border-gray-100';
  };

  const getTipoLabel = (tipo: TipoActividad) => {
    const labels: Record<TipoActividad, string> = {
      taller: '🛠️ Taller',
      conversatorio: '💬 Conversatorio',
      jornada: '🎓 Jornada',
      charla: '📢 Charla',
      reunion: '👥 Reunión',
      otro: '📝 Otro'
    };
    return labels[tipo] || tipo;
  };

  const canEditOrDelete = (evt: Evento) => {
    if (currentUser.role === 'director') {
      return currentUser.department === 'GENERAL' || currentUser.department === evt.department;
    }
    return evt.solicitanteId === currentUser.id;
  };

  // REQUERIMIENTO 7: Gestión de espacios de Biblioteca restringida a Biblioteca y Decano
  const canChangeStatus = (evt: Evento) => {
    const isLibraryEvent = evt.department === 'BIBLIOTECA' || evt.spaceId.startsWith('esp-bib');
    if (isLibraryEvent) {
      return currentUser.role === 'director' && (currentUser.department === 'BIBLIOTECA' || currentUser.department === 'GENERAL');
    }

    if (currentUser.role === 'director') {
      return currentUser.department === 'GENERAL' || currentUser.department === evt.department;
    }
    return false;
  };

  return (
    <div id="events-list-view" className="flex-1 overflow-y-auto bg-white p-6 font-sans">
      {/* Header */}
      <div id="events-header" className="max-w-6xl mx-auto mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#37352F]">Gestión de Eventos</h1>
          <p className="text-xs text-[#8A8984] mt-0.5">
            Visualiza, filtra, aprueba y planifica las actividades del calendario de FaCyT.
          </p>
        </div>
        <button
          id="btn-create-event-list"
          onClick={onCreateEvent}
          className="px-3 py-1.5 bg-[#37352F] hover:bg-[#4a4841] text-white rounded text-xs font-semibold transition-colors shadow-2xs self-start"
        >
          + Crear Nuevo Evento
        </button>
      </div>

      {/* Notion-style Filters & Controls bar */}
      <div id="filters-bar" className="max-w-6xl mx-auto border border-[#ececec] rounded bg-[#FBFBFA] p-3.5 mb-5 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#8A8984]" />
            <input
              id="search-input"
              type="text"
              placeholder="Buscar por título, responsable o palabras clave..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8.5 pr-4 py-1.5 border border-[#ececec] bg-white rounded text-xs text-[#37352F] placeholder-[#8A8984] focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
            />
          </div>

          {/* View Toggles */}
          <div className="flex items-center space-x-1 border border-[#ececec] bg-white rounded p-0.5 self-start">
            <button
              id="toggle-view-table"
              onClick={() => setViewMode('table')}
              className={`p-1 rounded transition-colors ${
                viewMode === 'table' ? 'bg-[#efefef] text-[#37352F]' : 'text-gray-500 hover:text-gray-700'
              }`}
              title="Vista de Tabla (Notion Database)"
            >
              <ListIcon className="w-3.5 h-3.5" />
            </button>
            <button
              id="toggle-view-cards"
              onClick={() => setViewMode('cards')}
              className={`p-1 rounded transition-colors ${
                viewMode === 'cards' ? 'bg-[#efefef] text-[#37352F]' : 'text-gray-500 hover:text-gray-700'
              }`}
              title="Vista de Tarjetas (Bento-Board)"
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Advanced Select Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-[#ececec]">
          {/* Filter by Space */}
          <div className="flex items-center space-x-2">
            <span className="text-[11px] text-[#8A8984] font-bold uppercase tracking-wider whitespace-nowrap">Espacio:</span>
            <select
              id="filter-space"
              value={selectedSpace}
              onChange={(e) => setSelectedSpace(e.target.value)}
              className="flex-1 bg-white border border-[#ececec] rounded py-1 px-2 text-xs text-[#37352F] focus:outline-none"
            >
              <option value="all">Todos los espacios</option>
              {espacios.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Filter by Type */}
          <div className="flex items-center space-x-2">
            <span className="text-[11px] text-[#8A8984] font-bold uppercase tracking-wider whitespace-nowrap">Actividad:</span>
            <select
              id="filter-type"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="flex-1 bg-white border border-[#ececec] rounded py-1 px-2 text-xs text-[#37352F] focus:outline-none"
            >
              <option value="all">Todos los tipos</option>
              <option value="taller">🛠️ Talleres</option>
              <option value="conversatorio">💬 Conversatorios</option>
              <option value="jornada">🎓 Jornadas</option>
              <option value="charla">📢 Charlas</option>
              <option value="reunion">👥 Reuniones</option>
              <option value="otro">📝 Otros</option>
            </select>
          </div>

          {/* Filter by Status */}
          <div className="flex items-center space-x-2">
            <span className="text-[11px] text-[#8A8984] font-bold uppercase tracking-wider whitespace-nowrap">Estado:</span>
            <select
              id="filter-status"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="flex-1 bg-white border border-[#ececec] rounded py-1 px-2 text-xs text-[#37352F] focus:outline-none"
            >
              <option value="all">Todos los estados</option>
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
      </div>

      {/* Main Table / Grid listing */}
      <div className="max-w-6xl mx-auto">
        {filteredEventos.length === 0 ? (
          <div className="border border-[#ececec] rounded p-12 text-center bg-[#FAF9F6]">
            <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-[#37352F] mb-0.5">No se encontraron eventos</h3>
            <p className="text-xs text-gray-500">Prueba ajustando los filtros o buscando con otros términos.</p>
          </div>
        ) : viewMode === 'table' ? (
          /* NOTION-STYLE DATABASE TABLE VIEW */
          <div className="border border-[#ececec] rounded overflow-hidden bg-white shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse table-fixed min-w-[800px]">
                <thead>
                  <tr className="bg-[#FAF9F6] border-b border-[#ececec] text-[10px] font-bold text-[#8A8984] uppercase tracking-wider">
                    <th className="p-2.5 pl-3 w-1/4">Evento / Título</th>
                    <th className="p-2.5 w-1/6">Fecha y Horario</th>
                    <th className="p-2.5 w-1/5">Espacio</th>
                    <th className="p-2.5 w-1/6">Responsable</th>
                    <th className="p-2.5 w-1/8">Tipo</th>
                    <th className="p-2.5 w-1/8">Estado</th>
                    <th className="p-2.5 w-[140px] text-right pr-3">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ececec] text-xs">
                  {filteredEventos.map((evt) => {
                    const space = espacios.find(s => s.id === evt.spaceId);
                    return (
                      <tr 
                        id={`event-row-${evt.id}`}
                        key={evt.id}
                        className="hover:bg-slate-50 transition-colors group"
                      >
                        {/* Event / Title */}
                        <td className="p-3 pl-4">
                          <div className="flex flex-col space-y-1">
                            <span 
                              onClick={() => onSelectEvent(evt)}
                              className="font-semibold text-sm text-gray-900 hover:text-blue-600 cursor-pointer line-clamp-1"
                            >
                              {evt.title}
                            </span>
                            {evt.conflictWarning && (
                              <div className="flex items-center text-[10px] text-red-600 font-medium space-x-1 mt-0.5">
                                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 animate-pulse text-red-500" />
                                <span className="line-clamp-1">{evt.conflictWarning}</span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Date and Time */}
                        <td className="p-3 text-gray-600 font-medium">
                          <div className="flex flex-col">
                            <span>{formatDateDDMMAAAA(evt.date)}</span>
                            <span className="text-[10px] text-gray-400 font-normal">{evt.startTime} - {evt.endTime}</span>
                          </div>
                        </td>

                        {/* Space Assigned */}
                        <td className="p-3">
                          <div className="flex items-center text-gray-700 font-medium space-x-1.5 truncate">
                            <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            <span className="truncate">{space?.name || "No asignado"}</span>
                          </div>
                        </td>

                        {/* Responsible */}
                        <td className="p-3">
                          <div className="flex items-center text-gray-600 space-x-1.5 truncate">
                            <User className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            <span className="truncate">{evt.responsible}</span>
                          </div>
                        </td>

                        {/* Activity Type */}
                        <td className="p-3">
                          <span className="px-2 py-1 rounded bg-[#F1F1F0] text-gray-700 border border-gray-200">
                            {getTipoLabel(evt.activityType)}
                          </span>
                        </td>

                        {/* Status Select with quick change dropdown */}
                        <td className="p-3">
                          <select
                            id={`status-select-${evt.id}`}
                            value={evt.status}
                            onChange={(e) => onUpdateStatus && onUpdateStatus(evt.id, e.target.value as EstadoEvento)}
                            disabled={!canChangeStatus(evt)}
                            className={`px-2 py-1 rounded-md text-[11px] font-medium border focus:outline-none transition-colors ${getStatusStyle(evt.status)} ${!canChangeStatus(evt) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                          >
                            <option value="solicitado">solicitado</option>
                            <option value="en revisión">en revisión</option>
                            <option value="aprobado">aprobado</option>
                            <option value="programado">programado</option>
                            <option value="realizado">realizado</option>
                            <option value="cancelado">cancelado</option>
                            <option value="rechazado">rechazado</option>
                          </select>
                        </td>

                        {/* Action buttons */}
                        <td className="p-3 text-right pr-4">
                          <div className="flex items-center justify-end space-x-1 opacity-80 group-hover:opacity-100 transition-opacity">
                            {canEditOrDelete(evt) && (
                              <>
                                <button
                                  id={`btn-edit-row-${evt.id}`}
                                  onClick={() => onEditEvent(evt)}
                                  className="p-1.5 rounded hover:bg-gray-100 text-gray-600 transition-colors"
                                  title="Editar Evento"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  id={`btn-delete-row-${evt.id}`}
                                  onClick={() => onDeleteEvent(evt.id)}
                                  className="p-1.5 rounded hover:bg-red-50 text-red-600 transition-colors"
                                  title="Eliminar Evento"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* BENTO CARD VIEW */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredEventos.map((evt) => {
              const space = espacios.find(s => s.id === evt.spaceId);
              return (
                <div 
                  id={`event-card-${evt.id}`}
                  key={evt.id}
                  className={`border border-[#ececec] rounded p-4 bg-white shadow-2xs flex flex-col justify-between hover:border-gray-300 transition-all group ${
                    evt.conflictWarning ? 'ring-1 ring-red-200 bg-red-[1px]' : ''
                  }`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-gray-100 text-gray-700">
                        {getTipoLabel(evt.activityType)}
                      </span>
                      <select
                        id={`card-status-select-${evt.id}`}
                        value={evt.status}
                        onChange={(e) => onUpdateStatus(evt.id, e.target.value as EstadoEvento)}
                        disabled={!canChangeStatus(evt)}
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold border focus:outline-none ${getStatusStyle(evt.status)} ${!canChangeStatus(evt) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        <option value="solicitado">solicitado</option>
                        <option value="en revisión">en revisión</option>
                        <option value="aprobado">aprobado</option>
                        <option value="programado">programado</option>
                        <option value="realizado">realizado</option>
                        <option value="cancelado">cancelado</option>
                        <option value="rechazado">rechazado</option>
                      </select>
                    </div>

                    <div className="space-y-0.5">
                      <h3 
                        onClick={() => onSelectEvent(evt)}
                        className="font-semibold text-sm text-gray-900 hover:text-blue-600 cursor-pointer leading-tight line-clamp-2"
                      >
                        {evt.title}
                      </h3>
                      <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">
                        {evt.description || "Sin descripción proporcionada."}
                      </p>
                    </div>

                    <div className="space-y-1 pt-0.5 text-xs text-gray-600">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <span className="font-medium text-[11px]">{evt.date}</span>
                        <span className="text-gray-300">|</span>
                        <Clock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <span className="text-[11px]">{evt.startTime} - {evt.endTime}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <span className="truncate text-[11px]">{space?.name || "No asignado"}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <User className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <span className="truncate font-medium text-[11px] text-gray-700">{evt.responsible}</span>
                      </div>
                    </div>

                    {evt.conflictWarning && (
                      <div className="p-2 bg-red-50 border border-red-100 rounded flex items-start space-x-1.5 text-[10px] text-red-700 animate-pulse">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
                        <span>{evt.conflictWarning}</span>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-[#ececec] mt-3.5 pt-2.5 flex items-center justify-between">
                    <span className="text-[10px] text-gray-400 font-mono">Capacidad: {evt.participantsCount} personas</span>
                    
                    <div className="flex items-center space-x-1">
                      {canEditOrDelete(evt) && (
                        <>
                          <button
                            id={`btn-enrich-card-${evt.id}`}
                            onClick={() => onTriggerAiEnrich(evt)}
                            className="p-1.5 rounded hover:bg-[#F1F1F0] text-purple-600 transition-colors"
                            title="Enriquecer con Gemini AI"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                          </button>
                          <button
                            id={`btn-edit-card-${evt.id}`}
                            onClick={() => onEditEvent(evt)}
                            className="p-1.5 rounded hover:bg-[#F1F1F0] text-gray-600 transition-colors"
                            title="Editar Evento"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            id={`btn-delete-card-${evt.id}`}
                            onClick={() => onDeleteEvent(evt.id)}
                            className="p-1.5 rounded hover:bg-red-50 text-red-600 transition-colors"
                            title="Eliminar Evento"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
