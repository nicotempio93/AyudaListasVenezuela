'use client'
import { useState } from 'react'

interface Props {
  listTitle: string
  onConfirm: () => Promise<void>
  onClose: () => void
}

export function CompleteModal({ listTitle, onConfirm, onClose }: Props) {
  const [confirmed, setConfirmed] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleConfirm() {
    setLoading(true)
    await onConfirm()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
        <h2 className="text-lg font-bold mb-1">Marcar como completada</h2>
        <p className="text-sm text-gray-500 mb-4 truncate">{listTitle}</p>

        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-5">
          <p className="text-sm text-yellow-800 font-medium mb-1">¡Atención!</p>
          <p className="text-sm text-yellow-700">
            Solo marcá como completada si todos los datos de esta lista fueron cargados correctamente en el sistema.
          </p>
        </div>

        <label className="flex items-start gap-3 cursor-pointer mb-6">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={e => setConfirmed(e.target.checked)}
            className="mt-0.5 w-5 h-5 rounded accent-green-600 flex-shrink-0"
          />
          <span className="text-sm text-gray-700">
            Confirmo que esta lista fue cargada completamente y correctamente.
          </span>
        </label>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border text-gray-700 font-medium"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 py-2.5 rounded-lg bg-green-600 text-white font-semibold disabled:opacity-40"
            disabled={!confirmed || loading}
          >
            {loading ? 'Completando…' : 'Completar'}
          </button>
        </div>
      </div>
    </div>
  )
}
