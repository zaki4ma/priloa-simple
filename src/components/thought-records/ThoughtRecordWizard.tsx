import React, { useState, useCallback, memo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle, 
  AlertCircle,
  Brain,
  Heart,
  MessageSquare,
  Lightbulb,
  BarChart3,
  Search,
  Star,
  Home,
  ChevronDown,
  ChevronUp,
  Eye
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { unlockStickerIfNew } from '../../services/stickerService';
import {
  EMOTION_CATEGORIES,
} from '../../types/thoughtRecord';
import type {
  ThoughtRecordFormData,
  CognitiveDistortion
} from '../../types/thoughtRecord';
import { 
  detectCognitiveDistortions, 
  getDistortionAdvice,
  generateAlternativeThoughts 
} from '../../utils/cognitiveDistortionDetector';
import '../../styles/slider.css';

// ステップコンポーネントの型定義
interface StepProps {
  formData: ThoughtRecordFormData;
  setFormData: React.Dispatch<React.SetStateAction<ThoughtRecordFormData>>;
  detectedDistortions?: CognitiveDistortion[];
  setDetectedDistortions?: React.Dispatch<React.SetStateAction<CognitiveDistortion[]>>;
  onNext?: () => void;
  onBack?: () => void;
}

const ThoughtRecordWizard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [detectedDistortions, setDetectedDistortions] = useState<CognitiveDistortion[]>([]);

  const [formData, setFormData] = useState<ThoughtRecordFormData>({
    situation: '',
    emotions: [],
    thoughts: '',
    alternativeThoughts: '',
    cognitiveDistortions: []
  });

  const totalSteps = 5;

  // ステップが変わった時にスクロール
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep]);

  const nextStep = useCallback(() => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
      // ページ上部にスクロール
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentStep, totalSteps]);

  const prevStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      // ページ上部にスクロール
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentStep]);

  const canProceed = useCallback(() => {
    switch (currentStep) {
      case 1:
        return formData.situation.trim().length >= 10;
      case 2:
        return formData.emotions.length > 0;
      case 3:
        return formData.thoughts.trim().length >= 10;
      case 4:
        return true; // 代替思考は任意
      case 5:
        return true;
      default:
        return false;
    }
  }, [currentStep, formData]);

  const awardCBTStickers = useCallback(async (totalExp: number, currentStreak: number, _maxStreak: number) => {
    try {
      // 初回記録ステッカー
      if (totalExp === 15) {
        await unlockStickerIfNew(user!.id, 'cbt-first-record');
      }
      
      // 3日連続記録ステッカー
      if (currentStreak >= 3) {
        await unlockStickerIfNew(user!.id, 'cbt-3day-streak');
      }
      
      // 週間チャレンジ（7日連続）
      if (currentStreak >= 7) {
        await unlockStickerIfNew(user!.id, 'cbt-week-challenge');
      }
      
      // 成長マスター（レベル5到達）
      const level = Math.floor(totalExp / 100) + 1;
      if (level >= 5) {
        await unlockStickerIfNew(user!.id, 'cbt-growth-master');
      }
      
      // 記録数に応じたステッカー
      const recordCount = Math.floor(totalExp / 15);
      if (recordCount >= 5) {
        await unlockStickerIfNew(user!.id, 'cbt-reframing-beginner');
      }
      
      if (recordCount >= 10) {
        await unlockStickerIfNew(user!.id, 'cbt-pattern-breaker');
      }
      
      if (recordCount >= 20) {
        await unlockStickerIfNew(user!.id, 'cbt-mindfulness-master');
      }
      
      if (recordCount >= 30) {
        await unlockStickerIfNew(user!.id, 'cbt-thought-guru');
      }
    } catch (error) {
      console.error('CBTステッカー獲得エラー:', error);
    }
  }, [user]);

  const handleSubmit = useCallback(async () => {
    if (!user?.id) return;

    setIsSubmitting(true);
    
    try {
      // 思考記録をデータベースに保存
      const { data: thoughtRecord, error: thoughtError } = await supabase
        .from('thought_records')
        .insert({
          user_id: user.id,
          situation: formData.situation,
          thoughts: formData.thoughts,
          alternative_thoughts: formData.alternativeThoughts,
          cognitive_distortions: formData.cognitiveDistortions,
          exp_gained: 15
        })
        .select()
        .single();

      if (thoughtError) throw thoughtError;

      // 感情記録を保存
      if (formData.emotions.length > 0) {
        const emotionRecords = formData.emotions.map(emotion => ({
          thought_record_id: thoughtRecord.id,
          emotion_type: emotion.emotionType,
          intensity_before: emotion.intensityBefore,
          intensity_after: emotion.intensityAfter
        }));

        const { error: emotionError } = await supabase
          .from('emotion_records')
          .insert(emotionRecords);

        if (emotionError) throw emotionError;
      }

      // ユーザープロフィールの統計を更新
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('cbt_total_exp, cbt_current_streak, cbt_max_streak')
        .eq('id', user.id)
        .single();

      const newTotalExp = (profile?.cbt_total_exp || 0) + 15;
      // 連続記録の計算（簡略版）
      const newCurrentStreak = (profile?.cbt_current_streak || 0) + 1;
      const newMaxStreak = Math.max(newCurrentStreak, profile?.cbt_max_streak || 0);

      await supabase
        .from('user_profiles')
        .update({
          cbt_total_exp: newTotalExp,
          cbt_current_streak: newCurrentStreak,
          cbt_max_streak: newMaxStreak
        })
        .eq('id', user.id);

      // CBTステッカーを獲得
      await awardCBTStickers(newTotalExp, newCurrentStreak, newMaxStreak);

      // 成功後、思考記録一覧に戻る
      navigate('/thought-records');
    } catch (error) {
      console.error('思考記録の保存に失敗:', error);
      alert('保存に失敗しました。もう一度お試しください。');
    } finally {
      setIsSubmitting(false);
    }
  }, [user, formData, navigate, awardCBTStickers]);

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1Situation
            formData={formData}
            setFormData={setFormData}
          />
        );
      case 2:
        return (
          <Step2Emotions
            formData={formData}
            setFormData={setFormData}
          />
        );
      case 3:
        return (
          <Step3Thoughts
            formData={formData}
            setFormData={setFormData}
            detectedDistortions={detectedDistortions}
            setDetectedDistortions={setDetectedDistortions}
          />
        );
      case 4:
        return (
          <Step4AlternativeThoughts
            formData={formData}
            setFormData={setFormData}
            detectedDistortions={detectedDistortions}
          />
        );
      case 5:
        return (
          <Step5EmotionReview
            formData={formData}
            setFormData={setFormData}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* プログレスバー */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              ステップ {currentStep} / {totalSteps}
            </span>
            <span className="text-sm text-gray-500">
              {Math.round((currentStep / totalSteps) * 100)}% 完了
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* ステップインジケーター */}
        <div className="flex justify-center mb-8">
          <div className="flex space-x-2">
            {[1, 2, 3, 4, 5].map((step) => (
              <div
                key={step}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  currentStep >= step
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {currentStep > step ? <CheckCircle size={20} /> : step}
              </div>
            ))}
          </div>
        </div>

        {/* コンテンツエリア */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          {renderCurrentStep()}
        </div>

        {/* ナビゲーションボタン */}
        <div className="flex justify-between">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className="flex items-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowLeft size={20} className="mr-2" />
            戻る
          </button>

          {currentStep === totalSteps ? (
            <button
              onClick={handleSubmit}
              disabled={!canProceed() || isSubmitting}
              className="flex items-center px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                  保存中...
                </>
              ) : (
                <>
                  <CheckCircle size={20} className="mr-2" />
                  完了
                </>
              )}
            </button>
          ) : (
            <button
              onClick={nextStep}
              disabled={!canProceed()}
              className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              次へ
              <ArrowRight size={20} className="ml-2" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ステップ1: 出来事の記録
const Step1Situation = memo<StepProps>(({ formData, setFormData }) => {
  const navigate = useNavigate();
  
  return (
    <div className="space-y-6">
      <div className="text-center">
        <MessageSquare className="w-12 h-12 text-blue-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">出来事を記録しましょう</h2>
        <p className="text-gray-600">何が起こりましたか？具体的な状況を教えてください。</p>
      </div>

      {/* 思考記録TOPへの戻るボタン */}
      <div className="flex justify-center">
        <button
          onClick={() => navigate('/thought-records')}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <Home size={16} />
          思考記録一覧に戻る
        </button>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          出来事・状況
        </label>
        <textarea
          value={formData.situation}
          onChange={(e) => setFormData(prev => ({ ...prev, situation: e.target.value }))}
          placeholder="例：上司に報告書を指摘された、友人からの返信が遅い、プレゼンテーションで緊張した"
          className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          rows={4}
          maxLength={500}
        />
        <p className="text-sm text-gray-500 mt-1">
          {formData.situation.length}/500文字
        </p>
      </div>

      {/* 静的なヒント */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-800 mb-3 flex items-center">
          <Lightbulb className="w-4 h-4 mr-2" />
          記録のヒント
        </h3>
        <div className="space-y-2 text-sm text-blue-700">
          <p className="flex items-start">
            <span className="font-medium mr-2">5W1H:</span>
            いつ、どこで、誰が、何を、なぜ、どのように
          </p>
          <p className="flex items-start">
            <span className="font-medium mr-2">事実重視:</span>
            感情や解釈を除いて、起きた事実のみを記録
          </p>
          <p className="flex items-start">
            <span className="font-medium mr-2">客観性:</span>
            他の人が見ても同じように理解できる内容
          </p>
          <p className="flex items-start">
            <span className="font-medium mr-2">具体例:</span>
            「上司に報告書を指摘された」「友人からの返信が遅い」
          </p>
        </div>
      </div>

    </div>
  );
});

// ステップ2: 感情の記録
const Step2Emotions = memo<StepProps>(({ formData, setFormData }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [frequentEmotions, setFrequentEmotions] = useState<string[]>([]);

  // 感情の使用頻度を取得（簡易版 - 実際はローカルストレージやDBから）
  React.useEffect(() => {
    // TODO: 実際のデータから最頻出感情を取得
    const mockFrequent = ['不安', '悲しさ', '苛立ち'];
    setFrequentEmotions(mockFrequent);
  }, []);

  const addEmotion = useCallback((emotionType: string) => {
    setFormData(prev => {
      if (!prev.emotions.find(e => e.emotionType === emotionType)) {
        return {
          ...prev,
          emotions: [...prev.emotions, {
            emotionType,
            intensityBefore: 5,
            intensityAfter: 5
          }]
        };
      }
      return prev;
    });
  }, [setFormData]);

  const removeEmotion = useCallback((emotionType: string) => {
    setFormData(prev => ({
      ...prev,
      emotions: prev.emotions.filter(e => e.emotionType !== emotionType)
    }));
  }, [setFormData]);

  const updateEmotionIntensity = useCallback((emotionType: string, intensity: number) => {
    setFormData(prev => ({
      ...prev,
      emotions: prev.emotions.map(e =>
        e.emotionType === emotionType ? { ...e, intensityBefore: intensity } : e
      )
    }));
  }, [setFormData]);

  // 検索とフィルタリング
  const filteredCategories = EMOTION_CATEGORIES.map(category => ({
    ...category,
    emotions: category.emotions.filter(emotion =>
      searchQuery === '' || emotion.includes(searchQuery)
    )
  })).filter(category => 
    (selectedCategory === null || category.id === selectedCategory) &&
    category.emotions.length > 0
  );

  const getEmotionColor = (emotion: string) => {
    const category = EMOTION_CATEGORIES.find(cat => cat.emotions.includes(emotion));
    return category?.color || EMOTION_CATEGORIES[0].color;
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Heart className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">感情を記録しましょう</h2>
        <p className="text-gray-600">その時どのような感情を感じましたか？強さも教えてください。</p>
      </div>

      {/* よく使う感情 */}
      {frequentEmotions.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
            <Star className="w-4 h-4 text-yellow-500 mr-1" />
            よく使う感情
          </h3>
          <div className="flex flex-wrap gap-2">
            {frequentEmotions.map((emotion) => {
              const isSelected = formData.emotions.some(e => e.emotionType === emotion);
              const color = getEmotionColor(emotion);
              return (
                <button
                  key={emotion}
                  onClick={() => isSelected ? removeEmotion(emotion) : addEmotion(emotion)}
                  className={`px-3 py-2 text-sm rounded-lg border-2 transition-colors ${
                    isSelected
                      ? `${color.border} ${color.bg} ${color.text}`
                      : `border-gray-200 hover:${color.bg} hover:${color.border}`
                  }`}
                >
                  {emotion}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 検索バー */}
      <div>
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="感情を検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* カテゴリフィルター */}
      <div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1 text-sm rounded-full border transition-colors ${
              selectedCategory === null
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 hover:bg-gray-50'
            }`}
          >
            すべて
          </button>
          {EMOTION_CATEGORIES.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-3 py-1 text-sm rounded-full border-2 transition-colors ${
                selectedCategory === category.id
                  ? `${category.color.border} ${category.color.bg} ${category.color.text}`
                  : `border-gray-200 hover:${category.color.bg}`
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* カテゴリ別感情選択 */}
      <div className="space-y-4">
        {filteredCategories.map((category) => (
          <div key={category.id} className={`${category.color.bg} ${category.color.border} border rounded-lg p-4`}>
            <h4 className={`text-sm font-medium ${category.color.text} mb-3`}>
              {category.name}
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {category.emotions.map((emotion) => {
                const isSelected = formData.emotions.some(e => e.emotionType === emotion);
                return (
                  <button
                    key={emotion}
                    onClick={() => isSelected ? removeEmotion(emotion) : addEmotion(emotion)}
                    className={`p-3 rounded-lg border-2 transition-colors ${
                      isSelected
                        ? `${category.color.border} ${category.color.bg} ${category.color.text} font-medium`
                        : `border-gray-200 hover:${category.color.bg} hover:${category.color.border}`
                    }`}
                  >
                    {emotion}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* 選択された感情の強度設定 */}
      {formData.emotions.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">感情の強さ</h3>
          <div className="space-y-4">
            {formData.emotions.map((emotion) => {
              const color = getEmotionColor(emotion.emotionType);
              return (
                <div key={emotion.emotionType} className={`${color.bg} ${color.border} border rounded-lg p-4`}>
                  <div className="flex justify-between items-center mb-2">
                    <span className={`font-medium ${color.text}`}>{emotion.emotionType}</span>
                    <span className="text-sm text-gray-600">
                      強さ: {emotion.intensityBefore}/10
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={emotion.intensityBefore}
                      onChange={(e) => updateEmotionIntensity(emotion.emotionType, parseInt(e.target.value))}
                      className="w-full slider-enhanced"
                      style={{
                        background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${emotion.intensityBefore * 10}%, #e5e7eb ${emotion.intensityBefore * 10}%, #e5e7eb 100%)`
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>1 - 弱い</span>
                    <span>5 - 普通</span>
                    <span>10 - 強い</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
});

// ステップ3: 思考の記録
const Step3Thoughts = memo<StepProps>(({ formData, setFormData, detectedDistortions, setDetectedDistortions }) => {
  const handleThoughtsChange = useCallback((thoughts: string) => {
    // 既存のルールベース検出
    let detected: CognitiveDistortion[] = [];
    if (thoughts.length > 10) {
      detected = detectCognitiveDistortions(thoughts);
      setDetectedDistortions?.(detected);
    } else {
      setDetectedDistortions?.([]);
    }
    
    // 状態を一度に更新
    setFormData(prev => ({ 
      ...prev, 
      thoughts,
      cognitiveDistortions: detected.map(d => d.name) 
    }));
  }, [setFormData, setDetectedDistortions]);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Brain className="w-12 h-12 text-purple-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">思考を記録しましょう</h2>
        <p className="text-gray-600">その時どんなことを考えていましたか？頭に浮かんだことをそのまま書いてください。</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          思考・考え
        </label>
        <textarea
          value={formData.thoughts}
          onChange={(e) => handleThoughtsChange(e.target.value)}
          placeholder="例：きっと私が悪いんだ、どうせうまくいかない、みんな私をバカだと思っている"
          className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
          rows={5}
          maxLength={1000}
        />
        <p className="text-sm text-gray-500 mt-1">
          {formData.thoughts.length}/1000文字
        </p>
      </div>

      {/* 静的なヒント */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-purple-800 mb-3 flex items-center">
          <Brain className="w-4 h-4 mr-2" />
          思考記録のヒント
        </h3>
        <div className="space-y-2 text-sm text-purple-700">
          <p className="flex items-start">
            <span className="font-medium mr-2">そのまま記録:</span>
            その瞬間に頭に浮かんだ言葉をそのまま書く
          </p>
          <p className="flex items-start">
            <span className="font-medium mr-2">内心の声:</span>
            自分に向けて話しかけていた内容を記録
          </p>
          <p className="flex items-start">
            <span className="font-medium mr-2">心配事も含む:</span>
            「もし〜だったら」という不安や心配も記録
          </p>
          <p className="flex items-start">
            <span className="font-medium mr-2">具体例:</span>
            「きっと私が悪い」「どうせうまくいかない」
          </p>
        </div>
      </div>

      {/* 認知の歪み検出結果 */}
      {detectedDistortions && detectedDistortions.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 mr-2" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800 mb-2">
                認知の歪みパターンを検出しました
              </h3>
              <div className="space-y-2">
                {detectedDistortions.map((distortion) => (
                  <div key={distortion.id} className="text-sm">
                    <span className="font-medium text-yellow-700">{distortion.name}</span>
                    <p className="text-yellow-600 mt-1">{distortion.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

// ステップ4: 代替思考
const Step4AlternativeThoughts = memo<StepProps>(({ formData, setFormData, detectedDistortions }) => {
  const [showReference, setShowReference] = useState(false);
  
  const suggestions = generateAlternativeThoughts(
    formData.situation,
    formData.thoughts,
    detectedDistortions || []
  );

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Lightbulb className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">別の見方を考えてみましょう</h2>
        <p className="text-gray-600">同じ状況を違う角度から見ると、どのように考えられるでしょうか？</p>
      </div>

      {/* これまでの記録を確認 */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg">
        <button
          onClick={() => setShowReference(!showReference)}
          className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-100 transition-colors rounded-lg"
        >
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">これまでの記録を確認</span>
          </div>
          {showReference ? (
            <ChevronUp className="w-4 h-4 text-gray-600" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-600" />
          )}
        </button>
        
        {showReference && (
          <div className="px-4 pb-4 space-y-3 animate-in slide-in-from-top-2 duration-300">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">出来事・状況</span>
              </div>
              <p className="text-sm text-blue-700 bg-white rounded px-2 py-1 leading-relaxed">
                {formData.situation || '未入力'}
              </p>
            </div>
            
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-800">その時の思考</span>
              </div>
              <p className="text-sm text-purple-700 bg-white rounded px-2 py-1 leading-relaxed">
                {formData.thoughts || '未入力'}
              </p>
            </div>
            
            {formData.emotions.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-medium text-red-800">感情</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {formData.emotions.map((emotion, index) => (
                    <span
                      key={index}
                      className="text-xs bg-white text-red-700 px-2 py-1 rounded font-medium"
                    >
                      {emotion.emotionType} ({emotion.intensityBefore}/10)
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            <div className="text-center pt-2">
              <p className="text-xs text-gray-500">
                💡 これらの情報を参考に、別の見方や考え方を見つけてみましょう
              </p>
            </div>
          </div>
        )}
      </div>

      {detectedDistortions && detectedDistortions.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-800 mb-2">アドバイス</h3>
          <div className="space-y-2">
            {detectedDistortions.map((distortion) => (
              <p key={distortion.id} className="text-sm text-blue-700">
                <strong>{distortion.name}:</strong> {getDistortionAdvice(distortion)}
              </p>
            ))}
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          代替思考・別の見方
        </label>
        <textarea
          value={formData.alternativeThoughts}
          onChange={(e) => setFormData(prev => ({ ...prev, alternativeThoughts: e.target.value }))}
          placeholder="例：一度の失敗ですべてが決まるわけではない、完璧である必要はない、他の人も同じような経験をしている"
          className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none"
          rows={4}
          maxLength={1000}
        />
        <p className="text-sm text-gray-500 mt-1">
          {formData.alternativeThoughts.length}/1000文字
        </p>
      </div>

      {/* 静的なヒント */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-green-800 mb-3 flex items-center">
          <Lightbulb className="w-4 h-4 mr-2" />
          代替思考を考えるヒント
        </h3>
        <div className="space-y-2 text-sm text-green-700">
          <p className="flex items-start">
            <span className="font-medium mr-2">友人視点:</span>
            友人が同じ状況だったらどうアドバイスしますか？
          </p>
          <p className="flex items-start">
            <span className="font-medium mr-2">証拠確認:</span>
            その考えを支持する証拠や反対する証拠はありますか？
          </p>
          <p className="flex items-start">
            <span className="font-medium mr-2">別の見方:</span>
            同じ状況を違う角度から見ると、どう考えられますか？
          </p>
          <p className="flex items-start">
            <span className="font-medium mr-2">中間の考え:</span>
            最悪の場合と最良の場合の中間はどのような考えですか？
          </p>
          <p className="flex items-start">
            <span className="font-medium mr-2">事実と感情:</span>
            感情的な判断と客観的な事実を分けて考えてみましょう
          </p>
        </div>
      </div>

      {suggestions.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-800 mb-2">考えてみるヒント</h3>
          <ul className="space-y-1">
            {suggestions.slice(0, 3).map((suggestion, index) => (
              <li key={index} className="text-sm text-gray-600">
                • {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
});

// ステップ5: 感情の再評価
const Step5EmotionReview = memo<StepProps>(({ formData, setFormData }) => {
  const updateEmotionAfter = useCallback((emotionType: string, intensity: number) => {
    setFormData(prev => ({
      ...prev,
      emotions: prev.emotions.map(e =>
        e.emotionType === emotionType ? { ...e, intensityAfter: intensity } : e
      )
    }));
  }, [setFormData]);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <BarChart3 className="w-12 h-12 text-green-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">感情の変化を確認しましょう</h2>
        <p className="text-gray-600">代替思考を考えた後、感情の強さはどのように変化しましたか？</p>
      </div>

      {/* 思考の対比表示 */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
          <Brain className="w-4 h-4 text-gray-600 mr-2" />
          思考の変化を確認
        </h3>
        
        <div className="space-y-3">
          {/* 元の思考 */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-red-800">元の思考</span>
            </div>
            <p className="text-sm text-red-700 bg-white rounded px-2 py-1 leading-relaxed">
              {formData.thoughts || '未入力'}
            </p>
          </div>
          
          {/* 代替思考 */}
          {formData.alternativeThoughts && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">代替思考</span>
              </div>
              <p className="text-sm text-green-700 bg-white rounded px-2 py-1 leading-relaxed">
                {formData.alternativeThoughts}
              </p>
            </div>
          )}
        </div>
        
        <div className="text-center mt-3">
          <p className="text-xs text-gray-500">
            💭 この代替思考を踏まえて、感情の強さを評価してください
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {formData.emotions.map((emotion) => (
          <div key={emotion.emotionType} className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3">{emotion.emotionType}</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600">記録前の強さ</label>
                <div className="flex items-center mt-1">
                  <span className="text-2xl font-bold text-red-500 mr-2">
                    {emotion.intensityBefore}
                  </span>
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
                      <div
                        key={i}
                        className={`w-2 h-2 rounded-full ${
                          i <= emotion.intensityBefore ? 'bg-red-500' : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-600">現在の強さ</label>
                <div className="flex items-center mt-1 mb-2">
                  <span className="text-2xl font-bold text-green-500 mr-2">
                    {emotion.intensityAfter}
                  </span>
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
                      <div
                        key={i}
                        className={`w-2 h-2 rounded-full ${
                          i <= emotion.intensityAfter ? 'bg-green-500' : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <div className="relative">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={emotion.intensityAfter}
                    onChange={(e) => updateEmotionAfter(emotion.emotionType, parseInt(e.target.value))}
                    className="w-full slider-enhanced"
                    style={{
                      background: `linear-gradient(to right, #10b981 0%, #10b981 ${emotion.intensityAfter * 10}%, #e5e7eb ${emotion.intensityAfter * 10}%, #e5e7eb 100%)`
                    }}
                  />
                </div>
              </div>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
});

export default ThoughtRecordWizard;