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
  id_recordatorio: string
  tipo: 'venta_inicial' | 'servicio_regular'
  fecha_base: string
  fecha_recordatorio: string
  fecha_envio: string | null
  estado: 'pendiente' | 'enviado' | 'completado' | 'cancelado' | 'error'
  notas: string
  clientes: {
    nombre: string
    email: string
    telefono: string
  }
  vehiculos: {
    marca: string
    modelo: string
    anio: number
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
      .from('recordatorios')
      .select(`
        *,
        clientes (
          nombre,
          email,
          telefono
        ),
        vehiculos (
          marca,
          modelo,
          anio
        )
      `)
      .order('fecha_recordatorio', { ascending: true })

    if (data) {
      setRecordatorios(data as Recordatorio[])
      setFilteredRecordatorios(data as Recordatorio[])
      updateStats(data as Recordatorio[])
    }
  }

  const updateStats = (data: Recordatorio[]) => {
    const today = new Date().toISOString().split('T')[0]
    
    setStats({
      pendientes: data.filter(r => r.estado === 'pendiente').length,
      enviados: data.filter(r => r.estado === 'enviado').length,
      paraHoy: data.filter(r => r.fecha_recordatorio.startsWith(today)).length,
      conError: data.filter(r => r.estado === 'error').length
    })
  }

  const filterRecordatorios = (estado: string) => {
    let filtered = recordatorios
    
    if (estado !== 'todos') {
      filtered = filtered.filter(r => r.estado === estado)
    }
    
    if (searchTerm) {
      filtered = filtered.filter(r => 
        r.clientes.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${r.vehiculos.marca} ${r.vehiculos.modelo}`.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    if (selectedDate) {
      filtered = filtered.filter(r => 
        r.fecha_recordatorio.startsWith(format(selectedDate, 'yyyy-MM-dd'))
      )
    }
    
    setFilteredRecordatorios(filtered)
  }

  const getEstadoBadge = (estado: string) => {
    const badges = {
      pendiente: <Badge variant="outline">Pendiente</Badge>,
      enviado: <Badge className="bg-green-100 text-green-800">Enviado</Badge>,
      completado: <Badge className="bg-blue-100 text-blue-800">Completado</Badge>,
      cancelado: <Badge variant="secondary">Cancelado</Badge>,
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
                  <TableRow key={recordatorio.id_recordatorio}>
                    <TableCell>{recordatorio.clientes.nombre}</TableCell>
                    <TableCell>
                      {recordatorio.vehiculos.marca} {recordatorio.vehiculos.modelo} {recordatorio.vehiculos.anio}
                    </TableCell>
                    <TableCell>
                      {recordatorio.tipo === 'venta_inicial' ? 'Venta Inicial' : 'Servicio Regular'}
                    </TableCell>
                    <TableCell>
                      {format(new Date(recordatorio.fecha_base), 'dd/MM/yyyy')}
                    </TableCell>
                    <TableCell>
                      {format(new Date(recordatorio.fecha_recordatorio), 'dd/MM/yyyy')}
                    </TableCell>
                    <TableCell>{getEstadoBadge(recordatorio.estado)}</TableCell>
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