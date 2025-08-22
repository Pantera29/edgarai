"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Search, 
  AlertTriangle, 
  Clock, 
  Loader2,
  MoreHorizontal,
  RotateCcw,
  CheckCircle
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { isConversationUnread, getLastCustomerMessageTimestamp } from '@/utils/conversation-helpers';

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
  messages?: any[];
  last_read_at?: string | null;
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
  dataToken: any;
  onConversationSelect: (conversation: ConversacionAccionHumana) => void;
  selectedConversationId?: string;
}

const ITEMS_PER_PAGE = 20;

export function ConversationList({ dataToken, onConversationSelect, selectedConversationId }: ConversationListProps) {
  const [conversaciones, setConversaciones] = useState<ConversacionAccionHumana[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalConversaciones, setTotalConversaciones] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [metricas, setMetricas] = useState<MetricasAccionHumana | null>(null);
  const [loadingMetricas, setLoadingMetricas] = useState(true);
  
  // Filtros
  const [busqueda, setBusqueda] = useState("");
  const [filtroCanal, setFiltroCanal] = useState("todos");
  const [filtroUrgencia, setFiltroUrgencia] = useState("todas");
  
  // Estado para reactivación de agentes
  const [reactivatingAgents, setReactivatingAgents] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (dataToken) {
      cargarMetricas();
      cargarConversaciones();
    }
  }, [dataToken, busqueda, filtroCanal, filtroUrgencia, pagina]);

  const cargarMetricas = async () => {
    setLoadingMetricas(true);
    try {
      console.log('🔄 Cargando métricas de acción humana...');
      
      const { data, error } = await supabase.rpc('get_human_action_metrics', {
        p_dealership_id: dataToken.dealership_id
      });
      
      if (error) {
        console.error("❌ Error cargando métricas:", error);
        throw error;
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
        p_urgency_filter: filtroUrgencia === "todas" ? 'all' : filtroUrgencia,
        p_search_query: busqueda || null,
        p_limit_rows: ITEMS_PER_PAGE,
        p_offset_rows: (pagina - 1) * ITEMS_PER_PAGE
      };

      console.log('🚀 Llamando a get_conversations_needing_human_action con:', rpcParams);
      
      const { data, error } = await supabase.rpc('get_conversations_needing_human_action', rpcParams);
      
      if (error) {
        console.error("❌ Error en la llamada RPC:", error);
        throw error;
      }

      console.log('✅ Conversaciones cargadas:', data?.length || 0);
      
      if (data && data.length > 0) {
        setConversaciones(data);
        setTotalConversaciones(data[0].total_count || 0);
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

  const formatDateTime = (dateString: string) => {
    try {
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
    setFiltroUrgencia("todas");
    setPagina(1);
  };

  const filtrarUrgentes = () => {
    setBusqueda("");
    setFiltroCanal("todos");
    setFiltroUrgencia("urgent");
    setPagina(1);
  };

  const reactivarAgente = async (clientId: string, clientName: string) => {
    if (!clientId) {
      console.log('❌ No se puede reactivar: client_id no disponible');
      return;
    }

    console.log('🔄 Iniciando reactivación de agente para:', clientName);
    
    // Agregar a la lista de agentes siendo reactivados
    setReactivatingAgents(prev => new Set(prev).add(clientId));

    try {
      const response = await fetch('/api/clients/reactivate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ client_id: clientId }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.log('❌ Error reactivando agente:', result.error);
        alert(`Error reactivando agente: ${result.error}`);
        return;
      }

      console.log('✅ Agente reactivado exitosamente:', result);
      alert(`Agente reactivado exitosamente para ${clientName}`);
      
      // Recargar la lista de conversaciones
      await cargarConversaciones();
      
    } catch (error) {
      console.log('❌ Error inesperado reactivando agente:', error);
      alert('Error inesperado reactivando agente');
    } finally {
      // Remover de la lista de agentes siendo reactivados
      setReactivatingAgents(prev => {
        const newSet = new Set(prev);
        newSet.delete(clientId);
        return newSet;
      });
    }
  };

  const totalPaginas = Math.ceil(totalConversaciones / ITEMS_PER_PAGE);

  return (
    <div className="h-full flex flex-col">
      {/* Header con título */}
      <div className="p-4 border-b bg-white">
        <div>
          <h1 className="text-xl font-bold">Conversaciones que Necesitan Atención</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Conversaciones donde el agente está inactivo
          </p>
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
                busqueda === "" && filtroCanal === "todos" && filtroUrgencia === "todas"
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

            {/* Cápsula Urgentes - Clickeable para filtrar urgentes */}
            <button 
              onClick={filtrarUrgentes}
              className={`inline-flex items-center px-3 py-1.5 rounded-full transition-all duration-200 hover:scale-105 text-xs ${
                filtroUrgencia === "urgent" && busqueda === "" && filtroCanal === "todos"
                  ? "bg-orange-100 border-2 border-orange-300 shadow-md"
                  : "bg-orange-50 border border-orange-200 hover:bg-orange-100"
              }`}
            >
              <div className="flex items-center space-x-1">
                <div className="rounded-full bg-orange-100 p-0.5">
                  <Clock className="h-3 w-3 text-orange-600" />
                </div>
                <span className="font-medium text-orange-900">Urgentes: {metricas.urgent_count}</span>
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
      <div className="flex-1 overflow-y-auto bg-white">
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
                    {/* Fila superior: Cliente y urgencia */}
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate">
                          {conversacion.client_names || 'Sin cliente'}
                        </p>
                        {isConversationUnread(conversacion) && (
                          <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0" />
                        )}
                      </div>
                      {getUrgencyBadge(conversacion.urgency_level)}
                    </div>
                    
                    {/* Fila inferior: Usuario y timestamp */}
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground font-mono truncate">
                        {conversacion.user_identifier}
                      </p>
                      <p className={`text-xs ${isConversationUnread(conversacion) ? 'text-green-600 font-medium' : 'text-muted-foreground'}`}>
                        {formatDateTime(getLastCustomerMessageTimestamp(conversacion.messages || [])?.toISOString() || conversacion.updated_at)}
                      </p>
                    </div>
                  </div>
                  
                  {/* Menú de acciones */}
                  {conversacion.client_id && (
                    <div className="ml-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => reactivarAgente(conversacion.client_id!, conversacion.client_names || 'Cliente')}
                            disabled={reactivatingAgents.has(conversacion.client_id!)}
                          >
                            {reactivatingAgents.has(conversacion.client_id!) ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <RotateCcw className="h-4 w-4 mr-2" />
                            )}
                            Reactivar agente
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
                </div>
              </div>
            ))}
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
    </div>
  );
}
