'use client'
import { useEffect, useState, useCallback } from 'react'
import { ListRow, ListStatus } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { ListCard } from '@/components/ListCard'
import { UploadForm } from '@/components/UploadForm'

type Tab = 'all' | ListStatus

const TABS: { key: Tab; label: string }[] = [
  { key: 'all',       label: 'Todas' },
  { key: 'available', label: 'Disponibles' },
  { key: 'claimed',   label: 'En carga' },
  { key: 'completed', label: 'Completadas' },
]

const ORDER: Record<ListStatus, number> = { available: 0, claimed: 1, completed: 2 }

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? 'venezuela2024'

export default function AdminPage() {
  const [unlocked, setUnlocked] = useState(false)
  const [input, setInput] = useState('')
  const [error, setError] = useState(false)

  const [lists, setLists] = useState<ListRow[]>([])
  const [tab, setTab] = useState<Tab>('all')
  const [loading, setLoading] = useState(true)

  const fetchLists = useCallback(async () => {
    const res = await fetch('/api/lists')
    const data = await res.json()
    setLists(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!unlocked) return
    fetchLists()
    const supabase = createClient()
    const channel = supabase
      .channel('admin-lists-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lists' }, () => fetchLists())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'participants' }, () => fetchLists())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [unlocked, fetchLists])

  function handleUnlock(e: React.FormEvent) {
    e.preventDefault()
    if (input === ADMIN_PASSWORD) {
      setUnlocked(true)
      setError(false)
    } else {
      setError(true)
    }
  }

  if (!unlocked) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <form onSubmit={handleUnlock} className="bg-white rounded-2xl shadow p-8 w-full max-w-xs flex flex-col gap-4">
          <h1 className="text-lg font-bold text-gray-900 text-center">🇻🇪 Acceso admin</h1>
          <input
            autoFocus
            type="password"
            placeholder="Contraseña"
            value={input}
            onChange={e => { setInput(e.target.value); setError(false) }}
            className="border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
          {error && <p className="text-red-500 text-xs text-center">Contraseña incorrecta</p>}
          <button
            type="submit"
            className="bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700"
          >
            Entrar
          </button>
        </form>
      </div>
    )
  }

  const filtered = lists.filter(l => tab === 'all' || l.status === tab)
  const sorted = [...filtered].sort(
    (a, b) =>
      ORDER[a.status] - ORDER[b.status] ||
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  const counts = {
    all:       lists.length,
    available: lists.filter(l => l.status === 'available').length,
    claimed:   lists.filter(l => l.status === 'claimed').length,
    completed: lists.filter(l => l.status === 'completed').length,
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-gray-900 leading-tight">
              🇻🇪 Coordinador de listas ❤️
            </h1>
            <p className="text-xs text-gray-500">{counts.all} listas en total</p>
          </div>
          <UploadForm onUploaded={fetchLists} />
        </div>
      </header>

      <div className="bg-white border-b">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto py-2" style={{ scrollbarWidth: 'none' }}>
            {TABS.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  tab === t.key ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {t.label}
                <span className={`ml-1.5 text-xs ${tab === t.key ? 'text-blue-200' : 'text-gray-400'}`}>
                  {counts[t.key]}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 py-4 space-y-3">
        {loading ? (
          <div className="text-center py-16 text-gray-400">Cargando…</div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            {tab === 'all' ? 'No hay listas todavía.' : 'No hay listas en esta categoría.'}
          </div>
        ) : (
          sorted.map(list => (
            <ListCard key={list.id} list={list} onRefresh={fetchLists} isAdmin={true} />
          ))
        )}
      </main>
    </div>
  )
}
