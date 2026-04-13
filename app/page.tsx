import { redirect } from 'next/navigation'

// ルートパスはダッシュボードへリダイレクト
export default function Home() {
  redirect('/dashboard')
}
