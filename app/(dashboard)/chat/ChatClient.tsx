'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Loader2, Bot, User, ChevronDown } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface ChatClientProps {
  subsidies: { id: string; name: string }[]
}

// 初期サジェスト
const suggestions = [
  '小規模事業者持続化補助金の申請要件は？',
  '経営計画書の書き方のコツを教えて',
  'ダンス教室が使える補助金は？',
]

export default function ChatClient({ subsidies }: ChatClientProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'こんにちは！補助金・助成金の申請についてお手伝いします。何でもお気軽にご質問ください。',
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedSubsidyId, setSelectedSubsidyId] = useState<string>('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // 自動スクロール
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // メッセージ送信
  const handleSend = async (text?: string) => {
    const messageText = text || input.trim()
    if (!messageText || loading) return

    const userMessage: Message = { role: 'user', content: messageText }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    // APIに送信するメッセージ（初期メッセージを除く）
    const apiMessages = newMessages
      .filter((_, i) => i > 0) // 初期のアシスタントメッセージを除外
      .map(m => ({ role: m.role, content: m.content }))

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          subsidyId: selectedSubsidyId || undefined,
        }),
      })

      if (!res.ok) {
        throw new Error(await res.text())
      }

      // ストリーミング受信
      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let assistantContent = ''

      // 空のアシスタントメッセージを追加
      setMessages(prev => [...prev, { role: 'assistant', content: '' }])

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          assistantContent += decoder.decode(value, { stream: true })
          setMessages(prev => {
            const updated = [...prev]
            updated[updated.length - 1] = { role: 'assistant', content: assistantContent }
            return updated
          })
        }
      }
    } catch (error) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `エラーが発生しました: ${error instanceof Error ? error.message : '通信エラー'}`,
        },
      ])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  // Enterキー送信（Shift+Enterは改行）
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // サジェストの表示判定（最初のメッセージのみの場合）
  const showSuggestions = messages.length === 1

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] max-h-[calc(100vh-5rem)]">
      {/* ヘッダー: 補助金選択 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white rounded-t-xl">
        <h1 className="text-lg font-semibold text-gray-900">AIアシスタント</h1>
        <div className="relative">
          <select
            value={selectedSubsidyId}
            onChange={(e) => setSelectedSubsidyId(e.target.value)}
            className="appearance-none text-sm bg-gray-50 border border-gray-200 rounded-lg pl-3 pr-8 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
          >
            <option value="">全般的な質問</option>
            {subsidies.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* メッセージ一覧 */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-gray-50">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            {/* アイコン */}
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
              msg.role === 'assistant' ? 'bg-[#1E3A8A]' : 'bg-gray-400'
            }`}>
              {msg.role === 'assistant' ? (
                <Bot size={16} className="text-white" />
              ) : (
                <User size={16} className="text-white" />
              )}
            </div>

            {/* メッセージ */}
            <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-[#1E3A8A] text-white'
                : 'bg-white text-gray-800 border border-gray-200'
            }`}>
              <div className="whitespace-pre-wrap">{msg.content}</div>
            </div>
          </div>
        ))}

        {/* ローディング表示 */}
        {loading && messages[messages.length - 1]?.role === 'user' && (
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#1E3A8A] flex items-center justify-center">
              <Bot size={16} className="text-white" />
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
              <Loader2 size={16} className="animate-spin text-[#1E3A8A]" />
            </div>
          </div>
        )}

        {/* サジェスト */}
        {showSuggestions && (
          <div className="flex flex-wrap gap-2 mt-2">
            {suggestions.map((text, i) => (
              <button
                key={i}
                onClick={() => handleSend(text)}
                className="text-xs px-3 py-2 bg-white border border-gray-200 rounded-full text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
              >
                {text}
              </button>
            ))}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 入力エリア */}
      <div className="px-4 py-3 border-t border-gray-200 bg-white rounded-b-xl">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="メッセージを入力..."
            rows={1}
            className="flex-1 resize-none text-sm border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] max-h-32"
            style={{ minHeight: '42px' }}
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className="flex-shrink-0 p-2.5 bg-[#1E3A8A] text-white rounded-xl hover:bg-[#1E3A8A]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
