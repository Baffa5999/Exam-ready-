/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import ErrorBoundary from './components/ErrorBoundary';
import Onboarding from './components/Onboarding';
import InstallPrompt from './components/InstallPrompt';
import Home from './pages/home/Home';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

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
      <div className="app">
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
          onNavigate={(path) => {
            console.log('Navigate to:', path);
          }}
          onOpenProfile={() => {
            console.log('Open profile');
          }}
          renderBottomNavigation={() => <div />}
        />
      </div>
    </ErrorBoundary>
  );
}

export default App;
