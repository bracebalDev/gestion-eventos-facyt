import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import { Espacio, Evento, EstadoEvento, DatabaseSchema, Usuario, Departamento } from "./src/types.js";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize Gemini API client
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
  try {
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log("Gemini API initialized successfully.");
  } catch (error) {
    console.error("Failed to initialize Gemini API:", error);
  }
} else {
  console.warn("GEMINI_API_KEY is not set or has default value. AI features will fallback to rule-based responses.");
}

// Local Database Setup (JSON file on disk)
const DB_PATH = path.join(process.cwd(), "data", "db.json");

function ensureDirectoryExistence(filePath: string) {
  const dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return true;
  }
  ensureDirectoryExistence(dirname);
  fs.mkdirSync(dirname);
}

// Seed Data
const defaultSpaces: Espacio[] = [
  {
    id: "esp-auditorio-ninoska",
    name: "Auditorio Ninoska Maneiro",
    capacity: 100,
    location: "Edificio Principal FaCyT",
    type: "auditorio",
    resources: ["Sistema de Sonido Profesional", "Proyector HD", "Aires Acondicionados (2)", "Micrófonos Inalámbricos"],
    observations: "Espacio magno compartido por todos los departamentos de FaCyT.",
    department: "GENERAL"
  },
  {
    id: "esp-bio-1",
    name: "Laboratorio Biotecnología",
    capacity: 35,
    location: "Edificio de Biología, Planta Baja",
    type: "laboratorio",
    resources: ["Microscopios de Alta Resolución", "Incubadoras", "Autoclave", "Pizarra Acrílica"],
    observations: "Exclusivo para prácticas e investigación en Biotecnología.",
    department: "BIOLOGIA"
  },
  {
    id: "esp-bio-2",
    name: "Laboratorio Ciencias Naturales",
    capacity: 25,
    location: "Edificio de Biología, Piso 1",
    type: "laboratorio",
    resources: ["Muestras Biológicas", "Estereomicroscopios", "Videobeam HDMI"],
    observations: "Para prácticas de botánica, zoología y ecología.",
    department: "BIOLOGIA"
  },
  {
    id: "esp-bio-3",
    name: "Salón de Seminario Biología",
    capacity: 50,
    location: "Edificio de Biología, Piso 2",
    type: "salon",
    resources: ["Proyector 4K", "Aire Acondicionado", "Mesa Directiva"],
    observations: "Presentación de tesis y seminarios departamentales.",
    department: "BIOLOGIA"
  },
  {
    id: "esp-qui-1",
    name: "Laboratorio de Química Orgánica",
    capacity: 35,
    location: "Edificio de Química, Planta Baja",
    type: "laboratorio",
    resources: ["Extractores de Gases", "Campanas de Extracción", "Mecheros de Bunsen", "Reactivos"],
    observations: "Cumplir normas de bioseguridad obligatorias.",
    department: "QUIMICA"
  },
  {
    id: "esp-qui-2",
    name: "Laboratorio de Óptica",
    capacity: 35,
    location: "Edificio de Química, Piso 1",
    type: "laboratorio",
    resources: ["Espectrofotómetros", "Bancos Ópticos", "Osciloscopios digital"],
    observations: "Uso reservado para prácticas especializadas de espectroscopía.",
    department: "QUIMICA"
  },
  {
    id: "esp-qui-3",
    name: "Sala de Seminario Química",
    capacity: 55,
    location: "Edificio de Química, Piso 2",
    type: "salon",
    resources: ["Televisor Smart 75\"", "Pizarra de Vidrio", "Climatización Integral"],
    observations: "Seminarios y conferencias del departamento de Química.",
    department: "QUIMICA"
  },
  {
    id: "esp-qui-4",
    name: "Auditorio Marie Curie",
    capacity: 85,
    location: "Edificio de Química, Planta Alta",
    type: "auditorio",
    resources: ["Audio Surround", "Proyector Láser de Alta Definición", "Aforo ampliado"],
    observations: "Auditorio departamental de Química.",
    department: "QUIMICA"
  },
  {
    id: "esp-comp-1",
    name: "Salón de Seminario Computación",
    capacity: 45,
    location: "Edificio de Computación, Piso 2",
    type: "salon",
    resources: ["Pantalla Interactiva Touch", "Videobeam HDMI", "Climatización"],
    observations: "Defensas de trabajo especial de grado y reuniones docentes.",
    department: "COMPUTACION"
  },
  {
    id: "esp-comp-2",
    name: "Laboratorio de Computación 1",
    capacity: 30,
    location: "Edificio de Computación, Planta Baja",
    type: "laboratorio",
    resources: ["30 PCs Intel Core i7", "Videobeam HDMI", "Internet Fibra Óptica"],
    observations: "Talleres y laboratorios de programación estructurada y OO.",
    department: "COMPUTACION"
  },
  {
    id: "esp-comp-3",
    name: "Laboratorio de Computación 2",
    capacity: 30,
    location: "Edificio de Computación, Planta Baja",
    type: "laboratorio",
    resources: ["30 PCs Intel Core i7", "Videobeam", "Pizarra Acrílica"],
    observations: "Prácticas de bases de datos e ingeniería de software.",
    department: "COMPUTACION"
  },
  {
    id: "esp-comp-4",
    name: "Laboratorio de Computación 3",
    capacity: 30,
    location: "Edificio de Computación, Piso 1",
    type: "laboratorio",
    resources: ["30 PCs AMD Ryzen 7", "Videobeam HDMI", "Aire Acondicionado"],
    observations: "Laboratorio de sistemas operativos y arquitectura.",
    department: "COMPUTACION"
  },
  {
    id: "esp-comp-5",
    name: "Laboratorio de Computación 4",
    capacity: 30,
    location: "Edificio de Computación, Piso 1",
    type: "laboratorio",
    resources: ["30 PCs Intel Core i7", "Videobeam", "Switches de prueba"],
    observations: "Desarrollo web y proyectos avanzados.",
    department: "COMPUTACION"
  },
  {
    id: "esp-comp-6",
    name: "Laboratorio de Redes de Computadores",
    capacity: 20,
    location: "Edificio de Computación, Piso 2",
    type: "laboratorio",
    resources: ["Racks Cisco", "Routers y Switches Industriales", "Cableado Estructurado"],
    observations: "Prácticas avanzadas de redes y telecomunicaciones.",
    department: "COMPUTACION"
  },
  {
    id: "esp-comp-7",
    name: "Auditorio Alan Turing",
    capacity: 60,
    location: "Edificio de Computación, Planta Alta",
    type: "auditorio",
    resources: ["Sonido Integrado", "Proyector HD", "Butacas ergonómicas"],
    observations: "Conferencias y jornadas de la carrera de Computación.",
    department: "COMPUTACION"
  },
  {
    id: "esp-comp-8",
    name: "Sala de Postgrado Computación",
    capacity: 30,
    location: "Edificio de Postgrado, Piso 1",
    type: "salon",
    resources: ["Mesa Directiva Modular", "Smart TV 65\"", "Sistema de Videoconferencia"],
    observations: "Postgrados y maestría en ciencias de la computación.",
    department: "COMPUTACION"
  },
  {
    id: "esp-fis-1",
    name: "Laboratorio Física General",
    capacity: 25,
    location: "Edificio de Física, Planta Baja",
    type: "laboratorio",
    resources: ["Equipos de Mecánica y Electromagnetismo", "Pizarra Acrílica"],
    observations: "Prácticas de laboratorio para física I, II y III.",
    department: "FISICA"
  },
  {
    id: "esp-fis-2",
    name: "Auditorio Albert Einstein",
    capacity: 40,
    location: "Edificio de Física, Planta Alta",
    type: "auditorio",
    resources: ["Proyector 4K", "Sistema de Audio", "Pizarra"],
    observations: "Conferencias y coloquios de la Licenciatura en Física.",
    department: "FISICA"
  },
  {
    id: "esp-fis-3",
    name: "Sala de Postgrado Física",
    capacity: 20,
    location: "Edificio de Postgrado, Piso 2",
    type: "salon",
    resources: ["Mesa de Conferencia", "Videobeam", "Aire Acondicionado"],
    observations: "Seminarios de investigación en física teórica y experimental.",
    department: "FISICA"
  },
  {
    id: "esp-mat-1",
    name: "Laboratorio Matemática Experimental",
    capacity: 30,
    location: "Edificio de Matemática, Planta Baja",
    type: "laboratorio",
    resources: ["Software Matlab / SageMath", "PCs de Alto Rendimiento", "Proyector HD"],
    observations: "Prácticas de modelado matemático y simulación numérica.",
    department: "MATEMATICA"
  },
  {
    id: "esp-mat-2",
    name: "Auditorio Isaac Newton",
    capacity: 55,
    location: "Edificio de Matemática, Piso 1",
    type: "auditorio",
    resources: ["Sistema de Audio", "Proyector", "Pizarra Acrílica de Triple Hoja"],
    observations: "Ponencias y simposios del departamento de Matemática.",
    department: "MATEMATICA"
  },
  {
    id: "esp-mat-3",
    name: "Sala de Postgrado Matemática",
    capacity: 20,
    location: "Edificio de Postgrado, Piso 2",
    type: "salon",
    resources: ["Mesa de Trabajo", "Televisor Smart", "Pizarra de Vidrio"],
    observations: "Reuniones de investigación matemática y defensas de maestría.",
    department: "MATEMATICA"
  },
  {
    id: "esp-bib-1",
    name: "Cubículo Azul",
    capacity: 6,
    location: "Biblioteca Central FaCyT, Piso 1",
    type: "salon",
    resources: ["Mesa de Estudio Modular", "Pizarra de Cristal", "Tomas Eléctricas"],
    observations: "Cubículo reservado para trabajo en equipo de estudiantes.",
    department: "BIBLIOTECA"
  },
  {
    id: "esp-bib-2",
    name: "Cubículo Blanco",
    capacity: 6,
    location: "Biblioteca Central FaCyT, Piso 1",
    type: "salon",
    resources: ["Mesa de Estudio", "Pantalla de Apoyo HDMI", "Conexión Wi-Fi Dedicada"],
    observations: "Cubículo de estudio silencioso para pequeños grupos.",
    department: "BIBLIOTECA"
  }
];

const defaultUsers: Usuario[] = [
  {
    id: "usr-admin-gen",
    name: "Decano FaCyT",
    lastName: "Decanato",
    email: "decano@uc.edu.ve",
    password: "123",
    role: "director",
    department: "GENERAL",
    createdAt: "2026-07-01T08:00:00.000Z"
  },
  {
    id: "usr-admin-comp",
    name: "Coordinación Computación",
    lastName: "FaCyT",
    email: "comp@uc.edu.ve",
    password: "123",
    role: "director",
    department: "COMPUTACION",
    createdAt: "2026-07-02T09:15:00.000Z"
  },
  {
    id: "usr-admin-bio",
    name: "Coordinación Biología",
    lastName: "FaCyT",
    email: "biologia@uc.edu.ve",
    password: "123",
    role: "director",
    department: "BIOLOGIA",
    createdAt: "2026-07-03T11:20:00.000Z"
  },
  {
    id: "usr-admin-qui",
    name: "Coordinación Química",
    lastName: "FaCyT",
    email: "quimica@uc.edu.ve",
    password: "123",
    role: "director",
    department: "QUIMICA",
    createdAt: "2026-07-04T14:00:00.000Z"
  },
  {
    id: "usr-admin-fis",
    name: "Coordinación Física",
    lastName: "FaCyT",
    email: "fisica@uc.edu.ve",
    password: "123",
    role: "director",
    department: "FISICA",
    createdAt: "2026-07-05T10:30:00.000Z"
  },
  {
    id: "usr-admin-mat",
    name: "Coordinación Matemática",
    lastName: "FaCyT",
    email: "matematica@uc.edu.ve",
    password: "123",
    role: "director",
    department: "MATEMATICA",
    createdAt: "2026-07-06T15:45:00.000Z"
  },
  {
    id: "usr-admin-bib",
    name: "Coordinación Biblioteca",
    lastName: "FaCyT",
    email: "biblio@uc.edu.ve",
    password: "123",
    role: "director",
    department: "BIBLIOTECA",
    createdAt: "2026-07-07T08:30:00.000Z"
  },
  {
    id: "usr-estudiante-1",
    name: "Jose",
    lastName: "Alvarado",
    cedula: "12345",
    email: "jose@uc.edu.ve",
    password: "123",
    role: "solicitante",
    department: "COMPUTACION",
    createdAt: "2026-07-10T16:20:00.000Z"
  },
  {
    id: "usr-admin-it",
    name: "Soporte IT",
    lastName: "FaCyT",
    email: "admin@uc.edu.ve",
    password: "admin123",
    role: "admin" as any,
    department: "GENERAL" as any,
    createdAt: "2026-07-01T06:00:00.000Z"
  }
];

const defaultEvents: Evento[] = [
  {
    id: "evt-inst-1",
    title: "Congreso Magna FaCyT 2026: Innovación y Ciencia Abierta",
    description: "Evento institucional anual de la Facultad Experimental de Ciencias y Tecnología. Exposición de ponencias magistrales, desarrollo científico y proyectos interdisciplinarios.",
    date: "2026-07-28",
    startTime: "09:00",
    endTime: "13:00",
    spaceId: "esp-auditorio-ninoska",
    responsible: "Decanato FaCyT",
    activityType: "jornada",
    status: "aprobado",
    participantsCount: 100,
    createdAt: new Date("2026-07-01T08:00:00").toISOString(),
    notes: "Evento global institucional con aforo en vivo para todos los estudiantes de FaCyT.",
    department: "GENERAL",
    isInstitutional: true,
    publicRegistrations: [
      {
        userId: "usr-estudiante-1",
        name: "Andrés",
        lastName: "Crespo",
        cedula: "V-28111222",
        department: "COMPUTACION",
        registeredAt: new Date("2026-07-05T10:00:00").toISOString()
      }
    ]
  },
  {
    id: "evt-inst-2",
    title: "Simposio de Inteligencia Artificial y Computación Cuántica",
    description: "Conferencias magistrales impartidas por la Coordinación de Computación sobre los avances más recientes en algoritmos cuánticos y modelos generativos.",
    date: "2026-07-30",
    startTime: "10:00",
    endTime: "12:30",
    spaceId: "esp-comp-7",
    responsible: "Coordinación de Computación",
    activityType: "conversatorio",
    status: "aprobado",
    participantsCount: 60,
    createdAt: new Date("2026-07-02T11:00:00").toISOString(),
    notes: "Entrada libre para la comunidad universitaria de la UC.",
    department: "COMPUTACION",
    isInstitutional: true,
    publicRegistrations: []
  },
  {
    id: "evt-inst-3",
    title: "Taller de Bioseguridad y Manejo de Químicos Reactivos",
    description: "Taller institucional obligatorio organizado por la Coordinación de Química para estudiantes e investigadores que laboran en laboratorios de la facultad.",
    date: "2026-07-29",
    startTime: "08:30",
    endTime: "11:30",
    spaceId: "esp-qui-4",
    responsible: "Coordinación de Química",
    activityType: "taller",
    status: "aprobado",
    participantsCount: 85,
    createdAt: new Date("2026-07-03T09:30:00").toISOString(),
    notes: "Incluye certificación digital de asistencia.",
    department: "QUIMICA",
    isInstitutional: true,
    publicRegistrations: []
  },
  {
    id: "evt-sol-1",
    title: "Taller Práctico de Desarrollo de APIs con Node.js y Express",
    description: "Taller enfocado en el diseño de arquitectura RESTful, middleware de seguridad y pruebas de endpoints para estudiantes de Computación.",
    date: "2026-07-25",
    startTime: "08:30",
    endTime: "11:30",
    spaceId: "esp-comp-2",
    responsible: "Andrés Crespo (Estudiante Solicitante)",
    activityType: "taller",
    status: "aprobado",
    participantsCount: 30,
    createdAt: new Date("2026-07-15T14:20:00").toISOString(),
    notes: "Solicitado por estudiante. Aprobado por la coordinación.",
    department: "COMPUTACION",
    solicitanteId: "usr-estudiante-1",
    isInstitutional: false,
    attendees: [
      {
        cedula: "V-29555666",
        name: "Carlos",
        lastName: "Díaz",
        department: "COMPUTACION",
        status: "aprobado",
        addedAt: new Date("2026-07-16T09:00:00").toISOString()
      },
      {
        cedula: "V-27888999",
        name: "Mariana",
        lastName: "López",
        department: "COMPUTACION",
        status: "pendiente",
        addedAt: new Date("2026-07-16T09:10:00").toISOString()
      }
    ]
  },
  {
    id: "evt-sol-2",
    title: "Mesa Redonda: Avances en Genómica y Biotecnología Vegetal",
    description: "Discusión sobre la aplicación de herramientas CRISPR en la edición genética de plantas alimenticias de la región central.",
    date: "2026-07-27",
    startTime: "14:00",
    endTime: "16:30",
    spaceId: "esp-bio-3",
    responsible: "Prof. María Castro",
    activityType: "conversatorio",
    status: "solicitado",
    participantsCount: 45,
    createdAt: new Date("2026-07-18T10:00:00").toISOString(),
    notes: "En espera de revisión por el Departamento de Biología.",
    department: "BIOLOGIA",
    solicitanteId: "usr-estudiante-1",
    isInstitutional: false
  }
];

// Helper to load DB
function loadDatabase(): DatabaseSchema {
  if (!fs.existsSync(DB_PATH)) {
    ensureDirectoryExistence(DB_PATH);
    const initialData: DatabaseSchema = {
      espacios: defaultSpaces,
      eventos: defaultEvents,
      usuarios: defaultUsers
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2), "utf8");
    return initialData;
  }
  try {
    const dataStr = fs.readFileSync(DB_PATH, "utf8");
    const parsed = JSON.parse(dataStr) as DatabaseSchema;
    if (!parsed.usuarios || parsed.usuarios.length === 0) parsed.usuarios = defaultUsers;
    if (!parsed.espacios || parsed.espacios.length === 0) parsed.espacios = defaultSpaces;
    if (!parsed.eventos) parsed.eventos = defaultEvents;
    return parsed;
  } catch (error) {
    console.error("Error reading database file, returning default data:", error);
    return { espacios: defaultSpaces, eventos: defaultEvents, usuarios: defaultUsers };
  }
}

// Helper to save DB
function saveDatabase(data: DatabaseSchema) {
  try {
    ensureDirectoryExistence(DB_PATH);
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf8");
  } catch (error) {
    console.error("Error writing database file:", error);
  }
}

// Lógica de detección de conflictos con REGLA DE BUFFER DE 15 MINUTOS
function detectConflicts(newEvent: Partial<Evento>, allEvents: Evento[]): string | undefined {
  if (!newEvent.date || !newEvent.startTime || !newEvent.endTime || !newEvent.spaceId) {
    return undefined;
  }

  const spaceId = newEvent.spaceId;
  const date = newEvent.date;
  const currentId = newEvent.id;

  const toMins = (timeStr: string) => {
    if (!timeStr) return 0;
    const parts = timeStr.split(':');
    return (parseInt(parts[0], 10) || 0) * 60 + (parseInt(parts[1], 10) || 0);
  };

  const toTimeStr = (mins: number) => {
    const h = Math.floor(mins / 60).toString().padStart(2, '0');
    const m = (mins % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
  };

  const newStart = toMins(newEvent.startTime);
  const newEnd = toMins(newEvent.endTime);

  const potentialConflicts = allEvents.filter(e => 
    e.spaceId === spaceId && 
    e.date === date && 
    e.id !== currentId && 
    e.status !== 'cancelado' && 
    e.status !== 'rechazado'
  );

  for (const match of potentialConflicts) {
    const matchStart = toMins(match.startTime);
    const matchEnd = toMins(match.endTime);
    const matchEndWithBuffer = matchEnd + 15; // 15 minutos para reacondicionamiento y limpieza

    // Conflicto si los intervalos con buffer se intersecan:
    if (newStart < matchEndWithBuffer && newEnd > matchStart) {
      const freeAt = toTimeStr(matchEndWithBuffer);
      return `Conflicto de horario en este espacio con "${match.title}" (${match.startTime} - ${match.endTime}). El espacio estará libre a partir de las ${freeAt} (requiere buffer de 15 min de limpieza).`;
    }
  }

  return undefined;
}

// Lógica de Auto-Rechazo por caducidad de invitaciones no aprobadas antes de la hora de inicio del evento
function processAutoRejections(db: DatabaseSchema): boolean {
  let modified = false;
  const now = new Date();

  for (const evt of db.eventos) {
    if (!evt.attendees || evt.attendees.length === 0) continue;

    const eventDateTime = new Date(`${evt.date}T${evt.startTime}:00`);
    if (!isNaN(eventDateTime.getTime()) && now >= eventDateTime) {
      for (const att of evt.attendees) {
        if (att.status === 'pendiente') {
          att.status = 'rechazado';
          modified = true;
        }
      }
    }
  }

  return modified;
}

// API Routes

// GET: Todos los datos del sistema
app.get("/api/db", (req, res) => {
  const db = loadDatabase();
  const wasModified = processAutoRejections(db);
  if (wasModified) {
    saveDatabase(db);
  }

  const enrichedEvents = db.eventos.map(evt => ({
    ...evt,
    conflictWarning: detectConflicts(evt, db.eventos)
  }));

  const safeUsuarios = db.usuarios.map(({ password, ...rest }: any) => rest);
  res.json({ espacios: db.espacios, eventos: enrichedEvents, usuarios: safeUsuarios });
});

// POST: Resetear base de datos a valores por defecto (para evaluación)
app.post("/api/db/reset", (req, res) => {
  const resetData: DatabaseSchema = {
    espacios: defaultSpaces,
    eventos: defaultEvents,
    usuarios: defaultUsers
  };
  saveDatabase(resetData);
  const safeData = { ...resetData, usuarios: resetData.usuarios.map(({ password, ...rest }: any) => rest) };
  res.json({ message: "Base de datos re-sembrada con éxito", data: safeData });
});

// --- AUTH ---
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Demasiados intentos desde esta IP. Inténtelo más tarde." },
  standardHeaders: true,
  legacyHeaders: false,
});

app.post("/api/auth/register", authLimiter, (req, res) => {
  const db = loadDatabase();
  const { name, lastName, cedula, email, password, role, department, carnetBase64 } = req.body;

  if (!email || !email.endsWith("@uc.edu.ve")) {
    return res.status(400).json({ error: "El correo debe pertenecer a la institución (@uc.edu.ve)." });
  }

  if (!department) {
    return res.status(400).json({ error: "Debe seleccionar su Departamento de pertenencia." });
  }

  const exists = db.usuarios.find(u => u.email === email);
  if (exists) {
    return res.status(400).json({ error: "El correo ya está registrado." });
  }

  const newUser: Usuario = {
    id: `usr-${Date.now()}`,
    name,
    lastName: lastName || '',
    cedula: cedula || '',
    email,
    password,
    role: role || 'solicitante',
    department: department || 'COMPUTACION',
    carnetBase64,
    createdAt: new Date().toISOString()
  };

  db.usuarios.push(newUser);
  saveDatabase(db);

  res.status(201).json({ user: { id: newUser.id, name: newUser.name, lastName: newUser.lastName, cedula: newUser.cedula, email: newUser.email, role: newUser.role, department: newUser.department, createdAt: newUser.createdAt } });
});

app.post("/api/auth/login", authLimiter, (req, res) => {
  const db = loadDatabase();
  const { email, password } = req.body;

  const user = db.usuarios.find(u => u.email === email && u.password === password);
  if (!user) {
    return res.status(401).json({ error: "Credenciales inválidas." });
  }

  res.json({ user: { id: user.id, name: user.name, lastName: user.lastName, cedula: user.cedula, email: user.email, role: user.role, department: user.department, createdAt: user.createdAt, lastProfileUpdate: user.lastProfileUpdate } });
});

// REQUERIMIENTO PERFIL: Actualizar Perfil de Usuario con regla de 45 días, unicidad y foto .jpg <= 2MB
app.put("/api/users/:id/profile", (req, res) => {
  const db = loadDatabase();
  const userId = req.params.id;
  const { name, lastName, cedula, email, carnetBase64 } = req.body;

  const userIndex = db.usuarios.findIndex(u => u.id === userId);
  if (userIndex === -1) {
    return res.status(404).json({ error: "Usuario no encontrado" });
  }

  const currentUser = db.usuarios[userIndex];

  // 1. Regla de 45 días
  const DAYS_45_MS = 45 * 24 * 60 * 60 * 1000;
  if (currentUser.lastProfileUpdate) {
    const elapsed = Date.now() - new Date(currentUser.lastProfileUpdate).getTime();
    if (elapsed < DAYS_45_MS) {
      const remainingDays = Math.ceil((DAYS_45_MS - elapsed) / (24 * 60 * 60 * 1000));
      return res.status(400).json({ 
        error: `Solo puedes actualizar tu perfil una vez cada 45 días. Debes esperar ${remainingDays} día(s) más para realizar cambios.` 
      });
    }
  }

  // 2. Unicidad de Correo y Cédula
  if (email && email.toLowerCase() !== currentUser.email.toLowerCase()) {
    const emailExists = db.usuarios.some(u => u.id !== userId && u.email.toLowerCase() === email.toLowerCase());
    if (emailExists) {
      return res.status(400).json({ error: "El correo electrónico ingresado ya está registrado por otro usuario." });
    }
  }

  if (cedula && cedula !== currentUser.cedula) {
    const cedulaExists = db.usuarios.some(u => u.id !== userId && u.cedula === cedula);
    if (cedulaExists) {
      return res.status(400).json({ error: "La cédula de identidad ingresada ya está registrada por otro usuario." });
    }
  }

  // 3. Validación de foto del carnet (.jpg y <= 2MB)
  if (carnetBase64) {
    if (!carnetBase64.startsWith('data:image/jpeg') && !carnetBase64.startsWith('data:image/jpg')) {
      return res.status(400).json({ error: "La foto del carnet debe estar en formato exclusivo JPG (.jpg / .jpeg)." });
    }

    const base64Length = carnetBase64.length - (carnetBase64.indexOf(',') + 1);
    const sizeInBytes = base64Length * 0.75;
    if (sizeInBytes > 2 * 1024 * 1024) {
      return res.status(400).json({ error: "La imagen del carnet excede el tamaño máximo permitido de 2MB." });
    }
  }

  const updatedUser: Usuario = {
    ...currentUser,
    name: name ? sanitizeText(name) : currentUser.name,
    lastName: lastName ? sanitizeText(lastName) : currentUser.lastName,
    cedula: cedula ? sanitizeText(cedula) : currentUser.cedula,
    email: email ? sanitizeText(email) : currentUser.email,
    carnetBase64: carnetBase64 || currentUser.carnetBase64,
    lastProfileUpdate: new Date().toISOString()
  };

  db.usuarios[userIndex] = updatedUser;
  saveDatabase(db);

  res.json(updatedUser);
});

// --- USUARIOS ---
app.get("/api/users", (req, res) => {
  const db = loadDatabase();
  const safeUsers = db.usuarios.map(u => ({
    id: u.id,
    name: u.name,
    lastName: u.lastName || '',
    cedula: u.cedula || '',
    email: u.email,
    role: u.role,
    department: u.department,
    createdAt: u.createdAt || new Date().toISOString()
  }));
  res.json(safeUsers);
});

// --- ADMIN: CRUD de Usuarios (Solo rol admin) ---
app.get("/api/admin/users", (req, res) => {
  const db = loadDatabase();
  const safeUsers = db.usuarios.map(({ password, ...rest }: any) => rest);
  res.json(safeUsers);
});

app.post("/api/admin/users", (req, res) => {
  const db = loadDatabase();
  const { name, lastName, cedula, email, password, role, department } = req.body;

  if (!email || !email.endsWith("@uc.edu.ve")) {
    return res.status(400).json({ error: "El correo debe pertenecer a la institución (@uc.edu.ve)." });
  }
  const exists = db.usuarios.find((u: any) => u.email === email);
  if (exists) {
    return res.status(400).json({ error: "El correo ya está registrado." });
  }

  const newUser: any = {
    id: `usr-${Date.now()}`,
    name: sanitizeText(name),
    lastName: sanitizeText(lastName) || '',
    cedula: sanitizeText(cedula) || '',
    email: sanitizeText(email),
    password: password || '123',
    role: role || 'solicitante',
    department: department || 'COMPUTACION',
    createdAt: new Date().toISOString()
  };

  db.usuarios.push(newUser);
  saveDatabase(db);
  const { password: _, ...safeUser } = newUser;
  res.status(201).json(safeUser);
});

app.put("/api/admin/users/:id", (req, res) => {
  const db = loadDatabase();
  const idx = db.usuarios.findIndex((u: any) => u.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Usuario no encontrado." });

  const { name, lastName, cedula, email, role, department } = req.body;
  if (name) db.usuarios[idx].name = sanitizeText(name);
  if (lastName !== undefined) db.usuarios[idx].lastName = sanitizeText(lastName);
  if (cedula !== undefined) db.usuarios[idx].cedula = sanitizeText(cedula);
  if (email) {
    const emailExists = db.usuarios.some((u: any) => u.id !== req.params.id && u.email === email);
    if (emailExists) return res.status(400).json({ error: "El correo ya está registrado por otro usuario." });
    db.usuarios[idx].email = sanitizeText(email);
  }
  if (role) db.usuarios[idx].role = role;
  if (department) db.usuarios[idx].department = department;

  saveDatabase(db);
  const { password: _, ...safeUser } = db.usuarios[idx] as any;
  res.json(safeUser);
});

app.put("/api/admin/users/:id/reset-password", (req, res) => {
  const db = loadDatabase();
  const idx = db.usuarios.findIndex((u: any) => u.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Usuario no encontrado." });

  db.usuarios[idx].password = "123";
  saveDatabase(db);
  res.json({ message: `Contraseña del usuario ${db.usuarios[idx].name} reseteada a valor por defecto.` });
});

app.delete("/api/admin/users/:id", (req, res) => {
  const db = loadDatabase();
  const idx = db.usuarios.findIndex((u: any) => u.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Usuario no encontrado." });

  const removed = db.usuarios.splice(idx, 1);
  saveDatabase(db);
  res.json({ message: `Usuario ${removed[0].name} eliminado correctamente.` });
});

// --- ESPACIOS ---
app.get("/api/spaces", (req, res) => {
  const db = loadDatabase();
  res.json(db.espacios);
});

app.post("/api/spaces", (req, res) => {
  const db = loadDatabase();
  const newSpace: Espacio = {
    id: `esp-${Date.now()}`,
    ...req.body
  };
  db.espacios.push(newSpace);
  saveDatabase(db);
  res.status(201).json(newSpace);
});

// --- EVENTOS ---
app.get("/api/events", (req, res) => {
  const db = loadDatabase();
  const wasModified = processAutoRejections(db);
  if (wasModified) {
    saveDatabase(db);
  }

  const enrichedEvents = db.eventos.map(evt => ({
    ...evt,
    conflictWarning: detectConflicts(evt, db.eventos)
  }));
  res.json(enrichedEvents);
});

// Helper de Sanitización contra XSS / Inyección (Requerimiento 10)
function sanitizeText(str?: string): string {
  if (!str) return '';
  return str.replace(/</g, "&lt;").replace(/>/g, "&gt;").trim();
}

app.post("/api/events", (req, res) => {
  const db = loadDatabase();
  
  const userDept = req.body.department || "GENERAL";
  const isStudent = req.body.role === 'solicitante';
  const isDecano = userDept === 'GENERAL';

  // VALIDACIÓN: No permitir eventos en fechas pasadas
  const eventDate = req.body.date;
  if (eventDate) {
    const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Caracas' }));
    const todayStr = now.toISOString().split('T')[0];
    if (eventDate < todayStr) {
      return res.status(400).json({ error: "No se pueden crear eventos en fechas anteriores a la fecha actual." });
    }
  }

  // REQUERIMIENTO 5: Asignación de alcance del evento (PUBLICO o DEPARTAMENTAL)
  let calculatedScope: 'PUBLICO' | 'DEPARTAMENTAL' = 'DEPARTAMENTAL';
  if (isDecano) {
    calculatedScope = 'PUBLICO';
  } else if (isStudent) {
    calculatedScope = 'DEPARTAMENTAL';
  } else {
    calculatedScope = req.body.scope === 'PUBLICO' ? 'PUBLICO' : 'DEPARTAMENTAL';
  }

  const isInstitutional = req.body.isInstitutional !== undefined 
    ? req.body.isInstitutional 
    : (req.body.role === 'director' || userDept === 'GENERAL' || userDept === 'BIBLIOTECA');

  const defaultStatus: EstadoEvento = isStudent ? 'solicitado' : (req.body.role === 'director' ? 'aprobado' : 'solicitado');

  const newEvent: Evento = {
    id: `evt-${Date.now()}`,
    title: sanitizeText(req.body.title) || "Evento sin título",
    description: sanitizeText(req.body.description),
    date: req.body.date || new Date().toISOString().split('T')[0],
    startTime: req.body.startTime || "08:00",
    endTime: req.body.endTime || "10:00",
    spaceId: req.body.spaceId || "esp-auditorio-ninoska",
    responsible: sanitizeText(req.body.responsible) || "No asignado",
    activityType: req.body.activityType || "otro",
    status: req.body.status || defaultStatus,
    participantsCount: Number(req.body.participantsCount) || 0,
    createdAt: new Date().toISOString(),
    notes: sanitizeText(req.body.notes),
    department: userDept,
    solicitanteId: req.body.solicitanteId || "desconocido",
    isInstitutional: Boolean(isInstitutional),
    scope: calculatedScope,
    attendees: req.body.attendees || [],
    publicRegistrations: req.body.publicRegistrations || []
  };

  // REQUERIMIENTO 2: Denegar registro inmediatamente si existe coincidencia/conflicto de horario o espacio
  const conflict = detectConflicts(newEvent, db.eventos);
  if (conflict) {
    return res.status(409).json({ error: `NO SE PUEDE REGISTRAR POR COINCIDENCIA: ${conflict}` });
  }

  db.eventos.push(newEvent);
  saveDatabase(db);
  res.status(201).json(newEvent);
});

// PUT: Modificar un evento
app.put("/api/events/:id", (req, res) => {
  const db = loadDatabase();
  const { id } = req.params;
  const index = db.eventos.findIndex(e => e.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Evento no encontrado" });
  }

  const updatedEvent: Evento = {
    ...db.eventos[index],
    ...req.body,
    participantsCount: req.body.participantsCount !== undefined ? Number(req.body.participantsCount) : db.eventos[index].participantsCount
  };

  // REQUERIMIENTO 2: Si el evento actualizado se mantiene activo (no cancelado ni rechazado), denegar por coincidencia
  if (updatedEvent.status !== 'cancelado' && updatedEvent.status !== 'rechazado') {
    const conflict = detectConflicts(updatedEvent, db.eventos);
    if (conflict) {
      return res.status(409).json({ error: `NO SE PUEDE REGISTRAR POR COINCIDENCIA: ${conflict}` });
    }
  }

  db.eventos[index] = updatedEvent;
  saveDatabase(db);
  res.json(updatedEvent);
});

// DELETE: Eliminar un evento
app.delete("/api/events/:id", (req, res) => {
  const db = loadDatabase();
  const { id } = req.params;
  const initialLength = db.eventos.length;
  db.eventos = db.eventos.filter(e => e.id !== id);

  if (db.eventos.length === initialLength) {
    return res.status(404).json({ error: "Evento no encontrado" });
  }

  saveDatabase(db);
  res.json({ message: "Evento eliminado con éxito", id });
});

// --- INVITACIÓN DE ASISTENTES POR CÉDULA ---
app.post("/api/events/:id/attendees", (req, res) => {
  const db = loadDatabase();
  const { id } = req.params;
  const { cedula, name, lastName, department } = req.body;

  const event = db.eventos.find(e => e.id === id);
  if (!event) return res.status(404).json({ error: "Evento no encontrado" });

  if (event.status !== 'aprobado' && event.status !== 'programado') {
    return res.status(400).json({ error: "Solo se pueden agregar asistentes a eventos aprobados." });
  }

  if (!event.attendees) event.attendees = [];

  const exists = event.attendees.find(a => a.cedula === cedula);
  if (exists) {
    return res.status(400).json({ error: "Esta cédula ya está agregada como asistente al evento." });
  }

  const newAttendee = {
    cedula,
    name: name || "Estudiante",
    lastName: lastName || "FaCyT",
    department: (department as Departamento) || "COMPUTACION",
    status: 'pendiente' as const,
    addedAt: new Date().toISOString()
  };

  event.attendees.push(newAttendee);
  saveDatabase(db);
  res.status(201).json(event);
});

// responder invitación (aprobar/rechazar)
app.put("/api/events/:id/attendees/:cedula", (req, res) => {
  const db = loadDatabase();
  const { id, cedula } = req.params;
  const { status } = req.body;

  const event = db.eventos.find(e => e.id === id);
  if (!event || !event.attendees) return res.status(404).json({ error: "Evento o asistentes no encontrados" });

  const attendee = event.attendees.find(a => a.cedula === cedula);
  if (!attendee) return res.status(404).json({ error: "Asistente con esa cédula no registrado en el evento" });

  attendee.status = status;
  saveDatabase(db);
  res.json(event);
});

// --- REGISTRO DE AFORO EN VIVO PARA EVENTOS RECIENTES INSTITUCIONALES ---
app.post("/api/events/:id/register-public", (req, res) => {
  const db = loadDatabase();
  const { id } = req.params;
  const { userId, name, lastName, cedula, department } = req.body;

  const event = db.eventos.find(e => e.id === id);
  if (!event) return res.status(404).json({ error: "Evento no encontrado" });

  if (!event.publicRegistrations) event.publicRegistrations = [];

  const currentCount = event.publicRegistrations.length;
  if (currentCount >= event.participantsCount) {
    return res.status(400).json({ error: "El aforo máximo para este evento ya ha sido alcanzado." });
  }

  const alreadyRegistered = event.publicRegistrations.find(r => r.userId === userId || r.cedula === cedula);
  if (alreadyRegistered) {
    return res.status(400).json({ error: "Ya te encuentras inscrito en este evento." });
  }

  event.publicRegistrations.push({
    userId,
    name,
    lastName: lastName || '',
    cedula: cedula || '',
    department: department || 'GENERAL',
    registeredAt: new Date().toISOString()
  });

  saveDatabase(db);
  res.json(event);
});

// Cancelar inscripción pública
app.delete("/api/events/:id/register-public/:userId", (req, res) => {
  const db = loadDatabase();
  const { id, userId } = req.params;

  const event = db.eventos.find(e => e.id === id);
  if (!event || !event.publicRegistrations) return res.status(404).json({ error: "Evento no encontrado" });

  event.publicRegistrations = event.publicRegistrations.filter(r => r.userId !== userId);
  saveDatabase(db);
  res.json(event);
});

// --- ENLACE AI CON GEMINI ---
app.post("/api/gemini/assist", async (req, res) => {
  const { prompt, eventContext, actionType } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "El prompt es obligatorio." });
  }

  if (!ai) {
    console.log("Simulando respuesta AI (No API Key configurada)...");
    let fallbackText = "";
    if (actionType === 'enrich') {
      fallbackText = `**[Simulación IA para: ${eventContext?.title || "Evento"}]**\n\nPropuesta de estructura de cronograma:\n- **08:30 - 09:00:** Registro de asistentes y bienvenida formal.\n- **09:00 - 10:15:** Primer bloque académico (Conceptos clave).\n- **10:15 - 10:30:** Receso para café y discusión libre.\n- **10:30 - 11:45:** Sesión de preguntas, respuestas e interacción.\n- **11:45 - 12:00:** Cierre y entrega de constancias digitales.\n\n*Nota: Conecta una API key en el panel para ver respuestas de Gemini reales en tiempo real.*`;
    } else if (actionType === 'recommend_space') {
      fallbackText = `**[Sugerencia de Espacio IA (Simulada)]**\n\nBasado en una capacidad estimada de **${eventContext?.participantsCount || 30} personas** y el tipo **"${eventContext?.activityType || "taller"}"**:\n\nRecomiendo usar el **Laboratorio de Computación 1** (capacidad 30) o el **Auditorio Ninoska Maneiro** para mayor afluencia.`;
    } else if (actionType === 'generate_diffusion') {
      fallbackText = `📢 **¡DIFUSIÓN FaCyT!** 📢\n\n🎓 **${eventContext?.title || "Gran Evento Académico"}**\n\n🗓️ **Fecha:** ${eventContext?.date || "Próximamente"}\n⏰ **Hora:** ${eventContext?.startTime || "08:00"} a ${eventContext?.endTime || "12:00"}\n📍 **Lugar:** ${eventContext?.spaceId === "esp-auditorio-ninoska" ? "Auditorio Ninoska Maneiro" : "Instalaciones de FaCyT"}\n\n👤 **Responsable:** ${eventContext?.responsible || "Comité Organizador"}\n\n📝 **Descripción:** ${eventContext?.description || "Una actividad imperdible para nuestra comunidad universitaria."}\n\n¡Te esperamos! Reenvía esta información a tus grupos. #FaCyT #Ciencia #Tecnologia`;
    } else {
      fallbackText = `Asistente Virtual FaCyT: Entendido. Has consultado sobre: "${prompt}". Para esta gestión de eventos, asegúrate de mantener actualizados los estados para evitar conflictos en laboratorios y auditorios.`;
    }
    return res.json({ text: fallbackText });
  }

  try {
    const systemPrompt = `Eres el Asistente Inteligente de Eventos de FaCyT (Facultad Experimental de Ciencias y Tecnología de la Universidad de Carabobo).
Tu objetivo es dar sugerencias profesionales, estructuradas y respetuosas para optimizar los eventos académicos. Responde siempre en español.
Usa un formato elegante de Markdown, ideal para Notion.
La acción solicitada es de tipo: "${actionType}".`;

    const contextStr = eventContext ? `Datos del evento actual:
- Título: ${eventContext.title || "Sin título"}
- Tipo: ${eventContext.activityType || "No definido"}
- Participantes estimados: ${eventContext.participantsCount || "No especificado"}
- Descripción: ${eventContext.description || "Ninguna"}
- Responsable: ${eventContext.responsible || "No especificado"}` : "";

    const userMessage = `${contextStr}\n\nInstrucción de usuario:\n${prompt}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: userMessage,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
      }
    });

    const responseText = response.text || "No se pudo obtener una respuesta de la IA.";
    res.json({ text: responseText });

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ error: "Error procesando la solicitud con Gemini: " + error.message });
  }
});

// Vite or static file serving
async function bootstrap() {
  // Bloquear acceso directo a la carpeta de base de datos
  app.use('/data', (req, res) => {
    res.status(403).json({ error: 'Acceso denegado a archivos sensibles del sistema.' });
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

bootstrap().catch(err => {
  console.error("Failed to start server:", err);
});
