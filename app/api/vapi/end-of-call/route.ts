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

    // Buscar cliente por teléfono
    let clientId = null;
    let dealershipId = null;

    const { data: clientData } = await supabase
      .from("client")
      .select("id, dealership_id")
      .eq("phone_number", customerPhone)
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

    // Construir metadatos con información disponible
    const metadata = {
      call_id: call?.id || call?.Id,
      call_sid: call?.callSid || call?.CallSid,
      call_duration: call?.callDuration || call?.CallDuration,
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
          metadata
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