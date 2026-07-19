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
    <div className="app">
      <Home />
    </div>
  );
}

export default App;
