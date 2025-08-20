"use client";

import { useState, useEffect } from "react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Eye, 
  Search, 
  MessageSquare, 
  Phone, 
  AlertTriangle, 
  Clock, 
  Users, 
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  RotateCcw,
  Loader2
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { isConversationUnread, getLastCustomerMessageTimestamp } from '@/utils/conversation-helpers';

// Componente de icono de WhatsApp (SVG)
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

const ITEMS_PER_PAGE = 20;

export default function ConversacionesAccionHumanaPage() {
  const router = useRouter();
  const [searchParams, setSearchParams] = useState<URLSearchParams | null>(null);
  const [token, setToken] = useState<string>("");
  const [dataToken, setDataToken] = useState<any>(null);
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
        return <Badge className="bg-orange-500 text-white"><AlertTriangle className="h-3 w-3 mr-1" />Urgente</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Normal</Badge>;
    }
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

  const formatHoursAgo = (hours: number) => {
    if (hours < 1) {
      const minutes = Math.round(hours * 60);
      return `${minutes} min`;
    } else if (hours < 24) {
      return `${Math.round(hours)}h`;
    } else {
      const days = Math.round(hours / 24);
      return `${days}d`;
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

  const verDetalle = (id: string) => {
    router.push(`/backoffice/conversaciones/${id}?token=${token}&from=accion-humana`);
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
        // Aquí podrías mostrar un toast de error
        alert(`Error reactivando agente: ${result.error}`);
        return;
      }

      console.log('✅ Agente reactivado exitosamente:', result);
      
      // Mostrar toast de éxito
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

  const getCanalIcon = (channel?: string) => {
    switch (channel) {
      case 'phone':
        return <Phone className="h-4 w-4 text-blue-500" />;
      case 'whatsapp':
        return <WhatsAppIcon className="h-4 w-4 text-green-500" />;
      default:
        return <MessageSquare className="h-4 w-4 text-gray-500" />;
    }
  };

  const totalPaginas = Math.ceil(totalConversaciones / ITEMS_PER_PAGE);

  return (
    <div className="px-4 py-6 space-y-6">
      <div className="mb-6">
        <div>
          <h1 className="text-3xl font-bold">Conversaciones que Necesitan Atención</h1>
          <p className="text-muted-foreground mt-2">
            Conversaciones donde el agente está inactivo y requieren intervención del equipo de atención.
          </p>
        </div>
      </div>

      {/* Métricas en formato cápsula */}
      {(() => { console.log('🔍 Estado de métricas:', { loadingMetricas, metricas, hasMetricas: !!metricas }); return null; })()}
      {!loadingMetricas && metricas && (
        <div className="flex flex-wrap gap-3 mb-6">
          {/* Cápsula Total - Clickeable para limpiar filtros */}
          <button 
            onClick={limpiarFiltros}
            className={`inline-flex items-center px-4 py-2 rounded-full transition-all duration-200 hover:scale-105 hover:shadow-md ${
              busqueda === "" && filtroCanal === "todos" && filtroUrgencia === "todas"
                ? "bg-red-100 border-2 border-red-300 shadow-md"
                : "bg-red-50 border border-red-200 hover:bg-red-100"
            }`}
          >
            <div className="flex items-center space-x-2">
              <div className="rounded-full bg-red-100 p-1">
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-red-900">Total que necesitan atención:</span>
                <span className="text-lg font-bold text-red-700">{metricas.total_conversations}</span>
              </div>
            </div>
          </button>

          {/* Cápsula Urgentes - Clickeable para filtrar urgentes */}
          <button 
            onClick={filtrarUrgentes}
            className={`inline-flex items-center px-4 py-2 rounded-full transition-all duration-200 hover:scale-105 hover:shadow-md ${
              filtroUrgencia === "urgent" && busqueda === "" && filtroCanal === "todos"
                ? "bg-orange-100 border-2 border-orange-300 shadow-md"
                : "bg-orange-50 border border-orange-200 hover:bg-orange-100"
            }`}
          >
            <div className="flex items-center space-x-2">
              <div className="rounded-full bg-orange-100 p-1">
                <Clock className="h-4 w-4 text-orange-600" />
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-orange-900">Urgentes (≤24h):</span>
                <span className="text-lg font-bold text-orange-700">{metricas.urgent_count}</span>
              </div>
            </div>
          </button>
        </div>
      )}

      {/* Filtros */}
      <Card className="p-4 shadow-sm border-slate-200">
        <div className="relative max-w-md">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por usuario, cliente, teléfono o email..."
            className="pl-8"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
      </Card>

      {/* Tabla de Conversaciones */}
      <Card className="shadow-sm border-slate-200">
        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Canal</TableHead>
                <TableHead>Urgencia</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Identificador</TableHead>
                <TableHead>Última Actividad</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10">
                    Cargando conversaciones...
                  </TableCell>
                </TableRow>
              ) : conversaciones.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10">
                    <div className="flex flex-col items-center space-y-2">
                      <CheckCircle className="h-8 w-8 text-green-500" />
                      <p className="text-muted-foreground">¡Excelente! No hay conversaciones que necesiten acción humana.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                conversaciones.map((conversacion) => (
                  <TableRow key={conversacion.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="flex items-center justify-center">
                        {getCanalIcon(conversacion.channel)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getUrgencyBadge(conversacion.urgency_level)}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {conversacion.client_names || 'Sin cliente'}
                        </div>
                        {conversacion.client_phone && (
                          <div className="text-sm text-muted-foreground">
                            {conversacion.client_phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-mono text-sm">
                        {conversacion.user_identifier}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {formatDateTime(getLastCustomerMessageTimestamp(conversacion.messages || [])?.toISOString() || conversacion.updated_at)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <div className="flex items-center gap-2">
                          {isConversationUnread(conversacion) && (
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => verDetalle(conversacion.id)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Ver
                          </Button>
                        </div>
                        {conversacion.client_id && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => reactivarAgente(conversacion.client_id!, conversacion.client_names || 'Cliente')}
                            disabled={reactivatingAgents.has(conversacion.client_id!)}
                          >
                            {reactivatingAgents.has(conversacion.client_id!) ? (
                              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            ) : (
                              <RotateCcw className="h-4 w-4 mr-1" />
                            )}
                            Reactivar
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Paginación */}
        {totalPaginas > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <div className="text-sm text-muted-foreground">
              Mostrando {((pagina - 1) * ITEMS_PER_PAGE) + 1} a {Math.min(pagina * ITEMS_PER_PAGE, totalConversaciones)} de {totalConversaciones} conversaciones
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagina(pagina - 1)}
                disabled={pagina === 1}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagina(pagina + 1)}
                disabled={pagina === totalPaginas}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
} 