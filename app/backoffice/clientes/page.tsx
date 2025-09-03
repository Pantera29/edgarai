"use client";

import { useState, useEffect } from "react";
import { ClientesTable } from "@/components/clientes-table";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2 } from "lucide-react";
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
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { verifyToken } from "../../jwt/token";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/use-toast";
import { useClientSearch } from "@/hooks/useClientSearch";
import { useDebouncedCallback } from 'use-debounce';

interface Cliente {
  id: string;
  names: string;
  email: string;
  phone_number: string;
  external_id?: string | null;
  estado?: "activo" | "inactivo";
  agent_active: boolean;
  dealership_id: string;
}

interface NuevoCliente {
  names: string;
  email: string;
  phone_number: string;
}

const ITEMS_PER_PAGE = 10;

export default function ClientesPage() {
  const [searchParams, setSearchParams] = useState<URLSearchParams | null>(
    null
  );
  const [token, setToken] = useState<string>("");
  const [dataToken, setDataToken] = useState<object>({});

const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setSearchParams(params); // Guarda los query params en el estado
    }
  }, []);

  useEffect(() => {
    if (searchParams) {
      const tokenValue = searchParams.get("token"); // Obtiene el token de los query params
      if (tokenValue) {
        setToken(tokenValue); // Usa setToken para actualizar el estado
        const verifiedDataToken = verifyToken(tokenValue); // Verifica el token
        
        // Mejor validación: redirigir si el token es null, vacío, no es objeto o no tiene dealership_id
        if (
          !verifiedDataToken ||
          typeof verifiedDataToken !== "object" ||
          Object.keys(verifiedDataToken).length === 0 ||
          !(verifiedDataToken as any).dealership_id
        ) {
          router.push("/login");
          return;
        }
        setDataToken(verifiedDataToken); // Actualiza el estado de dataToken
        cargarClientes((verifiedDataToken as any).dealership_id);
      }
    }
  }, [searchParams, router]); 
  

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [pagina, setPagina] = useState(1);
  const [totalClientes, setTotalClientes] = useState(0);
  const [loading, setLoading] = useState(false);
  const [clienteId, setClienteId] = useState<string | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);
  
  // Hook de búsqueda inteligente
  const { 
    clients: searchResults, 
    loading: hookLoading, 
    error: searchError, 
    searchClients 
  } = useClientSearch((dataToken as any)?.dealership_id || '');
  const [showNuevoCliente, setShowNuevoCliente] = useState(false);
  const [nuevoCliente, setNuevoCliente] = useState<NuevoCliente>({
    names: "",
    email: "",
    phone_number: "",
  });

  // Búsqueda inteligente con debounce
  const debouncedSearch = useDebouncedCallback(async (searchTerm: string) => {
    if (searchTerm.trim()) {
      setIsSearchActive(true);
      setSearchLoading(true);
      try {
        await searchClients(searchTerm);
      } catch (error) {
        console.error('Error en búsqueda:', error);
      } finally {
        setSearchLoading(false);
      }
    } else {
      setIsSearchActive(false);
      // Si no hay búsqueda, recargar clientes normales
      if (dataToken && (dataToken as any).dealership_id) {
        cargarClientes((dataToken as any).dealership_id);
      }
    }
  }, 300);

  // Efecto para la búsqueda inteligente
  useEffect(() => {
    debouncedSearch(busqueda);
  }, [busqueda, debouncedSearch]);

  // Efecto para recargar los clientes cuando cambien los filtros (sin búsqueda)
  useEffect(() => {
    // Solo recargar si ya tenemos el dealership_id y no estamos en modo búsqueda
    if (dataToken && (dataToken as any).dealership_id && !isSearchActive) {
      cargarClientes((dataToken as any).dealership_id);
    }
  }, [filtroEstado, pagina, isSearchActive]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    if (id) {
      setClienteId(id);
    }
  }, []);

  const cargarClientes = async (dealershipIdFromToken?: string) => {
    if (!dealershipIdFromToken) {
      console.error('No se proporcionó dealership_id');
      return;
    }

    setLoading(true);
    try {
      let query = supabase
        .from("client")
        .select("*", { count: "exact" })
        .eq("dealership_id", dealershipIdFromToken)
        .order("names")
        .range((pagina - 1) * ITEMS_PER_PAGE, pagina * ITEMS_PER_PAGE - 1);

      if (busqueda) {
        query = query.or(
          `names.ilike.%${busqueda}%,email.ilike.%${busqueda}%,phone_number.ilike.%${busqueda}%`
        );
      }

      if (filtroEstado !== "todos") {
        query = query.eq("estado", filtroEstado);
      }

      const { data, count, error } = await query;

      if (error) throw error;



      // Obtener los agent_active actualizados de phone_agent_settings
      const phoneNumbers = (data || []).map(cliente => cliente.phone_number);
      
      const { data: agentSettingsData } = await supabase
        .from("phone_agent_settings")
        .select("phone_number, agent_active")
        .eq("dealership_id", dealershipIdFromToken)
        .in("phone_number", phoneNumbers);

      // Crear un mapa para acceso rápido
      const agentSettingsMap = new Map();
      (agentSettingsData || []).forEach(setting => {
        agentSettingsMap.set(setting.phone_number, setting.agent_active);
      });

      const clientesMapeados: Cliente[] = (data || []).map((cliente) => ({
        id: cliente.id,
        names: cliente.names,
        email: cliente.email,
        phone_number: cliente.phone_number,
        external_id: cliente.external_id,
        estado: cliente.estado,
        // Priorizar phone_agent_settings.agent_active, fallback a client.agent_active
        agent_active: agentSettingsMap.get(cliente.phone_number) ?? cliente.agent_active ?? true,
        dealership_id: cliente.dealership_id
      }));

      setClientes(clientesMapeados);
      setTotalClientes(count || 0);
    } catch (error) {
      console.error("Error cargando clientes:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar los clientes. Por favor, intente nuevamente."
      });
    } finally {
      setLoading(false);
    }
  };

  // Función para recargar clientes cuando se actualiza el estado del agente
  const handleClienteUpdated = () => {
    console.log('🔄 Recargando clientes después de actualización...');
    
    // Recargar clientes normales
    if (dataToken && (dataToken as any).dealership_id) {
      cargarClientes((dataToken as any).dealership_id);
    }
    
    // Si estamos en modo búsqueda activa, también recargar los resultados de búsqueda
    if (isSearchActive && busqueda.trim()) {
      console.log('🔍 Recargando búsqueda activa:', busqueda);
      searchClients(busqueda);
    }
  };

  // Determinar qué clientes mostrar basado en el modo de búsqueda
  const clientesAMostrar = (() => {
    if (clienteId) {
      // Si hay un cliente específico seleccionado, mostrarlo
      return clientes.filter(cliente => cliente.id === clienteId);
    }
    
    if (isSearchActive && searchResults.length > 0) {
      // Si estamos en modo búsqueda, mostrar resultados de búsqueda
      // Convertir los resultados de búsqueda al formato esperado
      return searchResults.map(client => ({
        id: client.id,
        names: client.names,
        email: client.email || '',
        phone_number: client.phone_number,
        external_id: client.external_id || null,
        estado: "activo" as const,
        // Los resultados de búsqueda ya vienen con el agent_active correcto del endpoint verify
        agent_active: client.agent_active ?? true,
        dealership_id: client.dealership_id || (dataToken as any)?.dealership_id || ''
      }));
    }
    
    if (isSearchActive && searchResults.length === 0 && busqueda.trim()) {
      // Si estamos buscando pero no hay resultados, mostrar array vacío
      return [];
    }
    
    // Por defecto, mostrar la lista normal paginada
    return clientes;
  })();

  const limpiarFiltro = () => {
    setClienteId(null);
    window.history.pushState({}, "", `/clientes?token=${token?.toString}`);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNuevoCliente({
      ...nuevoCliente,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Verificar si hay un dealership_id en el token
      if (!dataToken || !(dataToken as any).dealership_id) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo determinar la agencia. Por favor, inicie sesión nuevamente."
        });
        return;
      }
      
      const dealershipId = (dataToken as any).dealership_id;
      
      // Preparar datos del cliente para la API
      const clientData = {
        names: nuevoCliente.names,
        email: nuevoCliente.email,
        phone_number: nuevoCliente.phone_number,
        dealership_id: dealershipId
      };
        
      // Llamar a la API en lugar de insertar directamente
      const response = await fetch('/api/customers/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(clientData)
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('Error de la API:', result);
        
        // Manejo específico de errores de la API
        let errorMessage = "No se pudo crear el cliente";
        
        if (response.status === 409) {
          errorMessage = result.message || "Ya existe un cliente con este email o teléfono en esta agencia";
        } else if (response.status === 400) {
          errorMessage = result.message || "Datos inválidos proporcionados";
        } else if (response.status === 500) {
          errorMessage = result.message || "Error interno del servidor";
        }
        
        toast({
          variant: "destructive",
          title: "Error",
          description: errorMessage
        });
        return;
      }

      // Agregar el nuevo cliente a la lista
      setClientes([...clientes, result.client]);
      setShowNuevoCliente(false);
      setNuevoCliente({
        names: "",
        email: "",
        phone_number: "",
      });
      
      toast({
        title: "Cliente creado",
        description: "El cliente ha sido registrado exitosamente."
      });
    } catch (error) {
      console.error("Error al crear cliente:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo crear el cliente. Intente nuevamente."
      });
    }
  };

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Clientes</h2>
        <div className="flex items-center space-x-2">
          <Button asChild>
            {/* Token ya debería estar disponible si existe */}
            <Link href={`/backoffice/clientes/nuevo?token=${token}`}>
              Registrar Cliente
            </Link>
          </Button>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex flex-1 items-center space-x-2">
          <div className="relative w-[150px] lg:w-[250px]">
            <Input
              placeholder="Buscar por nombre o teléfono..."
              className="w-full pr-8"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
            {(searchLoading || hookLoading) && (
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
              </div>
            )}
          </div>
          {isSearchActive && (
            <div className="text-sm text-muted-foreground">
              {searchResults.length > 0 
                ? `${searchResults.length} resultado(s) encontrado(s)`
                : busqueda.trim() 
                  ? "No se encontraron resultados"
                  : "Escriba para buscar"
              }
            </div>
          )}
          {searchError && (
            <div className="text-sm text-red-500">
              Error en búsqueda: {searchError}
            </div>
          )}
        </div>
      </div>

      <ClientesTable 
        clientes={clientesAMostrar} 
        loading={loading} 
        token={token}
        onClienteDeleted={handleClienteUpdated}
      />

      {!isSearchActive && (
        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            Mostrando {((pagina - 1) * ITEMS_PER_PAGE) + 1} -{" "}
            {Math.min(pagina * ITEMS_PER_PAGE, totalClientes)} de {totalClientes}{" "}
            clientes
          </div> 
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={pagina === 1}
              onClick={() => setPagina((p) => p - 1)}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              disabled={pagina * ITEMS_PER_PAGE >= totalClientes}
              onClick={() => setPagina((p) => p + 1)}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
      
      {isSearchActive && (
        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            {searchResults.length > 0 
              ? `Mostrando ${searchResults.length} resultado(s) de búsqueda`
              : busqueda.trim() 
                ? "No se encontraron clientes que coincidan con la búsqueda"
                : "Escriba para buscar clientes"
            }
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setBusqueda("");
              setIsSearchActive(false);
            }}
          >
            Limpiar búsqueda
          </Button>
        </div>
      )}

      {clienteId && (
        <Button variant="outline" onClick={limpiarFiltro}>
          Ver todos los clientes
        </Button>
      )}
    </div>
  );
}
