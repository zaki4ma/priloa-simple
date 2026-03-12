import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Register() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error: signUpError } = await supabase.auth.signUp({ email, password })
    if (signUpError) { setError(signUpError.message); setLoading(false); return }

    if (data.user) {
      await supabase.from('user_profiles').insert({
        id: data.user.id,
        email,
        nickname,
        avatar: '🌱',
      })
      window.gtag?.('event', 'sign_up', { method: 'email' })
    }
    navigate('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm p-8">
        <h1 className="text-2xl font-bold text-center text-green-600 mb-2">Priloa</h1>
        <p className="text-center text-gray-500 text-sm mb-8">アカウントを作成</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="ニックネーム"
            value={nickname}
            onChange={e => setNickname(e.target.value)}
            required
            className="border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-green-400"
          />
          <input
            type="email"
            placeholder="メールアドレス"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-green-400"
          />
          <input
            type="password"
            placeholder="パスワード（6文字以上）"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={6}
            className="border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-green-400"
          />
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="bg-green-500 text-white rounded-lg py-3 text-sm font-medium hover:bg-green-600 disabled:opacity-50"
          >
            {loading ? '登録中...' : '登録する'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          すでにアカウントをお持ちの方は{' '}
          <Link to="/login" className="text-green-600 font-medium">ログイン</Link>
        </p>
      </div>
    </div>
  )
}
