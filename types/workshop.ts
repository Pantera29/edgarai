import { es } from 'date-fns/locale';

export interface TallerConfig {
  dealership_id: string;
  shift_duration: number;
  created_at: string;
  updated_at: string;
}

export interface HorarioOperacion {
  id: string;
  dealership_id: string;
  day_of_week: number;
  opening_time: string;
  closing_time: string;
  is_working_day: boolean;
  max_simultaneous_services: number;
  created_at?: string;
  updated_at?: string;
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

export interface BlockedDate {
  block_id: string;
  dealership_id: string;
  date: string;
  reason: string;
  full_day: boolean;
  start_time?: string | null;
  end_time?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SelectedDateInfo {
  date: Date;
  isNonWorkingDay: boolean;
  schedule: HorarioOperacion | null;
}

export interface Cliente {
  id_uuid: string;
  nombre: string;
}

export interface Client {
  id: string,
  names: string,
  email: string,
  phone_number: string,
}

export interface Vehiculo {
  id_uuid: string;
  marca: string;
  modelo: string;
  placa: string;
  id_cliente_uuid: string;
}

export interface Vehicle {
  id_uuid: string;
  make: string;
  model: string;
  license_plate: string;
  client_id: string;
}


export interface Servicio {
  id_uuid: string;
  service_name: string;
  description?: string;
  duration_minutes: number;
  price?: number;
}

export interface Service {
  id_uuid: string;
  service_name: string;
  description?: string;
  duration_minutes: number;
  price?: number;
}

export type AppointmentStatus = 'pendiente' | 'en_proceso' | 'completada' | 'cancelada';

export interface Appointment {
  estado: AppointmentStatus;
} 