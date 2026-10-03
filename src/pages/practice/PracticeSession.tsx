import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../supabase';
import { ChevronLeft, Loader2, AlertCircle } from 'lucide-react';

interface Question {
  id: string;
  subject: string;
  topic: string;
  subtopic: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  explanation: string;
}

interface SessionAnswer {
  questionId: string;
  selectedAnswer: string;
  isCorrect: boolean;
}

interface PracticeSessionProps {
  navigatePath: (path: string, state?: Record<string, unknown>, options?: { replace?: boolean }) => void;
  renderBottomNavigation: () => React.ReactNode;
  user: any;
}

const getOptions = (question: Question) => [
  { key: 'A', text: question.option_a },
  { key: 'B', text: question.option_b },
  { key: 'C', text: question.option_c },
  { key: 'D', text: question.option_d },
];

const getCorrectOptionKey = (question: Question) => {
  const normalized = `${question.correct_answer || ''}`.trim().toLowerCase();
  const optionKeys = ['a', 'b', 'c', 'd'];

  const directKeyIndex = optionKeys.findIndex(key => normalized === key || normalized === `option_${key}`);
  if (directKeyIndex >= 0) return optionKeys[directKeyIndex].toUpperCase();

  const options = getOptions(question);
  const textMatch = options.find(opt => `${opt.text}`.trim().toLowerCase() === normalized);
  if (textMatch) return textMatch.key;

  return 'A';
};

export default function PracticeSession({ navigatePath, renderBottomNavigation, user }: PracticeSessionProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [sessionAnswers, setSessionAnswers] = useState<SessionAnswer[]>([]);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const getSessionParams = useCallback(() => {
    const params = new URLSearchParams(window.location.search);
    const topicsStr = params.get('topics');
    const limitStr = params.get('limit');

    let topics: Array<{ subject: string; topic: string }> = [];

    if (topicsStr) {
      try {
        topics = JSON.parse(topicsStr);
      } catch {
        topics = [];
      }
    }

    const limit = limitStr ? parseInt(limitStr, 10) : 20;
    return { topics, limit };
  }, []);

  useEffect(() => {
    const loadQuestions = async () => {
      try {
        setLoading(true);
        setError(null);

        const { topics, limit } = getSessionParams();

        if (topics.length === 0) {
          setError('No topics selected. Please go back and select topics.');
          setLoading(false);
          return;
        }

        const subqueries = await Promise.all(
          topics.map(({ subject, topic }) =>
            supabase
              .from('questions')
              .select('*')
              .eq('subject', subject)
              .eq('subtopic', topic)
              .limit(limit)
          )
        );

        const allQuestions: Question[] = [];
        for (const { data, error: queryError } of subqueries) {
          if (queryError) {
            console.error('Error loading questions:', queryError);
            continue;
          }
          if (data) {
            allQuestions.push(...(data as Question[]));
          }
        }

        if (allQuestions.length === 0) {
          setError('No questions found for the selected topics.');
          setLoading(false);
          return;
        }

        const shuffled = allQuestions.sort(() => Math.random() - 0.5).slice(0, limit);
        setQuestions(shuffled);
        setLoading(false);
      } catch (err) {
        console.error('Failed to load questions:', err);
        setError('Failed to load questions. Please try again.');
        setLoading(false);
      }
    };

    void loadQuestions();
  }, [getSessionParams]);

  const currentQuestion = questions[currentIndex];
  const options = currentQuestion ? getOptions(currentQuestion) : [];
  const correctOption = currentQuestion ? getCorrectOptionKey(currentQuestion) : '';

  const handleSelectAnswer = (optionKey: string) => {
    if (answered || !currentQuestion) return;

    const isCorrect = optionKey === correctOption;
    const currentAnswer: SessionAnswer = {
      questionId: currentQuestion.id,
      selectedAnswer: optionKey,
      isCorrect,
    };

    setSelectedAnswer(optionKey);
    setSessionAnswers(prev => [...prev, currentAnswer]);
    setAnswered(true);
  };

  const handleNextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setAnswered(false);
      return;
    }

    const correctCount = sessionAnswers.filter(a => a.isCorrect).length + (selectedAnswer === correctOption ? 1 : 0);
    const totalQuestions = questions.length;
    const accuracy = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

    navigatePath('/practice/results', {
      sessionAnswers: [...sessionAnswers, ...(selectedAnswer ? [{ questionId: currentQuestion.id, selectedAnswer, isCorrect: selectedAnswer === correctOption }] : [])],
      questions,
      correctCount,
      totalQuestions,
      accuracy,
    });
  };

  const handleBackClick = () => {
    if (sessionAnswers.length > 0 || answered) {
      setShowExitConfirm(true);
    } else {
      navigatePath('/practice/subjects');
    }
  };

  const handleConfirmExit = () => {
    navigatePath('/practice/subjects');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0F1E] text-white pb-36">
        <div className="text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-[#FF6B35] mb-4" />
          <p className="text-lg">Loading questions...</p>
        </div>
      </div>
    );
  }

  if (error || questions.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0A0F1E] text-white pb-36 px-5">
        <AlertCircle className="h-12 w-12 text-[#FF6B35] mb-4" />
        <h1 className="text-2xl font-bold text-center mb-3">Unable to Load Questions</h1>
        <p className="text-[#8B9CB8] text-center mb-6 max-w-sm">
          {error || 'No questions were found for your selection.'}
        </p>
        <button
          onClick={() => navigatePath('/practice/subjects')}
          className="px-6 py-3 bg-[#FF6B35] hover:bg-[#E85A25] rounded-xl font-semibold text-white transition"
        >
          Back to Subjects
        </button>
        {renderBottomNavigation()}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#071524] text-white pb-36">
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur px-5">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#0B1324]/95 p-6 text-center">
            <p className="mb-2 font-heading text-xl font-bold">Exit Practice?</p>
            <p className="mb-6 text-sm leading-6 text-[#8B9CB8]">
              You have answered {sessionAnswers.length} question{sessionAnswers.length !== 1 ? 's' : ''}. Your progress will be lost.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/5"
              >
                Continue
              </button>
              <button
                onClick={handleConfirmExit}
                className="flex-1 rounded-xl bg-[#FF6B35] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#E85A25]"
              >
                Exit
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="sticky top-0 z-40 border-b border-white/10 bg-[#071524]/95 backdrop-blur-xl">
        <div className="mx-auto max-w-4xl px-5 py-4">
          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={handleBackClick}
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#FF8A66] transition hover:text-[#FFB199]"
              aria-label="Exit practice"
            >
              <ChevronLeft className="h-5 w-5" />
              <span>Exit</span>
            </button>

            <p className="text-center font-heading text-2xl font-bold text-white sm:text-3xl">
              Question {currentIndex + 1} of {questions.length}
            </p>

            <div className="w-12" />
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-4xl px-5 py-8">
        <section className="rounded-[28px] border border-[rgba(255,255,255,0.08)] bg-[#0B1324]/85 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_18px_55px_rgba(0,0,0,0.24)] sm:p-6">
          {currentQuestion.question && (
            <h2 className="mb-6 text-lg font-bold leading-relaxed text-white sm:text-2xl">
              {currentQuestion.question}
            </h2>
          )}

          <div className="space-y-3">
            {options.map(option => {
              const isSelected = selectedAnswer === option.key;
              const isCorrect = option.key === correctOption;
              const showResultState = answered;

              const cardClasses = showResultState
                ? isCorrect
                  ? 'border-[#2EC4B6] bg-[#1B3A38] text-[#7CE7D6]'
                  : isSelected
                    ? 'border-[#FF6B35] bg-[#3B2A22] text-[#FFB199]'
                    : 'border-white/10 bg-[#101A2C] text-[#C8D2E4]'
                : isSelected
                  ? 'border-[#2EC4B6] bg-[#163C3C] text-[#B9F5E8]'
                  : 'border-white/10 bg-[#101A2C] text-[#C8D2E4]';

              const letterClasses = showResultState
                ? isCorrect
                  ? 'bg-[#2EC4B6] text-[#071524]'
                  : isSelected
                    ? 'bg-[#FF6B35] text-white'
                    : 'border border-white/10 bg-transparent text-[#B8C4D8]'
                : isSelected
                  ? 'bg-[#2EC4B6] text-[#071524]'
                  : 'border border-white/10 bg-transparent text-[#B8C4D8]';

              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => handleSelectAnswer(option.key)}
                  disabled={answered}
                  className={`flex w-full items-center justify-between rounded-2xl border px-4 py-4 text-left transition duration-200 ${cardClasses} ${answered ? 'cursor-default' : 'hover:border-[#2EC4B6]/60 hover:bg-[#101A2C]'}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg font-bold ${letterClasses}`}>
                      {option.key}
                    </div>
                    <span className="text-lg font-semibold sm:text-xl">{option.text}</span>
                  </div>

                  <span className="text-lg font-semibold text-[#DCE7F6] opacity-90">{option.key === 'A' ? '1/8' : option.key === 'B' ? '1/12' : option.key === 'C' ? '1/6' : '1/4'}</span>
                </button>
              );
            })}
          </div>

          {answered && currentQuestion.explanation && (
            <div className="mt-6 rounded-2xl border border-white/10 bg-[#111827]/50 p-4">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#8B9CB8]">Explanation</p>
              <p className="text-sm leading-6 text-[#C8D2E4]">{currentQuestion.explanation}</p>
            </div>
          )}
        </section>

        <div className="mt-6 flex justify-end">
          {answered ? (
            <button
              type="button"
              onClick={handleNextQuestion}
              className="rounded-xl bg-[#2EC4B6] px-6 py-3 text-sm font-bold text-[#071524] transition hover:bg-[#38D7C5]"
            >
              {currentIndex === questions.length - 1 ? 'See Results' : 'Next Question'}
            </button>
          ) : null}
        </div>
      </main>

      {renderBottomNavigation()}
    </div>
  );
}
