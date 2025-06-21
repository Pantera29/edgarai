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
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

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
}

const ITEMS_PER_PAGE = 10;

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

export default function ConversacionesListaPage() {
  const router = useRouter();
  const [searchParams, setSearchParams] = useState<URLSearchParams | null>(null);
  const [token, setToken] = useState<string>("");
  const [dataToken, setDataToken] = useState<any>(null);
  const [conversaciones, setConversaciones] = useState<ConversacionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalConversaciones, setTotalConversaciones] = useState(0);
  const [pagina, setPagina] = useState(1);
  
  // Filtros
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [filtroCanal, setFiltroCanal] = useState("todos");
  const [filtroRazonFinalizacion, setFiltroRazonFinalizacion] = useState("todas");

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
      cargarConversaciones();
    }
  }, [dataToken, busqueda, filtroEstado, filtroCanal, filtroRazonFinalizacion]);

  const cargarConversaciones = async () => {
    setLoading(true);
    try {
      const rpcParams = {
        dealership_id_param: dataToken.dealership_id,
        search_query: busqueda || null,
        status_filter: filtroEstado,
        channel_filter: filtroCanal,
        ended_reason_filter: filtroRazonFinalizacion
      };

      console.log('🚀 Llamando a la función RPC get_filtered_conversations con los parámetros:', rpcParams);
      
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

    } catch (error) {
      console.error("❌ Error fatal en cargarConversaciones:", error);
    } finally {
      setLoading(false);
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
      case "completed":
        return <Badge className="bg-blue-500">Completada</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: es
      });
    } catch (error) {
      return "Fecha inválida";
    }
  };

  const verDetalle = (id: string) => {
    router.push(`/backoffice/conversaciones/${id}?token=${token}`);
  };

  // La paginación ahora se calcula en el cliente
  const totalPaginas = Math.ceil(totalConversaciones / ITEMS_PER_PAGE);
  const inicio = (pagina - 1) * ITEMS_PER_PAGE;
  const fin = inicio + ITEMS_PER_PAGE;
  const conversacionesEnPagina = conversaciones.slice(inicio, fin);

  const getCanalIcon = (channel?: string) => {
    switch (channel) {
      case 'phone':
        return <Phone className="h-4 w-4 mr-1 text-blue-500" />;
      case 'whatsapp':
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

  return (
    <div className="px-4 py-6 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Lista de Conversaciones</h1>
      </div>

      <Card className="p-4 shadow-sm border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            value={filtroEstado}
            onValueChange={setFiltroEstado}
          >
            <SelectTrigger>
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas</SelectItem>
              <SelectItem value="active">Activas</SelectItem>
              <SelectItem value="closed">Cerradas</SelectItem>
              <SelectItem value="pending">Pendientes</SelectItem>
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
            value={filtroRazonFinalizacion}
            onValueChange={setFiltroRazonFinalizacion}
          >
            <SelectTrigger>
              <SelectValue placeholder="Razón de finalización" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas las razones</SelectItem>
              <SelectItem value="customer-ended-call">Cliente finalizó la llamada</SelectItem>
              <SelectItem value="assistant-ended-call">Asistente finalizó la llamada</SelectItem>
              <SelectItem value="silence-timed-out">Tiempo de silencio agotado</SelectItem>
              <SelectItem value="voicemail">Buzón de voz</SelectItem>
              <SelectItem value="assistant-forwarded-call">Llamada transferida por asistente</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <div className="border rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Canal</TableHead>
              <TableHead>Identificador</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Última actividad</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Razón de finalización</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10">
                  Cargando conversaciones...
                </TableCell>
              </TableRow>
            ) : conversacionesEnPagina.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10">
                  No se encontraron conversaciones
                </TableCell>
              </TableRow>
            ) : (
              conversacionesEnPagina.map((conversacion: ConversacionItem) => (
                <TableRow key={conversacion.id}>
                  <TableCell className="w-10">
                    {getCanalIcon(conversacion.channel)}
                  </TableCell>
                  <TableCell className="font-medium">
                    {conversacion.user_identifier}
                  </TableCell>
                  <TableCell>
                    {conversacion.client ? (
                      <div>
                        <div className="font-semibold">{conversacion.client.names}</div>
                        <div className="text-sm text-muted-foreground">{conversacion.client.phone_number}</div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Sin cliente asociado</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {formatDate(conversacion.updated_at)}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(conversacion.status)}
                  </TableCell>
                  <TableCell>
                    {conversacion.ended_reason ? (
                      <span className="text-sm text-muted-foreground">{traducirRazonFinalizacion(conversacion.ended_reason)}</span>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => verDetalle(conversacion.id)}
                      className="flex items-center gap-1"
                    >
                      <Eye className="h-4 w-4" />
                      Ver detalles
                    </Button>
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