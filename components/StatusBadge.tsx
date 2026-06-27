import { ListStatus } from '@/lib/types'

const config: Record<ListStatus, { label: string; className: string }> = {
  available: { label: 'Disponible', className: 'bg-green-100 text-green-800' },
  claimed:   { label: 'En carga',   className: 'bg-yellow-100 text-yellow-800' },
  completed: { label: 'Completada', className: 'bg-gray-100 text-gray-600' },
}

export function StatusBadge({ status }: { status: ListStatus }) {
  const { label, className } = config[status]
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${className}`}>
      {label}
    </span>
  )
}
