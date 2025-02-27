"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
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
import { format } from "date-fns"
import { useRouter } from "next/navigation"
import { verifyToken } from "@/app/jwt/token"
const formSchema = z.object({
  id_cita: z.string().uuid(),
  estado_pago: z.enum(['pendiente', 'pagado', 'anulado']),
  notas: z.string().optional(),
})

interface TransactionFormProps {
  appointmentId?: string
  onSuccess?: () => void
  token : string
}

export function TransactionForm({ appointmentId, onSuccess, token }: TransactionFormProps) {

     
  const [searchParams, setSearchParams] = useState<URLSearchParams | null>(
    null
  );
  const [dataToken, setDataToken] = useState<object>({});

  const router = useRouter();

  useEffect(() => {
        const verifiedDataToken = verifyToken(token); // Verifica el token
        
        // Si el token no es válido, redirigir al login
        if (verifiedDataToken === null) {
          router.push("/login");
        }
        setDataToken(verifiedDataToken || {}); // Actualiza el estado de dataToken

      }

, [searchParams, router]); 



  const [loading, setLoading] = useState(false)
  const [completedAppointments, setCompletedAppointments] = useState<any[]>([])
  const [selectedAppointment, setSelectedAppointment] = useState(appointmentId || '')

  const form = useForm<{
    id_cita: string;
    estado_pago: TransactionStatus;
    notas: string;
  }>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id_cita: appointmentId,
      estado_pago: 'pendiente',
      notas: '',
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
      const { error: transaccionError } = await supabase
        .from('transacciones_servicio')
        .insert({
          id_cita: values.id_cita,
          estado: values.estado_pago,
          fecha_transaccion: new Date().toISOString(),
          notas: values.notas
        })

      if (transaccionError) throw transaccionError

      toast.success('Transacción creada exitosamente')
      onSuccess?.()
      form.reset()
    } catch (error: any) {
      console.error('Error al crear la transacción:', error)
      toast.error(error.message || 'Error al crear la transacción')
    } finally {
      setLoading(false)
    }
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