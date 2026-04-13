// Resendを使ったメール通知送信
import { Resend } from 'resend'

interface EmailNotifyOptions {
  subject: string
  htmlBody: string
  to?: string // 省略時は環境変数のデフォルトメールアドレスに送信
}

/**
 * Resendでメールを送信
 */
export async function sendEmailNotification({ subject, htmlBody, to }: EmailNotifyOptions): Promise<{
  success: boolean
  error?: string
}> {
  const apiKey = process.env.RESEND_API_KEY
  const targetEmail = to || process.env.NOTIFICATION_EMAIL

  if (!apiKey) {
    return { success: false, error: 'RESEND_API_KEY が設定されていません' }
  }
  if (!targetEmail) {
    return { success: false, error: 'NOTIFICATION_EMAIL が設定されていません' }
  }

  try {
    const resend = new Resend(apiKey)
    const { error } = await resend.emails.send({
      from: '補助金管理システム <noreply@dance-grand.com>',
      to: targetEmail,
      subject,
      html: htmlBody,
    })

    if (error) {
      return { success: false, error: `Resend error: ${error.message}` }
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: `メール送信エラー: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

/**
 * 補助金締切アラートのHTMLメールを構築
 */
export function buildDeadlineEmailHtml(params: {
  daysLeft: number
  subsidyName: string
  authority: string
  maxAmount: number | null
  deadline: string
  sourceUrl?: string | null
}): { subject: string; html: string } {
  const { daysLeft, subsidyName, authority, maxAmount, deadline, sourceUrl } = params

  const amountStr = maxAmount
    ? maxAmount >= 10000
      ? `${(maxAmount / 10000).toLocaleString()}万円`
      : `${maxAmount.toLocaleString()}円`
    : '不明'

  const urgencyLabel = daysLeft <= 1 ? '明日締切' : daysLeft <= 7 ? '今週締切' : `${daysLeft}日後に締切`
  const urgencyColor = daysLeft <= 1 ? '#DC2626' : daysLeft <= 7 ? '#EA580C' : '#1E3A8A'

  const subject = `【${urgencyLabel}】${subsidyName}`

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #F8FAFC; padding: 32px;">
  <div style="max-width: 560px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <!-- ヘッダー -->
    <div style="background: ${urgencyColor}; color: white; padding: 20px 24px;">
      <h1 style="margin: 0; font-size: 16px; font-weight: 600;">補助金締切アラート</h1>
      <p style="margin: 8px 0 0; font-size: 24px; font-weight: bold;">${urgencyLabel}</p>
    </div>

    <!-- 本文 -->
    <div style="padding: 24px;">
      <h2 style="margin: 0 0 16px; font-size: 18px; color: #111827;">${subsidyName}</h2>

      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tr>
          <td style="padding: 8px 0; color: #6B7280; width: 100px;">発行機関</td>
          <td style="padding: 8px 0; color: #111827; font-weight: 500;">${authority}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6B7280;">上限金額</td>
          <td style="padding: 8px 0; color: #111827; font-weight: 500;">${amountStr}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6B7280;">締切日</td>
          <td style="padding: 8px 0; color: ${urgencyColor}; font-weight: 700;">${deadline}</td>
        </tr>
      </table>

      ${sourceUrl ? `
      <div style="margin-top: 20px;">
        <a href="${sourceUrl}" style="display: inline-block; background: #1E3A8A; color: white; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 500;">
          詳細を確認する →
        </a>
      </div>
      ` : ''}
    </div>

    <!-- フッター -->
    <div style="padding: 16px 24px; border-top: 1px solid #E5E7EB; font-size: 12px; color: #9CA3AF;">
      株式会社Gold Phoenix / DANCE GRAND Harajuku<br>
      補助金・助成金管理システム
    </div>
  </div>
</body>
</html>`

  return { subject, html }
}
