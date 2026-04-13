'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Menu, LogOut, User } from 'lucide-react'

// パス名からページタイトルを取得
const pageTitles: Record<string, string> = {
  '/dashboard': 'ダッシュボード',
  '/subsidies': '補助金一覧',
  '/applications': '申請管理',
  '/drafts': '申請書作成',
  '/knowledge': 'ナレッジ',
  '/settings': '設定',
}

function getPageTitle(pathname: string): string {
  // 完全一致
  if (pageTitles[pathname]) return pageTitles[pathname]
  // 部分一致（/subsidies/xxxなど）
  const base = '/' + pathname.split('/')[1]
  return pageTitles[base] || 'ページ'
}

interface HeaderProps {
  onMenuClick: () => void
}

export default function Header({ onMenuClick }: HeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUserEmail(user?.email ?? null)
    }
    getUser()
  }, [supabase.auth])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6">
      {/* 左側: ハンバーガー + タイトル */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
        >
          <Menu size={20} className="text-gray-600" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900">
          {getPageTitle(pathname)}
        </h1>
      </div>

      {/* 右側: ユーザー情報 + ログアウト */}
      <div className="flex items-center gap-3">
        {userEmail && (
          <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600">
            <User size={16} />
            <span>{userEmail}</span>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut size={16} />
          <span className="hidden sm:inline">ログアウト</span>
        </button>
      </div>
    </header>
  )
}
