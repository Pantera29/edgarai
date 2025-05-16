import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { z } from 'zod'

// Esquema de validación
const createTransactionSchema = z.object({
  appointment_id: z.string().uuid(),
  transaction_date: z.string().datetime().optional(),
  notes: z.string().optional(),
  dealership_id: z.string().uuid(),
  specific_service_id: z.string().uuid().optional()
})

export async function POST(request: Request) {
  console.log('Iniciando creación de transacción...')
  
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Verificar autenticación
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      console.error('Error de autenticación:', authError)
      return NextResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      )
    }

    // Obtener y validar el cuerpo de la petición
    const body = await request.json()
    console.log('Cuerpo de la petición recibido:', body)
    
    const validationResult = createTransactionSchema.safeParse(body)
    if (!validationResult.success) {
      console.error('Error de validación:', validationResult.error)
      return NextResponse.json(
        { 
          message: 'Datos inválidos',
          details: validationResult.error.errors 
        },
        { status: 400 }
      )
    }

    const { appointment_id, transaction_date, notes, dealership_id, specific_service_id } = validationResult.data

    // Verificar que el usuario tiene acceso al dealership
    const { data: userDealership, error: dealershipError } = await supabase
      .from('dealership_users')
      .select('dealership_id')
      .eq('user_id', session.user.id)
      .eq('dealership_id', dealership_id)
      .single()

    if (dealershipError || !userDealership) {
      console.error('Error de acceso al dealership:', dealershipError)
      return NextResponse.json(
        { message: 'No tienes acceso a este concesionario' },
        { status: 403 }
      )
    }

    // Verificar que la cita existe y está completada
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select(`
        *,
        vehicles (
          model_id
        )
      `)
      .eq('id', appointment_id)
      .single()

    if (appointmentError || !appointment) {
      console.error('Error al buscar la cita:', appointmentError)
      return NextResponse.json(
        { message: 'Cita no encontrada' },
        { status: 404 }
      )
    }

    if (appointment.status !== 'completed') {
      console.error('La cita no está completada:', appointment.status)
      return NextResponse.json(
        { message: 'La cita debe estar completada para crear una transacción' },
        { status: 400 }
      )
    }

    if (appointment.dealership_id !== dealership_id) {
      console.error('El dealership_id no coincide:', { 
        appointmentDealership: appointment.dealership_id, 
        providedDealership: dealership_id 
      })
      return NextResponse.json(
        { message: 'El concesionario no coincide con la cita' },
        { status: 400 }
      )
    }

    // Verificar que no existe una transacción para esta cita
    const { data: existingTransaction, error: transactionError } = await supabase
      .from('service_transactions')
      .select('id')
      .eq('appointment_id', appointment_id)
      .single()

    if (transactionError && transactionError.code !== 'PGRST116') {
      console.error('Error al verificar transacción existente:', transactionError)
      return NextResponse.json(
        { message: 'Error al verificar transacción existente' },
        { status: 500 }
      )
    }

    if (existingTransaction) {
      console.error('Ya existe una transacción para esta cita')
      return NextResponse.json(
        { message: 'Ya existe una transacción para esta cita' },
        { status: 409 }
      )
    }

    // Si se proporciona specific_service_id, validar el servicio específico
    if (specific_service_id) {
      const { data: specificService, error: specificServiceError } = await supabase
        .from('specific_services')
        .select('*')
        .eq('id', specific_service_id)
        .single()

      if (specificServiceError || !specificService) {
        console.error('Error al buscar el servicio específico:', specificServiceError)
        return NextResponse.json(
          { message: 'Servicio específico no encontrado' },
          { status: 404 }
        )
      }

      if (!specificService.is_active) {
        console.error('El servicio específico está inactivo')
        return NextResponse.json(
          { message: 'El servicio específico está inactivo' },
          { status: 400 }
        )
      }

      if (specificService.dealership_id !== dealership_id) {
        console.error('El servicio específico no pertenece al concesionario')
        return NextResponse.json(
          { message: 'El servicio específico no pertenece al concesionario' },
          { status: 400 }
        )
      }

      if (specificService.model_id !== appointment.vehicles?.model_id) {
        console.error('El modelo del servicio específico no coincide con el vehículo')
        return NextResponse.json(
          { message: 'El modelo del servicio específico no coincide con el vehículo' },
          { status: 400 }
        )
      }
    }

    // Crear la transacción
    const { data: transaction, error: createError } = await supabase
      .from('service_transactions')
      .insert({
        appointment_id,
        transaction_date: transaction_date || new Date().toISOString(),
        notes,
        dealership_id,
        specific_service_id
      })
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

    if (createError) {
      console.error('Error al crear la transacción:', createError)
      return NextResponse.json(
        { message: 'Error al crear la transacción' },
        { status: 500 }
      )
    }

    console.log('Transacción creada exitosamente:', transaction)
    return NextResponse.json(
      {
        message: 'Transacción creada exitosamente',
        transaction
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Error inesperado:', error)
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 