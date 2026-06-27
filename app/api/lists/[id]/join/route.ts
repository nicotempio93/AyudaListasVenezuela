import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const MAX_PARTICIPANTS = 10

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  const supabase = await createClient()

  // Check list exists and is not completed
  const { data: list, error: listErr } = await supabase
    .from('lists')
    .select('id, status, participants(id)')
    .eq('id', id)
    .single()

  if (listErr || !list) return NextResponse.json({ error: 'Lista no encontrada.' }, { status: 404 })
  if (list.status === 'completed') return NextResponse.json({ error: 'Esta lista ya está completada.' }, { status: 409 })

  const count = Array.isArray(list.participants) ? list.participants.length : 0
  if (count >= MAX_PARTICIPANTS) {
    return NextResponse.json({ error: `La lista ya tiene ${MAX_PARTICIPANTS} participantes.` }, { status: 409 })
  }

  // Add participant
  const { data: participant, error: partErr } = await supabase
    .from('participants')
    .insert({ list_id: id, name: body.name, contact: body.contact ?? null })
    .select()
    .single()

  if (partErr) return NextResponse.json({ error: partErr.message }, { status: 500 })

  // Set status to claimed if it was available
  if (list.status === 'available') {
    await supabase
      .from('lists')
      .update({ status: 'claimed', claimed_at: new Date().toISOString() })
      .eq('id', id)
  }

  // Optionally update whatsapp_group if provided
  if (body.whatsapp_group) {
    await supabase
      .from('lists')
      .update({ whatsapp_group: body.whatsapp_group })
      .eq('id', id)
  }

  return NextResponse.json(participant, { status: 201 })
}
