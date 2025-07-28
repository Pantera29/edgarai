import { NextResponse } from 'next/server';
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { format, parse, addMinutes, isBefore } from 'date-fns';
import { zonedTimeToUtc, utcToZonedTime } from 'date-fns-tz';
import { resolveWorkshopId, getWorkshopConfiguration } from '@/lib/workshop-resolver';

export async function GET(request: Request) {
  try {
    const supabase = createServerComponentClient({ cookies });
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const service_id = searchParams.get('service_id');
    const specific_service_id = searchParams.get('specific_service_id');
    const dealershipId = searchParams.get('dealership_id');
    const workshopId = searchParams.get('workshop_id');

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
        console.log('❌ Specific service not found:', specific_service_id);
        return NextResponse.json(
          { message: 'Specific service not found or service_id not configured' },
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
      console.error('Error fetching service:', serviceError?.message);
      return NextResponse.json(
        { message: 'Error fetching service details' },
        { status: 500 }
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

      return NextResponse.json({
        availableSlots: [],
        message: `El día ${date.split('-').reverse().join('/')} no es un día laborable para este concesionario`
      });
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

    const { data: blockedDate, error: blockedError } = await blockedQuery.maybeSingle();

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
      return NextResponse.json({
        availableSlots: [],
        message: `Day blocked: ${blockedDate.reason}`
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
    const { data: appointments, error: appointmentsError } = await supabase
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
            date, finalServiceId, dealershipId, finalWorkshopId, supabase
          );
          
          return NextResponse.json({
            availableSlots: [],
            totalSlots: 0,
            message: getUnavailabilityMessage('DAILY_LIMIT_REACHED'),
            nextAvailableDates,
            reason: 'DAILY_LIMIT_REACHED',
            searchInfo: {
              daysChecked: Math.min(7, nextAvailableDates.length + 3),
              maxSearchDays: 7
            }
          });
        } catch (error) {
          console.error('❌ Error buscando próximas fechas:', error);
          return NextResponse.json({ 
            availableSlots: [],
            totalSlots: 0,
            message: `Daily limit reached for this service (${service.daily_limit} appointments per day)`
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
          date, finalServiceId, dealershipId, finalWorkshopId, supabase
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
        
        return NextResponse.json({
          availableSlots: [],
          totalSlots: 0,
          message: getUnavailabilityMessage(reason),
          nextAvailableDates,
          reason,
          searchInfo: {
            daysChecked: Math.min(7, nextAvailableDates.length + 3), // Estimación
            maxSearchDays: 7
          }
        });
      } catch (error) {
        console.error('❌ Error buscando próximas fechas:', error);
        // Si falla la búsqueda de próximas fechas, retornar respuesta básica
        return NextResponse.json({
          availableSlots: [],
          totalSlots: 0,
          message: 'No hay disponibilidad para el día seleccionado'
        });
      }
    }
    
    return NextResponse.json({ 
      availableSlots,
      totalSlots: availableSlots.length
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
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
    
    // Verificar solapamiento con citas existentes (capacidad del taller)
    const slotStartMinutes = timeToMinutes(customSlot);
    const slotEndMinutes = slotStartMinutes + serviceDuration;
    
    const overlappingAppointments = appointments.filter(app => {
      const appStart = timeToMinutes(app.appointment_time);
      const appEnd = appStart + (app.services?.duration_minutes || 60);
      return appStart < slotEndMinutes && appEnd > slotStartMinutes;
    });
    
    // Verificar capacidad del taller
    const occupiedSpaces = overlappingAppointments.length;
    const availableSpaces = Math.max(0, maxSimultaneous - occupiedSpaces);

    // 🔄 NUEVO: Validar restricciones de horario específicas del servicio para slots custom
    let shouldAddSlot = availableSpaces > 0;
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
        occupiedSpaces,
        availableSpaces,
        maxSimultaneous,
        maxArrivalsPerSlot,
        exactSlotAppointments: maxArrivalsPerSlot !== null ? exactSlotAppointments.length : 'N/A',
        hasTimeRestrictions: service?.time_restriction_enabled || false
      });
    } else {
      console.log('Slot custom OCUPADO por capacidad del taller o restricciones:', {
        slot: customSlot,
        occupiedSpaces,
        maxSimultaneous,
        hasTimeRestrictions: service?.time_restriction_enabled || false
      });
    }
  }
  
  // Generamos slots desde la apertura hasta el cierre
  let currentTime = regularStartTime;
  while (currentTime < endTime) {
    const timeStr = format(currentTime, 'HH:mm:ss');
    
    // Verificar si el slot está bloqueado
    const isBlocked = blockedDate?.blocked_slots?.includes(timeStr);
    
    // Contar citas existentes en este slot usando solapamiento real
    const slotMinutes = timeToMinutes(timeStr);
    const slotEndMinutes = slotMinutes + slotDuration;
    const occupiedSpaces = appointments.filter(app => {
      const appStart = timeToMinutes(app.appointment_time);
      const appEnd = appStart + (app.services?.duration_minutes || 60);
      // Solapamiento real
      return appStart < slotEndMinutes && appEnd > slotMinutes;
    }).length;

    // Calcular disponibilidad considerando maxSimultaneous
    const available = isBlocked ? 0 : Math.max(0, maxSimultaneous - occupiedSpaces);
    
    slots.push({ time: timeStr, available });
    
    // Avanzar al siguiente slot
    currentTime = addMinutes(currentTime, slotDuration);
  }

  // Verificar disponibilidad para cada slot
  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i];
    let exactSlotAppointments = [];
    if (maxArrivalsPerSlot !== null) {
      exactSlotAppointments = appointments.filter(app => 
        app.appointment_time === slot.time
      );
    }
    const slotStartMinutes = timeToMinutes(slot.time);
    const slotEndMinutes = slotStartMinutes + serviceDuration;
    const overlappingAppointments = appointments.filter(app => {
      const appStart = timeToMinutes(app.appointment_time);
      const appEnd = appStart + (app.services?.duration_minutes || 60);
      return appStart < slotEndMinutes && appEnd > slotStartMinutes;
    });

    // Si es el día actual, verificar si el horario ya pasó
    if (isToday) {
      const slotMinutes = timeToMinutes(slot.time);
      const currentMinutes = timeToMinutes(currentTimeStr);
      if (slotMinutes <= currentMinutes) {
        continue; // Saltar slots que ya pasaron
      }
    }

    // Si hay un horario de recepción configurado, verificar que el slot no esté después
    if (receptionEndTime) {
      const slotTime = timeToMinutes(slot.time);
      const receptionEndMinutes = timeToMinutes(receptionEndTime);
      if (slotTime > receptionEndMinutes) continue;
    }

    const slotStartTime = parse(slot.time, 'HH:mm:ss', new Date());
    const slotEndTime = addMinutes(slotStartTime, serviceDuration);
    const closingTime = parse(schedule.closing_time, 'HH:mm:ss', new Date());
    if (!isBefore(slotEndTime, closingTime)) {
      continue; // No cabe en el horario de operación
    }

    // Verificar política de llegadas por slot
    if (maxArrivalsPerSlot !== null) {
      if (exactSlotAppointments.length >= maxArrivalsPerSlot) {
        continue;
      }
    }

    // Verificar capacidad simultánea
    if (overlappingAppointments.length >= maxSimultaneous) {
      continue;
    }

    // 🔄 NUEVO: Validar restricciones de horario específicas del servicio
    if (service?.time_restriction_enabled) {
      const slotTimeMinutes = timeToMinutes(slot.time);
      const restrictionStartMinutes = timeToMinutes(service.time_restriction_start_time);
      const restrictionEndMinutes = timeToMinutes(service.time_restriction_end_time);
      
      // Verificar si el slot está dentro del rango permitido
      if (slotTimeMinutes < restrictionStartMinutes || slotTimeMinutes > restrictionEndMinutes) {
        console.log('Slot descartado por restricción de horario:', {
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
        console.log('Forzando disponibilidad del último slot de recepción debido a capacidad total disponible:', {
          slot: receptionEndTime,
          remainingMinutesAvailable,
          serviceDuration,
          currentTime: currentTimeStr,
          isPast: false
        });
        
        // Añadir el horario máximo de recepción como disponible
        availableSlots.push(receptionEndTime);
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
  
  return (
    time >= blockedDate.start_time && 
    time <= blockedDate.end_time
  );
}

// Función para contar espacios ocupados en un slot de tiempo
function countOccupiedSpaces(time: string, appointments: any[], slotDuration: number) {
  return appointments.filter(app => {
    const appTime = app.appointment_time;
    const appDuration = app.services?.duration_minutes || 60;
    
    // Convertir a minutos desde medianoche para facilitar la comparación
    const timeMinutes = timeToMinutes(time);
    const appTimeMinutes = timeToMinutes(appTime);
    const appEndMinutes = appTimeMinutes + appDuration;
    
    // El slot está ocupado si:
    // 1. La cita comienza durante este slot, O
    // 2. La cita está en progreso durante este slot
    return (
      (appTimeMinutes <= timeMinutes && appEndMinutes > timeMinutes) ||
      (appTimeMinutes >= timeMinutes && appTimeMinutes < (timeMinutes + slotDuration))
    );
  }).length;
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
    maxDays: 15,
    minDates: 3,
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

  // Si no incluir hoy, empezar desde mañana
  if (!options.includeToday) {
    current.setDate(current.getDate() + 1);
  }

  while (daysChecked < options.maxDays && nextDates.length < options.maxDates) {
    const dateStr = format(current, 'yyyy-MM-dd');
    
    console.log(`🔍 Verificando fecha ${dateStr} (día ${daysChecked + 1}/${options.maxDays})`);
    
    try {
      // Verificar disponibilidad para esta fecha
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

  console.log('📊 Resultado de búsqueda:', {
    fechasEncontradas: nextDates.length,
    diasVerificados: daysChecked,
    fechas: nextDates.map(d => `${d.date} (${d.availableSlots} slots) - ${d.dayName}`)
  });

  return nextDates;
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

  // 6. Verificar límite diario del servicio
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

  // 7. Calcular slots disponibles (versión simplificada)
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

    // Verificar si hay espacio en este slot
    // 🔄 CORRECCIÓN: Considerar TODAS las citas de la agencia para calcular capacidad del taller
    const overlappingAppointments = appointments.filter(app => {
      const appStart = timeToMinutes(app.appointment_time);
      const appEnd = appStart + (app.services?.duration_minutes || 60);
      const slotStart = timeToMinutes(slot);
      const slotEnd = slotStart + serviceDuration; // Usar duración del servicio
      
      return appStart < slotEnd && appEnd > slotStart;
    });

    const availableSpaces = Math.max(0, maxSimultaneous - overlappingAppointments.length);
    
    // 🔄 NUEVO: Logging detallado para debugging
    if (overlappingAppointments.length > 0) {
      console.log('Slot con citas solapadas:', {
        slot,
        overlappingAppointments: overlappingAppointments.map(app => ({
          time: app.appointment_time,
          duration: app.services?.duration_minutes || 60,
          serviceId: app.service_id
        })),
        availableSpaces,
        maxSimultaneous
      });
    }
    
    return availableSpaces > 0;
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
    'SERVICE_NOT_AVAILABLE_ON_DAY': 'El servicio no está disponible en el día seleccionado',
    'DAILY_LIMIT_REACHED': 'Se alcanzó el límite diario de citas para este servicio. Te mostramos próximas fechas disponibles.',
    'DAY_BLOCKED': 'El día está bloqueado para agendar citas',
    'NO_OPERATING_HOURS': 'No hay horarios configurados para este concesionario',
    'WORKSHOP_SERVICE_NOT_AVAILABLE': 'El servicio no está disponible para este taller',
    'CAPACITY_FULL': 'No hay disponibilidad para el día seleccionado',
    'DEFAULT': 'No hay horarios disponibles para el día seleccionado'
  };

  return messages[reason] || messages['DEFAULT'];
}