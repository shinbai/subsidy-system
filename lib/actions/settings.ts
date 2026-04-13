'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SA = any

// 法人プロフィール更新
export async function updateOrganization(id: string, data: {
  name?: string
  representative?: string
  industry?: string
  employee_count?: number | null
  capital_amount?: number | null
  annual_revenue?: number | null
  established_date?: string | null
  postal_code?: string | null
  address?: string | null
  phone?: string | null
  email?: string | null
  invoice_number?: string | null
}) {
  const supabase = await createServerSupabaseClient()
  const { error } = await (supabase.from('organizations') as SA).update(data).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/settings/organization')
  return { success: true }
}

// 拠点追加
export async function createLocation(data: {
  organization_id: string
  name: string
  branch_name?: string
  address?: string
  city?: string
  ward?: string
  prefecture?: string
  postal_code?: string
  employee_count?: number
  notes?: string
}) {
  const supabase = await createServerSupabaseClient()
  const { error } = await (supabase.from('locations') as SA).insert(data)
  if (error) return { error: error.message }
  revalidatePath('/settings/locations')
  return { success: true }
}

// 拠点更新
export async function updateLocation(id: string, data: {
  name?: string
  branch_name?: string
  address?: string
  city?: string
  ward?: string
  prefecture?: string
  postal_code?: string
  employee_count?: number
  is_active?: boolean
  notes?: string
}) {
  const supabase = await createServerSupabaseClient()
  const { error } = await (supabase.from('locations') as SA).update(data).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/settings/locations')
  return { success: true }
}
