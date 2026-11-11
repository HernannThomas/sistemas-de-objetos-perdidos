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
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CustodyItem, ClaimantRecord } from '../types/custody';
import { sfx } from '../utils/audio';

interface SignatureHandoffModalProps {
  item: CustodyItem;
  isOpen: boolean;
  onClose: () => void;
  onCompleteHandoff: (record: ClaimantRecord) => void;
}

export const SignatureHandoffModal: React.FC<SignatureHandoffModalProps> = ({
  item,
  isOpen,
  onClose,
  onCompleteHandoff,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);

  const [claimantName, setClaimantName] = useState('');
  const [idType, setIdType] = useState('DNI / NIF');
  const [idNumber, setIdNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [verifiedSerial, setVerifiedSerial] = useState(false);
  const [verifiedGovtId, setVerifiedGovtId] = useState(false);

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
      }, 60);
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
    if (!claimantName.trim() || !idNumber.trim()) return;

    let signatureDataUrl = '';
    const canvas = canvasRef.current;
    if (canvas && hasSigned) {
      signatureDataUrl = canvas.toDataURL('image/png');
    }

    sfx.playVerificationSuccess();
    sfx.playSolenoidLatch();

    onCompleteHandoff({
      fullName: claimantName,
      idType,
      idNumber,
      phone,
      signatureDataUrl,
      verifiedTimestamp:
        new Date().toLocaleDateString('es-ES', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }) +
        ' · ' +
        new Date().toLocaleTimeString('es-ES', { hour12: false }),
      verifyingOfficer: 'Ofc. J. Martínez (8921-SEC)',
      notes: notes.trim() || 'El reclamante superó el control de comprobación de identidad y rubricó el descargo de entrega.',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/75 p-4 backdrop-blur-xs">
      <motion.div
        initial={{ scale: 0.93, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.93, opacity: 0, y: 15 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="relative w-full max-w-2xl rounded-lg bg-white shadow-2xl overflow-hidden border border-slate-200"
      >
        {/* Cabecera Institucional */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-[#0F172A] px-5 py-3.5 text-white">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
            <div>
              <h3 className="font-heading text-sm font-bold uppercase tracking-wider">
                Protocolo de Entrega Formal a Reclamante y Exoneración
              </h3>
              <p className="font-mono text-[11px] text-slate-300">
                Bien: {item.trackingCode} · {item.title}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Cuerpo del Formulario */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Lista de Comprobaciones Obligatorias */}
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <span className="block text-[11px] font-bold uppercase text-slate-700 mb-2">
              Comprobaciones Obligatorias del Oficial
            </span>
            <div className="space-y-2 text-xs text-slate-700">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={verifiedGovtId}
                  onChange={(e) => setVerifiedGovtId(e.target.checked)}
                  required
                  className="rounded text-[#2563EB] focus:ring-[#2563EB]"
                />
                <span>Documento oficial de identidad con fotografía comprobado físicamente</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={verifiedSerial}
                  onChange={(e) => setVerifiedSerial(e.target.checked)}
                  required
                  className="rounded text-[#2563EB] focus:ring-[#2563EB]"
                />
                <span>
                  Acreditación de titularidad fehaciente comprobada (N/S #{item.serialNumber || 'N/D'}, factura o clave de acceso)
                </span>
              </label>
            </div>
          </div>

          {/* Datos Personales del Reclamante */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Nombre y Apellidos del Titular *
              </label>
              <div className="relative">
                <User className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  required
                  value={claimantName}
                  onChange={(e) => setClaimantName(e.target.value)}
                  placeholder="ej. Elena Gutiérrez Valle"
                  className="w-full rounded border border-slate-300 bg-white py-2 pl-8 pr-3 text-xs text-slate-800 focus:border-[#2563EB] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Teléfono de Contacto *
              </label>
              <div className="relative">
                <Phone className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+34 600 000 000"
                  className="w-full rounded border border-slate-300 bg-white py-2 pl-8 pr-3 text-xs text-slate-800 focus:border-[#2563EB] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Tipo de Documento *
              </label>
              <select
                value={idType}
                onChange={(e) => setIdType(e.target.value)}
                className="w-full rounded border border-slate-300 bg-white py-2 px-2.5 text-xs text-slate-800 focus:border-[#2563EB] focus:outline-none"
              >
                <option value="DNI / NIF">DNI / NIF</option>
                <option value="Pasaporte">Pasaporte</option>
                <option value="Permiso de Conducir">Permiso de Conducir</option>
                <option value="NIE / Residencia">NIE / Residencia</option>
                <option value="Acreditación Consular">Acreditación Consular</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Número de Documento *
              </label>
              <div className="relative">
                <CreditCard className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  required
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  placeholder="ej. 53892104-M"
                  className="w-full rounded border border-slate-300 bg-white py-2 pl-8 pr-3 text-xs text-slate-800 font-mono focus:border-[#2563EB] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Área de Firma Digital */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1.5">
                <PenTool className="h-3.5 w-3.5 text-[#0F172A]" />
                <span>Panel de Firma Digital del Reclamante *</span>
              </label>
              <button
                type="button"
                onClick={clearSignature}
                className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800 transition"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Limpiar</span>
              </button>
            </div>

            <div className="relative rounded border-2 border-dashed border-slate-300 bg-white p-1 hover:border-slate-400 transition-colors">
              <canvas
                ref={canvasRef}
                width={560}
                height={140}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full h-28 touch-none cursor-crosshair bg-white rounded"
              />
              {!hasSigned && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs text-slate-400 font-medium">
                  Firme con el ratón o dedo sobre este recuadro
                </div>
              )}
            </div>
            <p className="mt-1 text-[10px] text-slate-500">
              Al firmar, el titular declara haber recibido conforme la propiedad descrita y exonera a la entidad de cualquier responsabilidad posterior.
            </p>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Diligencias de Salida del Oficial
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="ej. Dispositivo desbloqueado con código PIN por el usuario ante el mostrador."
              className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-[#2563EB] focus:outline-none"
            />
          </div>

          {/* Botones de Acción */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="rounded px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
            >
              Cancelar
            </button>
            <motion.button
              whileHover={hasSigned ? { scale: 1.02 } : {}}
              whileTap={hasSigned ? { scale: 0.98 } : {}}
              type="submit"
              disabled={!hasSigned}
              className={`flex items-center gap-2 rounded-md px-4 py-2 text-xs font-bold text-white shadow-sm transition ${
                hasSigned
                  ? 'bg-[#0F172A] hover:bg-[#1E293B]'
                  : 'bg-slate-400 cursor-not-allowed'
              }`}
            >
              <FileCheck className="h-4 w-4" />
              <span>Confirmar Entrega y Liberar Casillero</span>
            </motion.button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
