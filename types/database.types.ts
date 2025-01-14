export interface Database {
  public: {
    Tables: {
      citas: {
        Row: {
          'uuid id': string
          'cliente_id uuid': string
          'servicio_id uuid': string
          fecha_hora: string
          estado: 'pendiente' | 'confirmada' | 'completada' | 'cancelada'
          notas: string
          created_at: string
        }
        Insert: {
          'cliente_id uuid': string
          'servicio_id uuid': string
          fecha_hora: string
          estado: 'pendiente' | 'confirmada' | 'completada' | 'cancelada'
          notas?: string
        }
        Update: {
          fecha_hora?: string
          estado?: 'pendiente' | 'confirmada' | 'completada' | 'cancelada'
          notas?: string
        }
      }
      servicios: {
        Row: {
          'id uuid': string
          nombre: string
          descripcion: string | null
          duracion_estimada: number
          precio: number
          created_at: string
        }
      }
      recordatorios_mantenimiento: {
        Row: {
          id: string
          cliente_id: string
          tipo: string
          fecha_programada: string
          descripcion: string
          estado: 'pendiente' | 'completado' | 'vencido'
          kilometraje_programado?: number
          created_at: string
        }
        Insert: {
          cliente_id: string
          tipo: string
          fecha_programada: string
          descripcion: string
          estado: 'pendiente' | 'completado' | 'vencido'
          kilometraje_programado?: number
        }
      }
    }
  }
} 