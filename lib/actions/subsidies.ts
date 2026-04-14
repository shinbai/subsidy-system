'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseAny = any

// 補助金のフォームデータ型
export interface SubsidyFormData {
  name: string
  official_name?: string
  category: 'subsidy' | 'grant' | 'loan'
  authority: string
  authority_url?: string
  target_area?: string
  target_industry?: string[]
  target_size?: string[]
  purpose?: string[]
  max_amount?: number | null
  subsidy_rate?: number | null
  application_start?: string
  application_deadline?: string
  announcement_date?: string
  round_number?: number | null
  status?: 'open' | 'closed' | 'upcoming' | 'unknown'
  requirements?: string
  notes?: string
  source_url?: string
}

// 補助金を登録
export async function createSubsidy(formData: SubsidyFormData) {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await (supabase
    .from('subsidies') as SupabaseAny)
    .insert({
      name: formData.name,
      official_name: formData.official_name || null,
      category: formData.category,
      authority: formData.authority,
      authority_url: formData.authority_url || null,
      target_area: formData.target_area || null,
      target_industry: formData.target_industry || null,
      target_size: formData.target_size || null,
      purpose: formData.purpose || null,
      max_amount: formData.max_amount || null,
      subsidy_rate: formData.subsidy_rate || null,
      application_start: formData.application_start || null,
      application_deadline: formData.application_deadline || null,
      announcement_date: formData.announcement_date || null,
      round_number: formData.round_number || null,
      status: formData.status || 'open',
      requirements: formData.requirements || null,
      notes: formData.notes || null,
      source_url: formData.source_url || null,
      is_manually_added: true,
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/subsidies')
  return { data }
}

// 補助金を更新
export async function updateSubsidy(id: string, formData: SubsidyFormData) {
  const supabase = await createServerSupabaseClient()

  const { error } = await (supabase
    .from('subsidies') as SupabaseAny)
    .update({
      name: formData.name,
      official_name: formData.official_name || null,
      category: formData.category,
      authority: formData.authority,
      authority_url: formData.authority_url || null,
      target_area: formData.target_area || null,
      target_industry: formData.target_industry || null,
      target_size: formData.target_size || null,
      purpose: formData.purpose || null,
      max_amount: formData.max_amount || null,
      subsidy_rate: formData.subsidy_rate || null,
      application_start: formData.application_start || null,
      application_deadline: formData.application_deadline || null,
      announcement_date: formData.announcement_date || null,
      round_number: formData.round_number || null,
      status: formData.status || 'open',
      requirements: formData.requirements || null,
      notes: formData.notes || null,
      source_url: formData.source_url || null,
    })
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/subsidies')
  revalidatePath(`/subsidies/${id}`)
  return { success: true }
}

// 補助金を一括登録（AI探索結果から）
export async function bulkCreateSubsidies(subsidies: SubsidyFormData[]) {
  const supabase = await createServerSupabaseClient()

  // 既存の補助金名を取得して重複チェック
  const { data: existing } = await (supabase
    .from('subsidies') as SupabaseAny)
    .select('name')

  const existingNames = new Set(
    ((existing || []) as { name: string }[]).map(s => s.name)
  )

  // 重複を除外
  const newSubsidies = subsidies.filter(s => !existingNames.has(s.name))

  if (newSubsidies.length === 0) {
    return { data: [], skipped: subsidies.length }
  }

  const insertData = newSubsidies.map(s => ({
    name: s.name,
    official_name: s.official_name || null,
    category: s.category,
    authority: s.authority,
    authority_url: s.authority_url || null,
    target_area: s.target_area || null,
    target_industry: s.target_industry || null,
    target_size: s.target_size || null,
    purpose: s.purpose || null,
    max_amount: s.max_amount || null,
    subsidy_rate: s.subsidy_rate || null,
    application_start: s.application_start || null,
    application_deadline: s.application_deadline || null,
    announcement_date: s.announcement_date || null,
    round_number: s.round_number || null,
    status: s.status || 'open',
    requirements: s.requirements || null,
    notes: s.notes || null,
    source_url: s.source_url || null,
    is_manually_added: true,
  }))

  const { data, error } = await (supabase
    .from('subsidies') as SupabaseAny)
    .insert(insertData)
    .select()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/subsidies')
  revalidatePath('/dashboard')
  return { data, skipped: subsidies.length - newSubsidies.length }
}

// 補助金を削除
export async function deleteSubsidy(id: string) {
  const supabase = await createServerSupabaseClient()

  const { error } = await (supabase
    .from('subsidies') as SupabaseAny)
    .delete()
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/subsidies')
  redirect('/subsidies')
}

// 補助金から申請を開始する
export async function startApplication(subsidyId: string, locationId: string) {
  const supabase = await createServerSupabaseClient()

  // 法人情報を取得
  const { data: org } = await (supabase
    .from('organizations') as SupabaseAny)
    .select('id')
    .limit(1)
    .single()

  const { data, error } = await (supabase
    .from('applications') as SupabaseAny)
    .insert({
      subsidy_id: subsidyId,
      location_id: locationId,
      organization_id: org?.id || null,
      status: 'discovered',
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/subsidies')
  revalidatePath('/applications')
  return { data }
}
