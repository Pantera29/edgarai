import { NextResponse } from 'next/server';
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const supabase = createServerComponentClient({ cookies });
    
    // Obtener datos del cuerpo de la solicitud
    const requestBody = await request.json();
    const message = requestBody.message || requestBody.Message;
    const messageType = message?.type || message?.Type;
    
    if (!message || messageType !== "end-of-call-report") {
      return NextResponse.json(
        { message: 'Invalid webhook payload' },
        { status: 400 }
      );
    }

    // Extraer campos relevantes del mensaje
    const {
      endedReason,
      call,
      recordingUrl,
      summary,
      transcript,
      messages
    } = message;

    // Validar campos requeridos
    if (!call || !call.customer || !call.customer.number) {
      return NextResponse.json(
        { message: 'Missing required call information' },
        { status: 400 }
      );
    }

    const customerPhone = call.customer.number;

    // Intentar identificar al cliente basado en el número de teléfono
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

    // Formatear los mensajes para almacenarlos correctamente
    const formattedMessages = Array.isArray(messages) 
      ? messages.map(msg => ({
          role: msg.role || 'user',
          content: msg.message
        }))
      : [];

    // Crear metadata con detalles de la llamada
    const metadata = {
      call_id: call.id,
      call_sid: call.callSid,
      call_duration: call.callDuration,
      ended_reason: endedReason,
      recording_url: recordingUrl,
      summary,
      transcript,
      callObject: call,
      original_payload: message
    };

    // Guardar la conversación en la base de datos
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

    // Devolver respuesta exitosa
    return NextResponse.json(
      { message: 'End-of-call report processed successfully', conversation: conversationData },
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