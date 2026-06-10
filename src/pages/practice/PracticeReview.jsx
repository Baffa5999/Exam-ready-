import React, { useState } from 'react';
import { BookOpenCheck, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';

const getOptions = question => [
  question?.option_a,
  question?.option_b,
  question?.option_c,
  question?.option_d
];

const getCorrectIndex = question => {
  const normalizedCorrect = `${question?.correct_answer || ''}`.trim().toLowerCase();
  const optionKeys = ['a', 'b', 'c', 'd'];
  const directKeyIndex = optionKeys.findIndex(key => normalizedCorrect === key || normalizedCorrect === `option_${key}`);

  if (directKeyIndex >= 0) return directKeyIndex;

  return getOptions(question).findIndex(option => `${option}`.trim().toLowerCase() === normalizedCorrect);
};

export default function PracticeReview({ failedQuestions = [], navigatePath }) {
  const [index, setIndex] = useState(0);
  const current = failedQuestions[index];
  const question = current?.question;
  const options = getOptions(question);
  const correctIndex = getCorrectIndex(question);
  const selectedAnswer = current?.selectedAnswer ?? -1;
  const selectedText = selectedAnswer >= 0 ? options[selectedAnswer] : 'No answer selected';
  const correctText = correctIndex >= 0 ? options[correctIndex] : question?.correct_answer;

  const handlePracticeAgain = () => {
    if (!question) {
      navigatePath('/practice/subjects');
      return;
    }

    navigatePath('/practice/session', {
      selections: [{ subject: question.subject, topic: question.subtopic }]
    });
  };

  if (!failedQuestions.length || !question) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0A0F1E] px-5 text-white">
        <div className="w-full max-w-md rounded-[24px] border border-white/10 bg-[#0B1324]/85 p-6 text-center shadow-[0_18px_55px_rgba(0,0,0,0.24)]">
          <BookOpenCheck className="mx-auto h-10 w-10 text-[#FF6B35]" />
          <h1 className="mt-5 font-heading text-2xl font-bold text-white">No failed questions to review.</h1>
          <p className="mt-3 font-sans text-sm leading-6 text-[#8B9CB8]">Great work — or start a practice session to build a review list.</p>
          <button
            type="button"
            onClick={() => navigatePath('/practice')}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#FF6B35] px-5 py-4 font-sans text-sm font-bold text-white transition hover:bg-[#ff7c4d]"
          >
            Back to Practice
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#0A0F1E] px-4 pb-[calc(6rem+env(safe-area-inset-bottom))] text-white md:px-10">
      <header className="sticky top-0 z-30 -mx-4 border-b border-white/10 bg-[#0A0F1E]/95 px-4 py-3 backdrop-blur md:-mx-10 md:px-10">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3">
          <button type="button" onClick={() => navigatePath('/practice')} className="rounded-full p-2 text-[#8B9CB8] hover:text-[#FF6B35]" aria-label="Back to practice">
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div className="min-w-0 text-center">
            <p className="font-heading text-base font-bold text-white">Review Failed Questions</p>
            <p className="font-sans text-xs text-[#8B9CB8]">{index + 1} of {failedQuestions.length}</p>
          </div>
          <div className="w-10" />
        </div>
      </header>

      <main className="mx-auto max-w-4xl py-4">
        <section className="rounded-[22px] border border-white/10 bg-[#0B1324]/85 p-4 shadow-[0_18px_55px_rgba(0,0,0,0.24)] md:p-6">
          <p className="font-sans text-xs font-bold uppercase tracking-[0.2em] text-[#FFB199]">{question.subject} • {question.subtopic}</p>
          <h1 className="mt-3 break-words font-sans text-base font-semibold leading-7 text-white md:text-xl">
            {question.question_text}
          </h1>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {options.map((option, optionIndex) => {
              const isWrongSelection = optionIndex === selectedAnswer;
              const isCorrectAnswer = optionIndex === correctIndex;

              return (
                <div
                  key={`${option}-${optionIndex}`}
                  className={`flex w-full flex-wrap items-start gap-2 rounded-2xl border p-3 text-left ${isCorrectAnswer ? 'border-emerald-400/60 bg-emerald-500/10 text-emerald-100' : isWrongSelection ? 'border-red-400/60 bg-red-500/10 text-red-100' : 'border-white/10 bg-[#111827] text-[#C8D2E4]'}`}
                >
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${isCorrectAnswer ? 'bg-emerald-500 text-white' : isWrongSelection ? 'bg-red-500 text-white' : 'bg-[#0A0F1E] text-[#8B9CB8]'}`}>
                    {String.fromCharCode(65 + optionIndex)}
                  </span>
                  <span className="min-w-0 flex-1 whitespace-normal break-words font-sans text-sm leading-6 md:text-base">{option}</span>
                </div>
              );
            })}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-2xl bg-red-600 p-3 text-white">
              <p className="font-heading text-sm font-bold">Your answer</p>
              <p className="mt-2 break-words font-sans text-sm leading-6">{selectedText}</p>
            </div>
            <div className="rounded-2xl bg-emerald-600 p-3 text-white">
              <p className="font-heading text-sm font-bold">Correct answer</p>
              <p className="mt-2 break-words font-sans text-sm leading-6">{correctText}</p>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-[#FF6B35]/25 bg-[#111827] p-3">
            <p className="font-heading text-sm font-bold text-[#FFB199]">Explanation</p>
            <p className="mt-2 max-h-32 overflow-y-auto whitespace-pre-wrap break-words font-sans text-sm leading-6 text-[#C8D2E4]">
              {question.explanation || 'No explanation is available for this question yet.'}
            </p>
          </div>
        </section>

        <div className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 gap-2 border-t border-white/10 bg-[#0A0F1E]/95 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur md:static md:mt-6 md:border-0 md:bg-transparent md:px-0 md:pb-0 md:pt-0">
          <button
            type="button"
            onClick={() => setIndex(prev => Math.max(prev - 1, 0))}
            disabled={index === 0}
            className="rounded-2xl border border-white/10 px-3 py-3 font-sans text-xs font-bold text-white transition hover:border-[#FF6B35]/50 hover:text-[#FF6B35] disabled:cursor-not-allowed disabled:opacity-40 sm:text-sm"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={handlePracticeAgain}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#FF6B35] px-3 py-3 font-sans text-xs font-bold text-white transition hover:bg-[#ff7c4d] sm:text-sm"
          >
            <RefreshCw className="h-4 w-4" />
            Practice Again
          </button>
          <button
            type="button"
            onClick={() => setIndex(prev => Math.min(prev + 1, failedQuestions.length - 1))}
            disabled={index + 1 >= failedQuestions.length}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 px-3 py-3 font-sans text-xs font-bold text-white transition hover:border-[#FF6B35]/50 hover:text-[#FF6B35] disabled:cursor-not-allowed disabled:opacity-40 sm:text-sm"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </main>
    </div>
  );
}
