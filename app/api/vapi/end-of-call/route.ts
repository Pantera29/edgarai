import { NextResponse } from 'next/server';
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

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
    const call = message.call || message.Call;
    const recordingUrl = message.recordingUrl || message.RecordingUrl;
    const summary = message.summary || message.Summary;
    const transcript = message.transcript || message.Transcript;
    const messages = message.messages || message.Messages;

    // Validar existencia de número de teléfono del cliente
    if (!call || 
        !(call.customer || call.Customer) || 
        !((call.customer && call.customer.number) || (call.Customer && call.Customer.Number))) {
      return NextResponse.json(
        { message: 'Missing required call information: customer number' },
        { status: 400 }
      );
    }

    // Safely access nested properties
    const customer = call.customer || call.Customer;
    const customerPhone = customer.number || customer.Number;

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

    // Formatear mensajes
    const formattedMessages = Array.isArray(messages)
      ? messages.map((msg) => ({
          role: msg.role || msg.Role || 'user',
          content: msg.message || msg.Message || ''
        }))
      : [];

    const metadata = {
      call_id: call.id || call.Id,
      call_sid: call.callSid || call.CallSid,
      call_duration: call.callDuration || call.CallDuration,
      ended_reason: endedReason,
      recording_url: recordingUrl,
      summary: summary,
      transcript: transcript,
      callObject: call,
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