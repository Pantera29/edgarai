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
import { CalendarIcon, Search, Pencil, Plus } from "lucide-react"
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

interface Recordatorio {
  reminder_id: string
  client_id_uuid: string
  vehicle_id: string
  type: 'initial_sale' | 'regular_service'
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
}

export default function RecordatoriosPage() {
  const [searchParams, setSearchParams] = useState<URLSearchParams | null>(null);
  const [token, setToken] = useState<string>("");
  const [dataToken, setDataToken] = useState<object>({});
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [clientes, setClientes] = useState<any[]>([]);
  const [vehiculos, setVehiculos] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    client_id: '',
    vehicle_id: '',
    type: 'maintenance',
    base_date: '',
    reminder_date: '',
    notes: ''
  });
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
        .select('id, names')
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

  useEffect(() => {
    if (mostrarFormulario) {
      cargarClientes();
    }
  }, [mostrarFormulario]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.client_id || !formData.vehicle_id || !formData.base_date || !formData.reminder_date) {
      toast({
        title: "Error",
        description: "Por favor complete todos los campos requeridos",
        variant: "destructive",
      });
      return;
    }

    try {
      const recordatorioData = {
        client_id_uuid: formData.client_id,
        vehicle_id: formData.vehicle_id,
        type: formData.type,
        base_date: formData.base_date,
        reminder_date: formData.reminder_date,
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
        type: 'maintenance',
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
    type: 'maintenance',
    base_date: '',
    reminder_date: '',
    notes: ''
  });

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formDataEditar.client_id || !formDataEditar.vehicle_id || !formDataEditar.base_date || !formDataEditar.reminder_date) {
      toast({
        title: "Error",
        description: "Por favor complete todos los campos requeridos",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('reminders')
        .update({
          client_id_uuid: formDataEditar.client_id,
          vehicle_id: formDataEditar.vehicle_id,
          type: formDataEditar.type,
          base_date: formDataEditar.base_date,
          reminder_date: formDataEditar.reminder_date,
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Vehículo</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Fecha Base</TableHead>
                  <TableHead>Fecha Recordatorio</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecordatorios.map((recordatorio) => (
                  <TableRow key={recordatorio.reminder_id}>
                    <TableCell>{recordatorio.client.names}</TableCell>
                    <TableCell>
                      {recordatorio.vehicles.make} {recordatorio.vehicles.model} {recordatorio.vehicles.year}
                      {recordatorio.vehicles.license_plate && ` (${recordatorio.vehicles.license_plate})`}
                    </TableCell>
                    <TableCell>
                      {recordatorio.type === 'initial_sale' ? 'Venta Inicial' : 'Servicio Regular'}
                    </TableCell>
                    <TableCell>
                      {format(parseISO(recordatorio.base_date), 'dd/MM/yyyy', { locale: es })}
                    </TableCell>
                    <TableCell>
                      {format(parseISO(recordatorio.reminder_date), 'dd/MM/yyyy', { locale: es })}
                    </TableCell>
                    <TableCell>{getEstadoBadge(recordatorio.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        type="button"
                        onClick={() => {
                          setRecordatorioEditar(recordatorio);
                          setFormDataEditar({
                            client_id: recordatorio.client_id_uuid,
                            vehicle_id: recordatorio.vehicle_id,
                            type: recordatorio.type,
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
                <Select
                  value={formData.client_id}
                  onValueChange={(value) => {
                    setFormData({ ...formData, client_id: value, vehicle_id: '' });
                    cargarVehiculos(value);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione un cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientes.map((cliente) => (
                      <SelectItem key={cliente.id} value={cliente.id}>
                        {cliente.names}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                <Label>Tipo de Recordatorio *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione el tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="maintenance">Mantenimiento</SelectItem>
                    <SelectItem value="insurance">Seguro</SelectItem>
                    <SelectItem value="inspection">Inspección</SelectItem>
                    <SelectItem value="license">Licencia</SelectItem>
                    <SelectItem value="other">Otro</SelectItem>
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
                <Select
                  value={formDataEditar.client_id}
                  onValueChange={(value) => {
                    setFormDataEditar({ ...formDataEditar, client_id: value, vehicle_id: '' });
                    cargarVehiculos(value);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione un cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientes.map((cliente) => (
                      <SelectItem key={cliente.id} value={cliente.id}>
                        {cliente.names}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                <Label>Tipo de Recordatorio *</Label>
                <Select
                  value={formDataEditar.type}
                  onValueChange={(value) => setFormDataEditar({ ...formDataEditar, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione el tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="maintenance">Mantenimiento</SelectItem>
                    <SelectItem value="insurance">Seguro</SelectItem>
                    <SelectItem value="inspection">Inspección</SelectItem>
                    <SelectItem value="license">Licencia</SelectItem>
                    <SelectItem value="other">Otro</SelectItem>
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
    </div>
  )
} 