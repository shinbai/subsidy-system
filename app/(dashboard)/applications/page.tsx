import { createServerSupabaseClient } from '@/lib/supabase/server'
import KanbanBoard from '@/components/application/KanbanBoard'
import type { ApplicationWithDetails } from '@/components/application/KanbanBoard'

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

  return <KanbanBoard applications={formatted} />
}
