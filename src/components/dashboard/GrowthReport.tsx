import { useState } from 'react'
import { Sparkles, Eye, TrendingUp, Lightbulb, RefreshCw, GitCompare } from 'lucide-react'
import { analyzeGrowth } from '../../services/growthAnalysis'
import type { GrowthAnalysisResult } from '../../services/growthAnalysis'

interface PostData {
  content: string
  genre: string | null
  created_at: string
  rating?: number | null
}

interface Props {
  posts: PostData[]
  streak: number
}

// ── 月別投稿数バーチャート ──────────────────────────────
function MonthlyChart({ posts }: { posts: PostData[] }) {
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date()
    d.setDate(1)
    d.setMonth(d.getMonth() - (5 - i))
    const year = d.getFullYear()
    const month = d.getMonth()
    const count = posts.filter(p => {
      const pd = new Date(p.created_at)
      return pd.getFullYear() === year && pd.getMonth() === month
    }).length
    return { label: `${d.getMonth() + 1}月`, count }
  })

  const max = Math.max(...months.map(m => m.count), 1)

  return (
    <div>
      <p className="text-xs font-medium text-gray-600 mb-3">月別投稿数（過去6ヶ月）</p>
      <div className="flex items-end gap-2 h-24">
        {months.map((m, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-xs text-gray-500" style={{ minHeight: '16px' }}>
              {m.count > 0 ? m.count : ''}
            </span>
            <div
              className="w-full bg-green-400 rounded-t-sm transition-all"
              style={{ height: `${(m.count / max) * 56}px`, minHeight: m.count > 0 ? '4px' : '0' }}
            />
            {m.count === 0 && <div className="w-full h-0.5 bg-gray-100 rounded" />}
            <span className="text-xs text-gray-400">{m.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── カテゴリ別横棒グラフ ──────────────────────────────
function CategoryChart({ posts }: { posts: PostData[] }) {
  const counts = posts.reduce((acc, p) => {
    if (p.genre) acc[p.genre] = (acc[p.genre] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5)
  if (sorted.length === 0) return null

  const max = sorted[0][1]
  const colors = ['bg-green-400', 'bg-blue-400', 'bg-purple-400', 'bg-orange-400', 'bg-pink-400']

  return (
    <div>
      <p className="text-xs font-medium text-gray-600 mb-3">カテゴリ別（上位5件）</p>
      <div className="space-y-2">
        {sorted.map(([genre, count], i) => (
          <div key={genre} className="flex items-center gap-2">
            <span className="text-xs text-gray-600 w-20 truncate flex-shrink-0">{genre}</span>
            <div className="flex-1 bg-gray-100 rounded-full h-2">
              <div
                className={`${colors[i]} h-2 rounded-full transition-all`}
                style={{ width: `${(count / max) * 100}%` }}
              />
            </div>
            <span className="text-xs text-gray-500 w-6 text-right flex-shrink-0">{count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── AI分析結果カード ──────────────────────────────
function InsightCard({
  icon,
  label,
  text,
  colorClass,
  bgClass,
  borderClass,
}: {
  icon: React.ReactNode
  label: string
  text: string
  colorClass: string
  bgClass: string
  borderClass: string
}) {
  return (
    <div className={`${bgClass} ${borderClass} border rounded-2xl p-4`}>
      <div className="flex items-center gap-2 mb-2">
        <span className={colorClass}>{icon}</span>
        <p className={`text-xs font-medium ${colorClass}`}>{label}</p>
      </div>
      <p className="text-sm leading-relaxed text-gray-800">{text}</p>
    </div>
  )
}

// ── メインコンポーネント ──────────────────────────────
export default function GrowthReport({ posts, streak }: Props) {
  const [result, setResult] = useState<GrowthAnalysisResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const uniqueDays = new Set(posts.map(p => new Date(p.created_at).toDateString())).size

  const handleAnalyze = async () => {
    setLoading(true)
    setError('')
    try {
      const analysis = await analyzeGrowth(posts, {
        totalPosts: posts.length,
        uniqueDays,
        streak,
      })
      setResult(analysis)
    } catch (e) {
      setError(e instanceof Error ? e.message : '分析に失敗しました。しばらく待ってから再度お試しください。')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* グラフ（常時表示） */}
      <div className="bg-white rounded-2xl p-4 shadow-sm space-y-6">
        <MonthlyChart posts={posts} />
        <CategoryChart posts={posts} />
      </div>

      {/* AI分析 */}
      {!result ? (
        <div className="text-center">
          <p className="text-xs text-green-700 mb-1 leading-relaxed">
            {posts.length}件の記録をもとに、あなたが気づいていない変化を分析します。
          </p>
          <p className="text-xs text-gray-400 mb-3">初期・中期・最近の投稿を比較して傾向を読み取ります</p>
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="w-full bg-green-500 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-green-600 disabled:opacity-40 flex items-center justify-center gap-2 transition-colors"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                分析中...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                成長レポートを見る
              </>
            )}
          </button>
          {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
        </div>
      ) : (
        <div className="space-y-3">
          <InsightCard
            icon={<GitCompare className="w-4 h-4" />}
            label="初期→最近の変化"
            text={result.changeObservation}
            colorClass="text-blue-600"
            bgClass="bg-blue-50"
            borderClass="border-blue-200"
          />
          <InsightCard
            icon={<Eye className="w-4 h-4" />}
            label="気づいていないかもしれないパターン"
            text={result.hiddenPattern}
            colorClass="text-purple-600"
            bgClass="bg-purple-50"
            borderClass="border-purple-200"
          />
          <InsightCard
            icon={<TrendingUp className="w-4 h-4" />}
            label="成長の証拠"
            text={result.growthEvidence}
            colorClass="text-green-600"
            bgClass="bg-green-50"
            borderClass="border-green-200"
          />
          <InsightCard
            icon={<Lightbulb className="w-4 h-4" />}
            label="新しい視点"
            text={result.newPerspective}
            colorClass="text-orange-600"
            bgClass="bg-orange-50"
            borderClass="border-orange-200"
          />

          {/* 再分析ボタン */}
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="w-full text-gray-400 text-xs py-2 flex items-center justify-center gap-1 hover:text-gray-600 transition-colors disabled:opacity-40"
          >
            <RefreshCw className="w-3 h-3" />
            再分析する
          </button>
          {error && <p className="text-red-500 text-xs text-center">{error}</p>}
        </div>
      )}
    </div>
  )
}
