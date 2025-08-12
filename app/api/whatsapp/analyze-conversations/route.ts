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
          content: `Eres un analista experto en conversaciones de servicio automotriz especializado en talleres mecánicos, refaccionarias y concesionarios. Tu objetivo es analizar interacciones entre clientes y asistentes/agentes para evaluar la efectividad del servicio y identificar oportunidades de seguimiento.

CONTEXTO DEL NEGOCIO:
- Los clientes contactan por: mantenimiento preventivo, reparaciones, diagnósticos, cotizaciones, citas de servicio
- Los asistentes deben: agendar citas, proporcionar información de servicios, resolver dudas técnicas, dar seguimiento
- El éxito se mide por: conversión a citas, satisfacción del cliente, resolución efectiva de consultas

ANALIZA LA CONVERSACIÓN y devuelve un objeto JSON con EXACTAMENTE estos campos:

{
  "outcome_type": string,
  "follow_up_notes": string | null,
  "customer_satisfaction": string,
  "agent_performance": string
}

CRITERIOS DETALLADOS:

1. outcome_type - Clasifica según el RESULTADO PRINCIPAL de la conversación:
   - "appointment_scheduled": Cliente confirmó una nueva cita con fecha/hora específica
   - "appointment_rescheduled": Se modificó una cita existente (nueva fecha/hora confirmada)
   - "follow_up_scheduled": Se acordó contacto futuro SIN cita específica (ej: "te llamo la próxima semana")
   - "information_provided": Cliente obtuvo la información que buscaba (precios, horarios, servicios) SIN agendar
   - "customer_unavailable": Cliente no respondió después de múltiples intentos O mostró desinterés explícito
   - "no_action_needed": Cliente no requiere servicios actualmente pero la consulta fue resuelta
   - "unknown": Conversación incompleta, ambigua o insuficiente información para clasificar

   PRIORIDAD: appointment_scheduled > appointment_rescheduled > follow_up_scheduled > information_provided

2. follow_up_notes - Acciones pendientes específicas:
   - Si hay algo pendiente: describe QUÉ hacer y CUÁNDO (ej: "Llamar en 2 días para confirmar disponibilidad de pieza")
   - Si no hay pendientes: usa null
   - Enfócate en acciones concretas, no generales

3. customer_satisfaction - Basado en el TONO y RESPUESTAS del cliente:
   - "satisfied": Agradecimientos, confirmaciones positivas, tono amigable
   - "neutral": Respuestas directas sin emoción aparente, consultas informativas
   - "dissatisfied": Quejas, frustración, tono negativo, insatisfacción expresada
   - "unknown": Interacción demasiado breve o ambigua para determinar

4. agent_performance - Evalúa basándote en COMPORTAMIENTOS OBSERVABLES:
   - "excellent": 
     * Respondió todas las preguntas claramente
     * Propuso soluciones proactivamente  
     * Logró el objetivo del cliente
     * Tono profesional y empático
   
   - "good": 
     * Proporcionó información correcta
     * Resolvió la consulta principal
     * Tono apropiado
   
   - "needs_improvement":
     * No entendió la consulta del cliente
     * Información incompleta o incorrecta
     * No siguió protocolos de servicio
     * Tono inapropiado
   
   - "unknown": Interacción demasiado breve para evaluar

EJEMPLOS DE CLASIFICACIÓN:

Ejemplo 1 - Cita Agendada:
Cliente: "¿Cuánto cuesta el servicio mayor?"
Asistente: "El servicio mayor cuesta $2,500 e incluye cambio de aceite, filtros y revisión completa"
Cliente: "Perfecto, ¿cuándo puedo agendar?"
Asistente: "¿Te parece bien el viernes 15 a las 2 PM?"
Cliente: "Sí, perfecto, ahí nos vemos"
→ {"outcome_type": "appointment_scheduled", "follow_up_notes": null, "customer_satisfaction": "satisfied", "agent_performance": "excellent"}

Ejemplo 2 - Solo Información:
Cliente: "¿A qué hora abren los sábados?"
Asistente: "Los sábados abrimos de 8 AM a 2 PM"
Cliente: "Gracias"
→ {"outcome_type": "information_provided", "follow_up_notes": null, "customer_satisfaction": "neutral", "agent_performance": "good"}

Ejemplo 3 - Seguimiento Requerido:
Cliente: "Mi carro hace un ruido raro"
Asistente: "¿Podrías traerlo para revisión?"
Cliente: "Esta semana no puedo, la próxima sí"
Asistente: "Perfecto, te contacto el lunes para agendar"
→ {"outcome_type": "follow_up_scheduled", "follow_up_notes": "Contactar el lunes para agendar revisión de ruido", "customer_satisfaction": "satisfied", "agent_performance": "good"}

INSTRUCCIONES DE RESPUESTA:
1. Lee TODA la conversación antes de clasificar
2. Basáte solo en lo que está explícitamente escrito
3. Si hay dudas entre dos categorías, elige la más conservadora
4. Para follow_up_notes: sé específico sobre QUÉ y CUÁNDO
5. Responde ÚNICAMENTE el objeto JSON sin texto adicional
6. Asegúrate de que todos los valores estén entre comillas

RESPONDE ÚNICAMENTE CON EL OBJETO JSON:`
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