"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { ChatViewer } from "@/components/chat-viewer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { RefreshCcw, Phone, MessageSquare, FileText, Clock, Calendar, CreditCard, ChevronDown, ChevronUp, Send, ExternalLink, Loader2, RotateCcw } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { markConversationAsRead } from '@/utils/conversation-helpers';
import { ClienteContextPanel } from '@/components/cliente-context-panel';
import { ChatPlaceholder } from './ChatPlaceholder';

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
    agent_active?: boolean;
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
  role: "user" | "assistant" | "customer" | "ai_agent" | "dealership_worker";
  created_at: string;
  sender_user_id?: number; // ← NUEVO: ID del usuario que envió el mensaje
  sender_name?: string; // ← NUEVO: Nombre del usuario que envió el mensaje
}

interface ChatPanelProps {
  conversationId?: string;
  dataToken: any;
  onNavigateToClient?: (clientId: string) => void;
}

export function ChatPanel({ conversationId, dataToken, onNavigateToClient }: ChatPanelProps) {
  // ===== ESTADOS DE ACTUALIZACIÓN FRECUENTE (cada 20s) =====
  const [mensajes, setMensajes] = useState<Message[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    user: 0,
    assistant: 0
  });
  const [agentStatus, setAgentStatus] = useState<{
    agent_active: boolean;
    loading: boolean;
  }>({
    agent_active: true,
    loading: false
  });
  const [isAutoUpdating, setIsAutoUpdating] = useState(false);
  
  // ===== ESTADOS DE CARGA ÚNICA (solo al abrir conversación) =====
  const [conversacion, setConversacion] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [expandedSummary, setExpandedSummary] = useState(false);
  
  // Estados para envío de WhatsApp
  const [whatsappMessage, setWhatsappMessage] = useState("");
  const [sendingWhatsapp, setSendingWhatsapp] = useState(false);
  const [showWhatsappForm, setShowWhatsappForm] = useState(false);
  
  // Estado para reactivación de agentes
  const [reactivatingAgent, setReactivatingAgent] = useState(false);
  
  // Referencia para el contenedor de mensajes
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  
  // Referencia para preservar el foco del textarea
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Estado para preservar la posición del cursor
  const [cursorPosition, setCursorPosition] = useState<number | null>(null);
  
  // Estado para forzar la restauración del foco
  const [shouldRestoreFocus, setShouldRestoreFocus] = useState(false);
  
  const { toast } = useToast();
  
  // Handler para preservar la posición del cursor
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setWhatsappMessage(e.target.value);
    setCursorPosition(e.target.selectionStart);
  };
  
  // useEffect para restaurar el foco después de re-renders
  useEffect(() => {
    if (shouldRestoreFocus && textareaRef.current && cursorPosition !== null) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(cursorPosition, cursorPosition);
      setShouldRestoreFocus(false);
    }
  }, [shouldRestoreFocus, cursorPosition]);

  // Cargar datos estáticos cuando cambia el ID de conversación
  useEffect(() => {
    if (conversationId && dataToken) {
      cargarDatosEstaticos(true); // true = es la primera carga, marcar como leída
    } else {
      // Limpiar estado cuando no hay conversación seleccionada
      setConversacion(null);
      setMensajes([]);
      setWhatsappMessage(""); // Solo limpiar el mensaje cuando se cambia de conversación
      setCursorPosition(null); // Limpiar posición del cursor
      setShouldRestoreFocus(false); // Limpiar flag de restauración
    }
  }, [conversationId, dataToken]);

  // Actualización automática de datos dinámicos cada 20 segundos
  useEffect(() => {
    if (!conversationId || !dataToken) return;
    
    const interval = setInterval(async () => {
      try {
        // Solo actualizar si la conversación está abierta
        if (conversacion) {
          console.log('🔄 Actualizando datos dinámicos automáticamente...');
          setIsAutoUpdating(true);
          
          // Preservar si el textarea tenía foco antes de la actualización
          const hadFocus = textareaRef.current === document.activeElement;
          const currentCursorPos = textareaRef.current?.selectionStart || null;
          
          await actualizarDatosDinamicos(); // Solo actualizar mensajes y estadísticas
          
          // Marcar que se debe restaurar el foco después del re-render
          if (hadFocus && currentCursorPos !== null) {
            setCursorPosition(currentCursorPos);
            setShouldRestoreFocus(true);
          }
        }
      } catch (error) {
        console.error('Error en actualización automática de datos dinámicos:', error);
      } finally {
        setIsAutoUpdating(false);
      }
    }, 20000); // 20 segundos
    
    return () => clearInterval(interval);
  }, [conversationId, dataToken, conversacion]);

  // ===== FUNCIÓN PARA DATOS ESTÁTICOS (carga única) =====
  const cargarDatosEstaticos = async (markAsRead: boolean = false) => {
    if (!conversationId) return;
    
    setLoading(true);
    try {
      // Obtener detalles de la conversación (datos estáticos)
      const { data: conversacionData, error: conversacionError } = await supabase
        .from("chat_conversations")
        .select(`
          *,
          client(id, names, email, phone_number, agent_active)
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
        return;
      }
      
      setConversacion(conversacionData);
      
      // Debug: Log para verificar los datos del cliente
      console.log('🔍 [DEBUG] Datos estáticos de la conversación:', {
        hasClient: !!conversacionData?.client,
        clientData: conversacionData?.client,
        agentActive: conversacionData?.client?.agent_active,
        phoneNumber: conversacionData?.client?.phone_number
      });
      
      // Verificar estado del agente de IA si tenemos los datos necesarios
      if (conversacionData?.client?.phone_number && dataToken?.dealership_id) {
        verificarEstadoAgente(conversacionData.client.phone_number, dataToken.dealership_id);
      }

      // Cargar mensajes iniciales (solo en la primera carga)
      if (conversacionData && conversacionData.messages) {
        await actualizarDatosDinamicos();
      }
      
      // Marcar como leída solo cuando se abre la conversación por primera vez
      if (markAsRead) {
        markConversationAsRead(conversationId);
      }
      
    } catch (error) {
      console.error("Error cargando conversación:", error);
    } finally {
      setLoading(false);
    }
  };

  // ===== FUNCIÓN PARA DATOS DINÁMICOS (actualización frecuente) =====
  const actualizarDatosDinamicos = async () => {
    if (!conversationId) return;
    
    try {
      // Obtener solo los datos que cambian frecuentemente
      const { data: conversacionData, error: conversacionError } = await supabase
        .from("chat_conversations")
        .select(`
          messages,
          last_read_at,
          updated_at
        `)
        .eq("id", conversationId)
        .single();

      if (conversacionError) throw conversacionError;

      // Actualizar solo mensajes y estadísticas
      if (conversacionData && conversacionData.messages) {
        const mensajesArray = Array.isArray(conversacionData.messages) 
          ? conversacionData.messages 
          : [];
        
        // Transformar los mensajes al formato esperado
        const mensajesFormateados = mensajesArray.map((msg: any, index: number) => {
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
          
          if (!contenido || contenido.trim() === '') {
            contenido = "[Contenido no disponible]";
          }
          
          // Determinar el rol del mensaje
          let rol = "user";
          if (typeof msg === 'object') {
            if (msg.role) {
              const roleLower = msg.role.toLowerCase();
              if (["customer", "ai_agent", "dealership_worker"].includes(msg.role)) {
                rol = msg.role;
              } else if (["assistant", "bot", "system", "ai"].includes(roleLower)) {
                rol = "assistant";
              } else if (roleLower === "user") {
                rol = "user";
              } else {
                rol = msg.role;
              }
            } else if (msg.sender && ["assistant", "ai", "bot"].includes(msg.sender.toLowerCase())) {
              rol = "assistant";
            } else if (contenido.startsWith("AI:")) {
              rol = "assistant";
              contenido = contenido.substring(3).trim();
            }
          }
          
          // Determinar la fecha de creación
          let createdAt = new Date().toISOString();
          if (typeof msg === 'object') {
            if (msg.created_at) {
              createdAt = msg.created_at;
            } else if (msg.timestamp) {
              createdAt = msg.timestamp;
            } else if (msg.time) {
              createdAt = new Date(msg.time).toISOString();
            }
          }
          
          return {
            id: (typeof msg === 'object' && msg.id) ? msg.id : `msg-${index}`,
            conversation_id: conversationId,
            content: contenido,
            role: rol as "user" | "assistant" | "customer" | "ai_agent" | "dealership_worker",
            created_at: createdAt,
            sender_user_id: (typeof msg === 'object' && msg.sender_user_id) ? msg.sender_user_id : undefined,
            sender_name: (typeof msg === 'object' && msg.sender_name) ? msg.sender_name : undefined
          };
        });
        
        setMensajes(mensajesFormateados);
        
        // Calcular estadísticas
        const totalMensajes = mensajesFormateados.length;
        const userMensajes = mensajesFormateados.filter((m: Message) => 
          m.role === "user" || m.role === "customer"
        ).length;
        const assistantMensajes = mensajesFormateados.filter((m: Message) => 
          m.role === "assistant" || m.role === "ai_agent" || m.role === "dealership_worker"
        ).length;
        
        setStats({
          total: totalMensajes,
          user: userMensajes,
          assistant: assistantMensajes
        });
      }
      
      // Verificar estado del agente si es necesario
      if (conversacion?.client?.phone_number && dataToken?.dealership_id) {
        verificarEstadoAgente(conversacion.client.phone_number, dataToken.dealership_id);
      }
      
    } catch (error) {
      console.error("Error actualizando datos dinámicos:", error);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd 'de' MMMM 'de' yyyy, HH:mm", {
        locale: es
      });
    } catch (error) {
      return "Fecha inválida";
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
    const totalSeconds = Math.round(seconds); // Redondear a entero
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
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

  // Nuevas funciones para mostrar información de los campos adicionales
  const getClientIntent = (intent?: string) => {
    if (!intent) return "No disponible";
    
    const intents = {
      "agendar_cita": "Agendar cita",
      "ubicación": "Consultar ubicación",
      "horario": "Consultar horario",
      "servicio": "Información de servicio",
      "precio": "Consultar precio",
      "información": "Información general"
    };
    
    return intents[intent as keyof typeof intents] || intent;
  };

  // Función para verificar el estado del agente de IA
  const verificarEstadoAgente = async (phoneNumber: string, dealershipId: string) => {
    if (!phoneNumber || !dealershipId) return;
    
    setAgentStatus(prev => ({ ...prev, loading: true }));
    
    try {
      const response = await fetch(`/api/agent-control?phone_number=${phoneNumber}&dealership_id=${dealershipId}`);
      const result = await response.json();
      
      if (response.ok) {
        setAgentStatus({
          agent_active: result.agent_active,
          loading: false
        });
      } else {
        console.warn('⚠️ [UI] Error al verificar estado del agente:', result.error);
        setAgentStatus(prev => ({ ...prev, loading: false }));
      }
    } catch (error) {
      console.error('💥 [UI] Error verificando estado del agente:', error);
      setAgentStatus(prev => ({ ...prev, loading: false }));
    }
  };

  const reactivarAgente = async () => {
    if (!conversacion?.client?.phone_number || !dataToken?.dealership_id) {
      toast({
        title: "Error",
        description: "No se puede reactivar: faltan datos del cliente",
        variant: "destructive",
      });
      return;
    }

    console.log('🔄 Iniciando reactivación de agente para:', conversacion.client.names);
    
    setReactivatingAgent(true);

    try {
      const response = await fetch('/api/clients/reactivate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          client_id: conversacion.client_id 
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.log('❌ Error reactivando agente:', result.error);
        toast({
          title: "Error",
          description: `Error reactivando agente: ${result.error}`,
          variant: "destructive",
        });
        return;
      }

      console.log('✅ Agente reactivado exitosamente:', result);
      toast({
        title: "Agente reactivado",
        description: `Agente reactivado exitosamente para ${conversacion.client.names}`,
      });
      
      // Recargar la conversación para actualizar el estado
      await cargarConversacion();
      
    } catch (error) {
      console.log('❌ Error inesperado reactivando agente:', error);
      toast({
        title: "Error",
        description: "Error inesperado reactivando agente",
        variant: "destructive",
      });
    } finally {
      setReactivatingAgent(false);
    }
  };

  // Función para hacer scroll al final de la conversación
  const scrollToBottom = () => {
    // Usar la función global del ChatViewer
    if ((window as any).scrollChatToBottom) {
      setTimeout(() => {
        (window as any).scrollChatToBottom();
      }, 100); // Pequeño delay para asegurar que el DOM se haya actualizado
    }
  };

  // Función para manejar el toggle del formulario de WhatsApp
  const toggleWhatsappForm = () => {
    const newShowState = !showWhatsappForm;
    setShowWhatsappForm(newShowState);
    
    // Si se está mostrando el formulario, hacer scroll al final
    if (newShowState) {
      scrollToBottom();
    }
  };

  const enviarWhatsApp = async () => {
    // Determinar el número de teléfono a usar
    const phoneNumber = conversacion?.client?.phone_number || conversacion?.user_identifier;
    
    if (!phoneNumber || !whatsappMessage.trim() || !dataToken?.dealership_id) {
      toast({
        title: "Error",
        description: "Faltan datos para enviar el mensaje",
        variant: "destructive",
      });
      return;
    }

    setSendingWhatsapp(true);
    try {
      console.log('🚀 [UI] Enviando mensaje WhatsApp...');
      
      // Obtener el token de la URL para la autorización
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      
      // 1. Enviar mensaje WhatsApp
      const response = await fetch('/api/n8n/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }) // ← NUEVO: Incluir token de autorización
        },
        body: JSON.stringify({
          phone_number: phoneNumber,
          message: whatsappMessage.trim(),
          dealership_id: dataToken.dealership_id,
          sender_type: 'dealership_worker' // Envío desde conversaciones = Dealership Worker
        }),
      });

      const result = await response.json();

      if (result.success) {
        console.log('✅ [UI] Mensaje enviado exitosamente');
        
        // 2. Verificar estado del agente y desactivarlo si es necesario
        try {
          console.log('🤖 [UI] Verificando estado del agente...');
          
          // Verificar estado actual del agente
          const agentStatusResponse = await fetch(`/api/agent-control?phone_number=${phoneNumber}&dealership_id=${dataToken.dealership_id}`);
          const agentStatus = await agentStatusResponse.json();
          
          if (agentStatus.agent_active) {
            console.log('🤖 [UI] Agente está activo, procediendo a desactivarlo...');
            
            // Desactivar el agente
            const deactivateResponse = await fetch('/api/agent-control', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                phone_number: phoneNumber,
                dealership_id: dataToken.dealership_id,
                agent_active: false,
                notes: 'Desactivado automáticamente al enviar mensaje desde conversaciones',
                updated_by: 'dealership_worker'
              }),
            });

            const deactivateResult = await deactivateResponse.json();
            
            if (deactivateResult.success) {
              console.log('✅ [UI] Agente desactivado exitosamente');
              // Actualizar el estado local del agente
              setAgentStatus({
                agent_active: false,
                loading: false
              });
              toast({
                title: "Mensaje enviado y agente desactivado",
                description: "El mensaje se envió correctamente y el agente de IA fue desactivado para este cliente",
              });
            } else {
              console.warn('⚠️ [UI] Error al desactivar agente:', deactivateResult.error);
              toast({
                title: "Mensaje enviado",
                description: "El mensaje se envió correctamente, pero hubo un problema al desactivar el agente de IA",
              });
            }
          } else {
            console.log('🤖 [UI] Agente ya está desactivado, no es necesario desactivarlo');
            toast({
              title: "Mensaje enviado",
              description: "El mensaje de WhatsApp se envió correctamente",
            });
          }
        } catch (agentError) {
          console.error('💥 [UI] Error verificando/desactivando agente:', agentError);
          toast({
            title: "Mensaje enviado",
            description: "El mensaje se envió correctamente, pero hubo un problema al gestionar el agente de IA",
          });
        }
        
        setWhatsappMessage("");
        // Hacer scroll al final después de enviar el mensaje
        scrollToBottom();
      } else {
        console.error('❌ [UI] Error al enviar mensaje:', result.error);
        toast({
          title: "Error al enviar",
          description: result.error || "No se pudo enviar el mensaje",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('💥 [UI] Error inesperado:', error);
      toast({
        title: "Error",
        description: "Error inesperado al enviar el mensaje",
        variant: "destructive",
      });
    } finally {
      setSendingWhatsapp(false);
    }
  };

  // Si no hay conversación seleccionada, mostrar placeholder
  if (!conversationId) {
    return <ChatPlaceholder />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Cargando conversación...</p>
      </div>
    );
  }

  if (!conversacion) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-lg">No se encontró la conversación solicitada</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header del chat */}
      <div className="p-4 border-b bg-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="font-semibold">
              {conversacion.client?.names || 'Sin cliente'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {conversacion.user_identifier}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Indicador de actualización automática */}
          {isAutoUpdating && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              Actualizando...
            </div>
          )}
          
          {/* Botón de reactivar agente - solo mostrar si el agente está inactivo */}
          {conversacion.client_id && !agentStatus.agent_active && (
            <Button
              variant="default"
              size="sm"
              onClick={reactivarAgente}
              disabled={reactivatingAgent}
              className="text-xs bg-blue-600 hover:bg-blue-700"
            >
              {reactivatingAgent ? (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <RotateCcw className="h-3 w-3 mr-1" />
              )}
              Reactivar agente
            </Button>
          )}
          
          {conversacion.client_id && onNavigateToClient && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigateToClient(conversacion.client_id!)}
              className="text-xs"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Ver perfil
            </Button>
          )}
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => actualizarDatosDinamicos()} // Solo actualizar datos dinámicos
            className="text-xs"
          >
            <RefreshCcw className="h-3 w-3 mr-1" />
            Actualizar
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Panel de información lateral (colapsible) */}
        <Card className="w-80 border-r border-t-0 rounded-none flex flex-col bg-gray-50">
          <div className="p-4 space-y-4 overflow-y-auto conversation-scrollbar">
            
            {/* Información del cliente removida - se muestra en el header del chat */}

            {/* Mostrar campos nuevos si están disponibles */}
            {conversacion.client_intent && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Intención del cliente</p>
                <p className="text-sm">{getClientIntent(conversacion.client_intent)}</p>
              </div>
            )}
            
            {conversacion.agent_name && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Agente</p>
                <p className="text-sm">{conversacion.agent_name}</p>
              </div>
            )}
            
            {conversacion.ai_model && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Modelo IA</p>
                <p className="text-xs">{conversacion.ai_model}</p>
              </div>
            )}

            {/* Panel de contexto del cliente */}
            {conversacion.client_id && dataToken?.dealership_id && (
              <ClienteContextPanel 
                clientId={conversacion.client_id} 
                dealershipId={dataToken.dealership_id}
              />
            )}

            <Separator />
            
            <div>
              <p className="text-xs text-muted-foreground mb-2">Estadísticas</p>
              {conversacion.channel === 'phone' && (
                <div>
                  <Card className="p-3 flex items-center justify-center">
                    <Clock className="h-4 w-4 mr-2 text-blue-500" />
                    <div className="text-center">
                      <p className="text-lg font-bold">
                        {/* Priorizar el nuevo campo duration_seconds si está disponible */}
                        {conversacion.duration_seconds 
                          ? formatDuration(conversacion.duration_seconds)
                          : conversacion.metadata?.callObject?.startedAt && conversacion.metadata?.callObject?.endedAt 
                            ? calculateCallDuration(conversacion.metadata.callObject.startedAt, conversacion.metadata.callObject.endedAt)
                            : formatDuration(conversacion.metadata?.call_duration)}
                      </p>
                      <p className="text-xs text-muted-foreground">Duración</p>
                    </div>
                  </Card>
                </div>
              )}
              
              <div className="mt-3">
                <p className="text-xs text-muted-foreground mb-1">Fechas</p>
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
            
            {conversacion.channel === 'phone' && (
              <>
                <Separator />
                
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Detalles de la llamada</p>
                  <div className="space-y-2 text-xs">
                    {/* Utilizar el campo específico si está disponible, sino usar el del objeto metadata */}
                    {(conversacion.ended_reason || conversacion.metadata?.ended_reason) && (
                      <p><span className="font-medium">Finalización:</span> {conversacion.ended_reason || conversacion.metadata?.ended_reason}</p>
                    )}
                    {(conversacion.call_id || conversacion.metadata?.call_id) && (
                      <p><span className="font-medium">ID:</span> {conversacion.call_id || conversacion.metadata?.call_id}</p>
                    )}
                    {conversacion.was_successful !== undefined && (
                      <p><span className="font-medium">Resultado:</span> {conversacion.was_successful ? 'Exitosa' : 'No exitosa'}</p>
                    )}
                  </div>
                </div>
                
                {/* Utilizar el campo específico de grabación si está disponible */}
                {(conversacion.recording_url || conversacion.metadata?.recording_url) && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Grabación</p>
                    <audio 
                      src={conversacion.recording_url || conversacion.metadata?.recording_url} 
                      controls 
                      className="w-full" 
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </Card>

        {/* Área de mensajes */}
        <div className="flex-1 flex flex-col">
          {conversacion.channel === 'phone' && (conversacion.conversation_summary || conversacion.metadata?.summary) && (
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
                  {conversacion.conversation_summary_translated || conversacion.conversation_summary || conversacion.metadata?.summary}
                </p>
                
                {/* Información extraída */}
                {(() => {
                  const { appointment, cost, date } = extractInfoFromSummary(conversacion.conversation_summary_translated || conversacion.conversation_summary || conversacion.metadata?.summary);
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

          {/* ChatViewer con altura flexible */}
          <div ref={messagesContainerRef} className="flex-1 overflow-hidden">
            <ChatViewer messages={mensajes} />
          </div>
          
          {/* Formulario de WhatsApp */}
          {conversacion.user_identifier ? (
            <div className="p-4 border-t bg-muted/30">
              <div className="space-y-3">
                {/* Header con botón expandible */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <MessageSquare className="h-4 w-4 mr-2 text-green-600" />
                    <p className="text-sm font-medium text-green-700">Enviar WhatsApp</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {/* Indicador del estado del agente de IA */}
                    {agentStatus.loading ? (
                      <Badge variant="outline" className="text-xs">
                        <RefreshCcw className="h-3 w-3 mr-1 animate-spin" />
                        Verificando agente...
                      </Badge>
                    ) : (
                      <Badge 
                        variant={agentStatus.agent_active ? "default" : "secondary"} 
                        className={`text-xs ${agentStatus.agent_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}
                      >
                        {agentStatus.agent_active ? (
                          <>
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-1" />
                            Agente activo
                          </>
                        ) : (
                          <>
                            <div className="w-2 h-2 bg-gray-400 rounded-full mr-1" />
                            Agente desactivado
                          </>
                        )}
                      </Badge>
                    )}
                    
                    {/* Botón para expandir/contraer */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggleWhatsappForm}
                      className="text-xs"
                    >
                      {showWhatsappForm ? "Ocultar" : "Mostrar"}
                    </Button>
                  </div>
                </div>
                
                {/* Formulario que aparece/desaparece */}
                {showWhatsappForm && (
                  <>
                    <p className="text-xs text-muted-foreground">
                      Enviar a: {conversacion.client?.phone_number || conversacion.user_identifier}
                    </p>
                    <Textarea
                      ref={textareaRef}
                      placeholder="Escribe tu mensaje aquí..."
                      value={whatsappMessage}
                      onChange={handleTextareaChange}
                      className="min-h-[80px] resize-none"
                      disabled={sendingWhatsapp}
                    />
                    <div className="flex justify-end">
                      <Button
                        onClick={enviarWhatsApp}
                        disabled={!whatsappMessage.trim() || sendingWhatsapp}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {sendingWhatsapp ? (
                          <>
                            <RefreshCcw className="h-4 w-4 mr-2 animate-spin" />
                            Enviando...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-2" />
                            Enviar
                          </>
                        )}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            // Mensaje cuando no hay user_identifier
            <div className="p-4 border-t bg-muted/30">
              <div className="flex items-center justify-center text-muted-foreground text-sm">
                <MessageSquare className="h-4 w-4 mr-2" />
                No hay identificador de usuario disponible
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
