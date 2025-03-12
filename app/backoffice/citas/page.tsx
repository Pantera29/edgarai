"use client"

import { useState, useEffect, Suspense } from "react"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { verifyToken } from "@/app/jwt/token"

// Mover esta definición al inicio, antes de las interfaces
type EstadoCita = 'pendiente' | 'en_proceso' | 'completada' | 'cancelada'

interface Cliente {
  id_uuid: string
  nombre: string
}

interface Servicio {
  id_uuid: string
  service_name: string
}

interface CitaDB {
  id_uuid: string
  cliente_id_uuid: string
  servicio_id_uuid: string
  vehiculo_id_uuid: string
  fecha_hora: string
  estado: EstadoCita
  notas: string
  created_at: string
}

interface Cita {
  id_uuid: string
  cliente_id_uuid: string
  servicio_id_uuid: string
  vehiculo_id_uuid: string
  fecha_hora: string
  estado: EstadoCita
  notas: string
  created_at: string
  clientes: {
    id_uuid: string
    nombre: string
  }
  services: {
    id_uuid: string
    service_name: string
  }
  vehiculos: {
    id_uuid: string
    marca: string
    modelo: string
    placa: string | null
    id_cliente_uuid: string
  }
}

function CitasPageContent() {
  const [token, setToken] = useState<string>("");
  const [citas, setCitas] = useState<Cita[]>([])
  const router = useRouter();
  const { toast } = useToast()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenValue = params.get("token"); // Obtiene el token de los query params
    if (tokenValue) {
      setToken(tokenValue); // Actualiza el estado con el token
      const verifiedDataToken = verifyToken(tokenValue);
      
      if (!verifiedDataToken) {
        router.push("/login"); // Redirigir si el token es inválido
      }
    }
  }, [router]);

  const cargarCitas = async () => {
    try {
      const { data: citasData, error } = await supabase
        .from('citas')
        .select(`
          id_uuid,
          cliente_id_uuid,
          servicio_id_uuid,
          vehiculo_id_uuid,
          fecha_hora,
          estado,
          notas,
          created_at,
          clientes!citas_cliente_id_uuid_fkey (
            id_uuid,
            nombre
          ),
          services!citas_servicio_id_uuid_fkey (
            id_uuid,
            service_name
          ),
          vehiculos!citas_vehiculo_id_uuid_fkey (
            id_uuid,
            marca,
            modelo,
            placa,
            id_cliente_uuid
          )
        `)
        .order('fecha_hora', { ascending: true })

      if (error) throw error;
      //setCitas(citasData as Cita[]); -> aca quedo rompmiendo
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar las citas"
      })
    }
  }

  useEffect(() => {
    cargarCitas();
  }, []);

  return (
    <div className="min-h-screen">
      <div className="space-y-8">
        <div className="grid gap-4 md:grid-cols-5">
          <h1 className="text-3xl font-bold tracking-tight col-span-4">Citas</h1>
          <div className="text-right">
            
            <Link href={`/backoffice/citas/nueva?token=${token}`}>
              <Button type="submit" className="relative" > Agendar Cita </Button>
            </Link>
          </div>
        </div>

        {/* Lista de Citas */}
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-lg font-medium">Lista de Citas</h2>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Servicio</TableHead>
                <TableHead>Vehículo</TableHead>
                <TableHead>Fecha y Hora</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Notas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {citas.map((cita) => (
                <TableRow key={cita.id_uuid}>
                  <TableCell>{cita.clientes?.nombre}</TableCell>
                  <TableCell>{cita.services?.service_name}</TableCell>
                  <TableCell>{`${cita.vehiculos?.marca} ${cita.vehiculos?.modelo} (${cita.vehiculos?.placa || 'Sin placa'})`}</TableCell>
                  <TableCell>{new Date(cita.fecha_hora).toLocaleString('es-ES')}</TableCell>
                  <TableCell>{cita.estado}</TableCell>
                  <TableCell>{cita.notas}</TableCell>
                </TableRow>
              ))}
              {citas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4">
                    No hay citas para mostrar
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <Toaster />
      </div>
    </div>
  )
}

export default function CitasPage() {
  return (
    <div className="flex-1 p-8">
      <Suspense fallback={<div className="animate-spin h-32 w-32"></div>}>
        <CitasPageContent />
      </Suspense>
    </div>
  )
}
