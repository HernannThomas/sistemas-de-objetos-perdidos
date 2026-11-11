import React from 'react';
import {
  Clock,
  UserCheck,
  MapPin,
  Camera,
  ShieldAlert,
  Laptop,
  Wallet,
  Gem,
  Key,
  Luggage,
  FileText,
  Package,
} from 'lucide-react';
import { motion } from 'motion/react';
import { CustodyItem, ItemCategory } from '../types/custody';
import { StatusBadge } from './StatusBadge';

interface ItemCardProps {
  item: CustodyItem;
  isSelected: boolean;
  onSelect: () => void;
}

const getCategoryIcon = (category: ItemCategory) => {
  switch (category) {
    case 'electronics':
      return <Laptop className="h-3.5 w-3.5 text-slate-500" />;
    case 'wallets_ids':
      return <Wallet className="h-3.5 w-3.5 text-slate-500" />;
    case 'jewelry':
      return <Gem className="h-3.5 w-3.5 text-slate-500" />;
    case 'keys':
      return <Key className="h-3.5 w-3.5 text-slate-500" />;
    case 'luggage':
      return <Luggage className="h-3.5 w-3.5 text-slate-500" />;
    case 'documents':
      return <FileText className="h-3.5 w-3.5 text-slate-500" />;
    default:
      return <Package className="h-3.5 w-3.5 text-slate-500" />;
  }
};

export const ItemCard: React.FC<ItemCardProps> = ({
  item,
  isSelected,
  onSelect,
}) => {
  const isSecurityHold = item.status === 'BLOQUEADO_POR_SEGURIDAD';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
      whileTap={{ scale: 0.985 }}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onSelect();
        }
      }}
      className={`group relative flex flex-col cursor-pointer overflow-hidden rounded-lg bg-white text-left outline-none transition-shadow ${
        isSecurityHold
          ? 'border-2 border-[#DC2626] shadow-sm'
          : isSelected
          ? 'border-2 border-[#2563EB] shadow-md ring-2 ring-[#2563EB]/20'
          : 'border border-[#E2E8F0] shadow-xs hover:border-[#CBD5E1] hover:shadow-md'
      }`}
    >
      {/* Barra roja de alta visibilidad para Retención Policial / Bloqueo */}
      {isSecurityHold && (
        <div className="flex items-center justify-between bg-[#DC2626] px-3 py-1 text-[10px] font-bold tracking-wider text-white">
          <div className="flex items-center gap-1.5 uppercase">
            <ShieldAlert className="h-3 w-3 animate-pulse" />
            <span>RETENCIÓN JUDICIAL · ENTREGA RESTRINGIDA</span>
          </div>
          <span className="font-mono text-[9px] tracking-tight text-red-100">BLOQUEADO</span>
        </div>
      )}

      <div className="p-3.5 flex flex-col flex-1 justify-between gap-3">
        {/* Cabecera: Código de seguimiento, tiempo transcurrido y estado */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="code-tracking text-xs text-[#0F172A] bg-slate-100 px-1.5 py-0.5 rounded font-mono border border-slate-200">
                {item.trackingCode}
              </span>
              <div className="flex items-center gap-1 text-[11px] text-slate-500">
                <Clock className="h-3 w-3" />
                <span>{item.relativeTime}</span>
              </div>
            </div>
            <h3 className="mt-1 font-heading text-sm font-semibold text-[#0b1c30] group-hover:text-[#2563EB] line-clamp-1 transition-colors">
              {item.title}
            </h3>
          </div>

          <div className="shrink-0">
            <StatusBadge status={item.status} size="sm" />
          </div>
        </div>

        {/* Cuerpo: Categoría, marca, marcas distintivas y miniatura */}
        <div className="flex gap-3 items-start">
          {/* Miniatura de evidencia con micro-zoom */}
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-[0.375rem] border border-slate-200 bg-slate-50">
            {item.evidencePhotos.length > 0 ? (
              <img
                src={item.evidencePhotos[0].url}
                alt={item.title}
                className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                loading="lazy"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-slate-300">
                <Camera className="h-5 w-5" />
              </div>
            )}
            {item.evidencePhotos.length > 1 && (
              <span className="absolute bottom-0.5 right-0.5 rounded bg-black/75 px-1 text-[9px] font-mono text-white backdrop-blur-xs">
                +{item.evidencePhotos.length - 1}
              </span>
            )}
          </div>

          {/* Categoría y detalles */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="flex items-center gap-1 font-medium capitalize">
                {getCategoryIcon(item.category)}
                {item.brand}
              </span>
              <span>·</span>
              <span className="text-slate-600">{item.color}</span>
            </div>

            <p className="mt-1 text-xs text-slate-600 line-clamp-2 leading-relaxed">
              {item.distinctMarks}
            </p>

            {item.serialNumber && (
              <p className="mt-1 text-[11px] text-slate-500 font-mono truncate">
                N/S: <span className="text-slate-700 font-semibold">{item.serialNumber}</span>
              </p>
            )}
          </div>
        </div>

        {/* Pie: Oficial de custodia y ubicación física */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5 truncate">
            <UserCheck className="h-3 w-3 text-slate-400 shrink-0" />
            <span className="truncate">{item.intakeOfficer.name}</span>
          </div>

          <div className="flex items-center gap-1.5 font-mono text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-200/80 shrink-0">
            <MapPin className="h-3 w-3 text-sky-600" />
            <span>
              {item.location.lockerNumber} · {item.location.binNumber}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
