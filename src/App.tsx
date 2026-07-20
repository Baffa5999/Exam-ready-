/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import ErrorBoundary from './components/ErrorBoundary';
import BottomNavigation from './components/BottomNavigation';
import Onboarding from './components/Onboarding';
import InstallPrompt from './components/InstallPrompt';
import Home from './pages/home/Home';
import PracticeConfigure from './pages/practice/PracticeConfigure';
import PracticeReview from './pages/practice/PracticeReview';
import Audiobook from './pages/audiobook/Audiobook';
import WeaknessAssassin from './pages/weakness/WeaknessAssassin';
import Flashcards from './pages/flashcards/Flashcards';
import Admin from './pages/admin/Admin';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPath, setCurrentPath] = useState('/');

  useEffect(() => {
    // Initialize auth state
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

  const handleOnboardingComplete = async (data: {
    displayName: string;
    username: string;
  }) => {
    try {
      // Update user metadata in Supabase
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: data.displayName,
          username: data.username,
        }
      });

      if (error) throw error;

      // Refresh user state
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

  const handleNavigate = (path: string, state?: Record<string, unknown>) => {
    console.log('Navigating to:', path);
    setCurrentPath(path);
    // Scroll to top on navigation
    window.scrollTo(0, 0);
  };

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
    return (
      <ErrorBoundary>
        <Onboarding
          initialName={user?.user_metadata?.full_name || ''}
          onComplete={handleOnboardingComplete}
          onSignOut={handleSignOut}
        />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <InstallPrompt />
      <div className="app min-h-screen bg-[#0A0F1E]">
        {/* Home Screen */}
        {(currentPath === '/' || currentPath === '/home') && (
          <Home
            username={user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'}
            avatarInitial={(user.user_metadata?.full_name || user.email || 'U')[0].toUpperCase()}
            streak={0}
            questionsAnswered={0}
            accuracy={0}
            weakTopicCount={0}
            audiobookCurrentChapter={1}
            audiobookTotalChapters={12}
            latestUpdateTitle="Check back soon"
            onNavigate={handleNavigate}
            onOpenProfile={() => {
              console.log('Open profile');
            }}
            renderBottomNavigation={() => (
              <BottomNavigation currentPath={currentPath} onNavigate={handleNavigate} />
            )}
          />
        )}

        {/* Practice */}
        {(currentPath === '/practice' || currentPath.startsWith('/practice')) && (
          <div className="pb-36">
            <PracticeConfigure
              navigatePath={handleNavigate}
              renderBottomNavigation={() => (
                <BottomNavigation currentPath={currentPath} onNavigate={handleNavigate} />
              )}
            />
          </div>
        )}

        {/* Practice Review */}
        {currentPath === '/practice/review' && (
          <div className="pb-36">
            <PracticeReview
              failedQuestions={[]}
              navigatePath={handleNavigate}
            />
            <BottomNavigation currentPath={currentPath} onNavigate={handleNavigate} />
          </div>
        )}

        {/* Audiobook */}
        {currentPath === '/audiobook' && (
          <div className="pb-36">
            <Audiobook
              navigatePath={handleNavigate}
              user={user}
            />
            <BottomNavigation currentPath={currentPath} onNavigate={handleNavigate} />
          </div>
        )}

        {/* Weakness Assassin */}
        {currentPath === '/weakness' && (
          <div className="pb-36">
            <WeaknessAssassin
              user={user}
              navigatePath={handleNavigate}
              renderBottomNavigation={() => (
                <BottomNavigation currentPath={currentPath} onNavigate={handleNavigate} />
              )}
            />
          </div>
        )}

        {/* Flashcards */}
        {currentPath === '/flashcards' && (
          <div className="pb-36">
            <Flashcards
              route={currentPath}
              user={user}
              navigatePath={handleNavigate}
              renderBottomNavigation={() => (
                <BottomNavigation currentPath={currentPath} onNavigate={handleNavigate} />
              )}
              subjectLibrary={[
                { name: 'Mathematics', accent: '#FF6B35', gradient: 'from-[#FF6B35]/20' },
                { name: 'English', accent: '#2EC4B6', gradient: 'from-[#2EC4B6]/20' },
                { name: 'Physics', accent: '#10B981', gradient: 'from-[#10B981]/20' },
                { name: 'Chemistry', accent: '#F59E0B', gradient: 'from-[#F59E0B]/20' },
                { name: 'Biology', accent: '#06B6D4', gradient: 'from-[#06B6D4]/20' },
              ]}
              slugify={(name: string) => name.toLowerCase().replace(/\s+/g, '-')}
              professionalPageClass="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top_left,rgba(255,107,53,0.10),transparent_34%),#0A0F1E] pb-36 text-white font-sans"
              professionalMainClass="mx-auto max-w-4xl px-4 py-6 sm:px-6 md:px-10 md:py-8"
              professionalBackButtonClass="inline-flex min-w-0 items-center gap-2 rounded-full border border-[rgba(255,255,255,0.08)] bg-[#111827]/90 px-4 py-2.5 font-sans text-sm font-bold text-[#FF8A66] shadow-[0_10px_30px_rgba(0,0,0,0.22)] transition hover:border-[#FF6B35]/50 hover:text-[#FF6B35]"
              renderProfessionalHeader={(title: string, description: string, HeaderIcon: any, accent?: string) => (
                <div className="mt-8 text-center">
                  <div className="flex justify-center mb-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl" style={{ backgroundColor: `${accent || '#FF6B35'}1F`, color: accent || '#FF6B35' }}>
                      <HeaderIcon className="h-7 w-7" />
                    </div>
                  </div>
                  <h1 className="font-heading text-2xl font-bold text-white">{title}</h1>
                  <p className="mt-2 font-sans text-sm leading-6 text-[#8B9CB8]">{description}</p>
                </div>
              )}
            />
          </div>
        )}

        {/* Battle - Not Yet Built */}
        {currentPath === '/battle' && (
          <div className="min-h-screen flex flex-col items-center justify-center pb-36 bg-[#0A0F1E] text-white">
            <p className="text-2xl mb-4">⚔️ Battle</p>
            <p className="text-sm text-gray-400">(Not yet implemented)</p>
            <BottomNavigation currentPath={currentPath} onNavigate={handleNavigate} />
          </div>
        )}

        {/* Leaderboard - Not Yet Built */}
        {currentPath === '/leaderboard' && (
          <div className="min-h-screen flex flex-col items-center justify-center pb-36 bg-[#0A0F1E] text-white">
            <p className="text-2xl mb-4">🏆 Leaderboard</p>
            <p className="text-sm text-gray-400">(Not yet implemented)</p>
            <BottomNavigation currentPath={currentPath} onNavigate={handleNavigate} />
          </div>
        )}

        {/* Updates - Not Yet Built */}
        {currentPath === '/updates' && (
          <div className="min-h-screen flex flex-col items-center justify-center pb-36 bg-[#0A0F1E] text-white">
            <p className="text-2xl mb-4">📰 Updates</p>
            <p className="text-sm text-gray-400">(Not yet implemented)</p>
            <BottomNavigation currentPath={currentPath} onNavigate={handleNavigate} />
          </div>
        )}

        {/* 404 - Unknown Route */}
        {![
          '/',
          '/home',
          '/practice',
          '/practice/review',
          '/audiobook',
          '/weakness',
          '/flashcards',
          '/battle',
          '/leaderboard',
          '/updates'
        ].includes(currentPath) && (
          <div className="min-h-screen flex flex-col items-center justify-center pb-36 bg-[#0A0F1E] text-white">
            <p className="text-2xl mb-4">404 - Page Not Found</p>
            <button
              onClick={() => handleNavigate('/')}
              className="mt-4 px-4 py-2 bg-[#FF6B35] hover:bg-[#E85A25] rounded-lg transition"
            >
              Go Home
            </button>
            <BottomNavigation currentPath={currentPath} onNavigate={handleNavigate} />
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}

export default App;
