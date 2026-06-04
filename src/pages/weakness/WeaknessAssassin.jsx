import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Loader2, Target } from 'lucide-react';
import { supabase } from '../../supabase';


const pageClass = 'min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top_left,rgba(255,107,53,0.10),transparent_34%),#0A0F1E] pb-36 text-white font-sans';
const mainClass = 'mx-auto max-w-5xl space-y-7 px-4 py-6 sm:px-6 md:px-10 md:py-8 animate-fade-up';
const backButtonClass = 'inline-flex min-w-0 items-center gap-2 rounded-full border border-[rgba(255,255,255,0.08)] bg-[#111827]/90 px-4 py-2.5 font-sans text-sm font-bold text-[#FF8A66] shadow-[0_10px_30px_rgba(0,0,0,0.22)] transition hover:border-[#FF6B35]/50 hover:text-[#FF6B35]';

const ProfessionalHeader = () => (
  <section className="rounded-[28px] border border-[#FF6B35]/20 bg-gradient-to-br from-[#1A1A2E] via-[#141827] to-[#111827] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.32)] sm:p-6">
    <div className="flex items-center gap-4">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-[#FF6B35]/15 text-[#FF6B35] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
        <Target className="h-7 w-7" />
      </div>
      <div className="min-w-0">
        <p className="font-sans text-[11px] font-bold uppercase tracking-[0.28em] text-[#FFB199]">Weakness Assassin</p>
        <h1 className="mt-2 break-words font-heading text-2xl font-bold leading-tight text-white sm:text-3xl">Find and fix your weakest topics</h1>
        <p className="mt-2 max-w-2xl font-sans text-sm font-normal leading-6 text-[#8B9CB8]">
          We analyze your practice history and show you what needs urgent work, what’s average, and what you’ve mastered.
        </p>
      </div>
    </div>
  </section>
);

const tabs = [
  {
    key: 'urgent',
    label: 'Needs Urgent',
    empty: 'No urgent weak areas right now.',
    countText: count => `${count} subtopic${count === 1 ? '' : 's'} need urgent work`,
    message: 'Urgent: study this',
    accentClass: 'text-red-300 border-red-500/30 bg-red-500/10'
  },
  {
    key: 'average',
    label: 'Average',
    empty: 'No average topics yet.',
    countText: count => `${count} average subtopic${count === 1 ? '' : 's'}`,
    message: 'Keep improving',
    accentClass: 'text-[#FF6B35] border-[#FF6B35]/30 bg-[#FF6B35]/10'
  },
  {
    key: 'mastered',
    label: 'Mastered',
    empty: 'No mastered topics yet.',
    countText: count => `${count} mastered subtopic${count === 1 ? '' : 's'}`,
    message: 'Great job, maintain',
    accentClass: 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10'
  }
];

const getCategoryKey = accuracy => {
  if (accuracy === null) return 'urgent';
  if (accuracy < 50) return 'urgent';
  if (accuracy <= 70) return 'average';
  return 'mastered';
};

const formatAccuracy = accuracy => (accuracy === null ? 'Not practised' : `${accuracy}%`);

const processPerformanceRows = rows => {
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

  return Array.from(subtopicMap.values()).map(item => {
    const accuracy = item.questionsAttempted > 0
      ? Math.round((item.questionsCorrect / item.questionsAttempted) * 100)
      : null;
    const failed = Math.max(item.questionsAttempted - item.questionsCorrect, 0);

    return {
      ...item,
      failed,
      accuracy,
      category: getCategoryKey(accuracy)
    };
  }).sort((a, b) => {
    if (a.accuracy === null && b.accuracy === null) return a.subtopic.localeCompare(b.subtopic);
    if (a.accuracy === null) return -1;
    if (b.accuracy === null) return 1;
    return a.accuracy - b.accuracy;
  });
};

const groupSubtopicsBySubject = subtopics => {
  const subjectMap = new Map();

  subtopics.forEach(item => {
    const subjectGroup = subjectMap.get(item.subject) || { subject: item.subject, subtopics: [] };
    subjectGroup.subtopics.push(item);
    subjectMap.set(item.subject, subjectGroup);
  });

  return Array.from(subjectMap.values()).sort((a, b) => a.subject.localeCompare(b.subject));
};

export default function WeaknessAssassin({ user, navigatePath, renderBottomNavigation }) {
  const [loading, setLoading] = useState(true);
  const [performanceRows, setPerformanceRows] = useState([]);
  const [activeTab, setActiveTab] = useState('urgent');
  const [expandedSubjects, setExpandedSubjects] = useState({});

  useEffect(() => {
    let cancelled = false;

    const loadPerformance = async () => {
      setLoading(true);

      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      const userId = authUser?.id || user?.id;

      if (authError && !userId) {
        console.info('Unable to identify current user for Weakness Assassin.', authError);
      }

      if (!userId) {
        setPerformanceRows([]);
        setExpandedSubjects({});
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('student_performance')
        .select('*')
        .eq('user_id', userId);

      if (cancelled) return;

      if (error) {
        console.info('Unable to load weakness performance; showing empty state.', error);
        setPerformanceRows([]);
        setExpandedSubjects({});
        setLoading(false);
        return;
      }

      setPerformanceRows(data || []);
      setExpandedSubjects({});
      setLoading(false);
    };

    void loadPerformance();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const processedSubtopics = useMemo(() => processPerformanceRows(performanceRows), [performanceRows]);
  const tabCounts = useMemo(() => tabs.reduce((counts, tab) => ({
    ...counts,
    [tab.key]: processedSubtopics.filter(item => item.category === tab.key).length
  }), {}), [processedSubtopics]);
  const activeTabConfig = tabs.find(tab => tab.key === activeTab) || tabs[0];
  const activeSubtopics = useMemo(
    () => processedSubtopics.filter(item => item.category === activeTab),
    [activeTab, processedSubtopics]
  );
  const activeSubjectGroups = useMemo(() => groupSubtopicsBySubject(activeSubtopics), [activeSubtopics]);

  const toggleSubject = subject => {
    const key = `${activeTab}:${subject}`;
    setExpandedSubjects(current => ({
      ...current,
      [key]: !current[key]
    }));
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

    navigatePath(`/practice/session?${params.toString()}`, navigationState);
  };

  return (
    <div className={pageClass}>
      <main className={mainClass}>
        <button
          type="button"
          onClick={() => navigatePath('/dashboard')}
          className={backButtonClass}
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Dashboard
        </button>

        <ProfessionalHeader />

        {loading && (
          <section className="mt-8 flex min-h-[260px] items-center justify-center rounded-[24px] border border-[rgba(255,255,255,0.08)] bg-[#0B1324]/85 shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_18px_55px_rgba(0,0,0,0.24)] p-8 text-center">
            <div>
              <Loader2 className="mx-auto h-9 w-9 animate-spin text-[#FF6B35]" />
              <p className="mt-4 font-sans text-sm font-normal text-[#8B9CB8]">Loading your weak areas...</p>
            </div>
          </section>
        )}

        {!loading && processedSubtopics.length === 0 && (
          <section className="mt-8 rounded-[24px] border border-[rgba(255,255,255,0.08)] bg-[#0B1324]/85 p-8 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_18px_55px_rgba(0,0,0,0.24)]">
            <BookOpen className="mx-auto h-11 w-11 text-[#FF6B35]" />
            <h2 className="mt-5 font-heading text-xl font-bold text-white">Complete your first practice session to see your weak areas</h2>
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

        {!loading && processedSubtopics.length > 0 && (
          <>
            <section className="mt-8 grid grid-cols-3 gap-2 rounded-[24px] border border-[rgba(255,255,255,0.08)] bg-[#0B1324]/85 shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_18px_55px_rgba(0,0,0,0.24)] p-2">
              {tabs.map(tab => {
                const active = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={`rounded-xl px-2 py-3 text-center font-sans text-[11px] font-bold transition sm:text-sm ${active ? 'bg-[#FF6B35] text-white shadow-[0_12px_35px_rgba(255,107,53,0.2)]' : 'text-[#8B9CB8] hover:bg-white/5 hover:text-white'}`}
                  >
                    <span className="block truncate">{tab.label}</span>
                    <span className="mt-1 block text-[10px] font-normal opacity-80 sm:text-xs">{tabCounts[tab.key] || 0}</span>
                  </button>
                );
              })}
            </section>

            {activeSubjectGroups.length === 0 ? (
              <section className="mt-6 rounded-[24px] border border-[rgba(255,255,255,0.08)] bg-[#0B1324]/85 shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_18px_55px_rgba(0,0,0,0.24)] p-6 text-center">
                <Target className="mx-auto h-9 w-9 text-[#FF6B35]" />
                <h2 className="mt-4 font-heading text-lg font-bold text-white">{activeTabConfig.empty}</h2>
                <p className="mt-2 font-sans text-sm font-normal leading-6 text-[#8B9CB8]">
                  Keep practicing to unlock more performance insights in this category.
                </p>
              </section>
            ) : (
              <section className="mt-6 space-y-4">
                {activeSubjectGroups.map(subjectGroup => {
                  const expandedKey = `${activeTab}:${subjectGroup.subject}`;
                  const expanded = Boolean(expandedSubjects[expandedKey]);
                  const ExpandIcon = expanded ? ChevronUp : ChevronDown;

                  return (
                    <article key={`${activeTab}-${subjectGroup.subject}`} className="overflow-hidden rounded-[24px] border border-[rgba(255,255,255,0.08)] bg-[#0B1324]/85 shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_18px_55px_rgba(0,0,0,0.24)]">
                      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <h2 className="break-words font-heading text-lg font-bold text-white">{subjectGroup.subject}</h2>
                          <p className="mt-1 font-sans text-[13px] font-normal text-[#8B9CB8]">
                            {activeTabConfig.countText(subjectGroup.subtopics.length)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleSubject(subjectGroup.subject)}
                          className="inline-flex items-center justify-center gap-2 rounded-full border border-[#FF6B35]/30 bg-[#FF6B35]/10 px-4 py-2 font-sans text-xs font-bold text-[#FF6B35] transition hover:bg-[#FF6B35] hover:text-white"
                        >
                          View Topics
                          <ExpandIcon className="h-4 w-4" />
                        </button>
                      </div>

                      {expanded && (
                        <div className="animate-slide-up border-t border-white/10 p-4 pt-2">
                          <div className="space-y-3">
                            {subjectGroup.subtopics.map(item => (
                              <div key={`${item.subject}-${item.subtopic}`} className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#0A0F1E]/70 p-4">
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                  <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <p className="break-words font-heading text-base font-semibold text-white">{item.subtopic}</p>
                                      <span className={`rounded-full border px-3 py-1 font-sans text-xs font-bold ${activeTabConfig.accentClass}`}>
                                        {formatAccuracy(item.accuracy)}
                                      </span>
                                    </div>
                                    <p className="mt-2 font-sans text-xs font-normal text-[#8B9CB8]">
                                      Attempted: {item.questionsAttempted} | Failed: {item.failed}
                                    </p>
                                    <p className="mt-1 font-sans text-xs font-bold text-[#FF6B35]">
                                      {activeTabConfig.message}
                                    </p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => practiceSubtopic(item)}
                                    className="inline-flex shrink-0 items-center justify-center rounded-full bg-[#FF6B35] px-4 py-2 font-sans text-xs font-bold text-white transition hover:bg-[#ff7c4d]"
                                  >
                                    {activeTab === 'mastered' ? 'Review' : 'Practice Now'}
                                  </button>
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
          </>
        )}
      </main>

      {renderBottomNavigation?.()}
    </div>
  );
}
