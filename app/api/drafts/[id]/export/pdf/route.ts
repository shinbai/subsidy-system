import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { TemplateSection } from '@/lib/supabase/types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SA = any

interface Props {
  params: Promise<{ id: string }>
}

// PDF用のHTMLを生成して返す（ブラウザ側でwindow.print()によるPDF出力を想定）
export async function GET(_request: Request, { params }: Props) {
  try {
    const { id } = await params
    const supabase = await createServerSupabaseClient()

    const { data: draft } = await (supabase.from('drafts') as SA)
      .select('*, subsidies ( name, authority )')
      .eq('id', id)
      .single()

    if (!draft) {
      return NextResponse.json({ error: 'ドラフトが見つかりません' }, { status: 404 })
    }

    const { data: template } = await (supabase.from('draft_templates') as SA)
      .select('*')
      .eq('id', draft.template_id)
      .single()

    const { data: org } = await (supabase.from('organizations') as SA)
      .select('name, representative')
      .limit(1)
      .single()

    const content = (draft.final_content || draft.generated_content || {}) as Record<string, string>
    const sections = (template?.sections || []) as TemplateSection[]
    const today = new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })

    // PDF印刷用HTML
    const html = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>${draft.subsidies?.name || '申請書'}</title>
  <style>
    @page { size: A4; margin: 25mm 20mm; }
    body { font-family: "游明朝", "YuMincho", "MS 明朝", serif; font-size: 11pt; line-height: 1.8; color: #111; }
    .header { text-align: right; font-size: 9pt; color: #666; margin-bottom: 20px; }
    h1 { text-align: center; font-size: 16pt; margin: 30px 0 10px; }
    .meta { text-align: right; font-size: 10pt; margin-bottom: 30px; }
    h2 { font-size: 12pt; border-bottom: 1px solid #333; padding-bottom: 4px; margin: 24px 0 12px; }
    p { margin: 0 0 8px; text-align: justify; }
    .footer { position: fixed; bottom: 0; width: 100%; text-align: center; font-size: 9pt; color: #999; }
    @media print { .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="no-print" style="background:#1E3A8A;color:white;padding:12px 20px;margin:-8px -8px 20px;text-align:center;">
    <button onclick="window.print()" style="background:white;color:#1E3A8A;border:none;padding:8px 24px;border-radius:6px;font-size:14px;cursor:pointer;font-weight:bold;">
      PDFとして保存 (Ctrl+P)
    </button>
  </div>

  <div class="header">${draft.subsidies?.name || ''} | ${org?.name || '株式会社Gold Phoenix'}</div>

  <h1>${draft.subsidies?.name || '申請書'}</h1>
  <div class="meta">
    事業者名: ${org?.name || '株式会社Gold Phoenix'}<br>
    申請日: ${today}
  </div>

  ${sections.map(section => {
    const text = (content[section.id] || '').replace(/\n/g, '<br>')
    return `<h2>${section.title}</h2><p>${text}</p>`
  }).join('\n')}
</body>
</html>`

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  } catch (error) {
    console.error('PDF出力エラー:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'PDF出力に失敗しました' },
      { status: 500 }
    )
  }
}
