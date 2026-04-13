'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Application } from '@/lib/supabase/types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseAny = any

// 申請ステータスを更新
export async function updateApplicationStatus(
  id: string,
  status: Application['status']
) {
  const supabase = await createServerSupabaseClient()

  const { error } = await (supabase
    .from('applications') as SupabaseAny)
    .update({ status })
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/applications')
  return { success: true }
}

// 申請を更新（詳細情報）
export async function updateApplication(
  id: string,
  data: {
    status?: Application['status']
    assigned_to?: string | null
    application_amount?: number | null
    adopted_amount?: number | null
    received_amount?: number | null
    applied_date?: string | null
    result_date?: string | null
    received_date?: string | null
    rejection_reason?: string | null
    notes?: string | null
  }
) {
  const supabase = await createServerSupabaseClient()

  const { error } = await (supabase
    .from('applications') as SupabaseAny)
    .update(data)
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/applications')
  revalidatePath('/subsidies')
  return { success: true }
}

// ナレッジを登録
export async function createKnowledge(data: {
  application_id: string
  subsidy_id: string | null
  result: 'adopted' | 'rejected'
  key_points?: string
  feedback_from_authority?: string
  lessons_learned?: string
  effective_phrases?: string
}) {
  const supabase = await createServerSupabaseClient()

  const { error } = await (supabase
    .from('knowledge') as SupabaseAny)
    .insert({
      application_id: data.application_id,
      subsidy_id: data.subsidy_id,
      result: data.result,
      key_points: data.key_points || null,
      feedback_from_authority: data.feedback_from_authority || null,
      lessons_learned: data.lessons_learned || null,
      effective_phrases: data.effective_phrases || null,
    })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/applications')
  revalidatePath('/knowledge')
  return { success: true }
}
