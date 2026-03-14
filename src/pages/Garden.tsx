import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { Post, StampType } from '../types'
import { STAMPS } from '../types'

interface FlyingStamp {
  id: string
  emoji: string
}

export default function Garden() {
  const { user } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [sendingStamp, setSendingStamp] = useState<string | null>(null)
  const [activeGenre, setActiveGenre] = useState<string | null>(null)
  const [flyingStamps, setFlyingStamps] = useState<FlyingStamp[]>([])

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
      const stamp = STAMPS.find(s => s.type === type)
      if (stamp) {
        const flyId = Math.random().toString(36).slice(2)
        setFlyingStamps(prev => [...prev, { id: flyId, emoji: stamp.emoji }])
        setTimeout(() => setFlyingStamps(prev => prev.filter(f => f.id !== flyId)), 1200)
      }
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

  const availableGenres = [...new Set(posts.map(p => p.genre).filter(Boolean))] as string[]
  const filteredPosts = activeGenre ? posts.filter(p => p.genre === activeGenre) : posts

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-24 md:pb-6">
      {/* フライングスタンプ */}
      <AnimatePresence>
        {flyingStamps.map(f => (
          <motion.div
            key={f.id}
            className="fixed left-1/2 bottom-1/3 z-50 pointer-events-none text-4xl"
            initial={{ opacity: 1, y: 0, x: '-50%', scale: 0.5 }}
            animate={{ opacity: 0, y: -120, scale: 1.6 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.0, ease: 'easeOut' }}
          >
            {f.emoji}
          </motion.div>
        ))}
      </AnimatePresence>

      <div className="mb-4">
        <h1 className="text-lg font-bold text-gray-800">みんなのできたこと</h1>
        <p className="text-sm text-gray-500">みんなの小さな「できた」を応援しよう</p>
      </div>

      {/* ジャンルフィルター */}
      {availableGenres.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4" style={{ scrollbarWidth: 'none' }}>
          <button
            onClick={() => setActiveGenre(null)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs border transition-colors ${
              activeGenre === null
                ? 'bg-green-500 text-white border-green-500'
                : 'bg-white text-gray-500 border-gray-200 hover:bg-green-50 hover:border-green-200'
            }`}
          >
            すべて
          </button>
          {availableGenres.map(genre => (
            <button
              key={genre}
              onClick={() => setActiveGenre(activeGenre === genre ? null : genre)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs border transition-colors ${
                activeGenre === genre
                  ? 'bg-green-500 text-white border-green-500'
                  : 'bg-white text-gray-500 border-gray-200 hover:bg-green-50 hover:border-green-200'
              }`}
            >
              {genre}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="text-center text-gray-400 py-12">読み込み中...</div>
      ) : filteredPosts.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">🌿</p>
          <p className="text-gray-500 text-sm">
            {activeGenre ? `「${activeGenre}」の投稿はまだありません` : 'まだ投稿がありません'}
          </p>
          {!activeGenre && (
            <p className="text-gray-400 text-xs mt-1">あなたの「できた」を最初に投稿してみよう</p>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredPosts.map(post => {
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
                    <button
                      onClick={() => setActiveGenre(activeGenre === post.genre ? null : post.genre)}
                      className={`ml-auto text-xs px-2 py-0.5 rounded-full transition-colors ${
                        activeGenre === post.genre
                          ? 'bg-green-500 text-white'
                          : 'bg-green-50 text-green-600 hover:bg-green-100'
                      }`}
                    >
                      {post.genre}
                    </button>
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
                        <motion.button
                          key={s.type}
                          onClick={() => sendStamp(post.id, s.type)}
                          disabled={!!sendingStamp}
                          whileHover={{ scale: 1.08 }}
                          whileTap={{ scale: 0.88 }}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs border transition-colors ${
                            myReaction
                              ? 'bg-green-50 border-green-300 text-green-700'
                              : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-green-50 hover:border-green-200'
                          } ${sending ? 'opacity-50' : ''}`}
                        >
                          {s.emoji} {s.label}{count > 0 ? ` ${count}` : ''}
                        </motion.button>
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
