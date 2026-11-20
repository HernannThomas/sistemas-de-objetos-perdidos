import React, { useState } from 'react';
import {
  Search,
  CheckCircle2,
  Clock,
  MapPin,
  Calendar,
  Send,
  HelpCircle,
  AlertCircle,
  FileText,
  User,
  LogOut,
  Camera,
  Laptop,
  Wallet,
  Gem,
  Key,
  Luggage,
  Package,
  ShieldCheck,
  PlusCircle,
  Sparkles,
  Upload,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import {
  CustodyItem,
  SessionUser,
  ItemCategory,
  CitizenLostReport,
  FailedAttempt,
  ClaimantRecord,
  AppNotification,
} from '../types/custody';
import { StatusBadge } from './StatusBadge';
import { NotificationCenterBell } from './NotificationCenterBell';
import { sfx } from '../utils/audio';

interface CitizenPortalProps {
  currentUser: SessionUser;
  items: CustodyItem[];
  reports: CitizenLostReport[];
  notifications: AppNotification[];
  totalMessagesCount: number;
  onMarkNotificationRead: (id: string) => void;
  onMarkAllNotificationsRead: () => void;
  onOpenChat: (threadId?: string, threadTitle?: string) => void;
  onCreateReport: (report: CitizenLostReport) => void;
  onUpdateReport?: (updatedReport: CitizenLostReport) => void;
  onDeleteReport?: (reportId: string) => void;
  onRegisterFailedAttempt: (
    itemId: string,
    attempt: Omit<FailedAttempt, 'id' | 'timestamp'>
  ) => void;
  onCompleteClaim?: (itemId: string, record: ClaimantRecord) => void;
  onLogout: () => void;
  onGoToLanding?: () => void;
}

const SAMPLE_PHOTO_PRESETS = [
  { label: 'Smartphone / Móvil', url: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=800&q=80', category: 'electronics' as ItemCategory },
  { label: 'Billetera', url: 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=800&q=80', category: 'wallets_ids' as ItemCategory },
  { label: 'Portátil / Laptop', url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80', category: 'electronics' as ItemCategory },
  { label: 'Mochila / Morral', url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80', category: 'luggage' as ItemCategory },
  { label: 'Llavero', url: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?auto=format&fit=crop&w=800&q=80', category: 'keys' as ItemCategory },
];

export const CitizenPortal: React.FC<CitizenPortalProps> = ({
  currentUser,
  items,
  reports,
  notifications,
  totalMessagesCount,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  onOpenChat,
  onCreateReport,
  onUpdateReport,
  onDeleteReport,
  onRegisterFailedAttempt,
  onCompleteClaim,
  onLogout,
  onGoToLanding,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isClaimValidationOpen, setIsClaimValidationOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'LOST' | 'FOUND'>('LOST');

  // Respuestas del Cliente en el cuestionario de validación de propiedad
  const [ansBrand, setAnsBrand] = useState('');
  const [ansColor, setAnsColor] = useState('');
  const [ansPlace, setAnsPlace] = useState('');
  const [ansMarks, setAnsMarks] = useState('');
  const [ansSecurity, setAnsSecurity] = useState('');
  const [claimFeedback, setClaimFeedback] = useState<{
    type: 'error' | 'success' | 'blocked';
    message: string;
  } | null>(null);

  const selectedItem = items.find((i) => i.id === selectedItemId) || null;

  // Función auxiliar: obtener únicamente los intentos fallidos de ESTE cliente en un producto
  const getClientFailedAttempts = (item: CustodyItem) => {
    if (!item.failedAttempts) return [];
    return item.failedAttempts.filter(
      (att) =>
        (att.userId && att.userId === currentUser.id) ||
        (att.userEmail &&
          att.userEmail.toLowerCase().trim() === currentUser.email.toLowerCase().trim())
    );
  };

  // Formulario nuevo reporte
  const [repName, setRepName] = useState(currentUser.name || 'Aprendiz / Visitante');
  const [repPhone, setRepPhone] = useState(currentUser.phone || '+57 312 000 0000');
  const [repEmail, setRepEmail] = useState(currentUser.email || '');
  const [repTitle, setRepTitle] = useState('');
  const [repBrand, setRepBrand] = useState('');
  const [repColor, setRepColor] = useState('');
  const [repPlace, setRepPlace] = useState('');
  const [repDate, setRepDate] = useState('18/11/2026');
  const [repMarks, setRepMarks] = useState('');
  const [repCategory, setRepCategory] = useState<ItemCategory>('electronics');
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoError, setPhotoError] = useState<string | null>(null);

  // Filtrar artículos públicos (solo en custodia, no entregados ni bloqueados por policía, y ocultando datos sensibles)
  const publicItems = items.filter((item) => {
    if (item.status === 'ENTREGADO') return false;

    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      item.title.toLowerCase().includes(q) ||
      item.brand.toLowerCase().includes(q) ||
      item.color.toLowerCase().includes(q) ||
      (item.finder?.surrenderLocation && item.finder.surrenderLocation.toLowerCase().includes(q));

    const matchesCategory =
      categoryFilter === 'all' ? true : item.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const handleOpenReportModal = (type: 'LOST' | 'FOUND') => {
    setModalMode(type);
    setPhotoUrl('');
    setPhotoError(null);
    setIsReportModalOpen(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeKb = Math.round(file.size / 1024);
    if (sizeKb > 500) {
      setPhotoError(`La fotografía pesa ${sizeKb} KB. El tamaño máximo permitido es 500 KB.`);
      return;
    }

    setPhotoError(null);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPhotoUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCreateReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repName.trim() || !repTitle.trim() || !repPhone.trim()) {
      alert('Por favor complete los campos obligatorios: Nombre, Teléfono y Título del Objeto.');
      return;
    }
    if (photoError) {
      alert('Por favor resuelva la advertencia de tamaño de imagen.');
      return;
    }

    sfx.playVerificationSuccess();

    const newReport: CitizenLostReport = {
      id: 'REP-2026-00' + Math.floor(100 + Math.random() * 900),
      reportType: modalMode,
      reportedAt: new Date().toLocaleDateString('es-CO') + ' ' + new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
      fullName: repName,
      phone: repPhone,
      email: repEmail,
      category: repCategory,
      title: repTitle,
      brand: repBrand,
      color: repColor,
      estimatedLostPlace: repPlace,
      estimatedLostDate: repDate,
      distinctMarks: repMarks,
      photoUrl: photoUrl || undefined,
      status: 'PENDIENTE_REVISION',
    };

    onCreateReport(newReport);
    setIsReportModalOpen(false);

    // Limpiar campos
    setRepTitle('');
    setRepBrand('');
    setRepColor('');
    setRepPlace('');
    setRepMarks('');
    setPhotoUrl('');

    alert(
      modalMode === 'LOST'
        ? '¡Reporte de extravío radicado con éxito!\nEl personal de recepción y seguridad cotejará su declaración contra los bienes hallados.'
        : '¡Reporte de hallazgo registrado con éxito!\nPor favor acérquese a la ventanilla de recepción para formalizar la entrega física del bien al casillero de custodia.'
    );
  };

  return (
    <div className="min-h-screen bg-[#f7f7f7] text-black pb-12">
      {/* 1. Cobalt Announcement Bar (#0700ff) — Basic.Space Signature */}
      <div className="w-full h-8 bg-[#0700ff] text-white flex items-center justify-center px-4">
        <p className="text-[13px] font-normal tracking-[-0.14px] text-center truncate">
          Custodia.Space · Portal Oficial del Cliente · SENA Regional Huila (ADSO 3413988)
        </p>
      </div>

      {/* 2. Primary Navigation Bar */}
      <header className="border-b border-[#ebebeb] bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="text-[16px] font-medium tracking-[-0.02em] text-black">
              Custodia.Space
            </span>
            <span className="rounded-full border border-[#ebebeb] px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-[#b5b5b5]">
              PORTAL CLIENTE
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {onGoToLanding && (
              <button
                type="button"
                onClick={onGoToLanding}
                className="rounded-full border border-[#ebebeb] hover:border-black bg-white px-4 py-1.5 text-[13px] font-normal text-black transition cursor-pointer"
              >
                Galería de Inicio
              </button>
            )}

            <button
              type="button"
              onClick={() => onOpenChat()}
              className="rounded-full border border-[#ebebeb] hover:border-black bg-white px-4 py-1.5 text-[13px] font-normal text-black transition cursor-pointer flex items-center gap-1.5"
            >
              <span>💬 Chat con Custodia ({totalMessagesCount})</span>
            </button>

            <NotificationCenterBell
              currentUser={currentUser}
              notifications={notifications}
              onMarkAsRead={onMarkNotificationRead}
              onMarkAllAsRead={onMarkAllNotificationsRead}
              onOpenChatThread={(threadId, title) => onOpenChat(threadId, title)}
            />

            <div className="hidden sm:flex items-center gap-2 rounded-full bg-[#f7f7f7] border border-[#ebebeb] px-3.5 py-1.5 text-xs">
              <span className="font-medium text-black">{currentUser.name}</span>
              <span className="rounded-full bg-black px-2 py-0.5 text-[9px] font-medium text-white uppercase tracking-[0.14em]">
                Cliente
              </span>
            </div>
            <button
              type="button"
              onClick={onLogout}
              title="Cerrar Sesión"
              className="rounded-full border border-[#ebebeb] hover:border-black px-4 py-1.5 text-[13px] font-normal text-black transition flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </header>

      {/* 3. Editorial Hero Banner — Basic.Space Monochrome Gallery */}
      <div className="border-b border-[#ebebeb] bg-white py-12 px-6">
        <div className="mx-auto max-w-7xl flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <span className="block text-[11px] font-medium tracking-[0.25em] uppercase text-[#b5b5b5] mb-2">
              SERVICIO NACIONAL DE APRENDIZAJE · CIES NEIVA
            </span>
            <h2 className="text-[34px] sm:text-[40px] font-medium leading-[1.12] tracking-[-0.88px] text-black">
              Archivo de Custodia y Radicación Ciudadana
            </h2>
            <p className="text-[16px] text-[#b5b5b5] mt-2 leading-[1.43]">
              Consulta los bienes resguardados en bóveda o radica un reporte oficial de pérdida o hallazgo.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => handleOpenReportModal('LOST')}
              className="flex items-center gap-2 rounded-full bg-black px-5 py-2.5 text-[14px] font-medium text-white hover:bg-neutral-800 transition cursor-pointer"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Reportar Pérdida</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenReportModal('FOUND')}
              className="flex items-center gap-2 rounded-full border border-[#ebebeb] hover:border-black bg-white px-5 py-2.5 text-[14px] font-normal text-black transition cursor-pointer"
            >
              <Package className="h-4 w-4" />
              <span>Reportar Hallazgo</span>
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 space-y-8">
        {/* Sección: Mis Reportes Radicados */}
        <div className="rounded-2xl bg-white p-6 border border-slate-200 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4 border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading text-base font-bold text-slate-900">
                  Reportes Radicados por la Comunidad ({reports.length})
                </h3>
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700 font-mono">
                  En tiempo real
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Estados de seguimiento de declaraciones de pérdida y avisos de hallazgo.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleOpenReportModal('LOST')}
                className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700 transition"
              >
                + Radicar Nuevo Reporte
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {reports.map((rep) => {
              const isMatch = rep.status === 'COINCIDENCIA_DETECTADA';
              const isFound = rep.reportType === 'FOUND';

              return (
                <div
                  key={rep.id}
                  className={`flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border transition ${
                    isMatch
                      ? 'border-emerald-300 bg-emerald-50/70 shadow-xs'
                      : 'border-slate-200 bg-slate-50/70'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {rep.photoUrl ? (
                      <div className="h-14 w-14 rounded-lg overflow-hidden border border-slate-200 shrink-0 bg-white">
                        <img src={rep.photoUrl} alt="" className="h-full w-full object-cover" />
                      </div>
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-slate-200 text-slate-400 shrink-0">
                        <Package className="h-6 w-6" />
                      </div>
                    )}

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-blue-700">{rep.id}</span>
                        <span
                          className={`rounded px-1.5 py-0.2 font-mono text-[9px] font-bold uppercase ${
                            isFound
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {isFound ? 'Hallazgo' : 'Pérdida'}
                        </span>
                        <span className="font-heading text-xs font-bold text-slate-900">{rep.title}</span>
                        <span className="text-[11px] text-slate-500">({rep.brand} · {rep.color})</span>
                      </div>

                      <p className="text-xs text-slate-600 mt-1">
                        Radicado por: <strong>{rep.fullName}</strong> ({rep.phone}) · Lugar estimado:{' '}
                        <strong>{rep.estimatedLostPlace}</strong>
                      </p>

                      {rep.distinctMarks && (
                        <p className="text-[11px] text-slate-500 italic mt-0.5">
                          "{rep.distinctMarks}"
                        </p>
                      )}

                      {/* Notificación especial si hay coincidencia */}
                      {isMatch && (
                        <div className="mt-2 rounded-lg bg-emerald-100/90 p-2 text-xs text-emerald-900 border border-emerald-300 font-medium flex items-center gap-1.5">
                          <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0" />
                          <span>
                            <strong>¡Coincidencia Detectada!</strong> Hay un bien en custodia que coincide con tu reporte. Acércate a la oficina de Recepción del SENA con tu documento original para el protocolo de validación presencial (70%-80%).
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 text-right">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                        isMatch
                          ? 'bg-emerald-600 text-white animate-pulse'
                          : rep.status === 'PROCESADO_A_CUSTODIA'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {isMatch
                        ? 'COINCIDENCIA DETECTADA · PRESENTARSE EN CUSTODIA'
                        : rep.status === 'PROCESADO_A_CUSTODIA'
                        ? 'EN CUSTODIA FÍSICA'
                        : 'PENDIENTE DE REVISIÓN'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">{rep.reportedAt}</span>

                    <div className="flex items-center gap-1.5 mt-1">
                      <button
                        type="button"
                        onClick={() =>
                          onOpenChat(rep.id, `${rep.id} · ${rep.title}`)
                        }
                        className="rounded-full border border-[#ebebeb] hover:border-black bg-white px-2.5 py-1 text-[11px] font-medium text-black transition cursor-pointer"
                      >
                        💬 Chat
                      </button>

                      {onUpdateReport && (
                        <button
                          type="button"
                          onClick={() => {
                            const newTitle = window.prompt(
                              'Editar título o descripción del reporte:',
                              rep.title
                            );
                            if (newTitle === null || !newTitle.trim()) return;
                            const newMarks = window.prompt(
                              'Editar señas particulares:',
                              rep.distinctMarks || ''
                            );
                            onUpdateReport({
                              ...rep,
                              title: newTitle.trim(),
                              distinctMarks:
                                newMarks !== null ? newMarks.trim() : rep.distinctMarks,
                            });
                          }}
                          className="rounded-full border border-[#ebebeb] hover:border-black bg-white px-2.5 py-1 text-[11px] font-medium text-black transition cursor-pointer"
                        >
                          ✏️ Editar
                        </button>
                      )}

                      {onDeleteReport && (
                        <button
                          type="button"
                          onClick={() => {
                            if (
                              window.confirm(
                                `¿Deseas eliminar tu reporte [${rep.id} - ${rep.title}]?`
                              )
                            ) {
                              onDeleteReport(rep.id);
                            }
                          }}
                          className="rounded-full border border-red-200 hover:border-red-600 bg-red-50 px-2.5 py-1 text-[11px] font-medium text-red-700 transition cursor-pointer"
                        >
                          🗑️ Eliminar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Buscador y Categorías de Bienes en Custodia */}
        <div className="rounded-2xl bg-white p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[280px]">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por marca, tipo de artículo, color o lugar del hallazgo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-300 pl-10 pr-4 py-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-semibold text-slate-600">
              <button
                type="button"
                onClick={() => setCategoryFilter('all')}
                className={`rounded-lg px-3 py-2 transition whitespace-nowrap ${
                  categoryFilter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 hover:bg-slate-200'
                }`}
              >
                Todos ({publicItems.length})
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter('electronics')}
                className={`rounded-lg px-3 py-2 transition whitespace-nowrap ${
                  categoryFilter === 'electronics'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 hover:bg-slate-200'
                }`}
              >
                Tecnología
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter('wallets_ids')}
                className={`rounded-lg px-3 py-2 transition whitespace-nowrap ${
                  categoryFilter === 'wallets_ids'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 hover:bg-slate-200'
                }`}
              >
                Billeteras / Documentos
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter('luggage')}
                className={`rounded-lg px-3 py-2 transition whitespace-nowrap ${
                  categoryFilter === 'luggage'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 hover:bg-slate-200'
                }`}
              >
                Mochilas / Maletines
              </button>
            </div>
          </div>
        </div>

        {/* Catálogo de Objetos Hallados en Custodia (Vista Pública) */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading text-lg font-bold text-slate-900">
              Artículos en Custodia Disponibles para Reclamo ({publicItems.length})
            </h3>
            <span className="text-xs text-slate-500">
              * Por seguridad, números de serie y preguntas secretas no se publican.
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {publicItems.map((item) => {
              const myFailedAttempts = getClientFailedAttempts(item);
              const failCount = myFailedAttempts.length;
              const isBlockedForThisClient = failCount >= 4;

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    setSelectedItemId(item.id);
                    setIsClaimValidationOpen(false);
                    setClaimFeedback(null);
                    setAnsBrand('');
                    setAnsColor('');
                    setAnsPlace('');
                    setAnsMarks('');
                    setAnsSecurity('');
                  }}
                  className={`group flex flex-col justify-between rounded-2xl border bg-white overflow-hidden shadow-xs transition cursor-pointer ${
                    isBlockedForThisClient
                      ? 'border-red-400 bg-red-50/20 hover:border-red-500'
                      : 'border-slate-200 hover:border-blue-400 hover:shadow-md'
                  }`}
                >
                  {/* Imagen */}
                  <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
                    <img
                      src={item.evidencePhotos[0]?.url}
                      alt={item.title}
                      className={`h-full w-full object-cover transition duration-300 ${
                        isBlockedForThisClient ? 'grayscale opacity-75' : 'group-hover:scale-105'
                      }`}
                    />
                    <div className="absolute top-2 left-2 rounded-full bg-slate-900/80 px-2.5 py-0.5 text-[10px] font-bold text-white font-mono backdrop-blur-xs">
                      {item.trackingCode}
                    </div>
                    {isBlockedForThisClient ? (
                      <div className="absolute top-2 right-2 rounded-full bg-red-600 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
                        🔒 Bloqueado para ti (4/4)
                      </div>
                    ) : failCount > 0 ? (
                      <div className="absolute top-2 right-2 rounded-full bg-amber-500 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
                        Tus intentos: {failCount}/4
                      </div>
                    ) : null}
                    <div className="absolute bottom-2 left-2 right-2 rounded-lg bg-white/95 p-1.5 text-[10px] font-medium text-slate-700 backdrop-blur-xs flex items-center gap-1 shadow-xs">
                      <MapPin className="h-3 w-3 text-blue-600 shrink-0" />
                      <span className="truncate">{item.finder?.surrenderLocation || 'Centro de Recepción'}</span>
                    </div>
                  </div>

                  {/* Contenido */}
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-heading text-sm font-bold text-slate-900 group-hover:text-blue-600 line-clamp-1">
                        {item.title}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Categoría: <strong className="text-slate-700">{item.category}</strong>
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="font-mono text-[11px] text-slate-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {item.relativeTime}
                      </span>
                      <button
                        type="button"
                        className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                          isBlockedForThisClient
                            ? 'bg-red-100 text-red-700'
                            : 'bg-blue-50 text-blue-700 group-hover:bg-blue-600 group-hover:text-white'
                        }`}
                      >
                        {isBlockedForThisClient ? 'Bloqueado para ti' : 'Reclamar / Detalles'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal Detalle y Validación de Reclamo Exclusivo por Cliente Individual */}
      {selectedItem && (() => {
        const myFailedAttempts = getClientFailedAttempts(selectedItem);
        const myFailCount = myFailedAttempts.length;
        const isBlockedForThisClient = myFailCount >= 4;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 p-4 backdrop-blur-xs overflow-y-auto">
            <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4 my-8 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <span className="font-mono text-xs font-bold text-blue-700">
                    {selectedItem.trackingCode}
                  </span>
                  <h3 className="font-heading text-lg font-bold text-slate-900">
                    {selectedItem.title}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedItemId(null)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="h-48 w-full rounded-xl overflow-hidden bg-slate-100 border border-slate-200 relative">
                <img
                  src={selectedItem.evidencePhotos[0]?.url}
                  alt={selectedItem.title}
                  className="h-full w-full object-cover"
                />
                <div className="absolute bottom-2 right-2 bg-slate-900/80 text-white text-[11px] font-mono px-2.5 py-1 rounded-lg">
                  Tus Intentos Fallidos ({currentUser.name.split(' ')[0]}): {myFailCount} / 4
                </div>
              </div>

              {/* Si ESTE cliente específico alcanzó los 4 intentos fallidos en este producto */}
              {isBlockedForThisClient ? (
                <div className="rounded-2xl border-2 border-red-500 bg-red-50 p-5 text-red-950 space-y-2">
                  <div className="flex items-center gap-2.5 text-red-700 font-extrabold text-sm">
                    <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
                    <span>🔒 PRODUCTO BLOQUEADO PARA TU CUENTA ({myFailCount}/4 INTENTOS FALLIDOS)</span>
                  </div>
                  <p className="text-xs text-red-800 leading-relaxed">
                    Tu usuario (<strong>{currentUser.name}</strong>) ha alcanzado el límite de <strong>4 intentos fallidos</strong> de validación sobre este producto.
                  </p>
                  <p className="text-[11px] text-red-700 font-medium bg-white/80 p-2.5 rounded-xl border border-red-200">
                    Este bloqueo se aplica <strong>únicamente a tu cuenta de Cliente</strong> por haber agotado tus 4 oportunidades (los demás clientes y los empleados no se ven afectados). Solicita a un <strong>Empleado de Custodia</strong> que restablezca tus intentos si cuentas con pruebas de propiedad.
                  </p>
                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => setSelectedItemId(null)}
                      className="rounded-xl bg-red-600 px-5 py-2 text-xs font-bold text-white hover:bg-red-700 transition cursor-pointer"
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              ) : !isClaimValidationOpen ? (
                /* Vista Previa antes de iniciar cuestionario */
                <>
                  <div className="rounded-xl bg-slate-50 p-4 text-xs space-y-2 border border-slate-200">
                    <p>
                      <strong>Fecha de ingreso a custodia:</strong>{' '}
                      {new Date(selectedItem.registeredAt).toLocaleDateString('es-CO')}
                    </p>
                    <p>
                      <strong>Tus intentos disponibles en este producto:</strong>{' '}
                      <span className="font-bold text-blue-700">
                        {4 - myFailCount} de 4 intentos restantes
                      </span>
                    </p>
                    <p className="text-[11px] text-slate-500">
                      * Por seguridad, la marca, color exacto, señas particulares y pregunta clave están ocultos para validar que seas el dueño legítimo.
                    </p>
                  </div>

                  <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4 text-xs text-blue-900">
                    <h5 className="font-bold mb-1 flex items-center gap-1.5">
                      <HelpCircle className="h-4 w-4 text-blue-600" />
                      ¿Este objeto te pertenece? Valida tu propiedad (Umbral 70%)
                    </h5>
                    <p className="text-[11px] leading-relaxed text-blue-800">
                      Para reclamar este bien, responde el cuestionario de validación y obtén al menos un <strong>70% de coincidencia</strong>. Si tu cuenta falla <strong>4 veces</strong>, el producto quedará bloqueado únicamente para tu usuario.
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setSelectedItemId(null)}
                      className="rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200 transition cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedItemId(null);
                        onOpenChat(
                          selectedItem.trackingCode,
                          `${selectedItem.trackingCode} · ${selectedItem.title}`
                        );
                      }}
                      className="rounded-full border border-[#ebebeb] hover:border-black bg-white px-4 py-2.5 text-xs font-medium text-black transition cursor-pointer"
                    >
                      💬 Chat con Custodia
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsClaimValidationOpen(true);
                        setClaimFeedback(null);
                      }}
                      className="rounded-full bg-black px-5 py-2.5 text-xs font-medium text-white hover:bg-neutral-800 transition cursor-pointer flex items-center gap-1.5"
                    >
                      <ShieldCheck className="h-4 w-4" />
                      <span>Validar Propiedad y Reclamar Objeto</span>
                    </button>
                  </div>
                </>
              ) : (
                /* Formulario Interactivo de Validación para el Cliente */
                <div className="space-y-4">
                  <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900 flex items-center justify-between">
                    <span>
                      Responde los datos del objeto para demostrar que eres su dueño (Mínimo 70%):
                    </span>
                    <span className="font-mono font-bold bg-amber-200/80 px-2 py-0.5 rounded text-amber-950 shrink-0 ml-2">
                      Tus fallos: {myFailCount}/4
                    </span>
                  </div>

                  {claimFeedback && (
                    <div
                      className={`rounded-xl p-3.5 text-xs border font-medium ${
                        claimFeedback.type === 'success'
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                          : 'bg-red-50 border-red-300 text-red-900'
                      }`}
                    >
                      {claimFeedback.message}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        1. ¿Cuál es la marca del objeto? (20%) *
                      </label>
                      <input
                        type="text"
                        value={ansBrand}
                        onChange={(e) => setAnsBrand(e.target.value)}
                        placeholder="Ej. Apple, Vélez, Totto, Samsung..."
                        className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        2. ¿De qué color es el artículo? (20%) *
                      </label>
                      <input
                        type="text"
                        value={ansColor}
                        onChange={(e) => setAnsColor(e.target.value)}
                        placeholder="Ej. Negro, Café, Gris espacial..."
                        className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block font-bold text-slate-700 mb-1">
                        3. ¿En qué lugar del SENA lo perdiste? (20%) *
                      </label>
                      <input
                        type="text"
                        value={ansPlace}
                        onChange={(e) => setAnsPlace(e.target.value)}
                        placeholder="Ej. Biblioteca, Cafetería, Ambiente 204, Laboratorio..."
                        className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block font-bold text-slate-700 mb-1">
                        4. Describe una seña particular, modelo o detalle del objeto (20%) *
                      </label>
                      <input
                        type="text"
                        value={ansMarks}
                        onChange={(e) => setAnsMarks(e.target.value)}
                        placeholder="Ej. Funda transparente, sticker, llavero, rayón..."
                        className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block font-bold text-indigo-900 mb-1">
                        5. Pregunta Clave de Seguridad (20%):{' '}
                        <span className="font-normal text-indigo-700">
                          {selectedItem.securityQuestion?.label ||
                            '¿Qué elemento privado o serial tiene el objeto?'}
                        </span>
                      </label>
                      <input
                        type="text"
                        value={ansSecurity}
                        onChange={(e) => setAnsSecurity(e.target.value)}
                        placeholder="Escribe tu respuesta privada..."
                        className="w-full rounded-lg border border-indigo-300 bg-indigo-50/40 p-2 text-xs focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setIsClaimValidationOpen(false)}
                      className="rounded-lg px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                    >
                      ← Volver
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        let score = 0;
                        const b = ansBrand.toLowerCase().trim();
                        const c = ansColor.toLowerCase().trim();
                        const p = ansPlace.toLowerCase().trim();
                        const m = ansMarks.toLowerCase().trim();
                        const s = ansSecurity.toLowerCase().trim();

                        if (
                          b &&
                          (selectedItem.brand.toLowerCase().includes(b) ||
                            b.includes(selectedItem.brand.toLowerCase()))
                        ) {
                          score += 20;
                        }
                        if (
                          c &&
                          (selectedItem.color.toLowerCase().includes(c) ||
                            c.includes(selectedItem.color.toLowerCase().split(' ')[0]))
                        ) {
                          score += 20;
                        }
                        if (
                          p &&
                          selectedItem.finder?.surrenderLocation &&
                          (selectedItem.finder.surrenderLocation.toLowerCase().includes(p) ||
                            p.split(' ').some(
                              (word) =>
                                word.length > 3 &&
                                selectedItem.finder.surrenderLocation.toLowerCase().includes(word)
                            ))
                        ) {
                          score += 20;
                        }
                        if (
                          m &&
                          (selectedItem.distinctMarks.toLowerCase().includes(m) ||
                            (selectedItem.model &&
                              selectedItem.model.toLowerCase().includes(m)) ||
                            m.split(' ').some(
                              (word) =>
                                word.length > 3 &&
                                selectedItem.distinctMarks.toLowerCase().includes(word)
                            ))
                        ) {
                          score += 20;
                        }
                        if (
                          s &&
                          selectedItem.securityQuestion &&
                          (selectedItem.securityQuestion.correctHint.toLowerCase().includes(s) ||
                            s.split(' ').some(
                              (word) =>
                                word.length > 3 &&
                                selectedItem.securityQuestion!.correctHint
                                  .toLowerCase()
                                  .includes(word)
                            ))
                        ) {
                          score += 20;
                        }

                        if (score >= 70) {
                          sfx.playVerificationSuccess();
                          setClaimFeedback({
                            type: 'success',
                            message: `¡Validación Exitosa (${score}% de coincidencia)! Has demostrado la propiedad del artículo. Tu reclamo ha sido aprobado.`,
                          });
                          if (onCompleteClaim) {
                            onCompleteClaim(selectedItem.id, {
                              fullName: currentUser.name,
                              idType: 'CC',
                              idNumber: currentUser.idNumber || 'CLIENTE-VERIFICADO',
                              phone: currentUser.phone || '+57 300 000 0000',
                              email: currentUser.email,
                              verifiedTimestamp: new Date().toLocaleString('es-CO'),
                              verifyingOfficer: 'Validación Portal Cliente',
                              officerBadge: 'PORTAL-CLIENTE',
                              coincidencePercentage: score,
                              deliveryCertificateHash:
                                'SHA256-' +
                                Math.random().toString(36).substring(2, 10).toUpperCase(),
                              notes: `Validado exitosamente por el cliente ${currentUser.name} (${score}%).`,
                            });
                            setSelectedItemId(null);
                          }
                        } else {
                          const nextAttemptNumber = myFailCount + 1;
                          onRegisterFailedAttempt(selectedItem.id, {
                            userId: currentUser.id,
                            userEmail: currentUser.email,
                            claimantName: currentUser.name,
                            idType: 'CC',
                            idNumber: currentUser.idNumber || 'Cliente',
                            phone: currentUser.phone || 'No especificado',
                            percentageScore: score,
                            reason: `Intento fallido #${nextAttemptNumber}/4 del cliente ${currentUser.name} (${score}% de coincidencia, mínimo requerido 70%).`,
                            officer: 'Portal Cliente (Autovalidación)',
                          });

                          if (nextAttemptNumber >= 4) {
                            setClaimFeedback({
                              type: 'blocked',
                              message:
                                '🔒 ¡4to Intento Fallido! El producto ha quedado BLOQUEADO ÚNICAMENTE PARA TU CUENTA DE CLIENTE. Los demás clientes no se ven afectados.',
                            });
                          } else {
                            setClaimFeedback({
                              type: 'error',
                              message: `Coincidencia insuficiente (${score}% obtenido, se requiere mínimo 70%). Se ha registrado tu intento fallido #${nextAttemptNumber} de 4. Al 4to intento fallido el producto se bloqueará para tu cuenta.`,
                            });
                          }
                        }
                      }}
                      className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-700 shadow-sm transition cursor-pointer"
                    >
                      Verificar Respuestas ({4 - myFailCount} intentos restantes para ti)
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Modal Radicar Reporte (Pérdida o Hallazgo) */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 p-4 backdrop-blur-xs overflow-y-auto">
          <form
            onSubmit={handleCreateReport}
            className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4 my-8 max-h-[85vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded px-2 py-0.5 font-mono text-[10px] font-bold uppercase ${
                      modalMode === 'LOST'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}
                  >
                    {modalMode === 'LOST' ? 'Declaración de Pérdida' : 'Declaración de Hallazgo'}
                  </span>
                </div>
                <h3 className="font-heading text-base font-bold text-slate-900 mt-1">
                  {modalMode === 'LOST'
                    ? 'Reportar un Objeto que Extraviaste'
                    : 'Reportar un Objeto que Encontraste en el Campus'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsReportModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>

            {/* Alternador de Tipo de Reporte */}
            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-100 text-xs font-bold text-slate-700">
              <button
                type="button"
                onClick={() => setModalMode('LOST')}
                className={`py-2 rounded-lg transition ${
                  modalMode === 'LOST' ? 'bg-white text-blue-700 shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                Perdí un Objeto
              </button>
              <button
                type="button"
                onClick={() => setModalMode('FOUND')}
                className={`py-2 rounded-lg transition ${
                  modalMode === 'FOUND' ? 'bg-white text-purple-700 shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                Encontré un Objeto
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Nombre Completo del Ciudadano / Aprendiz *</label>
                <input
                  type="text"
                  required
                  value={repName}
                  onChange={(e) => setRepName(e.target.value)}
                  placeholder="Tu nombre completo"
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Teléfono / WhatsApp *</label>
                <input
                  type="text"
                  required
                  value={repPhone}
                  onChange={(e) => setRepPhone(e.target.value)}
                  placeholder="+57 3..."
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs font-mono focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Correo Institucional (Opcional)</label>
                <input
                  type="email"
                  value={repEmail}
                  onChange={(e) => setRepEmail(e.target.value)}
                  placeholder="aprendiz@misena.edu.co"
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Categoría del Artículo *</label>
                <select
                  value={repCategory}
                  onChange={(e) => setRepCategory(e.target.value as ItemCategory)}
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-blue-500 focus:outline-none"
                >
                  <option value="electronics">Tecnología / Celulares</option>
                  <option value="wallets_ids">Billeteras y Documentos</option>
                  <option value="luggage">Mochilas y Maletines</option>
                  <option value="keys">Llaves y Mandos</option>
                  <option value="jewelry">Relojes y Joyas</option>
                  <option value="clothing">Prendas de Vestir</option>
                  <option value="other">Otros Artículos</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Título o Descripción Breve *</label>
                <input
                  type="text"
                  required
                  value={repTitle}
                  onChange={(e) => setRepTitle(e.target.value)}
                  placeholder="Ej. Celular Motorola G54 con funda negra"
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Marca (Si se conoce)</label>
                <input
                  type="text"
                  value={repBrand}
                  onChange={(e) => setRepBrand(e.target.value)}
                  placeholder="Ej. Motorola, HP, Vélez"
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Color Principal</label>
                <input
                  type="text"
                  value={repColor}
                  onChange={(e) => setRepColor(e.target.value)}
                  placeholder="Ej. Negro con azul"
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="col-span-2">
                <label className="block font-bold text-slate-700 mb-1">
                  {modalMode === 'LOST'
                    ? '¿En qué lugar y fecha crees haberlo extraviado?'
                    : '¿En qué lugar exacto del campus lo encontraste?'}
                </label>
                <input
                  type="text"
                  value={repPlace}
                  onChange={(e) => setRepPlace(e.target.value)}
                  placeholder="Ej. Ambiente 204 ADSO, mesa trasera, hoy en la mañana"
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="col-span-2">
                <label className="block font-bold text-slate-700 mb-1">
                  Señas Particulares (Rayones, stickers, contenido interno)
                </label>
                <textarea
                  rows={2}
                  value={repMarks}
                  onChange={(e) => setRepMarks(e.target.value)}
                  placeholder="Detalles que ayuden al personal a cotejarlo con los objetos que llegan a custodia..."
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Fotografía de Referencia (Opcional ≤ 500 KB) */}
              <div className="col-span-2 rounded-xl bg-slate-50 p-3 border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-700 text-xs flex items-center gap-1.5">
                    <Camera className="h-3.5 w-3.5 text-blue-600" />
                    Fotografía de Referencia (Opcional, ≤ 500 KB)
                  </span>
                  {photoUrl && (
                    <span className="text-[10px] text-emerald-700 font-bold">✓ Foto adjunta</span>
                  )}
                </div>

                {photoError && (
                  <div className="mb-2 text-xs text-red-700 bg-red-100 p-2 rounded">
                    {photoError}
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 cursor-pointer hover:border-blue-500 transition text-xs font-medium">
                    <Upload className="h-3.5 w-3.5 text-slate-500" />
                    <span>Cargar imagen</span>
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                  </label>

                  <span className="text-[11px] text-slate-400">O presets rápidos:</span>

                  <div className="flex flex-wrap gap-1">
                    {SAMPLE_PHOTO_PRESETS.map((p) => (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => {
                          setPhotoUrl(p.url);
                          setRepCategory(p.category);
                          setPhotoError(null);
                        }}
                        className="rounded bg-white px-2 py-0.5 text-[10px] text-slate-700 border border-slate-200 hover:border-blue-500"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {photoUrl && (
                  <div className="mt-2 h-20 w-24 rounded-lg overflow-hidden border border-slate-300 bg-white">
                    <img src={photoUrl} alt="" className="h-full w-full object-cover" />
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsReportModalOpen(false)}
                className="rounded-lg px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className={`rounded-xl px-5 py-2 text-xs font-bold text-white transition ${
                  modalMode === 'LOST'
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-purple-600 hover:bg-purple-700'
                }`}
              >
                {modalMode === 'LOST' ? 'Radicar Declaración de Pérdida' : 'Registrar Declaración de Hallazgo'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
