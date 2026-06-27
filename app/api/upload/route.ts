import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const title = formData.get('title') as string | null

  if (!file || !title) {
    return NextResponse.json({ error: 'Archivo y título requeridos.' }, { status: 400 })
  }

  const supabase = await createClient()

  const ext = file.name.split('.').pop() ?? ''
  const safeName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
  const filePath = safeName

  const { error: uploadError } = await supabase.storage
    .from('lists')
    .upload(filePath, file, { upsert: false })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  const { data: urlData } = supabase.storage.from('lists').getPublicUrl(filePath)

  const { data, error } = await supabase
    .from('lists')
    .insert({
      title,
      file_path: filePath,
      file_url: urlData.publicUrl,
      file_type: ext.toLowerCase(),
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
