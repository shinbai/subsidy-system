'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { createSubsidy, updateSubsidy, type SubsidyFormData } from '@/lib/actions/subsidies'
import type { Subsidy } from '@/lib/supabase/types'

// 目的の選択肢
const PURPOSE_OPTIONS = [
  '開業', '設備投資', '広告宣伝', '雇用', 'IT導入',
  '販路開拓', '事業継続', 'BCP対策', '研究開発', 'その他',
]

// 対象エリアの選択肢
const AREA_OPTIONS = ['全国', '東京都', '渋谷区', '武蔵野市', 'その他']

// 対象規模の選択肢
const SIZE_OPTIONS = ['小規模事業者', '中小企業', '全規模']

interface SubsidyFormProps {
  subsidy?: Subsidy | null // 編集時は既存データを渡す
  onClose: () => void
  onSuccess?: () => void
}

export default function SubsidyForm({ subsidy, onClose, onSuccess }: SubsidyFormProps) {
  const isEditing = !!subsidy
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // フォーム状態
  const [form, setForm] = useState<SubsidyFormData>({
    name: subsidy?.name || '',
    official_name: subsidy?.official_name || '',
    category: subsidy?.category || 'subsidy',
    authority: subsidy?.authority || '',
    authority_url: subsidy?.authority_url || '',
    target_area: subsidy?.target_area || '全国',
    target_industry: subsidy?.target_industry || [],
    target_size: subsidy?.target_size || [],
    purpose: subsidy?.purpose || [],
    max_amount: subsidy?.max_amount || null,
    subsidy_rate: subsidy?.subsidy_rate || null,
    application_start: subsidy?.application_start || '',
    application_deadline: subsidy?.application_deadline || '',
    announcement_date: subsidy?.announcement_date || '',
    round_number: subsidy?.round_number || null,
    status: subsidy?.status || 'open',
    requirements: subsidy?.requirements || '',
    notes: subsidy?.notes || '',
    source_url: subsidy?.source_url || '',
  })

  // 目的チェックボックスのトグル
  const togglePurpose = (purpose: string) => {
    setForm(prev => ({
      ...prev,
      purpose: prev.purpose?.includes(purpose)
        ? prev.purpose.filter(p => p !== purpose)
        : [...(prev.purpose || []), purpose],
    }))
  }

  // 対象規模チェックボックスのトグル
  const toggleSize = (size: string) => {
    setForm(prev => ({
      ...prev,
      target_size: prev.target_size?.includes(size)
        ? prev.target_size.filter(s => s !== size)
        : [...(prev.target_size || []), size],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const result = isEditing
        ? await updateSubsidy(subsidy!.id, form)
        : await createSubsidy(form)

      if ('error' in result && result.error) {
        setError(result.error)
        return
      }

      onSuccess?.()
      onClose()
    } catch {
      setError('保存に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl my-8 shadow-xl">
        {/* ヘッダー */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEditing ? '補助金を編集' : '補助金を追加'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* フォーム */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* 補助金名（必須） */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              補助金名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1E3A8A] focus:border-[#1E3A8A] outline-none"
              placeholder="例: 小規模事業者持続化補助金"
            />
          </div>

          {/* 正式名称 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">正式名称</label>
            <input
              type="text"
              value={form.official_name || ''}
              onChange={(e) => setForm({ ...form, official_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1E3A8A] focus:border-[#1E3A8A] outline-none"
            />
          </div>

          {/* カテゴリ + 発行機関 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                カテゴリ <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as SubsidyFormData['category'] })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1E3A8A] focus:border-[#1E3A8A] outline-none"
              >
                <option value="subsidy">補助金</option>
                <option value="grant">助成金</option>
                <option value="loan">融資</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                発行機関 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={form.authority}
                onChange={(e) => setForm({ ...form, authority: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1E3A8A] focus:border-[#1E3A8A] outline-none"
                placeholder="例: 商工会議所"
              />
            </div>
          </div>

          {/* 発行機関URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">発行機関URL</label>
            <input
              type="url"
              value={form.authority_url || ''}
              onChange={(e) => setForm({ ...form, authority_url: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1E3A8A] focus:border-[#1E3A8A] outline-none"
              placeholder="https://"
            />
          </div>

          {/* 対象エリア */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">対象エリア</label>
            <select
              value={form.target_area || '全国'}
              onChange={(e) => setForm({ ...form, target_area: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1E3A8A] focus:border-[#1E3A8A] outline-none"
            >
              {AREA_OPTIONS.map((area) => (
                <option key={area} value={area}>{area}</option>
              ))}
            </select>
          </div>

          {/* 目的（チェックボックス） */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">目的</label>
            <div className="flex flex-wrap gap-2">
              {PURPOSE_OPTIONS.map((purpose) => (
                <label
                  key={purpose}
                  className={`
                    inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors border
                    ${form.purpose?.includes(purpose)
                      ? 'bg-[#1E3A8A] text-white border-[#1E3A8A]'
                      : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                    }
                  `}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={form.purpose?.includes(purpose) || false}
                    onChange={() => togglePurpose(purpose)}
                  />
                  {purpose}
                </label>
              ))}
            </div>
          </div>

          {/* 対象規模 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">対象規模</label>
            <div className="flex flex-wrap gap-2">
              {SIZE_OPTIONS.map((size) => (
                <label
                  key={size}
                  className={`
                    inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors border
                    ${form.target_size?.includes(size)
                      ? 'bg-[#1E3A8A] text-white border-[#1E3A8A]'
                      : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                    }
                  `}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={form.target_size?.includes(size) || false}
                    onChange={() => toggleSize(size)}
                  />
                  {size}
                </label>
              ))}
            </div>
          </div>

          {/* 上限金額 + 補助率 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">上限金額（円）</label>
              <input
                type="number"
                value={form.max_amount || ''}
                onChange={(e) => setForm({ ...form, max_amount: e.target.value ? Number(e.target.value) : null })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1E3A8A] focus:border-[#1E3A8A] outline-none"
                placeholder="例: 2000000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">補助率</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={form.subsidy_rate || ''}
                onChange={(e) => setForm({ ...form, subsidy_rate: e.target.value ? Number(e.target.value) : null })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1E3A8A] focus:border-[#1E3A8A] outline-none"
                placeholder="例: 0.67（= 2/3）"
              />
            </div>
          </div>

          {/* 日付 */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">公募開始日</label>
              <input
                type="date"
                value={form.application_start || ''}
                onChange={(e) => setForm({ ...form, application_start: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1E3A8A] focus:border-[#1E3A8A] outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">締切日</label>
              <input
                type="date"
                value={form.application_deadline || ''}
                onChange={(e) => setForm({ ...form, application_deadline: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1E3A8A] focus:border-[#1E3A8A] outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">採択発表日</label>
              <input
                type="date"
                value={form.announcement_date || ''}
                onChange={(e) => setForm({ ...form, announcement_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1E3A8A] focus:border-[#1E3A8A] outline-none"
              />
            </div>
          </div>

          {/* 第○回 + ステータス */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">第○回</label>
              <input
                type="number"
                value={form.round_number || ''}
                onChange={(e) => setForm({ ...form, round_number: e.target.value ? Number(e.target.value) : null })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1E3A8A] focus:border-[#1E3A8A] outline-none"
                placeholder="例: 20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ステータス</label>
              <select
                value={form.status || 'open'}
                onChange={(e) => setForm({ ...form, status: e.target.value as SubsidyFormData['status'] })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1E3A8A] focus:border-[#1E3A8A] outline-none"
              >
                <option value="open">公募中</option>
                <option value="upcoming">公募予定</option>
                <option value="closed">締切済</option>
                <option value="unknown">不明</option>
              </select>
            </div>
          </div>

          {/* 申請要件 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">申請要件</label>
            <textarea
              rows={3}
              value={form.requirements || ''}
              onChange={(e) => setForm({ ...form, requirements: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1E3A8A] focus:border-[#1E3A8A] outline-none resize-none"
              placeholder="申請に必要な条件を記載"
            />
          </div>

          {/* 参照URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">参照URL</label>
            <input
              type="url"
              value={form.source_url || ''}
              onChange={(e) => setForm({ ...form, source_url: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1E3A8A] focus:border-[#1E3A8A] outline-none"
              placeholder="https://"
            />
          </div>

          {/* 備考 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">備考</label>
            <textarea
              rows={2}
              value={form.notes || ''}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1E3A8A] focus:border-[#1E3A8A] outline-none resize-none"
            />
          </div>

          {/* エラー表示 */}
          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* ボタン */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-[#1E3A8A] rounded-lg hover:bg-[#1E3A8A]/90 disabled:opacity-50"
            >
              {loading ? '保存中...' : isEditing ? '更新する' : '登録する'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
