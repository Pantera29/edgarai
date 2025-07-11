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
    const serviceId = searchParams.get('service_id');
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

    if (!date || !serviceId || !dealershipId) {
      return NextResponse.json(
        { message: 'Date, service_id and dealership_id parameters are required' },
        { status: 400 }
      );
    }

    // 1. Obtener la duración del servicio y la configuración del taller
    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select('duration_minutes, daily_limit')
      .eq('id_uuid', serviceId)
      .single();

    if (serviceError || !service) {
      console.error('Error fetching service:', serviceError?.message);
      return NextResponse.json(
        { message: 'Error fetching service details' },
        { status: 500 }
      );
    }

    const serviceDuration = service.duration_minutes;

    console.log('📊 Información del servicio obtenida:', {
      serviceId,
      duration_minutes: service.duration_minutes,
      daily_limit: service.daily_limit
    });

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

    // 2. Obtener el día de la semana (1-7, donde 1 es Domingo)
    // CORRECCIÓN FINAL: Construir y comparar fechas en la zona horaria del concesionario
    const selectedDateUtc = zonedTimeToUtc(`${date}T00:00:00`, timezone);
    const selectedDate = utcToZonedTime(selectedDateUtc, timezone);
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
    const jsDay = selectedDate.getDay(); // 0-6 (Domingo-Sábado)
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
        serviceId,
        totalAppointments: appointments?.length || 0
      });
      
      const sameServiceAppointments = appointments?.filter(app => 
        app.service_id === serviceId
      ) || [];
      
      console.log('📊 Citas del mismo servicio:', {
        serviceId,
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
          serviceId,
          dailyLimit: service.daily_limit,
          appointmentsCount: sameServiceAppointments.length
        });
        return NextResponse.json({ 
          availableSlots: [],
          totalSlots: 0,
          message: `Daily limit reached for this service (${service.daily_limit} appointments per day)`
        });
      }
    }

    // 6. Generar slots de tiempo disponibles
    const availableSlots = generateTimeSlots(
      date,
      schedule,
      blockedDate,
      appointments || [],
      serviceDuration,
      schedule.max_simultaneous_services,
      slotDuration,
      dealershipConfig?.reception_end_time,
      timezone,
      dealershipConfig?.custom_morning_slots,
      dealershipConfig?.regular_slots_start_time,
      schedule.max_arrivals_per_slot,
      isToday
    );

    // Justo antes del return final, loguear los slots generados y el valor de isToday
    console.log('✅ Slots a retornar:', { availableSlots, isToday });
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
  isToday: boolean
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

    if (availableSpaces > 0) {
      availableSlots.push(customSlot);
      console.log('Slot custom agregado:', {
        slot: customSlot,
        occupiedSpaces,
        availableSpaces,
        maxSimultaneous,
        maxArrivalsPerSlot,
        exactSlotAppointments: maxArrivalsPerSlot !== null ? exactSlotAppointments.length : 'N/A'
      });
    } else {
      console.log('Slot custom OCUPADO por capacidad del taller:', {
        slot: customSlot,
        occupiedSpaces,
        maxSimultaneous
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