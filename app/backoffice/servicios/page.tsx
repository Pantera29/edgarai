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
import { MoreHorizontal } from 'lucide-react'
import { useRouter } from "next/navigation"
import { verifyToken } from "@/app/jwt/token"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, EyeOff } from 'lucide-react'

interface Servicio {
  id_uuid: string
  service_name: string
  description: string
  duration_minutes: number
  price: number
  daily_limit: number | null
  dealership_id?: string
  client_visible?: boolean
  available_monday?: boolean
  available_tuesday?: boolean
  available_wednesday?: boolean
  available_thursday?: boolean
  available_friday?: boolean
  available_saturday?: boolean
  available_sunday?: boolean
}

export default function ServiciosPage() {

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
        setDataToken(verifiedDataToken || {}); // Actualiza el estado de dataToken

        // Si hay un dealership_id en el token, cargar los servicios de esa agencia
        if (verifiedDataToken?.dealership_id) {
          cargarServicios(verifiedDataToken.dealership_id);
        } else {
          cargarServicios();
        }
      }
    }
  }, [searchParams, router]); 

  const { toast } = useToast()
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<Omit<Servicio, 'id_uuid'>>({
    service_name: "",
    description: "",
    duration_minutes: 0,
    price: 0,
    daily_limit: null,
    client_visible: true,
    available_monday: true,
    available_tuesday: true,
    available_wednesday: true,
    available_thursday: true,
    available_friday: true,
    available_saturday: true,
    available_sunday: true
  })
  const [servicioSeleccionado, setServicioSeleccionado] = useState<Servicio | null>(null)
  const [editando, setEditando] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    // No hacer nada aquí, ya que cargarServicios se llama después de verificar el token
  }, [])

  async function cargarServicios(dealershipIdFromToken?: string) {
    setLoading(true)
    try {
      // Si no hay dealership_id, no cargar nada
      if (!dealershipIdFromToken) {
        setServicios([]);
        return;
      }

      const { data, error } = await supabase
        .from('services')
        .select('id_uuid, service_name, description, duration_minutes, price, daily_limit, dealership_id, client_visible, available_monday, available_tuesday, available_wednesday, available_thursday, available_friday, available_saturday, available_sunday')
        .eq('dealership_id', dealershipIdFromToken)
        .order('service_name')

      if (error) throw error
      
      setServicios(data || [])
    } catch (error) {
      console.error('Error al cargar servicios:', error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los servicios",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(price)
  }

  // Función helper para generar resumen de días disponibles
  const getAvailableDaysSummary = (servicio: Servicio) => {
    const days = [
      { key: 'available_monday', short: 'Lun' },
      { key: 'available_tuesday', short: 'Mar' },
      { key: 'available_wednesday', short: 'Mié' },
      { key: 'available_thursday', short: 'Jue' },
      { key: 'available_friday', short: 'Vie' },
      { key: 'available_saturday', short: 'Sáb' },
      { key: 'available_sunday', short: 'Dom' }
    ];

    const availableDays = days.filter(day => servicio[day.key as keyof Servicio] === true);
    
    if (availableDays.length === 7) {
      return 'Todos los días';
    } else if (availableDays.length === 0) {
      return 'Ninguno';
    } else if (availableDays.length === 5 && 
               servicio.available_monday && servicio.available_tuesday && 
               servicio.available_wednesday && servicio.available_thursday && 
               servicio.available_friday) {
      return 'Lun-Vie';
    } else if (availableDays.length === 2 && 
               servicio.available_saturday && servicio.available_sunday) {
      return 'Fines de semana';
    } else {
      return availableDays.map(day => day.short).join(', ');
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.service_name || !formData.duration_minutes) {
      toast({
        title: "Error",
        description: "Por favor completa los campos requeridos",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      // Obtener el dealership_id del token JWT si existe
      const dealershipId = (dataToken as any)?.dealership_id;
      
      const { error } = await supabase
        .from('services')
        .insert([
          {
            service_name: formData.service_name,
            description: formData.description,
            duration_minutes: formData.duration_minutes,
            price: formData.price,
            daily_limit: formData.daily_limit,
            client_visible: formData.client_visible,
            available_monday: formData.available_monday,
            available_tuesday: formData.available_tuesday,
            available_wednesday: formData.available_wednesday,
            available_thursday: formData.available_thursday,
            available_friday: formData.available_friday,
            available_saturday: formData.available_saturday,
            available_sunday: formData.available_sunday,
            dealership_id: dealershipId // Añadir el dealership_id del token
          }
        ])

      if (error) throw error

      setMostrarFormulario(false)
      setFormData({
        service_name: '',
        description: '',
        duration_minutes: 30,
        price: 0,
        daily_limit: null,
        client_visible: true,
        available_monday: true,
        available_tuesday: true,
        available_wednesday: true,
        available_thursday: true,
        available_friday: true,
        available_saturday: true,
        available_sunday: true
      })
      toast({
        title: "Éxito",
        description: "Servicio agregado correctamente",
      })
      cargarServicios(dealershipId) // Pasar el dealership_id al recargar
    } catch (error) {
      console.error('Error al crear servicio:', error)
      toast({
        title: "Error",
        description: "No se pudo crear el servicio",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!servicioSeleccionado) return

    if (!servicioSeleccionado.service_name || !servicioSeleccionado.duration_minutes) {
      toast({
        title: "Error",
        description: "Por favor completa los campos requeridos",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const { error } = await supabase
        .from('services')
        .update({
          service_name: servicioSeleccionado.service_name,
          description: servicioSeleccionado.description,
          duration_minutes: servicioSeleccionado.duration_minutes,
          price: servicioSeleccionado.price,
          daily_limit: servicioSeleccionado.daily_limit,
          client_visible: servicioSeleccionado.client_visible,
          available_monday: servicioSeleccionado.available_monday,
          available_tuesday: servicioSeleccionado.available_tuesday,
          available_wednesday: servicioSeleccionado.available_wednesday,
          available_thursday: servicioSeleccionado.available_thursday,
          available_friday: servicioSeleccionado.available_friday,
          available_saturday: servicioSeleccionado.available_saturday,
          available_sunday: servicioSeleccionado.available_sunday
        })
        .eq('id_uuid', servicioSeleccionado.id_uuid)

      if (error) throw error

      setEditando(false)
      setServicioSeleccionado(null)
      toast({
        title: "Éxito",
        description: "Servicio actualizado correctamente",
      })
      // Obtener el dealership_id del token JWT
      const dealershipId = (dataToken as any)?.dealership_id;
      cargarServicios(dealershipId) // Pasar el dealership_id al recargar
    } catch (error) {
      console.error('Error al actualizar servicio:', error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el servicio",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id_uuid', id)

      if (error) throw error

      toast({
        title: "Éxito",
        description: "Servicio eliminado correctamente",
      })
      
      // Obtener el dealership_id del token JWT
      const dealershipId = (dataToken as any)?.dealership_id;
      cargarServicios(dealershipId)
    } catch (error) {
      console.error('Error al eliminar servicio:', error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el servicio",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-4">Servicios</h1>
      <div className="flex justify-between items-center mb-4">
        <Input
          placeholder="Buscar servicios..."
          className="max-w-sm"
        />
        <Button onClick={() => setMostrarFormulario(true)}>Añadir Nuevo Servicio</Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Descripción</TableHead>
            <TableHead>Duración (min)</TableHead>
            <TableHead>Límite Diario</TableHead>
            <TableHead>Días Disponibles</TableHead>
            <TableHead>Visible para clientes</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {servicios.map((servicio) => (
            <TableRow key={servicio.id_uuid}>
              <TableCell className="font-medium">{servicio.service_name}</TableCell>
              <TableCell>{servicio.description || '-'}</TableCell>
              <TableCell>{servicio.duration_minutes}</TableCell>
              <TableCell>{servicio.daily_limit ? `${servicio.daily_limit} por día` : 'Ilimitado'}</TableCell>
              <TableCell>
                <span className="text-sm font-medium text-gray-700">
                  {getAvailableDaysSummary(servicio)}
                </span>
              </TableCell>
              <TableCell>
                {servicio.client_visible ? (
                  <Eye className="h-4 w-4 text-green-600" />
                ) : (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                )}
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
                    <DropdownMenuItem onClick={() => {
                      setServicioSeleccionado(servicio)
                      setEditando(true)
                    }}>
                      Editar servicio
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => handleDelete(servicio.id_uuid)}
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

      <Dialog open={mostrarFormulario} onOpenChange={setMostrarFormulario}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Añadir Nuevo Servicio</DialogTitle>
            <DialogDescription>
              Complete los datos del nuevo servicio. Los campos marcados con * son obligatorios.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="space-y-1">
                <Label htmlFor="nombre">Nombre del Servicio</Label>
                <Input
                  id="nombre"
                  value={formData.service_name}
                  onChange={(e) => setFormData({ ...formData, service_name: e.target.value })}
                  placeholder="Ej: Cambio de aceite"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                  id="descripcion"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descripción del servicio"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="duracion">Duración (minutos)</Label>
                  <Input
                    id="duracion"
                    type="number"
                    min="5"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="precio">Precio</Label>
                  <Input
                    id="precio"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="daily_limit">Límite diario (opcional)</Label>
                <Input
                  id="daily_limit"
                  type="number"
                  min="1"
                  placeholder="Ej: 10 (máximo por día)"
                  value={formData.daily_limit || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    daily_limit: e.target.value ? parseInt(e.target.value) : null
                  }))}
                />
                <p className="text-xs text-muted-foreground">
                  Dejar vacío para permitir servicios ilimitados por día
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="client-visible"
                  checked={formData.client_visible ?? true}
                  onCheckedChange={(checked) => setFormData({ ...formData, client_visible: checked })}
                />
                <Label htmlFor="client-visible">Visible para clientes</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Los servicios visibles pueden ser agendados por los clientes. Los servicios internos solo son visibles para la agencia.
              </p>
              
              {/* Disponibilidad por días */}
              <div className="space-y-3">
                <Label>Disponibilidad por días</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="monday"
                      checked={formData.available_monday ?? true}
                      onCheckedChange={(checked) => setFormData({ ...formData, available_monday: checked })}
                    />
                    <Label htmlFor="monday">Lunes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="tuesday"
                      checked={formData.available_tuesday ?? true}
                      onCheckedChange={(checked) => setFormData({ ...formData, available_tuesday: checked })}
                    />
                    <Label htmlFor="tuesday">Martes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="wednesday"
                      checked={formData.available_wednesday ?? true}
                      onCheckedChange={(checked) => setFormData({ ...formData, available_wednesday: checked })}
                    />
                    <Label htmlFor="wednesday">Miércoles</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="thursday"
                      checked={formData.available_thursday ?? true}
                      onCheckedChange={(checked) => setFormData({ ...formData, available_thursday: checked })}
                    />
                    <Label htmlFor="thursday">Jueves</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="friday"
                      checked={formData.available_friday ?? true}
                      onCheckedChange={(checked) => setFormData({ ...formData, available_friday: checked })}
                    />
                    <Label htmlFor="friday">Viernes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="saturday"
                      checked={formData.available_saturday ?? true}
                      onCheckedChange={(checked) => setFormData({ ...formData, available_saturday: checked })}
                    />
                    <Label htmlFor="saturday">Sábado</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="sunday"
                      checked={formData.available_sunday ?? true}
                      onCheckedChange={(checked) => setFormData({ ...formData, available_sunday: checked })}
                    />
                    <Label htmlFor="sunday">Domingo</Label>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Selecciona los días en que este servicio estará disponible para agendar.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={loading}>
                {loading ? "Guardando..." : "Guardar Servicio"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={editando} onOpenChange={setEditando}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Servicio</DialogTitle>
            <DialogDescription>
              Modifique los datos del servicio.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate}>
            <div className="grid gap-4 py-4">
              <div className="space-y-1">
                <Label htmlFor="edit-nombre">Nombre del Servicio</Label>
                <Input
                  id="edit-nombre"
                  value={servicioSeleccionado?.service_name}
                  onChange={(e) => setServicioSeleccionado(prev => 
                    prev ? {...prev, service_name: e.target.value} : prev
                  )}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="edit-descripcion">Descripción</Label>
                <Textarea
                  id="edit-descripcion"
                  value={servicioSeleccionado?.description}
                  onChange={(e) => setServicioSeleccionado(prev => 
                    prev ? {...prev, description: e.target.value} : prev
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="edit-duracion">Duración (minutos)</Label>
                  <Input
                    id="edit-duracion"
                    type="number"
                    min="5"
                    value={servicioSeleccionado?.duration_minutes}
                    onChange={(e) => setServicioSeleccionado(prev => 
                      prev ? {...prev, duration_minutes: parseInt(e.target.value) || 0} : prev
                    )}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit-precio">Precio</Label>
                  <Input
                    id="edit-precio"
                    type="number"
                    min="0"
                    step="0.01"
                    value={servicioSeleccionado?.price}
                    onChange={(e) => setServicioSeleccionado(prev => 
                      prev ? {...prev, price: parseFloat(e.target.value) || 0} : prev
                    )}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="edit-daily-limit">Límite diario (opcional)</Label>
                <Input
                  id="edit-daily-limit"
                  type="number"
                  min="1"
                  placeholder="Ej: 10 (máximo por día)"
                  value={servicioSeleccionado?.daily_limit || ''}
                  onChange={(e) => setServicioSeleccionado(prev => 
                    prev ? {
                      ...prev, 
                      daily_limit: e.target.value ? parseInt(e.target.value) : null
                    } : prev
                  )}
                />
                <p className="text-xs text-muted-foreground">
                  Dejar vacío para permitir servicios ilimitados por día
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-client-visible"
                  checked={servicioSeleccionado?.client_visible ?? true}
                  onCheckedChange={(checked) => setServicioSeleccionado(prev => 
                    prev ? {...prev, client_visible: checked} : prev
                  )}
                />
                <Label htmlFor="edit-client-visible">Visible para clientes</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Los servicios visibles pueden ser agendados por los clientes. Los servicios internos solo son visibles para la agencia.
              </p>
              
              {/* Disponibilidad por días */}
              <div className="space-y-3">
                <Label>Disponibilidad por días</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="edit-monday"
                      checked={servicioSeleccionado?.available_monday ?? true}
                      onCheckedChange={(checked) => setServicioSeleccionado(prev => 
                        prev ? {...prev, available_monday: checked} : prev
                      )}
                    />
                    <Label htmlFor="edit-monday">Lunes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="edit-tuesday"
                      checked={servicioSeleccionado?.available_tuesday ?? true}
                      onCheckedChange={(checked) => setServicioSeleccionado(prev => 
                        prev ? {...prev, available_tuesday: checked} : prev
                      )}
                    />
                    <Label htmlFor="edit-tuesday">Martes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="edit-wednesday"
                      checked={servicioSeleccionado?.available_wednesday ?? true}
                      onCheckedChange={(checked) => setServicioSeleccionado(prev => 
                        prev ? {...prev, available_wednesday: checked} : prev
                      )}
                    />
                    <Label htmlFor="edit-wednesday">Miércoles</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="edit-thursday"
                      checked={servicioSeleccionado?.available_thursday ?? true}
                      onCheckedChange={(checked) => setServicioSeleccionado(prev => 
                        prev ? {...prev, available_thursday: checked} : prev
                      )}
                    />
                    <Label htmlFor="edit-thursday">Jueves</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="edit-friday"
                      checked={servicioSeleccionado?.available_friday ?? true}
                      onCheckedChange={(checked) => setServicioSeleccionado(prev => 
                        prev ? {...prev, available_friday: checked} : prev
                      )}
                    />
                    <Label htmlFor="edit-friday">Viernes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="edit-saturday"
                      checked={servicioSeleccionado?.available_saturday ?? true}
                      onCheckedChange={(checked) => setServicioSeleccionado(prev => 
                        prev ? {...prev, available_saturday: checked} : prev
                      )}
                    />
                    <Label htmlFor="edit-saturday">Sábado</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="edit-sunday"
                      checked={servicioSeleccionado?.available_sunday ?? true}
                      onCheckedChange={(checked) => setServicioSeleccionado(prev => 
                        prev ? {...prev, available_sunday: checked} : prev
                      )}
                    />
                    <Label htmlFor="edit-sunday">Domingo</Label>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Selecciona los días en que este servicio estará disponible para agendar.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={loading}>
                {loading ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Toaster />
    </div>
  )
}

