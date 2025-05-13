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
  notas: string | null
  created_at: string
  updated_at: string
} 