import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../../supabase';
import type { User } from '@supabase/supabase-js';
import {
  Swords,
  Target,
  Copy,
  MessageCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Trophy,
  CheckCircle2,
  Crown,
  Zap,
  Clock,
  Sparkles,
  Users,
  XCircle,
  AlertCircle,
} from 'lucide-react';

interface BattleProps {
  user: User;
  navigatePath: (path: string, state?: Record<string, unknown>, options?: { replace?: boolean }) => void;
  renderBottomNavigation: () => React.ReactNode;
}

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
  explanation?: string | null;
}

interface BattleRow {
  id: string;
  code: string;
  creator_id: string;
  opponent_id: string | null;
  status: 'waiting' | 'in_progress' | 'completed' | 'expired' | 'cancelled';
  subject: string | null;
  question_count: number;
  question_ids: string[];
  creator_answers: Record<string, string>;
  opponent_answers: Record<string, string>;
  creator_score: number;
  opponent_score: number;
  created_at: string;
  expires_at: string;
  started_at: string | null;
  completed_at: string | null;
}

interface RecentBattle {
  id: string;
  opponentUsername: string;
  date: string;
  yours: number;
  theirs: number;
  total: number;
  result: 'Win' | 'Loss' | 'Draw';
  subject: string;
}

type View = 'lobby' | 'configuring' | 'waiting' | 'session' | 'waitingOpponent' | 'results';

const subjectLibrary = [
  { name: 'Mathematics', accent: '#00BBF9', gradient: 'from-[#00BBF9] to-[#006DFF]' },
  { name: 'English Language', accent: '#2EC4B6', gradient: 'from-[#2EC4B6] to-[#118A7E]' },
  { name: 'Biology', accent: '#00FF87', gradient: 'from-[#00FF87] to-[#0B8F52]' },
  { name: 'Chemistry', accent: '#9B5DE5', gradient: 'from-[#9B5DE5] to-[#5D2E91]' },
  { name: 'Physics', accent: '#FF6B35', gradient: 'from-[#FF6B35] to-[#F7931E]' },
  { name: 'Literature', accent: '#F15BB5', gradient: 'from-[#F15BB5] to-[#B5179E]' },
];

const questionCountOptions = [10, 15, 20];

const pageClass = 'min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top_left,rgba(255,107,53,0.10),transparent_34%),#0A0F1E] pb-36 text-white font-sans';
const mainClass = 'mx-auto max-w-5xl space-y-7 px-4 py-6 sm:px-6 md:px-10 md:py-8 animate-fade-up';
const backButtonClass = 'inline-flex min-w-0 items-center gap-2 rounded-full border border-[rgba(255,255,255,0.08)] bg-[#111827]/90 px-4 py-2.5 font-sans text-sm font-bold text-[#FF8A66] shadow-[0_10px_30px_rgba(0,0,0,0.22)] transition hover:border-[#FF6B35]/50 hover:text-[#FF6B35]';

function ProfessionalHeader({
  title,
  description,
  icon: Icon,
  accent = '#FF6B35',
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  accent?: string;
}) {
  return (
    <section className="rounded-[28px] border border-[#FF6B35]/20 bg-gradient-to-br from-[#1A1A2E] via-[#141827] to-[#111827] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.32)] sm:p-6">
      <div className="flex items-center gap-4">
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
          style={{ backgroundColor: `${accent}1F`, color: accent }}
        >
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

const getOptions = (q: Question) => [q.option_a, q.option_b, q.option_c, q.option_d];

const getCorrectIndex = (q: Question) => {
  const normalized = `${q.correct_answer || ''}`.trim().toLowerCase();
  const keys = ['a', 'b', 'c', 'd'];
  const directIndex = keys.findIndex(k => normalized === k || normalized === `option_${k}`);
  if (directIndex >= 0) return directIndex;
  return getOptions(q).findIndex(o => `${o}`.trim().toLowerCase() === normalized);
};

const generateCode = (): string => Math.floor(100000 + Math.random() * 900000).toString();

const formatDateRelative = (iso: string): string => {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return d.toLocaleDateString();
};

export default function Battle({ user, navigatePath, renderBottomNavigation }: BattleProps) {
  const [view, setView] = useState<View>('lobby');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [banner, setBanner] = useState<{ kind: 'success' | 'error'; message: string } | null>(null);

  // Configuration state (create flow)
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [questionCount, setQuestionCount] = useState<number>(10);

  // Active battle state
  const [battle, setBattle] = useState<BattleRow | null>(null);
  const [opponentUsername, setOpponentUsername] = useState<string | null>(null);
  const [creatorUsername, setCreatorUsername] = useState<string | null>(null);

  // Session state
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submittingAnswers, setSubmittingAnswers] = useState(false);

  // Lobby data
  const [recentBattles, setRecentBattles] = useState<RecentBattle[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(false);

  // Join code input
  const [joinCode, setJoinCode] = useState<string>('');
  const [joining, setJoining] = useState(false);

  // Clipboard feedback
  const [copied, setCopied] = useState(false);

  // Polling
  const pollRef = useRef<number | null>(null);

  const showBanner = useCallback((kind: 'success' | 'error', message: string) => {
    setBanner({ kind, message });
    window.setTimeout(() => setBanner(b => (b?.message === message ? null : b)), 2800);
  }, []);

  const stopPolling = useCallback(() => {
    if (pollRef.current !== null) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  // Load username for a user id
  const loadUsername = useCallback(async (userId: string): Promise<string | null> => {
    const { data } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', userId)
      .maybeSingle();
    return data?.username || null;
  }, []);

  // Load recent battles for lobby
  const loadRecentBattles = useCallback(async () => {
    setLoadingRecent(true);
    try {
      const { data, error } = await supabase
        .from('battles')
        .select('*')
        .eq('status', 'completed')
        .or(`creator_id.eq.${user.id},opponent_id.eq.${user.id}`)
        .order('completed_at', { ascending: false })
        .limit(10);

      if (error) {
        setRecentBattles([]);
        return;
      }

      const rows = (data || []) as BattleRow[];
      const enriched: RecentBattle[] = [];

      for (const row of rows) {
        const otherId = row.creator_id === user.id ? row.opponent_id : row.creator_id;
        const otherUsername = otherId ? (await loadUsername(otherId)) || 'Unknown' : 'Unknown';
        const yours = row.creator_id === user.id ? row.creator_score : row.opponent_score;
        const theirs = row.creator_id === user.id ? row.opponent_score : row.creator_score;
        const result: 'Win' | 'Loss' | 'Draw' = yours > theirs ? 'Win' : yours < theirs ? 'Loss' : 'Draw';
        enriched.push({
          id: row.id,
          opponentUsername: otherUsername,
          date: formatDateRelative(row.completed_at || row.created_at),
          yours,
          theirs,
          total: row.question_count,
          result,
          subject: row.subject || 'Mixed',
        });
      }

      setRecentBattles(enriched);
    } finally {
      setLoadingRecent(false);
    }
  }, [user.id, loadUsername]);

  useEffect(() => {
    if (view === 'lobby') {
      void loadRecentBattles();
    }
  }, [view, loadRecentBattles]);

  // Poll battle status when waiting or waiting for opponent
  useEffect(() => {
    if (!battle) return;
    if (view !== 'waiting' && view !== 'waitingOpponent') return;

    const poll = async () => {
      const { data, error } = await supabase
        .from('battles')
        .select('*')
        .eq('id', battle.id)
        .maybeSingle();

      if (error || !data) return;
      const row = data as BattleRow;
      setBattle(row);

      if (view === 'waiting' && row.status === 'in_progress' && row.opponent_id) {
        // Opponent joined — transition to loading questions then session
        stopPolling();
        const otherName = await loadUsername(row.opponent_id);
        setOpponentUsername(otherName || 'Opponent');
        await loadQuestionsAndStart(row);
      } else if (view === 'waitingOpponent' && row.status === 'completed') {
        stopPolling();
        setView('results');
      } else if (row.status === 'expired' || row.status === 'cancelled') {
        stopPolling();
        showBanner('error', row.status === 'expired' ? 'Battle code expired.' : 'Battle was cancelled.');
        setBattle(null);
        setView('lobby');
      }
    };

    poll();
    pollRef.current = window.setInterval(poll, 2500);

    return () => stopPolling();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [battle?.id, view]);

  // Load questions for a battle and transition to session
  const loadQuestionsAndStart = useCallback(async (row: BattleRow) => {
    setLoading(true);
    try {
      const ids = (row.question_ids || []) as string[];
      if (ids.length === 0) {
        showBanner('error', 'No questions were assigned to this battle.');
        setView('lobby');
        return;
      }

      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .in('id', ids);

      if (error || !data) {
        showBanner('error', 'Failed to load questions.');
        setView('lobby');
        return;
      }

      // Preserve the order stored in question_ids
      const byId = new Map((data as Question[]).map(q => [q.id, q]));
      const ordered = ids.map(id => byId.get(id)).filter((q): q is Question => !!q);

      if (ordered.length === 0) {
        showBanner('error', 'Questions for this battle could not be found.');
        setView('lobby');
        return;
      }

      setQuestions(ordered);
      setAnswers({});
      setCurrentQuestionIndex(0);

      // If I'm the creator and opponent just joined, also load opponent name
      if (row.creator_id === user.id && row.opponent_id) {
        const name = await loadUsername(row.opponent_id);
        setOpponentUsername(name || 'Opponent');
      } else if (row.opponent_id === user.id) {
        const name = await loadUsername(row.creator_id);
        setCreatorUsername(name || 'Challenger');
        setOpponentUsername(null);
      }

      setView('session');
    } finally {
      setLoading(false);
    }
  }, [user.id, loadUsername, showBanner]);

  // ── Create flow ──────────────────────────────────────────────────────────
  const handleCreateBattle = useCallback(async () => {
    if (!selectedSubject) {
      showBanner('error', 'Pick a subject first.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      // Fetch up to questionCount question ids for this subject
      const { data: qs, error: qErr } = await supabase
        .from('questions')
        .select('id')
        .eq('subject', selectedSubject)
        .limit(questionCount * 3); // fetch extra to shuffle

      if (qErr || !qs || qs.length < questionCount) {
        showBanner('error', `Not enough questions available for ${selectedSubject}.`);
        setLoading(false);
        return;
      }

      // Shuffle and pick
      const pool = [...qs].sort(() => Math.random() - 0.5).slice(0, questionCount);
      const questionIds = pool.map(q => q.id);
      const code = generateCode();

      const { data: inserted, error: insertErr } = await supabase
        .from('battles')
        .insert({
          code,
          creator_id: user.id,
          status: 'waiting',
          subject: selectedSubject,
          question_count: questionCount,
          question_ids: questionIds,
        })
        .select()
        .single();

      if (insertErr || !inserted) {
        showBanner('error', insertErr?.message || 'Failed to create battle.');
        setLoading(false);
        return;
      }

      setBattle(inserted as BattleRow);
      setView('waiting');
    } finally {
      setLoading(false);
    }
  }, [selectedSubject, questionCount, user.id, showBanner]);

  // ── Cancel battle ────────────────────────────────────────────────────────
  const handleCancelBattle = useCallback(async () => {
    if (!battle) return;
    stopPolling();
    if (battle.status === 'waiting' && !battle.opponent_id) {
      await supabase.from('battles').delete().eq('id', battle.id);
    }
    setBattle(null);
    setSelectedSubject(null);
    setJoinCode('');
    setView('lobby');
  }, [battle, stopPolling]);

  // ── Join flow ────────────────────────────────────────────────────────────
  const handleJoinBattle = useCallback(async () => {
    const code = joinCode.trim();
    if (code.length !== 6 || !/^\d+$/.test(code)) {
      showBanner('error', 'Enter a valid 6-digit code.');
      return;
    }
    setJoining(true);
    setError(null);
    try {
      const { data: candidates, error: findErr } = await supabase
        .from('battles')
        .select('*')
        .eq('code', code)
        .eq('status', 'waiting')
        .limit(1);

      if (findErr || !candidates || candidates.length === 0) {
        showBanner('error', 'No battle found with that code.');
        setJoining(false);
        return;
      }

      const row = candidates[0] as BattleRow;

      if (row.creator_id === user.id) {
        showBanner('error', "That's your own battle — share the code with a friend.");
        setJoining(false);
        return;
      }

      if (new Date(row.expires_at).getTime() < Date.now()) {
        showBanner('error', 'This battle code has expired.');
        setJoining(false);
        return;
      }

      // Attempt to join atomically
      const { data: updated, error: updateErr } = await supabase
        .from('battles')
        .update({
          opponent_id: user.id,
          status: 'in_progress',
          started_at: new Date().toISOString(),
        })
        .eq('id', row.id)
        .eq('status', 'waiting')
        .is('opponent_id', null)
        .select()
        .single();

      if (updateErr || !updated) {
        showBanner('error', updateErr?.message || 'Someone else just joined this battle. Try another code.');
        setJoining(false);
        return;
      }

      const refreshed = updated as BattleRow;
      setBattle(refreshed);
      const creatorName = await loadUsername(refreshed.creator_id);
      setCreatorUsername(creatorName || 'Challenger');
      await loadQuestionsAndStart(refreshed);
    } finally {
      setJoining(false);
    }
  }, [joinCode, user.id, showBanner, loadUsername, loadQuestionsAndStart]);

  // ── Session: submit answer ───────────────────────────────────────────────
  const handleSelectAnswer = useCallback((questionId: string, optionKey: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: optionKey }));
  }, []);

  // ── Session: finish & submit ─────────────────────────────────────────────
  const handleSubmitBattle = useCallback(async () => {
    if (!battle || questions.length === 0) return;
    if (Object.keys(answers).length < questions.length) {
      showBanner('error', `Answer all questions first (${Object.keys(answers).length}/${questions.length}).`);
      return;
    }
    setSubmittingAnswers(true);
    try {
      // Compute score
      let score = 0;
      const answerMap: Record<string, string> = {};
      for (const q of questions) {
        const selected = answers[q.id];
        answerMap[q.id] = selected;
        const correctIndex = getCorrectIndex(q);
        const selectedIndex = ['a', 'b', 'c', 'd'].indexOf(selected);
        if (selectedIndex === correctIndex) score += 1;
      }

      const isCreator = battle.creator_id === user.id;
      const updatePayload = isCreator
        ? { creator_answers: answerMap, creator_score: score }
        : { opponent_answers: answerMap, opponent_score: score };

      // Fetch latest battle state to know if opponent already finished
      const { data: latest, error: fetchErr } = await supabase
        .from('battles')
        .select('*')
        .eq('id', battle.id)
        .maybeSingle();

      if (fetchErr || !latest) {
        showBanner('error', 'Failed to submit your answers.');
        setSubmittingAnswers(false);
        return;
      }

      const latestRow = latest as BattleRow;
      const opponentDone = isCreator
        ? Object.keys(latestRow.opponent_answers || {}).length > 0
        : Object.keys(latestRow.creator_answers || {}).length > 0;

      const finalPayload: Record<string, unknown> = { ...updatePayload };
      if (opponentDone) {
        finalPayload.status = 'completed';
        finalPayload.completed_at = new Date().toISOString();
      }

      const { error: updateErr } = await supabase
        .from('battles')
        .update(finalPayload)
        .eq('id', battle.id);

      if (updateErr) {
        showBanner('error', 'Failed to save your answers.');
        setSubmittingAnswers(false);
        return;
      }

      const refreshed = { ...latestRow, ...finalPayload } as BattleRow;
      setBattle(refreshed);

      if (opponentDone) {
        setView('results');
      } else {
        setView('waitingOpponent');
      }
    } finally {
      setSubmittingAnswers(false);
    }
  }, [battle, questions, answers, user.id, showBanner]);

  // ── Copy code ────────────────────────────────────────────────────────────
  const handleCopyCode = useCallback(async () => {
    if (!battle?.code || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(battle.code);
      setCopied(true);
      showBanner('success', 'Battle code copied.');
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      showBanner('error', 'Could not copy to clipboard.');
    }
  }, [battle?.code, showBanner]);

  // ── Computed ─────────────────────────────────────────────────────────────
  const currentQuestion = questions[currentQuestionIndex] || null;
  const answeredCount = Object.keys(answers).length;
  const allAnswered = questions.length > 0 && answeredCount === questions.length;
  const whatsappMessage = useMemo(() => {
    if (!battle?.code) return '';
    const subj = battle.subject || 'an exam';
    return `I challenge you to an ExamReady battle! 🎯\n\n📚 Subject: ${subj}\n🔢 Code: ${battle.code}\n\nDownload and enter the code to accept: examready.website`;
  }, [battle]);

  const iAmCreator = battle?.creator_id === user.id;
  const myScore = battle ? (iAmCreator ? battle.creator_score : battle.opponent_score) : 0;
  const theirScore = battle ? (iAmCreator ? battle.opponent_score : battle.creator_score) : 0;
  const result: 'Win' | 'Loss' | 'Draw' = myScore > theirScore ? 'Win' : myScore < theirScore ? 'Loss' : 'Draw';

  // ── Cleanup on unmount ───────────────────────────────────────────────────
  useEffect(() => () => stopPolling(), [stopPolling]);

  // ── RENDER ───────────────────────────────────────────────────────────────

  // Banner toast
  const bannerNode = banner ? (
    <div className="pointer-events-none fixed left-1/2 top-5 z-50 -translate-x-1/2">
      <div
        className={`pointer-events-auto flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold shadow-[0_18px_55px_rgba(0,0,0,0.4)] ${
          banner.kind === 'success'
            ? 'bg-emerald-500/95 text-white'
            : 'bg-red-500/95 text-white'
        }`}
      >
        {banner.kind === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
        {banner.message}
      </div>
    </div>
  ) : null;

  // ── LOBBY ────────────────────────────────────────────────────────────────
  if (view === 'lobby') {
    return (
      <div className={pageClass}>
        {bannerNode}
        <main className={mainClass}>
          <ProfessionalHeader
            title="Battle"
            description="Challenge a classmate to a head-to-head quiz. First to outscore the other wins."
            icon={Swords}
            accent="#FF6B35"
          />

          <section className="grid gap-4 md:grid-cols-2">
            {/* Create Battle */}
            <button
              type="button"
              onClick={() => {
                setSelectedSubject(null);
                setQuestionCount(10);
                setView('configuring');
              }}
              className="group flex w-full flex-col rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#111827] p-6 text-left transition hover:-translate-y-0.5 hover:border-[#FF6B35]/40"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#FF6B35]/15 text-[#FF6B35]">
                  <Swords className="h-[22px] w-[22px]" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-heading text-base font-semibold text-white">Create Battle</h2>
                  <p className="mt-1 font-sans text-[13px] font-normal leading-5 text-[#8B9CB8]">
                    Generate a code and share with a friend to challenge them.
                  </p>
                </div>
              </div>
              <div className="mt-5 flex justify-end">
                <span className="inline-flex items-center gap-1 rounded-full bg-[#FF6B35]/10 px-3 py-2 font-sans text-xs font-semibold text-[#FF6B35] transition group-hover:bg-[#FF6B35] group-hover:text-white">
                  Start <ChevronRight className="h-4 w-4" />
                </span>
              </div>
            </button>

            {/* Join Battle */}
            <div className="flex w-full flex-col rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#111827] p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-500/15 text-purple-300">
                  <Target className="h-[22px] w-[22px]" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-heading text-base font-semibold text-white">Join Battle</h2>
                  <p className="mt-1 font-sans text-[13px] font-normal leading-5 text-[#8B9CB8]">
                    Enter a code from a friend to accept the challenge.
                  </p>
                </div>
              </div>

              <div className="mt-5 flex items-center gap-3">
                <input
                  inputMode="numeric"
                  maxLength={6}
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="6-digit code"
                  className="h-11 min-w-0 flex-1 rounded-xl border border-white/10 bg-[#0A0F1E] px-3 text-center font-heading text-base font-semibold tracking-[0.18em] text-white outline-none transition placeholder:font-sans placeholder:text-xs placeholder:font-normal placeholder:tracking-normal placeholder:text-[#8B9CB8] focus:border-[#FF6B35] focus:shadow-[0_0_0_3px_rgba(255,107,53,0.12)]"
                />
                <button
                  type="button"
                  disabled={joining || joinCode.length !== 6}
                  onClick={handleJoinBattle}
                  className={`h-11 shrink-0 rounded-xl px-5 font-sans text-sm font-semibold text-white transition ${
                    joining || joinCode.length !== 6
                      ? 'cursor-not-allowed bg-slate-700 text-slate-400'
                      : 'bg-[#FF6B35] hover:bg-[#ff7c4d]'
                  }`}
                >
                  {joining ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Join'}
                </button>
              </div>
            </div>
          </section>

          {/* Recent Battles */}
          <section>
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-lg font-bold text-white sm:text-xl">Recent Battles</h2>
              {loadingRecent && <Loader2 className="h-4 w-4 animate-spin text-[#8B9CB8]" />}
            </div>
            {recentBattles.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#111827] px-6 py-10 text-center">
                <Trophy className="mx-auto h-8 w-8 text-[#8B9CB8]" />
                <p className="mt-3 font-heading text-base font-bold text-white">No battles yet.</p>
                <p className="mt-2 font-sans text-sm font-normal text-[#8B9CB8]">
                  Challenge a friend to get started.
                </p>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {recentBattles.map(b => (
                  <div
                    key={b.id}
                    className="flex flex-col gap-3 rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#111827] p-4 sm:grid sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center"
                  >
                    <div className="min-w-0">
                      <p className="font-heading text-sm font-semibold text-white">vs {b.opponentUsername}</p>
                      <p className="mt-1 font-sans text-xs font-normal text-[#8B9CB8]">
                        {b.subject} • {b.date}
                      </p>
                    </div>
                    <p className="font-heading text-sm font-semibold text-white md:text-base">
                      {b.yours}/{b.total} vs {b.theirs}/{b.total}
                    </p>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        b.result === 'Win'
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : b.result === 'Loss'
                          ? 'bg-red-500/15 text-red-400'
                          : 'bg-amber-500/15 text-amber-400'
                      }`}
                    >
                      {b.result}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>
        {renderBottomNavigation()}
      </div>
    );
  }

  // ── CONFIGURING ──────────────────────────────────────────────────────────
  if (view === 'configuring') {
    const battleSubjects = subjectLibrary.filter(s => s.name !== 'Literature');
    const canProceed = !!selectedSubject;

    return (
      <div className={pageClass}>
        {bannerNode}
        <main className={mainClass}>
          <button type="button" onClick={() => setView('lobby')} className={backButtonClass}>
            <ChevronLeft className="h-5 w-5" /> Back
          </button>
          <ProfessionalHeader
            title="Create Battle"
            description="Pick a subject and how many questions you want to battle over."
            icon={Swords}
            accent="#FF6B35"
          />

          <section>
            <p className="mb-3 font-sans text-[11px] font-bold uppercase tracking-[0.28em] text-[#8B9CB8]">
              Step 1 · Choose Subject
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {battleSubjects.map(s => {
                const active = selectedSubject === s.name;
                return (
                  <button
                    key={s.name}
                    type="button"
                    onClick={() => setSelectedSubject(s.name)}
                    className={`flex items-center gap-4 rounded-2xl border p-4 text-left transition ${
                      active
                        ? 'border-[#FF6B35] bg-[#FF6B35]/10'
                        : 'border-[rgba(255,255,255,0.08)] bg-[#111827] hover:border-white/15'
                    }`}
                  >
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${s.gradient} text-white`}
                    >
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="break-words font-heading text-sm font-semibold text-white">{s.name}</p>
                    </div>
                    {active && <CheckCircle2 className="ml-auto h-5 w-5 shrink-0 text-[#FF6B35]" />}
                  </button>
                );
              })}
            </div>
          </section>

          <section>
            <p className="mb-3 font-sans text-[11px] font-bold uppercase tracking-[0.28em] text-[#8B9CB8]">
              Step 2 · Number of Questions
            </p>
            <div className="flex flex-wrap gap-3">
              {questionCountOptions.map(n => {
                const active = questionCount === n;
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setQuestionCount(n)}
                    className={`rounded-full border px-5 py-2.5 font-sans text-sm font-semibold transition ${
                      active
                        ? 'border-[#FF6B35] bg-[#FF6B35] text-white'
                        : 'border-[rgba(255,255,255,0.1)] bg-[#111827] text-[#C8D2E4] hover:border-[#FF6B35]/50'
                    }`}
                  >
                    {n}
                  </button>
                );
              })}
            </div>
          </section>

          <div className="sticky bottom-4 z-30 pt-2">
            <button
              type="button"
              disabled={!canProceed || loading}
              onClick={handleCreateBattle}
              className={`flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-4 font-sans text-base font-bold text-white transition ${
                !canProceed || loading
                  ? 'cursor-not-allowed bg-slate-700 text-slate-400'
                  : 'bg-[#FF6B35] hover:bg-[#ff7c4d]'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" /> Creating...
                </>
              ) : (
                <>
                  Create Battle <Zap className="h-5 w-5" />
                </>
              )}
            </button>
          </div>
        </main>
      </div>
    );
  }

  // ── WAITING FOR OPPONENT ─────────────────────────────────────────────────
  if (view === 'waiting' && battle) {
    return (
      <div className={pageClass}>
        {bannerNode}
        <main className={mainClass}>
          <button type="button" onClick={handleCancelBattle} className={backButtonClass}>
            <ChevronLeft className="h-5 w-5" /> Cancel
          </button>

          <div className="rounded-[28px] border border-[#FF6B35]/20 bg-gradient-to-br from-[#1A1A2E] via-[#141827] to-[#111827] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.32)] sm:p-8">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#FF6B35]/15 text-[#FF6B35]">
                <Users className="h-7 w-7" />
              </div>
              <div className="min-w-0">
                <p className="font-sans text-[11px] font-bold uppercase tracking-[0.28em] text-[#FFB199]">Battle Ready</p>
                <h1 className="mt-2 font-heading text-2xl font-bold leading-tight text-white sm:text-3xl">
                  Share this code
                </h1>
                <p className="mt-2 font-sans text-sm font-normal leading-6 text-[#8B9CB8]">
                  {battle.subject} • {battle.question_count} questions • Expires in 15 min
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#0A0F1E] p-5 text-center">
              <p
                className="font-heading text-3xl font-bold tracking-[0.25em] text-[#FF6B35] sm:text-4xl"
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {battle.code.split('').join(' ')}
              </p>
              <div className="mt-4 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 font-sans text-xs font-semibold text-[#C8D2E4] transition hover:border-[#FF6B35]/50 hover:text-[#FF6B35]"
                >
                  <Copy className="h-4 w-4" />
                  {copied ? 'Copied!' : 'Copy code'}
                </button>
              </div>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#20bd5a]"
              >
                <MessageCircle className="h-4 w-4" />
                Share on WhatsApp
              </a>
              <div className="mt-5 flex items-center justify-center gap-2 font-sans text-xs font-normal text-[#8B9CB8]">
                <Loader2 className="h-4 w-4 animate-spin text-[#FF6B35]" />
                Waiting for opponent to join...
              </div>
            </div>
          </div>

          <div className="rounded-[22px] border border-[rgba(255,255,255,0.08)] bg-[#0B1324]/85 p-4 text-sm leading-6 text-[#8B9CB8]">
            <p className="font-sans text-[11px] font-bold uppercase tracking-[0.28em] text-[#FFB199]">How it works</p>
            <ol className="mt-3 space-y-2 font-sans text-sm">
              <li>1. Share this code with your friend (WhatsApp, SMS, in person).</li>
              <li>2. They open ExamReady and enter the code in the Battle screen.</li>
              <li>3. You&apos;ll both get the same questions — race to answer them all.</li>
              <li>4. Highest score wins.</li>
            </ol>
          </div>
        </main>
      </div>
    );
  }

  // ── SESSION ──────────────────────────────────────────────────────────────
  if (view === 'session' && currentQuestion) {
    const options = getOptions(currentQuestion);
    const correctIndex = getCorrectIndex(currentQuestion);
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
    const selectedAnswer = answers[currentQuestion.id];

    return (
      <div className={pageClass}>
        {bannerNode}
        <main className={mainClass}>
          {/* Top bar: players */}
          <div className="flex items-center justify-between gap-3 rounded-[22px] border border-[rgba(255,255,255,0.08)] bg-[#0B1324]/85 px-4 py-3">
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FF6B35]/15 font-heading text-sm font-bold text-[#FF6B35]">
                {(iAmCreator ? 'Y' : (creatorUsername?.[0] || 'C')).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate font-heading text-xs font-semibold text-white">
                  {iAmCreator ? 'You' : creatorUsername || 'Challenger'}
                </p>
              </div>
            </div>
            <div className="shrink-0 rounded-full bg-[#FF6B35]/10 px-3 py-1 font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-[#FF6B35]">
              VS
            </div>
            <div className="flex items-center gap-2 min-w-0 flex-row-reverse">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-500/15 font-heading text-sm font-bold text-purple-300">
                {(!iAmCreator ? 'Y' : (opponentUsername?.[0] || 'O')).toUpperCase()}
              </div>
              <div className="min-w-0 text-right">
                <p className="truncate font-heading text-xs font-semibold text-white">
                  {!iAmCreator ? 'You' : opponentUsername || 'Opponent'}
                </p>
              </div>
            </div>
          </div>

          {/* Progress */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="font-sans text-[11px] font-bold uppercase tracking-[0.28em] text-[#8B9CB8]">
                Question {currentQuestionIndex + 1} of {questions.length}
              </p>
              <p className="font-heading text-xs font-semibold text-[#FF6B35]">
                {answeredCount}/{questions.length} answered
              </p>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
              <div
                className="h-full bg-gradient-to-r from-[#FF6B35] to-[#FFB199] transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Question */}
          <section className="rounded-[24px] border border-[rgba(255,255,255,0.08)] bg-[#0B1324]/85 p-5 shadow-[0_18px_55px_rgba(0,0,0,0.24)] sm:p-6">
            <p className="mb-2 font-sans text-[11px] font-bold uppercase tracking-[0.28em] text-[#8B9CB8]">
              {currentQuestion.topic} {currentQuestion.subtopic ? `· ${currentQuestion.subtopic}` : ''}
            </p>
            <p className="break-words font-heading text-lg font-semibold leading-relaxed text-white sm:text-xl">
              {currentQuestion.question_text}
            </p>
          </section>

          {/* Options */}
          <section className="space-y-3">
            {options.map((option, idx) => {
              const key = ['a', 'b', 'c', 'd'][idx];
              const isSelected = selectedAnswer === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleSelectAnswer(currentQuestion.id, key)}
                  className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition ${
                    isSelected
                      ? 'border-[#FF6B35] bg-[#FF6B35]/10'
                      : 'border-[rgba(255,255,255,0.08)] bg-[#111827] hover:border-white/15'
                  }`}
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-heading text-sm font-bold ${
                      isSelected ? 'bg-[#FF6B35] text-white' : 'bg-white/5 text-[#8B9CB8]'
                    }`}
                  >
                    {key.toUpperCase()}
                  </span>
                  <span className="min-w-0 break-words font-sans text-sm font-medium leading-6 text-white sm:text-base">
                    {option}
                  </span>
                  {isSelected && <CheckCircle2 className="ml-auto h-5 w-5 shrink-0 text-[#FF6B35]" />}
                </button>
              );
            })}
          </section>

          {/* Nav */}
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              disabled={currentQuestionIndex === 0}
              onClick={() => setCurrentQuestionIndex(i => Math.max(0, i - 1))}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2.5 font-sans text-sm font-bold transition ${
                currentQuestionIndex === 0
                  ? 'cursor-not-allowed border-white/5 bg-[#111827]/50 text-[#555]'
                  : 'border-[rgba(255,255,255,0.08)] bg-[#111827]/90 text-[#FF8A66] hover:border-[#FF6B35]/50 hover:text-[#FF6B35]'
              }`}
            >
              <ChevronLeft className="h-5 w-5" /> Previous
            </button>

            {currentQuestionIndex < questions.length - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentQuestionIndex(i => Math.min(questions.length - 1, i + 1))}
                className="inline-flex items-center gap-2 rounded-full bg-[#FF6B35] px-5 py-2.5 font-sans text-sm font-bold text-white transition hover:bg-[#ff7c4d]"
              >
                Next <ChevronRight className="h-5 w-5" />
              </button>
            ) : (
              <button
                type="button"
                disabled={!allAnswered || submittingAnswers}
                onClick={handleSubmitBattle}
                className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 font-sans text-sm font-bold text-white transition ${
                  !allAnswered || submittingAnswers
                    ? 'cursor-not-allowed bg-slate-700 text-slate-400'
                    : 'bg-emerald-500 hover:bg-emerald-600'
                }`}
              >
                {submittingAnswers ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Submitting...
                  </>
                ) : (
                  <>
                    Submit Battle <CheckCircle2 className="h-4 w-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </main>
      </div>
    );
  }

  // ── WAITING FOR OPPONENT TO FINISH ───────────────────────────────────────
  if (view === 'waitingOpponent') {
    const otherName = iAmCreator ? opponentUsername : creatorUsername;
    return (
      <div className={pageClass}>
        {bannerNode}
        <main className={mainClass}>
          <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#FF6B35]/15">
              <Clock className="h-10 w-10 text-[#FF6B35]" />
            </div>
            <h1 className="mt-6 font-heading text-2xl font-bold text-white sm:text-3xl">You&apos;re done!</h1>
            <p className="mt-3 max-w-md font-sans text-sm leading-6 text-[#8B9CB8]">
              Waiting for <span className="font-semibold text-white">{otherName || 'your opponent'}</span> to finish their answers...
            </p>
            <div className="mt-6 flex items-center gap-2 font-sans text-xs text-[#8B9CB8]">
              <Loader2 className="h-4 w-4 animate-spin text-[#FF6B35]" />
              Checking every few seconds
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ── RESULTS ──────────────────────────────────────────────────────────────
  if (view === 'results' && battle) {
    const otherName = iAmCreator ? opponentUsername : creatorUsername;
    const ResultIcon = result === 'Win' ? Crown : result === 'Loss' ? XCircle : Trophy;
    const resultAccent = result === 'Win' ? '#00FF87' : result === 'Loss' ? '#FF6B35' : '#F15BB5';

    return (
      <div className={pageClass}>
        {bannerNode}
        <main className={mainClass}>
          <div className="rounded-[28px] border border-[#FF6B35]/20 bg-gradient-to-br from-[#1A1A2E] via-[#141827] to-[#111827] p-6 text-center shadow-[0_24px_80px_rgba(0,0,0,0.32)] sm:p-8">
            <div
              className="mx-auto flex h-20 w-20 items-center justify-center rounded-full"
              style={{ backgroundColor: `${resultAccent}1F` }}
            >
              <ResultIcon className="h-10 w-10" style={{ color: resultAccent }} />
            </div>
            <p
              className="mt-4 font-sans text-[11px] font-bold uppercase tracking-[0.32em]"
              style={{ color: resultAccent }}
            >
              {result === 'Win' ? 'Victory' : result === 'Loss' ? 'Defeat' : 'Draw'}
            </p>
            <h1 className="mt-2 font-heading text-3xl font-bold text-white sm:text-4xl">
              {result === 'Win' ? 'You won!' : result === 'Loss' ? 'Better luck next time' : "It's a tie!"}
            </h1>
            <p className="mt-2 font-sans text-sm text-[#8B9CB8]">vs {otherName || 'Opponent'} • {battle.subject}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#111827] p-5">
              <p className="font-sans text-[11px] font-bold uppercase tracking-[0.28em] text-[#8B9CB8]">You</p>
              <p className="mt-2 font-heading text-4xl font-bold text-white" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {myScore}
                <span className="text-lg text-[#8B9CB8]">/{battle.question_count}</span>
              </p>
              <p className="mt-1 font-sans text-xs text-[#8B9CB8]">
                {Math.round((myScore / battle.question_count) * 100)}% accuracy
              </p>
            </div>
            <div className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#111827] p-5">
              <p className="font-sans text-[11px] font-bold uppercase tracking-[0.28em] text-[#8B9CB8]">
                {otherName || 'Opponent'}
              </p>
              <p className="mt-2 font-heading text-4xl font-bold text-white" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {theirScore}
                <span className="text-lg text-[#8B9CB8]">/{battle.question_count}</span>
              </p>
              <p className="mt-1 font-sans text-xs text-[#8B9CB8]">
                {Math.round((theirScore / battle.question_count) * 100)}% accuracy
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => {
                setBattle(null);
                setSelectedSubject(null);
                setQuestions([]);
                setAnswers({});
                setView('lobby');
                void loadRecentBattles();
              }}
              className="flex-1 rounded-2xl bg-[#FF6B35] px-6 py-4 font-sans text-sm font-bold text-white transition hover:bg-[#ff7c4d]"
            >
              Play Again
            </button>
            <button
              type="button"
              onClick={() => navigatePath('/leaderboard')}
              className="flex-1 rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#111827] px-6 py-4 font-sans text-sm font-bold text-white transition hover:border-white/15"
            >
              View Leaderboard
            </button>
          </div>
        </main>
        {renderBottomNavigation()}
      </div>
    );
  }

  // ── LOADING / FALLBACK ───────────────────────────────────────────────────
  return (
    <div className={pageClass}>
      {bannerNode}
      <main className={mainClass}>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#FF6B35]" />
        </div>
      </main>
    </div>
  );
}
