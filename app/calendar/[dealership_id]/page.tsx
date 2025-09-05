'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar, Clock, User, Car, Wrench, AlertCircle, Loader2 } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  client: {
    names: string;
    phone_number: string;
  };
  vehicle: {
    make: string;
    model: string;
    license_plate: string;
  };
  service: {
    service_name: string;
    duration_minutes: number;
  };
  notes?: string;
  completion_notes?: string;
}

interface DealershipInfo {
  name: string;
  phone: string;
}

export default function PublicCalendarPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const supabase = createClientComponentClient();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dealershipInfo, setDealershipInfo] = useState<DealershipInfo | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [calendarTitle, setCalendarTitle] = useState<string>('');
  const calendarRef = useRef<any>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false);


  
  const dealershipId = params.dealership_id as string;
  const token = searchParams.get('token');

  useEffect(() => {
    validateTokenAndLoadData();
  }, [dealershipId, token]);

  const validateTokenAndLoadData = async () => {
    if (!token) {
      setError('Token de acceso requerido');
      setIsLoading(false);
      return;
    }

    try {
      console.log('🔄 Validando token de acceso...');
      
      // Validar token
      const response = await fetch(`/api/calendar/token?token=${token}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Token inválido');
      }

      if (!data.is_valid) {
        throw new Error('Token expirado o inválido');
      }

      setIsValid(true);
      console.log('✅ Token validado exitosamente');

      // Cargar información del dealership
      await loadDealershipInfo();
      
      // Cargar citas
      await loadAppointments();

    } catch (error) {
      console.log('❌ Error validando token:', error);
      setError(error instanceof Error ? error.message : 'Error de validación');
    } finally {
      setIsLoading(false);
    }
  };

  const loadDealershipInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('dealerships')
        .select('name, phone')
        .eq('id', dealershipId)
        .single();

      if (error) throw error;
      setDealershipInfo(data);
    } catch (error) {
      console.log('❌ Error cargando información del taller:', error);
    }
  };

  const loadAppointments = async () => {
    try {
      console.log('🔄 Cargando citas...');
      
      // Cargar citas de los últimos 7 días y próximos 30 días
      const startDate = format(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
      const endDate = format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
      
      console.log('📅 Rango de fechas:', startDate, 'a', endDate);
      
      const { data, error } = await supabase
        .from('appointment')
        .select(`
          id,
          appointment_date,
          appointment_time,
          status,
          notes,
          client:client_id (
            names,
            phone_number
          ),
          vehicle:vehicle_id (
            make,
            model,
            license_plate
          ),
          service:service_id (
            service_name,
            duration_minutes
          )
        `)
        .eq('dealership_id', dealershipId)
        .gte('appointment_date', startDate)
        .lte('appointment_date', endDate)
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true });

      if (error) throw error;
      
      console.log('📊 Datos raw de Supabase:', data);
      
      // Transformar los datos para que coincidan con la interfaz
      const transformedData = (data || []).map((appointment: any) => {
        console.log('🔍 Procesando cita:', appointment);
        
        return {
          id: appointment.id,
          appointment_date: appointment.appointment_date,
          appointment_time: appointment.appointment_time,
          status: appointment.status,
          notes: appointment.notes,
          client: {
            names: appointment.client?.names || '',
            phone_number: appointment.client?.phone_number || ''
          },
          vehicle: {
            make: appointment.vehicle?.make || '',
            model: appointment.vehicle?.model || '',
            license_plate: appointment.vehicle?.license_plate || ''
          },
          service: {
            service_name: appointment.service?.service_name || '',
            duration_minutes: appointment.service?.duration_minutes || 0
          }
        };
      });
      
      setAppointments(transformedData);
      console.log('✅ Citas cargadas:', transformedData.length);
      console.log('📋 Citas transformadas:', transformedData);
      
      // Verificar eventos del calendario
      const calendarEvents = getCalendarEvents();
      console.log('📅 Eventos del calendario:', calendarEvents);
    } catch (error) {
      console.log('❌ Error cargando citas:', error);
      console.error('Error completo:', error);
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Confirmada';
      case 'pending': return 'Pendiente';
      case 'in_progress': return 'En Progreso';
      case 'completed': return 'Completada';
      case 'cancelled': return 'Cancelada';
      default: return status;
    }
  };

  const formatTime = (time: string) => {
    return time.substring(0, 5); // Formato HH:MM
  };

  const formatDate = (date: string) => {
    // Parsear la fecha correctamente para evitar problemas de zona horaria
    const [year, month, day] = date.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day); // month - 1 porque los meses van de 0-11
    return format(dateObj, 'EEEE, d \'de\' MMMM', { locale: es });
  };

  // Convertir citas a formato de FullCalendar
  const getCalendarEvents = () => {
    return appointments.map(appointment => {
      const date = appointment.appointment_date;
      const time = appointment.appointment_time;
      const startStr = `${date}T${time}`;
      const startDate = new Date(startStr);
      const endDate = new Date(startDate);
      endDate.setMinutes(endDate.getMinutes() + (appointment.service.duration_minutes || 60));

      // Mapear colores según el estado (similar al calendario original)
      const statusColors: { [key: string]: string } = {
        pending: '#60a5fa', // azul
        confirmed: '#22c55e', // verde
        in_progress: '#facc15', // amarillo
        completed: '#4ade80', // verde claro
        cancelled: '#f87171', // rojo
        rescheduled: '#a78bfa' // violeta
      };

      return {
        id: appointment.id,
        title: `${appointment.client.names} - ${appointment.service.service_name}`,
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        status: appointment.status,
        client: appointment.client,
        vehicle: appointment.vehicle,
        service: appointment.service,
        notes: appointment.notes,
        backgroundColor: statusColors[appointment.status] || '#6b7280',
        borderColor: statusColors[appointment.status] || '#6b7280',
        textColor: '#000'
      };
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDatesSet = (arg: any) => {
    setCalendarTitle(arg.view.title);
  };

  const handleEventClick = (info: any) => {
    // Encontrar la cita correspondiente al evento (con conversión de tipos)
    const appointment = appointments.find(a => a.id === info.event.id) ||
                       appointments.find(a => String(a.id) === String(info.event.id)) ||
                       appointments.find(a => Number(a.id) === Number(info.event.id));
    
    if (appointment) {
      setSelectedAppointment(appointment);
      setAppointmentModalOpen(true);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Verificando acceso...</p>
        </div>
      </div>
    );
  }

  if (!isValid || error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-red-600">Acceso Denegado</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">
              {error || 'No tienes permisos para acceder a este calendario'}
            </p>
            <p className="text-sm text-gray-500">
              Contacta al administrador del taller para obtener un enlace válido
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Calendario de Citas
                </h1>
                {dealershipInfo && (
                  <p className="text-sm text-gray-600">{dealershipInfo.name}</p>
                )}
              </div>
            </div>
            <Badge variant="secondary" className="text-xs">
              Solo Lectura
            </Badge>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-6">
                    {/* Calendario */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Calendario de Citas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="min-h-[600px]">
                {appointments.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No hay citas en el rango de fechas seleccionado</p>
                  </div>
                ) : (
                  <FullCalendar
                    ref={calendarRef}
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                    initialView="timeGridWeek"
                    headerToolbar={{
                      left: 'prev,next today',
                      center: 'title',
                      right: 'dayGridMonth,timeGridWeek,timeGridDay'
                    }}
                    buttonText={{
                      today: 'Hoy',
                      month: 'Mes',
                      week: 'Semana',
                      day: 'Día'
                    }}
                    locale="es"
                    events={getCalendarEvents()}
                    eventClick={handleEventClick}
                    datesSet={handleDatesSet}
                    height="auto"
                    allDaySlot={false}
                    slotMinTime="08:00:00"
                    slotMaxTime="17:00:00"
                    slotDuration="00:30:00"
                    nowIndicator={true}
                    editable={false}
                    selectable={false}
                    dayMaxEvents={true}
                    weekends={true}
                    eventDisplay="block"
                    eventTimeFormat={{
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false
                    }}
                    eventInteractive={true}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal de Detalle de Cita */}
      <Dialog open={appointmentModalOpen} onOpenChange={setAppointmentModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Detalle de Cita
            </DialogTitle>
          </DialogHeader>
          
          {selectedAppointment && (
            <div className="space-y-6">
              {/* Información de Tiempo y Estado */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="font-semibold text-lg">
                      {formatTime(selectedAppointment.appointment_time)}
                    </p>
                    <p className="text-sm text-gray-600">
                      {formatDate(selectedAppointment.appointment_date)}
                    </p>
                  </div>
                </div>
                <Badge className={getStatusColor(selectedAppointment.status)}>
                  {getStatusText(selectedAppointment.status)}
                </Badge>
              </div>

              {/* Información del Cliente */}
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Cliente
                </h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="font-medium">{selectedAppointment.client.names}</p>
                  <p className="text-sm text-gray-600">{selectedAppointment.client.phone_number}</p>
                </div>
              </div>

              {/* Información del Vehículo */}
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Car className="h-4 w-4" />
                  Vehículo
                </h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="font-medium">
                    {selectedAppointment.vehicle.make} {selectedAppointment.vehicle.model}
                  </p>
                  <p className="text-sm text-gray-600">
                    Placa: {selectedAppointment.vehicle.license_plate}
                  </p>
                </div>
              </div>

              {/* Información del Servicio */}
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Wrench className="h-4 w-4" />
                  Servicio
                </h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="font-medium">{selectedAppointment.service.service_name}</p>
                  <p className="text-sm text-gray-600">
                    Duración: {selectedAppointment.service.duration_minutes} minutos
                  </p>
                </div>
              </div>

              {/* Notas */}
              {selectedAppointment.notes && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900">Notas</h3>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-blue-800">{selectedAppointment.notes}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 