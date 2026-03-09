/**
 * 思考記録（CBT）へのアクセスカード
 * ホームページの分析モード用
 */

import { motion } from 'framer-motion';
import { Brain, BookOpen, TrendingUp, Clock, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ThoughtRecordCardProps {
  weeklyRecordCount?: number;
  totalRecordCount?: number;
  className?: string;
  onRecordStart?: () => void;
}

export function ThoughtRecordCard({ 
  weeklyRecordCount = 0,
  totalRecordCount = 0,
  className = '',
  onRecordStart
}: ThoughtRecordCardProps) {
  const navigate = useNavigate();

  const handleStartRecord = () => {
    if (onRecordStart) {
      onRecordStart();
    }
    navigate('/thought-records/new');
  };

  const handleViewHistory = () => {
    navigate('/thought-records');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-6 ${className}`}
    >
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Brain className="w-6 h-6 text-indigo-500 mr-3" />
          <div>
            <h3 className="text-lg font-medium text-gray-800">
              思考記録（CBT）
            </h3>
            <p className="text-sm text-gray-500">
              心の整理で新しい視点を見つけよう
            </p>
          </div>
        </div>
      </div>

      {/* 説明文 */}
      <div className="mb-4 p-3 bg-indigo-50 rounded-lg">
        <p className="text-sm text-indigo-700 leading-relaxed">
          認知行動療法に基づいた思考記録で、考えや感情のパターンを客観的に整理できます。
          ネガティブな思考をバランスの取れた視点に変えるお手伝いをします。
        </p>
      </div>

      {/* 統計情報 */}
      <div className="mb-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 flex items-center">
            <Clock className="w-4 h-4 mr-1 text-gray-400" />
            今週の記録
          </span>
          <span className="font-medium">{weeklyRecordCount}回</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 flex items-center">
            <BookOpen className="w-4 h-4 mr-1 text-gray-400" />
            総記録数
          </span>
          <span className="font-medium">{totalRecordCount}回</span>
        </div>
      </div>

      {/* 進捗と効果 */}
      {weeklyRecordCount > 0 && (
        <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-100">
          <div className="flex items-start">
            <TrendingUp className="w-4 h-4 text-green-600 mr-2 mt-0.5" />
            <div>
              <div className="text-sm font-medium text-green-800">
                継続的な記録で成長中
              </div>
              <div className="text-sm text-green-700 mt-1">
                {weeklyRecordCount >= 3 
                  ? '素晴らしい継続力です！思考パターンの改善が期待できます。'
                  : '良いペースです。継続することで効果が実感できるでしょう。'
                }
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 初回利用の説明 */}
      {totalRecordCount === 0 && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
          <div className="flex items-start">
            <Brain className="w-4 h-4 text-blue-600 mr-2 mt-0.5" />
            <div>
              <div className="text-sm font-medium text-blue-800">
                初回利用について
              </div>
              <div className="text-sm text-blue-700 mt-1">
                5つのステップで簡単に思考を整理できます。10分程度で完了します。
              </div>
            </div>
          </div>
        </div>
      )}

      {/* アクションボタン */}
      <div className="flex flex-col sm:flex-row gap-2">
        <button
          onClick={handleStartRecord}
          className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white py-2 px-4 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center"
        >
          <Brain className="w-4 h-4 mr-2" />
          思考記録を始める
        </button>
        
        {totalRecordCount > 0 && (
          <button
            onClick={handleViewHistory}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center"
          >
            <BookOpen className="w-4 h-4 mr-2" />
            記録を見る
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>
        )}
      </div>
    </motion.div>
  );
}