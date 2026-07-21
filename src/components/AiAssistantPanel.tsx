import React, { useState } from 'react';
import { 
  Sparkles, 
  Send, 
  BookOpen, 
  Megaphone, 
  MapPin, 
  HelpCircle, 
  Loader2, 
  Copy, 
  Check, 
  User 
} from 'lucide-react';
import { Evento, Espacio } from '../types';

interface AiAssistantPanelProps {
  eventos: Evento[];
  espacios: Espacio[];
  onTriggerDirectAssist: (prompt: string, actionType: string, eventContext?: any) => Promise<string>;
}

export default function AiAssistantPanel({ 
  eventos, 
  espacios, 
  onTriggerDirectAssist 
}: AiAssistantPanelProps) {
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const selectedEvent = eventos.find(e => e.id === selectedEventId);

  const handleAction = async (actionType: 'enrich' | 'recommend_space' | 'generate_diffusion', customText?: string) => {
    setIsLoading(true);
    setResponse('');
    
    let prompt = '';
    if (actionType === 'enrich') {
      prompt = `Genera un cronograma/itinerario de actividades por hora y recomendaciones didácticas específicas para la facultad para el evento titulado "${selectedEvent?.title}".`;
    } else if (actionType === 'recommend_space') {
      prompt = `Analiza la capacidad requerida de ${selectedEvent?.participantsCount || 30} personas y el tipo de actividad "${selectedEvent?.activityType}" para recomendar cuál espacio físico de FaCyT es más idóneo y qué recursos necesitará coordinar.`;
    } else if (actionType === 'generate_diffusion') {
      prompt = `Redacta un texto creativo y estructurado para difundir el evento "${selectedEvent?.title}" en redes institucionales y WhatsApp de estudiantes. Incluye emojis, llamado a la acción y un formato limpio.`;
    } else if (customText) {
      prompt = customText;
    }

    try {
      const resultText = await onTriggerDirectAssist(prompt, actionType, selectedEvent);
      setResponse(resultText);
    } catch (err: any) {
      setResponse(`Error al comunicarse con el asistente de IA: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPrompt.trim()) return;
    handleAction('enrich', customPrompt);
    setCustomPrompt('');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(response);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="ai-assistant-panel" className="flex-1 overflow-y-auto bg-white p-6 font-sans">
      {/* Header */}
      <div id="ai-header" className="max-w-4xl mx-auto mb-6">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded bg-purple-50 flex items-center justify-center text-purple-700 border border-purple-200">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#37352F]">Asistente de IA FaCyT</h1>
            <p className="text-xs text-[#8A8984] mt-0.5">
              Genera difusión, cronogramas y recomendaciones espaciales para optimizar la toma de decisiones con Google Gemini.
            </p>
          </div>
        </div>
      </div>

      <div id="ai-workspace" className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Left column: controls & settings */}
        <div id="ai-settings-col" className="md:col-span-1 space-y-4">
          {/* Step 1: Select Event */}
          <div className="p-3.5 border border-[#ececec] bg-[#FAF9F6] rounded space-y-3">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
              1. Seleccione el Evento
            </span>
            <div className="space-y-1.5">
              <label className="text-[11px] text-gray-500 font-medium">Asociar contexto de actividad:</label>
              <select
                id="ai-select-event"
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="w-full p-1.5 border border-gray-200 bg-white rounded text-xs text-[#37352F] focus:outline-none"
              >
                <option value="">-- Sin evento (Consulta General) --</option>
                {eventos.map(e => (
                  <option key={e.id} value={e.id}>{e.title}</option>
                ))}
              </select>
              {selectedEvent && (
                <div className="p-2 bg-white border border-[#ececec] rounded text-[10px] text-gray-500 space-y-0.5">
                  <span className="font-bold block text-gray-700">{selectedEvent.title}</span>
                  <p className="line-clamp-2">Resp: {selectedEvent.responsible}</p>
                  <p>Aforo: {selectedEvent.participantsCount} personas</p>
                </div>
              )}
            </div>
          </div>

          {/* Step 2: Preset Actions */}
          <div className="p-3.5 border border-[#ececec] bg-[#FAF9F6] rounded space-y-2.5">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
              2. Acciones Rápidas Inteligentes
            </span>
            <div className="space-y-1.5">
              <button
                id="btn-ai-enrich"
                disabled={!selectedEventId || isLoading}
                onClick={() => handleAction('enrich')}
                className="w-full flex items-center space-x-2 p-2 border border-gray-200 hover:border-purple-300 rounded text-xs text-left text-gray-700 hover:bg-[#FBFBFA] transition-all disabled:opacity-50 cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />
                <div className="leading-tight">
                  <span className="font-bold block text-[#37352F] text-[11px]">Enriquecer Planificación</span>
                  <span className="text-[9px] text-gray-400 font-mono">Genera agenda, horas y temas</span>
                </div>
              </button>

              <button
                id="btn-ai-diffusion"
                disabled={!selectedEventId || isLoading}
                onClick={() => handleAction('generate_diffusion')}
                className="w-full flex items-center space-x-2 p-2 border border-gray-200 hover:border-purple-300 rounded text-xs text-left text-gray-700 hover:bg-[#FBFBFA] transition-all disabled:opacity-50 cursor-pointer"
              >
                <Megaphone className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />
                <div className="leading-tight">
                  <span className="font-bold block text-[#37352F] text-[11px]">Plantilla de Difusión</span>
                  <span className="text-[9px] text-gray-400 font-mono">Mensajes para WhatsApp y Slack</span>
                </div>
              </button>

              <button
                id="btn-ai-recommend-space"
                disabled={!selectedEventId || isLoading}
                onClick={() => handleAction('recommend_space')}
                className="w-full flex items-center space-x-2 p-2 border border-gray-200 hover:border-purple-300 rounded text-xs text-left text-gray-700 hover:bg-[#FBFBFA] transition-all disabled:opacity-50 cursor-pointer"
              >
                <MapPin className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />
                <div className="leading-tight">
                  <span className="font-bold block text-[#37352F] text-[11px]">Recomendar Espacio Físico</span>
                  <span className="text-[9px] text-gray-400 font-mono">Analiza capacidad e idoneidad</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Right column: Response View & Chat */}
        <div id="ai-response-col" className="md:col-span-2 flex flex-col space-y-3.5">
          {/* Response Container */}
          <div className="flex-1 border border-[#ececec] rounded bg-white p-4.5 flex flex-col justify-between min-h-[350px] shadow-2xs">
            <div className="space-y-3.5">
              <div className="flex justify-between items-center pb-2.5 border-b border-gray-100">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                  <span>Respuesta del Asistente Gemini AI</span>
                </span>
                
                {response && (
                  <button
                    id="btn-copy-response"
                    onClick={handleCopy}
                    className="p-1 hover:bg-gray-100 rounded text-[#8A8984] hover:text-[#37352F] flex items-center space-x-1 text-[10px] font-semibold transition-colors"
                  >
                    {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Copiado' : 'Copiar'}</span>
                  </button>
                )}
              </div>

              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-3 text-center">
                  <Loader2 className="w-6 h-6 text-purple-600 animate-spin" />
                  <span className="text-xs text-gray-500 font-semibold">Gemini está pensando y redactando tu respuesta...</span>
                </div>
              ) : response ? (
                <div className="text-xs text-gray-800 leading-relaxed whitespace-pre-line prose max-w-none">
                  {response}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center text-[#8A8984] space-y-2">
                  <HelpCircle className="w-8 h-8 text-gray-300" />
                  <div className="max-w-xs">
                    <span className="font-bold block text-gray-500 text-xs">¿Cómo empezar?</span>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Selecciona una actividad a la izquierda y elige una Acción Rápida, o escribe una consulta libre abajo.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="text-[9px] text-gray-400 pt-3 border-t border-gray-100 mt-5 font-mono">
              Las sugerencias son guías de soporte. La aprobación final es humana.
            </div>
          </div>

          {/* Prompt Input Chat Bar */}
          <form 
            id="ai-prompt-form"
            onSubmit={handleCustomSubmit}
            className="flex items-center space-x-1.5 border border-[#ececec] bg-[#FAF9F6] rounded p-2 shadow-2xs"
          >
            <input
              id="ai-prompt-input"
              type="text"
              placeholder={selectedEvent ? `Escribe instrucciones personalizadas para: "${selectedEvent.title}"...` : "Pregunta cualquier consulta de gestión académica a la IA..."}
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              disabled={isLoading}
              className="flex-1 bg-white border border-gray-200 rounded py-1.5 px-3 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-purple-400 placeholder-gray-400"
            />
            <button
              id="btn-send-prompt"
              type="submit"
              disabled={isLoading || !customPrompt.trim()}
              className="p-2 rounded bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50 transition-colors shadow-2xs flex items-center justify-center"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
