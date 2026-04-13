// LINE Messaging API を使った通知送信

interface LineNotifyOptions {
  message: string
  userId?: string // 省略時は環境変数のデフォルトユーザーに送信
}

/**
 * LINE Push Messageを送信
 */
export async function sendLineNotification({ message, userId }: LineNotifyOptions): Promise<{
  success: boolean
  error?: string
}> {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN
  const targetUserId = userId || process.env.NOTIFICATION_LINE_USER_ID

  if (!token) {
    return { success: false, error: 'LINE_CHANNEL_ACCESS_TOKEN が設定されていません' }
  }
  if (!targetUserId) {
    return { success: false, error: 'NOTIFICATION_LINE_USER_ID が設定されていません' }
  }

  try {
    const response = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        to: targetUserId,
        messages: [
          {
            type: 'text',
            text: message,
          },
        ],
      }),
    })

    if (!response.ok) {
      const errorBody = await response.text()
      return { success: false, error: `LINE API error: ${response.status} ${errorBody}` }
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: `LINE送信エラー: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

/**
 * 補助金締切アラートメッセージを構築
 */
export function buildDeadlineMessage(params: {
  daysLeft: number
  subsidyName: string
  authority: string
  maxAmount: number | null
  deadline: string
  detailUrl?: string
}): string {
  const { daysLeft, subsidyName, authority, maxAmount, deadline, detailUrl } = params

  const amountStr = maxAmount
    ? maxAmount >= 10000
      ? `${(maxAmount / 10000).toLocaleString()}万`
      : `${maxAmount.toLocaleString()}`
    : '不明'

  const urgencyIcon = daysLeft <= 1 ? '🚨' : daysLeft <= 7 ? '⚠️' : '📢'

  let message = `【補助金締切アラート】\n`
  message += `${urgencyIcon} ${daysLeft}日後に締切\n\n`
  message += `📋 ${subsidyName}\n`
  message += `🏢 ${authority}\n`
  message += `💰 上限: ${amountStr}円\n`
  message += `📅 締切: ${deadline}\n`

  if (detailUrl) {
    message += `\n👉 詳細を確認する\n${detailUrl}`
  }

  return message
}
