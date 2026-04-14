import { createServerSupabaseClient } from '@/lib/supabase/server'
import DraftWizard from '@/components/draft/DraftWizard'
import type { Subsidy, Location, Organization, DraftTemplate } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'

export default async function NewDraftPage() {
  const supabase = await createServerSupabaseClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type SA = any

  // 全クエリを並列実行
  const [
    { data: subsidies },
    { data: locations },
    { data: org },
    { data: templates },
  ] = await Promise.all([
    // 補助金一覧（申請中ステータスの申請がある補助金を優先）
    (supabase.from('subsidies') as SA)
      .select('*')
      .eq('status', 'open')
      .order('name'),
    // 拠点一覧
    (supabase.from('locations') as SA)
      .select('*')
      .eq('is_active', true),
    // 法人情報
    (supabase.from('organizations') as SA)
      .select('*')
      .limit(1)
      .single(),
    // テンプレート一覧
    (supabase.from('draft_templates') as SA)
      .select('*')
      .order('is_default', { ascending: false }),
  ])

  return (
    <DraftWizard
      subsidies={(subsidies || []) as Subsidy[]}
      locations={(locations || []) as Location[]}
      organization={org as Organization | null}
      templates={(templates || []) as DraftTemplate[]}
    />
  )
}
