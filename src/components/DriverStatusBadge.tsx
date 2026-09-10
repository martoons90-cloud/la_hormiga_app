import React from 'react';
import { EmployeeStatus } from '../types';

interface DriverStatusBadgeProps {
  status: EmployeeStatus | string;
  size?: 'xs' | 'sm' | 'md';
}

export const DRIVER_STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  ACTIVO: {
    label: 'Activo / Disponible',
    bg: 'bg-emerald-950/60',
    text: 'text-emerald-400',
    border: 'border-emerald-800/60',
    dot: 'bg-emerald-400',
  },
  EN_OBRA: {
    label: 'En Obra',
    bg: 'bg-amber-950/60',
    text: 'text-amber-400',
    border: 'border-amber-800/60',
    dot: 'bg-amber-400',
  },
  EN_VIAJE: {
    label: 'En Obra',
    bg: 'bg-amber-950/60',
    text: 'text-amber-400',
    border: 'border-amber-800/60',
    dot: 'bg-amber-400',
  },
  LICENCIA: {
    label: 'En Licencia',
    bg: 'bg-blue-950/60',
    text: 'text-blue-400',
    border: 'border-blue-800/60',
    dot: 'bg-blue-400',
  },
  INACTIVO: {
    label: 'Inactivo / Baja',
    bg: 'bg-slate-900/80',
    text: 'text-slate-400',
    border: 'border-slate-800',
    dot: 'bg-slate-500',
  },
};

export const DriverStatusBadge: React.FC<DriverStatusBadgeProps> = ({
  status,
  size = 'md',
}) => {
  const config = DRIVER_STATUS_CONFIG[status] || DRIVER_STATUS_CONFIG.ACTIVO;

  const sizeClasses =
    size === 'xs'
      ? 'px-1.5 py-0 text-[9px] gap-1'
      : size === 'sm'
      ? 'px-2 py-0.5 text-[10px]'
      : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-bold rounded-md border tracking-wide uppercase ${config.bg} ${config.text} ${config.border} ${sizeClasses}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <span>{config.label}</span>
    </span>
  );
};
