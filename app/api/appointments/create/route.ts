import { NextResponse } from 'next/server';
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { getDealershipId } from "@/lib/config";
import { resolveWorkshopId } from '@/lib/workshop-resolver';
import twilio from 'twilio';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { createConfirmationReminder } from '@/lib/confirmation-reminder-creator';
import { verifyToken } from '@/app/jwt/token';
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
    const requestData = await request.json();
    
    // 🔍 DETECCIÓN AUTOMÁTICA DE USUARIO DEL BACKOFFICE
    let userInfo = null;
    let isBackofficeRequest = false;
    
    // Debug: Verificar todos los headers
    console.log('🔍 [DEBUG] Headers recibidos:', {
      authorization: request.headers.get('authorization'),
      contentType: request.headers.get('content-type'),
      userAgent: request.headers.get('user-agent')
    });
    
    try {
      const authHeader = request.headers.get('authorization');
      console.log('🔍 [DEBUG] Auth header encontrado:', !!authHeader);
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.replace('Bearer ', '');
        console.log('🔍 [DEBUG] Token extraído (primeros 20 chars):', token.substring(0, 20) + '...');
        
        userInfo = verifyToken(token);
        console.log('🔍 [DEBUG] Token verificado:', {
          hasUserInfo: !!userInfo,
          userInfoKeys: userInfo ? Object.keys(userInfo) : [],
          hasEmail: userInfo?.email,
          hasDealershipId: userInfo?.dealership_id
        });
        
        // Verificar que el token contiene la información necesaria del backoffice
        if (userInfo && userInfo.email && userInfo.dealership_id) {
          isBackofficeRequest = true;
          console.log('👤 [BACKOFFICE] Usuario autenticado:', {
            email: userInfo.email,
            names: userInfo.names,
            surnames: userInfo.surnames,
            dealership_id: userInfo.dealership_id,
            action: 'appointment_creation'
          });
        } else {
          console.log('⚠️ [DEBUG] Token no contiene información completa del backoffice:', {
            hasEmail: !!userInfo?.email,
            hasDealershipId: !!userInfo?.dealership_id,
            userInfo: userInfo
          });
        }
      } else {
        console.log('⚠️ [DEBUG] No se encontró header Authorization válido');
      }
    } catch (error) {
      console.log('⚠️ [AUTH] Error al verificar token, continuando como API externa:', error);
    }
    
    console.log('🔍 [DEBUG] Estado final:', {
      isBackofficeRequest,
      hasUserInfo: !!userInfo
    });
    
    const { 
      client_id, 
      vehicle_id,
      service_id, 
      specific_service_id,    // ← NUEVO
      removed_additional,     // ← NUEVO
      completion_notes,       // ← NUEVO
      assigned_mechanic_id,   // ← NUEVO: ID del mecánico asignado
      appointment_date, 
      appointment_time,
      notes,
      channel = 'agenteai', // Valor por defecto si no se proporciona
      dealership_phone = null, // Número de teléfono para buscar el dealership
      phone = null, // Nuevo: alias para phone_number
      phone_number = null, // Mantener para compatibilidad
      workshop_id = null // Workshop ID específico (opcional)
    } = requestData;

    // Permitir que se envíe un dealership_id explícito (usar let para poder reasignar)
    let dealership_id = requestData.dealership_id || null;

    // Normalizar el parámetro de teléfono
    const phoneToUse = phone_number || phone;

    // Log de los parámetros principales del request
    console.log('Nueva cita - Request recibido:', {
      client_id,
      vehicle_id,
      service_id,
      specific_service_id,
      removed_additional,
      appointment_date,
      appointment_time,
      channel,
      dealership_id,
      phone: phoneToUse,
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

    // NUEVO: Lógica de resolución del cliente
    let finalClientId = client_id;
    
    // Si se proporciona client_id directo, obtener su dealership_id
    if (finalClientId) {
      console.log('🔍 Obteniendo dealership_id del cliente:', finalClientId);
      const { data: clientData } = await supabase
        .from('client')
        .select('dealership_id')
        .eq('id', finalClientId)
        .maybeSingle();
      
      if (clientData?.dealership_id) {
        // Si no se proporciona dealership_id, usar el del cliente
        if (!dealership_id) {
          dealership_id = clientData.dealership_id;
          console.log('✅ Dealership_id obtenido del cliente:', dealership_id);
        }
      } else {
        console.log('❌ Cliente no encontrado o sin dealership_id');
        return NextResponse.json(
          { message: 'Client not found or has no dealership_id' },
          { status: 404 }
        );
      }
    }
    
    if (!finalClientId && phoneToUse) {
          console.log('🔍 Buscando cliente por teléfono:', {
      phone: phoneToUse,
      dealership_id,
      service_id: finalServiceId
    });
      
      let dealershipIdForSearch = dealership_id;
      
      // Si no se proporciona dealership_id pero sí service_id, 
      // podemos determinar el dealership del servicio
      if (!dealershipIdForSearch && finalServiceId) {
        console.log('🔍 Determinando dealership desde service_id:', finalServiceId);
        const { data: service, error: serviceError } = await supabase
          .from('services')
          .select('dealership_id')
          .eq('id_uuid', finalServiceId)
          .maybeSingle();
        
        if (serviceError) {
          console.log('❌ Error consultando servicio:', serviceError);
        }
        
        if (service?.dealership_id) {
          dealershipIdForSearch = service.dealership_id;
          // IMPORTANTE: Actualizar también la variable dealership_id para que esté disponible después
          dealership_id = service.dealership_id;
          console.log('✅ Dealership determinado desde servicio:', dealershipIdForSearch);
        } else {
          console.log('❌ No se pudo determinar dealership desde servicio');
        }
      }
      
      // Buscar cliente por phone + dealership
      if (dealershipIdForSearch) {
        console.log('🔍 Buscando cliente por phone + dealership:', {
          phone: phoneToUse,
          dealership: dealershipIdForSearch
        });
        
        const { data: client, error } = await supabase
          .from('client')
          .select('id')
          .eq('phone_number', phoneToUse)
          .eq('dealership_id', dealershipIdForSearch)
          .maybeSingle();
          
        if (client) {
          finalClientId = client.id;
          console.log('✅ Cliente encontrado por phone + dealership:', {
            phone: phoneToUse,
            dealership: dealershipIdForSearch,
            clientId: finalClientId
          });
        } else {
          console.log('❌ Cliente no encontrado por phone + dealership:', {
            phone: phoneToUse,
            dealership: dealershipIdForSearch
          });
          return NextResponse.json(
            { 
              message: `No client found with phone ${phoneToUse} in dealership ${dealershipIdForSearch}`,
              phone: phoneToUse,
              dealership_id: dealershipIdForSearch
            },
            { status: 404 }
          );
        }
      } else {
        console.log('❌ No se puede buscar por teléfono sin dealership_id o service_id');
        return NextResponse.json(
          { 
            message: 'Cannot search by phone without dealership_id or service_id to determine dealership',
            phone: phoneToUse,
            received: {
              dealership_id: !!dealership_id,
              service_id: !!finalServiceId
            }
          },
          { status: 400 }
        );
      }
    }

    // Validar campos requeridos
    if (!finalClientId || !vehicle_id || !finalServiceId || !appointment_date || !appointment_time) {
      return NextResponse.json(
        { 
          message: 'Missing required parameters. Please provide: client_id OR (phone/phone_number + dealership_id) OR (phone/phone_number + service_id), vehicle_id, service_id (or specific_service_id), appointment_date, appointment_time.',
          received: {
            client_id: !!client_id,
            phone: !!phoneToUse,
            phone_number: !!phone_number,
            vehicle_id: !!vehicle_id,
            service_id: !!service_id,
            specific_service_id: !!specific_service_id,
            appointment_date: !!appointment_date,
            appointment_time: !!appointment_time
          }
        },
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
      .eq('id', finalClientId)
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
      .eq('client_id', finalClientId)
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
      .select('id_uuid, daily_limit, service_name, available_monday, available_tuesday, available_wednesday, available_thursday, available_friday, available_saturday, available_sunday')
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

    // 4.5. NUEVO: Validar mecánico asignado si se proporciona
    if (assigned_mechanic_id) {
      console.log('🔧 Validando mecánico asignado:', {
        mechanicId: assigned_mechanic_id,
        workshopId: finalWorkshopId,
        dealershipId: finalDealershipId
      });

      const { data: mechanic, error: mechanicError } = await supabase
        .from('mechanics')
        .select('id, name, workshop_id, dealership_id, is_active')
        .eq('id', assigned_mechanic_id)
        .eq('workshop_id', finalWorkshopId)
        .eq('dealership_id', finalDealershipId)
        .eq('is_active', true)
        .single();

      if (mechanicError || !mechanic) {
        console.log('❌ Mecánico no válido o no disponible:', {
          mechanicId: assigned_mechanic_id,
          error: mechanicError?.message,
          workshopId: finalWorkshopId,
          dealershipId: finalDealershipId
        });

        return NextResponse.json(
          { 
            message: 'El mecánico seleccionado no es válido o no está disponible en este taller',
            error_type: 'INVALID_MECHANIC',
            solution: 'Verifique que el mecánico existe, está activo y pertenece al taller seleccionado'
          },
          { status: 400 }
        );
      }

      console.log('✅ Mecánico validado correctamente:', {
        mechanicId: mechanic.id,
        mechanicName: mechanic.name,
        workshopId: mechanic.workshop_id
      });
    } else {
      console.log('ℹ️ No se asignó mecánico a la cita (opcional)');
    }

    // 5. NUEVO: Validar día laborable y disponibilidad del servicio
    console.log('🔍 Validando día laborable y disponibilidad del servicio:', {
      serviceId: finalServiceId,
      serviceName: service.service_name,
      appointmentDate: appointment_date,
      dealershipId: finalDealershipId,
      workshopId: finalWorkshopId
    });

    // Obtener el día de la semana (0=Domingo, 1=Lunes, ..., 6=Sábado)
    const appointmentDateObj = new Date(appointment_date + 'T00:00:00');
    const dayOfWeek = appointmentDateObj.getDay();
    
    // Mapear días de JavaScript a nombres en inglés
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = dayNames[dayOfWeek];
    
    console.log('📅 Información del día:', {
      appointmentDate: appointment_date,
      dayOfWeek: dayOfWeek,
      dayName: dayName
    });

    // 5.1. Validar disponibilidad del servicio para este día de la semana
    const dayMap = [
      'available_sunday',
      'available_monday', 
      'available_tuesday',
      'available_wednesday',
      'available_thursday',
      'available_friday',
      'available_saturday'
    ];
    const availableField = dayMap[dayOfWeek];
    
    if (!service[availableField as keyof typeof service]) {
      console.log('❌ Servicio no disponible este día:', { 
        serviceId: finalServiceId, 
        serviceName: service.service_name,
        dayName: dayName,
        availableField: availableField,
        isAvailable: service[availableField as keyof typeof service]
      });
      
      return NextResponse.json(
        { 
          message: `Cannot create appointment: The service "${service.service_name}" is not available on ${dayName}s. Please select a different day of the week.`,
          error_type: 'SERVICE_NOT_AVAILABLE_ON_DAY',
          details: {
            serviceName: service.service_name,
            requestedDay: dayName,
            serviceId: finalServiceId,
            appointmentDate: appointment_date,
            solution: 'Choose a different day when this service is available (Monday through Saturday)'
          }
        },
        { status: 400 }
      );
    }

    // 5.2. Validar si el día es laborable para la agencia
    const { data: operatingSchedule, error: scheduleError } = await supabase
      .from('operating_hours')
      .select('is_working_day, opening_time, closing_time, reception_end_time')
      .eq('dealership_id', finalDealershipId)
      .eq('workshop_id', finalWorkshopId)
      .eq('day_of_week', dayOfWeek === 0 ? 1 : dayOfWeek + 1) // Convertir a formato 1-7 (1=Domingo)
      .maybeSingle();

    if (scheduleError) {
      console.error('Error verificando horario de operación:', scheduleError);
      return NextResponse.json(
        { 
          message: 'Error checking dealership operating hours. Please try again or contact support.',
          error_type: 'OPERATING_HOURS_ERROR'
        },
        { status: 500 }
      );
    }

    if (!operatingSchedule || !operatingSchedule.is_working_day) {
      console.log('❌ Día no laborable para la agencia:', { 
        dayName: dayName,
        appointmentDate: appointment_date,
        dealershipId: finalDealershipId,
        workshopId: finalWorkshopId,
        isWorkingDay: operatingSchedule?.is_working_day
      });
      
      return NextResponse.json(
        { 
          message: `Cannot create appointment: The dealership is closed on ${dayName}s. Please select a different day when the workshop is open.`,
          error_type: 'DEALERSHIP_CLOSED_ON_DAY',
          details: {
            requestedDay: dayName,
            appointmentDate: appointment_date,
            dealershipId: finalDealershipId,
            workshopId: finalWorkshopId,
            isWorkingDay: operatingSchedule?.is_working_day,
            solution: 'Choose a different day when the dealership is open (Monday through Saturday)'
          }
        },
        { status: 400 }
      );
    }

    console.log('✅ Validaciones de día laborable y disponibilidad del servicio pasadas:', {
      dayName: dayName,
      serviceAvailable: true,
      dealershipOpen: operatingSchedule.is_working_day,
      operatingHours: {
        opening: operatingSchedule.opening_time,
        closing: operatingSchedule.closing_time,
        receptionEnd: operatingSchedule.reception_end_time
      }
    });

    // 5.3. Validar límite diario del servicio
    if (service.daily_limit !== null) {
      console.log('🔍 Validando límite diario para servicio:', {
        serviceId: finalServiceId,
        serviceName: service.service_name,
        dailyLimit: service.daily_limit,
        appointmentDate: appointment_date,
        dealershipId: finalDealershipId
      });

      // Contar citas existentes para este servicio, fecha y concesionario (excluyendo canceladas)
      const { count: currentAppointmentsCount, error: countError } = await supabase
        .from('appointment')
        .select('*', { count: 'exact', head: false })
        .eq('service_id', finalServiceId)
        .eq('appointment_date', appointment_date)
        .eq('dealership_id', finalDealershipId)
        .neq('status', 'cancelled');

      if (countError) {
        console.error('Error contando citas existentes para límite diario:', countError);
        return NextResponse.json(
          { 
            message: 'Error checking service availability. Please try again or contact support.',
            error_type: 'DAILY_LIMIT_CHECK_ERROR'
          },
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
            message: 'Cannot create appointment: Daily limit for this service has been reached for the dealership. Please select another date or contact the workshop.',
            error_type: 'DAILY_LIMIT_EXCEEDED',
            details: {
              serviceName: service.service_name,
              currentAppointments: appointmentCount,
              dailyLimit: service.daily_limit,
              appointmentDate: appointment_date,
              solution: 'Choose a different date or contact the workshop to check availability'
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

    // 5.4. NUEVA VALIDACIÓN: Límite total de citas por día para la agencia
    console.log('🔍 Verificando límite total de citas por día para la agencia...');

    // Buscar configuración de límite total para esta fecha y agencia
    let dailyLimitQuery = supabase
      .from('blocked_dates')
      .select('max_total_appointments, reason')
      .eq('dealership_id', finalDealershipId)
      .eq('date', appointment_date);
    
    // Manejar workshop_id: si es null en BD, usar is('workshop_id', null)
    if (finalWorkshopId) {
      dailyLimitQuery = dailyLimitQuery.or(`workshop_id.eq.${finalWorkshopId},workshop_id.is.null`);
    } else {
      dailyLimitQuery = dailyLimitQuery.is('workshop_id', null);
    }
    
    // Ordenar y limitar para evitar error de múltiples registros
    const { data: dailyLimit, error: dailyLimitError } = await dailyLimitQuery
      .order('full_day', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (dailyLimitError) {
      console.error('Error verificando límite total diario:', dailyLimitError);
      // Continuar sin bloquear - no es error crítico
    }

    // Si hay límite configurado para este día (NULL = sin límite, 0 = bloqueo completo, >0 = límite específico)
    if (dailyLimit?.max_total_appointments !== null && dailyLimit?.max_total_appointments !== undefined) {
      console.log('📊 Límite total configurado para este día:', {
        date: appointment_date,
        maxAppointments: dailyLimit.max_total_appointments,
        reason: dailyLimit.reason,
        dealershipId: finalDealershipId,
        workshopId: finalWorkshopId
      });

      // Contar TODAS las citas existentes para esta fecha y agencia
      const { count: totalAppointmentsCount, error: totalCountError } = await supabase
        .from('appointment')
        .select('*', { count: 'exact', head: false })
        .eq('appointment_date', appointment_date)
        .eq('dealership_id', finalDealershipId)
        .eq('workshop_id', finalWorkshopId)
        .neq('status', 'cancelled'); // Excluir canceladas

      if (totalCountError) {
        console.error('Error contando citas totales:', totalCountError);
        return NextResponse.json(
          { 
            message: 'Error verificando disponibilidad. Intenta nuevamente.',
            error_type: 'TOTAL_LIMIT_CHECK_ERROR'
          },
          { status: 500 }
        );
      }

      const currentTotalCount = totalAppointmentsCount || 0;

      console.log('📈 Conteo total de citas para límite diario:', {
        currentTotal: currentTotalCount,
        maxAllowed: dailyLimit.max_total_appointments,
        wouldExceed: currentTotalCount >= dailyLimit.max_total_appointments
      });

      // Verificar si se excedería el límite total
      if (currentTotalCount >= dailyLimit.max_total_appointments) {
        console.log('❌ Límite total diario excedido:', {
          date: appointment_date,
          currentTotal: currentTotalCount,
          maxAllowed: dailyLimit.max_total_appointments,
          reason: dailyLimit.reason,
          dealershipId: finalDealershipId,
          workshopId: finalWorkshopId
        });

        return NextResponse.json(
          { 
            message: `Cannot schedule more appointments for ${appointment_date}. This date has reached the maximum limit of ${dailyLimit.max_total_appointments} appointments. Reason: ${dailyLimit.reason || 'Special limit configured'}. Please try selecting a different date.`,
            error_type: 'DAILY_TOTAL_LIMIT_EXCEEDED',
            details: {
              date: appointment_date,
              currentAppointments: currentTotalCount,
              maxAllowed: dailyLimit.max_total_appointments,
              reason: dailyLimit.reason || 'Special limit configured',
              solution: 'Please select another available date'
            }
          },
          { status: 409 }
        );
      }

      console.log('✅ Límite total diario válido:', {
        date: appointment_date,
        currentTotal: currentTotalCount,
        maxAllowed: dailyLimit.max_total_appointments,
        remaining: dailyLimit.max_total_appointments - currentTotalCount
      });
    } else {
      console.log('ℹ️ No hay límite total configurado para este día:', {
        date: appointment_date,
        dealershipId: finalDealershipId,
        workshopId: finalWorkshopId
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

    // 6.5. NUEVA VALIDACIÓN: Verificar max_arrivals_per_slot
    console.log('🔍 Verificando límite de llegadas por slot (max_arrivals_per_slot)...');
    
    // Obtener configuración del horario para este día
    const { data: scheduleConfig, error: scheduleConfigError } = await supabase
      .from('operating_hours')
      .select('max_arrivals_per_slot')
      .eq('dealership_id', finalDealershipId)
      .eq('workshop_id', finalWorkshopId)
      .eq('day_of_week', dayOfWeek === 0 ? 7 : dayOfWeek)
      .maybeSingle();

    if (scheduleConfigError) {
      console.error('Error obteniendo configuración de max_arrivals_per_slot:', scheduleConfigError);
      // Continuar sin bloquear si no se puede obtener la configuración
    }

    // Validar max_arrivals_per_slot si está configurado
    if (scheduleConfig?.max_arrivals_per_slot !== null && scheduleConfig?.max_arrivals_per_slot !== undefined) {
      console.log('📊 Configuración de max_arrivals_per_slot encontrada:', {
        maxArrivals: scheduleConfig.max_arrivals_per_slot,
        slot: appointment_time,
        date: appointment_date
      });

      // Contar citas existentes en este slot exacto (excluyendo canceladas)
      const { count: slotAppointmentsCount, error: slotCountError } = await supabase
        .from('appointment')
        .select('*', { count: 'exact', head: true })
        .eq('appointment_date', appointment_date)
        .eq('appointment_time', appointment_time)
        .eq('dealership_id', finalDealershipId)
        .eq('workshop_id', finalWorkshopId)
        .neq('status', 'cancelled');

      if (slotCountError) {
        console.error('Error contando citas en el slot:', slotCountError);
        return NextResponse.json(
          { 
            message: 'Error verificando disponibilidad del horario. Por favor intenta nuevamente.',
            error_type: 'SLOT_COUNT_ERROR'
          },
          { status: 500 }
        );
      }

      const currentSlotCount = slotAppointmentsCount || 0;

      console.log('📊 Análisis de ocupación del slot:', {
        slot: appointment_time,
        date: appointment_date,
        currentAppointments: currentSlotCount,
        maxAllowed: scheduleConfig.max_arrivals_per_slot,
        wouldExceed: currentSlotCount >= scheduleConfig.max_arrivals_per_slot
      });

      // Verificar si el slot está lleno
      if (currentSlotCount >= scheduleConfig.max_arrivals_per_slot) {
        console.log('❌ Slot lleno - max_arrivals_per_slot excedido:', {
          slot: appointment_time,
          date: appointment_date,
          currentCount: currentSlotCount,
          maxAllowed: scheduleConfig.max_arrivals_per_slot,
          dealershipId: finalDealershipId,
          workshopId: finalWorkshopId
        });

        return NextResponse.json(
          { 
            message: `Cannot create appointment: This time slot (${appointment_time}) is full. Maximum arrivals allowed: ${scheduleConfig.max_arrivals_per_slot}, current appointments: ${currentSlotCount}`,
            error_type: 'SLOT_FULL',
            details: {
              time: appointment_time,
              date: appointment_date,
              currentAppointments: currentSlotCount,
              maxAllowed: scheduleConfig.max_arrivals_per_slot,
              solution: 'Please select a different time slot. Use GET /api/appointments/availability to find available slots.'
            }
          },
          { status: 409 }
        );
      }

      console.log('✅ Slot disponible:', {
        slot: appointment_time,
        currentCount: currentSlotCount,
        maxAllowed: scheduleConfig.max_arrivals_per_slot,
        remaining: scheduleConfig.max_arrivals_per_slot - currentSlotCount
      });
    } else {
      console.log('ℹ️ No hay límite de max_arrivals_per_slot configurado para este horario');
    }

    // 7. Crear la cita
    const { data: newAppointment, error: insertError } = await supabase
      .from('appointment')
      .insert([{
        client_id: finalClientId,
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
        removed_additional: removed_additional || false,  // ← NUEVO campo
        completion_notes: completion_notes || null,  // ← NUEVO campo
        assigned_mechanic_id: assigned_mechanic_id || null  // ← NUEVO campo
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
      
      // Manejo específico de errores de restricción única
      if (insertError.message.includes('appointment_vehicle_date_time_unique')) {
        return NextResponse.json(
          { 
            message: 'Cannot create appointment: This vehicle already has an appointment scheduled at this date and time',
            error_type: 'DUPLICATE_APPOINTMENT',
            solution: 'Choose a different time slot or date for this vehicle. Use GET /api/appointments/availability to find available slots.'
          },
          { status: 409 }
        );
      }

      // Manejo de otros errores de restricción única
      if (insertError.message.includes('duplicate key value violates unique constraint')) {
        return NextResponse.json(
          { 
            message: 'Cannot create appointment: Duplicate appointment detected',
            error_type: 'DUPLICATE_DATA',
            solution: 'This appointment may have already been created. Check existing appointments or try with different parameters.'
          },
          { status: 409 }
        );
      }

      // Manejo de errores de foreign key
      if (insertError.message.includes('foreign key constraint')) {
        return NextResponse.json(
          { 
            message: 'Cannot create appointment: One or more referenced records do not exist',
            error_type: 'INVALID_REFERENCES',
            solution: 'Verify that the client, vehicle, service, and dealership IDs are valid and exist in the database.'
          },
          { status: 400 }
        );
      }

      // Manejo de errores de validación
      if (insertError.message.includes('check constraint') || insertError.message.includes('validation')) {
        return NextResponse.json(
          { 
            message: 'Cannot create appointment: Invalid data format or validation failed',
            error_type: 'VALIDATION_ERROR',
            solution: 'Check that the date format is YYYY-MM-DD, time format is HH:MM:SS, and all required fields are provided.'
          },
          { status: 400 }
        );
      }

      // Error genérico
      return NextResponse.json(
        { 
          message: 'Failed to create appointment due to a database error',
          error_type: 'DATABASE_ERROR',
          solution: 'Please try again. If the problem persists, contact support.'
        },
        { status: 500 }
      );
    }

    // 🔍 LOG ESTRUCTURADO PARA TRAZABILIDAD DEL BACKOFFICE
    if (isBackofficeRequest && userInfo) {
      const structuredLog = {
        timestamp: new Date().toISOString(),
        action: 'appointment_created',
        source: 'backoffice',
        user: {
          email: userInfo.email,
          names: userInfo.names,
          surnames: userInfo.surnames,
          dealership_id: userInfo.dealership_id
        },
        appointment: {
          id: newAppointment?.id,
          client_id: finalClientId,
          vehicle_id: vehicle_id,
          service_id: finalServiceId,
          specific_service_id: specific_service_id || null,
          appointment_date: appointment_date,
          appointment_time: appointment_time,
          channel: channel,
          workshop_id: finalWorkshopId,
          assigned_mechanic_id: assigned_mechanic_id || null
        }
      };
      
      console.log('📊 [TRACE] Cita creada desde backoffice:', JSON.stringify(structuredLog, null, 2));
    } else {
      console.log('📊 [TRACE] Cita creada desde API externa');
    }

    // Logging de parámetros resueltos
    console.log('📅 Creando cita con parámetros resueltos:', {
      resolved_client_id: finalClientId,
      resolved_service_id: finalServiceId,
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
            client_id: finalClientId,
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