import { NextResponse } from 'next/server';
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  try {
    const supabase = createServerComponentClient({ cookies });
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');

    console.log('🔍 Verificando cliente:', {
      phone,
      url: request.url,
      searchParams: Object.fromEntries(searchParams.entries())
    });

    if (!phone) {
      console.log('❌ Error: Teléfono no proporcionado');
      return NextResponse.json(
        { message: 'Phone parameter is required in URL query. Usage: /api/customers/verify?phone={phone_number}. The phone number should include country code or local format (digits only will be normalized automatically).' },
        { status: 400 }
      );
    }

    // Normalizar el número de teléfono
    const normalizedPhone = phone.replace(/[^0-9]/g, '');
    console.log('📱 Teléfono normalizado:', normalizedPhone);

    const { data, error } = await supabase
      .from('client')
      .select('id, names, email, created_at, agent_active')
      .eq('phone_number', normalizedPhone)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('❌ Error verificando cliente:', {
        error: error.message,
        phone: normalizedPhone
      });
      return NextResponse.json(
        { message: 'Error verifying client in database. This is a temporary system issue. Please try again or create a new client at /api/customers/create if this phone number should be registered.' },
        { status: 500 }
      );
    }

    if (!data) {
      console.log('ℹ️ Cliente no encontrado:', normalizedPhone);
      return NextResponse.json(
        { exists: false },
        { status: 404 }
      );
    }

    console.log('✅ Cliente encontrado:', {
      id: data.id,
      name: data.names,
      email: data.email,
      agent_active: data.agent_active
    });

    return NextResponse.json({
      exists: true,
      client: {
        id: data.id,
        name: data.names,
        email: data.email,
        agent_active: data.agent_active
      }
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
      { message: 'Internal server error during client verification. Please verify the phone number format and try again. You can also create a new client at /api/customers/create if needed.' },
      { status: 500 }
    );
  }
}