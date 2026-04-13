'use client'

import { useState, useCallback } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import { useRouter } from 'next/navigation'
import type { Application } from '@/lib/supabase/types'
import { APPLICATION_STATUS_LABELS } from '@/lib/supabase/types'
import { updateApplicationStatus } from '@/lib/actions/applications'
import KanbanColumn from './KanbanColumn'
import KanbanCard from './KanbanCard'
import ApplicationDetailModal from './ApplicationDetailModal'

// 申請データに補助金・拠点名を結合した型
export interface ApplicationWithDetails extends Application {
  subsidy_name?: string
  subsidy_max_amount?: number | null
  subsidy_deadline?: string | null
  location_name?: string
}

// カラム定義
const COLUMNS: { id: Application['status']; label: string; icon: string; color: string }[] = [
  { id: 'discovered', label: '発見', icon: '📌', color: 'border-t-gray-400' },
  { id: 'reviewing', label: '検討中', icon: '🔍', color: 'border-t-blue-400' },
  { id: 'applying', label: '申請中', icon: '📤', color: 'border-t-yellow-400' },
  { id: 'reviewing_by_authority', label: '審査中', icon: '⏳', color: 'border-t-orange-400' },
  { id: 'adopted', label: '採択', icon: '✅', color: 'border-t-green-400' },
  { id: 'rejected', label: '不採択', icon: '❌', color: 'border-t-red-400' },
  { id: 'received', label: '入金済', icon: '💰', color: 'border-t-purple-400' },
]

interface KanbanBoardProps {
  applications: ApplicationWithDetails[]
}

export default function KanbanBoard({ applications: initialApps }: KanbanBoardProps) {
  const router = useRouter()
  const [applications, setApplications] = useState(initialApps)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [selectedApp, setSelectedApp] = useState<ApplicationWithDetails | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  // カラムごとの申請をフィルタ
  const getColumnItems = useCallback(
    (status: Application['status']) =>
      applications.filter((app) => app.status === status),
    [applications]
  )

  // ドラッグ中のアイテム
  const activeItem = activeId
    ? applications.find((app) => app.id === activeId)
    : null

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const activeApp = applications.find((app) => app.id === active.id)
    if (!activeApp) return

    // ドロップ先のカラムIDを取得
    const overId = over.id as string
    // over.idがカラムIDの場合
    const newStatus = COLUMNS.find((col) => col.id === overId)?.id
      // over.idがカードIDの場合、そのカードのステータスを使用
      || applications.find((app) => app.id === overId)?.status

    if (!newStatus || newStatus === activeApp.status) return

    // 楽観的更新
    setApplications((prev) =>
      prev.map((app) =>
        app.id === activeApp.id ? { ...app, status: newStatus } : app
      )
    )

    // サーバーに反映
    const result = await updateApplicationStatus(activeApp.id, newStatus)
    if (result.error) {
      // ロールバック
      setApplications((prev) =>
        prev.map((app) =>
          app.id === activeApp.id ? { ...app, status: activeApp.status } : app
        )
      )
    }
  }

  const handleCardClick = (app: ApplicationWithDetails) => {
    setSelectedApp(app)
  }

  const handleUpdate = () => {
    router.refresh()
    // ローカルステートもリフレッシュするためリロード
    window.location.reload()
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4 min-h-[calc(100vh-12rem)]">
          {COLUMNS.map((column) => (
            <KanbanColumn
              key={column.id}
              id={column.id}
              label={column.label}
              icon={column.icon}
              color={column.color}
              items={getColumnItems(column.id)}
              onCardClick={handleCardClick}
            />
          ))}
        </div>

        <DragOverlay>
          {activeItem && (
            <KanbanCard application={activeItem} isDragging />
          )}
        </DragOverlay>
      </DndContext>

      {/* 詳細モーダル */}
      {selectedApp && (
        <ApplicationDetailModal
          application={selectedApp}
          onClose={() => setSelectedApp(null)}
          onUpdate={handleUpdate}
        />
      )}
    </>
  )
}
