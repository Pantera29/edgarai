import { es } from 'date-fns/locale';

export interface TallerConfig {
  dealership_id: string;
  workshop_id?: string;
  shift_duration: number;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface HorarioOperacion {
  id: string;
  dealership_id: string;
  workshop_id?: string;
  day_of_week: number;
  opening_time: string;
  closing_time: string;
  is_working_day: boolean;
  max_simultaneous_services: number;
  max_arrivals_per_slot?: number | null;
  reception_end_time?: string | null; // ← NUEVO: Horario límite de recepción por día
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
  max_total_appointments?: number | null;
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
  phone_number_2?: string | null,
}

export interface Vehiculo {
  id: string;
  make: string;
  model: string;
  license_plate: string;
  client_id: string;
  year: number;
  vin?: string;
  last_km?: number;
  last_service_date?: string;
  next_service_date?: string;
}

export interface Vehicle {
  id: string;
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
  client_visible?: boolean;
}

export interface Service {
  id: string;
  service_name: string;
  description?: string;
  duration_minutes: number;
  price?: number;
  client_visible?: boolean;
}

export type AppointmentStatus = 'pendiente' | 'en_proceso' | 'completada' | 'cancelada';

export interface Appointment {
  estado: AppointmentStatus;
} 