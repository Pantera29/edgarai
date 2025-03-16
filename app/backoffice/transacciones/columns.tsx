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
    accessorKey: "transaction_date",
    header: "Fecha",
    cell: ({ row }) => format(new Date(row.getValue("transaction_date")), "PPP", { locale: es })
  },
  {
    accessorKey: "appointment.client.names",
    header: "Cliente",
    cell: ({ row }) => row.original.appointment?.client?.names || '-'
  },
  {
    accessorKey: "status",
    header: "Estado de Pago",
    cell: ({ row }) => (
      <TransactionStatusUpdate
        transactionId={row.original.transaction_id}
        currentStatus={row.getValue("status")}
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
    accessorKey: "appointment.vehicles",
    header: "Vehículo",
    cell: ({ row }) => {
      const vehicle = row.original.appointment?.vehicles;
      return vehicle 
        ? `${vehicle.make} ${vehicle.model} (${vehicle.license_plate || 'Sin placa'})`
        : '-';
    }
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
            .eq('transaction_id', row.original.transaction_id)
            .maybeSingle()

          if (!error && data) {
            setNpsData(data)
          }
          setLoading(false)
        }

        fetchNPS()
      }, [row.original.transaction_id])

      if (loading) {
        return <div className="animate-pulse h-4 w-20 bg-muted rounded" />
      }

      if (!npsData) {
        return <span className="text-muted-foreground">Sin NPS</span>
      }

      return (
        <div className="flex items-center gap-2">
          {npsData.status === 'pending' ? (
            <Badge variant="secondary">Encuesta pendiente</Badge>
          ) : (
            <Link 
              href={`/feedback?id=${npsData.id}`}
              className="flex items-center gap-1 hover:underline"
            >
              <span>{npsData.score}/10</span>
              <span>-</span>
              <Badge variant={
                npsData.classification === 'promoter' ? 'success' :
                npsData.classification === 'neutral' ? 'warning' :
                'destructive'
              }>
                {npsData.classification === 'promoter' ? 'promotor' : 
                 npsData.classification === 'neutral' ? 'neutral' : 
                 'detractor'}
              </Badge>
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
            </Link>
          )}
        </div>
      )
    }
  }
] 