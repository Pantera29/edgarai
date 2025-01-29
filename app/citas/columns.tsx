import { ColumnDef } from "@tanstack/react-table"
import { AppointmentStatusUpdate } from "@/components/workshop/appointment-status-update"
import { Button } from "@/components/ui/button"
import { MoreHorizontal } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { supabase } from "@/lib/supabase"

export const columns: ColumnDef<any>[] = [
  {
    accessorKey: "id_uuid",
    header: "ID",
    cell: ({ row }) => row.original.id_uuid
  },
  {
    accessorKey: "estado",
    header: "Estado",
    cell: ({ row }) => {
      return (
        <AppointmentStatusUpdate
          appointmentId={row.original.id_uuid}
          currentStatus={row.original.estado}
          onStatusChange={(newStatus) => {
            row.original.estado = newStatus;
          }}
        />
      )
    }
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const handleStatusChange = async (newStatus: string) => {
        const { error } = await supabase
          .from('citas')
          .update({ estado: newStatus })
          .eq('id_uuid', row.original.id_uuid)  // Usar id_uuid aquí también

        if (error) {
          console.error('Error:', error)
          return
        }
        
        // Actualizar el estado en la UI
        row.original.estado = newStatus
      }

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleStatusChange('en_proceso')}>
              Iniciar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleStatusChange('completada')}>
              Completar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleStatusChange('cancelada')}>
              Cancelar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  }
] 