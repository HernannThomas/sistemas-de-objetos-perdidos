import React, { useRef, useState, useEffect } from 'react';
import {
  X,
  PenTool,
  RotateCcw,
  ShieldCheck,
  User,
  CreditCard,
  Phone,
  FileCheck,
  CheckCircle2,
  Lock,
  Printer,
  Sparkles,
} from 'lucide-react';
import { motion } from 'motion/react';
import { CustodyItem, ClaimantRecord } from '../types/custody';
import { sfx } from '../utils/audio';

interface SignatureHandoffModalProps {
  item: CustodyItem;
  isOpen: boolean;
  onClose: () => void;
  claimantPreset?: {
    fullName: string;
    idType: string;
    idNumber: string;
    phone: string;
    coincidencePercentage: number;
    notes: string;
  } | null;
  onCompleteHandoff: (record: ClaimantRecord) => void;
}

export const SignatureHandoffModal: React.FC<SignatureHandoffModalProps> = ({
  item,
  isOpen,
  onClose,
  claimantPreset,
  onCompleteHandoff,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);

  const [claimantName, setClaimantName] = useState('');
  const [idType, setIdType] = useState('CC');
  const [idNumber, setIdNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [percentage, setPercentage] = useState(85);

  const [verifiedGovtId, setVerifiedGovtId] = useState(true);
  const [verifiedTamperSeal, setVerifiedTamperSeal] = useState(true);
  const [verifiedPhysicalLocker, setVerifiedPhysicalLocker] = useState(true);

  // Cargar datos previos de la validación
  useEffect(() => {
    if (claimantPreset) {
      setClaimantName(claimantPreset.fullName);
      setIdType(claimantPreset.idType);
      setIdNumber(claimantPreset.idNumber);
      setPhone(claimantPreset.phone);
      setNotes(claimantPreset.notes);
      setPercentage(claimantPreset.coincidencePercentage);
    }
  }, [claimantPreset]);

  // Inicializar canvas
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#0F172A';
      }, 80);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getCoordinates = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasSigned(true);
  };

  const draw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasSigned(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimantName.trim() || !idNumber.trim()) {
      alert('Por favor complete el nombre y documento del titular.');
      return;
    }
    if (!hasSigned) {
      alert('Se requiere la firma manuscrita digitalizada en el panel para legalizar el acta.');
      return;
    }

    let signatureDataUrl = '';
    const canvas = canvasRef.current;
    if (canvas && hasSigned) {
      signatureDataUrl = canvas.toDataURL('image/png');
    }

    sfx.playVerificationSuccess();
    sfx.playSolenoidLatch();

    const randomHash = 'ACTA-' + Math.random().toString(36).substring(2, 10).toUpperCase() + '-SHA256';

    onCompleteHandoff({
      fullName: claimantName,
      idType,
      idNumber,
      phone,
      email,
      signatureDataUrl,
      verifiedTimestamp: new Date().toLocaleString('es-CO'),
      verifyingOfficer: 'Ofc. Hernann Manchola',
      officerBadge: 'ADSO-3413988',
      coincidencePercentage: percentage,
      deliveryCertificateHash: randomHash,
      notes: notes.trim() || `Entrega formal concluida bajo verificación presencial (${percentage}%). Precinto ${item.tamperSealNumber} retirado.`,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 p-4 backdrop-blur-xs overflow-y-auto">
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 15 }}
        className="relative my-8 w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200"
      >
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-[#0F172A] px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/30 border border-emerald-400 text-emerald-400">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading text-base font-bold uppercase tracking-wider text-white">
                  Formalización de Entrega y Exoneración (RF-12 / RF-13)
                </h3>
                <span className="rounded bg-emerald-900/80 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-300">
                  CU-07
                </span>
              </div>
              <p className="font-mono text-xs text-slate-300">
                Bien: {item.trackingCode} · {item.title}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Indicador de Coincidencia Lograda */}
          <div className="rounded-xl bg-emerald-50 p-3.5 border border-emerald-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              <div>
                <p className="text-xs font-bold text-emerald-900">
                  Protocolo RF-08 Superado Exitosamente
                </p>
                <p className="text-[11px] text-emerald-700">
                  El reclamante alcanzó un <strong>{percentage}% de coincidencia</strong> (Umbral exigido: 70% - 80%).
                </p>
              </div>
            </div>
            <span className="font-mono text-sm font-black text-emerald-800 bg-emerald-200/80 px-2.5 py-1 rounded-lg">
              {percentage}% Coincidencia
            </span>
          </div>

          {/* Formulario Reclamante */}
          <div className="rounded-xl bg-slate-50 p-4 border border-slate-200">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-2">
              <User className="h-4 w-4 text-blue-600" />
              Identificación Oficial del Reclamante
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  value={claimantName}
                  onChange={(e) => setClaimantName(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Tipo Doc.
                  </label>
                  <select
                    value={idType}
                    onChange={(e) => setIdType(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-2.5 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="CC">CC - Cédula</option>
                    <option value="TI">TI - Tarjeta</option>
                    <option value="CE">CE - Extranjería</option>
                    <option value="PASAPORTE">Pasaporte</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Número Doc. *
                  </label>
                  <input
                    type="text"
                    required
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 font-mono focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Teléfono Móvil
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 font-mono focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="aprendiz@correo.com"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Verificaciones Físicas previas */}
          <div className="space-y-2 rounded-xl bg-slate-50 p-3.5 border border-slate-200 text-xs">
            <span className="font-bold text-slate-800 block mb-1">
              Verificaciones Físicas Obligatorias en Mostrador:
            </span>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={verifiedGovtId}
                onChange={(e) => setVerifiedGovtId(e.target.checked)}
                className="h-4 w-4 rounded text-blue-600"
              />
              <span className="text-slate-700">Se cotejó documento de identidad físico original (cédula o carné institucional).</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={verifiedTamperSeal}
                onChange={(e) => setVerifiedTamperSeal(e.target.checked)}
                className="h-4 w-4 rounded text-blue-600"
              />
              <span className="text-slate-700">
                Se retiró el precinto de custodia número <strong>{item.tamperSealNumber}</strong> sin manipulación indebida.
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={verifiedPhysicalLocker}
                onChange={(e) => setVerifiedPhysicalLocker(e.target.checked)}
                className="h-4 w-4 rounded text-blue-600"
              />
              <span className="text-slate-700">
                Se retiró el bien del casillero físico <strong>{item.location.lockerNumber} ({item.location.zone})</strong>.
              </span>
            </label>
          </div>

          {/* Panel de Firma Digital Manuscrita */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <PenTool className="h-4 w-4 text-blue-600" />
                Rúbrica / Firma Digital del Reclamante *
              </label>
              <button
                type="button"
                onClick={clearSignature}
                className="flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-red-600 transition"
              >
                <RotateCcw className="h-3 w-3" />
                Limpiar Firma
              </button>
            </div>

            <div className="relative rounded-xl border-2 border-dashed border-slate-300 bg-white p-1 hover:border-slate-400 transition">
              <canvas
                ref={canvasRef}
                width={580}
                height={160}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full h-40 touch-none cursor-crosshair rounded-lg bg-white"
              />
              {!hasSigned && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs font-medium text-slate-400">
                  Dibuje aquí la firma del titular con mouse o pantalla táctil
                </div>
              )}
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              Al firmar, el receptor certifica recibir a conformidad el bien y exonera a la institución de reclamaciones futuras (RF-12).
            </p>
          </div>

          {/* Pie de Acciones */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 transition"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={!hasSigned || !claimantName.trim() || !idNumber.trim()}
              className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold transition shadow-sm ${
                hasSigned && claimantName.trim() && idNumber.trim()
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-500/25 cursor-pointer active:scale-95'
                  : 'bg-slate-300 text-slate-500 cursor-not-allowed'
              }`}
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Emitir Acta Oficial y Dar de Baja (RF-13)</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
