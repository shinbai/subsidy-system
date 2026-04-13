'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  FileText,
  ClipboardList,
  PenTool,
  BookOpen,
  Settings,
  X,
} from 'lucide-react'

// ナビゲーション項目
const navItems = [
  { href: '/dashboard', label: 'ダッシュボード', icon: LayoutDashboard },
  { href: '/subsidies', label: '補助金一覧', icon: FileText },
  { href: '/applications', label: '申請管理', icon: ClipboardList },
  { href: '/drafts', label: '申請書作成', icon: PenTool },
  { href: '/knowledge', label: 'ナレッジ', icon: BookOpen },
  { href: '/settings', label: '設定', icon: Settings },
]

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()

  return (
    <>
      {/* モバイル用オーバーレイ */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* サイドバー */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-64 bg-[#1E3A8A] text-white
          transform transition-transform duration-200 ease-in-out
          lg:translate-x-0 lg:static lg:z-auto
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* ロゴエリア */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-white/10">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <span className="text-sm font-bold">DG</span>
            </div>
            <div>
              <div className="text-sm font-bold leading-tight">補助金管理</div>
              <div className="text-[10px] text-white/60">DANCE GRAND</div>
            </div>
          </Link>
          <button onClick={onClose} className="lg:hidden p-1 hover:bg-white/10 rounded">
            <X size={20} />
          </button>
        </div>

        {/* ナビゲーション */}
        <nav className="mt-4 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                  transition-colors
                  ${isActive
                    ? 'bg-white/20 text-white'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                  }
                `}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* フッター */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
          <div className="text-[10px] text-white/40 text-center">
            &copy; 2026 Gold Phoenix
          </div>
        </div>
      </aside>
    </>
  )
}
