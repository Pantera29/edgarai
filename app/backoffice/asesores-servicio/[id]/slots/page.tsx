"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { useRouter } from "next/navigation"
import { verifyToken } from "@/app/jwt/token"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Settings, Trash2, Plus, Clock } from 'lucide-react'
import { ServiceAdvisor, Service, AdvisorSlotWithService, DealershipConfiguration } from "@/types/database.types"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface SlotItem {
  position: number
  calculatedTime: string
  serviceId: string | null
  serviceName: string | null
}

export default function ConfigurarSlotsPage({ params }: { params: { id: string } }) {
  const [searchParams, setSearchParams] = useState<URLSearchParams | null>(null)
  const [token, setToken] = useState<string>("")
  const [dataToken, setDataToken] = useState<any>({})

  const router = useRouter()
  const { toast } = useToast()

  // Estados para datos
  const [advisor, setAdvisor] = useState<ServiceAdvisor | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [dealershipConfig, setDealershipConfig] = useState<DealershipConfiguration | null>(null)
  const [existingSlots, setExistingSlots] = useState<AdvisorSlotWithService[]>([])
  
  // Estados de UI
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Estado de los slots editables
  const [slots, setSlots] = useState<SlotItem[]>([])

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

      const loadedAdvisor: ServiceAdvisor = advisorData.data
      setAdvisor(loadedAdvisor)

      // Cargar configuración del dealership/workshop para obtener shift_duration
      const configParams = new URLSearchParams({
        dealership_id: dealershipId,
        workshop_id: loadedAdvisor.workshop_id,
      })
      
      // Aquí asumo que hay un endpoint para obtener la configuración, si no existe, usar un valor por defecto
      // Por ahora usaré un valor por defecto de 20 minutos
      const shiftDuration = 20 // minutos por defecto

      // Cargar servicios del dealership
      const servicesParams = new URLSearchParams({
        dealership_id: dealershipId,
      })
      
      const servicesRes = await fetch(`/api/services/list?${servicesParams.toString()}`)
      const servicesData = await servicesRes.json()
      
      // El endpoint devuelve { services: [...] }
      if (servicesData.services) {
        setServices(servicesData.services || [])
      } else {
        console.error('Error al cargar servicios:', servicesData)
      }

      // Cargar slots existentes
      const slotsRes = await fetch(`/api/service-advisors/${params.id}/slots`)
      const slotsData = await slotsRes.json()
      
      if (slotsData.success) {
        setExistingSlots(slotsData.data.slots || [])
      }

      // Calcular slots disponibles
      calcularSlots(loadedAdvisor, shiftDuration, slotsData.data.slots || [])

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

  function calcularSlots(
    advisor: ServiceAdvisor, 
    shiftDuration: number,
    existingSlots: AdvisorSlotWithService[]
  ) {
    const startTime = parseTime(advisor.shift_start_time)
    const endTime = parseTime(advisor.shift_end_time)
    const lunchStart = parseTime(advisor.lunch_start_time)
    const lunchEnd = parseTime(advisor.lunch_end_time)

    const totalMinutes = (endTime - startTime) / (1000 * 60)
    const lunchDuration = (lunchEnd - lunchStart) / (1000 * 60)
    const workingMinutes = totalMinutes - lunchDuration

    // Calcular número de slots posibles
    const maxSlots = Math.min(
      Math.floor(workingMinutes / shiftDuration),
      advisor.max_consecutive_services
    )

    const calculatedSlots: SlotItem[] = []
    let currentTime = startTime

    for (let i = 1; i <= maxSlots; i++) {
      // Saltar hora de almuerzo
      if (currentTime >= lunchStart && currentTime < lunchEnd) {
        currentTime = lunchEnd
      }

      const existingSlot = existingSlots.find(s => s.slot_position === i)

      calculatedSlots.push({
        position: i,
        calculatedTime: formatTime(currentTime),
        serviceId: existingSlot?.service_id || null,
        serviceName: existingSlot?.service?.service_name || null,
      })

      currentTime += shiftDuration * 60 * 1000
    }

    setSlots(calculatedSlots)
  }

  function parseTime(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number)
    const date = new Date()
    date.setHours(hours, minutes, 0, 0)
    return date.getTime()
  }

  function formatTime(timestamp: number): string {
    const date = new Date(timestamp)
    return date.toTimeString().slice(0, 5)
  }

  function handleServiceChange(position: number, serviceId: string) {
    // Convertir "unassigned" a null
    const actualServiceId = serviceId === "unassigned" ? null : serviceId
    
    setSlots(prev => prev.map(slot => 
      slot.position === position 
        ? { 
            ...slot, 
            serviceId: actualServiceId,
            serviceName: actualServiceId ? services.find(s => s.id_uuid === actualServiceId)?.service_name || null : null
          } 
        : slot
    ))
  }

  function handleRemoveSlot(position: number) {
    setSlots(prev => prev.map(slot => 
      slot.position === position 
        ? { ...slot, serviceId: null, serviceName: null } 
        : slot
    ))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    // Filtrar solo los slots que tienen servicio asignado
    const configuredSlots = slots
      .filter(slot => slot.serviceId !== null)
      .map(slot => ({
        position: slot.position,
        serviceId: slot.serviceId!,
      }))

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/service-advisors/${params.id}/slots`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          slots: configuredSlots,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Error al configurar slots')
      }

      toast({
        title: "Slots configurados",
        description: data.message || "La configuración de slots ha sido actualizada exitosamente",
      })

      // Recargar datos
      if (dataToken?.dealership_id) {
        cargarDatos(dataToken.dealership_id)
      }

    } catch (error: any) {
      console.error('Error al configurar slots:', error)
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

  if (loading) {
    return (
      <div className="container mx-auto py-6 max-w-5xl">
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Cargando configuración...</p>
          </div>
        </div>
      </div>
    )
  }

  const slotsConfigurados = slots.filter(s => s.serviceId !== null).length

  return (
    <div className="container mx-auto py-6 max-w-5xl">
      <Toaster />
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={handleVolver}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Settings className="h-8 w-8" />
            Configurar Slots
          </h1>
          <p className="text-muted-foreground mt-1">
            {advisor?.name || "Cargando..."}
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold">
            {slotsConfigurados} / {slots.length}
          </div>
          <p className="text-sm text-muted-foreground">Slots configurados</p>
        </div>
      </div>

      {/* Información del asesor */}
      <Alert className="mb-6">
        <Clock className="h-4 w-4" />
        <AlertDescription>
          <div className="font-semibold mb-2">Información del turno</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div>
              <span className="text-sm font-medium">Turno:</span>
              <p className="text-sm">{advisor?.shift_start_time.slice(0, 5)} - {advisor?.shift_end_time.slice(0, 5)}</p>
            </div>
            <div>
              <span className="text-sm font-medium">Almuerzo:</span>
              <p className="text-sm">{advisor?.lunch_start_time.slice(0, 5)} - {advisor?.lunch_end_time.slice(0, 5)}</p>
            </div>
            <div>
              <span className="text-sm font-medium">Máx. servicios:</span>
              <p className="text-sm">{advisor?.max_consecutive_services}</p>
            </div>
            <div>
              <span className="text-sm font-medium">Slots disponibles:</span>
              <p className="text-sm">{slots.length}</p>
            </div>
          </div>
        </AlertDescription>
      </Alert>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Lista de slots */}
        <Card>
          <CardHeader>
            <CardTitle>Configuración de Slots</CardTitle>
            <CardDescription>
              Asigna un servicio a cada slot. Los slots sin servicio asignado no estarán disponibles para citas.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {slots.map((slot) => (
              <div key={slot.position} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                {/* Número de slot */}
                <div className="flex-shrink-0 w-16">
                  <Badge variant="outline" className="font-mono">
                    #{slot.position}
                  </Badge>
                </div>

                {/* Hora calculada */}
                <div className="flex-shrink-0 w-24">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{slot.calculatedTime}</span>
                  </div>
                </div>

                {/* Selector de servicio */}
                <div className="flex-1">
                  <Select
                    value={slot.serviceId || "unassigned"}
                    onValueChange={(value) => handleServiceChange(slot.position, value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sin configurar - Selecciona un servicio">
                        {slot.serviceName || "Sin configurar"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Sin configurar</SelectItem>
                      {services.length > 0 ? services.map((service) => (
                        <SelectItem key={service.id_uuid} value={service.id_uuid}>
                          {service.service_name}
                          {service.duration_minutes && (
                            <span className="text-xs text-muted-foreground ml-2">
                              ({service.duration_minutes} min)
                            </span>
                          )}
                        </SelectItem>
                      )) : (
                        <SelectItem value="no-services" disabled>No hay servicios disponibles</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Botón eliminar */}
                {slot.serviceId && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveSlot(slot.position)}
                    className="flex-shrink-0"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                )}
              </div>
            ))}

            {slots.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No hay slots disponibles</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Verifica la configuración del horario del asesor
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resumen */}
        {slots.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Resumen</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total de slots disponibles:</span>
                  <span className="font-medium">{slots.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Slots configurados:</span>
                  <span className="font-medium text-green-600">{slotsConfigurados}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Slots sin configurar:</span>
                  <span className="font-medium text-orange-600">{slots.length - slotsConfigurados}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Botones de acción */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={handleVolver} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting || slots.length === 0}>
            {isSubmitting ? "Guardando..." : "Guardar Configuración"}
          </Button>
        </div>
      </form>
    </div>
  )
}

