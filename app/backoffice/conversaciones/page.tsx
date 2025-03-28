"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { verifyToken } from "../../jwt/token";
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
import { Eye, Search } from "lucide-react";
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
  status: 'active' | 'closed' | 'pending';
  user_messages_count: number;
  assistant_messages_count: number;
}

const ITEMS_PER_PAGE = 10;

export default function ConversacionesPage() {
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
  const [filtroFecha, setFiltroFecha] = useState("todas");

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
        
        if (verifiedDataToken === null) {
          router.push("/login");
        }
        
        setDataToken(verifiedDataToken || {});
      }
    }
  }, [searchParams, router]);

  useEffect(() => {
    if (dataToken) {
      cargarConversaciones();
    }
  }, [dataToken, busqueda, filtroEstado, filtroFecha, pagina]);

  const cargarConversaciones = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("chat_conversations")
        .select(`
          *,
          client(names, email, phone_number, dealership_id)
        `, { count: "exact" })
        .order("updated_at", { ascending: false })
        .range((pagina - 1) * ITEMS_PER_PAGE, pagina * ITEMS_PER_PAGE - 1);

      // Filtrar por dealership_id si está disponible en el token
      if (dataToken?.dealership_id) {
        query = query.eq("dealership_id", dataToken.dealership_id);
      }

      // Aplicar filtros
      if (busqueda) {
        query = query.or(
          `user_identifier.ilike.%${busqueda}%,client.names.ilike.%${busqueda}%,client.phone_number.ilike.%${busqueda}%`
        );
      }

      if (filtroEstado !== "todos") {
        query = query.eq("status", filtroEstado);
      }

      // Filtrar por fecha
      const ahora = new Date();
      let fechaDesde: Date | null = null;
      
      switch (filtroFecha) {
        case "hoy":
          fechaDesde = new Date(ahora.setHours(0, 0, 0, 0));
          break;
        case "ayer":
          fechaDesde = new Date(ahora);
          fechaDesde.setDate(fechaDesde.getDate() - 1);
          fechaDesde.setHours(0, 0, 0, 0);
          break;
        case "semana":
          fechaDesde = new Date(ahora);
          fechaDesde.setDate(fechaDesde.getDate() - 7);
          break;
        case "mes":
          fechaDesde = new Date(ahora);
          fechaDesde.setMonth(fechaDesde.getMonth() - 1);
          break;
      }

      if (fechaDesde) {
        query = query.gte("updated_at", fechaDesde.toISOString());
      }

      const { data, count, error } = await query;

      if (error) throw error;

      // Obtener conteo de mensajes para cada conversación
      const conversacionesConConteo = await Promise.all(
        (data || []).map(async (conv) => {
          const { data: mensajes, error: mensajesError } = await supabase
            .from("chat_messages")
            .select("role", { count: "exact" })
            .eq("conversation_id", conv.id);

          if (mensajesError) {
            console.error("Error al obtener mensajes:", mensajesError);
            return {
              ...conv,
              user_messages_count: 0,
              assistant_messages_count: 0
            };
          }

          const userCount = mensajes?.filter(m => m.role === "user").length || 0;
          const assistantCount = mensajes?.filter(m => m.role === "assistant").length || 0;

          return {
            ...conv,
            user_messages_count: userCount,
            assistant_messages_count: assistantCount
          };
        })
      );

      setConversaciones(conversacionesConConteo);
      setTotalConversaciones(count || 0);
    } catch (error) {
      console.error("Error cargando conversaciones:", error);
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

  const totalPaginas = Math.ceil(totalConversaciones / ITEMS_PER_PAGE);

  return (
    <div className="px-4 py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Conversaciones</h1>
      </div>

      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por usuario o cliente..."
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
            value={filtroFecha}
            onValueChange={setFiltroFecha}
          >
            <SelectTrigger>
              <SelectValue placeholder="Fecha" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas las fechas</SelectItem>
              <SelectItem value="hoy">Hoy</SelectItem>
              <SelectItem value="ayer">Ayer</SelectItem>
              <SelectItem value="semana">Esta semana</SelectItem>
              <SelectItem value="mes">Este mes</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <div className="border rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Identificador</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Última actividad</TableHead>
              <TableHead>Mensajes</TableHead>
              <TableHead>Estado</TableHead>
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
                  No se encontraron conversaciones
                </TableCell>
              </TableRow>
            ) : (
              conversaciones.map((conversacion) => (
                <TableRow key={conversacion.id}>
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
                    <span className="text-sm">
                      {conversacion.user_messages_count} usuario / {conversacion.assistant_messages_count} asistente
                    </span>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(conversacion.status)}
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