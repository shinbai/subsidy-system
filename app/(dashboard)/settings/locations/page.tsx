import { createServerSupabaseClient } from '@/lib/supabase/server'
import LocationsManager from './LocationsManager'
import type { Location, Organization } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SA = any

export default async function LocationsSettingsPage() {
  const supabase = await createServerSupabaseClient()

  // 全クエリを並列実行
  const [
    { data: locations },
    { data: org },
  ] = await Promise.all([
    (supabase.from('locations') as SA)
      .select('*')
      .order('is_active', { ascending: false })
      .order('name'),
    (supabase.from('organizations') as SA)
      .select('id')
      .limit(1)
      .single(),
  ])

  return (
    <LocationsManager
      locations={(locations || []) as Location[]}
      organizationId={(org as Organization | null)?.id || ''}
    />
  )
}
