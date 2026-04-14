'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Edit2, Trash2, ExternalLink, PlayCircle,
  Calendar, Building, MapPin, Target, Coins,
} from 'lucide-react'
import type { Subsidy, Application, Location } from '@/lib/supabase/types'
import { CATEGORY_LABELS, SUBSIDY_STATUS_LABELS, APPLICATION_STATUS_LABELS } from '@/lib/supabase/types'
import { deleteSubsidy, startApplication } from '@/lib/actions/subsidies'
import SubsidyForm from '@/components/subsidy/SubsidyForm'

interface Props {
  subsidy: Subsidy
  applications: Application[]
  locations: Location[]
}

// 金額フォーマット
function formatAmount(amount: number | null): string {
  if (!amount) return '-'
  if (amount >= 10000) {
    const man = amount / 10000
    return `${man.toLocaleString()}万円`
  }
  return `${amount.toLocaleString()}円`
}

export default function SubsidyDetailClient({ subsidy, applications, locations }: Props) {
  const router = useRouter()
  const [showEdit, setShowEdit] = useState(false)
  const [showStartModal, setShowStartModal] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState(locations[0]?.id || '')
  const [deleting, setDeleting] = useState(false)
  const [starting, setStarting] = useState(false)

  const handleDelete = async () => {
    if (!confirm('この補助金を削除しますか？関連する申請データも削除されます。')) return
    setDeleting(true)
    await deleteSubsidy(subsidy.id)
  }

  const handleStartApplication = async () => {
    if (!selectedLocation) return
    setStarting(true)
    const result = await startApplication(subsidy.id, selectedLocation)
    if ('error' in result && result.error) {
      alert(`エラー: ${result.error}`)
    } else {
      setShowStartModal(false)
      router.refresh()
    }
    setStarting(false)
  }

  return (
    <div className="space-y-6">
      {/* パンくず + アクション */}
      <div className="flex items-center justify-between">
        <Link
          href="/subsidies"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 hover:underline"
        >
          <ArrowLeft size={16} />
          &larr; 補助金一覧
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowEdit(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Edit2 size={14} />
            編集
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50"
          >
            <Trash2 size={14} />
            {deleting ? '削除中...' : '削除'}
          </button>
        </div>
      </div>

      {/* メイン情報 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{subsidy.name}</h2>
            {subsidy.official_name && (
              <p className="text-sm text-gray-500 mt-1">{subsidy.official_name}</p>
            )}
          </div>
          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
            subsidy.status === 'open' ? 'bg-green-100 text-green-700' :
            subsidy.status === 'upcoming' ? 'bg-blue-100 text-blue-700' :
            'bg-gray-100 text-gray-700'
          }`}>
            {SUBSIDY_STATUS_LABELS[subsidy.status]}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Building size={16} className="text-gray-400" />
              <span className="text-gray-500">発行機関:</span>
              <span className="text-gray-900 font-medium">{subsidy.authority}</span>
              {subsidy.authority_url && (
                <a href={subsidy.authority_url} target="_blank" rel="noopener noreferrer" className="text-[#1E3A8A] hover:underline">
                  <ExternalLink size={14} />
                </a>
              )}
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Target size={16} className="text-gray-400" />
              <span className="text-gray-500">カテゴリ:</span>
              <span className="text-gray-900">{CATEGORY_LABELS[subsidy.category]}</span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <MapPin size={16} className="text-gray-400" />
              <span className="text-gray-500">対象エリア:</span>
              <span className="text-gray-900">{subsidy.target_area || '-'}</span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Coins size={16} className="text-gray-400" />
              <span className="text-gray-500">上限金額:</span>
              <span className="text-gray-900 text-lg font-bold">{formatAmount(subsidy.max_amount)}</span>
              {subsidy.subsidy_rate && (
                <span className="text-gray-500">
                  （補助率: {Math.round(subsidy.subsidy_rate * 100)}%）
                </span>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Calendar size={16} className="text-gray-400" />
              <span className="text-gray-500">公募開始:</span>
              <span className="text-gray-900">{subsidy.application_start || '-'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar size={16} className="text-gray-400" />
              <span className="text-gray-500">締切:</span>
              <span className="text-gray-900 font-medium">{subsidy.application_deadline || '-'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar size={16} className="text-gray-400" />
              <span className="text-gray-500">採択発表:</span>
              <span className="text-gray-900">{subsidy.announcement_date || '-'}</span>
            </div>
            {subsidy.round_number && (
              <div className="text-sm text-gray-600">
                第{subsidy.round_number}回
              </div>
            )}
          </div>
        </div>

        {/* 目的・対象規模 */}
        {(subsidy.purpose?.length || subsidy.target_size?.length) && (
          <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
            {subsidy.purpose && subsidy.purpose.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-gray-500">目的:</span>
                {subsidy.purpose.map((p) => (
                  <span key={p} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full">
                    {p}
                  </span>
                ))}
              </div>
            )}
            {subsidy.target_size && subsidy.target_size.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-gray-500">対象規模:</span>
                {subsidy.target_size.map((s) => (
                  <span key={s} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                    {s}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 申請要件 */}
        {subsidy.requirements && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <h3 className="text-sm font-medium text-gray-700 mb-1">申請要件</h3>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{subsidy.requirements}</p>
          </div>
        )}

        {/* 備考 */}
        {subsidy.notes && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <h3 className="text-sm font-medium text-gray-700 mb-1">備考</h3>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{subsidy.notes}</p>
          </div>
        )}

        {/* 参照URL */}
        {subsidy.source_url && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <a
              href={subsidy.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-[#1E3A8A] hover:underline"
            >
              <ExternalLink size={14} />
              詳細ページを開く
            </a>
          </div>
        )}

        {/* 申請開始ボタン */}
        <div className="mt-6 pt-4 border-t border-gray-100">
          <button
            onClick={() => setShowStartModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#1E3A8A] text-white text-sm font-medium rounded-lg hover:bg-[#1E3A8A]/90 transition-colors"
          >
            <PlayCircle size={18} />
            申請を開始する
          </button>
        </div>
      </div>

      {/* 関連する申請履歴 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">申請履歴</h3>
        {applications.length > 0 ? (
          <div className="space-y-3">
            {applications.map((app) => (
              <div
                key={app.id}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
              >
                <div>
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                    app.status === 'adopted' ? 'bg-green-100 text-green-700' :
                    app.status === 'rejected' ? 'bg-red-100 text-red-700' :
                    app.status === 'received' ? 'bg-purple-100 text-purple-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {APPLICATION_STATUS_LABELS[app.status]}
                  </span>
                  {app.assigned_to && (
                    <span className="text-xs text-gray-500 ml-2">担当: {app.assigned_to}</span>
                  )}
                </div>
                <div className="text-right">
                  {app.application_amount && (
                    <span className="text-sm font-medium text-gray-900">
                      {formatAmount(app.application_amount)}
                    </span>
                  )}
                  <span className="text-xs text-gray-400 ml-2">
                    {new Date(app.created_at).toLocaleDateString('ja-JP')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">まだ申請履歴がありません</p>
        )}
      </div>

      {/* 編集モーダル */}
      {showEdit && (
        <SubsidyForm
          subsidy={subsidy}
          onClose={() => setShowEdit(false)}
          onSuccess={() => router.refresh()}
        />
      )}

      {/* 申請開始モーダル */}
      {showStartModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">申請を開始する</h3>
            <p className="text-sm text-gray-600 mb-4">
              「{subsidy.name}」の申請を開始します。対象拠点を選択してください。
            </p>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-4 focus:ring-2 focus:ring-[#1E3A8A] outline-none"
            >
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}（{loc.branch_name}）
                </option>
              ))}
            </select>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowStartModal(false)}
                className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                キャンセル
              </button>
              <button
                onClick={handleStartApplication}
                disabled={starting || !selectedLocation}
                className="px-4 py-2 text-sm text-white bg-[#1E3A8A] rounded-lg hover:bg-[#1E3A8A]/90 disabled:opacity-50"
              >
                {starting ? '作成中...' : '申請を開始'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
