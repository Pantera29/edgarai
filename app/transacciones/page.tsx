"use client"

import { useState, useEffect } from "react"
import { DataTable } from "@/components/ui/data-table"
import { columns } from "./columns"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { TransactionForm } from "@/components/workshop/transaction-form"
import { useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, X } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useDebouncedCallback } from 'use-debounce'

interface Filters {
  startDate: Date | null
  endDate: Date | null
  estado: string
  cliente: string
}

const estadosTabs = [
  { value: "todos", label: "Todas" },
  { value: "pendiente", label: "Pendientes" },
  { value: "pagado", label: "Pagadas" },
  { value: "anulado", label: "Anuladas" },
]

export default function TransaccionesPage() {
  const searchParams = useSearchParams()
  const idCita = searchParams.get('id_cita')
  const [loading, setLoading] = useState(false)
  const [showNewTransaction, setShowNewTransaction] = useState(false)
  const { toast } = useToast()
  const [data, setData] = useState<any[]>([])
  const [pageCount, setPageCount] = useState(0)
  const [filters, setFilters] = useState<Filters>({
    startDate: null,
    endDate: null,
    estado: '',
    cliente: ''
  })
  const [totals, setTotals] = useState({ count: 0, amount: 0 })

  const initialFilters: Filters = {
    startDate: null,
    endDate: null,
    estado: 'todos',
    cliente: ''
  }

  // Mostrar automáticamente el formulario si viene un id_cita
  useEffect(() => {
    if (idCita) {
      setShowNewTransaction(true)
    }
  }, [idCita])

  // Crear versión debounced de fetchTransactions
  const debouncedFetch = useDebouncedCallback(
    (newFilters: Filters) => {
      fetchTransactions(0)
    },
    500  // esperar 500ms antes de ejecutar
  )

  // Actualizar los manejadores de filtros
  const handleFilterChange = (newFilters: Partial<Filters>) => {
    const updatedFilters = { ...filters, ...newFilters }
    setFilters(updatedFilters)
    
    // Si se está limpiando un filtro (cambiando a su valor inicial), ejecutar inmediatamente
    if (
      newFilters.cliente === '' || 
      newFilters.estado === 'todos' || 
      newFilters.startDate === null || 
      newFilters.endDate === null
    ) {
      fetchTransactions(0)
    } else {
      // Solo usar debounce para nuevos filtros
      debouncedFetch(updatedFilters)
    }
  }

  const fetchTransactions = async (pageIndex: number) => {
    setLoading(true)
    try {
      let query = supabase
        .from('transacciones_servicio')
        .select(`
          id_transaccion,
          estado,
          fecha_transaccion,
          citas!inner (
            clientes!inner (
              nombre
            )
          ),
          transaccion_productos!inner (
            cantidad_usada,
            precio_unitario
          )
        `, { count: 'exact' })

      // Aplicar filtros
      if (filters.startDate) {
        query = query.gte('fecha_transaccion', filters.startDate.toISOString())
      }
      if (filters.endDate) {
        query = query.lte('fecha_transaccion', filters.endDate.toISOString())
      }
      if (filters.estado && filters.estado !== 'todos') {
        query = query.eq('estado', filters.estado)
      }
      if (filters.cliente) {
        query = query.textSearch('citas.clientes.nombre', filters.cliente)
      }

      const { data: transactions, error, count } = await query
        .range(pageIndex * 10, (pageIndex + 1) * 10 - 1)
        .order('fecha_transaccion', { ascending: false })

      if (error) throw error

      // Calcular el total de todas las transacciones en el cliente
      const totalAmount = transactions?.reduce((sum, transaction) => {
        const transactionTotal = transaction.transaccion_productos?.reduce(
          (subSum: number, prod: any) => subSum + (prod.cantidad_usada * prod.precio_unitario),
          0
        ) || 0
        return sum + transactionTotal
      }, 0) || 0

      setTotals({ 
        count: count || 0, 
        amount: totalAmount
      })
      
      setData(transactions || [])
      setPageCount(Math.ceil((count || 0) / 10))
    } catch (error) {
      console.error('Error:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al cargar las transacciones"
      })
    } finally {
      setLoading(false)
    }
  }

  // Reemplazar el useEffect existente
  useEffect(() => {
    fetchTransactions(0)
  }, []) // Solo ejecutar al montar el componente

  // Función para resetear filtros
  const resetFilters = () => {
    setFilters(initialFilters)
    // Llamar directamente a fetchTransactions en lugar de esperar el debounce
    fetchTransactions(0)
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Transacciones</h2>
          <p className="text-muted-foreground mt-2">
            {totals.count} transacciones, Total: ${totals.amount.toLocaleString()}
          </p>
        </div>
        <Button onClick={() => setShowNewTransaction(true)}>
          Nueva Transacción
        </Button>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">Fecha Inicio</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.startDate ? format(filters.startDate, "PPP", { locale: es }) : "Seleccionar"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={filters.startDate || undefined}
                onSelect={(date) => handleFilterChange({ startDate: date })}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Fecha Fin</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.endDate ? format(filters.endDate, "PPP", { locale: es }) : "Seleccionar"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={filters.endDate || undefined}
                onSelect={(date) => handleFilterChange({ endDate: date })}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="flex items-center space-x-4 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Buscar por cliente..."
            value={filters.cliente}
            onChange={(e) => handleFilterChange({ cliente: e.target.value })}
          />
        </div>
        <Tabs
          value={filters.estado}
          onValueChange={(value) => handleFilterChange({ estado: value })}>
          <TabsList>
            {estadosTabs.map(tab => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        {(filters.cliente !== '' || 
          filters.estado !== 'todos' || 
          filters.startDate !== null || 
          filters.endDate !== null) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            className="h-8 px-2"
          >
            <X className="h-4 w-4 mr-2" />
            Limpiar filtros
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <div className="h-4 bg-muted rounded w-32 animate-pulse" />
              <div className="h-4 bg-muted rounded w-48 animate-pulse" />
              <div className="h-4 bg-muted rounded w-24 animate-pulse" />
              <div className="h-4 bg-muted rounded w-20 animate-pulse" />
            </div>
          ))}
        </div>
      ) : (
        <DataTable 
          columns={columns}
          data={data}
          pageCount={pageCount}
          onPaginationChange={(pageIndex) => fetchTransactions(pageIndex)}
        />
      )}

      <Dialog open={showNewTransaction} onOpenChange={setShowNewTransaction}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Nueva Transacción</DialogTitle>
          </DialogHeader>
          <TransactionForm 
            appointmentId={idCita || ''} 
            onSuccess={() => {
              setShowNewTransaction(false)
              // Recargar la tabla
              const table = document.querySelector('[data-table-key="transacciones"]')
              if (table) {
                const event = new Event('refresh')
                table.dispatchEvent(event)
              }
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
} 