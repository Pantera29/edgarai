import { NextResponse } from 'next/server';
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { getDealershipId } from "@/lib/config";
import { resolveWorkshopId } from '@/lib/workshop-resolver';
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
      specific_service_id,    // ← NUEVO
      removed_additional,     // ← NUEVO
      appointment_date, 
      appointment_time,
      notes,
      channel = 'agenteai', // Valor por defecto si no se proporciona
      dealership_id = null, // Permitir que se envíe un dealership_id explícito
      dealership_phone = null, // Número de teléfono para buscar el dealership
      phone_number = null, // Mantener para compatibilidad
      workshop_id = null // Workshop ID específico (opcional)
    } = await request.json();

    // Log de los parámetros principales del request
    console.log('Nueva cita - Request recibido:', {
      client_id,
      vehicle_id,
      service_id,
      specific_service_id, // ← NUEVO
      removed_additional,  // ← NUEVO
      appointment_date,
      appointment_time,
      channel,
      dealership_id,
      dealership_phone,
      phone_number,
      workshop_id
    });

    // Resolver service_id si viene specific_service_id
    let finalServiceId = service_id;
    if (specific_service_id && !service_id) {
      console.log('🔍 Resolviendo service_id desde specific_service_id:', specific_service_id);
      const { data: specificService, error } = await supabase
        .from('specific_services')
        .select('service_id')
        .eq('id', specific_service_id)
        .single();
      if (specificService && specificService.service_id) {
        finalServiceId = specificService.service_id;
        console.log('✅ Service ID resuelto para crear cita:', finalServiceId);
      } else {
        console.log('❌ Specific service not found:', specific_service_id);
        return NextResponse.json(
          { message: 'Specific service not found' },
          { status: 404 }
        );
      }
    }

    // Validar campos requeridos
    if (!client_id || !vehicle_id || !finalServiceId || !appointment_date || !appointment_time) {
      return NextResponse.json(
        { message: 'Missing required parameters. Please provide: client_id, vehicle_id, service_id (or specific_service_id), appointment_date, appointment_time.' },
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
      .select('id_uuid, daily_limit, service_name')
      .eq('id_uuid', finalServiceId)  // ← Usar finalServiceId
      .maybeSingle();

    if (serviceError || !service) {
      return NextResponse.json(
        { message: 'Service not found. Please verify the service ID or check available services. You can get available services from /api/services/list.' },
        { status: 404 }
      );
    }

    // 4. Resolver workshop_id
    const finalDealershipId = await getDealershipId({ 
      dealershipId: dealership_id,
      dealershipPhone: dealership_phone || (channel === 'whatsapp' ? phone_number : null),
      supabase,
      useFallback: false // ← NO usar fallback por defecto
    });

    if (!finalDealershipId) {
      console.log('❌ Error: No se pudo determinar el ID de la agencia');
      
      // Si se proporcionó un teléfono pero no se encontró, dar mensaje específico
      if (dealership_phone || (channel === 'whatsapp' ? phone_number : null)) {
        return NextResponse.json(
          { message: 'No se encontró ningún dealership con ese número de teléfono' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        { message: 'Could not determine dealership ID' },
        { status: 400 }
      );
    }

    const finalWorkshopId = await resolveWorkshopId(finalDealershipId, supabase, workshop_id);

    console.log('🔧 Workshop ID resuelto para cita:', {
      dealershipId: finalDealershipId,
      workshopId: finalWorkshopId,
      providedWorkshopId: workshop_id
    });

    // 5. NUEVO: Validar límite diario del servicio
    if (service.daily_limit !== null) {
      console.log('🔍 Validando límite diario para servicio:', {
        serviceId: finalServiceId,
        serviceName: service.service_name,
        dailyLimit: service.daily_limit,
        appointmentDate: appointment_date,
        dealershipId: finalDealershipId
      });

      // Contar citas existentes para este servicio, fecha y concesionario
      const { count: currentAppointmentsCount, error: countError } = await supabase
        .from('appointment')
        .select('*', { count: 'exact', head: false })
        .eq('service_id', finalServiceId)
        .eq('appointment_date', appointment_date)
        .eq('dealership_id', finalDealershipId);

      if (countError) {
        console.error('Error contando citas existentes para límite diario:', countError);
        return NextResponse.json(
          { message: 'Error verificando disponibilidad del servicio. Por favor, intenta nuevamente.' },
          { status: 500 }
        );
      }

      const appointmentCount = currentAppointmentsCount || 0;
      
      console.log('📊 Conteo de citas para límite diario:', {
        currentCount: appointmentCount,
        dailyLimit: service.daily_limit,
        wouldExceed: appointmentCount >= service.daily_limit
      });

      // Verificar si se excedería el límite
      if (appointmentCount >= service.daily_limit) {
        console.log('❌ Límite diario excedido:', {
          serviceId: finalServiceId,
          serviceName: service.service_name,
          currentCount: appointmentCount,
          dailyLimit: service.daily_limit,
          appointmentDate: appointment_date,
          dealershipId: finalDealershipId
        });

        return NextResponse.json(
          { 
            message: 'Cannot create appointment: daily limit for this service has been reached for the dealership. Please select another date or contact the workshop.',
            details: {
              serviceName: service.service_name,
              currentAppointments: appointmentCount,
              dailyLimit: service.daily_limit,
              appointmentDate: appointment_date
            }
          },
          { status: 409 }
        );
      }

      console.log('✅ Límite diario válido:', {
        serviceId: finalServiceId,
        currentCount: appointmentCount,
        dailyLimit: service.daily_limit,
        remainingSlots: service.daily_limit - appointmentCount
      });
    } else {
      console.log('ℹ️ Servicio sin límite diario configurado:', {
        serviceId: finalServiceId,
        serviceName: service.service_name,
        dailyLimit: service.daily_limit
      });
    }

    // 6. Verificar disponibilidad antes de crear la cita
    const { data: existingAppointments, error: appointmentsError } = await supabase
      .from('appointment')
      .select('id')
      .eq('appointment_date', appointment_date)
      .eq('appointment_time', appointment_time)
      .eq('service_id', finalServiceId);  // ← Usar finalServiceId

    if (appointmentsError) {
      return NextResponse.json(
        { message: 'Error checking availability. Please try again or contact support if the issue persists.' },
        { status: 500 }
      );
    }

    // 7. Crear la cita
    const { data: newAppointment, error: insertError } = await supabase
      .from('appointment')
      .insert([{
        client_id,
        vehicle_id,
        service_id: finalServiceId,          // ← Usar finalServiceId
        specific_service_id: specific_service_id || null, // ← AGREGADO
        appointment_date,
        appointment_time,
        status: 'pending',
        dealership_id: finalDealershipId,
        workshop_id: finalWorkshopId,
        notes: notes || null,
        channel: channel,
        removed_additional: removed_additional || false  // ← NUEVO campo
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

    // Logging de parámetros resueltos
    console.log('📅 Creando cita con parámetros resueltos:', {
      original_service_id: service_id,
      specific_service_id,
      resolved_service_id: finalServiceId,
      removed_additional: removed_additional || false,
      dealership_id: finalDealershipId,
      workshop_id: finalWorkshopId
    });

    // 8. NUEVO: Crear recordatorio de confirmación automáticamente
    console.log('🔍 [DEBUG] Iniciando lógica de recordatorio de confirmación');
    console.log('🔍 [DEBUG] newAppointment existe:', !!newAppointment);
    
    if (newAppointment) {
      console.log('🔍 [DEBUG] Datos de la cita creada:', {
        id: newAppointment.id,
        appointment_date: appointment_date,
        client_id: client_id,
        vehicle_id: vehicle_id,
        service_id: finalServiceId
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
          console.log('🔍 [DEBUG] Usando dealership_id ya resuelto:', finalDealershipId);
          console.log('🔍 [DEBUG] Llamando a createConfirmationReminder...');
          
          const reminderResult = await createConfirmationReminder({
            appointment_id: newAppointment.id.toString(),
            client_id: client_id,
            vehicle_id: vehicle_id,
            service_id: finalServiceId,
            appointment_date: appointment_date,
            dealership_id: finalDealershipId
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

    // 9. Enviar SMS de confirmación
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