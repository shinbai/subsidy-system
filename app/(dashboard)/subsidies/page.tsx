import { createServerSupabaseClient } from '@/lib/supabase/server'
import SubsidyTable from '@/components/subsidy/SubsidyTable'
import type { Subsidy } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'

export default async function SubsidiesPage() {
  const supabase = await createServerSupabaseClient()

  const { data } = await supabase
    .from('subsidies')
    .select('*')
    .order('application_deadline', { ascending: true, nullsFirst: false })

  const subsidies = (data || []) as Subsidy[]

  return <SubsidyTable subsidies={subsidies} />
}
