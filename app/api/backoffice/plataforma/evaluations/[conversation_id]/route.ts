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

    // Verificar si ya existe una evaluación
    const { data: existingEvaluation, error: fetchError } = await supabase
      .from('conversation_evaluations')
      .select('*')
      .eq('conversation_id', conversationId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('❌ Error verificando evaluación existente:', fetchError);
      return NextResponse.json(
        { message: 'Error al verificar evaluación existente', error: fetchError.message },
        { status: 500 }
      );
    }

    // Preparar datos de actualización - solo incluir campos que se envían
    const updateData: any = {
      conversation_id: conversationId,
      evaluated_by: tokenData.dealership_id,
      updated_at: new Date().toISOString()
    };

    // Solo incluir campos que se envían en el request
    if (evaluation_status !== undefined) {
      updateData.evaluation_status = evaluation_status;
    }
    if (evaluation_tags !== undefined) {
      updateData.evaluation_tags = evaluation_tags;
    }
    if (admin_comments !== undefined) {
      updateData.admin_comments = admin_comments;
    }

    // Si es una nueva evaluación, agregar campos de creación
    if (!existingEvaluation) {
      updateData.evaluated_at = new Date().toISOString();
      // Establecer valores por defecto solo para nuevas evaluaciones
      if (evaluation_status === undefined) {
        updateData.evaluation_status = 'pending';
      }
      if (evaluation_tags === undefined) {
        updateData.evaluation_tags = [];
      }
      if (admin_comments === undefined) {
        updateData.admin_comments = null;
      }
    }

    console.log('🔄 Datos de actualización:', updateData);

    const { data, error } = await supabase
      .from('conversation_evaluations')
      .upsert(updateData, {
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