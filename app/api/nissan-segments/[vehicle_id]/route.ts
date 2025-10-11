import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';

// Crear cliente de Supabase con service key para bypass auth
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = 'force-dynamic';

/**
 * GET - Obtener segmento y métricas de un vehículo específico
 * 
 * Params de ruta:
 * - vehicle_id: UUID del vehículo
 * 
 * Query params:
 * - dealership_id (requerido): UUID del dealership
 * 
 * Ejemplo:
 * - /api/nissan-segments/{vehicle_id}?dealership_id=xxx
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { vehicle_id: string } }
) {
  const startTime = Date.now();
  console.log('🚗 [NISSAN-SEGMENTS-DETAIL] Iniciando consulta de vehículo:', params.vehicle_id);

  try {
    const { searchParams } = new URL(request.url);
    const dealership_id = searchParams.get('dealership_id');
    const { vehicle_id } = params;

    // Validar dealership_id
    if (!dealership_id) {
      console.error('❌ [NISSAN-SEGMENTS-DETAIL] dealership_id faltante');
      return NextResponse.json(
        { 
          success: false,
          message: 'Query param dealership_id es requerido.',
          error_code: 'MISSING_DEALERSHIP_ID',
          example: `/api/nissan-segments/${vehicle_id}?dealership_id=xxx`
        },
        { status: 400 }
      );
    }

    // Validar formato UUID de dealership_id
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(dealership_id)) {
      console.error('❌ [NISSAN-SEGMENTS-DETAIL] Formato de dealership_id inválido:', dealership_id);
      return NextResponse.json(
        { 
          success: false,
          message: 'dealership_id debe ser un UUID válido.',
          error_code: 'INVALID_DEALERSHIP_UUID_FORMAT',
          provided_dealership_id: dealership_id
        },
        { status: 400 }
      );
    }

    // Validar formato UUID de vehicle_id
    if (!uuidRegex.test(vehicle_id)) {
      console.error('❌ [NISSAN-SEGMENTS-DETAIL] Formato de vehicle_id inválido:', vehicle_id);
      return NextResponse.json(
        { 
          success: false,
          message: 'vehicle_id debe ser un UUID válido.',
          error_code: 'INVALID_VEHICLE_UUID_FORMAT',
          provided_vehicle_id: vehicle_id
        },
        { status: 400 }
      );
    }

    console.log('🔍 [NISSAN-SEGMENTS-DETAIL] Consultando segmento con JOIN de vehículo y cliente');

    // Consultar segmento del vehículo con datos relacionados
    const { data, error } = await supabase
      .from('vehicle_nissan_segments')
      .select(`
        *,
        vehicles:vehicle_id (
          id_uuid,
          make,
          model,
          year,
          license_plate,
          vin,
          last_km,
          last_service_date,
          client:client_id (
            id,
            names,
            email,
            phone_number
          )
        )
      `)
      .eq('vehicle_id', vehicle_id)
      .eq('dealership_id', dealership_id)
      .single();

    if (error) {
      // Si es un error de "not found", devolver 404
      if (error.code === 'PGRST116') {
        console.log('⚠️ [NISSAN-SEGMENTS-DETAIL] Vehículo no encontrado:', vehicle_id);
        return NextResponse.json(
          { 
            success: false,
            message: 'Vehículo no encontrado o no clasificado en este dealership.',
            error_code: 'VEHICLE_NOT_FOUND',
            vehicle_id,
            dealership_id
          },
          { status: 404 }
        );
      }

      console.error('❌ [NISSAN-SEGMENTS-DETAIL] Error consultando vehículo:', error);
      return NextResponse.json(
        { 
          success: false,
          message: 'Error consultando datos del vehículo.',
          error: error.message,
          error_code: 'DATABASE_ERROR',
          vehicle_id,
          dealership_id
        },
        { status: 500 }
      );
    }

    const endTime = Date.now();
    const executionTime = endTime - startTime;

    console.log('✅ [NISSAN-SEGMENTS-DETAIL] Vehículo obtenido exitosamente:', {
      vehicle_id,
      dealership_id,
      segment: data.current_segment,
      execution_time_ms: executionTime
    });

    return NextResponse.json({
      success: true,
      message: 'Datos del vehículo obtenidos exitosamente.',
      vehicle_id,
      dealership_id,
      data: data,
      execution_time_ms: executionTime,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('💥 [NISSAN-SEGMENTS-DETAIL] Error inesperado:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Error inesperado durante la consulta.',
        error: error instanceof Error ? error.message : 'Error desconocido',
        error_code: 'UNEXPECTED_ERROR',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

