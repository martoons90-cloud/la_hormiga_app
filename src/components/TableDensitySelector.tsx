import React from 'react';
import { TableDensity } from '../types';
import { AlignJustify, ListFilter, Rows3, StretchHorizontal } from 'lucide-react';

interface TableDensitySelectorProps {
  density: TableDensity;
  onChangeDensity: (density: TableDensity) => void;
  className?: string;
  showLabels?: boolean;
}

export function TableDensitySelector({
  density,
  onChangeDensity,
  className = '',
  showLabels = false
}: TableDensitySelectorProps) {
  const options: { id: TableDensity; label: string; shortLabel: string; title: string }[] = [
    {
      id: 'normal',
      label: 'Estándar',
      shortLabel: 'Normal',
      title: 'Nivel 1: Espaciado normal (estándar cómodo)'
    },
    {
      id: 'compact',
      label: 'Comprimido',
      shortLabel: 'Medio',
      title: 'Nivel 2: Comprimido (márgenes y celdas reducidas)'
    },
    {
      id: 'ultra',
      label: 'Ultra Comprimido',
      shortLabel: 'Ultra',
      title: 'Nivel 3: Ultra comprimido (máxima densidad en pantalla)'
    }
  ];

  return (
    <div
      className={`inline-flex items-center bg-[#0F1115] p-1 rounded-lg border border-slate-800 shadow-inner ${className}`}
      role="group"
      aria-label="Densidad y ancho de columnas de la tabla"
    >
      <div className="flex items-center gap-1">
        {options.map((opt) => {
          const isActive = density === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChangeDensity(opt.id)}
              title={opt.title}
              className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-semibold transition cursor-pointer ${
                isActive
                  ? 'bg-amber-500 text-black font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/70'
              }`}
            >
              {/* Visual custom density bars */}
              {opt.id === 'normal' && (
                <div className="flex flex-col justify-between h-3.5 w-3.5 py-0.5" aria-hidden="true">
                  <span className={`h-0.5 w-full rounded-full ${isActive ? 'bg-black' : 'bg-current'}`} />
                  <span className={`h-0.5 w-full rounded-full ${isActive ? 'bg-black' : 'bg-current'}`} />
                  <span className={`h-0.5 w-full rounded-full ${isActive ? 'bg-black' : 'bg-current'}`} />
                </div>
              )}

              {opt.id === 'compact' && (
                <div className="flex flex-col justify-between h-3.5 w-3.5 py-0.5 gap-[1.5px]" aria-hidden="true">
                  <span className={`h-0.5 w-full rounded-full ${isActive ? 'bg-black' : 'bg-current'}`} />
                  <span className={`h-0.5 w-full rounded-full ${isActive ? 'bg-black' : 'bg-current'}`} />
                  <span className={`h-0.5 w-full rounded-full ${isActive ? 'bg-black' : 'bg-current'}`} />
                  <span className={`h-0.5 w-full rounded-full ${isActive ? 'bg-black' : 'bg-current'}`} />
                </div>
              )}

              {opt.id === 'ultra' && (
                <div className="flex flex-col justify-between h-3.5 w-3.5 py-0.5 gap-[1px]" aria-hidden="true">
                  <span className={`h-0.5 w-full rounded-full ${isActive ? 'bg-black' : 'bg-current'}`} />
                  <span className={`h-0.5 w-full rounded-full ${isActive ? 'bg-black' : 'bg-current'}`} />
                  <span className={`h-0.5 w-full rounded-full ${isActive ? 'bg-black' : 'bg-current'}`} />
                  <span className={`h-0.5 w-full rounded-full ${isActive ? 'bg-black' : 'bg-current'}`} />
                  <span className={`h-0.5 w-full rounded-full ${isActive ? 'bg-black' : 'bg-current'}`} />
                </div>
              )}

              {showLabels ? (
                <span className="hidden sm:inline">{opt.label}</span>
              ) : (
                <span className="hidden md:inline text-[11px]">{opt.shortLabel}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
