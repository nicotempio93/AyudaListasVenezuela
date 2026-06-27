'use client'
import { useState, useRef } from 'react'

const ACCEPTED = '.jpg,.jpeg,.png,.webp,.pdf,.xlsx,.xls,.csv,.doc,.docx'

type AssignmentType = 'records' | 'pages'

interface Props {
  onUploaded: () => void
}

export function UploadForm({ onUploaded }: Props) {
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [assignmentType, setAssignmentType] = useState<AssignmentType>('records')
  const [rangeStart, setRangeStart] = useState('')
  const [rangeEnd, setRangeEnd] = useState('')
  const [totalPages, setTotalPages] = useState('')
  const [blockSize, setBlockSize] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null
    setFile(f)
    if (f && !title) setTitle(f.name.replace(/\.[^.]+$/, ''))
    if (f?.name.toLowerCase().endsWith('.pdf')) setAssignmentType('pages')
  }

  function recalcBlock(total: number) {
    if (total > 0) setBlockSize(String(Math.ceil(total / 10)))
  }

  function handleRangeStartChange(val: string) {
    setRangeStart(val)
    const s = parseInt(val, 10), e = parseInt(rangeEnd, 10)
    if (s >= 0 && e > s) recalcBlock(e - s + 1)
  }

  function handleRangeEndChange(val: string) {
    setRangeEnd(val)
    const s = parseInt(rangeStart, 10), e = parseInt(val, 10)
    if (s >= 0 && e > s) recalcBlock(e - s + 1)
  }

  function handleTotalPagesChange(val: string) {
    setTotalPages(val)
    const n = parseInt(val, 10)
    if (n > 0) recalcBlock(n)
  }

  function handleTypeChange(t: AssignmentType) {
    setAssignmentType(t)
    setRangeStart(''); setRangeEnd(''); setTotalPages(''); setBlockSize('')
  }

  function close() {
    setOpen(false); setFile(null); setTitle('')
    setAssignmentType('records')
    setRangeStart(''); setRangeEnd(''); setTotalPages(''); setBlockSize(''); setError('')
    if (inputRef.current) inputRef.current.value = ''
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file || !title.trim()) { setError('Archivo y título requeridos.'); return }

    if (assignmentType === 'records') {
      const s = parseInt(rangeStart, 10), en = parseInt(rangeEnd, 10)
      if (rangeStart && rangeEnd && s >= en) { setError('"Hasta" debe ser mayor que "Desde".'); return }
    }
    if (assignmentType === 'pages') {
      const n = parseInt(totalPages, 10)
      if (totalPages && n < 1) { setError('El total de páginas debe ser mayor a 0.'); return }
    }

    setLoading(true); setError('')
    const fd = new FormData()
    fd.append('file', file)
    fd.append('title', title.trim())
    fd.append('assignment_type', assignmentType)

    if (assignmentType === 'records') {
      if (rangeStart) fd.append('range_start', rangeStart)
      if (rangeEnd) fd.append('range_end', rangeEnd)
    } else {
      // pages: always starts at 1
      if (totalPages) { fd.append('range_start', '1'); fd.append('range_end', totalPages) }
    }
    if (blockSize) fd.append('block_size', blockSize)

    const res = await fetch('/api/upload', { method: 'POST', body: fd })
    const json = await res.json()
    if (!res.ok) { setError(json.error); setLoading(false); return }
    close(); setLoading(false); onUploaded()
  }

  const totalRecords = assignmentType === 'records' && rangeStart && rangeEnd
    ? parseInt(rangeEnd, 10) - parseInt(rangeStart, 10) + 1
    : assignmentType === 'pages' && totalPages
    ? parseInt(totalPages, 10)
    : null

  const estimatedPeople = totalRecords && blockSize
    ? Math.ceil(totalRecords / parseInt(blockSize, 10))
    : null

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="flex-shrink-0 px-4 py-2 bg-gray-800 text-white rounded-lg text-sm font-medium hover:bg-gray-700">
        + Subir lista
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-3">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
        <div className="overflow-y-auto max-h-[88vh] p-6">
          <h2 className="text-lg font-bold mb-4">Subir nueva lista</h2>
          <form onSubmit={handleSubmit} className="space-y-4">

            <div>
              <label className="block text-sm font-medium mb-1">
                Archivo <span className="text-red-500">*</span>
              </label>
              <input ref={inputRef} type="file" accept={ACCEPTED} onChange={handleFileChange}
                className="w-full text-sm text-gray-700 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border file:border-gray-300 file:text-sm file:font-medium file:bg-white hover:file:bg-gray-50" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Título <span className="text-red-500">*</span>
              </label>
              <input
                className="w-full border rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: Lista Barrio El Paraíso"
                value={title} onChange={e => setTitle(e.target.value)} />
            </div>

            {/* Assignment type toggle */}
            <div>
              <label className="block text-sm font-medium mb-2">Tipo de asignación</label>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { key: 'records', label: '🔢 Registros numerados', desc: 'La lista tiene números de fila' },
                  { key: 'pages',   label: '📄 Páginas de PDF',       desc: 'Asignar por páginas del archivo' },
                ] as { key: AssignmentType; label: string; desc: string }[]).map(opt => (
                  <button key={opt.key} type="button"
                    onClick={() => handleTypeChange(opt.key)}
                    className={`text-left px-3 py-2.5 rounded-xl border-2 transition-colors ${
                      assignmentType === opt.key
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}>
                    <p className="text-sm font-medium">{opt.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Records: desde/hasta */}
            {assignmentType === 'records' && (
              <div>
                <label className="block text-sm font-medium mb-1">
                  Rango de registros <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Desde</label>
                    <input type="number" min="0"
                      className="w-full border rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ej: 1" value={rangeStart} onChange={e => handleRangeStartChange(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Hasta</label>
                    <input type="number" min="0"
                      className="w-full border rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ej: 1000" value={rangeEnd} onChange={e => handleRangeEndChange(e.target.value)} />
                  </div>
                </div>
              </div>
            )}

            {/* Pages: total pages only */}
            {assignmentType === 'pages' && (
              <div>
                <label className="block text-sm font-medium mb-1">
                  Total de páginas <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <input type="number" min="1"
                  className="w-full border rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: 45"
                  value={totalPages} onChange={e => handleTotalPagesChange(e.target.value)} />
              </div>
            )}

            {/* Block size (shown when we have a total) */}
            {totalRecords != null && totalRecords > 0 && (
              <div>
                <label className="block text-sm font-medium mb-1">
                  {assignmentType === 'pages' ? 'Páginas por persona' : 'Registros por persona'}
                </label>
                <input type="number" min="1"
                  className="w-full border rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={blockSize} onChange={e => setBlockSize(e.target.value)} />
                {blockSize && (
                  <p className="text-xs text-blue-700 bg-blue-50 rounded-lg px-3 py-2 mt-2">
                    {totalRecords.toLocaleString()} {assignmentType === 'pages' ? 'páginas' : 'registros'} en total ·{' '}
                    {estimatedPeople} {estimatedPeople === 1 ? 'persona' : 'personas'} de ~{blockSize} c/u
                  </p>
                )}
              </div>
            )}

            {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={close}
                className="flex-1 py-2.5 rounded-lg border text-gray-700 font-medium" disabled={loading}>
                Cancelar
              </button>
              <button type="submit"
                className="flex-1 py-2.5 rounded-lg bg-gray-800 text-white font-semibold disabled:opacity-60" disabled={loading}>
                {loading ? 'Subiendo…' : 'Subir'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
