import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';

// Configuración Supabase (usar variables de entorno Next.js)
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BATCH_SIZE = 50;
const SEGMENTS = [
  'champions',
  'loyal_customers',
  'potential_loyalists',
  'at_risk',
  'cannot_lose',
  'new_customers',
  'lost_customers',
];

function calculateLengthScore(firstAppointmentDate: string | null): number {
  if (!firstAppointmentDate) return 1;
  const today = new Date();
  const firstDate = new Date(firstAppointmentDate);
  const daysDiff = Math.floor((today.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24));
  if (daysDiff >= 730) return 5;
  if (daysDiff >= 365) return 4;
  if (daysDiff >= 180) return 3;
  if (daysDiff >= 90) return 2;
  return 1;
}

function calculateRecencyScore(
  lastAppointmentDate: string | null,
  vehicleAgeYears: number | null
): { score: number; daysOverdue: number; expectedInterval: number } {
  if (!lastAppointmentDate || vehicleAgeYears == null) return { score: 1, daysOverdue: 9999, expectedInterval: 180 };
  const today = new Date();
  const lastDate = new Date(lastAppointmentDate);
  const daysSinceLastAppointment = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
  let expectedInterval: number;
  if (vehicleAgeYears <= 3) expectedInterval = 180;
  else if (vehicleAgeYears <= 7) expectedInterval = 150;
  else expectedInterval = 120;
  const normalizedRecency = daysSinceLastAppointment / expectedInterval;
  let score: number;
  if (normalizedRecency <= 0.5) score = 5;
  else if (normalizedRecency <= 0.8) score = 4;
  else if (normalizedRecency <= 1.2) score = 3;
  else if (normalizedRecency <= 2.0) score = 2;
  else score = 1;
  return { score, daysOverdue: daysSinceLastAppointment, expectedInterval };
}

function calculateFrequencyScore(
  appointmentsLast12Months: number | null,
  vehicleAgeYears: number | null
): number {
  if (!appointmentsLast12Months || vehicleAgeYears == null) return 1;
  let adjustmentFactor: number;
  if (vehicleAgeYears <= 3) adjustmentFactor = 1.2;
  else if (vehicleAgeYears <= 7) adjustmentFactor = 1.0;
  else adjustmentFactor = 0.8;
  const adjustedFrequency = appointmentsLast12Months / adjustmentFactor;
  if (adjustedFrequency >= 6) return 5;
  if (adjustedFrequency >= 4) return 4;
  if (adjustedFrequency >= 2) return 3;
  if (adjustedFrequency >= 1) return 2;
  return 1;
}

function calculateCompositeScore(L: number, R: number, F: number): number {
  return parseFloat(((L * 0.4) + (R * 0.3) + (F * 0.3)).toFixed(2));
}

function determineSegment(L: number, R: number, F: number): string {
  const avgScore = (L + R + F) / 3;
  if (L >= 4 && R >= 4 && F >= 4) return 'champions';
  if (L >= 4 && R <= 2) return 'cannot_lose';
  if (R <= 2 && (L >= 3 || F >= 3)) return 'at_risk';
  if (L <= 2 && (R >= 4 || F >= 3)) return 'new_customers';
  if (avgScore >= 3.5) return 'loyal_customers';
  if (avgScore >= 2.5) return 'potential_loyalists';
  return 'lost_customers';
}

async function getAllClients(dealership_id?: string) {
  try {
    console.log(`🔍 [LRF] Obteniendo TODOS los clientes con paginación para dealership: ${dealership_id || 'todos'}`);
    
    let allAppointments: any[] = [];
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;
    
    // PASO 1: Obtener TODAS las citas con paginación
    while (hasMore) {
      console.log(`📄 [LRF] Obteniendo página ${page + 1} de citas...`);
      
      let appointmentQuery = supabase
        .from('appointment')
        .select('client_id')
        .neq('status', 'cancelled')
        .range(page * pageSize, (page + 1) * pageSize - 1);
      
      if (dealership_id) {
        appointmentQuery = appointmentQuery.eq('dealership_id', dealership_id);
      }
      
      const { data: pageData, error: pageError } = await appointmentQuery;
      
      if (pageError) throw pageError;
      
      if (pageData && pageData.length > 0) {
        allAppointments = allAppointments.concat(pageData);
        console.log(`   ✅ Página ${page + 1}: ${pageData.length} citas obtenidas (total acumulado: ${allAppointments.length})`);
        
        // Si obtuvimos menos del pageSize, no hay más páginas
        hasMore = pageData.length === pageSize;
        page++;
      } else {
        hasMore = false;
      }
      
      // Evitar rate limiting
      if (hasMore) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    // PASO 2: Extraer client_ids únicos
    const uniqueClientIds = [...new Set(allAppointments.map(a => a.client_id))];
    console.log(`📊 [LRF] Total citas procesadas: ${allAppointments.length}`);
    console.log(`📊 [LRF] IDs únicos extraídos: ${uniqueClientIds.length}`);
    
    if (uniqueClientIds.length === 0) {
      console.log(`⚠️ [LRF] No se encontraron clientes con citas válidas`);
      return [];
    }
    
    // PASO 3: Obtener datos de clientes en batches
    const BATCH_SIZE = 100;
    let allClients: any[] = [];
    
    for (let i = 0; i < uniqueClientIds.length; i += BATCH_SIZE) {
      const batchIds = uniqueClientIds.slice(i, i + BATCH_SIZE);
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(uniqueClientIds.length / BATCH_SIZE);
      
      console.log(`🔄 [LRF] Batch ${batchNumber}/${totalBatches} - ${batchIds.length} IDs`);
      
      try {
        let clientQuery = supabase
          .from('client')
          .select('id, dealership_id, names')
          .in('id', batchIds);
        
        if (dealership_id) {
          clientQuery = clientQuery.eq('dealership_id', dealership_id);
        }
        
        const { data: batchClients, error: clientError } = await clientQuery;
        
        if (clientError) {
          console.error(`❌ [LRF] Error en batch ${batchNumber}:`, clientError);
          continue;
        }
        
        if (batchClients) {
          console.log(`   ✅ Batch ${batchNumber}: ${batchClients.length}/${batchIds.length} clientes obtenidos`);
          allClients = allClients.concat(batchClients);
        }
      } catch (batchError) {
        console.error(`❌ [LRF] Error procesando batch ${batchNumber}:`, batchError);
      }
      
      // Delay entre batches
      if (i + BATCH_SIZE < uniqueClientIds.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    console.log(`✅ [LRF] RESUMEN getAllClients:`);
    console.log(`   - Total citas procesadas: ${allAppointments.length}`);
    console.log(`   - IDs únicos esperados: ${uniqueClientIds.length}`);
    console.log(`   - Clientes recuperados: ${allClients.length}`);
    console.log(`   - Diferencia: ${uniqueClientIds.length - allClients.length}`);
    
    return allClients;
    
  } catch (error) {
    console.error('❌ [LRF] Error en getAllClients:', error);
    throw error;
  }
}

async function getVehicles(dealership_id?: string) {
  let query = supabase
    .from('vehicles')
    .select('client_id, year');
  if (dealership_id) query = query.eq('dealership_id', dealership_id);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

async function getAppointmentsData(dealership_id?: string) {
  // Primera cita válida
  let first = supabase
    .from('appointment')
    .select('client_id, min:appointment_date')
    .neq('status', 'cancelled');
  // Última cita válida
  let last = supabase
    .from('appointment')
    .select('client_id, max:appointment_date')
    .neq('status', 'cancelled');
  // Citas últimos 12 meses
  let freq = supabase
    .from('appointment')
    .select('client_id, count:id')
    .neq('status', 'cancelled')
    .gte('appointment_date', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  if (dealership_id) {
    first = first.eq('dealership_id', dealership_id);
    last = last.eq('dealership_id', dealership_id);
    freq = freq.eq('dealership_id', dealership_id);
  }
  const [{ data: firsts }, { data: lasts }, { data: freqs }] = await Promise.all([
    first,
    last,
    freq,
  ]);
  return { firsts, lasts, freqs };
}

export async function GET(req: NextRequest) {
  const startTime = Date.now();
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');
  const dealership_id = searchParams.get('dealership_id') || undefined;
  const dryRun = searchParams.get('dry_run') === 'true';

  if (!type || !['recency_update', 'frequency_full', 'full_recalculation'].includes(type)) {
    return NextResponse.json({ error: 'Tipo de cálculo inválido', success: false }, { status: 400 });
  }

  try {
    console.log(`🔄 [LRF Calculation] Iniciando ${type} para dealership: ${dealership_id || 'todos'}`);
    // 1. Obtener clientes (paginación manual)
    const clients = await getAllClients(dealership_id);
    console.log(`📊 Total de clientes obtenidos: ${clients.length}`);
    if (!clients.length) {
      return NextResponse.json({
        success: true,
        type,
        dealership_id,
        processed_clients: 0,
        segments_changed: 0,
        processing_time_ms: Date.now() - startTime,
        summary: Object.fromEntries(SEGMENTS.map(s => [s, 0]))
      });
    }
    // 2. Obtener vehículos y mapear por client_id
    const vehicles = await getVehicles(dealership_id);
    const vehiclesByClient: Record<string, number[]> = {};
    for (const v of vehicles) {
      if (!vehiclesByClient[v.client_id]) vehiclesByClient[v.client_id] = [];
      if (v.year) vehiclesByClient[v.client_id].push(v.year);
    }
    console.log(`📊 Procesando ${clients.length} clientes`);
    // 3. Obtener datos de citas
    const { firsts, lasts, freqs } = await getAppointmentsData(dealership_id);
    // Mapear datos por client_id
    const firstMap = Object.fromEntries((firsts || []).map((r: any) => [r.client_id, r.min]));
    const lastMap = Object.fromEntries((lasts || []).map((r: any) => [r.client_id, r.max]));
    const freqMap = Object.fromEntries((freqs || []).map((r: any) => [r.client_id, r.count]));
    // 4. Procesar en batches
    let segmentsChanged = 0;
    let segmentSummary: Record<string, number> = Object.fromEntries(SEGMENTS.map(s => [s, 0]));
    let totalProcessed = 0;
    for (let i = 0; i < clients.length; i += BATCH_SIZE) {
      const batch = clients.slice(i, i + BATCH_SIZE);
      for (const client of batch) {
        try {
          const clientId = client.id;
          const clientName = client.names;
          // Edad del vehículo más reciente
          const years = vehiclesByClient[clientId] || [];
          const vehicleYears = years.length ? (new Date().getFullYear() - Math.max(...years)) : null;
          // Datos de citas
          const firstAppointmentDate = firstMap[clientId] || null;
          const lastAppointmentDate = lastMap[clientId] || null;
          const appointmentsCount = freqMap[clientId] || 0;
          // Calcular scores
          let L = 1, R = 1, F = 1, compositeScore = 1, segment = 'lost_customers', expectedInterval = 180, daysOverdue = 9999;
          if (type === 'recency_update') {
            R = calculateRecencyScore(lastAppointmentDate, vehicleYears).score;
            daysOverdue = calculateRecencyScore(lastAppointmentDate, vehicleYears).daysOverdue;
            expectedInterval = calculateRecencyScore(lastAppointmentDate, vehicleYears).expectedInterval;
            // Mantener L y F previos si existen
          } else if (type === 'frequency_full') {
            R = calculateRecencyScore(lastAppointmentDate, vehicleYears).score;
            daysOverdue = calculateRecencyScore(lastAppointmentDate, vehicleYears).daysOverdue;
            expectedInterval = calculateRecencyScore(lastAppointmentDate, vehicleYears).expectedInterval;
            F = calculateFrequencyScore(appointmentsCount, vehicleYears);
          } else if (type === 'full_recalculation') {
            L = calculateLengthScore(firstAppointmentDate);
            R = calculateRecencyScore(lastAppointmentDate, vehicleYears).score;
            daysOverdue = calculateRecencyScore(lastAppointmentDate, vehicleYears).daysOverdue;
            expectedInterval = calculateRecencyScore(lastAppointmentDate, vehicleYears).expectedInterval;
            F = calculateFrequencyScore(appointmentsCount, vehicleYears);
          }
          if (type === 'recency_update') {
            // Obtener L y F previos
            const { data: prev } = await supabase
              .from('client_lrf_scores')
              .select('length_score, frequency_score')
              .eq('client_id', clientId)
              .eq('dealership_id', client.dealership_id)
              .single();
            if (prev) {
              L = prev.length_score || 1;
              F = prev.frequency_score || 1;
            }
          } else if (type === 'frequency_full') {
            // Obtener L previo
            const { data: prev } = await supabase
              .from('client_lrf_scores')
              .select('length_score')
              .eq('client_id', clientId)
              .eq('dealership_id', client.dealership_id)
              .single();
            if (prev) {
              L = prev.length_score || 1;
            }
          }
          compositeScore = calculateCompositeScore(L, R, F);
          segment = determineSegment(L, R, F);
          // Obtener segmento previo
          const { data: existingRecord } = await supabase
            .from('client_lrf_scores')
            .select('current_segment, segment_changed_at')
            .eq('client_id', clientId)
            .eq('dealership_id', client.dealership_id)
            .single();
          const previousSegment = existingRecord?.current_segment || null;
          const segmentChanged = previousSegment !== segment;
          if (segmentChanged) segmentsChanged++;
          segmentSummary[segment] = (segmentSummary[segment] || 0) + 1;
          totalProcessed++;
          // Logging
          console.log(`⚡ Cliente ${clientId}: L=${L}, R=${R}, F=${F}, Score=${compositeScore}, Segmento=${segment}`);
          if (segmentChanged) {
            console.log(`🔄 Cliente ${clientName}: ${previousSegment || 'nuevo'} → ${segment}`);
          }
          if (!dryRun) {
            await supabase
              .from('client_lrf_scores')
              .upsert({
                client_id: clientId,
                dealership_id: client.dealership_id,
                length_score: L,
                recency_score: R,
                frequency_score: F,
                lrf_composite_score: compositeScore,
                current_segment: segment,
                previous_segment: previousSegment,
                segment_changed_at: segmentChanged ? new Date().toISOString() : existingRecord?.segment_changed_at,
                calculated_at: new Date().toISOString(),
                data_as_of_date: new Date().toISOString().split('T')[0],
                first_appointment_date: firstAppointmentDate,
                last_appointment_date: lastAppointmentDate,
                total_appointments_12m: appointmentsCount,
                vehicle_age_years: vehicleYears,
                expected_interval_days: expectedInterval,
                days_since_last_appointment: daysOverdue,
                updated_at: new Date().toISOString(),
              }, { onConflict: 'client_id,dealership_id' });
          }
        } catch (err) {
          console.error(`❌ Error procesando cliente ${client.id} (${client.names}):`, err instanceof Error ? err.message : String(err));
          // Incrementar contador de errores pero continuar
          continue;
        }
      }
      // Delay opcional entre batches para evitar rate limit
      if (clients.length > BATCH_SIZE) await new Promise(res => setTimeout(res, 200));
    }
    console.log(`📊 [LRF] RESUMEN DE PROCESAMIENTO:`);
    console.log(`   - Clientes obtenidos por getAllClients: ${clients.length}`);
    console.log(`   - Clientes procesados exitosamente: ${totalProcessed}`);
    console.log(`   - Diferencia (errores): ${clients.length - totalProcessed}`);
    console.log(`📈 Resumen de segmentos:`, segmentSummary);
    console.log(`🔀 Total de cambios de segmento: ${segmentsChanged}`);
    console.log(`✅ Procesamiento completado en ${Date.now() - startTime}ms`);
    return NextResponse.json({
      success: true,
      type,
      dealership_id,
      processed_clients: totalProcessed,
      segments_changed: segmentsChanged,
      processing_time_ms: Date.now() - startTime,
      summary: segmentSummary
    });
  } catch (error) {
    console.log('❌ Error general en LRF Calculation:', error);
    return NextResponse.json({ error: 'Error interno en LRF Calculation', success: false }, { status: 500 });
  }
} 