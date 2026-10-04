import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../supabase';
import { ChevronLeft, ChevronRight, Loader2, AlertCircle, WifiOff, HardDriveDownload } from 'lucide-react';
import { getQuestionCache, saveQuestionCache } from '../../lib/offlineCache';

interface Question {
  id: string;
  subject: string;
  topic: string;
  subtopic: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  explanation: string;
}

interface SessionAnswer {
  questionId: string;
  selectedAnswer: string | null;
  isCorrect?: boolean;
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
  const [sessionAnswers, setSessionAnswers] = useState<Map<string, string | null>>(new Map());
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [loadedFromCache, setLoadedFromCache] = useState(false);

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

        const cacheKey = `practice:${topics
          .map(item => `${item.subject}::${item.topic}`)
          .sort()
          .join('|')}::${limit}`;

        let allQuestions: Question[] = [];
        let hadNetworkError = false;

        try {
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

          for (const { data, error: queryError } of subqueries) {
            if (queryError) {
              console.error('Error loading questions:', queryError);
              hadNetworkError = true;
              continue;
            }
            if (data) {
              allQuestions.push(...(data as Question[]));
            }
          }
        } catch (networkError) {
          console.error('Question network request failed:', networkError);
          hadNetworkError = true;
        }

        // Save a successful online result for future offline sessions.
        if (allQuestions.length > 0 && !hadNetworkError) {
          try {
            await saveQuestionCache(cacheKey, allQuestions);
          } catch (cacheError) {
            console.warn('Could not save offline question cache:', cacheError);
          }
        }

        // If Supabase is unavailable (or returned no questions), try the local cache.
        if (allQuestions.length === 0 || hadNetworkError) {
          try {
            const cached = await getQuestionCache<Question[]>(cacheKey);
            if (cached?.data?.length) {
              allQuestions = cached.data;
              setLoadedFromCache(true);
            }
          } catch (cacheError) {
            console.warn('Could not read offline question cache:', cacheError);
          }
        }

        if (allQuestions.length === 0) {
          setError('No questions found for the selected topics. Connect to the internet once to cache these questions for offline use.');
          setLoading(false);
          return;
        }

        const shuffled = allQuestions.sort(() => Math.random() - 0.5).slice(0, limit);
        setQuestions(shuffled);
        
        // Initialize sessionAnswers with all questions set to null
        const answers = new Map<string, string | null>();
        shuffled.forEach(q => answers.set(q.id, null));
        setSessionAnswers(answers);
        
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
  const selectedAnswer = currentQuestion ? sessionAnswers.get(currentQuestion.id) || null : null;

  const handleSelectAnswer = (optionKey: string) => {
    if (!currentQuestion) return;
    
    const newAnswers = new Map(sessionAnswers);
    newAnswers.set(currentQuestion.id, optionKey);
    setSessionAnswers(newAnswers);
  };

  const handlePreviousQuestion = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleSubmit = () => {
    // Preserve the exact topics/subtopics used for this session so Results -> Try Again
    // can restore the same practice configuration.
    const { topics, limit } = getSessionParams();
    const subtopics = Array.from(new Set(topics.map(item => item.topic).filter(Boolean)));

    // Calculate results
    const answers: SessionAnswer[] = questions.map(q => {
      const userAnswer = sessionAnswers.get(q.id) || null;
      const correctOption = getCorrectOptionKey(q);
      return {
        questionId: q.id,
        selectedAnswer: userAnswer,
        isCorrect: userAnswer === correctOption,
      };
    });

    const correctCount = answers.filter(a => a.isCorrect).length;
    const accuracy = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;

    navigatePath('/practice/results', {
      sessionAnswers: answers,
      questions,
      correctCount,
      totalQuestions: questions.length,
      accuracy,
      subjects: Array.from(new Set(topics.map(item => item.subject).filter(Boolean))),
      subtopics,
      selections: topics,
      limit,
    });
  };

  const handleBackClick = () => {
    if (sessionAnswers.size > 0 && Array.from(sessionAnswers.values()).some(v => v !== null)) {
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
      <div className="min-h-screen flex items-center justify-center bg-[#071524] text-white pb-36">
        <div className="text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-[#FF6B35] mb-4" />
          <p className="text-lg">Loading questions...</p>
        </div>
      </div>
    );
  }

  if (error || questions.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#071524] text-white pb-36 px-5">
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
    <div className="min-h-screen bg-[#071524] text-white pb-36 flex flex-col">
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur px-5">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#0B1324]/95 p-6 text-center">
            <p className="mb-2 font-heading text-xl font-bold">Exit Practice?</p>
            <p className="mb-6 text-sm leading-6 text-[#8B9CB8]">
              Your progress will be lost. Are you sure you want to exit?
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

      {/* Top Bar - Sticky */}
      <div className="sticky top-0 z-40 border-b border-white/10 bg-[#071524]/95 backdrop-blur-xl">
        <div className="mx-auto w-full max-w-4xl px-5 py-4">
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

            <div className="text-center">
              <p className="font-heading text-xl font-bold text-white sm:text-2xl">
                Question {currentIndex + 1} of {questions.length}
              </p>
              {loadedFromCache && (
                <p className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-[#2EC4B6]">
                  <HardDriveDownload className="h-3.5 w-3.5" />
                  Available offline
                </p>
              )}
            </div>

            <div className="w-12" />
          </div>
        </div>
      </div>

      {/* Main Content - Scrollable */}
      <main className="flex-1 mx-auto w-full max-w-4xl px-5 py-6 overflow-y-auto">
        <section className="rounded-[28px] border border-white/10 bg-[#0B1324]/85 p-4 sm:p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_18px_55px_rgba(0,0,0,0.24)]">
          {/* Question Text */}
          {currentQuestion && (
            <h2 className="mb-6 text-base font-bold leading-relaxed text-white sm:text-lg">
              {currentQuestion.question_text}
            </h2>
          )}

          {/* Answer Options */}
          <div className="space-y-2">
            {options.map(option => {
              const isSelected = selectedAnswer === option.key;

              const cardClasses = isSelected
                ? 'border-[#2EC4B6] bg-[#163C3C] text-[#B9F5E8]'
                : 'border-white/10 bg-[#101A2C] text-[#C8D2E4] hover:border-[#2EC4B6]/60';

              const letterClasses = isSelected
                ? 'bg-[#2EC4B6] text-[#071524]'
                : 'border border-white/10 bg-transparent text-[#B8C4D8]';

              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => handleSelectAnswer(option.key)}
                  className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition duration-200 ${cardClasses}`}
                >
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${letterClasses}`}>
                    {option.key}
                  </div>
                  <span className="flex-1 text-sm font-medium sm:text-base">{option.text}</span>
                </button>
              );
            })}
          </div>
        </section>
      </main>

      {/* Navigation Buttons - Fixed at bottom */}
      <div className="mx-auto w-full max-w-4xl px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handlePreviousQuestion}
            disabled={currentIndex === 0}
            className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-[#FF8A66] transition hover:border-[#FF6B35]/50 hover:text-[#FFB199] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Previous</span>
          </button>

          {currentIndex === questions.length - 1 ? (
            <button
              type="button"
              onClick={handleSubmit}
              className="rounded-xl bg-[#2EC4B6] px-6 py-2 text-sm font-bold text-[#071524] transition hover:bg-[#38D7C5]"
            >
              Submit
            </button>
          ) : (
            <button
              type="button"
              onClick={handleNextQuestion}
              className="flex items-center gap-2 rounded-xl bg-[#2EC4B6] px-4 py-2 text-sm font-semibold text-[#071524] transition hover:bg-[#38D7C5]"
            >
              <span>Next</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {renderBottomNavigation()}
    </div>
  );
}
