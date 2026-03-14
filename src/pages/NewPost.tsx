import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
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

const MOODS = [
  { rating: 1, emoji: '😔', label: 'つらい' },
  { rating: 2, emoji: '😐', label: 'ふつう' },
  { rating: 3, emoji: '🙂', label: 'まあまあ' },
  { rating: 4, emoji: '😊', label: 'よかった' },
  { rating: 5, emoji: '🌟', label: 'とてもよかった' },
]

export default function NewPost() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [content, setContent] = useState('')
  const [genre, setGenre] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // ムード入力モーダル
  const [newPostId, setNewPostId] = useState<string | null>(null)
  const [savingMood, setSavingMood] = useState(false)

  const maxLen = 140

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !content.trim()) return
    setLoading(true)
    setError('')

    const { data, error } = await supabase
      .from('posts')
      .insert({
        user_id: user.id,
        content: content.trim(),
        genre: genre || null,
        emotion: '達成感',
        is_public: isPublic,
      })
      .select('id')
      .single()

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setNewPostId(data.id)
      setLoading(false)
    }
  }

  const handleMoodSelect = async (rating: number) => {
    if (!newPostId || savingMood) return
    setSavingMood(true)
    await supabase.from('posts').update({ rating }).eq('id', newPostId)
    navigate('/')
  }

  const handleSkip = () => navigate('/')

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

      {/* ムード入力モーダル */}
      <AnimatePresence>
        {newPostId && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white w-full max-w-lg rounded-t-3xl md:rounded-3xl shadow-xl px-6 pt-6 pb-10 md:pb-8"
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            >
              <p className="text-center text-2xl mb-1">🎉</p>
              <p className="text-center text-base font-bold text-gray-800 mb-1">記録できました！</p>
              <p className="text-center text-sm text-gray-500 mb-6">今の気分はどうですか？</p>

              <div className="flex justify-center gap-3 mb-6">
                {MOODS.map(m => (
                  <motion.button
                    key={m.rating}
                    onClick={() => handleMoodSelect(m.rating)}
                    disabled={savingMood}
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.9 }}
                    className="flex flex-col items-center gap-1 disabled:opacity-50"
                  >
                    <span className="text-3xl">{m.emoji}</span>
                    <span className="text-[10px] text-gray-400">{m.label}</span>
                  </motion.button>
                ))}
              </div>

              <button
                onClick={handleSkip}
                className="w-full text-center text-xs text-gray-400 hover:text-gray-600 py-1"
              >
                スキップ
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
