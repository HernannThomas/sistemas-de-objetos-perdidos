import React, { useState, useMemo } from 'react';
import {
  X,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Lock,
  User,
  CreditCard,
  Phone,
  FileText,
  HelpCircle,
  Sparkles,
  ArrowRight,
  Flame,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CustodyItem, FailedAttempt } from '../types/custody';
import { sfx } from '../utils/audio';

interface ValidationProtocolModalProps {
  item: CustodyItem;
  isOpen: boolean;
  onClose: () => void;
  onProceedToDelivery: (claimantData: {
    fullName: string;
    idType: string;
    idNumber: string;
    phone: string;
    coincidencePercentage: number;
    notes: string;
  }) => void;
  onRegisterFailedAttempt: (attempt: Omit<FailedAttempt, 'id' | 'timestamp'>) => void;
}

export const ValidationProtocolModal: React.FC<ValidationProtocolModalProps> = ({
  item,
  isOpen,
  onClose,
  onProceedToDelivery,
  onRegisterFailedAttempt,
}) => {
  // Reclamante en ventanilla
  const [claimantName, setClaimantName] = useState('');
  const [idType, setIdType] = useState('CC');
  const [idNumber, setIdNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [claimantNotes, setClaimantNotes] = useState('');

  // Checklist de Ponderación de Coincidencias (RF-08)
  const [checkBrand, setCheckBrand] = useState(false); // 15%
  const [checkModel, setCheckModel] = useState(false); // 15%
  const [checkColor, setCheckColor] = useState(false); // 10%
  const [checkMarks, setCheckMarks] = useState(false); // 15%
  const [checkDate, setCheckDate] = useState(false); // 10%
  const [checkPlace, setCheckPlace] = useState(false); // 15%
  const [checkSecurityKey, setCheckSecurityKey] = useState(false); // 20% (RF-09)

  // Modo de registro de intento fallido
  const [isFailedMode, setIsFailedMode] = useState(false);
  const [failedReason, setFailedReason] = useState('');

  // Cálculo del porcentaje dinámico (RF-08: Umbral 70% - 80%)
  const percentage = useMemo(() => {
    let score = 0;
    if (checkBrand) score += 15;
    if (checkModel) score += 15;
    if (checkColor) score += 10;
    if (checkMarks) score += 15;
    if (checkDate) score += 10;
    if (checkPlace) score += 15;
    if (checkSecurityKey) score += 20;
    return score;
  }, [checkBrand, checkModel, checkColor, checkMarks, checkDate, checkPlace, checkSecurityKey]);

  const attemptsCount = item.failedAttempts ? item.failedAttempts.length : 0;
  const isFourthAttempt = attemptsCount >= 3;

  if (!isOpen) return null;

  const handleProceed = () => {
    if (!claimantName.trim() || !idNumber.trim()) {
      alert('Por favor ingrese el nombre completo y número de documento del reclamante.');
      return;
    }
    if (percentage < 70) {
      alert('El protocolo exige un umbral mínimo del 70% de coincidencia para formalizar la entrega.');
      return;
    }
    sfx.playVerificationSuccess();
    onProceedToDelivery({
      fullName: claimantName,
      idType,
      idNumber,
      phone,
      coincidencePercentage: percentage,
      notes: claimantNotes || `Validación presencial completada con éxito (${percentage}% de coincidencia).`,
    });
  };

  const handleSaveFailedAttempt = () => {
    if (!claimantName.trim()) {
      alert('Por favor ingrese el nombre o alias de la persona que intentó reclamar.');
      return;
    }
    if (!failedReason.trim()) {
      alert('Por favor especifique el motivo del intento fallido (respuestas erróneas, sospecha, etc.).');
      return;
    }

    sfx.playSecurityAlert();
    onRegisterFailedAttempt({
      claimantName,
      idType,
      idNumber: idNumber || 'No suministrado',
      phone: phone || 'No suministrado',
      percentageScore: percentage,
      reason: failedReason,
      officer: 'Ofc. Hernann Manchola (ADSO-3413988)',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 p-4 backdrop-blur-xs overflow-y-auto">
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 15 }}
        className="relative my-8 w-full max-w-3xl rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200"
      >
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-[#0F172A] px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/30 border border-blue-400 text-blue-400">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading text-base font-bold uppercase tracking-wider text-white">
                  Protocolo de Validación Presencial (RF-08 / RF-09)
                </h3>
                <span className="rounded bg-blue-900/80 px-2 py-0.5 font-mono text-[10px] font-bold text-blue-300">
                  CU-05
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

        {/* Alerta de Intentos Fallidos Acumulados (RF-10 / RF-11) */}
        {attemptsCount > 0 && (
          <div className="bg-amber-50 px-6 py-2.5 border-b border-amber-200 flex items-center justify-between text-xs text-amber-900">
            <div className="flex items-center gap-2 font-medium">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
              <span>
                <strong>Atención:</strong> Este artículo acumula <strong>{attemptsCount} de 4 intentos fallidos</strong>.
                {isFourthAttempt && ' ¡El próximo intento fallido aplicará BLOQUEO AUTOMÁTICO INMEDIATO (RF-11)!'}
              </span>
            </div>
            <span className="font-mono font-bold text-amber-800 bg-amber-200/70 px-2 py-0.5 rounded">
              {attemptsCount}/4
            </span>
          </div>
        )}

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Datos del Reclamante Presencial */}
          <div className="rounded-xl bg-slate-50 p-4 border border-slate-200">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-2">
              <User className="h-4 w-4 text-blue-600" />
              1. Datos del Ciudadano Reclamante (Presencial)
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  placeholder="Ej. Juan Pablo Ortiz Delgado"
                  value={claimantName}
                  onChange={(e) => setClaimantName(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Tipo Documento
                </label>
                <select
                  value={idType}
                  onChange={(e) => setIdType(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                >
                  <option value="CC">Cédula de Ciudadanía (CC)</option>
                  <option value="TI">Tarjeta de Identidad (TI)</option>
                  <option value="CE">Cédula de Extranjería (CE)</option>
                  <option value="PASAPORTE">Pasaporte</option>
                  <option value="OTRO">Carné Estudiantil / Otro</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Número de Identificación *
                </label>
                <input
                  type="text"
                  placeholder="Ej. 1075283910"
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 font-mono focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Teléfono de Contacto
                </label>
                <input
                  type="text"
                  placeholder="Ej. +57 312 987 6543"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 font-mono focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Notas de Entrevista
                </label>
                <input
                  type="text"
                  placeholder="Observaciones de conducta o prueba"
                  value={claimantNotes}
                  onChange={(e) => setClaimantNotes(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Checklist de Preguntas y Coincidencias de Referencia (RF-08) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                2. Validación de Referencias Presenciales (Ponderación)
              </h4>
              <span className="text-[11px] text-slate-500">
                Marque cada elemento que el reclamante describa con exactitud:
              </span>
            </div>

            <div className="space-y-2.5">
              {/* Marca */}
              <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={checkBrand}
                  onChange={(e) => setCheckBrand(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">Marca Comercial (+15%)</span>
                    <span className="font-mono text-slate-500 font-bold">15 pts</span>
                  </div>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    Registrado: <strong className="text-slate-800">{item.brand}</strong>
                  </p>
                </div>
              </label>

              {/* Modelo */}
              <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={checkModel}
                  onChange={(e) => setCheckModel(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">Modelo / Versión Exacta (+15%)</span>
                    <span className="font-mono text-slate-500 font-bold">15 pts</span>
                  </div>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    Registrado: <strong className="text-slate-800">{item.model || 'No especificado'}</strong>
                  </p>
                </div>
              </label>

              {/* Color */}
              <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={checkColor}
                  onChange={(e) => setCheckColor(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">Color y Acabado Exterior (+10%)</span>
                    <span className="font-mono text-slate-500 font-bold">10 pts</span>
                  </div>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    Registrado: <strong className="text-slate-800">{item.color}</strong>
                  </p>
                </div>
              </label>

              {/* Señas particulares */}
              <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={checkMarks}
                  onChange={(e) => setCheckMarks(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">Señas Particulares / Rayones / Stickers (+15%)</span>
                    <span className="font-mono text-slate-500 font-bold">15 pts</span>
                  </div>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    Detalle en custodia: <strong className="text-slate-800">{item.distinctMarks}</strong>
                  </p>
                </div>
              </label>

              {/* Fecha extravío */}
              <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={checkDate}
                  onChange={(e) => setCheckDate(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">Fecha Aproximada de Extravío (± 2 días) (+10%)</span>
                    <span className="font-mono text-slate-500 font-bold">10 pts</span>
                  </div>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    Fecha de recepción oficial: <strong className="text-slate-800">{new Date(item.registeredAt).toLocaleDateString('es-CO')}</strong>
                  </p>
                </div>
              </label>

              {/* Lugar extravío */}
              <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={checkPlace}
                  onChange={(e) => setCheckPlace(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">Lugar Exacto / Zona del Hallazgo (+15%)</span>
                    <span className="font-mono text-slate-500 font-bold">15 pts</span>
                  </div>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    Zona hallada: <strong className="text-slate-800">{item.finder.surrenderLocation}</strong>
                  </p>
                </div>
              </label>

              {/* RF-09: Verificación Reforzada / Clave Privada (20%) */}
              <div className="rounded-xl border-2 border-indigo-200 bg-indigo-50/50 p-3.5">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checkSecurityKey}
                    onChange={(e) => setCheckSecurityKey(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <div className="flex-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-indigo-900 flex items-center gap-1.5">
                        <Lock className="h-3.5 w-3.5 text-indigo-600" />
                        RF-09: Verificación Reforzada / Pregunta Clave de Seguridad (+20%)
                      </span>
                      <span className="font-mono font-bold text-indigo-700">20 pts</span>
                    </div>
                    <div className="mt-1 rounded bg-white p-2 border border-indigo-200 text-[11px] text-slate-700">
                      <span className="font-bold text-indigo-900 block mb-0.5">
                        Pregunta Confidencial (No visible al público):
                      </span>
                      {item.securityQuestion ? (
                        <>
                          <p className="font-medium text-slate-800">{item.securityQuestion.label}</p>
                          <p className="text-indigo-700 text-[10px] mt-0.5 font-mono">
                            Dato secreto esperado: {item.securityQuestion.correctHint}
                          </p>
                        </>
                      ) : (
                        <p className="text-slate-600">
                          Desbloqueo de clave en vivo ante el empleado o factura comercial con serial coincidente ({item.serialNumber || 'N/A'}).
                        </p>
                      )}
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Calibrador de Coincidencia Porcentual (RF-08: Umbral 70% a 80%) */}
          <div className="rounded-xl border p-4 bg-slate-900 text-white">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Termómetro de Coincidencia Presencial (RF-08)
              </span>
              <span className="font-mono text-2xl font-black">
                {percentage}%
              </span>
            </div>

            {/* Barra de progreso */}
            <div className="relative h-4 w-full overflow-hidden rounded-full bg-slate-800 border border-slate-700">
              <div
                className={`h-full transition-all duration-300 ${
                  percentage >= 80
                    ? 'bg-emerald-500'
                    : percentage >= 70
                    ? 'bg-amber-400'
                    : 'bg-red-500'
                }`}
                style={{ width: `${percentage}%` }}
              />
              {/* Marcas de umbral 70% y 80% */}
              <div className="absolute top-0 bottom-0 left-[70%] w-0.5 bg-white/60" title="Umbral mínimo 70%" />
              <div className="absolute top-0 bottom-0 left-[80%] w-0.5 bg-emerald-300" title="Umbral óptimo 80%" />
            </div>

            {/* Diagnóstico del Umbral */}
            <div className="mt-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                {percentage >= 80 ? (
                  <span className="flex items-center gap-1.5 font-bold text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" />
                    COINCIDENCIA ÓPTIMA (≥ 80%): APROBADO PARA ENTREGA INMEDIATA
                  </span>
                ) : percentage >= 70 ? (
                  <span className="flex items-center gap-1.5 font-bold text-amber-300">
                    <AlertTriangle className="h-4 w-4" />
                    COINCIDENCIA ACEPTABLE (70% - 79%): UMBRAL MÍNIMO ALCANZADO (CON RESERVA)
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 font-bold text-red-400">
                    <ShieldAlert className="h-4 w-4" />
                    COINCIDENCIA INSUFICIENTE (&lt; 70%): ENTREGA NO AUTORIZADA
                  </span>
                )}
              </div>
              <span className="font-mono text-[11px] text-slate-400">
                Exigencia SRS: 70% - 80%
              </span>
            </div>
          </div>

          {/* Modo Registro de Intento Fallido (RF-10 / CU-06) */}
          {isFailedMode && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="rounded-xl border-2 border-red-300 bg-red-50 p-4 space-y-3"
            >
              <div className="flex items-center gap-2 text-red-900 font-bold text-xs">
                <ShieldAlert className="h-4 w-4 text-red-600" />
                <span>Registro Oficial de Intento Fallido de Reclamación (RF-10)</span>
              </div>
              <p className="text-red-700 text-xs">
                Se registrará en la bitácora inmutable de auditoría el intento fallido número{' '}
                <strong>{attemptsCount + 1} de 4</strong> con un porcentaje alcanzado de{' '}
                <strong>{percentage}%</strong>.
                {isFourthAttempt && (
                  <strong className="block text-red-900 mt-1">
                    ¡ESTE ES EL 4TO INTENTO! El bien se bloqueará automáticamente por seguridad (RF-11).
                  </strong>
                )}
              </p>

              <div>
                <label className="block text-[11px] font-bold text-red-900 mb-1">
                  Motivo detallado del fallo o inconsistencias observadas *
                </label>
                <textarea
                  rows={2}
                  value={failedReason}
                  onChange={(e) => setFailedReason(e.target.value)}
                  placeholder="Ej. El ciudadano adujo ser el dueño pero erró el color, no supo el fondo de pantalla y no aportó documento de identidad."
                  className="w-full rounded-lg border border-red-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsFailedMode(false)}
                  className="rounded-lg px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 transition"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveFailedAttempt}
                  className="rounded-lg bg-red-600 px-4 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-red-700 transition"
                >
                  Confirmar y Asentar Intento Fallido #{attemptsCount + 1}
                </button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Pie de Acciones del Modal (Exclusivo Empleado / Trabajador: Sin autobloqueo) */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">
          <div className="text-xs text-slate-500">
            Modo Administrador / Empleado: Usted administra la entrega sin riesgo de bloqueo.
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 transition cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleProceed}
              disabled={percentage < 70}
              className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold transition shadow-sm ${
                percentage >= 70
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-500/25 cursor-pointer active:scale-95'
                  : 'bg-slate-300 text-slate-500 cursor-not-allowed'
              }`}
            >
              <span>Aprobar y Formalizar Entrega (RF-12)</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
