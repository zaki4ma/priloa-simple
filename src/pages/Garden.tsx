import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { Post, StampType } from '../types'
import { STAMPS } from '../types'

export default function Garden() {
  const { user } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [sendingStamp, setSendingStamp] = useState<string | null>(null)

  const fetchPosts = async () => {
    const { data } = await supabase
      .from('posts')
      .select('*, user_profiles(nickname, avatar), reactions(*)')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(50)
    setPosts(data ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchPosts() }, [])

  const sendStamp = async (postId: string, type: StampType) => {
    if (!user || sendingStamp) return
    setSendingStamp(postId + type)

    const existing = posts
      .find(p => p.id === postId)
      ?.reactions?.find(r => r.from_user_id === user.id && r.sticker_type === type)

    if (existing) {
      await supabase.from('reactions').delete().eq('id', existing.id)
    } else {
      await supabase.from('reactions').insert({
        post_id: postId,
        from_user_id: user.id,
        sticker_type: type,
      })
    }

    await fetchPosts()
    setSendingStamp(null)
  }

  const formatDate = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const hours = Math.floor(diff / 3600000)
    if (hours < 1) return 'たった今'
    if (hours < 24) return `${hours}時間前`
    return `${Math.floor(hours / 24)}日前`
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-24 md:pb-6">
      <div className="mb-6">
        <h1 className="text-lg font-bold text-gray-800">みんなのできたこと</h1>
        <p className="text-sm text-gray-500">みんなの小さな「できた」を応援しよう</p>
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-12">読み込み中...</div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">🌿</p>
          <p className="text-gray-500 text-sm">まだ投稿がありません</p>
          <p className="text-gray-400 text-xs mt-1">あなたの「できた」を最初に投稿してみよう</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {posts.map(post => {
            const myReactions = post.reactions?.filter(r => r.from_user_id === user?.id) ?? []
            const isOwn = post.user_id === user?.id

            return (
              <div key={post.id} className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">{post.user_profiles?.avatar ?? '🌱'}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      {post.user_profiles?.nickname ?? '名無しさん'}
                    </p>
                    <p className="text-xs text-gray-400">{formatDate(post.created_at)}</p>
                  </div>
                  {post.genre && (
                    <span className="ml-auto text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full">
                      {post.genre}
                    </span>
                  )}
                </div>

                <p className="text-gray-800 text-sm leading-relaxed mb-3">{post.content}</p>

                {!isOwn && (
                  <div className="flex gap-2 flex-wrap">
                    {STAMPS.map(s => {
                      const myReaction = myReactions.find(r => r.sticker_type === s.type)
                      const count = post.reactions?.filter(r => r.sticker_type === s.type).length ?? 0
                      const sending = sendingStamp === post.id + s.type
                      return (
                        <button
                          key={s.type}
                          onClick={() => sendStamp(post.id, s.type)}
                          disabled={!!sendingStamp}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs border transition-colors ${
                            myReaction
                              ? 'bg-green-50 border-green-300 text-green-700'
                              : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-green-50 hover:border-green-200'
                          } ${sending ? 'opacity-50' : ''}`}
                        >
                          {s.emoji} {s.label}{count > 0 ? ` ${count}` : ''}
                        </button>
                      )
                    })}
                  </div>
                )}

                {isOwn && post.reactions && post.reactions.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {STAMPS.map(s => {
                      const count = post.reactions!.filter(r => r.sticker_type === s.type).length
                      return count > 0 ? (
                        <span key={s.type} className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs bg-gray-50 border border-gray-200 text-gray-500">
                          {s.emoji} {count}
                        </span>
                      ) : null
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
