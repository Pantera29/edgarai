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
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { verifyToken } from "../../jwt/token"
import { ArrowUp, ArrowDown, Clock, MessageSquare } from "lucide-react"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { ChevronsLeft, ChevronsRight } from "lucide-react"

const ITEMS_PER_PAGE = 25;

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
    accessorKey: "channel",
    header: "Canal",
    cell: ({ row }: { row: any }) => {
      const channel = row.getValue("channel")
      if (!channel) return "-"
      
      let displayText = "";
      let variant: "default" | "secondary" | "destructive" | "outline" = "default";
      
      switch(channel) {
        case "whatsapp": 
          displayText = "WhatsApp"; 
          variant = "success";
          break;
        case "twilio": 
          displayText = "Teléfono"; 
          variant = "secondary";
          break;
        case "manual": 
          displayText = "Manual"; 
          variant = "outline";
          break;
        case "web": 
          displayText = "Web"; 
          variant = "default";
          break;
        case "agenteai": 
          displayText = "Agente AI"; 
          variant = "default";
          break;
        default: 
          displayText = channel;
          variant = "outline";
      }
      
      return (
        <Badge variant={variant}>
          {displayText}
        </Badge>
      )
    }
  },
  {
    accessorKey: "status",
    header: "Estado",
    cell: ({ row }: { row: any }) => (
      <Badge variant={row.getValue("status") === "completed" ? "success" : "secondary"}>
        {row.getValue("status") === "completed" ? "Completado" : "Pendiente"}
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
        case "promoter": displayText = "Promotor"; break;
        case "neutral": displayText = "Neutral"; break;
        case "detractor": displayText = "Detractor"; break;
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
]

interface Filters {
  status: string
  classification: string
  channel: string
  search: string
}

interface NpsMetrics {
  current_month: {
    nps_score: number
    promoters: number
    detractors: number
    total_responses: number
  }
  previous_month: {
    nps_score: number
    promoters: number
    detractors: number
    total_responses: number
  }
  trend: number
  pending_responses: number
  last_response: {
    date: string
    customer_name: string
    score: number
  } | null
}

export default function FeedbackPage() {
  const [searchParams, setSearchParams] = useState<URLSearchParams | null>(null);
  const [token, setToken] = useState<string>("");
  const [dataToken, setDataToken] = useState<object>({});

  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setSearchParams(params);
    }
  }, []);

  useEffect(() => {
    if (searchParams) {
      const tokenValue = searchParams.get("token");
      if (tokenValue) {
        setToken(tokenValue);
        const verifiedDataToken = verifyToken(tokenValue);
        if (
          !verifiedDataToken ||
          typeof verifiedDataToken !== "object" ||
          Object.keys(verifiedDataToken).length === 0 ||
          !(verifiedDataToken as any).dealership_id
        ) {
          router.push("/login");
          return;
        }
        setDataToken(verifiedDataToken || {});

        if (verifiedDataToken?.dealership_id) {
          fetchMetrics(verifiedDataToken.dealership_id);
          fetchData(verifiedDataToken.dealership_id);
        } else {
          fetchMetrics();
          fetchData();
        }
      }
    }
  }, [searchParams, router]); 

  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [metricsLoading, setMetricsLoading] = useState(true)
  const [npsMetrics, setNpsMetrics] = useState<NpsMetrics | null>(null)
  const [filters, setFilters] = useState<Filters>({
    status: "",
    classification: "",
    channel: "",
    search: ""
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [totalItems, setTotalItems] = useState(0)



  const fetchMetrics = async (dealershipIdFromToken?: string) => {
    if (!dealershipIdFromToken) {
      console.log('❌ No hay dealership_id, no se pueden cargar métricas');
      setMetricsLoading(false);
      return;
    }
    
    setMetricsLoading(true);
    try {

      
      const rpcParams = {
        p_dealership_id: dealershipIdFromToken,
        p_status_filter: null, // Métricas siempre sobre todos los datos
        p_classification_filter: null, // Métricas siempre sobre todos los datos
        p_search_query: null // Métricas siempre sobre todos los datos
      };
      
      const { data: metricsData, error } = await supabase.rpc('get_nps_metrics', rpcParams);

      if (error) {
        console.error('❌ Error obteniendo métricas:', error);
        throw error;
      }

      setNpsMetrics(metricsData);
      
    } catch (error) {
      console.error('❌ Error fatal obteniendo métricas:', error);
      setNpsMetrics(null);
    } finally {
      setMetricsLoading(false);
    }
  }

  const fetchData = async (dealershipIdFromToken?: string) => {
    if (!dealershipIdFromToken) {
      setLoading(false);
      return;
    }

    setLoading(true)
    try {
      console.log('🔄 Cargando datos de tabla para página:', currentPage);
      console.log('🔍 [DEBUG] Filtros actuales:', filters);
      
      // Construir query base
      let query = supabase
        .from('nps')
        .select(`
          *,
          client!inner (
            names,
            dealership_id
          ),
          appointment!inner (
            channel
          )
        `)

      // Aplicar filtros ANTES del range
      query = query.eq('client.dealership_id', dealershipIdFromToken);

      if (filters.status && filters.status !== "" && filters.status !== "todos") {
        const statusValue = filters.status === "pendiente" ? "pending" : "completed";
        query = query.eq('status', statusValue);
        console.log('🔍 [DEBUG] Aplicando filtro de status:', statusValue);
      }

      if (filters.classification && filters.classification !== "" && filters.classification !== "todas") {
        let classificationValue;
        switch (filters.classification) {
          case "promotor": classificationValue = "promoter"; break;
          case "neutral": classificationValue = "neutral"; break;
          case "detractor": classificationValue = "detractor"; break;
          default: classificationValue = filters.classification;
        }
        query = query.eq('classification', classificationValue);
        console.log('🔍 [DEBUG] Aplicando filtro de clasificación:', classificationValue);
      }

      if (filters.channel && filters.channel !== "" && filters.channel !== "todos") {
        // Solo mostrar registros que tienen cita asociada y el canal específico
        query = query.not('appointment_id', 'is', null);
        query = query.eq('appointment.channel', filters.channel);
        console.log('🔍 [DEBUG] Aplicando filtro de canal:', filters.channel);
      }

      if (filters.search) {
        query = query.ilike('client.names', `%${filters.search}%`);
        console.log('🔍 [DEBUG] Aplicando filtro de búsqueda:', filters.search);
      }

      // Obtener el total de registros con la misma lógica que debug
      const { data: totalData, error: totalError } = await query;
      const totalCount = totalData?.length || 0;
      
      console.log('🔍 [DEBUG] Total de registros filtrados:', totalCount);

      // Aplicar ordenamiento y paginación DESPUÉS de los filtros
      query = query
        .order('created_at', { ascending: false })
        .range((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE - 1);

      console.log('🚀 Query final:', {
        page: currentPage,
        itemsPerPage: ITEMS_PER_PAGE,
        range: [(currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE - 1],
        filters
      });

      const { data: allData, error } = await query;

      if (error) {
        console.error('❌ Error en query:', error);
        throw error;
      }

      console.log('✅ Datos obtenidos:', {
        totalCount,
        dataLength: allData?.length || 0,
        currentPage,
        itemsPerPage: ITEMS_PER_PAGE,
        filters: filters
      });

      // Debug: Ver los primeros 3 registros para entender la estructura
      if (allData && allData.length > 0) {
        console.log('🔍 [DEBUG] Primeros 3 registros de la tabla:', allData.slice(0, 3));
        
        // Debug específico para canales
        console.log('🔍 [DEBUG] Canales encontrados:', allData.map(item => ({
          customer_name: item.client?.names,
          channel: item.appointment?.channel,
          has_appointment: !!item.appointment
        })));
      }

      const formattedData = (allData || []).map(item => ({
        ...item,
        customer_name: item.client?.names || '-',
        channel: item.appointment?.channel || null
      }));

      setData(formattedData);
      setTotalItems(totalCount);
      
    } catch (error) {
      console.error('❌ Error fatal cargando datos:', error);
      setData([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }

  // Cargar métricas solo cuando cambie el dealership_id
  useEffect(() => {
    if (dataToken && (dataToken as any).dealership_id) {
      console.log('🔄 Cargando métricas para dealership:', (dataToken as any).dealership_id);
      fetchMetrics((dataToken as any).dealership_id);
    }
  }, [dataToken])

  // Cargar datos de tabla cuando cambien filtros o página
  useEffect(() => {
    if (dataToken && (dataToken as any).dealership_id) {
      fetchData((dataToken as any).dealership_id);
    }
  }, [filters, dataToken, currentPage])

  // Resetear página cuando cambien los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [filters.status, filters.classification, filters.channel, filters.search]);

  // Lógica de paginación
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  const getPageRange = () => {
    const range = [];
    const maxPagesToShow = 5;
    let start = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let end = Math.min(totalPages, start + maxPagesToShow - 1);
    if (end - start + 1 < maxPagesToShow) {
      start = Math.max(1, end - maxPagesToShow + 1);
    }
    for (let i = start; i <= end; i++) {
      range.push(i);
    }
    return range;
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8">Feedback NPS</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* NPS Score Card */}
        <Card className="p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium text-muted-foreground">NPS Score</h3>
            {npsMetrics && npsMetrics.trend >= 0 ? (
              <div className="rounded-md bg-green-100 p-1">
                <ArrowUp className="h-4 w-4 text-green-600" />
              </div>
            ) : npsMetrics && npsMetrics.trend < 0 ? (
              <div className="rounded-md bg-red-100 p-1">
                <ArrowDown className="h-4 w-4 text-red-600" />
              </div>
            ) : (
              <div className="rounded-md bg-gray-100 p-1">
                <ArrowUp className="h-4 w-4 text-gray-400" />
              </div>
            )}
          </div>
          <div className="flex items-center">
            <div className="text-3xl font-bold">
              {metricsLoading ? "..." : (npsMetrics?.current_month.nps_score ?? 0)}%
            </div>
          </div>
          <div className="mt-3">
            <p className="text-xs text-muted-foreground">
              {metricsLoading ? (
                "Cargando métricas..."
              ) : npsMetrics ? (
                <>
                  {Math.abs(npsMetrics.trend)}% vs. mes anterior
                  <br />
                  {npsMetrics.current_month.promoters} promotores · {npsMetrics.current_month.detractors} detractores
                </>
              ) : (
                "Sin datos disponibles"
              )}
            </p>
          </div>
        </Card>

        {/* Respuestas Pendientes Card */}
        <Card className="p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium text-muted-foreground">Respuestas Pendientes</h3>
            <div className="rounded-md bg-blue-100 p-1">
              <Clock className="h-4 w-4 text-blue-600" />
            </div>
          </div>
          <div className="flex items-center">
            <div className="text-3xl font-bold">
              {metricsLoading ? "..." : (npsMetrics?.pending_responses ?? 0)}
            </div>
          </div>
          <div className="mt-3">
            <p className="text-xs text-muted-foreground">
              {metricsLoading ? "Cargando..." : "Esperando feedback de clientes"}
            </p>
          </div>
        </Card>

        {/* Última Respuesta Card */}
        <Card className="p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium text-muted-foreground">Última Respuesta</h3>
            <div className="rounded-md bg-green-100 p-1">
              <MessageSquare className="h-4 w-4 text-green-600" />
            </div>
          </div>
          <div className="flex items-center">
            <div className="text-3xl font-bold">
              {metricsLoading ? "..." : (
                npsMetrics?.last_response 
                  ? format(new Date(npsMetrics.last_response.date), "dd MMM", { locale: es })
                  : "Sin datos"
              )}
            </div>
          </div>
          <div className="mt-3">
            <p className="text-xs text-muted-foreground">
              {metricsLoading ? "Cargando..." : (
                npsMetrics?.last_response 
                  ? `${npsMetrics.last_response.customer_name} - ${npsMetrics.last_response.score}/10`
                  : "No hay respuestas registradas"
              )}
            </p>
          </div>
        </Card>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex flex-1 items-center space-x-2">
          <Input
            placeholder="Buscar por nombre de cliente..."
            className="w-[250px]"
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
          />
          <Search className="h-4 w-4 text-muted-foreground" />
        </div>

        <Select
          value={filters.channel}
          onValueChange={(value) => setFilters(prev => ({ ...prev, channel: value }))}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Canal">
              {filters.channel === "todos" ? "Canal" : filters.channel === "whatsapp" ? "WhatsApp" : 
               filters.channel === "twilio" ? "Teléfono" : filters.channel === "manual" ? "Manual" : 
               filters.channel === "web" ? "Web" : filters.channel === "agenteai" ? "Agente AI" : "Canal"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="whatsapp">WhatsApp</SelectItem>
            <SelectItem value="twilio">Teléfono</SelectItem>
            <SelectItem value="manual">Manual</SelectItem>
            <SelectItem value="web">Web</SelectItem>
            <SelectItem value="agenteai">Agente AI</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.status}
          onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Estado">
              {filters.status === "todos" ? "Estado" : filters.status === "pendiente" ? "Pendiente" : 
               filters.status === "completado" ? "Completado" : "Estado"}
            </SelectValue>
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
            <SelectValue placeholder="Clasificación">
              {filters.classification === "todas" ? "Clasificación" : filters.classification === "promotor" ? "Promotor" : 
               filters.classification === "neutral" ? "Neutral" : filters.classification === "detractor" ? "Detractor" : "Clasificación"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas</SelectItem>
            <SelectItem value="promotor">Promotor</SelectItem>
            <SelectItem value="neutral">Neutral</SelectItem>
            <SelectItem value="detractor">Detractor</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : (
          <>
            <DataTable 
              columns={columns}
              data={data}
            />
            
            {/* Información de paginación - siempre visible */}
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center border-t pt-4">
              <div className="text-sm text-muted-foreground order-2 sm:order-1">
                {totalItems > 0 ? (
                  <>
                    Mostrando {((currentPage - 1) * ITEMS_PER_PAGE) + 1} -{" "}
                    {Math.min(currentPage * ITEMS_PER_PAGE, totalItems)} de {totalItems}{" "}
                    respuestas ({data.length} en esta página)
                  </>
                ) : (
                  "No hay respuestas para mostrar"
                )}
              </div>
              
              {/* Controles de paginación - solo si hay más de una página */}
              {totalPages > 1 && (
                <div className="order-1 sm:order-2">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationLink
                          onClick={() => setCurrentPage(1)}
                          disabled={currentPage === 1}
                        >
                          <ChevronsLeft className="h-4 w-4" />
                        </PaginationLink>
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
                          disabled={currentPage === 1}
                        />
                      </PaginationItem>
                      {getPageRange().map((page) => (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => setCurrentPage(page)}
                            isActive={currentPage === page}
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => currentPage < totalPages && setCurrentPage(currentPage + 1)}
                          disabled={currentPage === totalPages}
                        />
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationLink
                          onClick={() => setCurrentPage(totalPages)}
                          disabled={currentPage === totalPages}
                        >
                          <ChevronsRight className="h-4 w-4" />
                        </PaginationLink>
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
} 