import { createServerSupabaseClient } from '@/lib/supabase/server'
import NotificationSettingsClient from './NotificationSettingsClient'

export const dynamic = 'force-dynamic'

export default async function NotificationSettingsPage() {
  const supabase = await createServerSupabaseClient()

  // 通知履歴を取得（最新20件）
  const { data: notifications } = await supabase
    .from('notifications')
    .select(`
      *,
      subsidies ( name )
    `)
    .order('created_at', { ascending: false })
    .limit(20)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formatted = ((notifications || []) as any[]).map((n) => ({
    ...n,
    subsidy_name: n.subsidies?.name || null,
    subsidies: undefined,
  }))

  return <NotificationSettingsClient notifications={formatted} />
}
