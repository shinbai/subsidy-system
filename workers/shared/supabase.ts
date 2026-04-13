// Cloudflare Workers向け Supabase REST APIヘルパー

interface Env {
  SUPABASE_URL: string
  SUPABASE_SERVICE_ROLE_KEY: string
}

interface SubsidyInsert {
  name: string
  official_name?: string
  category: 'subsidy' | 'grant' | 'loan'
  authority: string
  authority_url?: string
  target_area?: string
  target_industry?: string[]
  target_size?: string[]
  purpose?: string[]
  max_amount?: number | null
  application_deadline?: string | null
  status?: string
  requirements?: string
  source_url?: string
  is_manually_added: boolean
  last_scraped_at: string
}

/**
 * 補助金データをupsert（source_urlで重複チェック）
 */
export async function upsertSubsidy(env: Env, data: SubsidyInsert): Promise<{ success: boolean; action: 'inserted' | 'updated' | 'skipped'; error?: string }> {
  const headers = {
    'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
    'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal',
  }

  // source_urlで既存レコードを検索
  if (data.source_url) {
    const checkRes = await fetch(
      `${env.SUPABASE_URL}/rest/v1/subsidies?source_url=eq.${encodeURIComponent(data.source_url)}&select=id`,
      { headers }
    )
    const existing = await checkRes.json() as { id: string }[]

    if (existing.length > 0) {
      // UPDATE
      const updateRes = await fetch(
        `${env.SUPABASE_URL}/rest/v1/subsidies?id=eq.${existing[0].id}`,
        {
          method: 'PATCH',
          headers,
          body: JSON.stringify({
            name: data.name,
            official_name: data.official_name,
            authority: data.authority,
            max_amount: data.max_amount,
            application_deadline: data.application_deadline,
            status: data.status,
            requirements: data.requirements,
            last_scraped_at: data.last_scraped_at,
          }),
        }
      )
      if (!updateRes.ok) {
        return { success: false, action: 'updated', error: await updateRes.text() }
      }
      return { success: true, action: 'updated' }
    }
  }

  // INSERT
  const insertRes = await fetch(
    `${env.SUPABASE_URL}/rest/v1/subsidies`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    }
  )

  if (!insertRes.ok) {
    return { success: false, action: 'inserted', error: await insertRes.text() }
  }
  return { success: true, action: 'inserted' }
}

/**
 * スクレイピング結果のレポートをLINEに送信
 */
export async function sendScraperReport(
  lineToken: string,
  lineUserId: string,
  report: { source: string; inserted: number; updated: number; errors: number }
): Promise<void> {
  if (!lineToken || !lineUserId) return

  const message = `【スクレイピング完了】\n📡 ${report.source}\n✅ 新規: ${report.inserted}件\n🔄 更新: ${report.updated}件\n${report.errors > 0 ? `❌ エラー: ${report.errors}件` : ''}`

  await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${lineToken}`,
    },
    body: JSON.stringify({
      to: lineUserId,
      messages: [{ type: 'text', text: message }],
    }),
  })
}
