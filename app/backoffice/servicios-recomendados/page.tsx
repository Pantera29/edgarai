"use client"

import { useState, useEffect } from "react"
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
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

interface RecommendedService {
  id: string
  vehicle_id: string
  service_id: string
  recommended_date: string
  status: 'pending' | 'scheduled' | 'completed' | 'cancelled'
  notes: string
  created_at: string
  vehicle: {
    id_uuid: string
    make: string
    model: string
    license_plate: string | null
    client_id: string
    client: {
      id: string
      names: string
    } | null
  } | null
  service: {
    id_uuid: string
    service_name: string
    duration_minutes: number
  } | null
}

function ServiciosRecomendadosContent() {
  const [token, setToken] = useState<string>("");
  const [recommendedServices, setRecommendedServices] = useState<RecommendedService[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("all");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenValue = params.get("token");
    if (tokenValue) {
      setToken(tokenValue);
      const verifiedDataToken = verifyToken(tokenValue);
      
      if (!verifiedDataToken) {
        router.push("/login");
      }
    }
  }, [router]);

  const loadRecommendedServices = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('recommended_services')
        .select(`
          *,
          vehicle:vehicle_id (
            id_uuid,
            make,
            model,
            license_plate,
            client_id,
            client:client_id (
              id,
              names
            )
          ),
          service:service_id (
            id_uuid,
            service_name,
            duration_minutes
          )
        `)
        .order('recommended_date', { ascending: false });

      if (error) throw error;
      setRecommendedServices(data || []);
    } catch (error) {
      console.error("Error cargando servicios recomendados:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar los servicios recomendados"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecommendedServices();
  }, []);

  const filteredServices = recommendedServices.filter(service => {
    if (activeTab === "all") return true;
    return service.status === activeTab;
  });

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'scheduled': return 'default';
      case 'completed': return 'success';
      case 'cancelled': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'scheduled': return 'Agendado';
      case 'completed': return 'Completado';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  return (
    <div className="min-h-screen">
      <div className="space-y-8">
        <div className="grid gap-4 md:grid-cols-5">
          <h1 className="text-3xl font-bold tracking-tight col-span-5">Servicios Recomendados</h1>
        </div>

        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="pending">Pendientes</TabsTrigger>
            <TabsTrigger value="scheduled">Agendados</TabsTrigger>
            <TabsTrigger value="completed">Completados</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelados</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-lg font-medium">Lista de Servicios Recomendados</h2>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Vehículo</TableHead>
                <TableHead>Servicio</TableHead>
                <TableHead>Fecha Recomendada</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Notas</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <div className="flex justify-center py-4">
                      <div className="animate-spin h-6 w-6 border-2 border-primary rounded-full border-t-transparent"></div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredServices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4">
                    No hay servicios recomendados para mostrar
                  </TableCell>
                </TableRow>
              ) : (
                filteredServices.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell>{service.vehicle?.client?.names || 'Cliente no disponible'}</TableCell>
                    <TableCell>
                      {service.vehicle 
                        ? `${service.vehicle.make} ${service.vehicle.model} (${service.vehicle.license_plate || 'Sin placa'})` 
                        : 'Vehículo no disponible'}
                    </TableCell>
                    <TableCell>{service.service?.service_name || 'Servicio no disponible'}</TableCell>
                    <TableCell>
                      {service.recommended_date 
                        ? format(new Date(service.recommended_date), 'PP', { locale: es }) 
                        : 'Fecha no disponible'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(service.status)}>
                        {getStatusText(service.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>{service.notes || '-'}</TableCell>
                    <TableCell>
                      {service.status === 'pending' && (
                        <Link href={`/backoffice/citas/nueva?token=${token}&recommended_service_id=${service.id}`}>
                          <Button size="sm" variant="outline">Agendar</Button>
                        </Link>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <Toaster />
      </div>
    </div>
  );
}

export default function ServiciosRecomendadosPage() {
  return (
    <div className="flex-1 p-8">
      <ServiciosRecomendadosContent />
    </div>
  );
} 