import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { GENRES } from '../types'

const TEMPLATES = [
  '今日は休む日だった',
  'ごはんを食べた',
  '水を飲んだ',
  '外に出た',
  '今日も生きていた',
  'ベッドから起き上がれた',
]

export default function NewPost() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [content, setContent] = useState('')
  const [genre, setGenre] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const maxLen = 140

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !content.trim()) return
    setLoading(true)
    setError('')

    const { error } = await supabase.from('posts').insert({
      user_id: user.id,
      content: content.trim(),
      genre: genre || null,
      emotion: '達成感',
      rating: 3,
      is_public: isPublic,
    })

    if (error) { setError(error.message); setLoading(false) }
    else navigate('/')
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-24 md:pb-6">
      <h1 className="text-lg font-bold text-gray-800 mb-2">できたことを記録</h1>
      <p className="text-sm text-gray-400 mb-6">どんなに小さなことでも、それはじゅうぶんな「できた」です</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* テンプレート */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-xs text-gray-500 mb-2 font-medium">かんたん入力</p>
          <div className="flex flex-wrap gap-2">
            {TEMPLATES.map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setContent(t)}
                className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                  content === t
                    ? 'bg-green-500 text-white border-green-500'
                    : 'bg-white text-gray-500 border-gray-200 hover:bg-green-50 hover:border-green-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* テキスト入力 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <textarea
            value={content}
            onChange={e => setContent(e.target.value.slice(0, maxLen))}
            placeholder="自由に書いてもOK"
            rows={4}
            className="w-full text-sm text-gray-800 placeholder-gray-400 outline-none resize-none"
          />
          <div className="text-right text-xs text-gray-400 mt-1">
            {content.length}/{maxLen}
          </div>
        </div>

        {/* カテゴリ */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-xs text-gray-500 mb-2 font-medium">カテゴリ（任意）</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setGenre('')}
              className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                genre === '' ? 'bg-green-500 text-white border-green-500' : 'bg-white text-gray-500 border-gray-200'
              }`}
            >
              なし
            </button>
            {GENRES.map(g => (
              <button
                key={g}
                type="button"
                onClick={() => setGenre(g)}
                className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                  genre === g ? 'bg-green-500 text-white border-green-500' : 'bg-white text-gray-500 border-gray-200'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* 公開設定 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700">みんなに公開する</p>
            <p className="text-xs text-gray-400">オフにすると自分だけが見られます</p>
          </div>
          <button
            type="button"
            onClick={() => setIsPublic(!isPublic)}
            className={`w-12 h-6 rounded-full transition-colors ${isPublic ? 'bg-green-500' : 'bg-gray-200'}`}
          >
            <span
              className={`block w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${isPublic ? 'translate-x-6' : 'translate-x-0'}`}
            />
          </button>
        </div>

        {error && <p className="text-red-500 text-xs px-1">{error}</p>}

        <button
          type="submit"
          disabled={loading || !content.trim()}
          className="bg-green-500 text-white rounded-xl py-3.5 text-sm font-medium hover:bg-green-600 disabled:opacity-40"
        >
          {loading ? '投稿中...' : '記録する'}
        </button>
      </form>
    </div>
  )
}
