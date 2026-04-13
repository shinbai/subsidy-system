'use client'

import Link from 'next/link'
import { ArrowLeft, FileText, FileDown, Copy, ExternalLink } from 'lucide-react'
import type { Draft, DraftTemplate, TemplateSection } from '@/lib/supabase/types'

interface Props {
  draft: Draft & { subsidies?: { name: string } }
  template: DraftTemplate
}

export default function ExportClient({ draft, template }: Props) {
  const content = (draft.final_content || draft.generated_content || {}) as Record<string, string>
  const sections = template.sections as TemplateSection[]

  // テキストをクリップボードにコピー
  const handleCopyText = () => {
    const text = sections
      .map(s => `【${s.title}】\n${content[s.id] || '（未生成）'}`)
      .join('\n\n')
    navigator.clipboard.writeText(text)
    alert('クリップボードにコピーしました')
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <Link href={`/drafts/${draft.id}`} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-2">
            <ArrowLeft size={16} /> 申請書を修正する
          </Link>
          <h1 className="text-xl font-bold text-gray-900">{draft.title}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{draft.subsidies?.name || ''} | 確定済み</p>
        </div>
      </div>

      {/* ダウンロードボタン */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">出力形式を選択</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Word */}
          <a
            href={`/api/drafts/${draft.id}/export/docx`}
            className="flex flex-col items-center gap-3 p-6 border border-gray-200 rounded-xl hover:border-[#1E3A8A] hover:shadow-sm transition-all group"
          >
            <div className="p-3 bg-blue-50 rounded-lg group-hover:bg-blue-100">
              <FileDown size={24} className="text-blue-600" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-900">Word (.docx)</p>
              <p className="text-xs text-gray-500 mt-0.5">Microsoft Word形式</p>
            </div>
          </a>

          {/* PDF */}
          <a
            href={`/api/drafts/${draft.id}/export/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-3 p-6 border border-gray-200 rounded-xl hover:border-[#1E3A8A] hover:shadow-sm transition-all group"
          >
            <div className="p-3 bg-red-50 rounded-lg group-hover:bg-red-100">
              <ExternalLink size={24} className="text-red-600" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-900">PDF</p>
              <p className="text-xs text-gray-500 mt-0.5">印刷ダイアログから保存</p>
            </div>
          </a>

          {/* テキストコピー */}
          <button
            onClick={handleCopyText}
            className="flex flex-col items-center gap-3 p-6 border border-gray-200 rounded-xl hover:border-[#1E3A8A] hover:shadow-sm transition-all group"
          >
            <div className="p-3 bg-green-50 rounded-lg group-hover:bg-green-100">
              <Copy size={24} className="text-green-600" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-900">テキスト</p>
              <p className="text-xs text-gray-500 mt-0.5">クリップボードにコピー</p>
            </div>
          </button>
        </div>
      </div>

      {/* プレビュー */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">プレビュー</h2>
        <div className="space-y-6">
          {sections.map((section) => (
            <div key={section.id}>
              <h3 className="text-sm font-semibold text-gray-800 border-b border-gray-200 pb-1 mb-2">
                {section.title}
              </h3>
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                {content[section.id] || '（未生成）'}
              </p>
              <div className="text-right mt-1">
                <span className="text-xs text-gray-400">
                  {(content[section.id] || '').length}/{section.max_chars}文字
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
