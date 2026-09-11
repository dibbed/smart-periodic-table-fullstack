// ==========================================================================
// Smart Periodic Table - Quiz Component
// Manages quiz game modes, scoring state, streak counter, sound effects,
// option generation, and user feedback.
// ==========================================================================

(function(root) {
  const { useState, useMemo, useRef, useEffect } = React;

  const Quiz = ({ isOpen, onClose, elements = [], isDarkMode = true, isAudioEnabled = true }) => {
    if (!isOpen || !elements.length) return null;

    const playSound = root.playSound || root.SPT?.playSound || (() => {});
    const CATEGORIES = root.CATEGORIES || root.SPT?.CATEGORIES || {};

    const [quizMode, setQuizMode] = useState('symbol'); // 'symbol' | 'atomicNumber' | 'category'
    const [quizIndex, setQuizIndex] = useState(0);
    const [quizScore, setQuizScore] = useState(0);
    const [quizStreak, setQuizStreak] = useState(0);
    const [quizFeedback, setQuizFeedback] = useState(null);
    const feedbackTimerRef = useRef(null);

    useEffect(() => {
      return () => {
        if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
      };
    }, []);

    const currentQuizElement = elements[quizIndex % elements.length];

    // Fisher-Yates shuffle to guarantee unbiased randomization of options
    const shuffleArray = (arr) => {
      const copy = [...arr];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    };

    // Generate 4 randomized options (1 correct + 3 distractors)
    const quizOptions = useMemo(() => {
      if (!currentQuizElement) return [];

      if (quizMode === 'symbol') {
        const correct = currentQuizElement.symbol;
        const choices = new Set([correct]);
        while (choices.size < 4 && choices.size < elements.length) {
          choices.add(elements[Math.floor(Math.random() * elements.length)].symbol);
        }
        return shuffleArray(Array.from(choices));
      } else if (quizMode === 'atomicNumber') {
        const correct = currentQuizElement.number.toString();
        const choices = new Set([correct]);
        while (choices.size < 4 && choices.size < elements.length) {
          choices.add(elements[Math.floor(Math.random() * elements.length)].number.toString());
        }
        return shuffleArray(Array.from(choices));
      } else {
        const correct = CATEGORIES[currentQuizElement.category]?.nameFa || 'نامشخص';
        const choices = new Set([correct]);
        const catList = Object.values(CATEGORIES).map(c => c.nameFa);
        while (choices.size < 4 && choices.size < catList.length) {
          choices.add(catList[Math.floor(Math.random() * catList.length)]);
        }
        return shuffleArray(Array.from(choices));
      }
    }, [quizIndex, quizMode, currentQuizElement, elements]);

    const handleQuizAnswer = (option) => {
      if (quizFeedback !== null) return; // Prevent double taps while feedback is active

      let isCorrect = false;
      if (quizMode === 'symbol') isCorrect = option === currentQuizElement.symbol;
      if (quizMode === 'atomicNumber') isCorrect = option === currentQuizElement.number.toString();
      if (quizMode === 'category') isCorrect = option === CATEGORIES[currentQuizElement.category]?.nameFa;

      if (isCorrect) {
        playSound('success', isAudioEnabled);
        setQuizScore(s => s + 10);
        setQuizStreak(s => s + 1);
        setQuizFeedback({ success: true, text: 'پاسخ صحیح است! +۱۰ امتیاز' });
      } else {
        playSound('wrong', isAudioEnabled);
        setQuizStreak(0);
        setQuizFeedback({ success: false, text: 'پاسخ صحیح نبود.' });
      }

      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
      feedbackTimerRef.current = setTimeout(() => {
        setQuizFeedback(null);
        setQuizIndex(i => i + 1);
      }, 1100);
    };

    return (
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div className={`w-full max-w-md rounded-2xl p-6 shadow-2xl border text-center relative ${
          isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'
        }`}>
          <button
            onClick={onClose}
            className="absolute top-4 left-4 text-slate-400 hover:text-white font-bold text-lg transition"
            title="بستن"
          >
            ✕
          </button>

          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-amber-400 font-bold">امتیاز: {quizScore}</span>
              <span className="text-purple-400">رکورد: {quizStreak}🔥</span>
            </div>
            <h3 className="font-black text-base text-purple-400">آزمون و چالش شیمی</h3>
          </div>

          <div className="flex bg-slate-800 p-1 rounded-xl mb-6 text-xs font-bold">
            <button
              onClick={() => { setQuizMode('symbol'); setQuizFeedback(null); }}
              className={`flex-1 py-1.5 rounded-lg transition ${
                quizMode === 'symbol' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              نماد شیمیایی
            </button>
            <button
              onClick={() => { setQuizMode('atomicNumber'); setQuizFeedback(null); }}
              className={`flex-1 py-1.5 rounded-lg transition ${
                quizMode === 'atomicNumber' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              عدد اتمی
            </button>
            <button
              onClick={() => { setQuizMode('category'); setQuizFeedback(null); }}
              className={`flex-1 py-1.5 rounded-lg transition ${
                quizMode === 'category' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              دسته‌بندی
            </button>
          </div>

          <div className="py-2">
            <p className="text-slate-400 text-xs mb-2">
              {quizMode === 'symbol' && 'نماد شیمیایی عنصر زیر چیست؟'}
              {quizMode === 'atomicNumber' && 'عدد اتمی عنصر زیر کدام است؟'}
              {quizMode === 'category' && 'دسته‌بندی عنصر زیر کدام است؟'}
            </p>
            <h2 className="text-3xl font-black text-cyan-400 mb-6 font-sans">
              {currentQuizElement?.nameFa || '---'}
            </h2>

            <div className="grid grid-cols-2 gap-3">
              {quizOptions.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => handleQuizAnswer(opt)}
                  className="py-3 px-2 rounded-xl font-mono text-sm font-bold border bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200 transition"
                >
                  {opt}
                </button>
              ))}
            </div>

            {quizFeedback && (
              <div className={`mt-4 p-2.5 rounded-xl font-bold text-xs ${
                quizFeedback.success
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
              }`}>
                {quizFeedback.text}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  root.Quiz = Quiz;
})(window);
