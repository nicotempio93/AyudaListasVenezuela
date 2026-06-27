'use client'
import { useState } from 'react'

interface Props {
  listTitle: string
  onConfirm: (name: string, contact: string) => Promise<void>
  onClose: () => void
}

export function ClaimModal({ listTitle, onConfirm, onClose }: Props) {
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('El nombre es requerido.'); return }
    setLoading(true)
    setError('')
    try {
      await onConfirm(name.trim(), contact.trim())
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al tomar lista.')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
        <h2 className="text-lg font-bold mb-1">Tomar lista</h2>
        <p className="text-sm text-gray-500 mb-4 truncate">{listTitle}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Nombre / Equipo <span className="text-red-500">*</span>
            </label>
            <input
              className="w-full border rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: María García / Equipo A"
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              WhatsApp / Contacto <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <input
              className="w-full border rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: +58 412 555 0000"
              value={contact}
              onChange={e => setContact(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border text-gray-700 font-medium"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-lg bg-blue-600 text-white font-semibold disabled:opacity-60"
              disabled={loading}
            >
              {loading ? 'Tomando…' : 'Tomar lista'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
