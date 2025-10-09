"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { useRouter } from "next/navigation"
import { verifyToken } from "@/app/jwt/token"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, UserCheck } from 'lucide-react'
import { ServiceAdvisor, UpdateServiceAdvisorInput } from "@/types/database.types"

interface Workshop {
  id: string
  name: string
  address: string | null
}

export default function EditarAsesorPage({ params }: { params: { id: string } }) {
  const [searchParams, setSearchParams] = useState<URLSearchParams | null>(null)
  const [token, setToken] = useState<string>("")
  const [dataToken, setDataToken] = useState<any>({})

  const router = useRouter()
  const { toast } = useToast()

  // Estados para datos
  const [workshops, setWorkshops] = useState<Workshop[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [advisor, setAdvisor] = useState<ServiceAdvisor | null>(null)

  // Estado del formulario
  const [formData, setFormData] = useState<UpdateServiceAdvisorInput>({
    name: "",
    email: "",
    phone: "",
    workshop_id: "",
    shift_start_time: "",
    shift_end_time: "",
    lunch_start_time: "",
    lunch_end_time: "",
    works_monday: true,
    works_tuesday: true,
    works_wednesday: true,
    works_thursday: true,
    works_friday: true,
    works_saturday: false,
    works_sunday: false,
    max_consecutive_services: 10,
  })

  // Errores de validación
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search)
      setSearchParams(urlParams)
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
  }, [searchParams, router, params.id])

  async function cargarDatos(dealershipId: string) {
    setLoading(true)
    
    try {
      // Cargar asesor
      const advisorRes = await fetch(`/api/service-advisors/${params.id}`)
      const advisorData = await advisorRes.json()
      
      if (!advisorData.success) {
        throw new Error(advisorData.error || 'Error al cargar asesor')
      }

      const loadedAdvisor = advisorData.data
      setAdvisor(loadedAdvisor)
      
      // Cargar formulario con datos del asesor
      setFormData({
        name: loadedAdvisor.name,
        email: loadedAdvisor.email || "",
        phone: loadedAdvisor.phone || "",
        workshop_id: loadedAdvisor.workshop_id,
        shift_start_time: loadedAdvisor.shift_start_time,
        shift_end_time: loadedAdvisor.shift_end_time,
        lunch_start_time: loadedAdvisor.lunch_start_time,
        lunch_end_time: loadedAdvisor.lunch_end_time,
        works_monday: loadedAdvisor.works_monday,
        works_tuesday: loadedAdvisor.works_tuesday,
        works_wednesday: loadedAdvisor.works_wednesday,
        works_thursday: loadedAdvisor.works_thursday,
        works_friday: loadedAdvisor.works_friday,
        works_saturday: loadedAdvisor.works_saturday,
        works_sunday: loadedAdvisor.works_sunday,
        max_consecutive_services: loadedAdvisor.max_consecutive_services,
      })

      // Cargar talleres
      const workshopsParams = new URLSearchParams({
        dealership_id: dealershipId,
      })
      
      const workshopsRes = await fetch(`/api/workshops?${workshopsParams.toString()}`)
      const workshopsData = await workshopsRes.json()
      
      if (workshopsData.success) {
        setWorkshops(workshopsData.data || [])
      }

    } catch (error: any) {
      console.error('Error al cargar datos:', error)
      toast({
        title: "Error",
        description: error.message || "No se pudieron cargar los datos",
        variant: "destructive",
      })
      
      // Volver a la lista si no se puede cargar el asesor
      router.push(`/backoffice/asesores-servicio?token=${token}`)
    } finally {
      setLoading(false)
    }
  }

  function validateForm(): boolean {
    const newErrors: Record<string, string> = {}

    // Validaciones básicas
    if (!formData.name?.trim()) {
      newErrors.name = "El nombre es requerido"
    }

    if (!formData.workshop_id) {
      newErrors.workshop_id = "Debes seleccionar un taller"
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email inválido"
    }

    // Validar horarios
    if (formData.shift_end_time && formData.shift_start_time && 
        formData.shift_end_time <= formData.shift_start_time) {
      newErrors.shift_end_time = "La hora de fin debe ser posterior a la hora de inicio"
    }

    if (formData.lunch_end_time && formData.lunch_start_time && 
        formData.lunch_end_time <= formData.lunch_start_time) {
      newErrors.lunch_end_time = "La hora de fin del almuerzo debe ser posterior a la hora de inicio"
    }

    if (formData.lunch_start_time && formData.shift_start_time && formData.shift_end_time &&
        formData.lunch_end_time && 
        (formData.lunch_start_time < formData.shift_start_time || 
         formData.lunch_end_time > formData.shift_end_time)) {
      newErrors.lunch_start_time = "El horario de almuerzo debe estar dentro del turno"
    }

    // Validar al menos un día laborable
    if (!formData.works_monday && !formData.works_tuesday && !formData.works_wednesday && 
        !formData.works_thursday && !formData.works_friday && !formData.works_saturday && 
        !formData.works_sunday) {
      newErrors.works_monday = "Debes seleccionar al menos un día laborable"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!validateForm()) {
      toast({
        title: "Error de validación",
        description: "Por favor corrige los errores en el formulario",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/service-advisors/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Error al actualizar asesor')
      }

      toast({
        title: "Asesor actualizado",
        description: data.message || "El asesor ha sido actualizado exitosamente",
      })

      // Redirigir a la lista
      router.push(`/backoffice/asesores-servicio?token=${token}`)

    } catch (error: any) {
      console.error('Error al actualizar asesor:', error)
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleVolver() {
    router.push(`/backoffice/asesores-servicio?token=${token}`)
  }

  function handleCheckboxChange(day: keyof UpdateServiceAdvisorInput, checked: boolean) {
    setFormData(prev => ({ ...prev, [day]: checked }))
    // Limpiar error si existe
    if (errors.works_monday) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors.works_monday
        return newErrors
      })
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6 max-w-4xl">
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Cargando datos del asesor...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <Toaster />
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={handleVolver}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <UserCheck className="h-8 w-8" />
            Editar Asesor de Servicio
          </h1>
          <p className="text-muted-foreground mt-1">
            {advisor?.name || "Cargando..."}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información básica */}
        <Card>
          <CardHeader>
            <CardTitle>Información Básica</CardTitle>
            <CardDescription>Datos personales del asesor</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Nombre completo <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ej: Juan Pérez"
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="workshop_id">
                  Taller <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.workshop_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, workshop_id: value }))}
                >
                  <SelectTrigger id="workshop_id">
                    <SelectValue placeholder="Selecciona un taller" />
                  </SelectTrigger>
                  <SelectContent>
                    {workshops.map((workshop) => (
                      <SelectItem key={workshop.id} value={workshop.id}>
                        {workshop.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.workshop_id && (
                  <p className="text-sm text-red-500">{errors.workshop_id}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="ejemplo@correo.com"
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="5551234567"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Horarios */}
        <Card>
          <CardHeader>
            <CardTitle>Horarios de Trabajo</CardTitle>
            <CardDescription>Configura el horario de turno y almuerzo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="shift_start_time">Inicio del turno</Label>
                <Input
                  id="shift_start_time"
                  type="time"
                  value={formData.shift_start_time?.slice(0, 5)}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    shift_start_time: e.target.value + ":00" 
                  }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="shift_end_time">Fin del turno</Label>
                <Input
                  id="shift_end_time"
                  type="time"
                  value={formData.shift_end_time?.slice(0, 5)}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    shift_end_time: e.target.value + ":00" 
                  }))}
                />
                {errors.shift_end_time && (
                  <p className="text-sm text-red-500">{errors.shift_end_time}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lunch_start_time">Inicio del almuerzo</Label>
                <Input
                  id="lunch_start_time"
                  type="time"
                  value={formData.lunch_start_time?.slice(0, 5)}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    lunch_start_time: e.target.value + ":00" 
                  }))}
                />
                {errors.lunch_start_time && (
                  <p className="text-sm text-red-500">{errors.lunch_start_time}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lunch_end_time">Fin del almuerzo</Label>
                <Input
                  id="lunch_end_time"
                  type="time"
                  value={formData.lunch_end_time?.slice(0, 5)}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    lunch_end_time: e.target.value + ":00" 
                  }))}
                />
                {errors.lunch_end_time && (
                  <p className="text-sm text-red-500">{errors.lunch_end_time}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Días laborables */}
        <Card>
          <CardHeader>
            <CardTitle>Días Laborables</CardTitle>
            <CardDescription>Selecciona los días que trabaja el asesor</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { key: 'works_monday', label: 'Lunes' },
                { key: 'works_tuesday', label: 'Martes' },
                { key: 'works_wednesday', label: 'Miércoles' },
                { key: 'works_thursday', label: 'Jueves' },
                { key: 'works_friday', label: 'Viernes' },
                { key: 'works_saturday', label: 'Sábado' },
                { key: 'works_sunday', label: 'Domingo' },
              ].map(day => (
                <div key={day.key} className="flex items-center space-x-2">
                  <Checkbox
                    id={day.key}
                    checked={formData[day.key as keyof UpdateServiceAdvisorInput] as boolean}
                    onCheckedChange={(checked) => 
                      handleCheckboxChange(day.key as keyof UpdateServiceAdvisorInput, checked as boolean)
                    }
                  />
                  <Label htmlFor={day.key} className="cursor-pointer">
                    {day.label}
                  </Label>
                </div>
              ))}
            </div>
            {errors.works_monday && (
              <p className="text-sm text-red-500">{errors.works_monday}</p>
            )}
          </CardContent>
        </Card>

        {/* Configuración adicional */}
        <Card>
          <CardHeader>
            <CardTitle>Configuración Adicional</CardTitle>
            <CardDescription>Parámetros de capacidad</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="max_consecutive_services">
                Máximo de servicios consecutivos
              </Label>
              <Input
                id="max_consecutive_services"
                type="number"
                min="1"
                max="20"
                value={formData.max_consecutive_services}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  max_consecutive_services: parseInt(e.target.value) || 10 
                }))}
              />
              <p className="text-sm text-muted-foreground">
                Número máximo de servicios que puede atender por día
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Botones de acción */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={handleVolver} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Actualizando..." : "Actualizar Asesor"}
          </Button>
        </div>
      </form>
    </div>
  )
}

