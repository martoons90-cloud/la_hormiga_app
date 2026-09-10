import React from 'react';
import { VehicleStatus } from '../types';
import { 
  CheckCircle2, 
  Clock, 
  Wrench, 
  AlertTriangle, 
  BookmarkCheck, 
  Ban 
} from 'lucide-react';

interface StatusBadgeProps {
  status: VehicleStatus;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export const STATUS_CONFIG: Record<
  VehicleStatus, 
  { label: string; bg: string; text: string; border: string; icon: React.FC<{ className?: string }> }
> = {
  DISPONIBLE: {
    label: 'DISPONIBLE',
    bg: 'bg-emerald-950/40 text-emerald-400',
    border: 'border-emerald-500/30',
    text: 'text-emerald-400',
    icon: CheckCircle2,
  },
  ALQUILADO: {
    label: 'ALQUILADO',
    bg: 'bg-amber-950/40 text-amber-400',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
    icon: Clock,
  },
  EN_MANTENIMIENTO: {
    label: 'MANTENIMIENTO',
    bg: 'bg-red-950/40 text-red-400',
    border: 'border-red-500/30',
    text: 'text-red-400',
    icon: Wrench,
  },
  TALLER: {
    label: 'TALLER',
    bg: 'bg-rose-950/40 text-rose-400',
    border: 'border-rose-500/30',
    text: 'text-rose-400',
    icon: AlertTriangle,
  },
  RESERVADO: {
    label: 'RESERVADO',
    bg: 'bg-purple-950/40 text-purple-300',
    border: 'border-purple-500/30',
    text: 'text-purple-300',
    icon: BookmarkCheck,
  },
  FUERA_DE_SERVICIO: {
    label: 'FUERA DE SERVICIO',
    bg: 'bg-slate-800 text-slate-400',
    border: 'border-slate-700',
    text: 'text-slate-400',
    icon: Ban,
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  showIcon = true,
  className = '',
}) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.DISPONIBLE;
  const Icon = config.icon;

  const sizeClasses = {
    xs: 'px-1.5 py-0 text-[9px] gap-0.5 font-bold',
    sm: 'px-2 py-0.5 text-[10px] gap-1 font-bold',
    md: 'px-2.5 py-1 text-[11px] gap-1.5 font-bold tracking-wide',
    lg: 'px-3 py-1.5 text-xs gap-2 font-bold tracking-wide',
  };

  return (
    <span
      className={`inline-flex items-center rounded-md border ${config.bg} ${config.border} ${sizeClasses[size]} uppercase whitespace-nowrap ${className}`}
    >
      {showIcon && <Icon className={size === 'xs' ? 'w-2.5 h-2.5' : size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />}
      <span>{config.label}</span>
    </span>
  );
};
