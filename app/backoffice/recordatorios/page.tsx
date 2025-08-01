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
import {
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { useClientSearch } from "@/hooks/useClientSearch"

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
  dealership_id: string
  appointment_id?: string | null
  reminder_type?: string
  appointment_date?: string
  appointment_time?: string
  agent_parameters?: {
    fecha?: string
    hora?: string
    data_missing?: string
  }
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
    vin?: string
    last_km?: number
  }
  services?: {
    service_name: string
    description: string
    dealership_id: string
  }
}

interface AgentTemplate {
  id: string;
  name: string;
  description: string;
  assistant_id: string;
  first_message_template: string;
  system_prompt: string;
  required_variables: string[];
  model_provider: string;
  model_name: string;
  first_message_mode: string;
  phone_number_id: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

interface WhatsAppTemplate {
  template_id: string;
  reminder_type: string;
  message_template: string;
}

// Componente mejorado para el combobox de clientes con búsqueda server-side
function ClienteComboBox({ 
  dealershipId, 
  onSelect, 
  value 
}: { 
  dealershipId: string;
  onSelect: (id: string) => void; 
  value: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const triggerRef = React.useRef<HTMLDivElement>(null);
  
  // Usar el hook personalizado para búsqueda de clientes
  const { 
    clients, 
    loading, 
    error, 
    searchClients, 
    addSelectedClient, 
    getClientById 
  } = useClientSearch(dealershipId);

  // Buscar el cliente seleccionado
  const selectedClient = getClientById(value);

  // Manejar cambios en la búsqueda
  const handleSearchChange = (newSearch: string) => {
    setSearch(newSearch);
    searchClients(newSearch);
  };

  // Manejar selección de cliente
  const handleClientSelect = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (client) {
      addSelectedClient(client);
      onSelect(clientId);
      setOpen(false);
      setSearch('');
    }
  };

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

  // Cargar clientes seleccionados previamente al abrir
  React.useEffect(() => {
    if (open && selectedClient) {
      addSelectedClient(selectedClient);
    }
  }, [open, selectedClient, addSelectedClient]);

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
            className="w-full px-3 py-2 border-b outline-none bg-white text-black"
            placeholder="Buscar cliente por nombre o teléfono..."
            value={search}
            onChange={e => handleSearchChange(e.target.value)}
            autoFocus
          />
          <ul className="max-h-60 overflow-y-auto">
            {loading ? (
              <li className="px-3 py-2 text-gray-500 text-center">
                <div className="flex items-center justify-center">
                  <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-blue-600 mr-2"></div>
                  Buscando...
                </div>
              </li>
            ) : error ? (
              <li className="px-3 py-2 text-red-500 text-center">
                Error: {error}
              </li>
            ) : clients.length > 0 ? (
              clients.map((cliente) => (
                <li
                  key={cliente.id}
                  className={`px-3 py-2 cursor-pointer hover:bg-blue-100 ${value === cliente.id ? 'bg-blue-50 font-semibold' : ''}`}
                  onClick={() => handleClientSelect(cliente.id)}
                >
                  {cliente.names} ({cliente.phone_number})
                </li>
              ))
            ) : search.trim() ? (
              <li className="px-3 py-2 text-gray-400 text-center">
                No se encontraron clientes
              </li>
            ) : (
              <li className="px-3 py-2 text-gray-400 text-center">
                Escribe para buscar clientes
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

// Definir tipos para los estados
type EstadoType = 'Pendiente' | 'Enviado' | 'Completado' | 'Cancelado' | 'Error';

// Definir el tipo para el estado de métricas
interface MetricasState {
  total: number;
  activas: number;
  pendientes: number;
  cerradas: number;
  porFecha: Array<{
    fecha: string;
    Pendiente: number;
    Enviado: number;
    Completado: number;
    Cancelado: number;
    Error: number;
  }>;
  porEstado: Array<{
    name: string;
    value: number;
  }>;
}

// Definir el tipo para el estado de colores
type EstadoColors = Record<EstadoType, string>;

const translateTemplateType = (type: string): string => {
  switch (type) {
    case 'follow_up':
      return 'Seguimiento';
    case 'confirmation':
      return 'Confirmación de cita';
    case 'confirmation_diagnosis':
      return 'Confirmación de diagnóstico';
    case 'nps':
      return 'NPS';
    default:
      // Fallback for any new/untranslated types
      return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
};

const translateReminderType = (type: string | undefined): string => {
  if (!type) return 'Seguimiento'; // Por defecto para recordatorios existentes
  const translations: Record<string, string> = {
    'confirmation': 'Confirmación',
    'follow_up': 'Seguimiento',
    'nps': 'NPS'
  };
  return translations[type] || type;
};

const WhatsAppIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    fill="currentColor"
    viewBox="0 0 16 16"
    {...props}
  >
    <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/>
  </svg>
);

export default function RecordatoriosPage() {
  const [searchParams, setSearchParams] = useState<URLSearchParams | null>(null);
  const [token, setToken] = useState<string>("");
  const [dataToken, setDataToken] = useState<object>({});
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  // Variable clientes eliminada - ahora usa useClientSearch hook
  const [vehiculos, setVehiculos] = useState<any[]>([]);
  const [seleccionados, setSeleccionados] = useState<string[]>([]);
  const [isLlamando, setIsLlamando] = useState(false);
  const [isEnviandoWhatsApp, setIsEnviandoWhatsApp] = useState(false);
  const [selectedWhatsAppTemplate, setSelectedWhatsAppTemplate] = useState<string>('');
  const [whatsAppTemplates, setWhatsAppTemplates] = useState<WhatsAppTemplate[]>([]);
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
        // Mejor validación: redirigir si el token es null, vacío, no es objeto o no tiene dealership_id
        if (
          !verifiedDataToken ||
          typeof verifiedDataToken !== "object" ||
          Object.keys(verifiedDataToken).length === 0 ||
          !(verifiedDataToken as any).dealership_id
        ) {
          console.error('[Seguridad] Token inválido o sin dealership_id. Redirigiendo a login.');
          router.push("/login");
          return;
        }
        setDataToken(verifiedDataToken || {}); // Actualiza el estado de dataToken

        // Siempre pasar dealership_id a fetchRecordatorios y fetchWhatsAppTemplates
        const dealershipId = (verifiedDataToken as any).dealership_id;
        fetchRecordatorios(dealershipId);
        fetchWhatsAppTemplates(dealershipId);
      } else {
        // Nunca ejecutar fetchRecordatorios sin dealership_id
        console.error('[Seguridad] No hay token en los query params. Redirigiendo a login.');
        router.push("/login");
      }
    }
  }, [searchParams, router]);

  const [recordatorios, setRecordatorios] = useState<Recordatorio[]>([])
  const [filteredRecordatorios, setFilteredRecordatorios] = useState<Recordatorio[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [selectedReminderType, setSelectedReminderType] = useState<string>("todos")
  const [currentTab, setCurrentTab] = useState<string>("todos")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(50)
  const [stats, setStats] = useState({
    pendientes: 0,
    enviados: 0,
    paraHoy: 0,
    conError: 0
  })
  
  // Estados para la gestión de agentes
  const [agentTemplates, setAgentTemplates] = useState<AgentTemplate[]>([]);
  const [selectedAgentTemplate, setSelectedAgentTemplate] = useState<string | null>(null);
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    // Este efecto se deja vacío porque ahora cargamos los recordatorios
    // después de verificar el token
  }, [])

  const [metricas, setMetricas] = useState<MetricasState>({
    total: 0,
    activas: 0,
    pendientes: 0,
    cerradas: 0,
    porFecha: [],
    porEstado: []
  });

  // Colores para el gráfico de estados
  const ESTADO_COLORS: EstadoColors = {
    'Pendiente': '#3B82F6', // Azul
    'Enviado': '#10B981',   // Verde
    'Completado': '#059669', // Verde oscuro
    'Cancelado': '#EF4444',  // Rojo
    'Error': '#DC2626'      // Rojo oscuro
  };

  const [estadosVisibles, setEstadosVisibles] = useState<{[key: string]: boolean}>({
    'Pendiente': true,
    'Enviado': true,
    'Completado': true,
    'Cancelado': true,
    'Error': true
  });

  // --- fetchRecordatorios seguro ---
  const fetchRecordatorios = async (dealershipIdFromToken?: string) => {
    // Validación estricta de dealershipId
    if (!dealershipIdFromToken) {
      console.error('❌ [Seguridad] fetchRecordatorios llamado SIN dealershipId. Abortando.');
      setRecordatorios([]);
      setFilteredRecordatorios([]);
      setMetricas(prev => ({ ...prev, porFecha: [] }));
      toast({
        title: "Error de seguridad",
        description: "No se pudo cargar recordatorios: falta dealership_id.",
        variant: "destructive",
      });
      return;
    }
    console.log(`[Auditoría] Consultando recordatorios para dealership_id: ${dealershipIdFromToken}`);
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
      .eq('dealership_id', dealershipIdFromToken)
      .order('reminder_date', { ascending: true });

    if (error) {
      console.error('[Seguridad] Error al consultar recordatorios:', error);
      setRecordatorios([]);
      setFilteredRecordatorios([]);
      setMetricas(prev => ({ ...prev, porFecha: [] }));
      return;
    }

    // Doble verificación: nunca mostrar datos de otra agencia
    const filteredData = (data as Recordatorio[]).filter(r => r.dealership_id === dealershipIdFromToken);
    if (filteredData.length !== (data as Recordatorio[]).length) {
      console.error('[ALERTA] Se detectaron recordatorios de otra agencia en la consulta. Esto NO debería ocurrir.');
    }
    setRecordatorios(filteredData);
    setFilteredRecordatorios(filteredData);
    updateStats(filteredData);

    // Preparar datos para el gráfico
    const hoy = new Date();
    const fechas = [];
    
    // Generar fechas para los últimos 30 días
    for (let i = 30; i > 0; i--) {
      const fecha = new Date(hoy);
      fecha.setDate(hoy.getDate() - i);
      const key = format(fecha, 'dd/MM');
      fechas.push(key);
    }
    
    // Agregar la fecha actual
    fechas.push(format(hoy, 'dd/MM'));
    
    // Generar fechas para los próximos 30 días
    for (let i = 1; i <= 30; i++) {
      const fecha = new Date(hoy);
      fecha.setDate(hoy.getDate() + i);
      const key = format(fecha, 'dd/MM');
      fechas.push(key);
    }

    // Inicializar el mapa de fechas y estados
    const fechaEstadoCount: Record<string, { Pendiente: number, Enviado: number, Completado: number, Cancelado: number, Error: number }> = {};
    fechas.forEach(f => fechaEstadoCount[f] = { Pendiente: 0, Enviado: 0, Completado: 0, Cancelado: 0, Error: 0 });

    // Procesar cada recordatorio para obtener las métricas
    filteredData.forEach(recordatorio => {
      if (recordatorio.reminder_date) {
        // Tomar solo la parte de la fecha (YYYY-MM-DD) del reminder_date
        const fecha = recordatorio.reminder_date.split('T')[0].split('-').reverse().slice(0, 2).join('/');
        const estado = traducirEstado(recordatorio.status);
        if (fechaEstadoCount[fecha]) {
          fechaEstadoCount[fecha][estado] += 1;
        }
      }
    });

    // Convertir conteo por fecha y estado a formato para gráfico
    const porFechaEstado = fechas.map(f => ({
      fecha: f,
      ...fechaEstadoCount[f]
    }));

    // Actualizar estado con métricas calculadas
    setMetricas(prev => ({
      ...prev,
      porFecha: porFechaEstado
    }));
  }

  const updateStats = (data: Recordatorio[]) => {
    const today = new Date();
    const todayString = today.toISOString().slice(0, 10); // 'YYYY-MM-DD'

    const recordatoriosParaHoy = data.filter(r => {
      if (!r.reminder_date) return false;
      return r.reminder_date.slice(0, 10) === todayString;
    });

    setStats({
      pendientes: data.filter(r => r.status === 'pending').length,
      enviados: data.filter(r => r.status === 'sent').length,
      paraHoy: recordatoriosParaHoy.length,
      conError: data.filter(r => r.status === 'error').length
    });
  }

  const filterRecordatorios = (estado: string, date?: Date, search?: string, reminderType?: string) => {
    let filtered = recordatorios;
    
    // Filtro por estado
    if (estado !== 'todos') {
      filtered = filtered.filter(r => r.status === mapEstado(estado));
    }
    
    // Filtro por tipo de recordatorio
    if (reminderType && reminderType !== 'todos') {
      filtered = filtered.filter(r => r.reminder_type === reminderType);
    }
    
    // Filtro por búsqueda
    if (search || searchTerm) {
      const term = (search ?? searchTerm).toLowerCase();
      if (term) {
        filtered = filtered.filter(r =>
          r.client.names.toLowerCase().includes(term) ||
          `${r.vehicles.make} ${r.vehicles.model}`.toLowerCase().includes(term)
        );
      }
    }
    
    // Filtro por fecha
    if (date || selectedDate) {
      const fechaFiltro = format(date ?? selectedDate!, 'yyyy-MM-dd');
      filtered = filtered.filter(r => r.reminder_date.startsWith(fechaFiltro));
    }
    
    // Ordenar por fecha de recordatorio de más próxima a más lejana (ascendente)
    filtered.sort((a, b) => new Date(a.reminder_date).getTime() - new Date(b.reminder_date).getTime());
    setFilteredRecordatorios(filtered);
    setCurrentPage(1); // Resetear a la primera página cuando se aplica un filtro
  };

  // Función para obtener tipos únicos de recordatorios
  const getUniqueReminderTypes = () => {
    const types = recordatorios
      .map(r => r.reminder_type)
      .filter((type, index, self) => type && self.indexOf(type) === index)
      .sort();
    
    return types;
  };

  // Calcular los índices para la paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredRecordatorios.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredRecordatorios.length / itemsPerPage);

  // Función para cambiar de página
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  // Efecto reactivo para filtrar automáticamente
  useEffect(() => {
    filterRecordatorios(currentTab, undefined, undefined, selectedReminderType);
  }, [selectedDate, searchTerm, recordatorios, currentTab, selectedReminderType]);

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

  // Función cargarClientes eliminada - ahora usa useClientSearch hook

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
      cargarServicios();
    }
  }, [mostrarFormulario]);

  // Cargar plantillas de agentes al iniciar
  useEffect(() => {
    const fetchAgentTemplates = async () => {
      try {
        console.log('🤖 Cargando plantillas de agentes...');
        
        // Obtener el dealership_id del token si existe
        const dealershipId = (dataToken as any)?.dealership_id;
        console.log('🔍 Dealership ID del token:', dealershipId);
        console.log('🔍 DataToken completo:', dataToken);

        let query = supabase
          .from('agent_templates')
          .select('*')
          .eq('active', true)
          .eq('dealership_id', dealershipId)
          .order('name');

        // Si no hay dealershipId, no traemos ninguna plantilla (opcional: podrías traer globales si lo deseas)
        if (!dealershipId) {
          console.log('⚠️ No hay dealership_id en el token, no se traerán plantillas');
          setAgentTemplates([]);
          return;
        }

        const { data, error } = await query;
          
        if (error) {
          console.error('❌ Error al cargar plantillas de agentes:', error);
          throw error;
        }
        
        console.log('📋 Plantillas encontradas:', data?.length || 0);
        console.log('📋 Detalle de plantillas:', data?.map(t => ({
          id: t.id,
          name: t.name,
          dealership_id: t.dealership_id,
          active: t.active
        })));
        
        setAgentTemplates(data || []);
        
        // Seleccionar automáticamente el primero si hay disponibles
        if (data && data.length > 0) {
          console.log('🎯 Seleccionando primera plantilla:', data[0].name);
          setSelectedAgentTemplate(data[0].id);
        } else {
          console.log('⚠️ No se encontraron plantillas de agentes');
        }
      } catch (error) {
        console.error('Error al cargar plantillas de agentes:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los agentes disponibles",
          variant: "destructive",
        });
      }
    };
    
    fetchAgentTemplates();
  }, [dataToken as any]); // Agregar dataToken como dependencia para que se ejecute cuando cambie

  // --- handleSubmit seguro ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const dealershipId = (dataToken as any)?.dealership_id;
    if (!dealershipId) {
      toast({
        title: "Error de seguridad",
        description: "No se puede crear recordatorio: falta dealership_id.",
        variant: "destructive",
      });
      return;
    }
    if (!formData.client_id || !formData.vehicle_id || !formData.service_id || !formData.base_date || !formData.reminder_date) {
      toast({
        title: "Error",
        description: "Por favor complete todos los campos requeridos",
        variant: "destructive",
      });
      return;
    }
    try {
      const baseDateUTC = new Date(formData.base_date + "T00:00:00Z").toISOString();
      const reminderDateUTC = new Date(formData.reminder_date + "T00:00:00Z").toISOString();
      const recordatorioData = {
        client_id_uuid: formData.client_id,
        vehicle_id: formData.vehicle_id,
        service_id: formData.service_id,
        base_date: baseDateUTC,
        reminder_date: reminderDateUTC,
        notes: formData.notes,
        status: 'pending' as const,
        dealership_id: dealershipId
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
      fetchRecordatorios(dealershipId);
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
    const dealershipId = (dataToken as any)?.dealership_id;
    if (!dealershipId) {
      toast({
        title: "Error de seguridad",
        description: "No se puede editar recordatorio: falta dealership_id.",
        variant: "destructive",
      });
      return;
    }
    if (!formDataEditar.client_id || !formDataEditar.vehicle_id || !formDataEditar.service_id || !formDataEditar.base_date || !formDataEditar.reminder_date) {
      toast({
        title: "Error",
        description: "Por favor complete todos los campos requeridos",
        variant: "destructive",
      });
      return;
    }
    // Validar que el recordatorio pertenece al dealership del token
    if (!recordatorioEditar || recordatorioEditar.dealership_id !== dealershipId) {
      console.error('[Seguridad] Intento de editar recordatorio de otra agencia o sin recordatorioEditar.');
      toast({
        title: "Error de seguridad",
        description: "No se puede editar un recordatorio de otra agencia.",
        variant: "destructive",
      });
      return;
    }
    try {
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
          // dealership_id NO se actualiza nunca
        })
        .eq('reminder_id', recordatorioEditar.reminder_id)
        .eq('dealership_id', dealershipId); // Seguridad extra
      if (error) throw error;
      toast({
        title: "Éxito",
        description: "Recordatorio actualizado correctamente"
      });
      setMostrarFormularioEditar(false);
      await fetchRecordatorios(dealershipId);
    } catch (error) {
      console.error('Error al actualizar recordatorio:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el recordatorio",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!recordatorioEditar?.reminder_id) return;

    try {
      const { error } = await supabase
        .from('reminders')
        .delete()
        .eq('reminder_id', recordatorioEditar.reminder_id);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Recordatorio eliminado correctamente"
      });

      setMostrarFormularioEditar(false);
      await fetchRecordatorios((dataToken as any)?.dealership_id);
    } catch (error) {
      console.error('Error al eliminar recordatorio:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el recordatorio",
        variant: "destructive",
      });
    }
  };

  const handleSeleccionar = (reminderId: string) => {
    setSeleccionados(prev => {
      if (prev.includes(reminderId)) {
        return prev.filter(id => id !== reminderId);
      } else if (prev.length < 10) {
        return [...prev, reminderId];
      }
      return prev;
    });
  };

  const handleLlamarAI = async () => {
    if (seleccionados.length === 0) return;
    if (!selectedAgentTemplate) {
      toast({
        title: "Error",
        description: "Selecciona un tipo de agente para realizar la llamada",
        variant: "destructive"
      });
      return;
    }

    setIsLlamando(true);
    try {
      console.log('🚀 Iniciando proceso de llamadas con AI...');
      console.log('🔍 Obteniendo plantilla del agente:', selectedAgentTemplate);
      
      // Obtener información del agente seleccionado
      const { data: agentTemplate, error: agentError } = await supabase
        .from('agent_templates')
        .select('*')
        .eq('id', selectedAgentTemplate)
        .single();
        
      if (agentError || !agentTemplate) {
        console.error('❌ Error al obtener plantilla de agente:', agentError);
        throw new Error('No se pudo encontrar la plantilla del agente seleccionado');
      }
      
      console.log('✅ Plantilla de agente obtenida:', agentTemplate.name);
      
      const recordatoriosSeleccionados = recordatorios.filter(r => 
        seleccionados.includes(r.reminder_id)
      );
      console.log('📞 Recordatorios seleccionados:', recordatoriosSeleccionados.length);
      
      const bearer = process.env.NEXT_PUBLIC_VAPI_BEARER;
      let huboError = false;
      let errores = [];
      
      for (const recordatorio of recordatoriosSeleccionados) {
        console.log('⏳ Procesando recordatorio para:', recordatorio.client?.names);
        
        // Validar que todos los datos requeridos estén presentes
        const datosCompletos = (
          recordatorio.client &&
          recordatorio.vehicles &&
          recordatorio.services &&
          recordatorio.client_id_uuid &&
          recordatorio.client.names &&
          recordatorio.client.phone_number &&
          recordatorio.vehicle_id &&
          recordatorio.vehicles.model &&
          recordatorio.vehicles.year &&
          recordatorio.vehicles.license_plate &&
          recordatorio.service_id &&
          recordatorio.services?.service_name &&
          recordatorio.client.dealership_id
        );
        
        if (!datosCompletos) {
          console.error('❌ Faltan datos para el recordatorio:', recordatorio.reminder_id);
          errores.push(`Faltan datos para el recordatorio de ${recordatorio.client?.names || 'Cliente desconocido'}`);
          continue;
        }

        // NUEVO: Verificar qué campos están vacíos y generar data_missing
        const camposFaltantes = [];
        
        // Verifica si falta VIN
        if (!recordatorio.vehicles.vin || recordatorio.vehicles.vin.trim() === '') {
          camposFaltantes.push('vin');
        }
        
        // Verifica si falta kilometraje
        if (!recordatorio.vehicles.last_km && recordatorio.vehicles.last_km !== 0) {
          camposFaltantes.push('vehicle_km');
        }
        
        // Verifica si falta placa
        if (!recordatorio.vehicles.license_plate || recordatorio.vehicles.license_plate.trim() === '') {
          camposFaltantes.push('plate');
        }
        
        // Solo para el Agente de Recopilación: verificar si hay campos que recopilar
        if (agentTemplate.name === 'Agente de Recopilación de Información' && 
            camposFaltantes.length === 0) {
          console.log('⚠️ No hay información faltante para este vehículo, saltando...');
          errores.push(`No hay información faltante para el vehículo de ${recordatorio.client.names}`);
          continue;  // Saltar este recordatorio
        }
        
        // Generar el string data_missing
        const dataMissing = camposFaltantes.join(',');
        console.log('📋 Campos faltantes detectados:', dataMissing);
        
        // Construir variableValues a partir de los datos del recordatorio
        const variableValues = {
          client_id: recordatorio.client_id_uuid,
          client_name: recordatorio.client.names,
          phone: recordatorio.client.phone_number,
          vehicle_id: recordatorio.vehicle_id,
          vehicle_make: recordatorio.vehicles.make || "Vehículo",
          vehicle_model: recordatorio.vehicles.model,
          vehicle_year: recordatorio.vehicles.year,
          vehicle_km: recordatorio.vehicles.last_km?.toString() || "",
          plate: recordatorio.vehicles.license_plate || "",
          vin: recordatorio.vehicles.vin || "",
          service_id: recordatorio.service_id,
          service_name: recordatorio.services?.service_name,
          dealership_id: recordatorio.client.dealership_id,
          data_missing: dataMissing,
          appointment_date: recordatorio.appointment_date || recordatorio.agent_parameters?.fecha || "",
          appointment_time: recordatorio.appointment_time || recordatorio.agent_parameters?.hora || ""
        };

        // Si hay agent_parameters con data_missing, usar ese valor
        if (recordatorio.agent_parameters?.data_missing) {
          variableValues.data_missing = recordatorio.agent_parameters.data_missing;
        }
        
        console.log('💡 Variables para el agente:', {
          clientName: recordatorio.client.names,
          vehicleModel: recordatorio.vehicles.model,
          camposFaltantes,
          dataMissing
        });
        
        // Procesar el mensaje inicial con las variables
        const firstMessage = agentTemplate.first_message_template.replace(
          /\{\{([^}]+)\}\}/g,
          (match: string, variable: string) => {
            const value = variableValues[variable as keyof typeof variableValues];
            if (value !== undefined) {
              return String(value);
            }
            return match;
          }
        );
        
        console.log('📝 Mensaje de introducción procesado');
        
        // Construir el payload para la API de Vapi
        const payload = {
          assistantId: agentTemplate.assistant_id,
          customer: {
            name: recordatorio.client.names,
            number: recordatorio.client.phone_number.startsWith('+')
              ? recordatorio.client.phone_number
              : `+52${recordatorio.client.phone_number}`
          },
          assistantOverrides: {
            firstMessage: firstMessage,
            firstMessageMode: agentTemplate.first_message_mode || "assistant-speaks-first",
            variableValues: variableValues,
            model: {
              provider: agentTemplate.model_provider || "openai",
              model: agentTemplate.model_name || "gpt-4.1",
              messages: [
                {
                  role: "system",
                  content: agentTemplate.system_prompt
                }
              ]
            }
          },
          phoneNumberId: agentTemplate.phone_number_id || "2a5d74e9-f465-4b6b-bd7a-4c999f63cbbf"
        };
        
        console.log('📤 Enviando solicitud a Vapi.ai...');
        
        // Realizar la llamada a la API
        const response = await fetch('https://api.vapi.ai/call', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${bearer}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
          console.error('❌ Error en la respuesta de Vapi:', response.status);
          errores.push(`Error al llamar a ${recordatorio.client.names}`);
          huboError = true;
          continue;
        }
        
        const vapiResponse = await response.json();
        console.log('✅ Respuesta de Vapi recibida:', vapiResponse.id);
        
        // Registrar la llamada en outbound_calls
        console.log('💾 Registrando llamada en base de datos...');
        const insertData = {
          reminder_id: recordatorio.reminder_id,
          client_id: recordatorio.client_id_uuid,
          vehicle_id: recordatorio.vehicle_id,
          vapi_call_id: vapiResponse.id,
          assistant_id: vapiResponse.assistantId,
          phone_number_id: vapiResponse.phoneNumberId,
          customer_name: vapiResponse.customer?.name || null,
          customer_phone: vapiResponse.customer?.number || null,
          status: vapiResponse.status || "queued",
          twilio_call_id: vapiResponse.phoneCallProviderId || null,
          start_date: vapiResponse.createdAt ? new Date(vapiResponse.createdAt).toISOString() : null,
          call_data: vapiResponse,
        };
        
        const { error: insertError } = await supabase.from('outbound_calls').insert([insertData]);
        
        if (insertError) {
          console.error('❌ Error al registrar llamada:', insertError);
        } else {
          console.log('✅ Llamada registrada correctamente');
        }
      }
      
      // Actualizar estado de los recordatorios a 'sent'
      console.log('📝 Actualizando estado de recordatorios a "sent"...');
      const { error } = await supabase
        .from('reminders')
        .update({ status: 'sent' })
        .in('reminder_id', seleccionados);
        
      if (error) {
        console.error('❌ Error al actualizar estado de recordatorios:', error);
        throw error;
      }
      
      // Mostrar resultado al usuario
      if (errores.length > 0) {
        console.warn('⚠️ Algunas llamadas no se pudieron iniciar:', errores.length);
        toast({
          title: "Algunas llamadas no se pudieron iniciar",
          description: errores.join("\n"),
          variant: "destructive"
        });
      } else {
        console.log('🎉 Todas las llamadas iniciadas correctamente');
        toast({
          title: "Éxito",
          description: "Llamadas iniciadas correctamente"
        });
      }
      
      // Refrescar los recordatorios y limpiar selección
      const dealershipId = recordatoriosSeleccionados[0]?.client?.dealership_id;
      await fetchRecordatorios(dealershipId);
      setSeleccionados([]);
    } catch (error) {
      console.error('💥 Error inesperado:', error);
      toast({
        title: "Error",
        description: "No se pudieron iniciar las llamadas",
        variant: "destructive"
      });
    } finally {
      setIsLlamando(false);
    }
  };

  const handleEnviarWhatsApp = async () => {
    if (seleccionados.length === 0) return;
    if (seleccionados.length > 1) {
      toast({
        title: "Error",
        description: "Solo puedes enviar un mensaje de WhatsApp a la vez",
        variant: "destructive"
      });
      return;
    }

    setIsEnviandoWhatsApp(true);
    try {
      console.log('🚀 Iniciando envío de WhatsApp...');
      
      const reminderId = seleccionados[0];
      const recordatorio = recordatorios.find(r => r.reminder_id === reminderId);
      
      if (!recordatorio) {
        throw new Error('Recordatorio no encontrado');
      }

      console.log('📋 Enviando WhatsApp para:', recordatorio.client?.names);
      
      // Validar que todos los datos requeridos estén presentes
      const datosCompletos = (
        recordatorio.client &&
        recordatorio.vehicles &&
        recordatorio.services &&
        recordatorio.client.names &&
        recordatorio.client.phone_number &&
        recordatorio.vehicles.model &&
        recordatorio.vehicles.year &&
        recordatorio.services?.service_name &&
        recordatorio.client.dealership_id
      );
      
      if (!datosCompletos) {
        console.error('❌ Faltan datos para el recordatorio:', recordatorio.reminder_id);
        throw new Error('Faltan datos para enviar el mensaje de WhatsApp');
      }

      // Enviar mensaje de WhatsApp
      const response = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reminder_id: reminderId,
          template_type: selectedWhatsAppTemplate,
          dealership_id: recordatorio.client.dealership_id
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Error al enviar WhatsApp:', errorData);
        throw new Error(errorData.error || 'Error al enviar mensaje de WhatsApp');
      }
      
      const result = await response.json();
      console.log('✅ WhatsApp enviado exitosamente:', result);
      
      // Mostrar resultado al usuario
      toast({
        title: "Éxito",
        description: `Mensaje de WhatsApp enviado a ${recordatorio.client.names}`
      });
      
      // Refrescar los recordatorios y limpiar selección
      await fetchRecordatorios(recordatorio.client.dealership_id);
      setSeleccionados([]);
    } catch (error) {
      console.error('💥 Error inesperado:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al enviar mensaje de WhatsApp",
        variant: "destructive"
      });
    } finally {
      setIsEnviandoWhatsApp(false);
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
    try {
      // 1. Obtener llamadas de outbound_calls
      const { data: outboundCalls, error: outboundError } = await supabase
        .from('outbound_calls')
        .select('*')
        .eq('reminder_id', recordatorio.reminder_id)
        .order('created_at', { ascending: false });

      if (outboundError) throw outboundError;

      // 2. Obtener los vapi_call_id
      const vapiCallIds = outboundCalls?.map(call => call.vapi_call_id) || [];

      // 3. Consultar chat_conversations correspondientes
      let conversations = [];
      if (vapiCallIds.length > 0) {
        const { data: conversationsData, error: conversationsError } = await supabase
          .from('chat_conversations')
          .select('*')
          .in('call_id', vapiCallIds)
          .order('created_at', { ascending: false });
        if (conversationsError) throw conversationsError;
        conversations = conversationsData || [];
      }

      // 4. Combinar la información
      const llamadasCombinadas = outboundCalls?.map(outboundCall => {
        const conversacion = conversations?.find(
          conv => conv.call_id === outboundCall.vapi_call_id
        );
        return {
          ...outboundCall,
          duration_seconds: conversacion?.duration_seconds || outboundCall.duration_seconds,
          recording_url: conversacion?.recording_url || outboundCall.recording_url,
          conversation_summary: conversacion?.conversation_summary,
          conversation_summary_translated: conversacion?.conversation_summary_translated,
          was_successful: conversacion?.was_successful,
          status: conversacion?.status || outboundCall.status,
        };
      }) || [];

      setLlamadasHistorial(llamadasCombinadas);
    } catch (error) {
      console.error('Error al cargar el historial:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar el historial de llamadas",
        variant: "destructive",
      });
    } finally {
      setCargandoHistorial(false);
    }
  };

  const traducirEstado = (estado: string): EstadoType => {
    switch (estado) {
      case 'pending': return 'Pendiente';
      case 'sent': return 'Enviado';
      case 'completed': return 'Completado';
      case 'cancelled': return 'Cancelado';
      case 'error': return 'Error';
      default: return 'Pendiente'; // valor por defecto
    }
  };

  // Componente CustomTooltip con tipos
  interface TooltipProps {
    active?: boolean;
    payload?: Array<{
      name: string;
      value: number;
      color: string;
    }>;
    label?: string;
  }

  const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 shadow-lg rounded-lg border border-gray-100">
          <p className="text-sm font-medium mb-2">{label}</p>
          {payload.map((entry, index) => (
            <div key={`item-${index}`} className="flex items-center mb-1">
              <div 
                className="w-3 h-3 rounded-full mr-2" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm font-medium" style={{ color: entry.color }}>
                {entry.name}
              </span>
              <span className="text-sm font-medium ml-2">
                : {entry.value} recordatorios
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const fetchWhatsAppTemplates = async (dealershipId: string) => {
    if (!dealershipId) return;
    try {
      console.log('Buscando plantillas de WhatsApp para el concesionario:', dealershipId);
      const { data, error } = await supabase
        .from('whatsapp_message_templates')
        .select('template_id, reminder_type, message_template')
        .eq('dealership_id', dealershipId)
        .eq('is_active', true);

      if (error) {
        throw error;
      }

      if (data) {
        console.log('Plantillas de WhatsApp activas encontradas:', data);
        setWhatsAppTemplates(data);
        if (data.length > 0) {
          // Seleccionar la primera plantilla por defecto
          setSelectedWhatsAppTemplate(data[0].reminder_type);
        }
      }
    } catch (error) {
      console.error('Error al cargar las plantillas de WhatsApp:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las plantillas de WhatsApp.",
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

      {/* Gráfico de estados */}
      <Card className="p-0 overflow-hidden">
        <div className="bg-white p-6 flex justify-between items-center border-b">
          <div>
            <h3 className="font-medium">Tendencia de Estados</h3>
            <p className="text-sm text-muted-foreground">Distribución por estado y fecha</p>
          </div>
          <div className="flex gap-2">
            {(Object.keys(ESTADO_COLORS) as EstadoType[]).map((estado) => (
              <Button 
                key={estado}
                variant={estadosVisibles[estado] ? "default" : "outline"} 
                size="sm" 
                className={`h-8 gap-1 ${estadosVisibles[estado] ? `bg-[${ESTADO_COLORS[estado]}] hover:bg-[${ESTADO_COLORS[estado]}]` : ''}`}
                onClick={() => setEstadosVisibles(prev => ({
                  ...prev,
                  [estado]: !prev[estado]
                }))}
              >
                <span className="h-2 w-2 rounded-full bg-white"></span>
                {estado}
              </Button>
            ))}
          </div>
        </div>
        <div className="p-6 h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={metricas.porFecha}
              margin={{
                top: 10,
                right: 30,
                left: 0,
                bottom: 0,
              }}
            >
              <defs>
                {(Object.keys(ESTADO_COLORS) as EstadoType[]).map((estado) => (
                  <linearGradient key={estado} id={`color${estado}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={ESTADO_COLORS[estado]} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={ESTADO_COLORS[estado]} stopOpacity={0.2}/>
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
              <XAxis 
                dataKey="fecha" 
                tick={{fontSize: 12}}
                tickLine={false}
                axisLine={false}
                dy={10}
              />
              <YAxis 
                tick={{fontSize: 12}}
                tickLine={false}
                axisLine={false}
                width={40}
                dx={-10}
                domain={['auto', 'auto']}
              />
              <Tooltip content={<CustomTooltip />} />
              {(Object.keys(ESTADO_COLORS) as EstadoType[]).map((estado) => (
                estadosVisibles[estado] && (
                  <Area 
                    key={estado}
                    type="monotone" 
                    dataKey={estado} 
                    stackId="1" 
                    stroke={ESTADO_COLORS[estado]} 
                    fill={`url(#color${estado})`}
                    activeDot={{ r: 6, strokeWidth: 1, stroke: '#fff' }}
                  />
                )
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Input
              placeholder="Buscar por cliente o vehículo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
          
          {/* Filtro de tipo de recordatorio */}
          <Select 
            value={selectedReminderType} 
            onValueChange={setSelectedReminderType}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrar por tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los tipos</SelectItem>
              {getUniqueReminderTypes().map((type) => (
                type && (
                  <SelectItem key={type} value={type}>
                    {translateReminderType(type)}
                  </SelectItem>
                )
              ))}
            </SelectContent>
          </Select>
          
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
                onSelect={(date) => setSelectedDate(date)}
                initialFocus
              />
              {selectedDate && (
                <div className="p-2 text-center">
                  <Button size="sm" variant="ghost" onClick={() => setSelectedDate(undefined)}>
                    Limpiar fecha
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>

        <Tabs defaultValue="todos" className="w-full" onValueChange={(tab) => setCurrentTab(tab)}>
          <TabsList>
            <TabsTrigger value="todos">Todos</TabsTrigger>
            <TabsTrigger value="pendiente">Pendientes</TabsTrigger>
            <TabsTrigger value="enviado">Enviados</TabsTrigger>
            <TabsTrigger value="completado">Completados</TabsTrigger>
            <TabsTrigger value="error">Errores</TabsTrigger>
          </TabsList>

          <div className="mt-4">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center space-x-2">
                {/* Selector de agente */}
                {seleccionados.length > 0 && agentTemplates.length > 0 && (
                  <Select 
                    value={selectedAgentTemplate || undefined} 
                    onValueChange={setSelectedAgentTemplate}
                    disabled={isLlamando}
                  >
                    <SelectTrigger className="w-[250px]">
                      <SelectValue placeholder="Seleccionar agente" />
                    </SelectTrigger>
                    <SelectContent>
                      {agentTemplates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                
                {/* Botón de llamar con AI */}
                <Button
                  onClick={handleLlamarAI}
                  disabled={seleccionados.length === 0 || isLlamando || !selectedAgentTemplate}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isLlamando ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Llamando...
                    </>
                  ) : (
                    `Llamar con AI (${seleccionados.length}/10)`
                  )}
                </Button>

                {/* Selector de template de WhatsApp */}
                {seleccionados.length === 1 && whatsAppTemplates.length > 0 && (
                  <Select 
                    value={selectedWhatsAppTemplate} 
                    onValueChange={setSelectedWhatsAppTemplate}
                    disabled={isEnviandoWhatsApp}
                  >
                    <SelectTrigger className="w-[250px]">
                      <SelectValue placeholder="Tipo de mensaje" />
                    </SelectTrigger>
                    <SelectContent>
                      {whatsAppTemplates.map((template) => (
                        <SelectItem key={template.template_id} value={template.reminder_type}>
                          {translateTemplateType(template.reminder_type)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {/* Botón de enviar WhatsApp */}
                <Button
                  onClick={handleEnviarWhatsApp}
                  disabled={seleccionados.length !== 1 || isEnviandoWhatsApp}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isEnviandoWhatsApp ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Enviando...
                    </>
                  ) : (
                    <>
                      <WhatsAppIcon className="mr-2 h-4 w-4" />
                      Enviar WhatsApp
                    </>
                  )}
                </Button>
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={seleccionados.length === currentItems.length && currentItems.length > 0}
                      onCheckedChange={() => {
                        if (seleccionados.length === currentItems.length) {
                          setSeleccionados([]);
                        } else {
                          const nuevosSeleccionados = currentItems
                            .slice(0, 10)
                            .map(r => r.reminder_id);
                          setSeleccionados(nuevosSeleccionados);
                        }
                      }}
                      disabled={currentItems.length === 0}
                    />
                  </TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Vehículo</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Fecha Creación</TableHead>
                  <TableHead>Fecha Recordatorio</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentItems.map((recordatorio) => (
                  <TableRow key={recordatorio.reminder_id}>
                    <TableCell>
                      <Checkbox
                        checked={seleccionados.includes(recordatorio.reminder_id)}
                        onCheckedChange={() => handleSeleccionar(recordatorio.reminder_id)}
                        disabled={
                          !seleccionados.includes(recordatorio.reminder_id) &&
                          seleccionados.length >= 10
                        }
                      />
                    </TableCell>
                    <TableCell>{recordatorio.client.names}</TableCell>
                    <TableCell>
                      {recordatorio.vehicles.make} {recordatorio.vehicles.model} {recordatorio.vehicles.year}
                      {recordatorio.vehicles.license_plate && ` (${recordatorio.vehicles.license_plate})`}
                    </TableCell>
                    <TableCell>
                      {translateReminderType(recordatorio.reminder_type)}
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

            {/* Paginación */}
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-500">
                Mostrando {indexOfFirstItem + 1} a {Math.min(indexOfLastItem, filteredRecordatorios.length)} de {filteredRecordatorios.length} recordatorios
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Anterior
                </Button>
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNumber = i + 1;
                    return (
                      <Button
                        key={pageNumber}
                        variant={currentPage === pageNumber ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(pageNumber)}
                      >
                        {pageNumber}
                      </Button>
                    );
                  })}
                  {totalPages > 5 && (
                    <>
                      <span className="px-2">...</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(totalPages)}
                      >
                        {totalPages}
                      </Button>
                    </>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Siguiente
                </Button>
              </div>
            </div>
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
                  dealershipId={(dataToken as any)?.dealership_id}
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
                  dealershipId={(dataToken as any)?.dealership_id}
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
            <DialogFooter className="flex justify-between">
              <Button 
                type="button" 
                variant="destructive" 
                onClick={handleDelete}
              >
                Eliminar Recordatorio
              </Button>
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
                <div key={llamada.call_id || llamada.vapi_call_id} className="border rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div>
                    <div className="font-semibold">{llamada.start_date ? format(new Date(llamada.start_date), 'dd/MM/yyyy HH:mm') : 'Sin fecha'}</div>
                    <div className="text-sm text-gray-600 flex items-center gap-2">
                      Estado: 
                      <span className={`font-medium px-2 py-1 rounded-full text-xs 
                        ${llamada.was_successful === true ? 'bg-green-100 text-green-800' : ''}
                        ${llamada.was_successful === false ? 'bg-red-100 text-red-800' : ''}
                        ${llamada.was_successful === undefined ? 'bg-gray-100 text-gray-800' : ''}
                      `}>
                        {llamada.was_successful !== undefined ? (llamada.was_successful ? 'Exitosa' : 'No exitosa') : (llamada.status || 'N/A')}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">Duración: {llamada.duration_seconds ? `${llamada.duration_seconds} seg` : 'N/A'}</div>
                    {llamada.conversation_summary_translated && (
                      <div className="text-sm text-gray-600 mt-1">Resumen: {llamada.conversation_summary_translated}</div>
                    )}
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