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

      // Paso 6: Para cada slot, calcular disponibilidad de cada asesor
      const slots = this.calculateSlotAvailability(
        possibleSlots,
        advisorsWithSlots,
        existingAppointments,
        shiftDuration,
        operatingHours.reception_end_time || operatingHours.closing_time,
        date
      );

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

    return data as Service;
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

    return data as HorarioOperacion;
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

    return (data as DealershipConfiguration).shift_duration;
  }

  /**
   * Paso 2: Obtener asesores activos que trabajan ese día
   * Filtrar por works_[day] = true
   */
  private async getActiveAdvisors(
    workshopId: string,
    dayOfWeek: number
  ): Promise<ServiceAdvisor[]> {
    // Mapear día de semana a nombre de columna
    const dayColumns = [
      '', // 0 no se usa
      'works_monday',
      'works_tuesday',
      'works_wednesday',
      'works_thursday',
      'works_friday',
      'works_saturday',
      'works_sunday',
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

    return data as ServiceAdvisor[];
  }

  /**
   * Paso 3: Obtener configuración de slots de cada asesor
   * Solo asesores que tienen slots para el serviceId solicitado
   */
  private async getAdvisorsWithSlots(
    advisors: ServiceAdvisor[],
    serviceId: string
  ): Promise<AdvisorWithSlots[]> {
    const advisorIds = advisors.map((a) => a.id);

    const { data, error } = await this.supabase
      .from('advisor_slot_configuration')
      .select('*')
      .in('advisor_id', advisorIds)
      .eq('service_id', serviceId);

    if (error) {
      console.error('Error al obtener configuración de slots:', error);
      return [];
    }

    const slotConfigs = data as AdvisorSlotConfiguration[];

    // Agrupar slots por asesor
    const advisorsWithSlots: AdvisorWithSlots[] = [];
    for (const advisor of advisors) {
      const advisorSlots = slotConfigs.filter((s) => s.advisor_id === advisor.id);
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

    return data as Appointment[];
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
  private calculateSlotAvailability(
    slots: string[],
    advisorsWithSlots: AdvisorWithSlots[],
    existingAppointments: Appointment[],
    shiftDuration: number,
    receptionEndTime: string,
    date: string
  ): TimeSlot[] {
    return slots.map((slotTime) => {
      const advisorAvailabilities: AdvisorAvailability[] = [];

      for (const advisor of advisorsWithSlots) {
        const canTakeResult = this.canAdvisorTakeSlot(
          advisor,
          slotTime,
          existingAppointments,
          shiftDuration,
          receptionEndTime,
          date
        );

        advisorAvailabilities.push({
          id: advisor.id,
          name: advisor.name,
          canTake: canTakeResult.canTake,
          reason: canTakeResult.reason,
        });
      }

      const availableAdvisors = advisorAvailabilities.filter((a) => a.canTake).length;

      return {
        time: slotTime,
        available: availableAdvisors > 0,
        totalCapacity: availableAdvisors,
        details: {
          availableAdvisors,
          advisors: advisorAvailabilities,
        },
      };
    });
  }

  /**
   * Verifica si un asesor puede tomar un slot específico
   * Aplica las 7 reglas de negocio
   */
  private canAdvisorTakeSlot(
    advisor: AdvisorWithSlots,
    slotTime: string,
    existingAppointments: Appointment[],
    shiftDuration: number,
    receptionEndTime: string,
    date: string
  ): { canTake: boolean; reason?: string } {
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
      return { canTake: false, reason: 'Horario de almuerzo' };
    }

    // Regla 3: Slot configurado para ese servicio
    const slotPosition = calculateSlotPosition(
      slotTime,
      advisor.shift_start_time,
      shiftDuration
    );
    const hasSlotConfigured = advisor.slots.some(
      (s) => s.slot_position === slotPosition
    );
    if (!hasSlotConfigured) {
      return { canTake: false, reason: 'Slot no configurado' };
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

    // Regla 5: No ha llegado a su límite diario
    if (advisorAppointments.length >= advisor.max_consecutive_services) {
      return { canTake: false, reason: 'Límite diario alcanzado' };
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

