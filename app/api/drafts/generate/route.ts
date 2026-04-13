import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { SYSTEM_PROMPT, buildSectionPrompt } from '@/lib/claude/prompts'
import type { TemplateSection, Organization, Location } from '@/lib/supabase/types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SA = any

export async function POST(request: Request) {
  try {
    const { draftId, sectionId } = await request.json() as {
      draftId: string
      sectionId?: string // 指定時は単一セクション再生成
    }

    const supabase = await createServerSupabaseClient()

    // ドラフト情報取得
    const { data: draft } = await (supabase.from('drafts') as SA)
      .select('*')
      .eq('id', draftId)
      .single()

    if (!draft) {
      return NextResponse.json({ error: 'ドラフトが見つかりません' }, { status: 404 })
    }

    // テンプレート取得
    const { data: template } = await (supabase.from('draft_templates') as SA)
      .select('*')
      .eq('id', draft.template_id)
      .single()

    if (!template) {
      return NextResponse.json({ error: 'テンプレートが見つかりません' }, { status: 404 })
    }

    // 補助金情報
    const { data: subsidy } = await (supabase.from('subsidies') as SA)
      .select('*')
      .eq('id', draft.subsidy_id)
      .single()

    // 法人・拠点情報
    const { data: org } = await (supabase.from('organizations') as SA)
      .select('*')
      .limit(1)
      .single() as { data: Organization | null }

    // applicationがあればlocation取得
    let location: Location | null = null
    if (draft.application_id) {
      const { data: app } = await (supabase.from('applications') as SA)
        .select('location_id')
        .eq('id', draft.application_id)
        .single()
      if (app?.location_id) {
        const { data: loc } = await (supabase.from('locations') as SA)
          .select('*')
          .eq('id', app.location_id)
          .single()
        location = loc
      }
    }
    if (!location) {
      const { data: loc } = await (supabase.from('locations') as SA)
        .select('*')
        .eq('is_active', true)
        .limit(1)
        .single()
      location = loc
    }

    // Claude APIクライアント
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    })

    // 生成対象セクションの決定
    const sections = template.sections as TemplateSection[]
    const targetSections = sectionId
      ? sections.filter(s => s.id === sectionId)
      : sections

    if (targetSections.length === 0) {
      return NextResponse.json({ error: 'セクションが見つかりません' }, { status: 404 })
    }

    // 既存の生成コンテンツ
    const existingContent = (draft.generated_content || {}) as Record<string, string>
    const generatedContent: Record<string, string> = { ...existingContent }

    // 各セクションを生成
    for (const section of targetSections) {
      const prompt = buildSectionPrompt({
        sectionTitle: section.title,
        sectionHint: section.prompt_hint,
        maxChars: section.max_chars,
        subsidyName: subsidy?.name || '補助金',
        orgName: org?.name || '株式会社Gold Phoenix',
        orgIndustry: org?.industry || '社交ダンス教室',
        orgRepresentative: org?.representative || '',
        orgEmployees: org?.employee_count || 5,
        orgCapital: org?.capital_amount || 3000000,
        locationName: location?.name || 'DANCE GRAND Harajuku',
        locationAddress: location?.address || '東京都渋谷区',
        userInputs: (draft.input_data || {}) as Record<string, string>,
      })

      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: prompt }],
      })

      // テキストコンテンツを抽出
      const textContent = message.content
        .filter(block => block.type === 'text')
        .map(block => block.type === 'text' ? block.text : '')
        .join('')

      generatedContent[section.id] = textContent
    }

    // DBに保存
    await (supabase.from('drafts') as SA)
      .update({
        generated_content: generatedContent,
        generation_count: (draft.generation_count || 0) + 1,
      })
      .eq('id', draftId)

    return NextResponse.json({
      ok: true,
      generated_content: generatedContent,
      sections_generated: targetSections.map(s => s.id),
    })
  } catch (error) {
    console.error('生成エラー:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '生成に失敗しました' },
      { status: 500 }
    )
  }
}
