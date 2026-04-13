/**
 * 厚生労働省 雇用関連助成金スクレイパー
 * 対象: https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/koyou_roudou/
 */

import { upsertSubsidy, sendScraperReport } from '../../shared/supabase'

interface Env {
  SUPABASE_URL: string
  SUPABASE_SERVICE_ROLE_KEY: string
  LINE_CHANNEL_ACCESS_TOKEN?: string
  NOTIFICATION_LINE_USER_ID?: string
}

// 厚労省の主要助成金を定義（ページ構造が複雑なため、既知の助成金リストベース）
const KNOWN_GRANTS = [
  {
    name: 'キャリアアップ助成金',
    source_url: 'https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/koyou_roudou/part_haken/jigyounushi/career.html',
    purpose: ['雇用'],
    max_amount: 800000,
  },
  {
    name: '人材開発支援助成金',
    source_url: 'https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/koyou_roudou/koyou/kyufukin/d01-1.html',
    purpose: ['雇用', '研修'],
    max_amount: null,
  },
  {
    name: '人材確保等支援助成金',
    source_url: 'https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/0000199292.html',
    purpose: ['雇用'],
    max_amount: null,
  },
  {
    name: '両立支援等助成金',
    source_url: 'https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/kodomo/shokuba_kosodate/ryouritsu01/index.html',
    purpose: ['雇用'],
    max_amount: null,
  },
  {
    name: '働き方改革推進支援助成金',
    source_url: 'https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/0000120692.html',
    purpose: ['雇用'],
    max_amount: null,
  },
]

async function scrapeMHLW(): Promise<typeof KNOWN_GRANTS> {
  // 各助成金のページにアクセスして公募状態を確認
  const results = []

  for (const grant of KNOWN_GRANTS) {
    try {
      const res = await fetch(grant.source_url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SubsidyBot/1.0)' },
      })

      if (res.ok) {
        // ページが存在=公募中と判定
        results.push(grant)
      }
    } catch {
      // アクセスエラーは無視
    }
  }

  return results
}

export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    console.log('厚労省スクレイピング開始')
    const grants = await scrapeMHLW()

    let inserted = 0, updated = 0, errors = 0

    for (const grant of grants) {
      const result = await upsertSubsidy(env, {
        name: grant.name,
        category: 'grant',
        authority: '厚生労働省',
        target_area: '全国',
        target_industry: ['全業種'],
        target_size: ['全規模'],
        purpose: grant.purpose,
        max_amount: grant.max_amount,
        source_url: grant.source_url,
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
        { source: '厚生労働省', inserted, updated, errors })
    }
  },

  async fetch(request: Request, env: Env): Promise<Response> {
    const grants = await scrapeMHLW()
    return new Response(JSON.stringify({ source: '厚生労働省', scraped: grants.length }), {
      headers: { 'Content-Type': 'application/json' },
    })
  },
}
