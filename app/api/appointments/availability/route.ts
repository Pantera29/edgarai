import { NextResponse } from 'next/server';
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { format, parse, addMinutes, isBefore } from 'date-fns';
import { zonedTimeToUtc, utcToZonedTime } from 'date-fns-tz';
import { resolveWorkshopId, getWorkshopConfiguration } from '@/lib/workshop-resolver';

/**
 * Endpoint de disponibilidad de citas
 * 
 * @param {string} date - Fecha en formato YYYY-MM-DD
 * @param {string} service_id - ID del servicio (UUID)
 * @param {string} specific_service_id - ID del servicio específico (UUID, alternativo a service_id)
 * @param {string} dealership_id - ID del concesionario (UUID)
 * @param {string} workshop_id - ID del taller (UUID, opcional)
 * @param {string} exclude_appointment_id - ID de la cita a excluir de la verificación (UUID, opcional)
 * 
 * @description
 * Este endpoint verifica la disponibilidad de horarios para un servicio en una fecha específica.
 * El parámetro exclude_appointment_id es útil para excluir una cita específica durante
 * operaciones de actualización, evitando que se considere como "ocupada" su propio horario.
 * 
 * @example
 * GET /api/appointments/availability?date=2024-01-15&service_id=uuid&dealership_id=uuid&exclude_appointment_id=uuid
 */

export async function GET(request: Request) {
  try {
    const supabase = createServerComponentClient({ cookies });
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const service_id = searchParams.get('service_id') || '';
    const specific_service_id = searchParams.get('specific_service_id') || '';
    const dealershipId = searchParams.get('dealership_id');
    const workshopId = searchParams.get('workshop_id');
    const excludeAppointmentId = searchParams.get('exclude_appointment_id'); // Optional: exclude specific appointment from availability check

    // Verificar si la solicitud viene del backoffice
    const isBackofficeRequest = request.headers.get('x-request-source') === 'backoffice';

    // Validación de fecha solo para solicitudes que no son del backoffice
    if (!isBackofficeRequest) {
      const selectedDate = new Date(date + 'T00:00:00');
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        return NextResponse.json({
          availableSlots: [],
          message: 'No se pueden crear citas en fechas pasadas'
        });
      }
    }

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
        console.log('✅ Service ID resuelto:', finalServiceId);
      } else {
        console.error('❌ Specific service not found or service_id not configured:', {
          specific_service_id,
          service_id,
          requestUrl: request.url,
          searchParams: Object.fromEntries(searchParams.entries())
        });
        
        return NextResponse.json(
          { 
            message: 'Specific service not found or service_id not configured. Please verify the specific_service_id exists and has a valid service_id configured.',
            error_code: 'SPECIFIC_SERVICE_NOT_FOUND',
            details: {
              specific_service_id,
              provided_service_id: service_id,
              suggestion: 'The provided specific_service_id does not exist or is not properly configured. You might be trying to use a service_id instead. Try using the service_id parameter if you have a service identifier, or verify the specific_service_id exists and has a valid service_id configured.',
              troubleshooting: [
                'You might be using a service_id value with the specific_service_id parameter. Try using service_id instead.',
                'Check if the specific_service_id exists in the specific_services table',
                'Verify the specific_service_id has a valid service_id configured',
                'If you have the service_id, use the service_id parameter instead of specific_service_id',
                'Confirm the specific service belongs to the correct dealership'
              ]
            }
          },
          { status: 404 }
        );
      }
    }

    if (!date || !finalServiceId || !dealershipId) {
      return NextResponse.json(
        { message: 'Date, service_id (or specific_service_id) and dealership_id parameters are required' },
        { status: 400 }
      );
    }

    // Log the exclude_appointment_id parameter for debugging
    if (excludeAppointmentId) {
      console.log('🔍 Excluding appointment from availability check:', excludeAppointmentId);
    }

    // 1. Obtener la duración del servicio y la configuración del taller
    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select(`
        duration_minutes, 
        daily_limit, 
        dealership_id, 
        service_name, 
        available_monday, 
        available_tuesday, 
        available_wednesday, 
        available_thursday, 
        available_friday, 
        available_saturday, 
        available_sunday,
        time_restriction_enabled,
        time_restriction_start_time,
        time_restriction_end_time
      `)
      .eq('id_uuid', finalServiceId)
      .single();

    if (serviceError || !service) {
      console.error('❌ Service not found or error fetching service:', {
        serviceId: finalServiceId,
        provided_service_id: service_id,
        provided_specific_service_id: specific_service_id,
        error: serviceError?.message,
        requestUrl: request.url,
        searchParams: Object.fromEntries(searchParams.entries())
      });
      
      return NextResponse.json(
        { 
          message: 'Service not found. The provided service_id does not exist in the database.',
          error_code: 'SERVICE_NOT_FOUND',
          details: {
            service_id: finalServiceId,
            provided_service_id: service_id,
            provided_specific_service_id: specific_service_id,
            error_type: 'SERVICE_NOT_FOUND',
            suggestion: service_id && !specific_service_id 
              ? 'The provided service_id does not exist. You might be trying to use a specific_service_id instead. Try using the specific_service_id parameter if you have a specific service identifier, or verify the service_id exists in the database.'
              : 'Please verify that the service_id is correct and exists in the database. If you are using specific_service_id, ensure it is properly configured with a valid service_id.',
            troubleshooting: [
              service_id && !specific_service_id 
                ? 'You might be using a specific_service_id value with the service_id parameter. Try using specific_service_id instead.'
                : 'Check if the service_id exists in the services table',
              'Verify the service_id format (should be a valid UUID)',
              'If using specific_service_id, ensure it has a valid service_id configured',
              'Confirm the service belongs to the correct dealership'
            ]
          }
        },
        { status: 404 }
      );
    }

    // VALIDACIÓN DE SEGURIDAD: Verificar que el servicio pertenece al concesionario
    if (service.dealership_id !== dealershipId) {
      console.error('❌ Service does not belong to dealership:', {
        serviceId: finalServiceId,
        serviceDealershipId: service.dealership_id,
        requestedDealershipId: dealershipId
      });
              return NextResponse.json(
          { 
            message: 'Service not found or not available for this dealership. Please verify the dealership ID is correct and that this service is configured for the specified dealership.',
            error_code: 'DEALERSHIP_SERVICE_MISMATCH',
            details: {
              service_id: finalServiceId,
              service_dealership_id: service.dealership_id,
              requested_dealership_id: dealershipId
            }
          },
          { status: 404 }
        );
    }

    // Resolver workshop_id automáticamente si no se proporciona
    console.log('🔍 Resolviendo workshop_id:', {
      dealershipId,
      providedWorkshopId: workshopId
    });
    
    const finalWorkshopId = await resolveWorkshopId(dealershipId, supabase, workshopId);
    
    console.log('✅ Workshop_id resuelto:', {
      finalWorkshopId,
      dealershipId
    });

    // ========================================
    // 🆕 SMART ROUTING: Detectar capacity_model y delegar si necesario
    // ========================================
    console.log('🔍 Detectando capacity_model del dealership...');

    const { data: dealership, error: dealershipError } = await supabase
      .from('dealerships')
      .select('capacity_model')
      .eq('id', dealershipId)
      .single();

    if (dealershipError) {
      console.error('❌ Error al obtener dealership:', dealershipError);
      // Continuar con lógica por defecto (physical_spaces) si hay error
    }

    // Si usa modelo de service advisors, delegar al endpoint especializado
    if (dealership?.capacity_model === 'service_advisors') {
      console.log('🔄 Dealership usa modelo SERVICE_ADVISORS - Delegando a /api/availability/advisors');
      
      try {
        // Construir URL del endpoint de advisors preservando todos los query params
        const protocol = request.url.startsWith('https') ? 'https' : 'http';
        const host = request.headers.get('host') || 'localhost:3000';
        const advisorEndpointUrl = new URL(`${protocol}://${host}/api/availability/advisors`);
        
        // Mapeo de parámetros snake_case -> camelCase para el endpoint de advisors
        const paramMapping: { [key: string]: string } = {
          'dealership_id': 'dealershipId',
          'workshop_id': 'workshopId',
          'service_id': 'serviceId',
          'date': 'date',
          'specific_service_id': 'specificServiceId',
          'exclude_appointment_id': 'excludeAppointmentId',
          'vehicle_make': 'vehicleMake',
          'vehicle_model': 'vehicleModel',
          'vehicle_id': 'vehicleId'
        };
        
        // Copiar y transformar los search params
        searchParams.forEach((value, key) => {
          const mappedKey = paramMapping[key] || key;
          advisorEndpointUrl.searchParams.set(mappedKey, value);
        });
        
        console.log('📞 Llamando a endpoint de advisors:', advisorEndpointUrl.toString());
        
        // Hacer request interno al nuevo endpoint
        const advisorResponse = await fetch(advisorEndpointUrl.toString(), {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!advisorResponse.ok) {
          const errorText = await advisorResponse.text();
          console.error('❌ Error en endpoint de advisors:', {
            status: advisorResponse.status,
            statusText: advisorResponse.statusText,
            error: errorText
          });
          return NextResponse.json(
            { 
              message: 'Error calculating availability with service advisors model',
              details: errorText 
            },
            { status: advisorResponse.status }
          );
        }
        
        const advisorData = await advisorResponse.json();
        console.log('✅ Respuesta de endpoint de advisors recibida exitosamente');
        
        // Retornar la respuesta del endpoint de advisors directamente
        return NextResponse.json(advisorData);
        
      } catch (fetchError) {
        console.error('❌ Error al llamar al endpoint de advisors:', fetchError);
        return NextResponse.json(
          { 
            message: 'Error connecting to service advisors endpoint',
            error: fetchError instanceof Error ? fetchError.message : 'Unknown error'
          },
          { status: 500 }
        );
      }
    }

    // ========================================
    // Si capacity_model es 'physical_spaces' o undefined/null,
    // continuar con la lógica actual de physical spaces
    // ========================================
    console.log('🔄 Dealership usa modelo PHYSICAL_SPACES - Usando lógica actual');

    // VALIDACIÓN DE SEGURIDAD: Verificar que el servicio está disponible para el taller específico
    const { data: workshopService, error: workshopServiceError } = await supabase
      .from('workshop_services')
      .select('is_available')
      .eq('workshop_id', finalWorkshopId)
      .eq('service_id', finalServiceId)
      .eq('is_available', true)
      .maybeSingle();

    if (workshopServiceError) {
      console.error('❌ Error checking workshop service availability:', {
        error: workshopServiceError.message,
        workshopId: finalWorkshopId,
        serviceId: finalServiceId
      });
      return NextResponse.json(
        { message: 'Error checking service availability for workshop' },
        { status: 500 }
      );
    }

    if (!workshopService) {
      console.error('❌ Service not available for workshop:', {
        serviceId: finalServiceId,
        workshopId: finalWorkshopId,
        dealershipId
      });
      return NextResponse.json(
        { 
          message: 'Service not available for this workshop. Please verify the workshop ID is correct and that this service is enabled for the selected workshop. Contact the client to confirm their preferred workshop location.',
          error_code: 'WORKSHOP_SERVICE_NOT_AVAILABLE',
          details: {
            service_id: finalServiceId,
            workshop_id: finalWorkshopId,
            dealership_id: dealershipId
          }
        },
        { status: 404 }
      );
    }

    console.log('✅ Servicio validado para el taller:', {
      serviceId: finalServiceId,
      workshopId: finalWorkshopId,
      isAvailable: workshopService.is_available
    });

    // Obtener configuración específica del taller
    console.log('🔍 Obteniendo configuración del taller:', {
      dealershipId,
      workshopId: finalWorkshopId
    });
    
    const dealershipConfig = await getWorkshopConfiguration(dealershipId, finalWorkshopId, supabase);

    console.log('📊 Configuración del taller obtenida:', {
      dealershipId,
      workshopId: finalWorkshopId,
      config: dealershipConfig
    });

    // Usar shift_duration de la configuración o 30 minutos por defecto
    const slotDuration = dealershipConfig?.shift_duration || 30;
    const timezone = dealershipConfig?.timezone || 'America/Mexico_City';

    // 🔄 Validar disponibilidad del servicio según el día de la semana
    // Obtener el día de la semana de la fecha solicitada (0=Domingo, 1=Lunes, ..., 6=Sábado)
    const selectedDateUtc = zonedTimeToUtc(`${date}T00:00:00`, timezone);
    const selectedDate = utcToZonedTime(selectedDateUtc, timezone);
    const jsDay = selectedDate.getDay();
    const dayMap = [
      'available_sunday',
      'available_monday',
      'available_tuesday',
      'available_wednesday',
      'available_thursday',
      'available_friday',
      'available_saturday'
    ];
    const availableField = dayMap[jsDay];
    if (!service[availableField as keyof typeof service]) {
      console.log('❌ Servicio no disponible este día:', { serviceId: finalServiceId, availableField });
      
      // Obtener el nombre del día en inglés
      const dayNames = [
        'Sunday',
        'Monday', 
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday'
      ];
      const dayName = dayNames[jsDay];
      
      // Buscar fechas alternativas donde el servicio esté disponible
      console.log('🔍 Servicio no disponible este día, buscando próximas fechas...');
      
      try {
        const nextAvailableDates = await findNextAvailableDatesSmart(
          date, finalServiceId, dealershipId, finalWorkshopId, supabase,
          {
            maxDays: 30,
            minDates: 1,
            maxDates: 1,
            includeToday: false
          }
        );
        
        if (nextAvailableDates.length > 0 && nextAvailableDates[0].timeSlots.length > 0) {
          const firstSlot = nextAvailableDates[0];
          return NextResponse.json({
            availableSlots: [],
            message: `The service "${service.service_name}" is not available on ${dayName}s.`,
            error_code: 'SERVICE_NOT_AVAILABLE_ON_DAY',
            nextAvailableSlot: {
              date: firstSlot.date,
              time: firstSlot.timeSlots[0],
              dayName: firstSlot.dayName,
              formattedDate: `${firstSlot.date.split('-').reverse().join('/')} (${firstSlot.dayName})`,
              formattedTime: firstSlot.timeSlots[0].slice(0, 5)
            },
            reason: 'SERVICE_NOT_AVAILABLE_ON_DAY',
            details: {
              service_id: finalServiceId,
              day: dayName
            },
            aiInstruction: `The next available appointment slot for this service is on ${firstSlot.date} at ${firstSlot.timeSlots[0].slice(0, 5)}. You can suggest this specific time slot to the user.`
          });
        } else {
          return NextResponse.json({
            availableSlots: [],
            message: `The service "${service.service_name}" is not available on ${dayName}s. Please select another day of the week or contact the workshop to verify service availability.`,
            error_code: 'SERVICE_NOT_AVAILABLE_ON_DAY',
            details: {
              service_id: finalServiceId,
              day: dayName
            }
          });
        }
      } catch (error) {
        console.error('❌ Error buscando próximas fechas para servicio no disponible:', error);
        return NextResponse.json({
          availableSlots: [],
          message: `The service "${service.service_name}" is not available on ${dayName}s. Please select another day of the week or contact the workshop to verify service availability.`,
          error_code: 'SERVICE_NOT_AVAILABLE_ON_DAY',
          details: {
            service_id: finalServiceId,
            day: dayName
          }
        });
      }
    }

    const serviceDuration = service.duration_minutes;

    // 2. Obtener el día de la semana (1-7, donde 1 es Domingo)
    // CORRECCIÓN FINAL: Construir y comparar fechas en la zona horaria del concesionario
    // (ya hecho arriba)
    const now = utcToZonedTime(new Date(), timezone);
    const isToday = selectedDate.getFullYear() === now.getFullYear() &&
                    selectedDate.getMonth() === now.getMonth() &&
                    selectedDate.getDate() === now.getDate();
    // Log detallado de comparación de fechas
    console.log('🕒 Comparación de fechas:', {
      now: now.toISOString(),
      selectedDate: selectedDate.toISOString(),
      nowDateString: now.toDateString(),
      selectedDateString: selectedDate.toDateString(),
      isToday
    });
    const dayOfWeek = jsDay === 0 ? 1 : jsDay + 1; // Convertir a 1-7 (Domingo-Sábado)

    console.log('Verificando disponibilidad:', {
      date,
      jsDay,
      dayOfWeek,
      dealershipId,
      jsDate: selectedDate.toISOString(),
      localDate: selectedDate.toLocaleString(),
      now: now.toISOString(),
      isToday
    });

    // 3. Obtener el horario de operación para ese día
    console.log('🔍 Consultando horarios para el concesionario:', {
      dealershipId,
      dayOfWeek,
      dealershipIdLength: dealershipId?.length,
      dealershipIdLastChars: dealershipId?.slice(-4)
    });

    // Primero, veamos todos los horarios del concesionario
    const { data: allSchedules, error: allSchedulesError } = await supabase
      .from('operating_hours')
      .select('*')
      .eq('dealership_id', dealershipId);

    console.log('📊 Todos los horarios del concesionario:', {
      schedules: allSchedules,
      error: allSchedulesError,
      query: {
        dealership_id: dealershipId,
        dealership_id_length: dealershipId?.length,
        dealership_id_last_chars: dealershipId?.slice(-4)
      }
    });

    // Ahora consultamos el horario específico para el taller
    let scheduleQuery = supabase
      .from('operating_hours')
      .select('*')
      .eq('day_of_week', dayOfWeek)
      .eq('dealership_id', dealershipId)
      .eq('workshop_id', finalWorkshopId);

    console.log('🔍 Consultando horario específico:', {
      dayOfWeek,
      dealershipId,
      workshopId: finalWorkshopId,
      query: {
        day_of_week: dayOfWeek,
        dealership_id: dealershipId,
        workshop_id: finalWorkshopId,
        dealership_id_length: dealershipId?.length,
        dealership_id_last_chars: dealershipId?.slice(-4)
      }
    });

    const { data: schedule, error: scheduleError } = await scheduleQuery.maybeSingle();

    console.log('📊 Resultado horario específico:', {
      schedule,
      error: scheduleError,
      query: {
        day_of_week: dayOfWeek,
        dealership_id: dealershipId
      }
    });

    if (scheduleError) {
      console.error('❌ Error al obtener horario:', {
        error: scheduleError.message,
        dayOfWeek,
        dealershipId
      });
      return NextResponse.json(
        { message: 'Error fetching operating hours' },
        { status: 500 }
      );
    }

    // Si no hay horario o el día no es laborable
    if (!schedule || !schedule.is_working_day) {
      console.log('Día no laborable:', {
        date,
        dayOfWeek,
        schedule,
        hasSchedule: !!schedule,
        isWorkingDay: schedule?.is_working_day,
        allSchedules: allSchedules
      });

      if (!allSchedules || allSchedules.length === 0) {
        return NextResponse.json({
          availableSlots: [],
          message: 'No hay horarios configurados para este concesionario. Por favor, configure los horarios de operación.'
        });
      }

      // Buscar fechas alternativas cuando no es día laborable
      console.log('🔍 Día no laborable, buscando próximas fechas...');
      
      try {
        const nextAvailableDates = await findNextAvailableDatesSmart(
          date, finalServiceId, dealershipId, finalWorkshopId, supabase,
          {
            maxDays: 30,
            minDates: 1,
            maxDates: 1,
            includeToday: false
          }
        );
        
        if (nextAvailableDates.length > 0 && nextAvailableDates[0].timeSlots.length > 0) {
          const firstSlot = nextAvailableDates[0];
          return NextResponse.json({
            availableSlots: [],
            message: `El día ${date.split('-').reverse().join('/')} no es un día laborable para este concesionario.`,
            nextAvailableSlot: {
              date: firstSlot.date,
              time: firstSlot.timeSlots[0],
              dayName: firstSlot.dayName,
              formattedDate: `${firstSlot.date.split('-').reverse().join('/')} (${firstSlot.dayName})`,
              formattedTime: firstSlot.timeSlots[0].slice(0, 5)
            },
            reason: 'NO_OPERATING_HOURS',
            aiInstruction: `The next available appointment slot is on ${firstSlot.date} at ${firstSlot.timeSlots[0].slice(0, 5)}. You can suggest this specific time slot to the user.`
          });
        } else {
          return NextResponse.json({
            availableSlots: [],
            message: `El día ${date.split('-').reverse().join('/')} no es un día laborable para este concesionario`
          });
        }
      } catch (error) {
        console.error('❌ Error buscando próximas fechas para día no laborable:', error);
        return NextResponse.json({
          availableSlots: [],
          message: `El día ${date.split('-').reverse().join('/')} no es un día laborable para este concesionario`
        });
      }
    }

    // 4. Verificar si el día está bloqueado
    let blockedQuery = supabase
      .from('blocked_dates')
      .select('*')
      .eq('date', date);
    
    // Filtrar por dealership_id si está disponible
    if (dealershipId) {
      blockedQuery = blockedQuery.eq('dealership_id', dealershipId);
    }

    // Ordenar para priorizar bloqueos de día completo y tomar solo el primero
    const { data: blockedDate, error: blockedError } = await blockedQuery
      .order('full_day', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (blockedError) {
      console.error('Error fetching blocked dates:', blockedError.message);
      return NextResponse.json(
        { message: 'Error fetching blocked dates' },
        { status: 500 }
      );
    }

    // Si el día está completamente bloqueado
    if (blockedDate?.full_day) {
      console.log('Día bloqueado encontrado:', {
        date,
        dealershipId,
        blockedDate
      });
      
      // Buscar fechas alternativas disponibles
      console.log('🔍 Día completamente bloqueado, buscando próximas fechas...');
      
      try {
        const nextAvailableDates = await findNextAvailableDatesSmart(
          date, finalServiceId, dealershipId, finalWorkshopId, supabase,
          {
            maxDays: 30,
            minDates: 1,
            maxDates: 1,
            includeToday: false
          }
        );
        
        if (nextAvailableDates.length > 0 && nextAvailableDates[0].timeSlots.length > 0) {
          const firstSlot = nextAvailableDates[0];
          return NextResponse.json({
            availableSlots: [],
            message: `This date (${date}) is not available for appointments. Reason: ${blockedDate.reason}.`,
            nextAvailableSlot: {
              date: firstSlot.date,
              time: firstSlot.timeSlots[0],
              dayName: firstSlot.dayName,
              formattedDate: `${firstSlot.date.split('-').reverse().join('/')} (${firstSlot.dayName})`,
              formattedTime: firstSlot.timeSlots[0].slice(0, 5)
            },
            blocked: true,
            reason: 'DAY_BLOCKED',
            date: date,
            aiInstruction: `The next available appointment slot is on ${firstSlot.date} at ${firstSlot.timeSlots[0].slice(0, 5)}. You can suggest this specific time slot to the user.`
          });
        } else {
          return NextResponse.json({
            availableSlots: [],
            message: `This date (${date}) is not available for appointments. Reason: ${blockedDate.reason}. Please try selecting a different date.`,
            blocked: true,
            reason: blockedDate.reason,
            date: date
          });
        }
      } catch (error) {
        console.error('❌ Error buscando próximas fechas para día bloqueado:', error);
        return NextResponse.json({
          availableSlots: [],
          message: `This date (${date}) is not available for appointments. Reason: ${blockedDate.reason}. Please try selecting a different date.`,
          blocked: true,
          reason: blockedDate.reason,
          date: date
        });
      }
    }

    // 4.5. NUEVA VALIDACIÓN: Verificar límite total de citas por día para la agencia
    console.log('🔍 Verificando límite total de citas por día...');
    
    // Buscar configuración de límite total para esta fecha y agencia
    let dailyTotalLimitQuery = supabase
      .from('blocked_dates')
      .select('max_total_appointments, reason')
      .eq('dealership_id', dealershipId)
      .eq('date', date);
    
    // Manejar workshop_id: si es null en BD, usar is('workshop_id', null)
    if (finalWorkshopId) {
      dailyTotalLimitQuery = dailyTotalLimitQuery.or(`workshop_id.eq.${finalWorkshopId},workshop_id.is.null`);
    } else {
      dailyTotalLimitQuery = dailyTotalLimitQuery.is('workshop_id', null);
    }
    
    const { data: dailyTotalLimit, error: dailyTotalLimitError } = await dailyTotalLimitQuery.maybeSingle();

    if (dailyTotalLimitError) {
      console.error('❌ Error verificando límite total diario:', dailyTotalLimitError.message);
    }

    // Si hay límite configurado para este día (NULL = sin límite, 0 = bloqueo completo, >0 = límite específico)
    if (dailyTotalLimit?.max_total_appointments !== null && dailyTotalLimit?.max_total_appointments !== undefined) {
      console.log('📊 Verificando límite total de citas:', {
        date,
        maxAllowed: dailyTotalLimit.max_total_appointments,
        reason: dailyTotalLimit.reason,
        dealershipId,
        workshopId: finalWorkshopId
      });

      // Contar todas las citas existentes para esta fecha
      const { data: existingAppointments, error: appointmentsError } = await supabase
        .from('appointment')
        .select('id, appointment_time')
        .eq('appointment_date', date)
        .eq('dealership_id', dealershipId)
        .eq('workshop_id', finalWorkshopId)
        .neq('status', 'cancelled');

      if (appointmentsError) {
        console.error('❌ Error contando citas existentes:', appointmentsError.message);
      } else {
        const totalAppointmentsForDate = existingAppointments?.length || 0;
        
        console.log('📊 Conteo de citas existentes:', {
          date,
          currentTotal: totalAppointmentsForDate,
          maxAllowed: dailyTotalLimit.max_total_appointments,
          reason: dailyTotalLimit.reason
        });

        if (totalAppointmentsForDate >= dailyTotalLimit.max_total_appointments) {
          console.log('❌ Límite total diario alcanzado:', {
            date,
            currentTotal: totalAppointmentsForDate,
            maxAllowed: dailyTotalLimit.max_total_appointments,
            reason: dailyTotalLimit.reason
          });
          // Buscar fechas alternativas cuando se alcanza el límite diario total
          console.log('🔍 Límite diario total alcanzado, buscando próximas fechas...');
          
          try {
            const nextAvailableDates = await findNextAvailableDatesSmart(
              date, finalServiceId, dealershipId, finalWorkshopId, supabase,
              {
                maxDays: 30,
                minDates: 1,
                maxDates: 1,
                includeToday: false
              }
            );
            
            if (nextAvailableDates.length > 0 && nextAvailableDates[0].timeSlots.length > 0) {
              const firstSlot = nextAvailableDates[0];
              return NextResponse.json({
                availableSlots: [],
                message: `This date (${date}) has reached the maximum limit of ${dailyTotalLimit.max_total_appointments} appointments. Reason: ${dailyTotalLimit.reason || 'Maximum appointments exceeded'}.`,
                nextAvailableSlot: {
                  date: firstSlot.date,
                  time: firstSlot.timeSlots[0],
                  dayName: firstSlot.dayName,
                  formattedDate: `${firstSlot.date.split('-').reverse().join('/')} (${firstSlot.dayName})`,
                  formattedTime: firstSlot.timeSlots[0].slice(0, 5)
                },
                limitReached: true,
                currentTotal: totalAppointmentsForDate,
                maxAllowed: dailyTotalLimit.max_total_appointments,
                reason: 'DAILY_TOTAL_LIMIT_REACHED',
                date: date,
                aiInstruction: `The next available appointment slot is on ${firstSlot.date} at ${firstSlot.timeSlots[0].slice(0, 5)}. You can suggest this specific time slot to the user.`
              });
            } else {
              return NextResponse.json({
                availableSlots: [],
                message: `This date (${date}) has reached the maximum limit of ${dailyTotalLimit.max_total_appointments} appointments. Reason: ${dailyTotalLimit.reason || 'Maximum appointments exceeded'}. Please try selecting a different date.`,
                limitReached: true,
                currentTotal: totalAppointmentsForDate,
                maxAllowed: dailyTotalLimit.max_total_appointments,
                reason: dailyTotalLimit.reason,
                date: date,
                aiInstruction: "To see available time slots for alternative dates, make a new request to the availability endpoint using a different date with the same service_id and dealership_id parameters."
              });
            }
          } catch (error) {
            console.error('❌ Error buscando próximas fechas para límite diario total:', error);
            return NextResponse.json({
              availableSlots: [],
              message: `This date (${date}) has reached the maximum limit of ${dailyTotalLimit.max_total_appointments} appointments. Reason: ${dailyTotalLimit.reason || 'Maximum appointments exceeded'}. Please try selecting a different date.`,
              limitReached: true,
              currentTotal: totalAppointmentsForDate,
              maxAllowed: dailyTotalLimit.max_total_appointments,
              reason: dailyTotalLimit.reason,
              date: date,
              aiInstruction: "To see available time slots for alternative dates, make a new request to the availability endpoint using a different date with the same service_id and dealership_id parameters."
            });
          }
        }
      }
    }

    // 4.6. Verificar bloqueos por modelo específico
    const vehicleMake = searchParams.get('vehicle_make');
    const vehicleModel = searchParams.get('vehicle_model');
    const vehicleId = searchParams.get('vehicle_id');
    
    // 🔄 NUEVO: Obtener datos del vehículo si se proporciona vehicle_id
    let finalVehicleMake = vehicleMake;
    let finalVehicleModel = vehicleModel;
    let finalVehicleModelId = null;
    
    if (vehicleId && (!vehicleMake || !vehicleModel)) {
      console.log('🔍 Obteniendo datos del vehículo desde vehicle_id:', vehicleId);
      
      const { data: vehicle, error: vehicleError } = await supabase
        .from('vehicles')
        .select('make, model, model_id')
        .eq('id_uuid', vehicleId)
        .single();
        
      if (vehicleError || !vehicle) {
        console.error('❌ Error obteniendo datos del vehículo:', vehicleError?.message);
        return NextResponse.json(
          { message: 'Vehicle not found or error fetching vehicle details' },
          { status: 404 }
        );
      }
      
      finalVehicleMake = vehicle.make;
      finalVehicleModel = vehicle.model;
      finalVehicleModelId = vehicle.model_id;
      
      console.log('✅ Datos del vehículo obtenidos:', {
        vehicleId,
        make: finalVehicleMake,
        model: finalVehicleModel,
        modelId: finalVehicleModelId
      });
    }
    
    if (finalVehicleMake && finalVehicleModel) {
      console.log('🔄 Verificando bloqueos por modelo:', {
        date,
        dealershipId,
        make: finalVehicleMake,
        model: finalVehicleModel,
        modelId: finalVehicleModelId,
        source: vehicleId ? 'vehicle_id' : 'direct_params',
        comparisonMethod: finalVehicleModelId ? 'model_id' : 'text'
      });

      // 🔄 NUEVO: Lógica de prioridad con fallback - usar model_id si está disponible, sino texto
      let modelBlock = null;
      let modelBlockError = null;
      let comparisonMethod = 'text';

      if (finalVehicleModelId) {
        // 🔄 PRIORIDAD 1: Buscar por model_id (más preciso)
        console.log('🎯 Buscando bloqueo por model_id:', finalVehicleModelId);
        
        const { data: modelIdBlock, error: modelIdError } = await supabase
          .from('model_blocked_dates')
          .select('*')
          .eq('dealership_id', dealershipId)
          .eq('model_id', finalVehicleModelId)
          .eq('is_active', true)
          .lte('start_date', date)
          .gte('end_date', date)
          .maybeSingle();

        if (modelIdError) {
          console.error('Error fetching model blocked dates by model_id:', modelIdError.message);
          return NextResponse.json(
            { message: 'Error checking model availability' },
            { status: 500 }
          );
        }

        if (modelIdBlock) {
          modelBlock = modelIdBlock;
          comparisonMethod = 'model_id';
          console.log('✅ Bloqueo encontrado por model_id');
        } else {
          // 🔄 FALLBACK: Si no encuentra por model_id, buscar por texto
          console.log('🔄 No se encontró bloqueo por model_id, intentando por texto...');
          
          const { data: textBlock, error: textError } = await supabase
            .from('model_blocked_dates')
            .select('*')
            .eq('dealership_id', dealershipId)
            .eq('make', finalVehicleMake.trim())
            .eq('model', finalVehicleModel.trim())
            .eq('is_active', true)
            .lte('start_date', date)
            .gte('end_date', date)
            .maybeSingle();

          if (textError) {
            console.error('Error fetching model blocked dates by text:', textError.message);
            return NextResponse.json(
              { message: 'Error checking model availability' },
              { status: 500 }
            );
          }

          if (textBlock) {
            modelBlock = textBlock;
            comparisonMethod = 'text_fallback';
            console.log('✅ Bloqueo encontrado por fallback de texto');
          } else {
            console.log('✅ No se encontró bloqueo ni por model_id ni por texto');
          }
        }
      } else {
        // 🔄 PRIORIDAD 2: Solo comparar por texto (compatibilidad)
        console.log('📝 Buscando bloqueo por texto:', { make: finalVehicleMake, model: finalVehicleModel });
        
        const { data: textBlock, error: textError } = await supabase
          .from('model_blocked_dates')
          .select('*')
          .eq('dealership_id', dealershipId)
          .eq('make', finalVehicleMake.trim())
          .eq('model', finalVehicleModel.trim())
          .eq('is_active', true)
          .lte('start_date', date)
          .gte('end_date', date)
          .maybeSingle();

        if (textError) {
          console.error('Error fetching model blocked dates by text:', textError.message);
          return NextResponse.json(
            { message: 'Error checking model availability' },
            { status: 500 }
          );
        }

        if (textBlock) {
          modelBlock = textBlock;
          comparisonMethod = 'text';
          console.log('✅ Bloqueo encontrado por texto');
        } else {
          console.log('✅ No se encontró bloqueo por texto');
        }
      }

      if (modelBlock) {
        console.log('❌ Modelo bloqueado encontrado:', {
          date,
          dealershipId,
          make: finalVehicleMake,
          model: finalVehicleModel,
          modelId: finalVehicleModelId,
          reason: modelBlock.reason,
          vehicleId,
          comparisonMethod: comparisonMethod
        });
        return NextResponse.json({
          availableSlots: [],
          message: `Vehicle model ${finalVehicleMake} ${finalVehicleModel} is not available for service on this date: ${modelBlock.reason}`,
          error_code: 'MODEL_BLOCKED',
          details: {
            make: finalVehicleMake,
            model: finalVehicleModel,
            model_id: finalVehicleModelId,
            reason: modelBlock.reason,
            block_id: modelBlock.id,
            vehicle_id: vehicleId,
            comparison_method: comparisonMethod
          }
        });
      }

      console.log('✅ Modelo disponible para la fecha:', {
        date,
        make: finalVehicleMake,
        model: finalVehicleModel,
        modelId: finalVehicleModelId,
        vehicleId,
        comparisonMethod: comparisonMethod
      });
    }

    // 5. Obtener citas existentes para ese día y taller específico
    console.log('🔍 Consultando citas existentes:', {
      date,
      dealershipId,
      workshopId: finalWorkshopId
    });

    // Obtener citas filtradas por dealership_id y workshop_id específico
    // Excluir citas canceladas para no afectar la disponibilidad de slots
    // Excluir cita específica si se proporciona exclude_appointment_id (útil para updates)
    let appointmentsQuery = supabase
      .from('appointment')
      .select(`
        id,
        appointment_date,
        appointment_time,
        service_id,
        services (
          duration_minutes
        ),
        client_id
      `)
      .eq('appointment_date', date)
      .eq('dealership_id', dealershipId)
      .eq('workshop_id', finalWorkshopId)
      .neq('status', 'cancelled');

    // Excluir cita específica si se proporciona exclude_appointment_id
    if (excludeAppointmentId) {
      appointmentsQuery = appointmentsQuery.neq('id', excludeAppointmentId);
      console.log('🔍 Excluyendo cita de la verificación de disponibilidad:', excludeAppointmentId);
    }

    const { data: appointments, error: appointmentsError } = await appointmentsQuery;

    if (appointmentsError) {
      console.error('Error fetching appointments:', {
        error: appointmentsError.message,
        details: appointmentsError.details,
        hint: appointmentsError.hint
      });
      return NextResponse.json(
        { message: 'Error fetching appointments' },
        { status: 500 }
      );
    }

    console.log('📊 Citas encontradas:', {
      count: appointments?.length || 0,
      appointments: appointments?.map(app => ({
        id: app.id,
        service_id: app.service_id,
        appointment_time: app.appointment_time,
        client_id: app.client_id
      })) || []
    });

    // Validación de límite diario por servicio
    if (service.daily_limit) {
      console.log('🔍 Validando límite diario:', {
        dailyLimit: service.daily_limit,
        serviceId: finalServiceId,
        totalAppointments: appointments?.length || 0
      });
      
      const sameServiceAppointments = appointments?.filter(app => 
        app.service_id === finalServiceId
      ) || [];
      
      console.log('📊 Citas del mismo servicio:', {
        serviceId: finalServiceId,
        sameServiceAppointments: sameServiceAppointments.length,
        appointments: sameServiceAppointments.map(app => ({
          id: app.id,
          service_id: app.service_id,
          appointment_time: app.appointment_time,
          client_id: app.client_id
        }))
      });
      
      if (sameServiceAppointments.length >= service.daily_limit) {
        console.log('❌ Límite diario alcanzado para el servicio:', {
          serviceId: finalServiceId,
          dailyLimit: service.daily_limit,
          appointmentsCount: sameServiceAppointments.length
        });
        
        // Buscar próximas fechas disponibles cuando se alcanza el límite diario
        console.log('🔍 Límite diario alcanzado, buscando próximas fechas...');
        
        try {
          const nextAvailableDates = await findNextAvailableDatesSmart(
            date, finalServiceId, dealershipId, finalWorkshopId, supabase,
            {
              maxDays: 30,
              minDates: 1,
              maxDates: 1,
              includeToday: false
            }
          );
          
          if (nextAvailableDates.length > 0 && nextAvailableDates[0].timeSlots.length > 0) {
            const firstSlot = nextAvailableDates[0];
            return NextResponse.json({
              availableSlots: [],
              totalSlots: 0,
              message: getUnavailabilityMessage('DAILY_LIMIT_REACHED'),
              nextAvailableSlot: {
                date: firstSlot.date,
                time: firstSlot.timeSlots[0],
                dayName: firstSlot.dayName,
                formattedDate: `${firstSlot.date.split('-').reverse().join('/')} (${firstSlot.dayName})`,
                formattedTime: firstSlot.timeSlots[0].slice(0, 5)
              },
              reason: 'DAILY_LIMIT_REACHED',
              aiInstruction: `The next available appointment slot is on ${firstSlot.date} at ${firstSlot.timeSlots[0].slice(0, 5)}. You can suggest this specific time slot to the user.`
            });
          } else {
            return NextResponse.json({
              availableSlots: [],
              totalSlots: 0,
              message: getUnavailabilityMessage('DAILY_LIMIT_REACHED'),
              reason: 'DAILY_LIMIT_REACHED'
            });
          }
        } catch (error) {
          console.error('❌ Error buscando próximas fechas:', error);
          return NextResponse.json({ 
            availableSlots: [],
            totalSlots: 0,
            message: `No availability for the requested date. The daily limit for this service has been reached (${service.daily_limit} appointments per day). Here are alternative dates with availability:`
          });
        }
      }
    }

    // 6. Generar slots de tiempo disponibles
    // Generar slots disponibles usando reception_end_time específico por día
    const availableSlots = generateTimeSlots(
      date,
      schedule,
      blockedDate,
      appointments || [],
      serviceDuration,
      schedule.max_simultaneous_services,
      slotDuration,
      schedule.reception_end_time, // ← NUEVO: Usar reception_end_time específico del día
      timezone,
      dealershipConfig?.custom_morning_slots,
      dealershipConfig?.regular_slots_start_time,
      schedule.max_arrivals_per_slot,
      isToday,
      service // Pasar el servicio completo para validar restricciones
    );

    // Justo antes del return final, loguear los slots generados y el valor de isToday
    console.log('✅ Slots a retornar:', { availableSlots, isToday });
    
    // Si no hay slots disponibles, buscar próximas fechas disponibles
    if (availableSlots.length === 0) {
      console.log('🔍 No hay disponibilidad, buscando próximas fechas...');
      
      try {
        const nextAvailableDates = await findNextAvailableDatesSmart(
          date, finalServiceId, dealershipId, finalWorkshopId, supabase,
          {
            maxDays: 30,
            minDates: 1,
            maxDates: 1,
            includeToday: false
          }
        );
        
        // Determinar el motivo de la indisponibilidad
        let reason = 'CAPACITY_FULL';
        if (!schedule || !schedule.is_working_day) {
          reason = 'NO_OPERATING_HOURS';
        } else if (blockedDate?.full_day) {
          reason = 'DAY_BLOCKED';
        } else if (service.daily_limit) {
          // Verificar límite diario
          const sameServiceAppointments = appointments?.filter(app => 
            app.service_id === finalServiceId
          ) || [];
          if (sameServiceAppointments.length >= service.daily_limit) {
            reason = 'DAILY_LIMIT_REACHED';
          }
        }
        
        if (nextAvailableDates.length > 0 && nextAvailableDates[0].timeSlots.length > 0) {
          const firstSlot = nextAvailableDates[0];
          return NextResponse.json({
            availableSlots: [],
            totalSlots: 0,
            message: getUnavailabilityMessage(reason),
            nextAvailableSlot: {
              date: firstSlot.date,
              time: firstSlot.timeSlots[0],
              dayName: firstSlot.dayName,
              formattedDate: `${firstSlot.date.split('-').reverse().join('/')} (${firstSlot.dayName})`,
              formattedTime: firstSlot.timeSlots[0].slice(0, 5)
            },
            reason,
            aiInstruction: `The next available appointment slot is on ${firstSlot.date} at ${firstSlot.timeSlots[0].slice(0, 5)}. You can suggest this specific time slot to the user.`
          });
        } else {
          return NextResponse.json({
            availableSlots: [],
            totalSlots: 0,
            message: getUnavailabilityMessage(reason),
            reason,
            aiInstruction: "No availability was found in the next 30 days. Please contact the dealership directly for additional scheduling options."
          });
        }
      } catch (error) {
        console.error('❌ Error buscando próximas fechas:', error);
        // Si falla la búsqueda de próximas fechas, retornar respuesta básica
        return NextResponse.json({
          availableSlots: [],
          totalSlots: 0,
          message: 'No availability for the selected date. Here are alternative dates with availability:'
        });
      }
    }
    
    // Calcular el nombre del día en español
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const dayName = dayNames[jsDay];

    return NextResponse.json({ 
      availableSlots,
      totalSlots: availableSlots.length,
      dayName
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { 
        message: error instanceof Error ? error.message : 'Internal server error',
        error_details: error instanceof Error ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// Función para generar slots de tiempo disponibles
function generateTimeSlots(
  date: string,
  schedule: any,
  blockedDate: any,
  appointments: any[],
  serviceDuration: number,
  maxSimultaneous: number,
  slotDuration: number,
  receptionEndTime: string | null,
  timezone: string,
  customMorningSlots: string[] | null = null,
  regularSlotsStartTime: string | null = null,
  maxArrivalsPerSlot: number | null = null,
  isToday: boolean,
  service: any = null // Nuevo parámetro para el servicio
) {
  // Eliminar cálculo interno de isToday
  // const now = new Date();
  // const selectedDate = new Date(date + 'T00:00:00');
  // const isToday = selectedDate.toDateString() === now.toDateString();

  // Convertir la hora actual a la zona horaria del concesionario
  const now = new Date();
  // Obtener la hora local real en la zona horaria del concesionario
  const currentTimeInDealershipTz = utcToZonedTime(now, timezone);
  // Formatear correctamente la hora local
  const { format } = require('date-fns-tz');
  const currentTimeStr = format(currentTimeInDealershipTz, 'HH:mm:ss', { timeZone: timezone });

  console.log('📋 Información del servicio:', {
    serviceId: service?.id_uuid,
    serviceName: service?.service_name,
    durationMinutes: service?.duration_minutes,
    dailyLimit: service?.daily_limit,
    hasTimeRestrictions: service?.time_restriction_enabled,
    timeRestrictionStart: service?.time_restriction_start_time,
    timeRestrictionEnd: service?.time_restriction_end_time
  });

  console.log('Tiempo actual en zona horaria del concesionario:', {
    currentTimeStr,
    timezone,
    isToday
  });

  // 1. Calcular tiempo total disponible en minutos
  const openingMinutes = timeToMinutes(schedule.opening_time);
  const closingMinutes = timeToMinutes(schedule.closing_time);
  const totalMinutesAvailable = (closingMinutes - openingMinutes) * maxSimultaneous;

  // 2. Calcular tiempo total ya ocupado por citas existentes
  const totalMinutesBooked = appointments.reduce((total, app) => {
    return total + (app.services?.duration_minutes || 60);
  }, 0);

  // 3. Calcular tiempo restante disponible
  const remainingMinutesAvailable = totalMinutesAvailable - totalMinutesBooked;

  // 4. Log para debugging
  console.log('Análisis de capacidad total:', {
    totalMinutesAvailable,
    totalMinutesBooked,
    remainingMinutesAvailable,
    serviceDuration,
    canFitAdditionalService: remainingMinutesAvailable >= serviceDuration
  });

  // NUEVO: Procesar slots custom de mañana si existen
  const customSlotsToProcess: string[] = [];
  if (customMorningSlots && Array.isArray(customMorningSlots)) {
    const openingMinutes = timeToMinutes(schedule.opening_time);
    
    for (const customSlot of customMorningSlots) {
      const customSlotMinutes = timeToMinutes(customSlot);
      
      // Solo incluir si la agencia ya está abierta a esa hora
      if (customSlotMinutes >= openingMinutes) {
        customSlotsToProcess.push(customSlot);
      } else {
        console.log('Slot custom descartado (agencia cerrada):', {
          slot: customSlot,
          openingTime: schedule.opening_time,
          customSlotMinutes,
          openingMinutes
        });
      }
    }
    
    console.log('Slots custom a procesar:', {
      originalSlots: customMorningSlots,
      validSlots: customSlotsToProcess,
      openingTime: schedule.opening_time
    });
  }

  const slots: { time: string; available: number }[] = [];
  const availableSlots: string[] = [];
  
  // Determinar desde dónde empezar la lógica regular
  let regularStartTime;
  if (customSlotsToProcess.length > 0 && regularSlotsStartTime) {
    // Si hay slots custom Y está configurado regular_slots_start_time, usarlo
    regularStartTime = parse(regularSlotsStartTime, 'HH:mm:ss', new Date());
    console.log('Usando regular_slots_start_time configurado:', {
      regularSlotsStartTime,
      customSlotsCount: customSlotsToProcess.length
    });
  } else {
    // Si no hay slots custom O no está configurado, usar opening_time normal
    regularStartTime = parse(schedule.opening_time, 'HH:mm:ss', new Date());
    console.log('Usando opening_time normal:', {
      openingTime: schedule.opening_time,
      hasCustomSlots: customSlotsToProcess.length > 0,
      hasRegularStartTime: !!regularSlotsStartTime
    });
  }
  
  const endTime = parse(schedule.closing_time, 'HH:mm:ss', new Date());
  
  // NUEVO: Procesar slots custom válidos
  for (const customSlot of customSlotsToProcess) {
    // Verificar si el slot está bloqueado
    const isBlocked = blockedDate?.blocked_slots?.includes(customSlot);
    if (isBlocked) {
      console.log('Slot custom bloqueado:', customSlot);
      continue;
    }
    
    // Si es el día actual, verificar si el horario ya pasó
    if (isToday) {
      const slotMinutes = timeToMinutes(customSlot);
      const currentMinutes = timeToMinutes(currentTimeStr);
      
      if (slotMinutes <= currentMinutes) {
        console.log('Slot custom ya pasó:', {
          slot: customSlot,
          currentTime: currentTimeStr
        });
        continue;
      }
    }
    
    // Si hay horario de recepción, verificar que el slot no esté después
    if (receptionEndTime) {
      const slotTime = timeToMinutes(customSlot);
      const receptionEndMinutes = timeToMinutes(receptionEndTime);
      
      if (slotTime > receptionEndMinutes) {
        console.log('Slot custom después de horario de recepción:', {
          slot: customSlot,
          receptionEndTime
        });
        continue;
      }
    }
    
    // Verificar si el servicio cabe en el horario de cierre
    const slotStartTime = parse(customSlot, 'HH:mm:ss', new Date());
    const slotEndTime = addMinutes(slotStartTime, serviceDuration);
    const closingTime = parse(schedule.closing_time, 'HH:mm:ss', new Date());
    
    if (!isBefore(slotEndTime, closingTime)) {
      console.log('Servicio no cabe en slot custom:', {
        slot: customSlot,
        serviceDuration,
        closingTime: schedule.closing_time
      });
      continue;
    }
    
    // NUEVO: Validar política de llegadas (slots exactos)
    let exactSlotAppointments: any[] = [];
    if (maxArrivalsPerSlot !== null) {
      exactSlotAppointments = appointments.filter(app => 
        app.appointment_time === customSlot
      );
      
      if (exactSlotAppointments.length >= maxArrivalsPerSlot) {
        console.log('Slot custom lleno por política de llegadas:', {
          slot: customSlot,
          exactAppointments: exactSlotAppointments.length,
          maxArrivalsPerSlot
        });
        continue;
      }
    }
    
    // Verificar capacidad total del día (sin solapamiento)
    const totalMinutesAvailable = (closingMinutes - openingMinutes) * maxSimultaneous;
    const totalMinutesBooked = appointments.reduce((total, app) => {
      return total + (app.services?.duration_minutes || 60);
    }, 0);
    const remainingMinutesAvailable = totalMinutesAvailable - totalMinutesBooked;

    // 🔄 NUEVO: Validar restricciones de horario específicas del servicio para slots custom
    let shouldAddSlot = remainingMinutesAvailable >= serviceDuration;
    if (shouldAddSlot && service?.time_restriction_enabled) {
      const slotTimeMinutes = timeToMinutes(customSlot);
      const restrictionStartMinutes = timeToMinutes(service.time_restriction_start_time);
      const restrictionEndMinutes = timeToMinutes(service.time_restriction_end_time);
      
      // Verificar si el slot está dentro del rango permitido
      if (slotTimeMinutes < restrictionStartMinutes || slotTimeMinutes > restrictionEndMinutes) {
        console.log('Slot custom descartado por restricción de horario:', {
          slot: customSlot,
          serviceName: service.service_name,
          restrictionStart: service.time_restriction_start_time,
          restrictionEnd: service.time_restriction_end_time,
          slotMinutes: slotTimeMinutes,
          restrictionStartMinutes,
          restrictionEndMinutes
        });
        shouldAddSlot = false;
      }
    }

    if (shouldAddSlot) {
      availableSlots.push(customSlot);
      console.log('Slot custom agregado:', {
        slot: customSlot,
        totalMinutesAvailable,
        totalMinutesBooked,
        remainingMinutesAvailable,
        serviceDuration,
        maxArrivalsPerSlot,
        exactSlotAppointments: maxArrivalsPerSlot !== null ? exactSlotAppointments.length : 'N/A',
        hasTimeRestrictions: service?.time_restriction_enabled || false
      });
    } else {
      console.log('Slot custom OCUPADO por capacidad total del día o restricciones:', {
        slot: customSlot,
        totalMinutesAvailable,
        totalMinutesBooked,
        remainingMinutesAvailable,
        serviceDuration,
        hasTimeRestrictions: service?.time_restriction_enabled || false
      });
    }
  }
  
  // Generamos slots desde la apertura hasta el cierre
  console.log('🔄 Iniciando generación de slots regulares:', {
    regularStartTime: format(regularStartTime, 'HH:mm:ss'),
    endTime: format(endTime, 'HH:mm:ss'),
    slotDuration,
    maxSimultaneous,
    serviceDuration
  });
  
  let currentTime = regularStartTime;
  while (currentTime < endTime) {
    const timeStr = format(currentTime, 'HH:mm:ss');
    
    console.log('🔄 Generando slot regular:', {
      timeStr,
      currentTime: format(currentTime, 'HH:mm:ss'),
      slotDuration,
      endTime: format(endTime, 'HH:mm:ss')
    });
    
    // Verificar si el slot está bloqueado
    const isBlocked = isTimeBlocked(timeStr, blockedDate);
    
    // Verificar capacidad total del día
    const totalMinutesAvailable = (closingMinutes - openingMinutes) * maxSimultaneous;
    const totalMinutesBooked = appointments.reduce((total, app) => {
      return total + (app.services?.duration_minutes || 60);
    }, 0);
    const remainingMinutesAvailable = totalMinutesAvailable - totalMinutesBooked;

    console.log('📊 Análisis de capacidad total:', {
      slot: timeStr,
      totalMinutesAvailable,
      totalMinutesBooked,
      remainingMinutesAvailable,
      serviceDuration,
      hasCapacity: remainingMinutesAvailable >= serviceDuration
    });

    // Verificar si hay capacidad total disponible
    const hasCapacity = remainingMinutesAvailable >= serviceDuration;
    const available = isBlocked ? 0 : (hasCapacity ? 1 : 0);
    
    slots.push({ time: timeStr, available });
    
    // Avanzar al siguiente slot
    currentTime = addMinutes(currentTime, slotDuration);
  }

  // Verificar disponibilidad para cada slot
  console.log('🔍 Iniciando validación de slots generados:', {
    totalSlots: slots.length,
    slots: slots.map(s => ({ time: s.time, available: s.available }))
  });
  
  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i];
    
    console.log('✅ Validando slot:', {
      slot: slot.time,
      available: slot.available,
      maxSimultaneous
    });
    
    let exactSlotAppointments = [];
    if (maxArrivalsPerSlot !== null) {
      exactSlotAppointments = appointments.filter(app => 
        app.appointment_time === slot.time
      );
    }
    // Verificar capacidad total del día (ya calculada en la generación de slots)
    const totalMinutesAvailable = (closingMinutes - openingMinutes) * maxSimultaneous;
    const totalMinutesBooked = appointments.reduce((total, app) => {
      return total + (app.services?.duration_minutes || 60);
    }, 0);
    const remainingMinutesAvailable = totalMinutesAvailable - totalMinutesBooked;
    const hasCapacity = remainingMinutesAvailable >= serviceDuration;
    
    // Si el slot está bloqueado (available: 0), no tiene capacidad
    const isSlotBlocked = slot.available === 0;

    console.log('🔍 Análisis detallado de slot:', {
      slot: slot.time,
      serviceDuration,
      totalMinutesAvailable,
      totalMinutesBooked,
      remainingMinutesAvailable,
      hasCapacity,
      exactSlotAppointments: exactSlotAppointments.length,
      maxArrivalsPerSlot
    });

    // Si es el día actual, verificar si el horario ya pasó
    if (isToday) {
      const slotMinutes = timeToMinutes(slot.time);
      const currentMinutes = timeToMinutes(currentTimeStr);
      if (slotMinutes <= currentMinutes) {
        console.log('⏰ Slot descartado por ya haber pasado:', {
          slot: slot.time,
          slotMinutes,
          currentMinutes,
          currentTime: currentTimeStr
        });
        continue; // Saltar slots que ya pasaron
      }
    }

    // Si hay un horario de recepción configurado, verificar que el slot no esté después
    if (receptionEndTime) {
      const slotTime = timeToMinutes(slot.time);
      const receptionEndMinutes = timeToMinutes(receptionEndTime);
      if (slotTime > receptionEndMinutes) {
        console.log('🚫 Slot descartado por horario de recepción:', {
          slot: slot.time,
          slotTime,
          receptionEndTime,
          receptionEndMinutes
        });
        continue;
      }
    }

    const slotStartTime = parse(slot.time, 'HH:mm:ss', new Date());
    const slotEndTime = addMinutes(slotStartTime, serviceDuration);
    const closingTime = parse(schedule.closing_time, 'HH:mm:ss', new Date());
    if (!isBefore(slotEndTime, closingTime)) {
      console.log('⏰ Slot descartado por no caber en horario:', {
        slot: slot.time,
        slotEndTime: format(slotEndTime, 'HH:mm:ss'),
        closingTime: format(closingTime, 'HH:mm:ss'),
        serviceDuration
      });
      continue; // No cabe en el horario de operación
    }

    // Verificar política de llegadas por slot
    if (maxArrivalsPerSlot !== null) {
      if (exactSlotAppointments.length >= maxArrivalsPerSlot) {
        console.log('👥 Slot descartado por política de llegadas:', {
          slot: slot.time,
          exactSlotAppointments: exactSlotAppointments.length,
          maxArrivalsPerSlot,
          appointments: exactSlotAppointments.map(app => ({
            time: app.appointment_time,
            serviceId: app.service_id
          }))
        });
        continue;
      }
    }

    // Verificar capacidad total del día (ya calculada arriba)
    if (!hasCapacity) {
      console.log('🚫 Slot descartado por falta de capacidad total:', {
        slot: slot.time,
        remainingMinutesAvailable,
        serviceDuration
      });
      continue;
    }

    // 🔄 NUEVO: Validar restricciones de horario específicas del servicio
    if (service?.time_restriction_enabled) {
      const slotTimeMinutes = timeToMinutes(slot.time);
      const restrictionStartMinutes = timeToMinutes(service.time_restriction_start_time);
      const restrictionEndMinutes = timeToMinutes(service.time_restriction_end_time);
      
      // Verificar si el slot está dentro del rango permitido
      if (slotTimeMinutes < restrictionStartMinutes || slotTimeMinutes > restrictionEndMinutes) {
        console.log('🔒 Slot descartado por restricción de horario:', {
          slot: slot.time,
          serviceName: service.service_name,
          restrictionStart: service.time_restriction_start_time,
          restrictionEnd: service.time_restriction_end_time,
          slotMinutes: slotTimeMinutes,
          restrictionStartMinutes,
          restrictionEndMinutes
        });
        continue; // Saltar este slot
      }
    }

    // Verificar si el slot está bloqueado antes de agregarlo
    if (isSlotBlocked) {
      console.log('🚫 Slot descartado por estar bloqueado:', {
        slot: slot.time,
        reason: 'Slot marcado como no disponible por bloqueo de horario'
      });
      continue;
    }

    console.log('✅ Slot agregado como disponible:', {
      slot: slot.time,
      hasCapacity,
      remainingMinutesAvailable,
      serviceDuration
    });

    availableSlots.push(slot.time);
  }

  // NUEVO: Si después de verificar todos los slots, no hay ninguno disponible pero hay capacidad total
  if (availableSlots.length === 0 && remainingMinutesAvailable >= serviceDuration && receptionEndTime) {
    // Calcular el horario máximo de recepción como un slot disponible
    const receptionEndMinutes = timeToMinutes(receptionEndTime);
    const currentMinutes = timeToMinutes(currentTimeStr);
    
    // Solo agregar el último slot si no ha pasado
    if (receptionEndMinutes > currentMinutes) {
      // Determinar si el servicio cabe si comienza en el horario máximo de recepción
      const serviceEndMinutes = receptionEndMinutes + serviceDuration;
      if (serviceEndMinutes <= closingMinutes) {
        // 🔧 FIX: Verificar si ya hay una cita en el horario exacto de recepción
        const exactReceptionTimeAppointments = appointments.filter(app => 
          app.appointment_time === receptionEndTime
        );

        if (exactReceptionTimeAppointments.length > 0) {
          console.log('🚫 No se puede forzar el último slot de recepción porque ya hay una cita:', {
            receptionEndTime,
            existingAppointments: exactReceptionTimeAppointments.length,
            appointments: exactReceptionTimeAppointments.map(app => ({
              id: app.id,
              time: app.appointment_time,
              client_id: app.client_id
            })),
            remainingMinutesAvailable,
            serviceDuration
          });
          // No agregar el slot, dejar availableSlots vacío
        } else {
          console.log('✅ Forzando disponibilidad del último slot de recepción (sin conflictos):', {
            slot: receptionEndTime,
            remainingMinutesAvailable,
            serviceDuration,
            currentTime: currentTimeStr,
            isPast: false
          });
          
          // Añadir el horario máximo de recepción como disponible
          availableSlots.push(receptionEndTime);
        }
      }
    } else {
      console.log('No se puede forzar el último slot de recepción porque ya pasó:', {
        receptionEndTime,
        currentTime: currentTimeStr,
        isPast: true
      });
    }
  }

  return availableSlots;
}

// Función para verificar si un horario está bloqueado
function isTimeBlocked(time: string, blockedDate: any) {
  if (!blockedDate || blockedDate.full_day) {
    return blockedDate ? true : false;
  }
  
  // Si no hay start_time o end_time, no está bloqueado por rango
  if (!blockedDate.start_time || !blockedDate.end_time) {
    return false;
  }
  
  // Convertir a minutos para comparación correcta
  const timeMinutes = timeToMinutes(time);
  const startMinutes = timeToMinutes(blockedDate.start_time);
  const endMinutes = timeToMinutes(blockedDate.end_time);
  
  return timeMinutes >= startMinutes && timeMinutes <= endMinutes;
}



// Función auxiliar para convertir hora (HH:mm:ss) a minutos desde medianoche
function timeToMinutes(timeStr: string) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

// Función para verificar si un servicio puede caber completamente en el horario
function canFitService(
  startTime: Date,
  endTime: Date,
  serviceDuration: number
) {
  const serviceEndTime = addMinutes(startTime, serviceDuration);
  return isBefore(serviceEndTime, endTime);
}

// ============================================================================
// FUNCIONES AUXILIARES PARA BÚSQUEDA INTELIGENTE DE FECHAS DISPONIBLES
// ============================================================================

// Función para calcular cuántos días saltar basado en la disponibilidad del servicio
function calculateDaysToSkip(
  currentDate: Date, 
  service: any
): number {
  const dayOfWeek = currentDate.getDay(); // 0=Domingo, 1=Lunes, ..., 6=Sábado
  const dayMap = [
    'available_sunday',    // 0
    'available_monday',    // 1
    'available_tuesday',   // 2
    'available_wednesday', // 3
    'available_thursday',  // 4
    'available_friday',    // 5
    'available_saturday'   // 6
  ];
  
  // Si el servicio no está disponible hoy, calcular cuántos días saltar
  const availableField = dayMap[dayOfWeek];
  if (!service[availableField as keyof typeof service]) {
    
    // Encontrar el próximo día disponible
    for (let i = 1; i <= 7; i++) {
      const nextDay = (dayOfWeek + i) % 7;
      const nextDayField = dayMap[nextDay];
      
      if (service[nextDayField as keyof typeof service]) {
        return i; // Saltar i días
      }
    }
  }
  
  return 1; // Saltar 1 día por defecto
}

interface AvailabilitySearchOptions {
  maxDays: number;      // Máximo días a buscar (ej: 7)
  minDates: number;     // Mínimo fechas a encontrar (ej: 3)
  maxDates: number;     // Máximo fechas a retornar (ej: 5)
  includeToday?: boolean; // Incluir el día actual si es futuro
}

interface NextAvailableDate {
  date: string;
  availableSlots: number;
  timeSlots: string[];
  dayName: string;
  isWeekend: boolean;
}

async function findNextAvailableDatesSmart(
  currentDate: string,
  serviceId: string,
  dealershipId: string,
  workshopId: string,
  supabase: any,
  options: AvailabilitySearchOptions = {
    maxDays: 30,
    minDates: 1,
    maxDates: 5,
    includeToday: false
  }
): Promise<NextAvailableDate[]> {
  const nextDates: NextAvailableDate[] = [];
  let current = new Date(currentDate);
  let daysChecked = 0;
  
  console.log('🔍 Iniciando búsqueda inteligente de fechas disponibles:', {
    startDate: currentDate,
    maxDays: options.maxDays,
    minDates: options.minDates,
    serviceId,
    dealershipId,
    workshopId
  });

  // 🔄 NUEVO: Obtener configuración del servicio UNA VEZ para optimización
  const { data: service, error: serviceError } = await supabase
    .from('services')
    .select('available_monday, available_tuesday, available_wednesday, available_thursday, available_friday, available_saturday, available_sunday')
    .eq('id_uuid', serviceId)
    .single();

  if (serviceError || !service) {
    console.log('❌ Servicio no encontrado en búsqueda optimizada:', serviceError?.message);
    return [];
  }

  console.log('📊 Configuración de días del servicio obtenida:', {
    serviceId,
    availableDays: {
      monday: service.available_monday,
      tuesday: service.available_tuesday,
      wednesday: service.available_wednesday,
      thursday: service.available_thursday,
      friday: service.available_friday,
      saturday: service.available_saturday,
      sunday: service.available_sunday
    }
  });

  // Si no incluir hoy, empezar desde mañana
  if (!options.includeToday) {
    current.setDate(current.getDate() + 1);
  }

  while (daysChecked < options.maxDays && nextDates.length < options.maxDates) {
    const dateStr = format(current, 'yyyy-MM-dd');
    
    console.log(`🔍 Verificando fecha ${dateStr} (día ${daysChecked + 1}/${options.maxDays})`);
    
    try {
      // 🔄 NUEVO: Verificar disponibilidad del día de la semana ANTES de hacer consultas costosas
      const dayOfWeek = current.getDay();
      const dayMap = ['available_sunday', 'available_monday', 'available_tuesday', 'available_wednesday', 'available_thursday', 'available_friday', 'available_saturday'];
      const availableField = dayMap[dayOfWeek];
      
      if (!service[availableField as keyof typeof service]) {
        console.log(`⏭️ Saltando ${dateStr} - servicio no disponible este día de la semana`);
        
        // 🚀 NUEVO: Calcular cuántos días saltar
        const daysToSkip = calculateDaysToSkip(current, service);
        current.setDate(current.getDate() + daysToSkip);
        daysChecked += daysToSkip;
        
        console.log(`🚀 Saltando ${daysToSkip} días hasta el próximo día disponible`);
        continue;
      }
      
      // Solo hacer la consulta costosa si el día de la semana es válido
      const availability = await checkAvailabilityForDate(
        dateStr, serviceId, dealershipId, workshopId, supabase
      );
      
      if (availability.availableSlots.length > 0) {
        const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const dayName = dayNames[current.getDay()];
        
        nextDates.push({
          date: dateStr,
          availableSlots: availability.availableSlots.length,
          timeSlots: availability.availableSlots.slice(0, 3), // Primeros 3 horarios
          dayName: dayName,
          isWeekend: current.getDay() === 0 || current.getDay() === 6
        });
        
        console.log(`✅ Fecha disponible encontrada: ${dateStr} (${availability.availableSlots.length} slots) - ${dayName}`);
      } else {
        console.log(`❌ Fecha sin disponibilidad: ${dateStr}`);
      }
    } catch (error) {
      console.error(`❌ Error verificando fecha ${dateStr}:`, error);
    }
    
    current.setDate(current.getDate() + 1);
    daysChecked++;
  }

  console.log('📊 Resultado de búsqueda optimizada:', {
    fechasEncontradas: nextDates.length,
    diasVerificados: daysChecked,
    fechas: nextDates.map(d => `${d.date} (${d.availableSlots} slots) - ${d.dayName}`)
  });

  return nextDates;
}

// Nueva función que usa la función de PostgreSQL para la búsqueda de fechas disponibles
async function findNextAvailableDatesWithDBFunction(
  currentDate: string,
  serviceId: string,
  dealershipId: string,
  workshopId: string,
  supabase: any,
  options: AvailabilitySearchOptions = {
    maxDays: 30,
    minDates: 1,
    maxDates: 5,
    includeToday: false
  }
): Promise<NextAvailableDate[]> {
  console.log('🚀 Usando función de PostgreSQL para búsqueda rápida:', {
    startDate: currentDate,
    maxDays: options.maxDays,
    maxDates: options.maxDates,
    serviceId,
    dealershipId,
    workshopId
  });

  try {
    // Llamar a la función de PostgreSQL
    const { data: availableDates, error } = await supabase
      .rpc('find_available_dates', {
        p_start_date: currentDate,
        p_service_id: serviceId,
        p_dealership_id: dealershipId,
        p_workshop_id: workshopId,
        p_max_days: options.maxDays,
        p_max_dates: options.maxDates
      });

    if (error) {
      console.error('❌ Error llamando función de PostgreSQL:', error);
      throw error;
    }

    console.log('✅ Resultados de función de PostgreSQL:', {
      fechasEncontradas: availableDates?.length || 0,
      fechas: (availableDates as any[])?.map((d: any) => `${d.available_date} (${d.available_slots} slots) - ${d.day_name}`) || []
    });

    // Transformar resultado al formato esperado
    const nextAvailableDates: NextAvailableDate[] = (availableDates as any[] || []).map((date: any) => ({
      date: date.available_date,
      availableSlots: date.available_slots,
      timeSlots: [], // Los slots específicos se calculan cuando se selecciona la fecha
      dayName: date.day_name,
      isWeekend: date.is_weekend
    }));

    return nextAvailableDates;
  } catch (error) {
    console.error('❌ Error en búsqueda con función de PostgreSQL:', error);
    // Fallback: usar la función original si falla la función de PostgreSQL
    console.log('🔄 Usando fallback a búsqueda original...');
    return findNextAvailableDatesSmart(currentDate, serviceId, dealershipId, workshopId, supabase, options);
  }
}

// Función auxiliar para verificar disponibilidad de una fecha específica
async function checkAvailabilityForDate(
  date: string,
  serviceId: string,
  dealershipId: string,
  workshopId: string,
  supabase: any
): Promise<{ availableSlots: string[] }> {
  console.log('🔍 Verificando disponibilidad para fecha:', { date, serviceId, dealershipId, workshopId });
  
  // 🔄 NUEVO: Verificar si la fecha es pasada
  const selectedDate = new Date(date + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (selectedDate < today) {
    console.log('❌ Fecha pasada:', { date, today: today.toISOString() });
    return { availableSlots: [] };
  }
  
  // 1. Verificar si el servicio está disponible ese día
  const { data: service, error: serviceError } = await supabase
    .from('services')
    .select('available_monday, available_tuesday, available_wednesday, available_thursday, available_friday, available_saturday, available_sunday, duration_minutes, daily_limit, time_restriction_enabled, time_restriction_start_time, time_restriction_end_time, service_name')
    .eq('id_uuid', serviceId)
    .single();

  if (serviceError || !service) {
    console.log('❌ Servicio no encontrado:', serviceError?.message);
    return { availableSlots: [] };
  }

  // 2. Verificar disponibilidad del día de la semana
  const dayOfWeek = selectedDate.getDay();
  const dayMap = ['available_sunday', 'available_monday', 'available_tuesday', 'available_wednesday', 'available_thursday', 'available_friday', 'available_saturday'];
  const availableField = dayMap[dayOfWeek];
  
  if (!service[availableField as keyof typeof service]) {
    console.log('❌ Servicio no disponible este día de la semana:', { dayOfWeek, availableField });
    return { availableSlots: [] };
  }

  // 3. Verificar si el día está bloqueado
  const { data: blockedDate, error: blockedError } = await supabase
    .from('blocked_dates')
    .select('*')
    .eq('date', date)
    .eq('dealership_id', dealershipId)
    .order('full_day', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (blockedError) {
    console.error('❌ Error verificando fechas bloqueadas:', blockedError.message);
    return { availableSlots: [] };
  }

  if (blockedDate?.full_day) {
    console.log('❌ Día completamente bloqueado:', { date, reason: blockedDate.reason });
    return { availableSlots: [] };
  }

  // 4. Verificar horario de operación
  const { data: schedule, error: scheduleError } = await supabase
    .from('operating_hours')
    .select('opening_time, closing_time, max_simultaneous_services, is_working_day, max_arrivals_per_slot, reception_end_time')
    .eq('dealership_id', dealershipId)
    .eq('workshop_id', workshopId)
    .eq('day_of_week', dayOfWeek === 0 ? 1 : dayOfWeek + 1) // Convertir a formato 1-7
    .maybeSingle();

  if (scheduleError) {
    console.error('❌ Error verificando horario de operación:', scheduleError.message);
    return { availableSlots: [] };
  }

  if (!schedule || !schedule.is_working_day) {
    console.log('❌ Día no laborable:', { date, schedule });
    return { availableSlots: [] };
  }

  // 5. Verificar citas existentes
  // Nota: Esta función no recibe exclude_appointment_id, por lo que no excluye citas específicas
  // Solo se usa para búsqueda de próximas fechas, no para validación de disponibilidad
  const { data: appointments, error: appointmentsError } = await supabase
    .from('appointment')
    .select('appointment_time, service_id, services(duration_minutes)')
    .eq('appointment_date', date)
    .eq('dealership_id', dealershipId)
    .eq('workshop_id', workshopId)
    .neq('status', 'cancelled');

  if (appointmentsError) {
    console.error('❌ Error verificando citas existentes:', appointmentsError.message);
    return { availableSlots: [] };
  }

  // 6. Verificar límite diario total del concesionario
  const { data: dailyTotalLimit, error: dailyTotalError } = await supabase
    .from('blocked_dates')
    .select('max_total_appointments, reason')
    .eq('date', date)
    .eq('dealership_id', dealershipId)
    .eq('workshop_id', workshopId)
    .not('max_total_appointments', 'is', null)
    .maybeSingle();

  if (dailyTotalError) {
    console.error('❌ Error verificando límite diario total:', dailyTotalError.message);
    return { availableSlots: [] };
  }

  if (dailyTotalLimit?.max_total_appointments) {
    const totalAppointmentsForDate = appointments?.length || 0;
    
    console.log('🔍 Verificando límite diario total en búsqueda:', {
      date,
      maxAllowed: dailyTotalLimit.max_total_appointments,
      currentTotal: totalAppointmentsForDate,
      reason: dailyTotalLimit.reason
    });
    
    if (totalAppointmentsForDate >= dailyTotalLimit.max_total_appointments) {
      console.log('❌ Límite diario total alcanzado en búsqueda:', {
        date,
        currentTotal: totalAppointmentsForDate,
        maxAllowed: dailyTotalLimit.max_total_appointments,
        reason: dailyTotalLimit.reason
      });
      return { availableSlots: [] };
    }
  }

  // 7. Verificar límite diario del servicio
  if (service.daily_limit) {
    const sameServiceAppointments = appointments?.filter((app: any) => 
      app.service_id === serviceId
    ) || [];
    
    console.log('🔍 Verificando límite diario en búsqueda:', {
      date,
      serviceId,
      dailyLimit: service.daily_limit,
      sameServiceAppointments: sameServiceAppointments.length
    });
    
    if (sameServiceAppointments.length >= service.daily_limit) {
      console.log('❌ Límite diario alcanzado en búsqueda:', {
        date,
        serviceId,
        dailyLimit: service.daily_limit,
        appointmentsCount: sameServiceAppointments.length
      });
      return { availableSlots: [] };
    }
  }

  // 8. Calcular slots disponibles (versión simplificada)
  const availableSlots = await calculateAvailableSlotsSimplified(
    date, appointments || [], serviceId, dealershipId, workshopId, supabase, schedule, service
  );

  console.log('✅ Slots disponibles calculados:', { date, availableSlots: availableSlots.length });
  return { availableSlots };
}

// Versión simplificada del cálculo de slots (más rápida)
async function calculateAvailableSlotsSimplified(
  date: string,
  appointments: any[],
  serviceId: string,
  dealershipId: string,
  workshopId: string,
  supabase: any,
  schedule: any,
  service: any
): Promise<string[]> {
  // Obtener configuración del taller
  const { data: config, error: configError } = await supabase
    .from('dealership_configuration')
    .select('shift_duration, timezone, custom_morning_slots, regular_slots_start_time')
    .eq('dealership_id', dealershipId)
    .eq('workshop_id', workshopId)
    .maybeSingle();

  if (configError) {
    console.error('❌ Error obteniendo configuración del taller:', configError.message);
    return [];
  }

  const slotDuration = config?.shift_duration || 30;
  const maxSimultaneous = schedule.max_simultaneous_services || 1;
  const serviceDuration = service.duration_minutes || 60;
  
  // 🔄 NUEVO: Verificar si es el día actual
  const now = new Date();
  const selectedDate = new Date(date + 'T00:00:00');
  const isToday = selectedDate.getFullYear() === now.getFullYear() &&
                  selectedDate.getMonth() === now.getMonth() &&
                  selectedDate.getDate() === now.getDate();
  
  // 🔄 NUEVO: Obtener hora actual en zona horaria del concesionario
  const timezone = config?.timezone || 'America/Mexico_City';
  const currentTimeInDealershipTz = utcToZonedTime(now, timezone);
  const { format } = require('date-fns-tz');
  const currentTimeStr = format(currentTimeInDealershipTz, 'HH:mm:ss', { timeZone: timezone });
  
  // 🔄 NUEVO: Obtener fecha bloqueada para verificar slots específicos
  const { data: blockedDate, error: blockedError } = await supabase
    .from('blocked_dates')
    .select('*')
    .eq('date', date)
    .eq('dealership_id', dealershipId)
    .order('full_day', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (blockedError) {
    console.error('❌ Error verificando slots bloqueados:', blockedError.message);
  }
  
  console.log('📊 Configuración para cálculo:', {
    slotDuration,
    maxSimultaneous,
    serviceDuration,
    openingTime: schedule.opening_time,
    closingTime: schedule.closing_time
  });

  // Generar slots básicos
  const allSlots = generateBasicTimeSlots(
    schedule.opening_time,
    schedule.closing_time,
    slotDuration,
    config?.custom_morning_slots,
    config?.regular_slots_start_time
  );

  // Filtrar slots disponibles
  const availableSlots = allSlots.filter(slot => {
    // 🔄 NUEVO: Verificar si el slot está bloqueado por rango de tiempo
    if (blockedDate && !blockedDate.full_day && blockedDate.start_time && blockedDate.end_time) {
      const slotTime = timeToMinutes(slot);
      const startTime = timeToMinutes(blockedDate.start_time);
      const endTime = timeToMinutes(blockedDate.end_time);
      
      if (slotTime >= startTime && slotTime <= endTime) {
        console.log('Slot descartado por bloqueo de rango:', { 
          slot, 
          startTime: blockedDate.start_time, 
          endTime: blockedDate.end_time,
          reason: blockedDate.reason 
        });
        return false;
      }
    }
    
    // 🔄 NUEVO: Si es el día actual, verificar si el slot ya pasó
    if (isToday) {
      const slotMinutes = timeToMinutes(slot);
      const currentMinutes = timeToMinutes(currentTimeStr);
      if (slotMinutes <= currentMinutes) {
        console.log('Slot descartado por ya haber pasado:', { slot, currentTime: currentTimeStr });
        return false;
      }
    }
    
    // 🔄 NUEVO: Verificar que el servicio cabe antes del cierre
    const slotStartTime = parse(slot, 'HH:mm:ss', new Date());
    const slotEndTime = addMinutes(slotStartTime, serviceDuration);
    const closingTime = parse(schedule.closing_time, 'HH:mm:ss', new Date());
    if (!isBefore(slotEndTime, closingTime)) {
      console.log('Slot descartado por no caber en horario:', { slot, serviceDuration, closingTime: schedule.closing_time });
      return false;
    }
    
    // 🔄 NUEVO: Verificar horario de recepción
    if (schedule.reception_end_time) {
      const slotTime = timeToMinutes(slot);
      const receptionEndMinutes = timeToMinutes(schedule.reception_end_time);
      if (slotTime > receptionEndMinutes) {
        console.log('Slot descartado por horario de recepción:', { slot, receptionEndTime: schedule.reception_end_time });
        return false;
      }
    }
    

    
    // 🔄 NUEVO: Validar restricciones de horario específicas del servicio
    if (service?.time_restriction_enabled) {
      const slotTimeMinutes = timeToMinutes(slot);
      const restrictionStartMinutes = timeToMinutes(service.time_restriction_start_time);
      const restrictionEndMinutes = timeToMinutes(service.time_restriction_end_time);
      
      // Verificar si el slot está dentro del rango permitido
      if (slotTimeMinutes < restrictionStartMinutes || slotTimeMinutes > restrictionEndMinutes) {
        console.log('Slot descartado por restricción de horario:', {
          slot,
          serviceName: service.service_name,
          restrictionStart: service.time_restriction_start_time,
          restrictionEnd: service.time_restriction_end_time,
          slotMinutes: slotTimeMinutes,
          restrictionStartMinutes,
          restrictionEndMinutes
        });
        return false; // Excluir este slot
      }
    }

    // 🔄 NUEVO: Verificar política de llegadas por slot (DESPUÉS de restricciones)
    if (schedule.max_arrivals_per_slot !== null) {
      const exactSlotAppointments = appointments.filter(app => 
        app.appointment_time === slot
      );
      

      
      if (exactSlotAppointments.length >= schedule.max_arrivals_per_slot) {
        console.log('Slot descartado por política de llegadas:', { 
          slot, 
          exactAppointments: exactSlotAppointments.length, 
          maxArrivals: schedule.max_arrivals_per_slot,
          appointments: exactSlotAppointments.map(app => ({
            time: app.appointment_time,
            serviceId: app.service_id,
            duration: app.services?.duration_minutes || 60
          }))
        });
        return false;
      }
    }

    // Verificar capacidad total del día
    const openingMinutes = timeToMinutes(schedule.opening_time);
    const closingMinutes = timeToMinutes(schedule.closing_time);
    const totalMinutesAvailable = (closingMinutes - openingMinutes) * maxSimultaneous;
    const totalMinutesBooked = appointments.reduce((total, app) => {
      return total + (app.services?.duration_minutes || 60);
    }, 0);
    const remainingMinutesAvailable = totalMinutesAvailable - totalMinutesBooked;
    const hasCapacity = remainingMinutesAvailable >= serviceDuration;
    
    // 🔄 NUEVO: Logging detallado para debugging
    if (!hasCapacity) {
      console.log('Slot descartado por falta de capacidad total:', {
        slot,
        totalMinutesAvailable,
        totalMinutesBooked,
        remainingMinutesAvailable,
        serviceDuration
      });
    }
    
    return hasCapacity;
  });

  console.log('📊 Slots filtrados:', {
    totalSlots: allSlots.length,
    availableSlots: availableSlots.length,
    appointmentsCount: appointments.length,
    appointments: appointments.map(app => ({
      time: app.appointment_time,
      serviceId: app.service_id,
      duration: app.services?.duration_minutes || 60
    }))
  });

  return availableSlots;
}

// Generar slots básicos de tiempo
function generateBasicTimeSlots(
  openingTime: string,
  closingTime: string,
  slotDuration: number,
  customMorningSlots?: string[] | null,
  regularSlotsStartTime?: string | null
): string[] {
  const slots: string[] = [];
  
  // Procesar slots custom de mañana si existen
  if (customMorningSlots && Array.isArray(customMorningSlots)) {
    const openingMinutes = timeToMinutes(openingTime);
    
    for (const customSlot of customMorningSlots) {
      const customSlotMinutes = timeToMinutes(customSlot);
      
      // Solo incluir si la agencia ya está abierta a esa hora
      if (customSlotMinutes >= openingMinutes) {
        slots.push(customSlot);
      }
    }
  }

  // Determinar desde dónde empezar la lógica regular
  let regularStartTime;
  if (customMorningSlots && customMorningSlots.length > 0 && regularSlotsStartTime) {
    regularStartTime = parse(regularSlotsStartTime, 'HH:mm:ss', new Date());
  } else {
    regularStartTime = parse(openingTime, 'HH:mm:ss', new Date());
  }
  
  const endTime = parse(closingTime, 'HH:mm:ss', new Date());
  
  // Generar slots regulares
  let currentTime = regularStartTime;
  while (currentTime < endTime) {
    const timeStr = format(currentTime, 'HH:mm:ss');
    
    // Evitar duplicados con slots custom
    if (!slots.includes(timeStr)) {
      slots.push(timeStr);
    }
    
    currentTime = addMinutes(currentTime, slotDuration);
  }

  return slots.sort();
}

// Función para obtener mensaje de indisponibilidad
function getUnavailabilityMessage(reason: string): string {
  const messages: { [key: string]: string } = {
    'SERVICE_NOT_AVAILABLE_ON_DAY': 'This service is not available on the selected day. Here are alternative dates when this service is available:',
    'DAILY_LIMIT_REACHED': 'No availability for the requested date. The daily limit for this service has been reached. Here are alternative dates with availability:',
    'DAY_BLOCKED': 'The requested date is blocked for appointments. Here are alternative dates with availability:',
    'NO_OPERATING_HOURS': 'No operating hours configured for this dealership. Here are alternative dates with availability:',
    'DAILY_TOTAL_LIMIT_REACHED': 'This date has reached the maximum limit of appointments. Here are alternative dates with availability:',
    'WORKSHOP_SERVICE_NOT_AVAILABLE': 'This service is not available at the selected workshop location. Please verify the workshop or contact the dealership.',
    'CAPACITY_FULL': 'No availability for the requested date. All time slots are fully booked. Here are alternative dates with availability:',
    'DEFAULT': 'No availability for the selected date. Here are alternative dates with availability:'
  };

  return messages[reason] || messages['DEFAULT'];
}