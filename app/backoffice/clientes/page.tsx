"use client";

import { useState, useEffect } from "react";
import { ClientesTable } from "@/components/clientes-table";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
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

interface Cliente {
  id: string;
  names: string;
  email: string;
  phone_number: string;
  external_id?: string | null;
  estado?: "activo" | "inactivo";
  agent_active: boolean;
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
  const [showNuevoCliente, setShowNuevoCliente] = useState(false);
  const [nuevoCliente, setNuevoCliente] = useState<NuevoCliente>({
    names: "",
    email: "",
    phone_number: "",
  });

  // Efecto para recargar los clientes cuando cambien los filtros
  useEffect(() => {
    // Solo recargar si ya tenemos el dealership_id
    if (dataToken && (dataToken as any).dealership_id) {
      cargarClientes((dataToken as any).dealership_id);
    }
  }, [busqueda, filtroEstado, pagina]);

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

      const clientesMapeados: Cliente[] = (data || []).map((cliente) => ({
        id: cliente.id,
        names: cliente.names,
        email: cliente.email,
        phone_number: cliente.phone_number,
        external_id: cliente.external_id,
        estado: cliente.estado,
        agent_active: cliente.agent_active ?? true // valor por defecto true
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
    if (dataToken && (dataToken as any).dealership_id) {
      cargarClientes((dataToken as any).dealership_id);
    }
  };

  // Solo mantener el filtro por clienteId cuando sea necesario
  const clientesAMostrar = clienteId 
    ? clientes.filter(cliente => cliente.id === clienteId)
    : clientes;

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
          <Input
            placeholder="Buscar clientes..."
            className="w-[150px] lg:w-[250px]"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
      </div>

      <ClientesTable 
        clientes={clientesAMostrar} 
        loading={loading} 
        token={token}
        onClienteDeleted={handleClienteUpdated}
      />

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

      {clienteId && (
        <Button variant="outline" onClick={limpiarFiltro}>
          Ver todos los clientes
        </Button>
      )}
    </div>
  );
}
