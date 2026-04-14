import { createServerSupabaseClient } from '@/lib/supabase/server'
import KanbanBoard from '@/components/application/KanbanBoard'
import type { ApplicationWithDetails } from '@/components/application/KanbanBoard'
import Link from 'next/link'
import { ClipboardList, ArrowRight } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function ApplicationsPage() {
  const supabase = await createServerSupabaseClient()

  // 申請一覧を取得（補助金名・拠点名を結合）
  const { data: applications } = await supabase
    .from('applications')
    .select(`
      *,
      subsidies ( name, max_amount, application_deadline ),
      locations ( name, branch_name )
    `)
    .order('updated_at', { ascending: false })

  // データ整形
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formatted: ApplicationWithDetails[] = ((applications || []) as any[]).map((app) => ({
    ...app,
    subsidy_name: app.subsidies?.name || null,
    subsidy_max_amount: app.subsidies?.max_amount || null,
    subsidy_deadline: app.subsidies?.application_deadline || null,
    location_name: app.locations
      ? `${app.locations.name}${app.locations.branch_name ? `（${app.locations.branch_name}）` : ''}`
      : null,
    // リレーション用プロパティを除去
    subsidies: undefined,
    locations: undefined,
  }))

  if (formatted.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <ClipboardList size={48} className="mx-auto text-gray-300 mb-3" />
        <p className="text-sm font-medium text-gray-700 mb-1">まだ申請がありません</p>
        <p className="text-sm text-gray-500 mb-4">補助金一覧から申請を開始してください。</p>
        <Link
          href="/subsidies"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1E3A8A] text-white text-sm font-medium rounded-lg hover:bg-[#1E3A8A]/90 transition-colors"
        >
          補助金一覧へ
          <ArrowRight size={16} />
        </Link>
      </div>
    )
  }

  return <KanbanBoard applications={formatted} />
}
