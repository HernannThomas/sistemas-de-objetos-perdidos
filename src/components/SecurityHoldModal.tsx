import React, { useState } from 'react';
import { X, ShieldAlert, AlertOctagon, Lock } from 'lucide-react';
import { motion } from 'motion/react';
import { CustodyItem } from '../types/custody';
import { sfx } from '../utils/audio';

interface SecurityHoldModalProps {
  item: CustodyItem;
  isOpen: boolean;
  onClose: () => void;
  onConfirmHold: (reason: string, incidentRef: string) => void;
}

export const SecurityHoldModal: React.FC<SecurityHoldModalProps> = ({
  item,
  isOpen,
  onClose,
  onConfirmHold,
}) => {
  const [reason, setReason] = useState(
    'Requerimiento de la Comisaría de Policía: Coincidencia con diligencias previas por sustracción. Prohibida la entrega ordinaria a particulares.'
  );
  const [incidentRef, setIncidentRef] = useState('DIL-POL-2026-');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;
    sfx.playSecurityAlert();
    onConfirmHold(reason, incidentRef);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/75 p-4 backdrop-blur-xs">
      <motion.div
        initial={{ scale: 0.93, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.93, opacity: 0, y: 15 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="relative w-full max-w-lg rounded-lg bg-white shadow-2xl overflow-hidden border-2 border-red-600"
      >
        <div className="flex items-center justify-between border-b border-red-700 bg-[#DC2626] px-5 py-3.5 text-white">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 animate-pulse" />
            <h3 className="font-heading text-sm font-bold uppercase tracking-wider">
              Decretar Retención Policial / Bloqueo Cautelar
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-red-100 hover:bg-red-700 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-900 leading-relaxed">
            <div className="flex items-start gap-2">
              <AlertOctagon className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
              <span>
                <strong>Advertencia:</strong> Esta orden inmoviliza el bien e impide el procedimiento ordinario de entrega.
                La ficha pasará a mostrar el distintivo carmesí de alerta y la cerradura solenoide quedará bloqueada.
              </span>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Bien Objeto de Inmovilización
            </label>
            <div className="rounded border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono text-slate-800">
              {item.trackingCode} — {item.title} (N/S: {item.serialNumber || 'N/D'})
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Referencia Policial / Atestado Judicial *
            </label>
            <input
              type="text"
              required
              value={incidentRef}
              onChange={(e) => setIncidentRef(e.target.value)}
              placeholder="ej. DIL-POL-2026-9921"
              className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-xs font-mono text-slate-800 focus:border-red-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Causa Jurídica y Restricciones Dictadas *
            </label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-red-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
            >
              Cancelar
            </button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="flex items-center gap-2 rounded-md bg-[#DC2626] px-4 py-2 text-xs font-bold text-white shadow hover:bg-red-700 transition"
            >
              <Lock className="h-4 w-4" />
              <span>Ejecutar Bloqueo Cautelar</span>
            </motion.button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
