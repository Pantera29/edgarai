interface WorkshopUtilization {
  utilizationRate: number;
  totalAvailableMinutes: number;
  totalUsedMinutes: number;
  status: 'low' | 'moderate' | 'optimal' | 'overloaded';
}

interface OperatingHour {
  day_of_week: number;
  opening_time: string;
  closing_time: string;
  max_simultaneous_services: number;
}

interface BlockedDate {
  date: string;
  full_day: boolean;
}

interface Appointment {
  appointment_date: string;
  services: {
    duration_minutes: number;
  };
}

export async function calculateWorkshopUtilization(
  dealershipId: string,
  supabase: any
): Promise<WorkshopUtilization> {
  // Obtener el primer día del mes actual y el día actual
  const endDate = new Date();
  const startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
  
  console.log('📅 Período de cálculo:', {
    inicio: startDate.toISOString().split('T')[0],
    fin: endDate.toISOString().split('T')[0]
  });

  // 1. Horarios de operación
  const { data: operatingHours } = await supabase
    .from('operating_hours')
    .select('*')
    .eq('dealership_id', dealershipId)
    .eq('is_working_day', true);

  console.log('⏰ Horarios de operación:', operatingHours);

  // 2. Citas del período
  const { data: appointments } = await supabase
    .from('appointment')
    .select(`
      *,
      services!inner(duration_minutes),
      client!inner(dealership_id)
    `)
    .eq('client.dealership_id', dealershipId)
    .gte('appointment_date', startDate.toISOString().split('T')[0])
    .lte('appointment_date', endDate.toISOString().split('T')[0])
    .in('status', ['pending', 'confirmed', 'in_progress', 'completed']);

  console.log('📋 Citas encontradas:', appointments?.length || 0);

  // 3. Fechas bloqueadas
  const { data: blockedDates } = await supabase
    .from('blocked_dates')
    .select('*')
    .eq('dealership_id', dealershipId)
    .gte('date', startDate.toISOString().split('T')[0])
    .lte('date', endDate.toISOString().split('T')[0]);

  console.log('🚫 Fechas bloqueadas:', blockedDates);

  // CÁLCULO:
  // Minutos disponibles = Σ(horas_trabajo × servicios_simultáneos) - minutos_bloqueados
  // Minutos utilizados = Σ(duración_servicios)
  
  let totalAvailableMinutes = 0;
  let totalUsedMinutes = 0;
  let diasCalculados = 0;

  // Iterar por cada día de la semana
  for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
    const dateStr = date.toISOString().split('T')[0];
    const dayOfWeek = date.getDay() === 0 ? 1 : date.getDay() + 1; // Convertir a 1-7

    // Encontrar horario del día
    const daySchedule = operatingHours?.find((oh: OperatingHour) => oh.day_of_week === dayOfWeek);
    if (!daySchedule) {
      console.log(`❌ Día ${dateStr} (${dayOfWeek}): Sin horario de operación`);
      continue;
    }

    // Verificar si está bloqueado
    const isBlocked = blockedDates?.some((bd: BlockedDate) => bd.date === dateStr && bd.full_day);
    if (isBlocked) {
      console.log(`🚫 Día ${dateStr}: Bloqueado completamente`);
      continue;
    }

    // Calcular minutos disponibles del día
    const openMinutes = timeToMinutes(daySchedule.opening_time);
    const closeMinutes = timeToMinutes(daySchedule.closing_time);
    const workingMinutes = closeMinutes - openMinutes;
    const dailyCapacity = workingMinutes * daySchedule.max_simultaneous_services;

    totalAvailableMinutes += dailyCapacity;

    // Calcular minutos utilizados del día
    const dayAppointments = appointments?.filter((apt: Appointment) => apt.appointment_date === dateStr) || [];
    const dailyUsed = dayAppointments.reduce((sum: number, apt: Appointment) => sum + (apt.services?.duration_minutes || 60), 0);
    totalUsedMinutes += dailyUsed;

    diasCalculados++;
    
    console.log(`📊 Día ${dateStr}:`, {
      horario: `${daySchedule.opening_time} - ${daySchedule.closing_time}`,
      serviciosSimultaneos: daySchedule.max_simultaneous_services,
      minutosDisponibles: dailyCapacity,
      citas: dayAppointments.length,
      minutosUtilizados: dailyUsed
    });
  }

  const utilizationRate = totalAvailableMinutes > 0 ? (totalUsedMinutes / totalAvailableMinutes) * 100 : 0;
  
  let status: 'low' | 'moderate' | 'optimal' | 'overloaded';
  if (utilizationRate < 50) status = 'low';
  else if (utilizationRate < 70) status = 'moderate';
  else if (utilizationRate < 85) status = 'optimal';
  else status = 'overloaded';

  console.log('📈 Resumen del cálculo:', {
    diasCalculados,
    totalMinutosDisponibles: totalAvailableMinutes,
    totalMinutosUtilizados: totalUsedMinutes,
    tasaOcupacion: `${utilizationRate.toFixed(1)}%`,
    estado: status
  });

  return {
    utilizationRate,
    totalAvailableMinutes,
    totalUsedMinutes,
    status
  };
}

function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
} 