import React, { useState } from 'react';
import { MapPin, Users, HardDrive, Info, Plus, Check, Filter, X, Calendar, Clock, Maximize2 } from 'lucide-react';
import { Espacio, Evento, Usuario } from '../types';
import { formatDateDDMMAAAA } from '../utils/dateFormatter';

interface SpacesViewProps {
  espacios: Espacio[];
  eventos: Evento[];
  currentUser: Usuario;
  onAddSpace: (space: Omit<Espacio, 'id'>) => void;
}

export default function SpacesView({ espacios, eventos, currentUser, onAddSpace }: SpacesViewProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedSpaceModal, setSelectedSpaceModal] = useState<Espacio | null>(null);

  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState(30);
  const [location, setLocation] = useState('');
  const [type, setType] = useState<Espacio['type']>('salon');
  const [resources, setResources] = useState('');
  const [observations, setObservations] = useState('');

  // Filtrado de espacios según departamento asignado + Auditorio Ninoska Maneiro (GENERAL)
  const isDecanato = currentUser.role === 'director' && currentUser.department === 'GENERAL';
  
  const filteredEspacios = espacios.filter(sp => {
    if (isDecanato) return true;
    return sp.department === currentUser.department || sp.department === 'GENERAL' || !sp.department || sp.department === 'BIBLIOTECA';
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !location) return;

    const resourceArray = resources
      ? resources.split(',').map(r => r.trim()).filter(r => r !== '')
      : [];

    onAddSpace({
      name,
      capacity: Number(capacity),
      location,
      type,
      resources: resourceArray,
      observations: observations || undefined,
      department: currentUser.department === 'GENERAL' ? 'GENERAL' : currentUser.department
    });

    setName('');
    setCapacity(30);
    setLocation('');
    setType('salon');
    setResources('');
    setObservations('');
    setShowAddForm(false);
  };

  const getSpaceTypeEmoji = (type: Espacio['type']) => {
    const emojis = {
      auditorio: '🏛️',
      laboratorio: '🧪',
      salon: '🏫',
      otro: '📍'
    };
    return emojis[type] || '📍';
  };

  // Eventos aprobados del espacio seleccionado para el modal
  const approvedEventsInModal = selectedSpaceModal 
    ? eventos.filter(e => e.spaceId === selectedSpaceModal.id && (e.status === 'aprobado' || e.status === 'programado' || e.status === 'realizado'))
    : [];

  return (
    <div id="spaces-view" className="flex-1 overflow-y-auto bg-white p-4 md:p-6 font-sans">
      {/* Header */}
      <div id="spaces-header" className="max-w-6xl mx-auto mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#37352F]">Catálogo de Aulas y Espacios Físicos</h1>
          <p className="text-xs text-[#8A8984] mt-0.5">
            Consulta la disponibilidad, capacidad y eventos agendados en los recintos de la facultad.
          </p>
        </div>
        
        {isDecanato && (
          <button
            id="btn-toggle-add-space"
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-3.5 py-2 bg-[#37352F] hover:bg-[#4a4841] text-white rounded text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-2xs self-start md:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{showAddForm ? 'Cancelar' : 'Registrar Nuevo Espacio'}</span>
          </button>
        )}
      </div>

      {/* Formulario de Nuevo Espacio (Solo Decano) */}
      {showAddForm && (
        <div id="add-space-form-card" className="max-w-6xl mx-auto mb-6 p-5 border border-[#ececec] rounded-xl bg-[#FBFBFA] shadow-2xs animate-fade-in">
          <h2 className="text-sm font-bold text-[#37352F] mb-4 flex items-center space-x-2">
            <span>🏛️</span>
            <span>Registrar Nuevo Recinto Académico en FaCyT</span>
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4 font-sans">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600">Nombre del Recinto *</label>
                <input
                  id="space-name-input"
                  type="text"
                  placeholder="Ej. Laboratorio L-203"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2 border border-gray-200 bg-white rounded-md text-sm text-[#37352F]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600">Capacidad Máxima *</label>
                <input
                  id="space-capacity-input"
                  type="number"
                  min="5"
                  max="500"
                  required
                  value={capacity}
                  onChange={(e) => setCapacity(Number(e.target.value))}
                  className="w-full p-2 border border-gray-200 bg-white rounded-md text-sm text-[#37352F]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600">Ubicación / Edificio *</label>
                <input
                  id="space-location-input"
                  type="text"
                  placeholder="Ej. Edificio de Ciencias, Planta Baja"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full p-2 border border-gray-200 bg-white rounded-md text-sm text-[#37352F]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600">Tipo de Espacio</label>
                <select
                  id="space-type-select"
                  value={type}
                  onChange={(e) => setType(e.target.value as Espacio['type'])}
                  className="w-full p-2 border border-gray-200 bg-white rounded-md text-sm text-[#37352F]"
                >
                  <option value="salon">Salón Común</option>
                  <option value="laboratorio">Laboratorio Especializado</option>
                  <option value="auditorio">Auditorio Principal</option>
                  <option value="otro">Otro Tipo</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-600">Recursos y Equipamiento (separados por comas)</label>
              <input
                id="space-resources-input"
                type="text"
                placeholder="Ej. Proyector HD, Aire acondicionado, Pizarra acrílica, 30 pupitres"
                value={resources}
                onChange={(e) => setResources(e.target.value)}
                className="w-full p-2 border border-gray-200 bg-white rounded-md text-sm text-[#37352F]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-600">Observaciones y Condiciones de Uso</label>
              <textarea
                id="space-observations-textarea"
                rows={2}
                placeholder="Ej. Llave bajo resguardo del laboratorio de Computación II..."
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                className="w-full p-2 border border-gray-200 bg-white rounded-md text-sm text-[#37352F]"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 border border-gray-200 rounded text-xs text-gray-600 hover:bg-gray-100"
              >
                Cancelar
              </button>
              <button
                id="btn-save-space"
                type="submit"
                className="px-4 py-1.5 bg-[#37352F] text-white rounded text-xs font-semibold hover:bg-[#4a4841]"
              >
                Guardar Espacio
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grid de Tarjetas de Espacios (CLICKEABLES REQUERIMIENTO 3) */}
      <div id="spaces-grid-container" className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5">
          {filteredEspacios.map((sp) => {
            const eventosReservados = eventos.filter(e => e.spaceId === sp.id && e.status !== 'cancelado' && e.status !== 'rechazado');
            
            return (
              <div 
                id={`space-card-${sp.id}`}
                key={sp.id}
                onClick={() => setSelectedSpaceModal(sp)}
                className="p-4.5 border border-[#ececec] hover:border-purple-300 hover:shadow-md rounded-xl bg-white shadow-2xs transition-all flex flex-col justify-between cursor-pointer group relative"
              >
                <div className="space-y-3.5">
                  {/* Title Bar */}
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xl mr-1.5">{getSpaceTypeEmoji(sp.type)}</span>
                      <h3 className="font-bold text-sm text-[#37352F] group-hover:text-purple-700 transition-colors inline-block">{sp.name}</h3>
                      <div className="flex items-center text-[11px] text-gray-400 mt-0.5">
                        <MapPin className="w-3 h-3 mr-1" />
                        <span>{sp.location}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                      <span className="px-1.5 py-0.5 rounded bg-[#FAF9F6] border border-gray-200 text-[10px] font-mono font-bold text-gray-600">
                        {sp.department || 'GENERAL'}
                      </span>
                      <span className="text-[10px] text-purple-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-0.5">
                        <Maximize2 className="w-3 h-3" />
                        <span>Ver Agenda</span>
                      </span>
                    </div>
                  </div>

                  {/* Capacity & Load */}
                  <div className="grid grid-cols-2 gap-4 py-2 border-y border-gray-100 text-xs text-gray-600">
                    <div className="flex items-center space-x-2">
                      <Users className="w-3.5 h-3.5 text-gray-400" />
                      <div>
                        <span className="text-[9px] text-gray-400 block font-bold uppercase tracking-wider">Capacidad</span>
                        <span className="font-semibold text-[#37352F]">{sp.capacity} personas</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <HardDrive className="w-3.5 h-3.5 text-gray-400" />
                      <div>
                        <span className="text-[9px] text-gray-400 block font-bold uppercase tracking-wider">Reservas Activas</span>
                        <span className="font-semibold text-[#37352F]">{eventosReservados.length} {eventosReservados.length === 1 ? 'evento' : 'eventos'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Resources / Tags */}
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">RECURSOS DISPONIBLES</span>
                    <div className="flex flex-wrap gap-1">
                      {sp.resources.length === 0 ? (
                        <span className="text-[11px] text-gray-400 italic">Ningún recurso registrado</span>
                      ) : (
                        sp.resources.map((resTag) => (
                          <span key={resTag} className="px-1.5 py-0.2 rounded bg-slate-100 text-gray-600 text-[9px] font-medium flex items-center border border-slate-200">
                            <Check className="w-2.5 h-2.5 text-slate-500 mr-0.5" />
                            {resTag}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Card footer details */}
                <div className="pt-3 border-t border-[#ececec] mt-3.5 text-[9px] text-gray-400 font-mono flex justify-between items-center">
                  <span>Haz clic para ver eventos agendados</span>
                  <span className="text-purple-600 font-bold">Ver recinto →</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL DETALLADO DE RECINTO Y EVENTOS AGENDADOS (REQUERIMIENTO 3) */}
      {selectedSpaceModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 space-y-4 shadow-2xl border border-[#ececec] animate-fade-in max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center border-b border-[#ececec] pb-3">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">{getSpaceTypeEmoji(selectedSpaceModal.type)}</span>
                <div>
                  <h2 className="text-lg font-bold text-[#37352F]">{selectedSpaceModal.name}</h2>
                  <p className="text-xs text-gray-400 flex items-center space-x-1">
                    <MapPin className="w-3 h-3 text-gray-400" />
                    <span>{selectedSpaceModal.location} ({selectedSpaceModal.department || 'GENERAL'})</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedSpaceModal(null)}
                className="p-1 hover:bg-gray-100 rounded text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4">
              {/* Información y Recursos */}
              <div className="p-4 bg-[#FAF9F6] border border-[#ececec] rounded-lg grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Capacidad de Aforo</span>
                  <span className="font-bold text-[#37352F] text-sm">{selectedSpaceModal.capacity} personas</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Tipo de Espacio</span>
                  <span className="font-bold text-[#37352F] capitalize">{selectedSpaceModal.type}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Recursos Disponibles</span>
                  <div className="flex flex-wrap gap-1">
                    {selectedSpaceModal.resources.map(r => (
                      <span key={r} className="px-2 py-0.5 bg-white border border-gray-200 rounded font-medium text-gray-700 text-[11px]">
                        ✓ {r}
                      </span>
                    ))}
                  </div>
                </div>
                {selectedSpaceModal.observations && (
                  <div className="col-span-2 pt-2 border-t border-gray-200">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Observaciones y Reglamento</span>
                    <p className="text-gray-600 italic mt-0.5">{selectedSpaceModal.observations}</p>
                  </div>
                )}
              </div>

              {/* Eventos Aprobados y Agendados en este Recinto */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center space-x-1.5">
                  <Calendar className="w-4 h-4 text-purple-600" />
                  <span>Eventos Aprobados y Agendados en este Recinto ({approvedEventsInModal.length})</span>
                </h3>

                {approvedEventsInModal.length === 0 ? (
                  <div className="p-6 border border-dashed border-gray-200 rounded-lg text-center text-gray-400 text-xs italic">
                    No hay eventos aprobados agendados actualmente en este recinto.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {approvedEventsInModal.map((evt) => (
                      <div key={evt.id} className="p-3 border border-[#ececec] rounded-lg bg-white hover:bg-purple-50/30 transition-colors flex justify-between items-center text-xs">
                        <div className="space-y-0.5">
                          <h4 className="font-bold text-[#37352F] text-xs">{evt.title}</h4>
                          <div className="flex items-center space-x-2 text-[11px] text-gray-500">
                            <span className="font-semibold text-purple-700">{formatDateDDMMAAAA(evt.date)}</span>
                            <span>•</span>
                            <span className="flex items-center"><Clock className="w-3 h-3 text-gray-400 mr-1" />{evt.startTime} - {evt.endTime}</span>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold font-mono text-[10px] uppercase">
                          {evt.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-[#ececec] flex justify-end">
              <button
                onClick={() => setSelectedSpaceModal(null)}
                className="px-4 py-1.5 bg-[#37352F] text-white rounded text-xs font-bold cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
