import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabase';
import { ChevronLeft, CheckCircle, XCircle, RotateCcw, BookOpen, Loader2 } from 'lucide-react';

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
  selectedAnswer: string | null;
  isCorrect: boolean;
}

interface PracticeResultsProps {
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

export default function PracticeResults({ navigatePath, renderBottomNavigation, user }: PracticeResultsProps) {
  const state = window.history.state || {};
  const sessionAnswers: SessionAnswer[] = state.sessionAnswers || [];
  const questions: Question[] = state.questions || [];
  const correctCount: number = state.correctCount || 0;
  const totalQuestions: number = state.totalQuestions || sessionAnswers.length;
  const accuracy: number = state.accuracy || 0;
  
  // Session configuration to pass through
  const sessionSelections: Array<{ subject: string; topic: string }> = state.selections || [];
  const sessionSubtopics: string[] = state.subtopics || [];
  const sessionLimit: number = state.limit || 20;

  const [saving, setSaving] = useState(true);
  const [savingError, setSavingError] = useState<string | null>(null);
  const [showReviewMistakes, setShowReviewMistakes] = useState(false);
  const [reviewIndex, setReviewIndex] = useState(0);

  useEffect(() => {
    const saveResults = async () => {
      if (!user || sessionAnswers.length === 0 || questions.length === 0) {
        setSaving(false);
        return;
      }

      try {
        const firstQuestion = questions[0];
        const subject = firstQuestion.subject;
        const subtopic = firstQuestion.subtopic;

        const attemptPromises = sessionAnswers.map(answer => {
          const question = questions.find(q => q.id === answer.questionId);
          if (!question) return null;

          return supabase
            .from('question_attempts')
            .insert({
              user_id: user.id,
              question_id: answer.questionId,
              subject: question.subject,
              topic: question.topic,
              subtopic: question.subtopic,
              is_correct: answer.isCorrect,
              selected_answer: answer.selectedAnswer,
            });
        });

        await Promise.all(attemptPromises.filter(Boolean));

        const { data: existingPerf } = await supabase
          .from('student_performance')
          .select('id, questions_attempted, questions_correct, accuracy_percentage')
          .eq('user_id', user.id)
          .eq('subject', subject)
          .eq('subtopic', subtopic)
          .maybeSingle();

        if (existingPerf) {
          const newAttempted = (existingPerf.questions_attempted || 0) + totalQuestions;
          const newCorrect = (existingPerf.questions_correct || 0) + correctCount;
          const newAccuracy = Math.round((newCorrect / newAttempted) * 100);

          await supabase
            .from('student_performance')
            .update({
              questions_attempted: newAttempted,
              questions_correct: newCorrect,
              accuracy_percentage: newAccuracy,
              last_practice_at: new Date().toISOString(),
            })
            .eq('id', existingPerf.id);
        } else {
          await supabase
            .from('student_performance')
            .insert({
              user_id: user.id,
              subject,
              subtopic,
              questions_attempted: totalQuestions,
              questions_correct: correctCount,
              accuracy_percentage: accuracy,
              last_practice_at: new Date().toISOString(),
            });
        }

        const points = correctCount * 10;
        const { data: existingLeaderboard } = await supabase
          .from('leaderboard')
          .select('id, points')
          .eq('user_id', user.id)
          .maybeSingle();

        if (existingLeaderboard) {
          await supabase
            .from('leaderboard')
            .update({ points: (existingLeaderboard.points || 0) + points })
            .eq('id', existingLeaderboard.id);
        } else {
          await supabase
            .from('leaderboard')
            .insert({
              user_id: user.id,
              username: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
              points,
            });
        }

        setSaving(false);
      } catch (error) {
        console.error('Failed to save results:', error);
        setSavingError('Results saved locally but couldn\'t sync to server. No worries!');
        setSaving(false);
      }
    };

    void saveResults();
  }, [user, sessionAnswers, questions, correctCount, totalQuestions, accuracy]);

  const handleTryAgain = () => {
    // Re-trigger the configure screen with the same selections
    const navigationState = {
      subjects: Array.from(new Set(sessionSelections.map(s => s.subject))),
      subtopics: sessionSubtopics,
      selections: sessionSelections,
      limit: sessionLimit,
    };

    const params = new URLSearchParams({
      subtopics: JSON.stringify(sessionSubtopics),
      topics: JSON.stringify(sessionSelections),
    });

    // Navigate to configure with the same selections
    navigatePath(`/practice/configure?${params.toString()}`, navigationState, { replace: true });
  };

  if (saving) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#071524] text-white pb-36">
        <div className="text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-[#FF6B35] mb-4" />
          <p className="text-lg">Saving your results...</p>
        </div>
      </div>
    );
  }

  if (sessionAnswers.length === 0 || questions.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#071524] text-white pb-36 px-5">
        <p className="mb-3 text-2xl font-bold">No Results Found</p>
        <p className="mb-6 max-w-sm text-center text-[#8B9CB8]">
          It looks like the session data is missing. Please start a new practice session.
        </p>
        <button
          onClick={() => navigatePath('/practice/subjects')}
          className="rounded-xl bg-[#FF6B35] px-6 py-3 font-semibold text-white transition hover:bg-[#E85A25]"
        >
          Back to Subjects
        </button>
        {renderBottomNavigation()}
      </div>
    );
  }

  const failedQuestions = sessionAnswers
    .map(answer => {
      const question = questions.find(q => q.id === answer.questionId);
      return question ? { ...answer, question } : null;
    })
    .filter((item): item is { questionId: string; selectedAnswer: string | null; isCorrect: boolean; question: Question } => item !== null && !item.isCorrect);

  const firstQuestion = questions[0];
  const subtopicName = firstQuestion.subtopic;

  const getReaction = (acc: number) => {
    if (acc >= 80) return 'Great job!';
    if (acc >= 50) return 'Good effort!';
    return 'Keep practicing!';
  };

  const getAccuracyColor = (acc: number) => {
    if (acc >= 80) return '#2EC4B6';
    if (acc >= 50) return '#FFB199';
    return '#FF8A66';
  };

  if (showReviewMistakes) {
    const currentMistake = failedQuestions[reviewIndex];
    if (!currentMistake) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#071524] text-white pb-36 px-5">
          <CheckCircle className="mb-4 h-12 w-12 text-[#2EC4B6]" />
          <p className="mb-3 text-2xl font-bold text-center">No Mistakes!</p>
          <p className="mb-6 text-center text-[#8B9CB8]">You got all questions correct! 🎉</p>
          <button
            onClick={() => setShowReviewMistakes(false)}
            className="rounded-xl bg-[#2EC4B6] px-6 py-3 font-semibold text-[#071524] transition hover:bg-[#38D7C5]"
          >
            Back to Results
          </button>
          {renderBottomNavigation()}
        </div>
      );
    }

    const question = currentMistake.question;
    const selectedAnswer = currentMistake.selectedAnswer;
    const correctAnswer = getCorrectOptionKey(question);
    const options = getOptions(question);

    return (
      <div className="min-h-screen bg-[#071524] text-white pb-36">
        <div className="sticky top-0 z-40 border-b border-white/10 bg-[#071524]/95 backdrop-blur-xl">
          <div className="mx-auto max-w-4xl px-5 py-4">
            <div className="flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => setShowReviewMistakes(false)}
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#FF8A66] hover:text-[#FFB199]"
              >
                <ChevronLeft className="h-5 w-5" />
                Back
              </button>

              <p className="text-center font-heading text-xl font-bold text-white">
                Mistake {reviewIndex + 1} of {failedQuestions.length}
              </p>

              <div className="w-12" />
            </div>
          </div>
        </div>

        <main className="mx-auto max-w-4xl px-5 py-8">
          <section className="rounded-[28px] border border-white/10 bg-[#0B1324]/85 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_18px_55px_rgba(0,0,0,0.24)] sm:p-6">
            <h2 className="mb-6 text-lg font-bold leading-relaxed text-white sm:text-2xl">{question.question}</h2>

            <div className="space-y-3">
              {options.map(option => {
                const isCorrect = option.key === correctAnswer;
                const wasSelected = option.key === selectedAnswer;

                let classes = 'border-white/10 bg-[#101A2C] text-[#C8D2E4]';
                if (isCorrect) classes = 'border-[#2EC4B6] bg-[#163C3C] text-[#B9F5E8]';
                else if (wasSelected) classes = 'border-[#FF6B35] bg-[#3B2A22] text-[#FFB199]';

                let letterClasses = 'border border-white/10 bg-transparent text-[#B8C4D8]';
                if (isCorrect) letterClasses = 'bg-[#2EC4B6] text-[#071524]';
                else if (wasSelected) letterClasses = 'bg-[#FF6B35] text-white';

                return (
                  <div key={option.key} className={`flex w-full items-center justify-between rounded-2xl border px-4 py-4 ${classes}`}>
                    <div className="flex items-center gap-4">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg font-bold ${letterClasses}`}>
                        {option.key}
                      </div>
                      <span className="text-lg font-semibold sm:text-xl">{option.text}</span>
                    </div>

                    {isCorrect && <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#2EC4B6]">Correct</span>}
                    {wasSelected && !isCorrect && <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#FF6B35]">Your answer</span>}
                  </div>
                );
              })}
            </div>

            {question.explanation && (
              <div className="mt-6 rounded-2xl border border-white/10 bg-[#111827]/50 p-4">
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#8B9CB8]">Explanation</p>
                <p className="text-sm leading-6 text-[#C8D2E4]">{question.explanation}</p>
              </div>
            )}
          </section>

          <div className="mt-8 flex justify-center gap-3">
            <button
              type="button"
              onClick={() => reviewIndex > 0 && setReviewIndex(reviewIndex - 1)}
              disabled={reviewIndex === 0}
              className="rounded-xl border border-white/10 px-6 py-3 text-sm font-semibold text-[#FF8A66] transition hover:border-[#FF6B35]/50 hover:text-[#FFB199] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => reviewIndex < failedQuestions.length - 1 && setReviewIndex(reviewIndex + 1)}
              disabled={reviewIndex === failedQuestions.length - 1}
              className="rounded-xl border border-white/10 px-6 py-3 text-sm font-semibold text-[#2EC4B6] transition hover:border-[#2EC4B6]/50 hover:text-[#7CE7D6] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </main>

        {renderBottomNavigation()}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#071524] text-white pb-36">
      {savingError && (
        <div className="border border-[#FF6B35]/30 bg-[#FF6B35]/10 px-4 py-3 text-sm text-[#FFB199]">
          {savingError}
        </div>
      )}

      <main className="mx-auto max-w-2xl px-5 py-10 sm:py-12">
        <section className="mb-8 text-center">
          <div className="relative inline-flex items-center justify-center">
            <svg className="h-32 w-32" viewBox="0 0 120 120" aria-label="Accuracy ring">
              <circle cx="60" cy="60" r="54" fill="none" stroke="#101A2C" strokeWidth="8" />
              <circle
                cx="60"
                cy="60"
                r="54"
                fill="none"
                stroke={getAccuracyColor(accuracy)}
                strokeWidth="8"
                strokeDasharray={`${(accuracy / 100) * 339.29} 339.29`}
                strokeLinecap="round"
                transform="rotate(-90 60 60)"
              />
            </svg>
            <div className="absolute text-center">
              <p className="font-heading text-4xl font-bold text-white">{correctCount}/{totalQuestions}</p>
              <p className="mt-1 text-sm font-semibold text-[#8B9CB8]">{accuracy}%</p>
            </div>
          </div>

          <p className="mt-5 font-heading text-3xl font-bold text-white">{getReaction(accuracy)}</p>
          <p className="mt-2 text-sm text-[#8B9CB8]">
            You practiced <span className="font-semibold text-[#FFB199]">{subtopicName}</span>
          </p>
        </section>

        <section className="mb-8 rounded-[28px] border border-white/10 bg-[#0B1324]/85 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_18px_55px_rgba(0,0,0,0.24)]">
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-white/10 bg-[#101A2C] p-4 text-center">
              <div className="mb-2 flex items-center justify-center gap-2">
                <CheckCircle className="h-5 w-5 text-[#2EC4B6]" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8B9CB8]">Correct</span>
              </div>
              <p className="font-heading text-3xl font-bold text-[#2EC4B6]">{correctCount}</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#101A2C] p-4 text-center">
              <div className="mb-2 flex items-center justify-center gap-2">
                <XCircle className="h-5 w-5 text-[#FF6B35]" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8B9CB8]">Incorrect</span>
              </div>
              <p className="font-heading text-3xl font-bold text-[#FF6B35]">{totalQuestions - correctCount}</p>
            </div>
          </div>
        </section>

        <div className="space-y-3">
          {failedQuestions.length > 0 && (
            <button
              type="button"
              onClick={() => setShowReviewMistakes(true)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#2EC4B6] px-6 py-4 text-sm font-bold text-[#071524] transition hover:bg-[#38D7C5]"
            >
              <BookOpen className="h-5 w-5" />
              Review {failedQuestions.length} Mistake{failedQuestions.length !== 1 ? 's' : ''}
            </button>
          )}

          <button
            type="button"
            onClick={handleTryAgain}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#FF6B35] px-6 py-4 text-sm font-bold text-white transition hover:bg-[#E85A25]"
          >
            <RotateCcw className="h-5 w-5" />
            Try Again
          </button>

          <button
            type="button"
            onClick={() => navigatePath('/practice/subjects', {}, { replace: true })}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#101A2C] px-6 py-4 text-sm font-bold text-[#FF8A66] transition hover:border-[#FF6B35]/50 hover:text-[#FFB199]"
          >
            Back to Subjects
          </button>
        </div>
      </main>

      {renderBottomNavigation()}
    </div>
  );
}
