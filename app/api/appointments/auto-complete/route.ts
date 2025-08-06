import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);
  
  // Obtener parámetros de la URL
  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get('limit') || '10');
  
  console.log('🔄 [Appointments Auto-Complete] ===== INICIO PROCESAMIENTO =====');
  console.log(`🆔 [Appointments Auto-Complete] Request ID: ${requestId}`);
  console.log(`⏰ [Appointments Auto-Complete] Timestamp inicio: ${new Date().toISOString()}`);
  console.log(`📊 [Appointments Auto-Complete] Límite de procesamiento: ${limit} citas`);
  
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Obtener fecha actual en zona horaria de México
    const timezone = 'America/Mexico_City';
    const now = new Date();
    const todayInMexico = new Date(now.toLocaleString("en-US", {timeZone: timezone}));
    const today = todayInMexico.toISOString().split('T')[0];
    
    console.log('🌍 [Appointments Auto-Complete] Información de zona horaria:');
    console.log(`   UTC: ${now.toISOString()}`);
    console.log(`   México: ${todayInMexico.toISOString()}`);
    console.log(`   Fecha México: ${today}`);
    
    // Buscar citas vencidas (pending con fecha anterior a hoy) - CON LÍMITE
    console.log(`🔍 [Appointments Auto-Complete] Buscando citas vencidas (máximo ${limit})...`);
    const { data: expiredAppointments, error: searchError } = await supabase
      .from('appointment')
      .select('id, appointment_date, status, dealership_id')
      .eq('status', 'pending')
      .lt('appointment_date', today)
      .order('appointment_date', { ascending: true })
      .limit(limit);
    
    if (searchError) {
      console.error('❌ [Appointments Auto-Complete] Error buscando citas vencidas:', searchError);
      return NextResponse.json(
        { 
          success: false,
          error: 'Error al buscar citas vencidas',
          details: searchError,
          debug: {
            request_id: requestId,
            execution_time_ms: Date.now() - startTime
          }
        },
        { status: 500 }
      );
    }
    
    if (!expiredAppointments || expiredAppointments.length === 0) {
      console.log('ℹ️ [Appointments Auto-Complete] No hay citas vencidas para auto-completar');
      return NextResponse.json({
        success: true,
        message: 'No hay citas vencidas para auto-completar',
        completed_count: 0,
        processed_count: 0,
        limit: limit,
        date: today,
        debug: {
          request_id: requestId,
          execution_time_ms: Date.now() - startTime
        }
      });
    }
    
    console.log(`📊 [Appointments Auto-Complete] Encontradas ${expiredAppointments.length} citas vencidas (de máximo ${limit})`);
    
    // Agrupar por dealership para logs
    const byDealership = expiredAppointments.reduce((acc, appointment) => {
      const dealershipId = appointment.dealership_id;
      if (!acc[dealershipId]) {
        acc[dealershipId] = [];
      }
      acc[dealershipId].push(appointment);
      return acc;
    }, {} as Record<string, typeof expiredAppointments>);
    
    console.log('📋 [Appointments Auto-Complete] Resumen por agencia:');
    Object.entries(byDealership).forEach(([dealershipId, appointments]) => {
      console.log(`   🏢 Agencia ${dealershipId}: ${appointments.length} citas vencidas`);
    });
    
    // Actualizar cada cita usando el endpoint PATCH existente
    console.log('🔄 [Appointments Auto-Complete] Iniciando actualización de citas vencidas...');
    
    const baseUrl = new URL(request.url).origin;
    const results = await Promise.allSettled(
      expiredAppointments.map(async (appointment, index) => {
        const appointmentStartTime = Date.now();
        console.log(`📤 [Appointments Auto-Complete] Actualizando cita ${index + 1}/${expiredAppointments.length}: ${appointment.id}`);
        
        try {
          // Llamar al endpoint de actualización existente
          const updateUrl = `${baseUrl}/api/appointments/update/${appointment.id}`;
          console.log(`🔗 [Appointments Auto-Complete] Llamando endpoint: ${updateUrl}`);
          
          const response = await fetch(updateUrl, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Cookie': request.headers.get('cookie') || ''
            },
            body: JSON.stringify({
              status: 'completed'
            })
          });
          
          const responseData = await response.json();
          
          console.log(`📡 [Appointments Auto-Complete] Respuesta para cita ${appointment.id}:`, {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok
          });
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${responseData.message || response.statusText}`);
          }
          
          console.log(`✅ [Appointments Auto-Complete] Cita ${appointment.id} actualizada exitosamente en ${Date.now() - appointmentStartTime}ms`);
          
          return {
            appointment_id: appointment.id,
            success: true,
            old_status: appointment.status,
            new_status: 'completed',
            execution_time_ms: Date.now() - appointmentStartTime
          };
          
        } catch (error) {
          console.error(`❌ [Appointments Auto-Complete] Error actualizando cita ${appointment.id}:`, error);
          return {
            appointment_id: appointment.id,
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido',
            old_status: appointment.status,
            execution_time_ms: Date.now() - appointmentStartTime
          };
        }
      })
    );
    
    // Procesar resultados
    const successfulUpdates = results.filter(result => 
      result.status === 'fulfilled' && result.value.success
    ).length;
    
    const failedUpdates = results.filter(result => 
      result.status === 'rejected' || (result.status === 'fulfilled' && !result.value.success)
    ).length;
    
    const totalExecutionTime = Date.now() - startTime;
    
    console.log('📊 [Appointments Auto-Complete] Resumen final:');
    console.log(`   ✅ Citas actualizadas exitosamente: ${successfulUpdates}`);
    console.log(`   ❌ Citas con error: ${failedUpdates}`);
    console.log(`   📋 Total procesadas: ${expiredAppointments.length}`);
    console.log(`   ⏱️ Tiempo total de ejecución: ${totalExecutionTime}ms`);
    
    return NextResponse.json({
      success: true,
      message: 'Proceso de auto-completado de citas finalizado',
      completed_count: successfulUpdates,
      failed_count: failedUpdates,
      processed_count: expiredAppointments.length,
      limit: limit,
      date: today,
      debug: {
        request_id: requestId,
        execution_time_ms: totalExecutionTime,
        by_dealership: Object.keys(byDealership).length
      }
    });
    
  } catch (error) {
    console.error('💥 [Appointments Auto-Complete] Error inesperado:', {
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : error
    });
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Error interno del servidor',
        debug: {
          request_id: requestId,
          execution_time_ms: Date.now() - startTime
        }
      },
      { status: 500 }
    );
  }
}

// También soportar GET para testing manual
export async function GET(request: Request) {
  return POST(request);
} 