import { NextResponse } from 'next/server';
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { verifyToken } from "../../../../jwt/token";

export async function GET(request: Request) {
  try {
    console.log('🚀 [Templates Available] Obteniendo templates disponibles');
    
    const supabase = createServerComponentClient({ cookies });
    
    // Autenticación
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || null;
    
    if (!token) {
      console.log('❌ [Templates Available] Token de autorización faltante');
      return NextResponse.json({ error: 'Token de autorización requerido' }, { status: 401 });
    }

    let userInfo: any = null;
    try {
      userInfo = verifyToken(token);
      console.log('👤 [Templates Available] Usuario autenticado:', {
        id: userInfo?.id,
        dealership_id: userInfo?.dealership_id
      });
    } catch (error) {
      console.error('❌ [Templates Available] Token inválido:', error);
      return NextResponse.json({ error: 'Token inválido o expirado' }, { status: 401 });
    }

    const dealership_id = userInfo?.dealership_id;
    if (!dealership_id) {
      console.log('❌ [Templates Available] dealership_id no encontrado en token');
      return NextResponse.json({ error: 'dealership_id no encontrado en token de autenticación' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category'); // Opcional: filtrar por categoría

    console.log('🔍 [Templates Available] Obteniendo templates para dealership:', {
      dealership_id,
      category: category || 'todas'
    });

    // Construir query para obtener templates aprobados
    let query = supabase
      .from('whatsapp_templates')
      .select(`
        id,
        name,
        language_code,
        category,
        body_text,
        header_text,
        footer_text,
        parameter_format,
        parameter_count,
        components
      `)
      .eq('dealership_id', dealership_id)
      .eq('status', 'approved')
      .order('name');

    // Filtrar por categoría si se especifica
    if (category) {
      query = query.eq('category', category);
    }

    const { data: templates, error } = await query;

    if (error) {
      console.error('❌ [Templates Available] Error obteniendo templates:', error);
      return NextResponse.json({ 
        error: 'Error al obtener templates',
        details: error.message 
      }, { status: 500 });
    }

    console.log('✅ [Templates Available] Templates obtenidos:', {
      count: templates?.length || 0,
      dealership_id
    });

    return NextResponse.json({
      success: true,
      templates: templates || []
    });

  } catch (error) {
    console.error('💥 [Templates Available] Error inesperado:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}
