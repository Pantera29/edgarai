"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
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
  status: string;
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
  proximasCitas: {
    id_uuid: string
    fecha_hora: string
    status: string
    cliente: {
      nombre: string
    }
    servicios: Servicio[]
  }[]
}

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
        .from('client')
        .select('*', { count: 'exact' })

      // Total de vehículos
      const { count: totalVehiculos } = await supabase
        .from('vehicles')
        .select('*', { count: 'exact' })

      // Citas pendientes
      const { count: citasPendientes } = await supabase
        .from('appointment')
        .select('*', { count: 'exact' })
        .eq('status', 'pendiente')

      // Citas de hoy
      const hoy = new Date().toISOString().split('T')[0]
      const { count: citasHoy } = await supabase
        .from('appointment')
        .select('*', { count: 'exact' })
        .gte('fecha_hora', hoy)
        .lt('fecha_hora', hoy + 'T23:59:59')

      // Obtener la fecha actual al inicio del día
      const hoyInicio = new Date()
      hoyInicio.setHours(0, 0, 0, 0)

      // Obtener fecha límite (4 días después)
      const fechaLimite = new Date(hoyInicio)
      fechaLimite.setDate(fechaLimite.getDate() + 4)

      const { data: proximasCitas } = await supabase
        .from('appointment')
        .select(`
          id_uuid,
          fecha_hora,
          status,
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
        status: cita.status,
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
      </div>
    </div>
  )
} 