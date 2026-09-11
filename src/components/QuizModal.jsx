import React, { useState, useMemo, useRef, useEffect } from 'react';
import { CATEGORIES } from '../utils/chemistry';
import { playSound } from '../utils/sound';
import { Trophy, CheckCircle2, XCircle, RotateCcw, Award, Zap, X, HelpCircle } from 'lucide-react';

const QUESTIONS_PER_ROUND = 10;

/**
 * Fisher-Yates shuffle algorithm for unbiased option randomization.
 * @template T
 * @param {Array<T>} arr
 * @returns {Array<T>}
 */
function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * QuizModal: Enterprise Educational Challenge System.
 * Features 3 game modes, unbiased option randomization, audio feedback,
 * streak mechanics, and a complete final evaluation scorecard.
 */
export const QuizModal = ({
  isOpen,
  onClose,
  elements = [],
  isDarkMode = true,
  isAudioEnabled = true,
}) => {
  const [quizMode, setQuizMode] = useState('symbol'); // 'symbol' | 'atomicNumber' | 'category'
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswerEvaluated, setIsAnswerEvaluated] = useState(false);
  const [roundHistory, setRoundHistory] = useState([]);
  const [isRoundFinished, setIsRoundFinished] = useState(false);

  // Pre-select randomized pool of questions for the round
  const [roundQuestions, setRoundQuestions] = useState(() => {
    return Array.isArray(elements) && elements.length > 0
      ? shuffleArray(elements).slice(0, QUESTIONS_PER_ROUND)
      : [];
  });

  const feedbackTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    };
  }, []);

  // When modal opens or elements finish loading, ensure we have a fresh pool of questions
  useEffect(() => {
    if (isOpen && elements.length > 0 && roundQuestions.length === 0) {
      setRoundQuestions(shuffleArray(elements).slice(0, QUESTIONS_PER_ROUND));
    }
  }, [isOpen, elements, roundQuestions.length]);

  const resetQuiz = (newMode = quizMode) => {
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    setQuizMode(newMode);
    setCurrentQuestionIndex(0);
    setScore(0);
    setStreak(0);
    setMaxStreak(0);
    setSelectedOption(null);
    setIsAnswerEvaluated(false);
    setRoundHistory([]);
    setIsRoundFinished(false);
    if (elements.length > 0) {
      setRoundQuestions(shuffleArray(elements).slice(0, QUESTIONS_PER_ROUND));
    }
  };

  const currentElement = roundQuestions[currentQuestionIndex] || elements[0];

  // 4 Randomized options (1 correct + 3 unique distractors)
  const currentOptions = useMemo(() => {
    if (!currentElement || isRoundFinished) return [];

    if (quizMode === 'symbol') {
      const correct = currentElement.symbol;
      const pool = new Set([correct]);
      while (pool.size < 4 && pool.size < elements.length) {
        const rand = elements[Math.floor(Math.random() * elements.length)];
        pool.add(rand.symbol);
      }
      return shuffleArray(Array.from(pool));
    } else if (quizMode === 'atomicNumber') {
      const correct = currentElement.number.toString();
      const pool = new Set([correct]);
      while (pool.size < 4 && pool.size < elements.length) {
        const rand = elements[Math.floor(Math.random() * elements.length)];
        pool.add(rand.number.toString());
      }
      return shuffleArray(Array.from(pool));
    } else {
      const correct = CATEGORIES[currentElement.category]?.nameFa || 'نامشخص';
      const pool = new Set([correct]);
      const allCategoryNames = Object.values(CATEGORIES).map((c) => c.nameFa);
      while (pool.size < 4 && pool.size < allCategoryNames.length) {
        const rand = allCategoryNames[Math.floor(Math.random() * allCategoryNames.length)];
        pool.add(rand);
      }
      return shuffleArray(Array.from(pool));
    }
  }, [quizMode, currentElement, elements, isRoundFinished]);

  const getCorrectAnswer = (el) => {
    if (quizMode === 'symbol') return el.symbol;
    if (quizMode === 'atomicNumber') return el.number.toString();
    return CATEGORIES[el.category]?.nameFa || 'نامشخص';
  };

  const handleAnswer = (option) => {
    if (isAnswerEvaluated || isRoundFinished) return;

    setSelectedOption(option);
    setIsAnswerEvaluated(true);

    const correctAnswer = getCorrectAnswer(currentElement);
    const isCorrect = option === correctAnswer;

    let newStreak = streak;
    if (isCorrect) {
      playSound('success', isAudioEnabled);
      setScore((s) => s + 10);
      newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > maxStreak) {
        setMaxStreak(newStreak);
      }
    } else {
      playSound('wrong', isAudioEnabled);
      setStreak(0);
    }

    // Record question result
    const questionRecord = {
      element: currentElement,
      questionNum: currentQuestionIndex + 1,
      mode: quizMode,
      selected: option,
      correct: correctAnswer,
      isCorrect,
    };
    setRoundHistory((prev) => [...prev, questionRecord]);

    // Advance to next question or show scorecard
    feedbackTimerRef.current = setTimeout(() => {
      if (currentQuestionIndex + 1 >= QUESTIONS_PER_ROUND) {
        setIsRoundFinished(true);
      } else {
        setCurrentQuestionIndex((i) => i + 1);
        setSelectedOption(null);
        setIsAnswerEvaluated(false);
      }
    }, 950);
  };

  // Rank / Grade title based on final score
  const getRankBadge = (finalScore) => {
    const maxScore = QUESTIONS_PER_ROUND * 10;
    const ratio = finalScore / maxScore;
    if (ratio === 1) {
      return {
        title: '🏆 نابغه شیمی کوانتومی',
        desc: 'پاسخ ۱۰۰٪ بدون هیچ خطا! عملکرد بی‌نظیر!',
        color: 'text-amber-400',
        titleColor: 'text-amber-400',
      };
    }
    if (ratio >= 0.8) {
      return {
        title: '🥇 شیمی‌دان ارشد',
        desc: 'تسلط عالی بر جدول تناوبی و خواص عناصر.',
        color: 'text-cyan-400',
        titleColor: 'text-cyan-400',
      };
    }
    if (ratio >= 0.6) {
      return {
        title: '🥈 پژوهشگر کوشا',
        desc: 'عملکرد بسیار خوب، با کمی مرور به اوج خواهید رسید.',
        color: 'text-emerald-400',
        titleColor: 'text-emerald-400',
      };
    }
    if (ratio >= 0.4) {
      return {
        title: '🥉 دانشجوی مستعد',
        desc: 'پایه‌ای خوب، تمرین بیشتر در بخش نمادها توصیه می‌شود.',
        color: 'text-purple-400',
        titleColor: 'text-purple-400',
      };
    }
    return {
      title: '🔬 کارآموز آزمایشگاه',
      desc: 'جدول را مجدداً بررسی کرده و دوباره چالش را شروع کنید!',
      color: 'text-rose-400',
      titleColor: 'text-rose-400',
    };
  };

  if (!isOpen || !elements.length) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-lg rounded-2xl p-6 shadow-2xl border text-center relative max-h-[92vh] flex flex-col ${
          isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
        }`}
      >
        {/* Header Bar */}
        <div className="flex justify-between items-center pb-3 mb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-purple-400" />
            <h3 className="font-black text-base text-purple-400">آزمون و چالش شیمی</h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            title="بستن"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ACTIVE QUIZ SCREEN */}
        {!isRoundFinished ? (
          <div className="flex-1 flex flex-col justify-between">
            {/* Top HUD: Score & Progress */}
            <div>
              <div className="flex justify-between items-center mb-3 text-xs font-mono">
                <div className="flex items-center gap-3">
                  <span className="text-amber-400 font-bold flex items-center gap-1">
                    <Award className="w-3.5 h-3.5" />
                    امتیاز: {score}
                  </span>
                  <span className="text-rose-400 font-bold flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5" />
                    رکورد: {streak}🔥
                  </span>
                </div>
                <div className="text-slate-400 font-sans">
                  سوال <strong className="text-cyan-400 font-mono">{currentQuestionIndex + 1}</strong> از{' '}
                  <strong className="text-slate-300 font-mono">{QUESTIONS_PER_ROUND}</strong>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mb-4">
                <div
                  className="bg-purple-500 h-full transition-all duration-300"
                  style={{ width: `${((currentQuestionIndex + 1) / QUESTIONS_PER_ROUND) * 100}%` }}
                />
              </div>

              {/* Mode Switcher */}
              <div className="flex bg-slate-800/80 p-1 rounded-xl mb-4 text-xs font-bold gap-1">
                <button
                  onClick={() => resetQuiz('symbol')}
                  className={`flex-1 py-1.5 rounded-lg transition ${
                    quizMode === 'symbol' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  نماد شیمیایی
                </button>
                <button
                  onClick={() => resetQuiz('atomicNumber')}
                  className={`flex-1 py-1.5 rounded-lg transition ${
                    quizMode === 'atomicNumber' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  عدد اتمی
                </button>
                <button
                  onClick={() => resetQuiz('category')}
                  className={`flex-1 py-1.5 rounded-lg transition ${
                    quizMode === 'category' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  دسته‌بندی
                </button>
              </div>
            </div>

            {/* Question Card */}
            <div className="py-4 bg-slate-950/60 rounded-2xl border border-slate-800 my-2 px-4 cyber-glass">
              <p className="text-slate-400 text-xs mb-2 flex items-center justify-center gap-1">
                <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
                {quizMode === 'symbol' && 'نماد شیمیایی عنصر زیر چیست؟'}
                {quizMode === 'atomicNumber' && 'عدد اتمی عنصر زیر کدام است؟'}
                {quizMode === 'category' && 'دسته‌بندی عنصر زیر کدام است؟'}
              </p>
              <h2 className="text-3xl font-black text-cyan-400 mb-1 font-sans">
                {currentElement?.nameFa || '---'}
              </h2>
              <p className="text-xs text-slate-500 font-mono">
                {currentElement?.nameEn} {quizMode !== 'atomicNumber' && `(Z = ${currentElement.number})`}
              </p>
            </div>

            {/* Options Grid */}
            <div className="grid grid-cols-2 gap-3 my-3">
              {currentOptions.map((opt, i) => {
                const correctAnswer = getCorrectAnswer(currentElement);
                let btnStyle = 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200';

                if (isAnswerEvaluated) {
                  if (opt === correctAnswer) {
                    btnStyle = 'bg-emerald-600/90 border-emerald-400 text-white shadow-lg shadow-emerald-900/50';
                  } else if (opt === selectedOption) {
                    btnStyle = 'bg-rose-600/90 border-rose-400 text-white shadow-lg shadow-rose-900/50';
                  } else {
                    btnStyle = 'bg-slate-800/40 border-slate-800 text-slate-500 opacity-50';
                  }
                }

                return (
                  <button
                    key={i}
                    onClick={() => handleAnswer(opt)}
                    disabled={isAnswerEvaluated}
                    className={`py-3.5 px-3 rounded-xl font-mono text-sm font-bold border transition duration-150 ${btnStyle} active:scale-95`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>

            {/* Status Feedback Line */}
            <div className="h-6 flex items-center justify-center text-xs font-bold">
              {isAnswerEvaluated && (
                <div
                  className={`flex items-center gap-1.5 animate-in fade-in ${
                    selectedOption === getCorrectAnswer(currentElement) ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {selectedOption === getCorrectAnswer(currentElement) ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>پاسخ صحیح! ۱۰+ امتیاز</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4" />
                      <span>پاسخ نادرست! گزینه صحیح: {getCorrectAnswer(currentElement)}</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* FINAL EVALUATION SCORECARD (کارنامه پایانی) */
          <div className="flex-1 flex flex-col justify-between overflow-y-auto pr-1 animate-in zoom-in-95 duration-200">
            <div>
              {/* Scorecard Trophy Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-950/60 via-slate-900 to-cyan-950/60 border border-purple-800/50 mb-4 text-center">
                <Trophy className="w-12 h-12 text-amber-400 mx-auto mb-2 animate-bounce" />
                <h3 className={`text-lg font-black ${getRankBadge(score).titleColor || 'text-amber-400'}`}>
                  {getRankBadge(score).title}
                </h3>
                <p className="text-xs text-slate-300 mt-1">{getRankBadge(score).desc}</p>
              </div>

              {/* Statistics Grid */}
              <div className="grid grid-cols-3 gap-2 text-xs font-mono mb-4">
                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block text-[10px] font-sans">امتیاز نهایی</span>
                  <strong className="text-lg text-amber-400">{score}</strong> / {QUESTIONS_PER_ROUND * 10}
                </div>
                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block text-[10px] font-sans">دقت پاسخ‌ها</span>
                  <strong className="text-lg text-cyan-400">
                    {Math.round((score / (QUESTIONS_PER_ROUND * 10)) * 100)}%
                  </strong>
                </div>
                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block text-[10px] font-sans">بیشترین رکورد</span>
                  <strong className="text-lg text-rose-400">{maxStreak}🔥</strong>
                </div>
              </div>

              {/* Detailed Question Review List */}
              <div className="space-y-1.5 text-right mb-4">
                <span className="text-xs font-bold text-slate-400 block mb-1">ریز پاسخ‌های این دوره:</span>
                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                  {roundHistory.map((item, idx) => (
                    <div
                      key={idx}
                      className={`p-2 rounded-xl border text-xs flex items-center justify-between ${
                        item.isCorrect
                          ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-300'
                          : 'bg-rose-950/30 border-rose-800/40 text-rose-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {item.isCorrect ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                        )}
                        <span className="font-bold">{item.element.nameFa}</span>
                        <span className="text-[10px] opacity-70 font-mono">({item.element.symbol})</span>
                      </div>
                      <div className="text-[11px] font-mono">
                        {item.isCorrect ? (
                          <span className="text-emerald-400 font-bold">{item.selected}</span>
                        ) : (
                          <span>
                            <s className="text-rose-400 ml-1">{item.selected}</s>
                            <span className="text-emerald-400 font-bold">{item.correct}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Restart & Action Buttons */}
            <div className="pt-3 border-t border-slate-800 flex gap-2">
              <button
                onClick={() => resetQuiz(quizMode)}
                className="flex-1 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-purple-900/40 transition active:scale-95"
              >
                <RotateCcw className="w-4 h-4" />
                <span>شروع آزمون جدید</span>
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition"
              >
                بستن
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizModal;
