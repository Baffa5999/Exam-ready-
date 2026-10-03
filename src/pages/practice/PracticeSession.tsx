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
  
  // Check if it's a direct key match
  const directKeyIndex = optionKeys.findIndex(key => 
    normalized === key || normalized === `option_${key}`
  );
  if (directKeyIndex >= 0) return optionKeys[directKeyIndex].toUpperCase();

  // Check if it matches option text
  const options = getOptions(question);
  const textMatch = options.find(opt => 
    `${opt.text}`.trim().toLowerCase() === normalized
  );
  if (textMatch) return textMatch.key;

  return 'A'; // Fallback
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

  // Parse URL params to get selections
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

  // Load questions from Supabase
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

        // Build query conditions
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
            allQuestions.push(...data as Question[]);
          }
        }

        if (allQuestions.length === 0) {
          setError('No questions found for the selected topics.');
          setLoading(false);
          return;
        }

        // Shuffle and limit
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
    if (!answered) {
      setSelectedAnswer(optionKey);
    }
  };

  const handleSubmitAnswer = () => {
    if (!selectedAnswer || !currentQuestion) return;

    const isCorrect = selectedAnswer === correctOption;
    setSessionAnswers([
      ...sessionAnswers,
      {
        questionId: currentQuestion.id,
        selectedAnswer,
        isCorrect,
      },
    ]);
    setAnswered(true);
  };

  const handleNextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setAnswered(false);
    } else {
      // Session complete
      handleSessionComplete();
    }
  };

  const handleSessionComplete = () => {
    const correctCount = sessionAnswers.filter(a => a.isCorrect).length;
    const accuracy = Math.round((correctCount / sessionAnswers.length) * 100);

    navigatePath('/practice/results', {
      sessionAnswers,
      questions,
      correctCount,
      totalQuestions: sessionAnswers.length,
      accuracy,
    });
  };

  const handleBackClick = () => {
    if (sessionAnswers.length > 0) {
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
          className="px-6 py-3 bg-[#FF6B35] hover:bg-[#E85A25] rounded-lg font-semibold text-white transition"
        >
          Back to Subjects
        </button>
        {renderBottomNavigation()}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0F1E] text-white pb-36">
      {/* Exit Confirmation Modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur px-5">
          <div className="rounded-2xl border border-[rgba(255,255,255,0.1)] bg-[#0B1324]/95 p-6 max-w-sm w-full text-center">
            <p className="font-heading text-xl font-bold mb-2">Exit Practice?</p>
            <p className="text-[#8B9CB8] mb-6">
              You've answered {sessionAnswers.length} question{sessionAnswers.length !== 1 ? 's' : ''}. Your progress will be lost.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 px-4 py-2 rounded-lg border border-[rgba(255,255,255,0.1)] text-white hover:bg-[#111827] transition font-semibold"
              >
                Continue
              </button>
              <button
                onClick={handleConfirmExit}
                className="flex-1 px-4 py-2 rounded-lg bg-[#FF6B35] hover:bg-[#E85A25] text-white transition font-semibold"
              >
                Exit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Bar */}
      <div className="sticky top-0 z-40 border-b border-[rgba(255,255,255,0.1)] bg-[#0A0F1E]/95 backdrop-blur">
        <div className="mx-auto max-w-4xl px-5 py-4">
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={handleBackClick}
              className="inline-flex items-center gap-2 text-[#FF8A66] hover:text-[#FFB199] transition font-semibold text-sm"
              aria-label="Back"
            >
              <ChevronLeft className="h-5 w-5" />
              Exit
            </button>
            <div className="text-center">
              <p className="font-sans text-sm font-semibold text-[#8B9CB8]">
                Question {currentIndex + 1} of {questions.length}
              </p>
            </div>
            <div className="w-12" />
          </div>

          {/* Progress Bar */}
          <div className="mt-3 h-1 w-full rounded-full bg-[#111827] overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#FF6B35] to-[#2EC4B6] transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Question Card */}
      <main className="mx-auto max-w-4xl px-5 py-8">
        <section className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#0B1324]/85 p-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_18px_55px_rgba(0,0,0,0.24)]">
          {/* Question Text */}
          <h2 className="font-heading text-xl sm:text-2xl font-bold text-white leading-relaxed">
            {currentQuestion.question}
          </h2>

          {/* Answer Options */}
          <div className="mt-8 space-y-3">
            {options.map((option) => {
              const isSelected = selectedAnswer === option.key;
              const isCorrect = option.key === correctOption;
              const wasSelected = sessionAnswers.some(
                a => a.questionId === currentQuestion.id && a.selectedAnswer === option.key
              );

              let borderColor = 'border-[rgba(255,255,255,0.1)]';
              let bgColor = 'bg-[#111827]';
              let textColor = 'text-[#C8D2E4]';

              if (answered) {
                // After submitting, show correct and incorrect states
                if (isCorrect) {
                  borderColor = 'border-[#00FF87]/50';
                  bgColor = 'bg-[#00FF87]/10';
                  textColor = 'text-[#00FF87]';
                } else if (isSelected && !isCorrect) {
                  borderColor = 'border-[#FF6B35]/50';
                  bgColor = 'bg-[#FF6B35]/10';
                  textColor = 'text-[#FFB199]';
                }
              } else if (isSelected) {
                // Before submitting, highlight selected option
                borderColor = 'border-[#FF6B35]';
                bgColor = 'bg-[#FF6B35]/15';
                textColor = 'text-[#FFB199]';
              }

              return (
                <button
                  key={option.key}
                  onClick={() => handleSelectAnswer(option.key)}
                  disabled={answered}
                  className={`w-full rounded-xl border-2 ${borderColor} ${bgColor} px-6 py-4 text-left transition ${
                    answered ? 'cursor-default' : 'hover:border-[#FF6B35]/50 cursor-pointer'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`shrink-0 flex h-8 w-8 items-center justify-center rounded-lg font-sans font-bold text-sm ${
                        answered && isCorrect
                          ? 'bg-[#00FF87] text-[#0A0F1E]'
                          : answered && isSelected && !isCorrect
                            ? 'bg-[#FF6B35] text-white'
                            : 'border border-[rgba(255,255,255,0.2)] text-[#8B9CB8]'
                      }`}
                    >
                      {option.key}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`font-sans text-sm sm:text-base font-medium ${textColor} break-words`}>
                        {option.text}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Explanation (shown after answering) */}
          {answered && currentQuestion.explanation && (
            <div className="mt-6 rounded-lg border border-[rgba(255,255,255,0.08)] bg-[#111827]/50 p-4">
              <p className="font-sans text-xs font-bold uppercase text-[#8B9CB8] mb-2">Explanation</p>
              <p className="font-sans text-sm leading-6 text-[#C8D2E4]">
                {currentQuestion.explanation}
              </p>
            </div>
          )}
        </section>

        {/* Action Buttons */}
        <div className="mt-8 flex gap-3 justify-center">
          {!answered ? (
            <button
              onClick={handleSubmitAnswer}
              disabled={!selectedAnswer}
              className={`px-8 py-3 rounded-xl font-semibold text-white transition ${
                selectedAnswer
                  ? 'bg-[#FF6B35] hover:bg-[#E85A25]'
                  : 'bg-[#555] cursor-not-allowed text-[#999]'
              }`}
            >
              Submit Answer
            </button>
          ) : (
            <button
              onClick={handleNextQuestion}
              className="px-8 py-3 rounded-xl bg-[#2EC4B6] hover:bg-[#1BA89A] text-white font-semibold transition"
            >
              {currentIndex === questions.length - 1 ? 'See Results' : 'Next Question'}
            </button>
          )}
        </div>
      </main>

      {renderBottomNavigation()}
    </div>
  );
}
