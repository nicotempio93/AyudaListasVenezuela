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
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', id)
    .eq('status', 'claimed')
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Lista no encontrada o no está en carga.' }, { status: 409 })
  return NextResponse.json(data)
}

// Undo complete → back to claimed (if participants remain) or available
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: participants } = await supabase
    .from('participants')
    .select('id')
    .eq('list_id', id)

  const hasParticipants = participants && participants.length > 0

  const { data, error } = await supabase
    .from('lists')
    .update({
      status: hasParticipants ? 'claimed' : 'available',
      completed_at: null,
    })
    .eq('id', id)
    .eq('status', 'completed')
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Lista no encontrada o no está completada.' }, { status: 409 })
  return NextResponse.json(data)
}
