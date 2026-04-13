import { createServerSupabaseClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import DraftEditor from '@/components/draft/DraftEditor'
import type { Draft, DraftTemplate } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SA = any

interface Props {
  params: Promise<{ id: string }>
}

export default async function DraftDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  const { data: draft } = await (supabase.from('drafts') as SA)
    .select(`*, subsidies ( name )`)
    .eq('id', id)
    .single()

  if (!draft) notFound()

  const { data: template } = await (supabase.from('draft_templates') as SA)
    .select('*')
    .eq('id', draft.template_id)
    .single()

  return (
    <DraftEditor
      draft={draft as Draft & { subsidies?: { name: string } }}
      template={template as DraftTemplate}
    />
  )
}
