import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; pid: string }> }
) {
  const { id, pid } = await params
  const supabase = await createClient()

  const { error } = await supabase
    .from('participants')
    .delete()
    .eq('id', pid)
    .eq('list_id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // If no more participants, set list back to available
  const { data: remaining } = await supabase
    .from('participants')
    .select('id')
    .eq('list_id', id)

  if (!remaining || remaining.length === 0) {
    await supabase
      .from('lists')
      .update({ status: 'available', claimed_at: null })
      .eq('id', id)
      .eq('status', 'claimed')
  }

  return NextResponse.json({ ok: true })
}
