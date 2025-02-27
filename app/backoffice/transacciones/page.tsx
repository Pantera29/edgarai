"use client"

import { useState, useEffect, Suspense } from "react"
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
import { CalendarIcon, X, Eye } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useDebouncedCallback } from 'use-debounce'
import { useRouter } from "next/navigation"
import { verifyToken } from "@/app/jwt/token"
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

function TransaccionesContent() {
  

     
  const [searchParamsToken, setSearchParams] = useState<URLSearchParams | null>(
    null
  );
  const [token, setToken] = useState<string>("");
  const [dataToken, setDataToken] = useState<object>({});

  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setSearchParams(params); // Guarda los query params en el estado
    }
  }, []);

  useEffect(() => {
    if (searchParamsToken) {
      const tokenValue = searchParamsToken.get("token"); // Obtiene el token de los query params
      if (tokenValue) {
        setToken(tokenValue); // Usa setToken para actualizar el estado
        const verifiedDataToken = verifyToken(tokenValue); // Verifica el token
        
        // Si el token no es válido, redirigir al login
        if (verifiedDataToken === null) {
          router.push("/login");
        }
        setDataToken(verifiedDataToken || {}); // Actualiza el estado de dataToken

      }
    }
  }, [searchParamsToken, router]); 




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
  const [showDetails, setShowDetails] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null)

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
      const { data: transacciones, error } = await supabase
        .from('transacciones_servicio')
        .select(`
          *,
          citas (
            id_uuid,
            fecha_hora,
            clientes (
              nombre
            ),
            vehiculos (
              marca,
              modelo,
              placa
            )
          )
        `)
        .order('fecha_transaccion', { ascending: false })

      if (error) throw error
      
      setData(transacciones || [])
      setPageCount(Math.ceil((transacciones?.length || 0) / 10))
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
            token={token} 
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Detalles de la Transacción</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium">Cliente</h4>
                <p>{selectedTransaction?.citas?.clientes?.nombre}</p>
              </div>
              <div>
                <h4 className="font-medium">Fecha</h4>
                <p>
                  {selectedTransaction?.fecha_transaccion ? 
                    format(new Date(selectedTransaction.fecha_transaccion), "dd/MM/yyyy HH:mm")
                    : 'Fecha no disponible'
                  }
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function TransaccionesPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto py-10">
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
      </div>
    }>
      <TransaccionesContent />
    </Suspense>
  )
} 