import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabase';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Crosshair,
  FileText,
  Loader2,
} from 'lucide-react';

interface Subject {
  name: string;
  accent: string;
  gradient: string;
}

interface PracticeTopicAvailability {
  topic: string;
  subtopic: string;
}

interface PracticeFlowProps {
  route: string;
  navigatePath: (path: string, state?: Record<string, unknown>, options?: { replace?: boolean }) => void;
  renderBottomNavigation: () => React.ReactNode;
}

const subjectLibrary: Subject[] = [
  { name: 'Mathematics', accent: '#00BBF9', gradient: 'from-[#00BBF9] to-[#006DFF]' },
  { name: 'English Language', accent: '#2EC4B6', gradient: 'from-[#2EC4B6] to-[#118A7E]' },
  { name: 'Biology', accent: '#00FF87', gradient: 'from-[#00FF87] to-[#0B8F52]' },
  { name: 'Chemistry', accent: '#9B5DE5', gradient: 'from-[#9B5DE5] to-[#5D2E91]' },
  { name: 'Physics', accent: '#FF6B35', gradient: 'from-[#FF6B35] to-[#F7931E]' },
  { name: 'Literature', accent: '#F15BB5', gradient: 'from-[#F15BB5] to-[#B5179E]' },
];

const subtopicsBySubject: Record<string, string[]> = {
  Mathematics: ['Number and Numeration', 'Algebra', 'Geometry and Trigonometry', 'Statistics and Probability', 'Calculus'],
  Biology: ['Cell Biology', 'Genetics and Evolution', 'Ecology', 'Human Biology and Health', 'Plant Biology'],
  Chemistry: ['Physical Chemistry', 'Organic Chemistry', 'Inorganic Chemistry', 'Electrochemistry', 'Environmental Chemistry'],
  Physics: ['Mechanics', 'Waves and Optics', 'Electricity and Magnetism', 'Modern Physics', 'Thermodynamics'],
  'English Language': ['Comprehension', 'Lexis and Structure', 'Oral English', 'Essay and Letter Writing', 'Figures of Speech'],
  Literature: ['Poetry', 'Prose', 'Drama', 'Literary Devices', 'African Literature'],
};

const fallbackPracticeSubtopicsByTopic: Record<string, Record<string, string[]>> = {
  Mathematics: {
    'Number and Numeration': ['Number Bases', 'Fractions Decimals and Percentages'],
    Algebra: [],
    'Geometry and Trigonometry': [],
    'Statistics and Probability': [],
    Calculus: [],
  },
};

const pageClass = 'min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top_left,rgba(255,107,53,0.10),transparent_34%),#0A0F1E] pb-36 text-white font-sans';
const mainClass = 'mx-auto max-w-5xl space-y-7 px-4 py-6 sm:px-6 md:px-10 md:py-8 animate-fade-up';
const backButtonClass = 'inline-flex min-w-0 items-center gap-2 rounded-full border border-[rgba(255,255,255,0.08)] bg-[#111827]/90 px-4 py-2.5 font-sans text-sm font-bold text-[#FF8A66] shadow-[0_10px_30px_rgba(0,0,0,0.22)] transition hover:border-[#FF6B35]/50 hover:text-[#FF6B35]';

function ProfessionalHeader({ title, description, icon: Icon, accent = '#FF6B35' }: { title: string; description: string; icon: React.ElementType; accent?: string }) {
  return (
    <section className="rounded-[28px] border border-[#FF6B35]/20 bg-gradient-to-br from-[#1A1A2E] via-[#141827] to-[#111827] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.32)] sm:p-6">
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]" style={{ backgroundColor: `${accent}1F`, color: accent }}>
          <Icon className="h-7 w-7" />
        </div>
        <div className="min-w-0">
          <p className="font-sans text-[11px] font-bold uppercase tracking-[0.28em] text-[#FFB199]">ExamReady</p>
          <h1 className="mt-2 break-words font-heading text-2xl font-bold leading-tight text-white sm:text-3xl">{title}</h1>
          <p className="mt-2 max-w-2xl font-sans text-sm font-normal leading-6 text-[#8B9CB8]">{description}</p>
        </div>
      </div>
    </section>
  );
}

export default function PracticeFlow({ route, navigatePath, renderBottomNavigation }: PracticeFlowProps) {
  const [expandedSubjects, setExpandedSubjects] = useState<string[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<Record<string, string[]>>({});
  const [expandedTopics, setExpandedTopics] = useState<Record<string, string[]>>({});
  const [availableSubtopics, setAvailableSubtopics] = useState<Record<string, PracticeTopicAvailability[]>>({});
  const [loadingAvailability, setLoadingAvailability] = useState(false);

  const isSubjectsPage = route === '/practice/subjects';

  useEffect(() => {
    if (!isSubjectsPage) return;

    let cancelled = false;

    const loadAvailableSubtopics = async () => {
      setLoadingAvailability(true);

      const subjects = subjectLibrary.filter(s => s.name !== 'Literature');
      const nextAvailability: Record<string, PracticeTopicAvailability[]> = {};

      await Promise.all(subjects.map(async subject => {
        const { data, error } = await supabase
          .from('questions')
          .select('topic, subtopic')
          .eq('subject', subject.name);

        if (error) {
          nextAvailability[subject.name] = [];
          return;
        }

        const uniqueRows = new Map<string, PracticeTopicAvailability>();
        (data || []).forEach(row => {
          const topic = `${row.topic || ''}`.trim();
          const subtopic = `${row.subtopic || ''}`.trim();
          if (!topic || !subtopic) return;
          uniqueRows.set(`${topic}::${subtopic}`, { topic, subtopic });
        });

        nextAvailability[subject.name] = Array.from(uniqueRows.values());
      }));

      if (!cancelled) {
        setAvailableSubtopics(nextAvailability);
        setLoadingAvailability(false);
      }
    };

    void loadAvailableSubtopics();

    return () => { cancelled = true; };
  }, [isSubjectsPage]);

  const getTopicsForSubject = (subject: string) => {
    const staticTopics = subtopicsBySubject[subject] || [];
    const dynamicTopics = (availableSubtopics[subject] || []).map(row => row.topic).filter(Boolean);
    return Array.from(new Set([...staticTopics, ...dynamicTopics]));
  };

  const getAvailableSubtopicRows = (subject: string, topic: string) => {
    const rows = availableSubtopics[subject] || [];
    const fallbackSubtopics = fallbackPracticeSubtopicsByTopic[subject]?.[topic] || [];
    const availableSubtopicsList = rows.filter(row => row.topic === topic).map(row => row.subtopic).filter(Boolean);
    const merged = Array.from(new Set([...fallbackSubtopics, ...availableSubtopicsList]));
    return merged.map(subtopic => ({
      name: subtopic,
      available: availableSubtopicsList.includes(subtopic),
    }));
  };

  const getSelectableSubtopics = (subject: string, topic: string) =>
    getAvailableSubtopicRows(subject, topic).filter(s => s.available).map(s => s.name);

  const toggleExpandedSubject = (subject: string) => {
    setExpandedSubjects(prev => prev.includes(subject) ? prev.filter(s => s !== subject) : [...prev, subject]);
  };

  const toggleExpandedTopic = (subject: string, topic: string) => {
    setExpandedTopics(prev => {
      const current = prev[subject] || [];
      const next = current.includes(topic) ? current.filter(t => t !== topic) : [...current, topic];
      return { ...prev, [subject]: next };
    });
  };

  const toggleSubtopic = (subject: string, subtopic: string) => {
    setSelectedTopics(prev => {
      const current = prev[subject] || [];
      const next = current.includes(subtopic) ? current.filter(t => t !== subtopic) : [...current, subtopic];
      return { ...prev, [subject]: next };
    });
  };

  const toggleAllSubtopics = (subject: string, topic: string) => {
    const selectable = getSelectableSubtopics(subject, topic);
    if (selectable.length === 0) return;

    setSelectedTopics(prev => {
      const current = prev[subject] || [];
      const allSelected = selectable.every(s => current.includes(s));
      const next = allSelected ? current.filter(s => !selectable.includes(s)) : Array.from(new Set([...current, ...selectable]));
      return { ...prev, [subject]: next };
    });
  };

  const selectedCount = Object.values(selectedTopics).reduce((sum, topics) => sum + topics.length, 0);

  const startSelectedPractice = () => {
    const selectedEntries = Object.entries(selectedTopics).flatMap(([subject, topics]) =>
      topics.map(topic => ({ subject, topic }))
    );
    if (selectedEntries.length === 0) return;

    const selectedSubjects = Array.from(new Set(selectedEntries.map(e => e.subject)));
    const selectedSubtopics = selectedEntries.map(e => e.topic);
    const first = selectedEntries[0];
    const navigationState = {
      subjects: selectedSubjects,
      subtopics: selectedSubtopics,
      selections: selectedEntries,
    };

    const params = new URLSearchParams({
      subject: first.subject,
      topic: first.topic,
      subtopics: JSON.stringify(selectedSubtopics),
      topics: JSON.stringify(selectedEntries),
    });
    navigatePath(`/practice/configure?${params.toString()}`, navigationState);
  };

  // ── Practice Landing Page ──
  if (route === '/practice') {
    return (
      <div className={pageClass}>
        <main className={mainClass}>
          <ProfessionalHeader title="Practice" description="How would you like to practice today?" icon={Crosshair} accent="#FF6B35" />

          <section className="space-y-4">
            <button
              type="button"
              onClick={() => navigatePath('/practice/subjects')}
              className="group w-full rounded-[24px] border border-[rgba(255,255,255,0.08)] bg-[#0B1324]/85 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_18px_55px_rgba(0,0,0,0.24)] text-left transition hover:-translate-y-0.5 hover:border-[#FF6B35]/40"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#FF6B35]/15 text-[#FF6B35]">
                  <BookOpen className="h-[22px] w-[22px]" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-heading text-base font-semibold text-white">Subject Practice</h2>
                  <p className="mt-1 overflow-hidden font-sans text-[13px] font-normal leading-5 text-[#8B9CB8]" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    Choose a subject and topic to practice at your own pace. Perfect for targeting specific areas.
                  </p>
                </div>
              </div>
              <div className="mt-5 flex justify-end">
                <span className="inline-flex items-center gap-1 rounded-full bg-[#FF6B35]/10 px-3 py-2 font-sans text-xs font-semibold text-[#FF6B35] transition group-hover:bg-[#FF6B35] group-hover:text-white">
                  Start Mode
                  <ChevronRight className="h-4 w-4" />
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => navigatePath('/practice/exam-type')}
              className="group w-full rounded-[24px] border border-[rgba(255,255,255,0.08)] bg-[#0B1324]/85 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_18px_55px_rgba(0,0,0,0.24)] text-left transition hover:-translate-y-0.5 hover:border-[#FF6B35]/40"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#2EC4B6]/15 text-[#2EC4B6]">
                  <FileText className="h-[22px] w-[22px]" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-heading text-base font-semibold text-white">Mock Exam</h2>
                  <p className="mt-1 overflow-hidden font-sans text-[13px] font-normal leading-5 text-[#8B9CB8]" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    Simulate JAMB, WAEC, or NECO with full exam conditions. All your selected subjects in one session.
                  </p>
                </div>
              </div>
              <div className="mt-5 flex justify-end">
                <span className="inline-flex items-center gap-1 rounded-full bg-[#2EC4B6]/10 px-3 py-2 font-sans text-xs font-semibold text-[#2EC4B6] transition group-hover:bg-[#2EC4B6] group-hover:text-white">
                  Start Exam
                  <ChevronRight className="h-4 w-4" />
                </span>
              </div>
            </button>
          </section>
        </main>
        {renderBottomNavigation()}
      </div>
    );
  }

  // ── Practice Exam Type Page ──
  if (route === '/practice/exam-type') {
    const exams = [
      { key: 'jamb', title: 'JAMB', subtitle: 'Joint Admissions and Matriculation Board', description: '180 questions. 2 hours. All your selected subjects.', accent: '#FF6B35', tint: 'bg-[#FF6B35]/15 text-[#FF6B35]' },
      { key: 'waec', title: 'WAEC', subtitle: 'West African Examinations Council', description: 'Structured paper format. All your selected subjects.', accent: '#2EC4B6', tint: 'bg-[#2EC4B6]/15 text-[#2EC4B6]' },
      { key: 'neco', title: 'NECO', subtitle: 'National Examinations Council', description: 'Full paper simulation. All your selected subjects.', accent: '#00FF87', tint: 'bg-[#00FF87]/15 text-[#00FF87]' },
    ];

    return (
      <div className={pageClass}>
        <main className={mainClass}>
          <button type="button" onClick={() => navigatePath('/practice')} className={backButtonClass}>
            <ChevronLeft className="h-5 w-5" /> Back
          </button>
          <ProfessionalHeader title="Select Exam Type" description="Choose which exam you want to simulate today." icon={FileText} accent="#9B5DE5" />

          <section className="mt-6 space-y-3">
            {exams.map(exam => (
              <button
                key={exam.key}
                type="button"
                onClick={() => navigatePath(`/mock-exam/${exam.key}`)}
                className="group flex w-full items-center gap-4 rounded-2xl border border-[rgba(255,255,255,0.08)] border-l-4 bg-[#111827] p-4 text-left transition hover:border-white/15 sm:p-5"
                style={{ borderLeftColor: exam.accent }}
              >
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl p-3 ${exam.tint}`}>
                  <FileText className="h-[22px] w-[22px]" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-heading text-base font-semibold text-white">{exam.title}</h2>
                  <p className="mt-1 font-sans text-[13px] font-normal text-[#C8D2E4]">{exam.subtitle}</p>
                  <p className="mt-1 font-sans text-[13px] font-normal leading-5 text-[#8B9CB8]">{exam.description}</p>
                </div>
                <ChevronRight className="h-6 w-6 shrink-0 transition group-hover:translate-x-1" style={{ color: exam.accent }} />
              </button>
            ))}
          </section>

          <p className="mt-6 rounded-[22px] border border-[rgba(255,255,255,0.08)] bg-[#0B1324]/85 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] text-sm leading-6 text-[#8B9CB8]">
            Your exam simulation will only include subjects you selected during onboarding.
          </p>
        </main>
        {renderBottomNavigation()}
      </div>
    );
  }

  // ── Practice Subject Selection Page ──
  if (isSubjectsPage) {
    const practiceSubjects = subjectLibrary.filter(s => s.name !== 'Literature');

    return (
      <div className={pageClass}>
        <main className={mainClass}>
          <button type="button" onClick={() => navigatePath('/practice')} className={backButtonClass}>
            <ChevronLeft className="h-5 w-5" /> Back
          </button>
          <ProfessionalHeader title="Select Subject" description="Choose a subject, then select available subtopics." icon={BookOpen} accent="#00BBF9" />
          {loadingAvailability && (
            <p className="mt-2 inline-flex items-center gap-2 font-sans text-xs font-normal text-[#8B9CB8]">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-[#FF6B35]" />
              Checking available questions...
            </p>
          )}

          <section className="mt-6 space-y-3">
            {practiceSubjects.map(subject => {
              const topics = getTopicsForSubject(subject.name);
              const expanded = expandedSubjects.includes(subject.name);
              const expandedTopicList = expandedTopics[subject.name] || [];
              const ExpandIcon = expanded ? ChevronUp : ChevronDown;

              return (
                <div key={subject.name} className="overflow-hidden rounded-[22px] border border-[rgba(255,255,255,0.08)] bg-[#0B1324]/85" style={{ borderLeftColor: subject.accent, borderLeftWidth: 4 }}>
                  <button type="button" onClick={() => toggleExpandedSubject(subject.name)} className="flex w-full items-center justify-between gap-4 p-4 text-left">
                    <div className="min-w-0">
                      <h2 className="break-words font-heading text-base font-semibold leading-5 text-white sm:text-lg">{subject.name}</h2>
                      <p className="mt-1 font-sans text-[13px] font-normal text-[#8B9CB8]">tap to see topics</p>
                    </div>
                    <ExpandIcon className="h-5 w-5 shrink-0 text-[#8B9CB8]" />
                  </button>

                  {expanded && (
                    <div className="space-y-2 px-4 pb-4">
                      {topics.map(topic => {
                        const subtopicRows = getAvailableSubtopicRows(subject.name, topic);
                        const selectableSubtopics = subtopicRows.filter(s => s.available).map(s => s.name);
                        const topicExpanded = expandedTopicList.includes(topic);
                        const selectedForTopic = (selectedTopics[subject.name] || []).filter(s => selectableSubtopics.includes(s));
                        const allSelected = selectableSubtopics.length > 0 && selectableSubtopics.every(s => selectedForTopic.includes(s));
                        const TopicExpandIcon = topicExpanded ? ChevronUp : ChevronDown;

                        return (
                          <div key={topic} className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[#0A0F1E]/60">
                            <div className="flex items-center justify-between gap-2 p-3">
                              <button type="button" onClick={() => toggleExpandedTopic(subject.name, topic)} className="flex min-w-0 items-center gap-2 text-left">
                                <TopicExpandIcon className="h-4 w-4 shrink-0 text-[#8B9CB8]" />
                                <span className="break-words font-sans text-sm font-semibold text-white">{topic}</span>
                                {selectableSubtopics.length > 0 && (
                                  <span className="shrink-0 rounded-full bg-white/5 px-2 py-0.5 font-sans text-[10px] font-normal text-[#8B9CB8]">
                                    {selectableSubtopics.length} subtopic{selectableSubtopics.length === 1 ? '' : 's'}
                                  </span>
                                )}
                              </button>
                              {selectableSubtopics.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => toggleAllSubtopics(subject.name, topic)}
                                  className="shrink-0 rounded-full border border-[rgba(255,255,255,0.1)] px-3 py-1 font-sans text-[11px] font-semibold text-[#FF8A66] transition hover:border-[#FF6B35]/50 hover:text-[#FF6B35]"
                                >
                                  {allSelected ? 'Clear' : 'Select All'}
                                </button>
                              )}
                            </div>

                            {topicExpanded && (
                              <div className="flex flex-wrap gap-2 px-3 pb-3">
                                {subtopicRows.length === 0 && (
                                  <p className="font-sans text-xs text-[#8B9CB8]">No subtopics available yet.</p>
                                )}
                                {subtopicRows.map(subtopic => {
                                  const selected = (selectedTopics[subject.name] || []).includes(subtopic.name);
                                  return (
                                    <button
                                      key={subtopic.name}
                                      type="button"
                                      disabled={!subtopic.available}
                                      onClick={() => subtopic.available && toggleSubtopic(subject.name, subtopic.name)}
                                      className={`rounded-full border px-3 py-1.5 font-sans text-xs font-medium transition ${
                                        selected
                                          ? 'border-[#FF6B35] bg-[#FF6B35] text-white'
                                          : subtopic.available
                                            ? 'border-[rgba(255,255,255,0.1)] bg-[#111827] text-[#C8D2E4] hover:border-[#FF6B35]/50'
                                            : 'border-[rgba(255,255,255,0.05)] bg-[#0A0F1E] text-[#555] cursor-not-allowed'
                                      }`}
                                    >
                                      {subtopic.name}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </section>
        </main>

        <div className="fixed inset-x-0 bottom-0 z-40 bg-[#0A0F1E] px-5 py-3">
          <p className="mb-2 text-center font-sans text-xs font-normal text-[#8B9CB8]">{selectedCount} subtopic{selectedCount === 1 ? '' : 's'} selected</p>
          <button
            type="button"
            disabled={selectedCount === 0}
            onClick={startSelectedPractice}
            className={`mx-auto block w-full max-w-4xl rounded-2xl px-6 py-4 font-bold text-white transition ${selectedCount === 0 ? 'cursor-not-allowed bg-slate-700 text-slate-400' : 'bg-[#FF6B35] hover:bg-[#ff7c4d]'}`}
          >
            Start Practice
          </button>
        </div>
      </div>
    );
  }

  return null;
}
