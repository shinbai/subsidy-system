'use client'

import { useDraggable } from '@dnd-kit/core'
import { Calendar, User, Coins } from 'lucide-react'
import type { ApplicationWithDetails } from './KanbanBoard'

interface KanbanCardProps {
  application: ApplicationWithDetails
  isDragging?: boolean
  onClick?: () => void
}

// 金額フォーマット
function formatAmount(amount: number | null | undefined): string {
  if (!amount) return ''
  if (amount >= 10000) return `${(amount / 10000).toLocaleString()}万円`
  return `${amount.toLocaleString()}円`
}

export default function KanbanCard({ application, isDragging, onClick }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: application.id,
  })

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined

  // 表示する金額（申請金額 > 上限額 の優先順）
  const displayAmount = application.application_amount || application.subsidy_max_amount

  // 締切までの日数
  const deadlineDays = application.subsidy_deadline
    ? Math.ceil(
        (new Date(application.subsidy_deadline).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24)
      )
    : null

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={onClick}
      className={`
        bg-white rounded-lg border border-gray-200 p-3 cursor-grab active:cursor-grabbing
        hover:border-[#1E3A8A]/30 hover:shadow-sm transition-all
        ${isDragging ? 'opacity-80 shadow-lg rotate-2 scale-105' : ''}
      `}
    >
      {/* 補助金名 */}
      <h4 className="text-sm font-medium text-gray-900 leading-snug mb-2">
        {application.subsidy_name || '（補助金名なし）'}
      </h4>

      {/* 拠点 */}
      {application.location_name && (
        <p className="text-xs text-gray-500 mb-2">{application.location_name}</p>
      )}

      {/* メタ情報 */}
      <div className="space-y-1">
        {/* 金額 */}
        {displayAmount && (
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <Coins size={12} className="text-gray-400" />
            <span>{formatAmount(displayAmount)}</span>
            {!application.application_amount && application.subsidy_max_amount && (
              <span className="text-gray-400">（上限）</span>
            )}
          </div>
        )}

        {/* 締切 */}
        {application.subsidy_deadline && (
          <div className="flex items-center gap-1.5 text-xs">
            <Calendar size={12} className="text-gray-400" />
            <span className={
              deadlineDays !== null && deadlineDays <= 7
                ? 'text-red-600 font-medium'
                : deadlineDays !== null && deadlineDays <= 30
                ? 'text-orange-600'
                : 'text-gray-600'
            }>
              {application.subsidy_deadline}
              {deadlineDays !== null && deadlineDays >= 0 && (
                <span className="ml-1">（あと{deadlineDays}日）</span>
              )}
            </span>
          </div>
        )}

        {/* 担当者 */}
        {application.assigned_to && (
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <User size={12} className="text-gray-400" />
            <span>{application.assigned_to}</span>
          </div>
        )}
      </div>

      {/* 最終更新 */}
      <div className="mt-2 pt-2 border-t border-gray-50 text-[10px] text-gray-400">
        更新: {new Date(application.updated_at).toLocaleDateString('ja-JP')}
      </div>
    </div>
  )
}
