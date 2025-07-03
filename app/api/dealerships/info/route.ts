import { NextResponse } from 'next/server';
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { getDealershipId } from "@/lib/config";

/**
 * GET endpoint para obtener información detallada de una agencia
 */
export async function GET(request: Request) {
  try {
    const supabase = createServerComponentClient({ cookies });
    const { searchParams } = new URL(request.url);
    
    // Obtener parámetros
    const explicitDealershipId = searchParams.get('dealership_id');
    const dealershipPhone = searchParams.get('dealership_phone');
    const phoneNumber = searchParams.get('phone_number'); // Mantener por compatibilidad
    
    console.log('🏢 Obteniendo información de agencia:', {
      explicitDealershipId,
      dealershipPhone,
      phoneNumber,
      url: request.url,
      searchParams: Object.fromEntries(searchParams.entries())
    });
    
    // Determinar el dealership_id a usar
    console.log('🔍 Determinando ID de agencia...');
    const dealershipId = await getDealershipId({
      dealershipId: explicitDealershipId,
      dealershipPhone: dealershipPhone || phoneNumber,
      supabase
    });

    if (!dealershipId) {
      console.log('❌ Error: No se pudo determinar el ID de la agencia');
      return NextResponse.json(
        { message: 'Could not determine dealership ID' },
        { status: 400 }
      );
    }

    console.log('✅ ID de agencia determinado:', dealershipId);
    
    // Consultas en paralelo para mayor eficiencia
    console.log('📊 Iniciando consultas en paralelo...');
    const [
      dealershipResponse,
      operatingHoursResponse,
      configResponse,
      blockedDatesResponse
    ] = await Promise.all([
      // Información básica de la agencia
      supabase
        .from('dealerships')
        .select('*')
        .eq('id', dealershipId)
        .maybeSingle(),
      
      // Horarios de operación
      supabase
        .from('operating_hours')
        .select('*')
        .eq('dealership_id', dealershipId)
        .order('day_of_week'),
      
      // Configuración de la agencia - excluyendo shift_duration
      supabase
        .from('dealership_configuration')
        .select('dealership_id, workshop_id, created_at, updated_at')
        .eq('dealership_id', dealershipId)
        .maybeSingle(),
      
      // Fechas bloqueadas
      supabase
        .from('blocked_dates')
        .select('*')
        .eq('dealership_id', dealershipId)
        .gte('date', new Date().toISOString().split('T')[0]) // Solo fechas futuras
        .order('date')
    ]);

    // Verificar errores en las consultas
    if (dealershipResponse.error) {
      console.error('❌ Error al obtener información de la agencia:', {
        error: dealershipResponse.error.message,
        dealershipId
      });
      return NextResponse.json(
        { message: 'Error fetching dealership information' },
        { status: 500 }
      );
    }

    if (operatingHoursResponse.error) {
      console.error('❌ Error al obtener horarios:', {
        error: operatingHoursResponse.error.message,
        dealershipId
      });
      return NextResponse.json(
        { message: 'Error fetching operating hours' },
        { status: 500 }
      );
    }

    if (configResponse.error) {
      console.error('❌ Error al obtener configuración:', {
        error: configResponse.error.message,
        dealershipId
      });
      return NextResponse.json(
        { message: 'Error fetching dealership configuration' },
        { status: 500 }
      );
    }

    if (blockedDatesResponse.error) {
      console.error('❌ Error al obtener fechas bloqueadas:', {
        error: blockedDatesResponse.error.message,
        dealershipId
      });
      return NextResponse.json(
        { message: 'Error fetching blocked dates' },
        { status: 500 }
      );
    }

    // Verificar si la agencia existe
    if (!dealershipResponse.data) {
      console.log('❌ Agencia no encontrada:', dealershipId);
      return NextResponse.json(
        { message: 'Dealership not found' },
        { status: 404 }
      );
    }

    console.log('✅ Información obtenida exitosamente:', {
      dealershipId,
      hasOperatingHours: operatingHoursResponse.data?.length > 0,
      hasConfiguration: !!configResponse.data,
      blockedDatesCount: blockedDatesResponse.data?.length || 0
    });

    // Mapa para convertir day_of_week numérico a nombre del día
    const dayNames = [
      "Domingo", "Lunes", "Martes", "Miércoles", 
      "Jueves", "Viernes", "Sábado"
    ];

    // Formatear los horarios de operación
    const formattedHours = operatingHoursResponse.data?.map(hour => ({
      ...hour,
      day_name: dayNames[hour.day_of_week - 1] // day_of_week va de 1 a 7
    })) || [];

    // Construir respuesta
    const response = {
      dealership: dealershipResponse.data,
      operating_hours: formattedHours,
      configuration: configResponse.data || null,
      blocked_dates: blockedDatesResponse.data || []
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('💥 Error inesperado:', {
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : error
    });
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}