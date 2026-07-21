import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabase';
import { Trophy, ChevronDown, ChevronUp } from 'lucide-react';
import BottomNavigation from '../../components/BottomNavigation';

interface LeaderboardEntry {
  rank: number;
  username: string;
  accuracy: number;
  questions_attempted: number;
}

interface LeaderboardProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export default function Leaderboard({ currentPath, onNavigate }: LeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewType, setViewType] = useState<'all_time' | 'by_subject'>('all_time');

  useEffect(() => {
    const loadLeaderboard = async () => {
      setLoading(true);
      setError(null);

      try {
        const view = viewType === 'all_time' ? 'leaderboard_all_time' : 'leaderboard_by_subject';
        const { data, error: err } = await supabase
          .from(view)
          .select('*')
          .order('rank', { ascending: true })
          .limit(50);

        if (err) throw err;

        setLeaderboard(
          (data || []).map((entry: any, index: number) => ({
            rank: index + 1,
            username: entry.username || 'Anonymous',
            accuracy: entry.accuracy || 0,
            questions_attempted: entry.questions_attempted || 0
          }))
        );
      } catch (err) {
        console.error('Failed to load leaderboard:', err);
        setError('Unable to load leaderboard data');
        setLeaderboard([]);
      } finally {
        setLoading(false);
      }
    };

    loadLeaderboard();
  }, [viewType]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top_left,rgba(255,107,53,0.10),transparent_34%),#0A0F1E] pb-36 text-white font-sans">
      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 md:px-10 md:py-8">
        {/* Header */}
        <section className="rounded-[28px] border border-[#FF6B35]/20 bg-gradient-to-br from-[#1A1A2E] via-[#141827] to-[#111827] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.32)]">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-[#FF6B35]/15 text-[#FF6B35]">
              <Trophy className="h-7 w-7" />
            </div>
            <div>
              <p className="font-sans text-[11px] font-bold uppercase tracking-[0.28em] text-[#FFB199]">Rankings</p>
              <h1 className="mt-2 font-heading text-2xl font-bold text-white">Leaderboard</h1>
            </div>
          </div>
        </section>

        {/* View Toggle */}
        <section className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={() => setViewType('all_time')}
            className={`flex-1 rounded-[16px] border px-4 py-3 font-sans text-sm font-semibold transition ${
              viewType === 'all_time'
                ? 'border-[#FF6B35] bg-[#FF6B35]/20 text-white'
                : 'border-[rgba(255,255,255,0.08)] bg-[#111827]/85 text-[#8B9CB8] hover:border-[#FF6B35]/50'
            }`}
          >
            All Time
          </button>
          <button
            type="button"
            onClick={() => setViewType('by_subject')}
            className={`flex-1 rounded-[16px] border px-4 py-3 font-sans text-sm font-semibold transition ${
              viewType === 'by_subject'
                ? 'border-[#FF6B35] bg-[#FF6B35]/20 text-white'
                : 'border-[rgba(255,255,255,0.08)] bg-[#111827]/85 text-[#8B9CB8] hover:border-[#FF6B35]/50'
            }`}
          >
            By Subject
          </button>
        </section>

        {/* Leaderboard Table */}
        {loading ? (
          <div className="mt-8 flex justify-center py-12">
            <p className="text-[#8B9CB8]">Loading leaderboard...</p>
          </div>
        ) : error ? (
          <div className="mt-8 rounded-[24px] border border-red-500/20 bg-red-500/10 p-6 text-center">
            <p className="text-red-400">{error}</p>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="mt-8 rounded-[24px] border border-[rgba(255,255,255,0.08)] bg-[#0B1324]/85 p-8 text-center">
            <p className="text-[#8B9CB8]">No leaderboard data available yet.</p>
          </div>
        ) : (
          <section className="mt-6 space-y-2">
            {leaderboard.map((entry, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-[16px] border border-[rgba(255,255,255,0.08)] bg-[#111827]/85 px-4 py-3 transition hover:border-[#FF6B35]/30"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FF6B35]/20 font-heading text-sm font-bold text-[#FF6B35]">
                    {entry.rank}
                  </div>
                  <div>
                    <p className="font-sans font-semibold text-white">{entry.username}</p>
                    <p className="text-xs text-[#8B9CB8]">{entry.questions_attempted} questions</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-heading text-lg font-bold text-[#FF6B35]">{entry.accuracy}%</p>
                  <p className="text-xs text-[#8B9CB8]">Accuracy</p>
                </div>
              </div>
            ))}
          </section>
        )}
      </main>

      <BottomNavigation currentPath={currentPath} onNavigate={onNavigate} />
    </div>
  );
}
