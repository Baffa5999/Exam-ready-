/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import ErrorBoundary from './components/ErrorBoundary';
import BottomNavigation from './components/BottomNavigation';
import Onboarding from './components/Onboarding';
import InstallPrompt from './components/InstallPrompt';
import Home from './pages/home/Home';
import PracticeFlow from './pages/practice/PracticeFlow';
import PracticeConfigure from './pages/practice/PracticeConfigure';
import PracticeSession from './pages/practice/PracticeSession';
import PracticeResults from './pages/practice/PracticeResults';
import PracticeReview from './pages/practice/PracticeReview';
import Audiobook from './pages/audiobook/Audiobook';
import WeaknessAssassin from './pages/weakness/WeaknessAssassin';
import Flashcards from './pages/flashcards/Flashcards';
import Leaderboard from './pages/leaderboard/Leaderboard';
import Admin from './pages/admin/Admin';
import Battle from './pages/battle/Battle';
import Profile from './pages/profile/Profile';
import Auth from './pages/auth/Auth';
import Landing from './pages/landing/Landing';
import Videos from './pages/videos/Videos';
import Updates from './pages/updates/Updates';

const subjectLibrary = [
  { name: 'Mathematics', accent: '#00BBF9', gradient: 'from-[#00BBF9] to-[#006DFF]' },
  { name: 'English Language', accent: '#2EC4B6', gradient: 'from-[#2EC4B6] to-[#118A7E]' },
  { name: 'Biology', accent: '#00FF87', gradient: 'from-[#00FF87] to-[#0B8F52]' },
  { name: 'Chemistry', accent: '#9B5DE5', gradient: 'from-[#9B5DE5] to-[#5D2E91]' },
  { name: 'Physics', accent: '#FF6B35', gradient: 'from-[#FF6B35] to-[#F7931E]' },
  { name: 'Literature', accent: '#F15BB5', gradient: 'from-[#F15BB5] to-[#B5179E]' },
];

const slugify = (value: string) => value.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const professionalPageClass = 'min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top_left,rgba(255,107,53,0.10),transparent_34%),#0A0F1E] pb-36 text-white font-sans';
const professionalMainClass = 'mx-auto max-w-5xl space-y-7 px-4 py-6 sm:px-6 md:px-10 md:py-8 animate-fade-up';
const professionalBackButtonClass = 'inline-flex min-w-0 items-center gap-2 rounded-full border border-[rgba(255,255,255,0.08)] bg-[#111827]/90 px-4 py-2.5 font-sans text-sm font-bold text-[#FF8A66] shadow-[0_10px_30px_rgba(0,0,0,0.22)] transition hover:border-[#FF6B35]/50 hover:text-[#FF6B35]';

const normalizePath = (path: string) => {
  try {
    return new URL(path, window.location.origin).pathname || '/';
  } catch {
    return path.split('?')[0] || '/';
  }
};

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPath, setCurrentPath] = useState(() => normalizePath(window.location.pathname));
  const [streak, setStreak] = useState(0);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [weakTopicCount, setWeakTopicCount] = useState(0);
  const [profileExists, setProfileExists] = useState(false);
  const [latestUpdateTitle, setLatestUpdateTitle] = useState<string>('Check back soon');

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user || null);
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Load real stats from Supabase when user is available
  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    const loadStats = async () => {
      // Load profile (streak)
      const { data: profile } = await supabase
        .from('profiles')
        .select('streak, last_streak_date')
        .eq('id', user.id)
        .maybeSingle();

      if (cancelled) return;

      if (profile) {
        setProfileExists(true);
        setStreak(profile.streak ?? 0);

        // Check and update streak
        const today = new Date().toISOString().slice(0, 10);
        const lastDate = profile.last_streak_date;

        if (lastDate !== today) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().slice(0, 10);

          const newStreak = lastDate === yesterdayStr ? (profile.streak ?? 0) + 1 : 1;

          await supabase
            .from('profiles')
            .update({ streak: newStreak, last_streak_date: today })
            .eq('id', user.id);

          if (!cancelled) setStreak(newStreak);
        }
      }

      // Load performance stats (questions answered, accuracy)
      const { data: performance } = await supabase
        .from('student_performance')
        .select('questions_attempted, questions_correct, accuracy_percentage')
        .eq('user_id', user.id);

      if (cancelled) return;

      if (performance && performance.length > 0) {
        const totalAttempted = performance.reduce((sum, row) => sum + (Number(row.questions_attempted) || 0), 0);
        const totalCorrect = performance.reduce((sum, row) => sum + (Number(row.questions_correct) || 0), 0);
        const overallAccuracy = totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0;

        setQuestionsAnswered(totalAttempted);
        setAccuracy(overallAccuracy);

        // Count weak topics (accuracy < 50%)
        const weakTopics = performance.filter(row => {
          const acc = row.accuracy_percentage ?? (row.questions_attempted > 0 ? Math.round((row.questions_correct / row.questions_attempted) * 100) : 0);
          return acc < 50;
        });
        setWeakTopicCount(weakTopics.length);
      }
    };

    void loadStats();

    return () => { cancelled = true; };
  }, [user?.id]);

  // Load latest update title for Home card
  useEffect(() => {
    let cancelled = false;
    const loadLatest = async () => {
      const { data } = await supabase
        .from('updates')
        .select('title')
        .eq('status', 'published')
        .order('published_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!cancelled && data?.title) {
        setLatestUpdateTitle(data.title);
      }
    };
    void loadLatest();
    return () => { cancelled = true; };
  }, []);

  // Sync with browser navigation
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(normalizePath(window.location.pathname));
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleNavigate = useCallback((path: string, state?: Record<string, unknown>, options?: { replace?: boolean }) => {
    const normalizedPath = normalizePath(path);
    if (options?.replace) {
      window.history.replaceState(state || {}, '', path);
    } else {
      window.history.pushState(state || {}, '', path);
    }
    setCurrentPath(normalizedPath);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleOnboardingComplete = async (data: { displayName: string; username: string }) => {
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: data.displayName, username: data.username },
      });

      if (error) throw error;

      const { data: { user } } = await supabase.auth.getUser();
      setUser(user || null);
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      throw error;
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('Failed to sign out:', error);
    }
  };

  const renderBottomNavigation = () => (
    <BottomNavigation currentPath={currentPath} onNavigate={handleNavigate} />
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0F1E] text-white">
        <div className="text-center">
          <p className="text-lg">Loading your study space...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // Pre-auth routing: landing page or sign-in form
    const isSignInRoute = currentPath === '/signin';

    const handleSignedIn = async () => {
      // Re-fetch user from Supabase after sign-in
      try {
        const { data: { user: newUser } } = await supabase.auth.getUser();
        setUser(newUser || null);
        // Reset path to home so user lands on dashboard
        handleNavigate('/', {}, { replace: true });
      } catch (error) {
        console.error('Failed to refresh user after sign-in:', error);
      }
    };

    return (
      <ErrorBoundary>
        {isSignInRoute ? (
          <Auth
            onSignIn={handleSignedIn}
            onNavigateLanding={() => handleNavigate('/', {}, { replace: true })}
          />
        ) : (
          <Landing onNavigateSignIn={() => handleNavigate('/signin', {}, { replace: true })} />
        )}
      </ErrorBoundary>
    );
  }

  const isPracticeRoute = currentPath === '/practice' || currentPath === '/practice/subjects' || currentPath === '/practice/exam-type';
  const isPracticeConfigure = currentPath === '/practice/configure' || currentPath.startsWith('/practice/configure');
  const isPracticeSession = currentPath === '/practice/session' || currentPath.startsWith('/practice/session');
  const isPracticeResults = currentPath === '/practice/results' || currentPath.startsWith('/practice/results');
  const isPracticeReview = currentPath === '/practice/review';
  const isMockExam = currentPath.startsWith('/mock-exam/');

  return (
    <ErrorBoundary>
      <InstallPrompt />
      <div className="app min-h-screen bg-[#0A0F1E]">
        {/* Home Screen */}
        {(currentPath === '/' || currentPath === '/home' || currentPath === '/dashboard') && (
          <Home
            username={user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'}
            avatarInitial={(user.user_metadata?.full_name || user.email || 'U')[0].toUpperCase()}
            streak={streak}
            questionsAnswered={questionsAnswered}
            accuracy={accuracy}
            weakTopicCount={weakTopicCount}
            audiobookCurrentChapter={1}
            audiobookTotalChapters={12}
            latestUpdateTitle={latestUpdateTitle}
            onNavigate={handleNavigate}
            onOpenProfile={() => handleNavigate('/profile')}
            renderBottomNavigation={renderBottomNavigation}
          />
        )}

        {/* Practice Landing / Subject Selection / Exam Type */}
        {isPracticeRoute && (
          <PracticeFlow
            route={currentPath}
            navigatePath={handleNavigate}
            renderBottomNavigation={renderBottomNavigation}
          />
        )}

        {/* Practice Configure (question count selection) */}
        {isPracticeConfigure && (
          <div className="pb-36">
            <PracticeConfigure
              navigatePath={handleNavigate}
              renderBottomNavigation={renderBottomNavigation}
            />
          </div>
        )}

        {/* Practice Session (quiz) */}
        {isPracticeSession && (
          <div className="pb-36">
            <PracticeSession
              navigatePath={handleNavigate}
              renderBottomNavigation={renderBottomNavigation}
              user={user}
            />
          </div>
        )}

        {/* Practice Results */}
        {isPracticeResults && (
          <div className="pb-36">
            <PracticeResults
              navigatePath={handleNavigate}
              renderBottomNavigation={renderBottomNavigation}
              user={user}
            />
          </div>
        )}

        {/* Practice Review */}
        {isPracticeReview && (
          <div className="pb-36">
            <PracticeReview
              failedQuestions={((window.history.state || {}) as { failedPracticeQuestions?: unknown[] }).failedPracticeQuestions || []}
              navigatePath={handleNavigate}
            />
            {renderBottomNavigation()}
          </div>
        )}

        {/* Mock Exam - routes to PracticeConfigure for now */}
        {isMockExam && (
          <div className="pb-36">
            <PracticeConfigure
              navigatePath={handleNavigate}
              renderBottomNavigation={renderBottomNavigation}
            />
          </div>
        )}

        {/* Audiobook */}
        {currentPath === '/audiobook' && (
          <div className="pb-36">
            <Audiobook navigatePath={handleNavigate} user={user} />
            {renderBottomNavigation()}
          </div>
        )}

        {/* Weakness Assassin */}
        {currentPath === '/weakness' && (
          <div className="pb-36">
            <WeaknessAssassin
              user={user}
              navigatePath={handleNavigate}
              renderBottomNavigation={renderBottomNavigation}
            />
          </div>
        )}

        {/* Video Lessons */}
        {currentPath === '/videos' && (
          <div className="pb-36">
            <Videos
              navigatePath={handleNavigate}
              renderBottomNavigation={renderBottomNavigation}
            />
          </div>
        )}

        {/* Flashcards */}
        {(currentPath === '/flashcards' || currentPath.startsWith('/flashcards/')) && (
          <div className="pb-36">
            <Flashcards
              route={currentPath}
              user={user}
              navigatePath={handleNavigate}
              renderBottomNavigation={renderBottomNavigation}
              subjectLibrary={subjectLibrary}
              slugify={slugify}
              professionalPageClass={professionalPageClass}
              professionalMainClass={professionalMainClass}
              professionalBackButtonClass={professionalBackButtonClass}
              renderProfessionalHeader={(title: string, description: string, HeaderIcon: React.ElementType, accent?: string) => (
                <section className="rounded-[28px] border border-[#FF6B35]/20 bg-gradient-to-br from-[#1A1A2E] via-[#141827] to-[#111827] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.32)] sm:p-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]" style={{ backgroundColor: accent }}>
                      <HeaderIcon className="h-7 w-7" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-sans text-[11px] font-bold uppercase tracking-[0.28em] text-[#FFB199]">ExamReady</p>
                      <h1 className="mt-2 break-words font-heading text-2xl font-bold leading-tight text-white sm:text-3xl">{title}</h1>
                      <p className="mt-2 max-w-2xl font-sans text-sm font-normal leading-6 text-[#8B9CB8]">{description}</p>
                    </div>
                  </div>
                </section>
              )}
            />
          </div>
        )}

        {/* Leaderboard */}
        {currentPath === '/leaderboard' && (
          <Leaderboard currentPath={currentPath} onNavigate={handleNavigate} />
        )}

        {/* Admin */}
        {currentPath === '/admin' && (
          <Admin navigatePath={handleNavigate} user={user} />
        )}

        {/* Battle */}
        {currentPath === '/battle' && (
          <div className="pb-36">
            <Battle
              user={user}
              navigatePath={handleNavigate}
              renderBottomNavigation={renderBottomNavigation}
            />
          </div>
        )}

        {/* Profile */}
        {currentPath === '/profile' && (
          <div className="pb-36">
            <Profile
              user={user}
              navigatePath={handleNavigate}
              renderBottomNavigation={renderBottomNavigation}
              onSignOut={() => {
                handleSignOut();
                handleNavigate('/', {}, { replace: true });
              }}
            />
          </div>
        )}

        {/* Updates */}
        {(currentPath === '/updates' || currentPath.startsWith('/updates/')) && (
          <div className="pb-36">
            <Updates
              route={currentPath}
              navigatePath={handleNavigate}
              renderBottomNavigation={renderBottomNavigation}
            />
          </div>
        )}

        {/* 404 */}
        {![
          '/', '/home', '/dashboard',
          '/practice', '/practice/subjects', '/practice/exam-type',
          '/practice/configure', '/practice/session', '/practice/results', '/practice/review',
          '/audiobook', '/weakness', '/flashcards',
          '/battle', '/leaderboard', '/updates', '/admin', '/profile', '/signin', '/videos',
        ].includes(currentPath) && !currentPath.startsWith('/flashcards/') && !currentPath.startsWith('/mock-exam/') && !currentPath.startsWith('/practice/configure') && !currentPath.startsWith('/updates/') && (
          <div className="min-h-screen flex flex-col items-center justify-center pb-36 bg-[#0A0F1E] text-white">
            <p className="text-2xl mb-4">404 - Page Not Found</p>
            <button
              onClick={() => handleNavigate('/')}
              className="mt-4 px-4 py-2 bg-[#FF6B35] hover:bg-[#E85A25] rounded-lg transition"
            >
              Go Home
            </button>
            {renderBottomNavigation()}
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}

export default App;
