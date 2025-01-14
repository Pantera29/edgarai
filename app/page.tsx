"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Badge } from "@/components/ui/badge"
import { TooltipProvider } from '@radix-ui/react-tooltip'

interface Servicio {
  nombre: string;
}

interface DashboardData {
  totalClientes: number
  totalVehiculos: number
  citasPendientes: number
  citasHoy: number
  serviciosPorEstado: {
    estado: string
    cantidad: number
  }[]
  ingresosMensuales: {
    mes: string
    ingresos: number
  }[]
  proximasCitas: {
    id_uuid: string
    fecha_hora: string
    estado: string
    cliente: {
      nombre: string
    }
    servicios: Servicio[]
  }[]
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042']

export function VoiceflowWidget() {
  useEffect(() => {
    const script = document.createElement("script")
    script.src = "https://cdn.voiceflow.com/widget/bundle.mjs"
    script.async = true
    script.onload = () => {
      const interval = setInterval(() => {
        if (window.voiceflow && window.voiceflow.chat) {
          clearInterval(interval)
          window.voiceflow.chat.load({
            verify: { projectID: "65a0b5e9f9c9d4000819c4e4" },
            url: "https://general-runtime.voiceflow.com",
            versionID: "production"
          })
        }
      }, 100)
    }
    document.body.appendChild(script)
  }, [])

  return null
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      // Total de clientes
      const { count: totalClientes } = await supabase
        .from('clientes')
        .select('*', { count: 'exact' })

      // Total de vehículos
      const { count: totalVehiculos } = await supabase
        .from('vehiculos')
        .select('*', { count: 'exact' })

      // Citas pendientes
      const { count: citasPendientes } = await supabase
        .from('citas')
        .select('*', { count: 'exact' })
        .eq('estado', 'pendiente')

      // Citas de hoy
      const hoy = new Date().toISOString().split('T')[0]
      const { count: citasHoy } = await supabase
        .from('citas')
        .select('*', { count: 'exact' })
        .gte('fecha_hora', hoy)
        .lt('fecha_hora', hoy + 'T23:59:59')

      // Servicios por estado
      const { data: serviciosPorEstado } = await supabase
        .from('citas')
        .select('estado, count')
        .select('estado')
        .then(({ data }) => {
          const conteo: { [key: string]: number } = {}
          data?.forEach(item => {
            conteo[item.estado] = (conteo[item.estado] || 0) + 1
          })
          return {
            data: Object.entries(conteo).map(([estado, cantidad]) => ({
              estado,
              cantidad
            }))
          }
        })

      // Ingresos mensuales (simulados con citas completadas)
      const { data: ingresosMensuales } = await supabase
        .from('citas')
        .select('fecha_hora, estado')
        .eq('estado', 'completada')
        .then(({ data }) => {
          const ingresos: { [key: string]: number } = {}
          data?.forEach(item => {
            const mes = new Date(item.fecha_hora).toLocaleString('es', { month: 'long' })
            // Simulamos un ingreso aleatorio entre 1000 y 5000 por servicio
            ingresos[mes] = (ingresos[mes] || 0) + Math.floor(Math.random() * 4000 + 1000)
          })
          return {
            data: Object.entries(ingresos).map(([mes, total]) => ({
              mes,
              ingresos: total
            }))
          }
        })

      // Obtener la fecha actual al inicio del día
      const hoyInicio = new Date()
      hoyInicio.setHours(0, 0, 0, 0)

      // Obtener fecha límite (4 días después)
      const fechaLimite = new Date(hoyInicio)
      fechaLimite.setDate(fechaLimite.getDate() + 4)

      const { data: proximasCitas } = await supabase
        .from('citas')
        .select(`
          id_uuid,
          fecha_hora,
          estado,
          clientes (
            nombre
          ),
          servicios (
            nombre
          )
        `)
        .gte('fecha_hora', hoyInicio.toISOString())
        .lt('fecha_hora', fechaLimite.toISOString())
        .order('fecha_hora')
        .limit(10)

      console.log('Citas obtenidas:', proximasCitas)

      const citasFormateadas = proximasCitas?.map(cita => ({
        id_uuid: cita.id_uuid,
        fecha_hora: cita.fecha_hora,
        estado: cita.estado,
        cliente: {
          nombre: cita.clientes?.nombre || 'Error al cargar cliente'
        },
        servicios: cita.servicios ? [{ nombre: cita.servicios.nombre }] : []
      })) || []

      console.log('Citas formateadas:', citasFormateadas)

      setData({
        totalClientes: totalClientes || 0,
        totalVehiculos: totalVehiculos || 0,
        citasPendientes: citasPendientes || 0,
        citasHoy: citasHoy || 0,
        serviciosPorEstado: serviciosPorEstado || [],
        ingresosMensuales: ingresosMensuales || [],
        proximasCitas: citasFormateadas
      })
    } catch (error) {
      console.error('Error cargando datos:', error)
    }
  }

  if (!data) return <div>Cargando...</div>

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Vista General</TabsTrigger>
          <TabsTrigger value="analytics">Analíticas</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Clientes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.totalClientes}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Vehículos Registrados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.totalVehiculos}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Citas Pendientes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.citasPendientes}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Citas Hoy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.citasHoy}</div>
              </CardContent>
            </Card>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Servicios por Estado</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data.serviciosPorEstado}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="cantidad"
                    >
                      {data.serviciosPorEstado.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Ingresos Mensuales</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data.ingresosMensuales}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="ingresos" stroke="#8884d8" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle>Próximas Citas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {data.proximasCitas.map((cita) => (
                  <div 
                    key={cita.id_uuid} 
                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/10 transition-colors"
                  >
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{cita.cliente.nombre}</p>
                        <Badge variant={
                          cita.estado === 'completada' ? 'success' :
                          cita.estado === 'cancelada' ? 'destructive' :
                          cita.estado === 'confirmada' ? 'default' :
                          'secondary'
                        }>
                          {cita.estado}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {cita.servicios[0]?.nombre || 'Sin servicio'}
                      </p>
                    </div>
                    <div className="flex flex-col items-end text-sm">
                      <p className="font-medium">
                        {format(new Date(cita.fecha_hora), "d 'de' MMMM", { locale: es })}
                      </p>
                      <p className="text-muted-foreground">
                        {format(new Date(cita.fecha_hora), "HH:mm", { locale: es })}
                      </p>
                    </div>
                  </div>
                ))}
                {data.proximasCitas.length === 0 && (
                  <div className="text-center py-6 text-muted-foreground">
                    No hay citas programadas para los próximos días
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

