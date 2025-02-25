"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { format } from "date-fns"
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
import { CalendarIcon, Search, Eye } from "lucide-react"

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
  }
  vehicles: {
    make: string
    model: string
    year: number
    license_plate: string
  }
}

export default function RecordatoriosPage() {
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
  
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchRecordatorios()
  }, [])

  const fetchRecordatorios = async () => {
    const { data, error } = await supabase
      .from('reminders')
      .select(`
        *,
        client!reminders_client_id_fkey (
          names,
          email,
          phone_number
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
      setRecordatorios(data as Recordatorio[])
      setFilteredRecordatorios(data as Recordatorio[])
      updateStats(data as Recordatorio[])
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
    const badges = {
      pending: <Badge variant="outline">Pendiente</Badge>,
      sent: <Badge className="bg-green-100 text-green-800">Enviado</Badge>,
      completed: <Badge className="bg-blue-100 text-blue-800">Completado</Badge>,
      cancelled: <Badge variant="secondary">Cancelado</Badge>,
      error: <Badge variant="destructive">Error</Badge>
    }
    return badges[estado as keyof typeof badges]
  }

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Recordatorios</h1>
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
                      {format(new Date(recordatorio.base_date), 'dd/MM/yyyy')}
                    </TableCell>
                    <TableCell>
                      {format(new Date(recordatorio.reminder_date), 'dd/MM/yyyy')}
                    </TableCell>
                    <TableCell>{getEstadoBadge(recordatorio.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Tabs>
      </div>
    </div>
  )
} 