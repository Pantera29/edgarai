import { NextResponse } from 'next/server';
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { verifyToken } from "../../../../../jwt/token";

/**
 * POST /api/whatsapp/templates/[id]/submit
 * Envía un template de WhatsApp a Kapso para aprobación
 * 
 * 1. Verifica que el template esté en estado draft
 * 2. Crea el template en Kapso (draft)
 * 3. Envía el template a WhatsApp para aprobación
 * 4. Actualiza el estado local a 'submitted'
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🚀 [Templates Submit] Iniciando envío a aprobar:', params.id);
    
    const supabase = createServerComponentClient({ cookies });
    
    // Autenticación
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || null;
    
    if (!token) {
      console.log('❌ [Templates Submit] Token de autorización faltante');
      return NextResponse.json(
        { error: 'Token de autorización requerido' },
        { status: 401 }
      );
    }

    let userInfo: any = null;
    try {
      userInfo = verifyToken(token);
    } catch (error) {
      console.error('❌ [Templates Submit] Token inválido:', error);
      return NextResponse.json(
        { error: 'Token inválido o expirado' },
        { status: 401 }
      );
    }

    const dealership_id = userInfo?.dealership_id;
    if (!dealership_id) {
      return NextResponse.json(
        { error: 'dealership_id no encontrado en token de autenticación' },
        { status: 401 }
      );
    }

    // Obtener template existente
    console.log('🔍 [Templates Submit] Obteniendo template de la base de datos');
    const { data: template, error: fetchError } = await supabase
      .from('whatsapp_templates')
      .select('*')
      .eq('id', params.id)
      .eq('dealership_id', dealership_id)
      .single();

    if (fetchError || !template) {
      console.error('❌ [Templates Submit] Template no encontrado:', fetchError);
      return NextResponse.json(
        { error: 'Template no encontrado' },
        { status: 404 }
      );
    }

    // Validar que el template esté en estado draft
    if (template.status !== 'draft') {
      console.log('❌ [Templates Submit] Template no está en estado draft:', template.status);
      return NextResponse.json(
        { error: 'Solo se pueden enviar a aprobar templates en estado borrador' },
        { status: 400 }
      );
    }

    // Obtener configuración de Kapso del dealership
    console.log('🔑 [Templates Submit] Obteniendo configuración de Kapso');
    const { data: dealership, error: dealershipError } = await supabase
      .from('dealerships')
      .select('kapso_api_key, whatsapp_config_id')
      .eq('id', dealership_id)
      .single();

    if (dealershipError || !dealership) {
      console.error('❌ [Templates Submit] Error al obtener dealership:', dealershipError);
      return NextResponse.json(
        { error: 'Dealership no encontrado' },
        { status: 404 }
      );
    }

    if (!dealership.kapso_api_key) {
      console.log('❌ [Templates Submit] API Key de Kapso no configurada');
      return NextResponse.json(
        { error: 'API Key de Kapso no está configurada. Contacta al administrador.' },
        { status: 400 }
      );
    }

    if (!dealership.whatsapp_config_id) {
      console.log('❌ [Templates Submit] whatsapp_config_id no configurado');
      return NextResponse.json(
        { error: 'WhatsApp Config ID no está configurado. Contacta al administrador.' },
        { status: 400 }
      );
    }

    console.log('✅ [Templates Submit] Configuración de Kapso obtenida');

    // Preparar payload para Kapso según la documentación
    const kapsoPayload = {
      template: {
        name: template.name,
        language_code: template.language_code,
        category: template.category,
        parameter_format: template.parameter_format || 'NAMED',
        components: template.components || [],
      },
      whatsapp_config_id: dealership.whatsapp_config_id,
    };

    console.log('📦 [Templates Submit] Payload para Kapso preparado:', {
      name: template.name,
      language_code: template.language_code,
      category: template.category,
    });

    // Enviar a Kapso para crear el template (como draft)
    console.log('📤 [Templates Submit] Enviando template a Kapso...');
    const kapsoCreateUrl = 'https://app.kapso.ai/api/v1/whatsapp_templates';
    
    const createResponse = await fetch(kapsoCreateUrl, {
      method: 'POST',
      headers: {
        'X-API-Key': dealership.kapso_api_key,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(kapsoPayload),
    });

    if (!createResponse.ok) {
      const errorData = await createResponse.json().catch(() => null);
      console.error('❌ [Templates Submit] Error en Kapso create:', {
        status: createResponse.status,
        statusText: createResponse.statusText,
        error: errorData,
      });
      
      return NextResponse.json(
        {
          error: 'Error al crear template en Kapso',
          details: errorData?.message || createResponse.statusText,
          kapso_errors: errorData?.errors || [],
        },
        { status: createResponse.status }
      );
    }

    const kapsoCreateData = await createResponse.json();
    console.log('✅ [Templates Submit] Template creado en Kapso:', kapsoCreateData.data?.id);

    const kapsoTemplateId = kapsoCreateData.data?.id;
    if (!kapsoTemplateId) {
      console.error('❌ [Templates Submit] No se recibió ID del template de Kapso');
      return NextResponse.json(
        { error: 'No se recibió ID del template desde Kapso' },
        { status: 500 }
      );
    }

    // Ahora enviar a aprobar (submit) el template en Kapso
    console.log('📤 [Templates Submit] Enviando a aprobar en Kapso...');
    const kapsoSubmitUrl = `https://app.kapso.ai/api/v1/whatsapp_templates/${kapsoTemplateId}/submit`;
    
    const submitResponse = await fetch(kapsoSubmitUrl, {
      method: 'POST',
      headers: {
        'X-API-Key': dealership.kapso_api_key,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        whatsapp_config_id: dealership.whatsapp_config_id,
      }),
    });

    if (!submitResponse.ok) {
      const errorData = await submitResponse.json().catch(() => null);
      console.error('❌ [Templates Submit] Error al enviar a aprobar en Kapso:', {
        status: submitResponse.status,
        statusText: submitResponse.statusText,
        error: errorData,
      });

      // Actualizar el template con el kapso_template_id aunque el submit falló
      await supabase
        .from('whatsapp_templates')
        .update({
          kapso_template_id: kapsoTemplateId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', params.id);
      
      return NextResponse.json(
        {
          error: 'Template creado en Kapso pero error al enviar a aprobar',
          details: errorData?.message || submitResponse.statusText,
        },
        { status: submitResponse.status }
      );
    }

    const kapsoSubmitData = await submitResponse.json();
    console.log('✅ [Templates Submit] Template enviado a aprobar en Kapso');

    // Actualizar estado del template en nuestra base de datos
    console.log('💾 [Templates Submit] Actualizando estado local a "submitted"');
    const { data: updatedTemplate, error: updateError } = await supabase
      .from('whatsapp_templates')
      .update({
        status: 'submitted',
        kapso_template_id: kapsoTemplateId,
        metadata: {
          ...template.metadata,
          submitted_at: new Date().toISOString(),
          submitted_by: userInfo?.id,
          kapso_submission_id: kapsoSubmitData.submission_id,
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ [Templates Submit] Error al actualizar estado local:', updateError);
      // No retornamos error aquí porque el template ya fue enviado a Kapso exitosamente
    }

    console.log('✅ [Templates Submit] Proceso completado exitosamente');

    return NextResponse.json({
      success: true,
      message: 'Template enviado a WhatsApp para aprobación',
      data: {
        template_id: params.id,
        template_name: template.name,
        kapso_template_id: kapsoTemplateId,
        submission_id: kapsoSubmitData.submission_id,
        status: 'submitted',
      },
    });

  } catch (error: any) {
    console.error('❌ [Templates Submit] Error inesperado:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    );
  }
}

