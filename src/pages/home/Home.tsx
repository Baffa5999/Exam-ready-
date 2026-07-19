import React from 'react';
import {
  Bell,
  BookOpen,
  Crosshair,
  Flame,
  Headphones,
  Megaphone,
  Sparkles,
  Swords,
  Target
} from 'lucide-react';
import StatCard from '../../components/StatCard';
import FeatureCard from '../../components/FeatureCard';
import BannerCard from '../../components/BannerCard';

interface HomeProps {
  username: string;
  avatarInitial: string;
  streak: number;
  questionsAnswered: number;
  accuracy: number;
  weakTopicCount: number;
  audiobookCurrentChapter: number;
  audiobookTotalChapters: number;
  latestUpdateTitle: string;
  onNavigate: (path: string) => void;
  onOpenProfile: () => void;
  renderBottomNavigation: () => React.ReactNode;
}

export default function Home({
  username,
  avatarInitial,
  streak,
  questionsAnswered,
  accuracy,
  weakTopicCount,
  audiobookCurrentChapter,
  audiobookTotalChapters,
  latestUpdateTitle,
  onNavigate,
  onOpenProfile,
  renderBottomNavigation
}: HomeProps) {
  const stats = [
    { icon: Flame, value: `${streak}`, label: 'Day Streak', accentColor: '#FF6B35', backgroundColor: 'rgba(255,107,53,0.12)' },
    { icon: BookOpen, value: `${questionsAnswered}`, label: 'Questions', accentColor: '#2EC4B6', backgroundColor: 'rgba(46,196,182,0.12)' },
    { icon: Target, value: `${accuracy}%`, label: 'Accuracy', accentColor: '#2EC4B6', backgroundColor: 'rgba(46,196,182,0.12)' }
  ];

  return (
    <div className="min-h-[100dvh] overflow-x-hidden bg-[radial-gradient(circle_at_top_left,rgba(255,107,53,0.10),transparent_34%),#0A0F1E] pb-36 font-sans text-white">
      <main className="mx-auto max-w-2xl space-y-6 px-4 py-5 sm:px-6 md:py-8">
        {/* 1. Header */}
        <header className="flex items-center justify-between gap-3">
          <span className="font-heading text-[20px] font-bold tracking-tight text-white">
            Exam<span className="text-[#FF6B35]">Ready</span>
          </span>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => onNavigate('/updates')}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(255,255,255,0.08)] bg-[#111827]/90 text-[#8B9CB8] transition hover:border-[#FF6B35]/50 hover:text-[#FF6B35]"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={onOpenProfile}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#FF6B35]/35 bg-[#FF6B35]/15 font-heading text-sm font-bold text-[#FFB199] transition hover:bg-[#FF6B35]/25"
              aria-label="View profile"
            >
              {avatarInitial}
            </button>
          </div>
        </header>

        {/* 2. Greeting — full text, no truncation */}
        <h1 className="font-heading text-2xl font-bold leading-tight text-white sm:text-3xl">
          Hi, {username}
        </h1>

        {/* 3. Stats row — 3 equal-width cards */}
        <section className="grid grid-cols-3 gap-3">
          {stats.map(stat => (
            <StatCard
              key={stat.label}
              icon={stat.icon}
              value={stat.value}
              label={stat.label}
              accentColor={stat.accentColor}
              backgroundColor={stat.backgroundColor}
            />
          ))}
        </section>

        {/* 4. Study planner banner */}
        <BannerCard
          text="Your study planner is ready. Keep crushing your exam prep!"
          icon={Sparkles}
          accentColor="#FF6B35"
        />

        {/* 5. Section header */}
        <h2 className="font-heading text-lg font-bold text-white">Study Tools</h2>

        {/* 6. Top row — 2 large cards */}
        <section className="grid grid-cols-2 gap-3">
          <FeatureCard
            icon={BookOpen}
            label="Practice"
            href="/practice"
            onNavigate={onNavigate}
            accentColor="#FF6B35"
            variant="large"
          />
          <FeatureCard
            icon={Headphones}
            label="JAMB Novel Audiobook"
            subtext={`Chapter ${audiobookCurrentChapter} of ${audiobookTotalChapters}`}
            href="/audiobook"
            onNavigate={onNavigate}
            accentColor="#2EC4B6"
            variant="large"
          />
        </section>

        {/* 7. Second row — 2 medium cards */}
        <section className="grid grid-cols-2 gap-3">
          <FeatureCard
            icon={Crosshair}
            label="Weakness Assassin"
            subtext={`${weakTopicCount} weak topic${weakTopicCount === 1 ? '' : 's'} detected`}
            href="/weakness"
            onNavigate={onNavigate}
            accentColor="#FF6B35"
            variant="medium"
          />
          <FeatureCard
            icon={Megaphone}
            label="Updates"
            subtext={latestUpdateTitle}
            href="/updates"
            onNavigate={onNavigate}
            accentColor="#2EC4B6"
            variant="medium"
          />
        </section>

        {/* 8. Third row — 1 full-width card */}
        <section>
          <FeatureCard
            icon={Swords}
            label="Battle"
            subtext="Challenge other students"
            href="/battle"
            onNavigate={onNavigate}
            accentColor="#FF6B35"
            variant="medium"
          />
        </section>
      </main>

      {/* 9. Bottom navigation — unchanged */}
      {renderBottomNavigation()}
    </div>
  );
}
