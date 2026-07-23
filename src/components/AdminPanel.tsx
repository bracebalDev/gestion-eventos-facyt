import React, { useState, useEffect } from 'react';
import { 
  Search, 
  UserPlus, 
  Trash2, 
  Edit3, 
  KeyRound, 
  RefreshCw, 
  X, 
  Shield, 
  Users, 
  AlertTriangle 
} from 'lucide-react';
import { Usuario, Departamento } from '../types';

interface AdminPanelProps {
  currentUser: Usuario;
}

interface FormData {
  name: string;
  lastName: string;
  cedula: string;
  email: string;
  password?: string;
  role: string;
  department: string;
}

const DEPARTAMENTOS = [
  'COMPUTACION', 'FISICA', 'BIOLOGIA', 'QUIMICA', 'MATEMATICA', 'BIBLIOTECA', 'GENERAL'
];
const ROLES = ['solicitante', 'director', 'admin'];

const initialFormData: FormData = {
  name: '',
  lastName: '',
  cedula: '',
  email: '',
  password: '',
  role: 'solicitante',
  department: 'GENERAL'
};

export default function AdminPanel({ currentUser }: AdminPanelProps) {
  const [users, setUsers] = useState<Usuario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  
  // Feedback state
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchUsers = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/admin/users');
      if (!res.ok) throw new Error('Error al obtener los usuarios');
      const data = await res.json();
      setUsers(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(''), 5000);
  };

  const handleOpenCreate = () => {
    setModalMode('create');
    setFormData(initialFormData);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: Usuario) => {
    setModalMode('edit');
    setEditingUserId(user.id);
    setFormData({
      name: user.name,
      lastName: user.lastName || '',
      cedula: user.cedula || '',
      email: user.email,
      role: user.role,
      department: user.department,
      password: '' // No se carga el password en edición
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    try {
      const url = modalMode === 'create' 
        ? '/api/admin/users' 
        : `/api/admin/users/${editingUserId}`;
      const method = modalMode === 'create' ? 'POST' : 'PUT';
      
      const payload: any = { ...formData };
      if (modalMode === 'edit' && !payload.password) {
        delete payload.password;
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error al guardar el usuario');
      }

      showSuccess(modalMode === 'create' ? 'Usuario creado exitosamente' : 'Usuario actualizado exitosamente');
      setIsModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      showError(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Está seguro que desea eliminar este usuario? Esta acción no se puede deshacer.')) return;
    
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar usuario');
      showSuccess('Usuario eliminado');
      fetchUsers();
    } catch (err: any) {
      showError(err.message);
    }
  };

  const handleResetPassword = async (id: string) => {
    if (!window.confirm('¿Desea restablecer la contraseña de este usuario?')) return;

    try {
      const res = await fetch(`/api/admin/users/${id}/reset-password`, { method: 'PUT' });
      if (!res.ok) throw new Error('Error al restablecer contraseña');
      showSuccess('Contraseña restablecida exitosamente');
    } catch (err: any) {
      showError(err.message);
    }
  };

  const filteredUsers = users.filter(u => {
    const term = searchTerm.toLowerCase();
    const fullName = `${u.name} ${u.lastName || ''}`.toLowerCase();
    return (
      fullName.includes(term) ||
      (u.cedula && u.cedula.toLowerCase().includes(term)) ||
      u.email.toLowerCase().includes(term)
    );
  });

  const getRoleBadgeClasses = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'director': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-white p-4 md:p-6 font-sans">
      <div className="max-w-6xl mx-auto mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#37352F] flex items-center gap-2">
            🛡️ Panel de Administración IT
          </h1>
          <p className="text-xs text-[#8A8984] mt-1">
            Gestión completa de usuarios del sistema FaCyT
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={fetchUsers}
            className="px-3 py-1.5 border border-[#ececec] bg-white hover:bg-gray-50 rounded text-xs font-semibold text-[#37352F] flex items-center space-x-1.5 transition-colors shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </button>
          <button
            onClick={handleOpenCreate}
            className="px-3 py-1.5 bg-[#37352F] hover:bg-[#2F2D27] text-white rounded text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-2xs"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Crear Usuario</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="max-w-6xl mx-auto mb-4">
        {errorMsg && (
          <div className="p-3 mb-3 text-sm text-red-800 bg-red-100 rounded-lg flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="p-3 mb-3 text-sm text-green-800 bg-green-100 rounded-lg flex items-center gap-2">
            <Users className="w-4 h-4" />
            {successMsg}
          </div>
        )}
      </div>

      {/* Search */}
      <div className="max-w-6xl mx-auto border border-[#ececec] rounded-lg bg-[#FBFBFA] p-3.5 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#8A8984]" />
          <input
            type="text"
            placeholder="Buscar por Nombre, Apellido, Cédula o Email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8.5 pr-4 py-1.5 border border-[#ececec] bg-white rounded text-xs text-[#37352F] focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="max-w-6xl mx-auto border border-[#ececec] rounded-xl bg-white shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#FBFBFA] border-b border-[#ececec] text-[#8A8984] font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Nombre</th>
                <th className="py-3 px-4">Apellido</th>
                <th className="py-3 px-4">Cédula</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Rol</th>
                <th className="py-3 px-4">Departamento</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ececec]">
              {isLoading && users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500">
                    Cargando usuarios...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500">
                    No se encontraron usuarios
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-[#FAF9F6] transition-colors">
                    <td className="py-3 px-4 font-bold text-[#37352F]">{u.name}</td>
                    <td className="py-3 px-4 text-[#37352F]">{u.lastName || '—'}</td>
                    <td className="py-3 px-4 font-mono text-gray-700">{u.cedula || '—'}</td>
                    <td className="py-3 px-4 text-gray-600">{u.email}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 border rounded text-[10px] font-bold ${getRoleBadgeClasses(u.role)}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600 font-medium">{u.department}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => handleOpenEdit(u)}
                          title="Editar usuario"
                          className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleResetPassword(u.id)}
                          title="Restablecer contraseña"
                          className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>
                        {u.id !== 'usr-admin-it' && (
                          <button
                            onClick={() => handleDelete(u.id)}
                            title="Eliminar usuario"
                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-[#ececec] bg-[#FBFBFA]">
              <h2 className="text-sm font-bold text-[#37352F]">
                {modalMode === 'create' ? 'Crear Nuevo Usuario' : 'Editar Usuario'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">Nombre</label>
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-1.5 border border-[#ececec] rounded text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">Apellido</label>
                  <input
                    required
                    type="text"
                    value={formData.lastName}
                    onChange={e => setFormData({...formData, lastName: e.target.value})}
                    className="w-full px-3 py-1.5 border border-[#ececec] rounded text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">Cédula</label>
                  <input
                    required
                    type="text"
                    value={formData.cedula}
                    onChange={e => setFormData({...formData, cedula: e.target.value})}
                    className="w-full px-3 py-1.5 border border-[#ececec] rounded text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">Email</label>
                  <input
                    required
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    className="w-full px-3 py-1.5 border border-[#ececec] rounded text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              {modalMode === 'create' && (
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">Contraseña</label>
                  <input
                    required={modalMode === 'create'}
                    type="password"
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                    className="w-full px-3 py-1.5 border border-[#ececec] rounded text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">Rol</label>
                  <select
                    value={formData.role}
                    onChange={e => setFormData({...formData, role: e.target.value})}
                    className="w-full px-3 py-1.5 border border-[#ececec] rounded text-xs focus:ring-1 focus:ring-indigo-500 outline-none bg-white"
                  >
                    {ROLES.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">Departamento</label>
                  <select
                    value={formData.department}
                    onChange={e => setFormData({...formData, department: e.target.value})}
                    className="w-full px-3 py-1.5 border border-[#ececec] rounded text-xs focus:ring-1 focus:ring-indigo-500 outline-none bg-white"
                  >
                    {DEPARTAMENTOS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-3 mt-4 border-t border-[#ececec] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded transition-colors shadow-2xs"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
