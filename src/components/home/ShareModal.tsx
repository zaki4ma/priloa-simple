import { useState, useMemo, useRef } from 'react'
import { X, ImageDown, Loader2 } from 'lucide-react'
import html2canvas from 'html2canvas'
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
  const [capturing, setCapturing] = useState(false)
  const [captureError, setCaptureError] = useState('')
  const cardRef = useRef<HTMLDivElement>(null)

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

  const handleSaveImage = async () => {
    if (!cardRef.current || capturing) return
    setCapturing(true)
    setCaptureError('')
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
      })

      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'))
      if (!blob) throw new Error('画像の生成に失敗しました')

      // モバイル: Web Share API（カメラロールへ保存可能）
      const file = new File([blob], 'priloa-today.png', { type: 'image/png' })
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file] })
      } else {
        // PC: ダウンロード
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'priloa-today.png'
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : '不明なエラー'
      // ユーザーが共有シートをキャンセルした場合は無視
      if (msg.includes('AbortError') || msg.includes('cancel') || msg.toLowerCase().includes('abort')) return
      setCaptureError(`画像の生成に失敗しました: ${msg}`)
    } finally {
      setCapturing(false)
    }
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
            <p className="text-xs text-gray-400 mb-2">カードプレビュー</p>

            {/* カード本体（html2canvas対象） */}
            <div ref={cardRef} style={{ border: '1px solid #dcfce7', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              {/* カードヘッダー */}
              <div style={{ background: 'linear-gradient(to right, #22c55e, #4ade80)', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <img src="/logo_priloa.png" alt="Priloa" style={{ width: '20px', height: '20px', display: 'block' }} />
                  <span style={{ color: '#ffffff', fontWeight: 700, fontSize: '14px', letterSpacing: '0.05em', lineHeight: 1 }}>Priloa</span>
                </div>
                <span style={{ color: '#dcfce7', fontSize: '12px', lineHeight: 1 }}>{today}</span>
              </div>

              {/* カードボディ */}
              <div style={{ background: 'linear-gradient(to bottom, #f0fdf4, #ffffff)', position: 'relative', minHeight: '200px' }}>
                {/* ユーザー情報 */}
                <div style={{ padding: '12px 16px 8px', borderBottom: '1px solid #dcfce7' }}>
                  <p style={{ fontSize: '14px', fontWeight: 700, color: '#1f2937', margin: 0, lineHeight: 1.5 }}>
                    {avatar} {nickname}
                    <span style={{ fontWeight: 400, color: '#6b7280' }}> の今日のできたこと</span>
                  </p>
                </div>

                {/* できたこと一覧 */}
                <div style={{ padding: '12px 112px 16px 16px' }}>
                  {selectedPosts.length === 0 ? (
                    <p style={{ fontSize: '12px', color: '#9ca3af', fontStyle: 'italic', margin: 0 }}>投稿を選択してください</p>
                  ) : (
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {selectedPosts.map(p => (
                        <li key={p.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                          <span style={{ color: '#22c55e', fontSize: '12px', lineHeight: '1.6', flexShrink: 0 }}>✓</span>
                          <span style={{ fontSize: '12px', color: '#1f2937', lineHeight: '1.6' }}>{p.content}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {streak > 0 && (
                    <div style={{ marginTop: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: '#fff7ed', color: '#f97316', fontSize: '12px', fontWeight: 500, padding: '4px 10px', borderRadius: '9999px', lineHeight: 1 }}>
                      🔥 {streak}日連続記録中！
                    </div>
                  )}
                </div>

                {/* キャラクター */}
                <img
                  src="/chara_teage.png"
                  alt=""
                  style={{ position: 'absolute', bottom: 0, right: 0, width: '112px', height: '112px', objectFit: 'contain' }}
                />
              </div>

              {/* カードフッター */}
              <div style={{ backgroundColor: '#22c55e', padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: '#dcfce7', fontSize: '10px', lineHeight: 1 }}>小さな「できた」を大切に</span>
                <span style={{ color: '#bbf7d0', fontSize: '10px', fontWeight: 500, lineHeight: 1 }}>#Priloa</span>
              </div>
            </div>
          </div>

          {/* 画像保存ボタン */}
          <button
            onClick={handleSaveImage}
            disabled={capturing || selectedPosts.length === 0}
            className="w-full bg-green-500 text-white rounded-full py-3 text-sm font-medium hover:bg-green-600 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {capturing ? (
              <><Loader2 size={16} className="animate-spin" /> 生成中...</>
            ) : (
              <><ImageDown size={16} /> 画像を保存する</>
            )}
          </button>
          {captureError && (
            <p className="text-xs text-red-500 text-center -mt-2">{captureError}</p>
          )}

          {/* Xテキストシェア（サブ） */}
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
