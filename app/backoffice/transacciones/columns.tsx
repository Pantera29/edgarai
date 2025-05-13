"use client"

import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Badge } from "@/components/ui/badge"
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
    accessorKey: "appointment.services",
    header: "Servicio",
    cell: ({ row }) => row.original.appointment?.services?.service_name || '-'
  },
  {
    accessorKey: "notas",
    header: "Notas",
    cell: ({ row }) => row.getValue("notas") || '-'
  }
] 