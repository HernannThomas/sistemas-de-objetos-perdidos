import React, { useState } from 'react';
import {
  Boxes,
  Lock,
  Unlock,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CustodyItem } from '../types/custody';
import { sfx } from '../utils/audio';

interface WarehouseMatrixProps {
  items: CustodyItem[];
  onSelectItem: (item: CustodyItem) => void;
  onToggleLock: (itemId: string) => void;
}

interface LockerSlot {
  id: string;
  zone: string;
  lockerNumber: string;
  assignedItem?: CustodyItem;
  isLocked: boolean;
  isRestricted: boolean;
}

export const WarehouseMatrix: React.FC<WarehouseMatrixProps> = ({
  items,
  onSelectItem,
  onToggleLock,
}) => {
  const [selectedZone, setSelectedZone] = useState<string>('all');
  const [justToggledLocker, setJustToggledLocker] = useState<string | null>(null);

  const zones = [
    { id: 'Bóveda Alfa', name: 'Bóveda Alfa (Retención Judicial)', count: 6 },
    { id: 'Zona B', name: 'Zona B (Alto Valor y Llaves)', count: 12 },
    { id: 'Zona C', name: 'Zona C (Armarios Estándar)', count: 12 },
    { id: 'Zona D', name: 'Zona D (Equipajes y Bultos)', count: 6 },
  ];

  const assignedLockerMap = new Map<string, CustodyItem>();
  items.forEach((item) => {
    assignedLockerMap.set(item.location.lockerNumber, item);
  });

  const lockerSlots: LockerSlot[] = [];
  zones.forEach((z) => {
    for (let i = 1; i <= z.count; i++) {
      const code =
        z.id === 'Bóveda Alfa'
          ? `SEC-0${i}`
          : z.id === 'Zona D'
          ? `BAY-${i < 10 ? '0' + i : i}`
          : `L-${i < 10 ? '0' + i : i}`;

      const item = assignedLockerMap.get(code);
      lockerSlots.push({
        id: `${z.id}-${code}`,
        zone: z.id,
        lockerNumber: code,
        assignedItem: item,
        isLocked: item ? item.location.isLocked : true,
        isRestricted: item?.status === 'BLOQUEADO_POR_SEGURIDAD',
      });
    }
  });

  const filteredSlots =
    selectedZone === 'all'
      ? lockerSlots
      : lockerSlots.filter((slot) => slot.zone.includes(selectedZone));

  const handleLockerClick = (slot: LockerSlot) => {
    if (slot.assignedItem) {
      setJustToggledLocker(slot.lockerNumber);
      onToggleLock(slot.assignedItem.id);
      setTimeout(() => setJustToggledLocker(null), 1000);
    } else {
      sfx.playSolenoidLatch();
      setJustToggledLocker(slot.lockerNumber);
      setTimeout(() => setJustToggledLocker(null), 1000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col gap-6"
    >
      {/* Resumen Superior */}
      <div className="rounded-lg border border-[#E2E8F0] bg-white p-5 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Boxes className="h-5 w-5 text-[#1E3A8A]" />
              <h2 className="font-heading text-lg font-bold text-[#0F172A]">
                Matriz de Red de Casilleros y Bóvedas de Seguridad
              </h2>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Estado en tiempo real de actuadores solenoides de 12V, ocupación física y desbloqueo telemático.
            </p>
          </div>

          {/* Filtros de zona */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setSelectedZone('all')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                selectedZone === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todas las Zonas
            </button>
            <button
              type="button"
              onClick={() => setSelectedZone('Bóveda Alfa')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                selectedZone === 'Bóveda Alfa'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Bóveda Alfa
            </button>
            <button
              type="button"
              onClick={() => setSelectedZone('Zona B')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                selectedZone === 'Zona B'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Zona B (Alto Valor)
            </button>
            <button
              type="button"
              onClick={() => setSelectedZone('Zona C')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                selectedZone === 'Zona C'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Zona C (Estándar)
            </button>
            <button
              type="button"
              onClick={() => setSelectedZone('Zona D')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                selectedZone === 'Zona D'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Zona D (Equipajes)
            </button>
          </div>
        </div>

        {/* Leyenda */}
        <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-slate-100 pt-3 text-[11px] text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-emerald-100 border border-emerald-400" />
            <span>Ocupado (Custodia Ordinaria)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-red-100 border border-red-500" />
            <span>Retención Judicial / Policial</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-slate-50 border border-slate-300" />
            <span>Disponible / Vacante</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Unlock className="h-3 w-3 text-emerald-600" />
            <span>Solenoide Desbloqueado</span>
          </div>
        </div>
      </div>

      {/* Cuadrícula de Casilleros con motion stagger */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {filteredSlots.map((slot, index) => {
          const isOccupied = !!slot.assignedItem;
          const isToggledNow = justToggledLocker === slot.lockerNumber;

          return (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.18, delay: index * 0.01 }}
              whileHover={{ y: -3, transition: { duration: 0.15 } }}
              key={slot.id}
              className={`relative flex flex-col justify-between rounded-lg p-3 transition-shadow ${
                slot.isRestricted
                  ? 'border-2 border-red-500 bg-red-50/50 shadow-xs'
                  : isOccupied
                  ? 'border border-slate-300 bg-white shadow-xs hover:border-[#2563EB] hover:shadow-md'
                  : 'border border-dashed border-slate-300 bg-slate-50/60 opacity-80 hover:opacity-100'
              } ${isToggledNow ? 'ring-2 ring-emerald-500 scale-102 shadow-emerald-500/20 shadow-lg' : ''}`}
            >
              {/* Cabecera de Casilla */}
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-slate-800">
                  {slot.lockerNumber}
                </span>
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  type="button"
                  onClick={() => handleLockerClick(slot)}
                  title={slot.isLocked ? 'Liberar solenoide' : 'Volver a bloquear'}
                  className={`p-1.5 rounded-md transition ${
                    slot.isLocked
                      ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                      : 'text-emerald-700 bg-emerald-100 border border-emerald-300 shadow-xs'
                  }`}
                >
                  {slot.isLocked ? (
                    <Lock className="h-3.5 w-3.5" />
                  ) : (
                    <Unlock className="h-3.5 w-3.5 animate-bounce" />
                  )}
                </motion.button>
              </div>

              {/* Información del Bien */}
              <div className="my-2 min-h-16 flex flex-col justify-center">
                {slot.assignedItem ? (
                  <div>
                    <span className="code-tracking text-[10px] bg-slate-100 text-slate-800 px-1 py-0.5 rounded border border-slate-200 block truncate">
                      {slot.assignedItem.trackingCode}
                    </span>
                    <p className="mt-1 text-[11px] font-medium text-slate-800 line-clamp-1">
                      {slot.assignedItem.title}
                    </p>
                    <span className="text-[10px] text-slate-500 truncate block">
                      {slot.assignedItem.location.binNumber}
                    </span>
                  </div>
                ) : (
                  <div className="text-center text-[11px] text-slate-400 font-medium">
                    Casilla Libre
                  </div>
                )}
              </div>

              {/* Pie con Enlace a Inspección */}
              <div className="border-t border-slate-100 pt-1.5 flex items-center justify-between text-[10px]">
                <span className="text-slate-400 truncate font-mono text-[9px]">
                  {slot.zone}
                </span>
                {slot.assignedItem && (
                  <button
                    type="button"
                    onClick={() => onSelectItem(slot.assignedItem!)}
                    className="font-semibold text-[#2563EB] hover:underline"
                  >
                    Examinar
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};
