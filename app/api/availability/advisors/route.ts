/**
 * Endpoint de Disponibilidad de Service Advisors
 * GET /api/availability/advisors
 * 
 * Query params:
 * - dealershipId (required)
 * - workshopId (optional) - Si no se proporciona, se usa el taller principal
 * - serviceId (required) - UUID del servicio
 * - date (required) - formato "YYYY-MM-DD"
 */

import { NextResponse } from 'next/server';
import { AvailabilityService } from '@/services/availability.service';
import type { AvailabilityRequest } from '@/types/availability.types';
import { resolveWorkshopId } from '@/lib/workshop-resolver';
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

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

    // Crear request
    const availabilityRequest: AvailabilityRequest = {
      dealershipId,
      workshopId,
      serviceId,
      date,
    };

    // Calcular disponibilidad
    console.log('⏳ Calculando disponibilidad...');
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

    // Calcular nombre del día
    const selectedDate = new Date(date + 'T00:00:00');
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

