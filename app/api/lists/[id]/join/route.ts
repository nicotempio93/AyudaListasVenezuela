import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('join_list', {
    p_list_id:        id,
    p_name:           body.name,
    p_contact:        body.contact ?? null,
    p_whatsapp_group: body.whatsapp_group ?? null,
  })

  if (error) {
    const status = error.message.includes('asignados') || error.message.includes('completada') ? 409 : 500
    return NextResponse.json({ error: error.message }, { status })
  }

  return NextResponse.json(data, { status: 201 })
}
