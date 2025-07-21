import { NextResponse } from 'next/server';
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

// Cache in-memory para AI Performance
const aiPerformanceCache = new Map<string, { data: any, timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dealershipId = searchParams.get('dealership_id');
    let months = Number(searchParams.get('months'));

    if (!dealershipId) {
      console.log('❌ Error: dealership_id es requerido');
      return NextResponse.json({ error: 'dealership_id es requerido' }, { status: 400 });
    }

    // Validar months
    if (isNaN(months) || months < 1 || months > 12) {
      months = 3;
    }

    console.log('📊 Obteniendo performance del agente AI para dealership:', dealershipId);

    // Verificar cache
    const cacheKey = `ai-performance-${dealershipId}-${months}`;
    const cached = aiPerformanceCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log('🚀 AI Performance cache hit');
      return NextResponse.json({ weeks: cached.data });
    }

    if (cached && Date.now() - cached.timestamp >= CACHE_TTL) {
      aiPerformanceCache.delete(cacheKey);
    }

    console.log('💾 Computing fresh AI performance data');

    const supabase = createServerComponentClient({ cookies });
    const { data, error } = await supabase.rpc('get_weekly_ai_performance', {
      p_dealership_id: dealershipId,
      p_months: months
    });

    if (error) {
      console.error('❌ Error ejecutando get_weekly_ai_performance:', error);
      return NextResponse.json({
        error: 'Error obteniendo AI performance',
        details: error.message
      }, { status: 500 });
    }

    aiPerformanceCache.set(cacheKey, { data, timestamp: Date.now() });
    console.log('✅ Performance AI calculada exitosamente');

    return NextResponse.json({ weeks: data });
  } catch (error) {
    console.error('❌ Error ejecutando get_weekly_ai_performance:', error);
    return NextResponse.json({
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 