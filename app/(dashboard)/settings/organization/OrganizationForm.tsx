'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'
import type { Organization } from '@/lib/supabase/types'
import { updateOrganization } from '@/lib/actions/settings'

interface Props {
  organization: Organization | null
}

export default function OrganizationForm({ organization: org }: Props) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: org?.name || '',
    representative: org?.representative || '',
    industry: org?.industry || '',
    employee_count: org?.employee_count?.toString() || '',
    capital_amount: org?.capital_amount?.toString() || '',
    annual_revenue: org?.annual_revenue?.toString() || '',
    established_date: org?.established_date || '',
    postal_code: org?.postal_code || '',
    address: org?.address || '',
    phone: org?.phone || '',
    email: org?.email || '',
    invoice_number: org?.invoice_number || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!org) return
    setLoading(true)
    setMessage(null)

    const result = await updateOrganization(org.id, {
      name: form.name,
      representative: form.representative,
      industry: form.industry,
      employee_count: form.employee_count ? Number(form.employee_count) : null,
      capital_amount: form.capital_amount ? Number(form.capital_amount) : null,
      annual_revenue: form.annual_revenue ? Number(form.annual_revenue) : null,
      established_date: form.established_date || null,
      postal_code: form.postal_code || null,
      address: form.address || null,
      phone: form.phone || null,
      email: form.email || null,
      invoice_number: form.invoice_number || null,
    })

    setLoading(false)
    setMessage(result.success ? `${new Date().toLocaleTimeString('ja-JP')} に保存しました` : `エラー: ${result.error}`)
  }

  const inputClass = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1E3A8A] focus:border-[#1E3A8A] outline-none'

  return (
    <div className="max-w-2xl space-y-6">
      <div className="text-sm text-gray-500">
        <Link href="/settings" className="hover:text-gray-700">設定</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">法人プロフィール</span>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <h2 className="text-lg font-semibold text-gray-900">法人プロフィール</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">法人名</label>
            <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">代表者名</label>
            <input type="text" value={form.representative} onChange={e => setForm({...form, representative: e.target.value})} className={inputClass} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">業種</label>
            <input type="text" value={form.industry} onChange={e => setForm({...form, industry: e.target.value})} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">従業員数</label>
            <input type="number" value={form.employee_count} onChange={e => setForm({...form, employee_count: e.target.value})} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">資本金（円）</label>
            <input type="number" value={form.capital_amount} onChange={e => setForm({...form, capital_amount: e.target.value})} className={inputClass} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">年間売上（円）</label>
            <input type="number" value={form.annual_revenue} onChange={e => setForm({...form, annual_revenue: e.target.value})} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">設立日</label>
            <input type="date" value={form.established_date} onChange={e => setForm({...form, established_date: e.target.value})} className={inputClass} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">郵便番号</label>
            <input type="text" value={form.postal_code} onChange={e => setForm({...form, postal_code: e.target.value})} className={inputClass} placeholder="000-0000" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">インボイス番号</label>
            <input type="text" value={form.invoice_number} onChange={e => setForm({...form, invoice_number: e.target.value})} className={inputClass} placeholder="T0000000000000" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">所在地</label>
          <input type="text" value={form.address} onChange={e => setForm({...form, address: e.target.value})} className={inputClass} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">電話番号</label>
            <input type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">メールアドレス</label>
            <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className={inputClass} />
          </div>
        </div>

        {message && (
          <div className={`p-3 rounded-lg text-sm ${message.includes('エラー') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
            {message}
          </div>
        )}

        <button type="submit" disabled={loading} className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-[#1E3A8A] rounded-lg hover:bg-[#1E3A8A]/90 disabled:opacity-50">
          <Save size={16} /> {loading ? '保存中...' : '保存する'}
        </button>
      </form>
    </div>
  )
}
