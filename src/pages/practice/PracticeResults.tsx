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
  selectedAnswer: string;
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
  
  const directKeyIndex = optionKeys.findIndex(key => 
    normalized === key || normalized === `option_${key}`
  );
  if (directKeyIndex >= 0) return optionKeys[directKeyIndex].toUpperCase();

  const options = getOptions(question);
  const textMatch = options.find(opt => 
    `${opt.text}`.trim().toLowerCase() === normalized
  );
  if (textMatch) return textMatch.key;

  return 'A';
};

const getOptionText = (question: Question, key: string) => {
  const keyLower = key.toLowerCase();
  if (keyLower === 'a') return question.option_a;
  if (keyLower === 'b') return question.option_b;
  if (keyLower === 'c') return question.option_c;
  if (keyLower === 'd') return question.option_d;
  return '';
};

export default function PracticeResults({ navigatePath, renderBottomNavigation, user }: PracticeResultsProps) {
  const state = window.history.state || {};
  const sessionAnswers: SessionAnswer[] = state.sessionAnswers || [];
  const questions: Question[] = state.questions || [];
  const correctCount: number = state.correctCount || 0;
  const totalQuestions: number = state.totalQuestions || sessionAnswers.length;
  const accuracy: number = state.accuracy || 0;

  const [saving, setSaving] = useState(true);
  const [savingError, setSavingError] = useState<string | null>(null);
  const [showReviewMistakes, setShowReviewMistakes] = useState(false);
  const [reviewIndex, setReviewIndex] = useState(0);

  // Record results to Supabase
  useEffect(() => {
    const saveResults = async () => {
      if (!user || sessionAnswers.length === 0 || questions.length === 0) {
        setSaving(false);
        return;
      }

      try {
        // Get the subject and subtopic from the first question
        const firstQuestion = questions[0];
        const subject = firstQuestion.subject;
        const subtopic = firstQuestion.subtopic;

        // Record each question attempt
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

        // Update or create student_performance record
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

        // Award leaderboard points (10 points per correct answer)
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

  if (saving) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0F1E] text-white pb-36">
        <div className="text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-[#FF6B35] mb-4" />
          <p className="text-lg">Saving your results...</p>
        </div>
      </div>
    );
  }

  if (sessionAnswers.length === 0 || questions.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0A0F1E] text-white pb-36 px-5">
        <p className="text-2xl font-bold mb-3">No Results Found</p>
        <p className="text-[#8B9CB8] text-center mb-6">
          It looks like the session data is missing. Please start a new practice session.
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

  const failedQuestions = sessionAnswers
    .map(answer => {
      const question = questions.find(q => q.id === answer.questionId);
      return question ? { ...answer, question } : null;
    })
    .filter((item): item is { questionId: string; selectedAnswer: string; isCorrect: boolean; question: Question } => item !== null && !item.isCorrect);

  const firstQuestion = questions[0];
  const subtopicName = firstQuestion.subtopic;

  // Determine reaction based on accuracy
  const getReaction = (acc: number) => {
    if (acc >= 80) return 'Great job! 🎉';
    if (acc >= 50) return 'Good effort! 👍';
    return 'Keep practicing! 💪';
  };

  const getAccuracyColor = (acc: number) => {
    if (acc >= 80) return '#00FF87'; // Green/teal
    if (acc >= 50) return '#FFB199'; // Orange
    return '#FF8A6E'; // Darker orange
  };

  // Review Mistakes view
  if (showReviewMistakes) {
    const currentMistake = failedQuestions[reviewIndex];
    if (!currentMistake) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#0A0F1E] text-white pb-36 px-5">
          <CheckCircle className="h-12 w-12 text-[#00FF87] mb-4" />
          <p className="text-2xl font-bold mb-3 text-center">No Mistakes!</p>
          <p className="text-[#8B9CB8] text-center mb-6">You got all questions correct! 🎉</p>
          <button
            onClick={() => setShowReviewMistakes(false)}
            className="px-6 py-3 bg-[#2EC4B6] hover:bg-[#1BA89A] rounded-lg font-semibold text-white transition"
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
      <div className="min-h-screen bg-[#0A0F1E] text-white pb-36">
        {/* Top Bar */}
        <div className="sticky top-0 z-40 border-b border-[rgba(255,255,255,0.1)] bg-[#0A0F1E]/95 backdrop-blur">
          <div className="mx-auto max-w-4xl px-5 py-4">
            <div className="flex items-center justify-between gap-4">
              <button
                onClick={() => setShowReviewMistakes(false)}
                className="inline-flex items-center gap-2 text-[#FF8A66] hover:text-[#FFB199] transition font-semibold text-sm"
              >
                <ChevronLeft className="h-5 w-5" />
                Back
              </button>
              <div className="text-center">
                <p className="font-sans text-sm font-semibold text-[#8B9CB8]">
                  Mistake {reviewIndex + 1} of {failedQuestions.length}
                </p>
              </div>
              <div className="w-12" />
            </div>

            {/* Progress Bar */}
            <div className="mt-3 h-1 w-full rounded-full bg-[#111827] overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#FF6B35] to-[#2EC4B6] transition-all duration-300"
                style={{ width: `${((reviewIndex + 1) / failedQuestions.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Question Card */}
        <main className="mx-auto max-w-4xl px-5 py-8">
          <section className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#0B1324]/85 p-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_18px_55px_rgba(0,0,0,0.24)]">
            <h2 className="font-heading text-xl sm:text-2xl font-bold text-white leading-relaxed">
              {question.question}
            </h2>

            {/* Answer Options */}
            <div className="mt-8 space-y-3">
              {options.map((option) => {
                const isCorrect = option.key === correctAnswer;
                const wasSelected = option.key === selectedAnswer;

                let borderColor = 'border-[rgba(255,255,255,0.1)]';
                let bgColor = 'bg-[#111827]';
                let textColor = 'text-[#C8D2E4]';

                if (isCorrect) {
                  borderColor = 'border-[#00FF87]/50';
                  bgColor = 'bg-[#00FF87]/10';
                  textColor = 'text-[#00FF87]';
                } else if (wasSelected) {
                  borderColor = 'border-[#FF6B35]/50';
                  bgColor = 'bg-[#FF6B35]/10';
                  textColor = 'text-[#FFB199]';
                }

                return (
                  <div
                    key={option.key}
                    className={`w-full rounded-xl border-2 ${borderColor} ${bgColor} px-6 py-4 transition`}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`shrink-0 flex h-8 w-8 items-center justify-center rounded-lg font-sans font-bold text-sm ${
                          isCorrect
                            ? 'bg-[#00FF87] text-[#0A0F1E]'
                            : wasSelected
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
                        {isCorrect && (
                          <p className="mt-1 text-xs text-[#00FF87] font-semibold">✓ Correct answer</p>
                        )}
                        {wasSelected && !isCorrect && (
                          <p className="mt-1 text-xs text-[#FF6B35] font-semibold">✗ Your answer</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Explanation */}
            {question.explanation && (
              <div className="mt-6 rounded-lg border border-[rgba(255,255,255,0.08)] bg-[#111827]/50 p-4">
                <p className="font-sans text-xs font-bold uppercase text-[#8B9CB8] mb-2">Explanation</p>
                <p className="font-sans text-sm leading-6 text-[#C8D2E4]">
                  {question.explanation}
                </p>
              </div>
            )}
          </section>

          {/* Navigation */}
          <div className="mt-8 flex gap-3 justify-center">
            <button
              onClick={() => reviewIndex > 0 && setReviewIndex(reviewIndex - 1)}
              disabled={reviewIndex === 0}
              className="px-6 py-3 rounded-xl border border-[rgba(255,255,255,0.1)] hover:border-[#FF6B35]/50 text-[#FF8A66] hover:text-[#FFB199] font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => reviewIndex < failedQuestions.length - 1 && setReviewIndex(reviewIndex + 1)}
              disabled={reviewIndex === failedQuestions.length - 1}
              className="px-6 py-3 rounded-xl border border-[rgba(255,255,255,0.1)] hover:border-[#2EC4B6]/50 text-[#2EC4B6] hover:text-[#00FF87] font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </main>

        {renderBottomNavigation()}
      </div>
    );
  }

  // Main Results view
  return (
    <div className="min-h-screen bg-[#0A0F1E] text-white pb-36">
      {savingError && (
        <div className="bg-[#FF6B35]/10 border border-[#FF6B35]/30 text-[#FFB199] px-4 py-3 text-sm">
          {savingError}
        </div>
      )}

      {/* Results Card */}
      <main className="mx-auto max-w-2xl px-5 py-12">
        {/* Score Section */}
        <section className="text-center mb-10">
          <div className="relative inline-flex items-center justify-center mb-6">
            {/* Circular progress ring */}
            <svg className="w-32 h-32" viewBox="0 0 120 120">
              {/* Background circle */}
              <circle cx="60" cy="60" r="54" fill="none" stroke="#111827" strokeWidth="8" />
              {/* Progress circle */}
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
                style={{ transition: 'stroke-dasharray 1s ease' }}
              />
            </svg>
            <div className="absolute text-center">
              <p className="font-heading text-4xl font-bold text-white">
                {correctCount}/{totalQuestions}
              </p>
              <p className="font-sans text-sm font-semibold text-[#8B9CB8] mt-1">
                {accuracy}%
              </p>
            </div>
          </div>

          <p className="font-heading text-2xl font-bold text-white mb-2">
            {getReaction(accuracy)}
          </p>
          <p className="font-sans text-sm text-[#8B9CB8]">
            You practiced <span className="font-semibold text-[#FFB199]">{subtopicName}</span>
          </p>
        </section>

        {/* Breakdown Stats */}
        <section className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#0B1324]/85 p-6 mb-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_18px_55px_rgba(0,0,0,0.24)]">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-[#00FF87]" />
                <p className="font-sans text-xs uppercase font-bold text-[#8B9CB8]">Correct</p>
              </div>
              <p className="font-heading text-2xl font-bold text-[#00FF87]">
                {correctCount}
              </p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <XCircle className="h-5 w-5 text-[#FF6B35]" />
                <p className="font-sans text-xs uppercase font-bold text-[#8B9CB8]">Incorrect</p>
              </div>
              <p className="font-heading text-2xl font-bold text-[#FF6B35]">
                {totalQuestions - correctCount}
              </p>
            </div>
          </div>
        </section>

        {/* Action Buttons */}
        <div className="space-y-3">
          {failedQuestions.length > 0 && (
            <button
              onClick={() => setShowReviewMistakes(true)}
              className="w-full px-6 py-4 rounded-xl bg-[#2EC4B6] hover:bg-[#1BA89A] text-white font-semibold transition flex items-center justify-center gap-2"
            >
              <BookOpen className="h-5 w-5" />
              Review {failedQuestions.length} Mistake{failedQuestions.length !== 1 ? 's' : ''}
            </button>
          )}

          <button
            onClick={() => navigatePath('/practice/configure', {}, { replace: true })}
            className="w-full px-6 py-4 rounded-xl bg-[#FF6B35] hover:bg-[#E85A25] text-white font-semibold transition flex items-center justify-center gap-2"
          >
            <RotateCcw className="h-5 w-5" />
            Try Again
          </button>

          <button
            onClick={() => navigatePath('/practice/subjects', {}, { replace: true })}
            className="w-full px-6 py-4 rounded-xl border border-[rgba(255,255,255,0.1)] hover:border-[#FF6B35]/50 text-[#FF8A66] hover:text-[#FFB199] font-semibold transition"
          >
            Back to Subjects
          </button>
        </div>
      </main>

      {renderBottomNavigation()}
    </div>
  );
}
