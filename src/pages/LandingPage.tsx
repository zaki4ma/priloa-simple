import { Link } from 'react-router-dom'
import FloatingParticles from '../components/landing/FloatingParticles'

const examples = [
  '今日も生きていた',
  '朝、起き上がれた',
  '水を一杯飲んだ',
  'ごはんを食べた',
  '外の空気を吸った',
  '今日は休む日だった',
]

const stamps = [
  { emoji: '🌱', label: 'それだけでじゅうぶん' },
  { emoji: '☀️', label: '今日もいたね' },
  { emoji: '🤝', label: '一緒にいるよ' },
  { emoji: '🌸', label: 'おつかれさま' },
]

const steps = [
  { num: '1', title: '小さな「できた」を書く', desc: '完璧じゃなくていい。今日起きられた、それだけでいい。' },
  { num: '2', title: 'みんなの投稿を見る', desc: '同じように小さな一歩を踏み出している人がいる。' },
  { num: '3', title: 'スタンプで応援する', desc: '言葉より気軽に、でも確かに届く温かさ。' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans">

      {/* ヘッダー */}
      <header className="flex items-center justify-between px-6 py-4 max-w-3xl mx-auto">
        <span className="text-green-600 font-bold text-xl">Priloa</span>
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-sm text-gray-500 hover:text-gray-700">ログイン</Link>
          <Link to="/register" className="text-sm bg-green-500 text-white px-4 py-2 rounded-full hover:bg-green-600">
            はじめる
          </Link>
        </div>
      </header>

      {/* ヒーロー */}
      <section className="relative overflow-hidden aurora-gradient">
        <FloatingParticles />
        <div className="relative z-10 max-w-3xl mx-auto px-6 pt-16 pb-20 text-center">
          <p className="text-green-700 text-sm font-medium mb-4">小さなできたを、ここに置いていこう</p>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 leading-snug mb-6">
            「今日も生きていた」<br />
            それだけでじゅうぶんです
          </h1>
          <p className="text-gray-600 text-base leading-relaxed mb-10 max-w-md mx-auto">
            Priloaは、どんなに小さなことでも「できた」として記録し、
            そっと応援し合える場所です。
            頑張らなくていい。比べなくていい。
          </p>
          <Link
            to="/register"
            className="inline-block bg-green-500 text-white px-8 py-3.5 rounded-full text-sm font-medium hover:bg-green-600 shadow-sm"
          >
            無料ではじめる
          </Link>
        </div>
      </section>

      {/* できたの例 */}
      <section className="bg-gray-50 py-16 px-6">
        <div className="max-w-2xl mx-auto">
          <p className="text-center text-sm text-gray-500 mb-8">
            こんな小さなことが、ここでは立派な「できた」です
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {examples.map(ex => (
              <span
                key={ex}
                className="bg-white border border-gray-200 text-gray-600 text-sm px-4 py-2 rounded-full shadow-sm"
              >
                {ex}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* 共感セクション */}
      <section className="max-w-2xl mx-auto px-6 py-16">
        <div className="bg-green-50 rounded-3xl p-8 text-center">
          <p className="text-gray-700 text-base leading-relaxed">
            「何もできなかった」と思う日でも、<br />
            今日ここにいること、それはすでに「できた」こと。<br /><br />
            <span className="text-gray-500 text-sm">
              完璧じゃなくていい。続けなくていい。<br />
              ただ、今日のあなたをここに残してほしい。
            </span>
          </p>
        </div>
      </section>

      {/* スタンプ応援 */}
      <section className="bg-gray-50 py-16 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-xl font-bold text-gray-800 mb-2">言葉より気軽に、でも確かに届く</h2>
          <p className="text-gray-500 text-sm mb-8">
            4種類のスタンプで、そっと応援できます
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {stamps.map(s => (
              <div
                key={s.label}
                className="bg-white border border-gray-200 rounded-full px-4 py-2.5 flex items-center gap-2 shadow-sm"
              >
                <span className="text-xl">{s.emoji}</span>
                <span className="text-sm text-gray-600">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 使い方 */}
      <section className="max-w-2xl mx-auto px-6 py-16">
        <h2 className="text-xl font-bold text-gray-800 text-center mb-10">シンプルな3ステップ</h2>
        <div className="flex flex-col gap-6">
          {steps.map(s => (
            <div key={s.num} className="flex items-start gap-4">
              <span className="w-8 h-8 rounded-full bg-green-100 text-green-600 font-bold text-sm flex items-center justify-center shrink-0">
                {s.num}
              </span>
              <div>
                <p className="font-medium text-gray-800 text-sm mb-1">{s.title}</p>
                <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-green-50 py-16 px-6 text-center">
        <h2 className="text-xl font-bold text-gray-800 mb-3">今日の「できた」を残してみませんか</h2>
        <p className="text-gray-500 text-sm mb-8">無料・登録1分・比べない場所</p>
        <Link
          to="/register"
          className="inline-block bg-green-500 text-white px-8 py-3.5 rounded-full text-sm font-medium hover:bg-green-600 shadow-sm"
        >
          無料ではじめる
        </Link>
      </section>

      {/* フッター */}
      <footer className="text-center py-8 text-xs text-gray-400">
        © 2025 Priloa
      </footer>

    </div>
  )
}
