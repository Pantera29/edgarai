"use client"

import { useState } from "react"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Eye } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { TransactionStatusUpdate } from "@/components/workshop/transaction-status-update"

interface TransactionProduct {
  cantidad_usada: number
  precio_unitario: number
  productos: {
    nombre: string
  }
}

function TransactionDetails({ transaction }: { transaction: any }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="font-medium">Cliente</h4>
          <p>{transaction.citas?.clientes?.nombre}</p>
        </div>
        <div>
          <h4 className="font-medium">Fecha</h4>
          <p>{format(new Date(transaction.fecha_transaccion), "PPP", { locale: es })}</p>
        </div>
        <div>
          <h4 className="font-medium">Estado de Pago</h4>
          <Badge variant={
            transaction.estado === 'pagado' ? 'success' :
            transaction.estado === 'pendiente' ? 'warning' :
            'destructive'
          }>
            {transaction.estado}
          </Badge>
        </div>
        <div>
          <h4 className="font-medium">Total</h4>
          <p>${transaction.transaccion_productos?.reduce(
            (sum: number, prod: TransactionProduct) => sum + (prod.cantidad_usada * prod.precio_unitario),
            0
          ).toLocaleString()}</p>
        </div>
      </div>

      <div>
        <h4 className="font-medium mb-2">Productos</h4>
        <div className="border rounded-lg divide-y">
          {transaction.transaccion_productos?.map((prod: any) => (
            <div key={prod.id_producto} className="p-2 flex justify-between">
              <span>{prod.productos?.nombre}</span>
              <div className="space-x-4">
                <span>x{prod.cantidad_usada}</span>
                <span>${(prod.cantidad_usada * prod.precio_unitario).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {transaction.notas && (
        <div>
          <h4 className="font-medium">Notas</h4>
          <p>{transaction.notas}</p>
        </div>
      )}
    </div>
  )
}

export const columns: ColumnDef<any>[] = [
  {
    accessorKey: "fecha_transaccion",
    header: "Fecha",
    cell: ({ row }) => format(new Date(row.getValue("fecha_transaccion")), "PPP", { locale: es })
  },
  {
    accessorKey: "citas.clientes.nombre",
    header: "Cliente",
    cell: ({ row }) => row.original.citas?.clientes?.nombre || '-'
  },
  {
    accessorKey: "estado",
    header: "Estado de Pago",
    cell: ({ row }) => (
      <TransactionStatusUpdate
        transactionId={row.original.id_transaccion}
        currentStatus={row.getValue("estado")}
        onUpdate={() => {
          // Recargar los datos
          const table = document.querySelector('[data-table-key="transacciones"]')
          if (table) {
            const event = new Event('refresh')
            table.dispatchEvent(event)
          }
        }}
      />
    )
  },
  {
    accessorKey: "total",
    header: "Total",
    cell: ({ row }) => {
      const total = row.original.transaccion_productos?.reduce(
        (sum: number, prod: any) => sum + (prod.cantidad_usada * prod.precio_unitario),
        0
      ) || 0
      return `$${total.toLocaleString()}`
    }
  },
  {
    accessorKey: "productos",
    header: "Productos",
    cell: ({ row }) => {
      const [expanded, setExpanded] = useState(false)
      const productos = row.original.transaccion_productos || []
      
      return (
        <div className="text-sm">
          <Button
            variant="ghost"
            className="h-auto p-0 font-normal"
            onClick={() => setExpanded(!expanded)}
          >
            {productos.length} {productos.length === 1 ? 'producto' : 'productos'}
          </Button>
          {expanded && (
            <div className="mt-2 space-y-1">
              {productos.map((prod: any) => (
                <div key={prod.id_producto} className="ml-4">
                  {prod.productos?.nombre} x {prod.cantidad_usada}
                </div>
              ))}
            </div>
          )}
        </div>
      )
    }
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const [showDetails, setShowDetails] = useState(false)
      
      return (
        <>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowDetails(true)}
          >
            <Eye className="h-4 w-4" />
          </Button>

          <Dialog open={showDetails} onOpenChange={setShowDetails}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Detalles de la Transacción</DialogTitle>
              </DialogHeader>
              <TransactionDetails transaction={row.original} />
            </DialogContent>
          </Dialog>
        </>
      )
    }
  }
] 