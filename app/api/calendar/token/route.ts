import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const secretKey = process.env.JWT_SECRET || 'yourFallbackSecret';

export async function POST(request: NextRequest) {
  console.log('🔄 Generando token de calendario...');
  
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Obtener el token JWT personalizado del header Authorization
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ Header Authorization no encontrado');
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 });
    }

    const token = authHeader.substring(7); // Remover "Bearer "
    
    // Verificar token JWT personalizado
    let payload;
    try {
      payload = jwt.verify(token, secretKey) as any;
    } catch (error) {
      console.log('❌ Token JWT inválido:', error);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const dealershipId = payload.dealership_id;
    
    if (!dealershipId) {
      console.log('❌ Dealership ID no encontrado en token');
      return NextResponse.json({ error: 'Dealership ID not found' }, { status: 400 });
    }

    const { expires_in_days = 30 } = await request.json();

    // Generar token único
    const tokenBytes = crypto.getRandomValues(new Uint8Array(24));
    const tokenHash = Buffer.from(tokenBytes).toString('base64');
    
    // Calcular fecha de expiración
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expires_in_days);

    // Crear cliente Supabase con contexto de autenticación
    const supabaseWithAuth = createRouteHandlerClient({ cookies });
    
    // Establecer el contexto de autenticación manualmente
    await supabaseWithAuth.auth.setSession({
      access_token: token,
      refresh_token: ''
    });

    // Desactivar token anterior si existe
    await supabaseWithAuth
      .from('calendar_tokens')
      .update({ is_active: false })
      .eq('dealership_id', dealershipId)
      .eq('is_active', true);

    // Insertar nuevo token
    const { data, error } = await supabaseWithAuth
      .from('calendar_tokens')
      .insert({
        dealership_id: dealershipId,
        token_hash: tokenHash,
        expires_at: expiresAt.toISOString(),
        created_by: payload.user_id || null,
        is_active: true,
        access_count: 0
      })
      .select()
      .single();

    if (error) {
      console.log('❌ Error generando token:', error);
      return NextResponse.json({ error: 'Failed to generate token' }, { status: 500 });
    }

    console.log('✅ Token generado exitosamente');
    return NextResponse.json({ 
      token: tokenHash,
      expires_in_days,
      dealership_id: dealershipId
    });

  } catch (error) {
    console.log('❌ Error inesperado:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  console.log('🔄 Validando token de calendario...');
  
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    
    if (!token) {
      console.log('❌ Token no proporcionado');
      return NextResponse.json({ error: 'Token required' }, { status: 400 });
    }

    const supabase = createRouteHandlerClient({ cookies });

    // Validar token usando la función de la base de datos
    const { data, error } = await supabase.rpc('validate_calendar_token', {
      p_token_hash: token
    });

    if (error) {
      console.log('❌ Error validando token:', error);
      return NextResponse.json({ error: 'Failed to validate token' }, { status: 500 });
    }

    if (!data || data.length === 0) {
      console.log('❌ Token no encontrado');
      return NextResponse.json({ error: 'Token not found' }, { status: 404 });
    }

    const tokenData = data[0];
    
    if (!tokenData.is_valid) {
      console.log('❌ Token inválido:', tokenData.error_message);
      return NextResponse.json({ 
        error: tokenData.error_message || 'Invalid token' 
      }, { status: 401 });
    }

    console.log('✅ Token validado exitosamente');
    return NextResponse.json({ 
      is_valid: true,
      dealership_id: tokenData.dealership_id
    });

  } catch (error) {
    console.log('❌ Error inesperado:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  console.log('🔄 Revocando token de calendario...');
  
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Obtener el token JWT personalizado del header Authorization
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ Header Authorization no encontrado');
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 });
    }

    const token = authHeader.substring(7); // Remover "Bearer "
    
    // Verificar token JWT personalizado
    let payload;
    try {
      payload = jwt.verify(token, secretKey) as any;
    } catch (error) {
      console.log('❌ Token JWT inválido:', error);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const dealershipId = payload.dealership_id;
    
    if (!dealershipId) {
      console.log('❌ Dealership ID no encontrado en token');
      return NextResponse.json({ error: 'Dealership ID not found' }, { status: 400 });
    }

    // Desactivar token activo
    const { error } = await supabase
      .from('calendar_tokens')
      .update({ is_active: false })
      .eq('dealership_id', dealershipId)
      .eq('is_active', true);

    if (error) {
      console.log('❌ Error revocando token:', error);
      return NextResponse.json({ error: 'Failed to revoke token' }, { status: 500 });
    }

    console.log('✅ Token revocado exitosamente');
    return NextResponse.json({ success: true });

  } catch (error) {
    console.log('❌ Error inesperado:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 