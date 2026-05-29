import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, BookOpen, GraduationCap, Trophy, ChevronDown, Sparkles, LogOut } from 'lucide-react';

interface OnboardingProps {
  initialName: string;
  onComplete: (data: {
    displayName: string;
    selectedExams: ('JAMB' | 'WAEC' | 'NECO')[];
    subjects: Record<string, string[]>;
    targetScores: Record<string, string | number>;
  }) => Promise<void>;
  onSignOut: () => void;
}

const ALL_SUBJECTS = [
  'Mathematics',
  'English Language',
  'Biology',
  'Chemistry',
  'Physics',
  'Literature',
  'Government',
  'Commerce',
  'Economics',
  'Geography'
];

const GRADES = ['A1', 'B2', 'B3', 'C4', 'C5', 'C6'];

export default function Onboarding({ initialName, onComplete, onSignOut }: OnboardingProps) {
  const [step, setStep] = useState<number>(1);
  const [direction, setDirection] = useState<number>(1); // 1 for next, -1 for back
  const [name, setName] = useState<string>(initialName || '');

  // Step 2 Selection States
  const [selectedExams, setSelectedExams] = useState<('JAMB' | 'WAEC' | 'NECO')[]>([]);
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({
    JAMB: false,
    WAEC: false,
    NECO: false
  });
  const [examSubjects, setExamSubjects] = useState<Record<string, string[]>>({
    JAMB: [],
    WAEC: [],
    NECO: []
  });

  // Step 3 Selection States
  const [jambTarget, setJambTarget] = useState<string>('280');
  const [waecTarget, setWaecTarget] = useState<string>('B2');
  const [necoTarget, setNecoTarget] = useState<string>('B2');

  const [saving, setSaving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Animation variants for smooth slide transitions (left to right)
  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 300 : -300,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: {
        x: { type: 'spring', stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 }
      }
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -300 : 300,
      opacity: 0,
      transition: {
        x: { type: 'spring', stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 }
      }
    })
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (!name.trim()) return;
      setDirection(1);
      setStep(2);
    } else if (step === 2) {
      if (selectedExams.length === 0) {
        setErrorMsg('Please select at least one exam to prepare for.');
        return;
      }
      // Check if they selected subjects for each chosen exam
      const missingSubjects = selectedExams.some(exam => examSubjects[exam].length === 0);
      if (missingSubjects) {
        setErrorMsg('Please select at least one subject for each selected exam.');
        return;
      }
      setErrorMsg(null);
      setDirection(1);
      setStep(3);
    }
  };

  const handlePrevStep = () => {
    setErrorMsg(null);
    setDirection(-1);
    setStep(prev => Math.max(1, prev - 1));
  };

  const toggleExam = (exam: 'JAMB' | 'WAEC' | 'NECO') => {
    setErrorMsg(null);
    setSelectedExams(prev => {
      const isSelected = prev.includes(exam);
      if (isSelected) {
        // Remove exam
        const updated = prev.filter(e => e !== exam);
        setOpenDropdowns(d => ({ ...d, [exam]: false }));
        return updated;
      } else {
        // Add exam and open the subject dropdown automatically
        const updated = [...prev, exam];
        setOpenDropdowns(d => ({ ...d, [exam]: true }));
        return updated;
      }
    });
  };

  const toggleSubject = (exam: string, subject: string) => {
    setErrorMsg(null);
    setExamSubjects(prev => {
      const current = prev[exam] || [];
      const updated = current.includes(subject)
        ? current.filter(s => s !== subject)
        : [...current, subject];
      return { ...prev, [exam]: updated };
    });
  };

  const toggleDropdown = (exam: string) => {
    setOpenDropdowns(prev => ({
      ...prev,
      [exam]: !prev[exam]
    }));
  };

  const handleFinish = async () => {
    setErrorMsg(null);
    // Validate Step 3 Inputs
    if (selectedExams.includes('JAMB')) {
      const score = parseInt(jambTarget, 10);
      if (isNaN(score) || score < 180 || score > 400) {
        setErrorMsg('Please enter a valid JAMB target score between 180 and 400.');
        return;
      }
    }

    setSaving(true);
    try {
      const finalSubjects: Record<string, string[]> = {};
      const finalTargetScores: Record<string, string | number> = {};

      selectedExams.forEach(exam => {
        finalSubjects[exam] = examSubjects[exam];
        if (exam === 'JAMB') {
          finalTargetScores[exam] = parseInt(jambTarget, 10);
        } else if (exam === 'WAEC') {
          finalTargetScores[exam] = waecTarget;
        } else if (exam === 'NECO') {
          finalTargetScores[exam] = necoTarget;
        }
      });

      await onComplete({
        displayName: name.trim(),
        selectedExams,
        subjects: finalSubjects,
        targetScores: finalTargetScores
      });
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'An error occurred while saving your profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0F1E] text-white font-sans flex flex-col relative select-none">
      
      {/* Decorative radial background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-[radial-gradient(rgba(255,107,53,0.1),transparent_70%)] blur-3xl pointer-events-none z-0" />

      {/* Top Header Row / Navigation */}
      <header className="w-full max-w-5xl mx-auto px-6 py-6 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <GraduationCap className="w-8 h-8 text-[#FF6B35]" />
          <span className="font-heading font-extrabold text-2xl tracking-tight">
            Exam<span className="text-[#FF6B35]">Ready</span>
          </span>
        </div>
        <button
          onClick={onSignOut}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm border border-white/5 bg-[#111827] hover:bg-[#1f293d]/80 text-gray-400 hover:text-white transition-all cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </header>

      {/* Onboarding Centered Panel Card */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 md:px-6 flex flex-col justify-center pb-24 relative z-10">
        
        {/* Step dots Progress indicator at the top with line details */}
        <div className="flex items-center justify-center gap-4 mb-10">
          {[1, 2, 3].map((s) => {
            const isActive = step === s;
            const isCompleted = step > s;
            return (
              <React.Fragment key={s}>
                {/* Step Circle */}
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-heading font-extrabold text-sm border-2 transition-all duration-500 shadow-lg ${
                      isCompleted 
                        ? 'bg-[#FF6B35] border-[#FF6B35] text-white' 
                        : isActive 
                        ? 'border-[#FF6B35] text-[#FF6B35] scale-110 shadow-[#FF6B35]/25 bg-amber-500/5' 
                        : 'border-gray-700 text-gray-500 bg-transparent'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5 stroke-[3]" />
                    ) : (
                      s
                    )}
                  </div>
                  <span className={`text-[10px] mt-2 font-heading font-bold uppercase tracking-wider ${
                    isActive ? 'text-[#FF6B35]' : 'text-gray-500'
                  }`}>
                    {s === 1 ? 'Name' : s === 2 ? 'Exams' : 'Targets'}
                  </span>
                </div>
                
                {/* Connecting Line */}
                {s < 3 && (
                  <div className="flex-1 max-w-[60px] h-[2px] bg-gradient-to-r relative -top-3">
                    <div 
                      className={`absolute inset-0 transition-all duration-500 ${
                        step > s 
                          ? 'bg-[#FF6B35]' 
                          : 'bg-gray-800'
                      }`} 
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Dynamic Display of System/Server Error Banners */}
        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-3 animate-fade-up">
            <span className="text-lg">⚠️</span>
            <p className="font-sans leading-relaxed">{errorMsg}</p>
          </div>
        )}

        {/* Step Transition Frame */}
        <div className="relative overflow-visible w-full min-h-[420px]">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="w-full absolute inset-x-0 top-0 flex flex-col"
            >
              
              {/* STEP 1: Name Input */}
              {step === 1 && (
                <div className="space-y-6">
                  <div className="text-center space-y-2">
                    <h1 className="font-heading font-extrabold text-3xl md:text-4xl text-white tracking-tight leading-tight">
                      What should we call you?
                    </h1>
                    <p className="font-sans text-sm md:text-base text-[#8B9CB8]">
                      This is how you will appear on the leaderboard and in battles.
                    </p>
                  </div>

                  <div className="space-y-4 pt-4 max-w-md mx-auto">
                    <div className="relative">
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => {
                          setName(e.target.value);
                          setErrorMsg(null);
                        }}
                        placeholder="Enter your full name"
                        className="w-full bg-[#111827] text-white border-2 border-white/10 rounded-2xl px-5 py-4 placeholder:text-gray-500 font-sans font-medium text-base transition-all duration-300 focus:border-[#FF6B35] focus:shadow-[0_0_20px_rgba(255,107,53,0.15)] focus:outline-none"
                      />
                    </div>

                    <button
                      onClick={handleNextStep}
                      disabled={!name.trim()}
                      className={`w-full py-4 rounded-2xl font-heading font-extrabold text-base tracking-wide transition-all duration-300 transform active:scale-[0.98] ${
                        name.trim()
                          ? 'bg-[#FF6B35] text-white shadow-lg shadow-[rgba(255,107,53,0.3)] hover:brightness-110 cursor-pointer'
                          : 'bg-[#FF6B35]/30 text-white/50 cursor-not-allowed opacity-50'
                      }`}
                    >
                      Continue
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: Exam Selection */}
              {step === 2 && (
                <div className="space-y-6 pb-28">
                  <div className="text-center space-y-2">
                    <h1 className="font-heading font-extrabold text-3xl md:text-4xl text-white tracking-tight leading-tight">
                      Which exams are you preparing for?
                    </h1>
                    <p className="font-sans text-sm md:text-base text-[#8B9CB8]">
                      You can select more than one.
                    </p>
                  </div>

                  {/* Vertical stack of 3 exam cards */}
                  <div className="space-y-4 max-w-lg mx-auto pt-2">
                    
                    {/* JAMB CARD */}
                    <div className="space-y-1">
                      <div
                        onClick={() => toggleExam('JAMB')}
                        className={`p-5 rounded-2xl bg-[#111827] border-2 transition-all duration-300 cursor-pointer flex justify-between items-center relative ${
                          selectedExams.includes('JAMB')
                            ? 'border-[#FF6B35] shadow-[0_0_15px_rgba(255,107,53,0.1)]'
                            : 'border-white/5 hover:border-white/10'
                        }`}
                      >
                        <div className="space-y-1">
                          <span className="font-heading font-extrabold text-lg text-white block">
                            JAMB
                          </span>
                          <span className="font-sans text-xs text-gray-400 block">
                            Joint Admissions and Matriculation Board
                          </span>
                        </div>
                        {selectedExams.includes('JAMB') && (
                          <div className="w-5 h-5 rounded-full bg-[#FF6B35] flex items-center justify-center animate-fade-up">
                            <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                          </div>
                        )}
                      </div>

                      {/* Dropdown for JAMB */}
                      <AnimatePresence>
                        {selectedExams.includes('JAMB') && openDropdowns.JAMB && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="bg-[#111827]/60 border border-white/5 rounded-2xl mt-1.5 p-4 overflow-hidden"
                          >
                            <span className="text-xs font-heading font-extrabold text-zinc-400 tracking-wider uppercase block mb-3">
                              Select JAMB Syllabus Subjects
                            </span>
                            <div className="grid grid-cols-2 gap-2">
                              {ALL_SUBJECTS.map((subject) => {
                                const isChecked = examSubjects.JAMB.includes(subject);
                                return (
                                  <label
                                    key={subject}
                                    className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all cursor-pointer ${
                                      isChecked
                                        ? 'bg-[#FF6B35]/5 border-[#FF6B35]/30 text-[#FF6B35]'
                                        : 'bg-[#0A0F1E] border-white/5 text-gray-300 hover:text-white'
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => toggleSubject('JAMB', subject)}
                                      className="sr-only"
                                    />
                                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                                      isChecked 
                                        ? 'bg-[#FF6B35] border-[#FF6B35]' 
                                        : 'border-gray-600 bg-transparent'
                                    }`}>
                                      {isChecked && <Check className="w-3 h-3 text-white stroke-[3]" />}
                                    </div>
                                    <span className="text-xs font-semibold select-none">{subject}</span>
                                  </label>
                                );
                              })}
                            </div>
                            <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center text-xs">
                              <span className="text-[#FF6B35] font-bold">
                                {examSubjects.JAMB.length} subjects selected
                              </span>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* WAEC CARD */}
                    <div className="space-y-1">
                      <div
                        onClick={() => toggleExam('WAEC')}
                        className={`p-5 rounded-2xl bg-[#111827] border-2 transition-all duration-300 cursor-pointer flex justify-between items-center relative ${
                          selectedExams.includes('WAEC')
                            ? 'border-[#FF6B35] shadow-[0_0_15px_rgba(255,107,53,0.1)]'
                            : 'border-white/5 hover:border-white/10'
                        }`}
                      >
                        <div className="space-y-1">
                          <span className="font-heading font-extrabold text-lg text-white block">
                            WAEC
                          </span>
                          <span className="font-sans text-xs text-gray-400 block">
                            West African Examinations Council
                          </span>
                        </div>
                        {selectedExams.includes('WAEC') && (
                          <div className="w-5 h-5 rounded-full bg-[#FF6B35] flex items-center justify-center animate-fade-up">
                            <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                          </div>
                        )}
                      </div>

                      {/* Dropdown for WAEC */}
                      <AnimatePresence>
                        {selectedExams.includes('WAEC') && openDropdowns.WAEC && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="bg-[#111827]/60 border border-white/5 rounded-2xl mt-1.5 p-4 overflow-hidden"
                          >
                            <span className="text-xs font-heading font-extrabold text-zinc-400 tracking-wider uppercase block mb-3">
                              Select WAEC Syllabus Subjects
                            </span>
                            <div className="grid grid-cols-2 gap-2">
                              {ALL_SUBJECTS.map((subject) => {
                                const isChecked = examSubjects.WAEC.includes(subject);
                                return (
                                  <label
                                    key={subject}
                                    className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all cursor-pointer ${
                                      isChecked
                                        ? 'bg-[#FF6B35]/5 border-[#FF6B35]/30 text-[#FF6B35]'
                                        : 'bg-[#0A0F1E] border-white/5 text-gray-300 hover:text-white'
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => toggleSubject('WAEC', subject)}
                                      className="sr-only"
                                    />
                                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                                      isChecked 
                                        ? 'bg-[#FF6B35] border-[#FF6B35]' 
                                        : 'border-gray-600 bg-transparent'
                                    }`}>
                                      {isChecked && <Check className="w-3 h-3 text-white stroke-[3]" />}
                                    </div>
                                    <span className="text-xs font-semibold select-none">{subject}</span>
                                  </label>
                                );
                              })}
                            </div>
                            <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center text-xs">
                              <span className="text-[#FF6B35] font-bold">
                                {examSubjects.WAEC.length} subjects selected
                              </span>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* NECO CARD */}
                    <div className="space-y-1">
                      <div
                        onClick={() => toggleExam('NECO')}
                        className={`p-5 rounded-2xl bg-[#111827] border-2 transition-all duration-300 cursor-pointer flex justify-between items-center relative ${
                          selectedExams.includes('NECO')
                            ? 'border-[#FF6B35] shadow-[0_0_15px_rgba(255,107,53,0.1)]'
                            : 'border-white/5 hover:border-white/10'
                        }`}
                      >
                        <div className="space-y-1">
                          <span className="font-heading font-extrabold text-lg text-white block">
                            NECO
                          </span>
                          <span className="font-sans text-xs text-gray-400 block">
                            National Examinations Council
                          </span>
                        </div>
                        {selectedExams.includes('NECO') && (
                          <div className="w-5 h-5 rounded-full bg-[#FF6B35] flex items-center justify-center animate-fade-up">
                            <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                          </div>
                        )}
                      </div>

                      {/* Dropdown for NECO */}
                      <AnimatePresence>
                        {selectedExams.includes('NECO') && openDropdowns.NECO && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="bg-[#111827]/60 border border-white/5 rounded-2xl mt-1.5 p-4 overflow-hidden"
                          >
                            <span className="text-xs font-heading font-extrabold text-zinc-400 tracking-wider uppercase block mb-3">
                              Select NECO Syllabus Subjects
                            </span>
                            <div className="grid grid-cols-2 gap-2">
                              {ALL_SUBJECTS.map((subject) => {
                                const isChecked = examSubjects.NECO.includes(subject);
                                return (
                                  <label
                                    key={subject}
                                    className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all cursor-pointer ${
                                      isChecked
                                        ? 'bg-[#FF6B35]/5 border-[#FF6B35]/30 text-[#FF6B35]'
                                        : 'bg-[#0A0F1E] border-white/5 text-gray-300 hover:text-white'
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => toggleSubject('NECO', subject)}
                                      className="sr-only"
                                    />
                                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                                      isChecked 
                                        ? 'bg-[#FF6B35] border-[#FF6B35]' 
                                        : 'border-gray-600 bg-transparent'
                                    }`}>
                                      {isChecked && <Check className="w-3 h-3 text-white stroke-[3]" />}
                                    </div>
                                    <span className="text-xs font-semibold select-none">{subject}</span>
                                  </label>
                                );
                              })}
                            </div>
                            <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center text-xs">
                              <span className="text-[#FF6B35] font-bold">
                                {examSubjects.NECO.length} subjects selected
                              </span>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                  </div>

                  {/* Fixed continuous bar at the bottom with Continue trigger */}
                  <div className="fixed bottom-0 left-0 right-0 w-full bg-[#0A0F1E]/95 border-t border-white/5 py-4 px-6 md:px-12 z-50 flex items-center justify-between shadow-2xl backdrop-blur-md">
                    <button
                      onClick={handlePrevStep}
                      className="font-heading font-extrabold text-sm text-gray-400 hover:text-white uppercase tracking-wider transition-colors"
                    >
                      ← Back
                    </button>
                    
                    <button
                      onClick={handleNextStep}
                      disabled={selectedExams.length === 0}
                      className={`py-3.5 px-8 rounded-xl font-heading font-extrabold text-sm tracking-wider uppercase transition-all duration-300 transform active:scale-95 ${
                        selectedExams.length > 0
                          ? 'bg-[#FF6B35] text-white shadow-lg shadow-[#FF6B35]/20 hover:brightness-110 cursor-pointer'
                          : 'bg-[#FF6B35]/30 text-white/50 cursor-not-allowed opacity-50'
                      }`}
                    >
                      Continue
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: Target Score */}
              {step === 3 && (
                <div className="space-y-6">
                  <div className="text-center space-y-2">
                    <h1 className="font-heading font-extrabold text-3xl md:text-4xl text-white tracking-tight leading-tight">
                      What is your target score?
                    </h1>
                    <p className="font-sans text-sm md:text-base text-[#8B9CB8]">
                      We will use this to track your readiness progress.
                    </p>
                  </div>

                  <div className="max-w-md mx-auto space-y-8 pt-4">
                    
                    {/* JAMB Target Score Form Field */}
                    {selectedExams.includes('JAMB') && (
                      <div className="space-y-3 animate-fade-up">
                        <label className="text-sm font-heading font-extrabold text-white flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-[#FF6B35]" />
                          JAMB Target Score
                        </label>
                        <input
                          type="number"
                          min="180"
                          max="400"
                          value={jambTarget}
                          onChange={(e) => setJambTarget(e.target.value)}
                          placeholder="Enter score between 180 and 400"
                          className="w-full bg-[#111827] text-white border border-white/10 rounded-2xl px-5 py-4 placeholder:text-gray-600 font-sans font-medium text-sm transition-all focus:border-[#FF6B35] focus:shadow-[0_0_15px_rgba(255,107,53,0.1)] focus:outline-none"
                        />
                      </div>
                    )}

                    {/* WAEC Target Grade Row */}
                    {selectedExams.includes('WAEC') && (
                      <div className="space-y-3 animate-fade-up">
                        <label className="text-sm font-heading font-extrabold text-white flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-[#FF6B35]" />
                          WAEC Target Grade
                        </label>
                        <div className="flex flex-wrap gap-2.5">
                          {GRADES.map((grade) => {
                            const isSelected = waecTarget === grade;
                            return (
                              <button
                                key={grade}
                                type="button"
                                onClick={() => setWaecTarget(grade)}
                                className={`flex-1 min-w-[50px] py-4 rounded-xl font-heading font-extrabold text-base border transition-all duration-300 transform active:scale-95 ${
                                  isSelected
                                    ? 'bg-[#FF6B35] text-white border-transparent shadow-lg shadow-[#FF6B35]/25 scale-105'
                                    : 'bg-[#111827] text-gray-400 border-white/5 hover:border-white/10 hover:text-white cursor-pointer'
                                }`}
                              >
                                {grade}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* NECO Target Grade Row */}
                    {selectedExams.includes('NECO') && (
                      <div className="space-y-3 animate-fade-up">
                        <label className="text-sm font-heading font-extrabold text-white flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-[#FF6B35]" />
                          NECO Target Grade
                        </label>
                        <div className="flex flex-wrap gap-2.5">
                          {GRADES.map((grade) => {
                            const isSelected = necoTarget === grade;
                            return (
                              <button
                                key={grade}
                                type="button"
                                onClick={() => setNecoTarget(grade)}
                                className={`flex-1 min-w-[50px] py-4 rounded-xl font-heading font-extrabold text-base border transition-all duration-300 transform active:scale-95 ${
                                  isSelected
                                    ? 'bg-[#FF6B35] text-white border-transparent shadow-lg shadow-[#FF6B35]/25 scale-105'
                                    : 'bg-[#111827] text-gray-400 border-white/5 hover:border-white/10 hover:text-white cursor-pointer'
                                }`}
                              >
                                {grade}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Navigation Controles */}
                    <div className="grid grid-cols-3 gap-4 pt-6">
                      <button
                        onClick={handlePrevStep}
                        type="button"
                        className="py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-heading font-bold text-sm text-center hover:bg-white/10 uppercase tracking-wider transition-all duration-300 cursor-pointer"
                      >
                        Back
                      </button>

                      <button
                        onClick={handleFinish}
                        disabled={saving}
                        className="col-span-2 py-4 rounded-2xl bg-[#FF6B35] text-white font-heading font-extrabold text-base tracking-wider transition-all duration-300 shadow-lg shadow-[#FF6B35]/25 hover:brightness-110 transform active:scale-95 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-55"
                      >
                        {saving ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            <span>Let's Go</span>
                            <span className="text-xl">🚀</span>
                          </>
                        )}
                      </button>
                    </div>

                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>

      </main>

      {/* Footer Branding */}
      <footer className="absolute bottom-6 left-0 right-0 text-center">
        <p className="font-sans text-xs text-gray-500">
          Ready to achieve exam success in Nigeria 🇳🇬
        </p>
      </footer>

    </div>
  );
}
