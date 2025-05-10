import { NextResponse } from 'next/server';
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

/**
 * GET endpoint para obtener el dealership_id asociado a un número de teléfono
 */
export async function GET(request: Request) {
  try {
    const supabase = createServerComponentClient({ cookies });
    const { searchParams } = new URL(request.url);
    
    // Obtener parámetro de teléfono
    const phoneNumber = searchParams.get('phone');

    console.log('🔍 Buscando agencia por teléfono:', {
      phoneNumber,
      url: request.url,
      searchParams: Object.fromEntries(searchParams.entries())
    });

    if (!phoneNumber) {
      console.log('❌ Error: Teléfono no proporcionado');
      return NextResponse.json(
        { message: 'El parámetro de teléfono es obligatorio' },
        { status: 400 }
      );
    }

    // Normalizar el número de teléfono
    const normalizedPhone = phoneNumber.replace(/[^0-9]/g, '');
    console.log('📱 Teléfono normalizado:', normalizedPhone);

    // Buscar en la tabla dealership_mapping
    const { data, error } = await supabase
      .from('dealership_mapping')
      .select('dealership_id')
      .eq('phone_number', phoneNumber)
      .maybeSingle();

    if (error) {
      console.error('❌ Error al buscar agencia:', {
        error: error.message,
        phone: normalizedPhone
      });
      return NextResponse.json(
        { message: 'Error al buscar el dealership' },
        { status: 500 }
      );
    }

    if (!data) {
      console.log('ℹ️ Agencia no encontrada:', normalizedPhone);
      return NextResponse.json(
        { message: 'No se encontró ningún dealership con ese número de teléfono' },
        { status: 404 }
      );
    }

    console.log('✅ Agencia encontrada:', {
      dealership_id: data.dealership_id,
      phone: normalizedPhone
    });

    return NextResponse.json({
      dealership_id: data.dealership_id
    });
  } catch (error) {
    console.error('💥 Error inesperado:', {
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : error
    });
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 