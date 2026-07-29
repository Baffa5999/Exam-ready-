import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../supabase';
import type { User } from '@supabase/supabase-js';
import {
  ChevronLeft,
  Mail,
  AtSign,
  Flame,
  BookOpen,
  Target,
  Crosshair,
  Trophy,
  LogOut,
  Loader2,
  Shield,
  Calendar,
  AlertCircle,
  Settings,
} from 'lucide-react';

const ADMIN_EMAIL = 'usmanbaffa7002@gmail.com';

interface ProfileProps {
  user: User;
  navigatePath: (path: string, state?: Record<string, unknown>, options?: { replace?: boolean }) => void;
  renderBottomNavigation: () => React.ReactNode;
  onSignOut: () => void;
}

interface ProfileStats {
  streak: number;
  questionsAnswered: number;
  accuracy: number;
  battlesWon: number;
  battlesPlayed: number;
  joinDate: string | null;
}

const pageClass = 'min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top_left,rgba(255,107,53,0.10),transparent_34%),#0A0F1E] pb-36 text-white font-sans';
const mainClass = 'mx-auto max-w-2xl space-y-6 px-4 py-6 sm:px-6 md:px-10 md:py-8 animate-fade-up';
const backButtonClass = 'inline-flex min-w-0 items-center gap-2 rounded-full border border-[rgba(255,255,255,0.08)] bg-[#111827]/90 px-4 py-2.5 font-sans text-sm font-bold text-[#FF8A66] shadow-[0_10px_30px_rgba(0,0,0,0.22)] transition hover:border-[#FF6B35]/50 hover:text-[#FF6B35]';

export default function Profile({ user, navigatePath, renderBottomNavigation, onSignOut }: ProfileProps) {
  const [displayName, setDisplayName] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  const avatarInitial = (displayName || user.email || 'U')[0].toUpperCase();
  const isAdmin = user?.email?.toLowerCase() === ADMIN_EMAIL;

  useEffect(() => {
    let cancelled = false;

    const loadProfile = async () => {
      setLoading(true);

      // Load profile info
      const { data: profile } = await supabase
        .from('profiles')
        .select('username, full_name, streak, created_at')
        .eq('id', user.id)
        .maybeSingle();

      if (cancelled) return;

      const fullName = user.user_metadata?.full_name || profile?.full_name || '';
      const uname = profile?.username || user.email?.split('@')[0] || 'User';
      setDisplayName(fullName);
      setUsername(uname);

      // Load performance stats
      const { data: performance } = await supabase
        .from('student_performance')
        .select('questions_attempted, questions_correct')
        .eq('user_id', user.id);

      if (cancelled) return;

      let questionsAnswered = 0;
      let accuracy = 0;
      if (performance && performance.length > 0) {
        const totalAttempted = performance.reduce((sum, row) => sum + (Number(row.questions_attempted) || 0), 0);
        const totalCorrect = performance.reduce((sum, row) => sum + (Number(row.questions_correct) || 0), 0);
        questionsAnswered = totalAttempted;
        accuracy = totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0;
      }

      // Load battle stats
      let battlesWon = 0;
      let battlesPlayed = 0;
      const { data: battles } = await supabase
        .from('battles')
        .select('creator_id, opponent_id, creator_score, opponent_score, status')
        .or(`creator_id.eq.${user.id},opponent_id.eq.${user.id}`);

      if (cancelled) return;

      if (battles && battles.length > 0) {
        const completed = battles.filter(b => b.status === 'completed');
        battlesPlayed = completed.length;
        battlesWon = completed.reduce((total, battle) => {
          const creatorScore = Number(battle.creator_score) || 0;
          const opponentScore = Number(battle.opponent_score) || 0;
          if (battle.creator_id === user.id && creatorScore > opponentScore) return total + 1;
          if (battle.opponent_id === user.id && opponentScore > creatorScore) return total + 1;
          return total;
        }, 0);
      }

      if (!cancelled) {
        setStats({
          streak: profile?.streak ?? 0,
          questionsAnswered,
          accuracy,
          battlesWon,
          battlesPlayed,
          joinDate: profile?.created_at || user.created_at || null,
        });
        setLoading(false);
      }
    };

    void loadProfile();
    return () => { cancelled = true; };
  }, [user]);

  const handleSignOut = useCallback(async () => {
    setSigningOut(true);
    try {
      await supabase.auth.signOut();
      onSignOut();
    } finally {
      setSigningOut(false);
      setShowSignOutConfirm(false);
    }
  }, [onSignOut]);

  const statCards = stats
    ? [
        { icon: Flame, value: `${stats.streak}`, label: 'Day Streak', accent: '#FF6B35', bg: 'rgba(255,107,53,0.12)' },
        { icon: BookOpen, value: `${stats.questionsAnswered}`, label: 'Questions', accent: '#2EC4B6', bg: 'rgba(46,196,182,0.12)' },
        { icon: Target, value: `${stats.accuracy}%`, label: 'Accuracy', accent: '#00BBF9', bg: 'rgba(0,187,249,0.12)' },
        { icon: Trophy, value: `${stats.battlesWon}/${stats.battlesPlayed}`, label: 'Battles Won', accent: '#9B5DE5', bg: 'rgba(155,93,229,0.12)' },
      ]
    : [];

  if (loading) {
    return (
      <div className={pageClass}>
        <main className={mainClass}>
          <button type="button" onClick={() => navigatePath('/')} className={backButtonClass}>
            <ChevronLeft className="h-5 w-5" /> Back
          </button>
          <div className="flex min-h-[60vh] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#FF6B35]" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={pageClass}>
      <main className={mainClass}>
        <button type="button" onClick={() => navigatePath('/')} className={backButtonClass}>
          <ChevronLeft className="h-5 w-5" /> Back
        </button>

        {/* Hero profile card */}
        <section className="rounded-[28px] border border-[#FF6B35]/20 bg-gradient-to-br from-[#1A1A2E] via-[#141827] to-[#111827] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.32)] sm:p-8">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-[#FF6B35]/40 bg-[#FF6B35]/15 font-heading text-4xl font-bold text-[#FFB199] shadow-[0_0_0_6px_rgba(255,107,53,0.08)]">
              {avatarInitial}
            </div>
            <h1 className="mt-5 break-words font-heading text-2xl font-bold text-white sm:text-3xl">
              {displayName || username}
            </h1>
            {displayName && (
              <p className="mt-1 flex items-center gap-1.5 font-sans text-sm text-[#8B9CB8]">
                <AtSign className="h-3.5 w-3.5" />
                {username}
              </p>
            )}
            <p className="mt-2 flex items-center gap-1.5 font-sans text-xs text-[#8B9CB8]">
              <Mail className="h-3.5 w-3.5" />
              {user.email}
            </p>
            {stats?.joinDate && (
              <p className="mt-2 flex items-center gap-1.5 font-sans text-[11px] text-[#6B7688]">
                <Calendar className="h-3 w-3" />
                Joined {new Date(stats.joinDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </p>
            )}
          </div>
        </section>

        {/* Stats grid */}
        <section>
          <p className="mb-3 font-sans text-[11px] font-bold uppercase tracking-[0.28em] text-[#8B9CB8]">
            Your Stats
          </p>
          <div className="grid grid-cols-2 gap-3">
            {statCards.map(card => (
              <div
                key={card.label}
                className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#111827] p-4"
              >
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ backgroundColor: card.bg }}
                >
                  <card.icon className="h-5 w-5" style={{ color: card.accent }} />
                </div>
                <p
                  className="mt-3 font-heading text-2xl font-bold text-white"
                  style={{ fontVariantNumeric: 'tabular-nums' }}
                >
                  {card.value}
                </p>
                <p className="mt-0.5 font-sans text-xs text-[#8B9CB8]">{card.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Quick actions */}
        <section>
          <p className="mb-3 font-sans text-[11px] font-bold uppercase tracking-[0.28em] text-[#8B9CB8]">
            Quick Actions
          </p>
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => navigatePath('/leaderboard')}
              className="flex w-full items-center gap-4 rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#111827] p-4 text-left transition hover:border-white/15"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400">
                <Shield className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-heading text-sm font-semibold text-white">View Leaderboard</p>
                <p className="mt-0.5 font-sans text-xs text-[#8B9CB8]">See how you rank against others</p>
              </div>
              <ChevronLeft className="h-5 w-5 rotate-180 text-[#8B9CB8]" />
            </button>

            <button
              type="button"
              onClick={() => navigatePath('/battle')}
              className="flex w-full items-center gap-4 rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#111827] p-4 text-left transition hover:border-white/15"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FF6B35]/15 text-[#FF6B35]">
                <Crosshair className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-heading text-sm font-semibold text-white">Start a Battle</p>
                <p className="mt-0.5 font-sans text-xs text-[#8B9CB8]">Challenge a classmate</p>
              </div>
              <ChevronLeft className="h-5 w-5 rotate-180 text-[#8B9CB8]" />
            </button>

            {isAdmin && (
              <button
                type="button"
                onClick={() => navigatePath('/admin')}
                className="flex w-full items-center gap-4 rounded-2xl border border-amber-400/30 bg-amber-500/5 p-4 text-left transition hover:border-amber-400/50 hover:bg-amber-500/10"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/15 text-amber-400">
                  <Settings className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-heading text-sm font-semibold text-white">Admin Panel</p>
                  <p className="mt-0.5 font-sans text-xs text-[#8B9CB8]">Manage questions, flashcards & content</p>
                </div>
                <ChevronLeft className="h-5 w-5 rotate-180 text-amber-400" />
              </button>
            )}
          </div>
        </section>

        {/* Sign out */}
        <section>
          {!showSignOutConfirm ? (
            <button
              type="button"
              onClick={() => setShowSignOutConfirm(true)}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/5 px-6 py-4 font-sans text-sm font-bold text-red-400 transition hover:border-red-500/40 hover:bg-red-500/10"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          ) : (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
                <div className="min-w-0 flex-1">
                  <p className="font-heading text-sm font-bold text-white">Sign out of ExamReady?</p>
                  <p className="mt-1 font-sans text-xs text-[#C8D2E4]">
                    You&apos;ll need to sign in again to access your progress.
                  </p>
                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowSignOutConfirm(false)}
                      disabled={signingOut}
                      className="flex-1 rounded-xl border border-white/10 bg-[#111827] px-4 py-2.5 font-sans text-xs font-bold text-white transition hover:border-white/20"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSignOut}
                      disabled={signingOut}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-red-500 px-4 py-2.5 font-sans text-xs font-bold text-white transition hover:bg-red-600 disabled:opacity-60"
                    >
                      {signingOut ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <>
                          <LogOut className="h-3.5 w-3.5" />
                          Sign Out
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>
      {renderBottomNavigation()}
    </div>
  );
}
