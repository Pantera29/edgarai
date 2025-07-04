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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface ConversacionItem {
  id: string;
  user_identifier: string;
  client?: {
    names: string;
    phone_number: string;
    email: string;
    agent_active: boolean;
  } | null;
  updated_at: string;
  status: 'active' | 'closed' | 'pending';
  user_messages_count: number;
  assistant_messages_count: number;
  channel?: string;
  ended_reason?: string;
  was_successful?: boolean;
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
  const [loading, setLoading] = useState(true);
  
  // Estados para métricas
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
      }
    }
  }, [searchParams, router]);

  useEffect(() => {
    if (dataToken) {
      cargarMetricas();
    }
  }, [dataToken]);

  // Función para cargar métricas
  const cargarMetricas = async () => {
    const tiempoInicio = performance.now();
    try {
      console.log("Iniciando carga de métricas...");
      
      // Consulta única optimizada
      const tiempoConsultaInicio = performance.now();
      const { data: conversaciones, error } = await supabase
        .from('chat_conversations')
        .select(`
          id,
          status,
          channel,
          created_at,
          updated_at
        `)
        .eq('dealership_id', dataToken.dealership_id);
      
      const tiempoConsultaFin = performance.now();
      console.log(`Tiempo de consulta a Supabase: ${(tiempoConsultaFin - tiempoConsultaInicio).toFixed(2)}ms`);
      console.log(`Cantidad de registros obtenidos: ${conversaciones?.length || 0}`);
      
      if (error) {
        console.error("Error obteniendo conversaciones:", error);
        throw error;
      }

      const tiempoProcesamientoInicio = performance.now();
      
      // Inicialización de contadores y estructuras de datos
      let activas = 0;
      let cerradas = 0;
      let pendientes = 0;
      let duracionTotal = 0;
      let llamadasValidas = 0;
      
      const canalCount: Record<string, number> = {};
      const hoy = new Date();
      const fechas = Array.from({ length: 30 }, (_, i) => {
        const fecha = new Date(hoy);
        fecha.setDate(hoy.getDate() - i);
        return format(fecha, 'dd/MM');
      });

      const fechaCanalCount: Record<string, { WhatsApp: number, Teléfono: number }> = {};
      fechas.forEach(f => fechaCanalCount[f] = { WhatsApp: 0, Teléfono: 0 });
      
      // Procesamiento de datos en una sola pasada
      conversaciones?.forEach(conv => {
        // Conteo por estado
        if (conv.status === 'active') activas++;
        else if (conv.status === 'closed') cerradas++;
        else if (conv.status === 'pending') pendientes++;
        
        // Conteo por canal
        const canal = conv.channel || 'desconocido';
        canalCount[canal] = (canalCount[canal] || 0) + 1;
        
        // Procesamiento de fechas y canales
        if (conv.created_at) {
          const fecha = format(new Date(conv.created_at), 'dd/MM');
          const canalFormateado = formatearNombreCanal(conv.channel || 'otro');
          if (fechaCanalCount[fecha]) {
            if (canalFormateado === 'WhatsApp') fechaCanalCount[fecha].WhatsApp += 1;
            else if (canalFormateado === 'Teléfono') fechaCanalCount[fecha].Teléfono += 1;
          }
        }

        // Cálculo de duración para llamadas cerradas
        if (conv.channel === 'phone' && conv.status === 'closed' && conv.updated_at && conv.created_at) {
          const inicio = new Date(conv.created_at);
          const fin = new Date(conv.updated_at);
          const duracionMinutos = (fin.getTime() - inicio.getTime()) / (1000 * 60);
          
          if (duracionMinutos > 1 && duracionMinutos < 120) {
            duracionTotal += duracionMinutos;
            llamadasValidas++;
          }
        }
      });
      
      // Cálculo de métricas finales
      const total = activas + cerradas + pendientes;
      const duracionPromedio = llamadasValidas > 0 ? Math.round(duracionTotal / llamadasValidas) : 5;
      
      const porCanal = Object.entries(canalCount).map(([canal, count]) => ({
        name: formatearNombreCanal(canal),
        value: count
      }));
      
      const porFechaCanal = fechas.reverse().map(f => ({
        fecha: f,
        WhatsApp: fechaCanalCount[f].WhatsApp,
        Teléfono: fechaCanalCount[f].Teléfono
      }));
      
      const tiempoProcesamientoFin = performance.now();
      console.log(`Tiempo de procesamiento de datos: ${(tiempoProcesamientoFin - tiempoProcesamientoInicio).toFixed(2)}ms`);
      
      // Actualización del estado con todas las métricas
      setMetricas({
        total,
        activas,
        cerradas,
        pendientes,
        porCanal,
        porFecha: porFechaCanal
      });

      setDuracionPromedio(duracionPromedio);
      
      const tiempoTotal = performance.now() - tiempoInicio;
      console.log(`Tiempo total de carga: ${tiempoTotal.toFixed(2)}ms`);
      console.log('Métricas calculadas:', {
        total,
        activas,
        cerradas,
        pendientes,
        llamadasValidas,
        duracionPromedio
      });
      
    } catch (error) {
      console.error("Error cargando métricas:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatearNombreCanal = (canal: string) => {
    switch (canal) {
      case 'whatsapp': return 'WhatsApp';
      case 'phone': return 'Teléfono';
      default: return 'Otro';
    }
  };

  // Calcular métricas de crecimiento
  const calcularCrecimiento = () => {
    const hoy = new Date();
    const inicioMesActual = startOfMonth(hoy);
    const inicioMesAnterior = startOfMonth(subDays(inicioMesActual, 1));

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

    if (!conversacionesMesAnterior || isNaN(conversacionesMesAnterior)) {
      if (conversacionesMesActual > 0) {
        return { porcentaje: 100, creciendo: true };
      } else {
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

  return (
    <div className="px-4 py-6 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Dashboard de Conversaciones</h1>
      </div>

      {/* KPIs */}
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
                bottom: 50,
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
                interval={2}
                angle={0}
                textAnchor="middle"
              />
              <YAxis 
                tick={{fontSize: 11}}
                tickLine={false}
                axisLine={false}
                width={32}
                tickMargin={8}
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
    </div>
  );
} 