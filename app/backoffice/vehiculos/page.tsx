"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, History, Edit } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Car } from "lucide-react"
import Link from "next/link"
import { Label } from "@/components/ui/label"
import { verifyToken } from '../../jwt/token'
import { useRouter } from "next/navigation";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { ChevronsLeft, ChevronsRight } from "lucide-react"

interface Vehiculo {
  id_uuid: string
  client_id: string
  client: {
    names: string
  }
  vin: string | undefined
  make: string
  model: string
  year: number
  license_plate: string
  last_km: number | undefined
  last_service_date: string | undefined
  next_service_date: string | undefined
}

interface ServicioHistorial {
  id_uuid: string
  id_vehiculo: string
  fecha: string
  tipo: string
  descripcion: string
  tecnico: string
  costo: number
  estado: string
}

interface NuevoVehiculo {
  client_id: string
  make: string
  model: string
  year: number
  license_plate: string
  vin: string
  last_km: number
}

interface ClienteDisponible {
  id: string
  names: string
}

export default function VehiculosPage() {
  const [searchParams, setSearchParams] = useState<URLSearchParams | null>(
    null
  );
  const [token, setToken] = useState<string>("");
  const [dataToken, setDataToken] = useState<{dealership_id?: string}>({});

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
        setDataToken(verifiedDataToken || {}); // Actualiza el estado de dataToken
        cargarVehiculos(verifiedDataToken.dealership_id);
        cargarClientes(verifiedDataToken.dealership_id);
      }
    }
  }, [searchParams, router]); 

  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState("")
  const [filtroMarca, setFiltroMarca] = useState("todas")
  const [marcasDisponibles, setMarcasDisponibles] = useState<string[]>([])
  const [servicios, setServicios] = useState<ServicioHistorial[]>([])
  const [vehiculoId, setVehiculoId] = useState<string | null>(null)
  const [showNuevoVehiculo, setShowNuevoVehiculo] = useState(false)
  const [clientesDisponibles, setClientesDisponibles] = useState<ClienteDisponible[]>([])
  const [nuevoVehiculo, setNuevoVehiculo] = useState<Vehiculo>({
    id_uuid: '',
    client_id: '',
    client: {
      names: ''
    },
    vin: '',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    license_plate: '',
    last_km: 0,
    last_service_date: '',
    next_service_date: ''
  })
  const supabase = createClientComponentClient()

  useEffect(() => {
    // Obtener el ID del vehículo de la URL si existe
    const params = new URLSearchParams(window.location.search)
    const id = params.get('id')
    if (id) {
      setVehiculoId(id)
    }
  }, [])

  const VEHICULOS_POR_PAGINA = 50;
  const [currentPage, setCurrentPage] = useState(1);
  const [totalVehiculos, setTotalVehiculos] = useState(0);

  const cargarVehiculos = async (dealershipIdFromToken?: string) => {
    if (!dealershipIdFromToken) {
      console.error('No se proporcionó dealership_id');
      return;
    }

    setLoading(true);
    try {
      let query = supabase
        .from("vehicles")
        .select(`
          *,
          client:client(names)
        `, { count: "exact" })
        .eq("dealership_id", dealershipIdFromToken)
        .order("make")
        .range((currentPage - 1) * VEHICULOS_POR_PAGINA, currentPage * VEHICULOS_POR_PAGINA - 1);

      // Aplicar filtro de búsqueda si existe
      if (busqueda) {
        // Buscar en campos del vehículo
        query = query.or(
          `make.ilike.%${busqueda}%,model.ilike.%${busqueda}%,license_plate.ilike.%${busqueda}%,vin.ilike.%${busqueda}%`
        );
      }

      // Aplicar filtro de marca si no es "todas"
      if (filtroMarca !== "todas") {
        query = query.eq("make", filtroMarca);
      }

      const { data, count, error } = await query;

      if (error) throw error;

      // Si hay búsqueda por cliente, hacer una consulta adicional
      let vehiculosFinales = data || [];
      if (busqueda) {
        // Buscar clientes que coincidan con la búsqueda
        const { data: clientesCoincidentes } = await supabase
          .from('client')
          .select('id')
          .eq('dealership_id', dealershipIdFromToken)
          .ilike('names', `%${busqueda}%`);

        if (clientesCoincidentes && clientesCoincidentes.length > 0) {
          const clientIds = clientesCoincidentes.map(c => c.id);
          // Buscar vehículos de esos clientes
          const { data: vehiculosPorCliente } = await supabase
            .from("vehicles")
            .select(`
              *,
              client:client(names)
            `)
            .eq("dealership_id", dealershipIdFromToken)
            .in('client_id', clientIds)
            .order("make");

          // Combinar resultados únicos
          const vehiculosCombinados = [...vehiculosFinales];
          vehiculosPorCliente?.forEach(vehiculo => {
            if (!vehiculosCombinados.find(v => v.id_uuid === vehiculo.id_uuid)) {
              vehiculosCombinados.push(vehiculo);
            }
          });
          vehiculosFinales = vehiculosCombinados;
        }
      }

      console.log('Vehículos cargados:', vehiculosFinales);
      setVehiculos(vehiculosFinales);
      setTotalVehiculos(count || 0);
      
      // Extraer marcas únicas para el filtro (solo si no hay búsqueda activa)
      if (!busqueda) {
        const marcas = Array.from(new Set(data?.map(v => v.make) || []));
        setMarcasDisponibles(marcas);
      }
    } catch (error) {
      console.error("Error cargando vehículos:", error);
      setVehiculos([]);
      setMarcasDisponibles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (dataToken?.dealership_id) {
      cargarVehiculos(dataToken.dealership_id);
    }
  }, [dataToken, busqueda, filtroMarca, currentPage]);

  // Resetear página cuando cambien los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [busqueda, filtroMarca]);

  // Solo mantener el filtro por vehiculoId cuando sea necesario
  const vehiculosAMostrar = vehiculoId 
    ? vehiculos.filter(vehiculo => vehiculo.id_uuid === vehiculoId)
    : vehiculos;

  // Agregar un botón para limpiar el filtro
  const limpiarFiltro = () => {
    setVehiculoId(null)
    // Limpiar la URL
    window.history.pushState({}, '', '/vehiculos')
  }

  // Cargar lista de clientes para el selector
  const cargarClientes = async (dealershipIdFromToken?: string) => {
    try {
      let query = supabase
        .from('client')
        .select('id, names')
        .order('names')
      
      // Si tenemos un dealership_id del token, filtrar por él
      if (dealershipIdFromToken) {
        console.log("Filtrando clientes por dealership_id:", dealershipIdFromToken);
        query = query.eq('dealership_id', dealershipIdFromToken);
      }

      const { data, error } = await query;

      if (error) throw error
      setClientesDisponibles(data || [])
    } catch (error) {
      console.error('Error cargando clientes:', error)
    }
  }

  useEffect(() => {
    cargarClientes()
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.type === 'number' ? Number(e.target.value) : e.target.value
    setNuevoVehiculo({
      ...nuevoVehiculo,
      [e.target.name]: value
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const selectedClient = clientesDisponibles.find(
        client => client.id === nuevoVehiculo.client_id
      );
      
      if (!selectedClient) {
        console.error('Debe seleccionar un cliente');
        return;
      }
      
      const vehiculoData = {
        client_id: nuevoVehiculo.client_id,
        make: nuevoVehiculo.make,
        model: nuevoVehiculo.model,
        year: nuevoVehiculo.year,
        license_plate: nuevoVehiculo.license_plate,
        vin: nuevoVehiculo.vin,
        last_km: nuevoVehiculo.last_km
      };

      // USAR ENDPOINT en lugar de Supabase directo
      const response = await fetch('/api/vehicles/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(vehiculoData)
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('Error al crear vehículo:', result.message);
        return;
      }

      console.log('✅ Vehículo creado desde modal:', result);

      // Recargar la lista completa de vehículos
      await cargarVehiculos(dataToken?.dealership_id);
      
      setShowNuevoVehiculo(false)
      setNuevoVehiculo({
        id_uuid: '',
        client_id: '',
        client: {
          names: ''
        },
        vin: '',
        make: '',
        model: '',
        year: new Date().getFullYear(),
        license_plate: '',
        last_km: 0,
        last_service_date: '',
        next_service_date: ''
      })
    } catch (error) {
      console.error('Error al crear vehículo:', error)
    }
  }

  const handleEditVehicle = (vehiculo: Vehiculo) => {
    try {
      console.log('Iniciando edición de vehículo');
      console.log('Datos del vehículo:', vehiculo);
      console.log('Token actual:', token);
      
      if (!vehiculo.id_uuid) {
        console.error('Error: ID de vehículo no disponible');
        return;
      }

      const editUrl = `/backoffice/vehiculos/${vehiculo.id_uuid}/editar?token=${token}`;
      console.log('Redirigiendo a:', editUrl);
      router.push(editUrl);
    } catch (error) {
      console.error('Error al intentar editar:', error);
    }
  };

  // Lógica de paginación
  const totalPages = Math.ceil(totalVehiculos / VEHICULOS_POR_PAGINA);

  const getPageRange = () => {
    const range = [];
    const maxPagesToShow = 5;
    let start = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let end = Math.min(totalPages, start + maxPagesToShow - 1);
    if (end - start + 1 < maxPagesToShow) {
      start = Math.max(1, end - maxPagesToShow + 1);
    }
    for (let i = start; i <= end; i++) {
      range.push(i);
    }
    return range;
  };

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Vehículos</h2>
        <div className="flex items-center space-x-2">
          <Button asChild>
            <Link href={`/backoffice/vehiculos/nuevo?token=${token}`}>Registrar Vehículo</Link>
          </Button>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex flex-1 items-center space-x-2">
          <Input
            placeholder="Buscar vehículos..."
            className="w-[150px] lg:w-[250px]"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <Select
            value={filtroMarca}
            onValueChange={(value) => setFiltroMarca(value)}
          >
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Todas las marcas" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px] overflow-y-auto">
              <SelectItem value="todas">Todas las marcas</SelectItem>
              {marcasDisponibles.map(marca => (
                <SelectItem key={marca} value={marca}>{marca}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Marca y Modelo</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>VIN</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vehiculosAMostrar.map((vehiculo) => (
              <TableRow key={vehiculo.id_uuid}>
                <TableCell>
                  <div>
                    <p className="font-medium">{vehiculo.make} {vehiculo.model}</p>
                    <p className="text-sm text-muted-foreground">{vehiculo.year}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <Link 
                    href={`/backoffice/clientes?id=${vehiculo.client_id}`}
                    className="text-blue-600 hover:underline"
                  >
                    {vehiculo.client.names}
                  </Link>
                </TableCell>
                <TableCell>{vehiculo.vin || 'N/A'}</TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    {vehiculo.id_uuid ? (
                      <>
                        <Link href={`/backoffice/vehiculos/${vehiculo.id_uuid}/historial?token=${token}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            type="button"
                          >
                            <History className="w-4 h-4 mr-2" />
                            Historial
                          </Button>
                        </Link>
                        <Link href={`/backoffice/vehiculos/${vehiculo.id_uuid}/editar?token=${token}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            type="button"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </Button>
                        </Link>
                      </>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        type="button"
                        disabled
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {/* Paginación visual */}
      {totalPages > 1 && (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center border-t pt-4">
          <div className="text-sm text-muted-foreground order-2 sm:order-1">
            Mostrando {((currentPage - 1) * VEHICULOS_POR_PAGINA) + 1} -{" "}
            {Math.min(currentPage * VEHICULOS_POR_PAGINA, totalVehiculos)} de {totalVehiculos}{" "}
            vehículos
          </div>
          <div className="order-1 sm:order-2">
            <Pagination>
              <PaginationContent>
                {totalPages > 1 && (
                  <>
                    <PaginationItem>
                      <PaginationLink
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                      >
                        <ChevronsLeft className="h-4 w-4" />
                      </PaginationLink>
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                      />
                    </PaginationItem>
                    {getPageRange().map((page) => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => setCurrentPage(page)}
                          isActive={currentPage === page}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => currentPage < totalPages && setCurrentPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      />
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationLink
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronsRight className="h-4 w-4" />
                      </PaginationLink>
                    </PaginationItem>
                  </>
                )}
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      )}
    </div>
  )
} 