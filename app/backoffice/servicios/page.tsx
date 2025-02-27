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

interface Servicio {
  id: string
  nombre: string
  descripcion: string
  duracion_estimada: number
  precio: number
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

      }
    }
  }, [searchParams, router]); 

  const { toast } = useToast()
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [loading, setLoading] = useState(false)
  const [nuevoServicio, setNuevoServicio] = useState<Omit<Servicio, 'id'>>({
    nombre: "",
    descripcion: "",
    duracion_estimada: 0,
    precio: 0
  })
  const [servicioSeleccionado, setServicioSeleccionado] = useState<Servicio | null>(null)
  const [editando, setEditando] = useState(false)

  useEffect(() => {
    cargarServicios()
  }, [])

  async function cargarServicios() {
    const { data, error } = await supabase
      .from('servicios')
      .select('*')
      .order('nombre')
    
    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar los servicios"
      })
      return
    }
    
    setServicios(data)
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(price)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!nuevoServicio.nombre.trim()) {
      toast({
        variant: "destructive",
        title: "Error de validación",
        description: "El nombre es obligatorio"
      })
      return
    }

    if (nuevoServicio.duracion_estimada <= 0) {
      toast({
        variant: "destructive",
        title: "Error de validación",
        description: "La duración debe ser mayor a 0 minutos"
      })
      return
    }

    if (nuevoServicio.precio < 0) {
      toast({
        variant: "destructive",
        title: "Error de validación",
        description: "El precio no puede ser negativo"
      })
      return
    }

    setLoading(true)

    try {
      const { data, error } = await supabase
        .from('servicios')
        .insert([{
          nombre: nuevoServicio.nombre,
          descripcion: nuevoServicio.descripcion,
          duracion_estimada: nuevoServicio.duracion_estimada,
          precio: nuevoServicio.precio
        }])
        .select()

      if (error) throw error

      if (data) {
        toast({
          title: "Servicio guardado",
          description: "El servicio se ha registrado correctamente",
        })
        setServicios([...servicios, data[0]])
        setMostrarFormulario(false)
        setNuevoServicio({
          nombre: "",
          descripcion: "",
          duracion_estimada: 0,
          precio: 0
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Hubo un problema al guardar el servicio"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!servicioSeleccionado!.nombre.trim()) {
      toast({
        variant: "destructive",
        title: "Error de validación",
        description: "El nombre es obligatorio"
      })
      return
    }

    if (servicioSeleccionado!.duracion_estimada <= 0) {
      toast({
        variant: "destructive",
        title: "Error de validación",
        description: "La duración debe ser mayor a 0 minutos"
      })
      return
    }

    if (servicioSeleccionado!.precio < 0) {
      toast({
        variant: "destructive",
        title: "Error de validación",
        description: "El precio no puede ser negativo"
      })
      return
    }

    if (!window.confirm('¿Está seguro de guardar los cambios?')) {
      return
    }

    setLoading(true)

    try {
      const { data, error } = await supabase
        .from('servicios')
        .update({
          nombre: servicioSeleccionado!.nombre,
          descripcion: servicioSeleccionado!.descripcion,
          duracion_estimada: servicioSeleccionado!.duracion_estimada,
          precio: servicioSeleccionado!.precio
        })
        .eq('id', servicioSeleccionado!.id)
        .select()

      if (error) throw error

      if (data) {
        toast({
          title: "Servicio actualizado",
          description: "Los cambios se han guardado correctamente",
        })
        setServicios(servicios.map(s => 
          s.id === servicioSeleccionado!.id ? data[0] : s
        ))
        setEditando(false)
        setServicioSeleccionado(null)
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Hubo un problema al actualizar el servicio"
      })
    } finally {
      setLoading(false)
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
              <TableCell className="font-medium">{servicio.nombre}</TableCell>
              <TableCell>{servicio.descripcion}</TableCell>
              <TableCell>{servicio.duracion_estimada} min</TableCell>
              <TableCell>{formatPrice(servicio.precio)}</TableCell>
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
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="nombre" className="text-right">Nombre *</Label>
                <Input
                  id="nombre"
                  className="col-span-3"
                  value={nuevoServicio.nombre}
                  onChange={(e) => setNuevoServicio({...nuevoServicio, nombre: e.target.value})}
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="descripcion" className="text-right">Descripción</Label>
                <Input
                  id="descripcion"
                  className="col-span-3"
                  value={nuevoServicio.descripcion}
                  onChange={(e) => setNuevoServicio({...nuevoServicio, descripcion: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="duracion" className="text-right">Duración (min) *</Label>
                <Input
                  id="duracion"
                  type="number"
                  min="1"
                  className="col-span-3"
                  value={nuevoServicio.duracion_estimada}
                  onChange={(e) => setNuevoServicio({...nuevoServicio, duracion_estimada: Number(e.target.value)})}
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="precio" className="text-right">Precio *</Label>
                <Input
                  id="precio"
                  type="number"
                  min="0"
                  step="0.01"
                  className="col-span-3"
                  value={nuevoServicio.precio}
                  onChange={(e) => setNuevoServicio({...nuevoServicio, precio: Number(e.target.value)})}
                  required
                />
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
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-nombre" className="text-right">Nombre *</Label>
                <Input
                  id="edit-nombre"
                  className="col-span-3"
                  value={servicioSeleccionado?.nombre}
                  onChange={(e) => setServicioSeleccionado(prev => 
                    prev ? {...prev, nombre: e.target.value} : prev
                  )}
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-descripcion" className="text-right">Descripción</Label>
                <Input
                  id="edit-descripcion"
                  className="col-span-3"
                  value={servicioSeleccionado?.descripcion}
                  onChange={(e) => setServicioSeleccionado(prev => 
                    prev ? {...prev, descripcion: e.target.value} : prev
                  )}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-duracion" className="text-right">Duración (min) *</Label>
                <Input
                  id="edit-duracion"
                  type="number"
                  min="1"
                  className="col-span-3"
                  value={servicioSeleccionado?.duracion_estimada}
                  onChange={(e) => setServicioSeleccionado(prev => 
                    prev ? {...prev, duracion_estimada: Number(e.target.value)} : prev
                  )}
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-precio" className="text-right">Precio *</Label>
                <Input
                  id="edit-precio"
                  type="number"
                  min="0"
                  step="0.01"
                  className="col-span-3"
                  value={servicioSeleccionado?.precio}
                  onChange={(e) => setServicioSeleccionado(prev => 
                    prev ? {...prev, precio: Number(e.target.value)} : prev
                  )}
                  required
                />
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

