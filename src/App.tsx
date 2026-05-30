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
  Zap, 
  ChevronRight, 
  Target,
  ArrowRight,
  Sparkles,
  RefreshCw,
  FileText,
  Eye,
  EyeOff
} from 'lucide-react';
import Onboarding from './components/Onboarding';

// Fonts link inside styles
const fontStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;700&display=swap');
`;

// Student profile interface
interface StudentProfile {
  uid: string;
  displayName: string;
  email: string;
  examType: 'JAMB' | 'WAEC' | 'NECO';
  targetScore: string | number;
  streak: number;
  questionsPracticed: number;
  accuracy: number;
  createdAt: string;
  updatedAt: string;
  isOnboarded?: boolean;
  selectedExams?: ('JAMB' | 'WAEC' | 'NECO')[];
  subjects?: Record<string, string[]>;
  targetScores?: Record<string, string | number>;
  fullName?: string;
  examTypes?: ('JAMB' | 'WAEC' | 'NECO')[];
  subjectList?: string[];
  targetScoreSummary?: string | number;
  profileExists?: boolean;
}

type AppView = 'landing' | 'signin' | 'onboarding' | 'dashboard';

const viewToPath: Record<AppView, string> = {
  landing: '/',
  signin: '/signin',
  onboarding: '/onboarding',
  dashboard: '/dashboard'
};

function pathToView(pathname: string): AppView {
  if (pathname === '/signin') return 'signin';
  if (pathname === '/onboarding') return 'onboarding';
  if (pathname === '/dashboard') return 'dashboard';
  return 'landing';
}

export default function App() {
  const [view, setView] = useState<AppView>(() => pathToView(window.location.pathname));
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authReady, setAuthReady] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [practiceActive, setPracticeActive] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [authForm, setAuthForm] = useState({ fullName: '', email: '', password: '', confirmPassword: '' });
  const [authErrors, setAuthErrors] = useState<Partial<Record<'fullName' | 'email' | 'password' | 'confirmPassword' | 'general', string>>>({});
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [pendingConfirmationEmail, setPendingConfirmationEmail] = useState<string>('');

  const navigateTo = (nextView: AppView, options: { replace?: boolean } = {}) => {
    const nextPath = viewToPath[nextView];
    if (window.location.pathname !== nextPath) {
      if (options.replace) {
        window.history.replaceState({}, '', nextPath);
      } else {
        window.history.pushState({}, '', nextPath);
      }
    }
    setView(nextView);
  };
  
  // Quiz states
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [showQuiz, setShowQuiz] = useState<boolean>(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answered, setAnswered] = useState<boolean>(false);

  // Keep the in-app view synchronized with browser navigation.
  useEffect(() => {
    const handlePopState = () => {
      setView(pathToView(window.location.pathname));
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Monitor Supabase authentication and load the matching profile, if one exists.
  useEffect(() => {
    let isMounted = true;

    const handleAuthenticatedUser = async (user: User) => {
      setCurrentUser(user);
      await fetchOrInitializeProfile(user);
    };

    const initializeSession = async () => {
      setLoading(true);
      const { data, error } = await supabase.auth.getSession();

      if (!isMounted) return;

      if (error) {
        console.error('Supabase session lookup failed:', error);
        showBanner('error', 'Unable to restore your session. Please sign in again.');
        setCurrentUser(null);
        setStudentProfile(null);
      } else if (data.session?.user) {
        await handleAuthenticatedUser(data.session.user);
      } else {
        setCurrentUser(null);
        setStudentProfile(null);
      }

      if (isMounted) {
        setLoading(false);
        setAuthReady(true);
      }
    };

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;

      window.setTimeout(async () => {
        if (!isMounted) return;

        setLoading(true);
        if (session?.user) {
          await handleAuthenticatedUser(session.user);
        } else {
          setCurrentUser(null);
          setStudentProfile(null);
        }
        if (isMounted) {
          setLoading(false);
          setAuthReady(true);
        }
      }, 0);
    });

    initializeSession();

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Show dynamic banner messages
  const showBanner = (type: 'success' | 'error', text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => {
      setStatusMessage(null);
    }, 5000);
  };

  // Enforce route guards for all public and protected routes.
  useEffect(() => {
    if (!authReady) return;

    const isPublicRoute = view === 'landing' || view === 'signin';
    const isProtectedRoute = view === 'onboarding' || view === 'dashboard';

    if (!currentUser) {
      if (isProtectedRoute) {
        navigateTo('landing', { replace: true });
      }
      return;
    }

    if (!studentProfile) return;

    const hasSupabaseProfile = studentProfile.profileExists === true;
    const intendedSignedInView = hasSupabaseProfile ? 'dashboard' : 'onboarding';

    if (isPublicRoute) {
      navigateTo(intendedSignedInView, { replace: true });
      return;
    }

    if (view === 'dashboard' && !hasSupabaseProfile) {
      navigateTo('onboarding', { replace: true });
      return;
    }

    if (view === 'onboarding' && hasSupabaseProfile) {
      navigateTo('dashboard', { replace: true });
    }
  }, [authReady, currentUser, studentProfile, view]);

  const buildProfileFromSupabase = (user: User, data: Record<string, any>): StudentProfile => {
    const createdAt = data.created_at || data.createdAt || new Date().toISOString();
    const updatedAt = data.updated_at || data.updatedAt || createdAt;
    const selectedExams = data.exam_types || data.selected_exams || data.selectedExams || [];
    const targetScores = data.target_scores || data.targetScores || {};
    const subjects = data.subjects || {};
    const subjectList = Array.isArray(subjects)
      ? subjects
      : Object.values(subjects).flatMap(value => Array.isArray(value) ? value : []);

    return {
      uid: data.id || data.uid || user.id,
      displayName: data.full_name || data.display_name || data.displayName || user.user_metadata?.full_name || user.email || 'Nigerian Student',
      email: data.email || user.email || '',
      examType: data.exam_type || data.examType || selectedExams[0] || 'JAMB',
      targetScore: data.target_score || data.targetScore || targetScores.JAMB || 280,
      streak: data.streak || 1,
      questionsPracticed: data.questions_practiced || data.questionsPracticed || 0,
      accuracy: data.accuracy || 70,
      createdAt,
      updatedAt,
      isOnboarded: data.is_onboarded ?? data.isOnboarded ?? true,
      selectedExams,
      subjects: Array.isArray(subjects) ? {} : subjects,
      targetScores,
      fullName: data.full_name || data.display_name || data.displayName || user.user_metadata?.full_name || user.email || 'Nigerian Student',
      examTypes: selectedExams,
      subjectList,
      targetScoreSummary: data.target_score || data.targetScore || targetScores.JAMB || targetScores.WAEC || targetScores.NECO || '',
      profileExists: true
    };
  };

  const sendUserToOnboarding = (user: User) => {
    // A missing or unreadable profile means this is still an onboarding flow, not a user-facing error.
    setStatusMessage(null);
    const now = new Date().toISOString();
    setStudentProfile({
      uid: user.id,
      displayName: user.user_metadata?.full_name || user.email || 'Nigerian Student',
      email: user.email || '',
      examType: 'JAMB',
      targetScore: 280,
      streak: 1,
      questionsPracticed: 0,
      accuracy: 70,
      createdAt: now,
      updatedAt: now,
      isOnboarded: false,
      selectedExams: [],
      subjects: {},
      targetScores: {},
      fullName: user.user_metadata?.full_name || user.email || 'Nigerian Student',
      examTypes: [],
      subjectList: [],
      targetScoreSummary: '',
      profileExists: false
    });
    navigateTo('onboarding', { replace: true });
  };

  // Load the signed-in user's Supabase profile and route them to onboarding when none exists.
  const fetchOrInitializeProfile = async (user: User) => {
    setStatusMessage(null);

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      console.info('Supabase profile was not available, continuing with onboarding:', error);
      sendUserToOnboarding(user);
      return;
    }

    if (data) {
      const profile = buildProfileFromSupabase(user, data);
      setStudentProfile(profile);
      navigateTo('dashboard', { replace: true });
      return;
    }

    sendUserToOnboarding(user);
  };

  // Saved answers handler from premium onboarding screen.
  const handleOnboardingComplete = async (onboardingData: {
    displayName: string;
    selectedExams: ('JAMB' | 'WAEC' | 'NECO')[];
    subjects: Record<string, string[]>;
    targetScores: Record<string, string | number>;
  }) => {
    if (!currentUser || !studentProfile) return;

    // Primary default exam/score for backward compatibility
    const primaryExam = onboardingData.selectedExams[0] || 'JAMB';
    const primaryTargetScore = onboardingData.targetScores[primaryExam] || (primaryExam === 'JAMB' ? 280 : 'B2');
    const subjectList = [...new Set(Object.values(onboardingData.subjects).flat())];
    const targetScoreSummary = primaryTargetScore;
    const updatedAt = new Date().toISOString();

    const updates = {
      id: currentUser.id,
      full_name: onboardingData.displayName,
      display_name: onboardingData.displayName,
      email: currentUser.email || '',
      exam_type: primaryExam,
      exam_types: onboardingData.selectedExams,
      target_score: targetScoreSummary,
      is_onboarded: true,
      selected_exams: onboardingData.selectedExams,
      subjects: subjectList,
      target_scores: onboardingData.targetScores,
      streak: studentProfile.streak,
      questions_practiced: studentProfile.questionsPracticed,
      accuracy: studentProfile.accuracy,
      created_at: studentProfile.createdAt,
      updated_at: updatedAt
    };

    const { error } = await supabase
      .from('profiles')
      .upsert(updates, { onConflict: 'id' });

    if (error) {
      console.error('Supabase profile save failed:', error);
      throw new Error('Failed saving onboarding answers to Supabase.');
    }

    setStudentProfile(prev => prev ? {
      ...prev,
      displayName: onboardingData.displayName,
      email: currentUser.email || prev.email,
      examType: primaryExam,
      targetScore: primaryTargetScore,
      isOnboarded: true,
      selectedExams: onboardingData.selectedExams,
      subjects: onboardingData.subjects,
      targetScores: onboardingData.targetScores,
      fullName: onboardingData.displayName,
      examTypes: onboardingData.selectedExams,
      subjectList,
      targetScoreSummary,
      updatedAt,
      profileExists: true
    } : null);

    navigateTo('dashboard', { replace: true });
    showBanner('success', '🏆 Academy account set up successfully! Welcome!');
  };

  // Update target exam & related default score goals.
  const handleUpdateExam = async (exam: 'JAMB' | 'WAEC' | 'NECO') => {
    if (!currentUser || !studentProfile) return;
    // JAMB target score generally 200-400, WAEC/NECO are aggregates / grades (A1/B2)
    const targetScore = exam === 'JAMB' ? 280 : 85; 
    const updatedAt = new Date().toISOString();

    const { error } = await supabase
      .from('profiles')
      .update({
        exam_type: exam,
        target_score: targetScore,
        updated_at: updatedAt
      })
      .eq('id', currentUser.id);

    if (error) {
      console.error('Supabase exam update failed:', error);
      showBanner('error', 'Failed updating profile in Supabase.');
      return;
    }

    setStudentProfile(prev => prev ? { 
      ...prev, 
      examType: exam, 
      targetScore, 
      updatedAt
    } : null);
    showBanner('success', `🎯 Goal changed to ${exam} 2026. Keep Studying!`);
  };

  // Handle mock study sessions.
  const handleSimulatePractice = async () => {
    if (!currentUser || !studentProfile) return;
    
    // Simulate updating study telemetry.
    const newQuestions = studentProfile.questionsPracticed + 15;
    const newStreak = studentProfile.streak + (Math.random() > 0.7 ? 1 : 0);
    const newAccuracy = Math.min(100, Math.max(50, studentProfile.accuracy + (Math.random() > 0.5 ? 2 : -1)));
    const updatedAt = new Date().toISOString();

    const { error } = await supabase
      .from('profiles')
      .update({
        questions_practiced: newQuestions,
        streak: newStreak,
        accuracy: newAccuracy,
        updated_at: updatedAt
      })
      .eq('id', currentUser.id);

    if (error) {
      console.error('Supabase practice metrics update failed:', error);
      showBanner('error', 'Failed updating practice metrics in Supabase.');
      return;
    }

    setStudentProfile(prev => prev ? {
      ...prev,
      questionsPracticed: newQuestions,
      streak: newStreak,
      accuracy: newAccuracy,
      updatedAt
    } : null);
    
    showBanner('success', '🔥 Study session saved! 15 syllabus questions completed.');
  };

  const resetAuthFormMessages = () => {
    setAuthErrors({});
    setStatusMessage(null);
  };

  const resetAuthConfirmation = () => {
    setPendingConfirmationEmail('');
    resetAuthFormMessages();
  };

  const updateAuthField = (field: keyof typeof authForm, value: string) => {
    setAuthForm(prev => ({ ...prev, [field]: value }));
    setAuthErrors(prev => ({ ...prev, [field]: undefined, general: undefined }));
  };

  const getPasswordStrength = () => {
    if (!authForm.password) return null;
    if (authForm.password.length < 6) return { label: 'Weak', className: 'text-red-400 bg-red-500' };
    if (authForm.password.length >= 10 && /[A-Za-z]/.test(authForm.password) && /\d/.test(authForm.password)) {
      return { label: 'Strong', className: 'text-emerald-400 bg-emerald-500' };
    }
    return { label: 'Fair', className: 'text-[#FF6B35] bg-[#FF6B35]' };
  };

  const mapSignInError = (message: string) => {
    const normalized = message.toLowerCase();
    if (normalized.includes('not found') || normalized.includes('user not found')) {
      setAuthErrors({ email: 'No account found with this email.' });
      return;
    }
    if (normalized.includes('invalid') || normalized.includes('credentials') || normalized.includes('password')) {
      setAuthErrors({ password: 'Incorrect password. Please try again.' });
      return;
    }
    setAuthErrors({ general: message || 'Unable to sign in. Please try again.' });
  };

  const mapSignUpError = (message: string) => {
    const normalized = message.toLowerCase();
    if (normalized.includes('registered') || normalized.includes('already') || normalized.includes('exists')) {
      setAuthErrors({ email: 'An account with this email already exists. Sign in instead.' });
      return;
    }
    if (normalized.includes('password')) {
      setAuthErrors({ password: 'Password must be at least 6 characters.' });
      return;
    }
    setAuthErrors({ general: message || 'Unable to create your account. Please try again.' });
  };

  const handleEmailSignIn = async () => {
    resetAuthFormMessages();
    const email = authForm.email.trim();

    if (!email) {
      setAuthErrors({ email: 'Enter your email.' });
      return;
    }
    if (!authForm.password) {
      setAuthErrors({ password: 'Enter your password.' });
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: authForm.password
    });

    if (error) {
      if (error.message.toLowerCase().includes('email not confirmed')) {
        setPendingConfirmationEmail(email);
      } else {
        mapSignInError(error.message);
      }
      setLoading(false);
      return;
    }

    if (data.user) {
      setCurrentUser(data.user);
      await fetchOrInitializeProfile(data.user);
    }
    setLoading(false);
  };

  const handleEmailSignUp = async () => {
    resetAuthFormMessages();
    const fullName = authForm.fullName.trim();
    const email = authForm.email.trim();

    if (!fullName) {
      setAuthErrors({ fullName: 'Enter your full name.' });
      return;
    }
    if (!email) {
      setAuthErrors({ email: 'Enter your email.' });
      return;
    }
    if (authForm.password.length < 6) {
      setAuthErrors({ password: 'Password must be at least 6 characters.' });
      return;
    }
    if (authForm.password !== authForm.confirmPassword) {
      setAuthErrors({ confirmPassword: 'Passwords do not match.' });
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password: authForm.password,
      options: {
        emailRedirectTo: `${window.location.origin}/onboarding`,
        data: {
          full_name: fullName,
          display_name: fullName
        }
      }
    });

    if (error) {
      mapSignUpError(error.message);
      setLoading(false);
      return;
    }

    if (data.user && data.user.identities && data.user.identities.length === 0) {
      setAuthErrors({ email: 'An account with this email already exists. Sign in instead.' });
      setLoading(false);
      return;
    }

    if (data.session?.user) {
      setCurrentUser(data.session.user);
      sendUserToOnboarding(data.session.user);
    } else {
      setPendingConfirmationEmail(email);
      setAuthForm({ fullName: '', email, password: '', confirmPassword: '' });
    }

    setLoading(false);
  };

  const handleResendConfirmationEmail = async () => {
    if (!pendingConfirmationEmail) return;

    resetAuthFormMessages();
    setLoading(true);
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: pendingConfirmationEmail,
      options: {
        emailRedirectTo: `${window.location.origin}/onboarding`
      }
    });

    if (error) {
      console.error('Supabase confirmation resend failed:', error);
      setAuthErrors({ general: 'Unable to resend the confirmation email. Please try again.' });
      setLoading(false);
      return;
    }

    showBanner('success', 'Confirmation email sent again. Please check your inbox.');
    setLoading(false);
  };

  const handleSignOut = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Supabase sign out failed:', error);
      showBanner('error', 'Failed signing out.');
      setLoading(false);
      return;
    }

    setCurrentUser(null);
    setStudentProfile(null);
    navigateTo('landing', { replace: true });
    showBanner('success', 'Logged out successfully. Good luck studying!');
    setLoading(false);
  };

  // Staggered mock question helper
  const handleAnswerQuestion = (index: number) => {
    setSelectedAnswer(index);
    setAnswered(true);
    if (index === 2) { // correct answer (Alkanes / Single bonds)
      setQuizScore(1);
    } else {
      setQuizScore(0);
    }
  };

  const handleResetQuiz = () => {
    setSelectedAnswer(null);
    setAnswered(false);
    setQuizScore(null);
  };

  if (!authReady && loading) {
    return (
      <div className="min-h-screen bg-[#0A0F1E] text-white font-sans flex items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-[#8B9CB8]">
          <RefreshCw className="w-5 h-5 text-[#FF6B35] animate-spin" />
          Preparing your ExamReady session...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0F1E] text-[#FFFFFF] font-sans overflow-x-hidden relative">
      {/* Inject custom font styles */}
      <style>{fontStyles}</style>

      {/* STICKY STATUS BANNER NOTIFICATIONS */}
      {statusMessage && (
        <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-xl border font-sans text-sm flex items-center gap-2 shadow-2xl transition-all duration-300 ${
          statusMessage.type === 'success' 
            ? 'bg-[#111827] border-emerald-500/30 text-emerald-400' 
            : 'bg-[#111827] border-red-500/30 text-red-400'
        }`}>
          <div className={`w-2 h-2 rounded-full ${statusMessage.type === 'success' ? 'bg-emerald-400' : 'bg-red-400'}`} />
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* SCREEN ROUTER */}

      {/* SIGN IN VIEW */}
      {view === 'signin' && (
        <div className="min-h-screen flex items-center justify-center relative bg-[#0A0F1E] px-4 py-10">
          <div className="absolute w-[520px] h-[520px] rounded-full bg-[radial-gradient(rgba(255,107,53,0.18),transparent_70%)] blur-3xl pointer-events-none z-0" />

          <div className="w-full max-w-md bg-[#111827]/95 border border-white/10 rounded-[28px] p-8 md:p-10 shadow-[0_45px_100px_rgba(0,0,0,0.7),0_0_85px_rgba(255,107,53,0.08)] relative z-10 animate-fade-up">
            <div className="text-center mb-8">
              <span className="font-heading font-extrabold text-[28px] tracking-tight text-white">
                Exam<span className="text-[#FF6B35]">Ready</span>
              </span>
            </div>

            {pendingConfirmationEmail ? (
              <div className="text-center py-4">
                <div className="mb-5 text-6xl" aria-hidden="true">📧</div>
                <h2 className="font-heading font-extrabold text-3xl text-white tracking-tight mb-3">
                  Check your email
                </h2>
                <p className="font-sans text-sm leading-6 text-[#8B9CB8]">
                  We sent a confirmation link to <span className="font-semibold text-white">{pendingConfirmationEmail}</span>. Click the link to activate your account and get started.
                </p>
                <p className="mt-5 font-sans text-xs leading-5 text-[#8B9CB8]">
                  Did not receive it? Check your spam folder or click Resend Email.
                </p>
                {authErrors.general && <p className="mt-4 text-sm text-red-400">{authErrors.general}</p>}
                <button
                  type="button"
                  onClick={handleResendConfirmationEmail}
                  disabled={loading}
                  className="mt-6 w-full rounded-2xl bg-[#FF6B35] px-6 py-4 font-sans text-sm font-bold text-white transition hover:bg-[#ff7c4d] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? 'Sending...' : 'Resend Email'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signin');
                    resetAuthConfirmation();
                  }}
                  className="mt-4 font-sans text-xs font-semibold text-[#FF6B35] hover:text-[#ff7c4d]"
                >
                  Back to Sign In
                </button>
              </div>
            ) : (
              <>
            <div className="grid grid-cols-2 gap-4 mb-8 border-b border-white/10">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signin');
                  resetAuthConfirmation();
                }}
                className={`pb-3 font-heading text-sm font-bold transition-colors border-b-2 ${authMode === 'signin' ? 'border-[#FF6B35] text-white' : 'border-transparent text-[#8B9CB8] hover:text-white'}`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signup');
                  resetAuthConfirmation();
                }}
                className={`pb-3 font-heading text-sm font-bold transition-colors border-b-2 ${authMode === 'signup' ? 'border-[#FF6B35] text-white' : 'border-transparent text-[#8B9CB8] hover:text-white'}`}
              >
                Sign Up
              </button>
            </div>

            <div className="text-center mb-8">
              <h2 className="font-heading font-extrabold text-2xl md:text-3xl text-white tracking-tight mb-2">
                {authMode === 'signin' ? 'Welcome Back' : 'Create Account'}
              </h2>
              <p className="font-sans text-sm text-[#8B9CB8] max-w-xs mx-auto">
                {authMode === 'signin'
                  ? 'Sign in to continue your preparation.'
                  : 'Join thousands of students preparing for JAMB, WAEC and NECO.'}
              </p>
            </div>

            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                if (authMode === 'signin') {
                  handleEmailSignIn();
                } else {
                  handleEmailSignUp();
                }
              }}
            >
              {authMode === 'signup' && (
                <div>
                  <input
                    type="text"
                    value={authForm.fullName}
                    onChange={(event) => updateAuthField('fullName', event.target.value)}
                    placeholder="Enter your full name"
                    className="w-full rounded-2xl border border-white/10 bg-[#111827] px-5 py-4 font-sans text-sm text-white outline-none transition-all placeholder:text-slate-500 focus:border-[#FF6B35] focus:shadow-[0_0_0_4px_rgba(255,107,53,0.15),0_0_28px_rgba(255,107,53,0.18)]"
                  />
                  {authErrors.fullName && <p className="mt-2 text-xs text-red-400">{authErrors.fullName}</p>}
                </div>
              )}

              <div>
                <input
                  type="email"
                  value={authForm.email}
                  onChange={(event) => updateAuthField('email', event.target.value)}
                  placeholder="Enter your email"
                  className="w-full rounded-2xl border border-white/10 bg-[#111827] px-5 py-4 font-sans text-sm text-white outline-none transition-all placeholder:text-slate-500 focus:border-[#FF6B35] focus:shadow-[0_0_0_4px_rgba(255,107,53,0.15),0_0_28px_rgba(255,107,53,0.18)]"
                />
                {authErrors.email && <p className="mt-2 text-xs text-red-400">{authErrors.email}</p>}
              </div>

              <div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={authForm.password}
                    onChange={(event) => updateAuthField('password', event.target.value)}
                    placeholder={authMode === 'signin' ? 'Enter your password' : 'Create a password'}
                    className="w-full rounded-2xl border border-white/10 bg-[#111827] px-5 py-4 pr-12 font-sans text-sm text-white outline-none transition-all placeholder:text-slate-500 focus:border-[#FF6B35] focus:shadow-[0_0_0_4px_rgba(255,107,53,0.15),0_0_28px_rgba(255,107,53,0.18)]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => !prev)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8B9CB8] hover:text-[#FF6B35]"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {authErrors.password && <p className="mt-2 text-xs text-red-400">{authErrors.password}</p>}

                {authMode === 'signin' ? (
                  <div className="mt-2 text-right">
                    <button type="button" className="font-sans text-xs font-semibold text-[#FF6B35] hover:text-[#ff7c4d]">
                      Forgot password?
                    </button>
                  </div>
                ) : (
                  authForm.password && (() => {
                    const strength = getPasswordStrength();
                    return strength ? (
                      <div className="mt-3">
                        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                          <div className={`h-full rounded-full ${strength.className.split(' ')[1]} ${strength.label === 'Weak' ? 'w-1/3' : strength.label === 'Fair' ? 'w-2/3' : 'w-full'}`} />
                        </div>
                        <p className={`mt-1 text-xs font-semibold ${strength.className.split(' ')[0]}`}>{strength.label}</p>
                      </div>
                    ) : null;
                  })()
                )}
              </div>

              {authMode === 'signup' && (
                <div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={authForm.confirmPassword}
                    onChange={(event) => updateAuthField('confirmPassword', event.target.value)}
                    placeholder="Confirm your password"
                    className="w-full rounded-2xl border border-white/10 bg-[#111827] px-5 py-4 font-sans text-sm text-white outline-none transition-all placeholder:text-slate-500 focus:border-[#FF6B35] focus:shadow-[0_0_0_4px_rgba(255,107,53,0.15),0_0_28px_rgba(255,107,53,0.18)]"
                  />
                  {authErrors.confirmPassword && <p className="mt-2 text-xs text-red-400">{authErrors.confirmPassword}</p>}
                </div>
              )}

              {authErrors.general && <p className="text-sm text-red-400">{authErrors.general}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-[#FF6B35] px-6 py-4 font-sans text-sm font-bold text-white transition hover:bg-[#ff7c4d] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Please wait...' : authMode === 'signin' ? 'Sign In' : 'Create Account'}
              </button>
            </form>

            <p className="mt-6 text-center font-sans text-sm text-[#8B9CB8]">
              {authMode === 'signin' ? "Don't have an account " : 'Already have an account '}
              <button
                type="button"
                onClick={() => {
                  setAuthMode(authMode === 'signin' ? 'signup' : 'signin');
                  resetAuthConfirmation();
                }}
                className="font-semibold text-[#FF6B35] hover:text-[#ff7c4d]"
              >
                {authMode === 'signin' ? 'Create one' : 'Sign In'}
              </button>
            </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* STUDENT DASHBOARD INTERFACE */}
      {view === 'dashboard' && studentProfile && (
        <div className="min-h-screen bg-[#0A0F1E] text-white font-sans flex flex-col">
          <nav className="h-20 px-6 md:px-12 flex items-center justify-between border-b border-white/10 bg-[#0A0F1E]/95 backdrop-blur-md">
            <span className="font-heading font-extrabold text-2xl tracking-tight text-white">
              Exam<span className="text-[#FF6B35]">Ready</span>
            </span>
            <button
              onClick={handleSignOut}
              className="rounded-full border border-white/10 px-4 py-2 text-sm text-[#8B9CB8] transition hover:border-[#FF6B35]/50 hover:text-[#FF6B35]"
            >
              Sign Out
            </button>
          </nav>

          <main className="flex flex-1 items-center justify-center px-6 py-16">
            <section className="w-full max-w-2xl text-center">
              <h1 className="font-heading text-4xl md:text-6xl font-extrabold tracking-tight text-white">
                Welcome to ExamReady
              </h1>
              <p className="mt-5 font-sans text-base md:text-lg text-[#8B9CB8]">
                Your dashboard is being built. Check back soon.
              </p>

              <div className="mx-auto mt-10 flex h-28 w-28 items-center justify-center rounded-full bg-[#FF6B35] font-heading text-5xl font-extrabold text-white shadow-[0_24px_60px_rgba(255,107,53,0.35)]">
                {(studentProfile.displayName || studentProfile.email || 'E').charAt(0).toUpperCase()}
              </div>

              <p className="mt-5 font-sans text-sm text-[#8B9CB8]">
                {studentProfile.email}
              </p>
            </section>
          </main>
        </div>
      )}

      {/* ONBOARDING FLOW */}
      {view === 'onboarding' && studentProfile && (
        <Onboarding
          initialName={currentUser?.displayName || studentProfile.displayName || ''}
          onComplete={handleOnboardingComplete}
          onSignOut={handleSignOut}
        />
      )}


      {/* PUBLIC VISITOR LANDING EXPERIENCE */}
      {view === 'landing' && (
        <div className="animate-fade-up">

          {/* SECTION 1: NAVBAR */}
          <nav id="navbar" className="fixed top-0 left-0 right-0 h-20 bg-[rgba(10,15,30,0.95)] backdrop-blur-md border-b border-[rgba(255,255,255,0.06)] z-50 flex items-center justify-between px-6 md:px-12">
            {/* Left Side: Logo */}
            <div className="flex items-center">
              <span className="font-heading font-bold text-[22px] tracking-tight">
                Exam<span className="text-[#FF6B35]">Ready</span>
              </span>
            </div>

            {/* Right Side: Sign In Button */}
            <div>
              <button 
                id="signin-btn"
                onClick={() => navigateTo('signin')}
                className="border border-[rgba(255,107,53,0.4)] text-[#FF6B35] font-sans font-medium text-sm rounded-full py-2 px-5 transition-all duration-300 hover:bg-[#FF6B35] hover:text-white cursor-pointer"
              >
                Sign In
              </button>
            </div>
          </nav>

          {/* HERO SECTION */}
          <section id="hero" className="pt-32 pb-20 md:pt-44 md:pb-32 px-6 md:px-12 max-w-7xl mx-auto relative z-10">
            
            {/* Soft orange radial gradient glow in the corner */}
            <div className="absolute top-0 left-0 w-96 h-96 bg-[radial-gradient(rgba(255,107,53,0.08),transparent_70%)] pointer-events-none -translate-x-1/2 -translate-y-1/2 z-0" />
            
            {/* Subtle grid pattern overlay */}
            <div className="absolute inset-0 grid-overlay opacity-30 pointer-events-none z-0" />

            <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-8 relative z-10">
              
              {/* Left Side: Content */}
              <div className="w-full lg:w-[60%] flex flex-col items-start space-y-6 text-left animate-fade-up">
                
                {/* Small pill badge */}
                <div id="student-badge" className="inline-flex items-center gap-1.5 bg-[rgba(255,107,53,0.12)] border border-[rgba(255,107,53,0.3)] text-[#FF6B35] text-xs font-semibold px-3 py-1.5 rounded-full select-none">
                  <span>🇳🇬</span> Built for Nigerian Students
                </div>

                {/* Main Headline */}
                <h1 className="font-heading font-extrabold text-4xl sm:text-5xl md:text-6xl text-white leading-[1.1] tracking-tight">
                  Pass JAMB,<br />
                  WAEC & NECO.<br />
                  <span className="text-[#FF6B35] block mt-1">Stop Guessing.</span>
                </h1>

                {/* Subtext */}
                <p className="font-sans text-base md:text-lg text-[#8B9CB8] max-w-xl leading-relaxed">
                  Practice with syllabus questions, master topics with smart cheatsheets, and battle your classmates. Everything you need to pass in one free app.
                </p>

                {/* Buttons */}
                <div className="flex flex-wrap gap-4 w-full sm:w-auto">
                  <button 
                    id="cta-practice" 
                    onClick={() => navigateTo('signin')}
                    className="bg-[#FF6B35] hover:bg-[#ff7c4d] text-white font-sans font-bold py-3.5 px-7 rounded-xl transition-all duration-300 shadow-md hover:shadow-[0_0_20px_rgba(255,107,53,0.4)] active:scale-95 text-center w-full sm:w-auto cursor-pointer"
                  >
                    Start Practicing Free
                  </button>
                  <a 
                    href="#how-it-works" 
                    id="cta-howitworks" 
                    className="bg-transparent hover:bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.15)] text-white font-sans font-medium py-3.5 px-7 rounded-xl transition-all duration-300 active:scale-95 text-center w-full sm:w-auto cursor-pointer"
                  >
                    See How It Works
                  </a>
                </div>

                {/* Trust Markers */}
                <div id="trust-markers" className="flex flex-wrap gap-y-2 gap-x-6 text-xs text-[#8B9CB8] font-sans pt-2">
                  <span className="flex items-center gap-1">
                    <span className="text-[#FF6B35] font-bold">✓</span> Free forever to start
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="text-[#FF6B35] font-bold">✓</span> No credit card needed
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="text-[#FF6B35] font-bold">✓</span> Join 5,000+ students
                  </span>
                </div>

              </div>

              {/* Right Side: Phone Mockup Container */}
              <div className="w-full lg:w-[40%] flex items-center justify-center relative pt-8 lg:pt-0">
                
                {/* Background Soft Orange Radial Glow container */}
                <div className="absolute w-[400px] h-[400px] rounded-full bg-[radial-gradient(rgba(255,107,53,0.15),transparent_70%)] blur-2xl pointer-events-none -z-10" />

                {/* Simulated Phone Mockup */}
                <div 
                  id="phone-mockup"
                  className="w-[260px] h-[520px] bg-[#1A1A2E] border-2 border-[rgba(255,255,255,0.1)] rounded-[36px] shadow-[0_40px_80px_rgba(0,0,0,0.6),0_0_60px_rgba(255,107,53,0.15)] overflow-hidden flex flex-col relative rotate-[-5deg] hover:rotate-0 transition-transform duration-500 animate-float"
                >
                  {/* Phone Speaker & Camera Notch */}
                  <div className="w-full h-8 bg-[#1A1A2E] flex justify-between items-center px-6 relative z-10 text-[10px] text-[rgba(255,255,255,0.4)] select-none">
                    <span>9:41</span>
                    {/* Simulated pill sensor */}
                    <div className="w-12 h-3.5 bg-black rounded-full absolute left-1/2 -translate-x-1/2 top-2" />
                    <div className="flex items-center gap-1">
                      {/* Signal bars */}
                      <div className="flex items-end gap-0.5 h-2">
                        <div className="w-[1.5px] h-1 bg-[rgba(255,255,255,0.4)] rounded-full" />
                        <div className="w-[1.5px] h-1.5 bg-[rgba(255,255,255,0.4)] rounded-full" />
                        <div className="w-[1.5px] h-2 bg-white rounded-full" />
                      </div>
                      {/* Battery logo */}
                      <div className="w-4 h-2.5 border border-[rgba(255,255,255,0.4)] rounded-sm p-[1px] flex items-center">
                        <div className="h-full w-[80%] bg-white rounded-2xs" />
                      </div>
                    </div>
                  </div>

                  {/* Mockup Dashboard Content Screen */}
                  <div className="flex-1 bg-[#0F0F1D] px-4 py-3 flex flex-col justify-between overflow-y-auto select-none font-sans">
                    
                    {/* Greeting Area */}
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <span className="text-[10px] text-[rgba(255,255,255,0.4)] block">Good morning</span>
                        <span className="text-xs font-bold text-white">Chidera 👋</span>
                      </div>
                      <div className="w-6 h-6 bg-gradient-to-tr from-[#FF6B35] to-[#FF9500] rounded-full flex items-center justify-center text-[10px] font-bold text-white">
                        C
                      </div>
                    </div>

                    {/* Orange Gradient Card - Goal Tracker */}
                    <div className="bg-gradient-to-br from-[#FF6B35] to-[#F15BB5] p-3 rounded-2xl shadow-lg shadow-[rgba(255,107,53,0.2)] mb-3 flex flex-col justify-between h-[100px]">
                      <div className="flex justify-between items-center text-[10px] text-white/90">
                        <span className="font-medium">JAMB 2026 Target</span>
                        <span className="bg-white/20 px-1.5 py-0.5 rounded text-[8px]">Active</span>
                      </div>
                      <div className="my-1">
                        <div className="text-2xl font-extrabold text-white leading-none">280</div>
                        <span className="text-[8px] text-white/80">Goal Score (Engineering study)</span>
                      </div>
                      <div className="w-full">
                        <div className="h-1.5 bg-black/20 rounded-full overflow-hidden">
                          <div className="h-full bg-white rounded-full w-[72%]" />
                        </div>
                      </div>
                    </div>

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <div className="bg-[#111827] border border-[rgba(255,255,255,0.05)] p-2 rounded-xl text-center">
                        <span className="text-xs font-semibold text-white block">9🔥</span>
                        <span className="text-[8px] text-[rgba(255,255,255,0.4)] uppercase">Streak</span>
                      </div>
                      <div className="bg-[#111827] border border-[rgba(255,255,255,0.05)] p-2 rounded-xl text-center">
                        <span className="text-xs font-semibold text-white block">847</span>
                        <span className="text-[8px] text-[rgba(255,255,255,0.4)] uppercase">Questions</span>
                      </div>
                      <div className="bg-[#111827] border border-[rgba(255,255,255,0.05)] p-2 rounded-xl text-center">
                        <span className="text-xs font-semibold text-[#FF6B35] block">73%</span>
                        <span className="text-[8px] text-[rgba(255,255,255,0.4)] uppercase">Accuracy</span>
                      </div>
                    </div>

                    {/* Topic Sessions List */}
                    <div className="space-y-2 flex-1 flex flex-col justify-end">
                      <div className="text-[9px] text-[rgba(255,255,255,0.4)] font-medium uppercase tracking-wider mb-0.5">Recommended Tasks</div>
                      
                      {/* Card 1: Chemistry */}
                      <div className="bg-[#111827] border border-[rgba(255,255,255,0.05)] p-2 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-[#FF6B35]" />
                          <div>
                            <div className="text-[10px] font-bold text-white">Chemistry</div>
                            <div className="text-[8px] text-[rgba(255,255,255,0.4)]">Functional Groups</div>
                          </div>
                        </div>
                        <span className="text-[6px] font-bold bg-[rgba(255,107,53,0.12)] text-[#FF6B35] border border-[rgba(255,107,53,0.3)] px-1 py-0.5 rounded">
                          WEAK AREA
                        </span>
                      </div>

                      {/* Card 2: Mathematics */}
                      <div className="bg-[#111827] border border-[rgba(255,255,255,0.05)] p-2 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-[#06B6D4]" />
                          <div>
                            <div className="text-[10px] font-bold text-white">Mathematics</div>
                            <div className="text-[8px] text-[rgba(255,255,255,0.4)]">Circle Theorems</div>
                          </div>
                        </div>
                        <span className="text-[8px] text-[rgba(255,255,255,0.4)]">12m ago</span>
                      </div>
                    </div>

                    {/* Simulated Bottom Navigation */}
                    <div className="h-8 border-t border-[rgba(255,255,255,0.05)] mt-3 pt-2 flex justify-around items-center text-[8px] text-[rgba(255,255,255,0.4)]">
                      <span className="text-[#FF6B35] font-semibold flex flex-col items-center">
                        <span>🏠</span>
                        <span>Home</span>
                      </span>
                      <span className="flex flex-col items-center">
                        <span>⚔️</span>
                        <span>Battle</span>
                      </span>
                      <span className="flex flex-col items-center">
                        <span>📋</span>
                        <span>Syllabus</span>
                      </span>
                    </div>

                  </div>
                </div>

              </div>

            </div>
          </section>

          {/* SECTION 3: STATS BAR */}
          <section id="stats-bar" className="w-full bg-[#111827] border-y border-[rgba(255,255,255,0.06)] relative z-20">
            <div className="max-w-7xl mx-auto py-8 px-6 md:px-12">
              {/* Grid layout - Horizontal row on desktop, Vertical stacked on mobile with dividers */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-4 divide-y md:divide-y-0 md:divide-x divide-[rgba(255,255,255,0.06)]">
                
                {/* Stat 1 */}
                <div className="flex flex-col items-center justify-center text-center pb-6 md:pb-0">
                  <span className="font-heading font-extrabold text-4xl lg:text-5xl text-[#FF6B35]">10,000+</span>
                  <span className="font-sans text-[13px] md:text-sm text-[#8B9CB8] mt-2 uppercase tracking-wide">Practice Questions</span>
                </div>

                {/* Stat 2 */}
                <div className="flex flex-col items-center justify-center text-center py-6 md:py-0">
                  <span className="font-heading font-extrabold text-4xl lg:text-5xl text-[#FF6B35]">5</span>
                  <span className="font-sans text-[13px] md:text-sm text-[#8B9CB8] mt-2 uppercase tracking-wide">Core Subjects</span>
                </div>

                {/* Stat 3 */}
                <div className="flex flex-col items-center justify-center text-center pt-6 md:pt-0">
                  <span className="font-heading font-extrabold text-4xl lg:text-5xl text-[#FF6B35]">Free</span>
                  <span className="font-sans text-[13px] md:text-sm text-[#8B9CB8] mt-2 uppercase tracking-wide">To Get Started</span>
                </div>

              </div>
            </div>
          </section>

          {/* SECTION 4: FEATURES */}
          <section id="features" className="py-20 md:py-28 px-6 md:px-12 max-w-7xl mx-auto relative z-10 font-sans">
            
            {/* Centered Heading */}
            <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
              <span className="text-xs font-semibold text-[#8B9CB8] tracking-widest uppercase block">
                WHAT YOU GET
              </span>
              <h2 className="font-heading font-extrabold text-3xl md:text-5xl text-white tracking-tight leading-tight">
                Everything you need to pass
              </h2>
            </div>

            {/* 2x2 Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
              
              {/* Card 1 */}
              <div className="bg-[#111827] border border-[rgba(255,255,255,0.06)] rounded-2xl p-7 lg:p-8 hover:border-[rgba(255,107,53,0.3)] hover:-translate-y-1 transition-all duration-300 flex flex-col items-start gap-5">
                <div className="w-12 h-12 bg-[rgba(255,107,53,0.1)] rounded-xl flex items-center justify-center text-2xl select-none">
                  🎯
                </div>
                <div>
                  <h3 className="font-heading font-bold text-xl text-white mb-2">Weakness Assassin</h3>
                  <p className="font-sans text-sm md:text-base text-[#8B9CB8] leading-relaxed">
                    Know exactly where you are losing marks. Get focused practice sessions that target and fix your weak spots automatically.
                  </p>
                </div>
              </div>

              {/* Card 2 */}
              <div className="bg-[#111827] border border-[rgba(255,255,255,0.06)] rounded-2xl p-7 lg:p-8 hover:border-[rgba(255,107,53,0.3)] hover:-translate-y-1 transition-all duration-300 flex flex-col items-start gap-5">
                <div className="w-12 h-12 bg-[rgba(139,92,246,0.1)] rounded-xl flex items-center justify-center text-2xl select-none">
                  ⚔️
                </div>
                <div>
                  <h3 className="font-heading font-bold text-xl text-white mb-2">Battle a Friend</h3>
                  <p className="font-sans text-sm md:text-base text-[#8B9CB8] leading-relaxed">
                    Challenge your classmates to quiz battles. Share a code, compete on the same questions and see who wins.
                  </p>
                </div>
              </div>

              {/* Card 3 */}
              <div className="bg-[#111827] border border-[rgba(255,255,255,0.06)] rounded-2xl p-7 lg:p-8 hover:border-[rgba(255,107,53,0.3)] hover:-translate-y-1 transition-all duration-300 flex flex-col items-start gap-5">
                <div className="w-12 h-12 bg-[rgba(20,184,166,0.1)] rounded-xl flex items-center justify-center text-2xl select-none">
                  📋
                </div>
                <div>
                  <h3 className="font-heading font-bold text-xl text-white mb-2">Smart Cheatsheets</h3>
                  <p className="font-sans text-sm md:text-base text-[#8B9CB8] leading-relaxed">
                    One page visual summaries of every JAMB topic. Key formulas and must know facts perfect for last minute revision.
                  </p>
                </div>
              </div>

              {/* Card 4 */}
              <div className="bg-[#111827] border border-[rgba(255,255,255,0.06)] rounded-2xl p-7 lg:p-8 hover:border-[rgba(255,107,53,0.3)] hover:-translate-y-1 transition-all duration-300 flex flex-col items-start gap-5">
                <div className="w-12 h-12 bg-[rgba(245,158,11,0.1)] rounded-xl flex items-center justify-center text-2xl select-none">
                  🏆
                </div>
                <div>
                  <h3 className="font-heading font-bold text-xl text-white mb-2">National Leaderboard</h3>
                  <p className="font-sans text-sm md:text-base text-[#8B9CB8] leading-relaxed">
                    See how you rank against students across Nigeria. Weekly and all time rankings to keep you motivated.
                  </p>
                </div>
              </div>

            </div>
          </section>

          {/* SECTION 5: HOW IT WORKS */}
          <section id="how-it-works" className="py-20 md:py-28 px-6 md:px-12 max-w-7xl mx-auto relative z-10 border-t border-[rgba(255,255,255,0.06)] font-sans">
            
            {/* Centered Heading */}
            <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
              <span className="text-xs font-semibold text-[#8B9CB8] tracking-widest uppercase block">
                THE PROCESS
              </span>
              <h2 className="font-heading font-extrabold text-3xl md:text-5xl text-white tracking-tight leading-tight">
                Start in 3 simple steps
              </h2>
            </div>

            {/* Steps container */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 max-w-5xl mx-auto relative">
              
              {/* Step 1 */}
              <div className="relative flex flex-col items-start space-y-4">
                {/* Dashed orange line connector on desktop */}
                <div className="hidden md:block absolute left-14 top-6 w-[calc(100%-2.5rem)] border-t border-dashed border-[#FF6B35]/50 -z-10" />
                
                <div className="w-12 h-12 bg-[#FF6B35] rounded-full flex items-center justify-center text-white font-heading font-extrabold text-lg shadow-[0_0_15px_rgba(255,107,53,0.3)]">
                  1
                </div>
                <h3 className="font-heading font-bold text-xl text-white">Sign In With Gmail</h3>
                <p className="font-sans text-sm md:text-base text-[#8B9CB8] leading-relaxed">
                  One tap sign in. No password needed. Your progress is saved automatically.
                </p>
              </div>

              {/* Step 2 */}
              <div className="relative flex flex-col items-start space-y-4">
                {/* Dashed orange line connector on desktop */}
                <div className="hidden md:block absolute left-14 top-6 w-[calc(100%-2.5rem)] border-t border-dashed border-[#FF6B35]/50 -z-10" />
                
                <div className="w-12 h-12 bg-[#FF6B35] rounded-full flex items-center justify-center text-white font-heading font-extrabold text-lg shadow-[0_0_15px_rgba(255,107,53,0.3)]">
                  2
                </div>
                <h3 className="font-heading font-bold text-xl text-white">Pick Your Subjects</h3>
                <p className="font-sans text-sm md:text-base text-[#8B9CB8] leading-relaxed">
                  Choose JAMB, WAEC or NECO. Select your subjects and your dashboard personalises instantly.
                </p>
              </div>

              {/* Step 3 */}
              <div className="relative flex flex-col items-start space-y-4">
                <div className="w-12 h-12 bg-[#FF6B35] rounded-full flex items-center justify-center text-white font-heading font-extrabold text-lg shadow-[0_0_15px_rgba(255,107,53,0.3)]">
                  3
                </div>
                <h3 className="font-heading font-bold text-xl text-white">Start Practicing</h3>
                <p className="font-sans text-sm md:text-base text-[#8B9CB8] leading-relaxed">
                  Practice daily, track your weakness, battle friends and watch your scores climb.
                </p>
              </div>

            </div>
          </section>

          {/* SECTION 6: TESTIMONIALS */}
          <section id="testimonials" className="py-20 md:py-28 px-6 md:px-12 max-w-7xl mx-auto relative z-10 border-t border-[rgba(255,255,255,0.06)] font-sans">
            
            {/* Centered Heading */}
            <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
              <span className="text-xs font-semibold text-[#8B9CB8] tracking-widest uppercase block">
                STUDENT STORIES
              </span>
              <h2 className="font-heading font-extrabold text-3xl md:text-5xl text-white tracking-tight leading-tight">
                Students are already winning
              </h2>
            </div>

            {/* 3 Testimonial Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
              
              {/* Testimonial Card 1 */}
              <div className="bg-[#111827] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6 lg:p-8 flex flex-col justify-between hover:border-[rgba(255,107,53,0.2)] transition-all duration-300">
                <div>
                  <span className="font-heading font-extrabold text-6xl text-[#FF6B35] leading-none select-none block -mt-4 mb-2">
                    &ldquo;
                  </span>
                  <p className="font-sans text-sm md:text-base text-white/90 leading-relaxed italic mb-6">
                    I went from 187 to 251 in my mock exam after just 3 weeks on ExamReady. The Weakness Assassin knew exactly what I needed to fix.
                  </p>
                </div>
                
                {/* Student Info */}
                <div className="flex items-center gap-3 border-t border-[rgba(255,255,255,0.06)] pt-4 mt-auto">
                  <div className="w-10 h-10 bg-gradient-to-tr from-[#FF6B35] to-[#FF9500] rounded-full flex items-center justify-center font-heading font-extrabold text-sm text-white select-none">
                    A
                  </div>
                  <div>
                    <h4 className="font-sans font-bold text-sm text-white leading-tight">Amina K.</h4>
                    <p className="font-sans text-xs text-[#8B9CB8]">Kano State</p>
                  </div>
                </div>
              </div>

              {/* Testimonial Card 2 */}
              <div className="bg-[#111827] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6 lg:p-8 flex flex-col justify-between hover:border-[rgba(255,107,53,0.2)] transition-all duration-300">
                <div>
                  <span className="font-heading font-extrabold text-6xl text-[#FF6B35] leading-none select-none block -mt-4 mb-2">
                    &ldquo;
                  </span>
                  <p className="font-sans text-sm md:text-base text-white/90 leading-relaxed italic mb-6">
                    My whole class uses ExamReady now. We battle each other every night before bed. I did not think studying could be this fun.
                  </p>
                </div>
                
                {/* Student Info */}
                <div className="flex items-center gap-3 border-t border-[rgba(255,255,255,0.06)] pt-4 mt-auto">
                  <div className="w-10 h-10 bg-gradient-to-tr from-[#8B5CF6] to-[#EC4899] rounded-full flex items-center justify-center font-heading font-extrabold text-sm text-white select-none">
                    C
                  </div>
                  <div>
                    <h4 className="font-sans font-bold text-sm text-white leading-tight">Chukwudi O.</h4>
                    <p className="font-sans text-xs text-[#8B9CB8]">Anambra State</p>
                  </div>
                </div>
              </div>

              {/* Testimonial Card 3 */}
              <div className="bg-[#111827] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6 lg:p-8 flex flex-col justify-between hover:border-[rgba(255,107,53,0.2)] transition-all duration-300">
                <div>
                  <span className="font-heading font-extrabold text-6xl text-[#FF6B35] leading-none select-none block -mt-4 mb-2">
                    &ldquo;
                  </span>
                  <p className="font-sans text-sm md:text-base text-white/90 leading-relaxed italic mb-6">
                    The cheatsheets alone are worth it. I screenshot them and send to my study group every week. So much better than reading textbooks.
                  </p>
                </div>
                
                {/* Student Info */}
                <div className="flex items-center gap-3 border-t border-[rgba(255,255,255,0.06)] pt-4 mt-auto">
                  <div className="w-10 h-10 bg-gradient-to-tr from-[#06B6D4] to-[#10B981] rounded-full flex items-center justify-center font-heading font-extrabold text-sm text-white select-none">
                    F
                  </div>
                  <div>
                    <h4 className="font-sans font-bold text-sm text-white leading-tight">Fatima M.</h4>
                    <p className="font-sans text-xs text-[#8B9CB8]">Kaduna State</p>
                  </div>
                </div>
              </div>

            </div>
          </section>

          {/* SECTION 7: FINAL CTA */}
          <section id="cta" className="py-20 md:py-28 px-6 md:px-12 bg-[#0A0F1E] flex justify-center items-center relative z-10 font-sans border-t border-[rgba(255,255,255,0.06)] overflow-hidden">
            
            {/* Decorative background glow behind CTA card */}
            <div className="absolute w-[500px] h-[500px] rounded-full bg-[radial-gradient(rgba(255,107,53,0.08),transparent_70%)] blur-3xl pointer-events-none z-0" />

            <div className="w-full max-w-[700px] bg-gradient-to-br from-[rgba(255,107,53,0.15)] to-[rgba(241,91,181,0.1)] border border-[rgba(255,107,53,0.2)] rounded-[28px] p-8 md:p-[60px_40px] shadow-[0_0_80px_rgba(255,107,53,0.1)] text-center relative z-10 animate-fade-up">
              
              {/* Centered Emoji */}
              <div className="text-4xl md:text-5xl mb-6 select-none animate-bounce">
                🎯
              </div>

              {/* Heading */}
              <h2 className="font-heading font-extrabold text-3xl md:text-5xl text-white tracking-tight leading-tight mb-4">
                Your exam is coming.<br />
                <span className="text-[#FF6B35]">Are you ready?</span>
              </h2>

              {/* Subtext */}
              <p className="font-sans text-[#8B9CB8] text-base md:text-lg max-w-md mx-auto mb-8 leading-relaxed">
                Join ExamReady today. Free to start, no credit card, no excuses.
              </p>

              {/* CTA Button */}
              <div className="flex flex-col items-center gap-4 mb-8">
                <button 
                  id="cta-start-free-btn"
                  onClick={() => navigateTo('signin')}
                  className="bg-[#FF6B35] hover:bg-[#ff7c4d] text-white font-sans font-bold text-base md:text-lg py-4 px-8 rounded-xl transition-all duration-300 shadow-md hover:shadow-[0_0_25px_rgba(255,107,53,0.6)] hover:scale-[1.02] active:scale-95 cursor-pointer inline-flex items-center gap-2"
                >
                  Get Started Free <span className="text-xl">→</span>
                </button>
              </div>

              {/* Trust points stacked/flexed below button */}
              <div className="flex flex-col sm:flex-row justify-center items-center gap-y-2 gap-x-6 text-xs text-[#8B9CB8]/90 font-sans">
                <span className="flex items-center gap-1.5">
                  <span className="text-[#FF6B35]">✓</span> Free forever to start
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="text-[#FF6B35]">✓</span> No credit card needed
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="text-[#FF6B35]">✓</span> Takes less than a minute
                </span>
              </div>

            </div>
          </section>

          {/* SECTION 8: FOOTER */}
          <footer className="bg-[#080D1A] border-t border-[rgba(255,255,255,0.06)] py-12 md:py-16 px-6 md:px-12 relative z-10 font-sans">
            <div className="max-w-7xl mx-auto flex flex-col gap-10">
              
              {/* Row 1 */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                
                {/* Logo */}
                <div className="flex items-center font-heading font-bold text-[22px] tracking-tight">
                  <span>
                    Exam<span className="text-[#FF6B35]">Ready</span>
                  </span>
                </div>

                {/* Middle navigation links */}
                <div className="flex items-center gap-8 text-sm text-[#8B9CB8] font-sans">
                  <a href="#about" className="hover:text-[#FF6B35] transition-colors duration-200">About</a>
                  <a href="#privacy" className="hover:text-[#FF6B35] transition-colors duration-200">Privacy Policy</a>
                  <a href="#contact" className="hover:text-[#FF6B35] transition-colors duration-200">Contact</a>
                </div>

                {/* Right spacer for standard symmetry */}
                <div className="hidden md:block w-[110px]" />

              </div>

              {/* Row 2 (Separator and Copyright) */}
              <div className="border-t border-[rgba(255,255,255,0.04)] pt-8 text-center">
                <p className="font-sans text-xs md:text-sm text-[#8B9CB8]/65">
                  © 2026 ExamReady — Built for Nigerian Students 🇳🇬
                </p>
              </div>

            </div>
          </footer>

        </div>
      )}

    </div>
  );
}
