'use client'

import { useState } from 'react'
import { Bell, Send, CheckCircle, XCircle, Mail, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import type { Notification } from '@/lib/supabase/types'

interface NotificationWithDetails extends Notification {
  subsidy_name?: string | null
}

interface Props {
  notifications: NotificationWithDetails[]
}

// 通知タイプのラベル
const TYPE_LABELS: Record<string, string> = {
  deadline_30d: '30日前通知',
  deadline_7d: '7日前通知',
  deadline_1d: '前日通知',
  status_change: 'ステータス変更',
}

export default function NotificationSettingsClient({ notifications }: Props) {
  const [testLoading, setTestLoading] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<string | null>(null)

  const handleTestSend = async (channel: 'line' | 'email' | 'both') => {
    setTestLoading(channel)
    setTestResult(null)

    try {
      const res = await fetch('/api/notify/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel }),
      })
      const data = await res.json()

      if (data.results) {
        const successes = data.results.filter((r: { success: boolean }) => r.success)
        const failures = data.results.filter((r: { success: boolean }) => !r.success)

        if (failures.length === 0) {
          setTestResult(`テスト送信成功（${successes.map((r: { channel: string }) => r.channel).join(', ')}）`)
        } else {
          setTestResult(
            `一部失敗: ${failures.map((r: { channel: string; error?: string }) => `${r.channel}: ${r.error}`).join(', ')}`
          )
        }
      }
    } catch {
      setTestResult('テスト送信に失敗しました')
    } finally {
      setTestLoading(null)
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* パンくず */}
      <div className="text-sm text-gray-500">
        <Link href="/settings" className="hover:text-gray-700">設定</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">通知設定</span>
      </div>

      {/* 通知設定 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-6">
          <Bell size={20} className="text-[#1E3A8A]" />
          <h2 className="text-lg font-semibold text-gray-900">通知設定</h2>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg text-sm text-blue-800">
            締切30日前・7日前・前日に自動通知が送信されます。<br />
            通知先は環境変数で設定されています。
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare size={16} className="text-green-600" />
                <span className="font-medium text-sm text-gray-900">LINE通知</span>
              </div>
              <p className="text-xs text-gray-500 mb-3">
                LINE Messaging API経由でプッシュ通知を送信
              </p>
              <button
                onClick={() => handleTestSend('line')}
                disabled={testLoading !== null}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#1E3A8A] border border-[#1E3A8A] rounded-lg hover:bg-[#1E3A8A]/5 disabled:opacity-50"
              >
                <Send size={12} />
                {testLoading === 'line' ? '送信中...' : 'テスト送信'}
              </button>
            </div>

            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Mail size={16} className="text-blue-600" />
                <span className="font-medium text-sm text-gray-900">メール通知</span>
              </div>
              <p className="text-xs text-gray-500 mb-3">
                Resend経由でHTMLメールを送信
              </p>
              <button
                onClick={() => handleTestSend('email')}
                disabled={testLoading !== null}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#1E3A8A] border border-[#1E3A8A] rounded-lg hover:bg-[#1E3A8A]/5 disabled:opacity-50"
              >
                <Send size={12} />
                {testLoading === 'email' ? '送信中...' : 'テスト送信'}
              </button>
            </div>
          </div>

          {/* 両方テスト送信ボタン */}
          <button
            onClick={() => handleTestSend('both')}
            disabled={testLoading !== null}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-[#1E3A8A] rounded-lg hover:bg-[#1E3A8A]/90 disabled:opacity-50"
          >
            <Send size={14} />
            {testLoading === 'both' ? '送信中...' : 'LINE & メール両方テスト送信'}
          </button>

          {/* テスト結果 */}
          {testResult && (
            <div className={`p-3 rounded-lg text-sm ${
              testResult.includes('成功') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {testResult}
            </div>
          )}
        </div>
      </div>

      {/* 通知履歴 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">通知履歴</h2>

        {notifications.length > 0 ? (
          <div className="space-y-2">
            {notifications.map((n) => (
              <div
                key={n.id}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-50 text-sm"
              >
                <div className="flex items-center gap-3">
                  {n.success ? (
                    <CheckCircle size={16} className="text-green-500" />
                  ) : (
                    <XCircle size={16} className="text-red-500" />
                  )}
                  <div>
                    <span className="font-medium text-gray-900">
                      {n.subsidy_name || '不明'}
                    </span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-500">
                        {TYPE_LABELS[n.type] || n.type}
                      </span>
                      <span className="text-xs text-gray-400">|</span>
                      <span className="text-xs text-gray-500 uppercase">
                        {n.channel === 'line' ? 'LINE' : 'メール'}
                      </span>
                    </div>
                  </div>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(n.created_at).toLocaleString('ja-JP')}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">通知履歴はまだありません</p>
        )}
      </div>
    </div>
  )
}
