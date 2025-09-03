"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Car, Wrench, Calendar, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Vehiculo {
  id_uuid: string;
  make: string;
  model: string;
  year: number;
  license_plate: string | null;
  vin: string | null;
  last_km: number | null;
  last_service_date: string | null;
  created_at: string;
}

interface Cita {
  id: number;
  appointment_date: string;
  appointment_time: string;
  status: string;
  notes: string | null;
  services: {
    id_uuid: string;
    service_name: string;
    duration_minutes: number;
    price: number;
  };
  vehicles: {
    id_uuid: string;
    make: string;
    model: string;
    license_plate: string | null;
    year: number;
    vin: string | null;
  };
  specific_services?: {
    kilometers: number;
  };
}

interface ClienteContextPanelProps {
  clientId: string;
  dealershipId: string;
  userIdentifier?: string; // ← NUEVO: Número de teléfono para consultar phone_agent_settings
}

export function ClienteContextPanel({ clientId, dealershipId, userIdentifier }: ClienteContextPanelProps) {
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [citas, setCitas] = useState<Cita[]>([]);
  const [loadingVehiculos, setLoadingVehiculos] = useState(true);
  const [loadingCitas, setLoadingCitas] = useState(true);
  const [errorVehiculos, setErrorVehiculos] = useState<string | null>(null);
  const [errorCitas, setErrorCitas] = useState<string | null>(null);
  
  // ← NUEVO: Estados para la nota de acción humana
  const [actionHumanNote, setActionHumanNote] = useState<string | null>(null);
  const [loadingActionHumanNote, setLoadingActionHumanNote] = useState(false);
  const [errorActionHumanNote, setErrorActionHumanNote] = useState<string | null>(null);

  // Cargar vehículos del cliente
  useEffect(() => {
    const cargarVehiculos = async () => {
      try {
        console.log('🔄 [Context Panel] Cargando vehículos del cliente:', clientId);
        const response = await fetch(`/api/customers/${clientId}/vehicles?limit=3`);
        
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        setVehiculos(data.vehicles || []);
        console.log('✅ [Context Panel] Vehículos cargados:', data.vehicles?.length || 0);
      } catch (error) {
        console.error('❌ [Context Panel] Error cargando vehículos:', error);
        setErrorVehiculos('Error al cargar vehículos');
        setVehiculos([]);
      } finally {
        setLoadingVehiculos(false);
      }
    };

    if (clientId) {
      cargarVehiculos();
    }
  }, [clientId]);

  // Cargar citas del cliente
  useEffect(() => {
    const cargarCitas = async () => {
      try {
        console.log('🔄 [Context Panel] Cargando citas del cliente:', clientId);
        const response = await fetch(`/api/customers/${clientId}/appointments?limit=3`);
        
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        setCitas(data.appointments || []);
        console.log('✅ [Context Panel] Citas cargadas:', data.appointments?.length || 0);
      } catch (error) {
        console.error('❌ [Context Panel] Error cargando citas:', error);
        setErrorCitas('Error al cargar servicios');
        setCitas([]);
      } finally {
        setLoadingCitas(false);
      }
    };

    if (clientId) {
      cargarCitas();
    }
  }, [clientId]);

  // ← NUEVO: Cargar nota de acción humana
  useEffect(() => {
    const cargarNotaAccionHumana = async () => {
      if (!userIdentifier || !dealershipId) {
        console.log('ℹ️ [Context Panel] No se puede cargar nota - faltan datos:', { userIdentifier, dealershipId });
        return;
      }
      
      setLoadingActionHumanNote(true);
      try {
        console.log('🔄 [Context Panel] Cargando nota de acción humana para:', { userIdentifier, dealershipId });
        
        const response = await fetch(`/api/agent-control?phone_number=${userIdentifier}&dealership_id=${dealershipId}`);
        
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('📡 [Context Panel] Respuesta del API:', data);
        
        // Solo mostrar la nota si el agente está inactivo (necesita acción humana)
        if (data.exists && !data.agent_active && data.notes) {
          setActionHumanNote(data.notes);
          console.log('✅ [Context Panel] Nota de acción humana cargada:', data.notes);
        } else {
          setActionHumanNote(null);
          console.log('ℹ️ [Context Panel] No hay nota de acción humana o agente está activo:', {
            exists: data.exists,
            agent_active: data.agent_active,
            has_notes: !!data.notes
          });
        }
      } catch (error) {
        console.error('❌ [Context Panel] Error cargando nota de acción humana:', error);
        setErrorActionHumanNote('Error al cargar nota de acción humana');
        setActionHumanNote(null);
      } finally {
        setLoadingActionHumanNote(false);
      }
    };

    cargarNotaAccionHumana();
  }, [userIdentifier, dealershipId]);

  // Obtener estado de cita en español con colores
  const getEstadoCita = (status: string) => {
    const estados: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      'pending': { label: 'Pendiente', variant: 'outline' },
      'confirmed': { label: 'Confirmada', variant: 'secondary' },
      'in_progress': { label: 'En Progreso', variant: 'default' },
      'completed': { label: 'Completada', variant: 'default' },
      'cancelled': { label: 'Cancelada', variant: 'destructive' }
    };
    return estados[status] || { label: status, variant: 'outline' };
  };

  // Formatear fecha tal como viene de la base de datos
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getVehicleIdentifier = (vehicle: { license_plate: string | null; vin: string | null }) => {
    if (vehicle.vin) {
      return `VIN: ${vehicle.vin}`
    }
    if (vehicle.license_plate) {
      return vehicle.license_plate
    }
    return 'Sin identificación'
  }

  return (
    <div className="space-y-4">
      {/* ← NUEVA SECCIÓN: Nota de Acción Humana */}
      {userIdentifier && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <p className="text-sm font-medium text-amber-700">Estado del Agente</p>
          </div>
          
          {loadingActionHumanNote ? (
            <Skeleton className="h-16" />
          ) : errorActionHumanNote ? (
            <div className="text-center py-3 text-muted-foreground">
              <p className="text-xs">{errorActionHumanNote}</p>
            </div>
          ) : actionHumanNote ? (
            <Card className="p-3 border border-amber-200 bg-amber-50/50">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-amber-800 mb-1">Requiere Acción Humana</p>
                  <p className="text-xs text-amber-700 leading-relaxed">{actionHumanNote}</p>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-3 border border-green-200 bg-green-50/50">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <p className="text-xs text-green-700">Agente AI activo</p>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Sección de Vehículos */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Car className="h-4 w-4 text-blue-600" />
          <p className="text-sm font-medium text-blue-700">Vehículos del Cliente</p>
        </div>
        
        {loadingVehiculos ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : errorVehiculos ? (
          <div className="text-center py-3 text-muted-foreground">
            <p className="text-xs">{errorVehiculos}</p>
          </div>
        ) : vehiculos.length === 0 ? (
          <div className="text-center py-3 text-muted-foreground">
            <Car className="mx-auto h-6 w-6 mb-1" />
            <p className="text-xs">No hay vehículos registrados</p>
          </div>
        ) : (
          <div className="space-y-2">
            {vehiculos.map(vehiculo => (
              <Card key={vehiculo.id_uuid} className="p-3 border border-blue-100 bg-blue-50/30">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm">{vehiculo.make} {vehiculo.model}</div>
                    <div className="text-xs text-muted-foreground">
                      {vehiculo.year} • {getVehicleIdentifier(vehiculo)}
                    </div>
                  </div>
                  {vehiculo.last_service_date && (
                    <div className="text-right">
                      <div className="text-xs font-medium">Último servicio</div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(vehiculo.last_service_date)}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Sección de Servicios Recientes */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Wrench className="h-4 w-4 text-green-600" />
          <p className="text-sm font-medium text-green-700">Servicios Recientes</p>
        </div>
        
        {loadingCitas ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : errorCitas ? (
          <div className="text-center py-3 text-muted-foreground">
            <p className="text-xs">{errorCitas}</p>
          </div>
        ) : citas.length === 0 ? (
          <div className="text-center py-3 text-muted-foreground">
            <Wrench className="mx-auto h-6 w-6 mb-1" />
            <p className="text-xs">No hay servicios registrados</p>
          </div>
        ) : (
          <div className="space-y-2">
            {citas.map(cita => (
              <Card key={cita.id} className="p-3 border border-green-100 bg-green-50/30">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">
                      {cita.specific_services ? 
                        `Servicio de ${cita.specific_services.kilometers.toLocaleString('es-ES')}kms` : 
                        cita.services.service_name
                      }
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {cita.vehicles.make} {cita.vehicles.model} • {getVehicleIdentifier(cita.vehicles)}
                    </div>
                  </div>
                  <div className="text-right ml-2">
                    <Badge variant={getEstadoCita(cita.status).variant} className="text-xs">
                      {getEstadoCita(cita.status).label}
                    </Badge>
                    <div className="text-xs text-muted-foreground mt-1">
                      {formatDate(cita.appointment_date)}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
