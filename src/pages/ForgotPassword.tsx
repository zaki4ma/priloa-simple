import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) { setError(error.message); setLoading(false) }
    else { setSent(true); setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm p-8">
        <h1 className="text-2xl font-bold text-center text-green-600 mb-2">Priloa</h1>
        <p className="text-center text-gray-500 text-sm mb-8">パスワードの再設定</p>

        {sent ? (
          <div className="text-center">
            <p className="text-green-600 text-sm mb-2">メールを送信しました</p>
            <p className="text-gray-500 text-xs mb-6">{email} にパスワードリセット用のリンクを送りました。メールをご確認ください。</p>
            <Link to="/login" className="text-green-600 text-sm font-medium">ログイン画面に戻る</Link>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <p className="text-gray-500 text-xs">登録したメールアドレスを入力してください。パスワードリセット用のリンクをお送りします。</p>
              <input
                type="email"
                placeholder="メールアドレス"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-green-400"
              />
              {error && <p className="text-red-500 text-xs">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="bg-green-500 text-white rounded-lg py-3 text-sm font-medium hover:bg-green-600 disabled:opacity-50"
              >
                {loading ? '送信中...' : 'リセットメールを送信'}
              </button>
            </form>
            <p className="text-center text-sm text-gray-500 mt-6">
              <Link to="/login" className="text-green-600 font-medium">ログインに戻る</Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
