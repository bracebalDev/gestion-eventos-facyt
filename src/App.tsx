import React, { useState, useEffect } from 'react';
import { 
  X, 
  MapPin, 
  User, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  Sparkles, 
  FileText, 
  Loader2,
  Printer,
  UserPlus,
  Radio,
  Check,
  XCircle,
  Bell,
  Menu,
  Users,
  BarChart3
} from 'lucide-react';
import Sidebar from './components/Sidebar';
import DashboardView from './components/DashboardView';
import EventsListView from './components/EventsListView';
import CalendarView from './components/CalendarView';
import SpacesView from './components/SpacesView';
import RecentEventsView from './components/RecentEventsView';
import AnalysisView from './components/AnalysisView';
import UserManagementView from './components/UserManagementView';
import AdminPanel from './components/AdminPanel';
import ReportsView from './components/ReportsView';
import EventModal from './components/EventModal';
import ProfileModal from './components/ProfileModal';
import AuthScreen from './components/AuthScreen';
import { Espacio, Evento, EstadoEvento, Usuario, Departamento } from './types';
import { exportAttendancePDF } from './utils/pdfGenerator';
import { formatDateDDMMAAAA } from './utils/dateFormatter';

export default function App() {
  // Estado general
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [espacios, setEspacios] = useState<Espacio[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);

  // Reloj en tiempo real de Venezuela
  const [venezuelaClock, setVenezuelaClock] = useState<string>('');
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const formatted = now.toLocaleString('es-VE', {
        timeZone: 'America/Caracas',
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
      // Capitalizar primera letra
      setVenezuelaClock(formatted.charAt(0).toUpperCase() + formatted.slice(1));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const [currentUser, setCurrentUser] = useState<Usuario | null>(() => {
    const saved = sessionStorage.getItem('currentUser');
    return saved ? JSON.parse(saved) : null;
  });

  // Resetea el tab al dashboard si el usuario acaba de loguearse
  const [prevUser, setPrevUser] = useState<Usuario | null>(currentUser);
  useEffect(() => {
    if (currentUser && !prevUser) {
      setCurrentTab('dashboard');
    }
    setPrevUser(currentUser);
  }, [currentUser, prevUser]);

  // Estado formulario de asistente por cédula en flyout
  const [attCedula, setAttCedula] = useState('');
  const [attName, setAttName] = useState('');
  const [attLastName, setAttLastName] = useState('');
  const [attDept, setAttDept] = useState<Departamento>('COMPUTACION');
  const [attError, setAttError] = useState('');

  // Guardar en sessionStorage cuando cambie el usuario
  useEffect(() => {
    if (currentUser) {
      sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
    } else {
      sessionStorage.removeItem('currentUser');
      sessionStorage.removeItem('lastActiveTime');
    }
  }, [currentUser]);

  // REQUERIMIENTO 4: Control de Expiración de Sesión de 10 Minutos
  const SESSION_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutos

  useEffect(() => {
    if (!currentUser) return;

    // Verificar inactividad o cierre previo
    const savedTime = sessionStorage.getItem('lastActiveTime');
    if (savedTime) {
      const elapsed = Date.now() - Number(savedTime);
      if (elapsed > SESSION_TIMEOUT_MS) {
        console.warn("Sesión expirada por inactividad de más de 10 minutos.");
        setCurrentUser(null);
        sessionStorage.removeItem('currentUser');
        sessionStorage.removeItem('lastActiveTime');
        return;
      }
    }

    sessionStorage.setItem('lastActiveTime', Date.now().toString());

    const updateActivity = () => {
      sessionStorage.setItem('lastActiveTime', Date.now().toString());
    };

    window.addEventListener('click', updateActivity);
    window.addEventListener('keypress', updateActivity);
    window.addEventListener('mousemove', updateActivity);

    // Comprobación periódica cada 10s
    const interval = setInterval(() => {
      const lastActive = sessionStorage.getItem('lastActiveTime');
      if (lastActive && Date.now() - Number(lastActive) > SESSION_TIMEOUT_MS) {
        setCurrentUser(null);
        sessionStorage.removeItem('currentUser');
        sessionStorage.removeItem('lastActiveTime');
        alert("Tu sesión ha expirado tras 10 minutos de inactividad o al cerrar la ventana. Por favor inicia sesión nuevamente.");
      }
    }, 10000);

    return () => {
      window.removeEventListener('click', updateActivity);
      window.removeEventListener('keypress', updateActivity);
      window.removeEventListener('mousemove', updateActivity);
      clearInterval(interval);
    };
  }, [currentUser]);

  // Estados para el Evento Seleccionado (Notion Page Flyout)
  const [inspectedEvent, setInspectedEvent] = useState<Evento | null>(null);

  // Estados para Modales
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [eventToEdit, setEventToEdit] = useState<Evento | undefined>(undefined);
  const [modalDefaultDate, setModalDefaultDate] = useState<string | undefined>(undefined);

  const handleOpenModalForNew = (defaultDate?: string) => {
    setEventToEdit(undefined);
    setModalDefaultDate(defaultDate);
    setIsModalOpen(true);
  };

  // 1. Cargar base de datos al iniciar
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/db');
      if (!res.ok) throw new Error('Error recuperando la base de datos');
      const data = await res.json();
      setEventos(data.eventos || []);
      setEspacios(data.espacios || []);
    } catch (err) {
      console.error("No se pudo cargar la base de datos:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 2. Operación de Re-sembrado de Demo
  const handleResetDb = async () => {
    try {
      setIsResetting(true);
      const res = await fetch('/api/db/reset', { 
        method: 'POST',
        headers: {
          'x-user-id': currentUser?.id || '',
          'x-user-role': currentUser?.role || ''
        }
      });
      if (!res.ok) throw new Error('Error al re-sembrar la base de datos');
      const result = await res.json();
      setEventos(result.data.eventos);
      setEspacios(result.data.espacios);
      setInspectedEvent(null);
      alert("Base de datos re-sembrada con éxito con datos realistas para la evaluación.");
    } catch (err: any) {
      alert("Error restaurando la base de datos: " + err.message);
    } finally {
      setIsResetting(false);
    }
  };

  // 3. Crear o Editar Evento (REQUERIMIENTO 2: Denegar por coincidencia)
  const handleSaveEvent = async (eventData: Partial<Evento>) => {
    const isEdit = !!eventData.id;
    const url = isEdit ? `/api/events/${eventData.id}` : '/api/events';
    const method = isEdit ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventData)
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || 'Error al guardar el evento');
    }

    const saved = await res.json();
    await fetchData();
    
    if (inspectedEvent && inspectedEvent.id === saved.id) {
      setInspectedEvent(saved);
    }

    setIsModalOpen(false);
    setEventToEdit(undefined);
    setModalDefaultDate(undefined);
  };

  // 4. Eliminar Evento
  const handleDeleteEvent = async (id: string) => {
    try {
      const res = await fetch(`/api/events/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar');
      
      if (inspectedEvent?.id === id) {
        setInspectedEvent(null);
      }

      await fetchData();
    } catch (err: any) {
      alert("Error eliminando el evento: " + err.message);
    }
  };

  // 5. Actualizar Estado Rápidamente
  const handleUpdateStatus = async (id: string, newStatus: EstadoEvento) => {
    try {
      const res = await fetch(`/api/events/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Error actualizando estado');
      }
      
      await fetchData();

      if (inspectedEvent?.id === id) {
        setInspectedEvent(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // 6. Agregar Espacio
  const handleAddSpace = async (spaceData: Omit<Espacio, 'id'>) => {
    try {
      const res = await fetch('/api/spaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(spaceData)
      });
      if (!res.ok) throw new Error('Error registrando espacio');
      await fetchData();
      alert("Nuevo espacio registrado con éxito en el catálogo de FaCyT.");
    } catch (err: any) {
      alert("Error registrando espacio: " + err.message);
    }
  };

  // Inscripción pública a eventos recientes
  const handleRegisterPublic = async (eventId: string) => {
    if (!currentUser) return;
    const res = await fetch(`/api/events/${eventId}/register-public`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: currentUser.id,
        name: currentUser.name,
        lastName: currentUser.lastName || '',
        cedula: currentUser.cedula || '',
        department: currentUser.department
      })
    });
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || 'No se pudo realizar la inscripción.');
    }
    await fetchData();
  };

  const handleUnregisterPublic = async (eventId: string) => {
    if (!currentUser) return;
    const res = await fetch(`/api/events/${eventId}/register-public/${currentUser.id}`, {
      method: 'DELETE'
    });
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || 'No se pudo cancelar la inscripción.');
    }
    await fetchData();
  };

  // Agregar asistente por cédula
  const handleAddAttendeeByCedula = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inspectedEvent) return;
    setAttError('');

    try {
      const res = await fetch(`/api/events/${inspectedEvent.id}/attendees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cedula: attCedula,
          name: attName,
          lastName: attLastName,
          department: attDept
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      await fetchData();
      setInspectedEvent(data);

      setAttCedula('');
      setAttName('');
      setAttLastName('');
    } catch (err: any) {
      setAttError(err.message);
    }
  };

  // Responder a una invitación (Aprobar o Rechazar)
  const handleRespondInvitation = async (eventId: string, cedula: string, status: 'aprobado' | 'rechazado') => {
    try {
      const res = await fetch(`/api/events/${eventId}/attendees/${cedula}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error('Error al actualizar invitación');
      await fetchData();
    } catch (err: any) {
      alert("Error procesando respuesta: " + err.message);
    }
  };

  const handleSaveInspectedNotes = async (text: string) => {
    if (!inspectedEvent) return;
    try {
      const res = await fetch(`/api/events/${inspectedEvent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: text })
      });
      if (!res.ok) throw new Error('Error guardando notas');
      const updated = await res.json();
      await fetchData();
      setInspectedEvent(updated);
    } catch (err: any) {
      console.error(err);
    }
  };

  const getSpaceName = (id: string) => {
    const space = espacios.find(s => s.id === id);
    return space ? space.name : 'Espacio no asignado';
  };

  // Invitaciones pendientes por cédula
  const pendingInvitations = currentUser ? eventos.filter(e => 
    e.attendees && e.attendees.some(a => 
      (a.cedula === currentUser.cedula || a.name.toLowerCase().includes(currentUser.name.toLowerCase())) && a.status === 'pendiente'
    )
  ) : [];

  // REQUERIMIENTO 6: Permiso para ver lista de asistentes y exportar PDF
  const canAccessAttendees = (evt: Evento) => {
    if (!currentUser) return false;
    if (currentUser.role === 'director') {
      return currentUser.department === 'GENERAL' || currentUser.department === evt.department;
    }
    return evt.solicitanteId === currentUser.id;
  };

  const canExportPdf = (evt: Evento) => {
    return canAccessAttendees(evt) && (evt.status === 'aprobado' || evt.status === 'programado' || evt.status === 'realizado');
  };

  if (!currentUser) {
    return <AuthScreen onLoginSuccess={setCurrentUser} />;
  }

  return (
    <div id="app-root-container" className="flex h-screen overflow-hidden bg-white select-none font-sans">
      {/* Sidebar Component */}
      <Sidebar 
        currentTab={currentTab} 
        setCurrentTab={(tab) => {
          setCurrentTab(tab);
          setInspectedEvent(null);
        }}
        onResetDb={handleResetDb}
        isResetting={isResetting}
        currentUser={currentUser}
        onLogout={() => setCurrentUser(null)}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Workspace Frame */}
      <div id="main-frame-content" className="flex-1 flex flex-col overflow-hidden relative bg-white">
        {/* Header/Breadcrumbs */}
        <header className="h-11 flex items-center px-4 justify-between border-b border-[#ececec] bg-white">
          <div className="flex items-center text-xs space-x-2">
            <button 
              onClick={() => setIsMobileSidebarOpen(true)}
              className="p-1 hover:bg-gray-100 rounded md:hidden mr-1 text-gray-600"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="font-semibold text-[#37352f] truncate max-w-[150px] sm:max-w-none">
              {currentTab === 'dashboard' && '📊 Tablero de Control'}
              {currentTab === 'recent' && '🌟 Eventos Recientes (Aforo)'}
              {currentTab === 'calendar' && '📅 Calendario Mensual'}
              {currentTab === 'events' && '📅 Gestión de Eventos'}
              {currentTab === 'spaces' && '🏛️ Aulas y Espacios'}
              {currentTab === 'analysis' && '📊 Resumen de Gestión'}
              {currentTab === 'user-management' && '👥 Registro de Usuarios'}
              {currentTab === 'admin-panel' && '🛡️ Panel de Administración'}
              {currentTab === 'reports' && '📄 Exportar Reportes'}
            </span>
          </div>

          {/* Reloj Venezuela - Centro */}
          <div className="hidden md:flex items-center text-[11px] text-[#5a5a57] font-medium">
            <Clock className="w-3.5 h-3.5 mr-1.5 text-[#9b9a97]" />
            <span>{venezuelaClock}</span>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3 text-xs">
            {pendingInvitations.length > 0 && (
              <span className="px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-200 rounded font-bold flex items-center space-x-1 animate-pulse">
                <Bell className="w-3 h-3 text-amber-600" />
                <span className="hidden sm:inline">{pendingInvitations.length} invitación(es)</span>
              </span>
            )}
            <span className="text-[#9b9a97] hidden md:flex items-center">
              <span className="inline-block w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse mr-1.5"></span>
              Sincronizado
            </span>
            <span className="text-gray-200 hidden sm:inline">|</span>
            <div className="flex items-center space-x-1.5">
              <button 
                onClick={() => setCurrentTab('recent')} 
                className="px-2 py-0.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded font-semibold transition-colors flex items-center space-x-1 text-[11px]"
              >
                <Radio className="w-3 h-3 text-emerald-600" />
                <span className="hidden sm:inline">Eventos Recientes</span>
              </button>
            </div>
          </div>
        </header>

        {/* NOTIFICACIONES DE INVITACIONES PENDIENTES */}
        {pendingInvitations.length > 0 && (
          <div className="bg-amber-50 border-b border-amber-200 p-3 px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-amber-900">
            <div className="flex items-center space-x-2">
              <Bell className="w-4 h-4 text-amber-600 flex-shrink-0 animate-bounce" />
              <span>
                <strong>¡Tienes invitaciones por cédula!</strong> Confirma tu asistencia antes de que inicie la actividad.
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {pendingInvitations.map(inv => (
                <div key={inv.id} className="flex items-center space-x-1.5 bg-white border border-amber-200 px-2 py-1 rounded shadow-2xs">
                  <span className="font-semibold truncate max-w-[120px]">{inv.title}</span>
                  <button
                    onClick={() => currentUser.cedula && handleRespondInvitation(inv.id, currentUser.cedula, 'aprobado')}
                    className="p-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                    title="Aprobar Invitación"
                  >
                    <Check className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => currentUser.cedula && handleRespondInvitation(inv.id, currentUser.cedula, 'rechazado')}
                    className="p-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                    title="Rechazar Invitación"
                  >
                    <XCircle className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Core Tab Body & Slide out flyout */}
        <div className="flex-1 flex flex-row overflow-hidden relative">
          {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center bg-[#FAF9F6] space-y-4 text-center">
              <Loader2 className="w-10 h-10 text-gray-700 animate-spin" />
              <span className="text-sm text-gray-500 font-semibold font-mono">
                Iniciando Entorno de Gestión FaCyT...
              </span>
            </div>
          ) : (
            <>
              {/* Tab Routing */}
              {currentTab === 'dashboard' && (
                <DashboardView 
                  eventos={eventos} 
                  espacios={espacios} 
                  currentUser={currentUser}
                  onSelectEvent={(evt) => setInspectedEvent(evt)}
                  onCreateEvent={() => handleOpenModalForNew()}
                />
              )}

              {currentTab === 'recent' && (
                <RecentEventsView
                  eventos={eventos}
                  espacios={espacios}
                  currentUser={currentUser}
                  onRegisterPublic={handleRegisterPublic}
                  onUnregisterPublic={handleUnregisterPublic}
                  onSelectEvent={(evt) => setInspectedEvent(evt)}
                  onExportPdf={(evt) => exportAttendancePDF(evt, espacios)}
                />
              )}

              {currentTab === 'calendar' && (
                <CalendarView 
                  eventos={eventos} 
                  currentUser={currentUser}
                  onSelectEvent={(evt) => setInspectedEvent(evt)}
                  onCreateEvent={(defaultDate) => handleOpenModalForNew(defaultDate)}
                />
              )}

              {currentTab === 'events' && (
                <EventsListView 
                  eventos={eventos} 
                  espacios={espacios} 
                  currentUser={currentUser}
                  onSelectEvent={(evt) => setInspectedEvent(evt)}
                  onEditEvent={(evt) => {
                    setEventToEdit(evt);
                    setIsModalOpen(true);
                  }}
                  onDeleteEvent={handleDeleteEvent}
                  onUpdateStatus={handleUpdateStatus}
                  onCreateEvent={() => handleOpenModalForNew()}
                />
              )}

              {currentTab === 'spaces' && (
                <SpacesView 
                  espacios={espacios} 
                  eventos={eventos}
                  currentUser={currentUser}
                  onAddSpace={handleAddSpace}
                />
              )}

              {currentTab === 'analysis' && currentUser.role === 'director' && (
                <AnalysisView
                  eventos={eventos}
                  espacios={espacios}
                  currentUser={currentUser}
                  onSelectEvent={(evt) => setInspectedEvent(evt)}
                />
              )}

              {currentTab === 'user-management' && currentUser.role === 'director' && currentUser.department === 'GENERAL' && (
                <UserManagementView />
              )}

              {currentTab === 'admin-panel' && currentUser.role === 'admin' && (
                <AdminPanel currentUser={currentUser} />
              )}

              {currentTab === 'reports' && currentUser.role === 'director' && (
                <ReportsView eventos={eventos} espacios={espacios} currentUser={currentUser} />
              )}

              {/* NOTION-STYLE EVENT PAGE INSPECT DRAWER */}
              {inspectedEvent && (
                <div 
                  id="notion-flyout-backdrop" 
                  className="absolute inset-0 bg-black/10 z-30 flex justify-end"
                  onClick={() => setInspectedEvent(null)}
                >
                  <div 
                    id="notion-flyout-content"
                    className="w-full max-w-xl bg-white border-l border-[#ececec] h-full shadow-2xl flex flex-col justify-between animate-fade-in"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Top Bar Actions */}
                    <div className="p-4 border-b border-[#ececec] flex items-center justify-between bg-[#FBFBFA] text-xs">
                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4 text-gray-500" />
                        <span className="font-semibold text-[#37352f]">Página del Evento — FaCyT</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {canExportPdf(inspectedEvent) && (
                          <button
                            id="flyout-btn-pdf"
                            onClick={() => exportAttendancePDF(inspectedEvent, espacios)}
                            className="p-1 px-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-[11px] font-bold flex items-center space-x-1 shadow-2xs transition-colors"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Exportar PDF</span>
                          </button>
                        )}
                        <button
                          id="flyout-btn-edit"
                          onClick={() => {
                            setEventToEdit(inspectedEvent);
                            setIsModalOpen(true);
                          }}
                          className="p-1 px-2 border border-[#ececec] bg-white hover:bg-[#efefef] rounded text-[11px] font-semibold text-[#37352f] transition-colors"
                        >
                          Editar
                        </button>
                        <button
                          id="flyout-btn-delete"
                          onClick={() => handleDeleteEvent(inspectedEvent.id)}
                          className="p-1 px-2 border border-red-100 bg-red-50 hover:bg-red-100 rounded text-[11px] font-semibold text-red-600 transition-colors"
                        >
                          Eliminar
                        </button>
                        <button
                          id="flyout-btn-close"
                          onClick={() => setInspectedEvent(null)}
                          className="p-1.5 hover:bg-[#efefef] rounded text-gray-500 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Document Body */}
                    <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
                      <div className="space-y-3">
                        <div className="text-4xl">🎓</div>
                        <h2 className="text-2xl font-bold tracking-tight text-[#37352F] leading-tight">
                          {inspectedEvent.title}
                        </h2>
                      </div>

                      {/* Meta Properties Table */}
                      <div className="space-y-2.5 py-4 border-y border-[#ececec] text-xs text-[#5A5A57]">
                        <div className="grid grid-cols-3 items-center">
                          <span className="font-medium text-[#9b9a97]">Estado de la Solicitud</span>
                          <div className="col-span-2">
                            <select
                              id="flyout-status-select"
                              value={inspectedEvent.status}
                              onChange={(e) => handleUpdateStatus(inspectedEvent.id, e.target.value as EstadoEvento)}
                              disabled={currentUser.role !== 'director' || (currentUser.department !== 'GENERAL' && currentUser.department !== inspectedEvent.department)}
                              className="p-1 border border-[#ececec] bg-white rounded-md font-semibold text-[#37352F] disabled:opacity-50"
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
                        </div>

                        <div className="grid grid-cols-3 items-center">
                          <span className="font-medium text-[#9b9a97]">Espacio Asignado</span>
                          <span className="col-span-2 font-semibold text-[#37352F] flex items-center space-x-1">
                            <MapPin className="w-3.5 h-3.5 text-gray-400 mr-1" />
                            {getSpaceName(inspectedEvent.spaceId)}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 items-center">
                          <span className="font-medium text-[#9b9a97]">Fecha y Horario</span>
                          <span className="col-span-2 font-semibold text-[#37352F] flex items-center">
                            <Calendar className="w-3.5 h-3.5 text-gray-400 mr-1" />
                            {formatDateDDMMAAAA(inspectedEvent.date)} ({inspectedEvent.startTime} - {inspectedEvent.endTime})
                          </span>
                        </div>

                        <div className="grid grid-cols-3 items-center">
                          <span className="font-medium text-[#9b9a97]">Departamento</span>
                          <span className="col-span-2 font-semibold text-[#37352F]">
                            {inspectedEvent.department || 'GENERAL'}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 items-center">
                          <span className="font-medium text-[#9b9a97]">Responsable Académico</span>
                          <span className="col-span-2 font-semibold text-[#37352F] flex items-center">
                            <User className="w-3.5 h-3.5 text-gray-400 mr-1" />
                            {inspectedEvent.responsible}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 items-center">
                          <span className="font-medium text-[#9b9a97]">Aforo Estimado</span>
                          <span className="col-span-2 font-semibold text-[#37352F]">
                            {inspectedEvent.participantsCount} personas
                          </span>
                        </div>
                      </div>

                      {/* Conflict Alert Panel */}
                      {inspectedEvent.conflictWarning && (
                        <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-start space-x-2 text-red-800 text-xs">
                          <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0 animate-pulse" />
                          <div>
                            <span className="font-bold">Advertencia de Conflicto (Buffer 15 min):</span>
                            <p className="mt-0.5">{inspectedEvent.conflictWarning}</p>
                          </div>
                        </div>
                      )}

                      {/* Description Block */}
                      <div className="space-y-2">
                        <span className="text-[11px] font-bold text-[#9b9a97] uppercase tracking-wider block">
                          Descripción de la Actividad
                        </span>
                        <p className="text-sm text-[#37352f] leading-relaxed bg-[#f7f6f3] border border-[#ececec] p-4 rounded-lg">
                          {inspectedEvent.description || "Sin descripción física."}
                        </p>
                      </div>

                      {/* REGISTRO DE ASISTENTES POR CÉDULA (REQUERIMIENTO 6) */}
                      {canAccessAttendees(inspectedEvent) && (inspectedEvent.status === 'aprobado' || inspectedEvent.status === 'programado' || inspectedEvent.status === 'realizado') && (
                        <div className="space-y-3 p-4 border border-[#ececec] rounded-xl bg-[#FAF9F6]">
                          <div className="flex justify-between items-center">
                            <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider flex items-center space-x-1.5">
                              <UserPlus className="w-3.5 h-3.5 text-gray-500" />
                              <span>Asistentes Confirmados / Registro por Cédula</span>
                            </span>
                            {canExportPdf(inspectedEvent) && (
                              <button
                                onClick={() => exportAttendancePDF(inspectedEvent, espacios)}
                                className="px-2 py-1 bg-white border border-[#ececec] hover:bg-gray-100 text-gray-700 rounded text-[10px] font-bold flex items-center space-x-1 shadow-2xs"
                              >
                                <Printer className="w-3 h-3" />
                                <span>Descargar PDF</span>
                              </button>
                            )}
                          </div>

                          {/* Formulario para agregar por cédula */}
                          <form onSubmit={handleAddAttendeeByCedula} className="space-y-2 bg-white p-3 border border-gray-200 rounded-lg text-xs">
                            {attError && <div className="text-red-600 text-[11px]">{attError}</div>}
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="text"
                                placeholder="Nombre *"
                                required
                                value={attName}
                                onChange={(e) => setAttName(e.target.value)}
                                className="p-1.5 border border-gray-200 rounded"
                              />
                              <input
                                type="text"
                                placeholder="Apellido *"
                                required
                                value={attLastName}
                                onChange={(e) => setAttLastName(e.target.value)}
                                className="p-1.5 border border-gray-200 rounded"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="text"
                                placeholder="Cédula (V-000000) *"
                                required
                                value={attCedula}
                                onChange={(e) => setAttCedula(e.target.value)}
                                className="p-1.5 border border-gray-200 rounded font-mono"
                              />
                              <select
                                value={attDept}
                                onChange={(e) => setAttDept(e.target.value as Departamento)}
                                className="p-1.5 border border-gray-200 rounded bg-white"
                              >
                                <option value="COMPUTACION">Computación</option>
                                <option value="BIOLOGIA">Biología</option>
                                <option value="QUIMICA">Química</option>
                                <option value="FISICA">Física</option>
                                <option value="MATEMATICA">Matemática</option>
                                <option value="BIBLIOTECA">Biblioteca</option>
                              </select>
                            </div>
                            <button
                              type="submit"
                              className="w-full py-1.5 bg-[#37352F] hover:bg-[#2b2a25] text-white rounded font-bold shadow-2xs text-xs cursor-pointer"
                            >
                              + Confirmar Asistente por Cédula
                            </button>
                          </form>

                          {/* Lista de asistentes registrados */}
                          <div className="space-y-1">
                            {(!inspectedEvent.attendees || inspectedEvent.attendees.length === 0) ? (
                              <p className="text-[11px] text-gray-400 italic text-center py-2">No hay asistentes ingresados por cédula.</p>
                            ) : (
                              <div className="divide-y divide-gray-200 border border-gray-200 rounded bg-white text-xs max-h-48 overflow-y-auto">
                                {inspectedEvent.attendees.map((att, idx) => (
                                  <div key={idx} className="p-2 flex items-center justify-between">
                                    <div>
                                      <span className="font-bold text-gray-800">{att.name} {att.lastName}</span>
                                      <span className="text-gray-500 font-mono ml-2">({att.cedula})</span>
                                      <span className="text-[10px] text-gray-400 block">{att.department}</span>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold capitalize ${
                                      att.status === 'aprobado' ? 'bg-green-100 text-green-800' :
                                      att.status === 'rechazado' ? 'bg-red-100 text-red-800' :
                                      'bg-amber-100 text-amber-800'
                                    }`}>
                                      {att.status}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Inline Editable Notes */}
                      <div className="space-y-2">
                        <span className="text-[11px] font-bold text-[#9b9a97] uppercase tracking-wider block">
                          Notas de Gestión Administrativa
                        </span>
                        <textarea
                          id="flyout-notes-textarea"
                          rows={2}
                          placeholder="Escribe notas administrativas internas..."
                          value={inspectedEvent.notes || ''}
                          onChange={(e) => handleSaveInspectedNotes(e.target.value)}
                          className="w-full p-3 border border-[#ececec] bg-white rounded-lg text-xs text-[#37352f] focus:outline-none focus:ring-1 focus:ring-blue-400"
                        />
                      </div>
                    </div>

                    {/* Flyout Footer */}
                    <div className="p-4 border-t border-[#ececec] bg-[#FBFBFA] text-[10px] text-[#9b9a97] font-mono flex items-center justify-between">
                      <span>Creado: {new Date(inspectedEvent.createdAt).toLocaleString()}</span>
                      <span>Código: {inspectedEvent.id}</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Quick Action Overlay/Bar */}
        <footer className="h-10 border-t border-[#ececec] bg-[#fbfbfa] flex items-center justify-center space-x-6 text-[10px] text-[#9b9a97] uppercase tracking-wider font-mono">
          <div className="flex items-center space-x-1">
            <span>Online Sync</span>
            <span className="text-green-600 font-bold hidden sm:inline">● Activo</span>
          </div>
          <span className="text-gray-300">•</span>
          <div className="flex items-center space-x-1 text-gray-500 italic truncate max-w-[200px] sm:max-w-none">
            <span>"El sistema fue creado con fines académicos."</span>
          </div>
        </footer>
      </div>

      {/* Shared Event Modal */}
      <EventModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEventToEdit(undefined);
          setModalDefaultDate(undefined);
        }}
        onSave={handleSaveEvent}
        eventToEdit={eventToEdit}
        espacios={espacios}
        currentUser={currentUser}
        defaultDate={modalDefaultDate}
      />

      {/* User Profile Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentUser={currentUser}
        onUpdateUser={(updatedUser) => setCurrentUser(updatedUser)}
      />
    </div>
  );
}
