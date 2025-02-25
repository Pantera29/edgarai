"use client"

import { useState, useEffect } from "react"
import { ClientesTable } from "@/components/clientes-table"
import { supabase } from "@/lib/supabase"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import Link from "next/link"

interface Cliente {
  id_uuid: string
  nombre: string
  email: string
  telefono: string
  estado?: 'activo' | 'inactivo'
}

interface NuevoCliente {
  nombre: string
  email: string
  telefono: string
}

const ITEMS_PER_PAGE = 10

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [busqueda, setBusqueda] = useState("")
  const [filtroEstado, setFiltroEstado] = useState("todos")
  const [pagina, setPagina] = useState(1)
  const [totalClientes, setTotalClientes] = useState(0)
  const [loading, setLoading] = useState(false)
  const [clienteId, setClienteId] = useState<string | null>(null)
  const [showNuevoCliente, setShowNuevoCliente] = useState(false)
  const [nuevoCliente, setNuevoCliente] = useState<NuevoCliente>({
    nombre: '',
    email: '',
    telefono: '',
  })

  useEffect(() => {
    cargarClientes()
  }, [busqueda, filtroEstado, pagina])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const id = params.get('id')
    if (id) {
      setClienteId(id)
    }
  }, [])

  const cargarClientes = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('clientes')
        .select('*', { count: 'exact' })
        .order('nombre')
        .range((pagina - 1) * ITEMS_PER_PAGE, pagina * ITEMS_PER_PAGE - 1)

      if (busqueda) {
        query = query.or(`nombre.ilike.%${busqueda}%,email.ilike.%${busqueda}%,telefono.ilike.%${busqueda}%`)
      }

      if (filtroEstado !== 'todos') {
        query = query.eq('estado', filtroEstado)
      }

      const { data, count, error } = await query

      if (error) throw error

      const clientesMapeados: Cliente[] = (data || []).map(cliente => ({
        id_uuid: cliente.id_uuid,
        nombre: cliente.nombre,
        email: cliente.email,
        telefono: cliente.telefono,
        estado: cliente.estado
      }))

      setClientes(clientesMapeados)
      setTotalClientes(count || 0)
    } catch (error) {
      console.error('Error cargando clientes:', error)
    } finally {
      setLoading(false)
    }
  }

  const clientesFiltrados = clientes.filter(cliente => {
    if (clienteId) {
      return cliente.id_uuid === clienteId
    }

    return cliente.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
           cliente.email?.toLowerCase().includes(busqueda.toLowerCase()) ||
           cliente.telefono?.includes(busqueda)
  })

  const limpiarFiltro = () => {
    setClienteId(null)
    window.history.pushState({}, '', '/clientes')
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNuevoCliente({
      ...nuevoCliente,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { data, error } = await supabase
        .from('clientes')
        .insert([{
          nombre: nuevoCliente.nombre,
          email: nuevoCliente.email,
          telefono: nuevoCliente.telefono
        }])
        .select()

      if (error) throw error

      setClientes([...clientes, data[0]])
      setShowNuevoCliente(false)
      setNuevoCliente({
        nombre: '',
        email: '',
        telefono: '',
      })
    } catch (error) {
      console.error('Error al crear cliente:', error)
    }
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Clientes</h2>
        <div className="flex items-center space-x-2">
          <Button asChild>
            <Link href="/backoffice/clientes/nuevo">Registrar Cliente</Link>
          </Button>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex flex-1 items-center space-x-2">
          <Input
            placeholder="Buscar clientes..."
            className="w-[150px] lg:w-[250px]"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
      </div>

      <ClientesTable clientes={clientesFiltrados} loading={loading} />

      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          Mostrando {((pagina - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(pagina * ITEMS_PER_PAGE, totalClientes)} de {totalClientes} clientes
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={pagina === 1}
            onClick={() => setPagina(p => p - 1)}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            disabled={pagina * ITEMS_PER_PAGE >= totalClientes}
            onClick={() => setPagina(p => p + 1)}
          >
            Siguiente
          </Button>
        </div>
      </div>

      {clienteId && (
        <Button variant="outline" onClick={limpiarFiltro}>
          Ver todos los clientes
        </Button>
      )}
    </div>
  )
}
