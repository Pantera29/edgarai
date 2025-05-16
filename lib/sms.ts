import twilio from 'twilio';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Tipos
export interface AppointmentData {
  client_phone: string;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_plate: string;
  service_name: string;
  appointment_date: string;
  appointment_time: string;
}

// Cliente de Twilio
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

/**
 * Formatea un número de teléfono al formato E.164 para México
 */
export function formatPhoneNumber(phone: string): string {
  // Eliminar caracteres no numéricos
  const cleaned = phone.replace(/\D/g, '');
  
  // Si el número ya tiene el código de país, retornarlo
  if (cleaned.startsWith('52')) {
    return `+${cleaned}`;
  }
  
  // Si el número tiene 10 dígitos (formato mexicano), agregar el código de país
  if (cleaned.length === 10) {
    return `+52${cleaned}`;
  }
  
  // Si el número tiene 10 dígitos y comienza con 1, agregar el código de país
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+52${cleaned.slice(1)}`;
  }
  
  // Si no cumple con ningún formato, retornar el número original
  return phone;
}

/**
 * Formatea la fecha y hora para el mensaje
 */
function formatDateTime(date: string, time: string): string {
  try {
    const dateObj = new Date(`${date}T${time}`);
    const formattedDate = format(dateObj, "dd 'de' MMMM 'de' yyyy", { locale: es });
    const formattedTime = format(dateObj, 'HH:mm');
    return `${formattedDate} a las ${formattedTime}`;
  } catch (error) {
    console.error('Error formateando fecha y hora:', error);
    return `${date} ${time}`;
  }
}

/**
 * Verifica si los SMS están habilitados
 */
export function isSMSEnabled(): boolean {
  const rawValue = process.env.ENABLE_SMS;
  const normalizedValue = rawValue?.trim().toLowerCase();
  
  console.log('Verificación detallada de ENABLE_SMS:', {
    rawValue,
    normalizedValue,
    type: typeof rawValue,
    envKeys: Object.keys(process.env).filter(key => key.includes('ENABLE')),
    nodeEnv: process.env.NODE_ENV
  });
  
  return normalizedValue === 'true';
}

/**
 * Envía un SMS de confirmación de cita
 */
export async function sendAppointmentConfirmationSMS(data: AppointmentData): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('Iniciando envío de SMS con datos:', {
      client_phone: data.client_phone,
      vehicle_make: data.vehicle_make,
      vehicle_model: data.vehicle_model,
      service_name: data.service_name,
      appointment_date: data.appointment_date,
      appointment_time: data.appointment_time
    });

    // Verificar si los SMS están habilitados
    const smsEnabled = isSMSEnabled();
    console.log('Estado de SMS:', { enabled: smsEnabled, envValue: process.env.ENABLE_SMS });
    
    if (!smsEnabled) {
      console.log('SMS deshabilitados - no se enviará el mensaje');
      return { success: true };
    }

    console.log('Preparando request a /api/sms/send');
    const response = await fetch('/api/sms/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    console.log('Respuesta del servidor:', {
      status: response.status,
      statusText: response.statusText
    });

    const result = await response.json();
    console.log('Resultado del envío:', result);

    if (!response.ok) {
      throw new Error(result.error || 'Error al enviar SMS');
    }

    return { success: true };
  } catch (error) {
    console.error('Error detallado enviando SMS:', {
      error: error instanceof Error ? error.message : 'Error desconocido',
      stack: error instanceof Error ? error.stack : undefined
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al enviar SMS'
    };
  }
} 