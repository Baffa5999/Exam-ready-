/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { 
  LogOut, 
  Flame, 
  CheckCircle, 
  Award, 
  BookOpen, 
  Users, 
  Trophy, 
  ChevronRight, 
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Timer,
  BookMarked,
  Copy,
  Loader2,
  MessageCircle,
  Newspaper,
  Target,
  ArrowRight,
  Sparkles,
  RefreshCw,
  FileText,
  Eye,
  EyeOff,
  Mail,
  Home,
  PenLine,
  Swords,
  Crosshair,
  Layers,
  UsersRound,
  CircleDotDashed,
  Headphones,
  User as UserIcon
} from 'lucide-react';
import ErrorBoundary from './components/ErrorBoundary';
import Onboarding from './components/Onboarding';
import InstallPrompt from './components/InstallPrompt';
import WeaknessAssassin from './pages/weakness/WeaknessAssassin';
import PracticeConfigure from './pages/practice/PracticeConfigure';
import PracticeReview from './pages/practice/PracticeReview';
import Audiobook from './pages/audiobook/Audiobook';
import Admin from './pages/admin/Admin';
import Flashcards from './pages/flashcards/Flashcards';
import Home from './pages/home/Home';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize auth state
    const initializeAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user || null);
      setLoading(false);
    };

    initializeAuth();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Onboarding />;
  }

  return (
    <ErrorBoundary>
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
