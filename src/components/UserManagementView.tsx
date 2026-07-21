import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  ShieldCheck, 
  UserCheck, 
  GraduationCap, 
  Building, 
  Calendar, 
  Loader2,
  Mail,
  CreditCard,
  RefreshCw
} from 'lucide-react';
import { Usuario, Departamento } from '../types';
import { formatDateDDMMAAAA } from '../utils/dateFormatter';

export default function UserManagementView() {
  const [users, setUsers] = useState<Usuario[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('all'); // all, decano, coordinador, solicitante
  const [deptFilter, setDeptFilter] = useState<string>('all');

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/users');
      if (!res.ok) throw new Error('Error al cargar la lista de usuarios');
      const data = await res.json();
      setUsers(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const getDepartmentLabel = (dept?: string) => {
    switch (dept) {
      case 'GENERAL': return 'Decanato';
      case 'COMPUTACION': return 'Computación';
      case 'BIOLOGIA': return 'Biología';
      case 'QUIMICA': return 'Química';
      case 'FISICA': return 'Física';
      case 'MATEMATICA': return 'Matemática';
      case 'BIBLIOTECA': return 'Biblioteca';
      default: return dept || 'Decanato';
    }
  };

  const filteredUsers = users.filter(u => {
    const term = searchTerm.toLowerCase();
    const fullName = `${u.name} ${u.lastName || ''}`.toLowerCase();
    const matchesSearch = 
      fullName.includes(term) ||
      (u.cedula && u.cedula.toLowerCase().includes(term)) ||
      u.email.toLowerCase().includes(term) ||
      getDepartmentLabel(u.department).toLowerCase().includes(term);

    let matchesRole = true;
    if (roleFilter === 'decano') {
      matchesRole = u.role === 'director' && u.department === 'GENERAL';
    } else if (roleFilter === 'coordinador') {
      matchesRole = u.role === 'director' && u.department !== 'GENERAL';
    } else if (roleFilter === 'solicitante') {
      matchesRole = u.role === 'solicitante';
    }

    const matchesDept = deptFilter === 'all' || u.department === deptFilter;

    return matchesSearch && matchesRole && matchesDept;
  });

  const totalDecano = users.filter(u => u.role === 'director' && u.department === 'GENERAL').length;
  const totalCoords = users.filter(u => u.role === 'director' && u.department !== 'GENERAL').length;
  const totalSolics = users.filter(u => u.role === 'solicitante').length;

  return (
    <div id="user-management-view" className="flex-1 overflow-y-auto bg-white p-4 md:p-6 font-sans">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold tracking-tight text-[#37352F]">👥 Registro y Control de Usuarios FaCyT</h1>
            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded font-mono text-[10px] font-bold uppercase">
              Exclusivo Decanato
            </span>
          </div>
          <p className="text-xs text-[#8A8984] mt-0.5">
            Listado general de usuarios registrados en el sistema, organizados por permisología y área de adscripción.
          </p>
        </div>

        <button
          onClick={fetchUsers}
          className="self-start md:self-auto px-3 py-1.5 border border-[#ececec] bg-white hover:bg-gray-50 rounded text-xs font-semibold text-[#37352F] flex items-center space-x-1.5 cursor-pointer shadow-2xs transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Actualizar Lista</span>
        </button>
      </div>

      {/* Metric summary badges */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="p-3.5 border border-[#ececec] rounded-lg bg-[#FAF9F6] flex items-center space-x-3">
          <div className="p-2 bg-indigo-100 rounded-lg text-indigo-700">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-gray-500 block">Autoridades Decanato</span>
            <span className="text-lg font-bold text-[#37352F] font-mono">{totalDecano} usuario(s)</span>
          </div>
        </div>

        <div className="p-3.5 border border-[#ececec] rounded-lg bg-[#FAF9F6] flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg text-blue-700">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-gray-500 block">Coordinadores de Dpto.</span>
            <span className="text-lg font-bold text-[#37352F] font-mono">{totalCoords} usuario(s)</span>
          </div>
        </div>

        <div className="p-3.5 border border-[#ececec] rounded-lg bg-[#FAF9F6] flex items-center space-x-3">
          <div className="p-2 bg-emerald-100 rounded-lg text-emerald-700">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-gray-500 block">Estudiantes / Profesores</span>
            <span className="text-lg font-bold text-[#37352F] font-mono">{totalSolics} usuario(s)</span>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="max-w-6xl mx-auto border border-[#ececec] rounded-lg bg-[#FBFBFA] p-3.5 mb-6 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#8A8984]" />
          <input
            type="text"
            placeholder="Buscar por Nombre, Apellido, Cédula o Correo institucional..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8.5 pr-4 py-1.5 border border-[#ececec] bg-white rounded text-xs text-[#37352F] focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="p-1.5 border border-[#ececec] bg-white rounded text-xs text-[#37352F] font-medium focus:outline-none"
          >
            <option value="all">Todas las Permisologías</option>
            <option value="decano">Decano (Director General)</option>
            <option value="coordinador">Coordinador de Departamento</option>
            <option value="solicitante">Estudiantes y Profesores</option>
          </select>

          {/* Department Filter */}
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
        </div>
      </div>

      {/* Users Table */}
      <div className="max-w-6xl mx-auto border border-[#ececec] rounded-xl bg-white shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center space-y-2">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            <span className="text-xs font-semibold">Cargando catálogo de usuarios...</span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-gray-500 bg-[#FAF9F6]">
            <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-[#37352F]">No se encontraron usuarios</h3>
            <p className="text-xs text-gray-500 mt-1">Ajusta los filtros o prueba con otro término de búsqueda.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#FBFBFA] border-b border-[#ececec] text-[#8A8984] font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Departamento</th>
                  <th className="py-3 px-4">Nombre</th>
                  <th className="py-3 px-4">Apellido</th>
                  <th className="py-3 px-4">Cédula</th>
                  <th className="py-3 px-4">Correo Electrónico</th>
                  <th className="py-3 px-4">Permisología</th>
                  <th className="py-3 px-4 text-right">Fecha de Registro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ececec]">
                {filteredUsers.map((u) => {
                  const deptLabel = getDepartmentLabel(u.department);
                  const isDirector = u.role === 'director';
                  const isDecano = isDirector && u.department === 'GENERAL';

                  return (
                    <tr key={u.id} className="hover:bg-[#FAF9F6] transition-colors">
                      {/* Departamento */}
                      <td className="py-3 px-4 font-semibold text-[#37352F]">
                        <span className="flex items-center space-x-1.5">
                          <Building className="w-3.5 h-3.5 text-gray-400" />
                          <span>{deptLabel}</span>
                        </span>
                      </td>

                      {/* Nombre */}
                      <td className="py-3 px-4 font-bold text-[#37352F]">
                        {u.name}
                      </td>

                      {/* Apellido */}
                      <td className="py-3 px-4 font-medium text-[#37352F]">
                        {u.lastName || '—'}
                      </td>

                      {/* Cédula */}
                      <td className="py-3 px-4 font-mono font-semibold text-gray-700">
                        {u.cedula || '—'}
                      </td>

                      {/* Correo */}
                      <td className="py-3 px-4 text-gray-600 font-mono">
                        <span className="flex items-center space-x-1">
                          <Mail className="w-3 h-3 text-gray-400" />
                          <span>{u.email}</span>
                        </span>
                      </td>

                      {/* Permisología */}
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isDecano ? 'bg-purple-100 text-purple-900 border border-purple-200' :
                          isDirector ? 'bg-blue-100 text-blue-900 border border-blue-200' :
                          'bg-emerald-100 text-emerald-900 border border-emerald-200'
                        }`}>
                          {isDecano ? 'Decano (Director General)' : isDirector ? 'Coordinador de Dpto.' : 'Estudiante / Profesor'}
                        </span>
                      </td>

                      {/* Fecha de Registro */}
                      <td className="py-3 px-4 text-right font-mono text-gray-500 text-[11px]">
                        {formatDateDDMMAAAA(u.createdAt)}
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
