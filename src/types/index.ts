export interface UserProfile {
  id: string
  email: string
  nickname: string
  avatar: string
  created_at: string
  cbt_total_exp?: number
  cbt_current_streak?: number
  cbt_max_streak?: number
}

export interface Post {
  id: string
  user_id: string
  content: string
  genre: string | null
  is_public: boolean
  created_at: string
  user_profiles?: UserProfile
  reactions?: Reaction[]
}

export interface Reaction {
  id: string
  post_id: string
  from_user_id: string
  sticker_type: StampType
  created_at: string
}

export type StampType = 'clap' | 'star' | 'muscle' | 'flower'

export const STAMPS: { type: StampType; emoji: string; label: string }[] = [
  { type: 'clap', emoji: '🌱', label: 'それだけでじゅうぶん' },
  { type: 'star', emoji: '☀️', label: '今日もいたね' },
  { type: 'muscle', emoji: '🤝', label: '一緒にいるよ' },
  { type: 'flower', emoji: '🌸', label: 'おつかれさま' },
]

export const GENRES = [
  '運動',
  '健康',
  '生活',
  '仕事',
  '勉強',
  '趣味・楽しみ',
  '感情ケア・休息',
  '育児・子育て',
  '人間関係',
  'チャレンジ',
] as const
