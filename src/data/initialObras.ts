import { Obra } from '../types';

export const INITIAL_OBRAS: Obra[] = [
  {
    id: 'obra-1',
    numero: 'OBRA-2024-001',
    nombreObra: 'Ampliación Parque Industrial Norte',
    ubicacion: 'Ruta 9 Km 45, Sector Industrial',
    pertenece: 'Constructora San Cayetano S.A.',
    activa: true,
    plazo: '12 meses (Finaliza Dic 2026)',
    montoEstimado: 45000000,
    fechaAlta: '2024-01-15',
    observaciones: 'Movimiento de suelos y pavimentación pesada.'
  },
  {
    id: 'obra-2',
    numero: 'OBRA-2024-002',
    nombreObra: 'Torre Residencial Altos del Valle',
    ubicacion: 'Av. Libertador 3400, CABA',
    pertenece: 'Inversora Urbana SRL',
    activa: true,
    plazo: '18 meses',
    montoEstimado: 89000000,
    fechaAlta: '2024-03-10',
    observaciones: 'Excavación de subsuelo y pilotes.'
  },
  {
    id: 'obra-3',
    numero: 'OBRA-2023-019',
    nombreObra: 'Pavimentación Acceso Sur',
    ubicacion: 'Ruta Provincial 4, Km 12',
    pertenece: 'Dirección Provincial de Vialidad',
    activa: false,
    plazo: '6 meses (Completada)',
    montoEstimado: 28000000,
    fechaAlta: '2023-08-01',
    observaciones: 'Repavimentación y banquinas.'
  },
  {
    id: 'obra-4',
    numero: 'OBRA-2025-001',
    nombreObra: 'Planta Logística Centro',
    ubicacion: 'Parque Logístico Intermodal, Lote 14',
    pertenece: 'Logística Integral del Sur S.A.',
    activa: true,
    plazo: '8 meses',
    montoEstimado: 34500000,
    fechaAlta: '2025-01-05',
    observaciones: 'Nivelación de terreno y bases de hormigón.'
  }
];
