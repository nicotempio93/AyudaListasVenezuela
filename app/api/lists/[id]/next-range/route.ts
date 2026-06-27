import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: list } = await supabase
    .from('lists')
    .select('total_records, block_size, participants(range_to)')
    .eq('id', id)
    .single()

  if (!list?.total_records || !list?.block_size) {
    return NextResponse.json({ range_from: null, range_to: null })
  }

  const participants = Array.isArray(list.participants) ? list.participants : []
  const lastRangeTo = participants.reduce(
    (max, p) => Math.max(max, (p as { range_to: number | null }).range_to ?? 0),
    0
  )
  const range_from = lastRangeTo + 1
  const range_to = Math.min(range_from + list.block_size - 1, list.total_records)

  if (range_from > list.total_records) {
    return NextResponse.json({ range_from: null, range_to: null, full: true })
  }

  return NextResponse.json({ range_from, range_to })
}
