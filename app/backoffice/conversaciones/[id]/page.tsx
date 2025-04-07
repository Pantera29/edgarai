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
import { ArrowLeft, RefreshCcw, Phone, MessageSquare, FileText, Clock, Calendar, CreditCard, ChevronDown, ChevronUp } from "lucide-react";
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
  const [expandedSummary, setExpandedSummary] = useState(false);

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

  const getChannelBadge = (channel?: string) => {
    switch (channel) {
      case 'phone':
        return (
          <div className="flex items-center">
            <Phone className="h-4 w-4 mr-1" />
            <span>Llamada telefónica</span>
          </div>
        );
      case 'chat':
      default:
        return (
          <div className="flex items-center">
            <MessageSquare className="h-4 w-4 mr-1" />
            <span>WhatsApp</span>
          </div>
        );
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "Desconocida";
    
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Función para extraer información de citas y costos del resumen
  const extractInfoFromSummary = (summary?: string) => {
    if (!summary) return { appointment: null, cost: null, date: null };
    
    // Expresión regular mejorada para buscar fechas y horas en diferentes formatos
    const appointmentRegex = /(cita|turno|agendad[ao]|programad[ao]|ofreci[óo]|confirm[óo])[\s\w]*(para el|el|para|este|próximo)?[\s\w]*(lunes|martes|miércoles|miercoles|jueves|viernes|sábado|sabado|domingo)?[\s\w]*(\d{1,2})[\s]*(de|del)?[\s]*(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)[\s\w]*(a las|alas|a la|para las)?[\s]*(\d{1,2})[:\.]?(\d{2})[\s]*(am|pm|AM|PM|hrs|horas)?/i;
    
    // Expresión regular alternativa para capturar solo fechas sin hora específica
    const dateRegex = /(lunes|martes|miércoles|miercoles|jueves|viernes|sábado|sabado|domingo)[\s\w]*(\d{1,2})[\s]*(de|del)?[\s]*(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/i;
    
    // Expresión regular para buscar cantidades de dinero
    const costRegex = /\$\s*(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)(?:\s*(?:pesos|mxn|dólares|usd))?/i;
    
    // Intentar encontrar una cita con la expresión principal
    let appointmentMatch = summary.match(appointmentRegex);
    
    // Si no encuentra con la primera expresión, intentar con la segunda
    if (!appointmentMatch) {
      const dateMatch = summary.match(dateRegex);
      if (dateMatch) {
        appointmentMatch = dateMatch;
      }
    }
    
    const costMatch = summary.match(costRegex);
    
    // Extraer la fecha completa si existe
    let dateInfo = null;
    if (appointmentMatch) {
      // Intentar extraer una oración completa que contenga la fecha
      const sentenceWithDate = extractSentenceWithMatch(summary, appointmentMatch[0]);
      dateInfo = sentenceWithDate || appointmentMatch[0];
    }
    
    return {
      appointment: appointmentMatch ? appointmentMatch[0] : null,
      cost: costMatch ? costMatch[0] : null,
      date: dateInfo
    };
  };

  // Función para extraer la oración completa que contiene una coincidencia
  const extractSentenceWithMatch = (text: string, match: string) => {
    if (!text || !match) return null;
    
    // Dividir el texto en oraciones (usando puntos seguidos de espacio como separador)
    const sentences = text.split(/\.\s+/);
    
    // Encontrar la oración que contiene la coincidencia
    for (const sentence of sentences) {
      if (sentence.includes(match)) {
        return sentence.trim() + '.';
      }
    }
    
    return null;
  };

  // Función para calcular la duración total de la llamada
  const calculateCallDuration = (startedAt?: string, endedAt?: string) => {
    if (!startedAt || !endedAt) return null;
    
    try {
      const start = new Date(startedAt);
      const end = new Date(endedAt);
      const durationMs = end.getTime() - start.getTime();
      
      // Convertir a minutos y segundos
      const minutes = Math.floor(durationMs / 60000);
      const seconds = Math.floor((durationMs % 60000) / 1000);
      
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    } catch (error) {
      console.error("Error calculando duración:", error);
      return null;
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
            </>
          )}

          <div className="mb-4">
            <p className="text-sm text-muted-foreground mb-1">Canal</p>
            <div>{getChannelBadge(conversacion.channel)}</div>
          </div>

          <Separator className="my-4" />
          
          <div>
            <p className="text-sm text-muted-foreground mb-2">Estadísticas</p>
            {conversacion.channel === 'phone' && (
              <div>
                <Card className="p-3 flex items-center justify-center">
                  <Clock className="h-4 w-4 mr-2 text-blue-500" />
                  <div className="text-center">
                    <p className="text-xl font-bold">
                      {conversacion.metadata?.callObject?.startedAt && conversacion.metadata?.callObject?.endedAt 
                        ? calculateCallDuration(conversacion.metadata.callObject.startedAt, conversacion.metadata.callObject.endedAt)
                        : formatDuration(conversacion.metadata?.call_duration)}
                    </p>
                    <p className="text-xs text-muted-foreground">Duración</p>
                  </div>
                </Card>
              </div>
            )}
            
            <div className="mt-3">
              <p className="text-sm text-muted-foreground mb-1">Fechas</p>
              <div className="space-y-1">
                {conversacion.channel === 'phone' && conversacion.metadata?.callObject ? (
                  <>
                    <p className="text-xs">
                      <span className="font-medium">Inicio:</span> {conversacion.metadata.callObject.startedAt ? 
                        formatDate(conversacion.metadata.callObject.startedAt) : 'No disponible'}
                    </p>
                    <p className="text-xs">
                      <span className="font-medium">Fin:</span> {conversacion.metadata.callObject.endedAt ? 
                        formatDate(conversacion.metadata.callObject.endedAt) : 'No disponible'}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-xs">
                      <span className="font-medium">Creada:</span> {formatDate(conversacion.created_at)}
                    </p>
                    <p className="text-xs">
                      <span className="font-medium">Última actividad:</span> {formatDate(conversacion.updated_at)}
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
          
          {conversacion.channel === 'phone' && conversacion.metadata && (
            <>
              <Separator className="my-4" />
              
              <div className="mb-4">
                <p className="text-sm text-muted-foreground mb-1">Detalles de la llamada</p>
                <div className="space-y-2 text-sm">
                  {conversacion.metadata.ended_reason && (
                    <p><span className="font-medium">Finalización:</span> {conversacion.metadata.ended_reason}</p>
                  )}
                  {conversacion.metadata.call_id && (
                    <p><span className="font-medium">ID:</span> {conversacion.metadata.call_id}</p>
                  )}
                </div>
              </div>
              
              {conversacion.metadata.recording_url && (
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground mb-2">Grabación</p>
                  <audio 
                    src={conversacion.metadata.recording_url} 
                    controls 
                    className="w-full" 
                  />
                </div>
              )}
            </>
          )}
          
          <div className="flex-grow"></div>
        </Card>

        {/* Visualizador de mensajes */}
        <Card className="p-0 md:col-span-2 overflow-hidden">
          <div className="bg-muted p-3 border-b">
            <h2 className="font-semibold">Mensajes</h2>
          </div>

          {conversacion.channel === 'phone' && conversacion.metadata?.summary && (
            <div className="p-4 border-b">
              <Card className="bg-blue-50 p-4 rounded-lg shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center text-blue-700 font-medium">
                    <FileText className="h-5 w-5 mr-2" />
                    <h3>Resumen de la llamada</h3>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setExpandedSummary(!expandedSummary)}
                    className="h-6 w-6 p-0"
                  >
                    {expandedSummary ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </div>
                
                <p className={`text-sm text-gray-700 mb-4 ${!expandedSummary ? "line-clamp-4" : ""}`}>
                  {conversacion.metadata.summary}
                </p>
                
                {/* Información extraída */}
                {(() => {
                  const { appointment, cost, date } = extractInfoFromSummary(conversacion.metadata.summary);
                  if (appointment || cost || date) {
                    return (
                      <div className="mt-3 space-y-2">
                        <Separator />
                        <h4 className="font-medium text-sm text-blue-700 mt-3">Información destacada:</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {date && (
                            <div className="flex items-start bg-white p-2 rounded border border-blue-100">
                              <Calendar className="h-4 w-4 text-blue-500 mr-2 mt-0.5" />
                              <div>
                                <p className="text-xs font-medium text-blue-700">Cita</p>
                                <p className="text-sm">{date}</p>
                              </div>
                            </div>
                          )}
                          
                          {cost && (
                            <div className="flex items-start bg-white p-2 rounded border border-blue-100">
                              <CreditCard className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                              <div>
                                <p className="text-xs font-medium text-green-700">Presupuesto</p>
                                <p className="text-sm">{cost}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}
              </Card>
            </div>
          )}

          <ChatViewer messages={mensajes} />
        </Card>
      </div>
    </div>
  );
} 