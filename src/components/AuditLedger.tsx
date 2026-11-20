import React, { useState } from 'react';
import {
  History,
  Search,
  Download,
  Filter,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  FileSpreadsheet,
  Hash,
  ExternalLink,
} from 'lucide-react';
import { CustodyItem } from '../types/custody';

interface AuditLedgerProps {
  items: CustodyItem[];
  onSelectItem: (item: CustodyItem) => void;
}

export const AuditLedger: React.FC<AuditLedgerProps> = ({ items, onSelectItem }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  interface LedgerEntry {
    stepId: string;
    itemId: string;
    trackingCode: string;
    itemTitle: string;
    action: string;
    timestamp: string;
    officer: string;
    officerBadge: string;
    status: 'completed' | 'warning' | 'security_hold' | 'pending';
    notes: string;
    hash: string;
    itemRef: CustodyItem;
  }

  // Aplanar todos los pasos de la cadena de custodia
  const allEntries: LedgerEntry[] = [];
  items.forEach((item) => {
    (item.timeline || []).forEach((step) => {
      allEntries.push({
        stepId: `${item.id}-${step.id}`,
        itemId: item.id,
        trackingCode: item.trackingCode || '',
        itemTitle: item.title || '',
        action: step.title || '',
        timestamp: step.timestamp || '',
        officer: step.officer || '',
        officerBadge: step.officerBadge || '',
        status: step.status || 'completed',
        notes: step.notes || '',
        hash: step.hash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        itemRef: item,
      });
    });
  });

  const filteredEntries = allEntries.filter((entry) => {
    const q = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !q ||
      entry.trackingCode.toLowerCase().includes(q) ||
      entry.itemTitle.toLowerCase().includes(q) ||
      entry.action.toLowerCase().includes(q) ||
      entry.officer.toLowerCase().includes(q) ||
      entry.officerBadge.toLowerCase().includes(q) ||
      entry.hash.toLowerCase().includes(q) ||
      entry.notes.toLowerCase().includes(q);

    const matchesStatus =
      statusFilter === 'all' ? true : entry.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(allEntries, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `AUDIT_LEDGER_SOP_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white p-5 border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-heading text-lg font-bold text-slate-900 flex items-center gap-2">
              <History className="h-5 w-5 text-blue-600" />
              Bitácora Inmutable de Auditoría de Custodia (RF-14 / CU-08)
            </h2>
            <span className="rounded bg-emerald-100 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-800">
              SHA-256 Ledger
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Registro secuencial y criptográficamente sellado de todos los movimientos, validaciones, entregas e incidentes.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportJSON}
          className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition active:scale-95"
        >
          <Download className="h-4 w-4" />
          <span>Exportar Bitácora Oficial (JSON)</span>
        </button>
      </div>

      {/* Barra de Filtros */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-3 border border-slate-200">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por código, acción, hash o funcionario..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1 text-xs">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`rounded-lg px-3 py-1.5 font-semibold transition ${
              statusFilter === 'all'
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Todos ({allEntries.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('completed')}
            className={`rounded-lg px-3 py-1.5 font-semibold transition ${
              statusFilter === 'completed'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Ordinarios
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('warning')}
            className={`rounded-lg px-3 py-1.5 font-semibold transition ${
              statusFilter === 'warning'
                ? 'bg-amber-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Advertencias
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('security_hold')}
            className={`rounded-lg px-3 py-1.5 font-semibold transition ${
              statusFilter === 'security_hold'
                ? 'bg-red-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Bloqueos Judiciales
          </button>
        </div>
      </div>

      {/* Tabla de Eventos */}
      <div className="overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 font-mono text-[11px] font-bold uppercase text-slate-600">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Bien / Tracking</th>
                <th className="px-4 py-3">Acción Registrada</th>
                <th className="px-4 py-3">Funcionario / Placa</th>
                <th className="px-4 py-3">Detalle / Notas de Actuación</th>
                <th className="px-4 py-3 font-mono">Hash Criptográfico SHA-256</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEntries.map((entry) => {
                const isSecHold = entry.status === 'security_hold';
                const isWarn = entry.status === 'warning';

                return (
                  <tr
                    key={entry.stepId}
                    onClick={() => onSelectItem(entry.itemRef)}
                    className="hover:bg-slate-50/80 cursor-pointer transition"
                  >
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-slate-500">
                      {entry.timestamp}
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-mono font-bold text-blue-700">
                        {entry.trackingCode}
                      </div>
                      <div className="line-clamp-1 text-slate-600 text-[11px]">
                        {entry.itemTitle}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 font-bold">
                        {isSecHold ? (
                          <ShieldAlert className="h-4 w-4 text-red-600" />
                        ) : isWarn ? (
                          <AlertTriangle className="h-4 w-4 text-amber-600" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        )}
                        <span
                          className={
                            isSecHold
                              ? 'text-red-700'
                              : isWarn
                              ? 'text-amber-700'
                              : 'text-slate-800'
                          }
                        >
                          {entry.action}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">{entry.officer}</div>
                      <div className="font-mono text-[10px] text-slate-400">
                        {entry.officerBadge}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-slate-600 max-w-xs">
                      <p className="line-clamp-2 text-[11px] leading-relaxed">
                        {entry.notes}
                      </p>
                    </td>

                    <td className="whitespace-nowrap px-4 py-3 font-mono text-[10px] text-slate-400">
                      <span className="rounded bg-slate-100 px-2 py-1 font-mono text-slate-700">
                        {entry.hash.substring(0, 16)}...
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
