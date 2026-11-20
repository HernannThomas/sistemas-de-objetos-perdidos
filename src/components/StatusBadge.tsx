import React from 'react';
import { ItemStatus } from '../types/custody';

interface StatusBadgeProps {
  status: ItemStatus;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const sizeClasses = {
    sm: 'px-2.5 py-0.5 text-[10px] tracking-[0.14em]',
    md: 'px-3 py-1 text-[11px] tracking-[0.16em]',
    lg: 'px-4 py-1.5 text-[12px] tracking-[0.18em]',
  }[size];

  switch (status) {
    case 'EN_CUSTODIA':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium uppercase rounded-full bg-black text-white ${sizeClasses}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-white" />
          <span>EN CUSTODIA</span>
        </span>
      );

    case 'ENTREGADO':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-normal uppercase rounded-full bg-[#f7f7f7] text-[#b5b5b5] border border-[#ebebeb] ${sizeClasses}`}
        >
          <span>ENTREGADO</span>
        </span>
      );

    case 'ADVERTENCIA':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium uppercase rounded-full bg-white text-black border border-black ${sizeClasses}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-black" />
          <span>EN OBSERVACIÓN</span>
        </span>
      );

    case 'BLOQUEADO_POR_SEGURIDAD':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-semibold uppercase rounded-full bg-black text-white border border-black ${sizeClasses}`}
        >
          <span>🔒 RESTRINGIDO CLIENTE</span>
        </span>
      );

    default:
      return null;
  }
};
