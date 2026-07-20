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

  const handleNavigate = (path: string) => {
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
        {/* Render Home screen */}
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

        {/* Placeholder screens for other pages */}
        {currentPath === '/practice' && (
          <div className="min-h-screen flex flex-col items-center justify-center pb-36 bg-[#0A0F1E] text-white">
            <p className="text-2xl mb-4">Practice Page</p>
            <p className="text-sm text-gray-400">(To be implemented)</p>
            <BottomNavigation currentPath={currentPath} onNavigate={handleNavigate} />
          </div>
        )}

        {currentPath === '/flashcards' && (
          <div className="min-h-screen flex flex-col items-center justify-center pb-36 bg-[#0A0F1E] text-white">
            <p className="text-2xl mb-4">Flashcards Page</p>
            <p className="text-sm text-gray-400">(To be implemented)</p>
            <BottomNavigation currentPath={currentPath} onNavigate={handleNavigate} />
          </div>
        )}

        {currentPath === '/battle' && (
          <div className="min-h-screen flex flex-col items-center justify-center pb-36 bg-[#0A0F1E] text-white">
            <p className="text-2xl mb-4">Battle Page</p>
            <p className="text-sm text-gray-400">(To be implemented)</p>
            <BottomNavigation currentPath={currentPath} onNavigate={handleNavigate} />
          </div>
        )}

        {currentPath === '/leaderboard' && (
          <div className="min-h-screen flex flex-col items-center justify-center pb-36 bg-[#0A0F1E] text-white">
            <p className="text-2xl mb-4">Leaderboard Page</p>
            <p className="text-sm text-gray-400">(To be implemented)</p>
            <BottomNavigation currentPath={currentPath} onNavigate={handleNavigate} />
          </div>
        )}

        {currentPath === '/audiobook' && (
          <div className="min-h-screen flex flex-col items-center justify-center pb-36 bg-[#0A0F1E] text-white">
            <p className="text-2xl mb-4">Audiobook Page</p>
            <p className="text-sm text-gray-400">(To be implemented)</p>
            <BottomNavigation currentPath={currentPath} onNavigate={handleNavigate} />
          </div>
        )}

        {currentPath === '/weakness' && (
          <div className="min-h-screen flex flex-col items-center justify-center pb-36 bg-[#0A0F1E] text-white">
            <p className="text-2xl mb-4">Weakness Assassin Page</p>
            <p className="text-sm text-gray-400">(To be implemented)</p>
            <BottomNavigation currentPath={currentPath} onNavigate={handleNavigate} />
          </div>
        )}

        {currentPath === '/updates' && (
          <div className="min-h-screen flex flex-col items-center justify-center pb-36 bg-[#0A0F1E] text-white">
            <p className="text-2xl mb-4">Updates Page</p>
            <p className="text-sm text-gray-400">(To be implemented)</p>
            <BottomNavigation currentPath={currentPath} onNavigate={handleNavigate} />
          </div>
        )}

        {/* Show 404 if path not recognized */}
        {![
          '/',
          '/home',
          '/practice',
          '/flashcards',
          '/battle',
          '/leaderboard',
          '/audiobook',
          '/weakness',
          '/updates'
        ].includes(currentPath) && (
          <div className="min-h-screen flex flex-col items-center justify-center pb-36 bg-[#0A0F1E] text-white">
            <p className="text-2xl mb-4">Page Not Found</p>
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
