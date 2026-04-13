'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SA = any

// ドラフトを作成
export async function createDraft(data: {
  application_id?: string
  subsidy_id: string
  template_id: string
  title: string
  input_data: Record<string, string>
}) {
  const supabase = await createServerSupabaseClient()

  const { data: draft, error } = await (supabase
    .from('drafts') as SA)
    .insert({
      application_id: data.application_id || null,
      subsidy_id: data.subsidy_id,
      template_id: data.template_id,
      title: data.title,
      status: 'draft',
      input_data: data.input_data,
      generation_count: 0,
    })
    .select()
    .single()

  if (error) return { error: error.message }

  revalidatePath('/drafts')
  return { data: draft }
}

// ドラフトの生成コンテンツを更新
export async function updateDraftContent(
  id: string,
  content: Record<string, string>,
  type: 'generated' | 'final'
) {
  const supabase = await createServerSupabaseClient()

  const updateData = type === 'generated'
    ? { generated_content: content, generation_count: 1 } // increment handled separately
    : { final_content: content, status: 'finalized' }

  const { error } = await (supabase
    .from('drafts') as SA)
    .update(updateData)
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/drafts')
  revalidatePath(`/drafts/${id}`)
  return { success: true }
}

// 特定セクションの生成コンテンツを更新
export async function updateDraftSection(
  id: string,
  sectionId: string,
  content: string,
  target: 'generated' | 'final'
) {
  const supabase = await createServerSupabaseClient()

  // 現在のコンテンツを取得
  const { data: draft } = await (supabase
    .from('drafts') as SA)
    .select(target === 'generated' ? 'generated_content' : 'final_content')
    .eq('id', id)
    .single()

  if (!draft) return { error: 'ドラフトが見つかりません' }

  const currentContent = (target === 'generated' ? draft.generated_content : draft.final_content) || {}
  const updatedContent = { ...currentContent, [sectionId]: content }

  const updateField = target === 'generated' ? 'generated_content' : 'final_content'
  const { error } = await (supabase
    .from('drafts') as SA)
    .update({ [updateField]: updatedContent })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath(`/drafts/${id}`)
  return { success: true }
}
