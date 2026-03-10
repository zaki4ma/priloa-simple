import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import BadgeList from '../components/badges/BadgeList'

const UNLOCK_THRESHOLD = 30

interface PostData {
  id: string
  created_at: string
  genre: string | null
}

interface Stats {
  total: number
  monthlyDays: number
  stampsReceived: number
  weeklyData: number[]
}

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<Stats>({ total: 0, monthlyDays: 0, stampsReceived: 0, weeklyData: [] })
  const [allPosts, setAllPosts] = useState<PostData[]>([])
  useEffect(() => {
    if (!user) return

    // 投稿データを取得
    supabase
      .from('posts')
      .select('id, created_at, genre')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) { console.error('posts fetch error:', error); return }

        const posts = data ?? []
        setAllPosts(posts)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const thisMonth = today.getMonth()
        const thisYear = today.getFullYear()

        const monthlyDays = new Set(
          posts
            .filter(p => {
              const d = new Date(p.created_at)
              return d.getMonth() === thisMonth && d.getFullYear() === thisYear
            })
            .map(p => new Date(p.created_at).toDateString())
        ).size

        const now = Date.now()
        const weeklyData = Array(8).fill(0)
        posts.forEach(p => {
          const diff = (now - new Date(p.created_at).getTime()) / (7 * 24 * 60 * 60 * 1000)
          const weekIndex = Math.floor(diff)
          if (weekIndex >= 0 && weekIndex < 8) weeklyData[7 - weekIndex]++
        })

        // 投稿数・週別グラフはすぐに反映
        setStats(prev => ({ ...prev, total: posts.length, monthlyDays, weeklyData }))

        // スタンプ数を別途取得
        const postIds = posts.map(p => p.id)
        if (postIds.length === 0) return

        supabase
          .from('reactions')
          .select('id', { count: 'exact' })
          .in('post_id', postIds)
          .then(({ count, error: rErr }) => {
            if (rErr) { console.error('reactions fetch error:', rErr); return }
            setStats(prev => ({ ...prev, stampsReceived: count ?? 0 }))
          })
      })
  }, [user])

  const maxWeekly = Math.max(...stats.weeklyData, 1)

  const weekLabels = Array(8).fill(0).map((_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (7 - i) * 7)
    return `${d.getMonth() + 1}/${d.getDate()}`
  })

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-24 md:pb-6">
      <h1 className="text-lg font-bold text-gray-800 mb-6">記録の振り返り</h1>

      <div className="flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
              <p className="text-2xl font-bold text-green-500">{stats.total}</p>
              <p className="text-xs text-gray-500 mt-1">総投稿数</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
              <p className="text-2xl font-bold text-orange-400">{stats.monthlyDays}</p>
              <p className="text-xs text-gray-500 mt-1">今月の記録日</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
              <p className="text-2xl font-bold text-pink-400">{stats.stampsReceived}</p>
              <p className="text-xs text-gray-500 mt-1">もらったスタンプ</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-sm font-medium text-gray-700 mb-4">過去8週間の投稿数</p>
            <div className="flex items-end gap-1.5 h-24">
              {stats.weeklyData.map((count, i) => (
                <div key={i} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full bg-green-400 rounded-t-sm transition-all"
                    style={{ height: `${(count / maxWeekly) * 80}px`, minHeight: count > 0 ? '4px' : '0' }}
                  />
                  {count === 0 && <div className="w-full h-0.5 bg-gray-100 rounded" />}
                </div>
              ))}
            </div>
            <div className="flex gap-1.5 mt-1">
              {weekLabels.map((label, i) => (
                <p key={i} className="flex-1 text-center text-gray-400" style={{ fontSize: '9px' }}>{label}</p>
              ))}
            </div>
          </div>

          {stats.total === 0 && (
            <div className="text-center py-4">
              <p className="text-gray-400 text-sm">まだ投稿がありません</p>
              <p className="text-gray-400 text-xs mt-1">「できた」を記録し始めると統計が表示されます</p>
            </div>
          )}

          {/* バッジ */}
          <BadgeList posts={allPosts} stampsReceived={stats.stampsReceived} />

          {/* 成長分析アンロック */}
          {(() => {
            const progress = Math.min(stats.total, UNLOCK_THRESHOLD)
            const isUnlocked = stats.total >= UNLOCK_THRESHOLD
            const percent = Math.round((progress / UNLOCK_THRESHOLD) * 100)
            return (
              <div className={`rounded-2xl p-4 shadow-sm ${isUnlocked ? 'bg-green-50 border border-green-200' : 'bg-white'}`}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-700">🔍 成長を振り返る</p>
                  {isUnlocked ? (
                    <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">解放！</span>
                  ) : (
                    <span className="text-xs text-gray-400">{progress} / {UNLOCK_THRESHOLD}件</span>
                  )}
                </div>
                {!isUnlocked ? (
                  <>
                    <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
                      <div
                        className="bg-green-400 h-2 rounded-full transition-all"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      {progress === 0
                        ? '投稿を積み重ねると、AIが過去の自分との成長を振り返るレポートを作成します'
                        : progress < 10
                        ? `あと${UNLOCK_THRESHOLD - progress}件！記録を続けよう`
                        : progress < 20
                        ? `いい調子！あと${UNLOCK_THRESHOLD - progress}件で解放されます`
                        : `もう少し！あと${UNLOCK_THRESHOLD - progress}件で成長レポートが見られます`}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-xs text-green-700 mb-3 leading-relaxed">
                      {stats.total}件の記録が積み重なりました。AIがあなたの成長を分析します。
                    </p>
                    <button
                      disabled
                      className="w-full bg-green-500 text-white rounded-xl py-2.5 text-sm font-medium opacity-60 cursor-not-allowed"
                    >
                      成長レポートを見る（近日公開）
                    </button>
                  </>
                )}
              </div>
            )
          })()}
        </div>
    </div>
  )
}
