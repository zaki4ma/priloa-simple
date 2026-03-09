/**
 * 認知の歪み検出ユーティリティ
 */

import { COGNITIVE_DISTORTIONS } from '../types/thoughtRecord';
import type { CognitiveDistortion } from '../types/thoughtRecord';

/**
 * テキストから認知の歪みパターンを検出
 */
export const detectCognitiveDistortions = (text: string): CognitiveDistortion[] => {
  const detectedDistortions: CognitiveDistortion[] = [];
  const normalizedText = text.toLowerCase();

  for (const distortion of COGNITIVE_DISTORTIONS) {
    let hasMatch = false;

    // キーワードベースの検出
    for (const keyword of distortion.keywords) {
      if (normalizedText.includes(keyword.toLowerCase())) {
        hasMatch = true;
        break;
      }
    }

    // 特定パターンのより詳細な検出
    if (!hasMatch) {
      hasMatch = checkSpecificPatterns(normalizedText, distortion.id);
    }

    if (hasMatch) {
      detectedDistortions.push(distortion);
    }
  }

  return detectedDistortions;
};

/**
 * 特定の認知の歪みパターンをより詳細に検出
 */
const checkSpecificPatterns = (text: string, distortionId: string): boolean => {
  switch (distortionId) {
    case 'all-or-nothing':
      // 極端な表現パターン（拡張）
      return /(?:100%|0%|完全に|全然|絶対に|一切|まったく|全く|完璧|完全)/.test(text) ||
             /(?:いつも|必ず|決して|一度も|絶対|間違いなく).*(?:だめ|失敗|うまくいかない|ダメ|無理)/.test(text) ||
             /(?:白か黒か|0か100か|成功か失敗か)/.test(text) ||
             /(?:全て|すべて).*(?:終わり|おしまい|だめ|ダメ)/.test(text);

    case 'overgeneralization':
      // 一般化パターン（拡張）
      return /(?:いつも|みんな|全員|すべて|毎回|典型的|大抵|たいてい|普通|普通は|当然|当たり前|常に).*(?:そう|だ|である)/.test(text) ||
             /一度.*(?:から|ので).*(?:いつも|ずっと|これからも|今後も|永遠に)/.test(text) ||
             /(?:〜な人|〜な奴|〜なやつ).*(?:ばかり|ばっかり|しかいない)/.test(text) ||
             /(?:どこでも|どこに行っても|何をしても).*(?:同じ|いつも|必ず)/.test(text);

    case 'mental-filter':
      // ネガティブフィルターパターン（拡張）
      return /(?:だけど|でも|しかし|ただ|けれど|けども|とはいえ|といっても).*(?:だめ|悪い|失敗|問題|ダメ|最悪|困った|やばい)/.test(text) ||
             /(?:良い|成功|うまく|よかった|順調|上手).*(?:けど|でも|だけど|しかし).*(?:気になる|心配|不安|嫌|気に入らない)/.test(text) ||
             /(?:褒められた|評価された|認められた).*(?:けど|でも|しかし).*(?:本当は|実は|でも)/.test(text);

    case 'jumping-to-conclusions':
      // 推測パターン（拡張）
      return /(?:きっと|どうせ|たぶん|おそらく|多分|恐らく|間違いなく|絶対|確実に).*(?:だめ|失敗|嫌われ|うまくいかない|ダメ|無理|終わり)/.test(text) ||
             /.*(?:に違いない|はず|と思う|に決まっている|だろう)$/.test(text) ||
             /(?:〜を見て|〜だから).*(?:きっと|絶対|間違いなく).*(?:思っている|考えている|感じている)/.test(text) ||
             /(?:もう|きっと|今頃).*(?:嫌われて|見捨てられて|呆れられて).*(?:いる|るだろう)/.test(text);

    case 'should-statements':
      // べき思考パターン（拡張）
      return /(?:すべき|べき|なければならない|なければいけない|はず|義務|責任)/.test(text) ||
             /(?:もっと|ちゃんと|きちんと|しっかり|完璧に).*(?:やる|する|なる)(?:べき|はず|必要|義務)/.test(text) ||
             /(?:普通は|当然|当たり前|常識的に).*(?:すべき|べき|はず|もの)/.test(text) ||
             /(?:〜でなければ|〜しなければ).*(?:いけない|だめ|ダメ|価値がない)/.test(text);

    case 'personalization':
      // 個人化パターン（拡張）
      return /(?:私のせい|自分が悪い|私が.*から|自分のせいで|僕のせい|俺のせい)/.test(text) ||
             /(?:申し訳|すみません|ごめん|済まない).*(?:私|自分|僕|俺)/.test(text) ||
             /(?:私が|自分が|僕が|俺が).*(?:いなければ|いないほうが|だめだから)/.test(text) ||
             /(?:私|自分|僕|俺).*(?:責任|原因|問題|せい)/.test(text);

    default:
      return false;
  }
};

/**
 * 認知の歪みの説明とアドバイスを取得
 */
export const getDistortionAdvice = (distortion: CognitiveDistortion): string => {
  const adviceMap: Record<string, string> = {
    'all-or-nothing': '物事にはグレーゾーンがあります。「少しうまくいった」「部分的に成功した」という中間の評価も考えてみましょう。',
    'overgeneralization': '一つの出来事がすべてを決めるわけではありません。他の経験や例外的なケースも思い出してみましょう。',
    'mental-filter': 'ネガティブな面だけでなく、ポジティブな面や中立的な面にも注目してみましょう。',
    'disqualifying-positive': '良いことは偶然ではなく、あなたの努力や能力の結果かもしれません。素直に評価してみましょう。',
    'jumping-to-conclusions': '確実な証拠がないまま結論を出していませんか？他の可能性も考えてみましょう。',
    'magnification-minimization': '出来事の重要度を客観的に評価してみましょう。1年後、5年後にも同じように感じるでしょうか？',
    'emotional-reasoning': '感情は事実とは異なります。不安だからといって危険とは限りません。客観的な証拠を探してみましょう。',
    'should-statements': '「すべき」を「できれば」「したい」に変えてみましょう。完璧である必要はありません。',
    'labeling': 'あなたは一つの行動で定義される存在ではありません。「〜をした人」ではなく「〜という行動をとった」と考えてみましょう。',
    'personalization': 'すべてがあなたの責任ではありません。他の要因や関係者の役割も考えてみましょう。'
  };

  return adviceMap[distortion.id] || '別の視点から状況を見直してみましょう。';
};

/**
 * 代替思考の提案を生成
 */
export const generateAlternativeThoughts = (
  _situation: string,
  _originalThought: string,
  detectedDistortions: CognitiveDistortion[]
): string[] => {
  const suggestions: string[] = [];

  // 一般的な代替思考のプロンプト（拡張）
  suggestions.push('この状況を友人に説明するとしたら、どのように話しますか？');
  suggestions.push('5年後の自分から見て、この問題はどの程度重要でしょうか？');
  suggestions.push('同じ状況で友人が悩んでいたら、どのようなアドバイスをしますか？');
  suggestions.push('この経験から学べることは何でしょうか？');
  suggestions.push('もし今日が人生最後の日だとしたら、この問題をどう感じますか？');
  suggestions.push('この状況で感謝できることは何かありますか？');
  suggestions.push('過去に似たような状況を乗り越えた経験はありませんか？');

  // 検出された歪みに基づく具体的な提案
  for (const distortion of detectedDistortions) {
    switch (distortion.id) {
      case 'all-or-nothing':
        suggestions.push('この状況の中間的な評価は何でしょうか？完全に悪いわけでも良いわけでもない部分はありませんか？');
        suggestions.push('0から100までの尺度で考えて、この状況は何点くらいでしょうか？');
        suggestions.push('部分的にうまくいった部分と、改善が必要な部分を分けて考えてみましょう。');
        break;
      case 'overgeneralization':
        suggestions.push('過去にうまくいった類似の経験はありませんか？この一度の出来事で全てが決まるわけではありません。');
        suggestions.push('この結果を一般化する前に、他にどのような要因が影響したでしょうか？');
        suggestions.push('もし友人が同じような一度の失敗で落ち込んでいたら、どう声をかけますか？');
        break;
      case 'mental-filter':
        suggestions.push('この状況の良い面や学べる点は何でしょうか？');
        suggestions.push('ネガティブな側面以外に、中立的な事実や、小さな進歩はありませんか？');
        suggestions.push('この経験の中で、あなたが頑張った部分や成長した部分はありませんか？');
        break;
      case 'jumping-to-conclusions':
        suggestions.push('他にどのような可能性が考えられますか？確実に証明できることと推測を分けて考えてみましょう。');
        suggestions.push('この結論を出すのに十分な証拠がありますか？他の解釈はできませんか？');
        suggestions.push('相手の立場や状況を考慮すると、別の理由が考えられませんか？');
        break;
      case 'should-statements':
        suggestions.push('「すべき」を「したい」や「できれば」に変えると、どのような気持ちになりますか？');
        suggestions.push('この「すべき」は誰が決めたルールでしょうか？本当に絶対に守るべきものですか？');
        suggestions.push('完璧でなくても、あなたには価値があります。今のあなたの努力を認めてみませんか？');
        break;
      case 'personalization':
        suggestions.push('この結果に影響した他の要因は何でしょうか？あなた以外の人や状況の役割はありませんか？');
        suggestions.push('同じ状況で友人が自分を責めていたら、どう声をかけますか？');
        suggestions.push('この責任を100%とした時、あなたの実際の責任は何%くらいでしょうか？');
        break;
    }
  }

  return [...new Set(suggestions)]; // 重複を除去
};