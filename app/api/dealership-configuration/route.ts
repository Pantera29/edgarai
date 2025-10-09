import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/dealership-configuration
 * Obtiene la configuración de un dealership/workshop
 * 
 * Query params:
 * - dealership_id (required)
 * - workshop_id (required)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dealershipId = searchParams.get('dealership_id');
    const workshopId = searchParams.get('workshop_id');

    if (!dealershipId || !workshopId) {
      return NextResponse.json(
        { 
          error: 'dealership_id and workshop_id are required',
          success: false
        },
        { status: 400 }
      );
    }

    console.log('🔧 [CONFIG] Obteniendo configuración:', {
      dealershipId,
      workshopId
    });

    const { data, error } = await supabase
      .from('dealership_configuration')
      .select('*')
      .eq('dealership_id', dealershipId)
      .eq('workshop_id', workshopId)
      .single();

    if (error) {
      console.error('❌ [CONFIG] Error al obtener configuración:', error);
      
      // Si no existe configuración, retornar valores por defecto
      if (error.code === 'PGRST116') {
        console.log('⚠️ [CONFIG] No se encontró configuración, usando valores por defecto');
        return NextResponse.json({
          success: true,
          data: {
            dealership_id: dealershipId,
            workshop_id: workshopId,
            shift_duration: 30, // Valor por defecto
            timezone: 'America/Mexico_City',
            custom_morning_slots: null,
            regular_slots_start_time: null
          }
        });
      }

      return NextResponse.json(
        { 
          error: 'Error al obtener configuración',
          details: error.message,
          success: false
        },
        { status: 500 }
      );
    }

    console.log('✅ [CONFIG] Configuración obtenida:', data);

    return NextResponse.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('❌ [CONFIG] Error inesperado:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido',
        success: false
      },
      { status: 500 }
    );
  }
}

