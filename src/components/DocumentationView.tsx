import React, { useState } from 'react';
import { 
  FileText, 
  Users, 
  HelpCircle, 
  Cpu, 
  Shuffle, 
  Sliders, 
  ShieldAlert, 
  CheckCircle,
  Code,
  Edit2,
  Save,
  Clock,
  Printer
} from 'lucide-react';

export default function DocumentationView() {
  const [isEditing, setIsEditing] = useState(false);
  const [teamMembers, setTeamMembers] = useState('Brayan Ceballos, María Gómez, Carlos Díaz');
  const [customProblem, setCustomProblem] = useState(
    'Falta de coordinación centralizada en el uso de los espacios físicos de FaCyT (auditorios, salones, laboratorios), lo que provoca superposiciones horarias, manejo manual e informal de solicitudes vía papel o correos aislados, y dificultades para planificar eventos académicos de manera ágil.'
  );

  // Toggle sections status
  const [toggles, setToggles] = useState<Record<string, boolean>>({
    analisis: true,
    proceso: true,
    bitacora: true,
    etica: true,
    limitaciones: false
  });

  const toggleSection = (section: string) => {
    setToggles(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div id="documentation-view" className="flex-1 overflow-y-auto bg-[#FAF9F6] p-6 font-sans text-[#37352F]">
      {/* Notion Document Banner */}
      <div className="max-w-4xl mx-auto mb-5 bg-gradient-to-r from-slate-800 to-indigo-900 rounded h-28 relative overflow-hidden shadow-sm flex items-end p-5">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <div className="text-white relative z-10 space-y-0.5">
          <span className="text-[10px] font-mono bg-white/20 px-2 py-0.5 rounded backdrop-blur-sm font-bold uppercase tracking-wider">
            FaCyT — Universidad de Carabobo
          </span>
          <h2 className="text-lg font-bold">Gestión de Eventos y Espacios Físicos</h2>
        </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-6 bg-white border border-[#ececec] rounded p-6 shadow-2xs">
        {/* Document Header */}
        <div className="flex justify-between items-start border-b border-[#ececec] pb-4">
          <div className="space-y-1">
            <h1 className="text-xl font-bold tracking-tight text-[#37352F]">
              📑 Expediente Técnico y Análisis de Sistema
            </h1>
            <p className="text-xs text-[#8A8984]">
              Documentación técnica y arquitectura del sistema de coordinación logística FaCyT.
            </p>
          </div>
          <button
            id="btn-print-doc"
            onClick={handlePrint}
            className="flex items-center space-x-1 px-2.5 py-1.5 border border-[#ececec] bg-white rounded text-xs text-[#37352F] hover:bg-[#FAF9F6] transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="font-semibold text-[11px]">Imprimir / PDF</span>
          </button>
        </div>

        {/* 1. Datos del Proyecto e Integrantes (Editable!) */}
        <div className="p-4 border border-[#ececec] rounded bg-[#FAF9F6]">
          <div className="flex justify-between items-center mb-2.5">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-gray-500 flex items-center space-x-1.5">
              <Users className="w-3.5 h-3.5 text-gray-400" />
              <span>1. Identificación del Equipo</span>
            </h3>
            <button
              id="btn-edit-doc-header"
              onClick={() => setIsEditing(!isEditing)}
              className="text-xs text-blue-600 hover:underline flex items-center space-x-1 font-medium"
            >
              {isEditing ? (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Finalizar</span>
                </>
              ) : (
                <>
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Editar</span>
                </>
              )}
            </button>
          </div>

          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="font-semibold text-gray-400 block mb-1">NOMBRE DE LA APLICACIÓN</span>
                <span className="text-sm font-bold text-[#37352F]">Gestor de Eventos FaCyT (SI-Eventos)</span>
              </div>
              <div>
                <span className="font-semibold text-gray-400 block mb-1">INTEGRANTES DEL EQUIPO</span>
                {isEditing ? (
                  <input
                    id="doc-edit-team"
                    type="text"
                    value={teamMembers}
                    onChange={(e) => setTeamMembers(e.target.value)}
                    className="w-full p-1.5 border border-gray-300 rounded bg-white font-medium text-[#37352F]"
                  />
                ) : (
                  <span className="text-sm font-bold text-gray-700">{teamMembers}</span>
                )}
              </div>
            </div>

            <div>
              <span className="font-semibold text-gray-400 block mb-1">PROBLEMA ORGANIZACIONAL IDENTIFICADO</span>
              {isEditing ? (
                <textarea
                  id="doc-edit-problem"
                  rows={3}
                  value={customProblem}
                  onChange={(e) => setCustomProblem(e.target.value)}
                  className="w-full p-1.5 border border-gray-300 rounded bg-white text-xs text-[#37352F] leading-relaxed"
                ></textarea>
              ) : (
                <p className="text-gray-700 leading-relaxed bg-white p-3 border border-gray-100 rounded-md">
                  {customProblem}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 2. Actores Involucrados */}
        <div className="space-y-2.5">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-gray-500 flex items-center space-x-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-gray-400" />
            <span>2. Actores Involucrados</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3 border border-gray-100 rounded bg-white space-y-0.5">
              <span className="font-bold text-gray-800 text-[11px]">Decanato y Coordinadores</span>
              <p className="text-gray-500 leading-normal text-[11px]">
                Toman la decisión de aprobar o rechazar solicitudes basadas en la disponibilidad, capacidad del espacio y relevancia académica.
              </p>
            </div>
            <div className="p-3 border border-gray-100 rounded bg-white space-y-0.5">
              <span className="font-bold text-gray-800 text-[11px]">Organizadores / Docentes</span>
              <p className="text-gray-500 leading-normal text-[11px]">
                Inician el flujo registrando eventos solicitados con fecha, horario y recursos esperados. Necesitan confirmación rápida.
              </p>
            </div>
            <div className="p-3 border border-gray-100 rounded bg-white space-y-0.5">
              <span className="font-bold text-gray-800 text-[11px]">Estudiantes y Público</span>
              <p className="text-gray-500 leading-normal text-[11px]">
                Usuarios de consulta. Consumen los eventos programados como cartelera informativa institucional ágil y consistente.
              </p>
            </div>
          </div>
        </div>

        {/* 3. Análisis Sistémico Requerido (Collapsible) */}
        <div className="border border-[#ececec] rounded overflow-hidden bg-white shadow-2xs">
          <button
            id="toggle-btn-analisis"
            onClick={() => toggleSection('analisis')}
            className="w-full p-3.5 bg-[#FAF9F6] border-b border-[#ececec] flex justify-between items-center text-left cursor-pointer"
          >
            <div className="flex items-center space-x-2">
              <Shuffle className="w-4 h-4 text-indigo-600" />
              <span className="font-bold text-[#37352F] text-xs uppercase tracking-wider">
                3. Análisis de Sistemas (Teoría General de Sistemas)
              </span>
            </div>
            <span className="text-[10px] text-blue-600 font-bold">{toggles.analisis ? 'Contraer [-]' : 'Expandir [+]'}</span>
          </button>

          {toggles.analisis && (
            <div className="p-4 space-y-3 text-[11px] leading-relaxed text-gray-600">
              <p>
                Visualizamos la gestión de eventos de la facultad experimental como un <strong>sistema de información dinámico</strong> dentro de la supratestructura de FaCyT, que opera bajo las siguientes variables de la Teoría General de Sistemas (TGS):
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-0.5">
                  <span className="font-bold text-gray-800 text-[10px] block uppercase tracking-wider">🎯 Propósito u Objetivo:</span>
                  <p>Optimizar la planificación del uso de espacios físicos de FaCyT para garantizar un flujo constante de actividades formativas, de investigación e institucionales libres de superposiciones horarias.</p>
                </div>

                <div className="space-y-0.5">
                  <span className="font-bold text-gray-800 text-[10px] block uppercase tracking-wider">📥 Entradas (Inputs):</span>
                  <p>Solicitudes de eventos de coordinadores (título, fecha, hora, aforo esperado), inventario de recursos de laboratorios, y el catálogo de espacios físicos actualizados.</p>
                </div>

                <div className="space-y-0.5">
                  <span className="font-bold text-gray-800 text-[10px] block uppercase tracking-wider">⚙️ Procesos de Transformación:</span>
                  <p>Validación automática de solapamiento de horario/espacio, recomendación predictiva de espacios, categorización por tipo de actividad y cambio de estados para toma de decisiones.</p>
                </div>

                <div className="space-y-0.5">
                  <span className="font-bold text-gray-800 text-[10px] block uppercase tracking-wider">📤 Salidas (Outputs):</span>
                  <p>Cartelera de eventos programados, reportes gráficos para planificación, alertas tempranas de conflicto, sugerencias de cronogramas generados por IA y afiches publicitarios de difusión.</p>
                </div>

                <div className="space-y-0.5">
                  <span className="font-bold text-gray-800 text-[10px] block uppercase tracking-wider">🔄 Retroalimentación (Feedback):</span>
                  <p>Actualización en tiempo real del estado de eventos (cancelación, culminación) que libera los espacios físicos de forma diferida o inmediata para nuevas solicitudes.</p>
                </div>

                <div className="space-y-0.5">
                  <span className="font-bold text-gray-800 text-[10px] block uppercase tracking-wider">⚠️ Restricciones del Entorno:</span>
                  <p>Aforo limitado de salones, horarios operativos de la facultad (edificios abiertos), disponibilidad tecnológica del servidor y necesidad de validación humana obligatoria.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 4. Proceso Representado y Automatizado (Collapsible) */}
        <div className="border border-[#ececec] rounded overflow-hidden bg-white shadow-2xs">
          <button
            id="toggle-btn-proceso"
            onClick={() => toggleSection('proceso')}
            className="w-full p-3.5 bg-[#FAF9F6] border-b border-[#ececec] flex justify-between items-center text-left cursor-pointer"
          >
            <div className="flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-blue-600" />
              <span className="font-bold text-[#37352F] text-xs uppercase tracking-wider">
                4. Flujo del Proceso Automatizado
              </span>
            </div>
            <span className="text-[10px] text-blue-600 font-bold">{toggles.proceso ? 'Contraer [-]' : 'Expandir [+]'}</span>
          </button>

          {toggles.proceso && (
            <div className="p-4 space-y-3 text-[11px] leading-relaxed text-gray-600">
              <p>
                El siguiente diagrama de texto describe el flujo del proceso que atiende el sistema, diferenciando las acciones automáticas soportadas por el software y las decisiones humanas reservadas para el Decanato:
              </p>

              {/* Text / SVG representation of process */}
              <div className="bg-[#FAF9F6] p-3 rounded font-mono text-[10px] leading-tight text-gray-700 border border-gray-100 overflow-x-auto space-y-1">
                <div>[ORGANIZADOR] Registra solicitud de evento con espacio y fecha</div>
                <div> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│</div>
                <div> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;▼</div>
                <div>[SISTEMA AUTOMÁTICO] Verifica conflictos horaria (Intersección: inicioA &lt; finB &amp;&amp; finA &gt; inicioB)</div>
                <div> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;├──► ¿SÍ hay solape? ──► [SISTEMA] Alerta activa e impide colisión visual</div>
                <div> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└──► ¿NO hay solape? ─► [SISTEMA] Asigna estado: 'solicitado'</div>
                <div> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;│</div>
                <div> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;▼</div>
                <div>[ASISTENTE IA - GEMINI] Analiza descripción, asiste y sugiere mejoras de cronograma</div>
                <div> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;│</div>
                <div> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;▼</div>
                <div>[COORDINADOR FaCyT] Revisa Solicitudes ──► Cambia estado a: 'aprobado' o 'rechazado'</div>
                <div> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;│</div>
                <div> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;▼</div>
                <div>[SISTEMA] Sincroniza cartelera oficial, programa en el calendario público de FaCyT</div>
                <div> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;│</div>
                <div> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;▼</div>
                <div>[DIFUSIÓN INTELIGENTE] IA genera plantilla publicitaria estructurada para WhatsApp / Slack</div>
              </div>
            </div>
          )}
        </div>

        {/* 5. Bitácora de Uso de IA (Mandatory Section!) */}
        <div className="border border-[#ececec] rounded overflow-hidden bg-white shadow-2xs">
          <button
            id="toggle-btn-bitacora"
            onClick={() => toggleSection('bitacora')}
            className="w-full p-3.5 bg-[#FAF9F6] border-b border-[#ececec] flex justify-between items-center text-left cursor-pointer"
          >
            <div className="flex items-center space-x-2">
              <Cpu className="w-4 h-4 text-purple-600" />
              <span className="font-bold text-[#37352F] text-xs uppercase tracking-wider">
                5. Bitácora de uso de Inteligencia Artificial (IA)
              </span>
            </div>
            <span className="text-[10px] text-blue-600 font-bold">{toggles.bitacora ? 'Contraer [-]' : 'Expandir [+]'}</span>
          </button>

          {toggles.bitacora && (
            <div className="p-4 space-y-3 text-[11px] leading-relaxed text-gray-600">
              <p>
                Declaramos el uso de herramientas inteligentes durante las fases de diseño técnico, conceptualización y desarrollo de la aplicación:
              </p>

              <div className="space-y-3.5 border-l-2 border-purple-200 pl-3">
                <div className="space-y-0.5">
                  <span className="font-bold text-purple-950 block text-[11px]">🔧 Herramientas utilizadas:</span>
                  <p>Google Gemini (modelo <strong>gemini-3.5-flash</strong>), Antigravity AI.</p>
                </div>

                <div className="space-y-0.5">
                  <span className="font-bold text-purple-950 block text-[11px]">💡 Propósito y Casos de Uso:</span>
                  <p>1. <strong>Análisis conceptual:</strong> Formulación del modelo de base de datos relacional simplificado y diseño de reglas para intervalos temporales sin colisión.<br/>
                  2. <strong>Asistente en el servidor:</strong> Integración dinámica mediante el SDK oficial <code>@google/genai</code> para enriquecer descripciones académicas en el Notion Workspace.<br/>
                  3. <strong>Optimización de UI/UX:</strong> Diseño de clases Tailwind consistentes y microinteracciones de estados.</p>
                </div>

                <div className="space-y-1">
                  <span className="font-bold text-purple-950 block text-[11px]">📌 Ejemplo de Prompt Clave:</span>
                  <div className="p-2.5 bg-purple-50 text-purple-900 rounded font-mono text-[10px] leading-normal">
                    "Actúa como un planificador de eventos académicos de FaCyT. Revisa el evento solicitado: 'Jornada de Pasantías'. Genera una sugerencia de cronograma de 4 horas en formato markdown para insertar como notas académicas en el sistema."
                  </div>
                </div>

                <div className="space-y-0.5">
                  <span className="font-bold text-purple-950 block text-[11px]">🛡️ Verificación Humana de Resultados:</span>
                  <p>Identificamos que la IA inicialmente sugirió usar formatos de fecha y hora que no se alineaban con las restricciones del input HTML clásico. Corregimos el modelo para forzar el formato estándar <code>YYYY-MM-DD</code> e implementar la lógica de intervalo estricta por software para asegurar estabilidad absoluta.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 6. Consideraciones Éticas */}
        <div className="border border-[#ececec] rounded overflow-hidden bg-white shadow-2xs">
          <button
            id="toggle-btn-etica"
            onClick={() => toggleSection('etica')}
            className="w-full p-3.5 bg-[#FAF9F6] border-b border-[#ececec] flex justify-between items-center text-left cursor-pointer"
          >
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <span className="font-bold text-[#37352F] text-xs uppercase tracking-wider">
                6. Consideraciones Éticas y de Privacidad
              </span>
            </div>
            <span className="text-[10px] text-blue-600 font-bold">{toggles.etica ? 'Contraer [-]' : 'Expandir [+]'}</span>
          </button>

          {toggles.etica && (
            <div className="p-4 space-y-3 text-[11px] leading-relaxed text-gray-600">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-0.5">
                  <span className="font-bold text-gray-800">🔒 Privacidad de Datos:</span>
                  <p>El sistema recopila únicamente información académica institucional. No se almacena información sensible de estudiantes ni contraseñas privadas, protegiendo las identidades según regulaciones de protección de datos.</p>
                </div>
                <div className="space-y-0.5">
                  <span className="font-bold text-gray-800">🤝 Responsabilidad de la IA:</span>
                  <p>Las sugerencias, descripciones y cronogramas enriquecidos por Gemini se marcan explícitamente como "Sugerencias de la IA". El sistema no automatiza de manera ciega las aprobaciones de eventos, manteniendo siempre al <strong>Coordinador Humano</strong> como el decisor soberano.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 7. Limitaciones y Mejoras Futuras */}
        <div className="border border-[#ececec] rounded overflow-hidden bg-white shadow-2xs">
          <button
            id="toggle-btn-limitaciones"
            onClick={() => toggleSection('limitaciones')}
            className="w-full p-3.5 bg-[#FAF9F6] border-b border-[#ececec] flex justify-between items-center text-left cursor-pointer"
          >
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span className="font-bold text-[#37352F] text-xs uppercase tracking-wider">
                7. Limitaciones y Mejoras Futuras
              </span>
            </div>
            <span className="text-[10px] text-blue-600 font-bold">{toggles.limitaciones ? 'Contraer [-]' : 'Expandir [+]'}</span>
          </button>

          {toggles.limitaciones && (
            <div className="p-4 space-y-2 text-[11px] leading-relaxed text-gray-600">
              <span className="font-bold text-gray-800 block">🛑 Limitaciones del MVP actual:</span>
              <ul className="list-disc pl-4 space-y-0.5">
                <li>Detección de colisión simple basada en el mismo día y solapamiento de horas (no soporta recurrencia semanal).</li>
                <li>Base de datos persistente local en archivo JSON (apropiado para escala de prototipo, requiere migrar a Postgres en producción).</li>
              </ul>
              
              <span className="font-bold text-gray-800 block pt-1.5">🚀 Mejoras del Plan de Escalado:</span>
              <ul className="list-disc pl-4 space-y-0.5">
                <li>Integrar sistema de notificaciones automáticas vía correo o WhatsApp directo con la API oficial de WhatsApp Business.</li>
                <li>Implementar autenticación de usuarios por roles vinculada con LDAP o el correo institucional de la Universidad de Carabobo.</li>
              </ul>
            </div>
          )}
        </div>

        {/* Footer info code */}
        <div className="text-center pt-3 border-t border-[#ececec] text-[10px] text-gray-500 font-sans italic">
          "El sistema fue creado con fines académicos."
        </div>
      </div>
    </div>
  );
}
