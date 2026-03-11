import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

interface PostItem {
  id: string
  content: string
  genre: string | null
}

interface DayData {
  posts: PostItem[]
  reflection: { id: string; comment: string } | null
}

const toDateKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export default function ReflectionCalendar() {
  const { user } = useAuth()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [dayData, setDayData] = useState<Record<string, DayData>>({})
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [editComment, setEditComment] = useState('')
  const [saving, setSaving] = useState(false)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const fetchMonthData = async () => {
    if (!user) return
    const start = new Date(year, month, 1)
    const end = new Date(year, month + 1, 0, 23, 59, 59)

    const [postsRes, reflectionsRes] = await Promise.all([
      supabase
        .from('posts')
        .select('id, content, genre, created_at')
        .eq('user_id', user.id)
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString()),
      supabase
        .from('daily_reflections')
        .select('id, comment, date')
        .eq('user_id', user.id)
        .gte('date', toDateKey(start))
        .lte('date', toDateKey(end)),
    ])

    const data: Record<string, DayData> = {}

    postsRes.data?.forEach(p => {
      const key = toDateKey(new Date(p.created_at))
      if (!data[key]) data[key] = { posts: [], reflection: null }
      data[key].posts.push({ id: p.id, content: p.content, genre: p.genre })
    })

    reflectionsRes.data?.forEach(r => {
      if (!data[r.date]) data[r.date] = { posts: [], reflection: null }
      data[r.date].reflection = { id: r.id, comment: r.comment }
    })

    setDayData(data)
  }

  useEffect(() => { fetchMonthData() }, [user, year, month])

  const handleDayClick = (day: number) => {
    const key = toDateKey(new Date(year, month, day))
    if (selectedDay === key) {
      setSelectedDay(null)
      return
    }
    setSelectedDay(key)
    setEditComment(dayData[key]?.reflection?.comment ?? '')
  }

  const handleSave = async () => {
    if (!user || !selectedDay || !editComment.trim()) return
    setSaving(true)
    const existing = dayData[selectedDay]?.reflection
    if (existing) {
      await supabase
        .from('daily_reflections')
        .update({ comment: editComment.trim() })
        .eq('id', existing.id)
    } else {
      await supabase
        .from('daily_reflections')
        .insert({ user_id: user.id, date: selectedDay, comment: editComment.trim() })
    }
    setSaving(false)
    fetchMonthData()
  }

  const today = toDateKey(new Date())
  const firstDayOfWeek = (new Date(year, month, 1).getDay() + 6) % 7 // Mon=0
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const selectedData = selectedDay ? dayData[selectedDay] : null

  return (
    <div>
      {/* 月ナビゲーション */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
          className="p-1.5 hover:bg-gray-100 rounded-lg"
        >
          <ChevronLeft size={18} className="text-gray-500" />
        </button>
        <p className="text-sm font-medium text-gray-700">{year}年{month + 1}月</p>
        <button
          onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
          className="p-1.5 hover:bg-gray-100 rounded-lg"
        >
          <ChevronRight size={18} className="text-gray-500" />
        </button>
      </div>

      {/* 曜日ヘッダー */}
      <div className="grid grid-cols-7 mb-1">
        {['月', '火', '水', '木', '金', '土', '日'].map(d => (
          <p key={d} className="text-center text-xs text-gray-400 py-1">{d}</p>
        ))}
      </div>

      {/* カレンダーグリッド */}
      <div className="grid grid-cols-7 gap-1">
        {Array(firstDayOfWeek).fill(null).map((_, i) => <div key={`e${i}`} />)}
        {Array(daysInMonth).fill(null).map((_, i) => {
          const day = i + 1
          const key = toDateKey(new Date(year, month, day))
          const data = dayData[key]
          const hasPosts = (data?.posts.length ?? 0) > 0
          const hasReflection = !!data?.reflection
          const isToday = key === today
          const isSelected = key === selectedDay

          return (
            <button
              key={day}
              onClick={() => handleDayClick(day)}
              className={`relative aspect-square flex flex-col items-center justify-center rounded-xl transition-colors
                ${isSelected ? 'bg-green-100 ring-2 ring-green-400' : isToday ? 'bg-green-50' : 'hover:bg-gray-50'}
              `}
            >
              <span className={`text-xs font-medium leading-none ${isToday ? 'text-green-600' : 'text-gray-700'}`}>
                {day}
              </span>
              {(hasPosts || hasReflection) && (
                <div className="flex gap-0.5 mt-1">
                  {hasPosts && <span className="w-1.5 h-1.5 rounded-full bg-green-400" />}
                  {hasReflection && <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />}
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* 凡例 */}
      <div className="flex gap-4 mt-3 justify-end">
        <span className="flex items-center gap-1 text-xs text-gray-400">
          <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />投稿あり
        </span>
        <span className="flex items-center gap-1 text-xs text-gray-400">
          <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" />振り返りあり
        </span>
      </div>

      {/* 選択した日の詳細 */}
      {selectedDay && (
        <div className="mt-4 bg-gray-50 rounded-2xl p-4">
          <p className="text-xs font-medium text-gray-500 mb-3">
            {new Date(selectedDay + 'T00:00:00').toLocaleDateString('ja-JP', {
              month: 'long', day: 'numeric', weekday: 'short'
            })}
          </p>

          {/* 投稿一覧 */}
          {selectedData && selectedData.posts.length > 0 ? (
            <div className="flex flex-col gap-2 mb-4">
              {selectedData.posts.map(p => (
                <div key={p.id} className="bg-white rounded-xl px-3 py-2.5 shadow-sm">
                  <p className="text-sm text-gray-800 leading-relaxed">{p.content}</p>
                  {p.genre && (
                    <p className="text-xs text-green-600 mt-1">{p.genre}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 mb-4">この日の投稿はありません</p>
          )}

          {/* 振り返り入力（投稿がある日だけ） */}
          {selectedData && selectedData.posts.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1.5">✨ 自分へのひとこと</p>
              <textarea
                value={editComment}
                onChange={e => setEditComment(e.target.value)}
                placeholder="今日の自分を褒めてあげよう..."
                rows={2}
                className="w-full text-sm text-gray-800 placeholder-gray-400 bg-white rounded-xl px-3 py-2.5 shadow-sm outline-none resize-none"
              />
              <button
                onClick={handleSave}
                disabled={saving || !editComment.trim()}
                className="mt-2 w-full bg-green-500 text-white rounded-xl py-2 text-sm font-medium hover:bg-green-600 disabled:opacity-40 transition-colors"
              >
                {saving ? '保存中...' : (selectedData.reflection ? '更新する' : '保存する')}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
