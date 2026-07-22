import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Evento, Departamento, Usuario } from '../types';
import { formatDateDDMMAAAA } from '../utils/dateFormatter';

interface CalendarViewProps {
  eventos: Evento[];
  currentUser: Usuario;
  onSelectEvent: (evento: Evento) => void;
  onCreateEvent: (defaultDate?: string) => void;
}

export default function CalendarView({
  eventos,
  currentUser,
  onSelectEvent,
  onCreateEvent
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  // REQUERIMIENTO CALENDARIO: Solo mostrar eventos públicos y departamentales del mismo departamento
  const visibleEventos = eventos.filter(evt => {
    if (currentUser.department === 'GENERAL') return true;
    const isPublic = evt.scope === 'PUBLICO' || evt.department === 'GENERAL' || evt.isInstitutional;
    const isMyDept = evt.department === currentUser.department;
    return isPublic || isMyDept;
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Días de la semana
  const daysOfWeek = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  // Obtener primer día del mes y total de días
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Días del mes anterior para llenar la primera fila
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  const prevMonthDays = Array.from({ length: firstDayOfMonth }, (_, i) => daysInPrevMonth - firstDayOfMonth + i + 1);
  
  // Días del mes actual
  const currentMonthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Calcular espacios restantes para completar la cuadrícula (42 celdas)
  const totalCells = 42;
  const nextMonthDays = Array.from({ length: totalCells - prevMonthDays.length - currentMonthDays.length }, (_, i) => i + 1);

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Color basado en departamento
  const getDepartmentColor = (dept: Departamento) => {
    switch (dept) {
      case 'COMPUTACION': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'FISICA': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'BIOLOGIA': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'QUIMICA': return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'MATEMATICA': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'GENERAL': return 'bg-slate-100 text-slate-700 border-slate-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  return (
    <div id="calendar-view" className="flex-1 flex flex-col h-full bg-white select-none font-sans overflow-hidden">
      {/* Header del Calendario */}
      <div className="p-4 border-b border-[#ececec] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#fbfbfa]">
        <div className="flex items-center space-x-3">
          <h2 className="text-lg font-bold text-[#37352F] capitalize">
            {monthNames[month]} {year}
          </h2>
          <div className="flex items-center space-x-1 border border-[#ececec] rounded bg-white p-0.5">
            <button
              onClick={prevMonth}
              className="p-1 hover:bg-[#efefef] rounded text-gray-600 transition-colors"
              title="Mes Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={goToToday}
              className="px-2 py-0.5 text-xs font-semibold text-[#37352F] hover:bg-[#efefef] rounded transition-colors"
            >
              Hoy
            </button>
            <button
              onClick={nextMonth}
              className="p-1 hover:bg-[#efefef] rounded text-gray-600 transition-colors"
              title="Mes Siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <span className="text-[11px] text-[#8A8984]">
            Mostrando eventos públicos y de tu departamento ({currentUser.department})
          </span>
          <button
            onClick={() => onCreateEvent()}
            className="px-3 py-1.5 bg-[#37352F] hover:bg-[#4a4841] text-white rounded text-xs font-semibold flex items-center space-x-1 transition-colors shadow-2xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Crear Evento</span>
          </button>
        </div>
      </div>

      {/* Días de la semana */}
      <div className="grid grid-cols-7 border-b border-[#ececec] bg-[#fbfbfa] text-[10px] font-bold text-[#8A8984] uppercase tracking-wider text-center py-2">
        {daysOfWeek.map((day, idx) => (
          <div key={day} className={idx === 0 || idx === 6 ? 'text-red-400' : ''}>
            {day}
          </div>
        ))}
      </div>

      {/* Cuadrícula de Días */}
      <div className="flex-1 grid grid-cols-7 grid-rows-6 border-b border-[#ececec] overflow-y-auto bg-white">
        {/* Mes Anterior */}
        {prevMonthDays.map(day => (
          <div key={`prev-${day}`} className="border-r border-b border-[#ececec] p-1 bg-[#fafafa] text-gray-300 text-xs">
            <span className="font-semibold">{day}</span>
          </div>
        ))}

        {/* Mes Actual */}
        {currentMonthDays.map(day => {
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const dayEvents = visibleEventos.filter(e => e.date === dateStr);
          const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();

          return (
            <div
              key={`current-${day}`}
              onClick={() => onCreateEvent(dateStr)}
              className={`border-r border-b border-[#ececec] p-1 sm:p-1.5 flex flex-col justify-between group hover:bg-[#fbfbfa] transition-colors relative cursor-pointer min-h-[70px] ${
                isToday ? 'bg-blue-50/20' : ''
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className={`text-xs font-bold leading-none w-5 h-5 flex items-center justify-center rounded-full ${
                  isToday ? 'bg-[#37352F] text-white' : 'text-[#37352F]'
                }`}>
                  {day}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCreateEvent(dateStr);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-[#efefef] rounded text-gray-400 hover:text-gray-700 transition-all"
                  title="Agendar en este día"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              {/* Eventos del día */}
              <div className="space-y-1 overflow-y-auto max-h-20 flex-1">
                {dayEvents.map(evt => {
                  const now = new Date();
                  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                  const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
                  
                  let displayStatus = "";
                  if (evt.status === 'aprobado' || evt.status === 'programado' || evt.status === 'realizado') {
                    if (evt.date < todayStr || (evt.date === todayStr && evt.endTime < currentTimeStr)) {
                      displayStatus = ' (Finalizado)';
                    } else if (evt.date === todayStr && evt.startTime <= currentTimeStr && evt.endTime >= currentTimeStr) {
                      displayStatus = ' (En curso)';
                    }
                  }

                  return (
                    <div
                      key={evt.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectEvent(evt);
                      }}
                      className={`p-1 rounded text-[10px] border truncate transition-all cursor-pointer shadow-2xs hover:scale-[1.02] ${getDepartmentColor(evt.department || 'GENERAL')}`}
                      title={`${evt.title} (${evt.startTime} - ${evt.endTime})${displayStatus}`}
                    >
                      <div className="font-bold truncate">{evt.title}{displayStatus}</div>
                      <div className="text-[9px] opacity-80 font-mono truncate">{evt.startTime}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Mes Siguiente */}
        {nextMonthDays.map(day => (
          <div key={`next-${day}`} className="border-r border-b border-[#ececec] p-1 bg-[#fafafa] text-gray-300 text-xs">
            <span className="font-semibold">{day}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
