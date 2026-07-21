/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Departamento = 
  | 'COMPUTACION' 
  | 'FISICA' 
  | 'BIOLOGIA' 
  | 'QUIMICA' 
  | 'MATEMATICA' 
  | 'BIBLIOTECA' 
  | 'GENERAL';

export interface Espacio {
  id: string;
  name: string;
  capacity: number;
  location: string;
  type: 'auditorio' | 'laboratorio' | 'salon' | 'otro';
  resources: string[];
  observations?: string;
  department?: Departamento; // Departamento al que pertenece (si es exclusivo)
}

export type Rol = 'solicitante' | 'director';

export interface Usuario {
  id: string;
  name: string;
  lastName?: string;
  cedula?: string;
  email: string;
  password?: string;
  role: Rol;
  department: Departamento;
  carnetBase64?: string;
  createdAt?: string;
  lastProfileUpdate?: string;
}

export type TipoActividad = 'taller' | 'conversatorio' | 'jornada' | 'charla' | 'reunion' | 'otro';

export type EstadoEvento = 
  | 'solicitado' 
  | 'en revisión' 
  | 'aprobado' 
  | 'programado' 
  | 'realizado' 
  | 'cancelado' 
  | 'rechazado';

export interface AsistenteInvitado {
  cedula: string;
  name: string;
  lastName: string;
  department: Departamento;
  status: 'pendiente' | 'aprobado' | 'rechazado';
  addedAt: string;
}

export interface InscritoPublico {
  userId: string;
  name: string;
  lastName: string;
  cedula: string;
  department: Departamento;
  registeredAt: string;
}

export type AlcanceEvento = 'PUBLICO' | 'DEPARTAMENTAL';

export interface Evento {
  id: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  spaceId: string; // Relación con Espacio
  responsible: string;
  activityType: TipoActividad;
  status: EstadoEvento;
  participantsCount: number;
  createdAt: string;
  notes?: string;
  aiSuggestions?: string;
  conflictWarning?: string; // Cache de advertencia de conflicto
  department?: Departamento; // Departamento al que va dirigido
  solicitanteId?: string; // ID del usuario que solicitó
  isInstitutional?: boolean; // Creado por Decanato, Departamento o Biblioteca
  scope?: AlcanceEvento; // Alcance: PUBLICO (Toda FaCyT) o DEPARTAMENTAL (solo carrera)
  attendees?: AsistenteInvitado[]; // Invitados agregados por cédula
  publicRegistrations?: InscritoPublico[]; // Inscritos en aforo en vivo
}

// Estructura de la base de datos local
export interface DatabaseSchema {
  espacios: Espacio[];
  eventos: Evento[];
  usuarios: Usuario[];
}

export interface PromptRequest {
  prompt: string;
  eventContext?: Partial<Evento>;
  actionType?: string;
}
