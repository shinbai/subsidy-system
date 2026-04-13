/**
 * 東京都中小企業振興公社スクレイパー
 * 対象: https://www.tokyo-kosha.or.jp/support/josei/
 */

import { upsertSubsidy, sendScraperReport } from '../../shared/supabase'

interface Env {
  SUPABASE_URL: string
  SUPABASE_SERVICE_ROLE_KEY: string
  LINE_CHANNEL_ACCESS_TOKEN?: string
  NOTIFICATION_LINE_USER_ID?: string
}

async function scrapeTokyoKosha(): Promise<Array<{
  name: string; authority: string; source_url: string;
  max_amount: number | null; deadline: string | null; requirements: string
}>> {
  const url = 'https://www.tokyo-kosha.or.jp/support/josei/'
  const results: Array<{
    name: string; authority: string; source_url: string;
    max_amount: number | null; deadline: string | null; requirements: string
  }> = []

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SubsidyBot/1.0)' },
    })

    if (!response.ok) {
      console.error(`東京都公社 fetch failed: ${response.status}`)
      return results
    }

    const html = await response.text()

    // 助成金リンクを抽出
    const linkRegex = /<a[^>]*href="(\/support\/josei\/[^"]*)"[^>]*>([\s\S]*?)<\/a>/g
    let match

    while ((match = linkRegex.exec(html)) !== null) {
      const href = match[1]
      const name = match[2].replace(/<[^>]*>/g, '').trim()
      if (!name || name.length < 5) continue

      const sourceUrl = `https://www.tokyo-kosha.or.jp${href}`

      // 金額の抽出を試みる
      const amountMatch = name.match(/(\d[\d,]*)万円/)
      const max_amount = amountMatch
        ? parseInt(amountMatch[1].replace(/,/g, '')) * 10000
        : null

      results.push({
        name: name.replace(/\s+/g, ' '),
        authority: '東京都中小企業振興公社',
        source_url: sourceUrl,
        max_amount,
        deadline: null,
        requirements: '',
      })
    }
  } catch (error) {
    console.error('東京都公社スクレイピングエラー:', error)
  }

  return results
}

export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    console.log('東京都公社スクレイピング開始')
    const subsidies = await scrapeTokyoKosha()

    let inserted = 0, updated = 0, errors = 0

    for (const subsidy of subsidies) {
      const result = await upsertSubsidy(env, {
        name: subsidy.name,
        category: 'subsidy',
        authority: subsidy.authority,
        target_area: '東京都',
        target_industry: ['全業種'],
        target_size: ['中小企業'],
        max_amount: subsidy.max_amount,
        application_deadline: subsidy.deadline,
        source_url: subsidy.source_url,
        requirements: subsidy.requirements,
        status: 'open',
        is_manually_added: false,
        last_scraped_at: new Date().toISOString(),
      })

      if (result.success) {
        result.action === 'inserted' ? inserted++ : updated++
      } else {
        errors++
      }
    }

    if (env.LINE_CHANNEL_ACCESS_TOKEN && env.NOTIFICATION_LINE_USER_ID) {
      await sendScraperReport(env.LINE_CHANNEL_ACCESS_TOKEN, env.NOTIFICATION_LINE_USER_ID,
        { source: '東京都中小企業振興公社', inserted, updated, errors })
    }
  },

  async fetch(request: Request, env: Env): Promise<Response> {
    const subsidies = await scrapeTokyoKosha()
    return new Response(JSON.stringify({ source: '東京都公社', scraped: subsidies.length }), {
      headers: { 'Content-Type': 'application/json' },
    })
  },
}
