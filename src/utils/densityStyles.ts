import { TableDensity } from '../types';

export const DENSITY_STORAGE_KEY = 'erp_table_density';

export function getSavedTableDensity(): TableDensity {
  try {
    const saved = localStorage.getItem(DENSITY_STORAGE_KEY);
    if (saved === 'normal' || saved === 'compact' || saved === 'ultra') {
      return saved;
    }
  } catch (e) {
    // Ignore localStorage errors
  }
  return 'normal';
}

export function saveTableDensity(density: TableDensity): void {
  try {
    localStorage.setItem(DENSITY_STORAGE_KEY, density);
  } catch (e) {
    // Ignore localStorage errors
  }
}

export interface DensityStyleConfig {
  thPadding: string;
  tdPadding: string;
  fontSize: string;
  headerFontSize: string;
  gap: string;
  badgePadding: string;
  badgeFontSize: string;
  btnPadding: string;
  iconSize: string;
  imgContainer: string;
  rowClass: string;
}

export const DENSITY_CONFIG: Record<TableDensity, DensityStyleConfig> = {
  normal: {
    thPadding: 'px-4 py-3',
    tdPadding: 'px-4 py-3',
    fontSize: 'text-xs',
    headerFontSize: 'text-[11px]',
    gap: 'gap-2',
    badgePadding: 'px-2.5 py-1',
    badgeFontSize: 'text-[11px]',
    btnPadding: 'p-1.5',
    iconSize: 'w-4 h-4',
    imgContainer: 'w-10 h-7',
    rowClass: 'hover:bg-slate-800/40'
  },
  compact: {
    thPadding: 'px-2.5 py-2',
    tdPadding: 'px-2.5 py-1.5',
    fontSize: 'text-[11.5px]',
    headerFontSize: 'text-[10.5px]',
    gap: 'gap-1.5',
    badgePadding: 'px-2 py-0.5',
    badgeFontSize: 'text-[10px]',
    btnPadding: 'p-1',
    iconSize: 'w-3.5 h-3.5',
    imgContainer: 'w-8 h-6',
    rowClass: 'hover:bg-slate-800/50'
  },
  ultra: {
    thPadding: 'px-1.5 py-1.5',
    tdPadding: 'px-1.5 py-1',
    fontSize: 'text-[11px]',
    headerFontSize: 'text-[10px]',
    gap: 'gap-1',
    badgePadding: 'px-1.5 py-0.5',
    badgeFontSize: 'text-[9.5px]',
    btnPadding: 'p-0.5',
    iconSize: 'w-3 h-3',
    imgContainer: 'w-7 h-5',
    rowClass: 'hover:bg-slate-800/60'
  }
};
