import { NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

type SpecificServiceInput = {
  model_id: string
  dealership_id: string
  service_name?: string
  kilometers: number
  months: number
  price?: number
  service_id?: string | null
  additional_price?: number
  additional_description?: string
  includes_additional?: boolean
  is_active?: boolean
}

function generateServiceName(km: number, months: number) {
  return `Servicio de ${km} kms o ${months} meses`;
}

export async function POST(request: Request) {
  try {
    const supabase = createServerComponentClient({ cookies });
    const body = await request.json();

    const items: SpecificServiceInput[] = Array.isArray(body) ? body : [body];

    if (!items.length) {
      return NextResponse.json({ error: 'Body vacío' }, { status: 400 });
    }

    // Validación y saneo
    const toInsert = items.map((i, idx) => {
      const {
        model_id,
        dealership_id,
        service_name,
        kilometers,
        months,
        price,
        service_id,
        additional_price,
        additional_description,
        includes_additional,
        is_active,
      } = i;

      if (!model_id || !dealership_id || !kilometers || !months) {
        throw new Error(`Fila ${idx + 1}: faltan campos requeridos (model_id, dealership_id, kilometers, months)`);
      }
      if (kilometers <= 0 || months <= 0) {
        throw new Error(`Fila ${idx + 1}: kilometers y months deben ser positivos`);
      }

      return {
        model_id,
        dealership_id,
        service_name: service_name && service_name.trim().length > 0 ? service_name : generateServiceName(kilometers, months),
        kilometers,
        months,
        price: price || 0,
        service_id: service_id || null,
        additional_price: additional_price || 0,
        additional_description: additional_description || '',
        includes_additional: includes_additional !== undefined ? includes_additional : true,
        is_active: is_active !== undefined ? is_active : true,
      };
    });

    // 1) Validar duplicados dentro del payload (mismo model_id y mismo km o mismos months)
    const seenKm = new Set<string>();
    const seenMonths = new Set<string>();
    for (const [idx, r] of toInsert.entries()) {
      const kmKey = `${r.dealership_id}::${r.model_id}::km::${r.kilometers}`;
      if (seenKm.has(kmKey)) {
        return NextResponse.json({
          error: `Fila ${idx + 1}: ya existe otra fila en el payload para el mismo modelo con kilómetros ${r.kilometers}.`
        }, { status: 409 });
      }
      seenKm.add(kmKey);
      const mKey = `${r.dealership_id}::${r.model_id}::m::${r.months}`;
      if (seenMonths.has(mKey)) {
        return NextResponse.json({
          error: `Fila ${idx + 1}: ya existe otra fila en el payload para el mismo modelo con meses ${r.months}.`
        }, { status: 409 });
      }
      seenMonths.add(mKey);
    }

    // 2) Validar duplicados contra la base (por agencia y modelo, mismo km o mismos months)
    for (const r of toInsert) {
      const { data: existing, error: existErr } = await supabase
        .from('specific_services')
        .select('id, kilometers, months')
        .eq('dealership_id', r.dealership_id)
        .eq('model_id', r.model_id)
        .or(`kilometers.eq.${r.kilometers},months.eq.${r.months}`)
        .limit(1);

      if (existErr) {
        console.log('❌ [SpecificServiceCreate] Error validando duplicados:', existErr.message);
        return NextResponse.json({ error: 'Error validando duplicados', details: existErr.message }, { status: 500 });
      }
      if (existing && existing.length > 0) {
        const e = existing[0];
        const conflictField = e.kilometers === r.kilometers ? `kilómetros ${r.kilometers}` : `meses ${r.months}`;
        return NextResponse.json({
          error: `Ya existe un servicio específico para este modelo y ${conflictField}.`
        }, { status: 409 });
      }
    }

    console.log('🆕 [SpecificServiceCreate] Insertando registros:', toInsert.length);

    const { error } = await supabase
      .from('specific_services')
      .insert(toInsert);

    if (error) {
      console.log('❌ [SpecificServiceCreate] Error al crear servicios específicos:', error.message);
      return NextResponse.json({ error: 'Error al crear servicios específicos', details: error.message }, { status: 500 });
    }

    console.log('✅ [SpecificServiceCreate] Registros creados:', toInsert.length);
    return NextResponse.json({ created: toInsert.length });
  } catch (error: any) {
    console.log('💥 [SpecificServiceCreate] Error inesperado:', error?.message || error);
    return NextResponse.json({ error: 'Error interno del servidor', details: error?.message || String(error) }, { status: 500 });
  }
}


