"use client"

import { useState, useEffect } from "react"
import { DataTable } from "@/components/ui/data-table"
import { supabase } from "@/lib/supabase"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
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
import { ArrowUp, ArrowDown, Clock, MessageSquare } from "lucide-react"

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
        // Mejor validación: redirigir si el token es null, vacío, no es objeto o no tiene dealership_id
        if (
          !verifiedDataToken ||
          typeof verifiedDataToken !== "object" ||
          Object.keys(verifiedDataToken).length === 0 ||
          !(verifiedDataToken as any).dealership_id
        ) {
          router.push("/login");
          return;
        }
        setDataToken(verifiedDataToken || {}); // Actualiza el estado de dataToken

        // Si hay un dealership_id en el token, cargar los datos de esa agencia
        if (verifiedDataToken?.dealership_id) {
          fetchData(verifiedDataToken.dealership_id);
        } else {
          fetchData();
        }
      }
    }
  }, [searchParams, router]); 


  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [npsData, setNpsData] = useState({
    currentScore: 0,
    trend: 0, // positivo significa mejora, negativo significa deterioro
    promoters: 0,
    detractors: 0
  })
  const [filters, setFilters] = useState<Filters>({
    status: "todos",
    dateRange: undefined,
    classification: "todas"
  })

  // Función para calcular el NPS
  const calculateNPS = (responses: any[]) => {
    if (!responses.length) return { score: 0, promoters: 0, detractors: 0 };
    
    const promoters = responses.filter(r => r.score >= 9).length;
    const detractors = responses.filter(r => r.score <= 6).length;
    const total = responses.length;
    
    const score = Math.round(((promoters - detractors) / total) * 100);
    
    return { score, promoters, detractors };
  }

  // Función para calcular la tendencia del NPS
  const calculateNPSTrend = (currentData: any[], previousData: any[]) => {
    const currentNPS = calculateNPS(currentData).score;
    const previousNPS = calculateNPS(previousData).score;
    return currentNPS - previousNPS;
  }

  const fetchData = async (dealershipIdFromToken?: string) => {
    setLoading(true)
    try {
      let query = supabase
        .from('nps')
        .select(`
          *,
          client (
            names,
            dealership_id
          )
        `)
        .order('created_at', { ascending: false })

      // Filtrar por dealership_id si está disponible
      if (dealershipIdFromToken) {
        console.log("Filtrando NPS por dealership_id:", dealershipIdFromToken);
        query = query.eq('client.dealership_id', dealershipIdFromToken);
      }

      if (filters.status !== "todos") {
        const statusValue = filters.status === "pendiente" ? "pending" : "completed";
        query = query.eq('status', statusValue);
      }

      if (filters.classification !== "todas") {
        let classificationValue;
        switch (filters.classification) {
          case "promotor": classificationValue = "promoter"; break;
          case "neutral": classificationValue = "neutral"; break;
          case "detractor": classificationValue = "detractor"; break;
          default: classificationValue = filters.classification;
        }
        query = query.eq('classification', classificationValue);
      }

      const { data: allData, error } = await query

      if (error) throw error

      let filteredData = allData;
      if (dealershipIdFromToken) {
        filteredData = allData.filter(item => 
          item.client && item.client.dealership_id === dealershipIdFromToken
        );
      }

      const formattedData = filteredData.map(item => ({
        ...item,
        customer_name: item.client?.names || '-'
      }))

      // Calcular NPS actual y tendencia
      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const firstDayOfPrevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastDayOfPrevMonth = new Date(today.getFullYear(), today.getMonth(), 0);

      const currentMonthData = formattedData.filter(item => 
        new Date(item.created_at) >= firstDayOfMonth && 
        new Date(item.created_at) <= today
      );

      const previousMonthData = formattedData.filter(item => 
        new Date(item.created_at) >= firstDayOfPrevMonth && 
        new Date(item.created_at) <= lastDayOfPrevMonth
      );

      const { score: currentScore, promoters, detractors } = calculateNPS(currentMonthData);
      const trend = calculateNPSTrend(currentMonthData, previousMonthData);

      setNpsData({
        currentScore,
        trend,
        promoters,
        detractors
      });

      setData(formattedData)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Si hay un dealership_id en el token, usarlo al recargar los datos
    if (dataToken && (dataToken as any).dealership_id) {
      fetchData((dataToken as any).dealership_id);
    } else {
      fetchData();
    }
  }, [filters, dataToken])

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8">Feedback NPS</h1>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">NPS Score</CardTitle>
            {npsData.trend >= 0 ? (
              <ArrowUp className="h-4 w-4 text-green-500" />
            ) : (
              <ArrowDown className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-1">
              <div className="text-2xl font-bold">{npsData.currentScore}%</div>
              <div className="flex items-center gap-2">
                {Math.abs(npsData.trend)}%
                <p className="text-xs text-muted-foreground">
                  vs. mes anterior
                </p>
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                {npsData.promoters} promotores · {npsData.detractors} detractores
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Respuestas Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-1">
              <div className="text-2xl font-bold">
                {data.filter(item => item.status === 'pending').length || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Esperando feedback de clientes
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Última Respuesta</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-1">
              <div className="text-2xl font-bold">
                {data.length > 0 
                  ? format(new Date(data[0].created_at), "dd MMM", { locale: es })
                  : "Sin datos"
                }
              </div>
              <p className="text-xs text-muted-foreground">
                {data.length > 0 
                  ? `${data[0].customer_name || 'Cliente'} - ${data[0].score || 0}/10`
                  : "No hay respuestas registradas"
                }
              </p>
            </div>
          </CardContent>
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