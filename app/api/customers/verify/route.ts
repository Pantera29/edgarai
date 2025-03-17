import { NextResponse } from 'next/server';
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  try {
    const supabase = createServerComponentClient({ cookies });
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');

    if (!phone) {
      return NextResponse.json(
        { message: 'Phone parameter is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('client')
      .select('id, names, email')
      .eq('phone_number', phone)
      .maybeSingle();

    if (error) {
      console.error('Error verifying client:', error.message);
      return NextResponse.json(
        { message: 'Error verifying client' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { exists: false },
        { status: 404 }
      );
    }

    return NextResponse.json({
      exists: true,
      client: {
        id: data.id,
        name: data.names,
        email: data.email
      }
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}