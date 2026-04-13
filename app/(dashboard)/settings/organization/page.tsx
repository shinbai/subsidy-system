import { createServerSupabaseClient } from '@/lib/supabase/server'
import OrganizationForm from './OrganizationForm'
import type { Organization } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SA = any

export default async function OrganizationSettingsPage() {
  const supabase = await createServerSupabaseClient()
  const { data } = await (supabase.from('organizations') as SA).select('*').limit(1).single()

  return <OrganizationForm organization={data as Organization | null} />
}
