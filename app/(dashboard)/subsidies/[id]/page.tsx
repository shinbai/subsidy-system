import { createServerSupabaseClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import type { Subsidy, Application, Location } from '@/lib/supabase/types'
import { CATEGORY_LABELS, SUBSIDY_STATUS_LABELS, APPLICATION_STATUS_LABELS } from '@/lib/supabase/types'
import SubsidyDetailClient from './SubsidyDetailClient'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

export default async function SubsidyDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  // 補助金データ取得
  const { data: subsidy } = await supabase
    .from('subsidies')
    .select('*')
    .eq('id', id)
    .single()

  if (!subsidy) {
    notFound()
  }

  // 関連する申請履歴
  const { data: applications } = await supabase
    .from('applications')
    .select('*')
    .eq('subsidy_id', id)
    .order('created_at', { ascending: false })

  // 拠点一覧（申請開始時の選択用）
  const { data: locations } = await supabase
    .from('locations')
    .select('*')
    .eq('is_active', true)

  return (
    <SubsidyDetailClient
      subsidy={subsidy as Subsidy}
      applications={(applications || []) as Application[]}
      locations={(locations || []) as Location[]}
    />
  )
}
