"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { verifyToken } from "../../jwt/token";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye, Search, MessageSquare, Phone, BarChart3, PieChart, Users, CheckCircle, Clock, AlertTriangle, ArrowUpIcon, ArrowDownIcon, TrendingUp, TrendingDown } from "lucide-react";
import { formatDistanceToNow, format, subDays, startOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import { 
  PieChart as RechartsPieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';

interface ConversacionItem {
  id: string;
  user_identifier: string;
  client?: {
    names: string;
    phone_number: string;
    email: string;
  } | null;
  updated_at: string;
  status: 'active' | 'closed' | 'pending';
  user_messages_count: number;
  assistant_messages_count: number;
  channel?: string;
}

const ITEMS_PER_PAGE = 10;

// Componente de icono de WhatsApp (SVG)
const WhatsAppIcon = ({ className }: { className?: string }) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      className={className || "h-4 w-4"}
      fill="currentColor"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
};

export default function ConversacionesPage() {
  const router = useRouter();
  const [searchParams, setSearchParams] = useState<URLSearchParams | null>(null);
  const [token, setToken] = useState<string>("");
  const [dataToken, setDataToken] = useState<any>(null);
  const [conversaciones, setConversaciones] = useState<ConversacionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalConversaciones, setTotalConversaciones] = useState(0);
  const [pagina, setPagina] = useState(1);
  
  // Filtros
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [filtroFecha, setFiltroFecha] = useState("todas");
  const [filtroCanal, setFiltroCanal] = useState("todos");

  // Nuevos estados para métricas
  const [metricas, setMetricas] = useState<any>({
    total: 0,
    activas: 0,
    pendientes: 0,
    cerradas: 0,
    porFecha: [],
    porCanal: []
  });
  const [duracionPromedio, setDuracionPromedio] = useState<number>(0);
  const [canalesVisibles, setCanalesVisibles] = useState<{[key: string]: boolean}>({
    'WhatsApp': true,
    'Teléfono': true
  });

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
        
        if (verifiedDataToken === null) {
          router.push("/login");
        }
        
        setDataToken(verifiedDataToken || {});
      }
    }
  }, [searchParams, router]);

  useEffect(() => {
    if (dataToken) {
      cargarConversaciones();
      cargarMetricas();
    }
  }, [dataToken, busqueda, filtroEstado, filtroFecha, filtroCanal, pagina]);

  const cargarConversaciones = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("chat_conversations")
        .select(`
          *,
          client(names, email, phone_number, dealership_id)
        `, { count: "exact" })
        .order("updated_at", { ascending: false })
        .range((pagina - 1) * ITEMS_PER_PAGE, pagina * ITEMS_PER_PAGE - 1);

      // Filtrar por dealership_id si está disponible en el token
      if (dataToken?.dealership_id) {
        query = query.eq("dealership_id", dataToken.dealership_id);
      }

      // Aplicar filtros
      if (busqueda) {
        query = query.or(
          `user_identifier.ilike.%${busqueda}%,client.names.ilike.%${busqueda}%,client.phone_number.ilike.%${busqueda}%`
        );
      }

      if (filtroEstado !== "todos") {
        query = query.eq("status", filtroEstado);
      }
      
      // Filtro por canal
      if (filtroCanal !== "todos") {
        query = query.eq("channel", filtroCanal);
      }

      // Filtrar por fecha
      const ahora = new Date();
      let fechaDesde: Date | null = null;
      
      switch (filtroFecha) {
        case "hoy":
          fechaDesde = new Date(ahora.setHours(0, 0, 0, 0));
          break;
        case "ayer":
          fechaDesde = new Date(ahora);
          fechaDesde.setDate(fechaDesde.getDate() - 1);
          fechaDesde.setHours(0, 0, 0, 0);
          break;
        case "semana":
          fechaDesde = new Date(ahora);
          fechaDesde.setDate(fechaDesde.getDate() - 7);
          break;
        case "mes":
          fechaDesde = new Date(ahora);
          fechaDesde.setMonth(fechaDesde.getMonth() - 1);
          break;
      }

      if (fechaDesde) {
        query = query.gte("updated_at", fechaDesde.toISOString());
      }

      const { data, count, error } = await query;

      if (error) throw error;

      // Obtener conteo de mensajes para cada conversación
      const conversacionesConConteo = await Promise.all(
        (data || []).map(async (conv) => {
          try {
            // Extraer mensajes del campo JSONB de la conversación
            const mensajes = Array.isArray(conv.messages) ? conv.messages : [];
            
            const userCount = mensajes.filter((m: any) => m.role === "user").length;
            const assistantCount = mensajes.filter((m: any) => m.role === "assistant").length;

            return {
              ...conv,
              user_messages_count: userCount,
              assistant_messages_count: assistantCount
            };
          } catch (error) {
            console.error("Error al obtener mensajes para conversación", conv.id, error);
            return {
              ...conv,
              user_messages_count: 0,
              assistant_messages_count: 0
            };
          }
        })
      );

      setConversaciones(conversacionesConConteo);
      setTotalConversaciones(count || 0);
    } catch (error) {
      console.error("Error cargando conversaciones:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500">Activa</Badge>;
      case "closed":
        return <Badge className="bg-gray-500">Cerrada</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500">Pendiente</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: es
      });
    } catch (error) {
      return "Fecha inválida";
    }
  };

  const verDetalle = (id: string) => {
    router.push(`/backoffice/conversaciones/${id}?token=${token}`);
  };

  const totalPaginas = Math.ceil(totalConversaciones / ITEMS_PER_PAGE);

  // Función para obtener el icono según el canal
  const getCanalIcon = (channel?: string) => {
    switch (channel) {
      case 'phone':
        return <Phone className="h-4 w-4 mr-1 text-blue-500" />;
      case 'chat':
      default:
        return <MessageSquare className="h-4 w-4 mr-1 text-green-500" />;
    }
  };

  // Función para cargar métricas
  const cargarMetricas = async () => {
    try {
      console.log("Iniciando carga de métricas...");
      
      // Consulta básica para todas las conversaciones
      let baseQuery = supabase.from('chat_conversations').select('*');
      
      // Filtrar por dealership_id si está disponible
      if (dataToken?.dealership_id) {
        baseQuery = baseQuery.eq('dealership_id', dataToken.dealership_id);
      }
      
      // Ejecutar la consulta una sola vez y procesar los resultados localmente
      const { data: conversaciones, error } = await baseQuery;
      
      if (error) {
        console.error("Error obteniendo conversaciones:", error);
        throw error;
      }
      
      console.log(`Recuperadas ${conversaciones?.length || 0} conversaciones`);
      
      // Contar por estado manualmente
      let activas = 0;
      let cerradas = 0;
      let pendientes = 0;
      
      // Mapa para contar por canal
      const canalCount: Record<string, number> = {};
      
      // Inicializar fechas de los últimos 30 días
      const hoy = new Date();
      const fechas = [];
      for (let i = 0; i < 30; i++) {
        const fecha = new Date(hoy);
        fecha.setDate(hoy.getDate() - i);
        const key = format(fecha, 'dd/MM');
        fechas.push(key);
      }

      // Inicializar el mapa de fechas y canales
      const fechaCanalCount: Record<string, { WhatsApp: number, Teléfono: number }> = {};
      fechas.forEach(f => fechaCanalCount[f] = { WhatsApp: 0, Teléfono: 0 });
      
      // Procesar cada conversación para obtener las métricas
      conversaciones?.forEach(conv => {
        // Contar por estado
        if (conv.status === 'active') activas++;
        else if (conv.status === 'closed') cerradas++;
        else if (conv.status === 'pending') pendientes++;
        
        // Contar por canal
        const canal = conv.channel || 'desconocido';
        canalCount[canal] = (canalCount[canal] || 0) + 1;
        
        // Contar por fecha y canal real
        if (conv.created_at) {
          const fecha = format(new Date(conv.created_at), 'dd/MM');
          const canalFormateado = formatearNombreCanal(conv.channel || 'otro');
          if (fechaCanalCount[fecha]) {
            if (canalFormateado === 'WhatsApp') fechaCanalCount[fecha].WhatsApp += 1;
            else if (canalFormateado === 'Teléfono') fechaCanalCount[fecha].Teléfono += 1;
          }
        }
      });
      
      const total = activas + cerradas + pendientes;
      console.log(`Total: ${total}, Activas: ${activas}, Cerradas: ${cerradas}, Pendientes: ${pendientes}`);
      
      // Convertir conteo por canal a formato para gráfico
      const porCanal = Object.entries(canalCount).map(([canal, count]) => ({
        name: formatearNombreCanal(canal),
        value: count
      }));
      console.log("Distribución por canal:", porCanal);
      
      // Convertir conteo por fecha y canal a formato para gráfico
      const porFechaCanal = fechas.reverse().map(f => ({
        fecha: f,
        WhatsApp: fechaCanalCount[f].WhatsApp,
        Teléfono: fechaCanalCount[f].Teléfono
      }));
      
      // Actualizar estado con métricas calculadas
      setMetricas({
        total,
        activas,
        cerradas,
        pendientes,
        porCanal,
        porFecha: porFechaCanal
      });
      
      console.log("Métricas cargadas correctamente");

      // Calcular duración aproximada de llamadas telefónicas
      try {
        const { data: llamadas, error: errorLlamadas } = await supabase
          .from('chat_conversations')
          .select('created_at, updated_at, status')
          .eq('channel', 'phone')
          .eq('status', 'closed');  // Solo considerar llamadas cerradas
          
        if (errorLlamadas) {
          console.error('Error al cargar duración de llamadas:', errorLlamadas);
        } else if (llamadas && llamadas.length > 0) {
          let duracionTotal = 0;
          let llamadasValidas = 0;
          
          console.log(`Procesando ${llamadas.length} llamadas cerradas para cálculo de duración`);
          
          llamadas.forEach((llamada) => {
            if (llamada.updated_at && llamada.created_at) {
              const inicio = new Date(llamada.created_at);
              const fin = new Date(llamada.updated_at);  // Usando updated_at como aproximación del fin
              const duracionMinutos = (fin.getTime() - inicio.getTime()) / (1000 * 60);
              
              console.log(`Llamada: inicio=${inicio.toISOString()}, fin=${fin.toISOString()}, duración=${duracionMinutos.toFixed(2)} min`);
              
              // Solo considerar llamadas con duración razonable (entre 1 y 120 minutos)
              if (duracionMinutos > 1 && duracionMinutos < 120) {
                duracionTotal += duracionMinutos;
                llamadasValidas++;
              }
            }
          });
          
          if (llamadasValidas > 0) {
            const promedio = Math.round(duracionTotal / llamadasValidas);
            console.log(`Duración promedio calculada: ${promedio} minutos (${llamadasValidas} llamadas válidas)`);
            setDuracionPromedio(promedio);
          } else {
            console.log('No se encontraron llamadas válidas para calcular duración');
            setDuracionPromedio(5); // Valor predeterminado aproximado
          }
        } else {
          console.log('No se encontraron llamadas cerradas para calcular duración');
          setDuracionPromedio(5); // Valor predeterminado aproximado
        }
      } catch (error) {
        console.error('Error al calcular duración promedio:', error);
        setDuracionPromedio(5); // Valor predeterminado en caso de error
      }
    } catch (error) {
      console.error("Error cargando métricas:", error);
    }
  };

  const formatearNombreCanal = (canal: string) => {
    switch (canal) {
      case 'chat': return 'WhatsApp';
      case 'phone': return 'Teléfono';
      default: return 'Otro';
    }
  };

  // Colores para el gráfico de canales
  const CANAL_COLORS = {
    'WhatsApp': '#10B981',
    'Teléfono': '#4F46E5'
  };

  // Estilo personalizado para el tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 shadow-lg rounded-lg border border-gray-100">
          <p className="text-sm font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="flex items-center mb-1">
              <div 
                className="w-3 h-3 rounded-full mr-2" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm font-medium" style={{ color: entry.color }}>
                {entry.name}
              </span>
              <span className="text-sm font-medium ml-2">
                : {entry.value} conversaciones
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  // Calcular métricas de crecimiento (comparando con el mes anterior)
  const calcularCrecimiento = () => {
    const hoy = new Date();
    const inicioMesActual = startOfMonth(hoy);
    const inicioMesAnterior = startOfMonth(subDays(inicioMesActual, 1));

    // Ahora cada item tiene { fecha, WhatsApp, Teléfono }
    const conversacionesMesActual = metricas.porFecha.filter((item: any) => {
      const [day, month] = item.fecha.split('/').map(Number);
      const fechaItem = new Date(hoy.getFullYear(), month-1, day);
      return fechaItem >= inicioMesActual;
    }).reduce((sum: number, item: any) => sum + (item.WhatsApp || 0) + (item.Teléfono || 0), 0);

    const conversacionesMesAnterior = metricas.porFecha.filter((item: any) => {
      const [day, month] = item.fecha.split('/').map(Number);
      const fechaItem = new Date(hoy.getFullYear(), month-1, day);
      return fechaItem < inicioMesActual && fechaItem >= inicioMesAnterior;
    }).reduce((sum: number, item: any) => sum + (item.WhatsApp || 0) + (item.Teléfono || 0), 0);

    // LOG para depuración
    console.log('Crecimiento - Mes actual:', conversacionesMesActual, 'Mes anterior:', conversacionesMesAnterior);

    if (!conversacionesMesAnterior || isNaN(conversacionesMesAnterior)) {
      if (conversacionesMesActual > 0) {
        console.log('Crecimiento: 100% (no había conversaciones el mes anterior)');
        return { porcentaje: 100, creciendo: true };
      } else {
        console.log('Crecimiento: 0% (no hay conversaciones en ninguno de los dos meses)');
        return { porcentaje: 0, creciendo: false };
      }
    }

    const diferencia = conversacionesMesActual - conversacionesMesAnterior;
    const porcentaje = Math.round((diferencia / conversacionesMesAnterior) * 100);

    return {
      porcentaje: Math.abs(porcentaje),
      creciendo: porcentaje >= 0
    };
  };

  // Función para alternar la visibilidad de un canal en el gráfico
  const toggleCanalVisibilidad = (canal: string) => {
    setCanalesVisibles(prev => ({
      ...prev,
      [canal]: !prev[canal]
    }));
  };

  // Obtener datos de crecimiento
  const crecimiento = calcularCrecimiento();
  
  // Usar directamente los datos de métricas para el gráfico
  const datosGraficoArea = metricas.porFecha;

  return (
    <div className="px-4 py-6 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Conversaciones</h1>
      </div>

      {/* Métricas tipo Shadcn UI Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total conversaciones */}
        <Card className="p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium text-muted-foreground">Total Conversaciones</h3>
            <div className={`rounded-md p-1 flex items-center gap-1 ${crecimiento.creciendo ? 'bg-green-100' : 'bg-red-100'}`}>
              <span className={`text-xs font-medium ${crecimiento.creciendo ? 'text-green-600' : 'text-red-600'}`}>
                {crecimiento.creciendo ? '+' : '-'}{crecimiento.porcentaje}%
              </span>
              {crecimiento.creciendo ? 
                <ArrowUpIcon className="h-4 w-4 text-green-600" /> : 
                <ArrowDownIcon className="h-4 w-4 text-red-600" />
              }
            </div>
          </div>
          <div className="flex items-center">
            <div className="text-3xl font-bold">{metricas.total}</div>
          </div>
          <div className="mt-3">
            <p className="text-xs text-muted-foreground">
              {crecimiento.creciendo ? 
                <TrendingUp className="inline h-3 w-3 mr-1" /> : 
                <TrendingDown className="inline h-3 w-3 mr-1" />
              }
              {crecimiento.creciendo ? 'Creciendo' : 'Disminuyendo'} este mes
            </p>
          </div>
        </Card>
        
        {/* Activas */}
        <Card className="p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium text-muted-foreground">Conversaciones Activas</h3>
            <div className="rounded-md bg-green-100 p-1">
              <CheckCircle className="h-4 w-4 text-green-600" />
            </div>
          </div>
          <div className="flex items-center">
            <div className="text-3xl font-bold">{metricas.activas}</div>
          </div>
          <div className="mt-3">
            <p className="text-xs text-muted-foreground">
              <Users className="inline h-3 w-3 mr-1" />
              Requieren atención inmediata
            </p>
          </div>
        </Card>
        
        {/* Conversaciones WhatsApp */}
        <Card className="p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium text-muted-foreground">WhatsApp</h3>
            <div className="rounded-md bg-green-100 p-1">
              <WhatsAppIcon className="h-4 w-4 text-green-600" />
            </div>
          </div>
          <div className="flex items-center">
            <div className="text-3xl font-bold">
              {metricas.porCanal.find((canal: {name: string, value: number}) => canal.name === 'WhatsApp')?.value || 0}
            </div>
          </div>
          <div className="mt-3">
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              Alto nivel de interacción
            </p>
          </div>
        </Card>
        
        {/* Conversaciones Teléfono */}
        <Card className="p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium text-muted-foreground">Teléfono</h3>
            <div className="rounded-md bg-blue-100 p-1">
              <Phone className="h-4 w-4 text-blue-600" />
            </div>
          </div>
          <div className="flex items-center">
            <div className="text-3xl font-bold">
              {metricas.porCanal.find((canal: {name: string, value: number}) => canal.name === 'Teléfono')?.value || 0}
            </div>
          </div>
          <div className="mt-3">
            <p className="text-xs text-muted-foreground">
              <Clock className="inline h-3 w-3 mr-1" />
              Duración promedio: {duracionPromedio > 0 ? `${duracionPromedio} min` : 'Calculando...'}
            </p>
          </div>
        </Card>
      </div>

      {/* Gráfico principal */}
      <Card className="p-0 overflow-hidden">
        <div className="bg-white p-6 flex justify-between items-center border-b">
          <div>
            <h3 className="font-medium">Tendencia de Conversaciones</h3>
            <p className="text-sm text-muted-foreground">Distribución por canal y fecha</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant={canalesVisibles['WhatsApp'] ? "default" : "outline"} 
              size="sm" 
              className={`h-8 gap-1 ${canalesVisibles['WhatsApp'] ? 'bg-green-600 hover:bg-green-700' : ''}`}
              onClick={() => toggleCanalVisibilidad('WhatsApp')}
            >
              <span className="h-2 w-2 rounded-full bg-white"></span>
              WhatsApp
            </Button>
            <Button 
              variant={canalesVisibles['Teléfono'] ? "default" : "outline"} 
              size="sm" 
              className={`h-8 gap-1 ${canalesVisibles['Teléfono'] ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
              onClick={() => toggleCanalVisibilidad('Teléfono')}
            >
              <span className="h-2 w-2 rounded-full bg-white"></span>
              Teléfono
            </Button>
          </div>
        </div>
        <div className="p-6 h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={datosGraficoArea}
              margin={{
                top: 10,
                right: 30,
                left: 0,
                bottom: 0,
              }}
            >
              <defs>
                <linearGradient id="colorWhatsApp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CANAL_COLORS['WhatsApp']} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={CANAL_COLORS['WhatsApp']} stopOpacity={0.2}/>
                </linearGradient>
                <linearGradient id="colorTelefono" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CANAL_COLORS['Teléfono']} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={CANAL_COLORS['Teléfono']} stopOpacity={0.2}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
              <XAxis 
                dataKey="fecha" 
                tick={{fontSize: 12}}
                tickLine={false}
                axisLine={false}
                dy={10}
              />
              <YAxis 
                tick={{fontSize: 12}}
                tickLine={false}
                axisLine={false}
                width={30}
                dx={-10}
              />
              <Tooltip content={<CustomTooltip />} />
              {canalesVisibles['WhatsApp'] && (
                <Area 
                  type="monotone" 
                  dataKey="WhatsApp" 
                  stackId="1" 
                  stroke={CANAL_COLORS['WhatsApp']} 
                  fill="url(#colorWhatsApp)"
                  activeDot={{ r: 6, strokeWidth: 1, stroke: '#fff' }}
                />
              )}
              {canalesVisibles['Teléfono'] && (
                <Area 
                  type="monotone" 
                  dataKey="Teléfono" 
                  stackId="1" 
                  stroke={CANAL_COLORS['Teléfono']} 
                  fill="url(#colorTelefono)"
                  activeDot={{ r: 6, strokeWidth: 1, stroke: '#fff' }}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-4 mt-8 shadow-sm border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por usuario o cliente..."
              className="pl-8"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
          
          <Select
            value={filtroEstado}
            onValueChange={setFiltroEstado}
          >
            <SelectTrigger>
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas</SelectItem>
              <SelectItem value="active">Activas</SelectItem>
              <SelectItem value="closed">Cerradas</SelectItem>
              <SelectItem value="pending">Pendientes</SelectItem>
            </SelectContent>
          </Select>
          
          <Select
            value={filtroCanal}
            onValueChange={setFiltroCanal}
          >
            <SelectTrigger>
              <SelectValue placeholder="Canal" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los canales</SelectItem>
              <SelectItem value="chat">WhatsApp</SelectItem>
              <SelectItem value="phone">Llamadas</SelectItem>
            </SelectContent>
          </Select>
          
          <Select
            value={filtroFecha}
            onValueChange={setFiltroFecha}
          >
            <SelectTrigger>
              <SelectValue placeholder="Fecha" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas las fechas</SelectItem>
              <SelectItem value="hoy">Hoy</SelectItem>
              <SelectItem value="ayer">Ayer</SelectItem>
              <SelectItem value="semana">Esta semana</SelectItem>
              <SelectItem value="mes">Este mes</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <div className="border rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Canal</TableHead>
              <TableHead>Identificador</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Última actividad</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10">
                  Cargando conversaciones...
                </TableCell>
              </TableRow>
            ) : conversaciones.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10">
                  No se encontraron conversaciones
                </TableCell>
              </TableRow>
            ) : (
              conversaciones.map((conversacion) => (
                <TableRow key={conversacion.id}>
                  <TableCell className="w-10">
                    {getCanalIcon(conversacion.channel)}
                  </TableCell>
                  <TableCell className="font-medium">
                    {conversacion.user_identifier}
                  </TableCell>
                  <TableCell>
                    {conversacion.client ? (
                      <div>
                        <div className="font-semibold">{conversacion.client.names}</div>
                        <div className="text-sm text-muted-foreground">{conversacion.client.phone_number}</div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Sin cliente asociado</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {formatDate(conversacion.updated_at)}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(conversacion.status)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => verDetalle(conversacion.id)}
                      className="flex items-center gap-1"
                    >
                      <Eye className="h-4 w-4" />
                      Ver detalles
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPaginas > 1 && (
        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            Mostrando {((pagina - 1) * ITEMS_PER_PAGE) + 1} a {Math.min(pagina * ITEMS_PER_PAGE, totalConversaciones)} de {totalConversaciones} conversaciones
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setPagina((p) => Math.max(p - 1, 1))}
              disabled={pagina <= 1}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              onClick={() => setPagina((p) => Math.min(p + 1, totalPaginas))}
              disabled={pagina >= totalPaginas}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  );
} 