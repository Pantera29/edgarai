import { NextResponse } from 'next/server';
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

// Definir la interfaz para los mensajes
interface MessageItem {
  role?: string;
  Role?: string;
  message?: string;
  Message?: string;
}

// Función para determinar la intención del cliente basada en el resumen o transcripción
function determineClientIntent(summary: string, transcript: string): string {
  const text = (summary || transcript || '').toLowerCase();
  
  if (text.includes('cita') || text.includes('agendar') || text.includes('programar') || text.includes('reservar')) {
    return 'agendar_cita';
  } else if (text.includes('ubicación') || text.includes('dirección') || text.includes('dónde') || text.includes('donde')) {
    return 'ubicación';
  } else if (text.includes('horario') || text.includes('hora') || text.includes('abierto') || text.includes('cerrado')) {
    return 'horario';
  } else if (text.includes('servicio') || text.includes('reparación') || text.includes('reparacion') || text.includes('mantenimiento')) {
    return 'servicio';
  } else if (text.includes('precio') || text.includes('costo') || text.includes('cuánto') || text.includes('cuanto')) {
    return 'precio';
  } else {
    return 'información';
  }
}

// Función para determinar si la llamada fue exitosa
function determineCallSuccess(message: any, summary: string): boolean {
  // Verificar si hay un campo explícito de evaluación de éxito
  if (message.successEvaluation !== undefined) {
    return message.successEvaluation === true || message.successEvaluation === 'true';
  }
  
  // Verificar si hay un campo explícito de éxito
  if (message.success !== undefined) {
    return message.success === true || message.success === 'true';
  }
  
  // Analizar el resumen para determinar el éxito
  if (summary) {
    const summaryLower = summary.toLowerCase();
    // Palabras positivas que indican éxito
    const positiveIndicators = ['exitoso', 'exitosamente', 'resuelto', 'satisfecho', 'gracias', 'perfecto', 'bien'];
    // Palabras negativas que indican fracaso
    const negativeIndicators = ['insatisfecho', 'no pudo', 'no pude', 'no se pudo', 'problema', 'falló', 'fallo', 'fracaso'];
    
    // Contar indicadores positivos y negativos
    const positiveCount = positiveIndicators.filter(word => summaryLower.includes(word)).length;
    const negativeCount = negativeIndicators.filter(word => summaryLower.includes(word)).length;
    
    // Si hay más indicadores positivos que negativos, considerar exitosa
    return positiveCount > negativeCount;
  }
  
  // Por defecto, asumir que la llamada fue exitosa si no podemos determinar lo contrario
  return true;
}

// Función para extraer el nombre del agente y el modelo de IA
function extractAgentAndModel(message: any): { agentName: string | null, aiModel: string | null } {
  let agentName = null;
  let aiModel = null;
  
  // Intentar extraer el nombre del agente
  if (message.agent && message.agent.name) {
    agentName = message.agent.name;
  } else if (message.agentName) {
    agentName = message.agentName;
  } else if (message.agent_name) {
    agentName = message.agent_name;
  } else if (message.artifact && message.artifact.agent_name) {
    agentName = message.artifact.agent_name;
  }
  
  // Intentar extraer el modelo de IA
  if (message.model) {
    aiModel = message.model;
  } else if (message.aiModel) {
    aiModel = message.aiModel;
  } else if (message.ai_model) {
    aiModel = message.ai_model;
  } else if (message.artifact && message.artifact.model) {
    aiModel = message.artifact.model;
  }
  
  return { agentName, aiModel };
}

export async function POST(request: Request) {
  try {
    const supabase = createServerComponentClient({ cookies });

    const requestBody = await request.json();
    const message = requestBody.message || requestBody.Message;

    // Validar tipo de mensaje
    if (!message || ((message.type || message.Type) !== "end-of-call-report")) {
      return NextResponse.json(
        { message: 'Invalid webhook payload: missing or incorrect Type' },
        { status: 400 }
      );
    }

    // Use case-insensitive property access with fallbacks
    const endedReason = message.endedReason || message.EndedReason;
    const recordingUrl = message.recordingUrl || message.RecordingUrl;
    const summary = message.summary || message.Summary;
    const transcript = message.transcript || message.Transcript;
    const messageMessages = message.messages || message.Messages;
    
    // Intentar encontrar información de llamada en diferentes ubicaciones posibles
    let call = message.call || message.Call;
    let customerInfo = null;
    let customerPhone = null;

    // Si no se encuentra en la ubicación principal, buscar en lugares alternativos
    if (!call) {
      // Si hay información de cliente directamente en el mensaje
      if (message.customer || message.Customer) {
        customerInfo = message.customer || message.Customer;
      }
      
      // En algunos mensajes la información podría estar en artifact
      if (message.artifact) {
        // Buscar en artifact.call
        if (message.artifact.call) {
          call = message.artifact.call;
        }
        
        // También podría estar en el objeto 'artifact.messages'
        if (!customerInfo && Array.isArray(message.artifact.messages)) {
          // Buscar en los mensajes la información del cliente
          const userMessages = message.artifact.messages.filter(
            (msg: MessageItem) => (msg.role === 'user' || msg.Role === 'user')
          );
          if (userMessages.length > 0) {
            // Podríamos extraer información de los mensajes del usuario si es necesario
          }
        }
      }
    }

    // Si encontramos información de cliente pero no de llamada, crear un objeto call básico
    if (customerInfo && !call) {
      call = { customer: customerInfo };
    }

    // Determinar el número de teléfono del cliente
    if (call && (call.customer || call.Customer)) {
      const customer = call.customer || call.Customer;
      customerPhone = customer.number || customer.Number;
    }
    
    // Si no hay información de cliente, intentar extraerla desde el objeto principal
    if (!customerPhone && message.customer_phone) {
      customerPhone = message.customer_phone;
    }
    
    // También podríamos buscar en message.artifact.stereo_recording_url para identificar cliente
    if (!customerPhone && message.artifact && message.artifact.stereo_recording_url) {
      // A veces los IDs de cliente pueden estar codificados en las URLs
      // Este es un ejemplo, ajusta según cómo esté estructurada tu URL
      const url = message.artifact.stereo_recording_url;
      const match = url.match(/\/([a-f0-9-]+)-\d+-/);
      if (match && match[1]) {
        // Podríamos usar este ID para buscar al cliente
        // callId = match[1];
      }
    }

    // Validar que tenemos suficiente información para proceder
    if (!customerPhone) {
      console.error("Estructura de mensaje no contiene información de cliente:", 
                  JSON.stringify(message, null, 2).substring(0, 1000) + "..."); // Limitado para no llenar logs
      
      return NextResponse.json(
        { message: 'Missing required call information: customer number' },
        { status: 400 }
      );
    }

    // --- INICIO CAMBIO: Normalización del número de teléfono ---
    // Si el número comienza con +52 y tiene al menos 12 caracteres, extrae los últimos 10 dígitos
    let normalizedPhone = customerPhone;
    if (typeof customerPhone === "string" && customerPhone.startsWith("+52") && customerPhone.length >= 12) {
      // Extrae solo los últimos 10 dígitos
      normalizedPhone = customerPhone.slice(-10);
    }
    // Elimina cualquier carácter no numérico (por si acaso)
    normalizedPhone = normalizedPhone.replace(/[^0-9]/g, '');
    // --- FIN CAMBIO ---

    // Buscar cliente por teléfono usando el número normalizado
    let clientId = null;
    let dealershipId = null;

    const { data: clientData } = await supabase
      .from("client")
      .select("id, dealership_id")
      .eq("phone_number", normalizedPhone)
      .maybeSingle();

    if (clientData) {
      clientId = clientData.id;
      dealershipId = clientData.dealership_id;
    }

    // Obtener mensajes de varias posibles ubicaciones
    let messages = messageMessages;
    if (!messages && message.artifact && Array.isArray(message.artifact.messages)) {
      messages = message.artifact.messages;
    }

    // Formatear mensajes
    const formattedMessages = Array.isArray(messages)
      ? messages.map((msg: MessageItem) => ({
          role: msg.role || msg.Role || 'user',
          content: msg.message || msg.Message || ''
        }))
      : [];

    // Extraer información adicional para los nuevos campos
    const callId = call?.id || call?.Id || message.call_id || message.callId;
    
    // Extraer duration_seconds directamente del mensaje principal
    const durationSeconds = message.durationSeconds || message.duration_seconds || 
                          call?.callDuration || call?.CallDuration || 
                          message.duration || null;
    
    const wasSuccessful = determineCallSuccess(message, summary);
    const clientIntent = determineClientIntent(summary, transcript);
    
    // Extraer agent_name y ai_model del objeto call.assistant
    let agentName = null;
    let aiModel = null;
    
    if (call && call.assistant) {
      agentName = call.assistant.name;
      aiModel = call.assistant.model?.model || null;
    } else {
      // Fallback a la función existente si no está en call.assistant
      const extracted = extractAgentAndModel(message);
      agentName = extracted.agentName;
      aiModel = extracted.aiModel;
    }

    // Construir metadatos con información disponible
    const metadata = {
      call_id: callId,
      call_sid: call?.callSid || call?.CallSid,
      call_duration: durationSeconds,
      ended_reason: endedReason,
      recording_url: recordingUrl,
      summary: summary,
      transcript: transcript,
      callObject: call || {},
      original_payload: message
    };

    const { data: conversationData, error } = await supabase
      .from("chat_conversations")
      .insert([
        {
          user_identifier: customerPhone,
          client_id: clientId,
          dealership_id: dealershipId,
          status: 'closed',
          channel: 'phone',
          messages: formattedMessages,
          metadata,
          // Nuevos campos
          duration_seconds: durationSeconds,
          call_id: callId,
          ended_reason: endedReason,
          recording_url: recordingUrl,
          conversation_summary: summary,
          was_successful: wasSuccessful,
          client_intent: clientIntent,
          agent_name: agentName,
          ai_model: aiModel
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error insertando conversación:', error.message);
      return NextResponse.json(
        { message: 'Failed to save conversation', error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: 'End-of-call report processed successfully',
        conversation: conversationData
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}