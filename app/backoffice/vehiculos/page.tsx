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
import { Badge } from "@/components/ui/badge"
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Car, Clock, Wrench } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { Label } from "@/components/ui/label"

interface Vehiculo {
  id_uuid: string
  id_cliente_uuid: string
  cliente: {
    nombre: string
  }
  vin: string | null
  marca: string
  modelo: string
  anio: number
  color: string | null
  placa: string | null
  kilometraje_actual: number | null
  fecha_ultimo_servicio: string | null
  fecha_proximo_servicio: string | null
  tipo_garantia: string | null
  fecha_vencimiento_garantia: string | null
  estado_garantia: string | null
}

interface PropietarioHistorial {
  id_uuid: string
  id_vehiculo: string
  id_cliente: string
  fecha_inicio: string
  fecha_fin: string | null
  notas_transferencia: string | null
  cliente: {
    nombre: string
  }
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

interface CitaServicio {
  id_uuid: string
  fecha_hora: string
  estado: 'pendiente' | 'confirmada' | 'completada' | 'cancelada'
  servicios: {
    nombre: string
    duracion_estimada: number
  }[]
  notas: string
}

interface NuevoVehiculo {
  id_cliente_uuid: string
  marca: string
  modelo: string
  anio: number
  color: string
  placa: string
  vin: string
  kilometraje_actual: number
  tipo_garantia: string | null
  fecha_vencimiento_garantia: string | null
  estado_garantia: 'vigente' | 'vencida' | null
}

export default function VehiculosPage() {
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState("")
  const [filtroMarca, setFiltroMarca] = useState("todas")
  const [marcasDisponibles, setMarcasDisponibles] = useState<string[]>([])
  const [vehiculoSeleccionado, setVehiculoSeleccionado] = useState<string | null>(null)
  const [historialPropietarios, setHistorialPropietarios] = useState<PropietarioHistorial[]>([])
  const [servicios, setServicios] = useState<ServicioHistorial[]>([])
  const [showDetalles, setShowDetalles] = useState(false)
  const [citasServicios, setCitasServicios] = useState<CitaServicio[]>([])
  const [vehiculoId, setVehiculoId] = useState<string | null>(null)
  const [showNuevoVehiculo, setShowNuevoVehiculo] = useState(false)
  const [clientesDisponibles, setClientesDisponibles] = useState<{id_uuid: string, nombre: string}[]>([])
  const [nuevoVehiculo, setNuevoVehiculo] = useState<NuevoVehiculo>({
    id_cliente_uuid: '',
    marca: '',
    modelo: '',
    anio: new Date().getFullYear(),
    color: '',
    placa: '',
    vin: '',
    kilometraje_actual: 0,
    tipo_garantia: null,
    fecha_vencimiento_garantia: null,
    estado_garantia: null
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
      cargarDetallesVehiculo(id)
    }
  }, [])

  const cargarVehiculos = async () => {
    setLoading(true)

    try {
      const { data, error } = await supabase
        .from('vehiculos')
        .select(`
          *,
          cliente:clientes(nombre)
        `)
        .order('marca')

      if (error) throw error

      setVehiculos(data || [])
      // Extraer marcas únicas para el filtro
      const marcas = Array.from(new Set(data?.map(v => v.marca) || []))
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
      return vehiculo.id_uuid === vehiculoId
    }

    // Si no hay ID, aplicar los filtros normales
    const cumpleBusqueda = 
      vehiculo.marca.toLowerCase().includes(busqueda.toLowerCase()) ||
      vehiculo.modelo.toLowerCase().includes(busqueda.toLowerCase()) ||
      vehiculo.placa?.toLowerCase().includes(busqueda.toLowerCase()) ||
      vehiculo.cliente.nombre.toLowerCase().includes(busqueda.toLowerCase())
    
    const cumpleFiltroMarca = filtroMarca === "todas" || vehiculo.marca === filtroMarca

    return cumpleBusqueda && cumpleFiltroMarca
  })

  const cargarDetallesVehiculo = async (vehiculoId: string) => {
    try {
      // Cargar historial de propietarios
      const { data: historialData, error: historialError } = await supabase
        .from('historial_propietarios')
        .select(`
          *,
          cliente:clientes(nombre)
        `)
        .eq('id_vehiculo', vehiculoId)
        .order('fecha_inicio', { ascending: false })

      if (historialError) throw historialError

      // Cargar citas de servicios
      const { data: citasData, error: citasError } = await supabase
        .from('citas')
        .select(`
          id_uuid,
          fecha_hora,
          estado,
          notas,
          servicios:servicios!citas_servicio_id_uuid_fkey (
            nombre,
            duracion_estimada
          )
        `)
        .eq('vehiculo_id_uuid', vehiculoId)
        .order('fecha_hora', { ascending: false })

      if (citasError) throw citasError
      setHistorialPropietarios(historialData || [])
      setCitasServicios(citasData?.map(cita => ({
        ...cita,
        servicios: cita.servicios.map(servicio => ({
          nombre: servicio.nombre as string,
          duracion_estimada: servicio.duracion_estimada as number
        }))
      })) || [])
      setVehiculoSeleccionado(vehiculoId)
      setShowDetalles(true)
    } catch (error) {
      console.error('Error cargando detalles:', error)
    }
  }

  // Agregar un botón para limpiar el filtro
  const limpiarFiltro = () => {
    setVehiculoId(null)
    setShowDetalles(false)
    // Limpiar la URL
    window.history.pushState({}, '', '/vehiculos')
  }

  const verDetalles = (vehiculoId: string) => {
    setVehiculoSeleccionado(vehiculoId)
    setShowDetalles(true)
  }

  // Cargar lista de clientes para el selector
  const cargarClientes = async () => {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('id_uuid, nombre')
        .order('nombre')

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
      const { data, error } = await supabase
        .from('vehiculos')
        .insert([{
          ...nuevoVehiculo,
          fecha_vencimiento_garantia: nuevoVehiculo.fecha_vencimiento_garantia || null,
          estado_garantia: nuevoVehiculo.estado_garantia || null,
          tipo_garantia: nuevoVehiculo.tipo_garantia || null
        }])
        .select('*, cliente:clientes(nombre)')

      if (error) {
        console.error('Error al crear vehículo:', error)
        return
      }

      setVehiculos([...vehiculos, data[0]])
      setShowNuevoVehiculo(false)
      setNuevoVehiculo({
        id_cliente_uuid: '',
        marca: '',
        modelo: '',
        anio: new Date().getFullYear(),
        color: '',
        placa: '',
        vin: '',
        kilometraje_actual: 0,
        tipo_garantia: null,
        fecha_vencimiento_garantia: null,
        estado_garantia: null
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
            <Link href="/vehiculos/nuevo">Registrar Vehículo</Link>
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
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vehiculosFiltrados.map((vehiculo) => (
              <TableRow key={vehiculo.id_uuid}>
                <TableCell>
                  <div>
                    <p className="font-medium">{vehiculo.marca} {vehiculo.modelo}</p>
                    <p className="text-sm text-muted-foreground">{vehiculo.anio}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <Link 
                    href={`/clientes?id=${vehiculo.id_cliente_uuid}`}
                    className="text-blue-600 hover:underline"
                  >
                    {vehiculo.cliente.nombre}
                  </Link>
                </TableCell>
                <TableCell>{vehiculo.placa || 'N/A'}</TableCell>
                <TableCell>{vehiculo.kilometraje_actual ? `${vehiculo.kilometraje_actual} km` : 'N/A'}</TableCell>
                <TableCell>
                  {vehiculo.fecha_ultimo_servicio ? 
                    format(new Date(vehiculo.fecha_ultimo_servicio), 'PP', { locale: es }) : 
                    'Sin servicios'}
                </TableCell>
                <TableCell>
                  <Badge variant={vehiculo.estado_garantia === 'vigente' ? 'success' : 'destructive'}>
                    {vehiculo.estado_garantia || 'Sin garantía'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => verDetalles(vehiculo.id_uuid)}
                  >
                    Ver detalles
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={showDetalles} onOpenChange={setShowDetalles}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              Detalles del Vehículo
            </DialogTitle>
          </DialogHeader>
          
          {vehiculoSeleccionado && (
            <Tabs defaultValue="info" className="space-y-4">
              <TabsList>
                <TabsTrigger value="info">
                  <Car className="h-4 w-4 mr-2" />
                  Información
                </TabsTrigger>
                <TabsTrigger value="historial">
                  <Clock className="h-4 w-4 mr-2" />
                  Historial de Propietarios
                </TabsTrigger>
                <TabsTrigger value="servicios">
                  <Wrench className="h-4 w-4 mr-2" />
                  Servicios
                </TabsTrigger>
              </TabsList>

              <TabsContent value="info">
                <Card>
                  <CardContent className="pt-6">
                    {vehiculos
                      .filter(v => v.id_uuid === vehiculoSeleccionado)
                      .map(vehiculo => (
                        <div key={vehiculo.id_uuid} className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium">Marca y Modelo</p>
                            <p className="text-sm text-muted-foreground">
                              {vehiculo.marca} {vehiculo.modelo} ({vehiculo.anio})
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">VIN</p>
                            <p className="text-sm text-muted-foreground">
                              {vehiculo.vin || 'No registrado'}
                            </p>
                          </div>
                          {/* ... más detalles del vehículo ... */}
                        </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="historial">
                <Card>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Propietario</TableHead>
                          <TableHead>Fecha Inicio</TableHead>
                          <TableHead>Fecha Fin</TableHead>
                          <TableHead>Notas</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {historialPropietarios.map((registro) => (
                          <TableRow key={registro.id_uuid}>
                            <TableCell>{registro.cliente.nombre}</TableCell>
                            <TableCell>
                              {format(new Date(registro.fecha_inicio), 'PP', { locale: es })}
                            </TableCell>
                            <TableCell>
                              {registro.fecha_fin 
                                ? format(new Date(registro.fecha_fin), 'PP', { locale: es })
                                : 'Propietario actual'}
                            </TableCell>
                            <TableCell>{registro.notas_transferencia || '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="servicios">
                <Card>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Servicio</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Notas</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {citasServicios.map((cita) => (
                          <TableRow key={cita.id_uuid}>
                            <TableCell>
                              {format(new Date(cita.fecha_hora), "PPP 'a las' p", { locale: es })}
                            </TableCell>
                            <TableCell>{cita.servicios[0].nombre}</TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  cita.estado === 'completada' ? 'success' :
                                  cita.estado === 'cancelada' ? 'destructive' :
                                  cita.estado === 'confirmada' ? 'default' :
                                  'secondary'
                                }
                              >
                                {cita.estado}
                              </Badge>
                            </TableCell>
                            <TableCell>{cita.notas || '-'}</TableCell>
                          </TableRow>
                        ))}
                        {citasServicios.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-4">
                              No hay servicios registrados para este vehículo
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

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
                <Label htmlFor="id_cliente_uuid" className="text-right">
                  Cliente
                </Label>
                <Select
                  value={nuevoVehiculo.id_cliente_uuid}
                  onValueChange={(value) => setNuevoVehiculo({...nuevoVehiculo, id_cliente_uuid: value})}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Seleccione cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientesDisponibles.map(cliente => (
                      <SelectItem key={cliente.id_uuid} value={cliente.id_uuid}>
                        {cliente.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="marca" className="text-right">
                  Marca
                </Label>
                <Input
                  id="marca"
                  name="marca"
                  value={nuevoVehiculo.marca}
                  onChange={handleInputChange}
                  className="col-span-3"
                  required
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="modelo" className="text-right">
                  Modelo
                </Label>
                <Input
                  id="modelo"
                  name="modelo"
                  value={nuevoVehiculo.modelo}
                  onChange={handleInputChange}
                  className="col-span-3"
                  required
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="anio" className="text-right">
                  Año
                </Label>
                <Input
                  id="anio"
                  name="anio"
                  type="number"
                  value={nuevoVehiculo.anio}
                  onChange={handleInputChange}
                  className="col-span-3"
                  required
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="placa" className="text-right">
                  Placa
                </Label>
                <Input
                  id="placa"
                  name="placa"
                  value={nuevoVehiculo.placa}
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
                  value={nuevoVehiculo.vin}
                  onChange={handleInputChange}
                  className="col-span-3"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="kilometraje_actual" className="text-right">
                  Kilometraje
                </Label>
                <Input
                  id="kilometraje_actual"
                  name="kilometraje_actual"
                  type="number"
                  value={nuevoVehiculo.kilometraje_actual}
                  onChange={handleInputChange}
                  className="col-span-3"
                  required
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="tipo_garantia" className="text-right">
                  Tipo Garantía
                </Label>
                <Select
                  value={nuevoVehiculo.tipo_garantia || ''}
                  onValueChange={(value) => setNuevoVehiculo({...nuevoVehiculo, tipo_garantia: value})}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Seleccione tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basica">Básica</SelectItem>
                    <SelectItem value="extendida">Extendida</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {nuevoVehiculo.tipo_garantia && (
                <>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="fecha_vencimiento_garantia" className="text-right">
                      Vencimiento Garantía
                    </Label>
                    <Input
                      id="fecha_vencimiento_garantia"
                      name="fecha_vencimiento_garantia"
                      type="date"
                      value={nuevoVehiculo.fecha_vencimiento_garantia || ''}
                      onChange={handleInputChange}
                      className="col-span-3"
                    />
                  </div>

                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="estado_garantia" className="text-right">
                      Estado Garantía
                    </Label>
                    <Select
                      value={nuevoVehiculo.estado_garantia || ''}
                      onValueChange={(value) => setNuevoVehiculo({
                        ...nuevoVehiculo, 
                        estado_garantia: value as 'vigente' | 'vencida'
                      })}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Seleccione estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vigente">Vigente</SelectItem>
                        <SelectItem value="vencida">Vencida</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
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