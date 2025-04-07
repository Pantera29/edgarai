import { NextResponse } from 'next/server';
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const supabase = createServerComponentClient({ cookies });

    const requestBody = await request.json();
    const message = requestBody.Message;

    // Validar tipo de mensaje
    if (!message || (message.Type ?? message.type) !== "end-of-call-report") {
      return NextResponse.json(
        { message: 'Invalid webhook payload: missing or incorrect Type' },
        { status: 400 }
      );
    }

    const {
      EndedReason,
      Call,
      RecordingUrl,
      Summary,
      Transcript,
      Messages
    } = message;

    // Validar existencia de número de teléfono del cliente
    if (!Call || !Call.Customer || !Call.Customer.Number) {
      return NextResponse.json(
        { message: 'Missing required call information: customer number' },
        { status: 400 }
      );
    }

    const customerPhone = Call.Customer.Number;

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
    const formattedMessages = Array.isArray(Messages)
      ? Messages.map((msg) => ({
          role: msg.Role || 'user',
          content: msg.Message || ''
        }))
      : [];

    const metadata = {
      call_id: Call.Id,
      call_sid: Call.CallSid,
      call_duration: Call.CallDuration,
      ended_reason: EndedReason,
      recording_url: RecordingUrl,
      summary: Summary,
      transcript: Transcript,
      callObject: Call,
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
