"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import ClienteHistorial from "@/components/cliente-historial"
import { Breadcrumb } from "@/components/Breadcrumb"
import { ClienteVehiculos } from "@/components/cliente-vehiculos"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface ClienteHistorialContentProps {
  clientId: string;
}

async function getClientHistory(clientId: string) {
  // ... tu función getClientHistory actual
}

export default function ClienteHistorialContent({ clientId }: ClienteHistorialContentProps) {
  const [historial, setHistorial] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHistory() {
      const data = await getClientHistory(clientId);
      setHistorial(data);
      setLoading(false);
    }
    loadHistory();
  }, [clientId]);

  const breadcrumbItems = [
    { label: "Clientes", href: "/clientes" },
    { label: "Historial de Servicios", href: `/clientes/${clientId}/historial` }
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
          <ClienteVehiculos clienteId={clientId} />
        </TabsContent>
      </Tabs>
    </div>
  );
} 