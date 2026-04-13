import { createServerSupabaseClient } from '@/lib/supabase/server'
import { FileText, Clock, Trophy, Search, Star } from 'lucide-react'
import { calculateEligibility } from '@/lib/subsidy/eligibility'
import type { Subsidy, Organization, Location } from '@/lib/supabase/types'

// ビルド時の静的生成を無効化（DB接続が必要なため）
export const dynamic = 'force-dynamic'

// ダッシュボードのサマリーカード
interface StatCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  color: string
  subtitle?: string
}

function StatCard({ title, value, icon, color, subtitle }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  )
}

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()

  // 申請中の件数
  const { count: applyingCount } = await supabase
    .from('applications')
    .select('*', { count: 'exact', head: true })
    .in('status', ['applying', 'reviewing_by_authority'])

  // 今月の締切件数
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
  const { count: deadlineCount } = await supabase
    .from('subsidies')
    .select('*', { count: 'exact', head: true })
    .gte('application_deadline', startOfMonth)
    .lte('application_deadline', endOfMonth)
    .eq('status', 'open')

  // 今年の採択総額
  const startOfYear = `${now.getFullYear()}-01-01`
  const { data: adoptedData } = await supabase
    .from('applications')
    .select('adopted_amount')
    .eq('status', 'adopted')
    .gte('result_date', startOfYear)

  const totalAdopted = (adoptedData as { adopted_amount: number | null }[] | null)
    ?.reduce((sum, a) => sum + (a.adopted_amount || 0), 0) || 0

  // 未着手の検討候補件数
  const { count: discoveredCount } = await supabase
    .from('applications')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'discovered')

  // 締切間近の補助金（30日以内）
  const thirtyDaysLater = new Date()
  thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30)
  const { data: upcomingDeadlines } = await supabase
    .from('subsidies')
    .select('id, name, authority, application_deadline, max_amount')
    .eq('status', 'open')
    .gte('application_deadline', now.toISOString().split('T')[0])
    .lte('application_deadline', thirtyDaysLater.toISOString().split('T')[0])
    .order('application_deadline', { ascending: true })
    .limit(5) as { data: { id: string; name: string; authority: string; application_deadline: string | null; max_amount: number | null }[] | null }

  // 金額フォーマット
  const formatAmount = (amount: number) => {
    if (amount >= 10000) return `${(amount / 10000).toLocaleString()}万円`
    return `${amount.toLocaleString()}円`
  }

  return (
    <div className="space-y-6">
      {/* サマリーカード */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="申請中"
          value={applyingCount ?? 0}
          icon={<FileText size={20} className="text-blue-600" />}
          color="bg-blue-50"
          subtitle="件"
        />
        <StatCard
          title="今月の締切"
          value={deadlineCount ?? 0}
          icon={<Clock size={20} className="text-orange-600" />}
          color="bg-orange-50"
          subtitle="件"
        />
        <StatCard
          title="今年の採択総額"
          value={totalAdopted > 0 ? formatAmount(totalAdopted) : '¥0'}
          icon={<Trophy size={20} className="text-green-600" />}
          color="bg-green-50"
        />
        <StatCard
          title="未着手の候補"
          value={discoveredCount ?? 0}
          icon={<Search size={20} className="text-purple-600" />}
          color="bg-purple-50"
          subtitle="件"
        />
      </div>

      {/* 締切間近の補助金 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          締切間近の補助金
        </h2>
        {upcomingDeadlines && upcomingDeadlines.length > 0 ? (
          <div className="space-y-3">
            {upcomingDeadlines.map((subsidy) => {
              const deadline = new Date(subsidy.application_deadline!)
              const daysLeft = Math.ceil(
                (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
              )
              return (
                <div
                  key={subsidy.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {subsidy.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {subsidy.authority}
                      {subsidy.max_amount && ` | 上限 ${formatAmount(subsidy.max_amount)}`}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      daysLeft <= 7
                        ? 'bg-red-100 text-red-700'
                        : daysLeft <= 14
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    あと{daysLeft}日
                  </span>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            30日以内に締切の補助金はありません
          </p>
        )}
      </div>

      {/* おすすめ補助金（適合スコア上位3件） */}
      <RecommendedSubsidies />
    </div>
  )
}

// おすすめ補助金コンポーネント（別途データ取得）
async function RecommendedSubsidies() {
  const supabase = await createServerSupabaseClient()

  const { data: allSubsidies } = await supabase
    .from('subsidies')
    .select('*')
    .eq('status', 'open')

  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .limit(1)
    .single()

  const { data: locations } = await supabase
    .from('locations')
    .select('*')
    .eq('is_active', true)

  if (!allSubsidies || !org || !locations) return null

  // 適合スコアを計算してソート
  const scored = (allSubsidies as unknown as Subsidy[]).map(subsidy => ({
    subsidy,
    eligibility: calculateEligibility(
      subsidy,
      org as unknown as Organization,
      (locations as unknown as Location[])
    ),
  }))
    .sort((a, b) => b.eligibility.score - a.eligibility.score)
    .slice(0, 3)

  if (scored.length === 0) return null

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Star size={20} className="text-yellow-500" />
        おすすめ補助金
      </h2>
      <div className="space-y-3">
        {scored.map(({ subsidy, eligibility }) => (
          <div
            key={subsidy.id}
            className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-gray-900">{subsidy.name}</p>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  eligibility.level === 'high' ? 'bg-green-100 text-green-700' :
                  eligibility.level === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {'⭐'.repeat(eligibility.stars)} {eligibility.label}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                {subsidy.authority}
                {subsidy.max_amount && ` | 上限 ${subsidy.max_amount >= 10000 ? `${(subsidy.max_amount / 10000).toLocaleString()}万円` : `${subsidy.max_amount.toLocaleString()}円`}`}
              </p>
            </div>
            <span className="text-sm font-bold text-[#1E3A8A]">{eligibility.score}点</span>
          </div>
        ))}
      </div>
    </div>
  )
}
