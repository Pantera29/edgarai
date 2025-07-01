export type AppointmentStatus = 'pendiente' | 'confirmada' | 'en_proceso' | 'completada' | 'cancelada' 

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  client: {
    names: string;
    phone_number: string;
    email: string;
  };
  vehicle: {
    make: string;
    model: string;
    license_plate: string;
    year: number;
  };
  service: {
    service_name: string;
    duration_minutes: number;
    price: number;
  };
  notes: string;
  dealership_id: string;
}

export interface CalendarView {
  type: 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay';
  title: string;
}

// Tipos para el dashboard de uso de la plataforma
export interface UsageData {
  dealership_id: string
  current_period: {
    period: string
    year: number
    month: number
    unique_conversations: number
    by_channel: {
      phone: number
      whatsapp: number
    }
  }
  historical_usage: Array<{
    period: string
    year: number
    month: number
    unique_conversations: number
    by_channel: { 
      phone: number
      whatsapp: number 
    }
  }>
  calculated_at: string
}

export interface UsageSummaryData {
  current_period: {
    unique_conversations: number
    by_channel: {
      phone: number
      whatsapp: number
    }
  }
  previous_period?: {
    unique_conversations: number
  }
} 