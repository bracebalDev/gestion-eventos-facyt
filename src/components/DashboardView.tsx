import React, { useState } from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts';
import { 
  Calendar, 
  CheckCircle, 
  Clock, 
  Activity,
  MapPin,
  TrendingUp,
  UserCheck,
  Maximize2,
  X,
  List,
  Filter
} from 'lucide-react';
import { Evento, Espacio, Usuario, EstadoEvento } from '../types';
import { formatDateDDMMAAAA } from '../utils/dateFormatter';

interface DashboardViewProps {
  eventos: Evento[];
  espacios: Espacio[];
  currentUser: Usuario;
  onSelectEvent: (evento: Evento) => void;
  onCreateEvent: () => void;
}

export default function DashboardView({ 
  eventos, 
  espacios, 
  currentUser,
  onSelectEvent, 
  onCreateEvent 
}: DashboardViewProps) {
  // Estado para modales interactivos
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [selectedStatusModal, setSelectedStatusModal] = useState<string | null>(null);

  // REQUERIMIENTO 1 y 5: Visibilidad estricta de eventos según rol y alcance (PUBLICO / DEPARTAMENTAL)
  const visibleEvents = eventos.filter(evt => {
    if (currentUser.role === 'solicitante') {
      const isMyEvent = evt.solicitanteId === currentUser.id;
      const isMyDept = evt.department === currentUser.department;
      const isPublic = evt.scope === 'PUBLICO' || evt.department === 'GENERAL' || evt.isInstitutional;
      const isApproved = evt.status === 'aprobado' || evt.status === 'programado' || evt.status === 'realizado';

      if (isMyEvent) return true;
      if (!isApproved) return false;
      return isMyDept || isPublic;
    } else if (currentUser.role === 'director' && currentUser.department !== 'GENERAL') {
      const isMyDepartment = evt.department === currentUser.department;
      const isPublic = evt.scope === 'PUBLICO' || evt.department === 'GENERAL';
      const isApproved = evt.status === 'aprobado' || evt.status === 'programado' || evt.status === 'realizado';
      return isMyDepartment || (isPublic && isApproved);
    }
    return true;
  });

  // REQUERIMIENTO 1: Filtrar espacios relevantes para Demanda de Espacios
  const visibleEspacios = espacios.filter(sp => {
    if (currentUser.department === 'GENERAL') return true;
    return !sp.department || sp.department === 'GENERAL' || sp.department === 'BIBLIOTECA' || sp.department === currentUser.department;
  });

  // 1. Cálculos de Estadísticas (REQUERIMIENTO 3: Se eliminó la tarjeta de Conflictos)
  const totalEventos = visibleEvents.length;
  const pendientes = visibleEvents.filter(e => e.status === 'solicitado' || e.status === 'en revisión').length;
  const aprobados = visibleEvents.filter(e => e.status === 'aprobado' || e.status === 'programado').length;
  const realizados = visibleEvents.filter(e => e.status === 'realizado').length;

  // Próximos eventos
  const proximosEventos = [...visibleEvents]
    .filter(e => e.status !== 'cancelado' && e.status !== 'rechazado' && e.status !== 'realizado')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 4);

  // 2. Gráfico: Eventos por Estado
  const estadosData = [
    { name: 'Solicitado', key: 'solicitado', cantidad: visibleEvents.filter(e => e.status === 'solicitado').length, color: '#3B82F6' },
    { name: 'En Revisión', key: 'en revisión', cantidad: visibleEvents.filter(e => e.status === 'en revisión').length, color: '#F59E0B' },
    { name: 'Aprobado', key: 'aprobado', cantidad: visibleEvents.filter(e => e.status === 'aprobado').length, color: '#6366F1' },
    { name: 'Programado', key: 'programado', cantidad: visibleEvents.filter(e => e.status === 'programado').length, color: '#06B6D4' },
    { name: 'Realizado', key: 'realizado', cantidad: visibleEvents.filter(e => e.status === 'realizado').length, color: '#10B981' },
    { name: 'Cancelado', key: 'cancelado', cantidad: visibleEvents.filter(e => e.status === 'cancelado').length, color: '#EF4444' },
  ];

  // REQUERIMIENTO 2: Gráfico "Distribución por Tipo de Actividad" con colores vibrantes
  const tiposCounts = visibleEvents.reduce((acc: Record<string, number>, e) => {
    acc[e.activityType] = (acc[e.activityType] || 0) + 1;
    return acc;
  }, {});

  const tiposData = Object.entries(tiposCounts).map(([key, value]) => {
    const labels: Record<string, string> = {
      taller: 'Talleres',
      conversatorio: 'Conversatorios',
      jornada: 'Jornadas',
      charla: 'Charlas',
      reunion: 'Reuniones',
      otro: 'Otros'
    };
    return {
      name: labels[key] || key,
      value
    };
  });

  const VIBRANT_COLORS = ['#8B5CF6', '#EC4899', '#3B82F6', '#10B981', '#F59E0B', '#6366F1'];

  // REQUERIMIENTO 1: Uso de Espacios del Departamento
  const usoEspacios = visibleEspacios.map(sp => {
    const cantidad = visibleEvents.filter(e => e.spaceId === sp.id && e.status !== 'cancelado').length;
    return {
      name: sp.name,
      cantidad,
      capacity: sp.capacity
    };
  }).sort((a, b) => b.cantidad - a.cantidad);

  const espacioMasUtilizado = usoEspacios[0]?.cantidad > 0 ? usoEspacios[0].name : "Ninguno";

  // REQUERIMIENTO TODOS 1: Eventos filtrados para el modal interactivo al hacer clic en tarjetas o barras
  const eventsInStatusModal = selectedStatusModal 
    ? (selectedStatusModal === 'total' 
        ? visibleEvents 
        : (selectedStatusModal === 'aprobado' 
            ? visibleEvents.filter(e => e.status === 'aprobado' || e.status === 'programado') 
            : (selectedStatusModal === 'solicitado' 
                ? visibleEvents.filter(e => e.status === 'solicitado' || e.status === 'en revisión') 
                : visibleEvents.filter(e => e.status === selectedStatusModal))))
    : [];

  return (
    <div id="dashboard-view" className="flex-1 overflow-y-auto bg-white p-4 md:p-6 font-sans">
      {/* Header */}
      <div id="dashboard-header" className="max-w-6xl mx-auto mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#37352F]">Tablero de Control</h1>
          <p className="text-xs text-[#8A8984] mt-0.5">
            Análisis en tiempo real para la toma de decisiones de la Facultad de Ciencias y Tecnología.
          </p>
        </div>
        <button
          id="btn-quick-create"
          onClick={onCreateEvent}
          className="px-3.5 py-2 bg-[#37352F] hover:bg-[#4a4841] text-white rounded text-xs font-semibold transition-colors shadow-2xs self-start md:self-auto cursor-pointer"
        >
          + Solicitar Evento
        </button>
      </div>

      <div id="dashboard-content" className="max-w-6xl mx-auto space-y-6">
        {/* Stats Grid (CLICKEABLES REQUERIMIENTO TODOS 1) */}
        <div id="stats-grid" className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div 
            onClick={() => setSelectedStatusModal('total')}
            className="p-3.5 rounded-xl bg-[#FAF9F6] border border-[#ececec] hover:border-purple-300 hover:shadow-md transition-all cursor-pointer flex items-center space-x-3 group"
            title="Haz clic para ver el listado de todos los eventos"
          >
            <div className="p-2 rounded-lg bg-white border border-[#ececec] text-gray-700 group-hover:bg-purple-50 group-hover:text-purple-700 transition-colors">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-[#8A8984] block font-bold uppercase tracking-wider">Total Eventos</span>
              <span className="text-lg font-bold text-[#37352F] group-hover:text-purple-700 transition-colors">{totalEventos}</span>
            </div>
          </div>

          <div 
            onClick={() => setSelectedStatusModal('solicitado')}
            className="p-3.5 rounded-xl bg-[#FAF9F6] border border-[#ececec] hover:border-amber-300 hover:shadow-md transition-all cursor-pointer flex items-center space-x-3 group"
            title="Haz clic para ver eventos pendientes"
          >
            <div className="p-2 rounded-lg bg-white border border-[#ececec] text-amber-600 group-hover:bg-amber-50 transition-colors">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-[#8A8984] block font-bold uppercase tracking-wider">Pendientes</span>
              <span className="text-lg font-bold text-[#37352F] group-hover:text-amber-700 transition-colors">{pendientes}</span>
            </div>
          </div>

          <div 
            onClick={() => setSelectedStatusModal('aprobado')}
            className="p-3.5 rounded-xl bg-[#FAF9F6] border border-[#ececec] hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer flex items-center space-x-3 group"
            title="Haz clic para ver eventos aprobados / programados"
          >
            <div className="p-2 rounded-lg bg-white border border-[#ececec] text-emerald-600 group-hover:bg-emerald-50 transition-colors">
              <CheckCircle className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-[#8A8984] block font-bold uppercase tracking-wider">Aprobados / Prog.</span>
              <span className="text-lg font-bold text-[#37352F] group-hover:text-emerald-700 transition-colors">{aprobados}</span>
            </div>
          </div>

          <div 
            onClick={() => setSelectedStatusModal('realizado')}
            className="p-3.5 rounded-xl bg-[#FAF9F6] border border-[#ececec] hover:border-blue-300 hover:shadow-md transition-all cursor-pointer flex items-center space-x-3 group"
            title="Haz clic para ver eventos realizados"
          >
            <div className="p-2 rounded-lg bg-white border border-[#ececec] text-blue-600 group-hover:bg-blue-50 transition-colors">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-[#8A8984] block font-bold uppercase tracking-wider">Realizados</span>
              <span className="text-lg font-bold text-[#37352F] group-hover:text-blue-700 transition-colors">{realizados}</span>
            </div>
          </div>
        </div>

        {/* Dynamic Insights Bar */}
        <div id="ai-insight-bar" className="p-3.5 rounded bg-[#FBFBFA] border border-[#ececec] flex items-start space-x-3">
          <TrendingUp className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-[#37352f] leading-relaxed">
            <span className="font-bold text-[#37352f] inline">Recomendación de Planificación:</span>
            <span> El espacio más demandado en tu área académica es </span>
            <strong className="font-semibold underline">{espacioMasUtilizado}</strong>.
            <span> La planificación del área es consistente y las coincidencias de horario están bloqueadas por el sistema.</span>
          </div>
        </div>

        {/* Charts & Graphics Section */}
        <div id="charts-section" className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Chart 1: Eventos por Estado con Interacción al Hacer Clic (REQUERIMIENTO 8) */}
          <div id="chart-card-estados" className="p-4 border border-[#ececec] rounded bg-white relative">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xs font-bold text-[#9b9a97] uppercase tracking-wider">
                Estado de los Eventos en el Proceso
              </h3>
              <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                Haz clic en una barra para ver detalles
              </span>
            </div>

            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={estadosData} margin={{ top: 10, right: 10, left: -30, bottom: 5 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#8A8984' }} axisLine={{ stroke: '#ececec' }} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#8A8984' }} axisLine={{ stroke: '#ececec' }} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '6px', border: '1px solid #ececec', fontSize: '11px' }}
                    labelStyle={{ fontWeight: 'bold', color: '#37352F' }}
                  />
                  <Bar 
                    dataKey="cantidad" 
                    radius={[4, 4, 0, 0]}
                    onClick={(data) => {
                      if (data && data.key) {
                        setSelectedStatusModal(data.key);
                      }
                    }}
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    {estadosData.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Distribución por Tipo con Colores Vibrantes y Clic para Agrandar (REQUERIMIENTO 2) */}
          <div id="chart-card-tipos" className="p-4 border border-[#ececec] rounded bg-white flex flex-col relative group">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xs font-bold text-[#9b9a97] uppercase tracking-wider">
                Distribución por Tipo de Actividad
              </h3>
              <button
                onClick={() => setIsActivityModalOpen(true)}
                className="p-1 text-gray-400 hover:text-purple-700 hover:bg-purple-50 rounded transition-colors"
                title="Agrandar Gráfico en Pantalla Completa"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>

            {tiposData.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-gray-400 text-xs">
                No hay suficientes datos para generar distribución.
              </div>
            ) : (
              <div 
                onClick={() => setIsActivityModalOpen(true)} 
                className="flex-1 grid grid-cols-1 sm:grid-cols-2 items-center cursor-pointer"
              >
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={tiposData}
                        cx="50%"
                        cy="50%"
                        innerRadius={38}
                        outerRadius={58}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {tiposData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={VIBRANT_COLORS[index % VIBRANT_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ fontSize: '11px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-1.5 px-2 text-[11px]">
                  {tiposData.map((entry, index) => (
                    <div key={entry.name} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: VIBRANT_COLORS[index % VIBRANT_COLORS.length] }}></div>
                        <span className="text-gray-600 font-medium">{entry.name}:</span>
                      </div>
                      <span className="text-[#37352F] font-bold font-mono">{entry.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Lower Row: Upcoming Events & Space Utilization (Filtered by Dept) */}
        <div id="lower-dashboard-row" className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Upcoming Events List */}
          <div id="upcoming-events-card" className="lg:col-span-2 p-4 border border-[#ececec] rounded bg-white flex flex-col">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xs font-bold text-[#9b9a97] uppercase tracking-wider">
                Próximos Eventos Programados
              </h3>
              <span className="text-[10px] text-[#8A8984] font-medium">Cronograma Activo</span>
            </div>
            
            {proximosEventos.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-6 text-center bg-[#FAF9F6] border border-[#ececec] border-dashed rounded">
                <Calendar className="w-6 h-6 text-gray-300 mb-1.5" />
                <span className="text-xs text-gray-500">No hay próximos eventos programados</span>
              </div>
            ) : (
              <div className="space-y-2 flex-1">
                {proximosEventos.map((evt) => {
                  const space = espacios.find(s => s.id === evt.spaceId);
                  return (
                    <div 
                      id={`upcoming-event-item-${evt.id}`}
                      key={evt.id}
                      onClick={() => onSelectEvent(evt)}
                      className="group p-2.5 border border-[#ececec] hover:border-gray-300 rounded bg-white hover:bg-[#FAF9F6] transition-all cursor-pointer flex justify-between items-center"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-xs text-[#37352F] group-hover:text-blue-600 transition-colors">
                            {evt.title}
                          </span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded font-mono bg-[#efefef] text-gray-600 border border-[#ececec] uppercase">
                            {evt.status}
                          </span>
                          <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${evt.scope === 'PUBLICO' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'}`}>
                            {evt.scope || 'DEPARTAMENTAL'}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-400">
                          <span className="font-semibold text-gray-700">{formatDateDDMMAAAA(evt.date)}</span>
                          <span>•</span>
                          <span>{evt.startTime} - {evt.endTime}</span>
                          <span>•</span>
                          <span className="flex items-center text-gray-600 font-medium">
                            <MapPin className="w-3 h-3 mr-0.5" />
                            {space?.name || "Espacio no asignado"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Space Demand List (REQUERIMIENTO 1: Filtrado por departamento) */}
          <div id="spaces-occupancy-card" className="p-4 border border-[#ececec] rounded bg-white flex flex-col">
            <h3 className="text-xs font-bold text-[#9b9a97] mb-3 uppercase tracking-wider">
              Demanda de Espacios Físicos ({currentUser.department})
            </h3>
            
            <div className="space-y-3 flex-1">
              {usoEspacios.map((sp, idx) => (
                <div key={sp.name} className="space-y-1">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="font-semibold text-[#37352F] truncate max-w-[130px]">{sp.name}</span>
                    <span className="text-gray-400 font-mono text-[10px]">
                      {sp.cantidad} {sp.cantidad === 1 ? 'evento' : 'eventos'}
                    </span>
                  </div>
                  <div className="w-full bg-[#f1f1f0] h-1.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        idx === 0 ? 'bg-purple-600' :
                        idx === 1 ? 'bg-indigo-500' :
                        'bg-gray-300'
                      }`}
                      style={{ width: `${Math.min(100, (sp.cantidad / (totalEventos || 1)) * 100)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="pt-3 border-t border-[#ececec] mt-3 text-[10px] text-gray-400 flex items-center space-x-1">
              <UserCheck className="w-3.5 h-3.5 text-gray-300" />
              <span>Espacios de tu área y generales de FaCyT.</span>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL LIGHTBOX: Gráfico de Tipos de Actividad Agrandado (REQUERIMIENTO 2) */}
      {isActivityModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full p-6 space-y-4 shadow-2xl border border-[#ececec] animate-fade-in">
            <div className="flex justify-between items-center border-b border-[#ececec] pb-3">
              <h2 className="text-base font-bold text-[#37352F]">
                📊 Distribución por Tipo de Actividad (Vista Ampliada)
              </h2>
              <button
                onClick={() => setIsActivityModalOpen(false)}
                className="p-1 hover:bg-gray-100 rounded text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-6 py-4">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={tiposData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={95}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {tiposData.map((entry, index) => (
                        <Cell key={`cell-zoom-${index}`} fill={VIBRANT_COLORS[index % VIBRANT_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-3">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Desglose Detallado</h3>
                <div className="space-y-2">
                  {tiposData.map((entry, index) => (
                    <div key={entry.name} className="flex items-center justify-between p-2 rounded bg-[#FAF9F6] border border-[#ececec] text-xs">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: VIBRANT_COLORS[index % VIBRANT_COLORS.length] }}></div>
                        <span className="font-bold text-[#37352F]">{entry.name}</span>
                      </div>
                      <span className="font-mono font-bold text-purple-700 text-sm">{entry.value} evento(s)</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#ececec] flex justify-end">
              <button
                onClick={() => setIsActivityModalOpen(false)}
                className="px-4 py-1.5 bg-[#37352F] text-white rounded text-xs font-bold"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL INTERACTIVO: Eventos por Estado al Hacer Clic en Barras (REQUERIMIENTO 8) */}
      {selectedStatusModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 space-y-4 shadow-2xl border border-[#ececec] animate-fade-in max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center border-b border-[#ececec] pb-3">
              <div className="flex items-center space-x-2">
                <span className="text-lg">📋</span>
                <h2 className="text-base font-bold text-[#37352F]">
                  Eventos en Estado: <span className="uppercase text-purple-700">{selectedStatusModal}</span> ({eventsInStatusModal.length})
                </h2>
              </div>
              <button
                onClick={() => setSelectedStatusModal(null)}
                className="p-1 hover:bg-gray-100 rounded text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 py-2">
              {eventsInStatusModal.length === 0 ? (
                <p className="text-xs text-gray-400 italic text-center py-8">No hay eventos en esta categoría actualmente.</p>
              ) : (
                eventsInStatusModal.map((evt) => {
                  const space = espacios.find(s => s.id === evt.spaceId);
                  return (
                    <div
                      key={evt.id}
                      onClick={() => {
                        setSelectedStatusModal(null);
                        onSelectEvent(evt);
                      }}
                      className="p-3.5 border border-[#ececec] hover:border-purple-200 rounded-lg bg-[#FAF9F6] hover:bg-white transition-all cursor-pointer space-y-1"
                    >
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-xs text-[#37352F]">{evt.title}</h4>
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded font-mono text-[9px] font-bold uppercase">
                          {evt.department || 'GENERAL'}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-600 line-clamp-1">{evt.description || 'Sin descripción'}</p>
                      <div className="flex items-center space-x-3 text-[10px] text-gray-500 pt-1">
                        <span className="font-bold text-gray-700">{formatDateDDMMAAAA(evt.date)}</span>
                        <span>•</span>
                        <span>{evt.startTime} - {evt.endTime}</span>
                        <span>•</span>
                        <span>{space?.name || 'Espacio no asignado'}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-3 border-t border-[#ececec] flex justify-end">
              <button
                onClick={() => setSelectedStatusModal(null)}
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
