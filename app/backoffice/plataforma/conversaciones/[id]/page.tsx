"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { verifyToken } from "../../../../jwt/token";
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
import { ArrowLeft, RefreshCcw, Phone, MessageSquare, FileText, Clock, Calendar, CreditCard, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

// UUID de la agencia autorizada para plataforma
const PLATFORM_AGENCY_ID = '6b58f82d-baa6-44ce-9941-1a61975d20b5';

interface Conversation {
  id: string;
  user_identifier: string;
  client_id: string | null;
  dealership_id: string | null;
  dealership_name?: string;
  status: 'active' | 'closed' | 'pending';
  created_at: string;
  updated_at: string;
  channel?: string;
  metadata?: {
    call_id?: string;
    call_sid?: string;
    call_duration?: number;
    ended_reason?: string;
    recording_url?: string;
    summary?: string;
    transcript?: string;
    callObject?: {
      startedAt?: string;
      endedAt?: string;
    };
  };
  client?: {
    id: string;
    names: string;
    email: string;
    phone_number: string;
  } | null;
  // Campos adicionales para la versión actualizada de la tabla
  duration_seconds?: number;
  call_id?: string;
  ended_reason?: string;
  recording_url?: string;
  conversation_summary?: string;
  was_successful?: boolean;
  client_intent?: string;
  agent_name?: string;
  ai_model?: string;
  conversation_summary_translated?: string;
}

interface Message {
  id: string;
  conversation_id: string;
  content: string;
  role: "user" | "assistant";
  created_at: string;
}

export default function PlataformaConversacionDetallePage() {
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
  const [expandedSummary, setExpandedSummary] = useState(false);

  const conversationId = params.id as string;

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setSearchParams(params);
    }
  }, []);

  useEffect(() => {
    console.log('🔄 Verificando autenticación de plataforma...');
    if (searchParams) {
      const tokenValue = searchParams.get("token");
      console.log('🔍 Token encontrado:', !!tokenValue);
      
      if (tokenValue) {
        setToken(tokenValue);
        const verifiedDataToken = verifyToken(tokenValue);
        console.log('🔍 Token verificado:', !!verifiedDataToken);
        
        if (
          !verifiedDataToken ||
          typeof verifiedDataToken !== "object" ||
          Object.keys(verifiedDataToken).length === 0 ||
          !(verifiedDataToken as any).dealership_id
        ) {
          console.log('❌ Token inválido, redirigiendo a login');
          router.push("/login");
          return;
        }

        // Verificar que es la agencia autorizada para plataforma
        console.log('🔍 Verificando dealership_id:', verifiedDataToken.dealership_id);
        console.log('🔍 PLATFORM_AGENCY_ID:', PLATFORM_AGENCY_ID);
        
        if (verifiedDataToken.dealership_id !== PLATFORM_AGENCY_ID) {
          console.log('❌ No es la agencia autorizada, redirigiendo');
          router.push(`/backoffice?token=${tokenValue}`);
          return;
        }
        
        console.log('✅ Autenticación de plataforma exitosa');
        setDataToken(verifiedDataToken || {});
      } else {
        console.log('❌ No se encontró token en URL');
      }
    }
  }, [searchParams, router]);

  useEffect(() => {
    if (dataToken) {
      cargarConversacion();
    }
  }, [dataToken, conversationId]);

  const cargarConversacion = async () => {
    setLoading(true);
    try {
      console.log('🔄 Cargando conversación:', conversationId);
      
      // Obtener detalles de la conversación con información del dealership
      const { data: conversacionData, error: conversacionError } = await supabase
        .from("chat_conversations")
        .select(`
          *,
          client(id, names, email, phone_number),
          dealerships:dealership_id(name)
        `)
        .eq("id", conversationId)
        .single();

      if (conversacionError) {
        console.error('❌ Error cargando conversación:', conversacionError);
        throw conversacionError;
      }
      
      console.log('✅ Conversación cargada:', conversacionData);

      // Agregar el nombre del dealership a la conversación
      const conversacionConDealership = {
        ...conversacionData,
        dealership_name: conversacionData.dealerships?.name || 'Agencia desconocida'
      };

      setConversacion(conversacionConDealership);
      
      if (conversacionData) {
        setNuevoEstado(conversacionData.status);
      }

      // Extraer mensajes del campo JSONB
      try {
        if (conversacionData && conversacionData.messages) {
          const mensajesArray = Array.isArray(conversacionData.messages) 
            ? conversacionData.messages 
            : [];
          
          console.log("Array de mensajes original:", mensajesArray);
          
          // Transformar los mensajes al formato esperado
          const mensajesFormateados = mensajesArray.map((msg: any, index: number) => {
            console.log(`Procesando mensaje #${index}:`, msg);
            
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
            let rol = "user"; // Valor por defecto
            
            if (typeof msg === 'object') {
              if (msg.role !== undefined) {
                rol = msg.role;
              } else if (msg.sender !== undefined) {
                rol = msg.sender === 'user' ? 'user' : 'assistant';
              } else if (msg.from !== undefined) {
                rol = msg.from === 'user' ? 'user' : 'assistant';
              }
            }
            
            return {
              id: `msg-${index}`,
              conversation_id: conversationId,
              content: contenido,
              role: rol as "user" | "assistant",
              created_at: msg.timestamp || msg.created_at || new Date().toISOString()
            };
          });
          
          setMensajes(mensajesFormateados);
          
          // Calcular estadísticas
          const total = mensajesFormateados.length;
          const user = mensajesFormateados.filter(m => m.role === 'user').length;
          const assistant = mensajesFormateados.filter(m => m.role === 'assistant').length;
          
          setStats({ total, user, assistant });
        }
      } catch (error) {
        console.error("Error procesando mensajes:", error);
        setMensajes([]);
      }

    } catch (error) {
      console.error("Error cargando conversación:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: es });
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
    router.push(`/backoffice/plataforma/conversaciones?token=${token}`);
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

  const getChannelBadge = (channel?: string) => {
    switch (channel) {
      case "phone":
        return (
          <Badge className="bg-blue-500 flex items-center gap-1">
            <Phone className="h-3 w-3" />
            Llamada
          </Badge>
        );
      case "whatsapp":
        return (
          <Badge className="bg-green-500 flex items-center gap-1">
            <MessageSquare className="h-3 w-3" />
            WhatsApp
          </Badge>
        );
      default:
        return <Badge>{channel || "Desconocido"}</Badge>;
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "N/A";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const extractInfoFromSummary = (summary?: string) => {
    if (!summary) return { intent: "No disponible", outcome: "No disponible" };
    
    const intentMatch = summary.match(/intención[:\s]+([^.]+)/i);
    const outcomeMatch = summary.match(/resultado[:\s]+([^.]+)/i);
    
    return {
      intent: intentMatch ? intentMatch[1].trim() : "No especificado",
      outcome: outcomeMatch ? outcomeMatch[1].trim() : "No especificado"
    };
  };

  const extractSentenceWithMatch = (text: string, match: string) => {
    const sentences = text.split(/[.!?]+/);
    const sentence = sentences.find(s => 
      s.toLowerCase().includes(match.toLowerCase())
    );
    return sentence ? sentence.trim() + '.' : null;
  };

  const calculateCallDuration = (startedAt?: string, endedAt?: string) => {
    if (!startedAt || !endedAt) return null;
    
    const start = new Date(startedAt);
    const end = new Date(endedAt);
    const durationMs = end.getTime() - start.getTime();
    const durationSeconds = Math.floor(durationMs / 1000);
    
    return formatDuration(durationSeconds);
  };

  const getClientIntent = (intent?: string) => {
    if (!intent) return "No especificado";
    
    const intents: { [key: string]: string } = {
      "appointment_scheduling": "Agendar cita",
      "service_inquiry": "Consulta de servicio",
      "price_inquiry": "Consulta de precio",
      "general_inquiry": "Consulta general",
      "complaint": "Reclamo",
      "follow_up": "Seguimiento"
    };
    
    return intents[intent] || intent;
  };

  if (loading) {
    return (
      <div className="px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={volverALista}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <h1 className="text-3xl font-bold">Cargando conversación...</h1>
        </div>
        <div className="text-center py-10">
          <RefreshCcw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Cargando detalles de la conversación...</p>
        </div>
      </div>
    );
  }

  if (!conversacion) {
    return (
      <div className="px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={volverALista}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <h1 className="text-3xl font-bold">Conversación no encontrada</h1>
        </div>
        <Card className="p-6 text-center">
          <p className="text-muted-foreground">La conversación solicitada no existe o no tienes permisos para verla.</p>
        </Card>
      </div>
    );
  }

  const { intent, outcome } = extractInfoFromSummary(conversacion.conversation_summary);

  return (
    <div className="px-4 py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={volverALista}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Conversaciones
        </Button>
        <h1 className="text-3xl font-bold">Detalle de Conversación</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Información de la conversación */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Información General</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">ID:</span>
                <span className="font-mono text-sm">{conversacion.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Agencia:</span>
                <span>{conversacion.dealership_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Canal:</span>
                {getChannelBadge(conversacion.channel)}
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Estado:</span>
                {getStatusBadge(conversacion.status)}
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Creada:</span>
                <span>{formatDate(conversacion.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Última actividad:</span>
                <span>{formatDate(conversacion.updated_at)}</span>
              </div>
              {conversacion.duration_seconds && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duración:</span>
                  <span>{formatDuration(conversacion.duration_seconds)}</span>
                </div>
              )}
            </div>
          </Card>

          {/* Información del cliente */}
          {conversacion.client && (
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Cliente</h3>
              <div className="space-y-2">
                <div>
                  <span className="text-muted-foreground">Nombre:</span>
                  <p className="font-medium">{conversacion.client.names}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Teléfono:</span>
                  <p className="font-medium">{conversacion.client.phone_number}</p>
                </div>
                {conversacion.client.email && (
                  <div>
                    <span className="text-muted-foreground">Email:</span>
                    <p className="font-medium">{conversacion.client.email}</p>
                  </div>
                )}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => verPerfilCliente(conversacion.client!.id)}
                  className="w-full"
                >
                  Ver perfil completo
                </Button>
              </div>
            </Card>
          )}

          {/* Resumen de la conversación */}
          {conversacion.conversation_summary && (
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Resumen</h3>
              <div className="space-y-2">
                <div>
                  <span className="text-muted-foreground">Intención:</span>
                  <p className="font-medium">{intent}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Resultado:</span>
                  <p className="font-medium">{outcome}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Resumen completo:</span>
                  <div className="mt-2">
                    {expandedSummary ? (
                      <p className="text-sm">{conversacion.conversation_summary}</p>
                    ) : (
                      <p className="text-sm">
                        {conversacion.conversation_summary.length > 150
                          ? `${conversacion.conversation_summary.substring(0, 150)}...`
                          : conversacion.conversation_summary}
                      </p>
                    )}
                    {conversacion.conversation_summary.length > 150 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedSummary(!expandedSummary)}
                        className="mt-2"
                      >
                        {expandedSummary ? (
                          <>
                            <ChevronUp className="h-4 w-4 mr-1" />
                            Ver menos
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-4 w-4 mr-1" />
                            Ver más
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Estadísticas de mensajes */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Estadísticas</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total mensajes:</span>
                <span className="font-medium">{stats.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Del usuario:</span>
                <span className="font-medium">{stats.user}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Del asistente:</span>
                <span className="font-medium">{stats.assistant}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Chat viewer */}
        <div className="lg:col-span-2">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Conversación</h3>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={cargarConversacion}
                  disabled={loading}
                >
                  <RefreshCcw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Actualizar
                </Button>
                <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      Cambiar Estado
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Cambiar Estado de la Conversación</DialogTitle>
                      <DialogDescription>
                        Selecciona el nuevo estado para esta conversación.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
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
                        Guardar Cambios
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            <ChatViewer messages={mensajes} />
          </Card>
        </div>
      </div>
    </div>
  );
} 