import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';

// Crear cliente de Supabase con service key para bypass auth
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = 'force-dynamic';

interface ClassifyRequest {
  dealership_id: string;
  execution_date?: string; // Formato YYYY-MM-DD
}

/**
 * POST - Ejecuta la clasificación de vehículos Nissan
 * Llamado desde GitHub Actions workflow mensual
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log('🔄 [NISSAN-SEGMENTS] Iniciando clasificación de vehículos Nissan');

  try {
    // Parsear body
    let body: ClassifyRequest;
    try {
      body = await request.json();
    } catch (error) {
      console.error('❌ [NISSAN-SEGMENTS] Error parseando body:', error);
      return NextResponse.json(
        { 
          success: false,
          message: 'Body inválido. Se requiere JSON con dealership_id.',
          error_code: 'INVALID_BODY'
        },
        { status: 400 }
      );
    }

    const { dealership_id, execution_date } = body;

    // Validar dealership_id
    if (!dealership_id) {
      console.error('❌ [NISSAN-SEGMENTS] dealership_id faltante');
      return NextResponse.json(
        { 
          success: false,
          message: 'dealership_id es requerido en el body.',
          error_code: 'MISSING_DEALERSHIP_ID'
        },
        { status: 400 }
      );
    }

    // Validar formato UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(dealership_id)) {
      console.error('❌ [NISSAN-SEGMENTS] Formato de dealership_id inválido:', dealership_id);
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

    // Fecha de ejecución (por defecto: hoy)
    const execDate = execution_date || new Date().toISOString().split('T')[0];

    console.log('📊 [NISSAN-SEGMENTS] Parámetros:', {
      dealership_id,
      execution_date: execDate
    });

    // Ejecutar función RPC de clasificación
    console.log('🚀 [NISSAN-SEGMENTS] Llamando a función RPC classify_vehicles_nissan_segments...');
    
    const { data, error } = await supabase.rpc('classify_vehicles_nissan_segments', {
      p_dealership_id: dealership_id,
      p_execution_date: execDate
    });

    if (error) {
      console.error('❌ [NISSAN-SEGMENTS] Error ejecutando RPC:', error);
      return NextResponse.json(
        { 
          success: false,
          message: 'Error ejecutando clasificación de vehículos.',
          error: error.message,
          error_code: 'RPC_ERROR',
          dealership_id
        },
        { status: 500 }
      );
    }

    // La función RPC devuelve una tabla con una fila
    const result = Array.isArray(data) && data.length > 0 ? data[0] : null;
    
    if (!result) {
      console.error('❌ [NISSAN-SEGMENTS] No se recibieron datos de la función RPC');
      return NextResponse.json(
        { 
          success: false,
          message: 'No se recibieron datos de la clasificación.',
          error_code: 'NO_DATA_RETURNED',
          dealership_id
        },
        { status: 500 }
      );
    }

    const endTime = Date.now();
    const executionTime = endTime - startTime;

    console.log('✅ [NISSAN-SEGMENTS] Clasificación completada exitosamente:', {
      dealership_id,
      execution_date: execDate,
      vehicles_processed: result.vehicles_processed,
      segments_updated: result.segments_updated,
      db_execution_time_ms: result.execution_time_ms,
      total_execution_time_ms: executionTime
    });

    return NextResponse.json({
      success: true,
      message: 'Clasificación de vehículos Nissan completada exitosamente.',
      dealership_id,
      execution_date: execDate,
      vehicles_processed: result.vehicles_processed,
      segments_updated: result.segments_updated,
      db_execution_time_ms: result.execution_time_ms,
      total_execution_time_ms: executionTime,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('💥 [NISSAN-SEGMENTS] Error inesperado:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Error inesperado durante la clasificación.',
        error: error instanceof Error ? error.message : 'Error desconocido',
        error_code: 'UNEXPECTED_ERROR',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

/**
 * GET - Testing manual de la clasificación
 * Permite ejecutar sin CRON_SECRET usando query params
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  console.log('🧪 [NISSAN-SEGMENTS] Testing manual - GET endpoint');

  try {
    const { searchParams } = new URL(request.url);
    const dealership_id = searchParams.get('dealership_id');
    const execution_date = searchParams.get('execution_date');

    // Validar dealership_id
    if (!dealership_id) {
      console.error('❌ [NISSAN-SEGMENTS] dealership_id faltante en query params');
      return NextResponse.json(
        { 
          success: false,
          message: 'Query param dealership_id es requerido.',
          error_code: 'MISSING_DEALERSHIP_ID',
          example: '/api/cron/nissan-segments?dealership_id=xxx'
        },
        { status: 400 }
      );
    }

    // Validar formato UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(dealership_id)) {
      console.error('❌ [NISSAN-SEGMENTS] Formato de dealership_id inválido:', dealership_id);
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

    // Fecha de ejecución (por defecto: hoy)
    const execDate = execution_date || new Date().toISOString().split('T')[0];

    console.log('📊 [NISSAN-SEGMENTS] Parámetros (GET):', {
      dealership_id,
      execution_date: execDate
    });

    // Ejecutar función RPC de clasificación
    console.log('🚀 [NISSAN-SEGMENTS] Llamando a función RPC classify_vehicles_nissan_segments...');
    
    const { data, error } = await supabase.rpc('classify_vehicles_nissan_segments', {
      p_dealership_id: dealership_id,
      p_execution_date: execDate
    });

    if (error) {
      console.error('❌ [NISSAN-SEGMENTS] Error ejecutando RPC:', error);
      return NextResponse.json(
        { 
          success: false,
          message: 'Error ejecutando clasificación de vehículos.',
          error: error.message,
          error_code: 'RPC_ERROR',
          dealership_id
        },
        { status: 500 }
      );
    }

    // La función RPC devuelve una tabla con una fila
    const result = Array.isArray(data) && data.length > 0 ? data[0] : null;
    
    if (!result) {
      console.error('❌ [NISSAN-SEGMENTS] No se recibieron datos de la función RPC');
      return NextResponse.json(
        { 
          success: false,
          message: 'No se recibieron datos de la clasificación.',
          error_code: 'NO_DATA_RETURNED',
          dealership_id
        },
        { status: 500 }
      );
    }

    const endTime = Date.now();
    const executionTime = endTime - startTime;

    console.log('✅ [NISSAN-SEGMENTS] Clasificación completada exitosamente (GET):', {
      dealership_id,
      execution_date: execDate,
      vehicles_processed: result.vehicles_processed,
      segments_updated: result.segments_updated,
      db_execution_time_ms: result.execution_time_ms,
      total_execution_time_ms: executionTime
    });

    return NextResponse.json({
      success: true,
      message: 'Clasificación de vehículos Nissan completada exitosamente (modo testing).',
      dealership_id,
      execution_date: execDate,
      vehicles_processed: result.vehicles_processed,
      segments_updated: result.segments_updated,
      db_execution_time_ms: result.execution_time_ms,
      total_execution_time_ms: executionTime,
      timestamp: new Date().toISOString(),
      note: 'Este es el endpoint de testing. El cron ejecuta desde GitHub Actions.'
    });

  } catch (error) {
    console.error('💥 [NISSAN-SEGMENTS] Error inesperado (GET):', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Error inesperado durante la clasificación.',
        error: error instanceof Error ? error.message : 'Error desconocido',
        error_code: 'UNEXPECTED_ERROR',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

