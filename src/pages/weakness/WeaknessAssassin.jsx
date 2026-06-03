import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Loader2, Target } from 'lucide-react';
import { supabase } from '../../supabase';

const accuracyTone = accuracy => {
  if (accuracy === null) return 'text-[#8B9CB8] border-white/10 bg-white/5';
  if (accuracy < 50) return 'text-red-300 border-red-500/30 bg-red-500/10';
  if (accuracy <= 70) return 'text-[#FF6B35] border-[#FF6B35]/30 bg-[#FF6B35]/10';
  return 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10';
};

const formatAccuracy = accuracy => (accuracy === null ? 'Not practised' : `${accuracy}%`);

const groupPerformanceBySubject = rows => {
  const subtopicMap = new Map();

  rows.forEach(row => {
    const subject = row.subject || 'General';
    const subtopic = row.subtopic || 'Practice topic';
    const key = `${subject}::${subtopic}`;
    const existing = subtopicMap.get(key) || {
      subject,
      subtopic,
      topic: row.topic || subtopic,
      questionsAttempted: 0,
      questionsCorrect: 0
    };

    existing.questionsAttempted += Number(row.questions_attempted) || 0;
    existing.questionsCorrect += Number(row.questions_correct) || 0;
    if (!existing.topic && row.topic) existing.topic = row.topic;
    subtopicMap.set(key, existing);
  });

  const subjectMap = new Map();

  Array.from(subtopicMap.values()).forEach(item => {
    const accuracy = item.questionsAttempted > 0
      ? Math.round((item.questionsCorrect / item.questionsAttempted) * 100)
      : null;
    const subtopic = { ...item, accuracy };
    const subject = subjectMap.get(item.subject) || { subject: item.subject, subtopics: [] };
    subject.subtopics.push(subtopic);
    subjectMap.set(item.subject, subject);
  });

  return Array.from(subjectMap.values()).map(subject => ({
    ...subject,
    subtopics: subject.subtopics.sort((a, b) => {
      if (a.accuracy === null && b.accuracy === null) return a.subtopic.localeCompare(b.subtopic);
      if (a.accuracy === null) return 1;
      if (b.accuracy === null) return -1;
      return a.accuracy - b.accuracy;
    })
  })).sort((a, b) => a.subject.localeCompare(b.subject));
};

export default function WeaknessAssassin({ user, navigatePath, renderBottomNavigation }) {
  const [loading, setLoading] = useState(true);
  const [performanceRows, setPerformanceRows] = useState([]);
  const [expandedSubjects, setExpandedSubjects] = useState([]);

  useEffect(() => {
    let cancelled = false;

    const loadPerformance = async () => {
      if (!user?.id) {
        setPerformanceRows([]);
        setExpandedSubjects([]);
        setLoading(false);
        return;
      }

      setLoading(true);

      const { data, error } = await supabase
        .from('student_performance')
        .select('*')
        .eq('user_id', user.id);

      if (cancelled) return;

      if (error) {
        console.info('Unable to load weakness performance; showing empty state.', error);
        setPerformanceRows([]);
        setExpandedSubjects([]);
        setLoading(false);
        return;
      }

      const rows = data || [];
      const grouped = groupPerformanceBySubject(rows);
      setPerformanceRows(rows);
      setExpandedSubjects(grouped[0]?.subject ? [grouped[0].subject] : []);
      setLoading(false);
    };

    void loadPerformance();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const groupedSubjects = useMemo(() => groupPerformanceBySubject(performanceRows), [performanceRows]);

  const toggleSubject = subject => {
    setExpandedSubjects(current => current.includes(subject)
      ? current.filter(item => item !== subject)
      : [...current, subject]
    );
  };

  const practiceSubtopic = item => {
    const navigationState = {
      subjects: [item.subject],
      subtopics: [item.subtopic],
      selections: [{ subject: item.subject, topic: item.subtopic }]
    };
    const params = new URLSearchParams({
      subject: item.subject,
      topic: item.subtopic,
      topics: JSON.stringify(navigationState.selections)
    });

    console.log('Weakness Assassin Practice Now navigation state:', navigationState);
    navigatePath(`/practice/session?${params.toString()}`, navigationState);
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#0A0F1E] pb-36 text-white font-sans">
      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 md:px-10">
        <button
          type="button"
          onClick={() => navigatePath('/dashboard')}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.08)] bg-[#111827] px-4 py-2 font-sans text-sm font-bold text-[#8B9CB8] transition hover:border-[#FF6B35]/50 hover:text-[#FF6B35]"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Dashboard
        </button>

        <header className="animate-fade-up">
          <p className="inline-flex items-center gap-2 rounded-full border border-[#FF6B35]/25 bg-[#FF6B35]/10 px-3 py-1 font-sans text-xs font-bold text-[#FF6B35]">
            <Target className="h-3.5 w-3.5" />
            Weakness Assassin
          </p>
          <h1 className="mt-4 font-heading text-2xl font-bold tracking-tight text-white sm:text-3xl">Find and fix your weakest topics</h1>
          <p className="mt-2 max-w-2xl font-sans text-sm font-normal leading-6 text-[#8B9CB8]">
            We analyse your real practice history and highlight subtopics where your accuracy needs the most work.
          </p>
        </header>

        {loading && (
          <section className="mt-8 flex min-h-[260px] items-center justify-center rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#111827] p-8 text-center">
            <div>
              <Loader2 className="mx-auto h-9 w-9 animate-spin text-[#FF6B35]" />
              <p className="mt-4 font-sans text-sm font-normal text-[#8B9CB8]">Loading your weak areas...</p>
            </div>
          </section>
        )}

        {!loading && groupedSubjects.length === 0 && (
          <section className="mt-8 rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#111827] p-8 text-center shadow-[0_20px_70px_rgba(0,0,0,0.25)]">
            <BookOpen className="mx-auto h-11 w-11 text-[#FF6B35]" />
            <h2 className="mt-5 font-heading text-xl font-bold text-white">Complete your first practice session to see weak areas</h2>
            <p className="mx-auto mt-3 max-w-sm font-sans text-sm font-normal leading-6 text-[#8B9CB8]">
              Once you answer questions, ExamReady will show the subtopics that need your attention here.
            </p>
            <button
              type="button"
              onClick={() => navigatePath('/practice')}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#FF6B35] px-5 py-4 font-sans text-sm font-bold text-white transition hover:bg-[#ff7c4d] sm:w-auto"
            >
              Start Practice
              <ChevronRight className="h-4 w-4" />
            </button>
          </section>
        )}

        {!loading && groupedSubjects.length > 0 && (
          <section className="mt-8 space-y-4">
            {groupedSubjects.map(subjectGroup => {
              const expanded = expandedSubjects.includes(subjectGroup.subject);
              const ExpandIcon = expanded ? ChevronUp : ChevronDown;

              return (
                <article key={subjectGroup.subject} className="overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#111827]">
                  <button
                    type="button"
                    onClick={() => toggleSubject(subjectGroup.subject)}
                    className="flex w-full items-center justify-between gap-4 p-5 text-left transition hover:bg-white/[0.02]"
                  >
                    <div className="min-w-0">
                      <h2 className="break-words font-heading text-lg font-bold text-white">{subjectGroup.subject}</h2>
                      <p className="mt-1 font-sans text-[13px] font-normal text-[#8B9CB8]">
                        {subjectGroup.subtopics.length} tracked subtopic{subjectGroup.subtopics.length === 1 ? '' : 's'}
                      </p>
                    </div>
                    <ExpandIcon className="h-5 w-5 shrink-0 text-[#FF6B35]" />
                  </button>

                  {expanded && (
                    <div className="animate-slide-up border-t border-white/10 p-4 pt-2">
                      <div className="space-y-3">
                        {subjectGroup.subtopics.map(item => (
                          <div key={`${item.subject}-${item.subtopic}`} className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#0A0F1E]/70 p-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                              <div className="min-w-0">
                                <p className="break-words font-heading text-base font-semibold text-white">{item.subtopic}</p>
                                <p className="mt-1 font-sans text-xs font-normal text-[#8B9CB8]">
                                  {item.questionsAttempted} question{item.questionsAttempted === 1 ? '' : 's'} attempted • {item.questionsCorrect} correct
                                </p>
                              </div>
                              <div className="flex shrink-0 items-center gap-2">
                                <span className={`rounded-full border px-3 py-1 font-sans text-xs font-bold ${accuracyTone(item.accuracy)}`}>
                                  {formatAccuracy(item.accuracy)}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => practiceSubtopic(item)}
                                  className="rounded-full bg-[#FF6B35] px-4 py-2 font-sans text-xs font-bold text-white transition hover:bg-[#ff7c4d]"
                                >
                                  Practice Now
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </section>
        )}
      </main>

      {renderBottomNavigation?.()}
    </div>
  );
}
