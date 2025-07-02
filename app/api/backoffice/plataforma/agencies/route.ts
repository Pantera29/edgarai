import { NextResponse } from 'next/server';
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { verifyToken } from "../../../../jwt/token";

// UUID de la agencia autorizada para plataforma
const PLATFORM_AGENCY_ID = '6b58f82d-baa6-44ce-9941-1a61975d20b5';

export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('is_active');
    const search = searchParams.get('search');

    console.log('🔄 Obteniendo agencias:', { isActive, search });

    let query = supabase
      .from('dealerships')
      .select('id, name, address, is_active, created_at, updated_at')
      .order('name');

    // Aplicar filtros
    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true');
    }

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Error obteniendo agencias:', error);
      return NextResponse.json(
        { message: 'Error al obtener agencias', error: error.message },
        { status: 500 }
      );
    }

    console.log('✅ Agencias obtenidas exitosamente:', {
      count: data?.length || 0
    });

    return NextResponse.json({
      agencies: data || [],
      count: data?.length || 0
    });

  } catch (error) {
    console.error('💥 Error inesperado:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
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

    const body = await request.json();
    const { name, address, is_active = true } = body;

    console.log('🔄 Creando nueva agencia:', { name, address, is_active });

    // Validar campos requeridos
    if (!name) {
      return NextResponse.json(
        { message: 'El nombre es un campo obligatorio' },
        { status: 400 }
      );
    }

    // Crear la nueva agencia
    const { data, error } = await supabase
      .from('dealerships')
      .insert({
        name: name.trim(),
        address: address?.trim() || null,
        is_active: is_active
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error creando agencia:', error);
      return NextResponse.json(
        { message: 'Error al crear agencia', error: error.message },
        { status: 500 }
      );
    }

    console.log('✅ Agencia creada exitosamente:', data);

    return NextResponse.json({
      message: 'Agencia creada exitosamente',
      agency: data
    }, { status: 201 });

  } catch (error) {
    console.error('💥 Error inesperado:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 