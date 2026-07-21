import React, { useState, useEffect, useRef } from 'react';
import { X, User, Mail, CreditCard, UploadCloud, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { Usuario } from '../types';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: Usuario;
  onUpdateUser: (user: Usuario) => void;
}

export default function ProfileModal({ isOpen, onClose, currentUser, onUpdateUser }: ProfileModalProps) {
  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [cedula, setCedula] = useState('');
  const [carnetBase64, setCarnetBase64] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && currentUser) {
      setName(currentUser.name || '');
      setLastName(currentUser.lastName || '');
      setEmail(currentUser.email || '');
      setCedula(currentUser.cedula || '');
      setCarnetBase64(currentUser.carnetBase64 || '');
      setError('');
      setSuccessMsg('');
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validación estricta de formato JPG (.jpg / .jpeg / image/jpeg)
    if (file.type !== 'image/jpeg' && !file.name.toLowerCase().endsWith('.jpg') && !file.name.toLowerCase().endsWith('.jpeg')) {
      setError("Formato no permitido. La foto del carnet debe ser en formato exclusivo .JPG");
      return;
    }

    // Validación estricta de 2MB
    if (file.size > 2 * 1024 * 1024) {
      setError("El archivo de imagen excede el tamaño máximo permitido de 2MB.");
      return;
    }

    setError('');
    const reader = new FileReader();
    reader.onload = (event) => {
      setCarnetBase64(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await fetch(`/api/users/${currentUser.id}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          lastName,
          email,
          cedula,
          carnetBase64
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al actualizar perfil');
      }

      setSuccessMsg("¡Perfil actualizado con éxito! La fecha de actualización fue registrada.");
      onUpdateUser(data);
      setTimeout(() => {
        onClose();
      }, 1500);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-[#ececec] animate-fade-in relative">
        <div className="flex justify-between items-center border-b border-[#ececec] pb-3">
          <div className="flex items-center space-x-2">
            <User className="w-5 h-5 text-purple-600" />
            <h2 className="text-base font-bold text-[#37352F]">Editar Perfil de Usuario</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded text-gray-500">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Advertencia de 45 días */}
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start space-x-2 text-xs text-amber-900">
          <Clock className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <span>
            <strong>Regla de Seguridad:</strong> La información del perfil solo puede actualizarse una vez cada <strong>45 días</strong> para evitar falsificación de datos académicos.
          </span>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-semibold flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-xs text-green-700 font-semibold flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="font-bold text-gray-500 uppercase tracking-wider block text-[10px]">Nombre</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2 border border-gray-200 rounded font-medium focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-gray-500 uppercase tracking-wider block text-[10px]">Apellido</label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full p-2 border border-gray-200 rounded font-medium focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-gray-500 uppercase tracking-wider block text-[10px]">Correo Electrónico (Único)</label>
            <div className="relative">
              <Mail className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-8 pr-2 py-2 border border-gray-200 rounded font-medium focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-gray-500 uppercase tracking-wider block text-[10px]">Cédula de Identidad (Única)</label>
            <div className="relative">
              <CreditCard className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                required
                placeholder="V-00000000"
                value={cedula}
                onChange={(e) => setCedula(e.target.value)}
                className="w-full pl-8 pr-2 py-2 border border-gray-200 rounded font-mono font-bold focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Carga de Foto de Carnet (Exclusivo .jpg / max 2MB) */}
          <div className="space-y-1">
            <label className="font-bold text-gray-500 uppercase tracking-wider block text-[10px]">Foto del Carnet (Exclusivo .JPG, Máx 2MB)</label>
            <input
              type="file"
              ref={fileInputRef}
              accept=".jpg,.jpeg,image/jpeg"
              onChange={handleFileChange}
              className="hidden"
            />
            
            <div className="flex items-center space-x-3 bg-gray-50 p-2.5 border border-dashed border-gray-300 rounded-lg">
              {carnetBase64 ? (
                <img src={carnetBase64} alt="Carnet" className="w-12 h-12 object-cover rounded border border-gray-300" />
              ) : (
                <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-gray-400">
                  <User className="w-6 h-6" />
                </div>
              )}
              <div className="flex-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2.5 py-1 bg-white border border-gray-300 hover:bg-gray-100 rounded text-[11px] font-bold text-gray-700 flex items-center space-x-1 shadow-2xs"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>{carnetBase64 ? 'Cambiar Foto (.JPG)' : 'Subir Carnet (.JPG)'}</span>
                </button>
                <span className="text-[10px] text-gray-400 block mt-0.5">Formato estricto: .jpg / Máx 2MB</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#ececec] flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 border border-gray-200 hover:bg-gray-100 rounded font-semibold text-gray-600"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-1.5 bg-[#37352F] hover:bg-[#2b2a25] text-white rounded font-bold transition-colors disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
