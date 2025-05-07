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

interface Servicio {
  id: string
  service_name: string
  description: string
  duration_minutes: number
  price: number
  dealership_id?: string
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
        
        // Si el token no es válido, redirigir al login
        if (verifiedDataToken === null) {
          router.push("/login");
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
  const [formData, setFormData] = useState<Omit<Servicio, 'id'>>({
    service_name: "",
    description: "",
    duration_minutes: 0,
    price: 0
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
        .select('*')
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
            dealership_id: dealershipId // Añadir el dealership_id del token
          }
        ])

      if (error) throw error

      setMostrarFormulario(false)
      setFormData({
        service_name: '',
        description: '',
        duration_minutes: 30,
        price: 0
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
          price: servicioSeleccionado.price
        })
        .eq('id', servicioSeleccionado.id)

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
            <TableHead>Precio</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {servicios.map((servicio) => (
            <TableRow key={servicio.id}>
              <TableCell className="font-medium">{servicio.service_name}</TableCell>
              <TableCell>{servicio.description || '-'}</TableCell>
              <TableCell>{servicio.duration_minutes}</TableCell>
              <TableCell>{formatPrice(servicio.price || 0)}</TableCell>
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

