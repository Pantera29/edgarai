/**
 * Servicio de Disponibilidad para Service Advisors
 * Calcula qué horarios están disponibles para agendar citas
 */

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type {
  AvailabilityRequest,
  AvailabilityResponse,
  TimeSlot,
  AdvisorAvailability,
} from '@/types/availability.types';
import type { HorarioOperacion } from '@/types/workshop';
import type {
  ServiceAdvisor,
  AdvisorSlotConfiguration,
  Service,
  Appointment,
  DealershipConfiguration,
} from '@/types/database.types';
import {
  getDayOfWeek,
  timeToMinutes,
  minutesToTime,
  addMinutesToTime,
  isTimeInRange,
  calculateSlotPosition,
  areConsecutiveFromOne,
} from '@/lib/availability-helpers';

// Tipo extendido para asesor con sus slots configurados
interface AdvisorWithSlots extends ServiceAdvisor {
  slots: AdvisorSlotConfiguration[];
}

export class AvailabilityService {
  private supabase: ReturnType<typeof createServerComponentClient>;

  constructor() {
    this.supabase = createServerComponentClient({ cookies });
  }

  /**
   * Método principal que calcula disponibilidad
   */
  async calculateAvailability(
    request: AvailabilityRequest
  ): Promise<AvailabilityResponse> {
    try {
      const { dealershipId, workshopId, serviceId, date } = request;

      // Obtener información del servicio
      const service = await this.getService(serviceId);
      if (!service) {
        return {
          date,
          serviceId,
          serviceName: 'Servicio no encontrado',
          slots: [],
          message: 'El servicio solicitado no existe',
        };
      }

      // Paso 0: Obtener horarios de operación del taller
      const dayOfWeek = getDayOfWeek(date);
      const operatingHours = await this.getOperatingHours(workshopId, dayOfWeek);

      if (!operatingHours || !operatingHours.is_working_day) {
        return {
          date,
          serviceId,
          serviceName: service.service_name,
          slots: [],
          message: 'El taller no trabaja este día',
        };
      }

      // Paso 1: Obtener configuración de shift_duration
      const shiftDuration = await this.getShiftDuration(dealershipId, workshopId);
      if (!shiftDuration) {
        return {
          date,
          serviceId,
          serviceName: service.service_name,
          slots: [],
          message: 'No se encontró configuración de turnos para este taller',
        };
      }

      // Paso 2: Obtener asesores activos que trabajan ese día
      const activeAdvisors = await this.getActiveAdvisors(workshopId, dayOfWeek);
      if (activeAdvisors.length === 0) {
        return {
          date,
          serviceId,
          serviceName: service.service_name,
          slots: [],
          message: 'No hay asesores disponibles para este día',
        };
      }

      // Paso 3: Obtener configuración de slots de cada asesor
      const advisorsWithSlots = await this.getAdvisorsWithSlots(
        activeAdvisors,
        serviceId
      );
      if (advisorsWithSlots.length === 0) {
        return {
          date,
          serviceId,
          serviceName: service.service_name,
          slots: [],
          message: 'No hay asesores configurados para este servicio',
        };
      }

      // Paso 4: Obtener citas existentes de esa fecha
      const existingAppointments = await this.getExistingAppointments(
        workshopId,
        date
      );

      // Paso 5: Generar todos los slots posibles
      const possibleSlots = this.generatePossibleSlots(
        advisorsWithSlots,
        shiftDuration,
        operatingHours.opening_time,
        operatingHours.reception_end_time || operatingHours.closing_time
      );

      console.log('📊 Slots posibles generados:', {
        totalSlots: possibleSlots.length,
        shiftDuration,
        openingTime: operatingHours.opening_time,
        receptionEndTime: operatingHours.reception_end_time || operatingHours.closing_time,
        slots: possibleSlots
      });

      console.log('👥 Asesores con configuración:', advisorsWithSlots.map(a => ({
        name: a.name,
        shift: `${a.shift_start_time} - ${a.shift_end_time}`,
        lunch: `${a.lunch_start_time} - ${a.lunch_end_time}`,
        slotsConfigured: a.slots.length
      })));

      // Paso 6: Para cada slot, calcular disponibilidad de cada asesor
      const slots = await this.calculateSlotAvailability(
        possibleSlots,
        advisorsWithSlots,
        existingAppointments,
        shiftDuration,
        operatingHours.reception_end_time || operatingHours.closing_time,
        date,
        serviceId // Pasamos el serviceId solicitado para herencia inteligente
      );

      const availableSlots = slots.filter(s => s.available);
      console.log('✅ Resultado final de disponibilidad:', {
        totalSlotsGenerados: possibleSlots.length,
        totalSlotsEvaluados: slots.length,
        slotsDisponibles: availableSlots.length,
        slotsNoDisponibles: slots.length - availableSlots.length,
        slotsAvailable: availableSlots.map(s => s.time)
      });

      return {
        date,
        serviceId,
        serviceName: service.service_name,
        slots,
      };
    } catch (error) {
      console.error('Error en calculateAvailability:', error);
      throw error;
    }
  }

  /**
   * Obtiene información del servicio
   */
  private async getService(serviceId: string): Promise<Service | null> {
    const { data, error } = await this.supabase
      .from('services')
      .select('*')
      .eq('id_uuid', serviceId)
      .single();

    if (error) {
      console.error('Error al obtener servicio:', error);
      return null;
    }

    return data as any;
  }

  /**
   * Paso 0: Obtener y validar operating hours del taller
   * Retorna null si no es día laborable
   */
  private async getOperatingHours(
    workshopId: string,
    dayOfWeek: number
  ): Promise<HorarioOperacion | null> {
    const { data, error } = await this.supabase
      .from('operating_hours')
      .select('*')
      .eq('workshop_id', workshopId)
      .eq('day_of_week', dayOfWeek)
      .single();

    if (error) {
      console.error('Error al obtener horarios de operación:', error);
      return null;
    }

    return data as any;
  }

  /**
   * Paso 1: Obtener configuración de shift_duration
   */
  private async getShiftDuration(
    dealershipId: string,
    workshopId: string
  ): Promise<number | null> {
    const { data, error } = await this.supabase
      .from('dealership_configuration')
      .select('shift_duration')
      .eq('dealership_id', dealershipId)
      .eq('workshop_id', workshopId)
      .single();

    if (error) {
      console.error('Error al obtener shift_duration:', error);
      return null;
    }

    return (data as any).shift_duration;
  }

  /**
   * Paso 2: Obtener asesores activos que trabajan ese día
   * Filtrar por works_[day] = true
   */
  private async getActiveAdvisors(
    workshopId: string,
    dayOfWeek: number
  ): Promise<ServiceAdvisor[]> {
    // Mapear día de semana a nombre de columna (1=domingo, 2=lunes... 7=sábado)
    const dayColumns = [
      '', // 0 no se usa
      'works_sunday',    // 1
      'works_monday',    // 2
      'works_tuesday',   // 3
      'works_wednesday', // 4
      'works_thursday',  // 5
      'works_friday',    // 6
      'works_saturday',  // 7
    ];

    const dayColumn = dayColumns[dayOfWeek];

    const { data, error } = await this.supabase
      .from('service_advisors')
      .select('*')
      .eq('workshop_id', workshopId)
      .eq('is_active', true)
      .eq(dayColumn, true);

    if (error) {
      console.error('Error al obtener asesores activos:', error);
      return [];
    }

    return data as any;
  }

  /**
   * Paso 3: Obtener configuración de slots de cada asesor
   * CAMBIADO: Traer TODOS los slots (no solo del servicio solicitado)
   * para permitir herencia inteligente de slots configurados para otros servicios
   */
  private async getAdvisorsWithSlots(
    advisors: ServiceAdvisor[],
    serviceId: string
  ): Promise<AdvisorWithSlots[]> {
    const advisorIds = advisors.map((a) => a.id);

    // IMPORTANTE: Traer TODOS los slots del asesor, no filtrar por service_id
    // La herencia inteligente se evalúa después en canAdvisorTakeSlot
    const { data, error } = await this.supabase
      .from('advisor_slot_configuration')
      .select('*')
      .in('advisor_id', advisorIds);
      // REMOVIDO: .eq('service_id', serviceId) para permitir herencia

    if (error) {
      console.error('Error al obtener configuración de slots:', error);
      return [];
    }

    const slotConfigs = data as any;

    // Agrupar slots por asesor
    // CAMBIADO: Incluir asesores que tienen slots (aunque no sean del servicio solicitado)
    const advisorsWithSlots: AdvisorWithSlots[] = [];
    for (const advisor of advisors) {
      const advisorSlots = slotConfigs.filter((s: any) => s.advisor_id === advisor.id);
      if (advisorSlots.length > 0) {
        advisorsWithSlots.push({
          ...advisor,
          slots: advisorSlots,
        });
      }
    }

    return advisorsWithSlots;
  }

  /**
   * Paso 4: Obtener citas existentes de esa fecha
   */
  private async getExistingAppointments(
    workshopId: string,
    date: string
  ): Promise<Appointment[]> {
    const { data, error } = await this.supabase
      .from('appointment')
      .select('*')
      .eq('workshop_id', workshopId)
      .eq('appointment_date', date)
      .in('status', ['pendiente', 'en_proceso']); // Solo citas activas

    if (error) {
      console.error('Error al obtener citas existentes:', error);
      return [];
    }

    return data as any;
  }

  /**
   * Paso 5: Generar todos los slots posibles
   * Desde opening_time (o primer asesor) hasta reception_end_time
   * En intervalos de shift_duration
   * IMPORTANTE: Último slot debe cumplir: slotTime + duration <= reception_end_time
   */
  private generatePossibleSlots(
    advisors: AdvisorWithSlots[],
    shiftDuration: number,
    openingTime: string,
    receptionEndTime: string
  ): string[] {
    const slots: string[] = [];

    // Usar el opening_time como inicio
    const startMinutes = timeToMinutes(openingTime);
    const endMinutes = timeToMinutes(receptionEndTime);

    let currentMinutes = startMinutes;

    // Generar slots hasta que slotTime + duration <= reception_end_time
    while (currentMinutes + shiftDuration <= endMinutes) {
      slots.push(minutesToTime(currentMinutes));
      currentMinutes += shiftDuration;
    }

    return slots;
  }

  /**
   * Paso 6: Para cada slot, calcular disponibilidad de cada asesor
   */
  private async calculateSlotAvailability(
    slots: string[],
    advisorsWithSlots: AdvisorWithSlots[],
    existingAppointments: Appointment[],
    shiftDuration: number,
    receptionEndTime: string,
    date: string,
    requestedServiceId: string // Servicio solicitado para herencia inteligente
  ): Promise<TimeSlot[]> {
    // Contador de slots disponibles por asesor (para aplicar límite diario)
    const advisorAvailableSlotCount: Map<string, number> = new Map();
    
    // Inicializar contadores con las citas existentes
    for (const advisor of advisorsWithSlots) {
      const advisorAppointments = existingAppointments.filter(
        (apt) => apt.assigned_advisor_id === advisor.id
      );
      advisorAvailableSlotCount.set(advisor.id, advisorAppointments.length);
    }

    // IMPORTANTE: Evaluar slots SECUENCIALMENTE para que el contador funcione
    const results: TimeSlot[] = [];
    
    for (const slotTime of slots) {
      const advisorAvailabilities: AdvisorAvailability[] = [];

      for (const advisor of advisorsWithSlots) {
        const canTakeResult = await this.canAdvisorTakeSlot(
          advisor,
          slotTime,
          existingAppointments,
          shiftDuration,
          receptionEndTime,
          date,
          requestedServiceId, // Pasamos el serviceId para herencia inteligente
          advisorAvailableSlotCount.get(advisor.id) || 0 // Pasar contador actual
        );

        advisorAvailabilities.push({
          id: advisor.id,
          name: advisor.name,
          canTake: canTakeResult.canTake,
          reason: canTakeResult.reason,
        });

        // Si el asesor puede tomar este slot, incrementar su contador
        if (canTakeResult.canTake) {
          advisorAvailableSlotCount.set(
            advisor.id, 
            (advisorAvailableSlotCount.get(advisor.id) || 0) + 1
          );
        }
      }

      const availableAdvisors = advisorAvailabilities.filter((a) => a.canTake).length;

      results.push({
        time: slotTime,
        available: availableAdvisors > 0,
        totalCapacity: availableAdvisors,
        details: {
          availableAdvisors,
          advisors: advisorAvailabilities,
        },
      });
    }
    
    return results;
  }

  /**
   * Verifica si un asesor puede tomar un slot específico
   * Aplica las 7 reglas de negocio
   */
  private async canAdvisorTakeSlot(
    advisor: AdvisorWithSlots,
    slotTime: string,
    existingAppointments: Appointment[],
    shiftDuration: number,
    receptionEndTime: string,
    date: string,
    requestedServiceId: string, // Servicio solicitado para herencia inteligente
    currentSlotCount: number = 0 // Contador de slots disponibles ya marcados para este asesor
  ): Promise<{ canTake: boolean; reason?: string }> {
    // Regla 0: Restricción de Operating Hours
    const slotEndTime = addMinutesToTime(slotTime, shiftDuration);
    if (timeToMinutes(slotEndTime) > timeToMinutes(receptionEndTime)) {
      return { canTake: false, reason: 'Fuera de horario de recepción' };
    }

    // Regla 1: Horario laboral del asesor
    if (!isTimeInRange(slotTime, advisor.shift_start_time, advisor.shift_end_time)) {
      return { canTake: false, reason: 'Fuera de horario laboral' };
    }

    // Regla 2: No es horario de almuerzo
    if (isTimeInRange(slotTime, advisor.lunch_start_time, advisor.lunch_end_time)) {
      console.log(`⏰ [${advisor.name}] Slot ${slotTime} bloqueado por almuerzo (${advisor.lunch_start_time} - ${advisor.lunch_end_time})`);
      return { canTake: false, reason: 'Horario de almuerzo' };
    }

    // Regla 3: Slot configurado para ese servicio (con herencia inteligente)
    const slotPosition = calculateSlotPosition(
      slotTime,
      advisor.shift_start_time,
      shiftDuration
    );

    // Buscar la configuración de este slot
    const slotConfig = advisor.slots.find((s) => s.slot_position === slotPosition);

    if (!slotConfig) {
      // El slot no está configurado en absoluto
      return { canTake: false, reason: 'Slot no configurado' };
    }

    // Verificar si el slot está configurado para el servicio solicitado
    if (slotConfig.service_id !== requestedServiceId) {
      // El slot está configurado para OTRO servicio
      // Verificar si ese otro servicio está disponible hoy (herencia inteligente)
      const dayOfWeek = getDayOfWeek(date);
      const dayFields = [
        '', // 0 no se usa
        'available_sunday',    // 1
        'available_monday',    // 2
        'available_tuesday',   // 3
        'available_wednesday', // 4
        'available_thursday',  // 5
        'available_friday',    // 6
        'available_saturday',  // 7
      ];
      const availableField = dayFields[dayOfWeek] as keyof Service;
      
      // Obtener el servicio configurado para verificar su disponibilidad
      const configuredService = await this.getService(slotConfig.service_id);
      
      if (!configuredService) {
        // No se pudo obtener el servicio configurado
        return { 
          canTake: false, 
          reason: 'Slot configurado para servicio no disponible' 
        };
      }

      if (configuredService[availableField]) {
        // El servicio configurado SÍ trabaja hoy, este slot NO puede ser heredado
        return { 
          canTake: false, 
          reason: `Slot configurado para ${configuredService.service_name}` 
        };
      }

      // El servicio configurado NO trabaja hoy
      // Por lo tanto, el slot puede ser "heredado" por el servicio solicitado
      console.log(
        `🔄 [Herencia] Asesor ${advisor.name}, Slot ${slotPosition} (${slotTime}): ` +
        `Configurado para "${configuredService.service_name}" (no disponible ${dayFields[dayOfWeek]}), ` +
        `heredado por servicio solicitado`
      );
      // Continuar con las demás validaciones
    }

    // Obtener citas del asesor para ese día
    const advisorAppointments = existingAppointments.filter(
      (apt) => apt.assigned_advisor_id === advisor.id
    );

    // Regla 4: No tiene cita en ese horario
    const hasAppointmentAtTime = advisorAppointments.some(
      (apt) => apt.appointment_time === slotTime + ':00'
    );
    if (hasAppointmentAtTime) {
      return { canTake: false, reason: 'Ya tiene cita en este horario' };
    }

    // Regla 5: No ha llegado a su límite diario (variable por día)
    const dayOfWeek = getDayOfWeek(date); // 1=domingo, 2=lunes, ..., 7=sábado

    // Obtener límite según el día de la semana (1=domingo, 2=lunes... 7=sábado)
    const maxSlotsByDay = [
      0, // 0 no se usa
      advisor.max_slots_sunday,    // 1
      advisor.max_slots_monday,    // 2
      advisor.max_slots_tuesday,   // 3
      advisor.max_slots_wednesday, // 4
      advisor.max_slots_thursday,  // 5
      advisor.max_slots_friday,    // 6
      advisor.max_slots_saturday   // 7
    ];

    const dailyLimit = maxSlotsByDay[dayOfWeek];

    // Usar el contador acumulado (citas existentes + slots ya marcados como disponibles)
    if (currentSlotCount >= dailyLimit) {
      const dayNames = ['', 'domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
      return { 
        canTake: false, 
        reason: `Límite diario alcanzado (${dailyLimit} slots los ${dayNames[dayOfWeek]}s)` 
      };
    }

    // Regla 6: Servicios consecutivos desde el inicio del turno
    // DESHABILITADA: El cliente puede elegir cualquier horario disponible
    // const isConsecutive = this.areAppointmentsConsecutive(
    //   advisor,
    //   existingAppointments,
    //   slotTime,
    //   shiftDuration
    // );
    // if (!isConsecutive) {
    //   return { canTake: false, reason: 'Debe completar slots anteriores primero' };
    // }

    return { canTake: true };
  }

  /**
   * Verifica que las citas del asesor sean consecutivas desde el inicio
   * Regla 6 - DESHABILITADA
   * Esta función ya no se usa, pero se mantiene comentada por si se necesita en el futuro
   */
  // private areAppointmentsConsecutive(
  //   advisor: AdvisorWithSlots,
  //   existingAppointments: Appointment[],
  //   newSlotTime: string,
  //   shiftDuration: number
  // ): boolean {
  //   // Obtener citas del asesor
  //   const advisorAppointments = existingAppointments.filter(
  //     (apt) => apt.assigned_advisor_id === advisor.id
  //   );

  //   // Calcular posiciones de slots ocupados
  //   const occupiedPositions = advisorAppointments.map((apt) => {
  //     const aptTime = apt.appointment_time.substring(0, 5); // "HH:mm:ss" -> "HH:mm"
  //     return calculateSlotPosition(aptTime, advisor.shift_start_time, shiftDuration);
  //   });

  //   // Agregar la nueva posición
  //   const newPosition = calculateSlotPosition(
  //     newSlotTime,
  //     advisor.shift_start_time,
  //     shiftDuration
  //   );
  //   const allPositions = [...occupiedPositions, newPosition];

  //   // Verificar que sean consecutivos desde 1
  //   return areConsecutiveFromOne(allPositions);
  // }
}

