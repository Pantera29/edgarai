"use client";

import { useState, useEffect, useCallback, memo, useRef } from "react";
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
import { Eye, Search, MessageSquare, Phone, Loader2, CheckCircle } from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { getLastCustomerMessageTimestamp, isConversationUnread, truncateClientName, getFullClientName } from '@/utils/conversation-helpers';
import { useToast } from "@/hooks/use-toast";
import { useDebouncedCallback } from 'use-debounce';
import { useAutoPolling } from "@/hooks/useAutoPolling";
import { mergeConversationList } from "@/utils/conversation-merge";

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

// ✅ Cache mejorado con total_count (fuera del componente)
const conversationsCache = new Map<string, { data: ConversacionItem[], total: number, timestamp: number }>();
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
  
  const [isSearching, setIsSearching] = useState(false); // ✅ Indicador de búsqueda en progreso
  
  
  // Filtros
  const [busqueda, setBusqueda] = useState("");
  const [filtroCanal, setFiltroCanal] = useState("todos");

  const { toast } = useToast();

  // ✅ FASE 4.2: AbortController para cancelación de requests
  const abortControllerRef = useRef<AbortController | null>(null);

  // ✅ PASO 1.2: Paginación del servidor + Merge incremental
  const isInitialLoadRef = useRef(true);
  const cargarConversaciones = useCallback(async () => {
    // ✅ FASE 4.2: Cancelar request anterior si existe
    if (abortControllerRef.current) {
      console.log('🚫 Cancelando request anterior');
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    
    // ✅ Solo setLoading en carga inicial, no durante polling
    if (isInitialLoadRef.current) {
      setLoading(true);
      isInitialLoadRef.current = false;
    }
    try {
      // Detectar si hay filtros aplicados
      const sinFiltros = !busqueda && filtroCanal === 'todos';
      
      // Cache key ahora incluye la página
      const cacheKey = `human-action-${dataToken.dealership_id}-page-${pagina}-filters-${busqueda}-${filtroCanal}`;
      
      // 🚀 VERIFICAR CACHE solo si no hay filtros
      if (sinFiltros) {
        const cached = conversationsCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
          console.log('🚀 Cache hit - página', pagina);
          setConversaciones(cached.data);
          setTotalConversaciones(cached.total);
          setLoading(false);
          return; // ¡Salir temprano con cache!
        }
      }
      
      // 💾 Si no hay cache O hay filtros → usar RPC normal
      console.log(sinFiltros ? '💾 Cache miss - calculando datos frescos' : '🔍 Query con filtros - no cacheable');
      
      // ✅ NUEVO: Pasar parámetros de paginación
      const rpcParams = {
        p_dealership_id: dataToken.dealership_id,
        p_search_query: busqueda || null,
        p_channel_filter: filtroCanal === 'todos' ? null : filtroCanal,
        p_urgency_filter: 'all',
        p_limit_rows: ITEMS_PER_PAGE,
        p_offset_rows: (pagina - 1) * ITEMS_PER_PAGE
      } as any;

      console.log('🚀 Llamando a RPC con paginación:', { pagina, limit: ITEMS_PER_PAGE, offset: (pagina - 1) * ITEMS_PER_PAGE });
      
      // ✅ FASE 4.2: Supabase RPC no soporta signal directamente, pero la cancelación manual funciona
      const { data, error } = await supabase.rpc('get_conversations_needing_human_action', rpcParams) as {
        data: (ConversacionItem & { total_count: number })[] | null;
        error: any;
      };
      
      // Verificar si el request fue cancelado manualmente
      if (abortControllerRef.current?.signal.aborted) {
        throw new Error('AbortError');
      }
      
      if (error) {
        console.error("❌ Error en la llamada RPC:", JSON.stringify(error, null, 2));
        throw error;
      }

      console.log('✅ RPC exitosa.');
      console.log('📊 Conversaciones en página:', data?.length ?? 0);
      
      if (data && data.length > 0) {
        // ✅ NUEVO: Extraer total_count del primer elemento
        const totalCount = data[0]?.total_count || 0;
        console.log('📊 Total en base de datos:', totalCount);
        
        // ✅ NUEVO: Merge inteligente que compara timestamps
        setConversaciones(prev => {
          // Si es página 1 Y es carga inicial (no hay datos previos), reemplazar
          if (pagina === 1 && prev.length === 0) {
            console.log('🔄 [Acción Humana] Carga inicial - reemplazando array');
            return data;
          }
          
          // En cualquier otro caso, usar merge inteligente
          console.log('🔄 [Acción Humana] Polling - merge inteligente');
          return mergeConversationList(prev, data);
        });
        
        setTotalConversaciones(totalCount);
        
        // 💾 GUARDAR EN CACHE con total_count
        if (sinFiltros) {
          conversationsCache.set(cacheKey, {
            data: data,
            total: totalCount,
            timestamp: Date.now()
          });
          console.log('💾 Página guardada en cache:', pagina);
        }
      } else {
        console.log('📋 No se recibieron datos para esta página.');
        setConversaciones([]);
        setTotalConversaciones(0);
      }

    } catch (error: any) {
      // ✅ FASE 4.2: No loggear errores de cancelación
      if (error?.name !== 'AbortError') {
        console.error("❌ Error fatal en cargarConversaciones:", error);
      } else {
        console.log('🚫 Request cancelado correctamente');
      }
    } finally {
      setLoading(false);
    }
  }, [dataToken, busqueda, filtroCanal, pagina]);

  // ✅ FASE 4.1: Crear debounced después de definir la función
  const cargarConversacionesDebounced = useDebouncedCallback(
    async () => {
      setIsSearching(true);
      await cargarConversaciones();
      setIsSearching(false);
    },
    300
  );

  // ✅ FASE 3: Polling diferenciado (5s con conversación abierta, 10s sin) - estilo Kapso
  const getPollingInterval = useCallback(() => {
    // Si hay conversación seleccionada → polling más frecuente (5s)
    if (selectedConversationId) {
      console.log('🔄 Polling rápido: conversación activa (5s)');
      return 5000;
    }
    // Si no hay conversación → polling normal (10s)
    console.log('🔄 Polling normal: sin conversación activa (10s)');
    return 10000;
  }, [selectedConversationId]);

  const { isPolling, isPaused } = useAutoPolling({
    interval: 10000,  // ✅ Intervalo base ajustado a 10s (estilo Kapso)
    enabled: !!dataToken && !busqueda, // ✅ No hacer polling durante búsquedas
    onPoll: cargarConversaciones,
    dynamicInterval: getPollingInterval // ✅ Usar intervalo dinámico
  });

  // ✅ FASE 4.1: Debouncing correcto - solo para búsqueda, filtros inmediatos
  useEffect(() => {
    if (dataToken) {
      // Solo cargar inmediatamente si NO hay búsqueda (filtros o primera carga)
      if (!busqueda) {
        cargarConversaciones();
      }
      // Si hay búsqueda, el debounced se encarga automáticamente
    }
  }, [dataToken, filtroCanal]); // ✅ Quitar busqueda del deps

  // ✅ FASE 4.1: Effect separado para búsqueda con debouncing
  useEffect(() => {
    if (dataToken && busqueda) {
      cargarConversacionesDebounced();
    }
  }, [busqueda]); // ✅ Solo dependencia de busqueda



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

  // ✅ La paginación viene del servidor, no hace falta slice
  const totalPaginas = Math.ceil(totalConversaciones / ITEMS_PER_PAGE);
  const conversacionesEnPagina = conversaciones; // Ya vienen paginadas del servidor

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
          {/* ✅ Indicador visual de búsqueda en progreso */}
          {isSearching && (
            <div className="absolute right-2 top-2.5 h-4 w-4 animate-spin border-2 border-blue-500 border-t-transparent rounded-full" />
          )}
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
            <div className="flex flex-col items-center space-y-2">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <p className="text-muted-foreground">¡Excelente! No hay conversaciones que necesiten acción humana.</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {conversacionesEnPagina.map((conversacion: ConversacionItem, index: number) => {
              const isSelected = selectedConversationId === conversacion.id;
              
              // ✅ OPTIMIZACIÓN: Solo memoizar conversaciones de la primera página (más críticas)
              if (pagina === 1 && index < CONVERSACIONES_MEMOIZADAS) {
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
                Página {pagina} de {totalPaginas} ({totalConversaciones} conversaciones totales)
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

export default function ConversacionesAccionHumanaPage() {
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
