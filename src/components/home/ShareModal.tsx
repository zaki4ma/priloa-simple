import { useState, useMemo } from 'react'
import { X } from 'lucide-react'
import type { Post } from '../../types'

interface Props {
  todayPosts: Post[]
  onClose: () => void
}

const FOOTER = '\n#今日のできた #Priloa'

function buildTweetText(posts: Post[]): string {
  const d = new Date()
  const header = `今日のできたこと（${d.getMonth() + 1}/${d.getDate()}）\n\n`
  const body = posts.map(p => `・${p.content}`).join('\n')
  return header + body + FOOTER
}

// Twitterは全角文字を2文字としてカウントする
function twitterLength(text: string): number {
  let count = 0
  for (const char of text) {
    const code = char.codePointAt(0) ?? 0
    count += code <= 0x00ff ? 1 : 2
  }
  return count
}

export default function ShareModal({ todayPosts, onClose }: Props) {
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(todayPosts.map(p => p.id))
  )

  const selectedPosts = useMemo(
    () => todayPosts.filter(p => selected.has(p.id)),
    [todayPosts, selected]
  )

  const tweetText = useMemo(() => buildTweetText(selectedPosts), [selectedPosts])
  const charCount = useMemo(() => twitterLength(tweetText), [tweetText])
  const overLimit = charCount > 280

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleShare = () => {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`,
      '_blank'
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-lg rounded-t-3xl md:rounded-3xl shadow-xl flex flex-col max-h-[85dvh]"
        onClick={e => e.stopPropagation()}
      >
        {/* ヘッダー（固定） */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 shrink-0">
          <h2 className="text-base font-bold text-gray-800">今日のできたことをシェア</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {/* 投稿選択（スクロール） */}
        <div className="overflow-y-auto px-6 flex flex-col gap-2">
          {todayPosts.map(p => (
            <label
              key={p.id}
              className="flex items-start gap-3 bg-gray-50 rounded-xl px-4 py-3 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selected.has(p.id)}
                onChange={() => toggle(p.id)}
                className="mt-0.5 accent-green-500"
              />
              <span className="text-sm text-gray-700 leading-relaxed">{p.content}</span>
            </label>
          ))}
        </div>

        {/* プレビュー・ボタン（固定） */}
        <div className="px-6 pb-6 pt-4 shrink-0">
          <div className="bg-gray-50 rounded-xl px-4 py-3 mb-3">
            <p className="text-xs text-gray-400 mb-2">プレビュー</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
              {selectedPosts.length > 0 ? tweetText : '投稿を1件以上選択してください'}
            </p>
          </div>

          <p className={`text-xs text-right mb-3 ${overLimit ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
            {charCount} / 280
            {overLimit && '　チェックを外して減らしてください'}
          </p>

          <button
            onClick={handleShare}
            disabled={overLimit || selectedPosts.length === 0}
            className="w-full bg-black text-white rounded-full py-3 text-sm font-medium hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            𝕏 でシェアする
          </button>
        </div>
      </div>
    </div>
  )
}
