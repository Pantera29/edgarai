export type TransactionStatus = 'pendiente' | 'pagado' | 'anulado'

export interface TransactionProduct {
  id_producto: string
  nombre: string
  cantidad: number
  precio_unitario: number
  subtotal: number
}

export interface Transaction {
  id_transaccion: string
  id_cita: string
  fecha_transaccion: string
  estado_pago: TransactionStatus
  notas: string | null
  total: number
  productos: TransactionProduct[]
  creado_el: string
  actualizado_el: string
} 