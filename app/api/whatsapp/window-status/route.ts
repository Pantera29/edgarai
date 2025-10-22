import { NextResponse } from 'next/server';
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { verifyToken } from "../../../jwt/token";
import { calculateWhatsAppWindowStatus } from "../../../../utils/whatsapp-window";

export async function GET(request: Request) {
  try {
    console.log('🚀 [Window Status] Verificando estado de ventana de 24h');
    
    const supabase = createServerComponentClient({ cookies });
    
    // Autenticación
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || null;
    
    if (!token) {
      console.log('❌ [Window Status] Token de autorización faltante');
      return NextResponse.json({ error: 'Token de autorización requerido' }, { status: 401 });
    }

    let userInfo: any = null;
    try {
      userInfo = verifyToken(token);
      console.log('👤 [Window Status] Usuario autenticado:', {
        id: userInfo?.id,
        dealership_id: userInfo?.dealership_id
      });
    } catch (error) {
      console.error('❌ [Window Status] Token inválido:', error);
      return NextResponse.json({ error: 'Token inválido o expirado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversation_id');
    
    if (!conversationId) {
      console.log('❌ [Window Status] conversation_id requerido');
      return NextResponse.json({ error: 'conversation_id requerido' }, { status: 400 });
    }

    console.log('🔍 [Window Status] Obteniendo conversación:', conversationId);

    // Obtener conversación y mensajes
    const { data: conversation, error: convError } = await supabase
      .from('chat_conversations')
      .select(`
        id,
        messages,
        dealership_id
      `)
      .eq('id', conversationId)
      .eq('dealership_id', userInfo.dealership_id)
      .single();

    if (convError || !conversation) {
      console.error('❌ [Window Status] Conversación no encontrada:', convError);
      return NextResponse.json({ error: 'Conversación no encontrada' }, { status: 404 });
    }

    console.log('✅ [Window Status] Conversación obtenida:', {
      id: conversation.id,
      dealership_id: conversation.dealership_id,
      messages_count: conversation.messages?.length || 0
    });

    // Calcular estado de la ventana
    const windowStatus = calculateWhatsAppWindowStatus(
      conversation.messages || [],
      conversation.dealership_id
    );

    console.log('📊 [Window Status] Estado calculado:', {
      isWithinWindow: windowStatus.isWithinWindow,
      canSendFreeMessage: windowStatus.canSendFreeMessage,
      requiresTemplate: windowStatus.requiresTemplate,
      hoursSinceLastMessage: windowStatus.hoursSinceLastMessage
    });

    return NextResponse.json({
      success: true,
      windowStatus
    });

  } catch (error) {
    console.error('💥 [Window Status] Error inesperado:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}
