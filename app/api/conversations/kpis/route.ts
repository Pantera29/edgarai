import { NextResponse } from 'next/server';
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

// Cache in-memory para KPIs
const kpisCache = new Map<string, { data: any, timestamp: number }>();
const CACHE_TTL = 2 * 60 * 1000; // 2 minutos

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dealershipId = searchParams.get('dealership_id');
    
    if (!dealershipId) {
      console.log('❌ Error: dealership_id es requerido');
      return NextResponse.json({ error: 'dealership_id es requerido' }, { status: 400 });
    }

    console.log('📊 Obteniendo KPIs de conversaciones para dealership:', dealershipId);

    // Verificar cache
    const cacheKey = `kpis-${dealershipId}`;
    const cached = kpisCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log('🚀 KPIs cache hit for', cacheKey);
      console.log('📊 Cache stats - Tamaño:', kpisCache.size, 'entries');
      return NextResponse.json(cached.data);
    }
    
    if (cached && Date.now() - cached.timestamp >= CACHE_TTL) {
      console.log('⏰ Cache expired for', cacheKey);
      kpisCache.delete(cacheKey);
    }
    
    console.log('💾 Computing fresh KPIs for', dealershipId);
    
    const supabase = createServerComponentClient({ cookies });
    
    const { data, error } = await supabase.rpc('get_conversation_kpis', {
      p_dealership_id: dealershipId
    });
    
    if (error) {
      console.error('❌ Error ejecutando get_conversation_kpis:', error);
      return NextResponse.json({ 
        error: 'Error obteniendo KPIs',
        details: error.message 
      }, { status: 500 });
    }
    
    console.log('📊 Datos recibidos de RPC:', {
      hasData: !!data,
      dataType: typeof data,
      dataKeys: data ? Object.keys(data) : 'no data',
      metricasKeys: data?.metricas ? Object.keys(data.metricas) : 'no metricas',
      duracionPromedio: data?.duracionPromedio
    });
    
    // Cache successful response
    kpisCache.set(cacheKey, { data, timestamp: Date.now() });
    
    console.log('✅ KPIs calculados exitosamente');
    console.log('💾 Cache updated for', cacheKey);
    console.log('📊 Cache stats - Tamaño:', kpisCache.size, 'entries');
    
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('💥 Error inesperado en KPIs:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 