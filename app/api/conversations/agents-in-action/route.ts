import { NextResponse } from 'next/server';
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

// Cache in-memory para métricas de Agents in Action
const agentsCache = new Map<string, { data: any, timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dealershipId = searchParams.get('dealership_id');
    
    if (!dealershipId) {
      console.log('❌ Error: dealership_id es requerido');
      return NextResponse.json({ error: 'dealership_id es requerido' }, { status: 400 });
    }

    console.log('🤖 Obteniendo métricas de Agents in Action para dealership:', dealershipId);

    // Verificar cache
    const cacheKey = `agents-${dealershipId}`;
    const cached = agentsCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log('🚀 Agents in Action cache hit for', cacheKey);
      return NextResponse.json(cached.data);
    }
    
    if (cached && Date.now() - cached.timestamp >= CACHE_TTL) {
      console.log('⏰ Cache expired for', cacheKey);
      agentsCache.delete(cacheKey);
    }
    
    console.log('💾 Computing fresh Agents in Action metrics for', dealershipId);
    
    const supabase = createServerComponentClient({ cookies });
    
    // 1. UNIQUE CUSTOMERS - Clientes únicos que interactuaron en el mes actual
    const { data: uniqueCustomersData, error: uniqueCustomersError } = await supabase
      .rpc('get_unique_customers_month', { p_dealership_id: dealershipId });
    
    if (uniqueCustomersError) {
      console.error('❌ Error obteniendo unique customers:', uniqueCustomersError);
      return NextResponse.json({ 
        error: 'Error obteniendo unique customers',
        details: uniqueCustomersError.message 
      }, { status: 500 });
    }

    // 2. APPOINTMENTS del AI - Citas gestionadas por el agente AI
    const { data: appointmentsData, error: appointmentsError } = await supabase
      .rpc('get_ai_appointments_month', { p_dealership_id: dealershipId });
    
    if (appointmentsError) {
      console.error('❌ Error obteniendo appointments del AI:', appointmentsError);
      return NextResponse.json({ 
        error: 'Error obteniendo appointments del AI',
        details: appointmentsError.message 
      }, { status: 500 });
    }

    // 3. % WITHOUT TRANSFERS - Porcentaje de conversaciones resueltas sin derivar a humano
    const { data: transfersData, error: transfersError } = await supabase
      .rpc('get_conversations_without_transfers', { p_dealership_id: dealershipId });
    
    if (transfersError) {
      console.error('❌ Error obteniendo métricas de transfers:', transfersError);
      return NextResponse.json({ 
        error: 'Error obteniendo métricas de transfers',
        details: transfersError.message 
      }, { status: 500 });
    }

    const result = {
      unique_customers: uniqueCustomersData?.unique_customers || 0,
      appointments: {
        total: appointmentsData?.total || 0,
        booked: appointmentsData?.booked || 0,
        rescheduled: appointmentsData?.rescheduled || 0,
        cancelled: appointmentsData?.cancelled || 0
      },
      without_transfers: {
        percentage: transfersData?.pct_without_transfers || 0,
        total_conversations: transfersData?.total_conversations || 0,
        without_transfers: transfersData?.without_transfers || 0,
        with_transfers: transfersData?.with_transfers || 0
      }
    };

    console.log('📊 Agents in Action metrics calculadas:', {
      unique_customers: result.unique_customers,
      appointments_total: result.appointments.total,
      without_transfers_pct: result.without_transfers.percentage
    });

    // Cache successful response
    agentsCache.set(cacheKey, { data: result, timestamp: Date.now() });
    
    console.log('✅ Agents in Action metrics calculadas exitosamente');
    console.log('💾 Cache updated for', cacheKey);
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('💥 Error inesperado en Agents in Action metrics:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
