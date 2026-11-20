import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Search,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Sparkles,
  ArrowRight,
  Package,
  Layers,
  Check,
  X,
  ExternalLink,
  Edit3,
  Trash2,
} from 'lucide-react';
import { CitizenLostReport, CustodyItem } from '../types/custody';
import { sfx } from '../utils/audio';

interface CitizenReportsManagerProps {
  reports: CitizenLostReport[];
  items: CustodyItem[];
  onUpdateReportStatus: (reportId: string, status: CitizenLostReport['status'], matchedItemId?: string) => void;
  onUpdateReport?: (updatedReport: CitizenLostReport) => void;
  onDeleteReport?: (reportId: string) => void;
  onConvertFoundToCustody: (report: CitizenLostReport) => void;
  onSelectCustodyItem: (item: CustodyItem) => void;
  onOpenChat?: (threadId: string, threadTitle: string) => void;
}

export const CitizenReportsManager: React.FC<CitizenReportsManagerProps> = ({
  reports,
  items,
  onUpdateReportStatus,
  onUpdateReport,
  onDeleteReport,
  onConvertFoundToCustody,
  onSelectCustodyItem,
  onOpenChat,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedReportId, setSelectedReportId] = useState<string | null>(reports[0]?.id || null);
  const [editingReport, setEditingReport] = useState<CitizenLostReport | null>(null);

  const selectedReport = reports.find((r) => r.id === selectedReportId) || reports[0] || null;

  // Filtrar reportes
  const filteredReports = reports.filter((report) => {
    const q = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !q ||
      (report.title || '').toLowerCase().includes(q) ||
      (report.fullName || '').toLowerCase().includes(q) ||
      (report.brand || '').toLowerCase().includes(q) ||
      (report.estimatedLostPlace || '').toLowerCase().includes(q) ||
      (report.phone || '').includes(q);

    const matchesStatus =
      statusFilter === 'all' ? true : report.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Cotejo automático inteligente de posibles coincidencias en inventario activo
  const possibleMatches = selectedReport
    ? items.filter((item) => {
        if (item.status === 'ENTREGADO') return false;
        const sameCategory = item.category === selectedReport.category;
        const sameBrand =
          selectedReport.brand &&
          item.brand.toLowerCase().includes(selectedReport.brand.toLowerCase());
        const sameColor =
          selectedReport.color &&
          item.color.toLowerCase().includes(selectedReport.color.toLowerCase());

        return sameCategory || sameBrand || sameColor;
      })
    : [];

  const handleNotifyMatch = (reportId: string, matchedItem: CustodyItem) => {
    sfx.playVerificationSuccess();
    onUpdateReportStatus(reportId, 'COINCIDENCIA_DETECTADA', matchedItem.id);
    alert(
      `¡Coincidencia vinculada!\nSe ha asociado el reporte con el bien [${matchedItem.trackingCode}]. El ciudadano verá en su portal que ya puede acercarse a recepción para el protocolo presencial (70%-80%).`
    );
  };

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white p-5 border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-heading text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-blue-600" />
              Gestión de Reportes Radicados por Ciudadanos y Aprendices
            </h2>
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 font-mono text-[11px] font-bold text-emerald-800">
              {reports.length} Radicados
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Módulo de cotejo de declaraciones de pérdida y entrega de hallazgos comunitarios contra el inventario físico en custodia.
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-3 border border-slate-200">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por ciudadano, bien, marca, lugar o teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-slate-300 pl-10 pr-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`rounded-lg px-3 py-1.5 font-semibold transition ${
              statusFilter === 'all'
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Todos ({reports.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('PENDIENTE_REVISION')}
            className={`rounded-lg px-3 py-1.5 font-semibold transition ${
              statusFilter === 'PENDIENTE_REVISION'
                ? 'bg-amber-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Pendientes
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('COINCIDENCIA_DETECTADA')}
            className={`rounded-lg px-3 py-1.5 font-semibold transition ${
              statusFilter === 'COINCIDENCIA_DETECTADA'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Coincidencias
          </button>
        </div>
      </div>

      {/* Layout Dividido: Lista de Reportes a la izquierda, Cotejo a la derecha */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Columna Izquierda: Tarjetas de Reportes */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 px-1">
            <span>DECLARACIONES CIUDADANAS ({filteredReports.length})</span>
            <span className="font-mono text-[11px]">RADICACIÓN</span>
          </div>

          <div className="space-y-2.5 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
            {filteredReports.length > 0 ? (
              filteredReports.map((rep) => {
                const isSelected = selectedReport?.id === rep.id;
                const isFound = rep.reportType === 'FOUND';

                return (
                  <div
                    key={rep.id}
                    onClick={() => {
                      setSelectedReportId(rep.id);
                      sfx.playScannerBeep();
                    }}
                    className={`cursor-pointer rounded-xl border p-3.5 transition-all duration-200 ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/50 shadow-md ring-1 ring-blue-600'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-bold text-blue-700">
                          {rep.id}
                        </span>
                        <span
                          className={`rounded px-1.5 py-0.2 font-mono text-[9px] font-bold uppercase ${
                            isFound
                              ? 'bg-purple-100 text-purple-800 border border-purple-200'
                              : 'bg-blue-100 text-blue-800 border border-blue-200'
                          }`}
                        >
                          {isFound ? 'Hallazgo' : 'Pérdida'}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {rep.reportedAt}
                      </span>
                    </div>

                    <h4 className="font-heading text-xs font-bold text-slate-900 line-clamp-1">
                      {rep.title}
                    </h4>

                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {rep.brand ? `Marca: ${rep.brand} · ` : ''} Color: {rep.color || 'N/E'}
                    </p>

                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <span className="text-slate-700 font-medium truncate max-w-[170px] flex items-center gap-1">
                        <User className="h-3 w-3 text-slate-400 shrink-0" />
                        {rep.fullName}
                      </span>

                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          rep.status === 'COINCIDENCIA_DETECTADA'
                            ? 'bg-emerald-100 text-emerald-800'
                            : rep.status === 'PROCESADO_A_CUSTODIA'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {rep.status === 'COINCIDENCIA_DETECTADA'
                          ? 'Coincidencia'
                          : rep.status === 'PROCESADO_A_CUSTODIA'
                          ? 'En Custodia'
                          : 'Pendiente'}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-xs text-slate-500">
                No se encontraron reportes con los criterios de búsqueda.
              </div>
            )}
          </div>
        </div>

        {/* Columna Derecha: Detalle del Reporte y Cotejo con Bienes en Custodia */}
        <div className="lg:col-span-7 space-y-4">
          {selectedReport ? (
            <div className="space-y-4">
              {/* Expediente del Ciudadano */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
                <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-bold text-blue-700">
                        {selectedReport.id}
                      </span>
                      <span className="text-slate-300">·</span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          selectedReport.status === 'COINCIDENCIA_DETECTADA'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}
                      >
                        {selectedReport.status === 'COINCIDENCIA_DETECTADA'
                          ? 'COINCIDENCIA DETECTADA'
                          : 'EN REVISIÓN DE RECEPCIÓN'}
                      </span>
                    </div>

                    <h3 className="font-heading text-xl font-black text-slate-900">
                      {selectedReport.title}
                    </h3>

                    <p className="text-xs text-slate-500 mt-0.5">
                      Categoría: <strong className="text-slate-800">{selectedReport.category}</strong> · Marca: <strong className="text-slate-800">{selectedReport.brand || 'No especificada'}</strong> · Color: {selectedReport.color}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {onOpenChat && (
                      <button
                        type="button"
                        onClick={() =>
                          onOpenChat(
                            selectedReport.id,
                            `${selectedReport.id} · ${selectedReport.title} (${selectedReport.fullName})`
                          )
                        }
                        className="rounded-full bg-black text-white px-3.5 py-1.5 text-xs font-medium hover:bg-neutral-800 transition cursor-pointer"
                      >
                        💬 Chat con Ciudadano
                      </button>
                    )}

                    {onUpdateReport && (
                      <button
                        type="button"
                        onClick={() => setEditingReport({ ...selectedReport })}
                        className="rounded-full border border-[#ebebeb] hover:border-black bg-white px-3 py-1.5 text-xs font-medium text-black flex items-center gap-1 transition cursor-pointer"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        <span>Editar</span>
                      </button>
                    )}

                    {onDeleteReport && (
                      <button
                        type="button"
                        onClick={() => {
                          if (
                            window.confirm(
                              `¿Eliminar permanentemente el reporte [${selectedReport.id} - ${selectedReport.title}]?`
                            )
                          ) {
                            onDeleteReport(selectedReport.id);
                          }
                        }}
                        className="rounded-full border border-red-200 hover:border-red-600 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 flex items-center gap-1 transition cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Eliminar</span>
                      </button>
                    )}

                    {selectedReport.photoUrl && (
                      <div className="h-16 w-20 rounded-lg overflow-hidden border border-slate-200 shrink-0">
                        <img src={selectedReport.photoUrl} alt="" className="h-full w-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Datos del Ciudadano */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 rounded-xl bg-slate-50 p-3 text-xs border border-slate-200">
                  <div>
                    <span className="text-[10px] text-slate-400 font-mono uppercase block">Ciudadano</span>
                    <span className="font-bold text-slate-900">{selectedReport.fullName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-mono uppercase block">Teléfono / Celular</span>
                    <span className="font-bold text-slate-900 font-mono flex items-center gap-1">
                      <Phone className="h-3 w-3 text-blue-600" />
                      {selectedReport.phone}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-mono uppercase block">Correo Electrónico</span>
                    <span className="font-medium text-slate-700 truncate block">
                      {selectedReport.email || 'No registrado'}
                    </span>
                  </div>
                </div>

                {/* Detalle del Extravío o Hallazgo */}
                <div className="space-y-2 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-200">
                      <span className="text-[10px] text-slate-400 font-mono uppercase block">Lugar Declarado</span>
                      <span className="font-medium text-slate-800 flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                        {selectedReport.estimatedLostPlace}
                      </span>
                    </div>

                    <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-200">
                      <span className="text-[10px] text-slate-400 font-mono uppercase block">Fecha Estimada</span>
                      <span className="font-medium text-slate-800 flex items-center gap-1 mt-0.5">
                        <Calendar className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                        {selectedReport.estimatedLostDate}
                      </span>
                    </div>
                  </div>

                  <div className="rounded-lg bg-slate-50 p-3 border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-mono uppercase block mb-1">
                      Señas Particulares / Descripción del Ciudadano
                    </span>
                    <p className="text-slate-800 leading-relaxed font-medium">
                      {selectedReport.distinctMarks || 'No se registraron señas adicionales.'}
                    </p>
                  </div>
                </div>

                {/* Si es un hallazgo reportado por ciudadano: Opción de convertir a custodia oficial */}
                {selectedReport.reportType === 'FOUND' && selectedReport.status !== 'PROCESADO_A_CUSTODIA' && (
                  <div className="rounded-xl border border-purple-200 bg-purple-50 p-3.5 text-xs flex items-center justify-between">
                    <div>
                      <p className="font-bold text-purple-950">
                        Objeto encontrado por un ciudadano en el campus
                      </p>
                      <p className="text-[11px] text-purple-700">
                        Puede formalizar su recepción asignándole un casillero físico y precinto de custodia.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onConvertFoundToCustody(selectedReport)}
                      className="rounded-lg bg-purple-600 px-3.5 py-1.5 font-bold text-white shadow-xs hover:bg-purple-700 transition"
                    >
                      Convertir en Custodia (RF-03)
                    </button>
                  </div>
                )}
              </div>

              {/* Panel de Cotejo Inteligente con Bienes en Custodia */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    <h4 className="font-heading text-xs font-bold uppercase tracking-wider text-slate-800">
                      Cotejo Automático con Inventario en Custodia ({possibleMatches.length} Coincidencias)
                    </h4>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Comparación por categoría, marca y color
                  </span>
                </div>

                {possibleMatches.length > 0 ? (
                  <div className="space-y-2.5">
                    {possibleMatches.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-xl border border-slate-200 p-3 bg-slate-50/70 hover:bg-white hover:border-blue-400 transition flex flex-wrap items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-lg overflow-hidden bg-slate-200 border border-slate-300 shrink-0">
                            {item.evidencePhotos[0]?.url ? (
                              <img src={item.evidencePhotos[0].url} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <Package className="h-6 w-6 text-slate-400 m-auto mt-3" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-blue-700">{item.trackingCode}</span>
                              <span className="font-bold text-slate-900">{item.title}</span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              Casillero: <strong className="text-slate-700">{item.location.lockerNumber}</strong> ({item.location.zone}) · Hallado en: {item.finder.surrenderLocation}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onSelectCustodyItem(item)}
                            className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-slate-700 font-semibold hover:bg-slate-100"
                          >
                            Ver Expediente
                          </button>

                          <button
                            type="button"
                            onClick={() => handleNotifyMatch(selectedReport.id, item)}
                            className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1 font-bold text-white hover:bg-emerald-700 transition"
                          >
                            <Check className="h-3.5 w-3.5" />
                            <span>Vincular y Notificar</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400">
                    No se detectaron coincidencias automáticas en el inventario actual. El reporte continuará en estado pendiente para futuros hallazgos.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-400">
              Seleccione un reporte ciudadano para visualizar sus detalles y cotejarlo.
            </div>
          )}
        </div>
      </div>

      {/* Modal CRUD UPDATE: Editar Reporte Ciudadano */}
      {editingReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 overflow-y-auto">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (onUpdateReport) {
                sfx.playVerificationSuccess();
                onUpdateReport(editingReport);
                setEditingReport(null);
              }
            }}
            className="w-full max-w-lg rounded-[2px] bg-white border border-black p-6 space-y-4 my-8"
          >
            <div className="flex items-center justify-between border-b border-[#ebebeb] pb-3">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#b5b5b5]">
                  OPERACIÓN CRUD · UPDATE ({editingReport.id})
                </span>
                <h3 className="text-[18px] font-medium text-black">
                  Editar Declaración Ciudadana
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingReport(null)}
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
                  value={editingReport.title}
                  onChange={(e) =>
                    setEditingReport({ ...editingReport, title: e.target.value })
                  }
                  className="w-full rounded-[16px] border border-[#ebebeb] bg-[#f7f7f7] px-3.5 py-2 text-black focus:bg-white focus:border-black focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-black mb-1">Marca</label>
                <input
                  type="text"
                  value={editingReport.brand}
                  onChange={(e) =>
                    setEditingReport({ ...editingReport, brand: e.target.value })
                  }
                  className="w-full rounded-[16px] border border-[#ebebeb] bg-[#f7f7f7] px-3.5 py-2 text-black focus:bg-white focus:border-black focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-black mb-1">Color</label>
                <input
                  type="text"
                  value={editingReport.color}
                  onChange={(e) =>
                    setEditingReport({ ...editingReport, color: e.target.value })
                  }
                  className="w-full rounded-[16px] border border-[#ebebeb] bg-[#f7f7f7] px-3.5 py-2 text-black focus:bg-white focus:border-black focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-black mb-1">Lugar Estimado</label>
                <input
                  type="text"
                  value={editingReport.estimatedLostPlace}
                  onChange={(e) =>
                    setEditingReport({
                      ...editingReport,
                      estimatedLostPlace: e.target.value,
                    })
                  }
                  className="w-full rounded-[16px] border border-[#ebebeb] bg-[#f7f7f7] px-3.5 py-2 text-black focus:bg-white focus:border-black focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-black mb-1">Estado del Reporte</label>
                <select
                  value={editingReport.status}
                  onChange={(e) =>
                    setEditingReport({
                      ...editingReport,
                      status: e.target.value as CitizenLostReport['status'],
                    })
                  }
                  className="w-full rounded-[16px] border border-[#ebebeb] bg-[#f7f7f7] px-3.5 py-2 text-black focus:bg-white focus:border-black focus:outline-none"
                >
                  <option value="PENDIENTE_REVISION">PENDIENTE_REVISION</option>
                  <option value="COINCIDENCIA_DETECTADA">COINCIDENCIA_DETECTADA</option>
                  <option value="PROCESADO_A_CUSTODIA">PROCESADO_A_CUSTODIA</option>
                  <option value="DESCARTADO">DESCARTADO</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block font-medium text-black mb-1">Señas Particulares</label>
                <textarea
                  rows={2}
                  value={editingReport.distinctMarks}
                  onChange={(e) =>
                    setEditingReport({
                      ...editingReport,
                      distinctMarks: e.target.value,
                    })
                  }
                  className="w-full rounded-[16px] border border-[#ebebeb] bg-[#f7f7f7] p-3 text-black focus:bg-white focus:border-black focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#ebebeb]">
              <button
                type="button"
                onClick={() => setEditingReport(null)}
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

