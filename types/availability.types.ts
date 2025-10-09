/**
 * Tipos para el Motor de Disponibilidad de Service Advisors
 */

export interface AvailabilityRequest {
  dealershipId: string;
  workshopId: string;
  serviceId: string;  // UUID del servicio solicitado
  date: string;       // "YYYY-MM-DD"
}

export interface AdvisorAvailability {
  id: string;
  name: string;
  canTake: boolean;
  reason?: string;    // Si canTake = false, por qué no puede
}

export interface TimeSlot {
  time: string;       // "HH:mm" ej: "08:00"
  available: boolean;
  totalCapacity: number;
  details: {
    availableAdvisors: number;
    advisors: AdvisorAvailability[];
  };
}

export interface AvailabilityResponse {
  date: string;
  serviceId: string;
  serviceName: string;
  slots: TimeSlot[];
  message?: string;  // Si no hay disponibilidad, mensaje explicativo
}

