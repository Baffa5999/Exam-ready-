import React, { useMemo, useState } from 'react';
import { BookOpen, ChevronLeft, ChevronRight, CheckCircle, SlidersHorizontal } from 'lucide-react';

const questionOptions = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

const getMaxQuestions = count => {
  if (count <= 1) return 20;
  if (count === 2) return 30;
  if (count === 3) return 40;
  if (count === 4) return 50;
  if (count === 5) return 60;
  if (count === 6 || count === 7) return 70;
  if (count === 8 || count === 9) return 80;
  return 100;
};

const parseJsonArray = value => {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return [];
  }
};

const getNavigationData = () => {
  const navigationState = window.history.state || {};
  const params = new URLSearchParams(window.location.search);
  const stateSubtopics = Array.isArray(navigationState.subtopics)
    ? navigationState.subtopics
    : Array.isArray(navigationState.selectedSubtopics)
      ? navigationState.selectedSubtopics
      : [];
  const urlSubtopics = parseJsonArray(params.get('subtopics'));
  const subtopics = Array.from(new Set((stateSubtopics.length > 0 ? stateSubtopics : urlSubtopics).filter(Boolean)));
  const selections = Array.isArray(navigationState.selections)
    ? navigationState.selections
    : parseJsonArray(params.get('topics'));
  const subjects = Array.isArray(navigationState.subjects)
    ? navigationState.subjects
    : Array.from(new Set(selections.map(item => item?.subject).filter(Boolean)));

  return { navigationState, params, selections, subjects, subtopics };
};

export default function PracticeConfigure({ navigatePath, renderBottomNavigation }) {
  const { selections, subjects, subtopics } = useMemo(() => getNavigationData(), []);
  const maxQuestions = getMaxQuestions(subtopics.length);
  const defaultLimit = questionOptions.find(option => option <= maxQuestions && option >= Math.min(20, maxQuestions)) || 10;
  const [selectedLimit, setSelectedLimit] = useState(defaultLimit);

  const startSession = () => {
    if (subtopics.length === 0 || selectedLimit > maxQuestions) return;

    const nextSelections = selections.length > 0
      ? selections
      : subtopics.map(subtopic => ({ subject: subjects[0] || 'Mathematics', topic: subtopic }));
    const first = nextSelections[0] || { subject: subjects[0] || 'Mathematics', topic: subtopics[0] };
    const navigationState = {
      subjects,
      subtopics,
      selections: nextSelections,
      limit: selectedLimit
    };
    const params = new URLSearchParams({
      subject: first.subject,
      topic: first.topic,
      subtopics: JSON.stringify(subtopics),
      topics: JSON.stringify(nextSelections),
      limit: String(selectedLimit)
    });

    navigatePath(`/practice/session?${params.toString()}`, navigationState);
  };

  if (subtopics.length === 0) {
    return (
      <div className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top_left,rgba(255,107,53,0.10),transparent_34%),#0A0F1E] pb-36 text-white font-sans">
        <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 md:px-10 md:py-8">
          <button
            type="button"
            onClick={() => navigatePath('/practice/subjects')}
            className="inline-flex min-w-0 items-center gap-2 rounded-full border border-[rgba(255,255,255,0.08)] bg-[#111827]/90 px-4 py-2.5 font-sans text-sm font-bold text-[#FF8A66] shadow-[0_10px_30px_rgba(0,0,0,0.22)] transition hover:border-[#FF6B35]/50 hover:text-[#FF6B35]"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Subjects
          </button>

          <section className="mt-8 rounded-[28px] border border-[rgba(255,255,255,0.08)] bg-[#0B1324]/85 p-8 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_18px_55px_rgba(0,0,0,0.24)]">
            <BookOpen className="mx-auto h-11 w-11 text-[#FF6B35]" />
            <h1 className="mt-5 font-heading text-2xl font-bold text-white">Choose topics first</h1>
            <p className="mt-3 font-sans text-sm font-normal leading-6 text-[#8B9CB8]">
              Select at least one available subtopic before configuring your practice session.
            </p>
          </section>
        </main>
        {renderBottomNavigation?.()}
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top_left,rgba(255,107,53,0.10),transparent_34%),#0A0F1E] pb-36 text-white font-sans">
      <main className="mx-auto max-w-5xl space-y-7 px-4 py-6 sm:px-6 md:px-10 md:py-8 animate-fade-up">
        <button
          type="button"
          onClick={() => navigatePath('/practice/subjects')}
          className="inline-flex min-w-0 items-center gap-2 rounded-full border border-[rgba(255,255,255,0.08)] bg-[#111827]/90 px-4 py-2.5 font-sans text-sm font-bold text-[#FF8A66] shadow-[0_10px_30px_rgba(0,0,0,0.22)] transition hover:border-[#FF6B35]/50 hover:text-[#FF6B35]"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Subjects
        </button>

        <section className="rounded-[28px] border border-[#FF6B35]/20 bg-gradient-to-br from-[#1A1A2E] via-[#141827] to-[#111827] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.32)] sm:p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-[#FF6B35]/15 text-[#FF6B35] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
              <SlidersHorizontal className="h-7 w-7" />
            </div>
            <div className="min-w-0">
              <p className="font-sans text-[11px] font-bold uppercase tracking-[0.28em] text-[#FFB199]">Practice Setup</p>
              <h1 className="mt-2 break-words font-heading text-2xl font-bold leading-tight text-white sm:text-3xl">How many questions?</h1>
              <p className="mt-2 max-w-2xl font-sans text-sm font-normal leading-6 text-[#8B9CB8]">
                You selected {subtopics.length} subtopic{subtopics.length === 1 ? '' : 's'}. Choose up to {maxQuestions} questions for this session.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-[24px] border border-[rgba(255,255,255,0.08)] bg-[#0B1324]/85 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_18px_55px_rgba(0,0,0,0.24)] sm:p-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
            {questionOptions.map(option => {
              const disabled = option > maxQuestions;
              const active = selectedLimit === option;
              return (
                <button
                  key={option}
                  type="button"
                  disabled={disabled}
                  onClick={() => setSelectedLimit(option)}
                  className={`relative rounded-2xl border px-3 py-4 text-center transition ${disabled ? 'cursor-not-allowed border-white/5 bg-white/[0.03] text-[#566277]' : active ? 'border-[#FF6B35]/60 bg-[#FF6B35]/15 text-white shadow-[0_0_24px_rgba(255,107,53,0.14)]' : 'border-white/10 bg-[#0A0F1E]/70 text-[#8B9CB8] hover:border-[#FF6B35]/35 hover:text-white'}`}
                >
                  {active && !disabled && <CheckCircle className="absolute right-2 top-2 h-4 w-4 text-[#FF6B35]" />}
                  <span className="block font-heading text-2xl font-bold leading-none">{option}</span>
                  <span className="mt-2 block font-sans text-xs font-normal">questions</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="rounded-[24px] border border-[rgba(255,255,255,0.08)] bg-[#0B1324]/85 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_18px_55px_rgba(0,0,0,0.24)]">
          <h2 className="font-heading text-base font-bold text-white">Selected subtopics</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {subtopics.map(subtopic => (
              <span key={subtopic} className="rounded-full border border-[#FF6B35]/20 bg-[#FF6B35]/10 px-3 py-2 font-sans text-xs font-semibold text-[#FFB199]">
                {subtopic}
              </span>
            ))}
          </div>
        </section>
      </main>

      <div className="fixed inset-x-0 bottom-[82px] z-40 border-t border-white/10 bg-[#0A0F1E]/95 px-5 py-3 backdrop-blur">
        <p className="text-center font-heading text-sm font-bold text-[#FF6B35]">{selectedLimit} questions selected</p>
      </div>
      <div className="fixed inset-x-0 bottom-0 z-40 bg-[#0A0F1E] px-5 py-3">
        <button
          type="button"
          onClick={startSession}
          className="mx-auto flex w-full max-w-4xl items-center justify-center gap-2 rounded-2xl bg-[#FF6B35] px-6 py-4 font-sans text-sm font-bold text-white transition hover:bg-[#ff7c4d]"
        >
          Start Practice
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
