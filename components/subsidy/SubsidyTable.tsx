'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, ExternalLink } from 'lucide-react'
import { CATEGORY_LABELS, SUBSIDY_STATUS_LABELS } from '@/lib/supabase/types'
import type { Subsidy } from '@/lib/supabase/types'
import SubsidyForm from './SubsidyForm'
import { useRouter } from 'next/navigation'

interface SubsidyTableProps {
  subsidies: Subsidy[]
}

// 金額フォーマット
function formatAmount(amount: number | null): string {
  if (!amount) return '-'
  if (amount >= 10000) return `${(amount / 10000).toLocaleString()}万円`
  return `${amount.toLocaleString()}円`
}

// 締切までの日数を計算
function daysUntilDeadline(deadline: string | null): number | null {
  if (!deadline) return null
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const d = new Date(deadline)
  return Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

// ステータスバッジ
function StatusBadge({ status }: { status: Subsidy['status'] }) {
  const colors: Record<string, string> = {
    open: 'bg-green-100 text-green-700',
    closed: 'bg-gray-100 text-gray-700',
    upcoming: 'bg-blue-100 text-blue-700',
    unknown: 'bg-yellow-100 text-yellow-700',
  }
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${colors[status]}`}>
      {SUBSIDY_STATUS_LABELS[status]}
    </span>
  )
}

export default function SubsidyTable({ subsidies }: SubsidyTableProps) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterArea, setFilterArea] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  // フィルタリング
  const filtered = subsidies.filter((s) => {
    if (filterCategory !== 'all' && s.category !== filterCategory) return false
    if (filterArea !== 'all' && s.target_area !== filterArea) return false
    if (filterStatus !== 'all' && s.status !== filterStatus) return false
    return true
  })

  // ユニークなエリア一覧
  const areas = Array.from(new Set(subsidies.map(s => s.target_area).filter(Boolean)))

  return (
    <div className="space-y-4">
      {/* ヘッダー: フィルターと追加ボタン */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1E3A8A] outline-none"
          >
            <option value="all">全カテゴリ</option>
            <option value="subsidy">補助金</option>
            <option value="grant">助成金</option>
            <option value="loan">融資</option>
          </select>

          <select
            value={filterArea}
            onChange={(e) => setFilterArea(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1E3A8A] outline-none"
          >
            <option value="all">全エリア</option>
            {areas.map((area) => (
              <option key={area} value={area!}>{area}</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1E3A8A] outline-none"
          >
            <option value="all">全ステータス</option>
            <option value="open">公募中</option>
            <option value="upcoming">公募予定</option>
            <option value="closed">締切済</option>
          </select>
        </div>

        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1E3A8A] text-white text-sm font-medium rounded-lg hover:bg-[#1E3A8A]/90 transition-colors"
        >
          <Plus size={16} />
          補助金を追加
        </button>
      </div>

      {/* テーブル */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-medium text-gray-600">補助金名</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">カテゴリ</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">発行機関</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">上限額</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">締切</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">ステータス</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-500">
                    該当する補助金がありません
                  </td>
                </tr>
              ) : (
                filtered.map((subsidy) => {
                  const days = daysUntilDeadline(subsidy.application_deadline)
                  const isUrgent = days !== null && days >= 0 && days <= 30
                  return (
                    <tr
                      key={subsidy.id}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => router.push(`/subsidies/${subsidy.id}`)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{subsidy.name}</span>
                          {subsidy.source_url && (
                            <a
                              href={subsidy.source_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-gray-400 hover:text-[#1E3A8A]"
                            >
                              <ExternalLink size={14} />
                            </a>
                          )}
                        </div>
                        {subsidy.round_number && (
                          <span className="text-xs text-gray-400">第{subsidy.round_number}回</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {CATEGORY_LABELS[subsidy.category]}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{subsidy.authority}</td>
                      <td className="px-4 py-3 text-right text-gray-900 font-medium">
                        {formatAmount(subsidy.max_amount)}
                      </td>
                      <td className="px-4 py-3">
                        {subsidy.application_deadline ? (
                          <div>
                            <span className={isUrgent ? 'text-red-600 font-medium' : 'text-gray-600'}>
                              {subsidy.application_deadline}
                            </span>
                            {days !== null && days >= 0 && (
                              <span className={`block text-xs ${isUrgent ? 'text-red-500' : 'text-gray-400'}`}>
                                あと{days}日
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <StatusBadge status={subsidy.status} />
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 登録モーダル */}
      {showForm && (
        <SubsidyForm
          onClose={() => setShowForm(false)}
          onSuccess={() => router.refresh()}
        />
      )}
    </div>
  )
}
