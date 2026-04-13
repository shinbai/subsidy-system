import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import {
  Document, Packer, Paragraph, TextRun,
  HeadingLevel, AlignmentType, Footer, PageNumber,
  Header,
} from 'docx'
import type { TemplateSection } from '@/lib/supabase/types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SA = any

interface Props {
  params: Promise<{ id: string }>
}

export async function GET(_request: Request, { params }: Props) {
  try {
    const { id } = await params
    const supabase = await createServerSupabaseClient()

    // ドラフト取得
    const { data: draft } = await (supabase.from('drafts') as SA)
      .select('*, subsidies ( name, authority )')
      .eq('id', id)
      .single()

    if (!draft) {
      return NextResponse.json({ error: 'ドラフトが見つかりません' }, { status: 404 })
    }

    // テンプレート取得
    const { data: template } = await (supabase.from('draft_templates') as SA)
      .select('*')
      .eq('id', draft.template_id)
      .single()

    // 法人情報
    const { data: org } = await (supabase.from('organizations') as SA)
      .select('name, representative')
      .limit(1)
      .single()

    const content = (draft.final_content || draft.generated_content || {}) as Record<string, string>
    const sections = (template?.sections || []) as TemplateSection[]

    const today = new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })

    // Word文書を生成
    const doc = new Document({
      sections: [
        {
          headers: {
            default: new Header({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `${draft.subsidies?.name || '申請書'} | ${org?.name || '株式会社Gold Phoenix'}`,
                      size: 16,
                      color: '888888',
                    }),
                  ],
                  alignment: AlignmentType.RIGHT,
                }),
              ],
            }),
          },
          footers: {
            default: new Footer({
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({
                      children: [PageNumber.CURRENT],
                      size: 16,
                      color: '888888',
                    }),
                  ],
                }),
              ],
            }),
          },
          children: [
            // タイトル
            new Paragraph({
              children: [
                new TextRun({
                  text: draft.subsidies?.name || '申請書',
                  bold: true,
                  size: 32,
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 200 },
            }),
            // 事業者名
            new Paragraph({
              children: [
                new TextRun({
                  text: `事業者名: ${org?.name || '株式会社Gold Phoenix'}`,
                  size: 22,
                }),
              ],
              alignment: AlignmentType.RIGHT,
              spacing: { after: 100 },
            }),
            // 申請日
            new Paragraph({
              children: [
                new TextRun({
                  text: `申請日: ${today}`,
                  size: 22,
                }),
              ],
              alignment: AlignmentType.RIGHT,
              spacing: { after: 400 },
            }),
            // 各セクション
            ...sections.flatMap((section) => {
              const sectionContent = content[section.id] || ''
              return [
                new Paragraph({
                  text: section.title,
                  heading: HeadingLevel.HEADING_2,
                  spacing: { before: 300, after: 150 },
                }),
                ...sectionContent.split('\n').map(
                  (line) =>
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: line,
                          size: 22,
                        }),
                      ],
                      spacing: { after: 100 },
                    })
                ),
              ]
            }),
          ],
        },
      ],
    })

    const buffer = await Packer.toBuffer(doc)
    const uint8 = new Uint8Array(buffer)

    return new NextResponse(uint8, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(draft.title || '申請書')}.docx"`,
      },
    })
  } catch (error) {
    console.error('Word出力エラー:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Word出力に失敗しました' },
      { status: 500 }
    )
  }
}
