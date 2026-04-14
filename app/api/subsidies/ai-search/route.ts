import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { AI_SEARCH_SYSTEM_PROMPT, buildSearchPrompt } from '@/lib/claude/prompts'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SA = any

// AI補助金探索結果の型
interface AiSearchResult {
  name: string
  authority: string
  category: 'subsidy' | 'grant' | 'loan'
  target_area: string | null
  max_amount: number | null
  subsidy_rate: number | null
  purpose: string[]
  requirements: string | null
  source_url: string | null
  reason: string
}

export async function POST() {
  try {
    const supabase = await createServerSupabaseClient()

    // 法人情報と拠点情報を並列取得
    const [{ data: org }, { data: locations }] = await Promise.all([
      (supabase.from('organizations') as SA)
        .select('*')
        .limit(1)
        .single(),
      (supabase.from('locations') as SA)
        .select('name, address')
        .eq('is_active', true),
    ])

    // Claude APIクライアント
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    })

    const userPrompt = buildSearchPrompt({
      orgName: org?.name || '株式会社Gold Phoenix',
      orgIndustry: org?.industry || '社交ダンス教室',
      orgEmployees: org?.employee_count || 5,
      orgCapital: org?.capital_amount || 3000000,
      locations: (locations || []) as { name: string; address: string }[],
    })

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      system: AI_SEARCH_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    })

    // テキストコンテンツを抽出
    const rawResponse = message.content
      .filter(block => block.type === 'text')
      .map(block => block.type === 'text' ? block.text : '')
      .join('')

    // JSONパース（コードブロック対応）
    let subsidies: AiSearchResult[] = []
    try {
      // ```json ... ``` で囲まれている場合の対応
      const jsonMatch = rawResponse.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        subsidies = JSON.parse(jsonMatch[0])
      }
    } catch {
      // JSONパース失敗時はフォールバック
      console.error('AI応答のJSONパース失敗:', rawResponse.slice(0, 200))
      return NextResponse.json(
        { error: 'AIの応答を解析できませんでした。もう一度お試しください。', raw_response: rawResponse },
        { status: 422 }
      )
    }

    // バリデーション: 必須フィールドの確認
    subsidies = subsidies
      .filter(s => s.name && s.authority && s.category)
      .map(s => ({
        name: s.name,
        authority: s.authority,
        category: ['subsidy', 'grant', 'loan'].includes(s.category) ? s.category : 'subsidy',
        target_area: s.target_area || null,
        max_amount: typeof s.max_amount === 'number' ? s.max_amount : null,
        subsidy_rate: typeof s.subsidy_rate === 'number' ? s.subsidy_rate : null,
        purpose: Array.isArray(s.purpose) ? s.purpose : [],
        requirements: s.requirements || null,
        source_url: s.source_url || null,
        reason: s.reason || '',
      }))

    return NextResponse.json({
      subsidies,
      raw_response: rawResponse,
    })
  } catch (error) {
    console.error('AI補助金探索エラー:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'AI探索に失敗しました' },
      { status: 500 }
    )
  }
}
