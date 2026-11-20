import React, { useState } from 'react';
import {
  Grid,
  Lock,
  Unlock,
  ShieldAlert,
  CheckCircle2,
  Package,
  Layers,
  Sparkles,
  MapPin,
} from 'lucide-react';
import { CustodyItem } from '../types/custody';
import { sfx } from '../utils/audio';

interface WarehouseMatrixProps {
  items: CustodyItem[];
  selectedItemId: string;
  onSelectItem: (item: CustodyItem) => void;
}

const TOTAL_LOCKERS = 30;

export const WarehouseMatrix: React.FC<WarehouseMatrixProps> = ({
  items,
  selectedItemId,
  onSelectItem,
}) => {
  const [selectedZone, setSelectedZone] = useState<string>('all');
  const [pulsingLocker, setPulsingLocker] = useState<string | null>(null);

  // Mapear qué bien está en qué locker
  const lockerMap = new Map<string, CustodyItem>();
  items
    .filter((i) => i.status !== 'ENTREGADO')
    .forEach((item) => {
      if (item.location?.lockerNumber) {
        lockerMap.set(item.location.lockerNumber, item);
      }
    });

  const handleLockerClick = (lockerCode: string) => {
    sfx.playSolenoidLatch();
    setPulsingLocker(lockerCode);
    setTimeout(() => setPulsingLocker(null), 1200);

    const found = lockerMap.get(lockerCode);
    if (found) {
      onSelectItem(found);
    }
  };

  // Generar lista de casilleros L-01 a L-24
  const allLockers = Array.from({ length: TOTAL_LOCKERS }, (_, idx) => {
    const num = idx + 1;
    const code = `L-${num < 10 ? '0' + num : num}`;
    let zone = 'Zona A';
    if (num > 6 && num <= 12) zone = 'Zona B';
    else if (num > 12 && num <= 18) zone = 'Zona C';
    else if (num > 18) zone = 'Zona D';
    return { code, zone };
  });

  const filteredLockers = allLockers.filter(
    (l) => selectedZone === 'all' || l.zone.includes(selectedZone)
  );

  return (
    <div className="space-y-6">
      {/* Cabecera y Selector de Zona */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white p-5 border border-slate-200 shadow-xs">
        <div>
          <h2 className="font-heading text-lg font-bold text-slate-900 flex items-center gap-2">
            <Grid className="h-5 w-5 text-blue-600" />
            Matriz Física de Casilleros y Depósito de Seguridad
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitoreo en tiempo real del estado de ocupación, solenoides electrónicos y cierres cautelares.
          </p>
        </div>

        {/* Filtros de Zona */}
        <div className="flex items-center gap-1.5 rounded-xl bg-slate-100 p-1 text-xs font-semibold text-slate-600">
          <button
            type="button"
            onClick={() => setSelectedZone('all')}
            className={`rounded-lg px-3 py-1.5 transition ${
              selectedZone === 'all'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'hover:text-slate-900'
            }`}
          >
            Todas ({TOTAL_LOCKERS})
          </button>
          <button
            type="button"
            onClick={() => setSelectedZone('Zona A')}
            className={`rounded-lg px-3 py-1.5 transition ${
              selectedZone === 'Zona A'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'hover:text-slate-900'
            }`}
          >
            Zona A (Alta Seguridad)
          </button>
          <button
            type="button"
            onClick={() => setSelectedZone('Zona B')}
            className={`rounded-lg px-3 py-1.5 transition ${
              selectedZone === 'Zona B'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'hover:text-slate-900'
            }`}
          >
            Zona B (Valores)
          </button>
          <button
            type="button"
            onClick={() => setSelectedZone('Zona C')}
            className={`rounded-lg px-3 py-1.5 transition ${
              selectedZone === 'Zona C'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'hover:text-slate-900'
            }`}
          >
            Zona C (Equipajes)
          </button>
        </div>
      </div>

      {/* Cuadrícula de Casilleros */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
        {filteredLockers.map(({ code, zone }) => {
          const item = lockerMap.get(code);
          const isOccupied = Boolean(item);
          const isSelected = item && item.id === selectedItemId;
          const isLocked = item && item.status === 'BLOQUEADO_POR_SEGURIDAD';
          const isWarning = item && item.status === 'ADVERTENCIA';
          const isPulsing = pulsingLocker === code;

          return (
            <div
              key={code}
              onClick={() => handleLockerClick(code)}
              className={`group relative flex flex-col justify-between rounded-xl border p-3.5 cursor-pointer transition-all duration-200 min-h-[140px] ${
                isPulsing ? 'scale-95 ring-2 ring-blue-500' : ''
              } ${
                isSelected
                  ? 'border-blue-600 bg-blue-50/50 shadow-md ring-2 ring-blue-600'
                  : isLocked
                  ? 'border-red-300 bg-red-50/60 hover:border-red-400 hover:shadow-sm'
                  : isWarning
                  ? 'border-amber-300 bg-amber-50/60 hover:border-amber-400 hover:shadow-sm'
                  : isOccupied
                  ? 'border-slate-300 bg-white hover:border-blue-400 hover:shadow-sm'
                  : 'border-dashed border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-slate-100/50'
              }`}
            >
              {/* Encabezado del casillero */}
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm font-black tracking-tight text-slate-800">
                  {code}
                </span>

                {isLocked ? (
                  <span className="rounded bg-red-600 p-1 text-white shadow-xs animate-pulse">
                    <ShieldAlert className="h-3.5 w-3.5" />
                  </span>
                ) : isOccupied ? (
                  <span className="rounded bg-slate-900 p-1 text-white shadow-xs">
                    <Lock className="h-3 w-3" />
                  </span>
                ) : (
                  <span className="rounded bg-slate-200 p-1 text-slate-400">
                    <Unlock className="h-3 w-3" />
                  </span>
                )}
              </div>

              {/* Contenido / Estado del casillero */}
              <div className="my-2">
                {isOccupied && item ? (
                  <div>
                    <span className="font-mono text-[10px] font-bold text-blue-700 block truncate">
                      {item.trackingCode}
                    </span>
                    <h4 className="line-clamp-2 text-xs font-bold text-slate-900 mt-0.5 leading-snug">
                      {item.title}
                    </h4>
                  </div>
                ) : (
                  <div className="text-center py-2 text-[11px] font-mono text-slate-400">
                    Disponible
                  </div>
                )}
              </div>

              {/* Pie con zona y precinto */}
              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] font-mono text-slate-500">
                <span>{zone}</span>
                {isOccupied && item && (
                  <span className="text-[9px] font-bold text-slate-700 truncate max-w-[60px]">
                    {item.location.binNumber}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
