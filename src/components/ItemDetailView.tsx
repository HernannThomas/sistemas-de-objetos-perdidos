import React, { useState } from 'react';
import {
  Printer,
  PenTool,
  ShieldAlert,
  Unlock,
  Lock,
  Copy,
  Check,
  Maximize2,
  ShieldCheck,
  MapPin,
  Clock,
  User,
  Phone,
  FileText,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CustodyItem, TimelineStep } from '../types/custody';
import { StatusBadge } from './StatusBadge';
import { ChainOfCustodyTimeline } from './ChainOfCustodyTimeline';

interface ItemDetailViewProps {
  item: CustodyItem;
  currentUserRole?: 'admin' | 'employee' | 'user';
  onOpenHandoffModal: () => void;
  onOpenAssetTagModal: () => void;
  onOpenSecurityHoldModal: () => void;
  onToggleDrawerLock: () => void;
  onAddTimelineStep: (step: Omit<TimelineStep, 'id'>) => void;
  onRemoveSecurityHold: () => void;
}

export const ItemDetailView: React.FC<ItemDetailViewProps> = ({
  item,
  currentUserRole = 'employee',
  onOpenHandoffModal,
  onOpenAssetTagModal,
  onOpenSecurityHoldModal,
  onToggleDrawerLock,
  onAddTimelineStep,
  onRemoveSecurityHold,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [solenoidTriggered, setSolenoidTriggered] = useState(false);

  const isSecurityHold = item.status === 'BLOQUEADO_POR_SEGURIDAD';
  const isDelivered = item.status === 'ENTREGADO';
  const isAdmin = currentUserRole === 'admin';

  const handleCopyCode = () => {
    navigator.clipboard.writeText(item.trackingCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleTriggerDrawer = () => {
    setSolenoidTriggered(true);
    onToggleDrawerLock();
    setTimeout(() => setSolenoidTriggered(false), 1600);
  };

  return (
    <motion.div
      key={item.id}
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="flex flex-col gap-5"
    >
      {/* Alerta Roja de Retención Judicial si el bien está bloqueado */}
      <AnimatePresence>
        {isSecurityHold && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-lg border-2 border-[#DC2626] bg-[#FEF2F2] p-4 text-[#991B1B] shadow-sm overflow-hidden"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="rounded bg-red-600 p-2 text-white shadow-sm animate-pulse">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-heading text-sm font-bold uppercase tracking-wider text-red-900">
                    Bloqueo Crítico de Custodia: Medida Cautelar Policial Activa
                  </h4>
                  <p className="mt-1 text-xs text-red-800 leading-relaxed font-medium">
                    {item.securityHoldReason ||
                      'Bien inmovilizado por requerimiento policial o judicial. Procedimiento ordinario de entrega deshabilitado.'}
                  </p>
                  <div className="mt-2 flex items-center gap-2 text-[11px] font-mono text-red-700">
                    <span>AUTORIDAD COMPETENTE: Mando de Guardia #0104-CMD</span>
                  </div>
                </div>
              </div>

              {isAdmin ? (
                <button
                  type="button"
                  onClick={onRemoveSecurityHold}
                  className="shrink-0 rounded border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 transition shadow-xs active:scale-95"
                >
                  Levantar Retención Cautelar
                </button>
              ) : (
                <div className="shrink-0 rounded border border-red-200 bg-red-100/80 px-2.5 py-1.5 text-[11px] font-semibold text-red-800">
                  Requiere Perfil Administrador
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tarjeta Maestra de Cabecera del Bien */}
      <div className="rounded-lg border border-[#E2E8F0] bg-white p-5 shadow-xs transition-shadow hover:shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="code-tracking text-sm text-[#0F172A] bg-slate-100 px-2.5 py-0.5 rounded font-mono border border-slate-300 font-bold">
                {item.trackingCode}
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                title="Copiar código de seguimiento"
                className="flex items-center gap-1 rounded px-2 py-0.5 text-xs text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
              >
                {copiedCode ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600 animate-bounce" />
                    <span className="text-emerald-700 font-medium">Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copiar ID</span>
                  </>
                )}
              </button>
              <StatusBadge status={item.status} size="md" />
            </div>

            <h2 className="mt-2 font-heading text-xl font-bold text-[#0b1c30]">
              {item.title}
            </h2>

            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1 font-medium capitalize text-slate-700">
                {item.brand} {item.model ? `· ${item.model}` : ''}
              </span>
              <span>·</span>
              <span>Color: {item.color}</span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Alta: {new Date(item.registeredAt).toLocaleString('es-ES')} ({item.relativeTime})
              </span>
            </div>
          </div>

          {/* Barra de Acciones Operativas con feedback animado */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Apertura de Cerradura Solenoide con animación de pulso */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              type="button"
              onClick={handleTriggerDrawer}
              className={`relative flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold transition-all shadow-xs ${
                solenoidTriggered
                  ? 'bg-emerald-600 text-white ring-2 ring-emerald-400 shadow-md'
                  : item.location.isLocked
                  ? 'border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 hover:border-slate-400'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-300'
              }`}
            >
              {item.location.isLocked ? (
                <>
                  <Unlock className="h-3.5 w-3.5 text-slate-600" />
                  <span>Liberar Casillero</span>
                </>
              ) : (
                <>
                  <Lock className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Bloquear Casillero</span>
                </>
              )}
            </motion.button>

            {/* Imprimir Etiqueta Térmica */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              type="button"
              onClick={onOpenAssetTagModal}
              className="flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 shadow-xs hover:bg-slate-50 hover:border-slate-400 transition"
            >
              <Printer className="h-3.5 w-3.5 text-slate-600" />
              <span>Imprimir Etiqueta</span>
            </motion.button>

            {/* Flag de Retención Judicial */}
            {!isSecurityHold && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                type="button"
                onClick={onOpenSecurityHoldModal}
                className="flex items-center gap-1.5 rounded-md border border-red-200 bg-red-50/70 px-3 py-2 text-xs font-semibold text-red-700 shadow-xs hover:bg-red-100 transition"
              >
                <ShieldAlert className="h-3.5 w-3.5 text-red-600" />
                <span>Retención Policial</span>
              </motion.button>
            )}

            {/* Botón de Entrega Formal */}
            {!isDelivered && (
              <motion.button
                whileHover={!isSecurityHold ? { scale: 1.03 } : {}}
                whileTap={!isSecurityHold ? { scale: 0.96 } : {}}
                type="button"
                disabled={isSecurityHold}
                onClick={onOpenHandoffModal}
                className={`flex items-center gap-1.5 rounded-md px-4 py-2 text-xs font-bold text-white shadow-sm transition ${
                  isSecurityHold
                    ? 'cursor-not-allowed bg-slate-400 opacity-60'
                    : 'bg-[#0F172A] hover:bg-[#1E293B] shadow-slate-900/20'
                }`}
              >
                <PenTool className="h-3.5 w-3.5" />
                <span>Firmar Entrega a Reclamante</span>
              </motion.button>
            )}
          </div>
        </div>

        {/* Notificación visual animada de pulso solenoide */}
        <AnimatePresence>
          {solenoidTriggered && (
            <motion.div
              initial={{ opacity: 0, y: -6, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -6, height: 0 }}
              className="mt-3 flex items-center justify-between rounded-md bg-emerald-50 border border-emerald-300 px-3.5 py-2.5 text-xs text-emerald-800 overflow-hidden shadow-xs"
            >
              <div className="flex items-center gap-2 font-medium">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
                <span>
                  Cerradura Solenoide #{item.location.lockerNumber} ({item.location.binNumber}) activada correctamente. Casillero liberado.
                </span>
              </div>
              <span className="font-mono text-[10px] text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded border border-emerald-300">
                PULSE_12V_OK
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Cuadrícula: Evidencias Fotográficas y Especificaciones de Inspección */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Columna Izquierda (5 cols): Galería de Evidencias */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="rounded-lg border border-[#E2E8F0] bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h4 className="font-heading text-xs font-bold uppercase tracking-wider text-[#0F172A]">
                Evidencia Fotográfica de Entrada
              </h4>
              <span className="text-[11px] font-mono text-slate-500">
                {item.evidencePhotos.length} Fotografía{item.evidencePhotos.length === 1 ? '' : 's'}
              </span>
            </div>

            {/* Foto activa con transición suave */}
            {item.evidencePhotos.length > 0 ? (
              <div className="mt-3 flex flex-col gap-2">
                <div className="relative group overflow-hidden rounded-[0.375rem] border border-slate-200 bg-slate-900 aspect-4/3">
                  <motion.img
                    key={activePhotoIndex}
                    initial={{ opacity: 0.4, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2 }}
                    src={item.evidencePhotos[activePhotoIndex]?.url}
                    alt={item.evidencePhotos[activePhotoIndex]?.caption || 'Evidencia'}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <button
                    type="button"
                    onClick={() => setIsPhotoModalOpen(true)}
                    className="absolute bottom-2 right-2 flex items-center gap-1 rounded bg-black/75 px-2 py-1 text-[11px] font-medium text-white backdrop-blur-xs transition hover:bg-black"
                  >
                    <Maximize2 className="h-3 w-3" />
                    <span>Ampliar</span>
                  </button>
                </div>

                <p className="text-xs text-slate-600 italic">
                  "{item.evidencePhotos[activePhotoIndex]?.caption}"
                </p>

                {/* Fila de miniaturas */}
                {item.evidencePhotos.length > 1 && (
                  <div className="flex gap-2 pt-1 overflow-x-auto pb-1">
                    {item.evidencePhotos.map((photo, idx) => (
                      <motion.button
                        key={photo.id || idx}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="button"
                        onClick={() => setActivePhotoIndex(idx)}
                        className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-[0.375rem] border-2 transition ${
                          activePhotoIndex === idx
                            ? 'border-[#2563EB] ring-2 ring-[#2563EB]/40'
                            : 'border-slate-200 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={photo.url}
                          alt="Miniatura"
                          className="h-full w-full object-cover"
                        />
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                Sin evidencia fotográfica registrada.
              </div>
            )}
          </div>

          {/* Tarjeta de Coordenadas de Depósito */}
          <div className="rounded-lg border border-[#E2E8F0] bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-[#0284C7]" />
                <h4 className="font-heading text-xs font-bold uppercase tracking-wider text-[#0F172A]">
                  Ubicación Física en Casillero
                </h4>
              </div>
              <span
                className={`flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-mono font-semibold ${
                  item.location.isLocked
                    ? 'bg-slate-100 text-slate-700'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {item.location.isLocked ? <Lock className="h-2.5 w-2.5" /> : <Unlock className="h-2.5 w-2.5" />}
                {item.location.isLocked ? 'BLOQUEO ACTIVO' : 'SOLENOIDE ABIERTO'}
              </span>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2 text-center font-mono">
              <div className="rounded border border-slate-200 bg-slate-50 p-2">
                <span className="block text-[10px] text-slate-500 uppercase">Zona</span>
                <span className="text-xs font-bold text-slate-800">{item.location.zone}</span>
              </div>
              <div className="rounded border border-slate-200 bg-slate-50 p-2">
                <span className="block text-[10px] text-slate-500 uppercase">Casillero</span>
                <span className="text-sm font-bold text-[#1E3A8A]">{item.location.lockerNumber}</span>
              </div>
              <div className="rounded border border-slate-200 bg-slate-50 p-2">
                <span className="block text-[10px] text-slate-500 uppercase">Bandeja</span>
                <span className="text-sm font-bold text-emerald-700">{item.location.binNumber}</span>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2 font-mono">
              <span>Etiqueta RFID:</span>
              <span className="text-slate-800 font-semibold">{item.rfidTagId}</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500 font-mono">
              <span>Precinto de Seguridad:</span>
              <span className="text-slate-800 font-semibold">{item.tamperSealNumber}</span>
            </div>
          </div>
        </div>

        {/* Columna Derecha (7 cols): Datos de Inspección y Cronología */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {/* Ficha de Examen Físico */}
          <div className="rounded-lg border border-[#E2E8F0] bg-white p-4 shadow-xs">
            <h4 className="font-heading text-xs font-bold uppercase tracking-wider text-[#0F172A] border-b border-slate-100 pb-2.5">
              Examen Físico y Acta de Recepción
            </h4>

            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="rounded border border-slate-100 bg-slate-50/70 p-2.5">
                <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                  Número de Serie / IMEI Hardware
                </span>
                <span className="font-mono font-bold text-slate-800 text-sm">
                  {item.serialNumber || 'SIN SERIE VISIBLE / REVISIÓN PENDIENTE'}
                </span>
              </div>

              <div className="rounded border border-slate-100 bg-slate-50/70 p-2.5">
                <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                  Valor Declarado / Tasación Estimada
                </span>
                <span className="font-mono font-semibold text-slate-800 text-sm">
                  {item.estimatedValue || 'Tasación pendiente'}
                </span>
              </div>
            </div>

            <div className="mt-3">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">
                Marcas Distintivas, Rasguños y Signos de Uso
              </span>
              <p className="rounded border border-slate-200 bg-white p-2.5 text-xs text-slate-700 leading-relaxed font-mono">
                {item.distinctMarks}
              </p>
            </div>

            {/* Datos de Entrega por Hallador */}
            <div className="mt-3 border-t border-slate-100 pt-3">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-1.5">
                Datos del Hallador o Depositante
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-slate-600">
                  <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span>Hallador: <strong className="text-slate-800">{item.finder.name}</strong></span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span>Teléfono: <strong className="text-slate-800">{item.finder.contact}</strong></span>
                </div>
                <div className="sm:col-span-2 flex items-center gap-1.5 text-slate-600">
                  <FileText className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span>Acta: <span className="font-mono text-slate-700">{item.finder.incidentRef}</span> ({item.finder.surrenderLocation})</span>
                </div>
              </div>
            </div>
          </div>

          {/* Ficha de Entrega Formal con Firma Digital (Si ya ha sido entregado) */}
          {item.claimant && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-lg border-2 border-[#BFDBFE] bg-[#EFF6FF]/40 p-4 shadow-xs"
            >
              <div className="flex items-center justify-between border-b border-blue-200/80 pb-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-[#1E40AF]" />
                  <h4 className="font-heading text-xs font-bold uppercase tracking-wider text-[#1E40AF]">
                    Identificación del Reclamante y Firma Digital de Salida
                  </h4>
                </div>
                <span className="font-mono text-[10px] bg-blue-100 text-[#1E40AF] px-2 py-0.5 rounded font-bold">
                  RECLAMANTE ACREDITADO
                </span>
              </div>

              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[10px] uppercase text-slate-500 block">Titular Acreditado</span>
                  <span className="font-semibold text-slate-900">{item.claimant.fullName}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-500 block">Documentación Aportada</span>
                  <span className="font-mono text-slate-800">
                    {item.claimant.idType}: {item.claimant.idNumber}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-500 block">Fecha y Hora de Entrega</span>
                  <span className="font-mono text-slate-800">{item.claimant.verifiedTimestamp}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-500 block">Oficial Actuante</span>
                  <span className="text-slate-800 font-medium">{item.claimant.verifyingOfficer}</span>
                </div>
              </div>

              {item.claimant.signatureDataUrl && (
                <div className="mt-3 border-t border-blue-200/80 pt-2">
                  <span className="text-[10px] uppercase text-slate-500 block mb-1">
                    Firma Biométrica Digital en Archivo
                  </span>
                  <div className="rounded border border-slate-300 bg-white p-2 w-full max-w-sm shadow-inner">
                    <img
                      src={item.claimant.signatureDataUrl}
                      alt="Firma del reclamante"
                      className="h-12 w-auto object-contain"
                    />
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Componente Especializado: Cadena de Custodia Inmutable */}
          <ChainOfCustodyTimeline
            timeline={item.timeline}
            onAddStep={onAddTimelineStep}
            isSecurityLocked={isSecurityHold}
          />
        </div>
      </div>

      {/* Modal de Fotografía en Alta Resolución */}
      <AnimatePresence>
        {isPhotoModalOpen && item.evidencePhotos[activePhotoIndex] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/85 p-4 backdrop-blur-xs"
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative max-w-4xl w-full rounded-lg bg-white overflow-hidden shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 bg-slate-50">
                <div className="font-heading text-sm font-semibold text-slate-800">
                  Inspección de Evidencia: {item.trackingCode} (Foto {activePhotoIndex + 1}/{item.evidencePhotos.length})
                </div>
                <button
                  type="button"
                  onClick={() => setIsPhotoModalOpen(false)}
                  className="rounded px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200 transition"
                >
                  Cerrar (ESC)
                </button>
              </div>
              <div className="p-4 bg-slate-900 flex justify-center">
                <img
                  src={item.evidencePhotos[activePhotoIndex].url}
                  alt={item.evidencePhotos[activePhotoIndex].caption}
                  className="max-h-[70vh] object-contain rounded"
                />
              </div>
              <div className="p-3 bg-slate-50 text-xs text-slate-700 flex justify-between">
                <span>{item.evidencePhotos[activePhotoIndex].caption}</span>
                <span className="font-mono text-slate-500">
                  {item.evidencePhotos[activePhotoIndex].timestamp}
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
