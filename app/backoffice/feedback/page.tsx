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
import { DateRange } from "react-day-picker"
import { useRouter } from "next/navigation"
import { verifyToken } from "../../jwt/token"
const columns = [
  {
    accessorKey: "created_at",
    header: "Fecha",
    cell: ({ row }: { row: any }) => 
      format(new Date(row.getValue("created_at")), "PPP", { locale: es })
  },
  {
    accessorKey: "customer_name",
    header: "Cliente"
  },
  {
    accessorKey: "status",
    header: "Estado",
    cell: ({ row }: { row: any }) => (
      <Badge variant={row.getValue("status") === "completed" ? "success" : "secondary"}>
        {row.getValue("status") === "completed" ? "completado" : "pendiente"}
      </Badge>
    )
  },
  {
    accessorKey: "score",
    header: "Puntaje",
    cell: ({ row }: { row: any }) => 
      row.getValue("score") ? `${row.getValue("score")}/10` : "-"
  },
  {
    accessorKey: "classification",
    header: "Clasificación",
    cell: ({ row }: { row: any }) => {
      const classification = row.getValue("classification")
      if (!classification) return "-"
      
      let displayText = "";
      switch(classification) {
        case "promoter": displayText = "promotor"; break;
        case "neutral": displayText = "neutral"; break;
        case "detractor": displayText = "detractor"; break;
        default: displayText = classification;
      }
      
      return (
        <Badge variant={
          classification === 'promoter' ? 'success' :
          classification === 'neutral' ? 'warning' :
          'destructive'
        }>
          {displayText}
        </Badge>
      )
    }
  },
  {
    accessorKey: "transaction_id",
    header: "Transacción",
    cell: ({ row }: { row: any }) => (
      <Link 
        href={`/transacciones?id=${row.getValue("transaction_id")}`}
        className="text-primary hover:underline"
      >
        Ver transacción
      </Link>
    )
  }
]

interface Filters {
  status: string
  dateRange: DateRange | undefined
  classification: string
}

export default function FeedbackPage() {

  const [searchParams, setSearchParams] = useState<URLSearchParams | null>(
    null
  );
  const [token, setToken] = useState<string>("");
  const [dataToken, setDataToken] = useState<object>({});

  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setSearchParams(params); // Guarda los query params en el estado
    }
  }, []);

  useEffect(() => {
    if (searchParams) {
      const tokenValue = searchParams.get("token"); // Obtiene el token de los query params
      if (tokenValue) {
        setToken(tokenValue); // Usa setToken para actualizar el estado
        const verifiedDataToken = verifyToken(tokenValue); // Verifica el token
        
        // Si el token no es válido, redirigir al login
        if (verifiedDataToken === null) {
          router.push("/login");
        }
        setDataToken(verifiedDataToken || {}); // Actualiza el estado de dataToken

      }
    }
  }, [searchParams, router]); 


  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<Filters>({
    status: "todos",
    dateRange: undefined,
    classification: "todas"
  })

  const fetchData = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('nps')
        .select(`
          *,
          client (
            names
          )
        `)

      if (filters.status !== "todos") {
        // Convertir los valores en español a inglés para la consulta
        const statusValue = filters.status === "pendiente" ? "pending" : "completed";
        query = query.eq('status', statusValue);
      }

      if (filters.classification !== "todas") {
        // Convertir los valores en español a inglés para la consulta
        let classificationValue;
        switch (filters.classification) {
          case "promotor": classificationValue = "promoter"; break;
          case "neutral": classificationValue = "neutral"; break;
          case "detractor": classificationValue = "detractor"; break;
          default: classificationValue = filters.classification;
        }
        query = query.eq('classification', classificationValue);
      }

      if (filters.dateRange) {
        query = query.gte('created_at', filters.dateRange.from)
        query = query.lte('created_at', filters.dateRange.to)
      }

      const { data, error } = await query

      if (error) throw error

      const formattedData = data.map(item => ({
        ...item,
        customer_name: item.client?.names || '-'
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
          value={filters.status}
          onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
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
          value={filters.classification}
          onValueChange={(value) => setFilters(prev => ({ ...prev, classification: value }))}
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

      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : (
          <DataTable 
            columns={columns}
            data={data}
          />
        )}
      </div>
    </div>
  )
} 