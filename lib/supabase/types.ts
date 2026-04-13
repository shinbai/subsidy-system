// Supabase Database 型定義
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          legal_form: string | null
          industry: string | null
          employee_count: number | null
          capital_amount: number | null
          annual_revenue: number | null
          established_date: string | null
          representative: string | null
          postal_code: string | null
          address: string | null
          phone: string | null
          email: string | null
          invoice_number: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['organizations']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['organizations']['Insert']>
      }
      locations: {
        Row: {
          id: string
          organization_id: string | null
          name: string
          branch_name: string | null
          address: string | null
          city: string | null
          ward: string | null
          prefecture: string | null
          postal_code: string | null
          opened_date: string | null
          employee_count: number | null
          is_active: boolean
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['locations']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['locations']['Insert']>
      }
      subsidies: {
        Row: {
          id: string
          name: string
          official_name: string | null
          category: 'subsidy' | 'grant' | 'loan'
          authority: string
          authority_url: string | null
          target_area: string | null
          target_industry: string[] | null
          target_size: string[] | null
          purpose: string[] | null
          max_amount: number | null
          subsidy_rate: number | null
          application_start: string | null
          application_deadline: string | null
          announcement_date: string | null
          round_number: number | null
          status: 'open' | 'closed' | 'upcoming' | 'unknown'
          requirements: string | null
          notes: string | null
          source_url: string | null
          is_manually_added: boolean
          last_scraped_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['subsidies']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['subsidies']['Insert']>
      }
      applications: {
        Row: {
          id: string
          subsidy_id: string | null
          location_id: string | null
          organization_id: string | null
          status: 'discovered' | 'reviewing' | 'applying' | 'reviewing_by_authority' | 'adopted' | 'rejected' | 'received'
          assigned_to: string | null
          application_amount: number | null
          adopted_amount: number | null
          received_amount: number | null
          applied_date: string | null
          result_date: string | null
          received_date: string | null
          rejection_reason: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['applications']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['applications']['Insert']>
      }
      knowledge: {
        Row: {
          id: string
          application_id: string | null
          subsidy_id: string | null
          result: 'adopted' | 'rejected'
          key_points: string | null
          feedback_from_authority: string | null
          lessons_learned: string | null
          effective_phrases: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['knowledge']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['knowledge']['Insert']>
      }
      notifications: {
        Row: {
          id: string
          subsidy_id: string | null
          application_id: string | null
          type: 'deadline_30d' | 'deadline_7d' | 'deadline_1d' | 'status_change'
          channel: 'line' | 'email'
          sent_at: string
          success: boolean
          message: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['notifications']['Row'], 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>
      }
    }
  }
}

// ヘルパー型
export type Organization = Database['public']['Tables']['organizations']['Row']
export type Location = Database['public']['Tables']['locations']['Row']
export type Subsidy = Database['public']['Tables']['subsidies']['Row']
export type Application = Database['public']['Tables']['applications']['Row']
export type Knowledge = Database['public']['Tables']['knowledge']['Row']
export type Notification = Database['public']['Tables']['notifications']['Row']

// ドラフト関連の型（DB非依存で直接定義）
export interface TemplateSection {
  id: string
  title: string
  type: 'textarea'
  prompt_hint: string
  max_chars: number
}

export interface DraftTemplate {
  id: string
  subsidy_id: string | null
  name: string
  description: string | null
  sections: TemplateSection[]
  is_default: boolean
  created_at: string
}

export interface Draft {
  id: string
  application_id: string | null
  subsidy_id: string | null
  template_id: string | null
  title: string
  status: 'draft' | 'in_review' | 'finalized'
  input_data: Record<string, string> | null
  generated_content: Record<string, string> | null
  final_content: Record<string, string> | null
  generation_count: number
  created_by: string | null
  created_at: string
  updated_at: string
}

export const DRAFT_STATUS_LABELS: Record<Draft['status'], string> = {
  draft: '下書き',
  in_review: 'レビュー中',
  finalized: '確定済',
}

// 申請ステータスのラベル定義
export const APPLICATION_STATUS_LABELS: Record<Application['status'], string> = {
  discovered: '発見',
  reviewing: '検討中',
  applying: '申請中',
  reviewing_by_authority: '審査中',
  adopted: '採択',
  rejected: '不採択',
  received: '入金済',
}

// カテゴリラベル
export const CATEGORY_LABELS: Record<Subsidy['category'], string> = {
  subsidy: '補助金',
  grant: '助成金',
  loan: '融資',
}

// ステータスラベル
export const SUBSIDY_STATUS_LABELS: Record<Subsidy['status'], string> = {
  open: '公募中',
  closed: '締切済',
  upcoming: '公募予定',
  unknown: '不明',
}
