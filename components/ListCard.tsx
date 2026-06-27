'use client'
import { useState } from 'react'
import { ListRow } from '@/lib/types'
import { StatusBadge } from './StatusBadge'
import { JoinModal } from './JoinModal'
import { CompleteModal } from './CompleteModal'
import { WhatsappModal } from './WhatsappModal'

const FILE_ICONS: Record<string, string> = {
  pdf: '📄', xlsx: '📊', xls: '📊', csv: '📊',
  png: '🖼️', jpg: '🖼️', jpeg: '🖼️', webp: '🖼️',
  doc: '📝', docx: '📝',
}

function fileIcon(type: string | null) {
  return FILE_ICONS[type ?? ''] ?? '📎'
}

function fmtDate(iso: string | null) {
  if (!iso) return null
  return new Date(iso).toLocaleString('es-VE', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  })
}

interface Props {
  list: ListRow
  onRefresh: () => void
}

export function ListCard({ list, onRefresh }: Props) {
  const [showJoin, setShowJoin] = useState(false)
  const [showComplete, setShowComplete] = useState(false)
  const [showWhatsapp, setShowWhatsapp] = useState(false)
  const [leaveParticipant, setLeaveParticipant] = useState<{ id: string; name: string } | null>(null)
  const [completeParticipant, setCompleteParticipant] = useState<{ id: string; name: string } | null>(null)
  const [actionError, setActionError] = useState('')

  const participants = list.participants ?? []
  const isFull = participants.length >= 10
  const isCompleted = list.status === 'completed'
  const lastRangeTo = participants.reduce((max, p) => Math.max(max, p.range_to ?? -Infinity), -Infinity)
  const allRecordsAssigned = list.range_end != null && isFinite(lastRangeTo) && lastRangeTo >= list.range_end

  const totalRecords = list.range_start != null && list.range_end != null
    ? list.range_end - list.range_start + 1
    : null
  const coveredRecords = totalRecords != null
    ? participants.reduce((sum, p) => {
        if (p.range_from != null && p.range_to != null) return sum + (p.range_to - p.range_from + 1)
        return sum
      }, 0)
    : null
  const coveragePct = totalRecords && coveredRecords != null
    ? Math.min(100, Math.round((coveredRecords / totalRecords) * 100))
    : null

  async function handleJoin(name: string, contact: string, whatsapp: string) {
    const res = await fetch(`/api/lists/${list.id}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, contact: contact || null, whatsapp_group: whatsapp || null }),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error)
    setShowJoin(false)
    onRefresh()
  }

  async function handleLeave(pid: string) {
    setActionError('')
    const res = await fetch(`/api/lists/${list.id}/leave/${pid}`, { method: 'DELETE' })
    const json = await res.json()
    if (!res.ok) { setActionError(json.error); return }
    onRefresh()
  }

  async function handleParticipantComplete(pid: string) {
    await fetch(`/api/lists/${list.id}/participants/${pid}/complete`, { method: 'POST' })
    setCompleteParticipant(null)
    onRefresh()
  }

  async function handleParticipantUncomplete(pid: string) {
    await fetch(`/api/lists/${list.id}/participants/${pid}/complete`, { method: 'DELETE' })
    onRefresh()
  }

  async function handleComplete() {
    const res = await fetch(`/api/lists/${list.id}/complete`, { method: 'POST' })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error)
    setShowComplete(false)
    onRefresh()
  }

  async function handleUncomplete() {
    setActionError('')
    const res = await fetch(`/api/lists/${list.id}/complete`, { method: 'DELETE' })
    const json = await res.json()
    if (!res.ok) { setActionError(json.error); return }
    onRefresh()
  }

  async function handleWhatsapp(link: string) {
    const res = await fetch(`/api/lists/${list.id}/whatsapp`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ whatsapp_group: link || null }),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error)
    setShowWhatsapp(false)
    onRefresh()
  }

  return (
    <>
      <div className={`bg-white rounded-xl border p-4 space-y-3 ${isCompleted ? 'opacity-60' : ''}`}>
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xl flex-shrink-0">{fileIcon(list.file_type)}</span>
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 truncate">{list.title}</p>
              {list.file_type && <p className="text-xs text-gray-400 uppercase">{list.file_type}</p>}
            </div>
          </div>
          <StatusBadge status={list.status} />
        </div>

        {/* Coverage bar */}
        {list.range_start != null && list.range_end != null && (
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-gray-500">
                {coveredRecords?.toLocaleString() ?? 0} / {totalRecords?.toLocaleString()} {list.assignment_type === 'pages' ? 'páginas cubiertas' : 'registros cubiertos'}
                <span className="text-gray-400"> ({list.range_start.toLocaleString()}–{list.range_end.toLocaleString()})</span>
              </span>
              <span className="text-xs font-semibold text-gray-600">{coveragePct ?? 0}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all"
                style={{ width: `${coveragePct ?? 0}%` }}
              />
            </div>
            {list.block_size && (
              <p className="text-xs text-gray-400 mt-1">
                {list.block_size.toLocaleString()} {list.assignment_type === 'pages' ? 'páginas' : 'registros'} por persona
              </p>
            )}
          </div>
        )}

        {/* Participants */}
        {participants.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Participantes ({participants.length}/10)
            </p>
            {participants.map(p => {
              const done = !!p.completed_at
              return (
                <div
                  key={p.id}
                  className={`rounded-lg px-3 py-2 border ${done ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-transparent'}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        {done && <span className="text-green-600 text-sm">✓</span>}
                        <p className={`text-sm font-medium truncate ${done ? 'text-green-800' : 'text-gray-800'}`}>
                          {p.name}
                        </p>
                      </div>
                      {p.range_from != null && p.range_to != null && (
                        <p className={`text-xs font-semibold ${done ? 'text-green-600' : 'text-blue-600'}`}>
                          {list.assignment_type === 'pages' ? 'Páginas' : 'Registros'} {p.range_from.toLocaleString()} – {p.range_to.toLocaleString()}
                          {done && ' · Completado'}
                        </p>
                      )}
                      {p.contact && <p className="text-xs text-gray-500 truncate">{p.contact}</p>}
                      {done && p.completed_at && (
                        <p className="text-xs text-green-600">{fmtDate(p.completed_at)}</p>
                      )}
                    </div>

                    {!isCompleted && (
                      <div className="flex flex-col gap-1 flex-shrink-0">
                        {!done ? (
                          <button
                            onClick={() => setCompleteParticipant({ id: p.id, name: p.name })}
                            className="text-xs text-green-700 hover:text-green-900 px-2 py-1 rounded hover:bg-green-100 whitespace-nowrap"
                          >
                            Terminé
                          </button>
                        ) : (
                          <button
                            onClick={() => handleParticipantUncomplete(p.id)}
                            className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded hover:bg-gray-100 whitespace-nowrap"
                          >
                            Deshacer
                          </button>
                        )}
                        <button
                          onClick={() => setLeaveParticipant({ id: p.id, name: p.name })}
                          className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 whitespace-nowrap"
                        >
                          Salir
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* WhatsApp group */}
        <div className="flex items-center gap-2">
          {list.whatsapp_group ? (
            <>
              <a href={list.whatsapp_group} target="_blank" rel="noopener noreferrer"
                className="text-sm text-green-700 font-medium hover:underline truncate">
                📱 Grupo de WhatsApp
              </a>
              <button onClick={() => setShowWhatsapp(true)}
                className="text-xs text-gray-400 hover:text-gray-600 flex-shrink-0">
                Editar
              </button>
            </>
          ) : (
            <button onClick={() => setShowWhatsapp(true)}
              className="text-sm text-gray-400 hover:text-green-700">
              + Agregar grupo de WhatsApp
            </button>
          )}
        </div>

        {list.completed_at && (
          <p className="text-xs text-gray-400">Completada: {fmtDate(list.completed_at)}</p>
        )}
        {list.notes && <p className="text-xs text-gray-500 italic">{list.notes}</p>}
        {actionError && (
          <p className="text-xs text-red-600 bg-red-50 rounded px-2 py-1">{actionError}</p>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-1">
          {list.file_url && (
            <a href={list.file_url} target="_blank" rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Abrir archivo
            </a>
          )}
          {!isCompleted && !isFull && !allRecordsAssigned && (
            <button onClick={() => setShowJoin(true)}
              className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-semibold">
              Unirse
            </button>
          )}
          {!isCompleted && (isFull || allRecordsAssigned) && (
            <span className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-500 text-sm">
              {allRecordsAssigned ? 'Todos los registros asignados' : 'Lista llena (10/10)'}
            </span>
          )}
          {list.status === 'claimed' && (
            <button onClick={() => setShowComplete(true)}
              className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-sm font-semibold">
              Completar lista
            </button>
          )}
          {isCompleted && (
            <button onClick={handleUncomplete}
              className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50">
              Reabrir
            </button>
          )}
        </div>
      </div>

      {showJoin && (
        <JoinModal listId={list.id} listTitle={list.title} assignmentType={list.assignment_type}
          currentWhatsapp={list.whatsapp_group} onConfirm={handleJoin} onClose={() => setShowJoin(false)} />
      )}
      {showComplete && (
        <CompleteModal listTitle={list.title} onConfirm={handleComplete} onClose={() => setShowComplete(false)} />
      )}
      {showWhatsapp && (
        <WhatsappModal current={list.whatsapp_group} onConfirm={handleWhatsapp} onClose={() => setShowWhatsapp(false)} />
      )}

      {/* Confirm leave */}
      {leaveParticipant && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <h2 className="text-lg font-bold mb-1">Salir de la lista</h2>
            <p className="text-sm text-gray-600 mb-6">
              ¿Confirmás que <span className="font-semibold">{leaveParticipant.name}</span> quiere salir de esta lista?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setLeaveParticipant(null)}
                className="flex-1 py-2.5 rounded-lg border text-gray-700 font-medium">
                Cancelar
              </button>
              <button onClick={() => { handleLeave(leaveParticipant.id); setLeaveParticipant(null) }}
                className="flex-1 py-2.5 rounded-lg bg-red-600 text-white font-semibold">
                Salir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm participant complete */}
      {completeParticipant && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl text-center">
            <p className="text-4xl mb-3">✅</p>
            <h2 className="text-lg font-bold mb-2">
              {completeParticipant.name}, ¿terminaste con tus asignados?
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              Tu bloque quedará marcado como completado.
            </p>
            <div className="flex gap-3 mb-4">
              <button onClick={() => setCompleteParticipant(null)}
                className="flex-1 py-2.5 rounded-lg border text-gray-700 font-medium text-lg">
                No
              </button>
              <button onClick={() => handleParticipantComplete(completeParticipant.id)}
                className="flex-1 py-2.5 rounded-lg bg-green-600 text-white font-semibold text-lg">
                Sí
              </button>
            </div>
            <p className="text-sm text-gray-500">Gracias por ayudar a Venezuela 🇻🇪❤️</p>
          </div>
        </div>
      )}
    </>
  )
}
