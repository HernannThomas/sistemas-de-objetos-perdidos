import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  X,
  User,
  ShieldCheck,
  Clock,
} from 'lucide-react';
import { DirectMessage, SessionUser, CustodyItem, CitizenLostReport } from '../types/custody';
import { sfx } from '../utils/audio';

interface DirectChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: SessionUser;
  messages: DirectMessage[];
  items: CustodyItem[];
  reports: CitizenLostReport[];
  activeThreadId: string | null;
  activeThreadTitle?: string;
  onSelectThread: (threadId: string, title: string) => void;
  onSendMessage: (threadId: string, threadTitle: string, text: string) => void;
}

export const DirectChatDrawer: React.FC<DirectChatDrawerProps> = ({
  isOpen,
  onClose,
  currentUser,
  messages,
  items,
  reports,
  activeThreadId,
  activeThreadTitle,
  onSelectThread,
  onSendMessage,
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Construir lista de canales/hilos de conversación disponibles
  const threads = useMemo(() => {
    const map = new Map<
      string,
      {
        threadId: string;
        title: string;
        lastMessage?: DirectMessage;
        count: number;
      }
    >();

    // Agregar hilos que ya tienen mensajes
    messages.forEach((m) => {
      const existing = map.get(m.threadId);
      map.set(m.threadId, {
        threadId: m.threadId,
        title: m.threadTitle || existing?.title || m.threadId,
        lastMessage: m,
        count: (existing?.count || 0) + 1,
      });
    });

    // Si hay un hilo activo seleccionado que aún no tiene mensajes, incluirlo al principio
    if (activeThreadId && !map.has(activeThreadId)) {
      const foundItem = items.find(
        (i) => i.id === activeThreadId || i.trackingCode === activeThreadId
      );
      const foundReport = reports.find((r) => r.id === activeThreadId);
      const title =
        activeThreadTitle ||
        (foundItem
          ? `${foundItem.trackingCode} · ${foundItem.title}`
          : foundReport
          ? `${foundReport.id} · ${foundReport.title}`
          : `Canal Directo · ${activeThreadId}`);

      map.set(activeThreadId, {
        threadId: activeThreadId,
        title,
        count: 0,
      });
    }

    // Si aún no hay hilos, pre-cargar los primeros objetos/reportes para conversar
    if (map.size === 0) {
      items.slice(0, 3).forEach((item) => {
        map.set(item.trackingCode, {
          threadId: item.trackingCode,
          title: `${item.trackingCode} · ${item.title}`,
          count: 0,
        });
      });
    }

    return Array.from(map.values());
  }, [messages, activeThreadId, activeThreadTitle, items, reports]);

  const currentThreadId = activeThreadId || threads[0]?.threadId || 'SOP-2026-0142-A';
  const currentThreadObj = threads.find((t) => t.threadId === currentThreadId);
  const currentTitle =
    currentThreadObj?.title || activeThreadTitle || `Conversación · ${currentThreadId}`;

  const threadMessages = useMemo(
    () => messages.filter((m) => m.threadId === currentThreadId),
    [messages, currentThreadId]
  );

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [threadMessages.length, isOpen, currentThreadId]);

  if (!isOpen) return null;

  const quickReplies =
    currentUser.role === 'user'
      ? [
          'Hola, este objeto me pertenece. ¿A qué hora puedo acercarme a recepción?',
          'Cuento con factura y pruebas de propiedad para la validación del 70%.',
          'Acabo de radicar mi reporte, quedo atento a cualquier novedad.',
        ]
      : [
          'Hola, tu objeto se encuentra resguardado en la Bóveda Central CIES (Casillero asignado).',
          'Por favor acércate a Recepción de Lunes a Viernes (7:00 a 17:00) con tu documento original.',
          'Hemos verificado tu solicitud y desbloqueado tus intentos de validación.',
        ];

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sfx.playClick();
    onSendMessage(currentThreadId, currentTitle, inputText.trim());
    setInputText('');
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60">
      <div className="w-full max-w-3xl bg-white h-full flex flex-col border-l border-black">
        {/* Cabecera del Chat */}
        <div className="bg-black text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-5 w-5 text-white" />
            <div>
              <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#b5b5b5] block">
                MENSAJERÍA DIRECTA · CLIENTE ↔ CUSTODIA SENA
              </span>
              <h3 className="text-[16px] font-medium text-white truncate max-w-md">
                {currentTitle}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/25 hover:border-white p-1.5 text-white transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Cuerpo dividido: Lista de Conversaciones (Izquierda) + Mensajes (Derecha) */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 min-h-0 overflow-hidden">
          {/* Columna Izquierda: Hilos de Conversación */}
          <div className="md:col-span-4 border-b md:border-b-0 md:border-r border-[#ebebeb] bg-[#f7f7f7] overflow-y-auto">
            <div className="p-3 border-b border-[#ebebeb] text-[11px] font-medium uppercase tracking-[0.18em] text-[#b5b5b5]">
              Canales de Entrega ({threads.length})
            </div>
            <div className="divide-y divide-[#ebebeb]">
              {threads.map((t) => {
                const isSelected = t.threadId === currentThreadId;
                return (
                  <button
                    key={t.threadId}
                    type="button"
                    onClick={() => onSelectThread(t.threadId, t.title)}
                    className={`w-full text-left p-3.5 transition cursor-pointer ${
                      isSelected
                        ? 'bg-white border-l-2 border-l-black'
                        : 'hover:bg-white/60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className="font-mono text-[11px] font-bold text-black truncate">
                        {t.threadId}
                      </span>
                      <span className="rounded-full bg-[#ebebeb] px-2 py-0.2 text-[10px] font-mono text-black">
                        {t.count} msj
                      </span>
                    </div>
                    <p className="text-[12px] font-medium text-black line-clamp-1">
                      {t.title}
                    </p>
                    {t.lastMessage && (
                      <p className="text-[11px] text-[#b5b5b5] line-clamp-1 mt-0.5">
                        {t.lastMessage.senderName}: {t.lastMessage.text}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Columna Derecha: Historial de Mensajes del Hilo */}
          <div className="md:col-span-8 flex flex-col min-h-0 bg-white">
            <div className="flex-1 p-5 overflow-y-auto space-y-3">
              {threadMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#b5b5b5]">
                  <MessageSquare className="h-8 w-8 mb-2 stroke-[1.5]" />
                  <p className="text-[14px] font-medium text-black">
                    Canal de Coordinación Directa Abierto
                  </p>
                  <p className="text-[12px] text-[#b5b5b5] max-w-sm mt-1">
                    Escribe un mensaje o usa una respuesta rápida abajo para coordinar la validación presencial o entrega de este objeto.
                  </p>
                </div>
              ) : (
                threadMessages.map((msg) => {
                  const isMine =
                    msg.senderId === currentUser.id ||
                    msg.senderEmail.toLowerCase() === currentUser.email.toLowerCase();
                  const isStaff = msg.senderRole === 'employee' || msg.senderRole === 'admin';

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 px-1">
                        {isStaff ? (
                          <ShieldCheck className="h-3 w-3 text-black" />
                        ) : (
                          <User className="h-3 w-3 text-[#b5b5b5]" />
                        )}
                        <span className="text-[11px] font-medium text-black">
                          {msg.senderName}
                        </span>
                        <span className="rounded-full bg-[#f7f7f7] border border-[#ebebeb] px-2 py-0.2 text-[9px] font-mono uppercase text-black">
                          {msg.senderRole === 'user'
                            ? 'Cliente'
                            : msg.senderRole === 'admin'
                            ? 'Admin'
                            : 'Custodio'}
                        </span>
                        <span className="font-mono text-[10px] text-[#b5b5b5] flex items-center gap-0.5">
                          <Clock className="h-2.5 w-2.5" />
                          {msg.timestamp}
                        </span>
                      </div>

                      <div
                        className={`max-w-md rounded-[2px] px-4 py-2.5 text-[13px] leading-relaxed ${
                          isMine
                            ? 'bg-black text-white'
                            : 'bg-[#f7f7f7] text-black border border-[#ebebeb]'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Respuestas Rápidas con 1 Clic */}
            <div className="px-4 py-2 bg-[#f7f7f7] border-t border-[#ebebeb] flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-[#b5b5b5] shrink-0 mr-1">
                Rápido:
              </span>
              {quickReplies.map((reply, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    sfx.playClick();
                    onSendMessage(currentThreadId, currentTitle, reply);
                  }}
                  className="rounded-full bg-white border border-[#ebebeb] hover:border-black px-3 py-1 text-[11px] text-black whitespace-nowrap transition cursor-pointer"
                >
                  {reply}
                </button>
              ))}
            </div>

            {/* Formulario de Envío */}
            <form
              onSubmit={handleSend}
              className="p-4 border-t border-[#ebebeb] bg-white flex items-center gap-2"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Escribe un mensaje para coordinar la entrega..."
                className="flex-1 rounded-full border border-[#ebebeb] bg-[#f7f7f7] px-4 py-2.5 text-[13px] text-black placeholder-[#b5b5b5] focus:bg-white focus:border-black focus:outline-none transition"
              />
              <button
                type="submit"
                className="rounded-full bg-black text-white px-5 py-2.5 text-[13px] font-medium hover:bg-neutral-800 transition flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Enviar</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
