"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { format } from 'date-fns'
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
  ChevronRight 
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
  const [dataToken, setDataToken] = useState<object>({})
  const [tabActivo, setTabActivo] = useState<string>("todas")
  
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

  const cargarDatos = async (dealershipIdFromToken?: string) => {
    try {
      const fechaActual = new Date()
      const fechaFormateada = format(fechaActual, 'yyyy-MM-dd')
      
      // Obtener estado de las citas del día
      let queryCitas = supabase
        .from('appointment')
        .select(`
          id_uuid,
          fecha_hora,
          status,
          duracion,
          client!appointment_client_id_fkey (
            nombre,
            dealership_id
          ),
          services (
            nombre
          ),
          vehicles (
            marca,
            modelo,
            placa
          )
        `)
        .gte('fecha_hora', `${fechaFormateada}T00:00:00`)
        .lt('fecha_hora', `${fechaFormateada}T23:59:59`)
      
      if (dealershipIdFromToken) {
        queryCitas = queryCitas.eq('client.dealership_id', dealershipIdFromToken)
      }
      
      const { data: citasData } = await queryCitas

      // Formatear correctamente los datos de las citas
      const citasFormateadas: CitaSupabase[] = (citasData || []).map(cita => ({
        id_uuid: cita.id_uuid,
        fecha_hora: cita.fecha_hora,
        status: cita.status,
        duracion: cita.duracion,
        clientes: {
          nombre: cita.client?.[0]?.nombre || '',
          dealership_id: cita.client?.[0]?.dealership_id
        },
        servicios: {
          nombre: cita.services?.[0]?.nombre || ''
        },
        vehiculos: cita.vehicles?.[0] ? {
          marca: cita.vehicles[0].marca || '',
          modelo: cita.vehicles[0].modelo || '',
          placa: cita.vehicles[0].placa || ''
        } : undefined
      }))

      // Contar citas por estado
      const pendientes = citasFormateadas.filter(c => c.status === 'pendiente').length || 0
      const enCurso = citasFormateadas.filter(c => c.status === 'en_curso').length || 0
      const finalizadas = citasFormateadas.filter(c => c.status === 'finalizada').length || 0

      // Obtener datos de satisfacción del cliente (NPS)
      const { data: npsData } = await supabase
        .from('nps_mensual')
        .select('valor, tendencia')
        .order('fecha', { ascending: false })
        .limit(1)
        .single()

      // Usar valor predeterminado de 0 para NPS si no hay datos
      const satisfaccionCliente = {
        nps: npsData?.valor || 0, // Valor predeterminado si no hay datos
        tendencia: npsData?.tendencia || 0  // Valor predeterminado si no hay datos
      }

      setData({
        estadoCitas: {
          pendientes,
          enCurso,
          finalizadas
        },
        satisfaccionCliente,
        citasDelDia: citasFormateadas
      })
    } catch (error) {
      console.error('Error cargando datos:', error)
    }
  }

  const filtrarCitas = (citas: CitaSupabase[] | undefined) => {
    if (!citas) return []
    
    switch (tabActivo) {
      case "pendientes":
        return citas.filter(cita => cita.status === "pendiente")
      case "enCurso":
        return citas.filter(cita => cita.status === "en_curso")
      case "finalizadas":
        return citas.filter(cita => cita.status === "finalizada")
      default:
        return citas
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pendiente":
        return <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">Pendiente</Badge>
      case "en_curso":
        return <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">En curso</Badge>
      case "finalizada":
        return <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">Finalizada</Badge>
      default:
        return <Badge variant="outline">Desconocido</Badge>
    }
  }

  const getActionButton = (cita: CitaSupabase) => {
    switch (cita.status) {
      case "pendiente":
        return (
          <Button variant="outline" size="sm" className="text-blue-600 border-blue-200 hover:bg-blue-50">
            Iniciar
          </Button>
        )
      case "en_curso":
        return (
          <Button variant="outline" size="sm" className="text-amber-600 border-amber-200 hover:bg-amber-50">
            Finalizar
          </Button>
        )
      case "finalizada":
        return (
          <Button variant="outline" size="sm" className="text-muted-foreground">
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
      
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-2">
        {/* Estado de Citas */}
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Estado de Citas
            </CardTitle>
            <CalendarLucideIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex justify-between pt-2">
              <div className="text-center">
                <div className="text-xl font-bold text-blue-600">{data.estadoCitas.pendientes}</div>
                <p className="text-xs text-muted-foreground">Pendientes</p>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-amber-600">{data.estadoCitas.enCurso}</div>
                <p className="text-xs text-muted-foreground">En Curso</p>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-green-600">{data.estadoCitas.finalizadas}</div>
                <p className="text-xs text-muted-foreground">Finalizadas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Satisfacción del Cliente */}
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Satisfacción del Cliente
            </CardTitle>
            <Smile className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline">
              <div className="text-2xl font-bold">{data.satisfaccionCliente.nps}</div>
              <span className="ml-1 text-sm text-muted-foreground">NPS</span>
            </div>
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
            <div className="flex justify-between text-xs">
              <span>0</span>
              <span>50</span>
              <span>100</span>
            </div>
            <p className="text-xs text-muted-foreground flex items-center mt-2">
              {data.satisfaccionCliente.tendencia > 0 ? (
                <><span className="text-green-500">↑</span> {data.satisfaccionCliente.tendencia} pts este mes</>
              ) : data.satisfaccionCliente.tendencia < 0 ? (
                <><span className="text-red-500">↓</span> {Math.abs(data.satisfaccionCliente.tendencia)} pts este mes</>
              ) : (
                <></>
              )}
            </p>
          </CardContent>
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
              <TabsList className="grid grid-cols-4 w-full max-w-md">
                <TabsTrigger value="todas">Todas</TabsTrigger>
                <TabsTrigger value="pendientes">Pendientes</TabsTrigger>
                <TabsTrigger value="enCurso">En Curso</TabsTrigger>
                <TabsTrigger value="finalizadas">Finalizadas</TabsTrigger>
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