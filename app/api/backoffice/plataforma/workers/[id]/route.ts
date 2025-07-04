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

    const { id } = params;
    const body = await request.json();
    const { email, password, names, surnames, dealership_id, active } = body;

    console.log('🔄 Actualizando usuario:', { id, email, names, surnames, dealership_id, active });

    // Validar campos requeridos
    if (!names || !surnames || !dealership_id) {
      return NextResponse.json(
        { message: 'Los campos names, surnames y dealership_id son obligatorios' },
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

    // Verificar que el usuario existe
    const { data: existingUser, error: userError } = await supabase
      .from('worker_agency')
      .select('id, email')
      .eq('id', id)
      .single();

    if (userError || !existingUser) {
      return NextResponse.json(
        { message: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Si se está cambiando el email, verificar que no esté duplicado
    if (email && email !== existingUser.email) {
      const { data: duplicateUser, error: checkError } = await supabase
        .from('worker_agency')
        .select('id')
        .eq('email', email.trim())
        .neq('id', id)
        .single();

      if (duplicateUser) {
        return NextResponse.json(
          { message: 'Ya existe un usuario con este email' },
          { status: 400 }
        );
      }
    }

    // Preparar datos de actualización
    const updateData: any = {
      names: names.trim(),
      surnames: surnames.trim(),
      dealership_id: dealership_id,
      last_updated: new Date().toISOString()
    };

    if (email) {
      updateData.email = email.trim();
    }

    if (password) {
      updateData.password = password; // En producción, esto debería estar hasheado
    }

    if (typeof active === 'boolean') {
      updateData.active = active;
    }

    // Actualizar el usuario
    const { data, error } = await supabase
      .from('worker_agency')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ Error actualizando usuario:', error);
      return NextResponse.json(
        { message: 'Error al actualizar usuario', error: error.message },
        { status: 500 }
      );
    }

    console.log('✅ Usuario actualizado exitosamente:', data);

    return NextResponse.json({
      message: 'Usuario actualizado exitosamente',
      worker: data
    });

  } catch (error) {
    console.error('💥 Error inesperado:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    const { id } = params;

    console.log('🔄 Eliminando usuario:', { id });

    // Verificar que el usuario existe
    const { data: existingUser, error: userError } = await supabase
      .from('worker_agency')
      .select('id')
      .eq('id', id)
      .single();

    if (userError || !existingUser) {
      return NextResponse.json(
        { message: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Eliminar el usuario
    const { error } = await supabase
      .from('worker_agency')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ Error eliminando usuario:', error);
      return NextResponse.json(
        { message: 'Error al eliminar usuario', error: error.message },
        { status: 500 }
      );
    }

    console.log('✅ Usuario eliminado exitosamente');

    return NextResponse.json({
      message: 'Usuario eliminado exitosamente'
    });

  } catch (error) {
    console.error('💥 Error inesperado:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 