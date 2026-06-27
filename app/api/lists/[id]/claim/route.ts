import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  const supabase = await createClient()

  // Atomic claim: only update if still available
  const { data, error, count } = await supabase
    .from('lists')
    .update({
      status: 'claimed',
      claimed_by: body.claimed_by,
      claimed_contact: body.claimed_contact ?? null,
      claimed_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('status', 'available')
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (!data || data.length === 0) {
    return NextResponse.json(
      { error: 'Esta lista ya fue tomada por otra persona.' },
      { status: 409 }
    )
  }

  return NextResponse.json(data[0])
}
