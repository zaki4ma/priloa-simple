import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // リスナー登録前にすでにセッションが確立されている場合に対応
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        setReady(true)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) { setError('パスワードが一致しません'); return }
    if (password.length < 6) { setError('パスワードは6文字以上で入力してください'); return }
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.updateUser({ password })
    if (error) { setError(error.message); setLoading(false) }
    else navigate('/home')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm p-8">
        <h1 className="text-2xl font-bold text-center text-green-600 mb-2">Priloa</h1>
        <p className="text-center text-gray-500 text-sm mb-8">新しいパスワードを設定</p>

        {!ready ? (
          <p className="text-center text-gray-400 text-sm">確認中...</p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input
              type="password"
              placeholder="新しいパスワード"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-green-400"
            />
            <input
              type="password"
              placeholder="新しいパスワード（確認）"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
              className="border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-green-400"
            />
            {error && <p className="text-red-500 text-xs">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="bg-green-500 text-white rounded-lg py-3 text-sm font-medium hover:bg-green-600 disabled:opacity-50"
            >
              {loading ? '更新中...' : 'パスワードを更新'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
