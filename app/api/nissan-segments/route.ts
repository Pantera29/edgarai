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
 * GET - Consultar distribución de segmentos o vehículos por segmento
 * 
 * Query params:
 * - dealership_id (requerido): UUID del dealership
 * - segment (opcional): Filtra por segmento específico
 * 
 * Ejemplos:
 * - /api/nissan-segments?dealership_id=xxx → Distribución de todos los segmentos
 * - /api/nissan-segments?dealership_id=xxx&segment=activo_proximo_mantenimiento → Vehículos del segmento
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  console.log('🔍 [NISSAN-SEGMENTS-QUERY] Iniciando consulta de segmentos');

  try {
    const { searchParams } = new URL(request.url);
    const dealership_id = searchParams.get('dealership_id');
    const segment = searchParams.get('segment');

    // Validar dealership_id
    if (!dealership_id) {
      console.error('❌ [NISSAN-SEGMENTS-QUERY] dealership_id faltante');
      return NextResponse.json(
        { 
          success: false,
          message: 'Query param dealership_id es requerido.',
          error_code: 'MISSING_DEALERSHIP_ID',
          examples: [
            '/api/nissan-segments?dealership_id=xxx',
            '/api/nissan-segments?dealership_id=xxx&segment=activo_proximo_mantenimiento'
          ]
        },
        { status: 400 }
      );
    }

    // Validar formato UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(dealership_id)) {
      console.error('❌ [NISSAN-SEGMENTS-QUERY] Formato de dealership_id inválido:', dealership_id);
      return NextResponse.json(
        { 
          success: false,
          message: 'dealership_id debe ser un UUID válido.',
          error_code: 'INVALID_UUID_FORMAT',
          provided_dealership_id: dealership_id
        },
        { status: 400 }
      );
    }

    // CASO 1: Consultar vehículos de un segmento específico
    if (segment) {
      console.log('🎯 [NISSAN-SEGMENTS-QUERY] Consultando vehículos del segmento:', segment);

      // Validar que el segmento sea válido
      const validSegments = [
        'activo_proximo_mantenimiento',
        'pasivo_proximo_mantenimiento',
        'activo_recordatorio',
        'pasivo_recordatorio',
        'activo_retencion',
        'pasivo_retencion',
        'pasivo_en_riesgo',
        'inactivo',
        'sin_datos',
        'sin_clasificar'
      ];

      if (!validSegments.includes(segment)) {
        console.error('❌ [NISSAN-SEGMENTS-QUERY] Segmento inválido:', segment);
        return NextResponse.json(
          { 
            success: false,
            message: 'Segmento inválido.',
            error_code: 'INVALID_SEGMENT',
            provided_segment: segment,
            valid_segments: validSegments
          },
          { status: 400 }
        );
      }

      const { data, error } = await supabase.rpc('get_vehicles_by_segment', {
        p_dealership_id: dealership_id,
        p_segment: segment
      });

      if (error) {
        console.error('❌ [NISSAN-SEGMENTS-QUERY] Error ejecutando RPC get_vehicles_by_segment:', error);
        return NextResponse.json(
          { 
            success: false,
            message: 'Error consultando vehículos por segmento.',
            error: error.message,
            error_code: 'RPC_ERROR',
            dealership_id,
            segment
          },
          { status: 500 }
        );
      }

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      console.log('✅ [NISSAN-SEGMENTS-QUERY] Vehículos obtenidos:', {
        dealership_id,
        segment,
        count: data?.length || 0,
        execution_time_ms: executionTime
      });

      return NextResponse.json({
        success: true,
        message: 'Vehículos obtenidos exitosamente.',
        dealership_id,
        segment,
        vehicles: data || [],
        count: data?.length || 0,
        execution_time_ms: executionTime,
        timestamp: new Date().toISOString()
      });
    }

    // CASO 2: Consultar distribución de segmentos
    console.log('📊 [NISSAN-SEGMENTS-QUERY] Consultando distribución de segmentos');

    const { data, error } = await supabase.rpc('get_nissan_segment_distribution', {
      p_dealership_id: dealership_id
    });

    if (error) {
      console.error('❌ [NISSAN-SEGMENTS-QUERY] Error ejecutando RPC get_nissan_segment_distribution:', error);
      return NextResponse.json(
        { 
          success: false,
          message: 'Error consultando distribución de segmentos.',
          error: error.message,
          error_code: 'RPC_ERROR',
          dealership_id
        },
        { status: 500 }
      );
    }

    const endTime = Date.now();
    const executionTime = endTime - startTime;

    // Calcular total de vehículos
    const totalVehicles = data?.reduce((sum: number, segment: any) => sum + (segment.vehicle_count || 0), 0) || 0;

    console.log('✅ [NISSAN-SEGMENTS-QUERY] Distribución obtenida:', {
      dealership_id,
      total_vehicles: totalVehicles,
      segments_count: data?.length || 0,
      execution_time_ms: executionTime
    });

    return NextResponse.json({
      success: true,
      message: 'Distribución de segmentos obtenida exitosamente.',
      dealership_id,
      distribution: data || [],
      total_vehicles: totalVehicles,
      segments_count: data?.length || 0,
      execution_time_ms: executionTime,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('💥 [NISSAN-SEGMENTS-QUERY] Error inesperado:', error);
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

