import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Share2, Trash2, Pencil } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { Post } from '../types'
import { STAMPS, GENRES } from '../types'
import ShareModal from '../components/home/ShareModal'

const UNLOCK_THRESHOLD = 30

const toDateKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

const calcStreak = (createdAts: string[]): number => {
  if (createdAts.length === 0) return 0
  const toKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
  const dateSet = new Set(createdAts.map(d => toKey(new Date(d))))
  const cursor = new Date()
  if (!dateSet.has(toKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1)
    if (!dateSet.has(toKey(cursor))) return 0
  }
  let streak = 0
  while (dateSet.has(toKey(cursor))) {
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

export default function Home() {
  const { user, profile } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showShare, setShowShare] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [editGenre, setEditGenre] = useState<string | null>(null)
  const [editIsPublic, setEditIsPublic] = useState(true)
  const [todayReflection, setTodayReflection] = useState<{ id: string; comment: string } | null>(null)
  const [reflectionInput, setReflectionInput] = useState('')
  const [reflectionSaving, setReflectionSaving] = useState(false)
  const [reflectionEditing, setReflectionEditing] = useState(false)
  const [streak, setStreak] = useState(0)
  const [pastPost, setPastPost] = useState<{ content: string; created_at: string; label: string; rating: number | null } | null>(null)

  const todayPosts = useMemo(() => {
    const today = new Date().toDateString()
    return posts.filter(p => new Date(p.created_at).toDateString() === today)
  }, [posts])

  const fetchPosts = async () => {
    if (!user) return
    const { data, count } = await supabase
      .from('posts')
      .select('*, reactions(*)', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30)
    setPosts(data ?? [])
    setTotalCount(count ?? 0)
    setLoading(false)
  }

  const fetchStreak = async () => {
    if (!user) return
    const { data } = await supabase
      .from('posts')
      .select('created_at')
      .eq('user_id', user.id)
    setStreak(calcStreak((data ?? []).map(p => p.created_at)))
  }

  const fetchPastPost = async () => {
    if (!user) return
    const toLabelFromDays = (days: number) => {
      if (days >= 330) return '1年前'
      if (days >= 150) return '半年前'
      if (days >= 75)  return '3ヶ月前'
      if (days >= 45)  return '2ヶ月前'
      return '1ヶ月前'
    }
    const threshold = new Date()
    threshold.setDate(threshold.getDate() - 25)
    const { data } = await supabase
      .from('posts')
      .select('content, created_at, rating')
      .eq('user_id', user.id)
      .lte('created_at', threshold.toISOString())
      .order('created_at', { ascending: true })
      .limit(1)
    if (!data || data.length === 0) return
    const days = Math.floor((Date.now() - new Date(data[0].created_at).getTime()) / 86400000)
    setPastPost({ ...data[0], label: toLabelFromDays(days) })
  }

  const fetchTodayReflection = async () => {
    if (!user) return
    const today = toDateKey(new Date())
    const { data } = await supabase
      .from('daily_reflections')
      .select('id, comment')
      .eq('user_id', user.id)
      .eq('date', today)
      .maybeSingle()
    setTodayReflection(data ?? null)
    if (data) setReflectionInput(data.comment)
  }

  useEffect(() => { fetchPosts(); fetchTodayReflection(); fetchStreak(); fetchPastPost() }, [user])

  const handleSaveReflection = async () => {
    if (!user || !reflectionInput.trim()) return
    setReflectionSaving(true)
    const today = toDateKey(new Date())
    if (todayReflection) {
      await supabase
        .from('daily_reflections')
        .update({ comment: reflectionInput.trim() })
        .eq('id', todayReflection.id)
    } else {
      await supabase
        .from('daily_reflections')
        .insert({ user_id: user.id, date: today, comment: reflectionInput.trim() })
    }
    setReflectionSaving(false)
    setReflectionEditing(false)
    fetchTodayReflection()
  }

  const handleStartEdit = (post: Post) => {
    setEditingId(post.id)
    setEditContent(post.content)
    setEditGenre(post.genre)
    setEditIsPublic(post.is_public)
    setDeletingId(null)
  }

  const handleSaveEdit = async () => {
    if (!editingId || !editContent.trim()) return
    await supabase
      .from('posts')
      .update({ content: editContent.trim(), genre: editGenre, is_public: editIsPublic })
      .eq('id', editingId)
    setPosts(prev => prev.map(p =>
      p.id === editingId
        ? { ...p, content: editContent.trim(), genre: editGenre, is_public: editIsPublic }
        : p
    ))
    setEditingId(null)
  }

  const handleDelete = async (postId: string) => {
    await supabase.from('posts').delete().eq('id', postId)
    setDeletingId(null)
    setPosts(prev => prev.filter(p => p.id !== postId))
    setTotalCount(prev => prev - 1)
  }

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

  const MOOD_EMOJI: Record<number, string> = { 1: '😔', 2: '😐', 3: '🙂', 4: '😊', 5: '🌟' }
  const MOOD_MESSAGES: Record<number, string> = {
    1: 'つらいときでも、記録できた自分を褒めよう',
    2: 'ふつうの日も、積み重ねが力になる',
    3: 'まあまあな日も、できたことは本物だよ',
    4: 'いい気分！今日のできたことを記録しよう',
    5: '絶好調！その調子で今日も記録しよう',
  }
  const todayMoodRatings = todayPosts.map(p => p.rating).filter((r): r is number => !!r && r > 0)
  const todayMood = todayMoodRatings.length > 0 ? Math.max(...todayMoodRatings) : null
  const homeMessage = todayMood ? MOOD_MESSAGES[todayMood] : '今日も何か「できた」ことを記録しよう'

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-24 md:pb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg font-bold text-gray-800">
            {profile?.avatar} {profile?.nickname}
          </h1>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-sm text-gray-500">{homeMessage}</p>
            {streak > 0 && (
              <span className="flex items-center gap-0.5 text-xs font-medium text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">
                🔥 {streak}日連続
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {todayPosts.length > 0 && (
            <button
              onClick={() => setShowShare(true)}
              className="flex items-center gap-1.5 border border-gray-200 text-gray-500 rounded-full px-3 py-2 text-sm hover:bg-gray-50"
            >
              <Share2 size={14} />
              シェア
            </button>
          )}
          <Link
            to="/new"
            className="flex items-center gap-1.5 bg-green-500 text-white rounded-full px-4 py-2 text-sm font-medium hover:bg-green-600"
          >
            <Plus size={16} />
            投稿
          </Link>
        </div>
      </div>

      {!loading && totalCount < UNLOCK_THRESHOLD && (
        <div className="bg-white rounded-2xl px-4 py-3 shadow-sm mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-xs text-gray-500">🔍 成長レポートまで</p>
            <p className="text-xs text-gray-400">{totalCount} / {UNLOCK_THRESHOLD}件</p>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5">
            <div
              className="bg-green-400 h-1.5 rounded-full transition-all"
              style={{ width: `${Math.min((totalCount / UNLOCK_THRESHOLD) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}

      {!loading && totalCount >= UNLOCK_THRESHOLD && (
        <div className="bg-green-50 border border-green-200 rounded-2xl px-4 py-3 mb-4 text-center">
          <p className="text-xs text-green-700">🎉 成長レポートが解放されました！「記録」タブから確認できます</p>
        </div>
      )}

      {/* 過去の自分との比較 */}
      {!loading && pastPost && (
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 shadow-sm mb-4">
          <p className="text-xs font-medium text-amber-600 mb-2">📖 {pastPost.label}の自分はこんなことができた</p>
          <p className="text-sm text-gray-800 leading-relaxed">{pastPost.content}</p>
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-amber-400">
              {new Date(pastPost.created_at).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            {pastPost.rating && pastPost.rating > 0 && (
              <span className="text-base" title="当時の気分">{MOOD_EMOJI[pastPost.rating]}</span>
            )}
          </div>
        </div>
      )}

      {/* 今日の振り返り */}
      {!loading && todayPosts.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
          <p className="text-xs font-medium text-gray-500 mb-2">✨ 今日の自分へのひとこと</p>
          {todayReflection && !reflectionEditing ? (
            <div>
              <p className="text-sm text-gray-800 leading-relaxed">{todayReflection.comment}</p>
              <button
                onClick={() => setReflectionEditing(true)}
                className="mt-2 text-xs text-gray-400 hover:text-gray-600"
              >
                編集する
              </button>
            </div>
          ) : (
            <div>
              <textarea
                value={reflectionInput}
                onChange={e => setReflectionInput(e.target.value)}
                placeholder="今日の自分を褒めてあげよう..."
                rows={2}
                className="w-full text-sm text-gray-800 placeholder-gray-400 outline-none resize-none"
              />
              <div className="flex items-center justify-between mt-2">
                {reflectionEditing && (
                  <button
                    onClick={() => { setReflectionEditing(false); setReflectionInput(todayReflection?.comment ?? '') }}
                    className="text-xs text-gray-400 hover:text-gray-600"
                  >
                    キャンセル
                  </button>
                )}
                <button
                  onClick={handleSaveReflection}
                  disabled={reflectionSaving || !reflectionInput.trim()}
                  className="ml-auto bg-green-500 text-white rounded-full px-4 py-1.5 text-xs font-medium hover:bg-green-600 disabled:opacity-40 transition-colors"
                >
                  {reflectionSaving ? '保存中...' : '保存'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

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
              {editingId === post.id ? (
                <div>
                  <textarea
                    value={editContent}
                    onChange={e => setEditContent(e.target.value)}
                    maxLength={140}
                    rows={3}
                    autoFocus
                    className="w-full text-sm text-gray-800 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-green-400 resize-none"
                  />
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                      <select
                        value={editGenre ?? ''}
                        onChange={e => setEditGenre(e.target.value || null)}
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-green-400 text-gray-600 bg-white"
                      >
                        <option value="">ジャンルなし</option>
                        {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                      <label className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editIsPublic}
                          onChange={e => setEditIsPublic(e.target.checked)}
                          className="rounded"
                        />
                        公開
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingId(null)}
                        className="text-xs text-gray-400 hover:text-gray-600"
                      >
                        キャンセル
                      </button>
                      <button
                        onClick={handleSaveEdit}
                        disabled={!editContent.trim()}
                        className="text-xs bg-green-500 text-white rounded-full px-3 py-1.5 hover:bg-green-600 disabled:opacity-40"
                      >
                        保存
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
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
                      {deletingId === post.id ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleDelete(post.id)}
                            className="text-xs text-red-500 font-medium hover:text-red-600"
                          >
                            削除
                          </button>
                          <button
                            onClick={() => setDeletingId(null)}
                            className="text-xs text-gray-400 hover:text-gray-600"
                          >
                            キャンセル
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleStartEdit(post)}
                            className="text-gray-300 hover:text-green-400 transition-colors"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => setDeletingId(post.id)}
                            className="text-gray-300 hover:text-red-400 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {showShare && (
        <ShareModal
          todayPosts={todayPosts}
          nickname={profile?.nickname ?? ''}
          avatar={profile?.avatar ?? '🌱'}
          streak={streak}
          onClose={() => setShowShare(false)}
        />
      )}
    </div>
  )
}
