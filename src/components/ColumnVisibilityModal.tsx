import React from 'react';
import { TableColumnKey, GenericColumnDefinition, TableColumnConfig } from '../types';
import { FLEET_COLUMNS } from '../data/tableColumns';
import { ColumnManagerModal } from './ColumnManagerModal';

interface ColumnVisibilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  visibleColumns: Record<TableColumnKey, boolean>;
  columnOrder?: TableColumnKey[];
  onChangeVisibility?: (key: TableColumnKey, value: boolean) => void;
  onSaveConfig?: (newConfig: TableColumnConfig<TableColumnKey>) => void;
  onResetDefaults: () => void;
}

export const ColumnVisibilityModal: React.FC<ColumnVisibilityModalProps> = ({
  isOpen,
  onClose,
  visibleColumns,
  columnOrder = FLEET_COLUMNS.map(c => c.key as TableColumnKey),
  onChangeVisibility,
  onSaveConfig,
  onResetDefaults,
}) => {
  const currentConfig: TableColumnConfig<TableColumnKey> = {
    order: columnOrder,
    visible: visibleColumns
  };

  const handleSave = (newConfig: TableColumnConfig<TableColumnKey>) => {
    if (onSaveConfig) {
      onSaveConfig(newConfig);
    } else if (onChangeVisibility) {
      Object.entries(newConfig.visible).forEach(([key, val]) => {
        onChangeVisibility(key as TableColumnKey, val);
      });
    }
  };

  return (
    <ColumnManagerModal<TableColumnKey>
      isOpen={isOpen}
      onClose={onClose}
      title="Personalizar Columnas - Flota de Equipos"
      subtitle="Gestiona visibilidad y arrastra los elementos para ordenar las columnas del inventario."
      columnDefinitions={FLEET_COLUMNS as GenericColumnDefinition<TableColumnKey>[]}
      columnConfig={currentConfig}
      onSaveConfig={handleSave}
      onResetDefaults={onResetDefaults}
    />
  );
};
