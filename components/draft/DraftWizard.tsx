'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import type { Subsidy, Location, Organization, DraftTemplate } from '@/lib/supabase/types'
import { createDraft } from '@/lib/actions/drafts'

// ヒアリング質問
const QUESTIONS = [
  { id: 'q1_usage', label: '今回の補助金で何をしたいですか？（具体的な使途）' },
  { id: 'q2_effect', label: 'それによってどんな効果・変化を期待していますか？' },
  { id: 'q3_background', label: '現在の課題や背景を教えてください' },
  { id: 'q4_value', label: 'お客様（生徒）にどんな価値を提供していますか？' },
  { id: 'q5_differentiation', label: '競合との差別化ポイントは何ですか？' },
  { id: 'q6_numbers', label: '数字で表せる実績があれば教えてください（会員数・継続率・メディア掲載等）' },
  { id: 'q7_other', label: 'その他、強調したいことがあれば' },
]

interface Props {
  subsidies: Subsidy[]
  locations: Location[]
  organization: Organization | null
  templates: DraftTemplate[]
}

const STEPS = ['補助金・拠点選択', '基本情報確認', '申請内容ヒアリング', '確認・生成']

export default function DraftWizard({ subsidies, locations, organization, templates }: Props) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)

  // STEP 1
  const [selectedSubsidy, setSelectedSubsidy] = useState<string>('')
  const [selectedLocation, setSelectedLocation] = useState<string>(locations[0]?.id || '')
  const [selectedTemplate, setSelectedTemplate] = useState<string>(templates[0]?.id || '')

  // STEP 3
  const [answers, setAnswers] = useState<Record<string, string>>({})

  const currentSubsidy = subsidies.find(s => s.id === selectedSubsidy)
  const currentTemplate = templates.find(t => t.id === selectedTemplate)
  const currentLocation = locations.find(l => l.id === selectedLocation)

  const canProceed = () => {
    switch (step) {
      case 0: return selectedSubsidy && selectedLocation && selectedTemplate
      case 1: return true
      case 2: return answers['q1_usage']?.trim()
      case 3: return true
      default: return false
    }
  }

  const handleCreate = async () => {
    if (!selectedSubsidy || !selectedTemplate) return
    setLoading(true)

    const result = await createDraft({
      subsidy_id: selectedSubsidy,
      template_id: selectedTemplate,
      title: `${currentSubsidy?.name || '申請書'} - ${new Date().toLocaleDateString('ja-JP')}`,
      input_data: answers,
    })

    if (result.data) {
      router.push(`/drafts/${result.data.id}`)
    } else {
      alert(`エラー: ${result.error}`)
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* ステップインジケーター */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((label, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
              i < step ? 'bg-green-500 text-white' :
              i === step ? 'bg-[#1E3A8A] text-white' :
              'bg-gray-200 text-gray-500'
            }`}>
              {i < step ? <Check size={14} /> : i + 1}
            </div>
            <span className={`text-xs hidden sm:inline ${i === step ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
              {label}
            </span>
            {i < STEPS.length - 1 && <div className="w-8 h-px bg-gray-300" />}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        {/* STEP 1: 補助金・拠点選択 */}
        {step === 0 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-gray-900">対象の補助金と拠点を選択</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">対象補助金 *</label>
              <select
                value={selectedSubsidy}
                onChange={(e) => setSelectedSubsidy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1E3A8A] outline-none"
              >
                <option value="">選択してください</option>
                {subsidies.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">対象拠点 *</label>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1E3A8A] outline-none"
              >
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>{l.name}（{l.branch_name}）</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">テンプレート *</label>
              <select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1E3A8A] outline-none"
              >
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} {t.is_default ? '（デフォルト）' : ''}
                  </option>
                ))}
              </select>
              {currentTemplate?.description && (
                <p className="text-xs text-gray-500 mt-1">{currentTemplate.description}</p>
              )}
            </div>
          </div>
        )}

        {/* STEP 2: 基本情報確認 */}
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-gray-900">基本情報の確認</h2>
            <p className="text-sm text-gray-500">以下の情報が申請書に使用されます。不足があれば設定ページで更新してください。</p>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">法人情報</h3>
                <dl className="space-y-1">
                  <div className="flex justify-between"><dt className="text-gray-500">法人名</dt><dd>{organization?.name || '-'}</dd></div>
                  <div className="flex justify-between"><dt className="text-gray-500">代表者</dt><dd>{organization?.representative || '-'}</dd></div>
                  <div className="flex justify-between"><dt className="text-gray-500">業種</dt><dd>{organization?.industry || '-'}</dd></div>
                  <div className="flex justify-between"><dt className="text-gray-500">従業員数</dt><dd>{organization?.employee_count ?? '-'}名</dd></div>
                  <div className="flex justify-between"><dt className="text-gray-500">資本金</dt><dd>{organization?.capital_amount ? `${(organization.capital_amount / 10000).toLocaleString()}万円` : '-'}</dd></div>
                </dl>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">拠点情報</h3>
                <dl className="space-y-1">
                  <div className="flex justify-between"><dt className="text-gray-500">拠点名</dt><dd>{currentLocation?.name || '-'}</dd></div>
                  <div className="flex justify-between"><dt className="text-gray-500">所在地</dt><dd>{currentLocation?.address || '-'}</dd></div>
                  <div className="flex justify-between"><dt className="text-gray-500">市区町村</dt><dd>{currentLocation?.city || '-'}</dd></div>
                </dl>
              </div>
            </div>

            {currentSubsidy && (
              <div className="p-4 bg-blue-50 rounded-lg text-sm">
                <h3 className="font-medium text-blue-900 mb-1">対象補助金: {currentSubsidy.name}</h3>
                <p className="text-blue-700">
                  {currentSubsidy.authority} | 上限{currentSubsidy.max_amount ? `${(currentSubsidy.max_amount / 10000).toLocaleString()}万円` : '不明'}
                  {currentSubsidy.subsidy_rate && ` | 補助率${Math.round(currentSubsidy.subsidy_rate * 100)}%`}
                </p>
              </div>
            )}
          </div>
        )}

        {/* STEP 3: ヒアリング */}
        {step === 2 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-gray-900">申請内容のヒアリング</h2>
            <p className="text-sm text-gray-500">以下の質問に回答してください。AIが申請書を生成する素材になります。</p>

            {QUESTIONS.map((q) => (
              <div key={q.id}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {q.label} {q.id === 'q1_usage' && <span className="text-red-500">*</span>}
                </label>
                <textarea
                  rows={3}
                  value={answers[q.id] || ''}
                  onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1E3A8A] outline-none resize-none"
                  placeholder="自由に記入してください"
                />
              </div>
            ))}
          </div>
        )}

        {/* STEP 4: 確認・生成 */}
        {step === 3 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-gray-900">内容の確認</h2>
            <p className="text-sm text-gray-500">以下の内容でAI申請書を生成します。</p>

            <div className="p-4 bg-gray-50 rounded-lg text-sm space-y-2">
              <div><span className="text-gray-500">補助金:</span> <span className="font-medium">{currentSubsidy?.name}</span></div>
              <div><span className="text-gray-500">拠点:</span> <span className="font-medium">{currentLocation?.name}</span></div>
              <div><span className="text-gray-500">テンプレート:</span> <span className="font-medium">{currentTemplate?.name}</span></div>
              <div><span className="text-gray-500">セクション数:</span> <span className="font-medium">{currentTemplate?.sections.length || 0}個</span></div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700">入力した回答:</h3>
              {QUESTIONS.filter(q => answers[q.id]?.trim()).map((q) => (
                <div key={q.id} className="p-3 bg-gray-50 rounded-lg text-sm">
                  <p className="text-gray-500 text-xs mb-1">{q.label}</p>
                  <p className="text-gray-900">{answers[q.id]}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ナビゲーションボタン */}
        <div className="flex justify-between mt-8 pt-4 border-t border-gray-200">
          <button
            onClick={() => step === 0 ? router.push('/drafts') : setStep(step - 1)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <ArrowLeft size={16} />
            {step === 0 ? '戻る' : '前へ'}
          </button>

          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm text-white bg-[#1E3A8A] rounded-lg hover:bg-[#1E3A8A]/90 disabled:opacity-50"
            >
              次へ
              <ArrowRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleCreate}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-6 py-2.5 text-sm font-medium text-white bg-[#1E3A8A] rounded-lg hover:bg-[#1E3A8A]/90 disabled:opacity-50"
            >
              {loading ? '作成中...' : 'AI申請書を生成する'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
