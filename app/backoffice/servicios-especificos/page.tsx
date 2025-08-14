"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Plus, Filter, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { useRouter } from "next/navigation"
import { verifyToken } from "@/app/jwt/token"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FilterDropdown } from "@/components/FilterDropdown"
import { FormDropdown } from "@/components/FormDropdown"
import { ServiceDropdown } from "@/components/ServiceDropdown"

interface VehicleMake {
  id: string
  name: string
}

interface VehicleModel {
  id: string
  name: string
  make_id: string
  make: {
    id: string
    name: string
  }
}

interface Service {
  id_uuid: string
  service_name: string
  description: string
}

interface SpecificService {
  id: string
  model_id: string
  dealership_id: string
  service_name: string
  kilometers: number
  months: number
  price: number
  is_active: boolean
  service_id: string | null
  additional_price: number
  additional_description: string
  includes_additional: boolean
  created_at: string
  updated_at: string
  model: {
    name: string
    make: {
      id: string
      name: string
    }
  }
  service?: {
    service_name: string
  }
}

export default function ServiciosEspecificosPage() {
  const [searchParams, setSearchParams] = useState<URLSearchParams | null>(null)
  const [token, setToken] = useState<string>("")
  const [dataToken, setDataToken] = useState<object>({})

  const router = useRouter()
  const { toast } = useToast()

  // Estados para datos
  const [specificServices, setSpecificServices] = useState<SpecificService[]>([])
  const [makes, setMakes] = useState<VehicleMake[]>([])
  const [models, setModels] = useState<VehicleModel[]>([])
  const [services, setServices] = useState<Service[]>([])

  
  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedMake, setSelectedMake] = useState<string>("all")
  const [selectedModel, setSelectedModel] = useState<string>("all")
  const [showActiveOnly, setShowActiveOnly] = useState(true)
  
  // Estados para formulario
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    model_id: "",
    service_name: "",
    kilometers: 0,
    months: 0,
    price: 0,
    service_id: "",
    additional_price: 0,
    additional_description: "",
    includes_additional: true,
    is_active: true
  })

  // Estados para edición
  const [editando, setEditando] = useState(false)
  const [servicioSeleccionado, setServicioSeleccionado] = useState<SpecificService | null>(null)
  
  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(25)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      setSearchParams(params)
    }
  }, [])

  useEffect(() => {
    if (searchParams) {
      const tokenValue = searchParams.get("token")
      if (tokenValue) {
        setToken(tokenValue)
        const verifiedDataToken = verifyToken(tokenValue)
        
        if (
          !verifiedDataToken ||
          typeof verifiedDataToken !== "object" ||
          Object.keys(verifiedDataToken).length === 0 ||
          !(verifiedDataToken as any).dealership_id
        ) {
          router.push("/login")
          return
        }
        
        setDataToken(verifiedDataToken || {})
        
        if (verifiedDataToken?.dealership_id) {
          cargarDatos(verifiedDataToken.dealership_id)
        }
      }
    }
  }, [searchParams, router])

  async function cargarDatos(dealershipId: string) {
    setLoading(true)
    
    try {
      await Promise.all([
        cargarServiciosEspecificos(dealershipId),
        cargarMakes(dealershipId),
        cargarModels(dealershipId), // Cargar todos los modelos inicialmente
        cargarServices(dealershipId)
      ])
    } catch (error) {
      console.error('Error al cargar datos:', error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  async function cargarServiciosEspecificos(dealershipId: string) {
    try {
      const { data, error } = await supabase
        .from('specific_services')
        .select(`
          id,
          model_id,
          dealership_id,
          service_name,
          kilometers,
          months,
          price,
          is_active,
          service_id,
          additional_price,
          additional_description,
          includes_additional,
          created_at,
          updated_at,
          model:vehicle_models (
            name,
            make:vehicle_makes (
              id,
              name
            )
          ),
          service:services (
            service_name
          )
        `)
        .eq('dealership_id', dealershipId)
        .order('created_at', { ascending: false })

      if (error) throw error
      
      // Transformar los datos para que coincidan con la interfaz SpecificService
      const transformedData = data?.map((item: any) => ({
        ...item,
        model: Array.isArray(item.model) ? item.model[0] : item.model,
        service: Array.isArray(item.service) ? item.service[0] : item.service
      })) || []
      
      setSpecificServices(transformedData)
    } catch (error) {
      console.error('Error al cargar servicios específicos:', error)
      throw error
    }
  }

  async function cargarMakes(dealershipId: string) {
    try {

      
      // Obtener marcas únicas que tienen servicios específicos en esta agencia
      const { data, error } = await supabase
        .from('specific_services')
        .select(`
          model:vehicle_models!inner (
            make:vehicle_makes!inner (
              id,
              name
            )
          )
        `)
        .eq('dealership_id', dealershipId)

      if (error) throw error
      
      // Extraer marcas únicas
      const uniqueMakes = data?.reduce((acc: any[], item: any) => {
        if (item.model?.make && !acc.find(m => m.id === item.model.make.id)) {
          acc.push(item.model.make)
        }
        return acc
      }, []) || []
      
      // Ordenar por nombre
      uniqueMakes.sort((a, b) => a.name.localeCompare(b.name))
      
      setMakes(uniqueMakes)
    } catch (error) {
      console.error('Error al cargar marcas:', error)
      throw error
    }
  }

  async function cargarTodasLasMarcas() {
    try {
      // Cargar todas las marcas disponibles para el formulario
      const { data, error } = await supabase
        .from('vehicle_makes')
        .select('id, name')
        .order('name')

      if (error) throw error
      
      setMakes(data || [])
    } catch (error) {
      console.error('Error al cargar todas las marcas:', error)
      throw error
    }
  }

  async function cargarTodosLosModelos(makeId: string) {
    try {
      // Cargar todos los modelos de una marca específica para el formulario
      const { data, error } = await supabase
        .from('vehicle_models')
        .select(`
          id, 
          name, 
          make_id,
          make:vehicle_makes (
            name
          )
        `)
        .eq('make_id', makeId)
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      
      // Transformar los datos para que coincidan con la interfaz VehicleModel
      const transformedData = data?.map((item: any) => ({
        ...item,
        make: Array.isArray(item.make) ? item.make[0] : item.make
      })) || []
      
      setModels(transformedData)
    } catch (error) {
      console.error('Error al cargar todos los modelos:', error)
      throw error
    }
  }

  async function cargarModels(dealershipId: string, makeId?: string) {
    try {

      
      let query = supabase
        .from('specific_services')
        .select(`
          model:vehicle_models!inner (
            id,
            name,
            make:vehicle_makes!inner (
              id,
              name
            )
          )
        `)
        .eq('dealership_id', dealershipId)
      
      // Si se especifica una marca, filtrar por ella
      if (makeId && makeId !== "all") {
        query = query.eq('model.make.id', makeId)
      }

      const { data, error } = await query

      if (error) throw error
      
      // Extraer modelos únicos
      const uniqueModels = data?.reduce((acc: any[], item: any) => {
        if (item.model && !acc.find(m => m.id === item.model.id)) {
          acc.push(item.model)
        }
        return acc
      }, []) || []
      
      // Ordenar por nombre
      uniqueModels.sort((a, b) => a.name.localeCompare(b.name))
      
      setModels(uniqueModels)
    } catch (error) {
      console.error('Error al cargar modelos:', error)
      throw error
    }
  }

  async function cargarServices(dealershipId: string) {
    try {
      // Cargar servicios disponibles para esta agencia específica
      const { data, error } = await supabase
        .from('services')
        .select('id_uuid, service_name, description')
        .eq('dealership_id', dealershipId)
        .order('service_name')

      if (error) throw error
      
      setServices(data || [])
    } catch (error) {
      console.error('Error al cargar servicios:', error)
      throw error
    }
  }

  // Filtrar servicios específicos
  const filteredServices = specificServices.filter(service => {
    const matchesSearch = service.service_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.model.make.name.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesMake = selectedMake === "all" || service.model.make.id === selectedMake
    const matchesModel = selectedModel === "all" || service.model_id === selectedModel
    
    const matchesActive = !showActiveOnly || service.is_active

    return matchesSearch && matchesMake && matchesModel && matchesActive
  }).sort((a, b) => {
    // Primero ordenar por vehículo (marca y modelo)
    const vehicleComparison = a.model.make.name.localeCompare(b.model.make.name)
    if (vehicleComparison !== 0) return vehicleComparison
    
    const modelComparison = a.model.name.localeCompare(b.model.name)
    if (modelComparison !== 0) return modelComparison
    
    // Luego ordenar por kilometraje de menor a mayor
    return a.kilometers - b.kilometers
  })

  // Calcular paginación
  const totalPages = Math.ceil(filteredServices.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedServices = filteredServices.slice(startIndex, endIndex)

  // Resetear página cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, selectedMake, selectedModel, showActiveOnly, itemsPerPage])

  // Cargar todas las marcas cuando se abre el modal de creación
  useEffect(() => {
    if (mostrarFormulario) {
      cargarTodasLasMarcas()
      setSelectedMake("")
      setFormData({ ...formData, model_id: "", service_id: "" })
      setModels([])
    }
  }, [mostrarFormulario])

  // Refresh de datos cuando se cierra el modal
  useEffect(() => {
    if (!mostrarFormulario && (dataToken as any)?.dealership_id) {
      // Restaurar los filtros originales
      setSelectedMake("all")
      setSelectedModel("all")
      // Recargar datos
      cargarDatos((dataToken as any)?.dealership_id)
    }
  }, [mostrarFormulario, dataToken])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(price)
  }

  const formatKilometers = (km: number) => {
    return new Intl.NumberFormat('es-AR').format(km)
  }

  const generateServiceName = (km: number, months: number) => {
    return `Servicio de ${formatKilometers(km)} kms o ${months} meses`
  }

  const handleMakeChange = (makeId: string) => {
    setSelectedMake(makeId)
    setSelectedModel("all")
    if (makeId && makeId !== "all") {
              cargarModels((dataToken as any)?.dealership_id, makeId)
    } else {
      setModels([])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.model_id || !formData.service_name || formData.kilometers <= 0 || formData.months <= 0 || !formData.service_id) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos incluyendo el servicio base",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const dealershipId = (dataToken as any)?.dealership_id
      
      const { error } = await supabase
        .from('specific_services')
        .insert([{
          ...formData,
          service_id: formData.service_id,
          dealership_id: dealershipId
        }])

      if (error) throw error

      setMostrarFormulario(false)
      setFormData({
        model_id: "",
        service_name: "",
        kilometers: 0,
        months: 0,
        price: 0,
        service_id: "",
        additional_price: 0,
        additional_description: "",
        includes_additional: true,
        is_active: true
      })
      
      toast({
        title: "Éxito",
        description: "Servicio específico creado correctamente",
      })
      
      cargarServiciosEspecificos(dealershipId)
    } catch (error) {
      console.error('Error al crear servicio específico:', error)
      toast({
        title: "Error",
        description: "No se pudo crear el servicio específico",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!servicioSeleccionado) return

    if (!servicioSeleccionado.model_id || !servicioSeleccionado.service_name || 
        servicioSeleccionado.kilometers <= 0 || servicioSeleccionado.months <= 0 || !servicioSeleccionado.service_id) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos incluyendo el servicio base",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const { error } = await supabase
        .from('specific_services')
        .update({
          model_id: servicioSeleccionado.model_id,
          service_name: servicioSeleccionado.service_name,
          kilometers: servicioSeleccionado.kilometers,
          months: servicioSeleccionado.months,
          price: servicioSeleccionado.price,
          service_id: servicioSeleccionado.service_id,
          additional_price: servicioSeleccionado.additional_price,
          additional_description: servicioSeleccionado.additional_description,
          includes_additional: servicioSeleccionado.includes_additional,
          is_active: servicioSeleccionado.is_active
        })
        .eq('id', servicioSeleccionado.id)

      if (error) throw error

      setEditando(false)
      setServicioSeleccionado(null)
      
      toast({
        title: "Éxito",
        description: "Servicio específico actualizado correctamente",
      })
      
      const dealershipId = (dataToken as any)?.dealership_id
      cargarServiciosEspecificos(dealershipId)
    } catch (error) {
      console.error('Error al actualizar servicio específico:', error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el servicio específico",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('specific_services')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast({
        title: "Éxito",
        description: "Servicio específico eliminado correctamente",
      })
      
      const dealershipId = (dataToken as any)?.dealership_id
      cargarServiciosEspecificos(dealershipId)
    } catch (error) {
      console.error('Error al eliminar servicio específico:', error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el servicio específico",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (servicio: SpecificService) => {
    setServicioSeleccionado({
      ...servicio,
      service_id: servicio.service_id || ""
    })
    setEditando(true)
  }

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('specific_services')
        .update({ is_active: !currentStatus })
        .eq('id', id)

      if (error) throw error

      toast({
        title: "Éxito",
        description: `Servicio ${!currentStatus ? 'activado' : 'desactivado'} correctamente`,
      })
      
      const dealershipId = (dataToken as any)?.dealership_id
      cargarServiciosEspecificos(dealershipId)
    } catch (error) {
      console.error('Error al cambiar estado:', error)
      toast({
        title: "Error",
        description: "No se pudo cambiar el estado del servicio",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Servicios Específicos</h1>
          <p className="text-muted-foreground mt-2">
            Gestiona servicios específicos por modelo de vehículo
          </p>
        </div>
        <Button onClick={() => setMostrarFormulario(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Servicio Específico
        </Button>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Buscar por nombre, marca o modelo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <FilterDropdown
              label="Marca"
              options={makes}
              selectedValue={selectedMake}
              onValueChange={handleMakeChange}
              placeholder="Todas las marcas"
              allOptionLabel="Todas las marcas"
            />
            
            <FilterDropdown
              label="Modelo"
              options={models}
              selectedValue={selectedModel}
              onValueChange={setSelectedModel}
              placeholder="Todos los modelos"
              allOptionLabel="Todos los modelos"
            />
          </div>
          
          <div className="flex items-center space-x-2 mt-4">
            <Switch
              id="active-only"
              checked={showActiveOnly}
              onCheckedChange={setShowActiveOnly}
            />
            <Label htmlFor="active-only">Mostrar solo servicios activos</Label>
          </div>
        </CardContent>
      </Card>

      {/* Tabla */}
      <Card>
        <CardHeader>
          <CardTitle>
            Servicios Específicos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Servicio</TableHead>
                <TableHead>Vehículo</TableHead>
                <TableHead>Kilometraje</TableHead>
                <TableHead>Meses</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Adicional</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedServices.map((service) => (
                <TableRow key={service.id}>
                  <TableCell className="font-medium">{service.service_name}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{service.model.make.name}</div>
                      <div className="text-sm text-muted-foreground">{service.model.name}</div>
                    </div>
                  </TableCell>
                  <TableCell>{formatKilometers(service.kilometers)} km</TableCell>
                  <TableCell>{service.months} meses</TableCell>
                  <TableCell>{formatPrice(service.price)}</TableCell>
                  <TableCell>
                    {service.includes_additional ? (
                      <div>
                        <div className="font-medium">{formatPrice(service.additional_price)}</div>
                        {service.additional_description && (
                          <div className="text-sm text-muted-foreground">{service.additional_description}</div>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Sin adicional</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={service.is_active ? "default" : "secondary"}>
                      {service.is_active ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Abrir menú</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleEdit(service)}>
                          Editar servicio
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleToggleActive(service.id, service.is_active)}
                        >
                          {service.is_active ? "Desactivar" : "Activar"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleDelete(service.id)}
                          className="text-red-600"
                        >
                          Eliminar servicio
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {loading && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Cargando servicios específicos...</p>
            </div>
          )}
          
          {!loading && filteredServices.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No se encontraron servicios específicos</p>
              <p className="text-sm text-muted-foreground mt-2">
                Intenta ajustar los filtros o crear un nuevo servicio específico
              </p>
            </div>
          )}
          
          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-2 py-4">
              <div className="flex items-center space-x-4">
                <div className="text-sm text-muted-foreground">
                  Mostrando {startIndex + 1} a {Math.min(endIndex, filteredServices.length)} de {filteredServices.length} servicios
                </div>
                <div className="flex items-center space-x-2">
                  <Label htmlFor="items-per-page" className="text-sm">Por página:</Label>
                  <Select value={itemsPerPage.toString()} onValueChange={(value) => {
                    setItemsPerPage(parseInt(value))
                    setCurrentPage(1)
                  }}>
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </Button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNumber
                    if (totalPages <= 5) {
                      pageNumber = i + 1
                    } else if (currentPage <= 3) {
                      pageNumber = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNumber = totalPages - 4 + i
                    } else {
                      pageNumber = currentPage - 2 + i
                    }
                    
                    return (
                      <Button
                        key={pageNumber}
                        variant={currentPage === pageNumber ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNumber)}
                        className="w-8 h-8 p-0"
                      >
                        {pageNumber}
                      </Button>
                    )
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Siguiente
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de creación */}
      <Dialog open={mostrarFormulario} onOpenChange={setMostrarFormulario}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Servicio Específico</DialogTitle>
            <DialogDescription>
              Define un servicio específico para un modelo de vehículo particular.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col h-full">
            <div className="grid gap-4 py-4 modal-scrollable">
              <div className="grid grid-cols-2 gap-4">
                <FormDropdown
                  label="Marca *"
                  options={makes}
                  selectedValue={selectedMake}
                  onValueChange={(value) => {
                    setSelectedMake(value)
                    setFormData({ ...formData, model_id: "" })
                    if (value && value !== "all") {
                      cargarTodosLosModelos(value)
                    } else {
                      setModels([])
                    }
                  }}
                  placeholder="Seleccionar marca"
                />
                
                <FormDropdown
                  label="Modelo *"
                  options={models}
                  selectedValue={formData.model_id}
                  onValueChange={(value) => setFormData({ ...formData, model_id: value })}
                  placeholder="Seleccionar modelo"
                  disabled={!selectedMake}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="kilometers">Kilometraje *</Label>
                  <Input
                    id="kilometers"
                    type="number"
                    min="1"
                    value={formData.kilometers}
                    onChange={(e) => {
                      const km = parseInt(e.target.value) || 0
                      setFormData((prev) => {
                        const next = { ...prev, kilometers: km }
                        if (km > 0 && next.months > 0) {
                          next.service_name = generateServiceName(km, next.months)
                        }
                        return next
                      })
                    }}
                    placeholder="5000"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="months">Meses *</Label>
                  <Input
                    id="months"
                    type="number"
                    min="1"
                    value={formData.months}
                    onChange={(e) => {
                      const m = parseInt(e.target.value) || 0
                      setFormData((prev) => {
                        const next = { ...prev, months: m }
                        if (next.kilometers > 0 && m > 0) {
                          next.service_name = generateServiceName(next.kilometers, m)
                        }
                        return next
                      })
                    }}
                    placeholder="6"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="service_name">Nombre del Servicio *</Label>
                <Input
                  id="service_name"
                  value={formData.service_name}
                  onChange={(e) => setFormData({ ...formData, service_name: e.target.value })}
                  placeholder="Ej: Cambio de aceite específico"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="price">Precio *</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                />
              </div>
              
              <ServiceDropdown
                label="Servicio Base *"
                options={services}
                selectedValue={formData.service_id}
                onValueChange={(value) => setFormData({ ...formData, service_id: value })}
                placeholder="Seleccionar servicio base"
              />
              
              <div className="space-y-2">
                <Label htmlFor="additional_price">Precio del Adicional</Label>
                <Input
                  id="additional_price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.additional_price}
                  onChange={(e) => setFormData({ ...formData, additional_price: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="additional_description">Descripción del Adicional</Label>
                <Textarea
                  id="additional_description"
                  value={formData.additional_description}
                  onChange={(e) => setFormData({ ...formData, additional_description: e.target.value })}
                  placeholder="Ej: Limpieza de motor con hidrógeno"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="includes_additional"
                  checked={formData.includes_additional}
                  onCheckedChange={(checked) => setFormData({ ...formData, includes_additional: checked })}
                />
                <Label htmlFor="includes_additional">Incluir adicional por defecto</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Servicio activo</Label>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creando..." : "Crear Servicio"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de edición */}
      <Dialog open={editando} onOpenChange={setEditando}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Editar Servicio Específico</DialogTitle>
            <DialogDescription>
              Modifica los datos del servicio específico.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="flex flex-col h-full">
            <div className="grid gap-4 py-4 modal-scrollable">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-kilometers">Kilometraje *</Label>
                  <Input
                    id="edit-kilometers"
                    type="number"
                    min="1"
                    value={servicioSeleccionado?.kilometers || 0}
                    onChange={(e) => {
                      const km = parseInt(e.target.value) || 0
                      setServicioSeleccionado((prev) => {
                        if (!prev) return prev
                        const next = { ...prev, kilometers: km }
                        if (km > 0 && next.months > 0) {
                          next.service_name = generateServiceName(km, next.months)
                        }
                        return next
                      })
                    }}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-months">Meses *</Label>
                  <Input
                    id="edit-months"
                    type="number"
                    min="1"
                    value={servicioSeleccionado?.months || 0}
                    onChange={(e) => {
                      const m = parseInt(e.target.value) || 0
                      setServicioSeleccionado((prev) => {
                        if (!prev) return prev
                        const next = { ...prev, months: m }
                        if (next.kilometers > 0 && m > 0) {
                          next.service_name = generateServiceName(next.kilometers, m)
                        }
                        return next
                      })
                    }}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-service_name">Nombre del Servicio *</Label>
                <Input
                  id="edit-service_name"
                  value={servicioSeleccionado?.service_name || ""}
                  onChange={(e) => setServicioSeleccionado(prev => 
                    prev ? {...prev, service_name: e.target.value} : prev
                  )}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-price">Precio *</Label>
                <Input
                  id="edit-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={servicioSeleccionado?.price || 0}
                  onChange={(e) => setServicioSeleccionado(prev => 
                    prev ? {...prev, price: parseFloat(e.target.value) || 0} : prev
                  )}
                />
              </div>
              
              <ServiceDropdown
                label="Servicio Base *"
                options={services}
                selectedValue={servicioSeleccionado?.service_id || ""}
                onValueChange={(value) => setServicioSeleccionado(prev => 
                  prev ? {...prev, service_id: value} : prev
                )}
                placeholder="Seleccionar servicio base"
              />
              
              <div className="space-y-2">
                <Label htmlFor="edit-additional_price">Precio del Adicional</Label>
                <Input
                  id="edit-additional_price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={servicioSeleccionado?.additional_price || 0}
                  onChange={(e) => setServicioSeleccionado(prev => 
                    prev ? {...prev, additional_price: parseFloat(e.target.value) || 0} : prev
                  )}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-additional_description">Descripción del Adicional</Label>
                <Textarea
                  id="edit-additional_description"
                  value={servicioSeleccionado?.additional_description || ""}
                  onChange={(e) => setServicioSeleccionado(prev => 
                    prev ? {...prev, additional_description: e.target.value} : prev
                  )}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-includes_additional"
                  checked={servicioSeleccionado?.includes_additional || false}
                  onCheckedChange={(checked) => setServicioSeleccionado(prev => 
                    prev ? {...prev, includes_additional: checked} : prev
                  )}
                />
                <Label htmlFor="edit-includes_additional">Incluir adicional por defecto</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-is_active"
                  checked={servicioSeleccionado?.is_active || false}
                  onCheckedChange={(checked) => setServicioSeleccionado(prev => 
                    prev ? {...prev, is_active: checked} : prev
                  )}
                />
                <Label htmlFor="edit-is_active">Servicio activo</Label>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Toaster />
    </div>
  )
}
