import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  CheckCheck,
  MessageSquare,
  ShieldAlert,
  CheckCircle2,
  Package,
  Sparkles,
} from 'lucide-react';
import { AppNotification, SessionUser } from '../types/custody';
import { sfx } from '../utils/audio';

interface NotificationCenterBellProps {
  currentUser: SessionUser;
  notifications: AppNotification[];
  onMarkAsRead: (notificationId: string) => void;
  onMarkAllAsRead: () => void;
  onOpenChatThread?: (threadId: string, threadTitle: string) => void;
}

export const NotificationCenterBell: React.FC<NotificationCenterBellProps> = ({
  currentUser,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onOpenChatThread,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filterUnread, setFilterUnread] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filtrar notificaciones relevantes para el rol / correo del usuario actual
  const relevantNotifications = notifications.filter((n) => {
    if (n.targetRole === 'all') return true;
    if (currentUser.role === 'user') {
      if (n.targetRole !== 'client') return false;
      if (
        n.targetUserEmail &&
        n.targetUserEmail.toLowerCase().trim() !== currentUser.email.toLowerCase().trim()
      ) {
        return false;
      }
      return true;
    } else {
      // Empleado o Admin ven las notificaciones dirigidas a 'staff'
      return n.targetRole === 'staff';
    }
  });

  const unreadCount = relevantNotifications.filter(
    (n) => !n.readByUserIds.includes(currentUser.id)
  ).length;

  const displayedNotifications = filterUnread
    ? relevantNotifications.filter((n) => !n.readByUserIds.includes(currentUser.id))
    : relevantNotifications;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'MATCH':
        return <Sparkles className="h-4 w-4 text-black shrink-0" />;
      case 'CLAIM':
        return <CheckCircle2 className="h-4 w-4 text-black shrink-0" />;
      case 'MESSAGE':
        return <MessageSquare className="h-4 w-4 text-black shrink-0" />;
      case 'SECURITY':
        return <ShieldAlert className="h-4 w-4 text-black shrink-0" />;
      default:
        return <Package className="h-4 w-4 text-black shrink-0" />;
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => {
          sfx.playClick();
          setIsOpen(!isOpen);
        }}
        title="Centro de Notificaciones"
        className="relative rounded-full border border-[#ebebeb] hover:border-black bg-white p-2 text-black transition cursor-pointer"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#0700ff] px-1 font-mono text-[10px] font-bold text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-[2px] bg-white border border-black z-50 overflow-hidden">
          {/* Cabecera */}
          <div className="bg-black text-white px-4 py-3 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-medium uppercase tracking-[0.2em] block">
                CENTRO DE NOTIFICACIONES
              </span>
              <span className="text-[11px] text-[#b5b5b5]">
                {unreadCount} sin leer · Tiempo real
              </span>
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  sfx.playClick();
                  onMarkAllAsRead();
                }}
                className="rounded-full bg-white/15 hover:bg-white/25 text-white px-2.5 py-1 text-[10px] font-medium flex items-center gap-1 transition cursor-pointer"
              >
                <CheckCheck className="h-3 w-3" />
                <span>Leer todas</span>
              </button>
            )}
          </div>

          {/* Filtros */}
          <div className="flex items-center justify-between px-4 py-2 bg-[#f7f7f7] border-b border-[#ebebeb] text-xs">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setFilterUnread(false)}
                className={`rounded-full px-3 py-0.5 text-[11px] transition cursor-pointer ${
                  !filterUnread
                    ? 'bg-black text-white font-medium'
                    : 'bg-white text-black border border-[#ebebeb]'
                }`}
              >
                Todas ({relevantNotifications.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterUnread(true)}
                className={`rounded-full px-3 py-0.5 text-[11px] transition cursor-pointer ${
                  filterUnread
                    ? 'bg-black text-white font-medium'
                    : 'bg-white text-black border border-[#ebebeb]'
                }`}
              >
                No leídas ({unreadCount})
              </button>
            </div>
          </div>

          {/* Lista de Notificaciones */}
          <div className="max-h-80 overflow-y-auto divide-y divide-[#ebebeb]">
            {displayedNotifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#b5b5b5]">
                No tienes notificaciones {filterUnread ? 'pendientes por leer' : 'registradas'}.
              </div>
            ) : (
              displayedNotifications.map((notif) => {
                const isUnread = !notif.readByUserIds.includes(currentUser.id);
                return (
                  <div
                    key={notif.id}
                    onClick={() => {
                      onMarkAsRead(notif.id);
                      if (notif.relatedThreadId && onOpenChatThread) {
                        onOpenChatThread(notif.relatedThreadId, notif.title);
                        setIsOpen(false);
                      }
                    }}
                    className={`p-3.5 transition cursor-pointer hover:bg-[#f7f7f7] ${
                      isUnread ? 'bg-white border-l-2 border-l-[#0700ff]' : 'bg-[#f7f7f7]/50 opacity-75'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5">{getIcon(notif.type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[12px] font-medium text-black truncate">
                            {notif.title}
                          </span>
                          {isUnread && (
                            <span className="h-2 w-2 rounded-full bg-[#0700ff] shrink-0" />
                          )}
                        </div>
                        <p className="text-[12px] text-[#555555] leading-snug mt-0.5">
                          {notif.message}
                        </p>
                        <div className="flex items-center justify-between mt-1.5">
                          <span className="font-mono text-[10px] text-[#b5b5b5]">
                            {notif.timestamp}
                          </span>
                          {notif.relatedThreadId && (
                            <span className="text-[10px] font-medium text-black underline">
                              Abrir Chat →
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
