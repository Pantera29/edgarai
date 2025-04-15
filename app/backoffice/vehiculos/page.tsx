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
import { Search } from "lucide-react"
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
        
        // Si el token no es válido, redirigir al login
        if (verifiedDataToken === null) {
          router.push("/login");
        }
        setDataToken(verifiedDataToken || {}); // Actualiza el estado de dataToken

        // Si hay un dealership_id en el token, cargar los vehículos de esa agencia
        if (verifiedDataToken?.dealership_id) {
          cargarVehiculos(verifiedDataToken.dealership_id);
          cargarClientes(verifiedDataToken.dealership_id);
        }
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

  const cargarVehiculos = async (dealershipIdFromToken?: string) => {
    setLoading(true)

    try {
      // Si no hay dealership_id, no cargar nada
      if (!dealershipIdFromToken) {
        setVehiculos([]);
        setMarcasDisponibles([]);
        return;
      }

      // Consulta directa usando dealership_id
      const { data, error } = await supabase
        .from('vehicles')
        .select(`
          *,
          client:client(names)
        `)
        .eq('dealership_id', dealershipIdFromToken)
        .order('make');

      if (error) throw error;

      console.log('Vehículos cargados:', data);
      // Verificar que cada vehículo tenga un ID
      const vehiculosConId = data?.map(v => {
        console.log('ID del vehículo:', v.id_uuid);
        return v;
      }) || [];
      setVehiculos(vehiculosConId);
      // Extraer marcas únicas para el filtro
      const marcas = Array.from(new Set(data?.map(v => v.make) || []));
      setMarcasDisponibles(marcas);
    } catch (error) {
      console.error('Error cargando vehículos:', error);
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
  }, [dataToken]);

  const vehiculosFiltrados = vehiculos.filter(vehiculo => {
    // Si hay un ID específico, solo mostrar ese vehículo
    if (vehiculoId) {
      return vehiculo.id_uuid === vehiculoId
    }

    // Si no hay ID, aplicar los filtros normales
    const cumpleBusqueda = 
      vehiculo.make.toLowerCase().includes(busqueda.toLowerCase()) ||
      vehiculo.model.toLowerCase().includes(busqueda.toLowerCase()) ||
      vehiculo.license_plate?.toLowerCase().includes(busqueda.toLowerCase()) ||
      vehiculo.client.names.toLowerCase().includes(busqueda.toLowerCase())
    
    const cumpleFiltroMarca = filtroMarca === "todas" || vehiculo.make === filtroMarca

    return cumpleBusqueda && cumpleFiltroMarca
  })

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

      const { error } = await supabase
        .from('vehicles')
        .insert([vehiculoData])

      if (error) {
        console.error('Error al crear vehículo:', error)
        return
      }

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
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Todas las marcas" />
            </SelectTrigger>
            <SelectContent>
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
              <TableHead>Placa</TableHead>
              <TableHead>Kilometraje</TableHead>
              <TableHead>Último Servicio</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vehiculosFiltrados.map((vehiculo) => (
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
                <TableCell>{vehiculo.license_plate || 'N/A'}</TableCell>
                <TableCell>{vehiculo.last_km ? `${vehiculo.last_km} km` : 'N/A'}</TableCell>
                <TableCell>
                  {vehiculo.last_service_date ? 
                    format(new Date(vehiculo.last_service_date), 'PP', { locale: es }) : 
                    'Sin servicios'}
                </TableCell>
                <TableCell>
                  {vehiculo.id_uuid ? (
                    <Link href={`/backoffice/vehiculos/${vehiculo.id_uuid}?token=${token}`}>
                      <Button
                        variant="outline"
                        size="sm"
                        type="button"
                      >
                        Editar
                      </Button>
                    </Link>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      type="button"
                      disabled
                    >
                      Editar
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
} 