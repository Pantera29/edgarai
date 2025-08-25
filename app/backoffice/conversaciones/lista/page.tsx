"use client";

import { useState, useEffect, useCallback } from "react";
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
import { WhatsAppStyleLayout } from "@/components/whatsapp-layout/WhatsAppStyleLayout";
import { ChatPanel } from "@/components/whatsapp-layout/ChatPanel";
import { useSelectedConversation } from "@/hooks/useSelectedConversation";
import { Eye, Search, MessageSquare, Phone } from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { getLastCustomerMessageTimestamp, isConversationUnread, truncateClientName, getFullClientName } from '@/utils/conversation-helpers';

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
}

const ITEMS_PER_PAGE = 10;

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
const CACHE_TTL = 2 * 60 * 1000; // 2 minutos

// Hook para actualización silenciosa con indicadores visuales
const useSilentUpdates = (dataToken: { dealership_id: string }, cargarConversaciones: () => Promise<void>) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  
  useEffect(() => {
    if (!dataToken) return;
    
    const interval = setInterval(async () => {
      setIsUpdating(true);
      
      try {
        // Actualizar en background
        await cargarConversaciones();
        setLastUpdateTime(new Date());
      } catch (error) {
        console.error('Error en actualización automática:', error);
      } finally {
        setIsUpdating(false);
      }
    }, 20000); // 20 segundos
    
    return () => clearInterval(interval);
  }, [dataToken, cargarConversaciones]);
  
  return { isUpdating, lastUpdateTime };
};

// Hook para actualización inteligente solo de cambios
const useSmartPolling = (dataToken: { dealership_id: string }, setConversaciones: React.Dispatch<React.SetStateAction<ConversacionItem[]>>) => {
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  
  useEffect(() => {
    if (!dataToken) return;
    
    const interval = setInterval(async () => {
      try {
        // Usar la función existente get_filtered_conversations para obtener todas las conversaciones
        // y luego comparar con las existentes para detectar cambios
        const { data, error } = await supabase.rpc('get_filtered_conversations', {
          dealership_id_param: dataToken.dealership_id,
          search_query: null,
          p_status_filter: 'todos',
          channel_filter: 'todos',
          ended_reason_filter: 'todas'
        });
        
        if (error) {
          console.error('Error en polling inteligente:', error);
          return;
        }
        
        if (data && data.length > 0) {
          console.log('🔄 Verificando cambios en conversaciones...');
          
          // Actualizar las conversaciones existentes
          setConversaciones(prev => {
            const updated = [...prev];
            let hasChanges = false;
            
            data.forEach((newConv: ConversacionItem) => {
              const index = updated.findIndex((c: ConversacionItem) => c.id === newConv.id);
              if (index >= 0) {
                // Verificar si la conversación cambió
                const oldConv = updated[index];
                if (JSON.stringify(oldConv) !== JSON.stringify(newConv)) {
                  updated[index] = newConv;
                  hasChanges = true;
                }
              } else {
                // Nueva conversación - agregar al inicio
                updated.unshift(newConv);
                hasChanges = true;
              }
            });
            
            if (hasChanges) {
              console.log('🔄 Se detectaron cambios en las conversaciones');
            }
            
            return updated;
          });
        }
        
        setLastUpdate(new Date());
      } catch (error) {
        console.error('Error en polling inteligente:', error);
      }
    }, 20000); // 20 segundos
    
    return () => clearInterval(interval);
  }, [dataToken, setConversaciones, lastUpdate]);
};

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
  
  // Filtros
  const [busqueda, setBusqueda] = useState("");
  const [filtroCanal, setFiltroCanal] = useState("todos");
  const [filtroRazonFinalizacion, setFiltroRazonFinalizacion] = useState("todas");

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
      };

      console.log('🚀 Llamando a la función RPC get_filtered_conversations con los parámetros:', rpcParams);
      
      // ✅ MANTENER RPC existente - no cambiar nada aquí
      const { data, error } = await supabase.rpc('get_filtered_conversations', rpcParams);
      
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

  // Hooks para actualización automática (después de definir cargarConversaciones)
  const { isUpdating, lastUpdateTime } = useSilentUpdates(dataToken, cargarConversaciones);
  useSmartPolling(dataToken, setConversaciones);

  useEffect(() => {
    if (dataToken) {
      cargarConversaciones();
    }
  }, [dataToken, busqueda, filtroCanal, filtroRazonFinalizacion]);



  const formatDateTime = (conversacion: ConversacionItem) => {
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
            {isUpdating && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                Actualizando...
              </div>
            )}
            
            {lastUpdateTime && !isUpdating && (
              <div className="text-xs text-muted-foreground text-right">
                Últ. actualización: {format(lastUpdateTime, 'HH:mm')}
              </div>
            )}
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
        
                 <div className="grid grid-cols-2 gap-2">
           <Select
             value={filtroCanal}
             onValueChange={setFiltroCanal}
           >
             <SelectTrigger className="h-9 text-xs">
               <SelectValue placeholder="Canal" />
             </SelectTrigger>
             <SelectContent>
               <SelectItem value="todos">Todos</SelectItem>
               <SelectItem value="whatsapp">WhatsApp</SelectItem>
               <SelectItem value="phone">Llamadas</SelectItem>
             </SelectContent>
           </Select>

           <Select
             value={filtroRazonFinalizacion}
             onValueChange={setFiltroRazonFinalizacion}
           >
             <SelectTrigger className="h-9 text-xs">
               <SelectValue placeholder="Razón" />
             </SelectTrigger>
             <SelectContent>
               <SelectItem value="todas">Todas</SelectItem>
               <SelectItem value="customer-ended-call">Cliente finalizó</SelectItem>
               <SelectItem value="assistant-ended-call">Asistente finalizó</SelectItem>
               <SelectItem value="silence-timed-out">Silencio</SelectItem>
               <SelectItem value="voicemail">Buzón de voz</SelectItem>
               <SelectItem value="assistant-forwarded-call">Transferida</SelectItem>
             </SelectContent>
           </Select>
         </div>
      </div>

      {/* Lista de Conversaciones */}
      <div className="flex-1 overflow-y-auto bg-white">
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
            {conversacionesEnPagina.map((conversacion: ConversacionItem) => (
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
                           title={getFullClientName(conversacion.client?.names)}
                         >
                           {truncateClientName(conversacion.client?.names)}
                         </p>
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