import React, { useState, useEffect } from 'react';
import {
  Printer,
  PenTool,
  ShieldAlert,
  Unlock,
  Lock,
  Copy,
  Check,
  CheckCircle2,
  Maximize2,
  ShieldCheck,
  MapPin,
  Clock,
  User,
  Phone,
  FileText,
  Sparkles,
  AlertTriangle,
  Radio,
  FileCheck,
  History,
  X,
  ExternalLink,
  Edit3,
  Trash2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CustodyItem, ItemCategory, TimelineStep, UserRole } from '../types/custody';
import { StatusBadge } from './StatusBadge';
import { sfx } from '../utils/audio';

interface ItemDetailViewProps {
  item: CustodyItem;
  currentUserRole: UserRole;
  onOpenValidationModal: () => void;
  onOpenAssetTagModal: () => void;
  onOpenSecurityHoldModal: () => void;
  onToggleDrawerLock: () => void;
  onOpenChat?: (threadId: string, threadTitle: string) => void;
  onUpdateItem?: (updatedItem: CustodyItem) => void;
  onDeleteItem?: (itemId: string) => void;
}

export const ItemDetailView: React.FC<ItemDetailViewProps> = ({
  item,
  currentUserRole,
  onOpenValidationModal,
  onOpenAssetTagModal,
  onOpenSecurityHoldModal,
  onToggleDrawerLock,
  onOpenChat,
  onUpdateItem,
  onDeleteItem,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [solenoidTriggered, setSolenoidTriggered] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Estados para edición CRUD (UPDATE) del objeto
  const [editTitle, setEditTitle] = useState(item.title);
  const [editCategory, setEditCategory] = useState<ItemCategory>(item.category);
  const [editBrand, setEditBrand] = useState(item.brand);
  const [editModel, setEditModel] = useState(item.model || '');
  const [editColor, setEditColor] = useState(item.color);
  const [editDistinctMarks, setEditDistinctMarks] = useState(item.distinctMarks);
  const [editSerialNumber, setEditSerialNumber] = useState(item.serialNumber || '');
  const [editEstimatedValue, setEditEstimatedValue] = useState(item.estimatedValue || '');
  const [editLockerNumber, setEditLockerNumber] = useState(item.location?.lockerNumber || 'L-01');
  const [editBinNumber, setEditBinNumber] = useState(item.location?.binNumber || 'Bandeja 01');
  const [editZone, setEditZone] = useState(item.location?.zone || 'Zona A - Alta Seguridad');
  const [editSecLabel, setEditSecLabel] = useState(item.securityQuestion?.label || '');
  const [editSecHint, setEditSecHint] = useState(item.securityQuestion?.correctHint || '');

  useEffect(() => {
    setActivePhotoIndex(0);
    setEditTitle(item.title);
    setEditCategory(item.category);
    setEditBrand(item.brand);
    setEditModel(item.model || '');
    setEditColor(item.color);
    setEditDistinctMarks(item.distinctMarks);
    setEditSerialNumber(item.serialNumber || '');
    setEditEstimatedValue(item.estimatedValue || '');
    setEditLockerNumber(item.location?.lockerNumber || 'L-01');
    setEditBinNumber(item.location?.binNumber || 'Bandeja 01');
    setEditZone(item.location?.zone || 'Zona A - Alta Seguridad');
    setEditSecLabel(item.securityQuestion?.label || '');
    setEditSecHint(item.securityQuestion?.correctHint || '');
  }, [item.id]);

  const handleSaveEditItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdateItem) return;
    sfx.playVerificationSuccess();
    const updated: CustodyItem = {
      ...item,
      title: editTitle.trim(),
      category: editCategory,
      brand: editBrand.trim(),
      model: editModel.trim() || undefined,
      color: editColor.trim(),
      distinctMarks: editDistinctMarks.trim(),
      serialNumber: editSerialNumber.trim() || undefined,
      estimatedValue: editEstimatedValue.trim() || undefined,
      location: {
        ...item.location,
        zone: editZone.trim(),
        lockerNumber: editLockerNumber.trim(),
        binNumber: editBinNumber.trim(),
      },
      securityQuestion: editSecLabel.trim()
        ? {
            questionType: item.securityQuestion?.questionType || 'OTHER',
            label: editSecLabel.trim(),
            correctHint: editSecHint.trim(),
          }
        : item.securityQuestion,
      timeline: [
        ...(item.timeline || []),
        {
          id: 'tl-edit-' + Date.now(),
          title: 'Actualización de Expediente (CRUD UPDATE)',
          timestamp: new Date().toLocaleString('es-CO'),
          officer: currentUserRole === 'admin' ? 'Administrador' : 'Empleado de Custodia',
          officerBadge: 'CRUD-UPDATE',
          status: 'completed',
          notes: `Expediente actualizado: "${editTitle.trim()}" (${editBrand.trim()} · ${editColor.trim()}) en Casillero ${editLockerNumber.trim()}.`,
          hash: 'SHA256-' + Math.random().toString(36).substring(2, 12).toUpperCase(),
        },
      ],
    };
    onUpdateItem(updated);
    setIsEditModalOpen(false);
  };

  // Agrupar intentos fallidos por cliente individual para detectar quién llegó al límite de 4
  const clientAttemptCounts = (item.failedAttempts || []).reduce<Record<string, { name: string; count: number }>>(
    (acc, att) => {
      const key = att.userId || att.userEmail || att.claimantName;
      if (!acc[key]) {
        acc[key] = { name: att.claimantName, count: 0 };
      }
      acc[key].count += 1;
      return acc;
    },
    {}
  );
  const blockedClients = Object.values(clientAttemptCounts).filter((c) => c.count >= 4);
  const isSecurityHold = item.status === 'BLOQUEADO_POR_SEGURIDAD' || blockedClients.length > 0;
  const isDelivered = item.status === 'ENTREGADO';
  const isWarning = item.status === 'ADVERTENCIA';
  const isAdmin = currentUserRole === 'admin';
  const failedCount = item.failedAttempts ? item.failedAttempts.length : 0;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(item.trackingCode);
    sfx.playScannerBeep();
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleTriggerDrawer = () => {
    sfx.playSolenoidLatch();
    setSolenoidTriggered(true);
    onToggleDrawerLock();
    setTimeout(() => setSolenoidTriggered(false), 1500);
  };

  const photosList = item.evidencePhotos || [];
  const activePhoto = photosList[activePhotoIndex] || photosList[0];

  return (
    <div className="space-y-6">
      {/* Alerta Informativa para el Empleado: Producto Bloqueado únicamente para el Cliente */}
      {isSecurityHold && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border-2 border-amber-500 bg-amber-50 p-5 text-amber-950 shadow-md"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="rounded-xl bg-amber-600 p-2.5 text-white shadow-sm">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <div>
                <span className="font-mono text-[11px] font-bold text-amber-800 uppercase tracking-wider block">
                  BLOQUEO INDIVIDUAL A CLIENTE(S) QUE ALCANZARON 4/4 INTENTOS
                </span>
                <h4 className="font-heading text-base font-extrabold text-amber-950 mt-0.5">
                  {blockedClients.length > 0
                    ? `Cliente(s) Bloqueado(s): ${blockedClients.map((c) => `${c.name} (${c.count}/4)`).join(', ')}`
                    : 'Reclamo Bloqueado para Cliente · Empleado con Acceso Total'}
                </h4>
                <p className="mt-1 text-xs text-amber-900 leading-relaxed font-medium">
                  Solo el cliente que llegó al límite de 4 intentos tiene bloqueado este producto en su cuenta. Los demás clientes y usted como empleado no están bloqueados.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenSecurityHoldModal}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition shrink-0 cursor-pointer"
            >
              Desbloquear Producto al Cliente
            </button>
          </div>
        </motion.div>
      )}

      {/* Alerta Ámbar de Intentos Fallidos del Cliente Acumulados (1 a 3 fallos) */}
      {!isSecurityHold && failedCount > 0 && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
            <div>
              <p className="text-xs font-bold text-amber-950">
                Intentos Fallidos del Cliente: {failedCount} de 4 intentos registrados
              </p>
              <p className="text-[11px] text-amber-800">
                Si el cliente falla 4 veces en su portal, el reclamo se bloqueará únicamente para el cliente (el empleado nunca queda bloqueado).
              </p>
            </div>
          </div>
          <span className="font-mono text-xs font-bold bg-amber-200/80 px-2.5 py-1 rounded-lg text-amber-900">
            {failedCount}/4 Intentos Cliente
          </span>
        </div>
      )}

      {/* Encabezado Principal del Objeto — Basic.Space Gallery Style */}
      <div className="rounded-[2px] bg-white p-6 border border-[#ebebeb]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="text-[11px] font-medium uppercase tracking-[0.25em] text-black">
                {item.brand}
              </span>
              <span className="text-[#ebebeb]">|</span>
              <span className="font-mono text-xs text-[#b5b5b5]">
                {item.trackingCode}
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                title="Copiar Código de Seguimiento"
                className="text-[#b5b5b5] hover:text-black transition cursor-pointer"
              >
                {copiedCode ? <Check className="h-3.5 w-3.5 text-black" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
              <span className="text-[#ebebeb]">|</span>
              <StatusBadge status={item.status} size="sm" />
            </div>

            <h2 className="text-[28px] sm:text-[32px] font-medium text-black leading-[1.13] tracking-[-0.836px]">
              {item.title}
            </h2>

            <p className="text-[13px] text-[#b5b5b5] mt-1.5">
              Marca: <strong className="text-black font-medium">{item.brand}</strong>
              {item.model && (
                <> · Modelo: <strong className="text-black font-medium">{item.model}</strong></>
              )}
              {item.color && (
                <> · Color: <strong className="text-black font-medium">{item.color}</strong></>
              )}
            </p>
          </div>

          {/* Botones de Acción — Pill Buttons (9999px) */}
          <div className="flex flex-wrap items-center gap-2">
            {onOpenChat && (
              <button
                type="button"
                onClick={() =>
                  onOpenChat(item.trackingCode, `${item.trackingCode} · ${item.title}`)
                }
                className="flex items-center gap-1.5 rounded-full border border-[#ebebeb] bg-white px-4 py-2 text-[13px] font-normal text-black hover:border-black transition cursor-pointer"
              >
                <span>💬 Chat</span>
              </button>
            )}

            {onUpdateItem && (
              <button
                type="button"
                onClick={() => setIsEditModalOpen(true)}
                className="flex items-center gap-1.5 rounded-full border border-[#ebebeb] bg-white px-4 py-2 text-[13px] font-normal text-black hover:border-black transition cursor-pointer"
              >
                <Edit3 className="h-3.5 w-3.5 text-black" />
                <span>Editar</span>
              </button>
            )}

            {onDeleteItem && (
              <button
                type="button"
                onClick={() => {
                  if (
                    window.confirm(
                      `¿Estás seguro de eliminar permanentemente el objeto [${item.trackingCode} - ${item.title}] de la base de datos?`
                    )
                  ) {
                    onDeleteItem(item.id);
                  }
                }}
                className="flex items-center gap-1.5 rounded-full border border-[#ebebeb] bg-white px-4 py-2 text-[13px] font-normal text-red-600 hover:border-red-600 transition cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Eliminar</span>
              </button>
            )}

            <button
              type="button"
              onClick={onOpenAssetTagModal}
              className="flex items-center gap-1.5 rounded-full border border-[#ebebeb] bg-white px-4 py-2 text-[13px] font-normal text-black hover:border-black transition cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5 text-black" />
              <span>Rótulo / RFID</span>
            </button>

            <button
              type="button"
              onClick={onOpenSecurityHoldModal}
              className="flex items-center gap-1.5 rounded-full border border-[#ebebeb] bg-white px-4 py-2 text-[13px] font-normal text-black hover:border-black transition cursor-pointer"
            >
              <ShieldAlert className="h-3.5 w-3.5 text-black" />
              <span>{isSecurityHold ? 'Desbloquear al Cliente' : 'Bloquear para Cliente'}</span>
            </button>

            {!isDelivered && (
              <button
                type="button"
                onClick={onOpenValidationModal}
                className="flex items-center gap-2 rounded-full px-5 py-2 text-[13px] font-medium transition bg-black text-white hover:bg-neutral-800 cursor-pointer"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Administrar Entrega (Empleado)</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Grid Central: Galería Fotográfica y Datos de Custodia */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Columna Izquierda: Fotografías de Evidencia (RF-04) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="relative h-72 w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 shadow-xs">
            <img
              src={activePhoto?.url}
              alt={activePhoto?.caption || item.title}
              className="h-full w-full object-cover"
            />
            <button
              type="button"
              onClick={() => setIsPhotoModalOpen(true)}
              className="absolute top-3 right-3 rounded-lg bg-slate-900/80 p-2 text-white hover:bg-slate-900 transition backdrop-blur-xs"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent p-3 text-white">
              <p className="text-xs font-medium">{activePhoto?.caption}</p>
              <span className="font-mono text-[10px] text-slate-400">
                {activePhoto?.timestamp} · {activePhoto?.sizeKb || 310} KB (RF-04 ≤ 500 KB)
              </span>
            </div>
          </div>

          {/* Miniaturas de fotos */}
          {item.evidencePhotos.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {item.evidencePhotos.map((photo, idx) => (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => setActivePhotoIndex(idx)}
                  className={`relative h-16 w-20 shrink-0 rounded-lg overflow-hidden border-2 transition ${
                    activePhotoIndex === idx
                      ? 'border-blue-600 ring-2 ring-blue-500/30'
                      : 'border-slate-200 hover:border-slate-300 opacity-75'
                  }`}
                >
                  <img src={photo.url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Columna Derecha: Tarjeta de Casillero Físico y Características */}
        <div className="lg:col-span-7 space-y-4">
          {/* Casillero Físico (Locker Matrix) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-blue-600" />
                <h3 className="font-heading text-xs font-bold uppercase tracking-wider text-slate-700">
                  Ubicación de Custodia Física en Depósito
                </h3>
              </div>

              <button
                type="button"
                onClick={handleTriggerDrawer}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-xs font-bold transition cursor-pointer ${
                  solenoidTriggered
                    ? 'bg-emerald-600 text-white'
                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                }`}
              >
                {solenoidTriggered ? (
                  <>
                    <Unlock className="h-3.5 w-3.5" />
                    <span>Solenoide Abierto</span>
                  </>
                ) : (
                  <>
                    <Lock className="h-3.5 w-3.5" />
                    <span>Abrir Solenoide ({item.location.lockerNumber})</span>
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-200">
                <span className="font-mono text-[10px] text-slate-400 block uppercase">Casillero</span>
                <span className="font-heading font-black text-slate-900 text-base">
                  {item.location.lockerNumber}
                </span>
              </div>

              <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-200">
                <span className="font-mono text-[10px] text-slate-400 block uppercase">Bandeja</span>
                <span className="font-heading font-bold text-slate-800 text-xs truncate block mt-0.5">
                  {item.location.binNumber}
                </span>
              </div>

              <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-200">
                <span className="font-mono text-[10px] text-slate-400 block uppercase">Precinto</span>
                <span className="font-mono font-bold text-blue-700 text-xs block mt-0.5">
                  {item.tamperSealNumber}
                </span>
              </div>

              <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-200">
                <span className="font-mono text-[10px] text-slate-400 block uppercase">Tag RFID</span>
                <span className="font-mono font-bold text-slate-800 text-xs block mt-0.5">
                  {item.rfidTagId}
                </span>
              </div>
            </div>

            <p className="mt-2.5 text-[11px] text-slate-500 font-mono">
              Zona Asignada: <strong>{item.location.zone}</strong>
            </p>
          </div>

          {/* Tarjeta de Señas Particulares */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs text-xs space-y-3">
            <h3 className="font-heading font-bold uppercase tracking-wider text-slate-700 text-xs flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-600" />
              Detalle Técnico y Señas Particulares
            </h3>

            <p className="text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
              {item.distinctMarks}
            </p>

            <div className="grid grid-cols-2 gap-3 text-xs border-t border-slate-100 pt-3">
              <div>
                <span className="font-mono text-[10px] text-slate-400 uppercase block">Hallado en:</span>
                <span className="font-medium text-slate-800">{item.finder.surrenderLocation}</span>
              </div>
              <div>
                <span className="font-mono text-[10px] text-slate-400 uppercase block">Entregado por:</span>
                <span className="font-medium text-slate-800">{item.finder.name}</span>
              </div>
            </div>
          </div>

          {/* Pregunta Clave Confidencial (RF-09) */}
          {item.securityQuestion && (
            <div className="rounded-2xl border border-indigo-200 bg-indigo-50/60 p-4 text-xs">
              <div className="flex items-center gap-2 text-indigo-900 font-bold mb-1">
                <Lock className="h-4 w-4 text-indigo-600" />
                <span>RF-09: Pregunta Clave de Validación (Confidencial Empleado)</span>
              </div>
              <p className="text-indigo-950 font-medium">{item.securityQuestion.label}</p>
              <p className="font-mono text-[11px] text-indigo-700 mt-1 bg-white/80 p-2 rounded-lg border border-indigo-200">
                Respuesta Correcta: {item.securityQuestion.correctHint}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Si fue entregado: Certificado Formal de Entrega (RF-12 / RF-13) */}
      {isDelivered && item.claimant && (
        <div className="rounded-2xl border-2 border-emerald-300 bg-emerald-50/60 p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-emerald-200 pb-3 mb-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              <div>
                <h3 className="font-heading text-base font-bold text-emerald-950">
                  Acta Oficial de Entrega y Exoneración Legal (RF-12)
                </h3>
                <p className="text-xs text-emerald-800">
                  Bien formalmente retirado de custodia física y dado de baja lógica del catálogo activo.
                </p>
              </div>
            </div>
            <span className="font-mono text-xs font-bold bg-emerald-200 text-emerald-900 px-3 py-1 rounded-full">
              {item.claimant.deliveryCertificateHash}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="font-mono text-[10px] text-emerald-700 uppercase block">Reclamante</span>
              <span className="font-bold text-emerald-950 text-sm">{item.claimant.fullName}</span>
              <span className="text-[11px] text-emerald-800 block mt-0.5">
                {item.claimant.idType}: {item.claimant.idNumber}
              </span>
            </div>

            <div>
              <span className="font-mono text-[10px] text-emerald-700 uppercase block">Validación Oficial</span>
              <span className="font-bold text-emerald-950 block">
                {item.claimant.coincidencePercentage}% Coincidencia
              </span>
              <span className="text-[11px] text-emerald-800 block mt-0.5">
                {item.claimant.verifiedTimestamp}
              </span>
            </div>

            <div>
              <span className="font-mono text-[10px] text-emerald-700 uppercase block">Firma Digitalizada</span>
              {item.claimant.signatureDataUrl ? (
                <div className="h-16 w-full bg-white rounded-lg border border-emerald-200 p-1 flex items-center justify-center">
                  <img src={item.claimant.signatureDataUrl} alt="Firma" className="max-h-full max-w-full object-contain" />
                </div>
              ) : (
                <span className="text-slate-400 italic">Rúbrica digital archivada</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Historial de Intentos Fallidos (RF-10) */}
      {item.failedAttempts && item.failedAttempts.length > 0 && (
        <div className="rounded-2xl border border-red-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2 text-red-900 font-bold text-xs">
              <ShieldAlert className="h-4 w-4 text-red-600" />
              <span>Registro de Intentos Fallidos de Reclamación (RF-10 / CU-06)</span>
            </div>
            <span className="font-mono text-xs font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded">
              {item.failedAttempts.length} / 4 Intentos
            </span>
          </div>

          <div className="space-y-2">
            {item.failedAttempts.map((att, idx) => (
              <div
                key={att.id}
                className="rounded-xl border border-red-100 bg-red-50/50 p-3 text-xs flex flex-wrap items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-red-950">Intento #{idx + 1}: {att.claimantName}</span>
                    <span className="font-mono text-[11px] text-red-700">({att.idType}: {att.idNumber})</span>
                    <span className="rounded bg-red-200/80 px-1.5 py-0.2 font-mono text-[10px] font-bold text-red-900">
                      {att.percentageScore}% obtenido
                    </span>
                  </div>
                  <p className="text-red-800 text-[11px] mt-1">{att.reason}</p>
                </div>
                <div className="text-right text-[10px] font-mono text-red-600">
                  <div>{att.timestamp}</div>
                  <div>{att.officer}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cadena de Custodia / Timeline (RF-14) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-slate-800 mb-4 flex items-center gap-2">
          <History className="h-4 w-4 text-blue-600" />
          Trazabilidad Inmutable de la Cadena de Custodia
        </h3>

        <div className="space-y-4 relative pl-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          {item.timeline.map((step) => (
            <div key={step.id} className="relative">
              <div
                className={`absolute -left-[23px] top-1 h-3.5 w-3.5 rounded-full border-2 border-white shadow-xs ${
                  step.status === 'security_hold'
                    ? 'bg-red-600 ring-2 ring-red-400'
                    : step.status === 'warning'
                    ? 'bg-amber-500'
                    : 'bg-emerald-600'
                }`}
              />

              <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200 text-xs space-y-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-bold text-slate-900">{step.title}</span>
                  <span className="font-mono text-[10px] text-slate-400">{step.timestamp}</span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">{step.notes}</p>
                <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 font-mono text-[10px] text-slate-400">
                  <span>Oficial: {step.officer} ({step.officerBadge})</span>
                  {step.hash && (
                    <span className="truncate max-w-[150px]">Hash: {step.hash.substring(0, 12)}...</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Zoom Foto */}
      {isPhotoModalOpen && (
        <div
          onClick={() => setIsPhotoModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-md cursor-pointer"
        >
          <div className="relative max-w-4xl max-h-[85vh] overflow-hidden rounded-2xl">
            <img src={activePhoto?.url} alt="" className="max-h-[85vh] w-auto object-contain" />
          </div>
        </div>
      )}

      {/* Modal CRUD UPDATE: Editar Objeto en Custodia */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 overflow-y-auto">
          <form
            onSubmit={handleSaveEditItem}
            className="w-full max-w-2xl rounded-[2px] bg-white border border-black p-6 space-y-4 my-8 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-[#ebebeb] pb-3">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#b5b5b5]">
                  OPERACIÓN CRUD · UPDATE ({item.trackingCode})
                </span>
                <h3 className="text-[20px] font-medium text-black">
                  Editar Expediente del Objeto en Custodia
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="rounded-full border border-[#ebebeb] hover:border-black p-1.5 text-black cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="block font-medium text-black mb-1">Título del Objeto *</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full rounded-[16px] border border-[#ebebeb] bg-[#f7f7f7] px-3.5 py-2 text-black focus:bg-white focus:border-black focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-black mb-1">Categoría *</label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value as ItemCategory)}
                  className="w-full rounded-[16px] border border-[#ebebeb] bg-[#f7f7f7] px-3.5 py-2 text-black focus:bg-white focus:border-black focus:outline-none"
                >
                  <option value="electronics">Tecnología & Móviles</option>
                  <option value="wallets_ids">Billeteras & Documentos</option>
                  <option value="luggage">Mochilas & Maletines</option>
                  <option value="keys">Llaves & Accesorios</option>
                  <option value="jewelry">Relojes & Joyas</option>
                  <option value="documents">Documentos Oficiales</option>
                  <option value="clothing">Prendas de Vestir</option>
                  <option value="other">Otros</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-black mb-1">Marca *</label>
                <input
                  type="text"
                  required
                  value={editBrand}
                  onChange={(e) => setEditBrand(e.target.value)}
                  className="w-full rounded-[16px] border border-[#ebebeb] bg-[#f7f7f7] px-3.5 py-2 text-black focus:bg-white focus:border-black focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-black mb-1">Modelo</label>
                <input
                  type="text"
                  value={editModel}
                  onChange={(e) => setEditModel(e.target.value)}
                  className="w-full rounded-[16px] border border-[#ebebeb] bg-[#f7f7f7] px-3.5 py-2 text-black focus:bg-white focus:border-black focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-black mb-1">Color Principal *</label>
                <input
                  type="text"
                  required
                  value={editColor}
                  onChange={(e) => setEditColor(e.target.value)}
                  className="w-full rounded-[16px] border border-[#ebebeb] bg-[#f7f7f7] px-3.5 py-2 text-black focus:bg-white focus:border-black focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-black mb-1">Número de Serie</label>
                <input
                  type="text"
                  value={editSerialNumber}
                  onChange={(e) => setEditSerialNumber(e.target.value)}
                  className="w-full rounded-[16px] border border-[#ebebeb] bg-[#f7f7f7] px-3.5 py-2 font-mono text-black focus:bg-white focus:border-black focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-black mb-1">Valor Estimado</label>
                <input
                  type="text"
                  value={editEstimatedValue}
                  onChange={(e) => setEditEstimatedValue(e.target.value)}
                  className="w-full rounded-[16px] border border-[#ebebeb] bg-[#f7f7f7] px-3.5 py-2 text-black focus:bg-white focus:border-black focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-black mb-1">Casillero Asignado *</label>
                <input
                  type="text"
                  required
                  value={editLockerNumber}
                  onChange={(e) => setEditLockerNumber(e.target.value)}
                  className="w-full rounded-[16px] border border-[#ebebeb] bg-[#f7f7f7] px-3.5 py-2 font-mono text-black focus:bg-white focus:border-black focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-black mb-1">Bandeja / Compartimiento *</label>
                <input
                  type="text"
                  required
                  value={editBinNumber}
                  onChange={(e) => setEditBinNumber(e.target.value)}
                  className="w-full rounded-[16px] border border-[#ebebeb] bg-[#f7f7f7] px-3.5 py-2 text-black focus:bg-white focus:border-black focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-medium text-black mb-1">Señas Particulares *</label>
                <textarea
                  rows={2}
                  required
                  value={editDistinctMarks}
                  onChange={(e) => setEditDistinctMarks(e.target.value)}
                  className="w-full rounded-[16px] border border-[#ebebeb] bg-[#f7f7f7] p-3 text-black focus:bg-white focus:border-black focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-black mb-1">Pregunta de Seguridad (RF-09)</label>
                <input
                  type="text"
                  value={editSecLabel}
                  onChange={(e) => setEditSecLabel(e.target.value)}
                  className="w-full rounded-[16px] border border-[#ebebeb] bg-[#f7f7f7] px-3.5 py-2 text-black focus:bg-white focus:border-black focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-black mb-1">Respuesta Correcta Esperada</label>
                <input
                  type="text"
                  value={editSecHint}
                  onChange={(e) => setEditSecHint(e.target.value)}
                  className="w-full rounded-[16px] border border-[#ebebeb] bg-[#f7f7f7] px-3.5 py-2 text-black focus:bg-white focus:border-black focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#ebebeb]">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="rounded-full border border-[#ebebeb] hover:border-black px-4 py-2 text-xs text-black cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-full bg-black text-white px-5 py-2 text-xs font-medium hover:bg-neutral-800 cursor-pointer"
              >
                Guardar Cambios (UPDATE)
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
