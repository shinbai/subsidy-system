import { createServerSupabaseClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, FileText, Clock, CheckCircle } from 'lucide-react'
import type { Draft } from '@/lib/supabase/types'
import { DRAFT_STATUS_LABELS } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SA = any

export default async function DraftsPage() {
  const supabase = await createServerSupabaseClient()

  const { data } = await (supabase.from('drafts') as SA)
    .select(`
      *,
      subsidies ( name )
    `)
    .order('updated_at', { ascending: false })

  const drafts = ((data || []) as (Draft & { subsidies?: { name: string } })[])

  const statusIcon = (status: Draft['status']) => {
    switch (status) {
      case 'draft': return <FileText size={14} className="text-gray-400" />
      case 'in_review': return <Clock size={14} className="text-orange-500" />
      case 'finalized': return <CheckCircle size={14} className="text-green-500" />
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">AI申請書ドラフトの作成・管理</p>
        <Link
          href="/drafts/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1E3A8A] text-white text-sm font-medium rounded-lg hover:bg-[#1E3A8A]/90"
        >
          <Plus size={16} />
          新規作成
        </Link>
      </div>

      {drafts.length > 0 ? (
        <div className="space-y-3">
          {drafts.map((draft) => (
            <Link
              key={draft.id}
              href={`/drafts/${draft.id}`}
              className="block bg-white rounded-xl border border-gray-200 p-4 hover:border-[#1E3A8A]/30 hover:shadow-sm transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {statusIcon(draft.status)}
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">{draft.title}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {draft.subsidies?.name || '補助金不明'}
                      {' | '}
                      生成{draft.generation_count}回
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                    draft.status === 'finalized' ? 'bg-green-100 text-green-700' :
                    draft.status === 'in_review' ? 'bg-orange-100 text-orange-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {DRAFT_STATUS_LABELS[draft.status]}
                  </span>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(draft.updated_at).toLocaleDateString('ja-JP')}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <FileText size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-sm text-gray-500 mb-1">まだドラフトがありません</p>
          <p className="text-xs text-gray-400 mb-4">AIが補助金の申請書を自動生成します</p>
          <Link
            href="/drafts/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1E3A8A] text-white text-sm font-medium rounded-lg hover:bg-[#1E3A8A]/90"
          >
            <Plus size={16} />
            最初のドラフトを作成
          </Link>
        </div>
      )}
    </div>
  )
}
