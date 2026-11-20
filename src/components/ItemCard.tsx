import React from 'react';
import {
  Package,
} from 'lucide-react';
import { CustodyItem } from '../types/custody';
import { StatusBadge } from './StatusBadge';

interface ItemCardProps {
  item: CustodyItem;
  isSelected: boolean;
  onSelect: () => void;
}

export const ItemCard: React.FC<ItemCardProps> = ({ item, isSelected, onSelect }) => {
  const hasFailedAttempts = item.failedAttempts && item.failedAttempts.length > 0;
  const mainPhoto = item.evidencePhotos?.[0]?.url;

  return (
    <div
      onClick={onSelect}
      className={`group relative flex cursor-pointer gap-3.5 rounded-[2px] border p-3.5 transition-all ${
        isSelected
          ? 'border-black bg-white ring-1 ring-black'
          : 'border-[#ebebeb] bg-white hover:border-[#cecccc]'
      }`}
    >
      {/* Miniatura 2px radius, sin sombra */}
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[2px] bg-[#f7f7f7] border border-[#ebebeb]">
        {mainPhoto ? (
          <img
            src={mainPhoto}
            alt={item.title}
            className="h-full w-full object-cover transition group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[#b5b5b5]">
            <Package className="h-6 w-6" />
          </div>
        )}

        <div className="absolute bottom-1 right-1 rounded-full bg-black px-1.5 py-0.5 font-mono text-[9px] font-medium text-white">
          {item.location?.lockerNumber || 'S/L'}
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="flex min-w-0 flex-1 flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-1.5 mb-0.5">
            <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-black">
              {item.brand}
            </span>
            <span className="font-mono text-[10px] text-[#b5b5b5]">
              {item.trackingCode}
            </span>
          </div>

          <h3 className="line-clamp-1 text-[14px] font-medium text-black tracking-[-0.14px]">
            {item.title}
          </h3>

          <p className="mt-0.5 line-clamp-1 text-[12px] text-[#b5b5b5]">
            {item.color} {item.model ? `· ${item.model}` : ''}
          </p>
        </div>

        {/* Pie de Tarjeta */}
        <div className="mt-2 flex items-center justify-between gap-2 pt-1.5 border-t border-[#ebebeb]">
          <StatusBadge status={item.status} size="sm" />

          {hasFailedAttempts ? (
            <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-black">
              {item.failedAttempts.length} Fallo(s) Cliente
            </span>
          ) : (
            <span className="text-[10px] font-mono text-[#b5b5b5]">
              {item.relativeTime}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
