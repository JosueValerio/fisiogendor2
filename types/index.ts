export type AppointmentStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'pending'
export type MessageDirection = 'in' | 'out'
export type AIIntent = 'schedule' | 'reschedule' | 'cancel' | 'fallback'
export type AITone = 'empathetic' | 'casual' | 'formal'

export interface Profile {
  id: string
  email: string
  clinic_name: string | null
  phone: string | null
  subscription_status: 'active' | 'inactive' | 'cancelled'
  stripe_customer_id: string | null
  created_at: string
}

export interface Patient {
  id: string
  user_id: string
  name: string
  phone: string
  email: string | null
  status: string | null
  recovery_progress: number
  clinical_history: string | null
  created_at: string
  updated_at: string
}

export interface Appointment {
  id: string
  user_id: string
  patient_id: string
  datetime: string
  type: string | null
  status: AppointmentStatus
  google_event_id: string | null
  notes: string | null
  created_at: string
  updated_at: string
  patient?: Patient
}

export interface Message {
  id: string
  user_id: string
  patient_id: string | null
  content: string
  direction: MessageDirection
  whatsapp_message_id: string | null
  processed: boolean
  intent: AIIntent | null
  created_at: string
  patient?: Patient
}

export interface AgentSettings {
  id: string
  user_id: string
  ai_tone: AITone
  operating_hours: Record<string, { start: string; end: string; enabled: boolean }>
  specific_instructions: string | null
  trigger_keywords: string[]
  whatsapp_instance_id: string | null
  google_calendar_id: string | null
  google_tokens: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export interface AIResponse {
  intent: AIIntent
  date: string | null
  time: string | null
  patientName: string | null
}
