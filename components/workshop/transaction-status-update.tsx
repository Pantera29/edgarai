"use client"

import { useState } from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

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
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSelect = async (value: string) => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('transacciones_servicio')
        .update({ estado: value })
        .eq('id_transaccion', transactionId)

      if (error) throw error

      toast.success('Estado actualizado')
      onUpdate?.()
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al actualizar el estado')
    } finally {
      setLoading(false)
      setOpen(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          role="combobox"
          aria-expanded={open}
          className="justify-between w-[150px]"
          disabled={loading}
        >
          <Badge variant={
            currentStatus === 'pagado' ? 'success' :
            currentStatus === 'pendiente' ? 'warning' :
            'destructive'
          }>
            {currentStatus}
          </Badge>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[150px] p-0">
        <Command>
          <CommandInput placeholder="Buscar estado..." />
          <CommandEmpty>No se encontró el estado.</CommandEmpty>
          <CommandGroup>
            {estados.map((estado) => (
              <CommandItem
                key={estado.value}
                value={estado.value}
                onSelect={() => handleSelect(estado.value)}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    currentStatus === estado.value ? "opacity-100" : "opacity-0"
                  )}
                />
                {estado.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
} 