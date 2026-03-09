import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Brain, Target, Zap, Calendar, TrendingUp, ArrowRight, Lightbulb, Heart, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';


interface EmotionRecord {
  id: string;
  emotion_type: string;
  intensity_before: number;
  intensity_after: number;
}

interface ThoughtRecord {
  id: string;
  user_id: string;
  situation: string;
  thoughts: string;
  alternative_thoughts?: string;
  cognitive_distortions: string[];
  exp_gained: number;
  created_at: string;
  emotion_records?: EmotionRecord[];
}

interface CBTStats {
  totalRecords: number;
  currentStreak: number;
  totalExp: number;
  level: number;
  todayCompleted: boolean;
}

const ThoughtRecords: React.FC = () => {
  const { user, profile } = useAuth();
  const [recentRecords, setRecentRecords] = useState<ThoughtRecord[]>([]);
  const [stats, setStats] = useState<CBTStats>({
    totalRecords: 0,
    currentStreak: 0,
    totalExp: 0,
    level: 1,
    todayCompleted: false
  });
  const [loading, setLoading] = useState(true);
  const [expandedRecords, setExpandedRecords] = useState<string[]>([]);

  useEffect(() => {
    if (user?.id) {
      fetchData();
    }
  }, [user?.id]);

  const fetchData = async () => {
    try {
      // 最新の思考記録を取得（感情記録も含む）
      const { data: records } = await supabase
        .from('thought_records')
        .select(`
          *,
          emotion_records (
            id,
            emotion_type,
            intensity_before,
            intensity_after
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(5);

      setRecentRecords(records || []);

      // CBT統計を計算
      const totalRecords = records?.length || 0;
      const totalExp = profile?.cbt_total_exp || 0;
      const level = Math.floor(totalExp / 100) + 1;
      const currentStreak = profile?.cbt_current_streak || 0;

      // 今日の記録があるかチェック
      const today = new Date().toISOString().split('T')[0];
      const todayCompleted = records?.some(record => 
        record.created_at.startsWith(today)
      ) || false;

      setStats({
        totalRecords,
        currentStreak,
        totalExp,
        level,
        todayCompleted
      });
    } catch (error) {
      console.error('データ取得エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const getExpForNextLevel = (currentLevel: number) => currentLevel * 100;
  const getCurrentLevelExp = (totalExp: number, level: number) => totalExp - ((level - 1) * 100);

  const toggleRecordExpansion = (recordId: string) => {
    setExpandedRecords(prev => 
      prev.includes(recordId) 
        ? prev.filter(id => id !== recordId)
        : [...prev, recordId]
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* ヘッダー */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex justify-center items-center mb-4">
            <Brain className="w-8 h-8 text-blue-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">思考記録</h1>
          </div>
          <p className="text-gray-600 mb-2">
            認知行動療法（CBT）をベースとした思考記録で、心の健康をサポートします
          </p>
          <p className="text-xs text-gray-500 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 inline-block">
            🔒 この機能で入力した内容は「みんなの庭」には共有されません
          </p>
        </motion.div>

        {/* 統計カード */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg p-6 shadow-md"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">レベル</p>
                <p className="text-2xl font-bold text-blue-600">{stats.level}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${(getCurrentLevelExp(stats.totalExp, stats.level) / getExpForNextLevel(stats.level)) * 100}%`
                  }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {getCurrentLevelExp(stats.totalExp, stats.level)} / {getExpForNextLevel(stats.level)} EXP
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg p-6 shadow-md"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">連続記録</p>
                <p className="text-2xl font-bold text-orange-600">{stats.currentStreak}日</p>
              </div>
              <Zap className="w-8 h-8 text-orange-600" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg p-6 shadow-md"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">総記録数</p>
                <p className="text-2xl font-bold text-green-600">{stats.totalRecords}</p>
              </div>
              <Target className="w-8 h-8 text-green-600" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-lg p-6 shadow-md"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">今日のクエスト</p>
                <p className={`text-2xl font-bold ${stats.todayCompleted ? 'text-green-600' : 'text-gray-400'}`}>
                  {stats.todayCompleted ? '完了' : '未完了'}
                </p>
              </div>
              <Calendar className={`w-8 h-8 ${stats.todayCompleted ? 'text-green-600' : 'text-gray-400'}`} />
            </div>
          </motion.div>
        </div>

        {/* アクションボタン */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-center mb-8"
        >
          <Link
            to="/thought-records/new"
            className="inline-flex items-center px-8 py-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
          >
            <Plus className="w-5 h-5 mr-2" />
            新しい思考記録を始める
          </Link>
        </motion.div>

        {/* 最近の記録 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-lg shadow-md p-6"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-4">最近の記録</h2>
          
          {recentRecords.length === 0 ? (
            <div className="text-center py-8">
              <Brain className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">まだ記録がありません</p>
              <p className="text-sm text-gray-400">最初の思考記録を始めてみましょう</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentRecords.map((record, index) => {
                // 感情の改善度を計算
                const getEmotionImprovement = () => {
                  if (!record.emotion_records || record.emotion_records.length === 0) return null;
                  
                  const totalImprovement = record.emotion_records.reduce((sum, emotion) => {
                    return sum + (emotion.intensity_before - emotion.intensity_after);
                  }, 0);
                  
                  const averageImprovement = totalImprovement / record.emotion_records.length;
                  return averageImprovement;
                };

                const improvement = getEmotionImprovement();
                const hasImprovement = improvement !== null && improvement > 0;
                const isExpanded = expandedRecords.includes(record.id);

                return (
                  <motion.div
                    key={record.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md hover:bg-gray-50 transition-all duration-200 bg-white cursor-pointer"
                    onClick={() => toggleRecordExpansion(record.id)}
                  >
                    {/* ヘッダー部分 */}
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-medium text-gray-900 flex-1">
                        📝 {record.situation}
                      </h3>
                      <div className="flex items-center gap-2">
                        {hasImprovement && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                            改善度 +{improvement?.toFixed(1)}
                          </span>
                        )}
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {new Date(record.created_at).toLocaleDateString('ja-JP')}
                        </span>
                        <div className="flex items-center text-blue-600 ml-2">
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 思考の対比 */}
                    <motion.div 
                      className="space-y-3 mb-3"
                      initial={false}
                      animate={{ 
                        height: isExpanded ? "auto" : "auto"
                      }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="bg-red-50 border-l-4 border-red-300 p-3 rounded">
                        <div className="flex items-start gap-2">
                          <span className="text-red-600 text-xs font-medium mt-0.5">元の思考</span>
                        </div>
                        <motion.p 
                          className={`text-sm text-red-700 mt-1 ${isExpanded ? '' : 'line-clamp-2'}`}
                          initial={false}
                          animate={{ 
                            opacity: 1
                          }}
                          transition={{ duration: 0.3 }}
                        >
                          {record.thoughts}
                        </motion.p>
                      </div>
                      
                      {record.alternative_thoughts && (
                        <div className="bg-green-50 border-l-4 border-green-300 p-3 rounded">
                          <div className="flex items-start gap-2">
                            <Lightbulb className="w-4 h-4 text-green-600 mt-0.5" />
                            <span className="text-green-600 text-xs font-medium">代替思考</span>
                          </div>
                          <motion.p 
                            className={`text-sm text-green-700 mt-1 ${isExpanded ? '' : 'line-clamp-2'}`}
                            initial={false}
                            animate={{ 
                              opacity: 1
                            }}
                            transition={{ duration: 0.3 }}
                          >
                            {record.alternative_thoughts}
                          </motion.p>
                        </div>
                      )}
                    </motion.div>

                    {/* 感情の変化 */}
                    {record.emotion_records && record.emotion_records.length > 0 && (
                      <div className="mb-3">
                        <div className="flex items-center gap-1 mb-2">
                          <Heart className="w-4 h-4 text-pink-500" />
                          <span className="text-xs font-medium text-gray-700">感情の変化</span>
                        </div>
                        <div className="space-y-2">
                          {record.emotion_records.slice(0, 3).map((emotion, idx) => {
                            const change = emotion.intensity_before - emotion.intensity_after;
                            const changeColor = change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-gray-600';
                            
                            return (
                              <div key={idx} className="flex items-center justify-between text-xs">
                                <span className="text-gray-600">{emotion.emotion_type}</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-red-600 font-medium">{emotion.intensity_before}</span>
                                  <ArrowRight className="w-3 h-3 text-gray-400" />
                                  <span className="text-green-600 font-medium">{emotion.intensity_after}</span>
                                  {change !== 0 && (
                                    <span className={`font-medium ${changeColor}`}>
                                      ({change > 0 ? '-' : '+'}{Math.abs(change)})
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                          {record.emotion_records.length > 3 && (
                            <p className="text-xs text-gray-500">他 {record.emotion_records.length - 3} 件...</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 認知の歪み */}
                    {record.cognitive_distortions.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {record.cognitive_distortions.map((distortion, idx) => (
                          <span
                            key={idx}
                            className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
                          >
                            {distortion}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* 展開状態の説明 */}
                    {(record.thoughts.length > 60 || (record.alternative_thoughts && record.alternative_thoughts.length > 60)) && (
                      <div className="flex items-center justify-center pt-2 border-t border-gray-100">
                        <div className="flex items-center text-xs text-gray-500 gap-1">
                          {isExpanded ? (
                            <>
                              <ChevronUp className="w-3 h-3" />
                              <span>タップして折りたたみ</span>
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-3 h-3" />
                              <span>タップして全文表示</span>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default ThoughtRecords;