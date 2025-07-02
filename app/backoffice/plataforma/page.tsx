"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { verifyToken } from "../../jwt/token";
import { Card } from "@/components/ui/card";
import { MessageSquare, Building2, BarChart3, Users, Phone, MessageCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

// UUID de la agencia autorizada para plataforma
const PLATFORM_AGENCY_ID = '6b58f82d-baa6-44ce-9941-1a61975d20b5';

interface PlatformStats {
  totalConversations: number;
  totalAgencies: number;
  pendingEvaluations: number;
  successfulConversations: number;
  phoneConversations: number;
  whatsappConversations: number;
}

export default function PlataformaPage() {
  const router = useRouter();
  const [searchParams, setSearchParams] = useState<URLSearchParams | null>(null);
  const [token, setToken] = useState<string>("");
  const [dataToken, setDataToken] = useState<any>(null);
  const [stats, setStats] = useState<PlatformStats>({
    totalConversations: 0,
    totalAgencies: 0,
    pendingEvaluations: 0,
    successfulConversations: 0,
    phoneConversations: 0,
    whatsappConversations: 0
  });
  const [loading, setLoading] = useState(true);

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

        // Verificar que es la agencia autorizada para plataforma
        if (verifiedDataToken.dealership_id !== PLATFORM_AGENCY_ID) {
          router.push(`/backoffice?token=${tokenValue}`);
          return;
        }
        
        setDataToken(verifiedDataToken || {});
      }
    }
  }, [searchParams, router]);

  useEffect(() => {
    if (dataToken) {
      cargarEstadisticas();
    }
  }, [dataToken]);

  const cargarEstadisticas = async () => {
    setLoading(true);
    try {
      // Obtener estadísticas en paralelo
      const [
        conversationsResponse,
        agenciesResponse,
        evaluationsResponse
      ] = await Promise.all([
        // Total de conversaciones
        supabase
          .from('chat_conversations')
          .select('*', { count: 'exact', head: true }),
        
        // Total de agencias activas
        supabase
          .from('dealerships')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true),
        
        // Evaluaciones pendientes
        supabase
          .from('conversation_evaluations')
          .select('*', { count: 'exact', head: true })
          .eq('evaluation_status', 'pending')
      ]);

      // Obtener conversaciones por canal
      const [phoneResponse, whatsappResponse] = await Promise.all([
        supabase
          .from('chat_conversations')
          .select('*', { count: 'exact', head: true })
          .eq('channel', 'phone'),
        
        supabase
          .from('chat_conversations')
          .select('*', { count: 'exact', head: true })
          .eq('channel', 'whatsapp')
      ]);

      // Obtener conversaciones exitosas
      const successfulResponse = await supabase
        .from('conversation_evaluations')
        .select('*', { count: 'exact', head: true })
        .eq('evaluation_status', 'successful');

      setStats({
        totalConversations: conversationsResponse.count || 0,
        totalAgencies: agenciesResponse.count || 0,
        pendingEvaluations: evaluationsResponse.count || 0,
        successfulConversations: successfulResponse.count || 0,
        phoneConversations: phoneResponse.count || 0,
        whatsappConversations: whatsappResponse.count || 0
      });

    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    } finally {
      setLoading(false);
    }
  };



  if (loading) {
    return (
      <div className="px-4 py-6">
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Cargando plataforma...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Administración de Plataforma</h1>
          <p className="text-muted-foreground mt-1">
            Panel de control para gestión cross-agencia
          </p>
        </div>
      </div>

      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Conversaciones</p>
              <p className="text-2xl font-bold">{stats.totalConversations.toLocaleString()}</p>
            </div>
            <MessageSquare className="h-8 w-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Agencias Activas</p>
              <p className="text-2xl font-bold">{stats.totalAgencies}</p>
            </div>
            <Building2 className="h-8 w-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Evaluaciones Pendientes</p>
              <p className="text-2xl font-bold">{stats.pendingEvaluations}</p>
            </div>
            <BarChart3 className="h-8 w-8 text-orange-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Conversaciones Exitosas</p>
              <p className="text-2xl font-bold">{stats.successfulConversations}</p>
            </div>
            <Users className="h-8 w-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Llamadas Telefónicas</p>
              <p className="text-2xl font-bold">{stats.phoneConversations.toLocaleString()}</p>
            </div>
            <Phone className="h-8 w-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Conversaciones WhatsApp</p>
              <p className="text-2xl font-bold">{stats.whatsappConversations.toLocaleString()}</p>
            </div>
            <MessageCircle className="h-8 w-8 text-green-500" />
          </div>
        </Card>
      </div>



      {/* Información adicional */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Información del Sistema</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium mb-2">Funcionalidades Disponibles</h3>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• Evaluación de conversaciones cross-agencia</li>
              <li>• Sistema de tags para categorización</li>
              <li>• Comentarios administrativos</li>
              <li>• Gestión completa de agencias</li>
              <li>• Filtros avanzados de búsqueda</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium mb-2">Acceso y Seguridad</h3>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• Solo agencias autorizadas pueden acceder</li>
              <li>• Verificación de token JWT obligatoria</li>
              <li>• Auditoría de cambios en evaluaciones</li>
              <li>• Filtrado automático por permisos</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
} 