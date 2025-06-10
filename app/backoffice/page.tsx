"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { format, subMonths, parse } from 'date-fns'
import { es } from 'date-fns/locale'
import { Badge } from "@/components/ui/badge"
import { TooltipProvider } from '@radix-ui/react-tooltip'
import { verifyToken } from '../jwt/token'
import { useRouter } from "next/navigation"
import { 
  Calendar as CalendarIcon, 
  CalendarIcon as CalendarLucideIcon,
  Car,
  DollarSign, 
  Plus, 
  Smile, 
  ChevronRight,
  Wrench,
  ArrowUpIcon,
  ArrowDownIcon,
  TrendingUp,
  TrendingDown,
  Users,
  MessageSquare,
  Phone,
  User,
  Globe,
  Bot,
  Settings
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { toast } from "@/components/ui/use-toast"
import { DonutChart } from "@/components/ui/donut-chart"
import { AppointmentTrendChart } from "@/components/dashboard/appointment-trend-chart"
import { calculateWorkshopUtilization } from "@/lib/dashboard-metrics"

interface Servicio {
  nombre: string;
}

interface Cliente {
  nombre: string;
  dealership_id?: string;
}

interface Vehiculo {
  marca: string;
  modelo: string;
  placa: string;
}

interface CitaSupabase {
  id_uuid: string;
  fecha_hora: string;
  status: string;
  clientes: Cliente;
  servicios: Servicio;
  vehiculos?: Vehiculo;
  duracion?: number;
}

interface WorkshopUtilization {
  status: string;
  utilizationRate: number;
}

interface DashboardData {
  estadoCitas: {
    pendientes: number;
    confirmadas: number;
    enCurso: number;
    finalizadas: number;
  };
  satisfaccionCliente: {
    nps: number;
    tendencia: number;
  };
  citasDelDia: CitaSupabase[];
  citasPorOrigen: {
    whatsapp: number;
    twilio: number;
    manual: number;
    web: number;
    agenteai: number;
  };
  workshopUtilization?: WorkshopUtilization;
}

const getOrigenIcon = (origen: string) => {
  switch (origen) {
    case 'whatsapp':
      return <MessageSquare className="h-4 w-4" />;
    case 'twilio':
      return <Phone className="h-4 w-4" />;
    case 'manual':
      return <User className="h-4 w-4" />;
    case 'web':
      return <Globe className="h-4 w-4" />;
    case 'agenteai':
      return <Bot className="h-4 w-4" />;
    default:
      return null;
  }
};

const getOrigenColor = (origen: string) => {
  switch (origen) {
    case 'manual':
      return 'bg-gray-200'; // gris claro
    case 'agenteai':
      return 'bg-blue-500'; // azul
    default:
      return 'bg-gray-200';
  }
};

const getOrigenLabel = (origen: string) => {
  switch (origen) {
    case 'manual':
      return 'Manual';
    case 'agenteai':
      return 'Agente AI';
    default:
      return origen;
  }
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [searchParams, setSearchParams] = useState<URLSearchParams | null>(null)
  const [token, setToken] = useState<string>("")
  const [dataToken, setDataToken] = useState<{dealership_id?: string}>({})
  const [tabActivo, setTabActivo] = useState<string>("todas")
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [datePickerOpen, setDatePickerOpen] = useState(false)
  const [workshopUtilization, setWorkshopUtilization] = useState<WorkshopUtilization | null>(null)

  // Obtener la fecha actual
  const fechaHoy = format(new Date(), 'yyyy-MM-dd');
  const [fechaSeleccionada, setFechaSeleccionada] = useState(fechaHoy);

  // Efecto para cargar datos cuando cambia la fecha
  useEffect(() => {
    if (dataToken?.dealership_id) {
      console.log('useEffect - Cargando datos para fecha:', fechaSeleccionada);
      cargarDatos(dataToken.dealership_id);
      fetchWorkshopData(dataToken.dealership_id);
    }
  }, [fechaSeleccionada, dataToken?.dealership_id]);

  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      setSearchParams(params)
    }
  }, [])

  useEffect(() => {
    if (searchParams) {
      const tokenValue = searchParams.get("token")
      if (tokenValue) {
        setToken(tokenValue)
        const verifiedDataToken = verifyToken(tokenValue)
        // Mejor validación: redirigir si el token es null, vacío, no es objeto o no tiene dealership_id
        if (
          !verifiedDataToken ||
          typeof verifiedDataToken !== "object" ||
          Object.keys(verifiedDataToken).length === 0 ||
          !(verifiedDataToken as any).dealership_id
        ) {
          router.push("/login")
          return
        }
        setDataToken(verifiedDataToken)
        if (verifiedDataToken?.dealership_id) {
          cargarDatos(verifiedDataToken.dealership_id)
        } else {
          cargarDatos()
        }
      }
    }
  }, [searchParams, router])

  useEffect(() => {
    if (searchParams && searchParams.has('data')) {
      try {
        const dataParam = searchParams.get('data')
        if (dataParam) {
          const decodedData = decodeURIComponent(dataParam)
          const parsedData = JSON.parse(decodedData)
          setDataToken(parsedData)
        }
      } catch (error) {
        console.error('Error al procesar data:', error)
      }
    }
  }, [searchParams, router])

  const cargarDatos = async (dealershipId?: string) => {
    setIsLoading(true);
    try {
      console.log('cargarDatos - Consultando citas para fecha:', fechaSeleccionada);
      
      // 1. Obtener estado de citas
      const { data: estadoCitasData, error: estadoCitasError } = await supabase
        .from('appointment')
        .select(`
          status,
          client!inner (
            dealership_id
          )
        `)
        .eq('appointment_date', fechaSeleccionada)
        .eq('dealership_id', dealershipId || '')
        .eq('client.dealership_id', dealershipId || '');
      
      if (estadoCitasError) throw estadoCitasError;
      
      // Contar citas por estado
      const estadoCitas = {
        pendientes: estadoCitasData?.filter(cita => cita.status === 'pending').length || 0,
        confirmadas: estadoCitasData?.filter(cita => cita.status === 'confirmed').length || 0,
        enCurso: estadoCitasData?.filter(cita => cita.status === 'in_progress').length || 0,
        finalizadas: estadoCitasData?.filter(cita => cita.status === 'completed').length || 0
      };

      // Obtener citas del mes actual para el gráfico de origen
      const primerDiaMes = format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd');
      const ultimoDiaMes = format(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0), 'yyyy-MM-dd');

      const { data: citasMesData, error: citasMesError } = await supabase
        .from('appointment')
        .select('channel')
        .gte('appointment_date', primerDiaMes)
        .lte('appointment_date', ultimoDiaMes)
        .eq('dealership_id', dealershipId || '');

      if (citasMesError) throw citasMesError;

      // Contar citas por origen
      const citasPorOrigen = {
        whatsapp: citasMesData?.filter(cita => cita.channel === 'whatsapp').length || 0,
        twilio: citasMesData?.filter(cita => cita.channel === 'twilio').length || 0,
        manual: citasMesData?.filter(cita => cita.channel === 'manual').length || 0,
        web: citasMesData?.filter(cita => cita.channel === 'web').length || 0,
        agenteai: citasMesData?.filter(cita => cita.channel === 'agenteai').length || 0
      };
      
      // 2. Obtener citas del día
      const { data: citasDelDiaData, error: citasDelDiaError } = await supabase
        .from('appointment')
        .select(`
          id,
          appointment_date,
          appointment_time,
          status,
          client_id,
          vehicle_id,
          service_id,
          client!inner (
            id,
            names,
            dealership_id
          ),
          services:service_id (
            id_uuid,
            service_name,
            duration_minutes
          ),
          vehicles:vehicle_id (
            id_uuid,
            make,
            model,
            license_plate
          )
        `)
        .eq('appointment_date', fechaSeleccionada)
        .eq('dealership_id', dealershipId || '')
        .eq('client.dealership_id', dealershipId || '')
        .order('appointment_time', { ascending: true });
      
      if (citasDelDiaError) throw citasDelDiaError;
      
      // Transformar los datos para que coincidan con la interfaz CitaSupabase
      const citasDelDia = citasDelDiaData?.map(cita => {
        // Obtener el primer elemento de cada array de relaciones
        const clienteData = Array.isArray(cita.client) ? cita.client[0] : cita.client;
        const servicioData = Array.isArray(cita.services) ? cita.services[0] : cita.services;
        const vehiculoData = Array.isArray(cita.vehicles) ? cita.vehicles[0] : cita.vehicles;

        return {
          id_uuid: cita.id.toString(),
          fecha_hora: `${cita.appointment_date}T${cita.appointment_time}`,
          status: cita.status || 'pending',
          clientes: {
            nombre: clienteData?.names || 'Cliente desconocido',
            dealership_id: dealershipId || ''
          },
          servicios: {
            nombre: servicioData?.service_name || 'Servicio desconocido'
          },
          vehiculos: vehiculoData ? {
            marca: vehiculoData.make,
            modelo: vehiculoData.model,
            placa: vehiculoData.license_plate || 'Sin placa'
          } : undefined,
          duracion: servicioData?.duration_minutes || 60
        };
      }) || [];
      
      // 3. Satisfacción del cliente (NPS) - Por ahora usamos valores por defecto
      // TODO: Implementar cuando se tenga la tabla de feedback
      const satisfaccionCliente = {
        nps: 0,
        tendencia: 0
      };
      
      // Construir el objeto de datos del dashboard
      const datosDashboard: DashboardData = {
        estadoCitas,
        satisfaccionCliente,
        citasDelDia,
        citasPorOrigen
      };

      setData(datosDashboard);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar los datos. Intente nuevamente."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWorkshopData = async (dealershipId: string) => {
    try {
      const utilization = await calculateWorkshopUtilization(dealershipId, supabase);
      setWorkshopUtilization(utilization);
    } catch (error) {
      console.error('Error al cargar datos de ocupación:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar los datos de ocupación del taller."
      });
    }
  };

  const filtrarCitas = (citas: CitaSupabase[] | undefined) => {
    if (!citas) return []
    
    switch (tabActivo) {
      case "pendientes":
        return citas.filter(cita => cita.status === "pending")
      case "enCurso":
        return citas.filter(cita => cita.status === "in_progress")
      case "finalizadas":
        return citas.filter(cita => cita.status === "completed")
      case "canceladas":
        return citas.filter(cita => cita.status === "cancelled")
      default:
        return citas
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">Pendiente</Badge>
      case "in_progress":
        return <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">En curso</Badge>
      case "completed":
        return <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">Finalizada</Badge>
      case "cancelled":
        return <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">Cancelada</Badge>
      default:
        return <Badge variant="outline">Desconocido</Badge>
    }
  }

  const getActionButton = (cita: CitaSupabase) => {
    const handleClick = () => {
      // Redirigir a la vista de citas con el filtro correspondiente
      const filtro = cita.status === 'pending' ? 'pending' :
                    cita.status === 'in_progress' ? 'in_progress' :
                    cita.status === 'completed' ? 'completed' :
                    cita.status === 'cancelled' ? 'cancelled' : null;
      
      router.push(`/backoffice/citas/calendario?token=${token}${filtro ? `&estado=${filtro}` : ''}`);
    };

    // Color y estilo según el estado
    const buttonStyle = {
      pending: "text-blue-600 border-blue-200 hover:bg-blue-50",
      in_progress: "text-amber-600 border-amber-200 hover:bg-amber-50",
      completed: "text-green-600 border-green-200 hover:bg-green-50",
      cancelled: "text-red-600 border-red-200 hover:bg-red-50"
    }[cita.status] || "text-muted-foreground";

    return (
      <Button 
        variant="outline" 
        size="sm" 
        className={`${buttonStyle}`}
        onClick={handleClick}
      >
        Ver detalles
      </Button>
    );
  }

  // Función para redirigir a la página de creación de citas
  const navegarANuevaCita = () => {
    // Agregar el token como query param si existe
    const queryParams = token ? `?token=${token}` : '';
    router.push(`/backoffice/citas/nueva${queryParams}`);
  }

  if (!data) return <div>Cargando...</div>

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2 border-b pb-4">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex items-center gap-4">
          <Button className="gap-2" onClick={navegarANuevaCita}>
            <Plus className="h-4 w-4" />
            Nueva Cita
          </Button>
        </div>
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
        {/* Estado de Citas */}
        <Card className="shadow-sm">
          <div className="p-6">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="tracking-tight text-sm font-medium text-muted-foreground">Estado de Citas</h3>
              <div className="rounded-md bg-green-100 p-1">
                <CalendarLucideIcon className="h-4 w-4 text-green-600" />
              </div>
            </div>
            
            <div className="grid grid-cols-4 gap-2 mt-2">
              <div className="flex flex-col items-center">
                <div className="bg-gray-200 rounded-full h-10 w-10 flex items-center justify-center mb-2">
                  <span className="text-sm font-bold text-gray-700">{data.estadoCitas.pendientes}</span>
                </div>
                <p className="text-xs text-muted-foreground">Pendientes</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="bg-blue-100 rounded-full h-10 w-10 flex items-center justify-center mb-2">
                  <span className="text-sm font-bold text-blue-600">{data.estadoCitas.confirmadas}</span>
                </div>
                <p className="text-xs text-muted-foreground">Confirmadas</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="bg-amber-100 rounded-full h-10 w-10 flex items-center justify-center mb-2">
                  <span className="text-sm font-bold text-amber-600">{data.estadoCitas.enCurso}</span>
                </div>
                <p className="text-xs text-muted-foreground">En Curso</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="bg-green-100 rounded-full h-10 w-10 flex items-center justify-center mb-2">
                  <span className="text-sm font-bold text-green-600">{data.estadoCitas.finalizadas}</span>
                </div>
                <p className="text-xs text-muted-foreground">Finalizadas</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Satisfacción del Cliente */}
        <Card className="shadow-sm">
          <div className="p-6">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="tracking-tight text-sm font-medium text-muted-foreground">Satisfacción del Cliente</h3>
              <div className={`rounded-md p-1 flex items-center gap-1 ${data.satisfaccionCliente.tendencia > 0 ? 'bg-green-100' : data.satisfaccionCliente.tendencia < 0 ? 'bg-red-100' : 'bg-gray-100'}`}>
                <span className={`text-xs font-medium ${data.satisfaccionCliente.tendencia > 0 ? 'text-green-600' : data.satisfaccionCliente.tendencia < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                  {data.satisfaccionCliente.tendencia > 0 ? '+' : ''}{data.satisfaccionCliente.tendencia}%
                </span>
                {data.satisfaccionCliente.tendencia > 0 ? 
                  <ArrowUpIcon className="h-4 w-4 text-green-600" /> : 
                  data.satisfaccionCliente.tendencia < 0 ?
                  <ArrowDownIcon className="h-4 w-4 text-red-600" /> :
                  null
                }
              </div>
            </div>
            
            <div className="text-3xl font-bold">{data.satisfaccionCliente.nps}</div>
            <p className="text-xs text-muted-foreground mb-1">NPS</p>
            
            <Progress 
              value={data.satisfaccionCliente.nps} 
              className="h-2 mt-2 mb-2"
            >
              <div 
                className={`h-full w-full flex-1 transition-all ${
                  data.satisfaccionCliente.nps >= 70 ? "bg-green-500" : 
                  (data.satisfaccionCliente.nps >= 50 ? "bg-amber-500" : "bg-red-500")
                }`} 
                style={{ transform: `translateX(-${100 - data.satisfaccionCliente.nps}%)` }} 
              />
            </Progress>
            
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0</span>
              <span>50</span>
              <span>100</span>
            </div>
            
            <div className="mt-3">
              {/* Línea de tendencia eliminada por solicitud */}
            </div>
          </div>
        </Card>

        {/* Ocupación del Taller */}
        <Card className="shadow-sm">
          <div className="p-6">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="tracking-tight text-sm font-medium text-muted-foreground">Ocupación del Taller</h3>
              <div className="rounded-md bg-gray-100 p-1">
                <Settings className="h-4 w-4 text-gray-600" />
              </div>
            </div>
            <div className={`text-2xl font-bold ${
              workshopUtilization?.status === 'optimal' ? 'text-green-600' :
              workshopUtilization?.status === 'overloaded' ? 'text-red-600' :
              workshopUtilization?.status === 'moderate' ? 'text-amber-600' : 'text-blue-600'
            }`}>
              {workshopUtilization?.utilizationRate.toFixed(1) || 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {workshopUtilization?.status === 'optimal' && 'Funcionamiento óptimo'}
              {workshopUtilization?.status === 'overloaded' && 'Sobrecargado'}
              {workshopUtilization?.status === 'moderate' && 'Utilización moderada'}
              {workshopUtilization?.status === 'low' && 'Baja utilización'}
            </p>
          </div>
        </Card>
      </div>

      {/* Gráfico de Tendencia de Citas */}
      <AppointmentTrendChart />

      {/* Gráfico de Origen de Citas */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Citas por Origen - {format(new Date(), 'MMMM yyyy', { locale: es })}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center justify-center">
              <DonutChart
                data={Object.entries(data.citasPorOrigen).map(([origen, cantidad]) => ({
                  id: origen,
                  label: getOrigenLabel(origen),
                  value: cantidad,
                  color: ''
                }))}
                total={Object.entries(data.citasPorOrigen)
                  .filter(([origen]) => origen === 'manual' || origen === 'agenteai')
                  .reduce((a, [_, b]) => a + b, 0)}
                centerLabel="Total Citas"
              />
            </div>
            <div className="space-y-4">
              {Object.entries(data.citasPorOrigen)
                .filter(([origen]) => origen === 'manual' || origen === 'agenteai')
                .map(([origen, cantidad]) => (
                  <div key={origen} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-full ${getOrigenColor(origen)}`}>
                        {getOrigenIcon(origen)}
                      </div>
                      <span className="text-sm font-medium">{getOrigenLabel(origen)}</span>
                    </div>
                    <div className="text-sm font-medium">{cantidad}</div>
                  </div>
                ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Citas del Día */}
      <div>
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <CardTitle>
                  {fechaSeleccionada === fechaHoy 
                    ? "Citas del Día" 
                    : "Citas"}
                </CardTitle>
                <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className={`gap-2 font-normal ${
                        fechaSeleccionada === fechaHoy
                          ? "text-muted-foreground"
                          : "text-blue-600 border-blue-200 hover:bg-blue-50"
                      }`}
                    >
                      <CalendarIcon className="h-4 w-4" />
                      {fechaSeleccionada === fechaHoy
                        ? "Hoy"
                        : format(new Date(`${fechaSeleccionada}T12:00:00`), "d 'de' MMMM 'de' yyyy", { locale: es })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={parse(fechaSeleccionada, 'yyyy-MM-dd', new Date())}
                      onSelect={(date) => {
                        if (date) {
                          const newDate = format(date, 'yyyy-MM-dd');
                          console.log('Seleccionando nueva fecha:', newDate);
                          setFechaSeleccionada(newDate);
                          setDatePickerOpen(false);
                        }
                      }}
                      initialFocus
                      footer={
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full text-center"
                          onClick={() => {
                            console.log('Volviendo a fecha de hoy:', fechaHoy);
                            setFechaSeleccionada(fechaHoy);
                            setDatePickerOpen(false);
                          }}
                        >
                          Ir a hoy
                        </Button>
                      }
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="gap-1 text-muted-foreground font-normal"
                onClick={() => router.push(`/backoffice/citas/calendario?token=${token}`)}
              >
                Ver todas <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Tabs value={tabActivo} onValueChange={setTabActivo} className="mt-2">
              <TabsList className="grid grid-cols-5 w-full max-w-md">
                <TabsTrigger value="todas">Todas</TabsTrigger>
                <TabsTrigger value="pendientes">Pendientes</TabsTrigger>
                <TabsTrigger value="enCurso">En Curso</TabsTrigger>
                <TabsTrigger value="finalizadas">Finalizadas</TabsTrigger>
                <TabsTrigger value="canceladas">Canceladas</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hora</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Vehículo</TableHead>
                  <TableHead>Servicio</TableHead>
                  <TableHead>Duración</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtrarCitas(data.citasDelDia).length > 0 ? (
                  filtrarCitas(data.citasDelDia).slice(0, 7).map((cita) => (
                    <TableRow key={cita.id_uuid}>
                      <TableCell className="font-medium">
                        {format(new Date(cita.fecha_hora), 'HH:mm', { locale: es })}
                      </TableCell>
                      <TableCell>{cita.clientes?.nombre || 'Sin cliente'}</TableCell>
                      <TableCell>
                        {cita.vehiculos ? 
                          `${cita.vehiculos.marca} ${cita.vehiculos.modelo} (${cita.vehiculos.placa})` : 
                          'Sin vehículo'}
                      </TableCell>
                      <TableCell>{cita.servicios?.nombre || 'Sin servicio'}</TableCell>
                      <TableCell>{cita.duracion || 60} min</TableCell>
                      <TableCell>{getStatusBadge(cita.status)}</TableCell>
                      <TableCell className="text-right">
                        {getActionButton(cita)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <CalendarIcon className="h-8 w-8 text-muted-foreground opacity-30" />
                        <p className="text-muted-foreground">No hay citas {tabActivo !== "todas" ? `${tabActivo}` : ""} para hoy</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 