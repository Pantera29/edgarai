// app/api/whatsapp/analyze-conversations/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// Crear cliente de Supabase con service key para bypass auth
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Interfaz para el resultado del análisis (igual que en llamadas)
interface ConversationAnalysis {
  outcome_type: "appointment_scheduled" | "appointment_rescheduled" | "follow_up_scheduled" | "information_provided" | "customer_unavailable" | "no_action_needed" | "unknown";
  follow_up_notes: string | null;
  customer_satisfaction: "satisfied" | "neutral" | "dissatisfied" | "unknown";
  agent_performance: "excellent" | "good" | "needs_improvement" | "unknown";
}

// Función para analizar conversaciones de WhatsApp
async function analyzeWhatsAppConversation(messages: any[]): Promise<ConversationAnalysis> {
  try {
    // Verificar API key
    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY no está configurada');
      return {
        outcome_type: "unknown",
        follow_up_notes: null,
        customer_satisfaction: "unknown",
        agent_performance: "unknown"
      };
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Formatear los mensajes de WhatsApp para el análisis
    const conversationText = messages.map(msg => {
      const role = msg.agente ? 'Asistente' : 'Cliente';
      const message = msg.message || msg.content || '';
      return `${role}: ${message}`;
    }).join('\n');

    // Si no hay contenido suficiente para analizar
    if (conversationText.length < 20) {
      return {
        outcome_type: "unknown",
        follow_up_notes: "Conversación demasiado corta para analizar",
        customer_satisfaction: "unknown",
        agent_performance: "unknown"
      };
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4.1",
      messages: [
        {
          role: "system",
          content: `Eres un asistente especializado en analizar conversaciones de WhatsApp de un taller automotriz.

Analiza la conversación y devuelve un objeto JSON con EXACTAMENTE estos campos:

{
  "outcome_type": string, // Uno de: "appointment_scheduled", "appointment_rescheduled", "follow_up_scheduled", "information_provided", "customer_unavailable", "no_action_needed", "unknown"
  "follow_up_notes": string | null, // Notas de seguimiento o null si no hay nada pendiente
  "customer_satisfaction": string, // Uno de: "satisfied", "neutral", "dissatisfied", "unknown"
  "agent_performance": string // Uno de: "excellent", "good", "needs_improvement", "unknown"
}

Criterios para cada campo:

1. outcome_type:
   - "appointment_scheduled": Se agendó una nueva cita
   - "appointment_rescheduled": Se cambió una cita existente
   - "follow_up_scheduled": Se acordó un seguimiento futuro
   - "information_provided": Se proporcionó información útil (horarios, ubicación, servicios)
   - "customer_unavailable": Cliente no respondió o no mostró interés
   - "no_action_needed": Cliente no necesita el servicio por ahora
   - "unknown": No se puede determinar el resultado

2. follow_up_notes:
   - Si hay algo pendiente por hacer, escríbelo brevemente
   - Si no hay nada pendiente, usa null

3. customer_satisfaction:
   - "satisfied": Cliente contento, agradecido o positivo
   - "neutral": Cliente indiferente o conversación neutra
   - "dissatisfied": Cliente molesto, frustrado o negativo
   - "unknown": No se puede determinar

4. agent_performance:
   - "excellent": Asistente muy profesional, resolvió dudas efectivamente
   - "good": Asistente cumplió bien su función
   - "needs_improvement": Asistente tuvo dificultades, no entendió o fue poco útil
   - "unknown": No se puede evaluar

IMPORTANTE: Responde ÚNICAMENTE con el objeto JSON, sin texto adicional.`
        },
        {
          role: "user",
          content: conversationText
        }
      ],
      temperature: 0.1,
      max_tokens: 300
    });

    const analysisText = response.choices[0].message.content;
    if (!analysisText) {
      throw new Error('No se recibió respuesta del análisis');
    }

    // Limpiar el texto de respuesta para asegurar que sea JSON válido
    const cleanJsonText = analysisText.trim().replace(/^```json\n?/, '').replace(/\n?```$/, '');
    
    try {
      const analysis = JSON.parse(cleanJsonText) as ConversationAnalysis;
      console.log('Análisis WhatsApp completado:', analysis);
      return analysis;
    } catch (parseError) {
      console.error('Error al parsear la respuesta JSON:', parseError);
      console.error('Respuesta recibida:', analysisText);
      throw new Error('La respuesta no es un JSON válido');
    }

  } catch (error) {
    console.error('Error al analizar conversación de WhatsApp:', error);
    return {
      outcome_type: "unknown",
      follow_up_notes: `Error en análisis: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      customer_satisfaction: "unknown",
      agent_performance: "unknown"
    };
  }
}

// Función para obtener el conteo de conversaciones pendientes
async function getRemainingCount(dealership_id?: string): Promise<number> {
  try {
    let query = supabase
      .from('chat_conversations')
      .select('*', { count: 'exact', head: true })
      .eq('channel', 'whatsapp')
      .is('was_successful', null);

    // Filtrar por dealership si se proporciona
    if (dealership_id) {
      query = query.eq('dealership_id', dealership_id);
    }

    const { count } = await query;
    return count || 0;
  } catch (error) {
    console.error('Error obteniendo conteo restante:', error);
    return 0;
  }
}

// Endpoint principal POST
export async function POST(request: Request) {
  console.log('🔍 [WhatsApp Analyzer] Iniciando análisis de conversaciones');
  
  try {
    const body = await request.json();
    const { batch_size = 10, dealership_id = null } = body;

    console.log('📝 [WhatsApp Analyzer] Parámetros:', { batch_size, dealership_id });

    // Obtener conversaciones de WhatsApp sin análisis
    let query = supabase
      .from('chat_conversations')
      .select('id, messages, user_identifier, dealership_id')
      .eq('channel', 'whatsapp')
      .is('was_successful', null)
      .limit(batch_size);

    // Filtrar por dealership si se proporciona
    if (dealership_id) {
      query = query.eq('dealership_id', dealership_id);
    }

    const { data: conversations, error } = await query;

    if (error) {
      console.error('❌ [WhatsApp Analyzer] Error obteniendo conversaciones:', error);
      throw error;
    }

    if (!conversations || conversations.length === 0) {
      const remaining = await getRemainingCount(dealership_id);
      return NextResponse.json({
        message: 'No hay más conversaciones de WhatsApp para analizar',
        processed: 0,
        results: [],
        remaining: remaining
      });
    }

    console.log(`📊 [WhatsApp Analyzer] Procesando ${conversations.length} conversaciones`);

    const results = [];
    
    for (const conv of conversations) {
      try {
        console.log(`🔄 [WhatsApp Analyzer] Analizando conversación ${conv.id}`);

        // Verificar que existan mensajes
        if (!conv.messages || !Array.isArray(conv.messages) || conv.messages.length === 0) {
          console.log(`⚠️ [WhatsApp Analyzer] Conversación ${conv.id} sin mensajes válidos`);
          results.push({
            id: conv.id,
            status: 'skipped',
            reason: 'No hay mensajes para analizar'
          });
          continue;
        }

        // Analizar la conversación
        const analysis = await analyzeWhatsAppConversation(conv.messages);
        
        // Determinar si fue exitosa basándose en el outcome_type
        const was_successful = analysis.outcome_type !== 'unknown' && 
                              analysis.outcome_type !== 'no_action_needed' &&
                              analysis.outcome_type !== 'customer_unavailable';

        // Actualizar la conversación con el análisis
        const { error: updateError } = await supabase
          .from('chat_conversations')
          .update({
            was_successful: was_successful,
            outcome_type: analysis.outcome_type,
            follow_up_notes: analysis.follow_up_notes,
            customer_satisfaction: analysis.customer_satisfaction,
            agent_performance: analysis.agent_performance
          })
          .eq('id', conv.id);

        if (updateError) {
          console.error(`❌ [WhatsApp Analyzer] Error actualizando conversación ${conv.id}:`, updateError);
          results.push({
            id: conv.id,
            status: 'error',
            error: updateError.message
          });
        } else {
          console.log(`✅ [WhatsApp Analyzer] Conversación ${conv.id} analizada exitosamente`);
          results.push({
            id: conv.id,
            status: 'success',
            was_successful: was_successful,
            analysis: analysis
          });
        }

      } catch (err) {
        console.error(`💥 [WhatsApp Analyzer] Error procesando conversación ${conv.id}:`, err);
        results.push({
          id: conv.id,
          status: 'error',
          error: err instanceof Error ? err.message : 'Error desconocido'
        });
      }
    }

    // Obtener conteo de conversaciones restantes
    const remaining = await getRemainingCount(dealership_id);

    const successCount = results.filter(r => r.status === 'success').length;
    const errorCount = results.filter(r => r.status === 'error').length;
    const skippedCount = results.filter(r => r.status === 'skipped').length;

    console.log(`📈 [WhatsApp Analyzer] Batch completado:`, {
      total: results.length,
      success: successCount,
      errors: errorCount,
      skipped: skippedCount,
      remaining: remaining
    });

    return NextResponse.json({
      message: 'Batch de análisis completado',
      processed: results.length,
      success: successCount,
      errors: errorCount,
      skipped: skippedCount,
      results: results,
      remaining: remaining,
      progress: {
        estimated_total: remaining + results.length,
        completed: results.length,
        percentage: remaining === 0 ? 100 : Math.round((results.length / (remaining + results.length)) * 100)
      }
    });

  } catch (error) {
    console.error('💥 [WhatsApp Analyzer] Error general:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Error interno del servidor',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// Endpoint GET para verificar el estado (CORREGIDO)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dealership_id = searchParams.get('dealership_id');

    console.log('🔍 [WhatsApp Analyzer] GET - Verificando estado, dealership_id:', dealership_id);

    // Query base
    let baseQuery = supabase.from('chat_conversations').select('*', { count: 'exact', head: true });
    
    if (dealership_id && dealership_id !== 'null') {
      baseQuery = baseQuery.eq('dealership_id', dealership_id);
    }

    // Obtener estadísticas paso a paso para mejor debugging
    const { count: totalWhatsApp } = await baseQuery.eq('channel', 'whatsapp');
    console.log('📊 Total WhatsApp conversations:', totalWhatsApp);

    const { count: pending } = await baseQuery
      .eq('channel', 'whatsapp')
      .is('was_successful', null);
    console.log('📊 Pending conversations:', pending);

    const analyzed = (totalWhatsApp || 0) - (pending || 0);
    const progressPercentage = totalWhatsApp ? Math.round((analyzed / totalWhatsApp) * 100) : 0;

    console.log('📊 Estadísticas calculadas:', {
      total: totalWhatsApp,
      analyzed,
      pending,
      progress: progressPercentage
    });

    return NextResponse.json({
      total_whatsapp_conversations: totalWhatsApp || 0,
      analyzed: analyzed,
      pending: pending || 0,
      progress_percentage: progressPercentage,
      dealership_filter: dealership_id || 'all'
    });

  } catch (error) {
    console.error('❌ [WhatsApp Analyzer] Error obteniendo estadísticas:', error);
    return NextResponse.json(
      { 
        error: 'Error obteniendo estadísticas',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}