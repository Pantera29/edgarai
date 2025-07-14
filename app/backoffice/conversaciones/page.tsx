"use client";

import { useState, useEffect, useMemo } from "react";
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
import { Eye, Search, MessageSquare, Phone, BarChart3, PieChart, Users, CheckCircle, Clock, AlertTriangle, ArrowUpIcon, ArrowDownIcon, TrendingUp, TrendingDown, Calendar } from "lucide-react";
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
  
  // NUEVO: Estado para métricas de crecimiento
  const [growthMetrics, setGrowthMetrics] = useState<any>({
    current_month: 0,
    previous_month: 0,
    growth_percentage: 0,
    vs_previous_month: 0
  });
  
  // NUEVO: Estado para métricas de conversión
  const [conversionMetrics, setConversionMetrics] = useState<any>({
    tasa_conversion: 0,
    show_up_rate: 0,
    tasa_exito_whatsapp: 0,
    tasa_exito_phone: 0,
    conversaciones_con_citas: 0,
    total_conversaciones: 0,
    citas_agendadas: 0,
    citas_completadas: 0
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

  // Función para cargar métricas optimizada
  const cargarMetricas = async () => {
    const tiempoInicio = performance.now();
    try {
      console.log("🔄 Iniciando carga de KPIs optimizada...");
      setLoading(true);
      
      // Single optimized API call
      const response = await fetch(
        `/api/conversations/kpis?dealership_id=${dataToken.dealership_id}`
      );
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      console.log('📊 Datos recibidos en frontend:', {
        hasData: !!data,
        dataType: typeof data,
        dataKeys: data ? Object.keys(data) : 'no data',
        metricasKeys: data?.metricas ? Object.keys(data.metricas) : 'no metricas',
        growthKeys: data?.growth ? Object.keys(data.growth) : 'no growth',
        duracionPromedio: data?.duracionPromedio,
        metricasTotal: data?.metricas?.total,
        metricasActivas: data?.metricas?.activas
      });
      
      // Data comes pre-processed from backend
      setMetricas(data.metricas);
      setDuracionPromedio(data.duracionPromedio);
      
      // NUEVO: Establecer métricas de crecimiento
      if (data.growth) {
        setGrowthMetrics(data.growth);
      }

      // NUEVO: Establecer métricas de conversión
      if (data.conversion) {
        setConversionMetrics(data.conversion);
      }
      
      const tiempoTotal = performance.now() - tiempoInicio;
      console.log(`✅ KPIs cargados en ${tiempoTotal.toFixed(2)}ms (optimizado)`);
      
    } catch (error) {
      console.error("❌ Error cargando KPIs:", error);
      // Could add toast notification here
    } finally {
      setLoading(false);
    }
  };



  // Función para alternar la visibilidad de un canal en el gráfico
  const toggleCanalVisibilidad = (canal: string) => {
    setCanalesVisibles(prev => ({
      ...prev,
      [canal]: !prev[canal]
    }));
  };

  // ELIMINAR: Ya no necesitamos calcular crecimiento en el frontend
  // const crecimiento = useMemo(() => { ... }, [metricas.porFecha]);
  
  // NUEVO: Usar directamente los datos del backend
  const crecimiento = {
    porcentaje: Math.abs(growthMetrics.growth_percentage || 0),
    creciendo: (growthMetrics.growth_percentage || 0) >= 0
  };

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
            <h3 className="tracking-tight text-sm font-medium text-muted-foreground">Conversaciones del Mes</h3>
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
              {crecimiento.creciendo ? 'Creciendo' : 'Disminuyendo'} vs mes anterior
            </p>
          </div>
        </Card>
        
        {/* Conversaciones de Hoy */}
        <Card className="p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium text-muted-foreground">Conversaciones de Hoy</h3>
            <div className="rounded-md bg-blue-100 p-1">
              <Clock className="h-4 w-4 text-blue-600" />
            </div>
          </div>
          <div className="flex items-center">
            <div className="text-3xl font-bold">{metricas.activas}</div>
          </div>
          <div className="mt-3">
            <p className="text-xs text-muted-foreground">
              <Calendar className="inline h-3 w-3 mr-1" />
              Actividad del día actual
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
              Duración promedio: {duracionPromedio && duracionPromedio > 0 ? `${duracionPromedio} min` : 'Sin datos'}
            </p>
          </div>
        </Card>
      </div>

      {/* NUEVO: Métricas de Conversión */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">📊 Métricas de Conversión - Agente AI</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Tasa de Conversión */}
          <Card className="p-6">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="tracking-tight text-sm font-medium text-muted-foreground">Tasa de Conversión</h3>
              <div className="rounded-md bg-purple-100 p-1">
                <BarChart3 className="h-4 w-4 text-purple-600" />
              </div>
            </div>
            <div className="flex items-center">
              <div className="text-3xl font-bold">{conversionMetrics.tasa_conversion}%</div>
            </div>
            <div className="mt-3">
              <p className="text-xs text-muted-foreground">
                <CheckCircle className="inline h-3 w-3 mr-1" />
                {conversionMetrics.citas_agendadas} citas de {conversionMetrics.total_conversaciones} conversaciones
              </p>
            </div>
          </Card>
          
          {/* Show-up Rate */}
          <Card className="p-6">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="tracking-tight text-sm font-medium text-muted-foreground">Show-up Rate</h3>
              <div className="rounded-md bg-orange-100 p-1">
                <Users className="h-4 w-4 text-orange-600" />
              </div>
            </div>
            <div className="flex items-center">
              <div className="text-3xl font-bold">{conversionMetrics.show_up_rate}%</div>
            </div>
            <div className="mt-3">
              <p className="text-xs text-muted-foreground">
                <CheckCircle className="inline h-3 w-3 mr-1" />
                {conversionMetrics.citas_completadas} completadas de {conversionMetrics.citas_agendadas} agendadas
              </p>
            </div>
          </Card>
          
          {/* Tasa de Éxito por Canal */}
          <Card className="p-6">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="tracking-tight text-sm font-medium text-muted-foreground">Éxito por Canal</h3>
              <div className="rounded-md bg-indigo-100 p-1">
                <PieChart className="h-4 w-4 text-indigo-600" />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">{conversionMetrics.tasa_exito_whatsapp}%</div>
                <div className="text-xs text-muted-foreground">WhatsApp</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">{conversionMetrics.tasa_exito_phone}%</div>
                <div className="text-xs text-muted-foreground">Teléfono</div>
              </div>
            </div>
            <div className="mt-3">
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="inline h-3 w-3 mr-1" />
                Conversión por canal del mes
              </p>
            </div>
          </Card>
        </div>
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