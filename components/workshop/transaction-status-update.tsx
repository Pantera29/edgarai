"use client"

import { useState } from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"

const estados = [
  { value: "pendiente", label: "Pendiente" },
  { value: "pagado", label: "Pagado" },
  { value: "anulado", label: "Anulado" },
]

interface TransactionStatusUpdateProps {
  transactionId: string
  currentStatus: string
  onUpdate?: () => void
}

export function TransactionStatusUpdate({ 
  transactionId, 
  currentStatus,
  onUpdate 
}: TransactionStatusUpdateProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const handleStatusChange = async (newStatus: string) => {
    setLoading(true)
    try {
      console.log('Actualizando estado a:', newStatus)
      
      // Primero actualizamos el estado
      const { error: updateError } = await supabase
        .from('transacciones_servicio')
        .update({ estado: newStatus })
        .eq('id_transaccion', transactionId)

      if (updateError) throw updateError

      // Si el estado es pagado, creamos el NPS
      if (newStatus === 'pagado') {
        console.log('Obteniendo datos del cliente para:', transactionId)
        
        // Simplificamos la consulta
        const { data, error: clientError } = await supabase
          .from('transacciones_servicio')
          .select('citas(clientes(id_uuid))')
          .eq('id_transaccion', transactionId)
          .single()

        if (clientError) throw clientError
        
        console.log('Datos obtenidos:', data)
        
        const clienteId = data.citas.clientes.id_uuid
        console.log('ID del cliente:', clienteId)

        // Verificar si ya existe un NPS
        const { data: existingNPS } = await supabase
          .from('nps')
          .select('id')
          .eq('transaccion_id', transactionId)
          .maybeSingle()

        if (!existingNPS) {
          console.log('Creando nuevo NPS')
          const { error: npsError } = await supabase
            .from('nps')
            .insert({
              transaccion_id: transactionId,
              cliente_id: clienteId,
              estado: 'pendiente'
            })

          if (npsError) {
            console.error('Error al crear NPS:', npsError)
            throw npsError
          }
          console.log('NPS creado exitosamente')
        } else {
          console.log('Ya existe un NPS para esta transacción')
        }
      }

      toast({
        title: "Estado actualizado",
        description: "El estado de la transacción ha sido actualizado exitosamente."
      })

      if (onUpdate) {
        onUpdate()
      }

    } catch (error: any) {
      console.error('Error completo:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo actualizar el estado de la transacción"
      })
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
      <SelectTrigger className="w-[130px]">
        <SelectValue>
          <Badge variant={
            currentStatus === 'pagado' ? 'success' :
            currentStatus === 'pendiente' ? 'warning' :
            'destructive'
          }>
            {currentStatus}
          </Badge>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {estados.map((estado) => (
          <SelectItem key={estado.value} value={estado.value}>
            {estado.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
} 