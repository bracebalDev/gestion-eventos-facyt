import React, { useState, useRef } from 'react';
import { User, Lock, Mail, UploadCloud, Shield, LogIn, UserPlus, CreditCard, Building } from 'lucide-react';
import { Usuario, Rol, Departamento } from '../types';
import logoFacyt from './Logo-Facyt.svg';

interface AuthScreenProps {
  onLoginSuccess: (user: Usuario) => void;
}

export default function AuthScreen({ onLoginSuccess }: AuthScreenProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Register state
  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  const [cedula, setCedula] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Rol>('solicitante');
  const [department, setDepartment] = useState<Departamento>('COMPUTACION');
  const [carnetBase64, setCarnetBase64] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError("El archivo es demasiado grande (máx 2MB).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setCarnetBase64(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        onLoginSuccess(data.user);
      } else {
        if (!email.endsWith('@uc.edu.ve')) {
          throw new Error('El correo institucional debe terminar estrictamente en @uc.edu.ve');
        }

        if (!department) {
          throw new Error('Debe seleccionar obligatoriamente su Departamento de pertenencia.');
        }

        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            lastName,
            cedula,
            email,
            password,
            role,
            department,
            carnetBase64
          })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        onLoginSuccess(data.user);
      }
    } catch (err: any) {
      setError(err.message || 'Error de autenticación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6] p-4 font-sans">
      <div className="w-full max-w-md bg-white border border-[#ececec] rounded-xl shadow-2xl overflow-hidden animate-fade-in">
        {/* Banner/Header */}
        <div className="bg-[#37352f] p-6 text-center">
          <img src={logoFacyt} alt="Logo FaCyT UC" className="w-14 h-14 object-contain mx-auto mb-2 drop-shadow-md" />
          <h2 className="text-xl font-bold text-white tracking-tight">
            Gestor de Eventos FaCyT
          </h2>
          <p className="text-xs text-gray-300 mt-1">
            Sistema Integrado de Aprobación y Espacios
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-[#ececec] text-sm font-semibold">
          <button
            type="button"
            className={`flex-1 py-3 text-center transition-colors flex items-center justify-center space-x-1.5 ${isLogin ? 'text-[#37352f] border-b-2 border-[#37352f] bg-white' : 'text-gray-400 bg-gray-50 hover:text-gray-600'}`}
            onClick={() => { setIsLogin(true); setError(''); }}
          >
            <LogIn className="w-4 h-4" />
            <span>Entrar</span>
          </button>
          <button
            type="button"
            className={`flex-1 py-3 text-center transition-colors flex items-center justify-center space-x-1.5 ${!isLogin ? 'text-[#37352f] border-b-2 border-[#37352f] bg-white' : 'text-gray-400 bg-gray-50 hover:text-gray-600'}`}
            onClick={() => { setIsLogin(false); setError(''); }}
          >
            <UserPlus className="w-4 h-4" />
            <span>Registrarse</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-3.5 text-xs">
          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded text-xs text-red-700 animate-pulse text-center">
              {error}
            </div>
          )}

          {!isLogin && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Nombre *</label>
                  <div className="relative">
                    <User className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-400" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Andrés"
                      className="w-full pl-8 pr-2.5 py-1.5 border border-[#ececec] rounded text-xs text-[#37352f] focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Apellido *</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Bello"
                    className="w-full px-2.5 py-1.5 border border-[#ececec] rounded text-xs text-[#37352f] focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Cédula de Identidad *</label>
                <div className="relative">
                  <CreditCard className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={cedula}
                    onChange={(e) => setCedula(e.target.value)}
                    placeholder="V-28111222"
                    className="w-full pl-8 pr-2.5 py-1.5 border border-[#ececec] rounded text-xs text-[#37352f] focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </>
          )}

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Correo Institucional (@uc.edu.ve) *</label>
            <div className="relative">
              <Mail className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@uc.edu.ve"
                className="w-full pl-8 pr-2.5 py-1.5 border border-[#ececec] rounded text-xs text-[#37352f] focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Contraseña *</label>
            <div className="relative">
              <Lock className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-8 pr-2.5 py-1.5 border border-[#ececec] rounded text-xs text-[#37352f] focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {!isLogin && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Tipo de Usuario</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as Rol)}
                    className="w-full p-1.5 border border-[#ececec] rounded text-xs text-[#37352f] focus:outline-none focus:border-blue-500 bg-white"
                  >
                    <option value="solicitante">Estudiante / Profesor</option>
                    <option value="director">Coordinación / Decanato</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Departamento *</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value as Departamento)}
                    className="w-full p-1.5 border border-[#ececec] rounded text-xs text-[#37352f] focus:outline-none focus:border-blue-500 bg-white font-semibold"
                  >
                    <option value="COMPUTACION">Computación</option>
                    <option value="FISICA">Física</option>
                    <option value="BIOLOGIA">Biología</option>
                    <option value="QUIMICA">Química</option>
                    <option value="MATEMATICA">Matemática</option>
                    <option value="BIBLIOTECA">Biblioteca FaCyT</option>
                    {role === 'director' && <option value="GENERAL">Decanato (General)</option>}
                  </select>
                </div>
              </div>

              {/* Upload Carnet */}
              <div className="space-y-1 pt-1 border-t border-[#ececec]">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Carnet / Identificación (Opcional)</label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border border-dashed border-[#ececec] rounded p-3 flex flex-col items-center justify-center text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors cursor-pointer"
                >
                  <UploadCloud className="w-5 h-5 mb-1" />
                  <span className="text-[11px] font-semibold text-center">
                    {carnetBase64 ? "Imagen cargada. Clic para cambiar." : "Haz clic para subir imagen de carnet"}
                  </span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handleFileChange}
                  />
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-3 py-2.5 bg-[#37352f] hover:bg-[#2b2a25] text-white rounded font-bold shadow-sm transition-colors disabled:opacity-50 cursor-pointer text-xs"
          >
            {loading ? 'Procesando...' : (isLogin ? 'Iniciar Sesión' : 'Registrar Cuenta FaCyT')}
          </button>
        </form>
      </div>
    </div>
  );
}
