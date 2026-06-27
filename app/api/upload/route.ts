import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const title = formData.get('title') as string | null
  const assignmentType = (formData.get('assignment_type') as string | null) ?? 'records'
  const rangeStartRaw = formData.get('range_start') as string | null
  const rangeEndRaw = formData.get('range_end') as string | null
  const blockSizeRaw = formData.get('block_size') as string | null

  const range_start = rangeStartRaw ? parseInt(rangeStartRaw, 10) : null
  const range_end = rangeEndRaw ? parseInt(rangeEndRaw, 10) : null
  const block_size = blockSizeRaw ? parseInt(blockSizeRaw, 10) : null

  if (!file || !title) {
    return NextResponse.json({ error: 'Archivo y título requeridos.' }, { status: 400 })
  }

  const supabase = await createClient()

  const ext = file.name.split('.').pop() ?? ''
  const safeName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`

  const { error: uploadError } = await supabase.storage
    .from('lists')
    .upload(safeName, file, { upsert: false })

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const { data: urlData } = supabase.storage.from('lists').getPublicUrl(safeName)

  const { data, error } = await supabase
    .from('lists')
    .insert({
      title,
      file_path: safeName,
      file_url: urlData.publicUrl,
      file_type: ext.toLowerCase(),
      assignment_type: assignmentType,
      range_start: range_start ?? null,
      range_end: range_end ?? null,
      block_size: block_size ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
