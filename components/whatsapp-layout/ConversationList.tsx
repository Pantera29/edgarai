"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  AlertTriangle, 
  Clock, 
  CheckCircle
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { isConversationUnread, getLastCustomerMessageTimestamp, truncateClientName, getFullClientName } from '@/utils/conversation-helpers';

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
  // Información del cliente
  client_names?: string;
  client_email?: string;
  client_phone?: string;
  client_agent_active?: boolean;
  // Métricas de urgencia
  hours_since_last_activity: number;
  urgency_level: 'urgent' | 'normal';
  // Campos para indicadores de mensajes no leídos
  messages?: Array<{
    id?: string;
    content?: string;
    role?: string;
    created_at?: string;
    timestamp?: string;
    time?: string;
  }>;
  last_read_at?: string | null;
  // Campo para el último mensaje (nuevo desde la función RPC)
  last_message_time?: string | null;
  // Total count para paginación
  total_count: number;
}

interface MetricasAccionHumana {
  total_conversations: number;
  whatsapp_count: number;
  phone_count: number;
  urgent_count: number;
  normal_count: number;
  urgency_distribution: {
    urgent: number;
    normal: number;
  };
}

interface ConversationListProps {
  dataToken: { dealership_id: string };
  onConversationSelect: (conversation: ConversacionAccionHumana) => void;
  selectedConversationId?: string;
}

// Sin paginación para acción humana - cargar todas las conversaciones

export function ConversationList({ dataToken, onConversationSelect, selectedConversationId }: ConversationListProps) {
  const [conversaciones, setConversaciones] = useState<ConversacionAccionHumana[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalConversaciones, setTotalConversaciones] = useState(0);
  const [metricas, setMetricas] = useState<MetricasAccionHumana | null>(null);
  const [loadingMetricas, setLoadingMetricas] = useState(true);
  
  // Filtros
  const [busqueda, setBusqueda] = useState("");
  const [filtroCanal, setFiltroCanal] = useState("todos");
  const [filtroNoLeidos, setFiltroNoLeidos] = useState(false);
  
  // Estados para actualización automática
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);

  useEffect(() => {
    if (dataToken) {
      cargarMetricas();
      cargarConversaciones();
    }
  }, [dataToken, busqueda, filtroCanal, filtroNoLeidos]);

  // Hook para actualización automática cada 20 segundos
  useEffect(() => {
    if (!dataToken) return;
    
    const interval = setInterval(async () => {
      setIsUpdating(true);
      
      try {
        // Actualizar métricas y conversaciones en background
        await Promise.all([
          cargarMetricas(),
          cargarConversaciones()
        ]);
        setLastUpdateTime(new Date());
      } catch (error) {
        console.error('Error en actualización automática:', error);
      } finally {
        setIsUpdating(false);
      }
    }, 20000); // 20 segundos
    
    return () => clearInterval(interval);
  }, [dataToken]);

  const cargarMetricas = async () => {
    setLoadingMetricas(true);
    try {
      console.log('🔄 Cargando métricas de acción humana...');
      
      const { data, error } = await (supabase.rpc as any)('get_human_action_metrics', {
        p_dealership_id: dataToken.dealership_id
      }) as { data: MetricasAccionHumana | null; error: any };
      
      if (error) {
        console.error("❌ Error cargando métricas:", error);
        throw error;
      }

      if (!data) {
        console.error("❌ No se obtuvieron métricas");
        return;
      }

      console.log('✅ Métricas cargadas:', data);
      setMetricas(data);
      
    } catch (error) {
      console.error("❌ Error fatal cargando métricas:", error);
    } finally {
      setLoadingMetricas(false);
    }
  };

  const cargarConversaciones = async () => {
    setLoading(true);
    try {
      console.log('🔄 Cargando conversaciones que necesitan acción...');
      
      const rpcParams = {
        p_dealership_id: dataToken.dealership_id,
        p_channel_filter: filtroCanal === "todos" ? null : filtroCanal,
        p_urgency_filter: 'all', // Siempre cargar todas las conversaciones
        p_search_query: busqueda || null,
        p_limit_rows: 1000, // Cargar todas las conversaciones
        p_offset_rows: 0
      };

      console.log('🚀 Llamando a get_conversations_needing_human_action con:', rpcParams);
      
      const { data, error } = await (supabase.rpc as any)('get_conversations_needing_human_action', rpcParams) as { data: ConversacionAccionHumana[] | null; error: any };
      
      if (error) {
        console.error("❌ Error en la llamada RPC:", error);
        throw error;
      }

      if (!data) {
        console.error("❌ No se obtuvieron conversaciones");
        setConversaciones([]);
        setTotalConversaciones(0);
        return;
      }

      console.log('✅ Conversaciones cargadas:', data.length);
      
      if (data.length > 0) {
        // Aplicar filtro de no leídos en el cliente si está activo
        let conversacionesFiltradas = data;
        if (filtroNoLeidos) {
          conversacionesFiltradas = data.filter((conversacion: ConversacionAccionHumana) => isConversationUnread(conversacion));
        }
        
        setConversaciones(conversacionesFiltradas);
        setTotalConversaciones(conversacionesFiltradas.length);
      } else {
        setConversaciones([]);
        setTotalConversaciones(0);
      }

    } catch (error) {
      console.error("❌ Error fatal cargando conversaciones:", error);
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyBadge = (urgencyLevel: string) => {
    switch (urgencyLevel) {
      case "critical":
      case "very_urgent":
      case "urgent":
        return <Badge className="bg-orange-500 text-white text-xs"><AlertTriangle className="h-3 w-3 mr-1" />Urgente</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs"><Clock className="h-3 w-3 mr-1" />Normal</Badge>;
    }
  };

  const formatDateTime = (conversacion: ConversacionAccionHumana) => {
    try {
      // Usar el nuevo campo last_message_time de la función RPC
      let dateString = conversacion.last_message_time || conversacion.updated_at;
      
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

  const limpiarFiltros = () => {
    setBusqueda("");
    setFiltroCanal("todos");
    setFiltroNoLeidos(false);
  };

  const filtrarNoLeidos = () => {
    setBusqueda("");
    setFiltroCanal("todos");
    setFiltroNoLeidos(true);
  };





  return (
    <div className="h-full flex flex-col">
      {/* Header con título e indicadores de actualización */}
      <div className="p-4 border-b bg-white">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-xl font-bold">Conversaciones que Necesitan Atención</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Conversaciones donde el agente está inactivo
            </p>
          </div>
          
        </div>
      </div>

      {/* Métricas en formato cápsula */}
      {!loadingMetricas && metricas && (
        <div className="p-4 bg-white border-b">
          <div className="flex flex-wrap gap-2">
            {/* Cápsula Total - Clickeable para limpiar filtros */}
            <button 
              onClick={limpiarFiltros}
              className={`inline-flex items-center px-3 py-1.5 rounded-full transition-all duration-200 hover:scale-105 text-xs ${
                busqueda === "" && filtroCanal === "todos" && !filtroNoLeidos
                  ? "bg-gray-100 border-2 border-gray-300 shadow-md"
                  : "bg-gray-50 border border-gray-200 hover:bg-gray-100"
              }`}
            >
              <div className="flex items-center space-x-1">
                <div className="rounded-full bg-gray-100 p-0.5">
                  <AlertTriangle className="h-3 w-3 text-gray-600" />
                </div>
                <span className="font-medium text-gray-900">Total: {metricas.total_conversations}</span>
              </div>
            </button>

            {/* Cápsula No Leídos - Clickeable para filtrar no leídos */}
            <button 
              onClick={filtrarNoLeidos}
              className={`inline-flex items-center px-3 py-1.5 rounded-full transition-all duration-200 hover:scale-105 text-xs ${
                filtroNoLeidos && busqueda === "" && filtroCanal === "todos"
                  ? "bg-green-100 border-2 border-green-300 shadow-md"
                  : "bg-green-50 border border-green-200 hover:bg-green-100"
              }`}
            >
              <div className="flex items-center space-x-1">
                <div className="rounded-full bg-green-100 p-0.5">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                </div>
                <span className="font-medium text-green-900">No leídos: {conversaciones.filter((c: ConversacionAccionHumana) => isConversationUnread(c)).length}</span>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="p-4 bg-white border-b">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por usuario, cliente, teléfono..."
            className="pl-8 h-9"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
      </div>

      {/* Lista de Conversaciones */}
      <div className="flex-1 overflow-y-auto bg-white conversation-scrollbar">
        {loading ? (
          <div className="p-8 text-center">
            <p>Cargando conversaciones...</p>
          </div>
        ) : conversaciones.length === 0 ? (
          <div className="p-8 text-center">
            <div className="flex flex-col items-center space-y-2">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <p className="text-muted-foreground">¡Excelente! No hay conversaciones que necesiten acción humana.</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {conversaciones.map((conversacion) => (
              <div
                key={conversacion.id}
                onClick={() => onConversationSelect(conversacion)}
                className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                  selectedConversationId === conversacion.id ? 'bg-blue-50 border-r-4 border-blue-500' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    {/* Fila superior: Cliente y hora */}
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex-1 min-w-0 mr-2">
                        <p 
                          className="font-medium text-sm truncate"
                          title={getFullClientName(conversacion.client_names)}
                        >
                          {truncateClientName(conversacion.client_names)}
                        </p>
                      </div>
                      <p className={`text-xs flex-shrink-0 ${isConversationUnread(conversacion as any) ? 'text-green-600 font-medium' : 'text-muted-foreground'}`}>
                        {formatDateTime(conversacion)}
                      </p>
                    </div>
                    
                    {/* Fila inferior: Usuario e indicador de leído */}
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground font-mono truncate">
                        {conversacion.user_identifier}
                      </p>
                      {isConversationUnread(conversacion as any) && (
                        <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}


      </div>
    </div>
  );
}
