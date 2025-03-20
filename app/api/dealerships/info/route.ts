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
    
    // Determinar el dealership_id a usar
    const dealershipId = await getDealershipId({
      dealershipId: explicitDealershipId,
      dealershipPhone: dealershipPhone || phoneNumber,
      supabase
    });
    
    // Consultas en paralelo para mayor eficiencia
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
        .select('dealership_id, created_at, updated_at')
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

    // Verificar si hubo errores en alguna consulta
    if (dealershipResponse.error) {
      console.error('Error fetching dealership:', dealershipResponse.error.message);
      return NextResponse.json(
        { message: 'Error fetching dealership information' },
        { status: 500 }
      );
    }

    // Si no se encontró la agencia
    if (!dealershipResponse.data) {
      return NextResponse.json(
        { message: 'Dealership not found' },
        { status: 404 }
      );
    }

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
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}