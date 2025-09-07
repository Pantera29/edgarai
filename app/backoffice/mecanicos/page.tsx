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
import { MoreHorizontal, Plus, Filter, Search, ChevronLeft, ChevronRight, Wrench } from 'lucide-react'
import { useRouter } from "next/navigation"
import { verifyToken } from "@/app/jwt/token"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FilterDropdown } from "@/components/FilterDropdown"
import { FormDropdown } from "@/components/FormDropdown"

interface Workshop {
  id: string
  name: string
  dealership_id: string
  is_main: boolean
}

interface Dealership {
  id: string
  name: string
}

interface Mechanic {
  id: string
  name: string
  email: string | null
  phone: string | null
  specialties: string[] | null
  is_active: boolean
  dealership_id: string
  workshop_id: string | null
  created_at: string
  dealerships?: {
    id: string
    name: string
  }
  workshops?: {
    id: string
    name: string
  } | null
}

export default function MecanicosPage() {
  const [searchParams, setSearchParams] = useState<URLSearchParams | null>(null)
  const [token, setToken] = useState<string>("")
  const [dataToken, setDataToken] = useState<object>({})

  const router = useRouter()
  const { toast } = useToast()

  // Estados para datos
  const [mechanics, setMechanics] = useState<Mechanic[]>([])
  const [workshops, setWorkshops] = useState<Workshop[]>([])
  const [dealerships, setDealerships] = useState<Dealership[]>([])

  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedWorkshop, setSelectedWorkshop] = useState<string>("all")
  const [showActiveOnly, setShowActiveOnly] = useState(true)
  
  // Estados para formulario
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    specialties: "",
    is_active: true,
    workshop_id: ""
  })

  // Estados para edición
  const [editando, setEditando] = useState(false)
  const [mecanicoSeleccionado, setMecanicoSeleccionado] = useState<Mechanic | null>(null)
  
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
        cargarMecanicos(dealershipId),
        cargarWorkshops(dealershipId)
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

  async function cargarMecanicos(dealershipId: string) {
    try {
      const response = await fetch(`/api/mechanics?dealership_id=${dealershipId}`)
      
      if (!response.ok) {
        throw new Error('Error al cargar mecánicos')
      }
      
      const result = await response.json()
      setMechanics(result.data || [])
    } catch (error) {
      console.error('Error al cargar mecánicos:', error)
      throw error
    }
  }

  async function cargarWorkshops(dealershipId: string) {
    try {
      const response = await fetch(`/api/workshops?dealership_id=${dealershipId}`)
      
      if (!response.ok) {
        throw new Error('Error al cargar talleres')
      }
      
      const result = await response.json()
      setWorkshops(result.data || [])
    } catch (error) {
      console.error('Error al cargar talleres:', error)
      throw error
    }
  }

  // Filtrar mecánicos
  const filteredMechanics = mechanics.filter(mechanic => {
    const matchesSearch = mechanic.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (mechanic.email && mechanic.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (mechanic.phone && mechanic.phone.includes(searchTerm))
    
    const matchesWorkshop = selectedWorkshop === "all" || mechanic.workshop_id === selectedWorkshop
    
    const matchesActive = !showActiveOnly || mechanic.is_active

    return matchesSearch && matchesWorkshop && matchesActive
  }).sort((a, b) => {
    // Ordenar por nombre
    return a.name.localeCompare(b.name)
  })

  // Calcular paginación
  const totalPages = Math.ceil(filteredMechanics.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedMechanics = filteredMechanics.slice(startIndex, endIndex)

  // Resetear página cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, selectedWorkshop, showActiveOnly, itemsPerPage])

  // Cargar taller principal cuando se abre el modal de creación
  useEffect(() => {
    if (mostrarFormulario && workshops.length > 0) {
      // Buscar el taller principal (is_main = true) y asignarlo por defecto
      const mainWorkshop = workshops.find(workshop => workshop.is_main === true)
      if (mainWorkshop) {
        setFormData(prev => ({
          ...prev,
          workshop_id: mainWorkshop.id
        }))
      }
    }
  }, [mostrarFormulario, workshops])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "El nombre del mecánico es requerido",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const dealershipId = (dataToken as any)?.dealership_id

      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim() || null,
        phone: formData.phone.trim() || null,
        specialties: formData.specialties.trim() || null,
        is_active: formData.is_active,
        dealership_id: dealershipId,
        workshop_id: formData.workshop_id || null
      }

      const res = await fetch('/api/mechanics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error || 'Error al crear mecánico')
      }

      setMostrarFormulario(false)
      setFormData({
        name: "",
        email: "",
        phone: "",
        specialties: "",
        is_active: true,
        workshop_id: ""
      })
      
      toast({
        title: "Éxito",
        description: "Mecánico creado correctamente",
      })
      
      cargarMecanicos(dealershipId)
    } catch (error) {
      console.error('Error al crear mecánico:', error)
      toast({
        title: "Error",
        description: "No se pudo crear el mecánico",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!mecanicoSeleccionado) return

    if (!mecanicoSeleccionado.name.trim()) {
      toast({
        title: "Error",
        description: "El nombre del mecánico es requerido",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/mechanics/${mecanicoSeleccionado.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: mecanicoSeleccionado.name.trim(),
          email: mecanicoSeleccionado.email?.trim() || null,
          phone: mecanicoSeleccionado.phone?.trim() || null,
          specialties: mecanicoSeleccionado.specialties?.join(', ') || null,
          is_active: mecanicoSeleccionado.is_active,
          workshop_id: mecanicoSeleccionado.workshop_id || null
        })
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error || 'Error al actualizar mecánico')
      }

      setEditando(false)
      setMecanicoSeleccionado(null)
      
      toast({
        title: "Éxito",
        description: "Mecánico actualizado correctamente",
      })
      
      const dealershipId = (dataToken as any)?.dealership_id
      cargarMecanicos(dealershipId)
    } catch (error) {
      console.error('Error al actualizar mecánico:', error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el mecánico",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }


  const handleEdit = (mechanic: Mechanic) => {
    setMecanicoSeleccionado(mechanic)
    setEditando(true)
  }

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/mechanics/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentStatus })
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error || 'Error al cambiar estado')
      }

      toast({
        title: "Éxito",
        description: `Mecánico ${!currentStatus ? 'activado' : 'desactivado'} correctamente`,
      })
      
      const dealershipId = (dataToken as any)?.dealership_id
      cargarMecanicos(dealershipId)
    } catch (error) {
      console.error('Error al cambiar estado:', error)
      toast({
        title: "Error",
        description: "No se pudo cambiar el estado del mecánico",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Mecánicos</h1>
          <p className="text-muted-foreground mt-2">
            Gestiona los mecánicos del taller
          </p>
        </div>
        <Button onClick={() => setMostrarFormulario(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Mecánico
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Buscar por nombre, email o teléfono..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <FilterDropdown
              label="Taller"
              options={workshops.map(workshop => ({
                ...workshop,
                name: workshop.is_main ? `${workshop.name} (Principal)` : workshop.name
              }))}
              selectedValue={selectedWorkshop}
              onValueChange={setSelectedWorkshop}
              placeholder="Todos los talleres"
              allOptionLabel="Todos los talleres"
            />
          </div>
          
          <div className="flex items-center space-x-2 mt-4">
            <Switch
              id="active-only"
              checked={showActiveOnly}
              onCheckedChange={setShowActiveOnly}
            />
            <Label htmlFor="active-only">Mostrar solo mecánicos activos</Label>
          </div>
        </CardContent>
      </Card>

      {/* Tabla */}
      <Card>
        <CardHeader>
          <CardTitle>
            Mecánicos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Taller</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedMechanics.map((mechanic) => (
                <TableRow key={mechanic.id}>
                  <TableCell className="font-medium">{mechanic.name}</TableCell>
                  <TableCell>{mechanic.email || "-"}</TableCell>
                  <TableCell>{mechanic.phone || "-"}</TableCell>
                  <TableCell>
                    {mechanic.workshops?.name || "-"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={mechanic.is_active ? "default" : "secondary"}>
                      {mechanic.is_active ? "Activo" : "Inactivo"}
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
                        <DropdownMenuItem onClick={() => handleEdit(mechanic)}>
                          Editar mecánico
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleToggleActive(mechanic.id, mechanic.is_active)}
                        >
                          {mechanic.is_active ? "Desactivar" : "Activar"}
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
              <p className="text-muted-foreground">Cargando mecánicos...</p>
            </div>
          )}
          
          {!loading && filteredMechanics.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No se encontraron mecánicos</p>
              <p className="text-sm text-muted-foreground mt-2">
                Intenta ajustar los filtros o crear un nuevo mecánico
              </p>
            </div>
          )}
          
          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-2 py-4">
              <div className="flex items-center space-x-4">
                <div className="text-sm text-muted-foreground">
                  Mostrando {startIndex + 1} a {Math.min(endIndex, filteredMechanics.length)} de {filteredMechanics.length} mecánicos
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
            <DialogTitle>Crear Nuevo Mecánico</DialogTitle>
            <DialogDescription>
              Agrega un nuevo mecánico al taller.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col h-full">
            <div className="grid gap-4 py-4 modal-scrollable">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nombre completo del mecánico"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@ejemplo.com"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  type="tel"
                  maxLength={10}
                  value={formData.phone}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '') // Solo números
                    if (value.length <= 10) {
                      setFormData({ ...formData, phone: value })
                    }
                  }}
                  placeholder="1123456789"
                />
                <p className="text-sm text-muted-foreground">Máximo 10 dígitos numéricos</p>
              </div>
              
              {/* Campo de especialidades oculto temporalmente */}
              {/* <div className="space-y-2">
                <Label htmlFor="specialties">Especialidades</Label>
                <Textarea
                  id="specialties"
                  value={formData.specialties}
                  onChange={(e) => setFormData({ ...formData, specialties: e.target.value })}
                  placeholder="Ej: Motor, transmisión, frenos, aire acondicionado..."
                />
              </div> */}
              
              <FormDropdown
                label="Taller"
                options={workshops.map(workshop => ({
                  ...workshop,
                  name: workshop.is_main ? `${workshop.name} (Principal)` : workshop.name
                }))}
                selectedValue={formData.workshop_id}
                onValueChange={(value) => setFormData({ ...formData, workshop_id: value })}
                placeholder="Seleccionar taller"
              />
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Mecánico activo</Label>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creando..." : "Crear Mecánico"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de edición */}
      <Dialog open={editando} onOpenChange={setEditando}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Editar Mecánico</DialogTitle>
            <DialogDescription>
              Modifica los datos del mecánico.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="flex flex-col h-full">
            <div className="grid gap-4 py-4 modal-scrollable">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nombre *</Label>
                <Input
                  id="edit-name"
                  value={mecanicoSeleccionado?.name || ""}
                  onChange={(e) => setMecanicoSeleccionado(prev => 
                    prev ? {...prev, name: e.target.value} : prev
                  )}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={mecanicoSeleccionado?.email || ""}
                  onChange={(e) => setMecanicoSeleccionado(prev => 
                    prev ? {...prev, email: e.target.value} : prev
                  )}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Teléfono</Label>
                <Input
                  id="edit-phone"
                  type="tel"
                  maxLength={10}
                  value={mecanicoSeleccionado?.phone || ""}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '') // Solo números
                    if (value.length <= 10) {
                      setMecanicoSeleccionado(prev => 
                        prev ? {...prev, phone: value} : prev
                      )
                    }
                  }}
                  placeholder="1123456789"
                />
                <p className="text-sm text-muted-foreground">Máximo 10 dígitos numéricos</p>
              </div>
              
              {/* Campo de especialidades oculto temporalmente */}
              {/* <div className="space-y-2">
                <Label htmlFor="edit-specialties">Especialidades</Label>
                <Textarea
                  id="edit-specialties"
                  value={mecanicoSeleccionado?.specialties ? mecanicoSeleccionado.specialties.join(', ') : ""}
                  onChange={(e) => setMecanicoSeleccionado(prev => 
                    prev ? {...prev, specialties: e.target.value} : prev
                  )}
                />
              </div> */}
              
              <FormDropdown
                label="Taller"
                options={workshops.map(workshop => ({
                  ...workshop,
                  name: workshop.is_main ? `${workshop.name} (Principal)` : workshop.name
                }))}
                selectedValue={mecanicoSeleccionado?.workshop_id || ""}
                onValueChange={(value) => setMecanicoSeleccionado(prev => 
                  prev ? {...prev, workshop_id: value} : prev
                )}
                placeholder="Seleccionar taller"
              />
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-is_active"
                  checked={mecanicoSeleccionado?.is_active || false}
                  onCheckedChange={(checked) => setMecanicoSeleccionado(prev => 
                    prev ? {...prev, is_active: checked} : prev
                  )}
                />
                <Label htmlFor="edit-is_active">Mecánico activo</Label>
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
