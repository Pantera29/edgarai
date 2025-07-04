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
    const isActive = searchParams.get('active');
    const search = searchParams.get('search');
    const dealershipId = searchParams.get('dealership_id');

    console.log('🔄 Obteniendo usuarios de agencia:', { isActive, search, dealershipId });

    let query = supabase
      .from('worker_agency')
      .select(`
        id,
        email,
        names,
        surnames,
        active,
        created_at,
        last_updated,
        dealership_id,
        dealerships!inner(name)
      `)
      .order('names');

    // Aplicar filtros
    if (isActive !== null) {
      query = query.eq('active', isActive === 'true');
    }

    if (dealershipId) {
      query = query.eq('dealership_id', dealershipId);
    }

    if (search) {
      query = query.or(`names.ilike.%${search}%,surnames.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Error obteniendo usuarios:', error);
      return NextResponse.json(
        { message: 'Error al obtener usuarios', error: error.message },
        { status: 500 }
      );
    }

    console.log('✅ Usuarios obtenidos exitosamente:', {
      count: data?.length || 0
    });

    return NextResponse.json({
      workers: data || [],
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
    const { email, password, names, surnames, dealership_id, active = true } = body;

    console.log('🔄 Creando nuevo usuario:', { email, names, surnames, dealership_id, active });

    // Validar campos requeridos
    if (!email || !password || !names || !surnames || !dealership_id) {
      return NextResponse.json(
        { message: 'Todos los campos son obligatorios: email, password, names, surnames, dealership_id' },
        { status: 400 }
      );
    }

    // Verificar que la agencia existe
    const { data: dealership, error: dealershipError } = await supabase
      .from('dealerships')
      .select('id')
      .eq('id', dealership_id)
      .single();

    if (dealershipError || !dealership) {
      return NextResponse.json(
        { message: 'La agencia especificada no existe' },
        { status: 400 }
      );
    }

    // Verificar que el email no esté duplicado
    const { data: existingUser, error: checkError } = await supabase
      .from('worker_agency')
      .select('id')
      .eq('email', email.trim())
      .single();

    if (existingUser) {
      return NextResponse.json(
        { message: 'Ya existe un usuario con este email' },
        { status: 400 }
      );
    }

    // Crear el nuevo usuario
    const { data, error } = await supabase
      .from('worker_agency')
      .insert({
        email: email.trim(),
        password: password, // En producción, esto debería estar hasheado
        names: names.trim(),
        surnames: surnames.trim(),
        dealership_id: dealership_id,
        active: active
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error creando usuario:', error);
      return NextResponse.json(
        { message: 'Error al crear usuario', error: error.message },
        { status: 500 }
      );
    }

    console.log('✅ Usuario creado exitosamente:', data);

    return NextResponse.json({
      message: 'Usuario creado exitosamente',
      worker: data
    }, { status: 201 });

  } catch (error) {
    console.error('💥 Error inesperado:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 