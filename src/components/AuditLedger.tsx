import React, { useState } from 'react';
import {
  History,
  Search,
  Download,
  Filter,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
} from 'lucide-react';
import { motion } from 'motion/react';
import { CustodyItem } from '../types/custody';

interface AuditLedgerProps {
  items: CustodyItem[];
  onSelectItem: (item: CustodyItem) => void;
}

export const AuditLedger: React.FC<AuditLedgerProps> = ({
  items,
  onSelectItem,
}) => {
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

  const allEntries: LedgerEntry[] = [];
  items.forEach((item) => {
    item.timeline.forEach((step) => {
      allEntries.push({
        stepId: step.id,
        itemId: item.id,
        trackingCode: item.trackingCode,
        itemTitle: item.title,
        action: step.title,
        timestamp: step.timestamp,
        officer: step.officer,
        officerBadge: step.officerBadge,
        status: step.status,
        notes: step.notes,
        hash: step.hash || 'SHA256: 4a9f11...88c2',
        itemRef: item,
      });
    });
  });

  const filteredEntries = allEntries.filter((entry) => {
    const matchesSearch =
      entry.trackingCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.officer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.notes.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ? true : entry.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleDownloadCsv = () => {
    const headers = [
      'Fecha y Hora',
      'Código de Control',
      'Denominación del Bien',
      'Actuación Custodial',
      'Oficial Responsable',
      'Placa / Carnet Profesional',
      'Calificación de Conformidad',
      'Diligencias y Observaciones',
      'Hash Criptográfico',
    ];

    const rows = filteredEntries.map((e) => [
      `"${e.timestamp}"`,
      `"${e.trackingCode}"`,
      `"${e.itemTitle}"`,
      `"${e.action}"`,
      `"${e.officer}"`,
      `"${e.officerBadge}"`,
      `"${e.status}"`,
      `"${e.notes.replace(/"/g, '""')}"`,
      `"${e.hash}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `custodia_core_libro_auditoria_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: LedgerEntry['status']) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-3 w-3" />
            <span>ASENTADO</span>
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 border border-amber-200">
            <AlertTriangle className="h-3 w-3" />
            <span>DISCREPANCIA</span>
          </span>
        );
      case 'security_hold':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-700 border border-red-200 font-bold">
            <ShieldAlert className="h-3 w-3 text-red-600" />
            <span>RETENCIÓN JUDICIAL</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
            PENDIENTE
          </span>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col gap-5"
    >
      {/* Cabecera y Controles */}
      <div className="rounded-lg border border-[#E2E8F0] bg-white p-5 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-[#1E3A8A]" />
              <h2 className="font-heading text-lg font-bold text-[#0F172A]">
                Libro Oficial de Registro de Cadena de Custodia
              </h2>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Registro inalterable con fe pública y prueba criptográfica para atestados policiales, juzgados y control patrimonial.
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={handleDownloadCsv}
            className="flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 shadow-xs hover:bg-slate-50 transition"
          >
            <Download className="h-3.5 w-3.5 text-slate-600" />
            <span>Exportar CSV Certificado</span>
          </motion.button>
        </div>

        {/* Barra de Filtros */}
        <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por código, oficial, diligencias, palabra clave..."
              className="w-full rounded border border-slate-300 py-1.5 pl-8 pr-3 text-xs text-slate-800 focus:border-[#2563EB] focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <Filter className="h-3.5 w-3.5 text-slate-500" />
            <span className="text-slate-600 font-medium">Filtrar Estado:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded border border-slate-300 bg-white py-1.5 px-2 text-xs text-slate-800"
            >
              <option value="all">Todos los Asientos ({allEntries.length})</option>
              <option value="completed">Conformes / Ordinarios</option>
              <option value="warning">Discrepancias / Alertas</option>
              <option value="security_hold">Retenciones Judiciales</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabla de Alta Densidad */}
      <div className="overflow-hidden rounded-lg border border-[#E2E8F0] bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                <th className="py-2.5 px-4 font-mono">Fecha y Hora</th>
                <th className="py-2.5 px-3">Código Control</th>
                <th className="py-2.5 px-3">Evento / Actuación</th>
                <th className="py-2.5 px-3">Oficial Certificador</th>
                <th className="py-2.5 px-3">Diligencias Registradas</th>
                <th className="py-2.5 px-3">Calificación</th>
                <th className="py-2.5 px-3 font-mono">Hash Criptográfico</th>
                <th className="py-2.5 px-4 text-right">Ficha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-xs text-slate-400">
                    No existen registros que coincidan con los criterios de búsqueda.
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry) => (
                  <tr
                    key={entry.stepId}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="py-2.5 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {entry.timestamp}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-semibold text-[#0F172A] whitespace-nowrap">
                      <span className="code-tracking">{entry.trackingCode}</span>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900 max-w-xs truncate">
                      {entry.action}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="font-medium text-slate-800">{entry.officer}</span>
                      <span className="ml-1 text-[10px] font-mono text-slate-500">
                        #{entry.officerBadge}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 max-w-sm truncate" title={entry.notes}>
                      {entry.notes}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      {getStatusBadge(entry.status)}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[10px] text-slate-400 whitespace-nowrap">
                      {entry.hash}
                    </td>
                    <td className="py-2.5 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onSelectItem(entry.itemRef)}
                        className="font-semibold text-[#2563EB] hover:underline"
                      >
                        Abrir
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};
