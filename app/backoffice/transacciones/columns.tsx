"use client"

import { useState, useEffect } from "react"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { HelpCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { TransactionStatusUpdate } from "@/components/workshop/transaction-status-update"
import Link from "next/link"
import { supabase } from "@/lib/supabase"

export const columns: ColumnDef<any>[] = [
  {
    accessorKey: "fecha_transaccion",
    header: "Fecha",
    cell: ({ row }) => format(new Date(row.getValue("fecha_transaccion")), "PPP", { locale: es })
  },
  {
    accessorKey: "citas.clientes.nombre",
    header: "Cliente",
    cell: ({ row }) => row.original.citas?.clientes?.nombre || '-'
  },
  {
    accessorKey: "estado",
    header: "Estado de Pago",
    cell: ({ row }) => (
      <TransactionStatusUpdate
        transactionId={row.original.id_transaccion}
        currentStatus={row.getValue("estado")}
        onUpdate={() => {
          // Recargar los datos
          const table = document.querySelector('[data-table-key="transacciones"]')
          if (table) {
            const event = new Event('refresh')
            table.dispatchEvent(event)
          }
        }}
      />
    )
  },
  {
    accessorKey: "nps",
    header: "NPS",
    cell: ({ row }) => {
      const [npsData, setNpsData] = useState<any>(null)
      const [loading, setLoading] = useState(true)

      useEffect(() => {
        const fetchNPS = async () => {
          const { data, error } = await supabase
            .from('nps')
            .select('*')
            .eq('transaccion_id', row.original.id_transaccion)
            .maybeSingle()

          if (!error && data) {
            setNpsData(data)
          }
          setLoading(false)
        }

        fetchNPS()
      }, [row.original.id_transaccion])

      if (loading) {
        return <div className="animate-pulse h-4 w-20 bg-muted rounded" />
      }

      if (!npsData) {
        return <span className="text-muted-foreground">Sin NPS</span>
      }

      return (
        <div className="flex items-center gap-2">
          {npsData.estado === 'pendiente' ? (
            <Badge variant="secondary">Encuesta pendiente</Badge>
          ) : (
            <Link 
              href={`/feedback?id=${npsData.id}`}
              className="flex items-center gap-1 hover:underline"
            >
              <span>{npsData.puntaje}/10</span>
              <span>-</span>
              <Badge variant={
                npsData.clasificacion === 'promotor' ? 'success' :
                npsData.clasificacion === 'neutral' ? 'warning' :
                'destructive'
              }>
                {npsData.clasificacion}
              </Badge>
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
            </Link>
          )}
        </div>
      )
    }
  }
] 