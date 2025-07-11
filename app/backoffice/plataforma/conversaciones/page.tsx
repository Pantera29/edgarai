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
import { Eye, Search, MessageSquare, Phone } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { es } from "date-fns/locale";
import AdminConversationEvaluationDropdown from "@/components/plataforma/admin-conversation-evaluation-dropdown";
import AdminConversationTagsInput from "@/components/plataforma/admin-conversation-tags-input";
import AdminConversationCommentsModal from "@/components/plataforma/admin-conversation-comments-modal";

// UUID de la agencia autorizada para plataforma
const PLATFORM_AGENCY_ID = '6b58f82d-baa6-44ce-9941-1a61975d20b5';

interface AdminConversation {
  id: string;
  user_identifier: string;
  dealership_id: string;
  dealership_name: string;
  client_names?: string;
  client_phone?: string;
  channel: string;
  status: string;
  created_at: string;
  updated_at: string;
  duration_seconds?: number;
  evaluation_status: 'pending' | 'successful' | 'unsuccessful';
  evaluation_tags: string[];
  admin_comments?: string | null;
  evaluated_by?: string;
  evaluated_at?: string;
}

const ITEMS_PER_PAGE = 20;

export default function PlataformaConversacionesPage() {
  const router = useRouter();
  const [searchParams, setSearchParams] = useState<URLSearchParams | null>(null);
  const [token, setToken] = useState<string>("");
  const [dataToken, setDataToken] = useState<any>(null);
  const [conversaciones, setConversaciones] = useState<AdminConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalConversaciones, setTotalConversaciones] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [dealerships, setDealerships] = useState<{id: string, name: string}[]>([]);
  
  // Filtros
  const [busqueda, setBusqueda] = useState("");
  const [filtroAgencia, setFiltroAgencia] = useState("todas");
  const [filtroCanal, setFiltroCanal] = useState("todos");
  const [filtroEvaluacion, setFiltroEvaluacion] = useState("todas");

  const [availableTags, setAvailableTags] = useState<string[]>([]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setSearchParams(params);
    }
  }, []);

  useEffect(() => {
    console.log('🔄 Verificando autenticación...');
    if (searchParams) {
      const tokenValue = searchParams.get("token");
      console.log('🔍 Token encontrado:', !!tokenValue);
      
      if (tokenValue) {
        setToken(tokenValue);
        const verifiedDataToken = verifyToken(tokenValue);
        console.log('🔍 Token verificado:', !!verifiedDataToken);
        console.log('🔍 Datos del token:', verifiedDataToken);
        
        if (
          !verifiedDataToken ||
          typeof verifiedDataToken !== "object" ||
          Object.keys(verifiedDataToken).length === 0 ||
          !(verifiedDataToken as any).dealership_id
        ) {
          console.log('❌ Token inválido, redirigiendo a login');
          router.push("/login");
          return;
        }

        // Verificar que es la agencia autorizada para plataforma
        console.log('🔍 Verificando dealership_id:', verifiedDataToken.dealership_id);
        console.log('🔍 PLATFORM_AGENCY_ID:', PLATFORM_AGENCY_ID);
        
        if (verifiedDataToken.dealership_id !== PLATFORM_AGENCY_ID) {
          console.log('❌ No es la agencia autorizada, redirigiendo');
          router.push(`/backoffice?token=${tokenValue}`);
          return;
        }
        
        console.log('✅ Autenticación exitosa, estableciendo dataToken');
        setDataToken(verifiedDataToken || {});
      } else {
        console.log('❌ No se encontró token en URL');
      }
    }
  }, [searchParams, router]);

  useEffect(() => {
    console.log('🔄 useEffect ejecutado con dataToken:', !!dataToken);
    if (dataToken) {
      console.log('✅ dataToken válido, cargando datos...');
      cargarAgencias();
      cargarConversaciones();
    } else {
      console.log('❌ dataToken no válido, no se cargan datos');
    }
  }, [dataToken, busqueda, filtroAgencia, filtroCanal, filtroEvaluacion, pagina]);

  useEffect(() => {
    if (!token) return;
    const fetchTags = async () => {
      try {
        const response = await fetch('/api/backoffice/plataforma/evaluations/tags', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setAvailableTags(Array.isArray(data.tags) ? data.tags.filter((t: any) => typeof t === "string") : []);
        }
      } catch (error) {
        console.error('Error cargando tags disponibles:', error);
      }
    };
    fetchTags();
  }, [token]);

  const cargarAgencias = async () => {
    try {
      const { data, error } = await supabase
        .from('dealerships')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.error('Error cargando agencias:', error);
        return;
      }

      setDealerships(data || []);
    } catch (error) {
      console.error('Error cargando agencias:', error);
    }
  };

  const cargarConversaciones = async () => {
    setLoading(true);
    try {
      console.log('🔄 Iniciando carga de conversaciones...');
      console.log('🔍 Estado actual de filtros:', {
        busqueda,
        filtroAgencia,
        filtroCanal,
        filtroEvaluacion,
        pagina
      });

      const rpcParams = {
        search_query: busqueda || null,
        dealership_filter: filtroAgencia === "todas" ? null : filtroAgencia,
        channel_filter: filtroCanal === "todos" ? null : filtroCanal,
        evaluation_status_filter: filtroEvaluacion === "todas" ? null : filtroEvaluacion,
        limit_rows: ITEMS_PER_PAGE,
        offset_rows: (pagina - 1) * ITEMS_PER_PAGE
      };

      console.log('🚀 Llamando a la función RPC get_admin_conversations_with_evaluations con los parámetros:', rpcParams);
      
      const { data, error } = await supabase.rpc('get_admin_conversations_with_evaluations', rpcParams);
      
      if (error) {
        console.error("❌ Error en la llamada RPC:", JSON.stringify(error, null, 2));
        throw error;
      }

      console.log('✅ RPC exitosa.');
      console.log('📋 Respuesta completa:', data);
      
      // Extraer conversaciones y total del resultado JSON
      const conversaciones = data?.conversations || [];
      const totalCount = data?.total_count || 0;
      
      console.log('📊 Conversaciones recibidas:', conversaciones.length);
      console.log('📊 Total de conversaciones:', totalCount);
      console.log('📋 Tipo de datos recibidos:', typeof data);
      console.log('📋 Es un objeto?', typeof data === 'object');
      
      if (conversaciones && conversaciones.length > 0) {
        console.log('📋 Primeras 3 conversaciones recibidas:', conversaciones.slice(0, 3));
        console.log('📋 Estructura de la primera conversación:', Object.keys(conversaciones[0]));
      } else {
        console.log('📋 No se recibieron conversaciones o la lista está vacía.');
        console.log('📋 Valor exacto de conversaciones:', conversaciones);
      }
      
      setConversaciones(conversaciones);
      setTotalConversaciones(totalCount);
      
      console.log('✅ Estado actualizado con', conversaciones.length, 'conversaciones de', totalCount, 'total');

    } catch (error) {
      console.error("❌ Error fatal en cargarConversaciones:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy HH:mm", {
        locale: es
      });
    } catch (error) {
      return "Fecha inválida";
    }
  };

  const verDetalle = (id: string) => {
    router.push(`/backoffice/plataforma/conversaciones/${id}?token=${token}`);
  };

  const getCanalIcon = (channel?: string) => {
    switch (channel) {
      case 'phone':
        return <Phone className="h-4 w-4 mr-1 text-blue-500" />;
      case 'whatsapp':
      default:
        return <MessageSquare className="h-4 w-4 mr-1 text-green-500" />;
    }
  };

  const handleStatusChange = (conversationId: string, newStatus: 'pending' | 'successful' | 'unsuccessful') => {
    setConversaciones(prev => prev.map(conv => 
      conv.id === conversationId 
        ? { ...conv, evaluation_status: newStatus }
        : conv
    ));
  };

  const handleTagsChange = (conversationId: string, newTags: string[]) => {
    setConversaciones(prev => prev.map(conv => 
      conv.id === conversationId 
        ? { ...conv, evaluation_tags: newTags }
        : conv
    ));
  };

  const handleCommentsChange = (conversationId: string, newComments: string | null) => {
    setConversaciones(prev => prev.map(conv => 
      conv.id === conversationId 
        ? { ...conv, admin_comments: newComments }
        : conv
    ));
  };

  const totalPaginas = Math.ceil(totalConversaciones / ITEMS_PER_PAGE);

  return (
    <div className="px-4 py-6 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Administración - Conversaciones</h1>
      </div>

      <Card className="p-4 shadow-sm border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por usuario, cliente, agencia..."
              className="pl-8"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
          
          <Select
            value={filtroAgencia}
            onValueChange={setFiltroAgencia}
          >
            <SelectTrigger>
              <SelectValue placeholder="Agencia" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas las agencias</SelectItem>
              {dealerships.map((dealership) => (
                <SelectItem key={dealership.id} value={dealership.id}>
                  {dealership.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
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
            value={filtroEvaluacion}
            onValueChange={setFiltroEvaluacion}
          >
            <SelectTrigger>
              <SelectValue placeholder="Estado evaluación" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todos los estados</SelectItem>
              <SelectItem value="pending">Sin evaluar</SelectItem>
              <SelectItem value="successful">Exitosa</SelectItem>
              <SelectItem value="unsuccessful">No exitosa</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <div className="border rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Canal</TableHead>
              <TableHead>Agencia</TableHead>
              <TableHead>Identificador</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Estado Evaluación</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead>Última actividad</TableHead>
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
                  No se encontraron conversaciones
                </TableCell>
              </TableRow>
            ) : (
              conversaciones.map((conversacion: AdminConversation) => (
                <TableRow key={conversacion.id}>
                  <TableCell className="w-10">
                    {getCanalIcon(conversacion.channel)}
                  </TableCell>
                  <TableCell className="font-medium">
                    {conversacion.dealership_name}
                  </TableCell>
                  <TableCell className="font-medium">
                    {conversacion.user_identifier}
                  </TableCell>
                  <TableCell>
                    {conversacion.client_names ? (
                      <div>
                        <div className="font-semibold">{conversacion.client_names}</div>
                        <div className="text-sm text-muted-foreground">{conversacion.client_phone}</div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Sin cliente asociado</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <AdminConversationEvaluationDropdown
                      conversationId={conversacion.id}
                      currentStatus={conversacion.evaluation_status}
                      token={token}
                      onStatusChange={(newStatus) => handleStatusChange(conversacion.id, newStatus)}
                    />
                  </TableCell>
                  <TableCell>
                    <AdminConversationTagsInput
                      conversationId={conversacion.id}
                      currentTags={conversacion.evaluation_tags}
                      token={token}
                      availableTags={availableTags}
                      onTagsChange={(newTags) => handleTagsChange(conversacion.id, newTags)}
                    />
                  </TableCell>
                  <TableCell>
                    {formatDate(conversacion.updated_at)}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-y-2 items-start">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => verDetalle(conversacion.id)}
                        className="flex items-center gap-1"
                      >
                        <Eye className="h-4 w-4" />
                        Ver
                      </Button>
                      <AdminConversationCommentsModal
                        conversationId={conversacion.id}
                        currentComments={conversacion.admin_comments || null}
                        token={token}
                        onCommentsChange={(newComments) => handleCommentsChange(conversacion.id, newComments)}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPaginas > 1 && (
        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            Mostrando {((pagina - 1) * ITEMS_PER_PAGE) + 1} a {Math.min(pagina * ITEMS_PER_PAGE, totalConversaciones)} de {totalConversaciones} conversaciones
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setPagina((p) => Math.max(p - 1, 1))}
              disabled={pagina <= 1}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              onClick={() => setPagina((p) => Math.min(p + 1, totalPaginas))}
              disabled={pagina >= totalPaginas}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  );
} 