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
  id: string
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
    id: '',
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
    cargarVehiculos()
  }, [])

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
      // Consulta base para obtener los vehículos
      let query = supabase
        .from('vehicles')
        .select(`
          *,
          client:client(names)
        `)
        .order('make')
      
      // Si tenemos un dealership_id del token, filtrar por él usando la relación con client
      if (dealershipIdFromToken) {
        console.log("Filtrando vehículos por dealership_id:", dealershipIdFromToken);
        // Primero obtenemos los clientes de esa agencia
        const { data: clientsData } = await supabase
          .from('client')
          .select('id')
          .eq('dealership_id', dealershipIdFromToken);
        
        if (clientsData && clientsData.length > 0) {
          // Extraemos los IDs de los clientes
          const clientIds = clientsData.map(client => client.id);
          // Filtramos los vehículos por esos clientes
          query = query.in('client_id', clientIds);
        } else {
          // Si no hay clientes, devolver lista vacía
          setVehiculos([]);
          setMarcasDisponibles([]);
          setLoading(false);
          return;
        }
      }

      const { data, error } = await query;

      if (error) throw error

      setVehiculos(data || [])
      // Extraer marcas únicas para el filtro
      const marcas = Array.from(new Set(data?.map(v => v.make) || []))
      setMarcasDisponibles(marcas)
    } catch (error) {
      console.error('Error cargando vehículos:', error)
    } finally {
      setLoading(false)
    }
  }

  const vehiculosFiltrados = vehiculos.filter(vehiculo => {
    // Si hay un ID específico, solo mostrar ese vehículo
    if (vehiculoId) {
      return vehiculo.id === vehiculoId
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
      // Obtener el cliente seleccionado
      const selectedClient = clientesDisponibles.find(
        client => client.id === nuevoVehiculo.client_id
      );
      
      // Si no hay cliente seleccionado, mostrar error
      if (!selectedClient) {
        console.error('Debe seleccionar un cliente');
        return;
      }
      
      // Asegurarse de que todos los campos del formulario coincidan con los de la base de datos
      const vehiculoData = {
        client_id: nuevoVehiculo.client_id,
        make: nuevoVehiculo.make,
        model: nuevoVehiculo.model,
        year: nuevoVehiculo.year,
        license_plate: nuevoVehiculo.license_plate,
        vin: nuevoVehiculo.vin,
        last_km: nuevoVehiculo.last_km
      };

      const { data, error } = await supabase
        .from('vehicles')
        .insert([vehiculoData])
        .select('*, client:client(names)')

      if (error) {
        console.error('Error al crear vehículo:', error)
        return
      }

      setVehiculos([...vehiculos, data[0]])
      setShowNuevoVehiculo(false)
      setNuevoVehiculo({
        id: '',
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

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Vehículos</h2>
        <div className="flex items-center space-x-2">
          <Button asChild>
            <Link href="/backoffice/vehiculos/nuevo">Registrar Vehículo</Link>
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {vehiculosFiltrados.map((vehiculo) => (
              <TableRow key={vehiculo.id}>
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
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={showNuevoVehiculo} onOpenChange={setShowNuevoVehiculo}>
        <DialogTrigger asChild>
          <Button>Registrar Vehículo</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Nuevo Vehículo</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="client_id" className="text-right">
                  Cliente
                </Label>
                <Select
                  value={nuevoVehiculo.client_id}
                  onValueChange={(value) => setNuevoVehiculo({...nuevoVehiculo, client_id: value})}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Seleccione cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientesDisponibles.map(cliente => (
                      <SelectItem key={cliente.id} value={cliente.id}>
                        {cliente.names}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="make" className="text-right">
                  Marca
                </Label>
                <Input
                  id="make"
                  name="make"
                  value={nuevoVehiculo.make}
                  onChange={handleInputChange}
                  className="col-span-3"
                  required
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="model" className="text-right">
                  Modelo
                </Label>
                <Input
                  id="model"
                  name="model"
                  value={nuevoVehiculo.model}
                  onChange={handleInputChange}
                  className="col-span-3"
                  required
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="year" className="text-right">
                  Año
                </Label>
                <Input
                  id="year"
                  name="year"
                  type="number"
                  value={nuevoVehiculo.year}
                  onChange={handleInputChange}
                  className="col-span-3"
                  required
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="license_plate" className="text-right">
                  Placa
                </Label>
                <Input
                  id="license_plate"
                  name="license_plate"
                  value={nuevoVehiculo.license_plate}
                  onChange={handleInputChange}
                  className="col-span-3"
                  required
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="vin" className="text-right">
                  VIN
                </Label>
                <Input
                  id="vin"
                  name="vin"
                  value={nuevoVehiculo.vin ?? ''}
                  onChange={handleInputChange}
                  className="col-span-3"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="last_km" className="text-right">
                  Kilometraje
                </Label>
                <Input
                  id="last_km"
                  name="last_km"
                  type="number"
                  value={nuevoVehiculo.last_km ?? 0}
                  onChange={handleInputChange}
                  className="col-span-3"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Guardar Vehículo</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
} 