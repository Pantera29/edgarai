import { NextResponse } from 'next/server';
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { getDealershipId } from "@/lib/config";
import twilio from 'twilio';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { createConfirmationReminder } from '@/lib/confirmation-reminder-creator';
console.log('🔍 [DEBUG] Import de confirmation-reminder-creator cargado exitosamente');

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

// Definimos los canales permitidos
type AppointmentChannel = 'whatsapp' | 'twilio' | 'manual' | 'web' | 'agenteai';

export async function POST(request: Request) {
  try {
    const supabase = createServerComponentClient({ cookies });
    
    // Obtener datos del cuerpo de la solicitud
    const { 
      client_id, 
      vehicle_id,
      service_id, 
      appointment_date, 
      appointment_time,
      notes,
      channel = 'agenteai', // Valor por defecto si no se proporciona
      dealership_id = null, // Permitir que se envíe un dealership_id explícito
      dealership_phone = null, // Número de teléfono para buscar el dealership
      phone_number = null // Mantener para compatibilidad
    } = await request.json();

    // Log de los parámetros principales del request
    console.log('Nueva cita - Request recibido:', {
      client_id,
      vehicle_id,
      service_id,
      appointment_date,
      appointment_time,
      channel,
      dealership_id,
      dealership_phone,
      phone_number
    });

    // Validar campos requeridos
    if (!client_id || !vehicle_id || !service_id || !appointment_date || !appointment_time) {
      return NextResponse.json(
        { message: 'Missing required parameters. Please provide: client_id, vehicle_id, service_id, appointment_date, appointment_time.' },
        { status: 400 }
      );
    }

    // Validar canal
    const validChannels: AppointmentChannel[] = ['whatsapp', 'twilio', 'manual', 'web', 'agenteai'];
    if (!validChannels.includes(channel as AppointmentChannel)) {
      return NextResponse.json(
        { message: 'Invalid channel value. Allowed values: whatsapp, twilio, manual, web, agenteai. Please use one of these valid channel values.' },
        { status: 400 }
      );
    }

    // 1. Verificar que el cliente existe
    const { data: client, error: clientError } = await supabase
      .from('client')
      .select('id')
      .eq('id', client_id)
      .maybeSingle();

    if (clientError || !client) {
      return NextResponse.json(
        { message: 'Client not found. Please verify the client ID or create a new client. You can verify clients by phone at /api/customers/verify?phone={phone_number} or create one at /api/customers/create (requires: names, email, phone_number).' },
        { status: 404 }
      );
    }

    // 2. Verificar que el vehículo existe y pertenece al cliente
    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .select('id_uuid, client_id')
      .eq('id_uuid', vehicle_id)
      .eq('client_id', client_id)
      .maybeSingle();

    if (vehicleError || !vehicle) {
      return NextResponse.json(
        { message: 'Vehicle not found or does not belong to this client. Please verify the vehicle ID or create a new vehicle for this client. You can get client vehicles from /api/customers/{client_id}/vehicles or create one at /api/vehicles/create (requires: client_id, make, model, license_plate, year).' },
        { status: 404 }
      );
    }

    // 3. Verificar que el servicio existe
    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select('id_uuid')
      .eq('id_uuid', service_id)
      .maybeSingle();

    if (serviceError || !service) {
      return NextResponse.json(
        { message: 'Service not found. Please verify the service ID or check available services. You can get available services from /api/services/list.' },
        { status: 404 }
      );
    }

    // 4. Verificar disponibilidad antes de crear la cita
    const { data: existingAppointments, error: appointmentsError } = await supabase
      .from('appointment')
      .select('id')
      .eq('appointment_date', appointment_date)
      .eq('appointment_time', appointment_time)
      .eq('service_id', service_id);

    if (appointmentsError) {
      return NextResponse.json(
        { message: 'Error checking availability. Please try again or contact support if the issue persists.' },
        { status: 500 }
      );
    }

    // 5. Crear la cita
    const { data: newAppointment, error: insertError } = await supabase
      .from('appointment')
      .insert([{
        client_id,
        vehicle_id,
        service_id,
        appointment_date,
        appointment_time,
        status: 'pending',
        dealership_id: await getDealershipId({ 
          dealershipId: dealership_id,
          dealershipPhone: dealership_phone || (channel === 'whatsapp' ? phone_number : null),
          supabase 
        }),
        notes: notes || null,
        channel: channel
      }])
      .select(`
        *,
        client:client_id(phone_number),
        vehicle:vehicle_id(make, model, license_plate),
        service:service_id(service_name)
      `)
      .single();

    if (insertError) {
      console.error('Error creating appointment:', insertError.message);
      return NextResponse.json(
        { message: 'Failed to create appointment. Please try again or contact support if the issue persists.', error: insertError.message },
        { status: 500 }
      );
    }

    // 6. NUEVO: Crear recordatorio de confirmación automáticamente
    console.log('🔍 [DEBUG] Iniciando lógica de recordatorio de confirmación');
    console.log('🔍 [DEBUG] newAppointment existe:', !!newAppointment);
    
    if (newAppointment) {
      console.log('🔍 [DEBUG] Datos de la cita creada:', {
        id: newAppointment.id,
        appointment_date: appointment_date,
        client_id: client_id,
        vehicle_id: vehicle_id,
        service_id: service_id
      });
      
      // Comparación simple de fechas usando strings
      const today = new Date();
      const todayString = today.toISOString().split('T')[0]; // YYYY-MM-DD
      
      console.log('🔍 [DEBUG] Comparación simple de fechas:', {
        appointment_date,
        todayString,
        isFuture: appointment_date > todayString
      });
      
      // Solo crear recordatorio si la cita NO es para hoy
      if (appointment_date > todayString) {
        console.log('🔍 [DEBUG] Cita es futura, procediendo a crear recordatorio');
        try {
          console.log('🔍 [DEBUG] Obteniendo dealership_id...');
          const targetDealershipId = await getDealershipId({ 
            dealershipId: dealership_id,
            dealershipPhone: dealership_phone || (channel === 'whatsapp' ? phone_number : null),
            supabase 
          });
          
          console.log('🔍 [DEBUG] dealership_id obtenido:', targetDealershipId);
          console.log('🔍 [DEBUG] Llamando a createConfirmationReminder...');
          
          const reminderResult = await createConfirmationReminder({
            appointment_id: newAppointment.id.toString(),
            client_id: client_id,
            vehicle_id: vehicle_id,
            service_id: service_id,
            appointment_date: appointment_date,
            dealership_id: targetDealershipId
          });
          
          console.log('🔍 [DEBUG] Resultado de createConfirmationReminder:', reminderResult);
          
          if (reminderResult.success) {
            console.log('✅ Recordatorio de confirmación creado exitosamente');
          } else {
            console.log('❌ Error en createConfirmationReminder:', reminderResult.error);
          }
        } catch (error) {
          console.log('⚠️ Error creando recordatorio de confirmación:', error);
          console.log('⚠️ Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
          // No fallar la creación de la cita por esto
        }
      } else {
        console.log('⏭️ Cita es para hoy, no se crea recordatorio de confirmación');
      }
    } else {
      console.log('❌ [DEBUG] newAppointment es null/undefined, no se puede crear recordatorio');
    }

    // 7. Enviar SMS de confirmación
    try {
      // Verificar si los SMS están habilitados
      const smsEnabled = process.env.ENABLE_SMS === 'true';
      console.log('Estado de SMS en API de citas:', { 
        enabled: smsEnabled, 
        envValue: process.env.ENABLE_SMS 
      });

      if (!smsEnabled) {
        console.log('SMS deshabilitados - no se enviará el mensaje');
        return NextResponse.json(
          { message: 'Appointment created successfully', appointment: newAppointment },
          { status: 201 }
        );
      }

      // Validar número de teléfono
      const formattedPhone = formatPhoneNumber(newAppointment.client.phone_number);
      if (!formattedPhone.startsWith('+52')) {
        throw new Error('Número de teléfono inválido para México');
      }

      // Formatear fecha y hora
      const formattedDateTime = formatDateTime(appointment_date, appointment_time);

      // Construir mensaje
      const message = `¡Cita confirmada! Su vehículo ${newAppointment.vehicle.make} ${newAppointment.vehicle.model} está agendado para el ${formattedDateTime}. Gracias por confiar en nosotros.`;

      // Enviar SMS
      const result = await twilioClient.messages.create({
        body: message,
        to: formattedPhone,
        from: process.env.TWILIO_PHONE_NUMBER
      });

      console.log('SMS enviado exitosamente:', {
        messageSid: result.sid,
        to: formattedPhone,
        status: result.status
      });
    } catch (smsError) {
      console.error('Error al enviar SMS de confirmación:', smsError);
      // No fallamos la creación de la cita si falla el SMS
    }

    return NextResponse.json(
      { message: 'Appointment created successfully', appointment: newAppointment },
      { status: 201 }
    );
    
  } catch (error) {
    console.error('Unexpected error:', error);
    try {
      const body = await request.json();
      console.error('Body del request fallido:', body);
    } catch (e) {
      console.error('No se pudo leer el body del request en el catch.');
    }
    return NextResponse.json(
      { message: 'Internal server error. Please try again later or contact support if the issue persists.' },
      { status: 500 }
    );
  }
}