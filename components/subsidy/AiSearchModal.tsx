'use client'

import { useState } from 'react'
import { X, Loader2, ExternalLink, Check } from 'lucide-react'
import { bulkCreateSubsidies, type SubsidyFormData } from '@/lib/actions/subsidies'

interface AiSearchResult {
  name: string
  authority: string
  category: 'subsidy' | 'grant' | 'loan'
  target_area: string | null
  max_amount: number | null
  subsidy_rate: number | null
  purpose: string[]
  requirements: string | null
  source_url: string | null
  reason: string
}

interface AiSearchModalProps {
  onClose: () => void
}

const categoryLabels: Record<string, string> = {
  subsidy: '補助金',
  grant: '助成金',
  loan: '融資',
}

const categoryColors: Record<string, string> = {
  subsidy: 'bg-blue-100 text-blue-700',
  grant: 'bg-green-100 text-green-700',
  loan: 'bg-purple-100 text-purple-700',
}

export default function AiSearchModal({ onClose }: AiSearchModalProps) {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<AiSearchResult[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [error, setError] = useState<string | null>(null)
  const [registering, setRegistering] = useState(false)
  const [registered, setRegistered] = useState(false)

  // AI探索を実行
  const handleSearch = async () => {
    setLoading(true)
    setError(null)
    setResults([])
    setSelectedIds(new Set())
    setRegistered(false)

    try {
      const res = await fetch('/api/subsidies/ai-search', { method: 'POST' })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || '探索に失敗しました')
        return
      }

      setResults(data.subsidies || [])
      // 全件選択状態にする
      setSelectedIds(new Set((data.subsidies || []).map((_: AiSearchResult, i: number) => i)))
    } catch {
      setError('ネットワークエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  // 選択の切り替え
  const toggleSelect = (index: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }

  // 選択した補助金を登録
  const handleRegister = async () => {
    const selected = results.filter((_, i) => selectedIds.has(i))
    if (selected.length === 0) return

    setRegistering(true)
    setError(null)

    try {
      const formDataList: SubsidyFormData[] = selected.map(s => ({
        name: s.name,
        category: s.category,
        authority: s.authority,
        target_area: s.target_area || undefined,
        purpose: s.purpose,
        max_amount: s.max_amount,
        subsidy_rate: s.subsidy_rate,
        requirements: s.requirements || undefined,
        source_url: s.source_url || undefined,
        status: 'open' as const,
      }))

      const result = await bulkCreateSubsidies(formDataList)

      if (result.error) {
        setError(result.error)
      } else {
        setRegistered(true)
        const count = result.data?.length || 0
        const skipped = result.skipped || 0
        if (skipped > 0) {
          setError(`${count}件を登録しました（${skipped}件は既に登録済みのためスキップ）`)
        }
      }
    } catch {
      setError('登録に失敗しました')
    } finally {
      setRegistering(false)
    }
  }

  // 金額フォーマット
  const formatAmount = (amount: number | null) => {
    if (!amount) return '-'
    if (amount >= 100000000) return `${(amount / 100000000).toLocaleString()}億円`
    if (amount >= 10000) return `${(amount / 10000).toLocaleString()}万円`
    return `${amount.toLocaleString()}円`
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col">
        {/* ヘッダー */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">AI補助金探索</h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* コンテンツ */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* 初期状態 */}
          {!loading && results.length === 0 && !error && (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-6">
                AIが事業者情報をもとに、申請可能な補助金・助成金を探します。
              </p>
              <button
                onClick={handleSearch}
                className="px-6 py-3 bg-gradient-to-r from-[#1E3A8A] to-indigo-600 text-white font-medium rounded-lg hover:from-[#1E3A8A]/90 hover:to-indigo-500 shadow-sm transition-all"
              >
                探索開始
              </button>
            </div>
          )}

          {/* ローディング */}
          {loading && (
            <div className="text-center py-12">
              <Loader2 size={40} className="animate-spin text-[#1E3A8A] mx-auto mb-4" />
              <p className="text-gray-600 font-medium">AIが補助金を探索しています...</p>
              <p className="text-sm text-gray-400 mt-1">30秒ほどお待ちください</p>
            </div>
          )}

          {/* エラー */}
          {error && (
            <div className={`mb-4 p-3 rounded-lg text-sm ${registered ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-700'}`}>
              {error}
            </div>
          )}

          {/* 結果一覧 */}
          {results.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-500">{results.length}件の補助金が見つかりました</p>
                <p className="text-sm text-gray-500">{selectedIds.size}件選択中</p>
              </div>
              {results.map((result, index) => (
                <div
                  key={index}
                  onClick={() => toggleSelect(index)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                    selectedIds.has(index)
                      ? 'border-[#1E3A8A] bg-blue-50/50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* チェックボックス */}
                    <div className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                      selectedIds.has(index)
                        ? 'bg-[#1E3A8A] border-[#1E3A8A]'
                        : 'border-gray-300'
                    }`}>
                      {selectedIds.has(index) && <Check size={14} className="text-white" />}
                    </div>

                    {/* カード内容 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-semibold text-gray-900">{result.name}</h3>
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${categoryColors[result.category] || 'bg-gray-100 text-gray-600'}`}>
                          {categoryLabels[result.category] || result.category}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {result.authority}
                        {result.target_area && ` | ${result.target_area}`}
                      </p>
                      <div className="flex items-center gap-4 mt-1.5 text-xs text-gray-600">
                        {result.max_amount && (
                          <span>上限: <span className="font-medium">{formatAmount(result.max_amount)}</span></span>
                        )}
                        {result.subsidy_rate && (
                          <span>補助率: <span className="font-medium">{Math.round(result.subsidy_rate * 100)}%</span></span>
                        )}
                      </div>
                      <p className="text-xs text-gray-700 mt-2 bg-gray-50 p-2 rounded">
                        {result.reason}
                      </p>
                      {result.source_url && (
                        <a
                          href={result.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-xs text-[#1E3A8A] hover:underline mt-1.5"
                        >
                          <ExternalLink size={12} />
                          公式サイト
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* フッター */}
        {results.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <button
              onClick={handleSearch}
              disabled={loading}
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              再探索
            </button>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                閉じる
              </button>
              {!registered ? (
                <button
                  onClick={handleRegister}
                  disabled={selectedIds.size === 0 || registering}
                  className="px-4 py-2 bg-[#1E3A8A] text-white text-sm font-medium rounded-lg hover:bg-[#1E3A8A]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {registering && <Loader2 size={14} className="animate-spin" />}
                  選択した補助金を登録（{selectedIds.size}件）
                </button>
              ) : (
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-500 transition-colors"
                >
                  完了
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
