import { createServerSupabaseClient } from '@/lib/supabase/server'
import ChatClient from './ChatClient'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SA = any

export const dynamic = 'force-dynamic'

export default async function ChatPage() {
  const supabase = await createServerSupabaseClient()
  const { data: subsidies } = await (supabase.from('subsidies') as SA)
    .select('id, name')
    .eq('status', 'open')
    .order('name')

  return <ChatClient subsidies={(subsidies || []) as { id: string; name: string }[]} />
}
