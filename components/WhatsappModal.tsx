'use client'
import { useState } from 'react'

interface Props {
  current: string | null
  onConfirm: (link: string) => Promise<void>
  onClose: () => void
}

export function WhatsappModal({ current, onConfirm, onClose }: Props) {
  const [link, setLink] = useState(current ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await onConfirm(link.trim())
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar.')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
        <h2 className="text-lg font-bold mb-1">Grupo de WhatsApp</h2>
        <p className="text-sm text-gray-500 mb-4">Pegá el link de invitación al grupo</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            className="w-full border rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="https://chat.whatsapp.com/..."
            value={link}
            onChange={e => setLink(e.target.value)}
            autoFocus
          />
          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          <div className="flex gap-3">
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
              className="flex-1 py-2.5 rounded-lg bg-green-600 text-white font-semibold disabled:opacity-60"
              disabled={loading}
            >
              {loading ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
