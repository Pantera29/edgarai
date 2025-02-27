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
import { es, ro } from 'date-fns/locale'
import { Badge } from "@/components/ui/badge"
import { TooltipProvider } from '@radix-ui/react-tooltip'
import { verifyToken } from '../jwt/token'
import { useRouter } from "next/navigation";
import { NextResponse } from 'next/server';
interface Servicio {
  nombre: string;
}

interface Cliente {
  nombre: string;
}

interface CitaSupabase {
  id_uuid: string;
  fecha_hora: string;
  estado: string;
  clientes: Cliente;
  servicios: {
    nombre: string;
  };
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

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  

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
              
              // Si el token no es válido, redirigir al login
              if (verifiedDataToken === null) {
                router.push("/login");
              }
              setDataToken(verifiedDataToken || {}); // Actualiza el estado de dataToken
      
            }
          }
        }, [searchParams, router]); 
  
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
        `) as { data: CitaSupabase[] | null }

      const citasFormateadas = proximasCitas?.map(cita => ({
        id_uuid: cita.id_uuid,
        fecha_hora: cita.fecha_hora,
        estado: cita.estado,
        cliente: {
          nombre: cita.clientes.nombre || 'Error al cargar cliente'
        },
        servicios: cita.servicios ? [{ nombre: cita.servicios.nombre }] : []
      })) || []

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
      <div className="space-y-4">
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
      </div>
    </div>
  )
} 