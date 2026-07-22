import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, Sparkles } from 'lucide-react';
import { Evento, Espacio, TipoActividad, EstadoEvento, Departamento, Usuario } from '../types';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (eventData: Partial<Evento>) => Promise<boolean | void> | void;
  eventToEdit?: Evento;
  espacios: Espacio[];
  currentUser: Usuario;
  defaultDate?: string;
}

export default function EventModal({
  isOpen,
  onClose,
  onSave,
  eventToEdit,
  espacios,
  currentUser,
  defaultDate
}: EventModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('10:00');
  const [spaceId, setSpaceId] = useState('');
  const [responsible, setResponsible] = useState('');
  const [activityType, setActivityType] = useState<TipoActividad>('otro');
  const [status, setStatus] = useState<EstadoEvento>('solicitado');
  const [participantsCount, setParticipantsCount] = useState(30);
  const [department, setDepartment] = useState<Departamento>('GENERAL');
  const [scope, setScope] = useState<'PUBLICO' | 'DEPARTAMENTAL'>('DEPARTAMENTAL');
  const [notes, setNotes] = useState('');
  const [conflictError, setConflictError] = useState<string | null>(null);

  // Sincronizar departamento y aforo con el espacio seleccionado
  const selectedSpaceObj = espacios.find(s => s.id === spaceId);
  const isDepartmentLocked = !!selectedSpaceObj?.department;
  const selectedSpaceCapacity = selectedSpaceObj?.capacity || 100;

  useEffect(() => {
    if (selectedSpaceObj?.department) {
      setDepartment(selectedSpaceObj.department);
    }
    if (selectedSpaceObj && !eventToEdit) {
      setParticipantsCount(selectedSpaceObj.capacity);
    }
  }, [spaceId, selectedSpaceObj, eventToEdit]);

  // Sincronizar estado cuando se edita un evento
  useEffect(() => {
    setConflictError(null);
    if (eventToEdit) {
      setTitle(eventToEdit.title);
      setDescription(eventToEdit.description);
      setDate(eventToEdit.date);
      setStartTime(eventToEdit.startTime);
      setEndTime(eventToEdit.endTime);
      setSpaceId(eventToEdit.spaceId);
      setResponsible(eventToEdit.responsible);
      setActivityType(eventToEdit.activityType);
      setStatus(eventToEdit.status);
      setParticipantsCount(eventToEdit.participantsCount);
      setDepartment(eventToEdit.department || 'GENERAL');
      setScope(eventToEdit.scope || (currentUser.department === 'GENERAL' ? 'PUBLICO' : 'DEPARTAMENTAL'));
      setNotes(eventToEdit.notes || '');
    } else {
      // Valores por defecto para nuevos eventos
      const defaultInitialStatus: EstadoEvento = currentUser.role === 'solicitante'
        ? 'en revisión'
        : 'aprobado';

      setTitle('');
      setDescription('');
      setDate(defaultDate || new Date().toISOString().split('T')[0]);
      setStartTime('08:30');
      setEndTime('11:30');
      setSpaceId(espacios[0]?.id || '');
      setResponsible('');
      setActivityType('otro');
      setStatus(defaultInitialStatus);
      setParticipantsCount(espacios[0]?.capacity || 30);
      setDepartment(currentUser.department === 'GENERAL' ? 'GENERAL' : currentUser.department);
      setScope(currentUser.department === 'GENERAL' ? 'PUBLICO' : 'DEPARTAMENTAL');
      setNotes('');
    }
  }, [eventToEdit, isOpen, espacios, defaultDate, currentUser]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setConflictError(null);

    if (!title || !date || !startTime || !endTime || !spaceId || !responsible) {
      alert("Por favor rellene todos los campos obligatorios.");
      return;
    }

    if (startTime >= endTime) {
      alert("La hora de inicio debe ser anterior a la hora de fin.");
      return;
    }

    // REQUERIMIENTO AFORO: El aforo estimado NUNCA puede ser mayor a la capacidad máxima del recinto
    if (Number(participantsCount) > selectedSpaceCapacity) {
      setConflictError(`⚠️ El aforo estimado (${participantsCount}) NUNCA puede ser mayor al aforo máximo del recinto seleccionado (${selectedSpaceCapacity} personas).`);
      return;
    }

    // Determinar alcance según reglas
    let finalScope: 'PUBLICO' | 'DEPARTAMENTAL' = 'DEPARTAMENTAL';
    if (currentUser.role === 'solicitante') {
      finalScope = 'DEPARTAMENTAL';
    } else if (currentUser.role === 'director' && currentUser.department === 'GENERAL') {
      finalScope = 'PUBLICO';
    } else {
      finalScope = scope;
    }

    // Determinar estatus final según rol
    const finalStatus: EstadoEvento = eventToEdit ? status : (currentUser.role === 'solicitante'
      ? 'en revisión'
      : 'aprobado');

    const payload: Partial<Evento> = {
      ...(eventToEdit && { id: eventToEdit.id }),
      title,
      description,
      date,
      startTime,
      endTime,
      spaceId,
      responsible,
      activityType,
      status: finalStatus,
      participantsCount: Number(participantsCount),
      department,
      solicitanteId: currentUser.id,
      scope: finalScope,
      notes
    };

    try {
      const result = await onSave(payload);
      if (result === false) {
        setConflictError("NO SE PUEDE REGISTRAR POR COINCIDENCIA DE HORARIO O ESPACIO.");
      }
    } catch (err: any) {
      setConflictError(err.message || "NO SE PUEDE REGISTRAR POR COINCIDENCIA");
    }
  };

  return (
    <div id="event-modal-backdrop" className="fixed inset-0 bg-[#37352F]/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans animate-fade-in">
      <div id="event-modal-container" className="bg-white rounded border border-[#ececec] w-full max-w-xl max-h-[92vh] overflow-y-auto flex flex-col shadow-2xl">
        {/* Header */}
        <div id="modal-header" className="p-4 border-b border-[#ececec] flex items-center justify-between bg-[#FBFBFA]">
          <div className="flex items-center space-x-2">

            <h2 className="font-bold text-sm text-[#37352F]">
              {eventToEdit ? '✏️ Editar Evento FaCyT' : '📅 Solicitar Evento FaCyT'}
            </h2>
          </div>
          <button
            id="btn-close-modal"
            onClick={onClose}
            className="p-1 hover:bg-gray-200 rounded transition-colors text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 flex-1 text-xs">
          {conflictError && (
            <div className="p-3 bg-red-100 border-2 border-red-500 rounded-lg flex items-start space-x-2 text-red-900 font-bold text-xs">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5 animate-bounce" />
              <div>
                <span className="uppercase font-extrabold text-red-700 block">⚠️ NO SE PUEDE REGISTRAR POR COINCIDENCIA</span>
                <p className="font-medium text-red-800 mt-0.5">{conflictError}</p>
              </div>
            </div>
          )}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Título de la Actividad *</label>
            <input
              id="input-title"
              type="text"
              required
              placeholder="Ej. Taller Avanzado de Lógica Difusa"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2 border border-gray-200 rounded text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Breve Descripción Académica</label>
            <textarea
              id="input-description"
              rows={2}
              placeholder="Describa el propósito y contenido del evento..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2 border border-gray-200 rounded text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
            ></textarea>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Fecha *</label>
              <input
                id="input-date"
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-1.5 border border-gray-200 rounded text-xs text-gray-900 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Hora Inicio *</label>
              <input
                id="input-start-time"
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full p-1.5 border border-gray-200 rounded text-xs text-gray-900 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Hora Fin *</label>
              <input
                id="input-end-time"
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full p-1.5 border border-gray-200 rounded text-xs text-gray-900 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Asignar Espacio Físico *</label>
              <select
                id="select-space-id"
                required
                value={spaceId}
                onChange={(e) => setSpaceId(e.target.value)}
                className="w-full p-1.5 border border-gray-200 rounded text-xs text-gray-900 bg-white focus:outline-none"
              >
                <option value="">Seleccione un espacio...</option>
                {espacios.filter(s => {
                  if (currentUser.department === 'GENERAL') return true;
                  return s.department === currentUser.department || s.department === 'GENERAL' || s.department === 'BIBLIOTECA';
                }).map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} (Cap: {s.capacity})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Coordinador / Responsable *</label>
              <input
                id="input-responsible"
                type="text"
                required
                placeholder="Ej. Prof. Luis Pérez"
                value={responsible}
                onChange={(e) => setResponsible(e.target.value)}
                className="w-full p-1.5 border border-gray-200 rounded text-xs text-gray-900 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Tipo de Actividad</label>
              <select
                id="select-activity-type"
                value={activityType}
                onChange={(e) => setActivityType(e.target.value as TipoActividad)}
                className="w-full p-1.5 border border-gray-200 rounded text-xs text-gray-900 bg-white focus:outline-none"
              >
                <option value="taller">Taller</option>
                <option value="conversatorio">Conversatorio</option>
                <option value="jornada">Jornada</option>
                <option value="charla">Charla</option>
                <option value="reunion">Reunión</option>
                <option value="otro">Otro</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Aforo Estimado</label>
              <input
                id="input-participants"
                type="number"
                min="1"
                value={participantsCount}
                onChange={(e) => setParticipantsCount(Number(e.target.value))}
                className="w-full p-1.5 border border-gray-200 rounded text-xs text-gray-900 focus:outline-none"
              />
            </div>

            {/* Solo el Decano (Director General) tiene acceso a cambiar manualmente el Estado del Trámite */}
            {currentUser.role === 'director' && currentUser.department === 'GENERAL' && (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Estado del Trámite</label>
                <select
                  id="select-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as EstadoEvento)}
                  className="w-full p-1.5 border border-gray-200 rounded text-xs text-[#37352F] bg-white focus:outline-none font-semibold"
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
            )}
            
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Departamento Responsable</label>
              <select
                id="select-department"
                value={department}
                onChange={(e) => setDepartment(e.target.value as Departamento)}
                disabled={isDepartmentLocked}
                className={`w-full p-1.5 border border-gray-200 rounded text-xs text-gray-900 bg-white focus:outline-none ${isDepartmentLocked ? 'opacity-70 bg-gray-50 cursor-not-allowed' : ''}`}
                title={isDepartmentLocked ? "Asignado automáticamente por el espacio seleccionado" : ""}
              >
                <option value="GENERAL">General (Decanato)</option>
                <option value="COMPUTACION">Computación</option>
                <option value="FISICA">Física</option>
                <option value="BIOLOGIA">Biología</option>
                <option value="QUIMICA">Química</option>
                <option value="MATEMATICA">Matemática</option>
              </select>
            </div>
          </div>

          {/* Selector de Alcance de Visualización para Coordinadores de Departamento (Requerimiento 5) */}
          {currentUser.role === 'director' && currentUser.department !== 'GENERAL' && (
            <div className="space-y-1 p-2.5 bg-purple-50/50 border border-purple-100 rounded">
              <label className="text-[10px] font-bold text-purple-800 uppercase tracking-wider block">
                Alcance de Visualización del Evento *
              </label>
              <select
                id="select-scope"
                value={scope}
                onChange={(e) => setScope(e.target.value as 'PUBLICO' | 'DEPARTAMENTAL')}
                className="w-full p-1.5 border border-purple-200 bg-white rounded text-xs text-purple-900 font-bold focus:outline-none"
              >
                <option value="DEPARTAMENTAL">DEPARTAMENTAL (Visible solo para estudiantes de mi carrera)</option>
                <option value="PUBLICO">PÚBLICO (Visible para toda la Facultad FaCyT)</option>
              </select>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Notas de Gestión Administrativa</label>
            <input
              id="input-notes"
              type="text"
              placeholder="Ej. Requiere llave del laboratorio o encendido de aires antes de las 8"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-1.5 border border-gray-200 rounded text-xs text-gray-900 focus:outline-none"
            />
          </div>

          {/* Quick Info Box */}
          <div className="p-2.5 bg-blue-50 border border-blue-100 rounded text-[11px] text-blue-800 leading-normal">
            Al guardar el evento, el sistema verificará automáticamente si existe otra actividad aprobada o programada en el mismo espacio y horario. De existir, se mostrará una advertencia de conflicto.
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-2 pt-3 border-t border-gray-100">
            <button
              id="btn-cancel-modal"
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 border border-gray-200 rounded text-xs text-gray-600 hover:bg-[#FAF9F6] font-bold transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              id="btn-save-event"
              type="submit"
              className="px-3 py-1.5 bg-[#37352F] hover:bg-[#4a4841] text-white rounded text-xs font-bold shadow-2xs transition-colors cursor-pointer"
            >
              {eventToEdit ? 'Guardar Cambios' : 'Registrar Solicitud'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
