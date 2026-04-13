// 補助金の適合判定ロジック
import type { Subsidy, Organization, Location } from '@/lib/supabase/types'

interface EligibilityResult {
  score: number        // 0-100
  maxScore: number     // 60 (6項目×10点)
  level: 'high' | 'medium' | 'low'
  label: string
  stars: number
  details: {
    category: string
    score: number
    maxScore: number
    reason: string
  }[]
}

// 社交ダンス教室にマッチする業種キーワード
const INDUSTRY_KEYWORDS = [
  '社交ダンス', 'ダンス', 'スポーツ', '習い事', '教室',
  'フィットネス', '健康', 'スクール', '全業種', 'サービス業',
  '教育', 'レジャー', '娯楽',
]

/**
 * 補助金の適合スコアを計算
 */
export function calculateEligibility(
  subsidy: Subsidy,
  organization: Organization,
  locations: Location[]
): EligibilityResult {
  const details: EligibilityResult['details'] = []
  let totalScore = 0

  // 1. 業種一致 (10点)
  const industryMatch = checkIndustryMatch(subsidy.target_industry)
  details.push({
    category: '業種一致',
    score: industryMatch.score,
    maxScore: 10,
    reason: industryMatch.reason,
  })
  totalScore += industryMatch.score

  // 2. 規模一致 (10点)
  const sizeMatch = checkSizeMatch(subsidy.target_size, organization)
  details.push({
    category: '規模一致',
    score: sizeMatch.score,
    maxScore: 10,
    reason: sizeMatch.reason,
  })
  totalScore += sizeMatch.score

  // 3. 対象エリア (10点)
  const areaMatch = checkAreaMatch(subsidy.target_area, locations)
  details.push({
    category: '対象エリア',
    score: areaMatch.score,
    maxScore: 10,
    reason: areaMatch.reason,
  })
  totalScore += areaMatch.score

  // 4. 目的一致 (10点)
  const purposeMatch = checkPurposeMatch(subsidy.purpose)
  details.push({
    category: '目的一致',
    score: purposeMatch.score,
    maxScore: 10,
    reason: purposeMatch.reason,
  })
  totalScore += purposeMatch.score

  // 5. ステータス (10点)
  const statusScore = subsidy.status === 'open' ? 10 : subsidy.status === 'upcoming' ? 5 : 0
  details.push({
    category: 'ステータス',
    score: statusScore,
    maxScore: 10,
    reason: subsidy.status === 'open' ? '公募中' : subsidy.status === 'upcoming' ? '公募予定' : '締切済',
  })
  totalScore += statusScore

  // 6. 締切猶予 (10点)
  const deadlineScore = checkDeadlineScore(subsidy.application_deadline)
  details.push({
    category: '締切猶予',
    score: deadlineScore.score,
    maxScore: 10,
    reason: deadlineScore.reason,
  })
  totalScore += deadlineScore.score

  // レベル判定
  const maxScore = 60
  const percentage = Math.round((totalScore / maxScore) * 100)
  const level = percentage >= 80 ? 'high' : percentage >= 60 ? 'medium' : 'low'
  const stars = level === 'high' ? 3 : level === 'medium' ? 2 : 1
  const label = level === 'high' ? '高適合' : level === 'medium' ? '中適合' : '低適合'

  return {
    score: percentage,
    maxScore,
    level,
    label,
    stars,
    details,
  }
}

function checkIndustryMatch(targetIndustry: string[] | null): { score: number; reason: string } {
  if (!targetIndustry || targetIndustry.length === 0) {
    return { score: 5, reason: '業種指定なし' }
  }
  const match = targetIndustry.some(ind =>
    INDUSTRY_KEYWORDS.some(kw => ind.includes(kw))
  )
  return match
    ? { score: 10, reason: '業種が一致' }
    : { score: 2, reason: '業種が不一致の可能性' }
}

function checkSizeMatch(targetSize: string[] | null, org: Organization): { score: number; reason: string } {
  if (!targetSize || targetSize.length === 0 || targetSize.includes('全規模')) {
    return { score: 10, reason: '規模制限なし' }
  }

  const employees = org.employee_count || 5
  const capital = org.capital_amount || 3000000

  // 小規模事業者: 従業員5名以下(サービス業)
  if (targetSize.includes('小規模事業者') && employees <= 5) {
    return { score: 10, reason: '小規模事業者に該当' }
  }

  // 中小企業: サービス業は従業員100名以下 or 資本金5000万円以下
  if (targetSize.includes('中小企業') && (employees <= 100 || capital <= 50000000)) {
    return { score: 10, reason: '中小企業に該当' }
  }

  return { score: 3, reason: '規模要件を確認してください' }
}

function checkAreaMatch(targetArea: string | null, locations: Location[]): { score: number; reason: string } {
  if (!targetArea || targetArea === '全国') {
    return { score: 10, reason: '全国対象' }
  }

  const locationAreas = locations.map(l => [l.prefecture, l.city, l.ward].filter(Boolean)).flat()

  if (locationAreas.some(area => targetArea.includes(area!))) {
    return { score: 10, reason: `拠点の所在地（${targetArea}）と一致` }
  }

  // 東京都の場合、渋谷区・武蔵野市の拠点がある
  if (targetArea === '東京都') {
    return { score: 10, reason: '東京都内に拠点あり' }
  }

  return { score: 0, reason: `対象エリア（${targetArea}）に拠点なし` }
}

function checkPurposeMatch(purpose: string[] | null): { score: number; reason: string } {
  if (!purpose || purpose.length === 0) {
    return { score: 5, reason: '目的指定なし' }
  }

  // DGHに関連性が高い目的
  const relevantPurposes = ['販路開拓', '広告宣伝', '設備投資', 'IT導入', '雇用', '開業']
  const matched = purpose.filter(p => relevantPurposes.some(rp => p.includes(rp)))

  if (matched.length > 0) {
    return { score: 10, reason: `目的一致: ${matched.join('、')}` }
  }

  return { score: 3, reason: '目的の関連性が低い可能性' }
}

function checkDeadlineScore(deadline: string | null): { score: number; reason: string } {
  if (!deadline) return { score: 5, reason: '締切未設定' }

  const now = new Date()
  const d = new Date(deadline)
  const daysLeft = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  if (daysLeft < 0) return { score: 0, reason: '締切済み' }
  if (daysLeft <= 7) return { score: 3, reason: `あと${daysLeft}日（急ぎ）` }
  if (daysLeft <= 30) return { score: 7, reason: `あと${daysLeft}日` }
  return { score: 10, reason: `あと${daysLeft}日（十分な準備期間）` }
}
