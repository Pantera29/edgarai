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
      services: {
        Row: {
          'id_uuid': string
          'service_name': string
          'description': string | null
          'duration_minutes': number
          'price': number
          'daily_limit': number | null
          'dealership_id': string
          'client_visible': boolean
          'available_monday': boolean
          'available_tuesday': boolean
          'available_wednesday': boolean
          'available_thursday': boolean
          'available_friday': boolean
          'available_saturday': boolean
          'available_sunday': boolean
          'time_restriction_enabled': boolean
          'time_restriction_start_time': string | null
          'time_restriction_end_time': string | null
          'created_at': string
        }
        Insert: {
          'id_uuid'?: string
          'service_name': string
          'description'?: string | null
          'duration_minutes': number
          'price'?: number
          'daily_limit'?: number | null
          'dealership_id'?: string
          'client_visible'?: boolean
          'available_monday'?: boolean
          'available_tuesday'?: boolean
          'available_wednesday'?: boolean
          'available_thursday'?: boolean
          'available_friday'?: boolean
          'available_saturday'?: boolean
          'available_sunday'?: boolean
          'time_restriction_enabled'?: boolean
          'time_restriction_start_time'?: string | null
          'time_restriction_end_time'?: string | null
        }
        Update: {
          'service_name'?: string
          'description'?: string | null
          'duration_minutes'?: number
          'price'?: number
          'daily_limit'?: number | null
          'dealership_id'?: string
          'client_visible'?: boolean
          'available_monday'?: boolean
          'available_tuesday'?: boolean
          'available_wednesday'?: boolean
          'available_thursday'?: boolean
          'available_friday'?: boolean
          'available_saturday'?: boolean
          'available_sunday'?: boolean
          'time_restriction_enabled'?: boolean
          'time_restriction_start_time'?: string | null
          'time_restriction_end_time'?: string | null
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
      conversation_evaluations: {
        Row: {
          id: string
          conversation_id: string
          evaluation_status: 'pending' | 'successful' | 'unsuccessful'
          evaluation_tags: any
          admin_comments: string | null
          evaluated_by: string | null
          evaluated_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          evaluation_status?: 'pending' | 'successful' | 'unsuccessful'
          evaluation_tags?: any
          admin_comments?: string | null
          evaluated_by?: string | null
          evaluated_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          evaluation_status?: 'pending' | 'successful' | 'unsuccessful'
          evaluation_tags?: any
          admin_comments?: string | null
          evaluated_by?: string | null
          evaluated_at?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Functions: {
      get_admin_conversations_with_evaluations: {
        Args: {
          search_query?: string
          dealership_filter?: string
          channel_filter?: string
          evaluation_status_filter?: string
          limit_rows?: number
          offset_rows?: number
        }
        Returns: {
          conversations: unknown
          total_count: number
        }[]
      }
    }
  }
} 