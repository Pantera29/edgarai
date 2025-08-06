import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  console.log('⏰ [Reminders Expire] Iniciando proceso de expiración de recordatorios');
  
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Obtener fecha actual en formato YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0];
    console.log('📅 [Reminders Expire] Fecha actual:', today);
    
    // Buscar recordatorios pendientes que ya pasaron su fecha (limitado a 100)
    const LIMIT_RECORDATORIOS = 100;
    console.log(`🔍 [Reminders Expire] Buscando recordatorios pendientes vencidos (límite: ${LIMIT_RECORDATORIOS})...`);
    const { data: expiredReminders, error: searchError } = await supabase
      .from('reminders')
      .select('reminder_id, reminder_date, dealership_id, reminder_type, client_id_uuid')
      .eq('status', 'pending')
      .lt('reminder_date', today)
      .order('reminder_date', { ascending: true })
      .limit(LIMIT_RECORDATORIOS);
    
    if (searchError) {
      console.error('❌ [Reminders Expire] Error buscando recordatorios vencidos:', searchError);
      return NextResponse.json(
        { error: 'Error al buscar recordatorios vencidos', details: searchError },
        { status: 500 }
      );
    }
    
    if (!expiredReminders || expiredReminders.length === 0) {
      console.log('ℹ️ [Reminders Expire] No hay recordatorios pendientes vencidos');
      return NextResponse.json({
        message: 'No hay recordatorios pendientes vencidos',
        expired_count: 0,
        date: today
      });
    }
    
    console.log(`📊 [Reminders Expire] Encontrados ${expiredReminders.length} recordatorios vencidos (límite aplicado: ${LIMIT_RECORDATORIOS})`);
    
    // Extraer IDs de recordatorios a expirar
    const reminderIds = expiredReminders.map(r => r.reminder_id);
    
    // Actualizar recordatorios vencidos a estado 'cancelled'
    console.log('🔄 [Reminders Expire] Actualizando recordatorios vencidos a estado "cancelled"...');
    const { data: updatedReminders, error: updateError } = await supabase
      .from('reminders')
      .update({ 
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .in('reminder_id', reminderIds)
      .select('reminder_id, status, updated_at');
    
    if (updateError) {
      console.error('❌ [Reminders Expire] Error actualizando recordatorios:', updateError);
      return NextResponse.json(
        { error: 'Error al actualizar recordatorios vencidos', details: updateError },
        { status: 500 }
      );
    }
    
    // Agrupar por dealership para logs detallados
    const byDealership = expiredReminders.reduce((acc, reminder) => {
      if (!acc[reminder.dealership_id]) {
        acc[reminder.dealership_id] = [];
      }
      acc[reminder.dealership_id].push(reminder);
      return acc;
    }, {} as Record<string, typeof expiredReminders>);
    
    console.log('📋 [Reminders Expire] Resumen por agencia:');
    Object.entries(byDealership).forEach(([dealershipId, reminders]) => {
      console.log(`   🏢 Agencia ${dealershipId}: ${reminders.length} recordatorios expirados`);
      reminders.forEach(reminder => {
        console.log(`      - ID: ${reminder.reminder_id}, Tipo: ${reminder.reminder_type}, Fecha: ${reminder.reminder_date}`);
      });
    });
    
    console.log(`✅ [Reminders Expire] Proceso completado exitosamente`);
    console.log(`   📊 Total recordatorios expirados: ${updatedReminders?.length || 0}`);
    console.log(`   📅 Fecha de procesamiento: ${today}`);
    console.log(`   ⚠️ Límite aplicado: ${LIMIT_RECORDATORIOS} recordatorios por ejecución`);
    
    return NextResponse.json({
      message: 'Recordatorios vencidos expirados exitosamente',
      expired_count: updatedReminders?.length || 0,
      date: today,
      limit_applied: LIMIT_RECORDATORIOS,
      details: {
        total_found: expiredReminders.length,
        total_updated: updatedReminders?.length || 0,
        by_dealership: Object.keys(byDealership).length,
        limit_reached: expiredReminders.length === LIMIT_RECORDATORIOS
      }
    });
    
  } catch (error) {
    console.error('❌ [Reminders Expire] Error no manejado:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    );
  }
}

// También soportar GET para testing manual
export async function GET(request: Request) {
  console.log('🔍 [Reminders Expire] Petición GET recibida - ejecutando expiración');
  return await POST(request);
} 