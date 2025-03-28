"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import ClienteHistorial from "@/components/cliente-historial"
import { Breadcrumb } from "@/components/Breadcrumb"
import { ClienteVehiculos } from "@/components/cliente-vehiculos"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button" 
import { MessageSquare } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { getBaseUrl } from '@/lib/utils'

interface ClienteHistorialContentProps {
  clientId: string;
}

async function getClientHistory(clientId: string) {
  try {
    const supabase = createClientComponentClient();
    
    const { data, error } = await supabase
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

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error in getClientHistory:', error);
    return [];
  }
}

export default function ClienteHistorialContent({ clientId }: ClienteHistorialContentProps) {
  const [historial, setHistorial] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [conversaciones, setConversaciones] = useState<any[]>([]);
  const [loadingConversaciones, setLoadingConversaciones] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get('token') || '';

  useEffect(() => {
    async function loadHistory() {
      const data = await getClientHistory(clientId);
      setHistorial(data);
      setLoading(false);
    }
    loadHistory();
  }, [clientId]);

  useEffect(() => {
    async function loadConversaciones() {
      try {
        const supabase = createClientComponentClient();
        
        const { data, error } = await supabase
          .from('chat_conversations')
          .select('*')
          .eq('client_id', clientId)
          .order('updated_at', { ascending: false });

        if (error) throw error;
        setConversaciones(data || []);
      } catch (error) {
        console.error('Error cargando conversaciones:', error);
      } finally {
        setLoadingConversaciones(false);
      }
    }
    
    loadConversaciones();
  }, [clientId]);

  const breadcrumbItems = [
    { label: "Clientes", href: `${getBaseUrl()}/backoffice/clientes` },
    { label: "Historial de Servicios", href: `${getBaseUrl()}/backoffice/clientes/${clientId}/historial` }
  ];

  const verTodasLasConversaciones = () => {
    router.push(`/backoffice/conversaciones?token=${token}`);
  };

  const verDetalleConversacion = (conversacionId: string) => {
    router.push(`/backoffice/conversaciones/${conversacionId}?token=${token}`);
  };

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
          <TabsTrigger value="conversaciones">Conversaciones</TabsTrigger>
        </TabsList>
        <TabsContent value="historial">
          <ClienteHistorial historial={historial} />
        </TabsContent>
        <TabsContent value="vehiculos">
          <ClienteVehiculos clienteId={clientId} />
        </TabsContent>
        <TabsContent value="conversaciones">
          <div className="rounded-md border">
            <div className="p-4 flex justify-between items-center border-b">
              <h3 className="text-lg font-medium">Conversaciones del cliente</h3>
              <Button 
                variant="outline" 
                onClick={verTodasLasConversaciones}
                className="flex items-center gap-1"
              >
                <MessageSquare className="h-4 w-4" />
                Ver todas las conversaciones
              </Button>
            </div>
            
            <div className="p-4">
              {loadingConversaciones ? (
                <div className="animate-pulse bg-muted h-[100px] rounded-md" />
              ) : conversaciones.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  Este cliente no tiene conversaciones registradas
                </div>
              ) : (
                <div className="space-y-3">
                  {conversaciones.slice(0, 5).map((conv) => (
                    <div 
                      key={conv.id} 
                      className="p-3 border rounded-md hover:bg-muted/50 cursor-pointer"
                      onClick={() => verDetalleConversacion(conv.id)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{conv.user_identifier}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(conv.updated_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            conv.status === 'active' ? 'bg-green-100 text-green-800' :
                            conv.status === 'closed' ? 'bg-gray-100 text-gray-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {conv.status === 'active' ? 'Activa' :
                            conv.status === 'closed' ? 'Cerrada' : 'Pendiente'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {conversaciones.length > 5 && (
                    <div className="text-center">
                      <Button 
                        variant="link" 
                        onClick={verTodasLasConversaciones}
                      >
                        Ver todas ({conversaciones.length})
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 