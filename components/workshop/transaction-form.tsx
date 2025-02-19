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
      const { data, error } = await supabase
        .from('citas')
        .select(`
          *,
          clientes (
            id_uuid,
            nombre
          ),
          vehiculos (
            id_uuid,
            marca,
            modelo,
            placa
          ),
          servicios (
            id_uuid,
            nombre,
            duracion_estimada
          )
        `)
        .eq('estado', 'completada')
        .order('fecha_hora', { ascending: false });

      if (error) {
        console.error('Error al cargar citas:', error);
        return;
      }

      setCompletedAppointments(data || []);
    };

    if (!appointmentId) {
      loadCompletedAppointments();
    }
  }, [appointmentId]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true)
    try {
      // 1. Crear la transacción
      const { data: transaccion, error: transaccionError } = await supabase
        .from('transacciones_servicio')
        .insert({
          id_cita: values.id_cita,
          estado: values.estado_pago,
          fecha_transaccion: new Date().toISOString(),
          notas: values.notas
        })
        .select()
        .single()

      if (transaccionError) throw transaccionError

      // 2. Registrar los productos utilizados y actualizar stock
      for (const producto of selectedProducts) {
        // Primero obtener el stock actual
        const { data: stockData, error: stockCheckError } = await supabase
          .from('productos')
          .select('stock_actual')
          .eq('id_producto', producto.id_producto)
          .single()

        if (stockCheckError) throw stockCheckError

        // Insertar en transaccion_productos
        const { error: productoError } = await supabase
          .from('transaccion_productos')
          .insert({
            id_transaccion: transaccion.id_transaccion,
            id_producto: producto.id_producto,
            cantidad_usada: producto.cantidad,
            precio_unitario: producto.precio_unitario
          })

        if (productoError) throw productoError

        // Actualizar stock directamente
        const { error: stockError } = await supabase
          .from('productos')
          .update({ 
            stock_actual: stockData.stock_actual - producto.cantidad
          })
          .eq('id_producto', producto.id_producto)

        if (stockError) throw stockError
      }

      toast.success('Transacción creada exitosamente')
      onSuccess?.()
      form.reset()
      setSelectedProducts([])
    } catch (error: any) {
      console.error('Error al crear la transacción:', error)
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
                  {format(new Date(appointment.fecha_hora), "dd/MM/yyyy HH:mm")} - {appointment.clientes?.nombre || 'Cliente no disponible'} 
                  ({appointment.vehiculos?.marca} {appointment.vehiculos?.modelo} 
                  {appointment.vehiculos?.placa ? ` (${appointment.vehiculos.placa})` : ''})
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