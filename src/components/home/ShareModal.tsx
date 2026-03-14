import { useState, useMemo, useRef } from 'react'
import { X, ImageDown, Loader2 } from 'lucide-react'
import type { Post } from '../../types'

interface Props {
  todayPosts: Post[]
  nickname: string
  avatar: string
  streak: number
  onClose: () => void
}

const FOOTER_TWEET = '\n#今日のできた #Priloa'

function buildTweetText(posts: Post[]): string {
  const d = new Date()
  const header = `今日のできたこと（${d.getMonth() + 1}/${d.getDate()}）\n\n`
  const body = posts.map(p => `・${p.content}`).join('\n')
  return header + body + FOOTER_TWEET
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

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

function roundRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.arcTo(x + w, y, x + w, y + r, r)
  ctx.lineTo(x + w, y + h - r)
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
  ctx.lineTo(x + r, y + h)
  ctx.arcTo(x, y + h, x, y + h - r, r)
  ctx.lineTo(x, y + r)
  ctx.arcTo(x, y, x + r, y, r)
  ctx.closePath()
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = []
  let line = ''
  for (const char of text) {
    const test = line + char
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line)
      line = char
    } else {
      line = test
    }
  }
  if (line) lines.push(line)
  return lines
}

async function drawCard(
  posts: Post[],
  nickname: string,
  avatar: string,
  streak: number,
  today: string,
): Promise<Blob> {
  const SCALE = 2
  const W = 560
  const PAD = 20
  const FONT = 'system-ui, -apple-system, "Helvetica Neue", sans-serif'
  const HEADER_H = 48
  const USER_H = 46
  const FOOTER_H = 36
  const CHARA_SIZE = 108
  const LINE_H = 22
  const MAX_TEXT_W = W - PAD * 2 - 20 - CHARA_SIZE  // チェックマーク分 + キャラ分

  // 仮キャンバスでテキスト計測
  const tmp = document.createElement('canvas')
  const tctx = tmp.getContext('2d')!
  tctx.font = `12px ${FONT}`

  // コンテンツの高さを計算
  let contentH = PAD
  const postLines: string[][] = []
  for (const post of posts) {
    const lines = wrapText(tctx, post.content, MAX_TEXT_W)
    postLines.push(lines)
    contentH += lines.length * LINE_H + 6
  }
  contentH += streak > 0 ? 36 : PAD
  contentH = Math.max(contentH, CHARA_SIZE + PAD)

  const H = HEADER_H + USER_H + contentH + FOOTER_H

  const canvas = document.createElement('canvas')
  canvas.width = W * SCALE
  canvas.height = H * SCALE
  const ctx = canvas.getContext('2d')!
  ctx.scale(SCALE, SCALE)

  // 角丸クリップ
  roundRectPath(ctx, 0, 0, W, H, 16)
  ctx.clip()

  // ── ヘッダー ──
  const hGrad = ctx.createLinearGradient(0, 0, W, 0)
  hGrad.addColorStop(0, '#22c55e')
  hGrad.addColorStop(1, '#4ade80')
  ctx.fillStyle = hGrad
  ctx.fillRect(0, 0, W, HEADER_H)

  const logoImg = await loadImage('/logo_priloa.png')
  const logoY = (HEADER_H - 20) / 2
  ctx.drawImage(logoImg, PAD, logoY, 20, 20)

  ctx.fillStyle = '#ffffff'
  ctx.font = `bold 14px ${FONT}`
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'left'
  ctx.fillText('Priloa', PAD + 26, HEADER_H / 2)

  ctx.fillStyle = '#dcfce7'
  ctx.font = `12px ${FONT}`
  ctx.textAlign = 'right'
  ctx.fillText(today, W - PAD, HEADER_H / 2)

  // ── ボディ背景 ──
  const bGrad = ctx.createLinearGradient(0, HEADER_H, 0, HEADER_H + USER_H + contentH)
  bGrad.addColorStop(0, '#f0fdf4')
  bGrad.addColorStop(1, '#ffffff')
  ctx.fillStyle = bGrad
  ctx.fillRect(0, HEADER_H, W, USER_H + contentH)

  // ユーザー行
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  const userY = HEADER_H + USER_H / 2

  ctx.font = `bold 14px ${FONT}`
  ctx.fillStyle = '#1f2937'
  const nameText = `${avatar} ${nickname}`
  ctx.fillText(nameText, PAD, userY)
  const nameW = ctx.measureText(nameText).width

  ctx.font = `14px ${FONT}`
  ctx.fillStyle = '#6b7280'
  ctx.fillText(' の今日のできたこと', PAD + nameW, userY)

  // 区切り線
  ctx.strokeStyle = '#dcfce7'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(0, HEADER_H + USER_H)
  ctx.lineTo(W, HEADER_H + USER_H)
  ctx.stroke()

  // ── 投稿一覧 ──
  ctx.textBaseline = 'top'
  let y = HEADER_H + USER_H + PAD
  for (let i = 0; i < posts.length; i++) {
    ctx.font = `12px ${FONT}`
    ctx.fillStyle = '#22c55e'
    ctx.fillText('✓', PAD, y + 2)

    ctx.fillStyle = '#1f2937'
    for (const line of postLines[i]) {
      ctx.fillText(line, PAD + 20, y)
      y += LINE_H
    }
    y += 6
  }

  // ストリークバッジ
  if (streak > 0) {
    y += 4
    const badgeText = `🔥 ${streak}日連続記録中！`
    ctx.font = `bold 12px ${FONT}`
    const bW = ctx.measureText(badgeText).width + 20
    const bH = 26
    ctx.fillStyle = '#fff7ed'
    roundRectPath(ctx, PAD, y, bW, bH, 13)
    ctx.fill()
    ctx.fillStyle = '#f97316'
    ctx.textBaseline = 'middle'
    ctx.fillText(badgeText, PAD + 10, y + bH / 2)
  }

  // キャラクター
  const charaImg = await loadImage('/chara_teage.png')
  const charaY = HEADER_H + USER_H + contentH - CHARA_SIZE
  ctx.drawImage(charaImg, W - CHARA_SIZE, charaY, CHARA_SIZE, CHARA_SIZE)

  // ── フッター ──
  const footerY = H - FOOTER_H
  ctx.fillStyle = '#22c55e'
  ctx.fillRect(0, footerY, W, FOOTER_H)

  ctx.fillStyle = '#dcfce7'
  ctx.font = `10px ${FONT}`
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'left'
  ctx.fillText('小さな「できた」を大切に', PAD, footerY + FOOTER_H / 2)

  ctx.fillStyle = '#bbf7d0'
  ctx.font = `bold 10px ${FONT}`
  ctx.textAlign = 'right'
  ctx.fillText('#Priloa', W - PAD, footerY + FOOTER_H / 2)

  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('画像の生成に失敗しました')), 'image/png')
  })
}

export default function ShareModal({ todayPosts, nickname, avatar, streak, onClose }: Props) {
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(todayPosts.map(p => p.id))
  )
  const [capturing, setCapturing] = useState(false)
  const [captureError, setCaptureError] = useState('')
  // previewRef は見た目確認用（画像生成には使わない）
  const previewRef = useRef<HTMLDivElement>(null)

  const selectedPosts = useMemo(
    () => todayPosts.filter(p => selected.has(p.id)),
    [todayPosts, selected]
  )

  const tweetText = useMemo(() => buildTweetText(selectedPosts), [selectedPosts])
  const charCount = useMemo(() => twitterLength(tweetText), [tweetText])
  const overLimit = charCount > 280
  const today = formatDateJa(new Date())

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
    if (capturing || selectedPosts.length === 0) return
    setCapturing(true)
    setCaptureError('')
    try {
      const blob = await drawCard(selectedPosts, nickname, avatar, streak, today)
      const file = new File([blob], 'priloa-today.png', { type: 'image/png' })

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file] })
      } else {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'priloa-today.png'
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : '不明なエラー'
      if (msg.toLowerCase().includes('abort')) return
      setCaptureError(`画像の生成に失敗しました: ${msg}`)
    } finally {
      setCapturing(false)
    }
  }

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

          {/* カードプレビュー（見た目確認用・HTML） */}
          <div>
            <p className="text-xs text-gray-400 mb-2">カードプレビュー</p>
            <div ref={previewRef} style={{ border: '1px solid #dcfce7', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <div style={{ background: 'linear-gradient(to right, #22c55e, #4ade80)', padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <img src="/logo_priloa.png" alt="" style={{ width: '20px', height: '20px', display: 'block' }} />
                  <span style={{ color: '#fff', fontWeight: 700, fontSize: '14px' }}>Priloa</span>
                </div>
                <span style={{ color: '#dcfce7', fontSize: '12px' }}>{today}</span>
              </div>
              <div style={{ background: 'linear-gradient(to bottom, #f0fdf4, #ffffff)', position: 'relative', minHeight: '160px' }}>
                <div style={{ padding: '12px 20px 10px', borderBottom: '1px solid #dcfce7' }}>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#1f2937' }}>{avatar} {nickname}</span>
                  <span style={{ fontSize: '14px', color: '#6b7280' }}> の今日のできたこと</span>
                </div>
                <div style={{ padding: '12px 20px 16px', paddingRight: '120px' }}>
                  {selectedPosts.length === 0
                    ? <p style={{ fontSize: '12px', color: '#9ca3af' }}>投稿を選択してください</p>
                    : <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {selectedPosts.map(p => (
                          <li key={p.id} style={{ display: 'flex', gap: '8px', fontSize: '12px', color: '#1f2937' }}>
                            <span style={{ color: '#22c55e', flexShrink: 0 }}>✓</span>
                            <span style={{ lineHeight: '1.6' }}>{p.content}</span>
                          </li>
                        ))}
                      </ul>
                  }
                  {streak > 0 && (
                    <div style={{ marginTop: '10px', display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: '#fff7ed', color: '#f97316', fontSize: '12px', fontWeight: 600, padding: '4px 10px', borderRadius: '9999px' }}>
                      🔥 {streak}日連続記録中！
                    </div>
                  )}
                </div>
                <img src="/chara_teage.png" alt="" style={{ position: 'absolute', bottom: 0, right: 0, width: '108px', height: '108px', objectFit: 'contain' }} />
              </div>
              <div style={{ backgroundColor: '#22c55e', padding: '8px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: '#dcfce7', fontSize: '10px' }}>小さな「できた」を大切に</span>
                <span style={{ color: '#bbf7d0', fontSize: '10px', fontWeight: 500 }}>#Priloa</span>
              </div>
            </div>
          </div>

          {/* 画像保存ボタン */}
          <button
            onClick={handleSaveImage}
            disabled={capturing || selectedPosts.length === 0}
            className="w-full bg-green-500 text-white rounded-full py-3 text-sm font-medium hover:bg-green-600 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {capturing
              ? <><Loader2 size={16} className="animate-spin" /> 生成中...</>
              : <><ImageDown size={16} /> 画像を保存する</>
            }
          </button>
          {captureError && (
            <p className="text-xs text-red-500 text-center -mt-2">{captureError}</p>
          )}

          {/* Xテキストシェア */}
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
