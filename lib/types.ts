export type ListStatus = 'available' | 'claimed' | 'completed'

export interface Participant {
  id: string
  list_id: string
  name: string
  contact: string | null
  joined_at: string
}

export interface ListRow {
  id: string
  title: string
  file_path: string
  file_url: string | null
  file_type: string | null
  status: ListStatus
  whatsapp_group: string | null
  // legacy fields kept for DB compat
  claimed_by: string | null
  claimed_contact: string | null
  claimed_at: string | null
  completed_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
  participants: Participant[]
}
