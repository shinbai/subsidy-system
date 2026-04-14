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

  // 全クエリを並列実行
  const [
    { data: subsidy },
    { data: applications },
    { data: locations },
  ] = await Promise.all([
    supabase
      .from('subsidies')
      .select('*')
      .eq('id', id)
      .single(),
    supabase
      .from('applications')
      .select('*')
      .eq('subsidy_id', id)
      .order('created_at', { ascending: false }),
    supabase
      .from('locations')
      .select('*')
      .eq('is_active', true),
  ])

  if (!subsidy) {
    notFound()
  }

  return (
    <SubsidyDetailClient
      subsidy={subsidy as Subsidy}
      applications={(applications || []) as Application[]}
      locations={(locations || []) as Location[]}
    />
  )
}
