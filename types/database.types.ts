export interface Database {
  public: {
    Tables: {
      specific_services: {
        Row: {
          id: string
          service_name: string
          price: number
          kilometers: number
          months: number
          model_id: string
          is_active: boolean
          created_at: string
          service_id: string | null
          additional_price: number
          additional_description: string
          includes_additional: boolean
          dealership_id: string
        }
        Insert: {
          id?: string
          service_name: string
          price: number
          kilometers: number
          months: number
          model_id: string
          is_active?: boolean
          created_at?: string
          service_id?: string | null
          additional_price?: number
          additional_description?: string
          includes_additional?: boolean
          dealership_id?: string
        }
        Update: {
          id?: string
          service_name?: string
          price?: number
          kilometers?: number
          months?: number
          model_id?: string
          is_active?: boolean
          created_at?: string
          service_id?: string | null
          additional_price?: number
          additional_description?: string
          includes_additional?: boolean
          dealership_id?: string
        }
      }
      appointment: {
        Row: {
          id: string
          client_id: string
          vehicle_id: string
          service_id: string
          specific_service_id: string | null
          appointment_date: string
          appointment_time: string
          status: string
          dealership_id: string
          workshop_id: string | null
          assigned_advisor_id: string | null
          notes: string | null
          channel: string
          created_at: string
          removed_additional: boolean
          completion_notes: string | null
          assigned_mechanic_id: string | null
          cancellation_reason: string | null
          cancelled_at: string | null
          rescheduled_at: string | null
          rescheduling_history: any
        }
        Insert: {
          id?: string
          client_id: string
          vehicle_id: string
          service_id: string
          specific_service_id?: string | null
          appointment_date: string
          appointment_time: string
          status?: string
          dealership_id: string
          workshop_id?: string | null
          assigned_advisor_id?: string | null
          notes?: string | null
          channel?: string
          created_at?: string
          removed_additional?: boolean
          completion_notes?: string | null
          assigned_mechanic_id?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          rescheduled_at?: string | null
          rescheduling_history?: any
        }
        Update: {
          id?: string
          client_id?: string
          vehicle_id?: string
          service_id?: string
          specific_service_id?: string | null
          appointment_date?: string
          appointment_time?: string
          status?: string
          dealership_id?: string
          workshop_id?: string | null
          assigned_advisor_id?: string | null
          notes?: string | null
          channel?: string
          created_at?: string
          removed_additional?: boolean
          completion_notes?: string | null
          assigned_mechanic_id?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          rescheduled_at?: string | null
          rescheduling_history?: any
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
      client_lrf_scores: {
        Row: {
          client_id: string
          dealership_id: string
          length_score: number
          recency_score: number
          frequency_score: number
          lrf_composite_score: number
          current_segment: 'champions' | 'loyal_customers' | 'potential_loyalists' | 'at_risk' | 'cannot_lose' | 'new_customers' | 'lost_customers'
          previous_segment: string | null
          segment_changed_at: string | null
          calculated_at: string
          data_as_of_date: string
          updated_at: string
          first_appointment_date: string | null
          last_appointment_date: string | null
          total_appointments_12m: number
          vehicle_age_years: number | null
          expected_interval_days: number
          days_since_last_appointment: number
        }
        Insert: {
          client_id: string
          dealership_id: string
          length_score?: number
          recency_score?: number
          frequency_score?: number
          lrf_composite_score?: number
          current_segment?: 'champions' | 'loyal_customers' | 'potential_loyalists' | 'at_risk' | 'cannot_lose' | 'new_customers' | 'lost_customers'
          previous_segment?: string | null
          segment_changed_at?: string | null
          calculated_at?: string
          data_as_of_date: string
          updated_at?: string
          first_appointment_date?: string | null
          last_appointment_date?: string | null
          total_appointments_12m?: number
          vehicle_age_years?: number | null
          expected_interval_days?: number
          days_since_last_appointment?: number
        }
        Update: {
          client_id?: string
          dealership_id?: string
          length_score?: number
          recency_score?: number
          frequency_score?: number
          lrf_composite_score?: number
          current_segment?: 'champions' | 'loyal_customers' | 'potential_loyalists' | 'at_risk' | 'cannot_lose' | 'new_customers' | 'lost_customers'
          previous_segment?: string | null
          segment_changed_at?: string | null
          calculated_at?: string
          data_as_of_date?: string
          updated_at?: string
          first_appointment_date?: string | null
          last_appointment_date?: string | null
          total_appointments_12m?: number
          vehicle_age_years?: number | null
          expected_interval_days?: number
          days_since_last_appointment?: number
        }
      }
      calendar_tokens: {
        Row: {
          id: string
          dealership_id: string
          token_hash: string
          created_at: string
          expires_at: string | null
          is_active: boolean
          created_by: string | null
          last_accessed_at: string | null
          access_count: number
        }
        Insert: {
          id?: string
          dealership_id: string
          token_hash: string
          created_at?: string
          expires_at?: string | null
          is_active?: boolean
          created_by?: string | null
          last_accessed_at?: string | null
          access_count?: number
        }
        Update: {
          id?: string
          dealership_id?: string
          token_hash?: string
          created_at?: string
          expires_at?: string | null
          is_active?: boolean
          created_by?: string | null
          last_accessed_at?: string | null
          access_count?: number
        }
      }
      nps: {
        Row: {
          id: string
          appointment_id: number | null
          customer_id: string
          status: string
          score: number | null
          classification: string | null
          comments: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          appointment_id?: number | null
          customer_id: string
          status?: string
          score?: number | null
          classification?: string | null
          comments?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          appointment_id?: number | null
          customer_id?: string
          status?: string
          score?: number | null
          classification?: string | null
          comments?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      phone_agent_settings: {
        Row: {
          id: string
          phone_number: string
          dealership_id: string
          agent_active: boolean
          notes: string | null
          created_at: string
          updated_at: string
          created_by: string
          updated_by: string
        }
        Insert: {
          id?: string
          phone_number: string
          dealership_id: string
          agent_active?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string
          updated_by?: string
        }
        Update: {
          id?: string
          phone_number?: string
          dealership_id?: string
          agent_active?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string
          updated_by?: string
        }
      }
      mechanics: {
        Row: {
          id: string
          name: string
          email: string | null
          phone: string | null
          specialties: string[] | null
          is_active: boolean | null
          dealership_id: string | null
          workshop_id: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          name: string
          email?: string | null
          phone?: string | null
          specialties?: string[] | null
          is_active?: boolean | null
          dealership_id?: string | null
          workshop_id?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          email?: string | null
          phone?: string | null
          specialties?: string[] | null
          is_active?: boolean | null
          dealership_id?: string | null
          workshop_id?: string | null
          created_at?: string | null
        }
      }
      service_advisors: {
        Row: {
          id: string
          dealership_id: string
          workshop_id: string
          name: string
          email: string | null
          phone: string | null
          shift_start_time: string
          shift_end_time: string
          lunch_start_time: string
          lunch_end_time: string
          works_monday: boolean
          works_tuesday: boolean
          works_wednesday: boolean
          works_thursday: boolean
          works_friday: boolean
          works_saturday: boolean
          works_sunday: boolean
          max_consecutive_services: number
          max_slots_monday: number
          max_slots_tuesday: number
          max_slots_wednesday: number
          max_slots_thursday: number
          max_slots_friday: number
          max_slots_saturday: number
          max_slots_sunday: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          dealership_id: string
          workshop_id: string
          name: string
          email?: string | null
          phone?: string | null
          shift_start_time: string
          shift_end_time: string
          lunch_start_time: string
          lunch_end_time: string
          works_monday?: boolean
          works_tuesday?: boolean
          works_wednesday?: boolean
          works_thursday?: boolean
          works_friday?: boolean
          works_saturday?: boolean
          works_sunday?: boolean
          max_consecutive_services?: number
          max_slots_monday?: number
          max_slots_tuesday?: number
          max_slots_wednesday?: number
          max_slots_thursday?: number
          max_slots_friday?: number
          max_slots_saturday?: number
          max_slots_sunday?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          dealership_id?: string
          workshop_id?: string
          name?: string
          email?: string | null
          phone?: string | null
          shift_start_time?: string
          shift_end_time?: string
          lunch_start_time?: string
          lunch_end_time?: string
          works_monday?: boolean
          works_tuesday?: boolean
          works_wednesday?: boolean
          works_thursday?: boolean
          works_friday?: boolean
          works_saturday?: boolean
          works_sunday?: boolean
          max_consecutive_services?: number
          max_slots_monday?: number
          max_slots_tuesday?: number
          max_slots_wednesday?: number
          max_slots_thursday?: number
          max_slots_friday?: number
          max_slots_saturday?: number
          max_slots_sunday?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      advisor_slot_configuration: {
        Row: {
          id: string
          advisor_id: string
          slot_position: number
          service_id: string
          created_at: string
        }
        Insert: {
          id?: string
          advisor_id: string
          slot_position: number
          service_id: string
          created_at?: string
        }
        Update: {
          id?: string
          advisor_id?: string
          slot_position?: number
          service_id?: string
          created_at?: string
        }
      }
      dealerships: {
        Row: {
          id: string
          name: string
          address: string | null
          is_active: boolean | null
          has_platform_access: boolean | null
          multiple_locations: boolean | null
          capacity_model: 'physical_spaces' | 'service_advisors'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          address?: string | null
          is_active?: boolean | null
          has_platform_access?: boolean | null
          multiple_locations?: boolean | null
          capacity_model?: 'physical_spaces' | 'service_advisors'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          address?: string | null
          is_active?: boolean | null
          has_platform_access?: boolean | null
          multiple_locations?: boolean | null
          capacity_model?: 'physical_spaces' | 'service_advisors'
          created_at?: string
          updated_at?: string
        }
      }
      services: {
        Row: {
          id_uuid: string
          service_name: string
          description: string | null
          price: number | null
          duration_minutes: number | null
          dealership_id: string | null
          client_visible: boolean | null
          requires_confirmation_reminder: boolean | null
          daily_limit: number | null
          available_monday: boolean
          available_tuesday: boolean
          available_wednesday: boolean
          available_thursday: boolean
          available_friday: boolean
          available_saturday: boolean
          available_sunday: boolean
          time_restriction_enabled: boolean
          time_restriction_start_time: string | null
          time_restriction_end_time: string | null
          created_at: string
        }
        Insert: {
          id_uuid?: string
          service_name: string
          description?: string | null
          price?: number | null
          duration_minutes?: number | null
          dealership_id?: string | null
          client_visible?: boolean | null
          requires_confirmation_reminder?: boolean | null
          daily_limit?: number | null
          available_monday?: boolean
          available_tuesday?: boolean
          available_wednesday?: boolean
          available_thursday?: boolean
          available_friday?: boolean
          available_saturday?: boolean
          available_sunday?: boolean
          time_restriction_enabled?: boolean
          time_restriction_start_time?: string | null
          time_restriction_end_time?: string | null
          created_at?: string
        }
        Update: {
          id_uuid?: string
          service_name?: string
          description?: string | null
          price?: number | null
          duration_minutes?: number | null
          dealership_id?: string | null
          client_visible?: boolean | null
          requires_confirmation_reminder?: boolean | null
          daily_limit?: number | null
          available_monday?: boolean
          available_tuesday?: boolean
          available_wednesday?: boolean
          available_thursday?: boolean
          available_friday?: boolean
          available_saturday?: boolean
          available_sunday?: boolean
          time_restriction_enabled?: boolean
          time_restriction_start_time?: string | null
          time_restriction_end_time?: string | null
          created_at?: string
        }
      }
      dealership_configuration: {
        Row: {
          dealership_id: string
          workshop_id: string
          shift_duration: number
          whatsapp_token: string | null
          assistant_id: string | null
          tool_ids: any
          assistant_name: string | null
          config_data: any
          timezone: string
          custom_morning_slots: any
          regular_slots_start_time: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          dealership_id: string
          workshop_id: string
          shift_duration: number
          whatsapp_token?: string | null
          assistant_id?: string | null
          tool_ids?: any
          assistant_name?: string | null
          config_data?: any
          timezone?: string
          custom_morning_slots?: any
          regular_slots_start_time?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          dealership_id?: string
          workshop_id?: string
          shift_duration?: number
          whatsapp_token?: string | null
          assistant_id?: string | null
          tool_ids?: any
          assistant_name?: string | null
          config_data?: any
          timezone?: string
          custom_morning_slots?: any
          regular_slots_start_time?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      workshops: {
        Row: {
          id: string
          dealership_id: string
          name: string
          address: string | null
          city: string | null
          phone: string | null
          location_url: string | null
          is_main: boolean
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          dealership_id: string
          name: string
          address?: string | null
          city?: string | null
          phone?: string | null
          location_url?: string | null
          is_main?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          dealership_id?: string
          name?: string
          address?: string | null
          city?: string | null
          phone?: string | null
          location_url?: string | null
          is_main?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      vehicle_nissan_segments: {
        Row: {
          id: string
          vehicle_id: string
          vin: string | null
          dealership_id: string
          current_segment: 'activo_proximo_mantenimiento' | 'pasivo_proximo_mantenimiento' | 'activo_recordatorio' | 'pasivo_recordatorio' | 'activo_retencion' | 'pasivo_retencion' | 'pasivo_en_riesgo' | 'inactivo' | 'sin_datos' | 'sin_clasificar'
          previous_segment: string | null
          segment_changed_at: string | null
          total_appointments_12m: number
          last_appointment_date: string | null
          days_since_last_appointment: number
          months_since_last_appointment: number
          calculated_at: string
          data_as_of_date: string
          updated_at: string
        }
        Insert: {
          id?: string
          vehicle_id: string
          vin?: string | null
          dealership_id: string
          current_segment: 'activo_proximo_mantenimiento' | 'pasivo_proximo_mantenimiento' | 'activo_recordatorio' | 'pasivo_recordatorio' | 'activo_retencion' | 'pasivo_retencion' | 'pasivo_en_riesgo' | 'inactivo' | 'sin_datos' | 'sin_clasificar'
          previous_segment?: string | null
          segment_changed_at?: string | null
          total_appointments_12m?: number
          last_appointment_date?: string | null
          days_since_last_appointment?: number
          months_since_last_appointment?: number
          calculated_at?: string
          data_as_of_date: string
          updated_at?: string
        }
        Update: {
          id?: string
          vehicle_id?: string
          vin?: string | null
          dealership_id?: string
          current_segment?: 'activo_proximo_mantenimiento' | 'pasivo_proximo_mantenimiento' | 'activo_recordatorio' | 'pasivo_recordatorio' | 'activo_retencion' | 'pasivo_retencion' | 'pasivo_en_riesgo' | 'inactivo' | 'sin_datos' | 'sin_clasificar'
          previous_segment?: string | null
          segment_changed_at?: string | null
          total_appointments_12m?: number
          last_appointment_date?: string | null
          days_since_last_appointment?: number
          months_since_last_appointment?: number
          calculated_at?: string
          data_as_of_date?: string
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

// Tipos auxiliares para Service Advisors
export type ServiceAdvisor = Database['public']['Tables']['service_advisors']['Row']
export type ServiceAdvisorInsert = Database['public']['Tables']['service_advisors']['Insert']
export type ServiceAdvisorUpdate = Database['public']['Tables']['service_advisors']['Update']

export type AdvisorSlotConfiguration = Database['public']['Tables']['advisor_slot_configuration']['Row']
export type AdvisorSlotConfigurationInsert = Database['public']['Tables']['advisor_slot_configuration']['Insert']
export type AdvisorSlotConfigurationUpdate = Database['public']['Tables']['advisor_slot_configuration']['Update']

export type Service = Database['public']['Tables']['services']['Row']
export type Dealership = Database['public']['Tables']['dealerships']['Row']
export type DealershipConfiguration = Database['public']['Tables']['dealership_configuration']['Row']
export type Workshop = Database['public']['Tables']['workshops']['Row']
export type Appointment = Database['public']['Tables']['appointment']['Row']

// Tipos para crear Service Advisor (sin campos auto-generados)
export type CreateServiceAdvisorInput = Omit<
  ServiceAdvisorInsert,
  'id' | 'created_at' | 'updated_at'
>

// Tipos para actualizar Service Advisor (todos los campos opcionales)
export type UpdateServiceAdvisorInput = Partial<CreateServiceAdvisorInput>

// Tipo para crear un slot individual
export type CreateAdvisorSlotInput = Omit<
  AdvisorSlotConfigurationInsert,
  'id' | 'created_at' | 'advisor_id'
>

// Tipo para configurar múltiples slots de un asesor
export interface ConfigureAdvisorSlotsInput {
  slots: Array<{
    position: number
    serviceId: string
  }>
}

// Tipo para mostrar un slot con información del servicio (usado en las vistas)
export interface AdvisorSlotWithService extends AdvisorSlotConfiguration {
  service?: Service
}

// Tipo para mostrar un asesor con información relacionada
export interface ServiceAdvisorWithRelations extends ServiceAdvisor {
  workshop?: Workshop
  dealership?: Dealership
  slots?: AdvisorSlotWithService[]
}

// Tipo para los días laborables
export interface WorkingDays {
  monday: boolean
  tuesday: boolean
  wednesday: boolean
  thursday: boolean
  friday: boolean
  saturday: boolean
  sunday: boolean
}

// Helper para obtener los días laborables de un asesor
export function getWorkingDaysFromAdvisor(advisor: ServiceAdvisor): WorkingDays {
  return {
    monday: advisor.works_monday,
    tuesday: advisor.works_tuesday,
    wednesday: advisor.works_wednesday,
    thursday: advisor.works_thursday,
    friday: advisor.works_friday,
    saturday: advisor.works_saturday,
    sunday: advisor.works_sunday,
  }
}

// Helper para formatear horario
export function formatTimeRange(startTime: string, endTime: string): string {
  return `${startTime.slice(0, 5)} - ${endTime.slice(0, 5)}`
}

// Helper para obtener días laborables como string
export function getWorkingDaysString(advisor: ServiceAdvisor): string {
  const days = []
  if (advisor.works_monday) days.push('Lun')
  if (advisor.works_tuesday) days.push('Mar')
  if (advisor.works_wednesday) days.push('Mié')
  if (advisor.works_thursday) days.push('Jue')
  if (advisor.works_friday) days.push('Vie')
  if (advisor.works_saturday) days.push('Sáb')
  if (advisor.works_sunday) days.push('Dom')
  return days.join(', ')
} 