'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { createKnowledge } from '@/lib/actions/applications'

interface KnowledgeFormProps {
  applicationId: string
  subsidyId: string | null
  result: 'adopted' | 'rejected'
  onClose: () => void
  onSuccess?: () => void
}

export default function KnowledgeForm({
  applicationId,
  subsidyId,
  result,
  onClose,
  onSuccess,
}: KnowledgeFormProps) {
  const [loading, setLoading] = useState(false)
  const [keyPoints, setKeyPoints] = useState('')
  const [feedback, setFeedback] = useState('')
  const [lessons, setLessons] = useState('')
  const [effectivePhrases, setEffectivePhrases] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const res = await createKnowledge({
      application_id: applicationId,
      subsidy_id: subsidyId,
      result,
      key_points: keyPoints,
      feedback_from_authority: feedback,
      lessons_learned: lessons,
      effective_phrases: effectivePhrases,
    })

    if (res.success) {
      onSuccess?.()
      onClose()
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-lg shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {result === 'adopted' ? '採択' : '不採択'}のナレッジを記録
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {result === 'adopted' ? '採択' : '不採択'}のポイント
            </label>
            <textarea
              rows={3}
              value={keyPoints}
              onChange={(e) => setKeyPoints(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1E3A8A] focus:border-[#1E3A8A] outline-none resize-none"
              placeholder={result === 'adopted' ? '採択された理由やポイント' : '不採択の主な理由'}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              審査機関からのフィードバック
            </label>
            <textarea
              rows={2}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1E3A8A] focus:border-[#1E3A8A] outline-none resize-none"
              placeholder="審査機関からのコメントや指摘"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              次回への教訓
            </label>
            <textarea
              rows={2}
              value={lessons}
              onChange={(e) => setLessons(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1E3A8A] focus:border-[#1E3A8A] outline-none resize-none"
              placeholder="次回の申請に活かせる教訓"
            />
          </div>

          {result === 'adopted' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                効果的だった表現・フレーズ
              </label>
              <textarea
                rows={2}
                value={effectivePhrases}
                onChange={(e) => setEffectivePhrases(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1E3A8A] focus:border-[#1E3A8A] outline-none resize-none"
                placeholder="採択に効果的だったと思われる表現"
              />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              スキップ
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm text-white bg-[#1E3A8A] rounded-lg hover:bg-[#1E3A8A]/90 disabled:opacity-50"
            >
              {loading ? '保存中...' : '記録する'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
