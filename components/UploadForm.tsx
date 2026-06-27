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
  const [rangeStart, setRangeStart] = useState('')
  const [rangeEnd, setRangeEnd] = useState('')
  const [blockSize, setBlockSize] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null
    setFile(f)
    if (f && !title) setTitle(f.name.replace(/\.[^.]+$/, ''))
  }

  function recalcBlockSize(start: string, end: string) {
    const s = parseInt(start, 10)
    const e = parseInt(end, 10)
    if (s > 0 && e > s) setBlockSize(String(Math.ceil((e - s + 1) / 10)))
  }

  function handleRangeStartChange(val: string) {
    setRangeStart(val)
    recalcBlockSize(val, rangeEnd)
  }

  function handleRangeEndChange(val: string) {
    setRangeEnd(val)
    recalcBlockSize(rangeStart, val)
  }

  function close() {
    setOpen(false); setFile(null); setTitle('')
    setRangeStart(''); setRangeEnd(''); setBlockSize(''); setError('')
    if (inputRef.current) inputRef.current.value = ''
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file || !title.trim()) { setError('Archivo y título requeridos.'); return }
    const s = parseInt(rangeStart, 10)
    const en = parseInt(rangeEnd, 10)
    if (rangeStart && rangeEnd && s >= en) {
      setError('"Hasta" debe ser mayor que "Desde".')
      return
    }
    setLoading(true)
    setError('')
    const fd = new FormData()
    fd.append('file', file)
    fd.append('title', title.trim())
    if (rangeStart) fd.append('range_start', rangeStart)
    if (rangeEnd) fd.append('range_end', rangeEnd)
    if (blockSize) fd.append('block_size', blockSize)
    const res = await fetch('/api/upload', { method: 'POST', body: fd })
    const json = await res.json()
    if (!res.ok) { setError(json.error); setLoading(false); return }
    close()
    setLoading(false)
    onUploaded()
  }

  const totalRecords = rangeStart && rangeEnd
    ? parseInt(rangeEnd, 10) - parseInt(rangeStart, 10) + 1
    : null

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

          <div>
            <label className="block text-sm font-medium mb-1">
              Rango de registros <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <div className="flex gap-2 items-center">
              <input
                type="number"
                min="0"
                className="flex-1 border rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Desde"
                value={rangeStart}
                onChange={e => handleRangeStartChange(e.target.value)}
              />
              <span className="text-gray-400 font-medium">–</span>
              <input
                type="number"
                min="0"
                className="flex-1 border rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Hasta"
                value={rangeEnd}
                onChange={e => handleRangeEndChange(e.target.value)}
              />
            </div>
          </div>

          {totalRecords != null && totalRecords > 0 && (
            <div>
              <label className="block text-sm font-medium mb-1">
                Registros por persona
              </label>
              <input
                type="number"
                min="1"
                className="w-full border rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={blockSize}
                onChange={e => setBlockSize(e.target.value)}
              />
              <p className="text-xs text-blue-700 bg-blue-50 rounded-lg px-3 py-2 mt-2">
                {totalRecords.toLocaleString()} registros en total · bloques de {blockSize || '?'} por persona
              </p>
            </div>
          )}

          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={close}
              className="flex-1 py-2.5 rounded-lg border text-gray-700 font-medium"
              disabled={loading}
            >
              Cancelar
            </button>
            <button type="submit"
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
