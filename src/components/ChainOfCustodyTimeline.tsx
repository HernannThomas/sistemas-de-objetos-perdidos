import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Clock,
  Plus,
  Hash,
  ShieldCheck,
  Send,
} from 'lucide-react';
import { TimelineStep } from '../types/custody';

interface ChainOfCustodyTimelineProps {
  timeline: TimelineStep[];
  onAddStep: (step: Omit<TimelineStep, 'id'>) => void;
  isSecurityLocked: boolean;
}

export const ChainOfCustodyTimeline: React.FC<ChainOfCustodyTimelineProps> = ({
  timeline,
  onAddStep,
  isSecurityLocked,
}) => {
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [stepStatus, setStepStatus] = useState<TimelineStep['status']>('completed');

  const handleSubmitNewStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const randomHash =
      'SHA256: ' +
      Array.from({ length: 6 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join('') +
      '...' +
      Array.from({ length: 4 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join('');

    onAddStep({
      title: newTitle,
      timestamp: new Date().toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }) + ' · ' + new Date().toLocaleTimeString('es-ES', { hour12: false }),
      officer: 'J. Martínez',
      officerBadge: '8921-SEC',
      status: stepStatus,
      notes: newNotes,
      hash: randomHash,
    });

    setNewTitle('');
    setNewNotes('');
    setIsAddingNote(false);
  };

  const getStepIcon = (status: TimelineStep['status']) => {
    switch (status) {
      case 'completed':
        return (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#ECFDF5] border-2 border-[#059669] text-[#059669] shadow-xs">
            <CheckCircle2 className="h-4 w-4" />
          </div>
        );
      case 'warning':
        return (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FFFBEB] border-2 border-[#D97706] text-[#D97706] shadow-xs">
            <AlertTriangle className="h-4 w-4" />
          </div>
        );
      case 'security_hold':
        return (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FEF2F2] border-2 border-[#DC2626] text-[#DC2626] shadow-xs">
            <ShieldAlert className="h-4 w-4" />
          </div>
        );
      default:
        return (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 border-2 border-slate-300 text-slate-400">
            <Clock className="h-4 w-4" />
          </div>
        );
    }
  };

  const getConnectorColor = (currentStep: TimelineStep) => {
    if (currentStep.status === 'security_hold') {
      return 'bg-[#DC2626]';
    }
    if (currentStep.status === 'warning') {
      return 'bg-[#D97706]';
    }
    if (currentStep.status === 'completed') {
      return 'bg-[#059669]';
    }
    return 'bg-slate-200';
  };

  return (
    <div className="rounded-lg border border-[#E2E8F0] bg-white p-5 shadow-xs">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-[#1E3A8A]" />
          <h4 className="font-heading text-sm font-semibold text-[#0F172A] uppercase tracking-wide">
            Cadena de Custodia · Historial Inmutable
          </h4>
        </div>
        <button
          type="button"
          onClick={() => setIsAddingNote(!isAddingNote)}
          className="flex items-center gap-1.5 rounded border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
        >
          <Plus className="h-3.5 w-3.5 text-slate-500" />
          <span>{isAddingNote ? 'Cancelar' : 'Asentar Registro de Auditoría'}</span>
        </button>
      </div>

      {/* Formulario Plegable de Registro */}
      {isAddingNote && (
        <form
          onSubmit={handleSubmitNewStep}
          className="my-4 rounded-md border border-slate-200 bg-slate-50 p-3.5 transition-all"
        >
          <p className="text-xs font-semibold uppercase text-slate-700 mb-2">
            Registrar Nuevo Traslado Custodial o Evento de Auditoría
          </p>
          <div className="space-y-2.5">
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Título del Evento / Actuación *
              </label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="ej. Inspección visual por supervisor de turno, Reubicación de casillero..."
                required
                className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-[#2563EB] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Estado de Conformidad
                </label>
                <select
                  value={stepStatus}
                  onChange={(e) =>
                    setStepStatus(e.target.value as TimelineStep['status'])
                  }
                  className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-[#2563EB] focus:outline-none"
                >
                  <option value="completed">Conforme / Custodia Ordinaria</option>
                  <option value="warning">Advertencia / Discrepancia de Datos</option>
                  <option value="security_hold">Retención Policial / Bloqueo</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Oficial Certificador
                </label>
                <input
                  type="text"
                  disabled
                  value="Ofc. J. Martínez (#8921-SEC)"
                  className="w-full rounded border border-slate-200 bg-slate-100 px-2.5 py-1.5 text-xs text-slate-600 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Diligencias y Observaciones de Campo
              </label>
              <textarea
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                rows={2}
                placeholder="Indique las comprobaciones físicas realizadas, identificación de intervinientes..."
                className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-[#2563EB] focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsAddingNote(false)}
                className="rounded px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-200"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded bg-[#0F172A] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#1E293B]"
              >
                <Send className="h-3 w-3" />
                <span>Firmar y Asentar Nodo</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Flujo Vertical Lineal */}
      <div className="mt-4 space-y-0">
        {timeline.map((step, index) => {
          const isLast = index === timeline.length - 1;
          const connectorColor = getConnectorColor(step);

          return (
            <div key={step.id || index} className="relative flex items-start gap-3.5 group">
              {/* Ícono de Nodo y Conector Vertical */}
              <div className="relative flex flex-col items-center">
                {getStepIcon(step.status)}
                {!isLast && (
                  <div
                    className={`w-0.5 my-1 transition-colors ${connectorColor}`}
                    style={{ minHeight: '44px', height: '100%' }}
                  />
                )}
              </div>

              {/* Tarjeta de Contenido */}
              <div
                className={`flex-1 pb-5 ${
                  step.status === 'security_hold'
                    ? 'rounded-md border border-red-200 bg-red-50/50 p-2.5 mb-2'
                    : step.status === 'warning'
                    ? 'rounded-md border border-amber-200 bg-amber-50/40 p-2.5 mb-2'
                    : ''
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <h5
                    className={`text-xs font-semibold ${
                      step.status === 'security_hold'
                        ? 'text-red-900 font-bold'
                        : step.status === 'warning'
                        ? 'text-amber-900 font-bold'
                        : 'text-slate-900'
                    }`}
                  >
                    {step.title}
                  </h5>
                  <span className="font-mono text-[11px] text-slate-500">
                    {step.timestamp}
                  </span>
                </div>

                <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                  {step.notes}
                </p>

                {/* Credencial del Oficial y Hash Criptográfico */}
                <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                  <div className="flex items-center gap-1">
                    <span className="text-slate-400">Oficial:</span>
                    <span className="font-medium text-slate-700">
                      {step.officer}
                    </span>
                    <span className="font-mono text-[10px] bg-slate-100 px-1 rounded text-slate-600 border border-slate-200">
                      #{step.officerBadge}
                    </span>
                  </div>

                  {step.hash && (
                    <div className="flex items-center gap-1 font-mono text-[10px] text-slate-400">
                      <Hash className="h-3 w-3 text-slate-400" />
                      <span>{step.hash}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
