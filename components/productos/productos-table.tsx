"use client"

import { useState, useEffect } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  ArrowUpDown
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface Producto {
  id_producto: string
  nombre: string
  descripcion: string
  unidad_medida: string
  stock_actual: number
  precio: number
  creado_el: string
}

const ITEMS_PER_PAGE = 20

export function ProductosTable() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState("")
  const [pagina, setPagina] = useState(1)
  const [totalProductos, setTotalProductos] = useState(0)
  const [ordenarPor, setOrdenarPor] = useState<{
    columna: string
    direccion: 'asc' | 'desc'
  }>({ columna: 'nombre', direccion: 'asc' })

  useEffect(() => {
    cargarProductos()
  }, [busqueda, pagina, ordenarPor])

  const cargarProductos = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('productos')
        .select('*', { count: 'exact' })
        .order(ordenarPor.columna, { ascending: ordenarPor.direccion === 'asc' })
        .range((pagina - 1) * ITEMS_PER_PAGE, pagina * ITEMS_PER_PAGE - 1)

      if (busqueda) {
        query = query.or(`nombre.ilike.%${busqueda}%,descripcion.ilike.%${busqueda}%`)
      }

      const { data, count, error } = await query

      if (error) throw error

      setProductos(data || [])
      setTotalProductos(count || 0)
    } catch (error) {
      console.error('Error cargando productos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSort = (columna: string) => {
    setOrdenarPor(prev => ({
      columna,
      direccion: prev.columna === columna && prev.direccion === 'asc' ? 'desc' : 'asc'
    }))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Input
          placeholder="Buscar productos..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead onClick={() => handleSort('nombre')} className="cursor-pointer">
                <div className="flex items-center">
                  Nombre
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </div>
              </TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead onClick={() => handleSort('unidad_medida')} className="cursor-pointer">
                <div className="flex items-center">
                  Unidad
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </div>
              </TableHead>
              <TableHead onClick={() => handleSort('stock_actual')} className="cursor-pointer text-right">
                <div className="flex items-center justify-end">
                  Stock Actual
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </div>
              </TableHead>
              <TableHead onClick={() => handleSort('precio')} className="cursor-pointer text-right">
                <div className="flex items-center justify-end">
                  Precio
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </div>
              </TableHead>
              <TableHead onClick={() => handleSort('creado_el')} className="cursor-pointer">
                <div className="flex items-center">
                  Fecha Creación
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  Cargando...
                </TableCell>
              </TableRow>
            ) : productos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  No se encontraron productos
                </TableCell>
              </TableRow>
            ) : (
              productos.map((producto) => (
                <TableRow key={producto.id_producto}>
                  <TableCell className="font-medium">{producto.nombre}</TableCell>
                  <TableCell>{producto.descripcion}</TableCell>
                  <TableCell>{producto.unidad_medida}</TableCell>
                  <TableCell className="text-right">{producto.stock_actual}</TableCell>
                  <TableCell className="text-right">
                    {new Intl.NumberFormat('es-AR', {
                      style: 'currency',
                      currency: 'ARS'
                    }).format(producto.precio)}
                  </TableCell>
                  <TableCell>
                    {format(new Date(producto.creado_el), "dd/MM/yyyy HH:mm", { locale: es })}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Mostrando {Math.min(totalProductos, (pagina - 1) * ITEMS_PER_PAGE + 1)} a{" "}
          {Math.min(pagina * ITEMS_PER_PAGE, totalProductos)} de {totalProductos} productos
        </p>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPagina(1)}
            disabled={pagina === 1}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPagina(p => p - 1)}
            disabled={pagina === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPagina(p => p + 1)}
            disabled={pagina * ITEMS_PER_PAGE >= totalProductos}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPagina(Math.ceil(totalProductos / ITEMS_PER_PAGE))}
            disabled={pagina * ITEMS_PER_PAGE >= totalProductos}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
} 