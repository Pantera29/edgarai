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
  // Total count para paginación
  total_count: number;
}

interface MetricasAccionHumana {
  total_conversations: number;
  whatsapp_count: number;
  phone_count: number;
  urgent_count: number;
  normal_count: number;
  avg_hours_since_activity: number;
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
      return format(fecha, "dd/MM/yyyy HH:mm", { locale: es });
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
        return <Phone className="h-4 w-4 mr-1 text-blue-500" />;
      case 'whatsapp':
        return <MessageSquare className="h-4 w-4 mr-1 text-green-500" />;
      default:
        return <MessageSquare className="h-4 w-4 mr-1 text-gray-500" />;
    }
  };

  const totalPaginas = Math.ceil(totalConversaciones / ITEMS_PER_PAGE);

  return (
    <div className="px-4 py-6 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Conversaciones que Necesitan Acción</h1>
          <p className="text-muted-foreground mt-2">
            Conversaciones donde el agente está inactivo y requieren intervención humana
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => router.push(`/backoffice/conversaciones?token=${token}`)}
        >
          Ver Todas las Conversaciones
        </Button>
      </div>

      {/* Métricas */}
      {(() => { console.log('🔍 Estado de métricas:', { loadingMetricas, metricas, hasMetricas: !!metricas }); return null; })()}
      {!loadingMetricas && metricas && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="p-6">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="tracking-tight text-sm font-medium text-muted-foreground">
                Total que Necesitan Acción
              </h3>
              <div className="rounded-md bg-red-100 p-1">
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </div>
            </div>
            <div className="flex items-center">
              <div className="text-3xl font-bold">{metricas.total_conversations}</div>
            </div>
            <div className="mt-3">
              <p className="text-xs text-muted-foreground">
                <Users className="inline h-3 w-3 mr-1" />
                Requieren intervención humana
              </p>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="tracking-tight text-sm font-medium text-muted-foreground">
                Urgentes (≤24h)
              </h3>
              <div className="rounded-md bg-orange-100 p-1">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
              </div>
            </div>
            <div className="flex items-center">
              <div className="text-3xl font-bold text-orange-600">{metricas.urgent_count}</div>
            </div>
            <div className="mt-3">
              <p className="text-xs text-muted-foreground">
                <Clock className="inline h-3 w-3 mr-1" />
                Requieren atención inmediata
              </p>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="tracking-tight text-sm font-medium text-muted-foreground">
                Tiempo Promedio
              </h3>
              <div className="rounded-md bg-blue-100 p-1">
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </div>
            </div>
            <div className="flex items-center">
              <div className="text-3xl font-bold">{metricas.avg_hours_since_activity}h</div>
            </div>
            <div className="mt-3">
              <p className="text-xs text-muted-foreground">
                <Clock className="inline h-3 w-3 mr-1" />
                Desde última actividad
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <Card className="p-4 shadow-sm border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por usuario, cliente, teléfono o email..."
              className="pl-8"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
          
          <Select
            value={filtroCanal}
            onValueChange={setFiltroCanal}
          >
            <SelectTrigger>
              <SelectValue placeholder="Canal" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los canales</SelectItem>
              <SelectItem value="whatsapp">WhatsApp</SelectItem>
              <SelectItem value="phone">Llamadas</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filtroUrgencia}
            onValueChange={setFiltroUrgencia}
          >
            <SelectTrigger>
              <SelectValue placeholder="Urgencia" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas las urgencias</SelectItem>
              <SelectItem value="urgent">Urgentes (≤24h)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Tabla de Conversaciones */}
      <Card className="shadow-sm border-slate-200">
        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Urgencia</TableHead>
                <TableHead>Canal</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Identificador</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Tiempo Sin Actividad</TableHead>
                <TableHead>Última Actividad</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10">
                    Cargando conversaciones...
                  </TableCell>
                </TableRow>
              ) : conversaciones.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10">
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
                      {getUrgencyBadge(conversacion.urgency_level)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        {getCanalIcon(conversacion.channel)}
                        <span className="capitalize">{conversacion.channel}</span>
                      </div>
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
                      {getStatusBadge(conversacion.status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1 text-muted-foreground" />
                        <span className="text-sm">
                          {formatHoursAgo(conversacion.hours_since_last_activity)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {formatDateTime(conversacion.updated_at)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => verDetalle(conversacion.id)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver
                        </Button>
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