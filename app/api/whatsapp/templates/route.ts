import { NextResponse } from 'next/server';
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { verifyToken } from "../../../jwt/token";

/**
 * POST /api/whatsapp/templates
 * Crea un nuevo template de WhatsApp en estado draft
 * 
 * El template se guarda localmente y NO se envía a Kapso hasta que sea aprobado
 */
export async function POST(request: Request) {
  try {
    console.log('🚀 [Templates] Iniciando creación de template');
    
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
      console.log('👤 [Templates] Usuario autenticado:', {
        id: userInfo?.id,
        dealership_id: userInfo?.dealership_id
      });
    } catch (error) {
      console.error('❌ [Templates] Token inválido:', error);
      return NextResponse.json(
        { error: 'Token inválido o expirado' },
        { status: 401 }
      );
    }

    const dealership_id = userInfo?.dealership_id;
    if (!dealership_id) {
      console.log('❌ [Templates] dealership_id no encontrado en token');
      return NextResponse.json(
        { error: 'dealership_id no encontrado en token de autenticación' },
        { status: 401 }
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

    console.log('📝 [Templates] Datos recibidos:', {
      name,
      language_code,
      category,
      parameter_format,
      parameter_count,
    });

    // Validar campos requeridos
    if (!name || !language_code || !category || !body_text) {
      console.log('❌ [Templates] Campos requeridos faltantes');
      return NextResponse.json(
        { error: 'Campos requeridos: name, language_code, category, body_text' },
        { status: 400 }
      );
    }

    // Validar formato del nombre (solo lowercase, números y guiones bajos)
    const nameRegex = /^[a-z0-9_]+$/;
    if (!nameRegex.test(name)) {
      console.log('❌ [Templates] Nombre inválido:', name);
      return NextResponse.json(
        { error: 'El nombre solo puede contener letras minúsculas, números y guiones bajos' },
        { status: 400 }
      );
    }

    // Obtener whatsapp_config_id del dealership
    console.log('🔍 [Templates] Obteniendo whatsapp_config_id del dealership');
    const { data: dealership, error: dealershipError } = await supabase
      .from('dealerships')
      .select('whatsapp_config_id, kapso_api_key')
      .eq('id', dealership_id)
      .single();

    if (dealershipError || !dealership) {
      console.error('❌ [Templates] Error al obtener dealership:', dealershipError);
      return NextResponse.json(
        { error: 'Dealership no encontrado' },
        { status: 404 }
      );
    }

    if (!dealership.whatsapp_config_id) {
      console.log('❌ [Templates] whatsapp_config_id no configurado');
      return NextResponse.json(
        { error: 'WhatsApp no está configurado para este dealership. Contacta al administrador.' },
        { status: 400 }
      );
    }

    console.log('✅ [Templates] whatsapp_config_id obtenido:', dealership.whatsapp_config_id);

    // Verificar si ya existe un template con el mismo nombre e idioma
    const { data: existingTemplate, error: checkError } = await supabase
      .from('whatsapp_templates')
      .select('id')
      .eq('dealership_id', dealership_id)
      .eq('name', name)
      .eq('language_code', language_code)
      .maybeSingle();

    if (existingTemplate) {
      console.log('❌ [Templates] Template ya existe con ese nombre e idioma');
      return NextResponse.json(
        { error: 'Ya existe un template con ese nombre e idioma' },
        { status: 400 }
      );
    }

    // Guardar template en la base de datos en estado draft
    console.log('💾 [Templates] Guardando template en base de datos');
    const templateData = {
      dealership_id,
      whatsapp_config_id: dealership.whatsapp_config_id,
      name,
      language_code,
      category,
      parameter_format: parameter_format || 'NAMED',
      parameter_count: parameter_count || 0,
      status: 'draft',
      body_text,
      header_text: header_text || null,
      footer_text: footer_text || null,
      components: components || [],
      metadata: {
        created_by: userInfo?.id,
        created_at: new Date().toISOString(),
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: newTemplate, error: insertError } = await supabase
      .from('whatsapp_templates')
      .insert([templateData])
      .select()
      .single();

    if (insertError) {
      console.error('❌ [Templates] Error al insertar template:', insertError);
      
      // Mensaje más amigable según el tipo de error
      let userMessage = 'Error al guardar el template';
      if (insertError.code === '23502') {
        userMessage = 'Error de configuración de base de datos. Contacta al administrador.';
      } else if (insertError.code === '23505') {
        userMessage = 'Ya existe un template con ese nombre e idioma';
      }
      
      return NextResponse.json(
        { 
          error: userMessage,
          details: insertError.message,
          code: insertError.code 
        },
        { status: 500 }
      );
    }

    console.log('✅ [Templates] Template creado exitosamente:', newTemplate.id);

    return NextResponse.json({
      success: true,
      message: 'Template creado como borrador exitosamente',
      data: newTemplate,
    }, { status: 201 });

  } catch (error: any) {
    console.error('❌ [Templates] Error inesperado:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    );
  }
}

