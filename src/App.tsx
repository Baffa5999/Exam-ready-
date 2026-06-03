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
  Clock,
  Timer,
  Search,
  BookMarked,
  Share2,
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
  User as UserIcon
} from 'lucide-react';
import Onboarding from './components/Onboarding';
import InstallPrompt from './components/InstallPrompt';
import WeaknessAssassin from './pages/weakness/WeaknessAssassin';

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
  username?: string;
  examTypes?: ('JAMB' | 'WAEC' | 'NECO')[];
  subjectList?: string[];
  targetScoreSummary?: string | number;
  profileExists?: boolean;
}

interface WeakArea {
  subject: string;
  subtopic: string;
  accuracy: number;
}

interface DashboardPerformance {
  questions: number;
  accuracy: number;
  weakAreas: WeakArea[];
}

interface DashboardUpdate {
  category: string;
  title: string;
  preview: string;
  date: string;
}

interface PracticeQuestion {
  id?: string | number;
  subject: string;
  topic?: string | null;
  subtopic: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  explanation?: string | null;
}

interface PracticeSelection {
  subject: string;
  topic: string;
}

interface PracticeTopicAvailability {
  topic: string;
  subtopic: string;
}

const fallbackDashboardUpdates: DashboardUpdate[] = [
  {
    category: 'JAMB',
    title: 'JAMB 2027 Registration Opens November 2026',
    preview: 'The Joint Admissions and Matriculation Board has announced...',
    date: 'Nov 2026'
  },
  {
    category: 'Scholarship',
    title: 'FG Scholarship Applications Now Open for 2026',
    preview: 'The Federal Government has opened applications for...',
    date: 'Jun 2026'
  }
];

const subjectLibrary = [
  { name: 'Mathematics', accent: '#00BBF9', gradient: 'from-[#00BBF9] to-[#006DFF]' },
  { name: 'English Language', accent: '#2EC4B6', gradient: 'from-[#2EC4B6] to-[#118A7E]' },
  { name: 'Biology', accent: '#00FF87', gradient: 'from-[#00FF87] to-[#0B8F52]' },
  { name: 'Chemistry', accent: '#9B5DE5', gradient: 'from-[#9B5DE5] to-[#5D2E91]' },
  { name: 'Physics', accent: '#FF6B35', gradient: 'from-[#FF6B35] to-[#F7931E]' },
  { name: 'Literature', accent: '#F15BB5', gradient: 'from-[#F15BB5] to-[#B5179E]' }
];

const subtopicsBySubject: Record<string, string[]> = {
  Mathematics: ['Number and Numeration', 'Algebra', 'Geometry and Trigonometry', 'Statistics and Probability', 'Calculus'],
  Biology: ['Cell Biology', 'Genetics and Evolution', 'Ecology', 'Human Biology and Health', 'Plant Biology'],
  Chemistry: ['Physical Chemistry', 'Organic Chemistry', 'Inorganic Chemistry', 'Electrochemistry', 'Environmental Chemistry'],
  Physics: ['Mechanics', 'Waves and Optics', 'Electricity and Magnetism', 'Modern Physics', 'Thermodynamics'],
  'English Language': ['Comprehension', 'Lexis and Structure', 'Oral English', 'Essay and Letter Writing', 'Figures of Speech'],
  Literature: ['Poetry', 'Prose', 'Drama', 'Literary Devices', 'African Literature']
};

const fallbackPracticeSubtopicsByTopic: Record<string, Record<string, string[]>> = {
  Mathematics: {
    'Number and Numeration': ['Number Bases', 'Fractions Decimals and Percentages'],
    Algebra: [],
    'Geometry and Trigonometry': [],
    'Statistics and Probability': [],
    Calculus: []
  }
};

const slugify = (value: string) => value.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const getSubjectFromSlug = (slug: string) => subjectLibrary.find(subject => slugify(subject.name) === slug)?.name || 'Mathematics';
const getSubtopicFromSlug = (subject: string, slug: string) => subtopicsBySubject[subject]?.find(topic => slugify(topic) === slug) || subtopicsBySubject[subject]?.[0] || 'Algebra';

type AppView = 'landing' | 'signin' | 'onboarding' | 'dashboard' | 'profile' | 'aiTutor' | 'weakness' | 'updates' | 'practice' | 'practiceSubjects' | 'practiceExamType' | 'practiceSession' | 'cheatsheet' | 'cheatsheetSubject' | 'cheatsheetContent' | 'battle' | 'leaderboard';

const viewToPath: Record<AppView, string> = {
  landing: '/',
  signin: '/signin',
  onboarding: '/onboarding',
  dashboard: '/dashboard',
  profile: '/profile',
  aiTutor: '/ai-tutor',
  weakness: '/weakness',
  updates: '/updates',
  practice: '/practice',
  practiceSubjects: '/practice/subjects',
  practiceExamType: '/practice/exam-type',
  practiceSession: '/practice/session',
  cheatsheet: '/cheatsheet',
  cheatsheetSubject: '/cheatsheet',
  cheatsheetContent: '/cheatsheet',
  battle: '/battle',
  leaderboard: '/leaderboard'
};

function normalizePathname(pathname: string) {
  const [withoutHash] = pathname.split('#');
  const [routePath] = withoutHash.split('?');
  return routePath || '/';
}

function pathToView(pathname: string): AppView {
  const routePath = normalizePathname(pathname);

  if (routePath === '/signin') return 'signin';
  if (routePath === '/onboarding') return 'onboarding';
  if (routePath === '/dashboard') return 'dashboard';
  if (routePath === '/profile') return 'profile';
  if (routePath === '/ai-tutor') return 'aiTutor';
  if (routePath === '/weakness') return 'weakness';
  if (routePath === '/updates') return 'updates';
  if (routePath === '/practice') return 'practice';
  if (routePath === '/practice/subjects') return 'practiceSubjects';
  if (routePath === '/practice/exam-type') return 'practiceExamType';
  if (routePath === '/practice/session') return 'practiceSession';
  if (routePath.startsWith('/mock-exam/')) return 'practiceSession';
  if (routePath === '/battle') return 'battle';
  if (routePath === '/leaderboard') return 'leaderboard';
  if (routePath === '/cheatsheet') return 'cheatsheet';
  if (routePath.startsWith('/cheatsheet/')) {
    return routePath.split('/').filter(Boolean).length >= 3 ? 'cheatsheetContent' : 'cheatsheetSubject';
  }
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
  const [dashboardMenuOpen, setDashboardMenuOpen] = useState<boolean>(false);
  const [dashboardPerformance, setDashboardPerformance] = useState<DashboardPerformance>({ questions: 0, accuracy: 0, weakAreas: [] });
  const [dashboardUpdates, setDashboardUpdates] = useState<DashboardUpdate[]>(fallbackDashboardUpdates);
  const [expandedPracticeSubjects, setExpandedPracticeSubjects] = useState<string[]>([]);
  const [selectedPracticeTopics, setSelectedPracticeTopics] = useState<Record<string, string[]>>({});
  const [expandedPracticeTopics, setExpandedPracticeTopics] = useState<Record<string, string[]>>({});
  const [availablePracticeSubtopics, setAvailablePracticeSubtopics] = useState<Record<string, PracticeTopicAvailability[]>>({});
  const [loadingPracticeAvailability, setLoadingPracticeAvailability] = useState<boolean>(false);
  const [expandedCheatsheetSubject, setExpandedCheatsheetSubject] = useState<string | null>(null);
  const [questionIndex, setQuestionIndex] = useState<number>(0);
  const [sessionSelectedAnswer, setSessionSelectedAnswer] = useState<number | null>(null);
  const [sessionScore, setSessionScore] = useState<number>(0);
  const [questionTimeLeft, setQuestionTimeLeft] = useState<number>(30);
  const [practiceQuestions, setPracticeQuestions] = useState<PracticeQuestion[]>([]);
  const [practiceQuestionsLoading, setPracticeQuestionsLoading] = useState<boolean>(false);
  const [failedPracticeQuestions, setFailedPracticeQuestions] = useState<Array<{ question: PracticeQuestion; selectedAnswer: number }>>([]);
  const [recordedPracticeAnswers, setRecordedPracticeAnswers] = useState<string[]>([]);
  const [showFailedReview, setShowFailedReview] = useState<boolean>(false);
  const [battleCode, setBattleCode] = useState<string>('');
  const [joinBattleCode, setJoinBattleCode] = useState<string>('');
  const [leaderboardRange, setLeaderboardRange] = useState<'Weekly' | 'Monthly' | 'All Time'>('Weekly');
  const [leaderboardSubject, setLeaderboardSubject] = useState<string>('All Subjects');

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
    const isProtectedRoute = ['onboarding', 'dashboard', 'profile', 'aiTutor', 'weakness', 'updates', 'practice', 'practiceSubjects', 'practiceExamType', 'practiceSession', 'cheatsheet', 'cheatsheetSubject', 'cheatsheetContent', 'battle', 'leaderboard'].includes(view);

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

  useEffect(() => {
    let cancelled = false;

    const loadDashboardUpdates = async () => {
      const { data, error } = await supabase
        .from('updates')
        .select('category, title, preview, content, created_at, published_at')
        .order('created_at', { ascending: false })
        .limit(2);

      if (cancelled) return;

      if (error || !data || data.length === 0) {
        if (error) {
          console.info('Unable to load dashboard updates; using placeholders.', error);
        }
        setDashboardUpdates(fallbackDashboardUpdates);
        return;
      }

      const updates = (data as Array<Record<string, any>>).map(row => {
        const rawDate = row.published_at || row.created_at;
        return {
          category: row.category || 'General',
          title: row.title || 'Exam update',
          preview: row.preview || row.content || 'Latest exam information will appear here.',
          date: rawDate
            ? new Date(rawDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
            : 'Today'
        };
      });

      setDashboardUpdates(updates);
    };

    loadDashboardUpdates();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadDashboardPerformance = async () => {
      if (!currentUser || studentProfile?.profileExists !== true) {
        setDashboardPerformance({ questions: 0, accuracy: 0, weakAreas: [] });
        return;
      }

      const { data, error } = await supabase
        .from('student_performance')
        .select('subject, subtopic, questions_attempted, accuracy_percentage')
        .eq('user_id', currentUser.id);

      if (cancelled) return;

      if (error || !data) {
        console.info('Unable to load student performance; using dashboard defaults.', error);
        setDashboardPerformance({ questions: 0, accuracy: 0, weakAreas: [] });
        return;
      }

      const rows = data as Array<Record<string, any>>;
      const questions = rows.reduce((sum, row) => sum + (Number(row.questions_attempted) || 0), 0);
      const accuracyRows = rows
        .map(row => Number(row.accuracy_percentage))
        .filter(value => Number.isFinite(value));
      const accuracy = accuracyRows.length
        ? Math.round(accuracyRows.reduce((sum, value) => sum + value, 0) / accuracyRows.length)
        : 0;
      const weakAreas = rows
        .map(row => ({
          subject: row.subject || 'General',
          subtopic: row.subtopic || 'Practice topic',
          accuracy: Number(row.accuracy_percentage) || 0
        }))
        .sort((a, b) => a.accuracy - b.accuracy)
        .slice(0, 3);

      setDashboardPerformance({ questions, accuracy, weakAreas });
    };

    loadDashboardPerformance();

    return () => {
      cancelled = true;
    };
  }, [currentUser, studentProfile?.profileExists]);

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
      streak: data.streak ?? 0,
      questionsPracticed: data.questions_practiced || data.questionsPracticed || 0,
      accuracy: data.accuracy || 70,
      createdAt,
      updatedAt,
      isOnboarded: data.is_onboarded ?? data.isOnboarded ?? true,
      selectedExams,
      subjects: Array.isArray(subjects) ? {} : subjects,
      targetScores,
      fullName: data.full_name || data.display_name || data.displayName || user.user_metadata?.full_name || user.email || 'Nigerian Student',
      username: data.username || '',
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
      username: '',
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

  // Save the simplified onboarding profile.
  const handleOnboardingComplete = async (onboardingData: {
    displayName: string;
    username: string;
  }) => {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user ?? currentUser;

    if (!user) {
      throw new Error('Please sign in again before saving onboarding.');
    }

    setCurrentUser(user);

    const createdAt = new Date().toISOString();
    const updatedAt = createdAt;
    const fullName = onboardingData.displayName;
    const username = onboardingData.username;

    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        full_name: fullName,
        username,
        streak: 0,
        created_at: createdAt
      });

    if (error) {
      console.error('Supabase profile save failed:', error);
      throw new Error('Something went wrong. Please try again.');
    }

    setStudentProfile(prev => ({
      ...(prev ?? {
        uid: user.id,
        displayName: fullName,
        email: user.email || '',
        examType: 'JAMB',
        targetScore: 280,
        streak: 0,
        questionsPracticed: 0,
        accuracy: 70,
        createdAt,
        updatedAt,
        isOnboarded: true,
        selectedExams: [],
        subjects: {},
        targetScores: {},
        fullName,
        username,
        examTypes: [],
        subjectList: [],
        targetScoreSummary: '',
        profileExists: true
      }),
      uid: user.id,
      displayName: fullName,
      email: user.email || prev?.email || '',
      streak: 0,
      isOnboarded: true,
      selectedExams: prev?.selectedExams || [],
      subjects: prev?.subjects || {},
      targetScores: prev?.targetScores || {},
      fullName,
      username,
      examTypes: prev?.examTypes || [],
      subjectList: prev?.subjectList || [],
      targetScoreSummary: prev?.targetScoreSummary || '',
      createdAt: prev?.createdAt || createdAt,
      updatedAt,
      profileExists: true
    }));

    navigateTo('dashboard', { replace: true });
    showBanner('success', 'Profile set up successfully! Welcome!');
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
    showBanner('success', `Goal changed to ${exam} 2026. Keep studying!`);
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
    
    showBanner('success', 'Study session saved! 15 syllabus questions completed.');
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

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getDashboardUsername = () => {
    const fallback = studentProfile?.displayName || currentUser?.email || 'Student';
    return studentProfile?.username || studentProfile?.fullName || fallback;
  };

  const getPracticeSelectionsFromNavigation = (): PracticeSelection[] => {
    const navigationState = (window.history.state || {}) as {
      subjects?: string[];
      subtopics?: string[];
      selections?: PracticeSelection[];
    };
    const params = new URLSearchParams(window.location.search);

    console.log('PracticeSession received navigation state:', {
      navigationState,
      search: window.location.search,
      pathname: window.location.pathname
    });

    if (Array.isArray(navigationState.selections) && navigationState.selections.length > 0) {
      return navigationState.selections.filter(item => item.subject && item.topic);
    }

    if (Array.isArray(navigationState.subjects) && Array.isArray(navigationState.subtopics)) {
      const selections = navigationState.subtopics.flatMap(subtopic => {
        const matchingSubject = navigationState.subjects?.find(subject => {
          const availableRows = availablePracticeSubtopics[subject] || [];
          const fallbackRows = Object.values(fallbackPracticeSubtopicsByTopic[subject] || {}).flat();
          return availableRows.some(row => row.subtopic === subtopic) || fallbackRows.includes(subtopic);
        }) || navigationState.subjects?.[0];

        return matchingSubject ? [{ subject: matchingSubject, topic: subtopic }] : [];
      });

      if (selections.length > 0) return selections;
    }

    const rawTopics = params.get('topics');

    if (rawTopics) {
      try {
        const parsed = JSON.parse(rawTopics) as Array<{ subject?: string; topic?: string; subtopic?: string }>;
        const selections = parsed
          .map(item => ({ subject: item.subject || '', topic: item.topic || item.subtopic || '' }))
          .filter(item => item.subject && item.topic);

        if (selections.length > 0) return selections;
      } catch (error) {
        console.warn('Unable to parse practice topics from URL:', error);
      }
    }

    const subject = params.get('subject');
    const topic = params.get('topic') || params.get('subtopic');
    if (subject && topic) return [{ subject, topic }];

    if (window.location.pathname.startsWith('/mock-exam/')) {
      const examSlug = window.location.pathname.split('/').filter(Boolean)[1] || 'jamb';
      return [{ subject: examSlug.toUpperCase(), topic: 'Full Mock Exam' }];
    }

    return [];
  };

  const shuffleQuestions = (questions: PracticeQuestion[]) => {
    const next = [...questions];
    for (let index = next.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [next[index], next[randomIndex]] = [next[randomIndex], next[index]];
    }
    return next;
  };

  const getAnswerOptions = (question: PracticeQuestion) => [
    question.option_a,
    question.option_b,
    question.option_c,
    question.option_d
  ];

  const getCorrectAnswerIndex = (question: PracticeQuestion) => {
    const normalizedCorrect = `${question.correct_answer || ''}`.trim().toLowerCase();
    const optionKeys = ['a', 'b', 'c', 'd'];
    const directKeyIndex = optionKeys.findIndex(key => normalizedCorrect === key || normalizedCorrect === `option_${key}`);

    if (directKeyIndex >= 0) return directKeyIndex;

    return getAnswerOptions(question).findIndex(option => `${option}`.trim().toLowerCase() === normalizedCorrect);
  };

  const savePracticePerformance = async (question: PracticeQuestion, isCorrect: boolean) => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    const activeUser = user || currentUser;

    console.log('Practice performance save requested after answer:', {
      userId: activeUser?.id,
      questionId: question.id,
      subject: question.subject,
      topic: question.topic,
      subtopic: question.subtopic,
      isCorrect
    });

    if (userError || !activeUser) {
      console.warn('Skipping practice performance save because no authenticated user was found:', userError);
      return;
    }

    console.log('Checking existing student_performance row:', {
      userId: activeUser.id,
      subtopic: question.subtopic
    });

    const { data: existingPerformance, error: lookupError } = await supabase
      .from('student_performance')
      .select('id, questions_attempted, questions_correct')
      .eq('user_id', activeUser.id)
      .eq('subtopic', question.subtopic)
      .maybeSingle();

    if (lookupError) {
      console.warn('Unable to load existing practice performance:', lookupError);
      return;
    }

    const previousAttempted = Number(existingPerformance?.questions_attempted) || 0;
    const previousCorrect = Number(existingPerformance?.questions_correct) || 0;
    const questionsAttempted = previousAttempted + 1;
    const questionsCorrect = previousCorrect + (isCorrect ? 1 : 0);
    const accuracyPercentage = Math.round((questionsCorrect / questionsAttempted) * 100);
    const payload = {
      user_id: activeUser.id,
      subject: question.subject,
      topic: question.topic || question.subtopic,
      subtopic: question.subtopic,
      questions_attempted: questionsAttempted,
      questions_correct: questionsCorrect,
      accuracy_percentage: accuracyPercentage,
      last_practiced: new Date().toISOString()
    };

    console.log('student_performance payload prepared:', payload);

    if (existingPerformance) {
      console.log('Calling student_performance update:', {
        existingPerformance,
        payload
      });

      let updateQuery = supabase.from('student_performance').update(payload);
      updateQuery = existingPerformance.id
        ? updateQuery.eq('id', existingPerformance.id)
        : updateQuery.eq('user_id', activeUser.id).eq('subtopic', question.subtopic);

      const { error } = await updateQuery;
      if (error) {
        console.warn('Unable to update practice performance:', error);
        return;
      }

      console.log('student_performance update completed successfully:', payload);
      return;
    }

    console.log('Calling student_performance insert:', payload);
    const { error } = await supabase.from('student_performance').insert(payload);
    if (error) {
      console.warn('Unable to insert practice performance:', error);
      return;
    }

    console.log('student_performance insert completed successfully:', payload);
  };

  const showStudentPerformanceDebug = async () => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    const activeUser = user || currentUser;

    if (userError || !activeUser) {
      console.warn('Unable to fetch debug student_performance rows because no user was found:', userError);
      window.alert('No authenticated user found for performance debug.');
      return;
    }

    const { data, error } = await supabase
      .from('student_performance')
      .select('*')
      .eq('user_id', activeUser.id);

    if (error) {
      console.warn('Unable to fetch debug student_performance rows:', error);
      window.alert(`Unable to fetch student_performance rows: ${error.message}`);
      return;
    }

    const rows = data || [];
    console.log('Dashboard debug student_performance rows:', rows);
    window.alert(rows.length > 0
      ? JSON.stringify(rows, null, 2)
      : 'No student_performance rows found for the current user.');
  };

  const handlePracticeAnswer = (answerIndex: number) => {
    if (sessionSelectedAnswer !== null) return;

    const currentQuestion = practiceQuestions[questionIndex];
    if (!currentQuestion) return;

    const correctAnswerIndex = getCorrectAnswerIndex(currentQuestion);
    const isCorrect = answerIndex === correctAnswerIndex;
    const recordKey = `${currentQuestion.id ?? `${currentQuestion.subject}-${currentQuestion.subtopic}-${questionIndex}`}-${questionIndex}`;

    setSessionSelectedAnswer(answerIndex);

    if (!recordedPracticeAnswers.includes(recordKey)) {
      setRecordedPracticeAnswers(prev => [...prev, recordKey]);
      if (isCorrect) {
        setSessionScore(prev => prev + 1);
      } else {
        setFailedPracticeQuestions(prev => [...prev, { question: currentQuestion, selectedAnswer: answerIndex }]);
      }
      console.log('Practice answer selected; calling student_performance save:', {
        questionId: currentQuestion.id,
        subject: currentQuestion.subject,
        subtopic: currentQuestion.subtopic,
        selectedAnswer: answerIndex,
        correctAnswerIndex,
        isCorrect
      });
      void savePracticePerformance(currentQuestion, isCorrect);
    }
  };

  useEffect(() => {
    if (view !== 'practiceSession') return;
    if (practiceQuestionsLoading || practiceQuestions.length === 0 || questionIndex >= practiceQuestions.length || sessionSelectedAnswer !== null) return;

    setQuestionTimeLeft(30);
    const timer = window.setInterval(() => {
      setQuestionTimeLeft(prev => {
        if (prev <= 1) {
          window.clearInterval(timer);
          handlePracticeAnswer(-1);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [view, questionIndex, sessionSelectedAnswer, practiceQuestions]);

  useEffect(() => {
    if (view !== 'practiceSubjects') return;

    let cancelled = false;

    const loadAvailablePracticeSubtopics = async () => {
      setLoadingPracticeAvailability(true);

      const subjects = subjectLibrary.filter(subject => subject.name !== 'Literature');
      const nextAvailability: Record<string, PracticeTopicAvailability[]> = {};

      await Promise.all(subjects.map(async subject => {
        const { data, error } = await supabase
          .from('questions')
          .select('topic, subtopic')
          .eq('subject', subject.name);

        if (error) {
          console.warn('Unable to load available practice subtopics:', { subject: subject.name, error });
          nextAvailability[subject.name] = [];
          return;
        }

        const uniqueRows = new Map<string, PracticeTopicAvailability>();
        (data || []).forEach(row => {
          const topic = `${row.topic || ''}`.trim();
          const subtopic = `${row.subtopic || ''}`.trim();
          if (!topic || !subtopic) return;
          uniqueRows.set(`${topic}::${subtopic}`, { topic, subtopic });
        });

        nextAvailability[subject.name] = Array.from(uniqueRows.values());
      }));

      if (!cancelled) {
        console.log('Available practice subtopics:', nextAvailability);
        setAvailablePracticeSubtopics(nextAvailability);
        setLoadingPracticeAvailability(false);
      }
    };

    void loadAvailablePracticeSubtopics();

    return () => {
      cancelled = true;
    };
  }, [view]);

  useEffect(() => {
    if (view !== 'practiceSession') return;

    let cancelled = false;

    const loadPracticeQuestions = async () => {
      const selections = getPracticeSelectionsFromNavigation();
      setPracticeQuestionsLoading(true);
      setPracticeQuestions([]);
      setFailedPracticeQuestions([]);
      setRecordedPracticeAnswers([]);
      setShowFailedReview(false);
      setQuestionIndex(0);
      setSessionSelectedAnswer(null);
      setSessionScore(0);
      setQuestionTimeLeft(30);

      if (selections.length === 0) {
        console.warn('PracticeSession missing selected subjects/subtopics. Redirecting to subject selection.');
        if (!cancelled) {
          setPracticeQuestionsLoading(false);
          navigatePath('/practice/subjects', {}, { replace: true });
        }
        return;
      }

      try {
        const selectedSubtopics = Array.from(new Set(selections.map(selection => selection.topic).filter(Boolean)));
        console.log('Fetching practice questions from Supabase for subtopics:', selectedSubtopics);

        const randomOrderedResult = await supabase
          .from('questions')
          .select('*')
          .in('subtopic', selectedSubtopics)
          .order('random()')
          .limit(20);

        const result = randomOrderedResult.error
          ? await supabase
            .from('questions')
            .select('*')
            .in('subtopic', selectedSubtopics)
            .limit(20)
          : randomOrderedResult;

        if (result.error) {
          console.warn('Unable to fetch practice questions:', result.error);
          if (!cancelled) setPracticeQuestions([]);
          return;
        }

        if (!cancelled) {
          const shuffledQuestions = shuffleQuestions((result.data || []) as PracticeQuestion[]);
          const uniqueQuestions = shuffledQuestions.filter((question, index, allQuestions) => {
            if (!question.id) return true;
            return allQuestions.findIndex(item => item.id === question.id) === index;
          });
          setPracticeQuestions(uniqueQuestions.slice(0, 20));
        }
      } finally {
        if (!cancelled) setPracticeQuestionsLoading(false);
      }
    };

    void loadPracticeQuestions();

    return () => {
      cancelled = true;
    };
  }, [view]);

  const getPrimaryExamLabel = () => {
    return studentProfile?.examTypes?.[0] || studentProfile?.selectedExams?.[0] || studentProfile?.examType || 'JAMB';
  };

  const getTargetDisplay = () => {
    const summary = studentProfile?.targetScoreSummary;
    if (summary !== undefined && summary !== null && `${summary}`.trim() !== '') {
      return summary;
    }
    return '—';
  };

  const navigatePath = (path: string, state: Record<string, unknown> = {}, options: { replace?: boolean } = {}) => {
    const currentPath = `${window.location.pathname}${window.location.search}`;
    const routePath = normalizePathname(path);

    console.log('ExamReady navigation:', { path, routePath, state });

    if (currentPath !== path) {
      if (options.replace) {
        window.history.replaceState(state, '', path);
      } else {
        window.history.pushState(state, '', path);
      }
    } else if (Object.keys(state).length > 0) {
      window.history.replaceState(state, '', path);
    }

    setView(pathToView(routePath));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderBottomNavigation = () => {
    const tabs = [
      { icon: Home, label: 'Home', href: '/dashboard', match: (path: string) => path === '/dashboard' },
      { icon: PenLine, label: 'Practice', href: '/practice', match: (path: string) => path === '/practice' || path.startsWith('/practice/') },
      { icon: FileText, label: 'Cheatsheet', href: '/cheatsheet', match: (path: string) => path === '/cheatsheet' || path.startsWith('/cheatsheet/') },
      { icon: Swords, label: 'Battle', href: '/battle', match: (path: string) => path === '/battle' },
      { icon: Trophy, label: 'Leaderboard', href: '/leaderboard', match: (path: string) => path === '/leaderboard' }
    ];
    const currentPath = window.location.pathname;

    return (
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-[rgba(255,255,255,0.08)] bg-[#16161F] px-2 py-2 backdrop-blur-xl">
        <div className="mx-auto grid max-w-2xl grid-cols-5 gap-1">
          {tabs.map(tab => {
            const active = tab.match(currentPath);
            const TabIcon = tab.icon;

            return (
              <button
                key={tab.label}
                type="button"
                onClick={() => navigatePath(tab.href)}
                aria-current={active ? 'page' : undefined}
                className={`flex min-w-0 flex-col items-center gap-1 rounded-2xl px-0.5 py-2 text-[10px] font-bold transition sm:px-1 sm:text-xs ${active ? 'text-[#FF6B35]' : 'text-[#8B9CB8] hover:text-white'}`}
              >
                <TabIcon className="h-5 w-5" />
                <span className="max-w-full truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    );
  };

  const getSelectedTopicCount = () => Object.values(selectedPracticeTopics).reduce((sum: number, topics) => sum + (topics as string[]).length, 0);

  const getAvailableSubtopicRows = (subject: string, topic: string) => {
    const rows = availablePracticeSubtopics[subject] || [];
    const fallbackSubtopics = fallbackPracticeSubtopicsByTopic[subject]?.[topic] || [];
    const availableSubtopics = rows
      .filter(row => row.topic === topic)
      .map(row => row.subtopic)
      .filter(Boolean);
    const merged = Array.from(new Set([...fallbackSubtopics, ...availableSubtopics]));

    return merged.map(subtopic => ({
      name: subtopic,
      available: availableSubtopics.includes(subtopic)
    }));
  };

  const getSelectableSubtopics = (subject: string, topic: string) => getAvailableSubtopicRows(subject, topic)
    .filter(subtopic => subtopic.available)
    .map(subtopic => subtopic.name);

  const toggleExpandedPracticeSubject = (subject: string) => {
    setExpandedPracticeSubjects(prev => prev.includes(subject) ? prev.filter(item => item !== subject) : [...prev, subject]);
  };

  const toggleExpandedPracticeTopic = (subject: string, topic: string) => {
    setExpandedPracticeTopics(prev => {
      const current = prev[subject] || [];
      const next = current.includes(topic) ? current.filter(item => item !== topic) : [...current, topic];
      return { ...prev, [subject]: next };
    });
  };

  const togglePracticeTopic = (subject: string, subtopic: string) => {
    setSelectedPracticeTopics(prev => {
      const current = prev[subject] || [];
      const next = current.includes(subtopic) ? current.filter(item => item !== subtopic) : [...current, subtopic];
      return { ...prev, [subject]: next };
    });
  };

  const toggleAllPracticeTopics = (subject: string, topic: string) => {
    const selectableSubtopics = getSelectableSubtopics(subject, topic);
    if (selectableSubtopics.length === 0) return;

    setSelectedPracticeTopics(prev => {
      const current = prev[subject] || [];
      const allSelected = selectableSubtopics.every(subtopic => current.includes(subtopic));
      const withoutTopicSubtopics = current.filter(subtopic => !selectableSubtopics.includes(subtopic));
      return {
        ...prev,
        [subject]: allSelected ? withoutTopicSubtopics : Array.from(new Set([...current, ...selectableSubtopics]))
      };
    });
  };

  const startSelectedPractice = () => {
    const selectedEntries = Object.entries(selectedPracticeTopics).flatMap(([subject, topics]) => (topics as string[]).map(topic => ({ subject, topic })));
    if (selectedEntries.length === 0) return;

    const selectedSubjects = Array.from(new Set(selectedEntries.map(entry => entry.subject)));
    const selectedSubtopics = selectedEntries.map(entry => entry.topic);
    const first = selectedEntries[0];
    const navigationState = {
      subjects: selectedSubjects,
      subtopics: selectedSubtopics,
      selections: selectedEntries
    };

    console.log('Start Practice navigation state:', navigationState);

    setPracticeQuestionsLoading(true);
    const params = new URLSearchParams({
      subject: first.subject,
      topic: first.topic,
      topics: JSON.stringify(selectedEntries)
    });
    navigatePath(`/practice/session?${params.toString()}`, navigationState);
  };

  const renderPlaceholderPage = (title: string, description: string) => (
    <div className="min-h-screen overflow-x-hidden bg-[#0A0F1E] pb-36 text-white font-sans">
      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 md:px-10">
        <button
          type="button"
          onClick={() => navigatePath('/dashboard')}
          className="mb-8 inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.08)] bg-[#111827] px-4 py-2 text-sm font-bold text-[#8B9CB8] transition hover:border-[#FF6B35]/50 hover:text-[#FF6B35]"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Dashboard
        </button>
        <section className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#111827] p-6 sm:p-8">
          <h1 className="font-heading text-2xl font-bold tracking-tight text-white sm:text-3xl md:text-4xl">{title}</h1>
          <p className="mt-2 max-w-2xl font-sans text-sm font-normal leading-6 text-[#8B9CB8]">{description}</p>
        </section>
      </main>
      {renderBottomNavigation()}
    </div>
  );

  const renderPracticePage = () => (
    <div className="min-h-screen bg-[#0A0F1E] px-5 pb-36 pt-10 text-white md:px-10">
      <main className="mx-auto max-w-4xl space-y-5 animate-fade-up">
        <section>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-white sm:text-3xl md:text-4xl">Practice</h1>
          <p className="mt-2 font-sans text-sm font-normal leading-6 text-[#8B9CB8]">How would you like to practice today?</p>
        </section>

        <section className="space-y-4">
          <button
            type="button"
            onClick={() => navigatePath('/practice/subjects')}
            className="group w-full rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#111827] p-6 text-left transition hover:-translate-y-0.5 hover:border-[#FF6B35]/40"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#FF6B35]/15 text-[#FF6B35]">
                <BookOpen className="h-[22px] w-[22px]" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-heading text-base font-semibold text-white">Subject Practice</h2>
                <p className="mt-1 overflow-hidden font-sans text-[13px] font-normal leading-5 text-[#8B9CB8]" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                  Choose a subject and topic to practice at your own pace. Perfect for targeting specific areas.
                </p>
              </div>
            </div>
            <div className="mt-5 flex justify-end">
              <span className="inline-flex items-center gap-1 rounded-full bg-[#FF6B35]/10 px-3 py-2 font-sans text-xs font-semibold text-[#FF6B35] transition group-hover:bg-[#FF6B35] group-hover:text-white">
                Start Mode
                <ChevronRight className="h-4 w-4" />
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => navigatePath('/practice/exam-type')}
            className="group w-full rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#111827] p-6 text-left transition hover:-translate-y-0.5 hover:border-purple-400/40"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-500/15 text-purple-300">
                <Timer className="h-[22px] w-[22px]" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-heading text-base font-semibold text-white">Full Mock Exam</h2>
                <p className="mt-1 overflow-hidden font-sans text-[13px] font-normal leading-5 text-[#8B9CB8]" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                  Simulate real exam conditions with a full timed exam.
                </p>
              </div>
            </div>
            <div className="mt-5 flex justify-end">
              <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 px-3 py-2 font-sans text-xs font-semibold text-purple-200 transition group-hover:bg-purple-500 group-hover:text-white">
                Take Exam
                <ChevronRight className="h-4 w-4" />
              </span>
            </div>
          </button>
        </section>
      </main>
      {renderBottomNavigation()}
    </div>
  );

  const renderPracticeExamTypePage = () => {
    const exams = [
      { key: 'jamb', title: 'JAMB', subtitle: 'Joint Admissions and Matriculation Board', description: '180 questions. 2 hours. All your selected subjects.', accent: '#FF6B35', tint: 'bg-[#FF6B35]/15 text-[#FF6B35]' },
      { key: 'waec', title: 'WAEC', subtitle: 'West African Examinations Council', description: 'Structured paper format. All your selected subjects.', accent: '#2EC4B6', tint: 'bg-[#2EC4B6]/15 text-[#2EC4B6]' },
      { key: 'neco', title: 'NECO', subtitle: 'National Examinations Council', description: 'Full paper simulation. All your selected subjects.', accent: '#00FF87', tint: 'bg-[#00FF87]/15 text-[#00FF87]' }
    ];

    return (
      <div className="min-h-screen bg-[#0A0F1E] px-5 pb-36 pt-8 text-white md:px-10">
        <main className="mx-auto max-w-4xl animate-fade-up">
          <button type="button" onClick={() => navigatePath('/practice')} className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-[#8B9CB8] hover:text-[#FF6B35]">
            <ChevronLeft className="h-5 w-5" /> Back
          </button>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-white sm:text-3xl md:text-4xl">Select Exam Type</h1>
          <p className="mt-2 font-sans text-sm font-normal leading-6 text-[#8B9CB8]">Choose which exam you want to simulate today.</p>

          <section className="mt-6 space-y-3">
            {exams.map(exam => (
              <button
                key={exam.key}
                type="button"
                onClick={() => navigatePath(`/mock-exam/${exam.key}`)}
                className="group flex w-full items-center gap-4 rounded-2xl border border-[rgba(255,255,255,0.08)] border-l-4 bg-[#111827] p-4 text-left transition hover:border-white/15 sm:p-5"
                style={{ borderLeftColor: exam.accent }}
              >
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl p-3 ${exam.tint}`}>
                  <FileText className="h-[22px] w-[22px]" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-heading text-base font-semibold text-white">{exam.title}</h2>
                  <p className="mt-1 font-sans text-[13px] font-normal text-[#C8D2E4]">{exam.subtitle}</p>
                  <p className="mt-1 font-sans text-[13px] font-normal leading-5 text-[#8B9CB8]">{exam.description}</p>
                </div>
                <ChevronRight className="h-6 w-6 shrink-0 transition group-hover:translate-x-1" style={{ color: exam.accent }} />
              </button>
            ))}
          </section>

          <p className="mt-6 rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#111827] p-4 text-sm leading-6 text-[#8B9CB8]">
            Your exam simulation will only include subjects you selected during onboarding.
          </p>
        </main>
        {renderBottomNavigation()}
      </div>
    );
  };

  const renderPracticeSubjectsPage = () => {
    const practiceSubjects = subjectLibrary.filter(subject => subject.name !== 'Literature');
    const selectedCount = getSelectedTopicCount();

    return (
      <div className="min-h-screen bg-[#0A0F1E] px-5 pb-40 pt-8 text-white md:px-10">
        <main className="mx-auto max-w-4xl animate-fade-up">
          <button type="button" onClick={() => navigatePath('/practice')} className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-[#8B9CB8] hover:text-[#FF6B35]">
            <ChevronLeft className="h-5 w-5" /> Back
          </button>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-white sm:text-3xl md:text-4xl">Select Subject</h1>
          <p className="mt-2 font-sans text-sm font-normal leading-6 text-[#8B9CB8]">Choose a subject, then select available subtopics.</p>
          {loadingPracticeAvailability && (
            <p className="mt-2 inline-flex items-center gap-2 font-sans text-xs font-normal text-[#8B9CB8]">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-[#FF6B35]" />
              Checking available questions...
            </p>
          )}

          <section className="mt-6 space-y-3">
            {practiceSubjects.map(subject => {
              const topics = subtopicsBySubject[subject.name] || [];
              const selectedSubtopics = selectedPracticeTopics[subject.name] || [];
              const expanded = expandedPracticeSubjects.includes(subject.name);
              const expandedTopics = expandedPracticeTopics[subject.name] || [];
              const ExpandIcon = expanded ? ChevronUp : ChevronDown;

              return (
                <div key={subject.name} className="overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#111827]" style={{ borderLeftColor: subject.accent, borderLeftWidth: 4 }}>
                  <button type="button" onClick={() => toggleExpandedPracticeSubject(subject.name)} className="flex w-full items-center justify-between gap-4 p-4 text-left">
                    <div className="min-w-0">
                      <h2 className="break-words font-heading text-base font-semibold leading-5 text-white sm:text-lg">{subject.name}</h2>
                      <p className="mt-1 font-sans text-[13px] font-normal text-[#8B9CB8]">tap to see topics</p>
                    </div>
                    <ExpandIcon className="h-5 w-5 shrink-0 text-[#8B9CB8]" />
                  </button>

                  {expanded && (
                    <div className="animate-slide-up border-t border-white/10 px-4 pb-4">
                      {topics.map(topic => {
                        const topicSubtopics = getAvailableSubtopicRows(subject.name, topic);
                        const selectableSubtopics = topicSubtopics.filter(subtopic => subtopic.available);
                        const topicExpanded = expandedTopics.includes(topic);
                        const TopicExpandIcon = topicExpanded ? ChevronUp : ChevronDown;
                        const allSelected = selectableSubtopics.length > 0 && selectableSubtopics.every(subtopic => selectedSubtopics.includes(subtopic.name));
                        const hasAvailableSubtopics = selectableSubtopics.length > 0;

                        if (!hasAvailableSubtopics && topicSubtopics.length === 0) {
                          return (
                            <div key={topic} className="flex w-full items-center justify-between gap-3 border-b border-white/5 py-4 last:border-b-0">
                              <span className="font-sans text-sm font-semibold text-[#8B9CB8]">{topic}</span>
                              <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-1 font-sans text-[11px] font-semibold text-[#8B9CB8]">Coming Soon</span>
                            </div>
                          );
                        }

                        return (
                          <div key={topic} className="border-b border-white/5 py-3 last:border-b-0">
                            <button type="button" onClick={() => hasAvailableSubtopics && toggleExpandedPracticeTopic(subject.name, topic)} disabled={!hasAvailableSubtopics} className={`flex w-full items-center justify-between gap-3 text-left ${hasAvailableSubtopics ? 'text-white' : 'cursor-not-allowed text-[#8B9CB8]'}`}>
                              <div className="min-w-0">
                                <p className="font-heading text-sm font-semibold leading-5">{topic}</p>
                                <p className="mt-1 font-sans text-xs font-normal text-[#8B9CB8]">
                                  {hasAvailableSubtopics ? `${selectableSubtopics.length} available subtopic${selectableSubtopics.length === 1 ? '' : 's'}` : 'Coming Soon'}
                                </p>
                              </div>
                              {hasAvailableSubtopics ? <TopicExpandIcon className="h-4 w-4 shrink-0 text-[#FF6B35]" /> : <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-1 font-sans text-[11px] font-semibold text-[#8B9CB8]">Coming Soon</span>}
                            </button>

                            {topicExpanded && hasAvailableSubtopics && (
                              <div className="mt-3 rounded-2xl border border-white/10 bg-[#0A0F1E]/70 px-4">
                                <button type="button" onClick={() => toggleAllPracticeTopics(subject.name, topic)} className="flex w-full items-center gap-3 border-b border-white/10 py-4 text-left">
                                  <span className={`flex h-5 w-5 items-center justify-center rounded-md border ${allSelected ? 'border-[#FF6B35] bg-[#FF6B35]' : 'border-white/20 bg-[#0A0F1E]'}`}>
                                    {allSelected && <CheckCircle className="h-3.5 w-3.5 text-white" />}
                                  </span>
                                  <span className="font-heading text-sm font-semibold text-[#FF6B35]">Select All Topics</span>
                                </button>

                                {topicSubtopics.map(subtopic => {
                                  const selected = selectedSubtopics.includes(subtopic.name);
                                  return (
                                    <button key={subtopic.name} type="button" disabled={!subtopic.available} onClick={() => subtopic.available && togglePracticeTopic(subject.name, subtopic.name)} className={`flex w-full items-center gap-3 border-b border-white/5 py-4 text-left last:border-b-0 ${subtopic.available ? '' : 'cursor-not-allowed opacity-50'}`}>
                                      <span className={`flex h-5 w-5 items-center justify-center rounded-md border ${selected ? 'border-[#FF6B35] bg-[#FF6B35]' : 'border-white/20 bg-[#0A0F1E]'}`}>
                                        {selected && <CheckCircle className="h-3.5 w-3.5 text-white" />}
                                      </span>
                                      <span className={`text-sm font-semibold ${subtopic.available ? 'text-white' : 'text-[#8B9CB8]'}`}>{subtopic.name}</span>
                                      {!subtopic.available && <span className="ml-auto rounded-full border border-white/10 bg-white/5 px-2 py-1 font-sans text-[10px] font-semibold text-[#8B9CB8]">Coming Soon</span>}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </section>
        </main>

        <div className="fixed inset-x-0 bottom-[72px] z-40 border-t border-white/10 bg-[#0A0F1E]/95 px-5 py-3 backdrop-blur">
          <p className="text-center font-heading text-sm font-bold text-[#FF6B35]">{selectedCount} subtopics selected</p>
        </div>
        <div className="fixed inset-x-0 bottom-0 z-40 bg-[#0A0F1E] px-5 py-3">
          <button
            type="button"
            disabled={selectedCount === 0}
            onClick={startSelectedPractice}
            className={`mx-auto block w-full max-w-4xl rounded-2xl px-6 py-4 font-bold text-white transition ${selectedCount === 0 ? 'cursor-not-allowed bg-slate-700 text-slate-400' : 'bg-[#FF6B35] hover:bg-[#ff7c4d]'}`}
          >
            Start Practice
          </button>
        </div>
      </div>
    );
  };

  const renderPracticeSessionPage = () => {
    const params = new URLSearchParams(window.location.search);
    const fallbackSubject = params.get('subject') || (window.location.pathname.startsWith('/mock-exam/') ? getPrimaryExamLabel() : 'Mathematics');
    const fallbackSubtopic = params.get('topic') || params.get('subtopic') || (window.location.pathname.startsWith('/mock-exam/') ? 'Full Mock Exam' : 'Algebra');
    const currentQuestion = practiceQuestions[questionIndex];
    const totalQuestions = practiceQuestions.length;
    const subject = currentQuestion?.subject || fallbackSubject;
    const subtopic = currentQuestion?.subtopic || fallbackSubtopic;
    const options = currentQuestion ? getAnswerOptions(currentQuestion) : [];
    const correctIndex = currentQuestion ? getCorrectAnswerIndex(currentQuestion) : -1;
    const answeredSession = sessionSelectedAnswer !== null;
    const isCorrect = answeredSession && sessionSelectedAnswer === correctIndex;
    const progress = totalQuestions > 0 ? Math.min(((Math.min(questionIndex + 1, totalQuestions)) / totalQuestions) * 100, 100) : 0;

    if (practiceQuestionsLoading) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#0A0F1E] px-5 text-white">
          <div className="animate-fade-up text-center">
            <Loader2 className="mx-auto h-9 w-9 animate-spin text-[#FF6B35]" />
            <p className="mt-4 font-sans text-sm font-normal text-[#8B9CB8]">Loading questions...</p>
          </div>
        </div>
      );
    }

    if (totalQuestions === 0) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#0A0F1E] px-5 text-white">
          <div className="w-full max-w-md animate-fade-up rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#111827] p-6 text-center">
            <BookOpen className="mx-auto h-10 w-10 text-[#FF6B35]" />
            <h1 className="mt-5 font-heading text-2xl font-bold text-white">No questions available for this topic yet.</h1>
            <p className="mt-3 font-sans text-sm font-normal leading-6 text-[#8B9CB8]">Check back soon.</p>
            <button
              type="button"
              onClick={() => navigatePath('/practice/subjects')}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#FF6B35] px-5 py-4 font-sans text-sm font-bold text-white transition hover:bg-[#ff7c4d]"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to Subject Selection
            </button>
          </div>
        </div>
      );
    }

    if (questionIndex >= totalQuestions) {
      const percent = totalQuestions > 0 ? Math.round((sessionScore / totalQuestions) * 100) : 0;
      const message = percent > 70 ? 'Excellent work!' : percent >= 50 ? 'Good effort!' : 'Keep practicing!';

      return (
        <div className="flex min-h-screen items-center justify-center bg-[#0A0F1E] px-5 py-10 text-white">
          <div className="w-full max-w-md animate-fade-up rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#111827] p-6 text-center sm:p-8">
            <div className="mx-auto flex h-36 w-36 items-center justify-center rounded-full border-8 border-[#FF6B35]/25 bg-[#0A0F1E]">
              <span className="font-heading text-3xl font-bold text-[#FF6B35] sm:text-4xl">{percent}%</span>
            </div>
            <p className="mt-6 font-heading text-2xl font-bold text-white">{sessionScore} out of {totalQuestions}</p>
            <p className="mt-2 font-sans text-lg font-bold text-[#FF6B35]">{percent}%</p>
            <p className="mt-4 font-heading text-lg font-bold text-white">{message}</p>
            <p className="mt-2 font-sans text-sm font-normal text-[#8B9CB8]">{subject} • {subtopic}</p>

            {showFailedReview && failedPracticeQuestions.length > 0 && (
              <div className="mt-6 max-h-72 space-y-3 overflow-y-auto text-left">
                {failedPracticeQuestions.map(({ question, selectedAnswer }, index) => {
                  const failedOptions = getAnswerOptions(question);
                  const failedCorrectIndex = getCorrectAnswerIndex(question);
                  return (
                    <div key={`${question.id ?? question.question_text}-${index}`} className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
                      <p className="font-sans text-sm font-semibold leading-6 text-white">{question.question_text}</p>
                      <p className="mt-2 font-sans text-xs text-red-300">Your answer: {selectedAnswer >= 0 ? failedOptions[selectedAnswer] : 'No answer selected'}</p>
                      <p className="mt-1 font-sans text-xs text-emerald-300">Correct answer: {failedOptions[failedCorrectIndex] || question.correct_answer}</p>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-8 space-y-3">
              {failedPracticeQuestions.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowFailedReview(prev => !prev)}
                  className="w-full rounded-2xl border border-red-400/30 px-5 py-4 font-sans text-sm font-bold text-red-300 transition hover:border-red-300 hover:text-red-200"
                >
                  {showFailedReview ? 'Hide Failed Questions' : 'Review Failed Questions'}
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setQuestionIndex(0);
                  setSessionSelectedAnswer(null);
                  setSessionScore(0);
                  setQuestionTimeLeft(30);
                  setFailedPracticeQuestions([]);
                  setRecordedPracticeAnswers([]);
                  setShowFailedReview(false);
                }}
                className="w-full rounded-2xl bg-[#FF6B35] px-5 py-4 font-sans text-sm font-bold text-white transition hover:bg-[#ff7c4d]"
              >
                Practice Again
              </button>
              <button
                type="button"
                onClick={() => navigatePath('/practice')}
                className="w-full rounded-2xl border border-white/10 px-5 py-4 font-sans text-sm font-bold text-white transition hover:border-[#FF6B35]/50 hover:text-[#FF6B35]"
              >
                Back to Practice
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-[#0A0F1E] px-5 pb-36 text-white md:px-10">
        <header className="sticky top-0 z-30 -mx-5 border-b border-white/10 bg-[#0A0F1E]/95 px-5 py-4 backdrop-blur md:-mx-10 md:px-10">
          <div className="mx-auto flex max-w-4xl items-center justify-between gap-3">
            <button type="button" onClick={() => navigatePath('/practice')} className="rounded-full p-2 text-[#8B9CB8] hover:text-[#FF6B35]" aria-label="Back to practice">
              <ChevronLeft className="h-6 w-6" />
            </button>
            <div className="min-w-0 text-center">
              <p className="truncate font-heading text-base font-bold text-white">{subject}</p>
              <p className="truncate font-sans text-xs font-normal text-[#8B9CB8]">{subtopic}</p>
            </div>
            <p className="font-heading text-sm font-bold text-[#FF6B35]">{questionIndex + 1} of {totalQuestions}</p>
          </div>
          <div className="mx-auto mt-4 h-1 max-w-4xl overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-[#FF6B35] transition-all" style={{ width: `${progress}%` }} />
          </div>
        </header>

        <main className="mx-auto max-w-4xl py-8">
          <div className={`mx-auto mb-6 flex w-fit items-center gap-2 rounded-full border px-4 py-2 font-sans text-sm font-bold ${questionTimeLeft < 10 ? 'border-red-500/40 text-red-400' : 'border-white/10 text-[#8B9CB8]'}`}>
            <Clock className="h-4 w-4" />
            {questionTimeLeft}s
          </div>

          <section className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#111827] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.25)] md:p-8">
            <p className="font-sans text-lg font-normal leading-8 text-white md:text-2xl">
              {currentQuestion?.question_text}
            </p>
          </section>

          <section className="mt-6 space-y-3">
            {options.map((option, index) => {
              const selected = sessionSelectedAnswer === index;
              const correct = answeredSession && index === correctIndex;
              const wrong = answeredSession && selected && index !== correctIndex;

              return (
                <button
                  key={`${option}-${index}`}
                  type="button"
                  disabled={answeredSession}
                  onClick={() => handlePracticeAnswer(index)}
                  className={`flex w-full items-center gap-4 rounded-2xl border bg-[#111827] p-4 text-left transition ${correct ? 'border-emerald-400 text-emerald-300' : wrong ? 'border-red-400 text-red-300' : answeredSession ? 'border-white/5 opacity-45' : 'border-white/10 text-white hover:border-[#FF6B35]/50'}`}
                >
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${correct ? 'bg-emerald-500 text-white' : wrong ? 'bg-red-500 text-white' : 'bg-[#0A0F1E] text-[#8B9CB8]'}`}>
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className="font-sans text-sm md:text-base">{option}</span>
                </button>
              );
            })}
          </section>

          {answeredSession && currentQuestion && (
            <section className={`mt-6 animate-slide-up rounded-2xl border-l-4 bg-[#111827] p-5 ${isCorrect ? 'border-l-emerald-500' : 'border-l-[#FF6B35]'}`}>
              <p className={`font-heading text-sm font-bold ${isCorrect ? 'text-emerald-400' : 'text-[#FF6B35]'}`}>{isCorrect ? 'Correct' : 'Explanation'}</p>
              <p className="mt-2 font-sans text-sm font-normal leading-6 text-[#C8D2E4]">
                {currentQuestion.explanation || 'No explanation is available for this question yet.'}
              </p>
            </section>
          )}
        </main>

        {answeredSession && (
          <div className="fixed inset-x-0 bottom-0 z-40 bg-[#0A0F1E]/90 px-5 py-4 backdrop-blur">
            <button
              type="button"
              onClick={() => {
                setQuestionIndex(prev => prev + 1);
                setSessionSelectedAnswer(null);
                setQuestionTimeLeft(30);
              }}
              className="mx-auto block w-full max-w-4xl rounded-2xl bg-[#FF6B35] px-6 py-4 font-sans text-sm font-bold text-white transition hover:bg-[#ff7c4d]"
            >
              {questionIndex + 1 >= totalQuestions ? 'See Results' : 'Next Question'}
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderCheatsheetPage = () => (
    <div className="min-h-screen bg-[#0A0F1E] px-5 pb-36 pt-10 text-white md:px-10">
      <main className="mx-auto max-w-5xl animate-fade-up">
        <section>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-white sm:text-3xl md:text-4xl">Cheatsheets</h1>
          <p className="mt-2 font-sans text-sm font-normal leading-6 text-[#8B9CB8]">Quick revision for every topic.</p>
          <div className="relative mt-5">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8B9CB8]" />
            <input
              type="search"
              placeholder="Search topics"
              className="w-full rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#111827] px-12 py-4 font-sans text-sm font-normal text-white outline-none transition placeholder:text-[#8B9CB8] focus:border-[#FF6B35] focus:shadow-[0_0_0_4px_rgba(255,107,53,0.15)]"
            />
          </div>
        </section>

        <section className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {subjectLibrary.map(subject => (
            <button
              key={subject.name}
              type="button"
              onClick={() => navigatePath(`/cheatsheet/${slugify(subject.name)}`)}
              className="group flex min-h-[132px] w-full flex-col rounded-2xl border bg-[#111827] p-4 text-left transition hover:-translate-y-0.5 hover:bg-[#141d2c]"
              style={{ borderColor: subject.accent }}
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: `${subject.accent}1F`, color: subject.accent }}>
                  <BookMarked className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="whitespace-normal break-words font-heading text-base font-semibold leading-5 text-white">{subject.name}</h2>
                  <p className="mt-1 font-sans text-[13px] font-normal text-[#8B9CB8]">{subtopicsBySubject[subject.name]?.length || 0} topics</p>
                </div>
              </div>
              <div className="mt-auto flex justify-end pt-5">
                <span className="inline-flex items-center gap-1 font-sans text-sm font-semibold text-[#FF6B35] transition group-hover:text-[#ff865f]">
                  Start Revision
                  <ChevronRight className="h-4 w-4" />
                </span>
              </div>
            </button>
          ))}
        </section>
      </main>
      {renderBottomNavigation()}
    </div>
  );

  const renderCheatsheetSubjectPage = () => {
    const subjectSlug = window.location.pathname.split('/').filter(Boolean)[1] || 'mathematics';
    const subject = getSubjectFromSlug(subjectSlug);

    return (
      <div className="min-h-screen bg-[#0A0F1E] px-5 pb-36 pt-8 text-white md:px-10">
        <main className="mx-auto max-w-4xl animate-fade-up">
          <button type="button" onClick={() => navigatePath('/cheatsheet')} className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-[#8B9CB8] hover:text-[#FF6B35]">
            <ChevronLeft className="h-5 w-5" /> Back
          </button>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-white sm:text-3xl md:text-4xl">{subject}</h1>
          <div className="mt-8 divide-y divide-white/10 rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#111827] p-2">
            {(subtopicsBySubject[subject] || []).map(topic => (
              <button key={topic} type="button" onClick={() => navigatePath(`/cheatsheet/${slugify(subject)}/${slugify(topic)}`)} className="flex w-full items-center justify-between px-4 py-4 text-left">
                <span className="font-heading text-base font-bold text-white">{topic}</span>
                <ChevronRight className="h-5 w-5 text-[#FF6B35]" />
              </button>
            ))}
          </div>
        </main>
        {renderBottomNavigation()}
      </div>
    );
  };

  const renderCheatsheetContentPage = () => {
    const segments = window.location.pathname.split('/').filter(Boolean);
    const subject = getSubjectFromSlug(segments[1] || 'mathematics');
    const topic = getSubtopicFromSlug(subject, segments[2] || 'algebra');
    const shareCheatsheet = async () => {
      const shareData = {
        title: `${topic} Cheatsheet`,
        text: `Quick ExamReady revision notes for ${topic} in ${subject}.`,
        url: window.location.href
      };

      if (navigator.share) {
        await navigator.share(shareData);
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href);
        showBanner('success', 'Cheatsheet link copied.');
      }
    };
    const sections = [
      { title: 'Key Definitions', body: `${topic} questions usually test whether you understand the core terms, can identify examples quickly, and can avoid similar-looking distractors.` },
      { title: 'Important Formulas', body: `Write down the main rule for ${topic}, note when each variable changes, and practice substituting values before looking at options.` },
      { title: 'Must Know Facts', body: `Most exam questions in ${subject} reward speed and accuracy. Memorise the exceptions, standard examples, and common relationships.` },
      { title: 'Common Exam Tips', body: `Underline keywords, eliminate impossible answers first, and check units, grammar, or definitions before choosing your final option.` }
    ];

    return (
      <div className="min-h-screen bg-[#0A0F1E] px-5 pb-40 pt-8 text-white md:px-10">
        <main className="mx-auto max-w-4xl animate-fade-up">
          <button type="button" onClick={() => navigatePath(`/cheatsheet/${slugify(subject)}`)} className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-[#8B9CB8] hover:text-[#FF6B35]">
            <ChevronLeft className="h-5 w-5" /> Back
          </button>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-white sm:text-3xl md:text-4xl">{topic}</h1>
          <p className="mt-2 text-sm font-semibold text-[#8B9CB8]">{subject}</p>

          <div className="mt-8 space-y-5">
            {sections.map(section => (
              <section key={section.title} className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#111827] p-5 md:p-6">
                <h2 className="font-heading text-lg font-bold text-white">{section.title}</h2>
                <p className="mt-3 font-sans text-sm font-normal leading-7 text-[#C8D2E4] md:text-base">{section.body}</p>
              </section>
            ))}
          </div>
        </main>

        <div className="fixed inset-x-0 bottom-[72px] z-40 px-5 pb-4 md:bottom-0 md:pb-5">
          <button type="button" onClick={shareCheatsheet} className="mx-auto flex w-full max-w-4xl items-center justify-center gap-2 rounded-2xl bg-[#FF6B35] px-6 py-4 font-bold text-white shadow-[0_16px_40px_rgba(255,107,53,0.25)] transition hover:bg-[#ff7c4d]">
            <Share2 className="h-5 w-5" /> Share Cheatsheet
          </button>
        </div>
      </div>
    );
  };

  const recentBattles = [
    { opponent: 'jamb_master', date: 'Today', yours: 16, theirs: 12, result: 'Win' },
    { opponent: 'bio_queen', date: 'Yesterday', yours: 11, theirs: 15, result: 'Loss' },
    { opponent: 'math_guru', date: 'May 28', yours: 18, theirs: 14, result: 'Win' }
  ];

  const leaderboardRows = [
    { rank: 1, username: 'jamb_master', exam: 'JAMB', score: 9840, streak: 24 },
    { rank: 2, username: 'naija_scholar', exam: 'WAEC', score: 9320, streak: 19 },
    { rank: 3, username: 'chemistry_king', exam: 'JAMB', score: 9015, streak: 17 },
    { rank: 4, username: 'bio_queen', exam: 'NECO', score: 8750, streak: 16 },
    { rank: 5, username: 'math_guru', exam: 'JAMB', score: 8425, streak: 15 },
    { rank: 6, username: 'lagos_reader', exam: 'WAEC', score: 8090, streak: 12 },
    { rank: 7, username: 'physics_pro', exam: 'NECO', score: 7925, streak: 10 },
    { rank: 8, username: 'abuja_brain', exam: 'JAMB', score: 7650, streak: 9 }
  ];

  const renderBattlePage = () => {
    const generateBattleCode = () => {
      const nextCode = Math.floor(100000 + Math.random() * 900000).toString();
      setBattleCode(nextCode);
    };

    const copyBattleCode = async () => {
      if (!battleCode || !navigator.clipboard) return;
      await navigator.clipboard.writeText(battleCode);
      showBanner('success', 'Battle code copied.');
    };

    const whatsappMessage = battleCode
      ? `I challenge you to an ExamReady battle! Enter code ${battleCode} to accept. Download at examready.website`
      : '';

    return (
      <div className="min-h-screen bg-[#0A0F1E] px-5 pb-36 pt-10 text-white md:px-10">
        <main className="mx-auto max-w-5xl space-y-7 animate-fade-up">
          <section>
            <h1 className="font-heading text-2xl font-bold tracking-tight text-white sm:text-3xl md:text-4xl">Battle</h1>
            <p className="mt-2 font-sans text-sm font-normal leading-6 text-[#8B9CB8] sm:text-base">Challenge your classmates and see who knows more.</p>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#111827] p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#FF6B35]/15 text-[#FF6B35]">
                  <Swords className="h-[22px] w-[22px]" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-heading text-base font-semibold text-white">Create Battle</h2>
                  <p className="mt-1 overflow-hidden font-sans text-[13px] font-normal leading-5 text-[#8B9CB8]" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    Generate a code and share with a friend to challenge them
                  </p>
                </div>
              </div>

              {battleCode && (
                <div className="mt-5 rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#0A0F1E] p-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <p className="font-heading text-xl font-bold tracking-[0.2em] text-[#FF6B35] sm:text-2xl">
                      {battleCode.split('').join(' ')}
                    </p>
                    <button type="button" onClick={copyBattleCode} className="rounded-full border border-white/10 p-2 text-[#8B9CB8] transition hover:border-[#FF6B35]/50 hover:text-[#FF6B35]" aria-label="Copy battle code">
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="mt-2 font-sans text-xs font-normal text-[#8B9CB8]">Share this code with your opponent</p>
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#20bd5a]"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Share on WhatsApp
                  </a>
                  <div className="mt-4 flex items-center justify-center gap-2 font-sans text-xs font-normal text-[#8B9CB8]">
                    <Loader2 className="h-4 w-4 animate-spin text-[#FF6B35]" />
                    Waiting for opponent to join...
                  </div>
                </div>
              )}

              <div className="mt-5 flex justify-end">
                <button type="button" onClick={generateBattleCode} className="font-sans text-sm font-semibold text-[#FF6B35] transition hover:text-[#ff7c4d]">
                  Create Battle →
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#111827] p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-500/15 text-purple-300">
                  <Target className="h-[22px] w-[22px]" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-heading text-base font-semibold text-white">Join Battle</h2>
                  <p className="mt-1 overflow-hidden font-sans text-[13px] font-normal leading-5 text-[#8B9CB8]" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    Enter a code from your friend to accept their challenge
                  </p>
                </div>
              </div>

              <div className="mt-5 flex items-center gap-3">
                <input
                  inputMode="numeric"
                  maxLength={6}
                  value={joinBattleCode}
                  onChange={(event) => setJoinBattleCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Code"
                  className="h-10 min-w-0 flex-1 rounded-xl border border-white/10 bg-[#0A0F1E] px-3 text-center font-heading text-base font-semibold tracking-[0.18em] text-white outline-none transition placeholder:font-sans placeholder:text-xs placeholder:font-normal placeholder:tracking-normal placeholder:text-[#8B9CB8] focus:border-[#FF6B35] focus:shadow-[0_0_0_3px_rgba(255,107,53,0.12)]"
                />
                <button type="button" className="h-10 shrink-0 rounded-xl bg-[#FF6B35] px-4 font-sans text-sm font-semibold text-white transition hover:bg-[#ff7c4d]">
                  Join
                </button>
              </div>
            </div>
          </section>

          <section>
            <h2 className="font-heading text-lg font-bold text-white sm:text-xl">Recent Battles</h2>
            {recentBattles.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#111827] px-6 py-10 text-center">
                <p className="font-heading text-base font-bold text-white">No battles yet.</p>
                <p className="mt-2 font-sans text-sm font-normal text-[#8B9CB8]">Challenge a friend to get started.</p>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {recentBattles.map(battle => (
                  <div key={`${battle.opponent}-${battle.date}`} className="flex flex-col gap-3 rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#111827] p-4 sm:grid sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center">
                    <div className="min-w-0">
                      <p className="font-heading text-sm font-semibold text-white">{battle.opponent}</p>
                      <p className="mt-1 font-sans text-xs font-normal text-[#8B9CB8]">{battle.date}</p>
                    </div>
                    <p className="font-heading text-sm font-semibold text-white md:text-base">{battle.yours}/20 vs {battle.theirs}/20</p>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${battle.result === 'Win' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
                      {battle.result}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>
        {renderBottomNavigation()}
      </div>
    );
  };

  const renderLeaderboardPage = () => {
    const currentUsername = (studentProfile?.username || getDashboardUsername()).toString().toLowerCase().replace(/\s+/g, '_');
    const currentUserRow = { rank: 57, username: currentUsername || 'examready_student', exam: getPrimaryExamLabel(), score: 4210, streak: studentProfile?.streak ?? 0, current: true };
    const visibleRows = leaderboardRows.slice(3);
    const filters = ['All Subjects', 'Mathematics', 'Biology', 'Chemistry', 'Physics', 'English'];
    const topThree = leaderboardRows.slice(0, 3);
    const rankColors: Record<number, string> = { 1: '#FFD700', 2: '#C0C0C0', 3: '#CD7F32' };
    const usernameClass = (username: string, base = 'text-sm') => username.length > 12 ? 'text-[11px] sm:text-xs' : base;

    const renderLeaderboardRow = (student: typeof leaderboardRows[number] | typeof currentUserRow, highlighted = false) => (
      <div key={`${student.rank}-${student.username}`} className={`grid grid-cols-[28px_40px_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border p-4 ${highlighted ? 'border-[#FF6B35]/30 bg-[#FF6B35]/10' : 'border-[rgba(255,255,255,0.08)] bg-[#111827]'}`}>
        <span className={`font-sans text-xs font-normal ${highlighted ? 'text-[#FF6B35]' : 'text-[#8B9CB8]'}`}>#{student.rank}</span>
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-heading text-sm font-semibold text-white ${highlighted ? 'bg-[#FF6B35]' : 'bg-white/10'}`}>
          {student.username.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className={`break-words font-heading font-medium leading-tight text-white ${usernameClass(student.username, 'text-sm sm:text-base')}`}>{student.username}</p>
          <p className="mt-1 font-sans text-xs font-normal text-[#8B9CB8]">{student.exam}</p>
        </div>
        <div className="text-right">
          <p className="font-heading text-sm font-semibold text-white sm:text-base">{student.score.toLocaleString()}</p>
          <p className="mt-1 inline-flex items-center justify-end gap-1 font-sans text-xs font-normal text-[#8B9CB8]"><Flame className="h-3.5 w-3.5 text-[#FF6B35]" /> {student.streak}</p>
        </div>
      </div>
    );

    return (
      <div className="min-h-screen bg-[#0A0F1E] px-5 pb-36 pt-10 text-white md:px-10">
        <main className="mx-auto max-w-5xl space-y-7 animate-fade-up">
          <section>
            <h1 className="font-heading text-2xl font-bold tracking-tight text-white sm:text-3xl md:text-4xl">Leaderboard</h1>
            <p className="mt-2 font-sans text-sm font-normal leading-6 text-[#8B9CB8] sm:text-base">See how you rank nationally.</p>
          </section>

          <section className="space-y-4">
            <div className="flex items-end gap-6 border-b border-[rgba(255,255,255,0.08)]">
              {(['Weekly', 'Monthly', 'All Time'] as const).map(range => (
                <button key={range} type="button" onClick={() => setLeaderboardRange(range)} className={`border-b-2 px-0 pb-3 font-sans text-sm font-normal transition ${leaderboardRange === range ? 'border-[#FF6B35] text-white' : 'border-transparent text-[#8B9CB8] hover:text-white'}`}>
                  {range}
                </button>
              ))}
            </div>
            <div className="-mx-5 flex gap-5 overflow-x-auto border-b border-[rgba(255,255,255,0.08)] px-5 md:mx-0 md:px-0">
              {filters.map(filter => (
                <button key={filter} type="button" onClick={() => setLeaderboardSubject(filter)} className={`shrink-0 border-b-2 pb-3 font-sans text-sm font-normal transition ${leaderboardSubject === filter ? 'border-[#FF6B35] text-white' : 'border-transparent text-[#8B9CB8] hover:text-white'}`}>
                  {filter}
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            {topThree.map(student => {
              const color = rankColors[student.rank];
              return (
                <div key={student.username} className="grid grid-cols-[40px_28px_42px_minmax(0,1fr)] items-center gap-3 rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#111827] p-4">
                  <span className="font-heading text-2xl font-bold" style={{ color }}>#{student.rank}</span>
                  <Award className="h-6 w-6" style={{ color }} />
                  <div className="flex h-10 w-10 items-center justify-center rounded-full font-heading text-sm font-semibold text-white" style={{ backgroundColor: `${color}33` }}>
                    {student.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className={`break-words font-heading font-semibold leading-tight text-white ${usernameClass(student.username, 'text-sm sm:text-base')}`}>{student.username}</p>
                    <p className="mt-1 font-sans text-xs font-normal text-[#8B9CB8]">{student.score.toLocaleString()} pts</p>
                  </div>
                </div>
              );
            })}
          </section>

          <section className="space-y-3">
            {visibleRows.map(student => renderLeaderboardRow(student))}

            <div className="pt-3">
              <div className="mb-3 h-px bg-white/10" />
              {renderLeaderboardRow(currentUserRow, true)}
            </div>
          </section>
        </main>
        {renderBottomNavigation()}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0A0F1E] text-[#FFFFFF] font-sans overflow-x-hidden relative">
      {/* Inject custom font styles */}
      <style>{fontStyles}</style>
      <InstallPrompt />

      {/* STICKY STATUS BANNER NOTIFICATIONS */}
      {statusMessage && (
        <div className={`fixed top-24 left-1/2 z-[100] w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 px-4 py-3 sm:px-6 rounded-xl border font-sans text-sm flex items-center gap-2 shadow-2xl transition-all duration-300 ${
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
          <div className="absolute h-[min(520px,90vw)] w-[min(520px,90vw)] rounded-full bg-[radial-gradient(rgba(255,107,53,0.18),transparent_70%)] blur-3xl pointer-events-none z-0" />

          <div className="w-full max-w-md bg-[#111827]/95 border border-white/10 rounded-[24px] p-5 sm:p-8 md:p-10 shadow-[0_45px_100px_rgba(0,0,0,0.7),0_0_85px_rgba(255,107,53,0.08)] relative z-10 animate-fade-up">
            <div className="text-center mb-8">
              <span className="font-heading font-bold text-[28px] tracking-tight text-white">
                Exam<span className="text-[#FF6B35]">Ready</span>
              </span>
            </div>

            {pendingConfirmationEmail ? (
              <div className="text-center py-4">
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FF6B35]/15 text-[#FF6B35]" aria-hidden="true"><Mail className="h-7 w-7" /></div>
                <h2 className="font-heading font-bold text-2xl text-white tracking-tight mb-3">
                  Check your email
                </h2>
                <p className="font-sans text-sm leading-6 text-[#8B9CB8]">
                  We sent a confirmation link to <span className="break-all font-semibold text-white">{pendingConfirmationEmail}</span>. Click the link to activate your account and get started.
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
              <h2 className="font-heading font-bold text-2xl md:text-3xl text-white tracking-tight mb-2">
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
      {view === 'dashboard' && studentProfile && (() => {
        const username = getDashboardUsername() || 'Student';
        const actionCards = [
          {
            title: 'AI Tutor',
            description: 'Ask anything about your exam topics instantly',
            href: '/ai-tutor',
            icon: Sparkles,
            accent: '#FF6B35',
            iconBg: 'rgba(255,107,53,0.15)',
            actionText: 'Open'
          },
          {
            title: 'Weakness Assassin',
            description: 'See your weak topics and practice them',
            href: '/weakness',
            icon: Target,
            accent: '#FF6B35',
            iconBg: 'rgba(255,107,53,0.15)',
            actionText: 'View Weaknesses'
          },
          {
            title: 'Exam Practice',
            description: 'Practice subjects or take a full mock exam',
            href: '/practice',
            icon: PenLine,
            accent: '#00BBF9',
            iconBg: 'rgba(0,187,249,0.15)',
            actionText: 'Open'
          }
        ];
        const getUpdateCategoryClass = (category: string) => {
          const key = category.toLowerCase();
          if (key === 'jamb') return 'bg-[#FF6B35]';
          if (key === 'waec') return 'bg-[#2EC4B6]';
          if (key === 'neco') return 'bg-[#00B871]';
          if (key.includes('scholarship')) return 'bg-[#9B5DE5]';
          return 'bg-slate-600';
        };

        return (
          <div className="min-h-screen overflow-x-hidden bg-[#0A0F1E] pb-36 text-white font-sans scroll-smooth">
            <nav className="sticky top-0 z-40 flex h-20 items-center border-b border-[rgba(255,255,255,0.08)] bg-[#0A0F1E]/95 px-5 backdrop-blur-md md:px-10">
              <span className="font-heading text-[22px] font-bold tracking-tight text-white">
                Exam<span className="text-[#FF6B35]">Ready</span>
              </span>
            </nav>

            <main className="mx-auto max-w-6xl space-y-8 px-4 py-6 sm:px-5 md:px-10 md:py-8">
              <section className="animate-fade-up rounded-2xl border border-[rgba(255,107,53,0.2)] bg-gradient-to-br from-[#1A1A2E] to-[#111827] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.2)] sm:p-6">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h1 className="font-heading text-2xl font-bold tracking-tight text-white sm:text-3xl">
                      Hi <span className="inline-block max-w-[16ch] truncate align-bottom">{username}</span> <span aria-hidden="true">👋</span>
                    </h1>
                    <p className="mt-2 font-sans text-sm font-normal leading-6 text-[#8B9CB8]">Ready to study today?</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <button
                      type="button"
                      onClick={() => navigatePath('/profile')}
                      className="inline-flex w-auto items-center justify-center gap-2 rounded-xl border border-[rgba(255,255,255,0.08)] bg-white/5 px-3 py-2 font-sans text-xs font-semibold text-white transition hover:bg-white/10 hover:text-[#FF6B35]"
                    >
                      <UserIcon className="h-4 w-4" />
                      View Profile
                    </button>
                    <button
                      type="button"
                      onClick={showStudentPerformanceDebug}
                      className="inline-flex w-auto items-center justify-center gap-2 rounded-xl border border-[#FF6B35]/25 bg-[#FF6B35]/10 px-3 py-2 font-sans text-xs font-semibold text-[#FF6B35] transition hover:bg-[#FF6B35]/15 hover:text-white"
                    >
                      Debug Performance
                    </button>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-3 md:gap-4">
                  <div className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#111827] p-3 text-center sm:p-4">
                    <Flame className="mx-auto h-6 w-6 text-[#FF6B35] sm:h-7 sm:w-7" />
                    <p className="mt-3 truncate font-heading text-xl font-bold leading-none text-white sm:text-2xl">{studentProfile.streak ?? 0}</p>
                    <p className="mt-2 font-sans text-[13px] font-normal leading-4 text-[#8B9CB8]">Day Streak</p>
                  </div>
                  <div className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#111827] p-3 text-center sm:p-4">
                    <BookOpen className="mx-auto h-6 w-6 text-[#00BBF9] sm:h-7 sm:w-7" />
                    <p className="mt-3 truncate font-heading text-xl font-bold leading-none text-white sm:text-2xl">{dashboardPerformance.questions}</p>
                    <p className="mt-2 font-sans text-[13px] font-normal leading-4 text-[#8B9CB8]">Questions</p>
                  </div>
                  <div className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#111827] p-3 text-center sm:p-4">
                    <Target className="mx-auto h-6 w-6 text-[#2EC4B6] sm:h-7 sm:w-7" />
                    <p className="mt-3 truncate font-heading text-xl font-bold leading-none text-white sm:text-2xl">{dashboardPerformance.accuracy}%</p>
                    <p className="mt-2 font-sans text-[13px] font-normal leading-4 text-[#8B9CB8]">Accuracy</p>
                  </div>
                </div>
              </section>

              <section className="grid grid-cols-1 gap-4 animate-fade-up sm:grid-cols-2">
                {actionCards.map(card => {
                  const CardIcon = card.icon;
                  return (
                    <button
                      key={card.title}
                      type="button"
                      onClick={() => navigatePath(card.href)}
                      className="group flex cursor-pointer flex-col rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#111827] p-4 text-left transition duration-200 hover:-translate-y-0.5 hover:border-white/15"
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                          style={{ backgroundColor: card.iconBg, color: card.accent }}
                        >
                          <CardIcon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h2 className="font-heading text-base font-semibold text-white">{card.title}</h2>
                          <p className="mt-1 overflow-hidden font-sans text-[13px] font-normal leading-5 text-[#8B9CB8]" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{card.description}</p>
                        </div>
                      </div>
                      <div className="mt-4 flex justify-end">
                        <span className="inline-flex items-center gap-1 rounded-full px-3 py-2 font-sans text-xs font-semibold transition group-hover:bg-white/5" style={{ color: card.accent }}>
                          {card.actionText}
                          <ChevronRight className="h-4 w-4 transition group-hover:translate-x-1" />
                        </span>
                      </div>
                    </button>
                  );
                })}
              </section>

              <section className="animate-fade-up">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="font-heading text-lg font-bold text-white sm:text-xl">Latest Updates</h2>
                  <button
                    type="button"
                    onClick={() => navigatePath('/updates')}
                    className="inline-flex shrink-0 items-center gap-1 text-sm font-bold text-[#FF6B35] transition hover:text-[#ff7c4d]"
                  >
                    See All
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-4 space-y-3">
                  {dashboardUpdates.map((update, index) => (
                    <button
                      key={`${update.category}-${update.title}-${index}`}
                      type="button"
                      onClick={() => navigatePath('/updates')}
                      className="w-full rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#111827] p-4 text-left transition hover:border-[#FF6B35]/30"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className={`rounded-full px-3 py-1 text-[11px] font-bold text-white ${getUpdateCategoryClass(update.category)}`}>
                          {update.category}
                        </span>
                        <span className="shrink-0 text-xs font-medium text-[#8B9CB8]">{update.date}</span>
                      </div>
                      <h3 className="mt-3 truncate font-heading text-sm font-bold leading-5 text-white sm:text-base">{update.title}</h3>
                      <p className="mt-2 overflow-hidden font-sans text-[13px] font-normal leading-5 text-[#8B9CB8]" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{update.preview}</p>
                    </button>
                  ))}
                </div>
              </section>
            </main>

            {renderBottomNavigation()}
          </div>
        );
      })()}

      {/* PROFILE PLACEHOLDER PAGE */}
      {view === 'profile' && studentProfile && renderPlaceholderPage('Profile', 'Your profile settings and account details will appear here soon.')}

      {/* AI TUTOR PLACEHOLDER PAGE */}
      {view === 'aiTutor' && studentProfile && renderPlaceholderPage('AI Tutor', 'Ask-anything exam help is coming soon for your selected topics.')}

      {/* WEAKNESS ASSASSIN PAGE */}
      {view === 'weakness' && studentProfile && (
        <WeaknessAssassin
          user={currentUser}
          navigatePath={navigatePath}
          renderBottomNavigation={renderBottomNavigation}
        />
      )}

      {/* UPDATES PLACEHOLDER PAGE */}
      {view === 'updates' && studentProfile && renderPlaceholderPage('Exam Updates', 'Latest exam, scholarship, and school news will appear here soon.')}


      {/* PRACTICE PAGE */}
      {view === 'practice' && studentProfile && renderPracticePage()}

      {/* PRACTICE SUBJECT SELECTION PAGE */}
      {view === 'practiceSubjects' && studentProfile && renderPracticeSubjectsPage()}

      {/* PRACTICE EXAM TYPE PAGE */}
      {view === 'practiceExamType' && studentProfile && renderPracticeExamTypePage()}

      {/* PRACTICE SESSION PAGE */}
      {view === 'practiceSession' && studentProfile && renderPracticeSessionPage()}

      {/* CHEATSHEET PAGE */}
      {view === 'cheatsheet' && studentProfile && renderCheatsheetPage()}

      {/* CHEATSHEET SUBJECT PAGE */}
      {view === 'cheatsheetSubject' && studentProfile && renderCheatsheetSubjectPage()}

      {/* CHEATSHEET CONTENT PAGE */}
      {view === 'cheatsheetContent' && studentProfile && renderCheatsheetContentPage()}


      {/* BATTLE PAGE */}
      {view === 'battle' && studentProfile && renderBattlePage()}

      {/* LEADERBOARD PAGE */}
      {view === 'leaderboard' && studentProfile && renderLeaderboardPage()}

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
          <nav id="navbar" className="fixed top-0 left-0 right-0 h-20 bg-[rgba(10,15,30,0.95)] backdrop-blur-md border-b border-[rgba(255,255,255,0.08)] z-50 flex items-center justify-between px-6 md:px-12">
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
                  <CheckCircle className="h-3.5 w-3.5" /> Built for Nigerian Students
                </div>

                {/* Main Headline */}
                <h1 className="font-heading font-bold text-3xl sm:text-4xl md:text-4xl text-white leading-[1.1] tracking-tight">
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
                <div className="absolute h-[min(400px,90vw)] w-[min(400px,90vw)] rounded-full bg-[radial-gradient(rgba(255,107,53,0.15),transparent_70%)] blur-2xl pointer-events-none -z-10" />

                {/* Simulated Phone Mockup */}
                <div 
                  id="phone-mockup"
                  className="h-[460px] w-[230px] sm:h-[520px] sm:w-[260px] bg-[#1A1A2E] border-2 border-[rgba(255,255,255,0.1)] rounded-[36px] shadow-[0_40px_80px_rgba(0,0,0,0.6),0_0_60px_rgba(255,107,53,0.15)] overflow-hidden flex flex-col relative rotate-[-5deg] hover:rotate-0 transition-transform duration-500 animate-float"
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
                        <span className="text-xs font-bold text-white">Chidera</span>
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
                        <div className="text-xl font-bold text-white sm:text-2xl leading-none">280</div>
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
                        <span className="flex items-center justify-center gap-1 text-xs font-semibold text-white"><Flame className="h-3 w-3 text-[#FF6B35]" />9</span>
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
                        <Home className="h-3 w-3" />
                        <span>Home</span>
                      </span>
                      <span className="flex flex-col items-center">
                        <Swords className="h-3 w-3" />
                        <span>Battle</span>
                      </span>
                      <span className="flex flex-col items-center">
                        <FileText className="h-3 w-3" />
                        <span>Syllabus</span>
                      </span>
                    </div>

                  </div>
                </div>

              </div>

            </div>
          </section>

          {/* SECTION 3: STATS BAR */}
          <section id="stats-bar" className="w-full bg-[#111827] border-y border-[rgba(255,255,255,0.08)] relative z-20">
            <div className="max-w-7xl mx-auto py-8 px-6 md:px-12">
              {/* Grid layout - Horizontal row on desktop, Vertical stacked on mobile with dividers */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-4 divide-y md:divide-y-0 md:divide-x divide-[rgba(255,255,255,0.06)]">
                
                {/* Stat 1 */}
                <div className="flex flex-col items-center justify-center text-center pb-6 md:pb-0">
                  <span className="font-heading font-bold text-4xl lg:text-4xl text-[#FF6B35]">10,000+</span>
                  <span className="font-sans text-[13px] md:text-sm text-[#8B9CB8] mt-2 uppercase tracking-wide">Practice Questions</span>
                </div>

                {/* Stat 2 */}
                <div className="flex flex-col items-center justify-center text-center py-6 md:py-0">
                  <span className="font-heading font-bold text-4xl lg:text-4xl text-[#FF6B35]">5</span>
                  <span className="font-sans text-[13px] md:text-sm text-[#8B9CB8] mt-2 uppercase tracking-wide">Core Subjects</span>
                </div>

                {/* Stat 3 */}
                <div className="flex flex-col items-center justify-center text-center pt-6 md:pt-0">
                  <span className="font-heading font-bold text-4xl lg:text-4xl text-[#FF6B35]">Free</span>
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
              <h2 className="font-heading font-bold text-3xl md:text-4xl text-white tracking-tight leading-tight">
                Everything you need to pass
              </h2>
            </div>

            {/* 2x2 Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
              
              {/* Card 1 */}
              <div className="bg-[#111827] border border-[rgba(255,255,255,0.08)] rounded-2xl p-7 lg:p-8 hover:border-[rgba(255,107,53,0.3)] hover:-translate-y-1 transition-all duration-300 flex flex-col items-start gap-5">
                <div className="w-12 h-12 bg-[rgba(255,107,53,0.1)] rounded-xl flex items-center justify-center text-[#FF6B35]">
                  <Target className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-xl text-white mb-2">Weakness Assassin</h3>
                  <p className="font-sans text-sm md:text-base text-[#8B9CB8] leading-relaxed">
                    Know exactly where you are losing marks. Get focused practice sessions that target and fix your weak spots automatically.
                  </p>
                </div>
              </div>

              {/* Card 2 */}
              <div className="bg-[#111827] border border-[rgba(255,255,255,0.08)] rounded-2xl p-7 lg:p-8 hover:border-[rgba(255,107,53,0.3)] hover:-translate-y-1 transition-all duration-300 flex flex-col items-start gap-5">
                <div className="w-12 h-12 bg-[rgba(139,92,246,0.1)] rounded-xl flex items-center justify-center text-purple-300">
                  <Swords className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-xl text-white mb-2">Battle a Friend</h3>
                  <p className="font-sans text-sm md:text-base text-[#8B9CB8] leading-relaxed">
                    Challenge your classmates to quiz battles. Share a code, compete on the same questions and see who wins.
                  </p>
                </div>
              </div>

              {/* Card 3 */}
              <div className="bg-[#111827] border border-[rgba(255,255,255,0.08)] rounded-2xl p-7 lg:p-8 hover:border-[rgba(255,107,53,0.3)] hover:-translate-y-1 transition-all duration-300 flex flex-col items-start gap-5">
                <div className="w-12 h-12 bg-[rgba(20,184,166,0.1)] rounded-xl flex items-center justify-center text-[#2EC4B6]">
                  <BookMarked className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-xl text-white mb-2">Smart Cheatsheets</h3>
                  <p className="font-sans text-sm md:text-base text-[#8B9CB8] leading-relaxed">
                    One page visual summaries of every JAMB topic. Key formulas and must know facts perfect for last minute revision.
                  </p>
                </div>
              </div>

              {/* Card 4 */}
              <div className="bg-[#111827] border border-[rgba(255,255,255,0.08)] rounded-2xl p-7 lg:p-8 hover:border-[rgba(255,107,53,0.3)] hover:-translate-y-1 transition-all duration-300 flex flex-col items-start gap-5">
                <div className="w-12 h-12 bg-[rgba(245,158,11,0.1)] rounded-xl flex items-center justify-center text-amber-300">
                  <Trophy className="h-6 w-6" />
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
          <section id="how-it-works" className="py-20 md:py-28 px-6 md:px-12 max-w-7xl mx-auto relative z-10 border-t border-[rgba(255,255,255,0.08)] font-sans">
            
            {/* Centered Heading */}
            <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
              <span className="text-xs font-semibold text-[#8B9CB8] tracking-widest uppercase block">
                THE PROCESS
              </span>
              <h2 className="font-heading font-bold text-3xl md:text-4xl text-white tracking-tight leading-tight">
                Start in 3 simple steps
              </h2>
            </div>

            {/* Steps container */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 max-w-5xl mx-auto relative">
              
              {/* Step 1 */}
              <div className="relative flex flex-col items-start space-y-4">
                {/* Dashed orange line connector on desktop */}
                <div className="hidden md:block absolute left-14 top-6 w-[calc(100%-2.5rem)] border-t border-dashed border-[#FF6B35]/50 -z-10" />
                
                <div className="w-12 h-12 bg-[#FF6B35] rounded-full flex items-center justify-center text-white font-heading font-bold text-lg shadow-[0_0_15px_rgba(255,107,53,0.3)]">
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
                
                <div className="w-12 h-12 bg-[#FF6B35] rounded-full flex items-center justify-center text-white font-heading font-bold text-lg shadow-[0_0_15px_rgba(255,107,53,0.3)]">
                  2
                </div>
                <h3 className="font-heading font-bold text-xl text-white">Pick Your Subjects</h3>
                <p className="font-sans text-sm md:text-base text-[#8B9CB8] leading-relaxed">
                  Choose JAMB, WAEC or NECO. Select your subjects and your dashboard personalises instantly.
                </p>
              </div>

              {/* Step 3 */}
              <div className="relative flex flex-col items-start space-y-4">
                <div className="w-12 h-12 bg-[#FF6B35] rounded-full flex items-center justify-center text-white font-heading font-bold text-lg shadow-[0_0_15px_rgba(255,107,53,0.3)]">
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
          <section id="testimonials" className="py-20 md:py-28 px-6 md:px-12 max-w-7xl mx-auto relative z-10 border-t border-[rgba(255,255,255,0.08)] font-sans">
            
            {/* Centered Heading */}
            <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
              <span className="text-xs font-semibold text-[#8B9CB8] tracking-widest uppercase block">
                STUDENT STORIES
              </span>
              <h2 className="font-heading font-bold text-3xl md:text-4xl text-white tracking-tight leading-tight">
                Students are already winning
              </h2>
            </div>

            {/* 3 Testimonial Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
              
              {/* Testimonial Card 1 */}
              <div className="bg-[#111827] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6 lg:p-8 flex flex-col justify-between hover:border-[rgba(255,107,53,0.2)] transition-all duration-300">
                <div>
                  <span className="font-heading font-bold text-4xl text-[#FF6B35] leading-none select-none block -mt-4 mb-2">
                    &ldquo;
                  </span>
                  <p className="font-sans text-sm md:text-base text-white/90 leading-relaxed italic mb-6">
                    I went from 187 to 251 in my mock exam after just 3 weeks on ExamReady. The Weakness Assassin knew exactly what I needed to fix.
                  </p>
                </div>
                
                {/* Student Info */}
                <div className="flex items-center gap-3 border-t border-[rgba(255,255,255,0.08)] pt-4 mt-auto">
                  <div className="w-10 h-10 bg-gradient-to-tr from-[#FF6B35] to-[#FF9500] rounded-full flex items-center justify-center font-heading font-bold text-sm text-white select-none">
                    A
                  </div>
                  <div>
                    <h4 className="font-sans font-bold text-sm text-white leading-tight">Amina K.</h4>
                    <p className="font-sans text-xs text-[#8B9CB8]">Kano State</p>
                  </div>
                </div>
              </div>

              {/* Testimonial Card 2 */}
              <div className="bg-[#111827] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6 lg:p-8 flex flex-col justify-between hover:border-[rgba(255,107,53,0.2)] transition-all duration-300">
                <div>
                  <span className="font-heading font-bold text-4xl text-[#FF6B35] leading-none select-none block -mt-4 mb-2">
                    &ldquo;
                  </span>
                  <p className="font-sans text-sm md:text-base text-white/90 leading-relaxed italic mb-6">
                    My whole class uses ExamReady now. We battle each other every night before bed. I did not think studying could be this fun.
                  </p>
                </div>
                
                {/* Student Info */}
                <div className="flex items-center gap-3 border-t border-[rgba(255,255,255,0.08)] pt-4 mt-auto">
                  <div className="w-10 h-10 bg-gradient-to-tr from-[#8B5CF6] to-[#EC4899] rounded-full flex items-center justify-center font-heading font-bold text-sm text-white select-none">
                    C
                  </div>
                  <div>
                    <h4 className="font-sans font-bold text-sm text-white leading-tight">Chukwudi O.</h4>
                    <p className="font-sans text-xs text-[#8B9CB8]">Anambra State</p>
                  </div>
                </div>
              </div>

              {/* Testimonial Card 3 */}
              <div className="bg-[#111827] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6 lg:p-8 flex flex-col justify-between hover:border-[rgba(255,107,53,0.2)] transition-all duration-300">
                <div>
                  <span className="font-heading font-bold text-4xl text-[#FF6B35] leading-none select-none block -mt-4 mb-2">
                    &ldquo;
                  </span>
                  <p className="font-sans text-sm md:text-base text-white/90 leading-relaxed italic mb-6">
                    The cheatsheets alone are worth it. I screenshot them and send to my study group every week. So much better than reading textbooks.
                  </p>
                </div>
                
                {/* Student Info */}
                <div className="flex items-center gap-3 border-t border-[rgba(255,255,255,0.08)] pt-4 mt-auto">
                  <div className="w-10 h-10 bg-gradient-to-tr from-[#06B6D4] to-[#10B981] rounded-full flex items-center justify-center font-heading font-bold text-sm text-white select-none">
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
          <section id="cta" className="py-20 md:py-28 px-6 md:px-12 bg-[#0A0F1E] flex justify-center items-center relative z-10 font-sans border-t border-[rgba(255,255,255,0.08)] overflow-hidden">
            
            {/* Decorative background glow behind CTA card */}
            <div className="absolute w-[500px] h-[500px] rounded-full bg-[radial-gradient(rgba(255,107,53,0.08),transparent_70%)] blur-3xl pointer-events-none z-0" />

            <div className="w-full max-w-[700px] w-full bg-gradient-to-br from-[rgba(255,107,53,0.15)] to-[rgba(241,91,181,0.1)] border border-[rgba(255,107,53,0.2)] rounded-2xl p-8 md:p-[60px_40px] shadow-[0_0_80px_rgba(255,107,53,0.1)] text-center relative z-10 animate-fade-up">
              
              <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FF6B35]/15 text-[#FF6B35]">
                <Target className="h-7 w-7" />
              </div>

              {/* Heading */}
              <h2 className="font-heading font-bold text-3xl md:text-4xl text-white tracking-tight leading-tight mb-4">
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
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#FF6B35] px-6 py-4 text-base font-bold text-white shadow-md transition-all duration-300 hover:scale-[1.02] hover:bg-[#ff7c4d] hover:shadow-[0_0_25px_rgba(255,107,53,0.6)] active:scale-95 sm:w-auto md:text-lg"
                >
                  Get Started Free <ChevronRight className="h-5 w-5" />
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
          <footer className="bg-[#080D1A] border-t border-[rgba(255,255,255,0.08)] py-12 md:py-16 px-6 md:px-12 relative z-10 font-sans">
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
                  © 2026 ExamReady — Built for Nigerian Students
                </p>
              </div>

            </div>
          </footer>

        </div>
      )}

    </div>
  );
}
