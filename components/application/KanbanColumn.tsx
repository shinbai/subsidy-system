'use client'

import { useDroppable } from '@dnd-kit/core'
import type { Application } from '@/lib/supabase/types'
import type { ApplicationWithDetails } from './KanbanBoard'
import KanbanCard from './KanbanCard'

interface KanbanColumnProps {
  id: Application['status']
  label: string
  icon: string
  color: string
  items: ApplicationWithDetails[]
  onCardClick: (app: ApplicationWithDetails) => void
}

export default function KanbanColumn({
  id,
  label,
  icon,
  color,
  items,
  onCardClick,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div
      ref={setNodeRef}
      className={`
        flex-shrink-0 w-64 flex flex-col rounded-xl border-t-4 ${color}
        bg-white border border-gray-200
        ${isOver ? 'ring-2 ring-[#1E3A8A] ring-offset-2' : ''}
        transition-shadow
      `}
    >
      {/* カラムヘッダー */}
      <div className="px-3 py-3 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-700">
            {icon} {label}
          </span>
          <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-gray-500 bg-gray-100 rounded-full">
            {items.length}
          </span>
        </div>
      </div>

      {/* カード一覧 */}
      <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-16rem)]">
        {items.length === 0 ? (
          <div className="text-center py-8 text-xs text-gray-400">
            カードなし
          </div>
        ) : (
          items.map((app) => (
            <KanbanCard
              key={app.id}
              application={app}
              onClick={() => onCardClick(app)}
            />
          ))
        )}
      </div>
    </div>
  )
}
