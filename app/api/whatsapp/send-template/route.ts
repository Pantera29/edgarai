import { NextResponse } from 'next/server';
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { verifyToken } from "../../../jwt/token";
import { validateTemplateParameters } from '../utils/template-validator';

/**
 * Interfaces de TypeScript para el request y payload
 */
interface TemplateRequestBody {
  client_id: string;
  template_id: string;
  parameters: Record<string, any> | any[];
  header_params?: string | object;
  header_type?: 'text' | 'image' | 'video' | 'document';
  header_filename?: string;
  button_url_params?: Record<string, string>;
  button_quick_reply_payloads?: Record<string, string>;
  button_copy_code_params?: Record<string, string>;
  location_params?: {
    latitude: number;
    longitude: number;
    name: string;
    address: string;
  };
}

interface N8nTemplatePayload {
  dealership_id: string;
  client_id: string;
  template_id: string;
  kapso_template_id: string;
  phone_number: string;
  template_parameters: Record<string, any> | any[];
  metadata: {
    template_name: string;
    parameter_format: string;
    category: string;
  };
  [key: string]: any;
}

/**
 * Formatea un número de teléfono al formato requerido por N8N (521XXXXXXXXXX)
 * Reutilizado de /api/n8n/send/route.ts
 */
function formatPhoneToN8n(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.startsWith('521')) {
    return cleaned;
  }
  
  if (cleaned.length === 10) {
    return `521${cleaned}`;
  }
  
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `521${cleaned.slice(1)}`;
  }
  
  return phone;
}

/**
 * POST /api/whatsapp/send-template
 * 
 * Envía un template pre-aprobado de WhatsApp a través de n8n/Kapso
 * Los templates permiten iniciar conversaciones fuera de la ventana de 24 horas
 */
export async function POST(request: Request) {
  try {
    console.log('🚀 [Template Send] Iniciando envío de template');
    
    const supabase = createServerComponentClient({ cookies });
    
    // 2.1 Autenticación y validación inicial
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || null;
    
    if (!token) {
      console.log('❌ [Template Send] Token de autorización faltante');
      return NextResponse.json(
        { success: false, error: 'Token de autorización requerido' },
        { status: 401 }
      );
    }

    let userInfo: any = null;
    try {
      userInfo = verifyToken(token);
      console.log('👤 [Template Send] Usuario autenticado:', {
        id: userInfo?.id,
        dealership_id: userInfo?.dealership_id
      });
    } catch (error) {
      console.error('❌ [Template Send] Token inválido:', error);
      return NextResponse.json(
        { success: false, error: 'Token inválido o expirado' },
        { status: 401 }
      );
    }

    const dealership_id = userInfo?.dealership_id;
    if (!dealership_id) {
      console.log('❌ [Template Send] dealership_id no encontrado en token');
      return NextResponse.json(
        { success: false, error: 'dealership_id no encontrado en token de autenticación' },
        { status: 401 }
      );
    }

    // Obtener y validar datos de entrada
    const body: TemplateRequestBody = await request.json();
    const {
      client_id,
      template_id,
      parameters,
      header_params,
      header_type,
      header_filename,
      button_url_params,
      button_quick_reply_payloads,
      button_copy_code_params,
      location_params
    } = body;

    console.log('📋 [Template Send] Datos:', { client_id, template_id, has_parameters: !!parameters });

    // Validar campos requeridos
    if (!client_id || !template_id) {
      console.log('❌ [Template Send] Campos requeridos faltantes');
      return NextResponse.json(
        { success: false, error: 'Campos requeridos: client_id, template_id' },
        { status: 400 }
      );
    }

    if (!parameters) {
      console.log('❌ [Template Send] Parameters faltantes');
      return NextResponse.json(
        { success: false, error: 'Campo requerido: parameters' },
        { status: 400 }
      );
    }

    // 2.2 Obtener datos del cliente
    console.log('🔍 [Template Send] Obteniendo datos del cliente');
    const { data: client, error: clientError } = await supabase
      .from('client')
      .select('phone_number, dealership_id, names')
      .eq('id', client_id)
      .single();

    if (clientError || !client) {
      console.error('❌ [Template Send] Cliente no encontrado:', clientError);
      return NextResponse.json(
        { success: false, error: 'Cliente no encontrado' },
        { status: 404 }
      );
    }

    // Validar que el cliente pertenece al dealership del token
    if (client.dealership_id !== dealership_id) {
      console.log('❌ [Template Send] Cliente no pertenece al dealership del usuario');
      return NextResponse.json(
        { success: false, error: 'No tiene acceso a este cliente' },
        { status: 403 }
      );
    }

    console.log('✅ [Template Send] Cliente obtenido:', {
      name: client.names,
      has_phone: !!client.phone_number
    });

    // 2.3 Obtener datos del template
    console.log('🔍 [Template Send] Obteniendo datos del template');
    const { data: template, error: templateError } = await supabase
      .from('whatsapp_templates')
      .select('*')
      .eq('id', template_id)
      .single();

    if (templateError || !template) {
      console.error('❌ [Template Send] Template no encontrado:', templateError);
      return NextResponse.json(
        { success: false, error: 'Template no encontrado' },
        { status: 404 }
      );
    }

    // Validar que el template pertenece al dealership del token
    if (template.dealership_id !== dealership_id) {
      console.log('❌ [Template Send] Template no pertenece al dealership del usuario');
      return NextResponse.json(
        { success: false, error: 'No tiene acceso a este template' },
        { status: 403 }
      );
    }

    // Validar que el template está aprobado
    if (template.status !== 'approved') {
      console.log('❌ [Template Send] Template no está aprobado:', template.status);
      return NextResponse.json(
        { success: false, error: `Template no está aprobado (status: ${template.status})` },
        { status: 400 }
      );
    }

    console.log('✅ [Template Send] Template obtenido:', {
      name: template.name,
      status: template.status,
      category: template.category
    });

    // 2.4 Validar parámetros del template
    console.log('🔍 [Template Send] Validando parámetros del template');
    const validation = validateTemplateParameters(template, parameters);
    if (!validation.valid) {
      console.log('❌ [Template Send] Validación de parámetros fallida:', validation.error);
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    console.log('✅ [Template Send] Parámetros validados correctamente');

    // 2.5 Obtener dealership_mapping (opcional - solo para metadata)
    console.log('🔑 [Template Send] Obteniendo dealership_mapping');
    const { data: mapping } = await supabase
      .from('dealership_mapping')
      .select('whapi_id, dealerships!dealership_mapping_dealership_id_fkey(whatsapp_config_id)')
      .eq('dealership_id', dealership_id)
      .maybeSingle();

    const whatsappConfigId = (mapping?.dealerships as any)?.whatsapp_config_id || null;
    console.log('✅ [Template Send] Mapping obtenido (opcional):', {
      has_whapi_id: !!mapping?.whapi_id,
      has_whatsapp_config_id: !!whatsappConfigId
    });

    // 2.6 Formatear número de teléfono
    const formattedPhone = formatPhoneToN8n(client.phone_number);
    console.log('📞 [Template Send] Número formateado:', formattedPhone);

    // Validar formato del número
    if (!formattedPhone.startsWith('521') || formattedPhone.length < 13) {
      console.log('❌ [Template Send] Número de teléfono inválido:', formattedPhone);
      return NextResponse.json(
        { success: false, error: 'Número de teléfono inválido' },
        { status: 400 }
      );
    }

    // 2.7 Construir payload para n8n
    console.log('📦 [Template Send] Construyendo payload para n8n');
    const payload: N8nTemplatePayload = {
      dealership_id: client.dealership_id,
      client_id,
      template_id,
      kapso_template_id: template.kapso_template_id,
      phone_number: formattedPhone,
      template_parameters: parameters,
      
      // Campos opcionales (solo incluir si están presentes)
      ...(header_params && { header_params }),
      ...(header_type && { header_type }),
      ...(header_filename && { header_filename }),
      ...(button_url_params && { button_url_params }),
      ...(button_quick_reply_payloads && { button_quick_reply_payloads }),
      ...(button_copy_code_params && { button_copy_code_params }),
      ...(location_params && { location_params }),
      
      // Metadata
      metadata: {
        template_name: template.name,
        parameter_format: template.parameter_format,
        category: template.category
      }
    };

    console.log('📋 [Template Send] Payload completo preparado');

    // 2.8 Enviar a n8n
    console.log('📤 [Template Send] Enviando a n8n...');
    const n8nUrl = 'https://n8n.edgarai.com.mx/webhook/kapso-outbound-templates';
    
    const response = await fetch(n8nUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30000) // Timeout 30 segundos
    });

    // Manejar respuesta de N8N
    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ [Template Send] Error en respuesta de N8N:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      return NextResponse.json(
        { 
          success: false, 
          error: `Error en N8N: ${response.status} ${response.statusText}`,
          details: errorData
        },
        { status: response.status }
      );
    }

    const responseData = await response.json();
    console.log('✅ [Template Send] Respuesta de n8n:', responseData);

    // 2.9 Registrar en template_messages
    console.log('📝 [Template Send] Guardando en template_messages...');
    try {
      const { error: insertError } = await supabase
        .from('template_messages')
        .insert({
          template_id,
          dealership_id: client.dealership_id,
          client_id,
          conversation_id: responseData.conversation_id || null,
          recipient_phone: formattedPhone,
          message_id: responseData.message_id || null,
          parameters_sent: parameters,
          status: responseData.success ? 'sent' : 'failed',
          error_message: responseData.error || null
        });

      if (insertError) {
        console.error('❌ [Template Send] Error guardando en template_messages:', insertError);
        // No fallar el request, solo loguear
      } else {
        console.log('✅ [Template Send] Mensaje registrado en template_messages');
      }
    } catch (e) {
      console.error('💥 [Template Send] Error inesperado al guardar en template_messages:', e);
      // No fallar el request, solo loguear
    }

    // 2.10 Retornar respuesta exitosa
    return NextResponse.json({
      success: true,
      message_id: responseData.message_id,
      conversation_id: responseData.conversation_id,
      status: 'sent'
    });

  } catch (error) {
    console.error('💥 [Template Send] Error inesperado:', {
      error: error instanceof Error ? error.message : 'Error desconocido',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido al enviar template'
      },
      { status: 500 }
    );
  }
}

