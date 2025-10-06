import { NextResponse } from 'next/server';
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export const dynamic = 'force-dynamic';

interface ReactivateAgentsRequest {
  dealership_id?: string;
}

interface ClientWithAppointment {
  id: string;
  dealership_id: string;
  names: string;
  phone_number: string;
}

interface ProcessResult {
  client_id: string;
  dealership_id: string;
  success: boolean;
  error?: string;
}

export async function POST(request: Request) {
  const startTime = new Date();
  console.log('🚀 [CRON-REACTIVATE] Iniciando reactivación de agentes AI:', {
    timestamp: startTime.toISOString(),
    user_agent: request.headers.get('user-agent')
  });

  try {
    const supabase = createServerComponentClient({ cookies });
    
    // Parsear el body de la request
    let body: ReactivateAgentsRequest = {};
    try {
      body = await request.json();
    } catch (error) {
      console.log('ℹ️ [CRON-REACTIVATE] No se proporcionó body, procesando todos los dealerships');
    }

    const { dealership_id } = body;
    
    // Validar formato del dealership_id si se proporciona
    if (dealership_id) {
      const isUuidFormat = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(dealership_id);
      if (!isUuidFormat) {
        console.error('❌ [CRON-REACTIVATE] Formato de dealership_id inválido:', dealership_id);
        return NextResponse.json(
          { 
            success: false,
            message: 'Formato de dealership_id inválido. Debe ser un UUID válido.',
            error_code: 'INVALID_DEALERSHIP_ID_FORMAT',
            provided_dealership_id: dealership_id
          },
          { status: 400 }
        );
      }
      
      console.log('🏢 [CRON-REACTIVATE] Procesando dealership específico:', dealership_id);
    } else {
      console.log('🌍 [CRON-REACTIVATE] Procesando TODOS los dealerships');
    }

    // Calcular fecha de ayer en zona horaria de Ciudad de México
    const today = new Date();
    const mexicoOffset = -6; // UTC-6 para Ciudad de México (sin horario de verano)
    const mexicoTime = new Date(today.getTime() + (mexicoOffset * 60 * 60 * 1000));
    const yesterday = new Date(mexicoTime);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0]; // YYYY-MM-DD

    console.log('📅 [CRON-REACTIVATE] Buscando citas del:', yesterdayStr, '(Zona horaria: Ciudad de México)');

    // Construir consulta para obtener clientes con citas ayer (excluyendo canceladas)
    let query = supabase
      .from('appointment')
      .select(`
        client_id,
        appointment_date,
        status,
        client:client_id (
          id,
          dealership_id,
          names,
          phone_number,
          agent_active
        )
      `)
      .eq('appointment_date', yesterdayStr)
      .neq('status', 'cancelled'); // Excluir citas canceladas

    // Aplicar filtro de dealership si se proporciona
    if (dealership_id) {
      query = query.eq('client.dealership_id', dealership_id);
    }

    const { data: appointments, error: queryError } = await query;

    if (queryError) {
      console.error('❌ [CRON-REACTIVATE] Error consultando citas:', queryError);
      return NextResponse.json(
        { 
          success: false,
          message: 'Error consultando la base de datos',
          error: queryError.message
        },
        { status: 500 }
      );
    }

    if (!appointments || appointments.length === 0) {
      console.log('ℹ️ [CRON-REACTIVATE] No se encontraron citas (no canceladas) para el', yesterdayStr);
      return NextResponse.json({
        success: true,
        message: 'No se encontraron citas (no canceladas) para reactivar agentes',
        dealership_id: dealership_id || null,
        processed_count: 0,
        success_count: 0,
        error_count: 0,
        timestamp: startTime.toISOString(),
        dealerships_affected: [],
        details: []
      });
    }

    // Obtener clientes únicos (un cliente puede tener múltiples citas el mismo día)
    const uniqueClients = new Map<string, ClientWithAppointment>();
    
    appointments.forEach(appointment => {
      // Verificar que client existe y es un objeto (no un array)
      if (appointment.client && Array.isArray(appointment.client) && appointment.client.length > 0) {
        const client = appointment.client[0] as any;
        if (!uniqueClients.has(client.id)) {
          uniqueClients.set(client.id, {
            id: client.id,
            dealership_id: client.dealership_id,
            names: client.names,
            phone_number: client.phone_number
          });
        }
      } else if (appointment.client && !Array.isArray(appointment.client)) {
        // Si client es un objeto directo
        const client = appointment.client as any;
        if (!uniqueClients.has(client.id)) {
          uniqueClients.set(client.id, {
            id: client.id,
            dealership_id: client.dealership_id,
            names: client.names,
            phone_number: client.phone_number
          });
        }
      }
    });

    const clientsToProcess = Array.from(uniqueClients.values());
    console.log(`📊 [CRON-REACTIVATE] Procesando ${clientsToProcess.length} clientes únicos`);

    const results: ProcessResult[] = [];
    const dealershipsAffected = new Set<string>();

    // Procesar cada cliente
    for (const client of clientsToProcess) {
      try {
        console.log(`🔄 [CRON-REACTIVATE] Procesando cliente: ${client.id} (${client.names})`);
        
        // Llamar al endpoint de agent-control para reactivar el agente
        const baseUrl = process.env.NODE_ENV === 'production' ? 'https://edgarai.vercel.app' : 'http://localhost:3000';
        const updateResponse = await fetch(`${baseUrl}/api/agent-control`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            phone_number: client.phone_number,
            dealership_id: client.dealership_id,
            agent_active: true,
            notes: 'Reactivado automáticamente por cron job - cliente con cita ayer (no cancelada)',
            updated_by: 'cron'
          })
        });

        if (updateResponse.ok) {
          console.log(`✅ [CRON-REACTIVATE] Cliente ${client.id} reactivado exitosamente`);
          results.push({
            client_id: client.id,
            dealership_id: client.dealership_id,
            success: true
          });
          dealershipsAffected.add(client.dealership_id);
        } else {
          const errorData = await updateResponse.json();
          console.error(`❌ [CRON-REACTIVATE] Error reactivando cliente ${client.id}:`, errorData);
          results.push({
            client_id: client.id,
            dealership_id: client.dealership_id,
            success: false,
            error: errorData.message || `HTTP ${updateResponse.status}`
          });
        }
      } catch (error) {
        console.error(`💥 [CRON-REACTIVATE] Error inesperado procesando cliente ${client.id}:`, error);
        results.push({
          client_id: client.id,
          dealership_id: client.dealership_id,
          success: false,
          error: error instanceof Error ? error.message : 'Error inesperado'
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const errorCount = results.filter(r => !r.success).length;
    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();

    console.log(`🎯 [CRON-REACTIVATE] Proceso completado:`, {
      total_processed: clientsToProcess.length,
      success_count: successCount,
      error_count: errorCount,
      duration_ms: duration,
      dealership_id: dealership_id || 'TODOS'
    });

    return NextResponse.json({
      success: true,
      message: 'Agentes reactivados exitosamente',
      dealership_id: dealership_id || null,
      processed_count: clientsToProcess.length,
      success_count: successCount,
      error_count: errorCount,
      timestamp: startTime.toISOString(),
      duration_ms: duration,
      dealerships_affected: Array.from(dealershipsAffected),
      details: results
    });

  } catch (error) {
    console.error('💥 [CRON-REACTIVATE] Error inesperado:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Error inesperado durante la reactivación de agentes',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
