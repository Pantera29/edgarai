"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { TransactionStatus } from "@/types/transaction"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { ProductSelector } from "./product-selector"
import { TransactionProduct } from "@/types/transaction"
import { format } from "date-fns"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

const formSchema = z.object({
  id_cita: z.string().uuid(),
  estado_pago: z.enum(['pendiente', 'pagado', 'anulado']),
  notas: z.string().optional(),
  productos: z.array(z.object({
    id_producto: z.string().uuid(),
    cantidad: z.number().positive(),
  }))
})

interface TransactionFormProps {
  appointmentId?: string
  onSuccess?: () => void
}

interface FormProduct {
  id_producto: string;
  cantidad: number;
}

export function TransactionForm({ appointmentId, onSuccess }: TransactionFormProps) {
  const [loading, setLoading] = useState(false)
  const [selectedProducts, setSelectedProducts] = useState<TransactionProduct[]>([])
  const [completedAppointments, setCompletedAppointments] = useState<any[]>([])
  const [selectedAppointment, setSelectedAppointment] = useState(appointmentId || '')

  const form = useForm<{
    id_cita: string;
    estado_pago: TransactionStatus;
    notas: string;
    productos: FormProduct[];
  }>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id_cita: appointmentId,
      estado_pago: 'pendiente',
      notas: '',
      productos: []
    }
  })

  useEffect(() => {
    const loadCompletedAppointments = async () => {
      console.log('Cargando citas completadas...');
      const { data, error } = await supabase
        .from('citas')
        .select(`
          id_uuid,
          fecha_hora,
          clientes (
            nombre,
            telefono
          ),
          servicios (nombre),
          vehiculos (
            marca,
            modelo,
            placa
          )
        `)
        .eq('estado', 'completada')
        .order('fecha_hora', { ascending: false });

      console.log('Respuesta:', { data, error });

      if (error) {
        console.error('Error cargando citas:', error);
        return;
      }

      if (data) {
        console.log('Citas cargadas:', data);
        setCompletedAppointments(data);
      }
    };

    if (!appointmentId) {
      loadCompletedAppointments();
    }
  }, [appointmentId]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true)
    
    // Crear un cliente de Supabase específico para esta transacción
    const supabaseClient = createClientComponentClient()
    
    try {
      // 1. Validar que la cita esté completada
      const { data: appointment, error: appointmentError } = await supabaseClient
        .from('citas')
        .select('estado')
        .eq('id_uuid', values.id_cita)
        .single()

      if (appointmentError) throw appointmentError
      if (appointment.estado !== 'completada') {
        throw new Error('La cita debe estar completada')
      }

      // 2. Verificar que no exista una transacción previa
      const { data: existingTransaction, error: existingError } = await supabaseClient
        .from('transacciones_servicio')
        .select('id_transaccion')
        .eq('id_cita', values.id_cita)
        .maybeSingle()

      if (existingError) throw existingError
      if (existingTransaction) {
        throw new Error('Ya existe una transacción para esta cita')
      }

      // 3. Crear la transacción principal
      const { data: transaccion, error: transaccionError } = await supabaseClient
        .from('transacciones_servicio')
        .insert({
          id_cita: values.id_cita,
          estado: values.estado_pago,
          notas: values.notas,
          fecha_transaccion: new Date().toISOString()
        })
        .select()
        .single()

      if (transaccionError) throw transaccionError

      // 4. Procesar cada producto
      console.log('Productos a procesar:', values.productos)

      for (const producto of values.productos) {
        console.log('Procesando producto:', producto)
        
        // Verificar stock
        const { data: stockData, error: stockError } = await supabaseClient
          .from('productos')
          .select('stock_actual, precio')
          .eq('id_producto', producto.id_producto)
          .single()

        console.log('Stock data:', stockData)
        
        if (stockError) {
          console.error('Error al verificar stock:', stockError)
          throw stockError
        }
        
        if (!stockData || stockData.stock_actual < producto.cantidad) {
          throw new Error(`Stock insuficiente para el producto ${producto.id_producto}`)
        }

        // Registrar producto en la transacción
        const { data: productoData, error: productoError } = await supabaseClient
          .from('transaccion_productos')
          .insert({
            id_transaccion: transaccion.id_transaccion,
            id_producto: producto.id_producto,
            cantidad_usada: producto.cantidad,
            precio_unitario: stockData.precio
          })
          .select()

        console.log('Resultado inserción producto:', { productoData, productoError })

        if (productoError) {
          console.error('Error al insertar producto:', productoError)
          throw productoError
        }

        // Actualizar stock
        const { error: updateError } = await supabaseClient
          .from('productos')
          .update({ stock_actual: stockData.stock_actual - producto.cantidad })
          .eq('id_producto', producto.id_producto)

        if (updateError) {
          console.error('Error al actualizar stock:', updateError)
          throw updateError
        }
      }

      toast.success('Transacción creada correctamente')
      form.reset()
      onSuccess?.()
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || 'Error al crear la transacción')
    } finally {
      setLoading(false)
    }
  }

  const handleProductSelect = (product: TransactionProduct) => {
    const existingProducts = form.getValues('productos')
    const existingProduct = existingProducts.find(p => p.id_producto === product.id_producto)
    
    if (existingProduct) {
      toast.error('Este producto ya fue agregado')
      return
    }

    setSelectedProducts([...selectedProducts, product])
    form.setValue('productos', [
      ...existingProducts,
      {
        id_producto: product.id_producto,
        cantidad: product.cantidad
      }
    ])
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Selector de Cita */}
      {!appointmentId && (
        <div className="space-y-2">
          <Label>Cita</Label>
          <Select
            value={selectedAppointment}
            onValueChange={(value: string) => {
              setSelectedAppointment(value)
              form.setValue('id_cita', value)
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccione una cita completada" />
            </SelectTrigger>
            <SelectContent>
              {completedAppointments.map((appointment) => (
                <SelectItem key={appointment.id_uuid} value={appointment.id_uuid}>
                  {format(new Date(appointment.fecha_hora), "dd/MM/yyyy HH:mm")} - {appointment.clientes.nombre} - {appointment.vehiculos.placa} - {appointment.servicios.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Productos */}
      <div className="space-y-2">
        <Label>Productos Utilizados</Label>
        <ProductSelector onSelect={handleProductSelect} />
        
        {/* Lista de productos seleccionados */}
        {selectedProducts.length > 0 && (
          <div className="border rounded-md p-4 space-y-2 mt-2">
            {selectedProducts.map((product) => (
              <div key={product.id_producto} className="flex justify-between items-center">
                <span>{product.nombre}</span>
                <div className="flex items-center gap-4">
                  <Input
                    type="number"
                    min="1"
                    className="w-20"
                    value={product.cantidad}
                    onChange={(e) => {
                      const newQuantity = Number(e.target.value)
                      const updatedProducts = selectedProducts.map(p =>
                        p.id_producto === product.id_producto
                          ? { ...p, cantidad: newQuantity, subtotal: newQuantity * p.precio_unitario }
                          : p
                      )
                      setSelectedProducts(updatedProducts)
                      
                      const formProducts = form.getValues('productos')
                      form.setValue('productos', formProducts.map(p =>
                        p.id_producto === product.id_producto
                          ? { ...p, cantidad: newQuantity }
                          : p
                      ))
                    }}
                  />
                  <span>${product.subtotal}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedProducts(selectedProducts.filter(p => p.id_producto !== product.id_producto))
                      const formProducts = form.getValues('productos')
                      form.setValue('productos', formProducts.filter(p => p.id_producto !== product.id_producto))
                    }}
                  >
                    Eliminar
                  </Button>
                </div>
              </div>
            ))}
            
            <div className="flex justify-end border-t pt-2">
              <span className="font-bold">
                Total: ${selectedProducts.reduce((sum, p) => sum + p.subtotal, 0)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Estado de Pago */}
      <div className="space-y-2">
        <Label>Estado de Pago</Label>
        <Select
          value={form.watch('estado_pago')}
          onValueChange={(value: string) => 
            form.setValue('estado_pago', value as TransactionStatus)
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Seleccione estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pendiente">Pendiente</SelectItem>
            <SelectItem value="pagado">Pagado</SelectItem>
            <SelectItem value="anulado">Anulado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Notas */}
      <div className="space-y-2">
        <Label>Notas</Label>
        <Textarea
          {...form.register('notas')}
          placeholder="Agregue notas adicionales aquí..."
        />
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? "Guardando..." : "Crear Transacción"}
      </Button>
    </form>
  )
} 