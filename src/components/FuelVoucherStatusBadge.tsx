import React from 'react';
import { FuelVoucherStatus } from '../types';
import { CheckCircle2, Clock, AlertCircle, FileCheck, XCircle } from 'lucide-react';

export const FUEL_STATUS_CONFIG: Record<
  FuelVoucherStatus,
  { label: string; bg: string; text: string; border: string; dot: string; icon: React.FC<{ className?: string }> }
> = {
  EMITIDO: {
    label: 'Emitido (Sin Cargar)',
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    dot: 'bg-amber-400',
    icon: Clock,
  },
  CARGADO: {
    label: 'Cargado en Estación',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
    dot: 'bg-emerald-400',
    icon: CheckCircle2,
  },
  RENDIDO: {
    label: 'Rendido / Facturado',
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    border: 'border-blue-500/30',
    dot: 'bg-blue-400',
    icon: FileCheck,
  },
  PENDIENTE: {
    label: 'Pendiente Autorización',
    bg: 'bg-purple-500/10',
    text: 'text-purple-400',
    border: 'border-purple-500/30',
    dot: 'bg-purple-400',
    icon: AlertCircle,
  },
  ANULADO: {
    label: 'Anulado',
    bg: 'bg-rose-500/10',
    text: 'text-rose-400',
    border: 'border-rose-500/30',
    dot: 'bg-rose-400',
    icon: XCircle,
  },
};

interface FuelVoucherStatusBadgeProps {
  status: FuelVoucherStatus;
  size?: 'xs' | 'sm' | 'md';
  showIcon?: boolean;
}

export const FuelVoucherStatusBadge: React.FC<FuelVoucherStatusBadgeProps> = ({
  status,
  size = 'md',
  showIcon = true,
}) => {
  const config = FUEL_STATUS_CONFIG[status] || FUEL_STATUS_CONFIG.EMITIDO;
  const Icon = config.icon;

  const sizeClasses = size === 'xs'
    ? 'px-1.5 py-0 text-[9.5px] gap-1'
    : size === 'sm' 
    ? 'px-2 py-0.5 text-[10px]' 
    : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold border ${config.bg} ${config.text} ${config.border} ${sizeClasses} whitespace-nowrap`}
    >
      {showIcon && <Icon className={size === 'xs' ? 'w-2.5 h-2.5' : size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />}
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot} ${status === 'EMITIDO' ? 'animate-pulse' : ''}`} />
      <span>{config.label}</span>
    </span>
  );
};
