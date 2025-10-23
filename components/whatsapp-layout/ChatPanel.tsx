"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { ChatViewer } from "@/components/chat-viewer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { RefreshCcw, Phone, MessageSquare, FileText, Clock, Calendar, CreditCard, ChevronDown, ChevronUp, Send, ExternalLink, Loader2, RotateCcw, Paperclip, X, Image as ImageIcon, AlertTriangle, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { markConversationAsRead } from '@/utils/conversation-helpers';
import { ClienteContextPanel } from '@/components/cliente-context-panel';
import { ChatPlaceholder } from './ChatPlaceholder';
import { WhatsAppWindowStatus } from '@/utils/whatsapp-window';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

interface Conversation {
  id: string;
  user_identifier: string;
  client_id: string | null;
  dealership_id: string | null;
  status: 'active' | 'closed' | 'pending';
  created_at: string;
  updated_at: string;
  channel?: string;
  messages?: any[];
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

// Feature Flag: Dealerships con acceso a envío de imágenes
const DEALERSHIPS_WITH_IMAGE_UPLOAD = [
  '803b2961-b9d5-47f3-be4a-c8c114c85b5e', // Nissan - Autopolis (pruebas Franco)
  // Agregar más dealership_ids aquí para habilitar la funcionalidad
];

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
  
  // Estados para envío de imágenes
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [imageMetadata, setImageMetadata] = useState<any>(null);
  const [imageCaption, setImageCaption] = useState("");
  const [uploadingToStorage, setUploadingToStorage] = useState(false);
  const [sendingImageMessage, setSendingImageMessage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Estado para reactivación de agentes
  const [reactivatingAgent, setReactivatingAgent] = useState(false);
  
  // Estados para la ventana de 24h
  const [windowStatus, setWindowStatus] = useState<WhatsAppWindowStatus | null>(null);
  const [checkingWindowStatus, setCheckingWindowStatus] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [availableTemplates, setAvailableTemplates] = useState([]);
  
  // Referencia para el contenedor de mensajes
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  
  // Referencia para preservar el foco del textarea
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Estado para preservar la posición del cursor
  const [cursorPosition, setCursorPosition] = useState<number | null>(null);
  
  // Estado para forzar la restauración del foco
  const [shouldRestoreFocus, setShouldRestoreFocus] = useState(false);
  
  // ===== REFS PARA AUTO-SCROLL INTELIGENTE =====
  const scrollAreaRef = useRef<HTMLDivElement | null>(null);
  const isNearBottomRef = useRef<boolean>(true);
  const lastMessageCountRef = useRef<number>(0);
  
  const { toast } = useToast();
  
  // Feature flag: verificar si este dealership tiene acceso a envío de imágenes
  const enableImageUpload = DEALERSHIPS_WITH_IMAGE_UPLOAD.includes(dataToken?.dealership_id);
  
  // Handler para preservar la posición del cursor
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setWhatsappMessage(e.target.value);
    setCursorPosition(e.target.selectionStart);
  };
  
  /**
   * Verifica si el usuario está cerca del final del scroll
   * @returns true si está a menos de 100px del fondo
   */
  const checkIfNearBottom = useCallback(() => {
    const scrollArea = scrollAreaRef.current;
    if (!scrollArea) {
      console.log('⚠️ [Auto-scroll] scrollArea es null en checkIfNearBottom');
      return true;
    }
    
    const { scrollTop, scrollHeight, clientHeight } = scrollArea;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    
    // Considera "cerca del fondo" si está a menos de 100px del final
    const nearBottom = distanceFromBottom < 100;
    isNearBottomRef.current = nearBottom;
    
    console.log('📍 Posición scroll:', {
      scrollTop: Math.round(scrollTop),
      scrollHeight: Math.round(scrollHeight),
      clientHeight: Math.round(clientHeight),
      distanceFromBottom: Math.round(distanceFromBottom),
      nearBottom,
      willAutoScroll: nearBottom ? 'SÍ' : 'NO'
    });
    
    return nearBottom;
  }, []);
  
  // useEffect para restaurar el foco después de re-renders
  useEffect(() => {
    if (shouldRestoreFocus && textareaRef.current && cursorPosition !== null) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(cursorPosition, cursorPosition);
      setShouldRestoreFocus(false);
    }
  }, [shouldRestoreFocus, cursorPosition]);

  // Detectar cuando el usuario hace scroll manualmente
  useEffect(() => {
    // Solo configurar el listener si hay una conversación abierta
    if (!conversationId) {
      console.log('⏭️ [Auto-scroll] No hay conversación abierta, saltando configuración del listener');
      return;
    }

    console.log('🔄 [Auto-scroll] Iniciando configuración del listener para conversación:', conversationId);
    
    // Intentar configurar el listener múltiples veces hasta que el ref esté listo
    let attempts = 0;
    const maxAttempts = 50; // 5 segundos máximo
    
    const trySetupListener = () => {
      attempts++;
      const scrollArea = scrollAreaRef.current;
      
      if (!scrollArea) {
        if (attempts < maxAttempts) {
          console.log(`⚠️ [Auto-scroll] Intento ${attempts}/${maxAttempts}: scrollAreaRef.current es null, reintentando en 100ms`);
          setTimeout(trySetupListener, 100);
        } else {
          console.log('❌ [Auto-scroll] No se pudo configurar el listener después de múltiples intentos');
        }
        return;
      }
      
      console.log('✅ [Auto-scroll] Agregando listener de scroll al elemento:', scrollArea);
      
      const handleScroll = () => {
        checkIfNearBottom();
      };
      
      scrollArea.addEventListener('scroll', handleScroll);
      
      // Verificar posición inicial
      checkIfNearBottom();
      
      return () => {
        console.log('🧹 [Auto-scroll] Removiendo listener de scroll');
        scrollArea.removeEventListener('scroll', handleScroll);
      };
    };
    
    // Iniciar el proceso después de un delay inicial
    setTimeout(trySetupListener, 200);
  }, [checkIfNearBottom, conversationId]);

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
      // Limpiar estados de imagen
      setSelectedImage(null);
      setUploadedImageUrl(null);
      setImageMetadata(null);
      setImageCaption("");
      // NUEVO: Limpiar contador de mensajes cuando se cambia de conversación
      lastMessageCountRef.current = 0;
    }
  }, [conversationId, dataToken]);

  // Inicializar contador de mensajes cuando se cargan mensajes por primera vez
  useEffect(() => {
    if (mensajes.length > 0 && lastMessageCountRef.current === 0) {
      console.log('🔄 [Auto-scroll] Inicializando contador de mensajes:', mensajes.length);
      lastMessageCountRef.current = mensajes.length;
    }
  }, [mensajes.length]);

  // Actualización automática de datos dinámicos cada 20 segundos
  useEffect(() => {
    if (!conversationId || !dataToken) return;
    
    const interval = setInterval(async () => {
      try {
        // Solo actualizar si la conversación está abierta
        if (conversacion) {
          console.log('🔄 Actualizando datos dinámicos automáticamente...');
          
          // NUEVO: Guardar cantidad de mensajes ANTES de actualizar
          lastMessageCountRef.current = mensajes.length;
          
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
    }, 5000); // 5 segundos
    
    return () => clearInterval(interval);
  }, [conversationId, dataToken, conversacion, mensajes.length]);

  // Auto-scroll inteligente: solo scrollea si hay mensajes nuevos Y el usuario está al fondo
  useEffect(() => {
    // Detectar si hay mensajes nuevos
    const hasNewMessages = mensajes.length > lastMessageCountRef.current;
    
    console.log('🔍 [Auto-scroll] Verificando mensajes:', {
      mensajesActuales: mensajes.length,
      mensajesAnteriores: lastMessageCountRef.current,
      hasNewMessages,
      isNearBottom: isNearBottomRef.current
    });
    
    if (hasNewMessages && isNearBottomRef.current) {
      // Usuario está al fondo → hacer auto-scroll
      console.log('📩 Nuevo mensaje detectado → SCROLLEANDO al fondo');
      
      // Pequeño delay para que el DOM se actualice
      setTimeout(() => {
        const scrollArea = scrollAreaRef.current;
        if (scrollArea) {
          scrollArea.scrollTop = scrollArea.scrollHeight;
        }
      }, 100);
    } else if (hasNewMessages && !isNearBottomRef.current) {
      // Usuario está arriba → NO interrumpir
      console.log('📩 Nuevo mensaje detectado → NO scrolleando (usuario está leyendo arriba)');
    }
    
    // Actualizar contador de mensajes
    lastMessageCountRef.current = mensajes.length;
  }, [mensajes.length]);

  // Verificar estado de ventana al cargar la conversación
  useEffect(() => {
    if (conversacion?.id) {
      checkWindowStatus();
      loadAvailableTemplates();
    }
  }, [conversacion?.id]);

  // Verificar estado de ventana cuando llegan nuevos mensajes
  useEffect(() => {
    if (mensajes.length > 0) {
      checkWindowStatus();
    }
  }, [mensajes]);

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
        .single() as { data: Conversation | null; error: any };

      if (conversacionError) throw conversacionError;
      
      // Verificar que se obtuvo la conversación
      if (!conversacionData) {
        console.error("No se encontró la conversación");
        return;
      }
      
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
        hasClient: !!conversacionData.client,
        clientData: conversacionData.client,
        agentActive: conversacionData.client?.agent_active,
        phoneNumber: conversacionData.client?.phone_number
      });
      
      // Verificar estado del agente de IA si tenemos los datos necesarios
      if (conversacionData.user_identifier && dataToken?.dealership_id) {
        verificarEstadoAgente(conversacionData.user_identifier, dataToken.dealership_id);
      }

      // Cargar mensajes iniciales (solo en la primera carga)
      if (conversacionData.messages) {
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
        .single() as { data: { messages: any; last_read_at: string | null; updated_at: string } | null; error: any };

      if (conversacionError) throw conversacionError;

      // Verificar que se obtuvo la conversación
      if (!conversacionData) return;

      // Actualizar solo mensajes y estadísticas
      if (conversacionData.messages) {
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
      if (conversacion?.user_identifier && dataToken?.dealership_id) {
        verificarEstadoAgente(conversacion.user_identifier, dataToken.dealership_id);
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

  // Función para verificar el estado del agente de IA usando phone_agent_settings
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
    if (!conversacion?.user_identifier || !dataToken?.dealership_id) {
      toast({
        title: "Error",
        description: "No se puede reactivar: faltan datos del teléfono o agencia",
        variant: "destructive",
      });
      return;
    }

    console.log('🔄 Iniciando reactivación de agente para:', conversacion.user_identifier);
    
    setReactivatingAgent(true);

    try {
      const response = await fetch('/api/agent-control', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone_number: conversacion.user_identifier,
          dealership_id: dataToken.dealership_id,
          agent_active: true,
          notes: 'Reactivado manualmente desde conversación',
          updated_by: 'user'
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
        description: `Agente reactivado exitosamente para ${conversacion.user_identifier}`,
      });
      
      // Recargar estado del agente
      await verificarEstadoAgente(conversacion.user_identifier, dataToken.dealership_id);
      
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

  // Función para limpiar estados de imagen
  const limpiarEstadosImagen = () => {
    setSelectedImage(null);
    setUploadedImageUrl(null);
    setImageMetadata(null);
    setImageCaption("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Función para manejar la selección de imagen
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log('📎 [UI] Imagen seleccionada:', file.name, file.type, file.size);

    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Tipo de archivo no válido",
        description: "Solo se permiten imágenes JPEG, PNG o WebP",
        variant: "destructive",
      });
      return;
    }

    // Validar tamaño (5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB en bytes
    if (file.size > maxSize) {
      toast({
        title: "Archivo muy grande",
        description: "El tamaño máximo permitido es 5MB",
        variant: "destructive",
      });
      return;
    }

    setSelectedImage(file);
    
    // Upload a Storage
    await uploadImageToStorage(file);
  };

  // Función para subir imagen a Storage
  const uploadImageToStorage = async (file: File) => {
    if (!dataToken?.dealership_id || !conversacion?.user_identifier) {
      toast({
        title: "Error",
        description: "Faltan datos para subir la imagen",
        variant: "destructive",
      });
      return;
    }

    setUploadingToStorage(true);
    try {
      console.log('📤 [UI] Subiendo imagen a Storage...');

      // Obtener el token de la URL para la autorización
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');

      if (!token) {
        toast({
          title: "Error",
          description: "No se encontró token de autenticación",
          variant: "destructive",
        });
        return;
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('chat_id', conversacion.user_identifier);
      formData.append('dealership_id', dataToken.dealership_id);

      const response = await fetch('/api/whatsapp/upload-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        console.log('✅ [UI] Imagen subida exitosamente:', result.media_url);
        setUploadedImageUrl(result.media_url);
        setImageMetadata(result.metadata);
        toast({
          title: "Imagen cargada",
          description: "La imagen se subió correctamente. Puedes agregarle un mensaje y enviarla.",
        });
        // Mostrar el formulario si estaba oculto
        setShowWhatsappForm(true);
        scrollToBottom();
      } else {
        console.error('❌ [UI] Error al subir imagen:', result.error);
        toast({
          title: "Error al subir imagen",
          description: result.error || "No se pudo subir la imagen",
          variant: "destructive",
        });
        limpiarEstadosImagen();
      }
    } catch (error) {
      console.error('💥 [UI] Error inesperado al subir imagen:', error);
      toast({
        title: "Error",
        description: "Error inesperado al subir la imagen",
        variant: "destructive",
      });
      limpiarEstadosImagen();
    } finally {
      setUploadingToStorage(false);
    }
  };

  // Función para enviar la imagen a n8n
  const enviarImagenWhatsApp = async () => {
    const phoneNumber = conversacion?.client?.phone_number || conversacion?.user_identifier;
    
    if (!phoneNumber || !uploadedImageUrl || !dataToken?.dealership_id) {
      toast({
        title: "Error",
        description: "Faltan datos para enviar la imagen",
        variant: "destructive",
      });
      return;
    }

    setSendingImageMessage(true);
    try {
      console.log('📨 [UI] Enviando mensaje con imagen...');
      
      // Obtener el token de la URL para la autorización
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      
      const response = await fetch('/api/n8n/send-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          phone_number: phoneNumber,
          media_url: uploadedImageUrl,
          caption: imageCaption.trim() || undefined,
          metadata: imageMetadata,
          dealership_id: dataToken.dealership_id
        }),
      });

      const result = await response.json();

      if (result.success) {
        console.log('✅ [UI] Mensaje con imagen enviado exitosamente');
        
        // Verificar estado del agente y desactivarlo si es necesario
        try {
          console.log('🤖 [UI] Verificando estado del agente...');
          
          const agentStatusResponse = await fetch(`/api/agent-control?phone_number=${phoneNumber}&dealership_id=${dataToken.dealership_id}`);
          const agentStatus = await agentStatusResponse.json();
          
          if (agentStatus.agent_active) {
            console.log('🤖 [UI] Agente está activo, procediendo a desactivarlo...');
            
            const deactivateResponse = await fetch('/api/agent-control', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                phone_number: phoneNumber,
                dealership_id: dataToken.dealership_id,
                agent_active: false,
                notes: 'Desactivado automáticamente al enviar imagen desde conversaciones',
                updated_by: 'dealership_worker'
              }),
            });

            const deactivateResult = await deactivateResponse.json();
            
            if (deactivateResult.success) {
              console.log('✅ [UI] Agente desactivado exitosamente');
              setAgentStatus({
                agent_active: false,
                loading: false
              });
              toast({
                title: "Imagen enviada y agente desactivado",
                description: "La imagen se envió correctamente y el agente de IA fue desactivado para este cliente",
              });
            } else {
              console.warn('⚠️ [UI] Error al desactivar agente:', deactivateResult.error);
              toast({
                title: "Imagen enviada",
                description: "La imagen se envió correctamente, pero hubo un problema al desactivar el agente de IA",
              });
            }
          } else {
            console.log('🤖 [UI] Agente ya está desactivado, no es necesario desactivarlo');
            toast({
              title: "Imagen enviada",
              description: "La imagen de WhatsApp se envió correctamente",
            });
          }
        } catch (agentError) {
          console.error('💥 [UI] Error verificando/desactivando agente:', agentError);
          toast({
            title: "Imagen enviada",
            description: "La imagen se envió correctamente, pero hubo un problema al gestionar el agente de IA",
          });
        }
        
        limpiarEstadosImagen();
        // Actualizar mensajes y hacer scroll
        await actualizarDatosDinamicos();
        scrollToBottom();
      } else {
        console.error('❌ [UI] Error al enviar imagen:', result.error);
        toast({
          title: "Error al enviar",
          description: result.error || "No se pudo enviar la imagen",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('💥 [UI] Error inesperado al enviar imagen:', error);
      toast({
        title: "Error",
        description: "Error inesperado al enviar la imagen",
        variant: "destructive",
      });
    } finally {
      setSendingImageMessage(false);
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
        // Actualizar mensajes y hacer scroll
        await actualizarDatosDinamicos();
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

  // Función para verificar el estado de la ventana de 24h
  const checkWindowStatus = async () => {
    if (!conversacion?.id) return;
    
    setCheckingWindowStatus(true);
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      
      const response = await fetch(`/api/whatsapp/window-status?conversation_id=${conversacion.id}`, {
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });
      
      const result = await response.json();
      if (result.success) {
        setWindowStatus(result.windowStatus);
      }
    } catch (error) {
      console.error('Error verificando estado de ventana:', error);
    } finally {
      setCheckingWindowStatus(false);
    }
  };

  // Función para cargar templates disponibles
  const loadAvailableTemplates = async () => {
    if (!dataToken?.dealership_id) return;
    
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      
      const response = await fetch('/api/whatsapp/templates/available', {
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });
      
      const result = await response.json();
      if (result.success) {
        setAvailableTemplates(result.templates);
      }
    } catch (error) {
      console.error('Error cargando templates:', error);
    }
  };

  // Función para enviar template
  const sendTemplate = async (templateId: string, parameters: any) => {
    if (!conversacion?.client?.id) return;
    
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      
      const response = await fetch('/api/whatsapp/send-template', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          client_id: conversacion.client.id,
          template_id: templateId,
          parameters: parameters
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Template enviado",
          description: "El template se envió correctamente",
        });
        setShowTemplateDialog(false);
        // Refrescar mensajes
        await actualizarDatosDinamicos();
      } else {
        toast({
          title: "Error",
          description: result.error || "Error al enviar template",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error enviando template:', error);
      toast({
        title: "Error",
        description: "Error inesperado al enviar template",
        variant: "destructive",
      });
    }
  };

  // Función para renderizar el input de mensaje condicionalmente
  const renderMessageInput = () => {
    if (checkingWindowStatus) {
      return (
        <div className="flex items-center justify-center p-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
          <span className="ml-2 text-sm text-muted-foreground">Verificando estado...</span>
        </div>
      );
    }

    // Si está dentro de la ventana o la agencia no usa ventana de 24h
    if (windowStatus?.canSendFreeMessage) {
      return (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Enviar a: {conversacion?.client?.phone_number || conversacion?.user_identifier}
          </p>
          
          {/* Input file oculto para seleccionar imagen */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleImageSelect}
            className="hidden"
          />
          
          {/* Si hay imagen seleccionada, mostrar preview */}
          {uploadedImageUrl ? (
            <div className="space-y-3 bg-white p-4 rounded-lg border">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium">Vista previa de imagen</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={limpiarEstadosImagen}
                  disabled={uploadingToStorage || sendingImageMessage}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Imagen preview */}
              <div className="relative w-full max-w-xs mx-auto">
                <img
                  src={uploadedImageUrl}
                  alt="Preview"
                  className="w-full h-auto rounded-lg border shadow-sm"
                />
              </div>
              
              {/* Metadata */}
              {imageMetadata && (
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>
                    <span className="font-medium">Tamaño:</span>{' '}
                    {imageMetadata.compressed_size || 'N/A'}
                    {imageMetadata.compression_ratio && (
                      <span className="ml-2">
                        (Comprimido: {imageMetadata.compression_ratio})
                      </span>
                    )}
                  </p>
                  {imageMetadata.dimensions && (
                    <p>
                      <span className="font-medium">Dimensiones:</span>{' '}
                      {typeof imageMetadata.dimensions === 'object' 
                        ? `${imageMetadata.dimensions.width} x ${imageMetadata.dimensions.height}px`
                        : imageMetadata.dimensions}
                    </p>
                  )}
                </div>
              )}
              
              {/* Input para caption */}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  Mensaje opcional
                </label>
                <Textarea
                  placeholder="Agrega un mensaje a tu imagen..."
                  value={imageCaption}
                  onChange={(e) => setImageCaption(e.target.value)}
                  className="min-h-[60px] resize-none"
                  disabled={sendingImageMessage}
                />
              </div>
              
              {/* Botones de acción */}
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={limpiarEstadosImagen}
                  disabled={sendingImageMessage}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={enviarImagenWhatsApp}
                  disabled={sendingImageMessage}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                >
                  {sendingImageMessage ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Enviar Imagen
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Formulario normal de texto */}
              <Textarea
                ref={textareaRef}
                placeholder="Escribe tu mensaje aquí..."
                value={whatsappMessage}
                onChange={handleTextareaChange}
                className="min-h-[80px] resize-none"
                disabled={sendingWhatsapp || uploadingToStorage}
              />
              <div className="flex justify-between items-center">
                {/* Botón para adjuntar imagen - solo si feature está habilitada */}
                {enableImageUpload && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingToStorage || sendingWhatsapp}
                  >
                    {uploadingToStorage ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Cargando...
                      </>
                    ) : (
                      <>
                        <Paperclip className="h-4 w-4 mr-2" />
                        Adjuntar imagen
                      </>
                    )}
                  </Button>
                )}
                
                {/* Botón de enviar mensaje de texto */}
                <Button
                  onClick={enviarWhatsApp}
                  disabled={!whatsappMessage.trim() || sendingWhatsapp || uploadingToStorage}
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
      );
    }

    // Si está fuera de la ventana, mostrar banner y botón de template
    return (
      <div className="space-y-3">
        {/* Banner de alerta */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-yellow-800">
                {windowStatus?.lastCustomerMessageTime 
                  ? `Último mensaje hace ${Math.round(windowStatus.hoursSinceLastMessage || 0)} horas`
                  : 'El cliente no ha enviado mensajes aún'
                }
              </h4>
              <p className="text-sm text-yellow-700 mt-1">
                Para enviar mensajes fuera de la ventana de 24 horas, debes usar un template pre-aprobado.
              </p>
            </div>
          </div>
        </div>
        
        {/* Botón para enviar template */}
        <Button
          onClick={() => setShowTemplateDialog(true)}
          className="w-full bg-green-600 hover:bg-green-700"
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          Enviar Template
        </Button>
      </div>
    );
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
          
          {/* Botón de reactivar agente - solo mostrar si el agente está inactivo */}
          {conversacion.user_identifier && !agentStatus.agent_active && (
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
                userIdentifier={conversacion.user_identifier}
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
            <ChatViewer 
              messages={mensajes} 
              scrollAreaRef={scrollAreaRef} 
              shouldAutoScroll={isNearBottomRef.current}
            />
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
                {showWhatsappForm && renderMessageInput()}
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
      
      {/* Modal para seleccionar templates */}
      <TemplateDialog 
        showTemplateDialog={showTemplateDialog}
        setShowTemplateDialog={setShowTemplateDialog}
        availableTemplates={availableTemplates}
        sendTemplate={sendTemplate}
      />
    </div>
  );
}

// Componente para el modal de templates
function TemplateDialog({ 
  showTemplateDialog, 
  setShowTemplateDialog, 
  availableTemplates, 
  sendTemplate 
}: {
  showTemplateDialog: boolean;
  setShowTemplateDialog: (show: boolean) => void;
  availableTemplates: any[];
  sendTemplate: (templateId: string, parameters: any) => Promise<void>;
}) {
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [templateParameters, setTemplateParameters] = useState({});
  const [sendingTemplate, setSendingTemplate] = useState(false);

  const handleSendTemplate = async () => {
    if (!selectedTemplate) return;
    
    setSendingTemplate(true);
    try {
      await sendTemplate(selectedTemplate.id, templateParameters);
    } finally {
      setSendingTemplate(false);
    }
  };

  return (
    <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Seleccionar Template</DialogTitle>
          <DialogDescription>
            Elige un template pre-aprobado para enviar al cliente
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {availableTemplates.map((template) => (
            <div
              key={template.id}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedTemplate?.id === template.id
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedTemplate(template)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium">{template.name}</h4>
                  <p className="text-sm text-gray-600 mt-1">{template.body_text}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {template.category}
                    </span>
                    {template.parameter_count > 0 && (
                      <span className="text-xs bg-blue-100 px-2 py-1 rounded">
                        {template.parameter_count} parámetros
                      </span>
                    )}
                  </div>
                </div>
                {selectedTemplate?.id === template.id && (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                )}
              </div>
            </div>
          ))}
        </div>
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setShowTemplateDialog(false)}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSendTemplate}
            disabled={!selectedTemplate || sendingTemplate}
            className="bg-green-600 hover:bg-green-700"
          >
            {sendingTemplate ? 'Enviando...' : 'Enviar Template'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
