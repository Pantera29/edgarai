"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { verifyToken } from "../../../jwt/token";
import { ChatViewer } from "@/components/chat-viewer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, RefreshCcw } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Conversation {
  id: string;
  user_identifier: string;
  client_id: string | null;
  dealership_id: string | null;
  status: 'active' | 'closed' | 'pending';
  created_at: string;
  updated_at: string;
  client?: {
    id: string;
    names: string;
    email: string;
    phone_number: string;
  } | null;
}

interface Message {
  id: string;
  conversation_id: string;
  content: string;
  role: "user" | "assistant";
  created_at: string;
}

export default function ConversacionDetallePage() {
  const params = useParams();
  const router = useRouter();
  const [searchParams, setSearchParams] = useState<URLSearchParams | null>(null);
  const [token, setToken] = useState<string>("");
  const [dataToken, setDataToken] = useState<any>(null);
  
  const [conversacion, setConversacion] = useState<Conversation | null>(null);
  const [mensajes, setMensajes] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [nuevoEstado, setNuevoEstado] = useState<string>("");
  const [statsLoading, setStatsLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    user: 0,
    assistant: 0
  });

  const conversationId = params.id as string;

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setSearchParams(params);
    }
  }, []);

  useEffect(() => {
    if (searchParams) {
      const tokenValue = searchParams.get("token");
      if (tokenValue) {
        setToken(tokenValue);
        const verifiedDataToken = verifyToken(tokenValue);
        
        if (verifiedDataToken === null) {
          router.push("/login");
        }
        
        setDataToken(verifiedDataToken || {});
      }
    }
  }, [searchParams, router]);

  const cargarConversacion = async () => {
    setLoading(true);
    try {
      // Obtener detalles de la conversación
      const { data: conversacionData, error: conversacionError } = await supabase
        .from("chat_conversations")
        .select(`
          *,
          client(id, names, email, phone_number)
        `)
        .eq("id", conversationId)
        .single();

      if (conversacionError) throw conversacionError;
      
      // Verificar que la conversación pertenece a la agencia del usuario
      if (
        dataToken?.dealership_id && 
        conversacionData.dealership_id && 
        dataToken.dealership_id !== conversacionData.dealership_id
      ) {
        console.error("No tienes permiso para ver esta conversación");
        router.push(`/backoffice/conversaciones?token=${token}`);
        return;
      }

      setConversacion(conversacionData);
      
      if (conversacionData) {
        setNuevoEstado(conversacionData.status);
      }

      // Extraer mensajes del campo JSONB
      try {
        if (conversacionData && conversacionData.messages) {
          const mensajesArray = Array.isArray(conversacionData.messages) 
            ? conversacionData.messages 
            : [];
          
          // Transformar los mensajes al formato esperado
          const mensajesFormateados = mensajesArray.map((msg: any, index: number) => {
            console.log("Mensaje original:", msg);
            
            // Determinar el contenido del mensaje
            let contenido = "";
            if (typeof msg === 'object') {
              if (msg.content !== undefined) {
                contenido = msg.content;
              } else if (msg.text !== undefined) {
                contenido = msg.text;
              } else if (msg.message !== undefined) {
                contenido = msg.message;
              }
            } else if (typeof msg === 'string') {
              contenido = msg;
            }
            
            // Si no hay contenido, usar un placeholder
            if (!contenido || contenido.trim() === '') {
              contenido = "[Contenido no disponible]";
            }
            
            // Determinar el rol del mensaje
            let rol = "user";
            if (typeof msg === 'object' && msg.role) {
              rol = msg.role === "assistant" ? "assistant" : "user";
            } else if (typeof msg === 'object' && (msg.sender === "assistant" || msg.sender === "ai" || msg.sender === "bot")) {
              rol = "assistant";
            }
            
            const msgFormateado = {
              id: (typeof msg === 'object' && msg.id) ? msg.id : `msg-${index}`,
              conversation_id: conversationId,
              content: contenido,
              role: rol,
              created_at: (typeof msg === 'object' && msg.created_at) ? msg.created_at : 
                        (typeof msg === 'object' && msg.timestamp) ? msg.timestamp : 
                        new Date().toISOString()
            };
            
            console.log("Mensaje formateado:", msgFormateado);
            return msgFormateado;
          });
          
          setMensajes(mensajesFormateados);
          
          // Calcular estadísticas
          setStatsLoading(true);
          const totalMensajes = mensajesFormateados.length;
          const userMensajes = mensajesFormateados.filter((m: Message) => m.role === "user").length;
          const assistantMensajes = mensajesFormateados.filter((m: Message) => m.role === "assistant").length;
          
          setStats({
            total: totalMensajes,
            user: userMensajes,
            assistant: assistantMensajes
          });
        } else {
          setMensajes([]);
          setStats({
            total: 0,
            user: 0,
            assistant: 0
          });
        }
      } catch (error) {
        console.error("Error procesando mensajes:", error);
        setMensajes([]);
        setStats({
          total: 0,
          user: 0,
          assistant: 0
        });
      } finally {
        setStatsLoading(false);
      }
      
    } catch (error) {
      console.error("Error cargando conversación:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (dataToken && conversationId) {
      cargarConversacion();
    }
  }, [dataToken, conversationId]);

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd 'de' MMMM 'de' yyyy, HH:mm", {
        locale: es
      });
    } catch (error) {
      return "Fecha inválida";
    }
  };

  const handleStatusChange = async () => {
    try {
      const { error } = await supabase
        .from("chat_conversations")
        .update({ status: nuevoEstado })
        .eq("id", conversationId);

      if (error) throw error;
      
      setConversacion(prev => prev ? { ...prev, status: nuevoEstado as any } : null);
      setStatusDialogOpen(false);
    } catch (error) {
      console.error("Error actualizando estado:", error);
    }
  };

  const volverALista = () => {
    router.push(`/backoffice/conversaciones?token=${token}`);
  };

  const verPerfilCliente = (clientId: string) => {
    router.push(`/backoffice/clientes/${clientId}?token=${token}`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500">Activa</Badge>;
      case "closed":
        return <Badge className="bg-gray-500">Cerrada</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500">Pendiente</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Cargando conversación...</p>
      </div>
    );
  }

  if (!conversacion) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-lg">No se encontró la conversación solicitada</p>
        <Button onClick={volverALista} className="mt-4">
          Volver a la lista
        </Button>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 h-full">
      <div className="flex items-center justify-between mb-6">
        <Button variant="outline" onClick={volverALista} className="flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={cargarConversacion}
            className="flex items-center gap-1"
          >
            <RefreshCcw className="h-4 w-4" />
            Actualizar
          </Button>
          <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">Cambiar estado</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Cambiar estado de la conversación</DialogTitle>
                <DialogDescription>
                  Selecciona el nuevo estado para esta conversación.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Select value={nuevoEstado} onValueChange={setNuevoEstado}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Activa</SelectItem>
                    <SelectItem value="closed">Cerrada</SelectItem>
                    <SelectItem value="pending">Pendiente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleStatusChange}>
                  Guardar cambios
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-150px)]">
        {/* Panel de información */}
        <Card className="p-4 md:col-span-1 flex flex-col">
          <h2 className="text-xl font-bold mb-4">Información</h2>
          
          <div className="mb-4">
            <p className="text-sm text-muted-foreground mb-1">Identificador</p>
            <p className="font-medium">{conversacion.user_identifier}</p>
          </div>
          
          <div className="mb-4">
            <p className="text-sm text-muted-foreground mb-1">Estado</p>
            <div>{getStatusBadge(conversacion.status)}</div>
          </div>

          {conversacion.client && (
            <>
              <div className="mb-4">
                <p className="text-sm text-muted-foreground mb-1">Cliente</p>
                <p className="font-medium">{conversacion.client.names}</p>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-muted-foreground mb-1">Contacto</p>
                <p>{conversacion.client.phone_number}</p>
                {conversacion.client.email && <p>{conversacion.client.email}</p>}
              </div>
              
              <Button 
                variant="outline" 
                onClick={() => conversacion.client && verPerfilCliente(conversacion.client.id)}
                size="sm"
                className="mb-4 mt-2"
              >
                Ver perfil completo
              </Button>
            </>
          )}

          <Separator className="my-4" />
          
          <div className="mb-4">
            <p className="text-sm text-muted-foreground mb-1">Fechas</p>
            <div className="space-y-1">
              <p className="text-xs">
                <span className="font-medium">Creada:</span> {formatDate(conversacion.created_at)}
              </p>
              <p className="text-xs">
                <span className="font-medium">Última actividad:</span> {formatDate(conversacion.updated_at)}
              </p>
            </div>
          </div>
          
          <Separator className="my-4" />
          
          <div>
            <p className="text-sm text-muted-foreground mb-2">Estadísticas</p>
            <div className="grid grid-cols-3 gap-2">
              <Card className="p-3 text-center">
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </Card>
              <Card className="p-3 text-center">
                <p className="text-2xl font-bold">{stats.user}</p>
                <p className="text-xs text-muted-foreground">Usuario</p>
              </Card>
              <Card className="p-3 text-center">
                <p className="text-2xl font-bold">{stats.assistant}</p>
                <p className="text-xs text-muted-foreground">Asistente</p>
              </Card>
            </div>
          </div>
          
          <div className="flex-grow"></div>
        </Card>

        {/* Visualizador de mensajes */}
        <Card className="p-0 md:col-span-2 overflow-hidden">
          <div className="bg-muted p-3 border-b">
            <h2 className="font-semibold">Mensajes</h2>
          </div>
          <ChatViewer messages={mensajes} />
        </Card>
      </div>
    </div>
  );
} 