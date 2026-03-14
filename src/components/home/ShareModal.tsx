import { useState, useMemo } from 'react'
import { X, Camera } from 'lucide-react'
import type { Post } from '../../types'

interface Props {
  todayPosts: Post[]
  nickname: string
  avatar: string
  streak: number
  onClose: () => void
}

const FOOTER = '\n#今日のできた #Priloa'

function buildTweetText(posts: Post[]): string {
  const d = new Date()
  const header = `今日のできたこと（${d.getMonth() + 1}/${d.getDate()}）\n\n`
  const body = posts.map(p => `・${p.content}`).join('\n')
  return header + body + FOOTER
}

function twitterLength(text: string): number {
  let count = 0
  for (const char of text) {
    const code = char.codePointAt(0) ?? 0
    count += code <= 0x00ff ? 1 : 2
  }
  return count
}

function formatDateJa(d: Date): string {
  const days = ['日', '月', '火', '水', '木', '金', '土']
  return `${d.getMonth() + 1}月${d.getDate()}日（${days[d.getDay()]}）`
}

export default function ShareModal({ todayPosts, nickname, avatar, streak, onClose }: Props) {
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

  const today = formatDateJa(new Date())

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-lg rounded-t-3xl md:rounded-3xl shadow-xl flex flex-col max-h-[92dvh]"
        onClick={e => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
          <h2 className="text-sm font-bold text-gray-800">今日のできたことをシェア</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 pb-5 flex flex-col gap-4">
          {/* 投稿選択 */}
          <div>
            <p className="text-xs text-gray-400 mb-2">シェアする内容を選択</p>
            <div className="flex flex-col gap-1.5">
              {todayPosts.map(p => (
                <label
                  key={p.id}
                  className="flex items-start gap-2.5 bg-gray-50 rounded-xl px-3 py-2.5 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(p.id)}
                    onChange={() => toggle(p.id)}
                    className="mt-0.5 accent-green-500 shrink-0"
                  />
                  <span className="text-xs text-gray-700 leading-relaxed">{p.content}</span>
                </label>
              ))}
            </div>
          </div>

          {/* シェアカードプレビュー */}
          <div>
            <p className="text-xs text-gray-400 mb-2">カードプレビュー（スクリーンショットして使えます）</p>

            {/* カード本体 */}
            <div className="rounded-2xl overflow-hidden shadow-md border border-green-100 select-none">
              {/* カードヘッダー */}
              <div className="bg-gradient-to-r from-green-500 to-green-400 px-4 py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <img src="/logo_priloa.png" alt="Priloa" className="w-5 h-5" />
                  <span className="text-white font-bold text-sm tracking-wide">Priloa</span>
                </div>
                <span className="text-green-100 text-xs">{today}</span>
              </div>

              {/* カードボディ */}
              <div className="bg-gradient-to-b from-green-50 to-white relative min-h-[200px]">
                {/* ユーザー情報 */}
                <div className="px-4 pt-3 pb-2 border-b border-green-100">
                  <p className="text-sm font-bold text-gray-800">
                    {avatar} {nickname}
                    <span className="text-gray-500 font-normal"> の今日のできたこと</span>
                  </p>
                </div>

                {/* できたこと一覧 */}
                <div className="px-4 pt-3 pb-4 pr-28">
                  {selectedPosts.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">投稿を選択してください</p>
                  ) : (
                    <ul className="flex flex-col gap-2">
                      {selectedPosts.map(p => (
                        <li key={p.id} className="flex items-start gap-2">
                          <span className="text-green-500 text-xs mt-0.5 shrink-0">✓</span>
                          <span className="text-gray-800 text-xs leading-relaxed">{p.content}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {streak > 0 && (
                    <div className="mt-3 inline-flex items-center gap-1 bg-orange-50 text-orange-500 text-xs font-medium px-2.5 py-1 rounded-full">
                      🔥 {streak}日連続記録中！
                    </div>
                  )}
                </div>

                {/* キャラクター画像 */}
                <img
                  src="/chara_teage.png"
                  alt=""
                  className="absolute bottom-0 right-0 w-28 h-28 object-contain"
                />
              </div>

              {/* カードフッター */}
              <div className="bg-green-500 px-4 py-2 flex items-center justify-between">
                <span className="text-green-100 text-[10px]">小さな「できた」を大切に</span>
                <span className="text-green-200 text-[10px] font-medium">#Priloa</span>
              </div>
            </div>

            {/* スクリーンショット案内 */}
            <div className="mt-2.5 flex items-center gap-1.5 text-xs text-gray-400 justify-center">
              <Camera size={12} />
              <span>このカードをスクリーンショットして投稿できます</span>
            </div>
          </div>

          {/* Xでテキストシェア（サブ） */}
          <div className="border-t border-gray-100 pt-3">
            <p className="text-xs text-gray-400 mb-2">またはテキストで投稿</p>
            <button
              onClick={handleShare}
              disabled={overLimit || selectedPosts.length === 0}
              className="w-full bg-black text-white rounded-full py-2.5 text-sm font-medium hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <span className="font-bold">𝕏</span> でシェアする
            </button>
            {overLimit && (
              <p className="text-xs text-red-400 text-center mt-1">文字数超過 — チェックを外して減らしてください</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
