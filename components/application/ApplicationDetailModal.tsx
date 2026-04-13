'use client'

import { useState } from 'react'
import { X, Calendar, User, Coins, FileText } from 'lucide-react'
import { APPLICATION_STATUS_LABELS } from '@/lib/supabase/types'
import type { Application } from '@/lib/supabase/types'
import { updateApplication } from '@/lib/actions/applications'
import KnowledgeForm from './KnowledgeForm'

interface ApplicationDetailModalProps {
  application: Application & { subsidy_name?: string; location_name?: string }
  onClose: () => void
  onUpdate: () => void
}

const STATUS_OPTIONS: Application['status'][] = [
  'discovered', 'reviewing', 'applying', 'reviewing_by_authority',
  'adopted', 'rejected', 'received',
]

// 金額フォーマットヘルパー
function formatAmountInput(val: number | null): string {
  return val ? String(val) : ''
}

export default function ApplicationDetailModal({
  application,
  onClose,
  onUpdate,
}: ApplicationDetailModalProps) {
  const [loading, setLoading] = useState(false)
  const [showKnowledge, setShowKnowledge] = useState(false)
  const [knowledgeResult, setKnowledgeResult] = useState<'adopted' | 'rejected'>('adopted')

  const [form, setForm] = useState({
    status: application.status,
    assigned_to: application.assigned_to || '',
    application_amount: formatAmountInput(application.application_amount),
    adopted_amount: formatAmountInput(application.adopted_amount),
    received_amount: formatAmountInput(application.received_amount),
    applied_date: application.applied_date || '',
    result_date: application.result_date || '',
    received_date: application.received_date || '',
    rejection_reason: application.rejection_reason || '',
    notes: application.notes || '',
  })

  const handleStatusChange = (newStatus: Application['status']) => {
    setForm({ ...form, status: newStatus })

    // 採択・不採択に変更時はナレッジ記録フォームをトリガー
    if (newStatus === 'adopted' || newStatus === 'rejected') {
      setKnowledgeResult(newStatus)
    }
  }

  const handleSave = async () => {
    setLoading(true)

    const prevStatus = application.status
    const newStatus = form.status

    const result = await updateApplication(application.id, {
      status: form.status,
      assigned_to: form.assigned_to || null,
      application_amount: form.application_amount ? Number(form.application_amount) : null,
      adopted_amount: form.adopted_amount ? Number(form.adopted_amount) : null,
      received_amount: form.received_amount ? Number(form.received_amount) : null,
      applied_date: form.applied_date || null,
      result_date: form.result_date || null,
      received_date: form.received_date || null,
      rejection_reason: form.rejection_reason || null,
      notes: form.notes || null,
    })

    setLoading(false)

    if (result.success) {
      // 採択・不採択にステータスが変わった場合、ナレッジ記録フォームを表示
      if (
        (newStatus === 'adopted' || newStatus === 'rejected') &&
        prevStatus !== newStatus
      ) {
        setShowKnowledge(true)
      } else {
        onUpdate()
        onClose()
      }
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto p-4">
        <div className="bg-white rounded-xl w-full max-w-lg my-8 shadow-xl">
          {/* ヘッダー */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {application.subsidy_name || '申請詳細'}
              </h3>
              {application.location_name && (
                <p className="text-xs text-gray-500 mt-0.5">{application.location_name}</p>
              )}
            </div>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
              <X size={20} className="text-gray-500" />
            </button>
          </div>

          {/* フォーム */}
          <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            {/* ステータス */}
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1">
                <FileText size={14} /> ステータス
              </label>
              <select
                value={form.status}
                onChange={(e) => handleStatusChange(e.target.value as Application['status'])}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1E3A8A] outline-none"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{APPLICATION_STATUS_LABELS[s]}</option>
                ))}
              </select>
            </div>

            {/* 担当者 */}
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1">
                <User size={14} /> 担当者
              </label>
              <input
                type="text"
                value={form.assigned_to}
                onChange={(e) => setForm({ ...form, assigned_to: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1E3A8A] outline-none"
                placeholder="担当者名"
              />
            </div>

            {/* 金額入力 */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1">
                  <Coins size={14} /> 申請金額
                </label>
                <input
                  type="number"
                  value={form.application_amount}
                  onChange={(e) => setForm({ ...form, application_amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1E3A8A] outline-none"
                  placeholder="円"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">採択金額</label>
                <input
                  type="number"
                  value={form.adopted_amount}
                  onChange={(e) => setForm({ ...form, adopted_amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1E3A8A] outline-none"
                  placeholder="円"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">入金金額</label>
                <input
                  type="number"
                  value={form.received_amount}
                  onChange={(e) => setForm({ ...form, received_amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1E3A8A] outline-none"
                  placeholder="円"
                />
              </div>
            </div>

            {/* 日付 */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1">
                  <Calendar size={14} /> 申請日
                </label>
                <input
                  type="date"
                  value={form.applied_date}
                  onChange={(e) => setForm({ ...form, applied_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1E3A8A] outline-none"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">結果日</label>
                <input
                  type="date"
                  value={form.result_date}
                  onChange={(e) => setForm({ ...form, result_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1E3A8A] outline-none"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">入金日</label>
                <input
                  type="date"
                  value={form.received_date}
                  onChange={(e) => setForm({ ...form, received_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1E3A8A] outline-none"
                />
              </div>
            </div>

            {/* 不採択理由（不採択時のみ表示） */}
            {form.status === 'rejected' && (
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">不採択の理由</label>
                <textarea
                  rows={2}
                  value={form.rejection_reason}
                  onChange={(e) => setForm({ ...form, rejection_reason: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1E3A8A] outline-none resize-none"
                  placeholder="不採択の理由を記録"
                />
              </div>
            )}

            {/* メモ */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">メモ</label>
              <textarea
                rows={3}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1E3A8A] outline-none resize-none"
                placeholder="コメントやメモ"
              />
            </div>
          </div>

          {/* フッター */}
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              キャンセル
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-4 py-2 text-sm text-white bg-[#1E3A8A] rounded-lg hover:bg-[#1E3A8A]/90 disabled:opacity-50"
            >
              {loading ? '保存中...' : '保存する'}
            </button>
          </div>
        </div>
      </div>

      {/* ナレッジ記録フォーム */}
      {showKnowledge && (
        <KnowledgeForm
          applicationId={application.id}
          subsidyId={application.subsidy_id}
          result={knowledgeResult}
          onClose={() => {
            setShowKnowledge(false)
            onUpdate()
            onClose()
          }}
          onSuccess={onUpdate}
        />
      )}
    </>
  )
}
