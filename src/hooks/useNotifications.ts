import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { StampType } from '../types'

export interface NotifItem {
  id: string
  sticker_type: StampType
  post_id: string
  post_content: string
  from_nickname: string
  from_avatar: string
  created_at: string
}

const LS_KEY = 'notifications_last_seen'

export function useNotifications(userId: string | undefined) {
  const [notifications, setNotifications] = useState<NotifItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  const fetchNotifications = async () => {
    if (!userId) return

    const { data: myPosts } = await supabase
      .from('posts')
      .select('id, content')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100)

    if (!myPosts?.length) return

    const postIds = myPosts.map(p => p.id)
    const postContentMap = new Map(myPosts.map(p => [p.id, p.content]))

    const { data: reactionsData } = await supabase
      .from('reactions')
      .select('*')
      .in('post_id', postIds)
      .neq('from_user_id', userId)
      .order('created_at', { ascending: false })
      .limit(30)

    if (!reactionsData?.length) {
      setNotifications([])
      setUnreadCount(0)
      return
    }

    const uniqueUserIds = [...new Set(reactionsData.map(r => r.from_user_id))]
    const { data: profilesData } = await supabase
      .from('user_profiles')
      .select('id, nickname, avatar')
      .in('id', uniqueUserIds)

    const profileMap = new Map(profilesData?.map(p => [p.id, p]) ?? [])

    const notifs: NotifItem[] = reactionsData.map(r => ({
      id: r.id,
      sticker_type: r.sticker_type as StampType,
      post_id: r.post_id,
      post_content: postContentMap.get(r.post_id) ?? '',
      from_nickname: profileMap.get(r.from_user_id)?.nickname ?? '誰か',
      from_avatar: profileMap.get(r.from_user_id)?.avatar ?? '🌱',
      created_at: r.created_at,
    }))

    setNotifications(notifs)

    const lastSeen = localStorage.getItem(LS_KEY) ?? '1970-01-01'
    const unread = notifs.filter(n => n.created_at > lastSeen).length
    setUnreadCount(unread)
  }

  const markAllRead = () => {
    localStorage.setItem(LS_KEY, new Date().toISOString())
    setUnreadCount(0)
  }

  useEffect(() => {
    fetchNotifications()
  }, [userId])

  return { notifications, unreadCount, markAllRead, refetch: fetchNotifications }
}
