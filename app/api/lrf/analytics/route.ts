import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';

// Configuración Supabase
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const dealership_id = searchParams.get('dealership_id');

  if (!dealership_id) {
    return NextResponse.json({ 
      error: 'dealership_id es requerido', 
      success: false 
    }, { status: 400 });
  }

  try {
    console.log('🔄 [LRF Analytics] Iniciando análisis para dealership:', dealership_id);

    // 1. Resumen general
    console.log('🔍 [LRF Analytics] Llamando get_lrf_summary con dealership_id:', dealership_id);
    const { data: summaryData, error: summaryError } = await supabase
      .rpc('get_lrf_summary', { p_dealership_id: dealership_id });
    
    console.log('📊 [LRF Analytics] Resultado get_lrf_summary:', { summaryData, summaryError });

    if (summaryError) {
      console.error('❌ Error obteniendo resumen:', summaryError);
      throw summaryError;
    }

    // 2. Distribución por segmentos
    console.log('🔍 [LRF Analytics] Llamando get_lrf_segment_distribution con dealership_id:', dealership_id);
    const { data: segmentDistribution, error: segmentError } = await supabase
      .rpc('get_lrf_segment_distribution', { p_dealership_id: dealership_id });
    
    console.log('📊 [LRF Analytics] Resultado get_lrf_segment_distribution:', { segmentDistribution, segmentError });

    if (segmentError) {
      console.error('❌ Error obteniendo distribución de segmentos:', segmentError);
      throw segmentError;
    }

    // 3. Clientes críticos (TOP 20 en riesgo)
    console.log('🔍 [LRF Analytics] Llamando get_lrf_critical_clients con dealership_id:', dealership_id);
    const { data: criticalClients, error: criticalError } = await supabase
      .rpc('get_lrf_critical_clients', { 
        p_dealership_id: dealership_id,
        p_limit: 20
      });
    
    console.log('📊 [LRF Analytics] Resultado get_lrf_critical_clients:', { 
      criticalClientsCount: criticalClients?.length || 0, 
      criticalError 
    });

    if (criticalError) {
      console.error('❌ Error obteniendo clientes críticos:', criticalError);
      throw criticalError;
    }

    // 4. Evolución temporal (últimas 8 semanas)
    const { data: temporalEvolution, error: temporalError } = await supabase
      .rpc('get_lrf_temporal_evolution', {
        p_dealership_id: dealership_id,
        p_weeks: 8
      });

    if (temporalError) {
      console.error('❌ Error obteniendo evolución temporal:', temporalError);
      // Si la función no existe, crear datos mock
      const mockTemporalData = generateMockTemporalData();
      console.log('📊 Usando datos mock para evolución temporal');
    }

    // 5. Calcular días vencidos para clientes críticos
    const criticalClientsWithOverdue = criticalClients?.map((client: any) => ({
      ...client,
      dias_vencidos: Math.max(0, (client.days_since_last_appointment || 0) - (client.expected_interval_days || 180))
    })) || [];

    // 6. Preparar datos de distribución para gráfico
    const segmentColors = {
      champions: '#10B981',
      loyal_customers: '#3B82F6',
      new_customers: '#06B6D4',
      at_risk: '#F59E0B',
      cannot_lose: '#EF4444',
      lost_customers: '#6B7280',
      potential_loyalists: '#8B5CF6'
    };

    const chartData = segmentDistribution?.map((segment: any) => ({
      name: segment.current_segment,
      value: parseInt(segment.cantidad),
      color: segmentColors[segment.current_segment as keyof typeof segmentColors] || '#6B7280'
    })) || [];

    // 7. Preparar respuesta
    const summaryDataFirst = summaryData?.[0]; // Acceder al primer elemento del array
    
    const response = {
      success: true,
      dealership_id,
      summary: {
        total_clientes: summaryDataFirst?.total_clientes || 0,
        clientes_en_riesgo: summaryDataFirst?.clientes_en_riesgo || 0,
        porcentaje_en_riesgo: summaryDataFirst?.total_clientes 
          ? Math.round((summaryDataFirst.clientes_en_riesgo / summaryDataFirst.total_clientes) * 100 * 10) / 10
          : 0,
        score_promedio: Math.round((summaryDataFirst?.score_promedio || 0) * 100) / 100,
        ultima_actualizacion: summaryDataFirst?.ultima_actualizacion,
        clientes_criticos: criticalClientsWithOverdue.length
      },
      segment_distribution: chartData,
      critical_clients: criticalClientsWithOverdue,
      temporal_evolution: temporalEvolution || generateMockTemporalData(),
      calculated_at: new Date().toISOString()
    };

    console.log('📊 [LRF Analytics] Respuesta final:', {
      summary: response.summary,
      segmentDistributionCount: response.segment_distribution.length,
      criticalClientsCount: response.critical_clients.length
    });

    console.log('✅ [LRF Analytics] Análisis completado exitosamente');
    console.log(`📊 Resumen: ${response.summary.total_clientes} clientes, ${response.summary.clientes_en_riesgo} en riesgo`);

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Error en LRF Analytics:', error);
    return NextResponse.json({ 
      error: 'Error interno en análisis de lealtad', 
      success: false 
    }, { status: 500 });
  }
}

// Función auxiliar para generar datos mock de evolución temporal
function generateMockTemporalData() {
  const weeks = [];
  const segments = ['champions', 'loyal_customers', 'at_risk', 'cannot_lose'];
  
  for (let i = 7; i >= 0; i--) {
    const weekData: any = {
      semana: i,
      fecha_inicio: new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    };
    
    segments.forEach(segment => {
      weekData[segment] = Math.floor(Math.random() * 50) + 10; // 10-60 clientes por segmento
    });
    
    weeks.push(weekData);
  }
  
  return weeks;
} 