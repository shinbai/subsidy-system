import { createServerSupabaseClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { BookOpen, CheckCircle, XCircle, TrendingUp } from 'lucide-react'
import type { Knowledge } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SA = any

export default async function KnowledgePage() {
  const supabase = await createServerSupabaseClient()

  // ナレッジ一覧
  const { data: knowledgeList } = await (supabase.from('knowledge') as SA)
    .select(`
      *,
      subsidies ( name, category, authority ),
      applications ( status, application_amount, adopted_amount )
    `)
    .order('created_at', { ascending: false })

  const items = (knowledgeList || []) as (Knowledge & {
    subsidies?: { name: string; category: string; authority: string }
    applications?: { status: string; application_amount: number | null; adopted_amount: number | null }
  })[]

  // 統計
  const totalCount = items.length
  const adoptedCount = items.filter(k => k.result === 'adopted').length
  const rejectedCount = items.filter(k => k.result === 'rejected').length
  const adoptionRate = totalCount > 0 ? Math.round((adoptedCount / totalCount) * 100) : 0
  const totalAdopted = items
    .filter(k => k.result === 'adopted')
    .reduce((sum, k) => sum + (k.applications?.adopted_amount || 0), 0)

  return (
    <div className="space-y-6">
      {/* 統計カード */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">総申請数</p>
          <p className="text-2xl font-bold text-gray-900">{totalCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">採択数</p>
          <p className="text-2xl font-bold text-green-600">{adoptedCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">採択率</p>
          <p className="text-2xl font-bold text-[#1E3A8A]">{adoptionRate}%</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">採択総額</p>
          <p className="text-2xl font-bold text-gray-900">
            {totalAdopted > 0 ? `${(totalAdopted / 10000).toLocaleString()}万円` : '¥0'}
          </p>
        </div>
      </div>

      {/* 空状態のヒント */}
      {totalCount === 0 && adoptedCount === 0 && rejectedCount === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
          <TrendingUp size={20} className="text-blue-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-blue-700">
            申請管理で採択・不採択の記録を開始すると、ナレッジが蓄積されます
          </p>
        </div>
      )}

      {/* ナレッジ一覧 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">ナレッジ一覧</h2>

        {items.length > 0 ? (
          <div className="space-y-3">
            {items.map((item) => (
              <Link
                key={item.id}
                href={`/knowledge/${item.id}`}
                className="block p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {item.result === 'adopted' ? (
                      <CheckCircle size={18} className="text-green-500 mt-0.5" />
                    ) : (
                      <XCircle size={18} className="text-red-500 mt-0.5" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {item.subsidies?.name || '不明な補助金'}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {item.subsidies?.authority || ''} |{' '}
                        {item.result === 'adopted' ? '採択' : '不採択'}
                      </p>
                      {item.key_points && (
                        <p className="text-xs text-gray-600 mt-2 line-clamp-2">
                          {item.key_points}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(item.created_at).toLocaleDateString('ja-JP')}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <BookOpen size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-sm text-gray-500">
              まだナレッジがありません。<br />
              申請管理で採択・不採択に変更すると記録できます。
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
