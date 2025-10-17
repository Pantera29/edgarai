import { NextResponse } from 'next/server';
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { verifyToken } from "../../../../jwt/token";

/**
 * PUT /api/whatsapp/templates/[id]
 * Edita un template de WhatsApp existente (solo si está en estado draft)
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🚀 [Templates] Iniciando edición de template:', params.id);
    
    const supabase = createServerComponentClient({ cookies });
    
    // Autenticación
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || null;
    
    if (!token) {
      console.log('❌ [Templates] Token de autorización faltante');
      return NextResponse.json(
        { error: 'Token de autorización requerido' },
        { status: 401 }
      );
    }

    let userInfo: any = null;
    try {
      userInfo = verifyToken(token);
    } catch (error) {
      console.error('❌ [Templates] Token inválido:', error);
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
    const { data: existingTemplate, error: fetchError } = await supabase
      .from('whatsapp_templates')
      .select('*')
      .eq('id', params.id)
      .eq('dealership_id', dealership_id)
      .single();

    if (fetchError || !existingTemplate) {
      console.error('❌ [Templates] Template no encontrado:', fetchError);
      return NextResponse.json(
        { error: 'Template no encontrado' },
        { status: 404 }
      );
    }

    // Validar que el template esté en estado draft
    if (existingTemplate.status !== 'draft') {
      console.log('❌ [Templates] Template no está en estado draft:', existingTemplate.status);
      return NextResponse.json(
        { error: 'Solo se pueden editar templates en estado borrador' },
        { status: 400 }
      );
    }

    // Obtener datos del request
    const body = await request.json();
    const {
      name,
      language_code,
      category,
      parameter_format,
      components,
      body_text,
      header_text,
      footer_text,
      parameter_count,
    } = body;

    console.log('📝 [Templates] Datos de actualización recibidos:', {
      name,
      language_code,
      category,
    });

    // Validar campos requeridos
    if (!name || !language_code || !category || !body_text) {
      return NextResponse.json(
        { error: 'Campos requeridos: name, language_code, category, body_text' },
        { status: 400 }
      );
    }

    // Validar formato del nombre
    const nameRegex = /^[a-z0-9_]+$/;
    if (!nameRegex.test(name)) {
      return NextResponse.json(
        { error: 'El nombre solo puede contener letras minúsculas, números y guiones bajos' },
        { status: 400 }
      );
    }

    // Si el nombre o idioma cambió, verificar que no exista otro con ese nombre/idioma
    if (name !== existingTemplate.name || language_code !== existingTemplate.language_code) {
      const { data: duplicateTemplate } = await supabase
        .from('whatsapp_templates')
        .select('id')
        .eq('dealership_id', dealership_id)
        .eq('name', name)
        .eq('language_code', language_code)
        .neq('id', params.id)
        .maybeSingle();

      if (duplicateTemplate) {
        return NextResponse.json(
          { error: 'Ya existe otro template con ese nombre e idioma' },
          { status: 400 }
        );
      }
    }

    // Actualizar template
    console.log('💾 [Templates] Actualizando template en base de datos');
    const updateData = {
      name,
      language_code,
      category,
      parameter_format: parameter_format || 'NAMED',
      parameter_count: parameter_count || 0,
      body_text,
      header_text: header_text || null,
      footer_text: footer_text || null,
      components: components || [],
      updated_at: new Date().toISOString(),
    };

    const { data: updatedTemplate, error: updateError } = await supabase
      .from('whatsapp_templates')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ [Templates] Error al actualizar template:', updateError);
      return NextResponse.json(
        { error: 'Error al actualizar el template', details: updateError.message },
        { status: 500 }
      );
    }

    console.log('✅ [Templates] Template actualizado exitosamente');

    return NextResponse.json({
      success: true,
      message: 'Template actualizado exitosamente',
      data: updatedTemplate,
    });

  } catch (error: any) {
    console.error('❌ [Templates] Error inesperado:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    );
  }
}

