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
import { Search, Eye } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { verifyToken } from "../../jwt/token"
import { ArrowUp, ArrowDown, Clock, MessageSquare, TrendingUp, CheckCircle, Check } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { ChevronsLeft, ChevronsRight } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ChartLineLabel } from "@/components/chart-line-label"
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs"

const ITEMS_PER_PAGE = 25;

interface Worker {
  id: number;
  names: string;
  surnames: string;
}

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
          variant = "default";
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
  {
    accessorKey: "comments",
    header: "Comentarios",
    cell: ({ row }: { row: any }) => {
      const comments = row.getValue("comments")
      const hasComments = comments && comments.trim() !== ""
      
      return (
        <div className="flex justify-center">
          {hasComments ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => row.original.showComments?.(comments)}
              className="h-8 w-8 p-0 hover:bg-blue-50"
              title="Ver comentarios"
            >
              <Eye className="h-4 w-4 text-blue-600" />
            </Button>
          ) : (
            <span className="text-muted-foreground text-sm">-</span>
          )}
        </div>
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
  total_sent: number
  response_rate: number
  last_response: {
    date: string
    customer_name: string
    score: number
  } | null
}

interface MonthlyNpsData {
  month: string
  nps_score: number
  total_responses: number
}

export default function FeedbackPage() {
  const [searchParams, setSearchParams] = useState<URLSearchParams | null>(null);
  const [token, setToken] = useState<string>("");
  const [dataToken, setDataToken] = useState<object>({});

  const router = useRouter();
  const { toast } = useToast();

  // Estado para el modal de comentarios
  const [commentsModalOpen, setCommentsModalOpen] = useState(false);
  const [selectedComments, setSelectedComments] = useState<string>("");

  // Estado para el gráfico de historial mensual
  const [monthlyNpsData, setMonthlyNpsData] = useState<MonthlyNpsData[]>([]);
  const [chartLoading, setChartLoading] = useState(true);

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
          fetchMonthlyNpsData(verifiedDataToken.dealership_id);
        } else {
          fetchMetrics();
          fetchData();
          fetchMonthlyNpsData();
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
  
  // Estados para tabs y casos urgentes
  const [activeTab, setActiveTab] = useState("todas")
  const [urgentCasesCount, setUrgentCasesCount] = useState(0)
  const [urgentCasesData, setUrgentCasesData] = useState<any[]>([])
  const [urgentCasesLoading, setUrgentCasesLoading] = useState(false)
  
  // Estados para gestión de casos urgentes
  const [workers, setWorkers] = useState<Worker[]>([])
  const [workersLoading, setWorkersLoading] = useState(false)
  const [assignmentChanges, setAssignmentChanges] = useState<{ [key: string]: number | null }>({})
  const [savingAssignments, setSavingAssignments] = useState<{ [key: string]: boolean }>({})



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

      // Calcular tasa de respuesta
      const responseRateData = await calculateResponseRate(dealershipIdFromToken, metricsData);
      
      // Combinar métricas con tasa de respuesta
      const enhancedMetrics = {
        ...metricsData,
        ...responseRateData
      };

      setNpsMetrics(enhancedMetrics);
      
    } catch (error) {
      console.error('❌ Error fatal obteniendo métricas:', error);
      setNpsMetrics(null);
    } finally {
      setMetricsLoading(false);
    }
  }

  const calculateResponseRate = async (dealershipId: string, metricsData: any) => {
    try {
      // Obtener total de encuestas enviadas
      const { data: totalData, error: totalError } = await supabase
        .from('nps')
        .select(`
          id,
          client!inner (
            dealership_id
          )
        `)
        .eq('client.dealership_id', dealershipId);

      if (totalError || !totalData) {
        console.error('❌ Error obteniendo total de encuestas:', totalError);
        return { total_sent: 0, response_rate: 0 };
      }

      const totalSent = totalData.length;
      
      // Obtener total de encuestas completadas (de todos los meses)
      const { data: completedData, error: completedError } = await supabase
        .from('nps')
        .select(`
          id,
          client!inner (
            dealership_id
          )
        `)
        .eq('client.dealership_id', dealershipId)
        .eq('status', 'completed')
        .not('score', 'is', null);

      if (completedError || !completedData) {
        console.error('❌ Error obteniendo encuestas completadas:', completedError);
        return { total_sent: totalSent, response_rate: 0 };
      }

      const totalCompleted = completedData.length;
      const responseRate = totalSent > 0 ? Math.round((totalCompleted / totalSent) * 100) : 0;

      console.log('🔍 [DEBUG] Cálculo tasa de respuesta:', {
        totalSent,
        totalCompleted,
        responseRate: `${responseRate}%`
      });

      return {
        total_sent: totalSent,
        response_rate: responseRate
      };
    } catch (error) {
      console.error('❌ Error calculando tasa de respuesta:', error);
      return { total_sent: 0, response_rate: 0 };
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
        channel: item.appointment?.channel || null,
        showComments: showComments
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

  const fetchMonthlyNpsData = async (dealershipIdFromToken?: string) => {
    if (!dealershipIdFromToken) {
      setChartLoading(false);
      return;
    }

    setChartLoading(true);
    try {
      // Obtener datos de los últimos 12 meses
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
      twelveMonthsAgo.setDate(1); // Primer día del mes

      const { data, error } = await supabase
        .from('nps')
        .select(`
          created_at,
          score,
          status,
          client!inner (
            dealership_id
          )
        `)
        .eq('client.dealership_id', dealershipIdFromToken)
        .gte('created_at', twelveMonthsAgo.toISOString())
        .eq('status', 'completed')
        .not('score', 'is', null);

      if (error) {
        console.error('❌ Error obteniendo datos históricos de NPS:', error);
        throw error;
      }

      // Agrupar por mes y calcular NPS
      const monthlyData: { [key: string]: { scores: number[], total: number } } = {};
      
      data?.forEach(item => {
        const monthKey = format(new Date(item.created_at), 'yyyy-MM');
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { scores: [], total: 0 };
        }
        monthlyData[monthKey].scores.push(item.score);
        monthlyData[monthKey].total++;
      });

      console.log('🔍 [DEBUG] Datos agrupados por mes:', monthlyData);

      // Convertir a array y calcular NPS score para cada mes
      const monthlyNpsArray: MonthlyNpsData[] = Object.keys(monthlyData)
        .sort()
        .map(monthKey => {
          const monthData = monthlyData[monthKey];
          const promoters = monthData.scores.filter(score => score >= 9).length;
          const detractors = monthData.scores.filter(score => score <= 6).length;
          const npsScore = monthData.total > 0 ? Math.round(((promoters - detractors) / monthData.total) * 100) : 0;
          
          // Arreglar el formateo de fechas para que funcione correctamente con locale español
          const [year, month] = monthKey.split('-');
          const date = new Date(parseInt(year), parseInt(month) - 1, 1); // month - 1 porque JS cuenta desde 0
          const formattedDate = format(date, 'MMM yyyy', { locale: es });
          
          console.log('🔍 [DEBUG] Procesando fecha:', {
            monthKey,
            year,
            month,
            date,
            formattedDate
          });
          
          return {
            month: formattedDate,
            nps_score: npsScore,
            total_responses: monthData.total
          };
        });

      console.log('🔍 [DEBUG] Array final de NPS mensual:', monthlyNpsArray);

      setMonthlyNpsData(monthlyNpsArray);
      
    } catch (error) {
      console.error('❌ Error fatal obteniendo datos históricos de NPS:', error);
      setMonthlyNpsData([]);
    } finally {
      setChartLoading(false);
    }
  }

  const fetchWorkers = async (dealershipIdFromToken?: string) => {
    if (!dealershipIdFromToken) {
      setWorkersLoading(false);
      return;
    }

    setWorkersLoading(true);
    try {
      console.log('🔄 Cargando lista de trabajadores...');
      
      const { data: workersData, error } = await supabase
        .from('worker_agency')
        .select('id, names, surnames')
        .eq('dealership_id', dealershipIdFromToken)
        .eq('active', true)
        .order('names', { ascending: true });

      if (error) {
        console.error('❌ Error obteniendo trabajadores:', error);
        throw error;
      }

      console.log('✅ Trabajadores obtenidos:', workersData?.length || 0);
      setWorkers(workersData || []);
      
    } catch (error) {
      console.error('❌ Error fatal cargando trabajadores:', error);
      setWorkers([]);
    } finally {
      setWorkersLoading(false);
    }
  }

  const fetchUrgentCases = async (dealershipIdFromToken?: string) => {
    if (!dealershipIdFromToken) {
      setUrgentCasesLoading(false);
      return;
    }

    setUrgentCasesLoading(true);
    try {
      console.log('🔄 Cargando casos urgentes...');
      
      const { data: urgentData, error } = await supabase
        .from('nps')
        .select(`
          *,
          client!inner (
            names,
            dealership_id
          ),
          appointment (
            channel
          ),
          worker:assigned_to (
            id,
            names,
            surnames
          )
        `)
        .eq('client.dealership_id', dealershipIdFromToken)
        .eq('classification', 'detractor')
        .eq('status', 'completed')
        .is('contacted_at', null)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error obteniendo casos urgentes:', error);
        throw error;
      }

      console.log('✅ Casos urgentes obtenidos:', urgentData?.length || 0);

      const formattedUrgentData = (urgentData || []).map(item => ({
        ...item,
        customer_name: item.client?.names || '-',
        assigned_to_name: item.worker ? `${item.worker.names} ${item.worker.surnames}` : null,
        showComments: showComments
      }));

      setUrgentCasesData(formattedUrgentData);
      setUrgentCasesCount(urgentData?.length || 0);
      
    } catch (error) {
      console.error('❌ Error fatal cargando casos urgentes:', error);
      setUrgentCasesData([]);
      setUrgentCasesCount(0);
    } finally {
      setUrgentCasesLoading(false);
    }
  }

  // Cargar métricas solo cuando cambie el dealership_id
  useEffect(() => {
    if (dataToken && (dataToken as any).dealership_id) {
      console.log('🔄 Cargando métricas para dealership:', (dataToken as any).dealership_id);
      fetchMetrics((dataToken as any).dealership_id);
      fetchMonthlyNpsData((dataToken as any).dealership_id);
      fetchUrgentCases((dataToken as any).dealership_id);
      fetchWorkers((dataToken as any).dealership_id);
    }
  }, [dataToken])

  // Función para mostrar comentarios
  const showComments = (comments: string) => {
    setSelectedComments(comments);
    setCommentsModalOpen(true);
  };

  // Función para manejar cambio en dropdown de asignación
  const handleAssignmentChange = (npsId: string, workerId: number | null) => {
    setAssignmentChanges(prev => ({
      ...prev,
      [npsId]: workerId
    }));
  };

  // Función para guardar asignación
  const handleSaveAssignment = async (npsId: string, workerId: number | null) => {
    setSavingAssignments(prev => ({ ...prev, [npsId]: true }));
    
    try {
      const response = await fetch(`/api/nps/${npsId}/assign`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ assigned_to: workerId }),
      });

      if (!response.ok) {
        throw new Error('Error al asignar');
      }

      toast({
        title: "✓ Asignado correctamente",
        variant: "default",
      });

      // Actualizar datos locales
      setUrgentCasesData(prev => prev.map(item => {
        if (item.id === npsId) {
          const worker = workers.find(w => w.id === workerId);
          return {
            ...item,
            assigned_to: workerId,
            assigned_to_name: worker ? `${worker.names} ${worker.surnames}` : null
          };
        }
        return item;
      }));

      // Limpiar el cambio pendiente
      setAssignmentChanges(prev => {
        const newChanges = { ...prev };
        delete newChanges[npsId];
        return newChanges;
      });
      
    } catch (error) {
      console.error('Error al asignar:', error);
      toast({
        title: "❌ Error al asignar. Intenta de nuevo",
        variant: "destructive",
      });
    } finally {
      setSavingAssignments(prev => ({ ...prev, [npsId]: false }));
    }
  };

  // Función para marcar caso como contactado
  const handleMarkContacted = async (npsId: string) => {
    try {
      const response = await fetch(`/api/nps/${npsId}/contact`, {
        method: 'PATCH',
      });

      if (!response.ok) {
        throw new Error('Error al marcar como contactado');
      }

      toast({
        title: "✓ Caso marcado como contactado",
        variant: "default",
      });

      // Remover la fila de la tabla con animación
      setUrgentCasesData(prev => prev.filter(item => item.id !== npsId));
      setUrgentCasesCount(prev => prev - 1);
      
    } catch (error) {
      console.error('Error al marcar como contactado:', error);
      toast({
        title: "❌ Error al guardar. Intenta de nuevo",
        variant: "destructive",
      });
    }
  };

  // Columnas para casos urgentes con gestión
  const urgentCasesColumns = [
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
      accessorKey: "score",
      header: "Puntaje",
      cell: ({ row }: { row: any }) => (
        <Badge variant="destructive">
          {row.getValue("score") ? `${row.getValue("score")}/10` : "-"}
        </Badge>
      )
    },
    {
      accessorKey: "comments",
      header: "Comentarios",
      cell: ({ row }: { row: any }) => {
        const comments = row.getValue("comments")
        const hasComments = comments && comments.trim() !== ""
        
        return (
          <div className="flex justify-center">
            {hasComments ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => row.original.showComments?.(comments)}
                className="h-8 w-8 p-0 hover:bg-blue-50"
                title="Ver comentarios"
              >
                <Eye className="h-4 w-4 text-blue-600" />
              </Button>
            ) : (
              <span className="text-muted-foreground text-sm">-</span>
            )}
          </div>
        )
      }
    },
    {
      accessorKey: "assigned_to",
      header: "Asignar a",
      cell: ({ row }: { row: any }) => {
        const npsId = row.original.id;
        const currentAssignment = row.getValue("assigned_to");
        const pendingChange = assignmentChanges[npsId];
        const hasChanges = pendingChange !== undefined && pendingChange !== currentAssignment;
        const isSaving = savingAssignments[npsId] || false;
        
        return (
          <div className="flex items-center gap-2">
            <Select
              value={pendingChange !== undefined ? String(pendingChange || 'unassigned') : String(currentAssignment || 'unassigned')}
              onValueChange={(value) => handleAssignmentChange(npsId, value === 'unassigned' ? null : Number(value))}
              disabled={isSaving}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sin asignar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Sin asignar</SelectItem>
                {workers.map(worker => (
                  <SelectItem key={worker.id} value={String(worker.id)}>
                    {worker.names} {worker.surnames}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              onClick={() => handleSaveAssignment(npsId, pendingChange ?? currentAssignment)}
              disabled={!hasChanges || isSaving}
            >
              {isSaving ? "..." : "Guardar"}
            </Button>
          </div>
        )
      }
    },
    {
      accessorKey: "action",
      header: "Acción",
      cell: ({ row }: { row: any }) => {
        const npsId = row.original.id;
        
        return (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleMarkContacted(npsId)}
            className="flex items-center gap-1"
          >
            <Check className="h-4 w-4" />
            Contactado
          </Button>
        )
      }
    },
  ];

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

  // Recargar casos urgentes al cambiar de tab
  useEffect(() => {
    if (activeTab === "urgentes" && dataToken && (dataToken as any).dealership_id) {
      fetchUrgentCases((dataToken as any).dealership_id);
    }
  }, [activeTab, dataToken]);

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

      {/* Estilos para el dot parpadeante */}
      <style jsx>{`
        @keyframes pulse-dot {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
        .pulse-dot {
          animation: pulse-dot 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>

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
              {metricsLoading ? "Cargando..." : (
                <>
                  Tasa de respuesta: {npsMetrics?.response_rate ?? 0}%
                  <br />
                  {npsMetrics?.total_sent ? `${npsMetrics.total_sent} encuestas enviadas` : "Esperando feedback de clientes"}
                </>
              )}
            </p>
          </div>
        </Card>

        {/* Gráfico de Historial Mensual de NPS */}
        <Card className="p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium text-muted-foreground">Historial Mensual NPS</h3>
            <div className="rounded-md bg-green-100 p-1">
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
          </div>
          <div className="h-[120px] mt-2">
            {chartLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            ) : monthlyNpsData.length > 0 ? (
              <ChartLineLabel
                data={monthlyNpsData}
                index="month"
                categories={["nps_score"]}
                colors={["#10b981"]}
                yAxisWidth={40}
                showLegend={false}
                showGrid={false}
                showAnimation={true}
                height={120}
                className="w-full"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                Sin datos históricos
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Tabs para separar vista de Todas y Casos Urgentes */}
      <Tabs defaultValue="todas" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="todas">
            Todas las Encuestas
          </TabsTrigger>
          <TabsTrigger value="urgentes" className="flex items-center gap-2">
            {urgentCasesCount > 0 && (
              <span className="h-2 w-2 rounded-full bg-red-500 pulse-dot" />
            )}
            Casos Urgentes
            {urgentCasesCount > 0 && (
              <Badge variant="destructive" className="ml-1">
                {urgentCasesCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Tab Content: Todas las Encuestas */}
        <TabsContent value="todas" className="space-y-4">
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
        </TabsContent>

        {/* Tab Content: Casos Urgentes */}
        <TabsContent value="urgentes" className="space-y-4">
          {urgentCasesLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : urgentCasesCount === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 space-y-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
              <h2 className="text-2xl font-bold text-gray-900">¡Todo al día!</h2>
              <p className="text-gray-600 text-center">
                No hay casos urgentes pendientes. Excelente trabajo del equipo 🎉
              </p>
            </div>
          ) : (
            <DataTable 
              columns={urgentCasesColumns}
              data={urgentCasesData}
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Modal de Comentarios */}
      <Dialog open={commentsModalOpen} onOpenChange={setCommentsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Comentarios del Cliente</DialogTitle>
            <DialogDescription>
              Comentarios asociados a esta respuesta NPS
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-800 whitespace-pre-wrap">{selectedComments}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 