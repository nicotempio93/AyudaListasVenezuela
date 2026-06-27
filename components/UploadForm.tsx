'use client'
import { useState, useRef } from 'react'

const ACCEPTED = '.jpg,.jpeg,.png,.webp,.pdf,.xlsx,.xls,.csv,.doc,.docx'

interface Props {
  onUploaded: () => void
}

export function UploadForm({ onUploaded }: Props) {
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null
    setFile(f)
    if (f && !title) setTitle(f.name.replace(/\.[^.]+$/, ''))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file || !title.trim()) { setError('Archivo y título requeridos.'); return }
    setLoading(true)
    setError('')
    const fd = new FormData()
    fd.append('file', file)
    fd.append('title', title.trim())
    const res = await fetch('/api/upload', { method: 'POST', body: fd })
    const json = await res.json()
    if (!res.ok) { setError(json.error); setLoading(false); return }
    setOpen(false)
    setFile(null)
    setTitle('')
    setLoading(false)
    if (inputRef.current) inputRef.current.value = ''
    onUploaded()
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg text-sm font-medium hover:bg-gray-700"
      >
        + Subir lista
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
        <h2 className="text-lg font-bold mb-4">Subir nueva lista</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Archivo <span className="text-red-500">*</span>
            </label>
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED}
              onChange={handleFileChange}
              className="w-full text-sm text-gray-700 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border file:border-gray-300 file:text-sm file:font-medium file:bg-white hover:file:bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Título <span className="text-red-500">*</span>
            </label>
            <input
              className="w-full border rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: Lista Barrio El Paraíso"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={() => { setOpen(false); setFile(null); setTitle(''); setError('') }}
              className="flex-1 py-2.5 rounded-lg border text-gray-700 font-medium"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-lg bg-gray-800 text-white font-semibold disabled:opacity-60"
              disabled={loading}
            >
              {loading ? 'Subiendo…' : 'Subir'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
