import React from 'react';
import { ShieldAlert, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { ItemStatus } from '../types/custody';

interface StatusBadgeProps {
  status: ItemStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  showIcon = true,
}) => {
  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 tracking-wider font-semibold',
    md: 'text-[11px] px-2.5 py-1 tracking-wider font-semibold',
    lg: 'text-xs px-3 py-1.5 tracking-wider font-bold',
  };

  switch (status) {
    case 'EN_CUSTODIA':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border border-[#A7F3D0] bg-[#ECFDF5] text-[#065F46] shadow-xs ${sizeClasses[size]}`}
        >
          {showIcon && (
            <span className="h-1.5 w-1.5 rounded-full bg-[#059669] animate-pulse" />
          )}
          <span>EN CUSTODIA</span>
        </span>
      );

    case 'ENTREGADO':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border border-[#BFDBFE] bg-[#EFF6FF] text-[#1E40AF] shadow-xs ${sizeClasses[size]}`}
        >
          {showIcon && <CheckCircle2 className="h-3 w-3 text-[#1E40AF]" />}
          <span>ENTREGADO</span>
        </span>
      );

    case 'ADVERTENCIA':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border border-[#FDE68A] bg-[#FFFBEB] text-[#92400E] shadow-xs ${sizeClasses[size]}`}
        >
          {showIcon && <AlertTriangle className="h-3 w-3 text-[#D97706]" />}
          <span>ADVERTENCIA</span>
        </span>
      );

    case 'BLOQUEADO_POR_SEGURIDAD':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border border-[#FECACA] bg-[#FEF2F2] text-[#991B1B] font-bold shadow-xs ${sizeClasses[size]}`}
        >
          {showIcon && <ShieldAlert className="h-3.5 w-3.5 text-[#DC2626]" />}
          <span>BLOQUEADO POR SEGURIDAD</span>
        </span>
      );

    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 text-slate-700 ${sizeClasses[size]}`}
        >
          <Clock className="h-3 w-3 text-slate-500" />
          <span>PENDIENTE</span>
        </span>
      );
  }
};
