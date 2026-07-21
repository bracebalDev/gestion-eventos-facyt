import React from 'react';
import { 
  LayoutDashboard, 
  CalendarDays,
  List,
  MapPin, 
  LogOut,
  User,
  Radio,
  Users,
  BarChart3,
  X,
  RefreshCw
} from 'lucide-react';
import { Usuario } from '../types';
import logoFacyt from './Logo-Facyt.svg';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onResetDb: () => void;
  isResetting: boolean;
  geminiActive: boolean;
  currentUser: Usuario;
  onLogout: () => void;
  onOpenProfile: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export default function Sidebar({ 
  currentTab, 
  setCurrentTab, 
  onResetDb, 
  isResetting, 
  currentUser,
  onLogout,
  onOpenProfile,
  isMobileOpen = false,
  onCloseMobile
}: SidebarProps) {
  // REQUERIMIENTO 2: Se eliminó la opción de Asistencia IA
  const menuItems = [
    { id: 'dashboard', name: 'Tablero de Control', icon: LayoutDashboard },
    { id: 'recent', name: 'Eventos Recientes', icon: Radio, badge: 'Aforo' },
    { id: 'calendar', name: 'Calendario Mensual', icon: CalendarDays },
    { id: 'events', name: 'Lista de Eventos', icon: List },
    { id: 'spaces', name: 'Aulas y Espacios', icon: MapPin },
  ];

  // REQUERIMIENTO DECANO/DEPARTAMENTO: Resumen de Gestión
  if (currentUser.role === 'director') {
    menuItems.push({
      id: 'analysis',
      name: 'Resumen de Gestión',
      icon: BarChart3,
      badge: 'Resumen'
    });
  }

  // REQUERIMIENTO DECANATO: Pestaña de Registro de Usuarios exclusivo para Decano
  if (currentUser.role === 'director' && currentUser.department === 'GENERAL') {
    menuItems.push({
      id: 'user-management',
      name: 'Registro de Usuarios',
      icon: Users,
      badge: 'Decanato'
    });
  }

  const handleSelectTab = (tabId: string) => {
    setCurrentTab(tabId);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-40 md:hidden backdrop-blur-xs"
          onClick={onCloseMobile}
        />
      )}

      <div 
        id="sidebar-container" 
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 md:w-60 bg-[#fbfbfa] border-r border-[#ececec] flex flex-col h-screen select-none font-sans transition-transform duration-200 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Workspace Header */}
        <div id="sidebar-header" className="p-4 border-b border-[#ececec] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <img src={logoFacyt} alt="Logo FaCyT" className="w-8 h-8 object-contain drop-shadow-2xs" />
            <div className="flex flex-col">
              <span className="font-semibold text-[#37352F] text-xs leading-tight">FaCyT Eventos</span>
              <span className="text-[10px] text-[#8A8984]">Gestión Logística UC</span>
            </div>
          </div>

          {/* Close Mobile Button */}
          {onCloseMobile && (
            <button 
              onClick={onCloseMobile}
              className="p-1 hover:bg-[#efefef] rounded text-gray-400 md:hidden"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <div id="sidebar-nav" className="flex-1 overflow-y-auto px-2 py-4 space-y-0.5">
          <span className="px-3 text-[10px] font-bold text-[#9b9a97] uppercase tracking-wider block mb-2">
            Vistas del Espacio
          </span>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                id={`nav-tab-${item.id}`}
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded text-xs transition-colors duration-150 text-left cursor-pointer ${
                  isActive 
                    ? 'bg-[#efefef] text-[#37352F] font-semibold' 
                    : 'text-[#5A5A57] hover:bg-[#efefef] hover:text-[#37352F]'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#37352F]' : 'text-[#7C7B77]'}`} />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className={`text-[9px] px-1 py-0.2 rounded font-mono ${
                    item.id === 'user-management'
                      ? 'bg-indigo-50 text-indigo-700 font-bold'
                      : item.id === 'recent'
                      ? 'bg-emerald-50 text-emerald-700 font-bold'
                      : 'bg-[#efefef] text-gray-600'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Sidebar Footer */}
        <div id="sidebar-footer" className="p-3 border-t border-[#ececec] bg-[#fbfbfa] space-y-2">
          {/* User Section (CLICKEABLE REQUERIMIENTO 4: Editar Perfil) */}
          <div className="mb-2">
            <div 
              onClick={onOpenProfile}
              className="p-2 bg-white border border-[#ececec] hover:border-purple-300 rounded-lg shadow-2xs flex items-center space-x-3 mb-2 cursor-pointer group transition-all"
              title="Haz clic para editar tu perfil (Nombre, Correo, Cédula, Foto Carnet)"
            >
              {currentUser.carnetBase64 ? (
                <img src={currentUser.carnetBase64} alt="Carnet" className="w-7 h-7 rounded-full object-cover border border-purple-200" />
              ) : (
                <div className="bg-purple-50 text-purple-600 p-1.5 rounded-full group-hover:bg-purple-100 transition-colors">
                  <User className="w-3.5 h-3.5" />
                </div>
              )}
              <div className="overflow-hidden flex-1">
                <p className="text-[10px] font-bold text-[#37352f] group-hover:text-purple-700 truncate leading-tight transition-colors">
                  {currentUser.name} {currentUser.lastName || ''}
                </p>
                <p className="text-[9px] text-gray-500 capitalize">
                  {currentUser.role === 'director' ? `Dir. ${currentUser.department}` : `Est. ${currentUser.department}`}
                </p>
              </div>
              <span className="text-[9px] font-bold text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity">✏️</span>
            </div>

            <button
              onClick={onLogout}
              className="w-full flex items-center space-x-2 px-2 py-1.5 rounded text-[10px] text-[#5a5a57] hover:bg-[#efefef] transition-colors cursor-pointer"
            >
              <LogOut className="w-3 h-3 text-gray-400" />
              <span className="font-medium">Cerrar Sesión</span>
            </button>
          </div>

          <div className="pt-2 border-t border-[#ececec] text-[10px] text-gray-500 italic text-center font-sans">
            "El sistema fue creado con fines académicos."
          </div>

          <button
            id="btn-reset-db"
            disabled={isResetting}
            onClick={onResetDb}
            className="w-full flex items-center justify-center space-x-1.5 px-2 py-1.5 border border-[#ececec] bg-white rounded text-[10px] text-[#37352F] hover:bg-[#efefef] active:bg-[#e4e4e4] transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3 h-3 text-gray-500 ${isResetting ? 'animate-spin' : ''}`} />
            <span className="font-medium">{isResetting ? 'Restaurando...' : 'Re-sembrar Demo'}</span>
          </button>
        </div>
      </div>
    </>
  );
}
