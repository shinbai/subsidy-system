import Anthropic from '@anthropic-ai/sdk'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { CHAT_SYSTEM_PROMPT } from '@/lib/claude/prompts'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SA = any

export async function POST(request: Request) {
  try {
    const { messages, subsidyId } = await request.json() as {
      messages: { role: 'user' | 'assistant'; content: string }[]
      subsidyId?: string
    }

    if (!messages || messages.length === 0) {
      return new Response('メッセージが必要です', { status: 400 })
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    })

    // コンテキスト構築
    let systemPrompt = CHAT_SYSTEM_PROMPT

    if (subsidyId) {
      const supabase = await createServerSupabaseClient()

      // 補助金情報を取得
      const { data: subsidy } = await (supabase.from('subsidies') as SA)
        .select('*')
        .eq('id', subsidyId)
        .single()

      if (subsidy) {
        systemPrompt += `\n\n【現在選択中の補助金情報】
- 補助金名: ${subsidy.name}
- 発行機関: ${subsidy.authority}
- カテゴリ: ${subsidy.category}
- 対象地域: ${subsidy.target_area || '不明'}
- 上限額: ${subsidy.max_amount ? `${(subsidy.max_amount as number).toLocaleString()}円` : '不明'}
- 補助率: ${subsidy.subsidy_rate ? `${(subsidy.subsidy_rate as number) * 100}%` : '不明'}
- 申請要件: ${subsidy.requirements || '不明'}
- 備考: ${subsidy.notes || 'なし'}`
      }

      // ナレッジベースから関連情報取得
      const { data: knowledge } = await (supabase.from('knowledge') as SA)
        .select('title, content, result')
        .eq('subsidy_id', subsidyId)
        .limit(3)

      if (knowledge && knowledge.length > 0) {
        systemPrompt += '\n\n【関連するナレッジ】'
        for (const k of knowledge as { title: string; content: string; result: string }[]) {
          systemPrompt += `\n- ${k.title}（${k.result}）: ${k.content?.slice(0, 200) || ''}`
        }
      }
    }

    // ストリーミング応答
    const stream = anthropic.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: systemPrompt,
      messages: messages,
    })

    const encoder = new TextEncoder()
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === 'content_block_delta' &&
              event.delta.type === 'text_delta'
            ) {
              controller.enqueue(encoder.encode(event.delta.text))
            }
          }
          controller.close()
        } catch (error) {
          console.error('ストリーミングエラー:', error)
          controller.error(error)
        }
      },
    })

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    })
  } catch (error) {
    console.error('チャットエラー:', error)
    return new Response(
      error instanceof Error ? error.message : 'チャット処理に失敗しました',
      { status: 500 }
    )
  }
}
