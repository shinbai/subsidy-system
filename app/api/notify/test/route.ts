import { NextResponse } from 'next/server'
import { sendLineNotification } from '@/lib/line/notify'
import { sendEmailNotification } from '@/lib/resend/notify'

// テスト通知を送信するAPIエンドポイント
export async function POST(request: Request) {
  try {
    const { channel } = await request.json() as { channel: 'line' | 'email' | 'both' }

    const results: { channel: string; success: boolean; error?: string }[] = []

    if (channel === 'line' || channel === 'both') {
      const lineResult = await sendLineNotification({
        message: '【テスト通知】\n\n補助金・助成金管理システムからのテスト通知です。\nこの通知が届いていれば、LINE連携は正常に動作しています。',
      })
      results.push({ channel: 'line', ...lineResult })
    }

    if (channel === 'email' || channel === 'both') {
      const emailResult = await sendEmailNotification({
        subject: '【テスト】補助金管理システム通知テスト',
        htmlBody: `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family: Arial, sans-serif; padding: 32px; background: #F8FAFC;">
  <div style="max-width: 480px; margin: 0 auto; background: white; padding: 24px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <h1 style="font-size: 18px; color: #1E3A8A; margin: 0 0 16px;">テスト通知</h1>
    <p style="font-size: 14px; color: #374151; line-height: 1.6;">
      補助金・助成金管理システムからのテスト通知です。<br>
      このメールが届いていれば、メール連携は正常に動作しています。
    </p>
    <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #E5E7EB; font-size: 12px; color: #9CA3AF;">
      株式会社Gold Phoenix / DANCE GRAND Harajuku
    </div>
  </div>
</body>
</html>`,
      })
      results.push({ channel: 'email', ...emailResult })
    }

    return NextResponse.json({ results })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'テスト送信に失敗しました' },
      { status: 500 }
    )
  }
}
