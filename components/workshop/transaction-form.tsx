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
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { format } from "date-fns"
import { useRouter } from "next/navigation"
import { verifyToken } from "@/app/jwt/token"

const formSchema = z.object({
  appointment_id: z.string(),
  notes: z.string().optional(),
})

interface TransactionFormProps {
  appointmentId?: string
  onSuccess?: () => void
  token: string
}

export function TransactionForm({ appointmentId, onSuccess, token }: TransactionFormProps) {
  const [searchParams, setSearchParams] = useState<URLSearchParams | null>(null)
  const [dataToken, setDataToken] = useState<object>({})
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [completedAppointments, setCompletedAppointments] = useState<any[]>([])
  const [selectedAppointment, setSelectedAppointment] = useState(appointmentId || '')

  const form = useForm<{
    appointment_id: string
    notes: string
  }>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      appointment_id: appointmentId || '',
      notes: '',
    }
  })

  useEffect(() => {
    const verifiedDataToken = verifyToken(token)
    if (verifiedDataToken === null) {
      router.push("/login")
    }
    setDataToken(verifiedDataToken || {})
  }, [searchParams, router, token])

  useEffect(() => {
    const loadCompletedAppointments = async () => {
      // Log del token y dealership_id
      console.log('Token decodificado:', dataToken);
      const dealershipId = (dataToken as any)?.dealership_id;
      console.log('Usando dealership_id para filtrar:', dealershipId);

      let query = supabase
        .from('appointment')
        .select(`
          *,
          client:client_id (
            id,
            names
          ),
          vehicles:vehicle_id (
            id_uuid,
            make,
            model,
            license_plate
          ),
          services:service_id (
            id_uuid,
            service_name
          )
        `)
        .eq('status', 'completed')
        .order('appointment_date', { ascending: false })

      if (dealershipId) {
        query = query.eq('dealership_id', dealershipId);
      }

      const { data, error } = await query;
      console.log('Citas completadas cargadas:', data, 'Error:', error);

      if (error) {
        console.error('Error al cargar citas:', error)
        return
      }

      setCompletedAppointments(data || [])
    }

    if (!appointmentId) {
      loadCompletedAppointments()
    }
  }, [appointmentId, dataToken])

  // Log para depuración del valor seleccionado y los ids de las citas
  useEffect(() => {
    console.log('selectedAppointment:', selectedAppointment)
    console.log('completedAppointments ids:', completedAppointments.map(a => String(a.id)))
  }, [selectedAppointment, completedAppointments])

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true)
    try {
      const dealershipId = (dataToken as any)?.dealership_id;
      console.log('Intentando crear transacción con:', {
        appointment_id: values.appointment_id,
        type: typeof values.appointment_id,
        transaction_date: new Date().toISOString(),
        notes: values.notes,
        dealership_id: dealershipId
      });
      const { error: transaccionError, data: transaccionData } = await supabase
        .from('service_transactions')
        .insert({
          appointment_id: values.appointment_id,
          transaction_date: new Date().toISOString(),
          notes: values.notes,
          dealership_id: dealershipId
        })
        .select();
      console.log('Resultado de la inserción:', { transaccionError, transaccionData });

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
              form.setValue('appointment_id', value)
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccione una cita completada">
                {(() => {
                  const selected = completedAppointments.find(a => String(a.id) === String(selectedAppointment));
                  if (selected) {
                    return `${format(new Date(selected.appointment_date), "dd/MM/yyyy HH:mm")} - ${selected.client?.names || 'Cliente no disponible'} (${selected.vehicles?.make} ${selected.vehicles?.model}${selected.vehicles?.license_plate ? ` (${selected.vehicles.license_plate})` : ''})`;
                  }
                  return null;
                })()}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {completedAppointments.map((appointment) => (
                <SelectItem key={String(appointment.id)} value={String(appointment.id)}>
                  {format(new Date(appointment.appointment_date), "dd/MM/yyyy HH:mm")} - {appointment.client?.names || 'Cliente no disponible'} 
                  ({appointment.vehicles?.make} {appointment.vehicles?.model} 
                  {appointment.vehicles?.license_plate ? ` (${appointment.vehicles.license_plate})` : ''})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Notas */}
      <div className="space-y-2">
        <Label>Notas</Label>
        <Textarea
          {...form.register('notes')}
          placeholder="Agregue notas adicionales aquí..."
        />
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? "Guardando..." : "Crear Transacción"}
      </Button>
    </form>
  )
} 