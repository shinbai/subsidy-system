import Link from 'next/link'
import { Bell, Building, MapPin, Users } from 'lucide-react'

// 設定ページ（メニュー一覧）
const settingsItems = [
  {
    href: '/settings/notifications',
    label: '通知設定',
    description: 'LINE・メール通知の設定とテスト送信',
    icon: Bell,
    color: 'text-blue-600 bg-blue-50',
    available: true,
  },
  {
    href: '/settings/organization',
    label: '法人プロフィール',
    description: '法人名・代表者・資本金・業種などの基本情報',
    icon: Building,
    color: 'text-green-600 bg-green-50',
    available: true,
  },
  {
    href: '/settings/locations',
    label: '拠点管理',
    description: '拠点の追加・編集・アーカイブ',
    icon: MapPin,
    color: 'text-orange-600 bg-orange-50',
    available: true,
  },
  {
    href: '/settings/users',
    label: 'ユーザー管理',
    description: 'ユーザーの招待・ロール管理',
    icon: Users,
    color: 'text-purple-600 bg-purple-50',
    available: false,
  },
]

export default function SettingsPage() {
  return (
    <div className="max-w-3xl space-y-4">
      {settingsItems.map((item) => {
        const Icon = item.icon
        const Wrapper = item.available ? Link : 'div'
        return (
          <Wrapper
            key={item.href}
            href={item.available ? item.href : '#'}
            className={`
              block bg-white rounded-xl border border-gray-200 p-5
              ${item.available
                ? 'hover:border-[#1E3A8A]/30 hover:shadow-sm cursor-pointer'
                : 'opacity-60 cursor-not-allowed'
              }
              transition-all
            `}
          >
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${item.color}`}>
                <Icon size={20} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  {item.label}
                  {!item.available && (
                    <span className="ml-2 text-xs font-normal text-gray-400">（準備中）</span>
                  )}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
              </div>
            </div>
          </Wrapper>
        )
      })}
    </div>
  )
}
