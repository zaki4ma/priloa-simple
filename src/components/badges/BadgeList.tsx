interface Post {
  created_at: string
  genre: string | null
}

interface BadgeDef {
  id: string
  emoji: string
  name: string
  desc: string
  check: (posts: Post[], stampsReceived: number) => boolean
}

function calcMaxStreak(posts: Post[]): number {
  if (posts.length === 0) return 0
  const days = [...new Set(posts.map(p => new Date(p.created_at).toDateString()))]
    .map(d => new Date(d))
    .sort((a, b) => b.getTime() - a.getTime())

  let max = 1
  let streak = 1
  for (let i = 1; i < days.length; i++) {
    const diff = (days[i - 1].getTime() - days[i].getTime()) / 86400000
    if (diff === 1) {
      streak++
      if (streak > max) max = streak
    } else {
      streak = 1
    }
  }
  return max
}

const BADGES: BadgeDef[] = [
  {
    id: 'first',
    emoji: '🌱',
    name: 'はじめの一歩',
    desc: '初めて投稿する',
    check: (posts) => posts.length >= 1,
  },
  {
    id: 'ten',
    emoji: '🔥',
    name: '10件達成',
    desc: '累計10件投稿する',
    check: (posts) => posts.length >= 10,
  },
  {
    id: 'thirty',
    emoji: '⭐',
    name: '30件達成',
    desc: '累計30件投稿する',
    check: (posts) => posts.length >= 30,
  },
  {
    id: 'hundred',
    emoji: '💎',
    name: '100件達成',
    desc: '累計100件投稿する',
    check: (posts) => posts.length >= 100,
  },
  {
    id: 'streak3',
    emoji: '📅',
    name: '3日連続',
    desc: '3日連続で投稿する',
    check: (posts) => calcMaxStreak(posts) >= 3,
  },
  {
    id: 'streak7',
    emoji: '🗓️',
    name: '7日連続',
    desc: '7日連続で投稿する',
    check: (posts) => calcMaxStreak(posts) >= 7,
  },
  {
    id: 'streak30',
    emoji: '🏆',
    name: '30日連続',
    desc: '30日連続で投稿する',
    check: (posts) => calcMaxStreak(posts) >= 30,
  },
  {
    id: 'health',
    emoji: '💪',
    name: '健康マスター',
    desc: '「運動」「健康」カテゴリで10件',
    check: (posts) =>
      posts.filter(p => p.genre === '運動' || p.genre === '健康').length >= 10,
  },
  {
    id: 'study',
    emoji: '📚',
    name: '勉強家',
    desc: '「勉強」カテゴリで10件',
    check: (posts) => posts.filter(p => p.genre === '勉強').length >= 10,
  },
  {
    id: 'creative',
    emoji: '🎨',
    name: 'クリエイター',
    desc: '「趣味・楽しみ」カテゴリで10件',
    check: (posts) => posts.filter(p => p.genre === '趣味・楽しみ').length >= 10,
  },
  {
    id: 'stamps',
    emoji: '🤝',
    name: '応援される人',
    desc: 'スタンプを10個もらう',
    check: (_posts, stampsReceived) => stampsReceived >= 10,
  },
]

interface Props {
  posts: Post[]
  stampsReceived: number
}

export default function BadgeList({ posts, stampsReceived }: Props) {
  const results = BADGES.map(b => ({
    ...b,
    unlocked: b.check(posts, stampsReceived),
  }))

  const unlockedCount = results.filter(b => b.unlocked).length

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium text-gray-700">バッジ</p>
        <span className="text-xs text-gray-400">
          {unlockedCount} / {BADGES.length} 獲得
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {results.map(badge => (
          <div
            key={badge.id}
            className={`rounded-xl p-3 flex flex-col items-center text-center gap-1 transition-colors ${
              badge.unlocked
                ? 'bg-green-50 border border-green-200'
                : 'bg-gray-50 border border-gray-100'
            }`}
          >
            <span className={`text-2xl ${badge.unlocked ? '' : 'grayscale opacity-30'}`}>
              {badge.emoji}
            </span>
            <p className={`text-xs font-medium leading-tight ${badge.unlocked ? 'text-gray-800' : 'text-gray-300'}`}>
              {badge.name}
            </p>
            {badge.unlocked ? (
              <p className="text-xs text-green-600 leading-tight">{badge.desc}</p>
            ) : (
              <p className="text-xs text-gray-300 leading-tight">{badge.desc}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
