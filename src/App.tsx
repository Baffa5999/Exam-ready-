/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
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
  FileText
} from 'lucide-react';
import Onboarding from './components/Onboarding';

// Google Fonts link inside styles
const fontStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;700&display=swap');
`;

interface LocalUser {
  uid: string;
  displayName: string;
  email: string;
}

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
}

export default function App() {
  // Navigation views: 'landing' | 'signin' | 'onboarding' | 'dashboard'
  const [view, setView] = useState<'landing' | 'signin' | 'onboarding' | 'dashboard'>('landing');
  const [currentUser, setCurrentUser] = useState<LocalUser | null>(null);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [practiceActive, setPracticeActive] = useState<boolean>(false);
  
  // Quiz states
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [showQuiz, setShowQuiz] = useState<boolean>(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answered, setAnswered] = useState<boolean>(false);

  // Initialize the app without an external session provider.
  useEffect(() => {
    setLoading(false);
  }, []);

  // Show dynamic banner messages
  const showBanner = (type: 'success' | 'error', text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => {
      setStatusMessage(null);
    }, 5000);
  };

  // Create a local placeholder profile so the app can run without a backend.
  const fetchOrInitializeProfile = (user: LocalUser) => {
    const now = new Date().toISOString();
    const profile: StudentProfile = {
      uid: user.uid,
      displayName: user.displayName || 'Nigerian Student',
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
      targetScores: {}
    };

    setStudentProfile(profile);
    setView('onboarding');
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

    setStudentProfile(prev => prev ? {
      ...prev,
      displayName: onboardingData.displayName,
      examType: primaryExam,
      targetScore: primaryTargetScore,
      isOnboarded: true,
      selectedExams: onboardingData.selectedExams,
      subjects: onboardingData.subjects,
      targetScores: onboardingData.targetScores,
      updatedAt: new Date().toISOString()
    } : null);

    setView('dashboard');
    showBanner('success', '🏆 Academy account set up successfully! Welcome!');
  };

  // Update target exam & related default score goals.
  const handleUpdateExam = (exam: 'JAMB' | 'WAEC' | 'NECO') => {
    if (!currentUser || !studentProfile) return;
    // JAMB target score generally 200-400, WAEC/NECO are aggregates / grades (A1/B2)
    const targetScore = exam === 'JAMB' ? 280 : 85; 

    setStudentProfile(prev => prev ? { 
      ...prev, 
      examType: exam, 
      targetScore, 
      updatedAt: new Date().toISOString() 
    } : null);
    showBanner('success', `🎯 Goal changed to ${exam} 2026. Keep Studying!`);
  };

  // Handle mock study sessions.
  const handleSimulatePractice = () => {
    if (!currentUser || !studentProfile) return;
    
    // Simulate updating study telemetry locally.
    const newQuestions = studentProfile.questionsPracticed + 15;
    const newStreak = studentProfile.streak + (Math.random() > 0.7 ? 1 : 0);
    const newAccuracy = Math.min(100, Math.max(50, studentProfile.accuracy + (Math.random() > 0.5 ? 2 : -1)));

    setStudentProfile(prev => prev ? {
      ...prev,
      questionsPracticed: newQuestions,
      streak: newStreak,
      accuracy: newAccuracy,
      updatedAt: new Date().toISOString()
    } : null);
    
    showBanner('success', '🔥 Study session saved locally! 15 syllabus questions completed.');
  };

  // Handle placeholder session triggers.
  const handlePlaceholderSignIn = () => {
    setLoading(true);
    const placeholderUser: LocalUser = {
      uid: 'local-student',
      displayName: 'Nigerian Student',
      email: ''
    };

    setCurrentUser(placeholderUser);
    fetchOrInitializeProfile(placeholderUser);
    showBanner('success', 'Welcome into ExamReady!');
    setLoading(false);
  };

  const handleSignOut = () => {
    setLoading(true);
    setCurrentUser(null);
    setStudentProfile(null);
    setView('landing');
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
        <div className="min-h-screen flex items-center justify-center relative bg-[#0A0F1E] px-4">
          
          {/* Centered Orange Radial Glow effect */}
          <div className="absolute w-[450px] h-[450px] rounded-full bg-[radial-gradient(rgba(255,107,53,0.18),transparent_70%)] blur-2xl pointer-events-none z-0" />
          
          <div className="w-full max-w-md bg-[#111827] border border-[rgba(255,255,255,0.06)] rounded-[28px] p-8 md:p-10 shadow-[0_45px_100px_rgba(0,0,0,0.7),0_0_85px_rgba(255,107,53,0.05)] text-center relative z-10 animate-fade-up">
            
            {/* Logo */}
            <div className="flex items-center justify-center mb-6">
              <span className="font-heading font-extrabold text-[26px] tracking-tight">
                Exam<span className="text-[#FF6B35]">Ready</span>
              </span>
            </div>

            {/* Title heading */}
            <h2 className="font-heading font-extrabold text-2xl md:text-3xl text-white tracking-tight mb-2">
              Welcome Back
            </h2>
            
            {/* Description */}
            <p className="font-sans text-sm text-[#8B9CB8] mb-8 max-w-xs mx-auto">
              Sign in to continue your exam preparation.
            </p>

            {/* Placeholder sign-in button */}
            <button
              id="placeholder-signin-btn"
              onClick={handlePlaceholderSignIn}
              disabled={loading}
              className="w-full bg-[#111827] hover:bg-[#1a2233] border border-[rgba(255,255,255,0.12)] text-white font-sans font-bold py-3.5 px-6 rounded-xl flex items-center justify-center gap-3 transition-all duration-300 hover:shadow-[0_0_25px_rgba(255,107,53,0.22)] active:scale-98 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <RefreshCw className="w-5 h-5 text-[#FF6B35] animate-spin" />
              ) : (
                <span className="flex items-center gap-2">
                  <span className="text-xl">🇳🇬</span>
                  Continue
                </span>
              )}
            </button>

            {/* Legal / Policy */}
            <p className="font-sans text-[11px] text-[#8B9CB8]/80 mt-6 leading-relaxed">
              By signing in you agree to our <a href="#terms" className="text-[#FF6B35] underline hover:text-[#ff7c4d] transition-colors">Terms</a> and <a href="#privacy" className="text-[#FF6B35] underline hover:text-[#ff7c4d] transition-colors">Privacy Policy</a>.
            </p>

            {/* Close / Return Button */}
            <div className="mt-8 pt-4 border-t border-[rgba(255,255,255,0.05)]">
              <button
                onClick={() => setView('landing')}
                className="font-sans text-xs text-[#8B9CB8] hover:text-[#FF6B35] tracking-wide uppercase transition-colors"
              >
                ← Return to Landing Page
              </button>
            </div>

          </div>

          {/* Bottom built banner */}
          <div className="absolute bottom-8 text-center w-full">
            <p className="font-sans text-xs text-[#8B9CB8]/65">
              Built for Nigerian Students 🇳🇬
            </p>
          </div>

        </div>
      )}


      {/* STUDENT DASHBOARD INTERFACE */}
      {view === 'dashboard' && studentProfile && (
        <div className="min-h-screen bg-[#0A0F1E] flex flex-col pt-20">
          
          {/* Dashboard Header Bar */}
          <header className="fixed top-0 left-0 right-0 h-20 bg-[rgba(10,15,30,0.95)] backdrop-blur-md border-b border-[rgba(255,255,255,0.06)] z-50 flex items-center justify-between px-6 md:px-12">
            <div className="flex items-center gap-3">
              <span className="font-heading font-bold text-xl tracking-tight">
                Exam<span className="text-[#FF6B35]">Ready</span>
              </span>
              <span className="text-[10px] bg-[rgba(255,107,53,0.12)] text-[#FF6B35] px-2 py-0.5 rounded-full font-bold">
                ACADEMY PORTAL
              </span>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs text-[#8B9CB8]">Active Student</span>
                <span className="text-sm font-bold text-white">{studentProfile.displayName}</span>
              </div>
              <button
                onClick={handleSignOut}
                className="hover:bg-[rgba(255,107,53,0.1)] border border-[rgba(255,255,255,0.1)] hover:border-[#FF6B35]/40 text-[#8B9CB8] hover:text-[#FF6B35] rounded-xl p-2.5 transition-all cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </header>

          {/* Portal Layout Grid */}
          <main className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-8 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
            
            {/* Column 1: Progress Indicators & Interactive controls (8 cols) */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Profile welcome row */}
              <div className="bg-gradient-to-r from-[#111827] to-[#1a2233] border border-[rgba(255,255,255,0.06)] rounded-[24px] p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
                <div className="absolute right-0 bottom-0 translate-y-1/4 translate-x-1/4 w-44 h-44 bg-[#FF6B35] opacity-5 rounded-full blur-2xl" />
                
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">🎓</span>
                    <span className="text-xs font-bold text-[#FF6B35] uppercase tracking-widest">Syllabus-Aligned</span>
                  </div>
                  <h1 className="font-heading font-extrabold text-2xl md:text-3xl text-white mb-2 leading-tight">
                    Welcome back, {studentProfile.displayName.split(' ')[0]}!
                  </h1>
                  <p className="font-sans text-sm text-[#8B9CB8] max-w-lg">
                    Your study stats update locally while you use the app. Continue reading topic cheatsheets or practice daily mocks to raise your exam accuracy.
                  </p>
                </div>

                <div className="bg-[#0A0F1E] border border-[rgba(255,255,255,0.06)] rounded-2xl p-4 flex flex-col shrink-0 items-center justify-center text-center">
                  <span className="text-xs text-[#8B9CB8]">Target Exam</span>
                  <span className="text-xl font-heading font-extrabold text-white mt-1">{studentProfile.examType} 2026</span>
                  <span className="text-[10px] text-[#FF6B35]/85 bg-[rgba(255,107,53,0.12)] px-2 py-0.5 rounded-md mt-2 font-bold uppercase">
                    Aiming {studentProfile.targetScore}
                  </span>
                </div>
              </div>

              {/* Fast Exam Selector Row */}
              <div className="bg-[#111827] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6 font-sans">
                <h3 className="text-sm font-heading font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Target className="w-4 h-4 text-[#FF6B35]" /> Configure Your 2026 Target Exam
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {(['JAMB', 'WAEC', 'NECO'] as const).map((exam) => (
                    <button
                      key={exam}
                      onClick={() => handleUpdateExam(exam)}
                      className={`py-3 px-4 rounded-xl font-bold font-heading text-sm transition-all duration-300 ${
                        studentProfile.examType === exam
                          ? 'bg-[#FF6B35] text-white shadow-lg shadow-[rgba(255,107,53,0.3)]'
                          : 'bg-[#0A0F1E] hover:bg-[#ff6b35]/10 border border-[rgba(255,255,255,0.06)] text-[#8B9CB8] hover:text-white'
                      }`}
                    >
                      {exam} Target
                    </button>
                  ))}
                </div>
              </div>

              {/* MOCK ARENA */}
              <div className="bg-[#111827] border border-[rgba(255,255,255,0.06)] rounded-[24px] overflow-hidden">
                <div className="border-b border-[rgba(255,255,255,0.06)] p-5 flex items-center justify-between bg-[rgba(255,107,53,0.02)]">
                  <h3 className="font-heading font-bold text-lg text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#FF6B35] animate-pulse" /> Weakness Assassin Diagnostic Arena
                  </h3>

                  <button
                    onClick={handleSimulatePractice}
                    className="bg-[#FF6B35] hover:bg-[#ff7c4d] text-white font-sans font-bold text-xs py-2 px-4 rounded-lg transition-all flex items-center gap-1.5"
                  >
                    <Zap className="w-3.5 h-3.5 fill-current" /> Auto Practice
                  </button>
                </div>

                <div className="p-6 space-y-6">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#0A0F1E] border border-[rgba(255,255,255,0.04)] p-4 rounded-xl">
                    <div className="space-y-1">
                      <span className="text-[10px] tracking-wide uppercase font-bold text-[#FF6B35] block">CURRENT LEVEL</span>
                      <h4 className="text-sm font-bold text-white">Interactive Chemistry Syllabus Practice</h4>
                      <p className="text-xs text-[#8B9CB8]">Question aligns with standard sub-topics on functional groups</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold bg-[#111827] px-3 py-1.5 border border-[rgba(255,255,255,0.06)] rounded-lg text-white">
                        Subject: Chemistry
                      </span>
                    </div>
                  </div>

                  {/* Standard Syllabus Quiz Question block */}
                  <div className="bg-[#0A0F1E] border border-[rgba(255,255,255,0.06)] rounded-xl p-5 space-y-4">
                    <span className="text-xs font-bold bg-[#FF6B35]/10 text-[#FF6B35] border border-[#FF6B35]/20 px-2 py-0.5 rounded">
                      QUESTION 12
                    </span>
                    <p className="text-sm md:text-base text-white/95 font-medium leading-relaxed">
                      Which of the following organic functional groups contains a &ldquo;Carbonyl&rdquo; group bonded directly to at least one Hydrogen atom?
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                      {[
                        'Esters (R-COOR)',
                        'Ketones (R-CO-R)',
                        'Aldehydes (R-CHO)',
                        'Ethers (R-O-R)'
                      ].map((option, idx) => {
                        let btnStyle = "bg-[#111827] hover:bg-[#1f293d] border-[rgba(255,255,255,0.05)] text-[#8B9CB8]";
                        if (answered) {
                          if (idx === 2) {
                            btnStyle = "bg-emerald-500/20 border-emerald-500/50 text-emerald-300";
                          } else if (selectedAnswer === idx) {
                            btnStyle = "bg-red-500/20 border-red-500/50 text-red-300";
                          } else {
                            btnStyle = "bg-[#111827] opacity-60 border-[rgba(255,255,255,0.05)] text-[#8B9CB8]";
                          }
                        }
                        return (
                          <button
                            key={idx}
                            disabled={answered}
                            onClick={() => handleAnswerQuestion(idx)}
                            className={`border p-3.5 rounded-xl text-left text-xs md:text-sm font-medium transition-all flex justify-between items-center ${btnStyle} ${!answered ? 'cursor-pointer hover:border-[#FF6B35]/30' : 'cursor-default'}`}
                          >
                            <span>{String.fromCharCode(65 + idx)}. {option}</span>
                            {answered && idx === 2 && <span className="text-emerald-400 text-xs">Correct ✓</span>}
                          </button>
                        );
                      })}
                    </div>

                    {answered && (
                      <div className="bg-[#111827] border border-[rgba(255,255,255,0.05)] p-4 rounded-xl text-xs md:text-sm text-[#8B9CB8] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                          <p className="text-white font-bold mb-1">Explanation:</p>
                          <p>Aldehydes have the general structure R-CHO, meaning the carbonyl carbon (C=O) is bonded directly to at least one Hydrogen atom.</p>
                        </div>
                        <button
                          onClick={handleResetQuiz}
                          className="bg-[#0A0F1E] border border-[rgba(255,255,255,0.1)] hover:border-[#FF6B35]/40 text-white font-sans text-[11px] font-bold py-2 px-3.5 rounded-lg shrink-0 cursor-pointer"
                        >
                          Next Question
                        </button>
                      </div>
                    )}
                  </div>

                </div>
              </div>

              {/* STUDY MANUALS & STUDY SLOP / PERSISTENT NOTES EXAMPLES */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
                <div className="bg-[#111827] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
                  <h4 className="font-heading font-bold text-base text-white mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#FF6B35]" /> Core Syllabus Cheatsheets
                  </h4>
                  <ul className="space-y-3 font-sans text-xs md:text-sm text-[#8B9CB8]">
                    <li className="flex items-center justify-between border-b border-[rgba(255,255,255,0.04)] pb-2">
                      <span className="text-white">Mathematics: Circle Theorems</span>
                      <span className="text-[10px] bg-sky-500/10 text-sky-400 px-2 py-0.5 rounded">PDF Cheatsheet</span>
                    </li>
                    <li className="flex items-center justify-between border-b border-[rgba(255,255,255,0.04)] pb-2">
                      <span className="text-white">Physics: Waves & Sound Motion</span>
                      <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded">Active Summary</span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span className="text-white">English: Sentence Concord Rules</span>
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded">Full Revision</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-[#111827] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
                  <h4 className="font-heading font-bold text-base text-white mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#FF6B35]" /> Active Arena Competitors
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-amber-500/20 text-amber-400 rounded-full flex items-center justify-center text-[10px] font-bold">1</div>
                        <span className="text-xs text-white">Chukwudi O.</span>
                      </div>
                      <span className="text-[10px] text-[#8B9CB8]">93% Acc. / Anambra</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-[#FF6B35]/20 text-[#FF6B35] rounded-full flex items-center justify-center text-[10px] font-bold">2</div>
                        <span className="text-xs text-white">Amina K.</span>
                      </div>
                      <span className="text-[10px] text-[#8B9CB8]">89% Acc. / Kano</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-purple-500/20 text-purple-400 rounded-full flex items-center justify-center text-[10px] font-bold">3</div>
                        <span className="text-xs text-white">Fatima M.</span>
                      </div>
                      <span className="text-[10px] text-[#8B9CB8]">84% Acc. / Kaduna</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Column 2: Statistics Sidebar (4 cols) */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Student Profile Card */}
              <div className="bg-[#111827] border border-[rgba(255,255,255,0.06)] rounded-[24px] p-6 text-center relative overflow-hidden">
                <div className="w-16 h-16 mx-auto bg-gradient-to-tr from-[#FF6B35] to-[#FF9500] rounded-full flex items-center justify-center text-xl font-heading font-extrabold text-white mb-3 shadow-[0_0_20px_rgba(255,107,53,0.3)]">
                  {studentProfile.displayName.charAt(0).toUpperCase()}
                </div>
                
                <h3 className="text-lg font-heading font-extrabold text-white leading-snug">{studentProfile.displayName}</h3>
                <p className="text-xs text-[#8B9CB8] mt-1">{studentProfile.email}</p>

                {/* Local session indicator status */}
                <div className="mt-4 inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2.5 py-1 rounded-full">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Local session active</span>
                </div>
              </div>

              {/* Local study stats */}
              <div className="bg-[#111827] border border-[rgba(255,255,255,0.06)] rounded-[24px] p-6 space-y-4">
                <h4 className="text-xs font-heading font-bold text-white uppercase tracking-widest border-b border-[rgba(255,255,255,0.04)] pb-3">
                  Study Metrics
                </h4>

                <div className="space-y-3">
                  {/* Streak Card */}
                  <div className="flex justify-between items-center bg-[#0A0F1E] p-3 rounded-xl border border-[rgba(255,255,255,0.02)]">
                    <div className="flex items-center gap-2 text-xs">
                      <Flame className="w-4 h-4 text-[#FF6B35] fill-current" />
                      <span className="text-[#8B9CB8]">Study Streak</span>
                    </div>
                    <span className="font-heading font-extrabold text-white text-sm">{studentProfile.streak}🔥</span>
                  </div>

                  {/* Questions Practiced */}
                  <div className="flex justify-between items-center bg-[#0A0F1E] p-3 rounded-xl border border-[rgba(255,255,255,0.02)]">
                    <div className="flex items-center gap-2 text-xs">
                      <CheckCircle className="w-4 h-4 text-[#FF6B35]" />
                      <span className="text-[#8B9CB8]">Questions Solved</span>
                    </div>
                    <span className="font-heading font-extrabold text-white text-sm">{studentProfile.questionsPracticed} / 10K+</span>
                  </div>

                  {/* Accuracy Rate */}
                  <div className="flex justify-between items-center bg-[#0A0F1E] p-3 rounded-xl border border-[rgba(255,255,255,0.02)]">
                    <div className="flex items-center gap-2 text-xs">
                      <Award className="w-4 h-4 text-[#FF6B35]" />
                      <span className="text-[#8B9CB8]">Syllabus Accuracy</span>
                    </div>
                    <span className="font-heading font-extrabold text-[#FF6B35] text-sm">{studentProfile.accuracy}%</span>
                  </div>
                </div>

                <p className="text-[10px] text-[#8B9CB8] text-center leading-relaxed">
                  These metrics update in the current local session.
                </p>
              </div>

              {/* Study helper tip */}
              <div className="bg-gradient-to-br from-[#111827] to-[rgba(255,107,53,0.04)] border border-[#FF6B35]/10 rounded-[20px] p-5 space-y-2">
                <span className="text-xs font-bold text-[#FF6B35]">🚀 Study Tip of the Day</span>
                <p className="text-xs text-[#8B9CB8] leading-relaxed">
                  Syllabus requirements for JAMB Literature stress reading set-books in depth. Practice 15 mock questions on poetry today to retain terms!
                </p>
              </div>

            </div>

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
                onClick={() => setView('signin')}
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
                    onClick={() => setView('signin')}
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
                  onClick={() => setView('signin')}
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
