import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

const AVATARS = ['🌱', '🌸', '🍀', '⭐', '🐶', '🐱', '🐼', '🦊', '🐸', '🌈', '☀️', '🍎']

export default function Profile() {
  const { user, profile, signOut, refreshProfile } = useAuth()
  const [nickname, setNickname] = useState(profile?.nickname ?? '')
  const [avatar, setAvatar] = useState(profile?.avatar ?? '🌱')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    await supabase.from('user_profiles').update({ nickname, avatar }).eq('id', user.id)
    await refreshProfile()
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-24 md:pb-6">
      <h1 className="text-lg font-bold text-gray-800 mb-6">プロフィール</h1>

      <div className="flex flex-col gap-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-medium text-gray-500 mb-3">アバター</p>
          <div className="flex flex-wrap gap-2">
            {AVATARS.map(a => (
              <button
                key={a}
                onClick={() => setAvatar(a)}
                className={`text-2xl w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                  avatar === a ? 'bg-green-100 ring-2 ring-green-400' : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <label className="text-xs font-medium text-gray-500 block mb-2">ニックネーム</label>
          <input
            type="text"
            value={nickname}
            onChange={e => setNickname(e.target.value)}
            maxLength={20}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-green-400"
          />
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-medium text-gray-500 mb-1">メールアドレス</p>
          <p className="text-sm text-gray-600">{user?.email}</p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving || !nickname.trim()}
          className="bg-green-500 text-white rounded-xl py-3.5 text-sm font-medium hover:bg-green-600 disabled:opacity-40"
        >
          {saved ? '保存しました ✓' : saving ? '保存中...' : '変更を保存'}
        </button>

        <button
          onClick={signOut}
          className="border border-gray-200 text-gray-500 rounded-xl py-3 text-sm hover:bg-gray-50"
        >
          ログアウト
        </button>

        <div className="text-center text-xs text-gray-400 space-y-1 pt-2">
          <div className="flex items-center justify-center gap-4">
            <a
              href="https://x.com/priloa_me"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-600 transition-colors"
            >
              X @priloa_me
            </a>
            <span>·</span>
            <a
              href="https://forms.gle/dnkEsPyQiZMb2i4C7"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-600 transition-colors"
            >
              お問い合わせ・報告
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
