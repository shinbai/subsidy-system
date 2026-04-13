import AppShell from '@/components/ui/AppShell'

// 認証済みエリアの共通レイアウト（サイドバー + ヘッダー付き）
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AppShell>{children}</AppShell>
}
