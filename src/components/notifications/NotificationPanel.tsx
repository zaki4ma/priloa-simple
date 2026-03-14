import { STAMPS } from '../../types'
import type { NotifItem } from '../../hooks/useNotifications'

interface Props {
  notifications: NotifItem[]
  onClose: () => void
}

const formatTime = (dateStr: string) => {
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

export default function NotificationPanel({ notifications, onClose }: Props) {
  return (
    <>
      {/* backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* panel — bottom-16 on mobile (above bottom nav), top-14 on desktop */}
      <div className="fixed right-2 bottom-16 z-50 w-72 max-h-[60vh] bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden flex flex-col md:right-4 md:top-14 md:bottom-auto md:w-80 md:max-h-[70vh]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <p className="text-sm font-semibold text-gray-800">通知</p>
          <button onClick={onClose} className="text-xs text-gray-400 hover:text-gray-600">閉じる</button>
        </div>

        <div className="overflow-y-auto flex-1">
          {notifications.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">
              <p className="text-2xl mb-2">🔔</p>
              まだ通知はありません
            </div>
          ) : (
            notifications.map(n => {
              const stamp = STAMPS.find(s => s.type === n.sticker_type)
              return (
                <div key={n.id} className="px-4 py-3 border-b border-gray-50">
                  <div className="flex items-start gap-2.5">
                    <span className="text-xl shrink-0">{n.from_avatar}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-700">
                        <span className="font-medium">{n.from_nickname}</span>
                        {' '}さんが{' '}
                        <span>{stamp?.emoji} {stamp?.label}</span>
                        {' '}を送りました
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5 truncate">「{n.post_content}」</p>
                      <p className="text-xs text-gray-300 mt-0.5">{formatTime(n.created_at)}</p>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </>
  )
}
