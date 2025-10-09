/**
 * Endpoint de Disponibilidad de Service Advisors
 * GET /api/availability/advisors
 * 
 * Query params:
 * - dealershipId (required)
 * - workshopId (optional) - Si no se proporciona, se usa el taller principal
 * - serviceId (required) - UUID del servicio
 * - date (required) - formato "YYYY-MM-DD"
 * 
 * @description
 * Este endpoint calcula la disponibilidad basada en asesores de servicio.
 * Incluye validaciones de días bloqueados, límites diarios, modelos bloqueados
 * y búsqueda inteligente de próximas fechas disponibles.
 */

import { NextResponse } from 'next/server';
import { AvailabilityService } from '@/services/availability.service';
import type { AvailabilityRequest } from '@/types/availability.types';
import { resolveWorkshopId } from '@/lib/workshop-resolver';
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { zonedTimeToUtc, utcToZonedTime } from 'date-fns-tz';

// Validar formato de UUID
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// Validar formato de fecha YYYY-MM-DD
function isValidDate(dateString: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) return false;
  
  const date = new Date(dateString + 'T12:00:00');
  return !isNaN(date.getTime());
}

export async function GET(request: Request) {
  try {
    const supabase = createServerComponentClient({ cookies });
    const { searchParams } = new URL(request.url);
    const dealershipId = searchParams.get('dealershipId');
    const providedWorkshopId = searchParams.get('workshopId');
    const serviceId = searchParams.get('serviceId');
    const date = searchParams.get('date');

    console.log('🔍 Calculando disponibilidad de asesores:', {
      dealershipId,
      providedWorkshopId,
      serviceId,
      date,
      url: request.url,
    });

    // Validar parámetros requeridos
    if (!dealershipId) {
      console.log('❌ Error: dealershipId no proporcionado');
      return NextResponse.json(
        { error: 'Missing required parameter: dealershipId' },
        { status: 400 }
      );
    }

    if (!serviceId) {
      console.log('❌ Error: serviceId no proporcionado');
      return NextResponse.json(
        { error: 'Missing required parameter: serviceId' },
        { status: 400 }
      );
    }

    if (!date) {
      console.log('❌ Error: date no proporcionado');
      return NextResponse.json(
        { error: 'Missing required parameter: date' },
        { status: 400 }
      );
    }

    // Validar formato de UUIDs
    if (!isValidUUID(dealershipId)) {
      console.log('❌ Error: dealershipId no es un UUID válido');
      return NextResponse.json(
        { error: 'Invalid dealershipId format. Must be a valid UUID' },
        { status: 400 }
      );
    }

    // Resolver workshop_id automáticamente si no se proporciona
    console.log('🔍 Resolviendo workshop_id:', {
      dealershipId,
      providedWorkshopId
    });
    
    let workshopId: string;
    try {
      workshopId = await resolveWorkshopId(dealershipId, supabase, providedWorkshopId);
      console.log('✅ Workshop_id resuelto:', {
        workshopId,
        dealershipId
      });
    } catch (error) {
      console.log('❌ Error al resolver workshop_id:', error);
      return NextResponse.json(
        { 
          error: 'Error resolving workshop_id',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 400 }
      );
    }

    // Validar formato de workshop_id si fue proporcionado
    if (providedWorkshopId && !isValidUUID(providedWorkshopId)) {
      console.log('❌ Error: workshopId no es un UUID válido');
      return NextResponse.json(
        { error: 'Invalid workshopId format. Must be a valid UUID' },
        { status: 400 }
      );
    }

    if (!isValidUUID(serviceId)) {
      console.log('❌ Error: serviceId no es un UUID válido');
      return NextResponse.json(
        { error: 'Invalid serviceId format. Must be a valid UUID' },
        { status: 400 }
      );
    }

    // Validar formato de fecha
    if (!isValidDate(date)) {
      console.log('❌ Error: date no tiene formato válido');
      return NextResponse.json(
        { error: 'Invalid date format. Must be YYYY-MM-DD' },
        { status: 400 }
      );
    }

    // ============================================
    // VALIDACIONES PREVIAS (antes de calcular disponibilidad)
    // ============================================

    // 1. Validar que no sea fecha pasada
    const selectedDateUtc = new Date(date + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDateUtc < today) {
      console.log('❌ Fecha pasada:', { date, today: today.toISOString() });
      return NextResponse.json({
        availableSlots: [],
        totalSlots: 0,
        message: 'No se pueden crear citas en fechas pasadas'
      });
    }

    // 2. Obtener información del servicio
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
      .eq('id_uuid', serviceId)
      .single();

    if (serviceError || !service) {
      console.error('❌ Service not found:', {
        serviceId,
        error: serviceError?.message
      });
      
      return NextResponse.json(
        { 
          message: 'Service not found. The provided serviceId does not exist in the database.',
          error_code: 'SERVICE_NOT_FOUND',
          details: {
            service_id: serviceId
          }
        },
        { status: 404 }
      );
    }

    // 3. Validar que el servicio pertenece al dealership
    if (service.dealership_id !== dealershipId) {
      console.error('❌ Service does not belong to dealership:', {
        serviceId,
        serviceDealershipId: service.dealership_id,
        requestedDealershipId: dealershipId
      });
      
      return NextResponse.json(
        { 
          message: 'Service not found or not available for this dealership.',
          error_code: 'DEALERSHIP_SERVICE_MISMATCH',
          details: {
            service_id: serviceId,
            service_dealership_id: service.dealership_id,
            requested_dealership_id: dealershipId
          }
        },
        { status: 404 }
      );
    }

    // 4. Obtener configuración del dealership (timezone)
    const { data: dealershipConfig } = await supabase
      .from('dealership_configuration')
      .select('timezone')
      .eq('dealership_id', dealershipId)
      .eq('workshop_id', workshopId)
      .maybeSingle();

    const timezone = dealershipConfig?.timezone || 'America/Mexico_City';

    // 5. Validar disponibilidad del servicio según día de la semana
    const selectedDate = utcToZonedTime(zonedTimeToUtc(`${date}T00:00:00`, timezone), timezone);
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
      console.log('❌ Servicio no disponible este día:', { serviceId, date, availableField });
      
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayName = dayNames[jsDay];
      
      return NextResponse.json({
        availableSlots: [],
        totalSlots: 0,
        message: `The service "${service.service_name}" is not available on ${dayName}s.`,
        error_code: 'SERVICE_NOT_AVAILABLE_ON_DAY',
        reason: 'SERVICE_NOT_AVAILABLE_ON_DAY',
        details: {
          service_id: serviceId,
          day: dayName
        }
      });
    }

    // 6. Verificar si el día está bloqueado
    const { data: blockedDate, error: blockedError } = await supabase
      .from('blocked_dates')
      .select('*')
      .eq('date', date)
      .eq('dealership_id', dealershipId)
      .order('full_day', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (blockedError) {
      console.error('❌ Error fetching blocked dates:', blockedError.message);
    }

    if (blockedDate?.full_day) {
      console.log('❌ Día completamente bloqueado:', { date, reason: blockedDate.reason });
      
      return NextResponse.json({
        availableSlots: [],
        totalSlots: 0,
        message: `This date (${date}) is not available for appointments. Reason: ${blockedDate.reason}.`,
        blocked: true,
        reason: 'DAY_BLOCKED',
        date: date
      });
    }

    // 7. Verificar límite total de citas por día
    const { data: dailyTotalLimit, error: dailyTotalLimitError } = await supabase
      .from('blocked_dates')
      .select('max_total_appointments, reason')
      .eq('dealership_id', dealershipId)
      .eq('date', date)
      .or(`workshop_id.eq.${workshopId},workshop_id.is.null`)
      .maybeSingle();

    if (dailyTotalLimitError) {
      console.error('❌ Error verificando límite total diario:', dailyTotalLimitError.message);
    }

    if (dailyTotalLimit?.max_total_appointments !== null && dailyTotalLimit?.max_total_appointments !== undefined) {
      const { data: existingAppointments } = await supabase
        .from('appointment')
        .select('id')
        .eq('appointment_date', date)
        .eq('dealership_id', dealershipId)
        .eq('workshop_id', workshopId)
        .neq('status', 'cancelled');

      const totalAppointmentsForDate = existingAppointments?.length || 0;

      if (totalAppointmentsForDate >= dailyTotalLimit.max_total_appointments) {
        console.log('❌ Límite total diario alcanzado:', {
          date,
          currentTotal: totalAppointmentsForDate,
          maxAllowed: dailyTotalLimit.max_total_appointments
        });
        
        return NextResponse.json({
          availableSlots: [],
          totalSlots: 0,
          message: `This date (${date}) has reached the maximum limit of ${dailyTotalLimit.max_total_appointments} appointments. Reason: ${dailyTotalLimit.reason || 'Maximum appointments exceeded'}.`,
          limitReached: true,
          currentTotal: totalAppointmentsForDate,
          maxAllowed: dailyTotalLimit.max_total_appointments,
          reason: 'DAILY_TOTAL_LIMIT_REACHED',
          date: date
        });
      }
    }

    // 8. Verificar bloqueos por modelo de vehículo (si se proporciona)
    const vehicleMake = searchParams.get('vehicleMake');
    const vehicleModel = searchParams.get('vehicleModel');
    const vehicleId = searchParams.get('vehicleId');
    
    let finalVehicleMake = vehicleMake;
    let finalVehicleModel = vehicleModel;
    let finalVehicleModelId = null;
    
    if (vehicleId && (!vehicleMake || !vehicleModel)) {
      const { data: vehicle } = await supabase
        .from('vehicles')
        .select('make, model, model_id')
        .eq('id_uuid', vehicleId)
        .single();
        
      if (vehicle) {
        finalVehicleMake = vehicle.make;
        finalVehicleModel = vehicle.model;
        finalVehicleModelId = vehicle.model_id;
      }
    }
    
    if (finalVehicleMake && finalVehicleModel) {
      let modelBlock = null;
      
      if (finalVehicleModelId) {
        const { data: modelIdBlock } = await supabase
          .from('model_blocked_dates')
          .select('*')
          .eq('dealership_id', dealershipId)
          .eq('model_id', finalVehicleModelId)
          .eq('is_active', true)
          .lte('start_date', date)
          .gte('end_date', date)
          .maybeSingle();

        if (modelIdBlock) {
          modelBlock = modelIdBlock;
        }
      }
      
      if (!modelBlock) {
        const { data: textBlock } = await supabase
          .from('model_blocked_dates')
          .select('*')
          .eq('dealership_id', dealershipId)
          .eq('make', finalVehicleMake.trim())
          .eq('model', finalVehicleModel.trim())
          .eq('is_active', true)
          .lte('start_date', date)
          .gte('end_date', date)
          .maybeSingle();

        if (textBlock) {
          modelBlock = textBlock;
        }
      }

      if (modelBlock) {
        console.log('❌ Modelo bloqueado:', {
          date,
          make: finalVehicleMake,
          model: finalVehicleModel,
          reason: modelBlock.reason
        });
        
        return NextResponse.json({
          availableSlots: [],
          totalSlots: 0,
          message: `Vehicle model ${finalVehicleMake} ${finalVehicleModel} is not available for service on this date: ${modelBlock.reason}`,
          error_code: 'MODEL_BLOCKED',
          details: {
            make: finalVehicleMake,
            model: finalVehicleModel,
            model_id: finalVehicleModelId,
            reason: modelBlock.reason
          }
        });
      }
    }

    // ============================================
    // CALCULAR DISPONIBILIDAD
    // ============================================
    
    // Crear request
    const availabilityRequest: AvailabilityRequest = {
      dealershipId,
      workshopId,
      serviceId,
      date,
    };

    // Calcular disponibilidad
    console.log('⏳ Calculando disponibilidad de asesores...');
    const availabilityService = new AvailabilityService();
    const response = await availabilityService.calculateAvailability(
      availabilityRequest
    );

    // Transformar respuesta al formato simple (compatible con appointments/availability)
    const availableSlots = response.slots
      .filter((slot) => slot.available)
      .map((slot) => {
        // Asegurar formato HH:mm:ss
        const time = slot.time.includes(':') && slot.time.split(':').length === 2 
          ? `${slot.time}:00` 
          : slot.time;
        return time;
      });

    // ============================================
    // VALIDACIÓN POST-CÁLCULO: Límite diario del servicio
    // ============================================
    
    if (service.daily_limit) {
      const { data: existingServiceAppointments } = await supabase
        .from('appointment')
        .select('id')
        .eq('appointment_date', date)
        .eq('dealership_id', dealershipId)
        .eq('workshop_id', workshopId)
        .eq('service_id', serviceId)
        .neq('status', 'cancelled');

      const sameServiceAppointments = existingServiceAppointments?.length || 0;

      if (sameServiceAppointments >= service.daily_limit) {
        console.log('❌ Límite diario del servicio alcanzado:', {
          serviceId,
          dailyLimit: service.daily_limit,
          appointmentsCount: sameServiceAppointments
        });
        
        return NextResponse.json({
          availableSlots: [],
          totalSlots: 0,
          message: `No availability for the requested date. The daily limit for this service has been reached (${service.daily_limit} appointments per day).`,
          reason: 'DAILY_LIMIT_REACHED',
          details: {
            service_id: serviceId,
            service_name: service.service_name,
            daily_limit: service.daily_limit,
            current_appointments: sameServiceAppointments
          }
        });
      }
    }

    // Calcular nombre del día
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const dayName = dayNames[selectedDate.getDay()];

    console.log('✅ Disponibilidad calculada exitosamente:', {
      date: response.date,
      serviceName: response.serviceName,
      totalSlots: availableSlots.length,
      availableSlots: availableSlots.length,
      dayName,
      message: response.message,
    });

    // ============================================
    // RESPUESTA FINAL
    // ============================================
    
    // Si no hay slots disponibles, proporcionar información adicional
    if (availableSlots.length === 0) {
      console.log('⚠️ No hay slots disponibles para esta fecha');
      
      return NextResponse.json({
        availableSlots: [],
        totalSlots: 0,
        dayName,
        message: 'No availability for the selected date. All service advisors are fully booked.',
        reason: 'ADVISORS_FULLY_BOOKED',
        aiInstruction: 'No service advisors have availability for this date and service. Please suggest alternative dates or contact the dealership directly.'
      });
    }

    // Retornar formato simple (compatible con appointments/availability)
    return NextResponse.json({
      availableSlots,
      totalSlots: availableSlots.length,
      dayName,
    }, { status: 200 });
  } catch (error) {
    console.error('💥 Error inesperado al calcular disponibilidad:', {
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name,
      } : error,
    });

    return NextResponse.json(
      {
        error: 'Error calculating availability',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

