"use client"

import { ProductosTable } from "@/components/productos/productos-table"
import { Button } from "@/components/ui/button"
import { PlusCircle, Upload } from "lucide-react"
import { useState } from "react"
import { ProductForm } from "@/components/productos/product-form"
import { ProductImport } from "@/components/productos/product-import"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog"

export default function ProductosPage() {
  const [showNewProduct, setShowNewProduct] = useState(false)
  const [showImport, setShowImport] = useState(false)

  return (
    <div className="container mx-auto py-10 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Productos</h2>
        <div className="flex gap-2">
          <Button onClick={() => setShowNewProduct(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Nuevo Producto
          </Button>
          <Button variant="outline" onClick={() => setShowImport(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Importar CSV
          </Button>
        </div>
      </div>

      <ProductosTable />

      <Dialog open={showNewProduct} onOpenChange={setShowNewProduct}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Nuevo Producto</DialogTitle>
            <DialogDescription>
              Complete los datos del nuevo producto. Los campos marcados con * son obligatorios.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-6">
            <ProductForm onSuccess={() => setShowNewProduct(false)} />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showImport} onOpenChange={setShowImport}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Importar Productos</DialogTitle>
            <DialogDescription>
              Importe múltiples productos usando un archivo CSV. Asegúrese de usar el formato correcto.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-6">
            <ProductImport onSuccess={() => setShowImport(false)} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 