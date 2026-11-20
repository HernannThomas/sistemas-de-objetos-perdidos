import React, { useState } from 'react';
import {
  X,
  ShieldAlert,
  Unlock,
  Lock,
} from 'lucide-react';
import { motion } from 'motion/react';
import { CustodyItem, UserRole } from '../types/custody';
import { sfx } from '../utils/audio';

interface SecurityHoldModalProps {
  item: CustodyItem;
  isOpen: boolean;
  currentUserRole: UserRole;
  onClose: () => void;
  onApplyHold: (reason: string) => void;
  onRemoveHold: (justification: string) => void;
}

export const SecurityHoldModal: React.FC<SecurityHoldModalProps> = ({
  item,
  isOpen,
  currentUserRole,
  onClose,
  onApplyHold,
  onRemoveHold,
}) => {
  const hasBlockedClient =
    item.status === 'BLOQUEADO_POR_SEGURIDAD' ||
    (item.failedAttempts && item.failedAttempts.length > 0);
  const isAlreadyLocked = hasBlockedClient;
  // Tanto el Empleado (trabajador que administra) como el Administrador pueden gestionar y desbloquear
  const canManage = currentUserRole === 'employee' || currentUserRole === 'admin';

  const [holdReason, setHoldReason] = useState(
    'Bloqueo preventivo de reclamo para el cliente por inconsistencias en validación o verificación pendiente.'
  );
  const [unlockJustification, setUnlockJustification] = useState(
    'El funcionario de custodia verificó la situación y autoriza restablecer los intentos de reclamo para el cliente.'
  );

  if (!isOpen) return null;

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!holdReason.trim()) return;
    sfx.playSecurityAlert();
    onApplyHold(holdReason);
  };

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) return;
    if (!unlockJustification.trim()) {
      alert('Por favor ingrese la nota de desbloqueo para habilitar nuevamente al cliente.');
      return;
    }
    sfx.playVerificationSuccess();
    onRemoveHold(unlockJustification);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 p-4 backdrop-blur-xs">
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 15 }}
        className="relative w-full max-w-xl rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200"
      >
        {/* Cabecera */}
        <div
          className={`flex items-center justify-between px-6 py-4 text-white ${
            isAlreadyLocked ? 'bg-emerald-800' : 'bg-[#0F172A]'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
              {isAlreadyLocked ? (
                <Unlock className="h-5 w-5 text-white" />
              ) : (
                <ShieldAlert className="h-5 w-5 text-amber-400" />
              )}
            </div>
            <div>
              <h3 className="font-heading text-base font-bold uppercase tracking-wider">
                {isAlreadyLocked
                  ? 'Desbloquear Producto para el Cliente'
                  : 'Restringir Reclamo al Cliente'}
              </h3>
              <p className="font-mono text-xs text-slate-200">
                Bien: {item.trackingCode} · {item.title}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-300 hover:bg-white/10 hover:text-white transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {isAlreadyLocked ? (
          /* Modo Desbloqueo por Empleado o Admin */
          <form onSubmit={handleUnlock} className="p-6 space-y-4">
            <div className="rounded-xl bg-red-50 p-3.5 border border-red-200 text-xs text-red-900">
              <span className="font-bold block mb-1">Motivo por el que se bloqueó al Cliente:</span>
              <p>
                {item.securityHoldReason ||
                  'El cliente alcanzó 4 intentos fallidos consecutivos al intentar validar la propiedad del bien.'}
              </p>
            </div>

            <div className="rounded-xl bg-blue-50 p-3 border border-blue-200 text-xs text-blue-900">
              <strong>Nota para el Trabajador / Empleado:</strong> Usted como encargado de custodia nunca queda bloqueado. Al confirmar este desbloqueo, el contador de intentos fallidos del cliente se reiniciará a 0 para que el cliente pueda volver a reclamar el producto.
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Observación de Desbloqueo *
              </label>
              <textarea
                rows={3}
                required
                value={unlockJustification}
                onChange={(e) => setUnlockJustification(e.target.value)}
                placeholder="Indique la observación para habilitar nuevamente el producto al cliente..."
                className="w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition cursor-pointer"
              >
                <Unlock className="h-4 w-4" />
                <span>Desbloquear Producto al Cliente</span>
              </button>
            </div>
          </form>
        ) : (
          /* Modo Bloqueo Preventivo hacia el Cliente */
          <form onSubmit={handleApply} className="p-6 space-y-4">
            <div className="rounded-xl bg-amber-50 p-3.5 border border-amber-200 text-xs text-amber-900">
              <span className="font-bold block mb-1">Alcance del Bloqueo (Exclusivo para el Cliente):</span>
              <p>
                Esta acción bloquea únicamente la opción de reclamo para el <strong>Cliente</strong> en el Portal Ciudadano. El <strong>Empleado</strong> conserva todas las funciones de administración, apertura de casillero y entrega sin ninguna restricción.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Motivo del Bloqueo para el Cliente *
              </label>
              <textarea
                rows={3}
                required
                value={holdReason}
                onChange={(e) => setHoldReason(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-900 focus:border-red-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-red-700 transition cursor-pointer"
              >
                <Lock className="h-4 w-4" />
                <span>Bloquear Reclamo al Cliente</span>
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
};
