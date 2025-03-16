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
  id: string            // Cambiado de id_uuid
  names: string         // Cambiado de nombre
}

interface Servicio {
  id_uuid: string
  service_name: string
}

interface CitaDB {
  id: bigint                  // Cambiado de id_uuid a id
  created_at: string
  is_booked: boolean | null
  appointment_date: string | null  // Cambiado de fecha_hora
  appointment_time: string | null  // Añadido
  client_id: string | null
  vehicle_id: string | null
  service_id: string | null
  dealership_id: string | null
  status: string | null        // Cambiado de estado
}

interface Cita {
  id: bigint                   // Cambiado de id_uuid a id
  created_at: string
  is_booked: boolean | null
  appointment_date: string | null  // Cambiado de fecha_hora
  appointment_time: string | null  // Añadido
  client_id: string | null
  vehicle_id: string | null
  service_id: string | null
  dealership_id: string | null
  status: string | null         // Cambiado de estado
  client: {
    id: string
    names: string
  } | null
  services: {
    id_uuid: string
    service_name: string
  } | null
  vehicles: {
    id_uuid: string
    make: string
    model: string
    license_plate: string | null
    client_id: string
  } | null
}

// Crear una función auxiliar para formatear la fecha correctamente
const formatearFecha = (fechaStr: string) => {
  // Parseamos la fecha directamente desde YYYY-MM-DD sin ajuste de zona horaria
  const [year, month, day] = fechaStr.split('-').map(num => parseInt(num, 10));
  
  // Crear fecha a mediodía para evitar problemas de zona horaria
  const fecha = new Date(year, month-1, day, 12, 0, 0);
  
  // Formatear la fecha en español (día/mes/año)
  return fecha.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC'  // Usar UTC para evitar ajustes de zona horaria
  });
};

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
        .from('appointment')
        .select(`
          id,
          created_at,
          is_booked,
          appointment_date,
          appointment_time,
          client_id,
          vehicle_id,
          service_id,
          dealership_id,
          status,
          client!appointment_client_id_fkey (
            id,
            names
          ),
          services!appointment_service_id_fkey (
            id_uuid,
            service_name
          ),
          vehicles!appointment_vehicle_id_fkey (
            id_uuid,
            make,
            model,
            license_plate,
            client_id
          )
        `)
        .order('appointment_date', { ascending: true })

      if (error) throw error;
      console.log("Citas cargadas:", citasData);
      setCitas(citasData as unknown as Cita[]);
    } catch (error) {
      console.error("Error cargando citas:", error);
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
                <TableRow key={cita.id.toString()}>
                  <TableCell>{cita.client?.names}</TableCell>
                  <TableCell>{cita.services?.service_name}</TableCell>
                  <TableCell>{`${cita.vehicles?.make} ${cita.vehicles?.model} (${cita.vehicles?.license_plate || 'Sin placa'})`}</TableCell>
                  <TableCell>
                    {cita.appointment_date && cita.appointment_time ? 
                      `${formatearFecha(cita.appointment_date)} ${cita.appointment_time}` : 
                      'No especificada'}
                  </TableCell>
                  <TableCell>{cita.status}</TableCell>
                  <TableCell>-</TableCell>
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
