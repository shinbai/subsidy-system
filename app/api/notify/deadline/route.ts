import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { sendLineNotification, buildDeadlineMessage } from '@/lib/line/notify'
import { sendEmailNotification, buildDeadlineEmailHtml } from '@/lib/resend/notify'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SA = any

// Vercel Cron Jobs から毎日AM9時(JST)に呼び出される
// vercel.json: "0 0 * * *" (UTC 0:00 = JST 9:00)

// 通知対象の日数
const DEADLINE_DAYS = [30, 7, 1]

// 通知タイプの判定
function getNotificationType(daysLeft: number): 'deadline_30d' | 'deadline_7d' | 'deadline_1d' {
  if (daysLeft <= 1) return 'deadline_1d'
  if (daysLeft <= 7) return 'deadline_7d'
  return 'deadline_30d'
}

export async function GET(request: Request) {
  try {
    // Vercel Cron認証ヘッダーの検証（本番環境のみ）
    const authHeader = request.headers.get('authorization')
    if (
      process.env.CRON_SECRET &&
      authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServiceRoleClient()
    const now = new Date()
    const results: { subsidy: string; type: string; channels: string[]; success: boolean }[] = []

    for (const days of DEADLINE_DAYS) {
      // 締切がちょうどN日後の補助金を検索
      const targetDate = new Date(now)
      targetDate.setDate(targetDate.getDate() + days)
      const targetDateStr = targetDate.toISOString().split('T')[0]

      const { data: subsidies } = await (supabase
        .from('subsidies') as SA)
        .select('id, name, authority, max_amount, application_deadline, source_url')
        .eq('status', 'open')
        .eq('application_deadline', targetDateStr)

      if (!subsidies || subsidies.length === 0) continue

      for (const subsidy of subsidies) {
        const notificationType = getNotificationType(days)

        // 重複チェック: 同じ補助金・同じ通知タイプが今日送信済みか
        const todayStart = now.toISOString().split('T')[0]
        const { data: existingNotification } = await (supabase
          .from('notifications') as SA)
          .select('id')
          .eq('subsidy_id', subsidy.id)
          .eq('type', notificationType)
          .gte('sent_at', `${todayStart}T00:00:00Z`)
          .limit(1)

        if (existingNotification && existingNotification.length > 0) {
          continue // 既に送信済み
        }

        const channels: string[] = []

        // LINE通知
        const lineMessage = buildDeadlineMessage({
          daysLeft: days,
          subsidyName: subsidy.name,
          authority: subsidy.authority,
          maxAmount: subsidy.max_amount,
          deadline: subsidy.application_deadline!,
          detailUrl: subsidy.source_url || undefined,
        })

        const lineResult = await sendLineNotification({ message: lineMessage })
        if (lineResult.success) channels.push('line')

        // 通知ログ (LINE)
        await (supabase.from('notifications') as SA).insert({
          subsidy_id: subsidy.id,
          type: notificationType,
          channel: 'line',
          success: lineResult.success,
          message: lineResult.success ? lineMessage : lineResult.error,
        })

        // メール通知
        const { subject, html } = buildDeadlineEmailHtml({
          daysLeft: days,
          subsidyName: subsidy.name,
          authority: subsidy.authority,
          maxAmount: subsidy.max_amount,
          deadline: subsidy.application_deadline!,
          sourceUrl: subsidy.source_url,
        })

        const emailResult = await sendEmailNotification({ subject, htmlBody: html })
        if (emailResult.success) channels.push('email')

        // 通知ログ (メール)
        await (supabase.from('notifications') as SA).insert({
          subsidy_id: subsidy.id,
          type: notificationType,
          channel: 'email',
          success: emailResult.success,
          message: emailResult.success ? subject : emailResult.error,
        })

        results.push({
          subsidy: subsidy.name,
          type: notificationType,
          channels,
          success: channels.length > 0,
        })
      }
    }

    return NextResponse.json({
      ok: true,
      timestamp: now.toISOString(),
      notifications_sent: results.length,
      results,
    })
  } catch (error) {
    console.error('通知処理エラー:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '通知処理に失敗しました' },
      { status: 500 }
    )
  }
}
