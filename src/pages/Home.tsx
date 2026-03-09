import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { Post } from '../types'
import { STAMPS } from '../types'

export default function Home() {
  const { user, profile } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPosts = async () => {
    if (!user) return
    const { data } = await supabase
      .from('posts')
      .select('*, reactions(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30)
    setPosts(data ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchPosts() }, [user])

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    const hours = Math.floor(diff / 3600000)
    if (hours < 1) return 'たった今'
    if (hours < 24) return `${hours}時間前`
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days}日前`
    return d.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-24 md:pb-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-bold text-gray-800">
            {profile?.avatar} {profile?.nickname}
          </h1>
          <p className="text-sm text-gray-500">今日も何か「できた」ことを記録しよう</p>
        </div>
        <Link
          to="/new"
          className="flex items-center gap-1.5 bg-green-500 text-white rounded-full px-4 py-2 text-sm font-medium hover:bg-green-600"
        >
          <Plus size={16} />
          投稿
        </Link>
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-12">読み込み中...</div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">🌱</p>
          <p className="text-gray-500 text-sm">まだ投稿がありません</p>
          <p className="text-gray-400 text-xs mt-1">小さな「できた」から始めよう</p>
          <Link
            to="/new"
            className="inline-block mt-4 bg-green-500 text-white rounded-full px-6 py-2.5 text-sm font-medium hover:bg-green-600"
          >
            最初の投稿をする
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {posts.map(post => (
            <div key={post.id} className="bg-white rounded-2xl p-4 shadow-sm">
              <p className="text-gray-800 text-sm leading-relaxed">{post.content}</p>
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-2">
                  {post.genre && (
                    <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full">
                      {post.genre}
                    </span>
                  )}
                  {!post.is_public && (
                    <span className="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">
                      非公開
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {post.reactions && post.reactions.length > 0 && (
                    <div className="flex gap-1 text-xs text-gray-400">
                      {STAMPS.map(s => {
                        const count = post.reactions!.filter(r => r.sticker_type === s.type).length
                        return count > 0 ? (
                          <span key={s.type}>{s.emoji}{count}</span>
                        ) : null
                      })}
                    </div>
                  )}
                  <span className="text-xs text-gray-400">{formatDate(post.created_at)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
