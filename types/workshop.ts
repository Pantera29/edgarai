export interface TallerConfig {
  id_taller: string;
  duracion_turno: number;
  creado_el: string;
  actualizado_el: string;
}

export interface HorarioOperacion {
  id: string;
  id_taller: string;
  dia_semana: number;
  hora_apertura: string;
  hora_cierre: string;
  activo: boolean;
  servicios_simultaneos_max: number;
  creado_el?: string;
  actualizado_el?: string;
}

export interface BlockedTime {
  id: string;
  startDate: Date;
  endDate: Date;
  reason: string;
  type: 'FULL_DAY' | 'PARTIAL_DAY';
  affectedBays: string[];
  startTime?: string;
  endTime?: string;
}

export interface ServiceType {
  id: string;
  name: string;
  standardDuration: number;
  requiredSpecialties: string[];
}

export interface WorkshopSchedule {
  id: string;
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isActive: boolean;
}

export interface ServiceBay {
  id: string;
  name: string;
  type: string;
  serviceTypeIds: string[];
  isActive: boolean;
} 