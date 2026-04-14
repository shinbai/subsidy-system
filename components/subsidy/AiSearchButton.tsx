'use client'

import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import AiSearchModal from './AiSearchModal'

export default function AiSearchButton() {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#1E3A8A] to-indigo-600 text-white text-sm font-medium rounded-lg hover:from-[#1E3A8A]/90 hover:to-indigo-500 shadow-sm transition-all"
      >
        <Sparkles size={16} />
        AIで補助金を探す
      </button>
      {showModal && <AiSearchModal onClose={() => setShowModal(false)} />}
    </>
  )
}
