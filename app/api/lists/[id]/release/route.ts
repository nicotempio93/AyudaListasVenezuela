import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('lists')
    .update({
      status: 'available',
      claimed_by: null,
      claimed_contact: null,
      claimed_at: null,
    })
    .eq('id', id)
    .eq('status', 'claimed')
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Lista no encontrada o no está en carga.' }, { status: 409 })
  return NextResponse.json(data)
}
