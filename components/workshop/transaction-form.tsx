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
  specific_service_id: z.string().uuid().optional()
})

interface TransactionFormProps {
  appointmentId?: string
  onSuccess?: () => void
  token: string
}

interface SpecificService {
  id: string
  service_name: string
  kilometers: number
  months: number
  price: number
}

export function TransactionForm({ appointmentId, onSuccess, token }: TransactionFormProps) {
  const [searchParams, setSearchParams] = useState<URLSearchParams | null>(null)
  const [dataToken, setDataToken] = useState<object>({})
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [completedAppointments, setCompletedAppointments] = useState<any[]>([])
  const [selectedAppointment, setSelectedAppointment] = useState(appointmentId || '')
  const [specificServices, setSpecificServices] = useState<SpecificService[]>([])
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null)

  const form = useForm<{
    appointment_id: string
    notes: string
    specific_service_id: string
  }>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      appointment_id: appointmentId || '',
      notes: '',
      specific_service_id: ''
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
            license_plate,
            model_id
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

  // Cargar servicios específicos cuando cambia el modelo
  useEffect(() => {
    const loadSpecificServices = async () => {
      if (!selectedModelId) {
        setSpecificServices([])
        return
      }

      const dealershipId = (dataToken as any)?.dealership_id;
      const { data, error } = await supabase
        .from('specific_services')
        .select('*')
        .eq('model_id', selectedModelId)
        .eq('dealership_id', dealershipId)
        .eq('is_active', true)

      if (error) {
        console.error('Error al cargar servicios específicos:', error)
        return
      }

      setSpecificServices(data || [])
    }

    loadSpecificServices()
  }, [selectedModelId, dataToken])

  // Actualizar el modelo seleccionado cuando cambia la cita
  useEffect(() => {
    if (selectedAppointment) {
      const appointment = completedAppointments.find(a => String(a.id) === String(selectedAppointment))
      if (appointment?.vehicles?.model_id) {
        setSelectedModelId(appointment.vehicles.model_id)
      } else {
        setSelectedModelId(null)
      }
    }
  }, [selectedAppointment, completedAppointments])

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true)
    try {
      const dealershipId = (dataToken as any)?.dealership_id;
      console.log('Intentando crear transacción con:', {
        appointment_id: values.appointment_id,
        transaction_date: new Date().toISOString(),
        notes: values.notes,
        dealership_id: dealershipId,
        specific_service_id: values.specific_service_id
      });
      const { error: transaccionError, data: transaccionData } = await supabase
        .from('service_transactions')
        .insert({
          appointment_id: values.appointment_id,
          transaction_date: new Date().toISOString(),
          notes: values.notes,
          dealership_id: dealershipId,
          specific_service_id: values.specific_service_id
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

      {/* Selector de Servicio Específico */}
      {selectedModelId && (
        <div className="space-y-2">
          <Label>Servicio Específico (Opcional)</Label>
          <Select
            value={form.watch('specific_service_id')}
            onValueChange={(value: string) => {
              form.setValue('specific_service_id', value)
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccione un servicio específico">
                {(() => {
                  const selected = specificServices.find(s => s.id === form.watch('specific_service_id'));
                  if (selected) {
                    return `${selected.service_name} - ${selected.kilometers}km/${selected.months}meses - $${selected.price}`;
                  }
                  return null;
                })()}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {specificServices.map((service) => (
                <SelectItem key={service.id} value={service.id}>
                  {service.service_name} - {service.kilometers}km/{service.months}meses - ${service.price}
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