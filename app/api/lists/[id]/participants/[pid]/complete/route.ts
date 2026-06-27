import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string; pid: string }> }
) {
  const { id, pid } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('participants')
    .update({ completed_at: new Date().toISOString() })
    .eq('id', pid)
    .eq('list_id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; pid: string }> }
) {
  const { id, pid } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('participants')
    .update({ completed_at: null })
    .eq('id', pid)
    .eq('list_id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
