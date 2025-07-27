import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyToken } from '@/app/jwt/token';

// Tipos para la respuesta estructurada
interface RetentionPeriod {
  period: string;
  period_number: number;
  period_start: string;
  period_end: string;
  effective_end_date: string;
  retained_count: number;
  retention_rate: number;
  data_complete: boolean;
}

interface CohortData {
  cohort_label: string;
  cohort_month: string;
  cohort_size: number;
  retention_by_period: RetentionPeriod[];
}

interface BenchmarkStats {
  average: number;
  min: number;
  max: number;
  median: number;
  count: number;
}

interface CohortRetentionResponse {
  success: boolean;
  dealership_id: string;
  calculated_at: string;
  months_analyzed: number;
  summary: {
    total_cohorts: number;
    complete_cohorts: number;
    partial_cohorts: number;
    avg_retention_0_6m: number;
    avg_retention_6_12m: number;
    avg_retention_12_18m: number;
    total_new_clients: number;
    latest_complete_cohort: string | null;
    best_cohort_0_6m: string | null;
    worst_cohort_0_6m: string | null;
  };
  cohorts: Array<{
    cohort_label: string;
    cohort_month: string;
    cohort_size: number;
    retention_rates: Record<string, number>;
    retention_counts: Record<string, number>;
    has_complete_data: boolean;
  }>;
  benchmarks: {
    period_0_6m: BenchmarkStats;
    period_6_12m: BenchmarkStats;
    period_12_18m: BenchmarkStats;
  };
  metadata: {
    total_cohorts: number;
    execution_time_ms: number;
    data_complete_cohorts: number;
    data_partial_cohorts: number;
  };
}

// Función para procesar datos de cohort para formato dashboard
function processCohortDataForDashboard(rawData: CohortData[]): {
  cohorts: Array<{
    cohort_label: string;
    cohort_month: string;
    cohort_size: number;
    retention_rates: Record<string, number>;
    retention_counts: Record<string, number>;
    has_complete_data: boolean;
  }>;
  summary: {
    total_cohorts: number;
    complete_cohorts: number;
    partial_cohorts: number;
    avg_retention_0_6m: number;
    avg_retention_6_12m: number;
    avg_retention_12_18m: number;
    total_new_clients: number;
    latest_complete_cohort: string | null;
    best_cohort_0_6m: string | null;
    worst_cohort_0_6m: string | null;
  };
  benchmarks: {
    period_0_6m: BenchmarkStats;
    period_6_12m: BenchmarkStats;
    period_12_18m: BenchmarkStats;
  };
} {
  console.log('🔄 [Cohort Retention] Procesando datos para dashboard...');
  
  // Separar cohorts completos vs parciales
  const completeCohorts = rawData.filter(cohort => 
    cohort.retention_by_period.some(period => period.data_complete)
  );
  const partialCohorts = rawData.filter(cohort => 
    !cohort.retention_by_period.some(period => period.data_complete)
  );
  
  console.log(`📊 Cohorts completos: ${completeCohorts.length}, parciales: ${partialCohorts.length}`);
  
  // Transformar datos para respuesta
  const processedCohorts = rawData.map(cohort => {
    // Convertir retention_by_period a retention_rates y retention_counts
    const retention_rates: Record<string, number> = {};
    const retention_counts: Record<string, number> = {};
    
    cohort.retention_by_period.forEach(period => {
      const key = period.period.replace('-', '_').toLowerCase();
      retention_rates[key] = period.retention_rate / 100; // Convertir de porcentaje a decimal
      retention_counts[key] = period.retained_count;
    });
    
    return {
      cohort_label: cohort.cohort_label,
      cohort_month: cohort.cohort_month,
      cohort_size: cohort.cohort_size,
      retention_rates,
      retention_counts,
      has_complete_data: cohort.retention_by_period.some(period => period.data_complete)
    };
  });
  
  // Calcular métricas de retención por período usando los datos procesados
  const retention0_6m = processedCohorts
    .filter(c => c.has_complete_data)
    .map(c => c.retention_rates['0_6m'] || 0)
    .filter(r => r > 0);
  const retention6_12m = processedCohorts
    .filter(c => c.has_complete_data)
    .map(c => c.retention_rates['6_12m'] || 0)
    .filter(r => r > 0);
  const retention12_18m = processedCohorts
    .filter(c => c.has_complete_data)
    .map(c => c.retention_rates['12_18m'] || 0)
    .filter(r => r > 0);
  
  // Calcular estadísticas para benchmarks
  const calculateStats = (values: number[]): BenchmarkStats => {
    if (values.length === 0) {
      return { average: 0, min: 0, max: 0, median: 0, count: 0 };
    }
    
    const sorted = [...values].sort((a, b) => a - b);
    const sum = values.reduce((acc, val) => acc + val, 0);
    const average = sum / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const median = sorted.length % 2 === 0 
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];
    
    return { average, min, max, median, count: values.length };
  };
  
  // Identificar mejor y peor cohort por retención 0-6m usando datos procesados
  let bestCohort0_6m: string | null = null;
  let worstCohort0_6m: string | null = null;
  let bestRate0_6m = 0;
  let worstRate0_6m = 1;
  
  processedCohorts.filter(c => c.has_complete_data).forEach(cohort => {
    const rate = cohort.retention_rates['0_6m'] || 0;
    if (rate > bestRate0_6m) {
      bestRate0_6m = rate;
      bestCohort0_6m = cohort.cohort_label;
    }
    if (rate < worstRate0_6m && rate > 0) {
      worstRate0_6m = rate;
      worstCohort0_6m = cohort.cohort_label;
    }
  });
  
  // Calcular total de nuevos clientes
  const totalNewClients = rawData.reduce((sum, cohort) => sum + cohort.cohort_size, 0);
  
  // Encontrar el cohort completo más reciente
  const latestCompleteCohort = completeCohorts.length > 0 
    ? completeCohorts.sort((a, b) => b.cohort_month.localeCompare(a.cohort_month))[0].cohort_label
    : null;
  
  console.log('✅ [Cohort Retention] Procesamiento completado');
  
  return {
    cohorts: processedCohorts,
    summary: {
      total_cohorts: rawData.length,
      complete_cohorts: completeCohorts.length,
      partial_cohorts: partialCohorts.length,
      avg_retention_0_6m: retention0_6m.length > 0 ? retention0_6m.reduce((a, b) => a + b, 0) / retention0_6m.length : 0,
      avg_retention_6_12m: retention6_12m.length > 0 ? retention6_12m.reduce((a, b) => a + b, 0) / retention6_12m.length : 0,
      avg_retention_12_18m: retention12_18m.length > 0 ? retention12_18m.reduce((a, b) => a + b, 0) / retention12_18m.length : 0,
      total_new_clients: totalNewClients,
      latest_complete_cohort: latestCompleteCohort,
      best_cohort_0_6m: bestCohort0_6m,
      worst_cohort_0_6m: worstCohort0_6m
    },
    benchmarks: {
      period_0_6m: calculateStats(retention0_6m),
      period_6_12m: calculateStats(retention6_12m),
      period_12_18m: calculateStats(retention12_18m)
    }
  };
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    console.log('🔄 [Cohort Retention] Iniciando endpoint de retención por cohort...');
    
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const monthsBack = parseInt(searchParams.get('months_back') || '24');
    const format = searchParams.get('format') || 'dashboard';
    
    console.log('📝 [Cohort Retention] Parámetros recibidos:', {
      hasToken: !!token,
      monthsBack,
      format
    });
    
    // Validar token
    if (!token) {
      console.log('❌ [Cohort Retention] Token faltante');
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 401 }
      );
    }
    
    // Verificar token y extraer dealership_id
    const verifiedToken = verifyToken(token);
    if (!verifiedToken || !verifiedToken.dealership_id) {
      console.log('❌ [Cohort Retention] Token inválido o sin dealership_id');
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }
    
    const dealershipId = verifiedToken.dealership_id;
    console.log('✅ [Cohort Retention] Token verificado para dealership:', dealershipId);
    
    // Validar parámetros
    if (monthsBack < 1 || monthsBack > 60) {
      console.log('❌ [Cohort Retention] months_back inválido:', monthsBack);
      return NextResponse.json(
        { error: 'months_back must be between 1 and 60' },
        { status: 400 }
      );
    }
    
    if (!['dashboard', 'raw'].includes(format)) {
      console.log('❌ [Cohort Retention] Formato inválido:', format);
      return NextResponse.json(
        { error: 'format must be either "dashboard" or "raw"' },
        { status: 400 }
      );
    }
    
    // Crear cliente Supabase con SERVICE_ROLE_KEY
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    console.log('🔄 [Cohort Retention] Llamando a función RPC...');
    
    // Llamar a la función RPC
    const { data: cohortData, error } = await supabase.rpc('calculate_monthly_cohort_retention', {
      p_dealership_id: dealershipId,
      p_months_back: monthsBack
    });
    
    if (error) {
      console.error('❌ [Cohort Retention] Error en RPC:', error);
      return NextResponse.json(
        { 
          error: 'Error executing cohort retention calculation',
          details: error.message 
        },
        { status: 500 }
      );
    }
    
    if (!cohortData || cohortData.length === 0) {
      console.log('⚠️ [Cohort Retention] No se encontraron datos de cohorts');
      return NextResponse.json(
        { error: 'No cohort data found for this dealership' },
        { status: 404 }
      );
    }
    
    console.log('✅ [Cohort Retention] Datos obtenidos exitosamente:', {
      cohortsCount: cohortData?.length,
      format,
      dataType: typeof cohortData,
      isArray: Array.isArray(cohortData),
      data: cohortData
    });
    
    // Debug adicional para entender la estructura de datos
    if (cohortData && typeof cohortData === 'object') {
      console.log('🔍 [Cohort Retention] Estructura de datos detallada:', {
        keys: Object.keys(cohortData),
        firstItem: Array.isArray(cohortData) ? cohortData[0] : 'No es array',
        sampleData: JSON.stringify(cohortData).substring(0, 500) + '...'
      });
    }
    
    const executionTime = Date.now() - startTime;
    
    // Procesar respuesta según formato
    if (format === 'raw') {
      console.log('📊 [Cohort Retention] Devolviendo datos raw');
      return NextResponse.json({
        success: true,
        dealership_id: dealershipId,
        calculated_at: new Date().toISOString(),
        months_analyzed: monthsBack,
        data: cohortData,
        metadata: {
          total_cohorts: cohortData.length,
          execution_time_ms: executionTime
        }
      });
    }
    
    // Procesar para formato dashboard
    console.log('🔄 [Cohort Retention] Procesando para formato dashboard...');
    
    // Normalizar datos si es necesario
    let normalizedData: CohortData[];
    
    if (Array.isArray(cohortData)) {
      normalizedData = cohortData;
    } else if (cohortData && typeof cohortData === 'object') {
      // Si es un objeto, intentar extraer el array de datos
      if ('cohorts' in cohortData && Array.isArray(cohortData.cohorts)) {
        console.log('✅ [Cohort Retention] Encontrados datos en cohortData.cohorts');
        normalizedData = cohortData.cohorts;
      } else if ('data' in cohortData && Array.isArray(cohortData.data)) {
        normalizedData = cohortData.data;
      } else if ('result' in cohortData && Array.isArray(cohortData.result)) {
        normalizedData = cohortData.result;
      } else if ('rows' in cohortData && Array.isArray(cohortData.rows)) {
        normalizedData = cohortData.rows;
      } else {
        console.error('❌ [Cohort Retention] No se pudo normalizar los datos:', {
          type: typeof cohortData,
          keys: Object.keys(cohortData),
          value: cohortData
        });
        return NextResponse.json(
          { 
            error: 'Invalid data format returned from database function',
            details: 'Could not extract array from response'
          },
          { status: 500 }
        );
      }
    } else {
      console.error('❌ [Cohort Retention] cohortData no es un array ni objeto:', {
        type: typeof cohortData,
        value: cohortData
      });
      return NextResponse.json(
        { 
          error: 'Invalid data format returned from database function',
          details: 'Expected array or object but received: ' + typeof cohortData
        },
        { status: 500 }
      );
    }
    
    console.log('✅ [Cohort Retention] Datos normalizados:', {
      count: normalizedData.length,
      sample: normalizedData[0]
    });
    
    const processedData = processCohortDataForDashboard(normalizedData);
    
    const response: CohortRetentionResponse = {
      success: true,
      dealership_id: dealershipId,
      calculated_at: new Date().toISOString(),
      months_analyzed: monthsBack,
      summary: processedData.summary,
      cohorts: processedData.cohorts,
      benchmarks: processedData.benchmarks,
      metadata: {
        total_cohorts: cohortData.length,
        execution_time_ms: executionTime,
        data_complete_cohorts: processedData.summary.complete_cohorts,
        data_partial_cohorts: processedData.summary.partial_cohorts
      }
    };
    
    console.log('✅ [Cohort Retention] Respuesta preparada exitosamente');
    console.log('📊 [Cohort Retention] Resumen:', {
      totalCohorts: response.summary.total_cohorts,
      completeCohorts: response.summary.complete_cohorts,
      totalNewClients: response.summary.total_new_clients,
      executionTime: response.metadata.execution_time_ms
    });
    
    return NextResponse.json(response);
    
  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.error('💥 [Cohort Retention] Error inesperado:', {
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : error,
      executionTime
    });
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 