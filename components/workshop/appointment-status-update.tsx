"use client"

import { useState } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AppointmentStatus } from "@/types/workshop"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

interface AppointmentStatusUpdateProps {
  appointmentId: string
  currentStatus: AppointmentStatus
  onStatusChange?: (newStatus: AppointmentStatus) => void
}

export function AppointmentStatusUpdate({
  appointmentId,
  currentStatus,
  onStatusChange
}: AppointmentStatusUpdateProps) {
  const [loading, setLoading] = useState(false)

  const handleStatusChange = async (newStatus: string) => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('citas')
        .update({ estado: newStatus })
        .eq('id_uuid', appointmentId)

      if (error) throw error

      toast.success('Estado actualizado correctamente')
      onStatusChange?.(newStatus as AppointmentStatus)
    } catch (error) {
      console.error('Error al actualizar estado:', error)
      toast.error('Error al actualizar el estado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Select
      value={currentStatus}
      onValueChange={handleStatusChange}
      disabled={loading}
    >
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="pendiente">Pendiente</SelectItem>
        <SelectItem value="en_proceso">En Proceso</SelectItem>
        <SelectItem value="completada">Completada</SelectItem>
        <SelectItem value="cancelada">Cancelada</SelectItem>
      </SelectContent>
    </Select>
  )
} 