/**
 * CBT思考記録機能の型定義
 */

export interface EmotionRecord {
  id?: string;
  thoughtRecordId?: string;
  emotionType: string;
  intensityBefore: number; // 1-10
  intensityAfter: number;  // 1-10
  createdAt?: string;
}

export interface ThoughtRecord {
  id?: string;
  userId?: string;
  situation: string;
  thoughts: string;
  alternativeThoughts?: string;
  cognitiveDistortions: string[];
  emotions: EmotionRecord[];
  expGained: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ThoughtRecordFormData {
  situation: string;
  emotions: EmotionRecord[];
  thoughts: string;
  alternativeThoughts: string;
  cognitiveDistortions: string[];
}

export interface CBTStats {
  totalRecords: number;
  currentStreak: number;
  maxStreak: number;
  totalExp: number;
  level: number;
  todayCompleted: boolean;
}

// 認知の歪みパターン
export interface CognitiveDistortion {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  pattern?: RegExp;
  examples: string[];
}

// 感情カテゴリの型定義
export interface EmotionCategory {
  id: string;
  name: string;
  color: {
    bg: string;
    border: string;
    text: string;
    hover: string;
  };
  emotions: string[];
}

// カテゴリ別感情データ
export const EMOTION_CATEGORIES: EmotionCategory[] = [
  {
    id: 'anxiety',
    name: '不安・心配系',
    color: {
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      text: 'text-orange-700',
      hover: 'hover:bg-orange-100'
    },
    emotions: ['不安', '心配', '緊張', '焦り', '怯え', '恐怖']
  },
  {
    id: 'sadness',
    name: '悲しみ・落胆系',
    color: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-700',
      hover: 'hover:bg-blue-100'
    },
    emotions: ['悲しさ', '憂うつ', '失望', '落胆', '絶望', '寂しさ']
  },
  {
    id: 'anger',
    name: '怒り・イライラ系',
    color: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-700',
      hover: 'hover:bg-red-100'
    },
    emotions: ['怒り', '苛立ち', '不満', '悔しい', 'うんざり']
  },
  {
    id: 'shame',
    name: '恥・自己否定系',
    color: {
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      text: 'text-purple-700',
      hover: 'hover:bg-purple-100'
    },
    emotions: ['恥', '罪悪感', '屈辱感', '自己嫌悪', '傷ついた']
  },
  {
    id: 'isolation',
    name: '孤立・疎外系',
    color: {
      bg: 'bg-gray-50',
      border: 'border-gray-200',
      text: 'text-gray-700',
      hover: 'hover:bg-gray-100'
    },
    emotions: ['孤独感', '見捨てられ感']
  },
  {
    id: 'confusion',
    name: '混乱・困惑系',
    color: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-700',
      hover: 'hover:bg-yellow-100'
    },
    emotions: ['混乱', '戸惑い', '当惑']
  }
];

// 全感情のフラットなリスト（後方互換性のため）
export const PRESET_EMOTIONS = EMOTION_CATEGORIES.flatMap(category => category.emotions);

// 認知の歪みパターン定義
export const COGNITIVE_DISTORTIONS: CognitiveDistortion[] = [
  {
    id: 'all-or-nothing',
    name: '全か無か思考',
    description: '物事を白か黒かでしか考えられない',
    keywords: ['絶対', '必ず', '完全に', '全く', '決して', 'いつも', '一度も'],
    examples: [
      '完璧でなければ意味がない',
      '一度失敗したら終わり',
      '絶対に成功しなければならない'
    ]
  },
  {
    id: 'overgeneralization',
    name: '過度の一般化',
    description: '一つの出来事から全体を判断してしまう',
    keywords: ['いつも', 'みんな', '全部', '毎回', '典型的', 'パターン'],
    examples: [
      '一度うまくいかなかったから、いつもダメだ',
      'みんな私を嫌っている',
      '毎回こうなる'
    ]
  },
  {
    id: 'mental-filter',
    name: '心のフィルター',
    description: 'ネガティブな面ばかりに注目してしまう',
    keywords: ['だめ', '最悪', '失敗', '問題', 'うまくいかない'],
    examples: [
      '良いこともあったけど、あの失敗が気になる',
      '成功したけど、運が良かっただけ'
    ]
  },
  {
    id: 'disqualifying-positive',
    name: 'プラス思考の否定',
    description: '良いことを偶然や例外として片付けてしまう',
    keywords: ['たまたま', '偶然', 'ラッキー', '例外', '運が良かった'],
    examples: [
      '褒められたけど、お世辞だろう',
      '成功したのはたまたま運が良かっただけ'
    ]
  },
  {
    id: 'jumping-to-conclusions',
    name: '結論の飛躍',
    description: '根拠なく悪い結論を出してしまう',
    keywords: ['きっと', 'どうせ', 'に違いない', '間違いない'],
    examples: [
      '返事が遅いから嫌われている',
      'きっと失敗するに違いない',
      'どうせうまくいかない'
    ]
  },
  {
    id: 'magnification-minimization',
    name: '拡大解釈・過小評価',
    description: '悪いことを大げさに、良いことを小さく考える',
    keywords: ['大変', '最悪', '終わり', '小さな', 'たいしたことない'],
    examples: [
      'この失敗で全てが終わった',
      '成功したけど、たいしたことない'
    ]
  },
  {
    id: 'emotional-reasoning',
    name: '感情的決めつけ',
    description: '感情を根拠に現実を判断してしまう',
    keywords: ['感じる', '気がする', 'そんな気', '不安だから'],
    examples: [
      '不安だから危険に違いない',
      'だめな気がするから、きっとうまくいかない'
    ]
  },
  {
    id: 'should-statements',
    name: 'すべき思考',
    description: '「〜すべき」「〜でなければならない」で自分を縛る',
    keywords: ['すべき', 'べき', 'なければならない', 'はず', '当然'],
    examples: [
      '完璧にやるべきだ',
      '失敗してはならない',
      'もっと頑張るべきだ'
    ]
  },
  {
    id: 'labeling',
    name: 'レッテル貼り',
    description: '自分や他人に否定的なレッテルを貼る',
    keywords: ['だめ人間', 'バカ', '無能', '失敗者', 'クズ'],
    examples: [
      '私はだめ人間だ',
      'あの人は無責任な人だ',
      '自分は価値のない人間だ'
    ]
  },
  {
    id: 'personalization',
    name: '個人化',
    description: '悪いことの原因を自分のせいにしてしまう',
    keywords: ['私のせい', '自分が悪い', '責任', '申し訳ない'],
    examples: [
      'チームの失敗は私のせいだ',
      '相手が不機嫌なのは私が何かしたからだ'
    ]
  }
];