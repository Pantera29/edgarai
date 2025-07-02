import { NextResponse } from 'next/server';
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { verifyToken } from "../../../../../jwt/token";

// UUID de la agencia autorizada para plataforma
const PLATFORM_AGENCY_ID = '6b58f82d-baa6-44ce-9941-1a61975d20b5';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
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

    const agencyId = params.id;
    const body = await request.json();
    const { name, address, is_active } = body;

    console.log('🔄 Actualizando agencia:', {
      agencyId,
      updates: { name, address, is_active }
    });

    // Verificar que la agencia existe
    const { data: existingAgency, error: fetchError } = await supabase
      .from('dealerships')
      .select('id, name, address')
      .eq('id', agencyId)
      .single();

    if (fetchError || !existingAgency) {
      console.log('❌ Agencia no encontrada:', agencyId);
      return NextResponse.json(
        { message: 'Agencia no encontrada' },
        { status: 404 }
      );
    }

    // Preparar datos de actualización
    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (address !== undefined) updateData.address = address?.trim() || null;
    if (is_active !== undefined) updateData.is_active = is_active;
    updateData.updated_at = new Date().toISOString();

    // Actualizar la agencia
    const { data, error } = await supabase
      .from('dealerships')
      .update(updateData)
      .eq('id', agencyId)
      .select()
      .single();

    if (error) {
      console.error('❌ Error actualizando agencia:', error);
      return NextResponse.json(
        { message: 'Error al actualizar agencia', error: error.message },
        { status: 500 }
      );
    }

    console.log('✅ Agencia actualizada exitosamente:', data);

    return NextResponse.json({
      message: 'Agencia actualizada exitosamente',
      agency: data
    });

  } catch (error) {
    console.error('💥 Error inesperado:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 