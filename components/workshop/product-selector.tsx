"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { supabase } from "@/lib/supabase"
import { TransactionProduct } from "@/types/transaction"
import { Loader2 } from "lucide-react"

interface ProductSelectorProps {
  onSelect: (product: TransactionProduct) => void
}

interface Product {
  id_producto: string
  nombre: string
  precio: number
  stock_actual: number
}

export function ProductSelector({ onSelect }: ProductSelectorProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('productos')
          .select('id_producto, nombre, precio, stock_actual')
          .gt('stock_actual', 0)
          .order('nombre')

        if (error) throw error
        setProducts(data || [])
      } catch (error) {
        console.error('Error cargando productos:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  const handleSelect = (productId: string) => {
    const product = products.find(p => p.id_producto === productId)
    if (product) {
      onSelect({
        id_producto: product.id_producto,
        nombre: product.nombre,
        cantidad: 1,
        precio_unitario: product.precio,
        subtotal: product.precio
      })
    }
  }

  return (
    <div className="space-y-1">
      <Select onValueChange={handleSelect}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={loading ? "Cargando productos..." : "Seleccione un producto"} />
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel className="text-sm font-medium text-muted-foreground px-2 py-1.5">
              Productos Disponibles
            </SelectLabel>
            {products.map((product) => (
              <SelectItem 
                key={product.id_producto} 
                value={product.id_producto}
                className="flex justify-between items-center gap-4"
              >
                <div className="flex flex-col">
                  <span className="font-medium">{product.nombre}</span>
                  <span className="text-sm text-muted-foreground">
                    Stock: {product.stock_actual}
                  </span>
                </div>
                <span className="text-sm font-semibold">
                  ${product.precio.toLocaleString()}
                </span>
              </SelectItem>
            ))}
            {products.length === 0 && !loading && (
              <div className="px-2 py-4 text-sm text-center text-muted-foreground">
                No hay productos disponibles
              </div>
            )}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  )
} 