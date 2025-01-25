"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DialogFooter } from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

const formSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  descripcion: z.string().optional(),
  unidad_medida: z.string().min(1, "La unidad de medida es requerida"),
  stock_actual: z.number().min(0, "El stock no puede ser negativo"),
  precio: z.number().min(0, "El precio no puede ser negativo")
})

interface ProductFormProps {
  onSuccess?: () => void
}

export function ProductForm({ onSuccess }: ProductFormProps) {
  const [loading, setLoading] = useState(false)

  const form = useForm({
    defaultValues: {
      nombre: "",
      descripcion: "",
      unidad_medida: "",
      stock_actual: 0,
      precio: 0
    }
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('productos')
        .insert({
          nombre: values.nombre,
          descripcion: values.descripcion || '',
          unidad_medida: values.unidad_medida,
          stock_actual: values.stock_actual,
          precio: values.precio
        })

      if (error) throw error

      toast.success("Producto guardado correctamente")
      form.reset()
      onSuccess?.()
    } catch (error) {
      console.error('Error guardando producto:', error)
      toast.error("Error al guardar el producto")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="nombre" className="text-right">
            Nombre *
          </Label>
          <Input
            id="nombre"
            className="col-span-3"
            value={form.watch('nombre')}
            onChange={(e) => form.setValue('nombre', e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="descripcion" className="text-right">
            Descripción
          </Label>
          <Input
            id="descripcion"
            className="col-span-3"
            value={form.watch('descripcion')}
            onChange={(e) => form.setValue('descripcion', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="unidad_medida" className="text-right">
            Unidad de Medida *
          </Label>
          <Select
            value={form.watch('unidad_medida')}
            onValueChange={(value) => form.setValue('unidad_medida', value)}
          >
            <SelectTrigger className="col-span-3">
              <SelectValue placeholder="Seleccione unidad de medida" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unidad">Unidad</SelectItem>
              <SelectItem value="kg">Kilogramo</SelectItem>
              <SelectItem value="lt">Litro</SelectItem>
              <SelectItem value="mt">Metro</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="stock_actual" className="text-right">
            Stock Actual *
          </Label>
          <Input
            id="stock_actual"
            type="number"
            min="0"
            step="0.01"
            className="col-span-3"
            value={form.watch('stock_actual')}
            onChange={(e) => form.setValue('stock_actual', Number(e.target.value) || 0)}
            required
          />
        </div>

        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="precio" className="text-right">
            Precio *
          </Label>
          <Input
            id="precio"
            type="number"
            min="0"
            step="1"
            className="col-span-3"
            value={form.watch('precio')}
            onChange={(e) => form.setValue('precio', Number(e.target.value) || 0)}
            required
          />
        </div>
      </div>

      <DialogFooter>
        <Button type="submit" disabled={loading}>
          {loading ? "Guardando..." : "Guardar Producto"}
        </Button>
      </DialogFooter>
    </form>
  )
} 