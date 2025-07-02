import { NextResponse } from 'next/server';
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { verifyToken } from "../../../../../jwt/token";

// UUID de la agencia autorizada para plataforma
const PLATFORM_AGENCY_ID = '6b58f82d-baa6-44ce-9941-1a61975d20b5';

export async function PUT(
  request: Request,
  { params }: { params: { conversation_id: string } }
) {
  try {
    const supabase = createServerComponentClient({ cookies });
    
    // Verificar token de super admin
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ Token no proporcionado');
      return NextResponse.json(
        { message: 'Token de autorización requerido' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const tokenData = verifyToken(token);
    
    if (!tokenData || tokenData.dealership_id !== PLATFORM_AGENCY_ID) {
      console.log('❌ Acceso no autorizado a plataforma');
      return NextResponse.json(
        { message: 'Acceso no autorizado' },
        { status: 403 }
      );
    }

    const conversationId = params.conversation_id;
    const body = await request.json();
    
    console.log('🔄 Actualizando evaluación:', {
      conversationId,
      body,
      evaluatedBy: tokenData.dealership_id
    });

    const { evaluation_status, evaluation_tags, admin_comments } = body;

    // Validar campos
    if (evaluation_status && !['pending', 'successful', 'unsuccessful'].includes(evaluation_status)) {
      return NextResponse.json(
        { message: 'Estado de evaluación inválido' },
        { status: 400 }
      );
    }

    // Verificar si la conversación existe
    const { data: conversation, error: conversationError } = await supabase
      .from('chat_conversations')
      .select('id')
      .eq('id', conversationId)
      .single();

    if (conversationError || !conversation) {
      console.log('❌ Conversación no encontrada:', conversationId);
      return NextResponse.json(
        { message: 'Conversación no encontrada' },
        { status: 404 }
      );
    }

    // Actualizar o crear evaluación
    const evaluationData = {
      conversation_id: conversationId,
      evaluation_status: evaluation_status || 'pending',
      evaluation_tags: evaluation_tags || [],
      admin_comments: admin_comments || null,
      evaluated_by: tokenData.dealership_id,
      evaluated_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('conversation_evaluations')
      .upsert(evaluationData, {
        onConflict: 'conversation_id',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error actualizando evaluación:', error);
      return NextResponse.json(
        { message: 'Error al actualizar evaluación', error: error.message },
        { status: 500 }
      );
    }

    console.log('✅ Evaluación actualizada exitosamente:', data);

    return NextResponse.json({
      message: 'Evaluación actualizada exitosamente',
      evaluation: data
    });

  } catch (error) {
    console.error('💥 Error inesperado:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 