import { NextResponse } from 'next/server';
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { getDealershipId } from "@/lib/config";

/**
 * GET endpoint para obtener el uso mensual de conversaciones por agencia
 * Combina datos de chat_conversations (llamadas) y historial_chat (WhatsApp)
 * para contar usuarios únicos por mes
 */
export async function GET(request: Request) {
  try {
    const supabase = createServerComponentClient({ cookies });
    const { searchParams } = new URL(request.url);
    
    // Obtener parámetros
    const explicitDealershipId = searchParams.get('dealership_id');
    const dealershipPhone = searchParams.get('dealership_phone');
    const phoneNumber = searchParams.get('phone_number'); // Mantener por compatibilidad
    const months = parseInt(searchParams.get('months') || '12'); // Por defecto 12 meses
    const startDate = searchParams.get('start_date'); // Fecha de inicio opcional
    
    console.log('📊 Obteniendo uso mensual de conversaciones:', {
      explicitDealershipId,
      dealershipPhone,
      phoneNumber,
      months,
      startDate,
      url: request.url
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
    console.log('🔍 Tipo de dealershipId:', typeof dealershipId);
    console.log('🔍 Es UUID válido:', /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(dealershipId));
    
    // Calcular fecha de inicio para la consulta
    const queryStartDate = startDate || new Date(Date.now() - (months * 30 * 24 * 60 * 60 * 1000)).toISOString();
    
    console.log('📅 Parámetros de consulta:', {
      dealershipId,
      queryStartDate,
      months
    });

    // Query SQL optimizada para obtener uso mensual usando la función RPC
    console.log('🔄 Ejecutando función RPC...');
    
    const { data: usageData, error } = await supabase
      .rpc('get_monthly_conversation_usage', {
        p_dealership_id: dealershipId,
        p_start_date: queryStartDate,
        p_months_limit: months
      });

    if (error) {
      console.error('❌ Error al obtener uso mensual:', {
        error: error.message,
        dealershipId,
        queryStartDate,
        months
      });
      
      return NextResponse.json(
        { 
          message: 'Error executing usage query',
          error: error.message 
        },
        { status: 500 }
      );
    }

    console.log('✅ Uso mensual obtenido exitosamente:', {
      dealershipId,
      recordsCount: usageData?.length || 0
    });

    return NextResponse.json({
      dealership_id: dealershipId,
      usage_data: usageData || [],
      query_params: {
        start_date: queryStartDate,
        months: months
      },
      method: 'rpc_function'
    });

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

 