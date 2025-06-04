import { NextResponse } from 'next/server';
import twilio from 'twilio';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Cliente de Twilio
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

/**
 * Formatea un número de teléfono al formato E.164 para México
 */
function formatPhoneNumber(phone: string): string {
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

export async function POST(request: Request) {
  try {
    console.log('Recibida solicitud de envío de SMS');
    
    // Verificar si los SMS están habilitados
    const smsEnabled = process.env.ENABLE_SMS === 'true';
    console.log('Estado de SMS en API:', { 
      enabled: smsEnabled, 
      envValue: process.env.ENABLE_SMS,
      twilioAccountSid: process.env.TWILIO_ACCOUNT_SID ? 'Configurado' : 'No configurado',
      twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER ? 'Configurado' : 'No configurado'
    });
    
    if (!smsEnabled) {
      console.log('SMS deshabilitados - no se enviará el mensaje');
      return NextResponse.json({ success: true });
    }

    const {
      client_phone,
      vehicle_make,
      vehicle_model,
      vehicle_plate,
      service_name,
      appointment_date,
      appointment_time
    } = await request.json();

    console.log('Datos recibidos para SMS:', {
      client_phone,
      vehicle_make,
      vehicle_model,
      vehicle_plate,
      service_name,
      appointment_date,
      appointment_time
    });

    // Validar número de teléfono
    const formattedPhone = formatPhoneNumber(client_phone);
    console.log('Número de teléfono formateado:', formattedPhone);
    
    if (!formattedPhone.startsWith('+52')) {
      console.log('Número de teléfono inválido:', formattedPhone);
      return NextResponse.json(
        { success: false, error: 'Número de teléfono inválido para México' },
        { status: 400 }
      );
    }

    // Formatear fecha y hora
    const formattedDateTime = formatDateTime(appointment_date, appointment_time);
    console.log('Fecha y hora formateadas:', formattedDateTime);

    // Construir mensaje
    const message = `¡Cita confirmada! Su vehículo ${vehicle_make} ${vehicle_model} está agendado para el ${formattedDateTime}. Gracias por confiar en nosotros.`;
    console.log('Mensaje construido:', message);

    // Enviar SMS
    console.log('Iniciando envío a Twilio...');
    const result = await twilioClient.messages.create({
      body: message,
      to: formattedPhone,
      from: process.env.TWILIO_PHONE_NUMBER
    });

    console.log('Respuesta de Twilio:', {
      messageSid: result.sid,
      to: formattedPhone,
      status: result.status,
      errorCode: result.errorCode,
      errorMessage: result.errorMessage
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error detallado en API de SMS:', {
      error: error instanceof Error ? error.message : 'Error desconocido',
      stack: error instanceof Error ? error.stack : undefined,
      twilioError: error instanceof Error && 'code' in error ? error.code : undefined
    });
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido al enviar SMS'
      },
      { status: 500 }
    );
  }
} 