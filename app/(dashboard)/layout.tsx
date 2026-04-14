import { Suspense } from 'react'
import AppShell from '@/components/ui/AppShell'

// ローディングスピナー
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="w-8 h-8 border-4 border-[#1E3A8A] border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

// 認証済みエリアの共通レイアウト（サイドバー + ヘッダー付き）
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AppShell>
      <Suspense fallback={<LoadingSpinner />}>
        {children}
      </Suspense>
    </AppShell>
  )
}
