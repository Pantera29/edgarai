"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { format, subMonths } from 'date-fns'
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
  Users
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

interface DashboardData {
  estadoCitas: {
    pendientes: number;
    enCurso: number;
    finalizadas: number;
  };
  satisfaccionCliente: {
    nps: number;
    tendencia: number;
  };
  citasDelDia: CitaSupabase[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [searchParams, setSearchParams] = useState<URLSearchParams | null>(null)
  const [token, setToken] = useState<string>("")
  const [dataToken, setDataToken] = useState<{dealership_id?: string}>({})
  const [tabActivo, setTabActivo] = useState<string>("todas")
  const [isLoading, setIsLoading] = useState<boolean>(false)
  
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
        
        if (verifiedDataToken === null) {
          router.push("/login")
        }
        setDataToken(verifiedDataToken || {})

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
      // Obtener la fecha actual en formato YYYY-MM-DD
      const fechaActual = new Date().toISOString().split('T')[0];
      
      // 1. Obtener estado de citas (pendientes, en curso, finalizadas)
      const { data: estadoCitasData, error: estadoCitasError } = await supabase
        .from('appointment')
        .select(`
          status,
          client!inner (
            dealership_id
          )
        `)
        .eq('appointment_date', fechaActual)
        .eq('dealership_id', dealershipId || '')
        .eq('client.dealership_id', dealershipId || '');
      
      if (estadoCitasError) throw estadoCitasError;
      
      // Contar citas por estado
      const estadoCitas = {
        pendientes: estadoCitasData?.filter(cita => cita.status === 'pending').length || 0,
        enCurso: estadoCitasData?.filter(cita => cita.status === 'in_progress').length || 0,
        finalizadas: estadoCitasData?.filter(cita => cita.status === 'completed').length || 0
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
        .eq('appointment_date', fechaActual)
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
        citasDelDia
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

  const filtrarCitas = (citas: CitaSupabase[] | undefined) => {
    if (!citas) return []
    
    switch (tabActivo) {
      case "pendientes":
        return citas.filter(cita => cita.status === "pending")
      case "enCurso":
        return citas.filter(cita => cita.status === "in_progress")
      case "finalizadas":
        return citas.filter(cita => cita.status === "completed")
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
    switch (cita.status) {
      case "pending":
        return (
          <Button variant="outline" size="sm" className="text-blue-600 border-blue-200 hover:bg-blue-50">
            Iniciar
          </Button>
        )
      case "in_progress":
        return (
          <Button variant="outline" size="sm" className="text-amber-600 border-amber-200 hover:bg-amber-50">
            Finalizar
          </Button>
        )
      case "completed":
        return (
          <Button variant="outline" size="sm" className="text-muted-foreground">
            Ver detalles
          </Button>
        )
      case "cancelled":
        return (
          <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50">
            Ver detalles
          </Button>
        )
      default:
        return null
    }
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

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
        {/* Estado de Citas */}
        <Card className="shadow-sm">
          <div className="p-6">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="tracking-tight text-sm font-medium text-muted-foreground">Estado de Citas</h3>
              <div className="rounded-md bg-green-100 p-1">
                <CalendarLucideIcon className="h-4 w-4 text-green-600" />
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-2 mt-2">
              <div className="flex flex-col items-center">
                <div className="bg-blue-100 rounded-full h-10 w-10 flex items-center justify-center mb-2">
                  <span className="text-sm font-bold text-blue-600">{data.estadoCitas.pendientes}</span>
                </div>
                <p className="text-xs text-muted-foreground">Pendientes</p>
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
              <p className="text-xs text-muted-foreground">
                {data.satisfaccionCliente.tendencia > 0 ? 
                  <TrendingUp className="inline h-3 w-3 mr-1 text-green-500" /> : 
                  data.satisfaccionCliente.tendencia < 0 ?
                  <TrendingDown className="inline h-3 w-3 mr-1 text-red-500" /> :
                  <TrendingUp className="inline h-3 w-3 mr-1 text-gray-500" />
                }
                {data.satisfaccionCliente.tendencia > 0 ? 
                  'Mejorando' : 
                  data.satisfaccionCliente.tendencia < 0 ? 
                  'Disminuyendo' : 
                  'Estable'} este mes
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Citas del Día */}
      <div>
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle>Citas del Día</CardTitle>
              <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground font-normal">
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