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

  // Get list with participant count and range info
  const { data: list, error: listErr } = await supabase
    .from('lists')
    .select('id, status, range_start, range_end, block_size, participants(id, range_to)')
    .eq('id', id)
    .single()

  if (listErr || !list) return NextResponse.json({ error: 'Lista no encontrada.' }, { status: 404 })
  if (list.status === 'completed') return NextResponse.json({ error: 'Esta lista ya está completada.' }, { status: 409 })

  const participants = Array.isArray(list.participants) ? list.participants : []
  if (participants.length >= MAX_PARTICIPANTS) {
    return NextResponse.json({ error: `La lista ya tiene ${MAX_PARTICIPANTS} participantes.` }, { status: 409 })
  }

  // Calculate auto-assigned range if range_start, range_end and block_size are set
  let range_from: number | null = null
  let range_to: number | null = null

  if (list.range_start != null && list.range_end != null && list.block_size) {
    const lastRangeTo = participants.reduce(
      (max, p) => Math.max(max, (p as { range_to: number | null }).range_to ?? (list.range_start! - 1)),
      list.range_start - 1
    )
    range_from = lastRangeTo + 1
    range_to = Math.min(range_from + list.block_size - 1, list.range_end)

    if (range_from > list.range_end) {
      return NextResponse.json(
        { error: 'Todos los registros ya están asignados. No hay más bloques disponibles.' },
        { status: 409 }
      )
    }
  }

  // Add participant with assigned range
  const { data: participant, error: partErr } = await supabase
    .from('participants')
    .insert({ list_id: id, name: body.name, contact: body.contact ?? null, range_from, range_to })
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

  if (body.whatsapp_group) {
    await supabase
      .from('lists')
      .update({ whatsapp_group: body.whatsapp_group })
      .eq('id', id)
  }

  return NextResponse.json(participant, { status: 201 })
}
