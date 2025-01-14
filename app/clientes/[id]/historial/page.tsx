"use client"

import ClienteHistorial from "@/components/cliente-historial"
import { Breadcrumb } from "@/components/Breadcrumb"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useState, useEffect } from "react"
import { ClienteVehiculos } from "@/components/cliente-vehiculos"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

async function getClientHistory(clientId: string) {
  try {
    const supabase = createClientComponentClient();
    
    const { data: historial, error } = await supabase
      .from('citas')
      .select(`
        id_uuid,
        fecha_hora,
        estado,
        notas,
        servicios!citas_servicio_id_uuid_fkey (
          id_uuid,
          nombre
        )
      `)
      .eq('cliente_id_uuid', clientId)
      .order('fecha_hora', { ascending: false });

    if (error) {
      console.error('Error fetching client history:', error);
      return [];
    }

    console.log('Historial cargado:', historial); // Para debugging

    return historial || [];
  } catch (error) {
    console.error('Error in getClientHistory:', error);
    return [];
  }
}

interface PageProps {
  params: {
    id: string;
  };
}

export async function generateStaticParams() {
  const supabase = createClientComponentClient()
  
  const { data: clientes } = await supabase
    .from('clientes')
    .select('id_uuid')
  
  if (!clientes) return []
  
  return clientes.map((cliente: { id_uuid: string }) => ({
    id: cliente.id_uuid,
  }))
}

export default async function ClienteHistorialPage({ params }: PageProps) {
  const [historial, setHistorial] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHistory() {
      const data = await getClientHistory(params.id);
      setHistorial(data);
      setLoading(false);
    }
    loadHistory();
  }, [params.id]);

  const breadcrumbItems = [
    { label: "Clientes", href: "/clientes" },
    { label: "Historial de Servicios", href: `/clientes/${params.id}/historial` }
  ];

  if (loading) {
    return <div className="animate-pulse bg-muted h-[200px] rounded-md" />;
  }

  return (
    <div className="space-y-4">
      <Breadcrumb items={breadcrumbItems} />
      <Tabs defaultValue="historial">
        <TabsList>
          <TabsTrigger value="historial">Historial de Servicios</TabsTrigger>
          <TabsTrigger value="vehiculos">Vehículos</TabsTrigger>
        </TabsList>
        <TabsContent value="historial">
          <ClienteHistorial historial={historial} />
        </TabsContent>
        <TabsContent value="vehiculos">
          <ClienteVehiculos clienteId={params.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
} 