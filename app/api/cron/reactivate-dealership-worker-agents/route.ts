import { NextResponse } from 'next/server';
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export const dynamic = 'force-dynamic';

interface ReactivateDealershipWorkerAgentsRequest {
  dealership_id?: string;
}

interface AgentSetting {
  id: string;
  phone_number: string;
  dealership_id: string;
  agent_active: boolean;
  updated_at: string;
  updated_by: string;
  notes: string | null;
}

interface ProcessResult {
  setting_id: string;
  phone_number: string;
  dealership_id: string;
  success: boolean;
  error?: string;
}

export async function POST(request: Request) {
  const startTime = new Date();
  console.log('🚀 [CRON-DEALERSHIP-WORKER-REACTIVATE] Iniciando reactivación de agentes desactivados por dealership_worker:', {
    timestamp: startTime.toISOString(),
    user_agent: request.headers.get('user-agent')
  });

  try {
    const supabase = createServerComponentClient({ cookies });
    
    // Parsear el body de la request
    let body: ReactivateDealershipWorkerAgentsRequest = {};
    try {
      body = await request.json();
    } catch (error) {
      console.log('ℹ️ [CRON-DEALERSHIP-WORKER-REACTIVATE] No se proporcionó body, procesando todos los dealerships');
    }

    const { dealership_id } = body;
    
    // Validar formato del dealership_id si se proporciona
    if (dealership_id) {
      const isUuidFormat = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(dealership_id);
      if (!isUuidFormat) {
        console.error('❌ [CRON-DEALERSHIP-WORKER-REACTIVATE] Formato de dealership_id inválido:', dealership_id);
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
      
      console.log('🏢 [CRON-DEALERSHIP-WORKER-REACTIVATE] Procesando dealership específico:', dealership_id);
    } else {
      console.log('🌍 [CRON-DEALERSHIP-WORKER-REACTIVATE] Procesando TODOS los dealerships');
    }

    // Calcular fecha de hace más de dos días en zona horaria de Ciudad de México
    const today = new Date();
    const mexicoOffset = -6; // UTC-6 para Ciudad de México (sin horario de verano)
    const mexicoTime = new Date(today.getTime() + (mexicoOffset * 60 * 60 * 1000));
    const twoDaysAgo = new Date(mexicoTime);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    console.log('📅 [CRON-DEALERSHIP-WORKER-REACTIVATE] Buscando agentes desactivados por dealership_worker antes del:', twoDaysAgo.toISOString(), '(Zona horaria: Ciudad de México)');

    // Construir consulta para obtener agentes desactivados por dealership_worker hace más de dos días
    let query = supabase
      .from('phone_agent_settings')
      .select('*')
      .eq('agent_active', false)
      .eq('updated_by', 'dealership_worker')
      .lt('updated_at', twoDaysAgo.toISOString());

    // Aplicar filtro de dealership si se proporciona
    if (dealership_id) {
      query = query.eq('dealership_id', dealership_id);
    }

    const { data: agentSettings, error: queryError } = await query;

    if (queryError) {
      console.error('❌ [CRON-DEALERSHIP-WORKER-REACTIVATE] Error consultando phone_agent_settings:', queryError);
      return NextResponse.json(
        { 
          success: false,
          message: 'Error consultando configuración de agentes en la base de datos',
          error_code: 'DATABASE_QUERY_ERROR',
          error_details: queryError.message
        },
        { status: 500 }
      );
    }

    if (!agentSettings || agentSettings.length === 0) {
      console.log('ℹ️ [CRON-DEALERSHIP-WORKER-REACTIVATE] No se encontraron agentes para reactivar');
      return NextResponse.json({
        success: true,
        message: 'No se encontraron agentes desactivados por dealership_worker hace más de dos días',
        dealership_id: dealership_id || null,
        processed_count: 0,
        success_count: 0,
        error_count: 0,
        timestamp: new Date().toISOString(),
        duration_ms: Date.now() - startTime.getTime(),
        dealerships_affected: [],
        details: []
      });
    }

    console.log(`📊 [CRON-DEALERSHIP-WORKER-REACTIVATE] Encontrados ${agentSettings.length} agentes para reactivar`);

    const results: ProcessResult[] = [];
    const dealershipsAffected = new Set<string>();

    // Procesar cada configuración de agente
    for (const setting of agentSettings) {
      try {
        console.log(`🔄 [CRON-DEALERSHIP-WORKER-REACTIVATE] Procesando agente: ${setting.phone_number} (ID: ${setting.id})`);
        
        // Llamar al endpoint de agent-control para reactivar el agente
        const baseUrl = process.env.NODE_ENV === 'production' ? 'https://edgarai.vercel.app' : 'http://localhost:3000';
        const updateResponse = await fetch(`${baseUrl}/api/agent-control`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            phone_number: setting.phone_number,
            dealership_id: setting.dealership_id,
            agent_active: true,
            notes: `Reactivado automáticamente por cron job - agente desactivado por dealership_worker hace más de dos días (${setting.updated_at})`,
            updated_by: 'cron_dealership_worker_reactivate'
          })
        });

        if (updateResponse.ok) {
          console.log(`✅ [CRON-DEALERSHIP-WORKER-REACTIVATE] Agente ${setting.phone_number} reactivado exitosamente`);
          results.push({
            setting_id: setting.id,
            phone_number: setting.phone_number,
            dealership_id: setting.dealership_id,
            success: true
          });
          dealershipsAffected.add(setting.dealership_id);
        } else {
          const errorData = await updateResponse.json();
          console.error(`❌ [CRON-DEALERSHIP-WORKER-REACTIVATE] Error reactivando agente ${setting.phone_number}:`, errorData);
          results.push({
            setting_id: setting.id,
            phone_number: setting.phone_number,
            dealership_id: setting.dealership_id,
            success: false,
            error: errorData.message || `HTTP ${updateResponse.status}`
          });
        }
      } catch (error) {
        console.error(`💥 [CRON-DEALERSHIP-WORKER-REACTIVATE] Error inesperado procesando agente ${setting.phone_number}:`, error);
        results.push({
          setting_id: setting.id,
          phone_number: setting.phone_number,
          dealership_id: setting.dealership_id,
          success: false,
          error: error instanceof Error ? error.message : 'Error inesperado'
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const errorCount = results.filter(r => !r.success).length;
    const endTime = new Date();
    const durationMs = endTime.getTime() - startTime.getTime();

    console.log(`🎉 [CRON-DEALERSHIP-WORKER-REACTIVATE] Proceso completado:`, {
      processed_count: agentSettings.length,
      success_count: successCount,
      error_count: errorCount,
      duration_ms: durationMs,
      dealerships_affected: Array.from(dealershipsAffected)
    });

    return NextResponse.json({
      success: true,
      message: `Agentes desactivados por dealership_worker reactivados exitosamente`,
      dealership_id: dealership_id || null,
      processed_count: agentSettings.length,
      success_count: successCount,
      error_count: errorCount,
      timestamp: endTime.toISOString(),
      duration_ms: durationMs,
      dealerships_affected: Array.from(dealershipsAffected),
      details: results
    });

  } catch (error) {
    console.error('💥 [CRON-DEALERSHIP-WORKER-REACTIVATE] Error inesperado:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Error interno del servidor durante el proceso de reactivación',
        error_code: 'INTERNAL_SERVER_ERROR',
        error_details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
