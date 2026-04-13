'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, RefreshCw, Edit2, Check, Download, Copy, Loader2 } from 'lucide-react'
import type { Draft, DraftTemplate, TemplateSection } from '@/lib/supabase/types'
import { updateDraftContent, updateDraftSection } from '@/lib/actions/drafts'

interface Props {
  draft: Draft & { subsidies?: { name: string } }
  template: DraftTemplate
}

export default function DraftEditor({ draft, template }: Props) {
  const router = useRouter()
  const [generatedContent, setGeneratedContent] = useState<Record<string, string>>(
    (draft.generated_content || {}) as Record<string, string>
  )
  const [editingSection, setEditingSection] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [generating, setGenerating] = useState(false)
  const [regeneratingSection, setRegeneratingSection] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const sections = template.sections as TemplateSection[]
  const hasContent = Object.keys(generatedContent).length > 0

  // 全セクション生成
  const handleGenerateAll = async () => {
    setGenerating(true)
    try {
      const res = await fetch('/api/drafts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draftId: draft.id }),
      })
      const data = await res.json()
      if (data.ok) {
        setGeneratedContent(data.generated_content)
      } else {
        alert(`生成エラー: ${data.error}`)
      }
    } catch {
      alert('生成に失敗しました')
    } finally {
      setGenerating(false)
    }
  }

  // 単一セクション再生成
  const handleRegenerateSection = async (sectionId: string) => {
    setRegeneratingSection(sectionId)
    try {
      const res = await fetch('/api/drafts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draftId: draft.id, sectionId }),
      })
      const data = await res.json()
      if (data.ok) {
        setGeneratedContent(data.generated_content)
      }
    } catch {
      alert('再生成に失敗しました')
    } finally {
      setRegeneratingSection(null)
    }
  }

  // セクション手動編集の開始
  const startEditing = (sectionId: string) => {
    setEditingSection(sectionId)
    setEditText(generatedContent[sectionId] || '')
  }

  // 手動編集の保存
  const saveEdit = async () => {
    if (!editingSection) return
    const updated = { ...generatedContent, [editingSection]: editText }
    setGeneratedContent(updated)
    setEditingSection(null)
    await updateDraftSection(draft.id, editingSection, editText, 'generated')
  }

  // 確定（final_contentとして保存）
  const handleFinalize = async () => {
    setSaving(true)
    const result = await updateDraftContent(draft.id, generatedContent, 'final')
    if (result.success) {
      router.push(`/drafts/${draft.id}/export`)
    } else {
      alert(`保存エラー: ${result.error}`)
    }
    setSaving(false)
  }

  // クリップボードコピー
  const handleCopyAll = () => {
    const text = sections
      .map(s => `【${s.title}】\n${generatedContent[s.id] || '（未生成）'}`)
      .join('\n\n')
    navigator.clipboard.writeText(text)
    alert('クリップボードにコピーしました')
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <Link href="/drafts" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-2">
            <ArrowLeft size={16} /> ドラフト一覧
          </Link>
          <h1 className="text-xl font-bold text-gray-900">{draft.title}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{draft.subsidies?.name || ''}</p>
        </div>
        <div className="flex items-center gap-2">
          {hasContent && (
            <>
              <button
                onClick={handleCopyAll}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Copy size={14} /> コピー
              </button>
              <button
                onClick={handleFinalize}
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                <Check size={16} /> {saving ? '保存中...' : '確定して出力へ'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* 生成ボタン（未生成時） */}
      {!hasContent && !generating && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-sm text-gray-500 mb-4">AI申請書を生成してください</p>
          <button
            onClick={handleGenerateAll}
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-white bg-[#1E3A8A] rounded-lg hover:bg-[#1E3A8A]/90"
          >
            <RefreshCw size={16} /> AI申請書を生成する
          </button>
        </div>
      )}

      {/* 生成中 */}
      {generating && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Loader2 size={32} className="animate-spin mx-auto text-[#1E3A8A] mb-3" />
          <p className="text-sm text-gray-600">AI申請書を生成しています...</p>
          <p className="text-xs text-gray-400 mt-1">{sections.length}セクションを生成中。数分かかる場合があります。</p>
        </div>
      )}

      {/* セクション一覧 */}
      {hasContent && !generating && (
        <div className="space-y-4">
          {/* 全体再生成ボタン */}
          <div className="flex justify-end">
            <button
              onClick={handleGenerateAll}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <RefreshCw size={12} /> 全セクション再生成
            </button>
          </div>

          {sections.map((section) => {
            const content = generatedContent[section.id] || ''
            const isEditing = editingSection === section.id
            const isRegenerating = regeneratingSection === section.id
            const charCount = content.length

            return (
              <div key={section.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {/* セクションヘッダー */}
                <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-800">{section.title}</h3>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs ${
                      charCount > section.max_chars ? 'text-red-500 font-medium' : 'text-gray-400'
                    }`}>
                      {charCount}/{section.max_chars}文字
                    </span>
                    <button
                      onClick={() => handleRegenerateSection(section.id)}
                      disabled={isRegenerating}
                      className="inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-[#1E3A8A] hover:bg-blue-50 rounded disabled:opacity-50"
                    >
                      <RefreshCw size={12} className={isRegenerating ? 'animate-spin' : ''} />
                      再生成
                    </button>
                    <button
                      onClick={() => isEditing ? saveEdit() : startEditing(section.id)}
                      className="inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-[#1E3A8A] hover:bg-blue-50 rounded"
                    >
                      {isEditing ? <><Check size={12} /> 保存</> : <><Edit2 size={12} /> 編集</>}
                    </button>
                  </div>
                </div>

                {/* セクションコンテンツ */}
                <div className="p-5">
                  {isEditing ? (
                    <textarea
                      rows={8}
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1E3A8A] outline-none resize-y"
                    />
                  ) : isRegenerating ? (
                    <div className="flex items-center gap-2 py-8 justify-center text-sm text-gray-400">
                      <Loader2 size={16} className="animate-spin" /> 再生成中...
                    </div>
                  ) : content ? (
                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {content}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-400 py-4 text-center">未生成</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
