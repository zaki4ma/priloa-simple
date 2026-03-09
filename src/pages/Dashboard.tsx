import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

interface Stats {
  total: number
  monthlyDays: number
  stampsReceived: number
  weeklyData: number[]
}

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<Stats>({ total: 0, monthlyDays: 0, stampsReceived: 0, weeklyData: [] })
  useEffect(() => {
    if (!user) return

    void (async () => {
      const { data: postData } = await supabase
        .from('posts')
        .select('id, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      const posts = postData ?? []
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

      const weeklyData = Array(8).fill(0)
      posts.forEach(p => {
        const diff = (today.getTime() - new Date(p.created_at).getTime()) / (7 * 24 * 60 * 60 * 1000)
        const weekIndex = Math.floor(diff)
        if (weekIndex >= 0 && weekIndex < 8) weeklyData[7 - weekIndex]++
      })

      const postIds = posts.map(p => p.id)
      let stampsReceived = 0
      if (postIds.length > 0) {
        const { count } = await supabase
          .from('reactions')
          .select('id', { count: 'exact' })
          .in('post_id', postIds)
        stampsReceived = count ?? 0
      }

      setStats({ total: posts.length, monthlyDays, stampsReceived, weeklyData })
    })()
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
        </div>
    </div>
  )
}
