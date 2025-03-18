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

    if (!date || !serviceId) {
      return NextResponse.json(
        { message: 'Date and service_id parameters are required' },
        { status: 400 }
      );
    }

    // 1. Obtener la duración del servicio
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

    // 2. Obtener el día de la semana (1-7, donde 1 es Domingo)
    const jsDate = new Date(date);
    const dayOfWeek = jsDate.getDay() === 0 ? 1 : jsDate.getDay() + 1;

    // 3. Obtener el horario de operación para ese día
    const { data: schedule, error: scheduleError } = await supabase
      .from('operating_hours')
      .select('*')
      .eq('day_of_week', dayOfWeek)
      .maybeSingle();

    if (scheduleError) {
      console.error('Error fetching operating hours:', scheduleError.message);
      return NextResponse.json(
        { message: 'Error fetching operating hours' },
        { status: 500 }
      );
    }

    // Si no hay horario o el día no es laborable
    if (!schedule || !schedule.is_working_day) {
      return NextResponse.json({
        availableSlots: [],
        message: 'Non-working day'
      });
    }

    // 4. Verificar si el día está bloqueado
    const { data: blockedDate, error: blockedError } = await supabase
      .from('blocked_dates')
      .select('*')
      .eq('date', date)
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
      return NextResponse.json({
        availableSlots: [],
        message: `Day blocked: ${blockedDate.reason}`
      });
    }

    // 5. Obtener citas existentes para ese día
    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointment')
      .select(`
        id,
        appointment_date,
        appointment_time,
        service_id,
        services:service_id (duration_minutes)
      `)
      .eq('appointment_date', date);

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
      schedule.max_simultaneous_services
    );

    return NextResponse.json({ availableSlots });
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
  maxSimultaneous: number
) {
  const slots: { time: string; available: number }[] = [];
  const startTime = parse(schedule.opening_time, 'HH:mm:ss', new Date());
  const endTime = parse(schedule.closing_time, 'HH:mm:ss', new Date());
  
  // Duración de cada slot en minutos (típicamente 15 o 30)
  const slotDuration = 15;
  
  // Generamos slots desde la apertura hasta el cierre
  for (let time = startTime; isBefore(time, endTime); time = addMinutes(time, slotDuration)) {
    const timeStr = format(time, 'HH:mm:ss');
    
    // Verificar si este horario está en un rango bloqueado
    const isBlocked = isTimeBlocked(timeStr, blockedDate);
    if (isBlocked) {
      slots.push({ time: timeStr, available: 0 });
      continue;
    }
    
    // Contar cuántas citas ocupan este slot
    const occupiedSpaces = countOccupiedSpaces(timeStr, appointments, slotDuration);
    
    // Calcular espacios disponibles
    const available = Math.max(0, maxSimultaneous - occupiedSpaces);
    
    slots.push({ time: timeStr, available });
  }
  
  return slots;
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