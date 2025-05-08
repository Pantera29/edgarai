"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createBrowserClient } from "@supabase/ssr"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CalendarIcon, Search, Pencil, Plus, History } from "lucide-react"
import { useRouter } from "next/navigation"
import { verifyToken } from "@/app/jwt/token"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Checkbox } from "@/components/ui/checkbox"
import React from "react"

interface Recordatorio {
  reminder_id: string
  client_id_uuid: string
  vehicle_id: string
  service_id: string | null
  base_date: string
  reminder_date: string
  sent_date: string | null
  status: 'pending' | 'sent' | 'completed' | 'cancelled' | 'error'
  notes: string
  created_at: string
  updated_at: string
  client: {
    names: string
    email: string
    phone_number: string
    dealership_id: string
  }
  vehicles: {
    make: string
    model: string
    year: number
    license_plate: string
  }
  services?: {
    service_name: string
    description: string
    dealership_id: string
  }
}

// Componente mejorado para el combobox de clientes
function ClienteComboBox({ clientes, onSelect, value }: { clientes: any[], onSelect: (id: string) => void, value: string }) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const triggerRef = React.useRef<HTMLDivElement>(null);

  // Buscar el cliente seleccionado
  const selectedClient = clientes.find(c => c.id === value);

  // Filtrar clientes por búsqueda de nombre
  const filtered = search.trim() === ''
    ? clientes
    : clientes.filter(cliente =>
        cliente.names.toLowerCase().includes(search.toLowerCase())
      );

  // Cerrar el dropdown si se hace clic fuera
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  return (
    <div className="relative w-full" ref={triggerRef}>
      <button
        type="button"
        className="w-full border rounded-md px-3 py-2 text-left bg-white"
        onClick={() => setOpen((prev) => !prev)}
      >
        {selectedClient
          ? `${selectedClient.names} (${selectedClient.phone_number})`
          : "Selecciona un cliente..."}
      </button>
      {open && (
        <div className="absolute z-10 mt-1 w-full bg-white border rounded-md shadow-lg">
          <input
            type="text"
            className="w-full px-3 py-2 border-b outline-none"
            placeholder="Buscar cliente por nombre..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
          />
          <ul className="max-h-60 overflow-y-auto">
            {filtered.length > 0 ? (
              filtered.map((cliente) => (
                <li
                  key={cliente.id}
                  className={`px-3 py-2 cursor-pointer hover:bg-blue-100 ${value === cliente.id ? 'bg-blue-50 font-semibold' : ''}`}
                  onClick={() => {
                    onSelect(cliente.id);
                    setOpen(false);
                    setSearch('');
                  }}
                >
                  {cliente.names} ({cliente.phone_number})
                </li>
              ))
            ) : (
              <li className="px-3 py-2 text-gray-400">No se encontraron clientes</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function RecordatoriosPage() {
  const [searchParams, setSearchParams] = useState<URLSearchParams | null>(null);
  const [token, setToken] = useState<string>("");
  const [dataToken, setDataToken] = useState<object>({});
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [clientes, setClientes] = useState<any[]>([]);
  const [vehiculos, setVehiculos] = useState<any[]>([]);
  const [seleccionados, setSeleccionados] = useState<string[]>([]);
  const [isLlamando, setIsLlamando] = useState(false);
  const [formData, setFormData] = useState({
    client_id: '',
    vehicle_id: '',
    service_id: '',
    base_date: '',
    reminder_date: '',
    notes: ''
  });
  const [servicios, setServicios] = useState<any[]>([]);
  const { toast } = useToast();

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

        // Si hay un dealership_id en el token, cargar los recordatorios de esa agencia
        if (verifiedDataToken?.dealership_id) {
          fetchRecordatorios(verifiedDataToken.dealership_id);
        } else {
          fetchRecordatorios();
        }
      }
    }
  }, [searchParams, router]); 

  const [recordatorios, setRecordatorios] = useState<Recordatorio[]>([])
  const [filteredRecordatorios, setFilteredRecordatorios] = useState<Recordatorio[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [stats, setStats] = useState({
    pendientes: 0,
    enviados: 0,
    paraHoy: 0,
    conError: 0
  })
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    // Este efecto se deja vacío porque ahora cargamos los recordatorios
    // después de verificar el token
  }, [])

  const fetchRecordatorios = async (dealershipIdFromToken?: string) => {
    const { data, error } = await supabase
      .from('reminders')
      .select(`
        *,
        client!reminders_client_id_fkey (
          names,
          email,
          phone_number,
          dealership_id
        ),
        vehicles!reminders_vehicle_id_fkey (
          make,
          model,
          year,
          license_plate
        ),
        services (
          service_name,
          description,
          dealership_id
        )
      `)
      .order('reminder_date', { ascending: true })

    if (error) {
      console.error('Error fetching recordatorios:', error)
      return
    }

    if (data) {
      // Si hay un dealership_id en el token, filtrar los recordatorios
      let filteredData = data as Recordatorio[];
      
      if (dealershipIdFromToken) {
        console.log("Filtrando recordatorios por dealership_id:", dealershipIdFromToken);
        // Filtrar los recordatorios por el dealership_id del cliente
        filteredData = filteredData.filter(recordatorio => 
          recordatorio.client && 
          recordatorio.client.dealership_id === dealershipIdFromToken
        );
      }
      
      setRecordatorios(filteredData)
      setFilteredRecordatorios(filteredData)
      updateStats(filteredData)
    }
  }

  const updateStats = (data: Recordatorio[]) => {
    const today = new Date().toISOString().split('T')[0]
    
    setStats({
      pendientes: data.filter(r => r.status === 'pending').length,
      enviados: data.filter(r => r.status === 'sent').length,
      paraHoy: data.filter(r => r.reminder_date.startsWith(today)).length,
      conError: data.filter(r => r.status === 'error').length
    })
  }

  const filterRecordatorios = (estado: string) => {
    let filtered = recordatorios
    
    if (estado !== 'todos') {
      filtered = filtered.filter(r => r.status === mapEstado(estado))
    }
    
    if (searchTerm) {
      filtered = filtered.filter(r => 
        r.client.names.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${r.vehicles.make} ${r.vehicles.model}`.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    if (selectedDate) {
      filtered = filtered.filter(r => 
        r.reminder_date.startsWith(format(selectedDate, 'yyyy-MM-dd'))
      )
    }
    
    setFilteredRecordatorios(filtered)
  }

  const mapEstado = (estado: string): string => {
    const mapeo = {
      'pendiente': 'pending',
      'enviado': 'sent',
      'completado': 'completed',
      'cancelado': 'cancelled',
      'error': 'error',
      'todos': 'todos'
    }
    return mapeo[estado as keyof typeof mapeo]
  }

  const getEstadoBadge = (estado: string) => {
    const styles = {
      pending: "bg-blue-100 text-blue-800",
      sent: "bg-green-100 text-green-800",
      completed: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
      error: "bg-red-100 text-red-800"
    };

    const labels = {
      pending: "Pendiente",
      sent: "Enviado",
      completed: "Completado",
      cancelled: "Cancelado",
      error: "Error"
    };

    return (
      <span className={`inline-block min-w-[100px] text-center px-2 py-1 rounded-full text-xs font-medium ${styles[estado as keyof typeof styles]}`}>
        {labels[estado as keyof typeof labels]}
      </span>
    );
  }

  const cargarClientes = async () => {
    try {
      console.log('Iniciando carga de clientes...');
      
      // Obtener el dealership_id del token si existe
      const dealershipId = (dataToken as any)?.dealership_id;
      console.log('Dealership ID:', dealershipId);

      let query = supabase
        .from('client')
        .select('id, names, phone_number')
        .order('names');

      // Si hay un dealership_id, filtrar por él
      if (dealershipId) {
        query = query.eq('dealership_id', dealershipId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error al cargar clientes:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los clientes",
          variant: "destructive",
        });
        return;
      }

      console.log('Clientes cargados:', data);
      setClientes(data || []);
    } catch (error) {
      console.error('Error en cargarClientes:', error);
      toast({
        title: "Error",
        description: "Error al cargar los clientes",
        variant: "destructive",
      });
    }
  };

  const cargarVehiculos = async (clientId: string) => {
    try {
      console.log('Iniciando carga de vehículos para cliente:', clientId);
      
      const { data, error } = await supabase
        .from('vehicles')
        .select('id_uuid, make, model, year, license_plate')
        .eq('client_id', clientId)
        .order('make');

      if (error) {
        console.error('Error al cargar vehículos:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los vehículos",
          variant: "destructive",
        });
        return;
      }

      console.log('Vehículos cargados:', data);
      setVehiculos(data || []);
    } catch (error) {
      console.error('Error en cargarVehiculos:', error);
      toast({
        title: "Error",
        description: "Error al cargar los vehículos",
        variant: "destructive",
      });
    }
  };

  const cargarServicios = async () => {
    try {
      console.log('Iniciando carga de servicios...');
      
      // Obtener el dealership_id del token si existe
      const dealershipId = (dataToken as any)?.dealership_id;
      console.log('Dealership ID:', dealershipId);

      let query = supabase
        .from('services')
        .select('id_uuid, service_name, description')
        .order('service_name');

      // Si hay un dealership_id, filtrar por él
      if (dealershipId) {
        query = query.eq('dealership_id', dealershipId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error al cargar servicios:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los servicios",
          variant: "destructive",
        });
        return;
      }

      console.log('Servicios cargados:', data);
      setServicios(data || []);
    } catch (error) {
      console.error('Error en cargarServicios:', error);
      toast({
        title: "Error",
        description: "Error al cargar los servicios",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (mostrarFormulario) {
      cargarClientes();
      cargarServicios();
    }
  }, [mostrarFormulario]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.client_id || !formData.vehicle_id || !formData.service_id || !formData.base_date || !formData.reminder_date) {
      toast({
        title: "Error",
        description: "Por favor complete todos los campos requeridos",
        variant: "destructive",
      });
      return;
    }

    try {
      // Convertir fechas a medianoche UTC
      const baseDateUTC = new Date(formData.base_date + "T00:00:00Z").toISOString();
      const reminderDateUTC = new Date(formData.reminder_date + "T00:00:00Z").toISOString();
      const recordatorioData = {
        client_id_uuid: formData.client_id,
        vehicle_id: formData.vehicle_id,
        service_id: formData.service_id,
        base_date: baseDateUTC,
        reminder_date: reminderDateUTC,
        notes: formData.notes,
        status: 'pending' as const
      };

      const { data, error } = await supabase
        .from('reminders')
        .insert([recordatorioData])
        .select();

      if (error) {
        console.error('Error detallado:', error);
        throw error;
      }

      toast({
        title: "Éxito",
        description: "Recordatorio creado correctamente",
      });

      setMostrarFormulario(false);
      setFormData({
        client_id: '',
        vehicle_id: '',
        service_id: '',
        base_date: '',
        reminder_date: '',
        notes: ''
      });
      
      fetchRecordatorios();
    } catch (error) {
      console.error('Error al crear recordatorio:', error);
      toast({
        title: "Error",
        description: "No se pudo crear el recordatorio. Verifique los datos ingresados.",
        variant: "destructive",
      });
    }
  };

  const [recordatorioEditar, setRecordatorioEditar] = useState<Recordatorio | null>(null);
  const [mostrarFormularioEditar, setMostrarFormularioEditar] = useState(false);
  const [formDataEditar, setFormDataEditar] = useState({
    client_id: '',
    vehicle_id: '',
    service_id: '',
    base_date: '',
    reminder_date: '',
    notes: ''
  });

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formDataEditar.client_id || !formDataEditar.vehicle_id || !formDataEditar.service_id || !formDataEditar.base_date || !formDataEditar.reminder_date) {
      toast({
        title: "Error",
        description: "Por favor complete todos los campos requeridos",
        variant: "destructive",
      });
      return;
    }

    try {
      // Convertir fechas a medianoche UTC
      const baseDateUTC = new Date(formDataEditar.base_date + "T00:00:00Z").toISOString();
      const reminderDateUTC = new Date(formDataEditar.reminder_date + "T00:00:00Z").toISOString();
      const { error } = await supabase
        .from('reminders')
        .update({
          client_id_uuid: formDataEditar.client_id,
          vehicle_id: formDataEditar.vehicle_id,
          service_id: formDataEditar.service_id,
          base_date: baseDateUTC,
          reminder_date: reminderDateUTC,
          notes: formDataEditar.notes
        })
        .eq('reminder_id', recordatorioEditar?.reminder_id);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Recordatorio actualizado correctamente"
      });

      setMostrarFormularioEditar(false);
      await fetchRecordatorios();
    } catch (error) {
      console.error('Error al actualizar recordatorio:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el recordatorio",
        variant: "destructive",
      });
    }
  };

  const handleSeleccionar = (reminderId: string) => {
    setSeleccionados(prev => {
      if (prev.includes(reminderId)) {
        return prev.filter(id => id !== reminderId);
      } else if (prev.length < 5) {
        return [...prev, reminderId];
      }
      return prev;
    });
  };

  const handleLlamarAI = async () => {
    if (seleccionados.length === 0) return;

    setIsLlamando(true);
    try {
      const recordatoriosSeleccionados = recordatorios.filter(r => seleccionados.includes(r.reminder_id));
      const bearer = process.env.NEXT_PUBLIC_VAPI_BEARER;
      const response = await fetch('https://api.vapi.ai/call', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${bearer}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          assistantId: "f7be88f4-04c5-4bfc-9737-c200e46e7083",
          assistantOverrides: {
            firstMessageMode: "assistant-waits-for-user"
          },
          customers: recordatoriosSeleccionados.map(r => ({
            number: r.client.phone_number.startsWith('+52') 
              ? r.client.phone_number 
              : `+52${r.client.phone_number}`,
            name: r.client.names
          })),
          phoneNumberId: "2a5d74e9-f465-4b6b-bd7a-4c999f63cbbf"
        })
      });

      if (!response.ok) throw new Error('Error al realizar la llamada');
      const vapiResponse = await response.json();

      // Registrar cada llamada en outbound_calls
      for (let i = 0; i < recordatoriosSeleccionados.length; i++) {
        const recordatorio = recordatoriosSeleccionados[i];
        const result = vapiResponse.results[i];
        if (!result) continue;
        const insertData = {
          reminder_id: recordatorio.reminder_id,
          client_id: recordatorio.client_id_uuid,
          vehicle_id: recordatorio.vehicle_id,
          vapi_call_id: result.id,
          assistant_id: result.assistantId,
          phone_number_id: result.phoneNumberId,
          customer_name: result.customer?.name || null,
          customer_phone: result.customer?.number || null,
          status: result.status || "queued",
          twilio_call_id: result.phoneCallProviderId || null,
          start_date: result.createdAt ? new Date(result.createdAt).toISOString() : null,
          call_data: vapiResponse,
        };
        await supabase.from('outbound_calls').insert([insertData]);
      }

      // Actualizar estado de los recordatorios
      const { error } = await supabase
        .from('reminders')
        .update({ status: 'sent' })
        .in('reminder_id', seleccionados);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Llamadas iniciadas correctamente"
      });

      // Refrescar los recordatorios
      await fetchRecordatorios();
      setSeleccionados([]);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "No se pudieron iniciar las llamadas",
        variant: "destructive"
      });
    } finally {
      setIsLlamando(false);
    }
  };

  const [mostrarHistorial, setMostrarHistorial] = useState(false);
  const [llamadasHistorial, setLlamadasHistorial] = useState<any[]>([]);
  const [recordatorioHistorial, setRecordatorioHistorial] = useState<Recordatorio | null>(null);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);

  const abrirHistorial = async (recordatorio: Recordatorio) => {
    setRecordatorioHistorial(recordatorio);
    setMostrarHistorial(true);
    setCargandoHistorial(true);
    const { data, error } = await supabase
      .from('outbound_calls')
      .select('*')
      .eq('reminder_id', recordatorio.reminder_id)
      .order('created_at', { ascending: false });
    if (!error) setLlamadasHistorial(data || []);
    setCargandoHistorial(false);
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Recordatorios</h1>
        <Button 
          onClick={() => setMostrarFormulario(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Recordatorio
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendientes}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enviados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.enviados}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Para Hoy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.paraHoy}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Con Error</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.conError}</div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Input
              placeholder="Buscar por cliente o vehículo..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                filterRecordatorios('todos')
              }}
              className="max-w-sm"
            />
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, 'PPP', { locale: es }) : <span>Filtrar por fecha</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  setSelectedDate(date)
                  filterRecordatorios('todos')
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <Tabs defaultValue="todos" className="w-full" onValueChange={filterRecordatorios}>
          <TabsList>
            <TabsTrigger value="todos">Todos</TabsTrigger>
            <TabsTrigger value="pendiente">Pendientes</TabsTrigger>
            <TabsTrigger value="enviado">Enviados</TabsTrigger>
            <TabsTrigger value="completado">Completados</TabsTrigger>
            <TabsTrigger value="error">Errores</TabsTrigger>
          </TabsList>

          <div className="mt-4">
            <div className="flex justify-between items-center mb-4">
              <Button
                onClick={handleLlamarAI}
                disabled={seleccionados.length === 0 || isLlamando}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isLlamando ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Llamando...
                  </>
                ) : (
                  `Llamar con AI (${seleccionados.length}/5)`
                )}
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={seleccionados.length === filteredRecordatorios.length && filteredRecordatorios.length > 0}
                      onCheckedChange={() => {
                        if (seleccionados.length === filteredRecordatorios.length) {
                          setSeleccionados([]);
                        } else {
                          const nuevosSeleccionados = filteredRecordatorios
                            .slice(0, 5)
                            .map(r => r.reminder_id);
                          setSeleccionados(nuevosSeleccionados);
                        }
                      }}
                      disabled={filteredRecordatorios.length === 0}
                    />
                  </TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Vehículo</TableHead>
                  <TableHead>Servicio</TableHead>
                  <TableHead>Fecha Creación</TableHead>
                  <TableHead>Fecha Recordatorio</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecordatorios.map((recordatorio) => (
                  <TableRow key={recordatorio.reminder_id}>
                    <TableCell>
                      <Checkbox
                        checked={seleccionados.includes(recordatorio.reminder_id)}
                        onCheckedChange={() => handleSeleccionar(recordatorio.reminder_id)}
                        disabled={
                          !seleccionados.includes(recordatorio.reminder_id) &&
                          seleccionados.length >= 5
                        }
                      />
                    </TableCell>
                    <TableCell>{recordatorio.client.names}</TableCell>
                    <TableCell>
                      {recordatorio.vehicles.make} {recordatorio.vehicles.model} {recordatorio.vehicles.year}
                      {recordatorio.vehicles.license_plate && ` (${recordatorio.vehicles.license_plate})`}
                    </TableCell>
                    <TableCell>
                      {recordatorio.services?.service_name || 'Sin servicio'}
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const fecha = recordatorio.base_date.slice(0, 10);
                        const [a, m, d] = fecha.split("-");
                        return `${d}/${m}/${a}`;
                      })()}
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const fecha = recordatorio.reminder_date.slice(0, 10);
                        const [a, m, d] = fecha.split("-");
                        return `${d}/${m}/${a}`;
                      })()}
                    </TableCell>
                    <TableCell>{getEstadoBadge(recordatorio.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          type="button"
                          onClick={() => {
                            setRecordatorioEditar(recordatorio);
                            setFormDataEditar({
                              client_id: recordatorio.client_id_uuid,
                              vehicle_id: recordatorio.vehicle_id,
                              service_id: recordatorio.service_id ?? '',
                              base_date: format(parseISO(recordatorio.base_date), 'yyyy-MM-dd'),
                              reminder_date: format(parseISO(recordatorio.reminder_date), 'yyyy-MM-dd'),
                              notes: recordatorio.notes || ''
                            });
                            setMostrarFormularioEditar(true);
                            cargarClientes();
                            cargarVehiculos(recordatorio.client_id_uuid);
                          }}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          title="Ver historial de llamadas"
                          onClick={() => abrirHistorial(recordatorio)}
                        >
                          <History className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Tabs>
      </div>

      <Dialog open={mostrarFormulario} onOpenChange={setMostrarFormulario}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo Recordatorio</DialogTitle>
            <DialogDescription>
              Complete los datos del nuevo recordatorio. Los campos marcados con * son obligatorios.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Cliente *</Label>
                <ClienteComboBox
                  clientes={clientes}
                  onSelect={(value) => {
                    setFormData({ ...formData, client_id: value, vehicle_id: '' });
                    cargarVehiculos(value);
                  }}
                  value={formData.client_id}
                />
              </div>

              <div className="space-y-2">
                <Label>Vehículo *</Label>
                <Select
                  value={formData.vehicle_id}
                  onValueChange={(value) => setFormData({ ...formData, vehicle_id: value })}
                  disabled={!formData.client_id}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione un vehículo" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehiculos.map((vehiculo) => (
                      <SelectItem key={vehiculo.id_uuid} value={vehiculo.id_uuid}>
                        {vehiculo.make} {vehiculo.model} {vehiculo.year}
                        {vehiculo.license_plate ? ` (${vehiculo.license_plate})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Servicio *</Label>
                <Select
                  value={formData.service_id}
                  onValueChange={(value) => setFormData({ ...formData, service_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione un servicio" />
                  </SelectTrigger>
                  <SelectContent>
                    {servicios.map((servicio) => (
                      <SelectItem key={servicio.id_uuid} value={servicio.id_uuid}>
                        {servicio.service_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Fecha de origen *</Label>
                <Input
                  type="date"
                  value={formData.base_date}
                  onChange={(e) => setFormData({ ...formData, base_date: e.target.value })}
                  className="bg-white border-input"
                />
              </div>

              <div className="space-y-2">
                <Label>Fecha de Recordatorio *</Label>
                <Input
                  type="date"
                  value={formData.reminder_date}
                  onChange={(e) => setFormData({ ...formData, reminder_date: e.target.value })}
                  className="bg-white border-input"
                />
              </div>

              <div className="space-y-2">
                <Label>Notas</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Agregue notas adicionales aquí..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Crear Recordatorio</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={mostrarFormularioEditar} onOpenChange={setMostrarFormularioEditar}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Recordatorio</DialogTitle>
            <DialogDescription>
              Modifique los datos del recordatorio. Los campos marcados con * son obligatorios.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Cliente *</Label>
                <ClienteComboBox
                  clientes={clientes}
                  onSelect={(value) => {
                    setFormDataEditar({ ...formDataEditar, client_id: value, vehicle_id: '' });
                    cargarVehiculos(value);
                  }}
                  value={formDataEditar.client_id}
                />
              </div>

              <div className="space-y-2">
                <Label>Vehículo *</Label>
                <Select
                  value={formDataEditar.vehicle_id}
                  onValueChange={(value) => setFormDataEditar({ ...formDataEditar, vehicle_id: value })}
                  disabled={!formDataEditar.client_id}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione un vehículo" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehiculos.map((vehiculo) => (
                      <SelectItem key={vehiculo.id_uuid} value={vehiculo.id_uuid}>
                        {vehiculo.make} {vehiculo.model} {vehiculo.year}
                        {vehiculo.license_plate ? ` (${vehiculo.license_plate})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Servicio *</Label>
                <Select
                  value={formDataEditar.service_id}
                  onValueChange={(value) => setFormDataEditar({ ...formDataEditar, service_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione un servicio" />
                  </SelectTrigger>
                  <SelectContent>
                    {servicios.map((servicio) => (
                      <SelectItem key={servicio.id_uuid} value={servicio.id_uuid}>
                        {servicio.service_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Fecha de origen *</Label>
                <Input
                  type="date"
                  value={formDataEditar.base_date}
                  onChange={(e) => setFormDataEditar({ ...formDataEditar, base_date: e.target.value })}
                  className="bg-white border-input"
                />
              </div>

              <div className="space-y-2">
                <Label>Fecha de Recordatorio *</Label>
                <Input
                  type="date"
                  value={formDataEditar.reminder_date}
                  onChange={(e) => setFormDataEditar({ ...formDataEditar, reminder_date: e.target.value })}
                  className="bg-white border-input"
                />
              </div>

              <div className="space-y-2">
                <Label>Notas</Label>
                <Textarea
                  value={formDataEditar.notes}
                  onChange={(e) => setFormDataEditar({ ...formDataEditar, notes: e.target.value })}
                  placeholder="Agregue notas adicionales aquí..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Guardar Cambios</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={mostrarHistorial} onOpenChange={setMostrarHistorial}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Historial de llamadas</DialogTitle>
            <DialogDescription>
              {recordatorioHistorial?.client.names} - {recordatorioHistorial?.vehicles.make} {recordatorioHistorial?.vehicles.model}
            </DialogDescription>
          </DialogHeader>
          {cargandoHistorial ? (
            <div className="py-8 text-center">Cargando historial...</div>
          ) : llamadasHistorial.length === 0 ? (
            <div className="py-8 text-center text-gray-500">Este recordatorio no tiene llamadas asociadas.</div>
          ) : (
            <div className="space-y-4 max-h-[400px] overflow-y-auto">
              {llamadasHistorial.map((llamada) => (
                <div key={llamada.call_id} className="border rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div>
                    <div className="font-semibold">{llamada.start_date ? format(new Date(llamada.start_date), 'dd/MM/yyyy HH:mm') : 'Sin fecha'}</div>
                    <div className="text-sm text-gray-600">Estado: <span className="font-medium">{llamada.status}</span></div>
                    <div className="text-sm text-gray-600">Duración: {llamada.duration_seconds ? `${llamada.duration_seconds} seg` : 'N/A'}</div>
                    {llamada.call_summary && <div className="text-sm text-gray-600 mt-1">Resumen: {llamada.call_summary}</div>}
                  </div>
                  {llamada.recording_url && (
                    <a
                      href={llamada.recording_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline text-sm mt-2 md:mt-0"
                    >
                      Ver grabación
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
} 