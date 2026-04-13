'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, MapPin, Edit2, Save, X } from 'lucide-react'
import type { Location } from '@/lib/supabase/types'
import { createLocation, updateLocation } from '@/lib/actions/settings'

interface Props {
  locations: Location[]
  organizationId: string
}

export default function LocationsManager({ locations, organizationId }: Props) {
  const router = useRouter()
  const [showAdd, setShowAdd] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    name: '', branch_name: '', address: '', city: '', ward: '',
    prefecture: '東京都', postal_code: '', employee_count: '0', notes: '',
  })

  const resetForm = () => {
    setForm({ name: '', branch_name: '', address: '', city: '', ward: '', prefecture: '東京都', postal_code: '', employee_count: '0', notes: '' })
  }

  const startEdit = (loc: Location) => {
    setEditingId(loc.id)
    setForm({
      name: loc.name, branch_name: loc.branch_name || '', address: loc.address || '',
      city: loc.city || '', ward: loc.ward || '', prefecture: loc.prefecture || '東京都',
      postal_code: loc.postal_code || '', employee_count: loc.employee_count?.toString() || '0',
      notes: loc.notes || '',
    })
  }

  const handleAdd = async () => {
    setLoading(true)
    await createLocation({
      organization_id: organizationId,
      name: form.name,
      branch_name: form.branch_name || undefined,
      address: form.address || undefined,
      city: form.city || undefined,
      ward: form.ward || undefined,
      prefecture: form.prefecture || undefined,
      postal_code: form.postal_code || undefined,
      employee_count: Number(form.employee_count) || 0,
      notes: form.notes || undefined,
    })
    setLoading(false)
    setShowAdd(false)
    resetForm()
    router.refresh()
  }

  const handleUpdate = async () => {
    if (!editingId) return
    setLoading(true)
    await updateLocation(editingId, {
      name: form.name,
      branch_name: form.branch_name,
      address: form.address,
      city: form.city,
      ward: form.ward,
      prefecture: form.prefecture,
      postal_code: form.postal_code,
      employee_count: Number(form.employee_count) || 0,
      notes: form.notes,
    })
    setLoading(false)
    setEditingId(null)
    resetForm()
    router.refresh()
  }

  const toggleActive = async (loc: Location) => {
    await updateLocation(loc.id, { is_active: !loc.is_active })
    router.refresh()
  }

  const inputClass = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1E3A8A] outline-none'

  const renderForm = (onSave: () => void, onCancel: () => void) => (
    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">拠点名 *</label>
          <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className={inputClass} placeholder="DANCE GRAND Harajuku" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">支店名</label>
          <input type="text" value={form.branch_name} onChange={e => setForm({...form, branch_name: e.target.value})} className={inputClass} placeholder="原宿店" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">都道府県</label>
          <input type="text" value={form.prefecture} onChange={e => setForm({...form, prefecture: e.target.value})} className={inputClass} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">市区町村</label>
          <input type="text" value={form.city} onChange={e => setForm({...form, city: e.target.value})} className={inputClass} placeholder="渋谷区" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">郵便番号</label>
          <input type="text" value={form.postal_code} onChange={e => setForm({...form, postal_code: e.target.value})} className={inputClass} />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">住所</label>
        <input type="text" value={form.address} onChange={e => setForm({...form, address: e.target.value})} className={inputClass} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">従業員数</label>
          <input type="number" value={form.employee_count} onChange={e => setForm({...form, employee_count: e.target.value})} className={inputClass} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">メモ</label>
          <input type="text" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className={inputClass} />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="px-3 py-1.5 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">キャンセル</button>
        <button onClick={onSave} disabled={loading || !form.name} className="px-3 py-1.5 text-sm text-white bg-[#1E3A8A] rounded-lg hover:bg-[#1E3A8A]/90 disabled:opacity-50 inline-flex items-center gap-1">
          <Save size={14} /> {loading ? '保存中...' : '保存'}
        </button>
      </div>
    </div>
  )

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          <Link href="/settings" className="hover:text-gray-700">設定</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900">拠点管理</span>
        </div>
        <button onClick={() => { setShowAdd(true); resetForm() }} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-[#1E3A8A] rounded-lg hover:bg-[#1E3A8A]/90">
          <Plus size={14} /> 拠点を追加
        </button>
      </div>

      {showAdd && renderForm(handleAdd, () => setShowAdd(false))}

      <div className="space-y-3">
        {locations.map((loc) => (
          <div key={loc.id}>
            {editingId === loc.id ? (
              renderForm(handleUpdate, () => { setEditingId(null); resetForm() })
            ) : (
              <div className={`bg-white rounded-xl border border-gray-200 p-4 ${!loc.is_active ? 'opacity-60' : ''}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MapPin size={18} className={loc.is_active ? 'text-[#1E3A8A]' : 'text-gray-400'} />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {loc.name}
                        {loc.branch_name && <span className="text-gray-500">（{loc.branch_name}）</span>}
                        {!loc.is_active && <span className="ml-2 text-xs text-gray-400">非アクティブ</span>}
                      </p>
                      <p className="text-xs text-gray-500">{loc.address || loc.city || '-'} | 従業員{loc.employee_count || 0}名</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => toggleActive(loc)} className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 border border-gray-200 rounded">
                      {loc.is_active ? 'アーカイブ' : '有効化'}
                    </button>
                    <button onClick={() => startEdit(loc)} className="p-1.5 text-gray-400 hover:text-[#1E3A8A] hover:bg-blue-50 rounded">
                      <Edit2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
