import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { z } from 'zod'

// Esquema de validación para actualización
const updateTransactionSchema = z.object({
  transaction_date: z.string().datetime().optional(),
  notes: z.string().optional(),
  specific_service_id: z.string().uuid().optional()
})

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  console.log('🚀 Iniciando actualización de transacción:', params.id)
  
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const transactionId = params.id

    // Verificar autenticación
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      console.error('❌ Error de autenticación:', authError)
      return NextResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      )
    }

    // Verificar que la transacción existe
    console.log('🔍 Verificando existencia de la transacción:', transactionId)
    const { data: existingTransaction, error: transactionError } = await supabase
      .from('service_transactions')
      .select(`
        *,
        appointments (
          dealership_id
        )
      `)
      .eq('id', transactionId)
      .single()

    if (transactionError || !existingTransaction) {
      console.error('❌ Error al verificar transacción:', transactionError)
      return NextResponse.json(
        { message: 'Transacción no encontrada' },
        { status: 404 }
      )
    }

    // Verificar que el usuario tiene acceso al dealership
    const dealershipId = existingTransaction.appointments?.dealership_id
    const { data: userDealership, error: dealershipError } = await supabase
      .from('dealership_users')
      .select('dealership_id')
      .eq('user_id', session.user.id)
      .eq('dealership_id', dealershipId)
      .single()

    if (dealershipError || !userDealership) {
      console.error('❌ Error de acceso al dealership:', dealershipError)
      return NextResponse.json(
        { message: 'No tienes acceso a este concesionario' },
        { status: 403 }
      )
    }

    // Obtener y validar el cuerpo de la petición
    const body = await request.json()
    console.log('📝 Payload de actualización recibido:', body)
    
    const validationResult = updateTransactionSchema.safeParse(body)
    if (!validationResult.success) {
      console.error('❌ Error de validación:', validationResult.error)
      return NextResponse.json(
        { 
          message: 'Datos inválidos',
          details: validationResult.error.errors 
        },
        { status: 400 }
      )
    }

    const { transaction_date, notes, specific_service_id } = validationResult.data

    // Si se proporciona specific_service_id, validar el servicio específico
    if (specific_service_id) {
      const { data: specificService, error: specificServiceError } = await supabase
        .from('specific_services')
        .select('*')
        .eq('id', specific_service_id)
        .single()

      if (specificServiceError || !specificService) {
        console.error('❌ Error al buscar el servicio específico:', specificServiceError)
        return NextResponse.json(
          { message: 'Servicio específico no encontrado' },
          { status: 404 }
        )
      }

      if (!specificService.is_active) {
        console.error('❌ El servicio específico está inactivo')
        return NextResponse.json(
          { message: 'El servicio específico está inactivo' },
          { status: 400 }
        )
      }

      if (specificService.dealership_id !== dealershipId) {
        console.error('❌ El servicio específico no pertenece al concesionario')
        return NextResponse.json(
          { message: 'El servicio específico no pertenece al concesionario' },
          { status: 400 }
        )
      }
    }

    // Preparar los campos a actualizar
    const updates: Record<string, any> = {}
    if (transaction_date) updates.transaction_date = transaction_date
    if (notes !== undefined) updates.notes = notes
    if (specific_service_id) updates.specific_service_id = specific_service_id

    // Si no hay campos para actualizar
    if (Object.keys(updates).length === 0) {
      console.log('❌ No hay campos para actualizar')
      return NextResponse.json(
        { message: 'No hay campos para actualizar' },
        { status: 400 }
      )
    }

    // Actualizar la transacción
    console.log('📝 Actualizando transacción:', {
      id: transactionId,
      updates
    })

    const { data: updatedTransaction, error: updateError } = await supabase
      .from('service_transactions')
      .update(updates)
      .eq('id', transactionId)
      .select(`
        *,
        specific_service (
          service_name,
          kilometers,
          months,
          price
        )
      `)
      .single()

    if (updateError) {
      console.error('❌ Error al actualizar la transacción:', updateError)
      return NextResponse.json(
        { message: 'Error al actualizar la transacción' },
        { status: 500 }
      )
    }

    console.log('✅ Transacción actualizada exitosamente:', updatedTransaction)
    return NextResponse.json(
      {
        message: 'Transacción actualizada exitosamente',
        transaction: updatedTransaction
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('💥 Error inesperado:', error)
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 