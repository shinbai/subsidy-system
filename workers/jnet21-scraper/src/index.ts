/**
 * J-Net21 補助金・助成金スクレイパー
 * 対象: https://j-net21.smrj.go.jp/snavi/support/
 * Cloudflare Workers + Cron Triggers（毎日AM6時JST実行）
 */

import { upsertSubsidy, sendScraperReport } from '../../shared/supabase'

interface Env {
  SUPABASE_URL: string
  SUPABASE_SERVICE_ROLE_KEY: string
  LINE_CHANNEL_ACCESS_TOKEN?: string
  NOTIFICATION_LINE_USER_ID?: string
}

interface ScrapedSubsidy {
  name: string
  authority: string
  target_area: string
  max_amount: number | null
  deadline: string | null
  source_url: string
  requirements: string
}

/**
 * J-Net21の補助金一覧ページをスクレイピング
 */
async function scrapeJNet21(): Promise<ScrapedSubsidy[]> {
  const url = 'https://j-net21.smrj.go.jp/snavi/support/'
  const results: ScrapedSubsidy[] = []

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SubsidyBot/1.0)',
      },
    })

    if (!response.ok) {
      console.error(`J-Net21 fetch failed: ${response.status}`)
      return results
    }

    const html = await response.text()

    // HTMLパース（簡易的な正規表現ベース）
    // 補助金リストアイテムを抽出
    const itemRegex = /<div class="snavi-support-item"[\s\S]*?<\/div>\s*<\/div>/g
    const items = html.match(itemRegex) || []

    for (const item of items) {
      try {
        // タイトル
        const titleMatch = item.match(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/)
        if (!titleMatch) continue

        const sourceUrl = titleMatch[1].startsWith('http')
          ? titleMatch[1]
          : `https://j-net21.smrj.go.jp${titleMatch[1]}`
        const name = titleMatch[2].replace(/<[^>]*>/g, '').trim()

        // 発行機関
        const authorityMatch = item.match(/実施機関[：:]?\s*([\s\S]*?)(?:<\/|$)/)
        const authority = authorityMatch
          ? authorityMatch[1].replace(/<[^>]*>/g, '').trim()
          : '不明'

        // 対象エリア
        const areaMatch = item.match(/対象地域[：:]?\s*([\s\S]*?)(?:<\/|$)/)
        const target_area = areaMatch
          ? areaMatch[1].replace(/<[^>]*>/g, '').trim()
          : '全国'

        // 金額
        const amountMatch = item.match(/(\d[\d,]*)万円/)
        const max_amount = amountMatch
          ? parseInt(amountMatch[1].replace(/,/g, '')) * 10000
          : null

        // 締切日
        const deadlineMatch = item.match(/(\d{4})[\/年](\d{1,2})[\/月](\d{1,2})日?/)
        const deadline = deadlineMatch
          ? `${deadlineMatch[1]}-${deadlineMatch[2].padStart(2, '0')}-${deadlineMatch[3].padStart(2, '0')}`
          : null

        results.push({
          name,
          authority,
          target_area,
          max_amount,
          deadline,
          source_url: sourceUrl,
          requirements: '',
        })
      } catch (e) {
        console.error('パースエラー:', e)
      }
    }
  } catch (error) {
    console.error('J-Net21スクレイピングエラー:', error)
  }

  return results
}

export default {
  // Cron Trigger ハンドラー
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    console.log('J-Net21スクレイピング開始:', new Date().toISOString())

    const subsidies = await scrapeJNet21()
    console.log(`${subsidies.length}件の補助金を取得`)

    let inserted = 0
    let updated = 0
    let errors = 0

    for (const subsidy of subsidies) {
      const result = await upsertSubsidy(env, {
        name: subsidy.name,
        category: 'subsidy',
        authority: subsidy.authority,
        target_area: subsidy.target_area,
        max_amount: subsidy.max_amount,
        application_deadline: subsidy.deadline,
        source_url: subsidy.source_url,
        requirements: subsidy.requirements,
        status: 'open',
        is_manually_added: false,
        last_scraped_at: new Date().toISOString(),
      })

      if (result.success) {
        if (result.action === 'inserted') inserted++
        if (result.action === 'updated') updated++
      } else {
        errors++
        console.error(`upsertエラー: ${subsidy.name}`, result.error)
      }
    }

    // レポート送信
    if (env.LINE_CHANNEL_ACCESS_TOKEN && env.NOTIFICATION_LINE_USER_ID) {
      await sendScraperReport(
        env.LINE_CHANNEL_ACCESS_TOKEN,
        env.NOTIFICATION_LINE_USER_ID,
        { source: 'J-Net21', inserted, updated, errors }
      )
    }

    console.log(`完了 - 新規:${inserted} 更新:${updated} エラー:${errors}`)
  },

  // HTTPリクエストでの手動実行用
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // scheduled と同じ処理を実行
    const subsidies = await scrapeJNet21()

    let inserted = 0, updated = 0, errors = 0

    for (const subsidy of subsidies) {
      const result = await upsertSubsidy(env, {
        name: subsidy.name,
        category: 'subsidy',
        authority: subsidy.authority,
        target_area: subsidy.target_area,
        max_amount: subsidy.max_amount,
        application_deadline: subsidy.deadline,
        source_url: subsidy.source_url,
        requirements: subsidy.requirements,
        status: 'open',
        is_manually_added: false,
        last_scraped_at: new Date().toISOString(),
      })

      if (result.success) {
        if (result.action === 'inserted') inserted++
        if (result.action === 'updated') updated++
      } else {
        errors++
      }
    }

    return new Response(JSON.stringify({
      source: 'J-Net21',
      scraped: subsidies.length,
      inserted,
      updated,
      errors,
    }), {
      headers: { 'Content-Type': 'application/json' },
    })
  },
}
