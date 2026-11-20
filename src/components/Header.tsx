import React from 'react';
import {
  Plus,
  LogOut,
  MessageSquare,
} from 'lucide-react';
import { SessionUser, AppNotification } from '../types/custody';
import { NotificationCenterBell } from './NotificationCenterBell';

interface HeaderProps {
  currentUser: SessionUser;
  activeTab: 'queue' | 'lockers' | 'audit' | 'citizen_reports' | 'users' | 'database';
  onTabChange: (tab: 'queue' | 'lockers' | 'audit' | 'citizen_reports' | 'users' | 'database') => void;
  onOpenIntakeModal: () => void;
  onLogout: () => void;
  onGoToLanding?: () => void;
  inCustodyCount: number;
  lockedCount: number;
  citizenReportsCount: number;
  notifications: AppNotification[];
  onMarkNotificationRead: (id: string) => void;
  onMarkAllNotificationsRead: () => void;
  onOpenChat: (threadId?: string, threadTitle?: string) => void;
  totalMessagesCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  activeTab,
  onTabChange,
  onOpenIntakeModal,
  onLogout,
  onGoToLanding,
  inCustodyCount,
  citizenReportsCount,
  notifications,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  onOpenChat,
  totalMessagesCount,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[#ebebeb]">
      {/* 1. Cobalt Announcement Bar (#0700ff) — Sole chromatic interruption */}
      <div className="w-full h-8 bg-[#0700ff] px-6 text-white flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-3 truncate">
          <span className="font-medium tracking-[-0.14px]">
            SENA Regional Huila · CIES Neiva · ADSO Ficha 3413988
          </span>
          {onGoToLanding && (
            <>
              <span className="opacity-50">|</span>
              <button
                type="button"
                onClick={onGoToLanding}
                className="underline underline-offset-2 hover:opacity-80 transition cursor-pointer"
              >
                Galería de Inicio
              </button>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="opacity-80 hidden sm:inline">Rol en Sesión:</span>
          <span className="uppercase tracking-[0.14em] font-medium text-[11px]">
            {currentUser.role === 'admin'
              ? 'ADMINISTRADOR GENERAL'
              : currentUser.role === 'employee'
              ? 'EMPLEADO DE CUSTODIA'
              : 'CLIENTE'}
          </span>
        </div>
      </div>

      {/* 2. Primary Navigation Bar — Flat white gallery chrome */}
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4">
        {/* Wordmark */}
        <div
          onClick={onGoToLanding}
          className={`flex items-center gap-3 ${onGoToLanding ? 'cursor-pointer' : ''}`}
        >
          <span className="text-[16px] font-medium tracking-[-0.02em] text-black">
            Custodia.Space
          </span>
          <span className="rounded-full border border-[#ebebeb] px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-[#b5b5b5]">
            BÓVEDA SENA
          </span>
        </div>

        {/* Navigation Links */}
        <nav className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onTabChange('queue')}
            className={`rounded-full px-4 py-1.5 text-[13px] transition cursor-pointer ${
              activeTab === 'queue'
                ? 'bg-black text-white font-medium'
                : 'bg-white text-black border border-[#ebebeb] hover:border-black font-normal'
            }`}
          >
            Archivo en Custodia ({inCustodyCount})
          </button>

          <button
            type="button"
            onClick={() => onTabChange('lockers')}
            className={`rounded-full px-4 py-1.5 text-[13px] transition cursor-pointer ${
              activeTab === 'lockers'
                ? 'bg-black text-white font-medium'
                : 'bg-white text-black border border-[#ebebeb] hover:border-black font-normal'
            }`}
          >
            Matriz de Casilleros
          </button>

          <button
            type="button"
            onClick={() => onTabChange('audit')}
            className={`rounded-full px-4 py-1.5 text-[13px] transition cursor-pointer ${
              activeTab === 'audit'
                ? 'bg-black text-white font-medium'
                : 'bg-white text-black border border-[#ebebeb] hover:border-black font-normal'
            }`}
          >
            Bitácora SHA-256
          </button>

          <button
            type="button"
            onClick={() => onTabChange('citizen_reports')}
            className={`rounded-full px-4 py-1.5 text-[13px] transition cursor-pointer ${
              activeTab === 'citizen_reports'
                ? 'bg-black text-white font-medium'
                : 'bg-white text-black border border-[#ebebeb] hover:border-black font-normal'
            }`}
          >
            Reportes ({citizenReportsCount})
          </button>

          {currentUser.role === 'admin' && (
            <button
              type="button"
              onClick={() => onTabChange('users')}
              className={`rounded-full px-4 py-1.5 text-[13px] transition cursor-pointer ${
                activeTab === 'users'
                  ? 'bg-black text-white font-medium'
                  : 'bg-white text-black border border-[#ebebeb] hover:border-black font-normal'
              }`}
            >
              Usuarios & Roles (RF-02)
            </button>
          )}

          <button
            type="button"
            onClick={() => onTabChange('database')}
            className={`rounded-full px-4 py-1.5 text-[13px] transition cursor-pointer ${
              activeTab === 'database'
                ? 'bg-black text-white font-medium'
                : 'bg-white text-black border border-[#ebebeb] hover:border-black font-normal'
            }`}
          >
            Base de Datos (DB)
          </button>
        </nav>

        {/* Actions & User */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => onOpenChat()}
            className="flex items-center gap-1.5 rounded-full border border-[#ebebeb] hover:border-black bg-white px-3.5 py-2 text-[13px] font-normal text-black transition cursor-pointer"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span>Chat ({totalMessagesCount})</span>
          </button>

          <NotificationCenterBell
            currentUser={currentUser}
            notifications={notifications}
            onMarkAsRead={onMarkNotificationRead}
            onMarkAllAsRead={onMarkAllNotificationsRead}
            onOpenChatThread={(threadId, title) => onOpenChat(threadId, title)}
          />

          <button
            type="button"
            onClick={onOpenIntakeModal}
            className="flex items-center gap-1.5 rounded-full bg-black px-4 py-2 text-[13px] font-medium text-white hover:bg-neutral-800 transition cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Registrar Hallazgo</span>
          </button>

          <div className="h-5 w-[1px] bg-[#ebebeb]" />

          <div className="flex items-center gap-2.5">
            <div className="hidden lg:block text-right text-xs leading-tight">
              <p className="font-medium text-black">{currentUser.name}</p>
              <p className="text-[11px] font-mono text-[#b5b5b5]">
                {currentUser.badgeNumber || currentUser.role}
              </p>
            </div>
            <button
              type="button"
              onClick={onLogout}
              title="Cerrar Sesión"
              className="rounded-full border border-[#ebebeb] hover:border-black p-2 text-black transition cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
