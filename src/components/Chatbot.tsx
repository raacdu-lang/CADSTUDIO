import React, { useState, useRef, useEffect } from 'react';
import { StudioConfig } from '../types';
import {
  getCombinedBotPromptKnowledge,
  saveOrUpdateClientConversation,
} from '../services/storageService';
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  Bot,
  User,
  ArrowRight,
  MessageCircle,
  HelpCircle,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface ChatbotProps {
  config: StudioConfig;
}

const INITIAL_SUGGESTIONS = [
  '¿Cuánto cuesta la cobertura de una Boda?',
  'Presupuesto para sesión de Gastronomía',
  'Tarifas para Arquitectura e Interiorismo',
  '¿Cómo descargo mis archivos originales?',
];

export const Chatbot: React.FC<ChatbotProps> = ({ config }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [sessionId] = useState<string>(() => {
    try {
      let s = sessionStorage.getItem('cadstudio_chat_sess');
      if (!s) {
        s = 'sess-client-' + Date.now();
        sessionStorage.setItem('cadstudio_chat_sess', s);
      }
      return s;
    } catch {
      return 'sess-client-' + Date.now();
    }
  });

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      role: 'assistant',
      content: `¡Hola! Soy el asistente 24/7 de ${config.studioName}. ¿Tienes alguna pregunta sobre nuestros servicios o deseas calcular un presupuesto personalizado para una boda, gastronomía, arquitectura o retrato?`,
      timestamp: 'Ahora',
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      inputRef.current?.focus();
    }
  }, [messages, isOpen]);

  const persistToDatabase = (updatedMessages: ChatMessage[]) => {
    try {
      const firstUserMsg = updatedMessages.find((m) => m.role === 'user');
      const lastUserMsg = [...updatedMessages].reverse().find((m) => m.role === 'user');
      const textSample = lastUserMsg?.content.toLowerCase() || '';

      const detectedStatus = textSample.includes('presupuesto') || textSample.includes('cuesta') || textSample.includes('precio')
        ? 'presupuesto_solicitado' as const
        : textSample.includes('llamar') || textSample.includes('cita') || textSample.includes('reunir')
        ? 'cita_propuesta' as const
        : 'nuevo' as const;

      saveOrUpdateClientConversation({
        id: sessionId,
        sessionId,
        clientName: 'Cliente Web Directo',
        startedAt: new Date().toISOString(),
        lastUpdatedAt: new Date().toISOString(),
        leadStatus: detectedStatus,
        summary: firstUserMsg ? firstUserMsg.content.substring(0, 100) : 'Consulta inicial de servicios',
        messages: updatedMessages.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          timestamp: m.timestamp,
        })),
      });
    } catch (err) {
      console.warn('Could not persist conversation to database:', err);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: 'user-' + Date.now(),
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInputMessage('');
    setIsLoading(true);

    try {
      const customKnowledge = getCombinedBotPromptKnowledge();

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customKnowledge,
          messages: newHistory.map((m) => ({
            role: m.role === 'user' ? 'user' : 'model',
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('Error en la respuesta del servidor');
      }

      const data = await response.json();
      const assistantMsg: ChatMessage = {
        id: 'bot-' + Date.now(),
        role: 'assistant',
        content: data.reply || 'Disculpa, ¿podrías darme más detalles de tu solicitud?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      const finalHistory = [...newHistory, assistantMsg];
      setMessages(finalHistory);
      persistToDatabase(finalHistory);
    } catch (err: any) {
      console.error(err);
      // Fallback response with accurate pricing knowledge
      const fallbackReply = text.toLowerCase().includes('boda')
        ? 'Nuestras coberturas de Bodas parten desde 2.900€ (hasta 8h) y 4.500€ para Bodas de Destino con 2 fotógrafos y álbum. Todo se entrega sin compresión en nuestra suite privada con PIN. ¿En qué fecha y lugar sería?'
        : text.toLowerCase().includes('gastronom') || text.toLowerCase().includes('restaurante')
        ? 'Para Gastronomía de autor contamos con media jornada (desde 1.400€) y jornada completa con estilismo (desde 2.400€). Incluye captura en formato medio y entrega en alta resolución. ¿Cuántos platos o espacios deseas fotografiar?'
        : text.toLowerCase().includes('arquitect')
        ? 'Para proyectos de Arquitectura e Interiorismo las tarifas inician en 1.800€ con lentes descentrables tilt-shift para líneas verticales perfectas. ¿De qué tipo de espacio se trata?'
        : 'Disponemos de presupuestos adaptados a cada necesidad con entrega privada 100% original. Puedes escribirnos a ' +
          config.email +
          ' o por WhatsApp al ' +
          config.whatsapp +
          ' para formalizar tu cotización.';

      const assistantMsg: ChatMessage = {
        id: 'bot-' + Date.now(),
        role: 'assistant',
        content: fallbackReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      const finalHistory = [...newHistory, assistantMsg];
      setMessages(finalHistory);
      persistToDatabase(finalHistory);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: 'welcome-reset',
        role: 'assistant',
        content: `Conversación reiniciada. ¿En qué puedo orientarte hoy para tu producción con ${config.studioName}?`,
        timestamp: 'Ahora',
      },
    ]);
  };

  const handleWhatsAppFromChat = () => {
    const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user')?.content || 'Consulta de presupuesto';
    const text = encodeURIComponent(
      `Hola ${config.photographerName}, estuve conversando con su asistente 24/7 en CADSTUDIO sobre: "${lastUserMessage}". Me gustaría reservar o afinar detalles.`
    );
    window.open(`https://wa.me/${config.whatsapp.replace(/[^0-9]/g, '')}?text=${text}`, '_blank');
  };

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 left-6 z-40 px-4 py-3 bg-[#0E2931] hover:bg-[#102d35] border border-[#2B7574]/60 text-[#E2E2E0] rounded-full shadow-2xl transition-all duration-300 flex items-center gap-2.5 group hover:border-[#2B7574] hover:scale-105"
          aria-label="Abrir asistente 24/7 de CADSTUDIO"
        >
          <div className="relative">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping absolute -top-0.5 -right-0.5" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 absolute -top-0.5 -right-0.5" />
            <Bot className="w-4 h-4 text-[#2B7574] group-hover:rotate-12 transition-transform" />
          </div>
          <div className="text-left">
            <span className="text-xs font-bold text-[#E2E2E0] block tracking-wide">
              Chatbot 24/7
            </span>
            <span className="text-[10px] text-zinc-400 font-mono-data block -mt-0.5">
              Cotizador & Consultas
            </span>
          </div>
        </button>
      )}

      {/* Floating Chat Modal */}
      {isOpen && (
        <div className="fixed bottom-5 left-5 z-50 w-[92vw] sm:w-[420px] h-[550px] max-h-[85vh] bg-[#070e11] border border-[#2B7574]/50 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
          {/* Header */}
          <div className="p-4 bg-[#0E2931] border-b border-[#2B7574]/40 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#2B7574]/20 border border-[#2B7574]/40 flex items-center justify-center text-[#2B7574]">
                <Bot className="w-4 h-4 text-[#E2E2E0]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-[#E2E2E0] tracking-wide">
                    {config.studioName} AI Concierge
                  </h3>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-mono-data bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                    24/7 Online
                  </span>
                </div>
                <p className="text-[10px] text-zinc-400">
                  Presupuestos adaptados & información en vivo
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleResetChat}
                className="p-1.5 text-zinc-400 hover:text-[#E2E2E0] rounded-lg transition-colors"
                title="Reiniciar chat"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg transition-colors"
                title="Cerrar chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Suggestions Chips */}
          <div className="px-3 py-2 bg-[#070e11] border-b border-[#2B7574]/20 flex gap-1.5 overflow-x-auto no-scrollbar">
            {INITIAL_SUGGESTIONS.map((s, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(s)}
                className="px-2.5 py-1 text-[11px] font-medium text-[#E2E2E0] hover:text-white bg-[#0E2931] hover:bg-[#2B7574]/30 border border-[#2B7574]/40 rounded-full whitespace-nowrap shrink-0 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>

          {/* Chat Messages Log */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs leading-relaxed bg-[#070e11]">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-lg bg-[#0E2931] border border-[#2B7574]/50 flex items-center justify-center text-[#2B7574] shrink-0 mt-0.5">
                    <Sparkles className="w-3 h-3 text-[#2B7574]" />
                  </div>
                )}

                <div
                  className={`max-w-[82%] p-3 rounded-2xl ${
                    m.role === 'user'
                      ? 'bg-[#2B7574] text-[#E2E2E0] rounded-tr-sm shadow-md'
                      : 'bg-[#0E2931] text-[#E2E2E0] border border-[#2B7574]/40 rounded-tl-sm shadow-sm'
                  }`}
                >
                  <p className="whitespace-pre-line font-light">{m.content}</p>
                  <span
                    className={`block text-[9px] font-mono-data mt-1.5 ${
                      m.role === 'user' ? 'text-zinc-200 text-right' : 'text-zinc-400 text-left'
                    }`}
                  >
                    {m.timestamp}
                  </span>
                </div>

                {m.role === 'user' && (
                  <div className="w-6 h-6 rounded-lg bg-[#0E2931] border border-[#2B7574]/40 flex items-center justify-center text-[#E2E2E0] shrink-0 mt-0.5">
                    <User className="w-3 h-3" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2.5 justify-start">
                <div className="w-6 h-6 rounded-lg bg-[#0E2931] border border-[#2B7574]/50 flex items-center justify-center text-[#2B7574] shrink-0">
                  <Sparkles className="w-3 h-3 animate-spin text-[#2B7574]" />
                </div>
                <div className="bg-[#0E2931] text-zinc-300 border border-[#2B7574]/40 rounded-2xl rounded-tl-sm p-3 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2B7574] animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2B7574] animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2B7574] animate-bounce [animation-delay:0.4s]" />
                  <span className="text-[11px] text-zinc-300 ml-1">Calculando presupuesto...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* WhatsApp Direct Action Banner */}
          <div className="px-3.5 py-1.5 bg-[#0E2931] border-t border-[#2B7574]/30 flex items-center justify-between text-[11px]">
            <span className="text-zinc-300 truncate">¿Deseas cerrar fecha con Mateo?</span>
            <button
              onClick={handleWhatsAppFromChat}
              className="text-[#2B7574] hover:text-[#3b9493] font-semibold flex items-center gap-1 transition-colors shrink-0"
            >
              <MessageCircle className="w-3 h-3" />
              <span>WhatsApp</span>
            </button>
          </div>

          {/* Input Bar */}
          <div className="p-3 bg-[#0E2931] border-t border-[#2B7574]/40 flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe tu consulta o pide un presupuesto..."
              disabled={isLoading}
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#070e11] border border-[#2B7574]/50 text-white text-xs placeholder:text-zinc-500 focus:outline-none focus:border-[#2B7574]"
            />

            <button
              onClick={() => handleSendMessage()}
              disabled={!inputMessage.trim() || isLoading}
              className="p-2.5 rounded-xl bg-[#2B7574] hover:bg-[#3b9493] disabled:opacity-40 text-[#E2E2E0] transition-colors shrink-0"
              aria-label="Enviar mensaje"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
