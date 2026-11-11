import React, { useState } from 'react';
import {
  Search,
  CheckCircle2,
  Clock,
  MapPin,
  Calendar,
  Send,
  HelpCircle,
  AlertCircle,
  FileText,
  User,
  LogOut,
  Camera,
  Laptop,
  Wallet,
  Gem,
  Key,
  Luggage,
  Package,
} from 'lucide-react';
import { CustodyItem, SessionUser, ItemCategory } from '../types/custody';
import { StatusBadge } from './StatusBadge';
import { sfx } from '../utils/audio';

interface CitizenPortalProps {
  currentUser: SessionUser;
  items: CustodyItem[];
  onLogout: () => void;
}

const getCategoryIcon = (category: ItemCategory) => {
  switch (category) {
    case 'electronics':
      return <Laptop className="h-4 w-4 text-slate-500" />;
    case 'wallets_ids':
      return <Wallet className="h-4 w-4 text-slate-500" />;
    case 'jewelry':
      return <Gem className="h-4 w-4 text-slate-500" />;
    case 'keys':
      return <Key className="h-4 w-4 text-slate-500" />;
    case 'luggage':
      return <Luggage className="h-4 w-4 text-slate-500" />;
    case 'documents':
      return <FileText className="h-4 w-4 text-slate-500" />;
    default:
      return <Package className="h-4 w-4 text-slate-500" />;
  }
};

export const CitizenPortal: React.FC<CitizenPortalProps> = ({
  currentUser,
  items,
  onLogout,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<CustodyItem | null>(null);
  const [claimSubmitted, setClaimSubmitted] = useState(false);

  // Form states for claiming
  const [claimantPhone, setClaimantPhone] = useState('+34 600 123 456');
  const [ownershipProof, setOwnershipProof] = useState('');
  const [preferredDate, setPreferredDate] = useState('2026-11-12');

  // Filter public items (hide those restricted by police holds from public claiming details, but show they exist or are in process)
  const publicItems = items.filter((item) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      item.trackingCode.toLowerCase().includes(q) ||
      item.title.toLowerCase().includes(q) ||
      item.brand.toLowerCase().includes(q) ||
      item.distinctMarks.toLowerCase().includes(q);

    return matchesSearch;
  });

  const handleClaimSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownershipProof.trim()) return;
    sfx.playVerificationSuccess();
    setClaimSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-900">
      {/* Barra Superior Ciudadana */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-[#0F172A] text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-[#1E3A8A] flex items-center justify-center text-sky-400 border border-sky-700">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-white font-heading">
                  CUSTODIA CORE
                </h1>
                <span className="rounded bg-indigo-900/80 px-2 py-0.5 text-[10px] font-mono text-indigo-300 border border-indigo-700">
                  PORTAL DEL CIUDADANO
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Consulta y Reclamación de Objetos Extraviados
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="hidden sm:flex flex-col text-right">
              <span className="font-semibold text-white">{currentUser.name}</span>
              <span className="text-[11px] text-slate-400 font-mono">{currentUser.badgeNumber}</span>
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero informativo para el ciudadano */}
      <div className="bg-white border-b border-slate-200 py-6 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-[#0F172A] font-heading">
              ¿Ha perdido algún objeto en las instalaciones?
            </h2>
            <p className="mt-1 text-xs text-slate-600 max-w-2xl">
              Consulte el registro oficial de bienes surrenderados y bajo custodia. Puede solicitar cita presencial acreditando su titularidad con número de serie, factura de compra o descripción detallada.
            </p>
          </div>

          {/* Buscador Rápido Ciudadano */}
          <div className="w-full md:w-96 relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por marca, modelo, código..."
              className="w-full rounded-md border border-slate-300 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-800 focus:bg-white focus:border-[#2563EB] focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Lista de Bienes Consultables (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs text-slate-600 px-1">
            <span className="font-semibold text-slate-800">
              Objetos Registrados en Custodia ({publicItems.length})
            </span>
            <span>Haga clic sobre un bien para iniciar la reclamación</span>
          </div>

          <div className="space-y-3">
            {publicItems.map((item) => {
              const isSelected = selectedItem?.id === item.id;
              const isPoliceHold = item.status === 'BLOQUEADO_POR_SEGURIDAD';

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    setSelectedItem(item);
                    setClaimSubmitted(false);
                  }}
                  className={`cursor-pointer rounded-lg border bg-white p-4 transition-all shadow-xs ${
                    isSelected
                      ? 'border-[#2563EB] ring-2 ring-[#2563EB]/20 shadow-md'
                      : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="code-tracking text-xs font-mono font-semibold bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                        {item.trackingCode}
                      </span>
                      <span className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {item.relativeTime}
                      </span>
                    </div>
                    <StatusBadge status={item.status} size="sm" />
                  </div>

                  <div className="mt-2.5 flex items-start gap-3">
                    <div className="h-16 w-16 shrink-0 rounded-md overflow-hidden border border-slate-200 bg-slate-100">
                      {item.evidencePhotos[0] ? (
                        <img
                          src={item.evidencePhotos[0].url}
                          alt={item.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-slate-300">
                          <Camera className="h-5 w-5" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-slate-900 line-clamp-1">
                        {item.title}
                      </h3>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          {getCategoryIcon(item.category)}
                          {item.brand}
                        </span>
                        <span>·</span>
                        <span>{item.color}</span>
                      </div>
                      <p className="mt-1 text-xs text-slate-600 line-clamp-2">
                        {item.distinctMarks}
                      </p>
                    </div>
                  </div>

                  {isPoliceHold && (
                    <div className="mt-3 rounded bg-red-50 border border-red-200 p-2 text-[11px] text-red-800 flex items-center gap-2">
                      <AlertCircle className="h-3.5 w-3.5 text-red-600 shrink-0" />
                      <span>Bien sujeto a diligencias policiales de comprobación. Contacte directamente con la comisaría de la estación.</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Panel Lateral: Solicitud de Reclamo / Diligencia (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {selectedItem ? (
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-xs sticky top-20">
              <div className="border-b border-slate-100 pb-3">
                <span className="text-[11px] font-mono text-slate-500 uppercase">
                  Expediente #{selectedItem.trackingCode}
                </span>
                <h3 className="text-base font-bold text-[#0F172A] font-heading mt-0.5">
                  {selectedItem.title}
                </h3>
                <div className="mt-2 flex items-center gap-2">
                  <StatusBadge status={selectedItem.status} size="sm" />
                  <span className="text-xs text-slate-500">
                    Depositado en: {selectedItem.location.zone}
                  </span>
                </div>
              </div>

              {claimSubmitted ? (
                <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-center">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-2">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <h4 className="font-heading text-sm font-bold text-emerald-900">
                    Solicitud Registrada con Éxito
                  </h4>
                  <p className="mt-1 text-xs text-emerald-800 leading-relaxed">
                    Hemos recibido su comprobante de titularidad. Preséntese en el <strong>Mostrador #04 (Terminal B)</strong> con su documento de identidad ({currentUser.badgeNumber}) para proceder a la verificación y entrega física.
                  </p>
                  <button
                    type="button"
                    onClick={() => setClaimSubmitted(false)}
                    className="mt-4 rounded bg-[#0F172A] px-4 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                  >
                    Modificar Solicitud
                  </button>
                </div>
              ) : (
                <form onSubmit={handleClaimSubmit} className="mt-4 space-y-3.5 text-xs">
                  <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-slate-700">
                    <span className="block font-semibold text-[11px] text-slate-800 mb-1">
                      Acreditación de Titularidad Obligatoria
                    </span>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Para retirar este bien deberá aportar un elemento de certeza que demuestre que le pertenece (factura, número de serie, desbloqueo en mostrador o descripción de objetos interiores).
                    </p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Prueba de Pertenencia / Datos Específicos *
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={ownershipProof}
                      onChange={(e) => setOwnershipProof(e.target.value)}
                      placeholder="ej. El portátil tiene un adhesivo de mi universidad en la esquina inferior y su número de serie termina en MD6R..."
                      className="w-full rounded border border-slate-300 bg-white p-2.5 text-xs text-slate-800 focus:border-[#2563EB] focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Teléfono de Contacto
                      </label>
                      <input
                        type="tel"
                        required
                        value={claimantPhone}
                        onChange={(e) => setClaimantPhone(e.target.value)}
                        className="w-full rounded border border-slate-300 bg-white p-2 text-xs text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Fecha Prevista de Recogida
                      </label>
                      <input
                        type="date"
                        required
                        value={preferredDate}
                        onChange={(e) => setPreferredDate(e.target.value)}
                        className="w-full rounded border border-slate-300 bg-white p-2 text-xs text-slate-800"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 rounded-md bg-[#0F172A] py-2.5 px-4 text-xs font-bold text-white shadow hover:bg-[#1E293B] transition"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>Enviar Solicitud de Cita y Cotejo</span>
                  </button>
                </form>
              )}
            </div>
          ) : (
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-xs text-center text-slate-500">
              <HelpCircle className="h-8 w-8 text-slate-400 mx-auto mb-2" />
              <h4 className="font-heading text-sm font-semibold text-slate-800">
                Seleccione un bien del listado
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Podrá consultar los datos de recepción y tramitar su solicitud de devolución ante el personal de seguridad.
              </p>
            </div>
          )}

          {/* Información Útil del Mostrador */}
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs text-xs text-slate-600 space-y-2">
            <span className="font-bold text-slate-900 block font-heading">
              Oficina de Atención al Ciudadano
            </span>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-sky-600 shrink-0" />
              <span>Planta Baja · Mostrador #04 junto al control de acceso de la Terminal B</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>Horario de entrega presencial: Lunes a Domingo de 08:00 a 20:00 h</span>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
};
