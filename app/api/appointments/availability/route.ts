import { NextResponse } from 'next/server';
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { format, parse, addMinutes, isBefore } from 'date-fns';

export async function GET(request: Request) {
  try {
    const supabase = createServerComponentClient({ cookies });
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const serviceId = searchParams.get('service_id');
    const dealershipId = searchParams.get('dealership_id');

    if (!date || !serviceId) {
      return NextResponse.json(
        { message: 'Date and service_id parameters are required' },
        { status: 400 }
      );
    }

    // 1. Obtener la duración del servicio y la configuración del taller
    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select('duration_minutes')
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

    // Obtener la configuración del taller
    console.log('🔍 Consultando configuración del concesionario:', {
      dealershipId,
      query: {
        dealership_id: dealershipId
      }
    });

    const { data: dealershipConfig, error: configError } = await supabase
      .from('dealership_configuration')
      .select('shift_duration')
      .eq('dealership_id', dealershipId)
      .maybeSingle();

    console.log('📊 Resultado de configuración:', {
      config: dealershipConfig,
      error: configError,
      dealershipId
    });

    if (configError) {
      console.error('❌ Error al obtener configuración del concesionario:', {
        error: configError.message,
        dealershipId
      });
      return NextResponse.json(
        { message: 'Error fetching dealership configuration' },
        { status: 500 }
      );
    }

    // Si no hay configuración, usar valores por defecto
    if (!dealershipConfig) {
      console.log('⚠️ No se encontró configuración para el concesionario, usando valores por defecto:', {
        dealershipId,
        defaultShiftDuration: 30
      });
    }

    // Usar shift_duration de la configuración o 30 minutos por defecto
    const slotDuration = dealershipConfig?.shift_duration || 30;

    // 2. Obtener el día de la semana (1-7, donde 1 es Domingo)
    const jsDate = new Date(date + 'T00:00:00'); // Forzar hora local
    const jsDay = jsDate.getDay(); // 0-6 (Domingo-Sábado)
    const dayOfWeek = jsDay === 0 ? 1 : jsDay + 1; // Convertir a 1-7 (Domingo-Sábado)

    console.log('Verificando disponibilidad:', {
      date,
      jsDay,
      dayOfWeek,
      dealershipId,
      jsDate: jsDate.toISOString(),
      localDate: jsDate.toLocaleString()
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

    // Ahora consultamos el horario específico
    let scheduleQuery = supabase
      .from('operating_hours')
      .select('*')
      .eq('day_of_week', dayOfWeek)
      .eq('dealership_id', dealershipId);

    console.log('🔍 Consultando horario específico:', {
      dayOfWeek,
      dealershipId,
      query: {
        day_of_week: dayOfWeek,
        dealership_id: dealershipId,
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
        message: `El día ${format(new Date(date), 'dd/MM/yyyy')} no es un día laborable para este concesionario`
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

    // 5. Obtener citas existentes para ese día
    let appointmentQuery = supabase
      .from('appointment')
      .select(`
        id,
        appointment_date,
        appointment_time,
        service_id,
        services:service_id (duration_minutes),
        client_id
      `)
      .eq('appointment_date', date);
    
    // Filtrar por dealership_id si está disponible 
    // (asumiendo que hay una relación entre cliente y concesionario)
    if (dealershipId) {
      // Obtenemos los clients_id que pertenecen a este dealership
      const { data: clients } = await supabase
        .from('client')
        .select('id')
        .eq('dealership_id', dealershipId);
      
      if (clients && clients.length > 0) {
        const clientIds = clients.map(c => c.id);
        appointmentQuery = appointmentQuery.in('client_id', clientIds);
      }
    }

    const { data: appointments, error: appointmentsError } = await appointmentQuery;

    if (appointmentsError) {
      console.error('Error fetching appointments:', appointmentsError.message);
      return NextResponse.json(
        { message: 'Error fetching appointments' },
        { status: 500 }
      );
    }

    // 6. Generar slots de tiempo disponibles
    const availableSlots = generateTimeSlots(
      date,
      schedule,
      blockedDate,
      appointments,
      serviceDuration,
      schedule.max_simultaneous_services,
      slotDuration
    );

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
  slotDuration: number
) {
  const slots: { time: string; available: number }[] = [];
  const availableSlots: string[] = [];
  const startTime = parse(schedule.opening_time, 'HH:mm:ss', new Date());
  const endTime = parse(schedule.closing_time, 'HH:mm:ss', new Date());
  
  // Generamos slots desde la apertura hasta el cierre
  let currentTime = startTime;
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
    if (slot.available === 0) continue;

    // Calcular cuántos slots consecutivos necesitamos
    const requiredSlots = Math.ceil(serviceDuration / slotDuration);
    
    // Verificar si tenemos suficientes slots consecutivos disponibles
    let hasEnoughConsecutiveSlots = true;
    let hasEnoughCapacity = true;
    
    for (let j = 0; j < requiredSlots; j++) {
      const checkIndex = i + j;
      
      // Verificar si nos pasamos del horario de cierre
      if (checkIndex >= slots.length) {
        hasEnoughConsecutiveSlots = false;
        break;
      }
      
      const checkSlot = slots[checkIndex];
      
      // Verificar si el slot está bloqueado o no tiene capacidad
      if (checkSlot.available === 0) {
        hasEnoughConsecutiveSlots = false;
        break;
      }
      
      // Verificar si hay suficiente capacidad en este slot
      if (checkSlot.available < 1) {
        hasEnoughCapacity = false;
        break;
      }
    }
    
    // Si tenemos suficientes slots consecutivos y capacidad, agregar a disponibles
    if (hasEnoughConsecutiveSlots && hasEnoughCapacity) {
      availableSlots.push(slot.time);
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