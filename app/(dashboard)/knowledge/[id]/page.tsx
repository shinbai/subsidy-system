import { createServerSupabaseClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, XCircle, MessageSquare, Lightbulb, Quote } from 'lucide-react'
import type { Knowledge } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SA = any

interface Props {
  params: Promise<{ id: string }>
}

export default async function KnowledgeDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  const { data } = await (supabase.from('knowledge') as SA)
    .select(`
      *,
      subsidies ( name, authority, category ),
      applications ( status, application_amount, adopted_amount, applied_date, result_date )
    `)
    .eq('id', id)
    .single()

  if (!data) notFound()

  const item = data as Knowledge & {
    subsidies?: { name: string; authority: string; category: string }
    applications?: { status: string; application_amount: number | null; adopted_amount: number | null; applied_date: string | null; result_date: string | null }
  }

  const isAdopted = item.result === 'adopted'

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link href="/knowledge" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft size={16} /> ナレッジ一覧
      </Link>

      {/* ヘッダー */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start gap-3">
          {isAdopted ? (
            <CheckCircle size={24} className="text-green-500 mt-0.5" />
          ) : (
            <XCircle size={24} className="text-red-500 mt-0.5" />
          )}
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {item.subsidies?.name || '不明な補助金'}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {item.subsidies?.authority} | {isAdopted ? '採択' : '不採択'} |{' '}
              {new Date(item.created_at).toLocaleDateString('ja-JP')}
            </p>
          </div>
        </div>

        {item.applications && (
          <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">申請金額</p>
              <p className="font-medium">{item.applications.application_amount ? `${(item.applications.application_amount / 10000).toLocaleString()}万円` : '-'}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">採択金額</p>
              <p className="font-medium">{item.applications.adopted_amount ? `${(item.applications.adopted_amount / 10000).toLocaleString()}万円` : '-'}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">結果日</p>
              <p className="font-medium">{item.applications.result_date || '-'}</p>
            </div>
          </div>
        )}
      </div>

      {/* ポイント */}
      {item.key_points && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-3">
            <Lightbulb size={16} className="text-yellow-500" />
            {isAdopted ? '採択のポイント' : '不採択の理由'}
          </h2>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{item.key_points}</p>
        </div>
      )}

      {/* フィードバック */}
      {item.feedback_from_authority && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-3">
            <MessageSquare size={16} className="text-blue-500" />
            審査機関からのフィードバック
          </h2>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{item.feedback_from_authority}</p>
        </div>
      )}

      {/* 教訓 */}
      {item.lessons_learned && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">次回への教訓</h2>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{item.lessons_learned}</p>
        </div>
      )}

      {/* 効果的な表現 */}
      {item.effective_phrases && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-3">
            <Quote size={16} className="text-green-500" />
            効果的だった表現
          </h2>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{item.effective_phrases}</p>
        </div>
      )}
    </div>
  )
}
