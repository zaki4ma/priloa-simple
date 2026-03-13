export interface GrowthAnalysisResult {
  changeObservation: string      // 初期→最近の言葉・テーマの具体的変化
  hiddenPattern: string          // ユーザーが気づいていない傾向
  growthEvidence: string         // テキストを引用した成長の証拠
  newPerspective: string         // 新しい視点・気づきを促す一言
}

interface PostSummary {
  content: string
  genre: string | null
  created_at: string
}

export async function analyzeGrowth(
  posts: PostSummary[],
  stats: { totalPosts: number; uniqueDays: number; streak: number }
): Promise<GrowthAnalysisResult> {
  // 時系列順にソート
  const sorted = [...posts].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )

  // 初期・中期・最近の3分割（各最大15件）
  const third = Math.floor(sorted.length / 3)
  const earlyPosts = sorted.slice(0, third).slice(-15).map(p => `[${p.genre ?? 'カテゴリなし'}] ${p.content}`)
  const midPosts = sorted.slice(third, third * 2).slice(-15).map(p => `[${p.genre ?? 'カテゴリなし'}] ${p.content}`)
  const recentPosts = sorted.slice(third * 2).slice(-15).map(p => `[${p.genre ?? 'カテゴリなし'}] ${p.content}`)

  // カテゴリの時期別変化
  const categoryByPeriod = (periodPosts: PostSummary[]) => {
    const counts: Record<string, number> = {}
    periodPosts.forEach(p => {
      if (p.genre) counts[p.genre] = (counts[p.genre] || 0) + 1
    })
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, v]) => `${k}(${v}件)`).join(', ')
  }

  const earlyCategories = categoryByPeriod(sorted.slice(0, third))
  const recentCategories = categoryByPeriod(sorted.slice(third * 2))

  // 文字数の変化（初期・最近の平均）
  const avgLen = (ps: PostSummary[]) =>
    ps.length === 0 ? 0 : Math.round(ps.reduce((s, p) => s + p.content.length, 0) / ps.length)
  const earlyAvgLen = avgLen(sorted.slice(0, third))
  const recentAvgLen = avgLen(sorted.slice(third * 2))

  // 投稿時刻の分布（時間帯別）
  const timeSlots = { 朝: 0, 昼: 0, 夕方: 0, 夜: 0, 深夜: 0 }
  sorted.forEach(p => {
    const h = new Date(p.created_at).getHours()
    if (h >= 5 && h < 10) timeSlots['朝']++
    else if (h >= 10 && h < 15) timeSlots['昼']++
    else if (h >= 15 && h < 19) timeSlots['夕方']++
    else if (h >= 19 && h < 24) timeSlots['夜']++
    else timeSlots['深夜']++
  })
  const timeDistribution = Object.entries(timeSlots)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${k}(${v}件)`)
    .join(', ')

  const prompt = `あなたは行動分析の専門家です。ユーザーの「できたこと」日記を時系列で分析し、本人が気づいていない変化・パターン・成長を具体的に伝えてください。

【統計】
- 総投稿数: ${stats.totalPosts}件 / 記録日数: ${stats.uniqueDays}日 / 連続: ${stats.streak}日

【文章量の変化】
- 初期の平均文字数: ${earlyAvgLen}字 → 最近の平均文字数: ${recentAvgLen}字

【投稿時刻の傾向】
- 時間帯別: ${timeDistribution}

【初期の記録（カテゴリ別上位: ${earlyCategories}）】
${earlyPosts.join('\n')}

【中期の記録（カテゴリ別上位: ${categoryByPeriod(sorted.slice(third, third * 2))}）】
${midPosts.join('\n')}

【最近の記録（カテゴリ別上位: ${recentCategories}）】
${recentPosts.join('\n')}

分析の観点：
- 初期と最近で使う言葉・表現・テーマがどう変わったか（具体的な言葉を引用）
- 本人が当たり前と思っているが実は継続できている行動
- カテゴリや行動の多様性・集中度の変化
- 文章量の変化から読み取れる自己表現・内省の深化
- 投稿時刻の傾向から見えるライフスタイルや習慣のパターン
- 繰り返し登場するテーマや行動（本人が意識していないかもしれないもの）

以下のJSON形式のみで返してください（他のテキスト不要）:
{
  "changeObservation": "初期と最近の記録を比較した具体的な変化（実際の投稿内容を引用しながら、言葉遣い・テーマ・行動の変化を150字以内で）",
  "hiddenPattern": "データから見えるが本人が気づいていない可能性があるパターンや傾向（120字以内）",
  "growthEvidence": "成長の具体的な証拠（実際の投稿文を短く引用し、何がどう変わったかを示す・120字以内）",
  "newPerspective": "この記録から見えてくる、本人への新しい視点や気づきを促す一言（60字以内・疑問形不使用）"
}`

  const endpoint = import.meta.env.DEV
    ? 'https://api.openai.com/v1/chat/completions'
    : '/.netlify/functions/analyze-growth'

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (import.meta.env.DEV) {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY
    if (!apiKey) throw new Error('OpenAI API key が設定されていません')
    headers['Authorization'] = `Bearer ${apiKey}`
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
      response_format: { type: 'json_object' },
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err?.error?.message || 'AI分析に失敗しました')
  }

  const data = await response.json()
  return JSON.parse(data.choices[0].message.content) as GrowthAnalysisResult
}
