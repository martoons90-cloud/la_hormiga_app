import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';

export interface SearchableSelectOption {
  value: string;
  label: string;
  secondaryText?: string;
  extraSearchTerms?: string;
}

interface SearchableSelectProps {
  label?: string;
  icon?: React.ReactNode;
  placeholder?: string;
  searchPlaceholder?: string;
  options: SearchableSelectOption[];
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  emptyMessage?: string;
  id?: string;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  label,
  icon,
  placeholder = 'Seleccionar...',
  searchPlaceholder = 'Escriba para buscar...',
  options,
  value,
  onChange,
  required = false,
  disabled = false,
  className = '',
  emptyMessage = 'No se encontraron opciones',
  id,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input when opening
  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  const filteredOptions = options.filter((opt) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const matchesLabel = opt.label.toLowerCase().includes(term);
    const matchesSecondary = opt.secondaryText ? opt.secondaryText.toLowerCase().includes(term) : false;
    const matchesExtra = opt.extraSearchTerms ? opt.extraSearchTerms.toLowerCase().includes(term) : false;
    return matchesLabel || matchesSecondary || matchesExtra;
  });

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearchTerm('');
  };

  return (
    <div className={`relative ${className}`} ref={containerRef} id={id}>
      {label && (
        <label className="block text-xs font-semibold text-slate-400 mb-1.5 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            {icon}
            {label}
            {required && <span className="text-amber-500">*</span>}
          </span>
          {selectedOption && !disabled && (
            <span className="text-[10px] text-slate-500 font-mono">1 seleccionado</span>
          )}
        </label>
      )}

      {/* Main trigger button */}
      <div
        onClick={() => {
          if (!disabled) setIsOpen(!isOpen);
        }}
        className={`w-full bg-[#0F1115] border rounded-xl px-3 py-2.5 text-xs flex items-center justify-between gap-2 transition cursor-pointer select-none ${
          disabled
            ? 'opacity-60 cursor-not-allowed border-slate-800 bg-slate-900/40 text-slate-500'
            : isOpen
            ? 'border-amber-500 ring-2 ring-amber-500/20 text-white'
            : selectedOption
            ? 'border-slate-700 hover:border-slate-600 text-white'
            : 'border-slate-700 hover:border-slate-600 text-slate-400'
        }`}
      >
        <div className="flex items-center gap-2 truncate flex-1">
          {selectedOption ? (
            <span className="truncate font-medium text-slate-100">
              {selectedOption.label}
            </span>
          ) : (
            <span className="text-slate-500 truncate">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {selectedOption && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition"
              title="Borrar selección"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-amber-400' : ''
            }`}
          />
        </div>
      </div>

      {/* Dropdown panel */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 bg-[#16191F] border border-slate-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-64">
          {/* Search box inside dropdown */}
          <div className="p-2 border-b border-slate-800 bg-[#12151B] sticky top-0 z-10">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-amber-400 absolute left-2.5 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full bg-[#0F1115] border border-slate-700 focus:border-amber-500 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500 font-sans"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 text-slate-400 hover:text-white p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Options list */}
          <div className="overflow-y-auto flex-1 p-1 space-y-0.5 divide-y divide-slate-800/30">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-6 text-center text-xs text-slate-500">
                {emptyMessage}
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between gap-2 transition cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30'
                        : 'hover:bg-slate-800/80 text-slate-200 hover:text-white'
                    }`}
                  >
                    <div className="truncate flex-1">
                      <div className="truncate font-medium">{opt.label}</div>
                      {opt.secondaryText && (
                        <div className="text-[11px] text-slate-400 truncate mt-0.5">
                          {opt.secondaryText}
                        </div>
                      )}
                    </div>
                    {isSelected && (
                      <Check className="w-4 h-4 text-amber-400 shrink-0 stroke-[2.5]" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
