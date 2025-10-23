"use client";

import { useState, useEffect, useCallback, memo } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { verifyToken } from "../../../jwt/token";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { WhatsAppStyleLayout } from "@/components/whatsapp-layout/WhatsAppStyleLayout";
import { ChatPanel } from "@/components/whatsapp-layout/ChatPanel";
import { useSelectedConversation } from "@/hooks/useSelectedConversation";
import { Eye, Search, MessageSquare, Phone, Loader2, MessageCircle } from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { getLastCustomerMessageTimestamp, isConversationUnread, truncateClientName, getFullClientName } from '@/utils/conversation-helpers';
import { useToast } from "@/hooks/use-toast";
import { useDebouncedCallback } from 'use-debounce';
import { useAutoPolling } from "@/hooks/useAutoPolling";

// Importar el tipo para la conversión
interface ConversacionAccionHumana {
  id: string;
  user_identifier: string;
  client_id: string | null;
  dealership_id: string;
  status: string;
  channel: string;
  created_at: string;
  updated_at: string;
  duration_seconds?: number;
  ended_reason?: string;
  was_successful?: boolean;
  conversation_summary?: string;
  conversation_summary_translated?: string;
  client_intent?: string;
  agent_name?: string;
  ai_model?: string;
  outcome_type?: string;
  follow_up_notes?: string;
  customer_satisfaction?: string;
  agent_performance?: string;
  client_names?: string;
  client_email?: string;
  client_phone?: string;
  client_agent_active?: boolean;
  hours_since_last_activity: number;
  urgency_level: 'urgent' | 'normal';
  messages?: Array<{
    id?: string;
    content?: string;
    role?: string;
    created_at?: string;
    timestamp?: string;
    time?: string;
  }>;
  last_read_at?: string | null;
  total_count: number;
}

interface ConversacionItem {
  id: string;
  user_identifier: string;
  client?: {
    names: string;
    phone_number: string;
    email: string;
  } | null;
  updated_at: string;
  status: 'active' | 'closed' | 'pending' | 'completed';
  channel?: string;
  ended_reason?: string;
  was_successful?: boolean;
  messages?: Array<{
    id?: string;
    content?: string;
    role?: string;
    created_at?: string;
    timestamp?: string;
    time?: string;
  }>;
  last_read_at?: string | null;
  last_message_time?: string | null;
  client_agent_active?: boolean;
}

interface Cliente {
  id: string;
  names: string;
  email: string;
  phone_number: string;
  phone_number_2?: string | null;
  agent_active: boolean;
}

const ITEMS_PER_PAGE = 10;
const CONVERSACIONES_MEMOIZADAS = 30; // Memoizar las primeras 30 conversaciones (3 páginas)

// Eliminar el componente WhatsAppIcon duplicado (si existe)
// Usar el mismo WhatsAppIcon que en los KPIs
const WhatsAppIcon = ({ className }: { className?: string }) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      className={className || "h-4 w-4"}
      fill="currentColor"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
};

// Cache simple en memoria - solo para queries sin filtros (fuera del componente)
const conversationsCache = new Map<string, { data: ConversacionItem[], timestamp: number }>();
const CACHE_TTL = 30 * 1000; // 30 segundos

// Componente memoizado para conversaciones críticas (primeras 30)
const MemoizedConversationItem = memo(({ 
  conversacion, 
  isSelected, 
  onSelect,
  formatDateTime,
  getCanalIcon,
  isConversationUnread,
  truncateClientName,
  getFullClientName,
  traducirRazonFinalizacion
}: {
  conversacion: ConversacionItem;
  isSelected: boolean;
  onSelect: () => void;
  formatDateTime: (conversacion: ConversacionItem) => string;
  getCanalIcon: (channel?: string) => React.ReactElement;
  isConversationUnread: (conversacion: ConversacionItem) => boolean;
  truncateClientName: (name?: string) => string;
  getFullClientName: (name?: string) => string;
  traducirRazonFinalizacion: (razon?: string) => string;
}) => {
  return (
    <div
      onClick={onSelect}
      className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
        isSelected ? 'bg-blue-50 border-r-4 border-blue-500' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          {/* Fila superior: Cliente y hora */}
          <div className="flex items-center justify-between mb-1">
            <div className="flex-1 min-w-0 mr-2">
              <div className="flex items-center gap-2">
                <p 
                  className="font-medium text-sm truncate"
                  title={getFullClientName(conversacion.client?.names)}
                >
                  {truncateClientName(conversacion.client?.names)}
                </p>
                {conversacion.client_agent_active === false && (
                  <span className="bg-orange-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold flex-shrink-0">
                    !
                  </span>
                )}
              </div>
            </div>
            <p className={`text-xs flex-shrink-0 ${isConversationUnread(conversacion) ? 'text-green-600 font-medium' : 'text-muted-foreground'}`}>
              {formatDateTime(conversacion)}
            </p>
          </div>
          
          {/* Fila inferior: Usuario, canal e indicador de leído */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getCanalIcon(conversacion.channel)}
              <p className="text-xs text-muted-foreground font-mono truncate">
                {conversacion.user_identifier}
              </p>
            </div>
            {isConversationUnread(conversacion) && (
              <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0" />
            )}
          </div>
         
          {/* Razón de finalización si existe */}
          {conversacion.ended_reason && (
            <div className="mt-1">
              <p className="text-xs text-muted-foreground">
                {traducirRazonFinalizacion(conversacion.ended_reason)}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});



// Componente para la lista de conversaciones (lado izquierdo)
function ConversationList({ 
  dataToken, 
  onConversationSelect, 
  selectedConversationId 
}: { 
  dataToken: { dealership_id: string }; 
  onConversationSelect: (conversation: ConversacionItem) => void; 
  selectedConversationId?: string; 
}) {
  const [conversaciones, setConversaciones] = useState<ConversacionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalConversaciones, setTotalConversaciones] = useState(0);
  const [pagina, setPagina] = useState(1);
  
  // Estados para nueva conversación
  const [showNewConversationModal, setShowNewConversationModal] = useState(false);
  const [clientesDisponibles, setClientesDisponibles] = useState<Cliente[]>([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);
  const [busquedaCliente, setBusquedaCliente] = useState("");
  const [loadingClientes, setLoadingClientes] = useState(false);
  const [creatingConversation, setCreatingConversation] = useState(false);
  const [estadisticasFiltrado, setEstadisticasFiltrado] = useState<{
    totalClientes: number;
    clientesDisponibles: number;
    clientesConConversacionesActivas: number;
    clientesConAgenteDesactivado: number;
  } | null>(null);
  
  
  // Filtros
  const [busqueda, setBusqueda] = useState("");
  const [filtroCanal, setFiltroCanal] = useState("todos");
  const [filtroRazonFinalizacion, setFiltroRazonFinalizacion] = useState("todas");

  const { toast } = useToast();

  // Función debounced para búsqueda de clientes
  const buscarClientesDebounced = useDebouncedCallback(
    (query: string) => buscarClientesDisponibles(query),
    300
  );

  const cargarConversaciones = useCallback(async () => {
    setLoading(true);
    try {
      // Detectar si hay filtros aplicados
      const sinFiltros = !busqueda && 
                         filtroCanal === 'todos' && 
                         filtroRazonFinalizacion === 'todas';
      
      // Cache key simple - solo para queries sin filtros
      const cacheKey = `conversations-${dataToken.dealership_id}-base`;
      
      // 🚀 VERIFICAR CACHE solo si no hay filtros
      if (sinFiltros) {
        const cached = conversationsCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
          console.log('🚀 Cache hit - conversaciones sin filtros');
          setConversaciones(cached.data);
          setTotalConversaciones(cached.data.length);
          setLoading(false);
          return; // ¡Salir temprano con cache!
        }
      }
      
      // 💾 Si no hay cache O hay filtros → usar RPC normal
      console.log(sinFiltros ? '💾 Cache miss - calculando datos frescos' : '🔍 Query con filtros - no cacheable');
      
      const rpcParams = {
        dealership_id_param: dataToken.dealership_id,
        search_query: busqueda || null,
        p_status_filter: 'todos', // Mantener el parámetro pero con valor por defecto
        channel_filter: filtroCanal,
        ended_reason_filter: filtroRazonFinalizacion
      } as any;

      console.log('🚀 Llamando a la función RPC get_all_conversations_with_agent_status con los parámetros:', rpcParams);
      
      // ✅ Usar nueva función que incluye client_agent_active
      const { data, error } = await supabase.rpc('get_all_conversations_with_agent_status', rpcParams) as {
        data: ConversacionItem[] | null;
        error: any;
      };
      
      if (error) {
        console.error("❌ Error en la llamada RPC:", JSON.stringify(error, null, 2));
        throw error;
      }

      console.log('✅ RPC exitosa.');
      console.log('📊 Total de conversaciones recibidas:', data?.length ?? 'undefined');
      
      if (data && data.length > 0) {
        console.log('📋 Primeras 5 conversaciones recibidas:', data.slice(0, 5));
      } else {
        console.log('📋 No se recibieron datos o la lista está vacía.');
      }
      
      setConversaciones(data || []);
      setTotalConversaciones(data?.length || 0);
      
      // 💾 GUARDAR EN CACHE solo si no hay filtros
      if (sinFiltros && data) {
        conversationsCache.set(cacheKey, {
          data: data,
          timestamp: Date.now()
        });
        console.log('💾 Conversaciones guardadas en cache (sin filtros)');
      }

    } catch (error) {
      console.error("❌ Error fatal en cargarConversaciones:", error);
    } finally {
      setLoading(false);
    }
  }, [dataToken, busqueda, filtroCanal, filtroRazonFinalizacion]);

  // Función para buscar clientes disponibles (búsqueda por demanda)
  const buscarClientesDisponibles = async (query: string = '') => {
    setLoadingClientes(true);
    try {
      console.log('🔍 Buscando clientes con query:', query, 'para dealership:', dataToken.dealership_id);
      
      // Si la consulta está vacía, no mostrar nada
      if (!query.trim()) {
        setClientesDisponibles([]);
        setEstadisticasFiltrado(null);
        setLoadingClientes(false);
        return;
      }

      // Dividir la consulta en palabras individuales
      const words = query.trim().split(/\s+/).filter(word => word.length > 0);
      
      let supabaseQuery = supabase
        .from('client')
        .select('id, names, email, phone_number, agent_active')
        .eq('dealership_id', dataToken.dealership_id)
        .not('phone_number', 'is', null)
        .not('phone_number', 'eq', '');
      
      if (words.length > 0) {
        // Aplicar filtros para cada palabra del nombre (AND)
        words.forEach(word => {
          supabaseQuery = supabaseQuery.filter('names', 'ilike', `%${word}%`);
        });
        
        // Agregar búsqueda por teléfono completo (OR)
        const phoneQuery = supabase
          .from('client')
          .select('id, names, email, phone_number, agent_active')
          .eq('dealership_id', dataToken.dealership_id)
          .not('phone_number', 'is', null)
          .not('phone_number', 'eq', '')
          .ilike('phone_number', `%${query}%`);
        
        // Ejecutar ambas consultas
        const [nameResults, phoneResults] = await Promise.all([
          supabaseQuery.limit(20).order('names'),
          phoneQuery.limit(20).order('names')
        ]);
        
        if (nameResults.error) throw nameResults.error;
        if (phoneResults.error) throw phoneResults.error;
        
        // Combinar resultados únicos
        const allResults = [...(nameResults.data || []), ...(phoneResults.data || [])];
        const uniqueResults = allResults.filter((client: any, index, self) => 
          index === self.findIndex((c: any) => c.id === client.id)
        );

        // Obtener configuración de agentes desde phone_agent_settings
        const phoneNumbers = uniqueResults.map((client: any) => client.phone_number);
        const { data: agentSettings, error: agentSettingsError } = await supabase
          .from('phone_agent_settings')
          .select('phone_number, agent_active')
          .eq('dealership_id', dataToken.dealership_id)
          .in('phone_number', phoneNumbers);

        if (agentSettingsError) throw agentSettingsError;

        // Crear mapa para lookup rápido del estado del agente
        const agentSettingsMap = new Map(
          agentSettings?.map((setting: any) => [setting.phone_number, setting.agent_active]) || []
        );

        // Obtener conversaciones activas para filtrar
        const { data: conversacionesActivas, error: conversacionesError } = await supabase
          .from('chat_conversations')
          .select('client_id')
          .eq('dealership_id', dataToken.dealership_id)
          .eq('status', 'active');

        if (conversacionesError) throw conversacionesError;

        // Filtrar clientes que no tienen conversaciones activas Y tienen agente activo
        const clientesConConversacionesActivas = new Set(
          conversacionesActivas?.map((c: any) => c.client_id) || []
        );

        let clientesConConversacionesActivasCount = 0;
        let clientesConAgenteDesactivadoCount = 0;

        const clientesFiltrados = uniqueResults.filter((cliente: any) => {
          // Verificar que no tenga conversaciones activas
          const noTieneConversacionesActivas = !clientesConConversacionesActivas.has(cliente.id);
          if (!noTieneConversacionesActivas) {
            clientesConConversacionesActivasCount++;
          }
          
          // Verificar que tenga agente activo (priorizar phone_agent_settings sobre client.agent_active)
          const agentActive = agentSettingsMap.get(cliente.phone_number) ?? cliente.agent_active ?? true;
          if (!agentActive) {
            clientesConAgenteDesactivadoCount++;
          }
          
          return noTieneConversacionesActivas && agentActive;
        });

        // Guardar resultados y estadísticas
        setClientesDisponibles(clientesFiltrados);
        setEstadisticasFiltrado({
          totalClientes: uniqueResults.length,
          clientesDisponibles: clientesFiltrados.length,
          clientesConConversacionesActivas: clientesConConversacionesActivasCount,
          clientesConAgenteDesactivado: clientesConAgenteDesactivadoCount
        });
        
        console.log('📊 [DEBUG] Búsqueda completada:', {
          query,
          totalEncontrados: uniqueResults.length,
          clientesDisponibles: clientesFiltrados.length,
          clientesConConversacionesActivas: clientesConConversacionesActivasCount,
          clientesConAgenteDesactivado: clientesConAgenteDesactivadoCount
        });
      } else {
        // Si no hay palabras, solo buscar por teléfono
        const { data, error } = await supabaseQuery
          .ilike('phone_number', `%${query}%`)
          .limit(20)
          .order('names');

        if (error) throw error;

        // Aplicar los mismos filtros
        const { data: agentSettings, error: agentSettingsError } = await supabase
          .from('phone_agent_settings')
          .select('phone_number, agent_active')
          .eq('dealership_id', dataToken.dealership_id)
          .in('phone_number', data?.map((c: any) => c.phone_number) || []);

        if (agentSettingsError) throw agentSettingsError;

        const agentSettingsMap = new Map(
          agentSettings?.map((setting: any) => [setting.phone_number, setting.agent_active]) || []
        );

        const { data: conversacionesActivas, error: conversacionesError } = await supabase
          .from('chat_conversations')
          .select('client_id')
          .eq('dealership_id', dataToken.dealership_id)
          .eq('status', 'active');

        if (conversacionesError) throw conversacionesError;

        const clientesConConversacionesActivas = new Set(
          conversacionesActivas?.map((c: any) => c.client_id) || []
        );

        const clientesFiltrados = (data || []).filter((cliente: any) => {
          const noTieneConversacionesActivas = !clientesConConversacionesActivas.has(cliente.id);
          const agentActive = agentSettingsMap.get(cliente.phone_number) ?? cliente.agent_active ?? true;
          return noTieneConversacionesActivas && agentActive;
        });

        setClientesDisponibles(clientesFiltrados);
        setEstadisticasFiltrado({
          totalClientes: data?.length || 0,
          clientesDisponibles: clientesFiltrados.length,
          clientesConConversacionesActivas: 0,
          clientesConAgenteDesactivado: 0
        });
      }
    } catch (error) {
      console.error('Error buscando clientes:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron buscar los clientes."
      });
      setClientesDisponibles([]);
      setEstadisticasFiltrado(null);
    } finally {
      setLoadingClientes(false);
    }
  };

  // Función para crear nueva conversación
  const crearNuevaConversacion = async () => {
    if (!clienteSeleccionado) return;

    setCreatingConversation(true);
    try {
      // Crear nueva conversación
      const { data: nuevaConversacion, error: conversacionError } = await supabase
        .from('chat_conversations')
        .insert({
          user_identifier: clienteSeleccionado.phone_number,
          client_id: clienteSeleccionado.id,
          dealership_id: dataToken.dealership_id,
          status: 'active',
          channel: 'whatsapp',
          messages: []
        } as any)
        .select()
        .single();

      if (conversacionError) throw conversacionError;

      // Cerrar modal y limpiar estado
      setShowNewConversationModal(false);
      setClienteSeleccionado(null);
      setBusquedaCliente("");
      
      // Recargar conversaciones
      await cargarConversaciones();

      // Seleccionar la nueva conversación
      if (nuevaConversacion) {
        const conversacionAdaptada: ConversacionItem = {
          id: (nuevaConversacion as any).id,
          user_identifier: (nuevaConversacion as any).user_identifier,
          client: {
            names: clienteSeleccionado.names,
            phone_number: clienteSeleccionado.phone_number,
            email: clienteSeleccionado.email
          },
          updated_at: (nuevaConversacion as any).created_at,
          status: 'active',
          channel: 'whatsapp'
        };
        onConversationSelect(conversacionAdaptada);
      }

      toast({
        title: "Conversación creada",
        description: `Nueva conversación iniciada con ${clienteSeleccionado.names}`
      });

    } catch (error) {
      console.error('Error creando conversación:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo crear la conversación. Intente nuevamente."
      });
    } finally {
      setCreatingConversation(false);
    }
  };

  // Filtrar clientes por búsqueda
  const clientesFiltrados = clientesDisponibles.filter(cliente =>
    cliente.names.toLowerCase().includes(busquedaCliente.toLowerCase()) ||
    (cliente.email && cliente.email.toLowerCase().includes(busquedaCliente.toLowerCase())) ||
    (cliente.phone_number && cliente.phone_number.includes(busquedaCliente))
  );

  // Hooks para actualización automática (después de definir cargarConversaciones)
  const { isPolling, isPaused } = useAutoPolling({
    interval: 15000,  // Reducir de 20s a 15s
    enabled: !!dataToken,  // Solo cuando hay token válido
    onPoll: cargarConversaciones
  });

  useEffect(() => {
    if (dataToken) {
      cargarConversaciones();
    }
  }, [dataToken, busqueda, filtroCanal, filtroRazonFinalizacion]);



  const formatDateTime = (conversacion: ConversacionItem) => {
    try {
      // ✅ USAR SOLO last_message_time (nunca updated_at del cron job)
      const dateString = conversacion.last_message_time;
      
      // Si no hay last_message_time, no hay mensajes → mostrar indicador
      if (!dateString) {
        return "Sin mensajes";
      }
      
      const fecha = typeof dateString === 'string' ? parseISO(dateString) : new Date(dateString);
      const ahora = new Date();
      
      // Obtener el inicio del día actual y del día anterior
      const inicioHoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
      const inicioAyer = new Date(inicioHoy);
      inicioAyer.setDate(inicioAyer.getDate() - 1);
      
      // Si es de hoy, mostrar solo la hora
      if (fecha >= inicioHoy) {
        return format(fecha, "HH:mm", { locale: es });
      }
      
      // Si es de ayer, mostrar "Ayer"
      if (fecha >= inicioAyer && fecha < inicioHoy) {
        return "Ayer";
      }
      
      // Si es anterior, mostrar solo la fecha (sin hora)
      return format(fecha, "dd/MM/yyyy", { locale: es });
    } catch (error) {
      return "Fecha inválida";
    }
  };

  const getCanalIcon = (channel?: string) => {
    switch (channel) {
      case 'phone':
        return <Phone className="h-4 w-4 mr-1 text-blue-500" />;
      case 'whatsapp':
        console.log('📱 Renderizando icono WhatsApp en lista de conversaciones');
        return <WhatsAppIcon className="h-4 w-4 mr-1 text-green-500" />;
      default:
        return <MessageSquare className="h-4 w-4 mr-1 text-green-500" />;
    }
  };

  const traducirRazonFinalizacion = (razon?: string) => {
    if (!razon) return '-';
    
    switch (razon) {
      case 'customer-ended-call': return 'Cliente finalizó la llamada';
      case 'assistant-ended-call': return 'Asistente finalizó la llamada';
      case 'silence-timed-out': return 'Tiempo de silencio agotado';
      case 'voicemail': return 'Buzón de voz';
      case 'assistant-forwarded-call': return 'Llamada transferida por asistente';
      default: return razon;
    }
  };

  // La paginación ahora se calcula en el cliente
  const totalPaginas = Math.ceil(totalConversaciones / ITEMS_PER_PAGE);
  const inicio = (pagina - 1) * ITEMS_PER_PAGE;
  const fin = inicio + ITEMS_PER_PAGE;
  const conversacionesEnPagina = conversaciones.slice(inicio, fin);

  return (
    <div className="h-full flex flex-col">
      {/* Header con título e indicadores de actualización */}
      <div className="p-4 border-b bg-white">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-xl font-bold">Lista de Conversaciones</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Todas las conversaciones del sistema
            </p>
          </div>
          
          {/* Indicadores de actualización automática */}
          <div className="flex items-center gap-2 flex-shrink-0 ml-4">
            {/* Botón Nueva Conversación estilo WhatsApp Web */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowNewConversationModal(true);
                setBusquedaCliente("");
                setClientesDisponibles([]);
                setEstadisticasFiltrado(null);
              }}
              className="h-8 w-8 p-0 hover:bg-gray-100"
            >
              <MessageCircle className="h-5 w-5" />
            </Button>
            
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="p-4 bg-white border-b space-y-3">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por usuario, cliente, teléfono o email..."
            className="pl-8 h-9"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
      </div>

      {/* Lista de Conversaciones */}
      <div className="flex-1 overflow-y-auto bg-white scrollbar-white">
        {loading ? (
          <div className="p-8 text-center">
            <p>Cargando conversaciones...</p>
          </div>
        ) : conversacionesEnPagina.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">No se encontraron conversaciones</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {conversacionesEnPagina.map((conversacion: ConversacionItem, index: number) => {
              const globalIndex = inicio + index;
              const isSelected = selectedConversationId === conversacion.id;
              
              // ✅ OPTIMIZACIÓN: Solo memoizar las primeras 30 conversaciones
              if (globalIndex < CONVERSACIONES_MEMOIZADAS) {
                return (
                  <MemoizedConversationItem
                    key={conversacion.id}
                    conversacion={conversacion}
                    isSelected={isSelected}
                    onSelect={() => onConversationSelect(conversacion)}
                    formatDateTime={formatDateTime}
                    getCanalIcon={getCanalIcon}
                    isConversationUnread={isConversationUnread}
                    truncateClientName={truncateClientName}
                    getFullClientName={getFullClientName}
                    traducirRazonFinalizacion={traducirRazonFinalizacion}
                  />
                );
              }
              
              // ✅ Resto de conversaciones sin memoización (menos críticas)
              return (
                <div
                  key={conversacion.id}
                  onClick={() => onConversationSelect(conversacion)}
                  className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                    isSelected ? 'bg-blue-50 border-r-4 border-blue-500' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      {/* Fila superior: Cliente y hora */}
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex-1 min-w-0 mr-2">
                          <div className="flex items-center gap-2">
                            <p 
                              className="font-medium text-sm truncate"
                              title={getFullClientName(conversacion.client?.names)}
                            >
                              {truncateClientName(conversacion.client?.names)}
                            </p>
                            {conversacion.client_agent_active === false && (
                              <span className="bg-orange-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold flex-shrink-0">
                                !
                              </span>
                            )}
                          </div>
                        </div>
                        <p className={`text-xs flex-shrink-0 ${isConversationUnread(conversacion) ? 'text-green-600 font-medium' : 'text-muted-foreground'}`}>
                          {formatDateTime(conversacion)}
                        </p>
                      </div>
                      
                      {/* Fila inferior: Usuario, canal e indicador de leído */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getCanalIcon(conversacion.channel)}
                          <p className="text-xs text-muted-foreground font-mono truncate">
                            {conversacion.user_identifier}
                          </p>
                        </div>
                        {isConversationUnread(conversacion) && (
                          <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0" />
                        )}
                      </div>
                     
                      {/* Razón de finalización si existe */}
                      {conversacion.ended_reason && (
                        <div className="mt-1">
                          <p className="text-xs text-muted-foreground">
                            {traducirRazonFinalizacion(conversacion.ended_reason)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Paginación */}
        {totalPaginas > 1 && (
          <div className="p-4 border-t bg-white">
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                {((pagina - 1) * ITEMS_PER_PAGE) + 1} a {Math.min(pagina * ITEMS_PER_PAGE, totalConversaciones)} de {totalConversaciones}
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagina(pagina - 1)}
                  disabled={pagina === 1}
                  className="h-7 text-xs"
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagina(pagina + 1)}
                  disabled={pagina === totalPaginas}
                  className="h-7 text-xs"
                >
                  Siguiente
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal Nueva Conversación */}
      <Dialog open={showNewConversationModal} onOpenChange={setShowNewConversationModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nueva conversación</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Búsqueda de clientes */}
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar cliente por nombre, email o teléfono..."
                className="pl-8"
                value={busquedaCliente}
                onChange={(e) => {
                  setBusquedaCliente(e.target.value);
                  buscarClientesDebounced(e.target.value);
                }}
              />
            </div>

            {/* Lista de clientes */}
            <div className="max-h-60 overflow-y-auto space-y-2 scrollbar-white">
              {loadingClientes ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="ml-2 text-sm text-muted-foreground">Cargando clientes...</span>
                </div>
              ) : clientesFiltrados.length === 0 ? (
                <div className="text-center py-4 space-y-2">
                  <div className="text-sm text-muted-foreground">
                    {busquedaCliente ? 'No se encontraron clientes disponibles' : 'Escribe para buscar clientes'}
                  </div>
                  <div className="text-xs text-muted-foreground bg-gray-50 p-3 rounded-lg">
                    <div className="font-medium mb-1">¿Por qué no aparecen todos los clientes?</div>
                    <ul className="text-left space-y-1">
                      <li>• Clientes con conversaciones activas</li>
                      <li>• Clientes con agente AI desactivado</li>
                      <li>• Clientes sin número de teléfono</li>
                    </ul>
                    {estadisticasFiltrado && (
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <div className="font-medium mb-1 text-left">Estadísticas:</div>
                        <div className="space-y-1 text-xs text-left">
                          <div>• Total clientes: {estadisticasFiltrado.totalClientes}</div>
                          <div>• Disponibles: {estadisticasFiltrado.clientesDisponibles}</div>
                          <div>• Con conversaciones activas: {estadisticasFiltrado.clientesConConversacionesActivas}</div>
                          <div>• Con agente desactivado: {estadisticasFiltrado.clientesConAgenteDesactivado}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                clientesFiltrados.map((cliente) => (
                  <div
                    key={cliente.id}
                    onClick={() => setClienteSeleccionado(cliente)}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      clienteSeleccionado?.id === cliente.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-medium text-sm">{cliente.names}</div>
                    {cliente.email && (
                      <div className="text-xs text-muted-foreground">{cliente.email}</div>
                    )}
                    {cliente.phone_number && (
                      <div className="text-xs text-muted-foreground">{cliente.phone_number}</div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowNewConversationModal(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={crearNuevaConversacion}
              disabled={!clienteSeleccionado || creatingConversation}
            >
              {creatingConversation ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creando...
                </>
              ) : (
                'Crear conversación'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ConversacionesListaPage() {
  const router = useRouter();
  const [searchParams, setSearchParams] = useState<URLSearchParams | null>(null);
  const [token, setToken] = useState<string>("");
  const [dataToken, setDataToken] = useState<any>(null);
  
  // Estado compartido para la conversación seleccionada
  const { selectedConversationId, selectConversation: originalSelectConversation } = useSelectedConversation();
  
  // Función adaptadora para convertir ConversacionItem a ConversacionAccionHumana
  const selectConversation = (conversation: ConversacionItem) => {
    // Crear un objeto compatible con ConversacionAccionHumana
    const adaptedConversation: ConversacionAccionHumana = {
      ...conversation,
      client_id: conversation.client ? 'temp-id' : null, // Placeholder
      dealership_id: dataToken?.dealership_id || '',
      channel: conversation.channel || 'whatsapp', // Default a 'whatsapp' si es undefined
      created_at: conversation.updated_at, // Usar updated_at como fallback
      hours_since_last_activity: 0, // Placeholder
      urgency_level: 'normal', // Placeholder
      total_count: 0 // Placeholder
    };
    originalSelectConversation(adaptedConversation);
  };

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
        
        if (
          !verifiedDataToken ||
          typeof verifiedDataToken !== "object" ||
          Object.keys(verifiedDataToken).length === 0 ||
          !(verifiedDataToken as any).dealership_id
        ) {
          router.push("/login");
          return;
        }
        
        setDataToken(verifiedDataToken || {});
      }
    }
  }, [searchParams, router]);

  const handleNavigateToClient = (clientId: string) => {
    router.push(`/backoffice/clientes/${clientId}?token=${token}`);
  };

  // No renderizar nada hasta que tengamos el token verificado
  if (!dataToken) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Verificando acceso...</p>
      </div>
    );
  }

  return (
    <WhatsAppStyleLayout
      conversationList={
        <ConversationList
          dataToken={dataToken}
          onConversationSelect={selectConversation}
          selectedConversationId={selectedConversationId}
        />
      }
      chatPanel={
        <ChatPanel
          conversationId={selectedConversationId}
          dataToken={dataToken}
          onNavigateToClient={handleNavigateToClient}
        />
      }
    />
  );
}

// Estilos CSS para scrollbar blanco
const scrollbarStyles = `
  .scrollbar-white::-webkit-scrollbar {
    width: 8px;
  }
  
  .scrollbar-white::-webkit-scrollbar-track {
    background: #ffffff;
  }
  
  .scrollbar-white::-webkit-scrollbar-thumb {
    background: #e5e7eb;
    border-radius: 4px;
  }
  
  .scrollbar-white::-webkit-scrollbar-thumb:hover {
    background: #d1d5db;
  }
`;

// Agregar estilos al head del documento
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = scrollbarStyles;
  document.head.appendChild(styleElement);
} 