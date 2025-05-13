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
  cliente: string
}

const initialFilters: Filters = {
  cliente: ''
}

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

        // Si hay un dealership_id en el token, cargar las transacciones de esa agencia
        if (verifiedDataToken?.dealership_id) {
          fetchTransactions(0, verifiedDataToken.dealership_id);
        } else {
          fetchTransactions(0);
        }
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
  const [filters, setFilters] = useState<Filters>(initialFilters)
  const [showDetails, setShowDetails] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null)

  // Mostrar automáticamente el formulario si viene un id_cita
  useEffect(() => {
    if (idCita) {
      setShowNewTransaction(true)
    }
  }, [idCita])

  // Crear versión debounced de fetchTransactions
  const debouncedFetch = useDebouncedCallback(
    (newFilters: Filters, pageIndex: number = 0, dealershipId?: string) => {
      fetchTransactions(pageIndex, dealershipId)
    },
    500  // esperar 500ms antes de ejecutar
  )

  // Actualizar los manejadores de filtros
  const handleFilterChange = (newFilters: Partial<Filters>) => {
    const updatedFilters = { ...filters, ...newFilters }
    setFilters(updatedFilters)
    
    // Si se está limpiando un filtro (cambiando a su valor inicial), ejecutar inmediatamente
    if (
      newFilters.cliente === ''
    ) {
      // Obtener dealership_id del token JWT para mantener el filtrado por agencia
      const dealershipId = (dataToken as any)?.dealership_id;
      fetchTransactions(0, dealershipId)
    } else {
      // Solo usar debounce para nuevos filtros
      const dealershipId = (dataToken as any)?.dealership_id;
      debouncedFetch(updatedFilters, 0, dealershipId)
    }
  }

  const fetchTransactions = async (pageIndex: number, dealershipIdFromToken?: string) => {
    setLoading(true)
    try {
      let query = supabase
        .from('service_transactions')
        .select(`
          *,
          appointment (
            id,
            appointment_date,
            service_id,
            client (
              names,
              dealership_id
            ),
            vehicles (
              make,
              model,
              license_plate
            ),
            services:service_id (
              service_name
            )
          )
        `)
        .order('transaction_date', { ascending: false })

      // Filtrar por dealership_id directamente en service_transactions
      if (dealershipIdFromToken) {
        query = query.eq('dealership_id', dealershipIdFromToken);
        console.log('Filtrando transacciones por dealership_id en service_transactions:', dealershipIdFromToken);
      }

      const { data: transacciones, error } = await query;
      console.log('Transacciones crudas recibidas:', transacciones, 'Error:', error);

      if (error) throw error
      
      let filteredTransactions = transacciones || [];
      setData(filteredTransactions)
      setPageCount(Math.ceil((filteredTransactions.length || 0) / 10))
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
    // No hacer nada aquí, ya que fetchTransactions se llama después de verificar el token
  }, []) // Solo ejecutar al montar el componente

  // Función para resetear filtros
  const resetFilters = () => {
    setFilters(initialFilters)
    // Llamar directamente a fetchTransactions en lugar de esperar el debounce
    // Mantener el filtrado por dealership_id
    const dealershipId = (dataToken as any)?.dealership_id;
    fetchTransactions(0, dealershipId)
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

      <div className="flex items-center space-x-4 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Buscar por cliente..."
            value={filters.cliente}
            onChange={(e) => handleFilterChange({ cliente: e.target.value })}
          />
        </div>
        {(filters.cliente !== '' ) && (
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
                <p>{selectedTransaction?.appointment?.client?.names}</p>
              </div>
              <div>
                <h4 className="font-medium">Fecha</h4>
                <p>
                  {selectedTransaction?.transaction_date ? 
                    format(new Date(selectedTransaction.transaction_date), "dd/MM/yyyy HH:mm")
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