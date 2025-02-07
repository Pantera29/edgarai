"use client"

import { useState, useEffect } from "react"
import { DataTable } from "@/components/ui/data-table"
import { supabase } from "@/lib/supabase"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Card } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

const columns = [
  {
    accessorKey: "created_at",
    header: "Fecha",
    cell: ({ row }: { row: any }) => 
      format(new Date(row.getValue("created_at")), "PPP", { locale: es })
  },
  {
    accessorKey: "cliente_nombre",
    header: "Cliente"
  },
  {
    accessorKey: "estado",
    header: "Estado",
    cell: ({ row }: { row: any }) => (
      <Badge variant={row.getValue("estado") === "completado" ? "success" : "secondary"}>
        {row.getValue("estado")}
      </Badge>
    )
  },
  {
    accessorKey: "puntaje",
    header: "Puntaje",
    cell: ({ row }: { row: any }) => 
      row.getValue("puntaje") ? `${row.getValue("puntaje")}/10` : "-"
  },
  {
    accessorKey: "clasificacion",
    header: "Clasificación",
    cell: ({ row }: { row: any }) => {
      const clasificacion = row.getValue("clasificacion")
      if (!clasificacion) return "-"
      
      return (
        <Badge variant={
          clasificacion === 'promotor' ? 'success' :
          clasificacion === 'neutral' ? 'warning' :
          'destructive'
        }>
          {clasificacion}
        </Badge>
      )
    }
  },
  {
    accessorKey: "transaccion_id",
    header: "Transacción",
    cell: ({ row }: { row: any }) => (
      <Link 
        href={`/transacciones?id=${row.getValue("transaccion_id")}`}
        className="text-primary hover:underline"
      >
        Ver transacción
      </Link>
    )
  }
]

export default function FeedbackPage() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    estado: "todos",
    dateRange: { from: null, to: null },
    clasificacion: "todas"
  })

  const fetchData = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('nps')
        .select(`
          *,
          transacciones_servicio (
            citas (
              clientes (
                nombre
              )
            )
          )
        `)

      if (filters.estado !== "todos") {
        query = query.eq('estado', filters.estado)
      }

      if (filters.clasificacion !== "todas") {
        query = query.eq('clasificacion', filters.clasificacion)
      }

      if (filters.dateRange.from) {
        query = query.gte('created_at', filters.dateRange.from)
      }

      if (filters.dateRange.to) {
        query = query.lte('created_at', filters.dateRange.to)
      }

      const { data, error } = await query

      if (error) throw error

      const formattedData = data.map(item => ({
        ...item,
        cliente_nombre: item.transacciones_servicio?.citas?.clientes?.nombre || '-'
      }))

      setData(formattedData)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [filters])

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8">Feedback NPS</h1>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card className="p-4">
          <h3 className="font-medium mb-2">NPS Score</h3>
          {/* Implementar cálculo de NPS */}
        </Card>
        <Card className="p-4">
          <h3 className="font-medium mb-2">Respuestas Pendientes</h3>
          {/* Mostrar contador de pendientes */}
        </Card>
        <Card className="p-4">
          <h3 className="font-medium mb-2">Última Respuesta</h3>
          {/* Mostrar fecha de última respuesta */}
        </Card>
      </div>

      <div className="flex gap-4 mb-6">
        <Select
          value={filters.estado}
          onValueChange={(value) => setFilters(prev => ({ ...prev, estado: value }))}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="pendiente">Pendiente</SelectItem>
            <SelectItem value="completado">Completado</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.clasificacion}
          onValueChange={(value) => setFilters(prev => ({ ...prev, clasificacion: value }))}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Clasificación" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas</SelectItem>
            <SelectItem value="promotor">Promotor</SelectItem>
            <SelectItem value="neutral">Neutral</SelectItem>
            <SelectItem value="detractor">Detractor</SelectItem>
          </SelectContent>
        </Select>

        <DatePickerWithRange
          value={filters.dateRange}
          onChange={(value) => setFilters(prev => ({ ...prev, dateRange: value }))}
        />
      </div>

      <DataTable 
        columns={columns}
        data={data}
        loading={loading}
      />
    </div>
  )
} 