import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, Check, LogOut, Rocket } from 'lucide-react';
import { supabase } from '../supabase';

interface OnboardingProps {
  initialName: string;
  onComplete: (data: {
    displayName: string;
    username: string;
    selectedExams: ('JAMB' | 'WAEC' | 'NECO')[];
    subjects: Record<string, string[]>;
  }) => Promise<void>;
  onSignOut: () => void;
}

const SUBJECTS = [
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

const EXAMS: Array<{
  id: 'JAMB' | 'WAEC' | 'NECO';
  title: string;
  description: string;
}> = [
  {
    id: 'JAMB',
    title: 'JAMB',
    description: 'Joint Admissions and Matriculation Board'
  },
  {
    id: 'WAEC',
    title: 'WAEC',
    description: 'West African Examinations Council'
  },
  {
    id: 'NECO',
    title: 'NECO',
    description: 'National Examinations Council'
  }
];

type UsernameStatus = 'idle' | 'invalid' | 'checking' | 'available' | 'taken';

const validateUsername = (value: string): string | null => {
  if (!value) return null;
  if (/\s/.test(value)) return 'No spaces allowed.';
  if (!/^[A-Za-z0-9_]+$/.test(value)) return 'Only letters, numbers and underscores allowed.';
  if (value.length < 3) return 'Username must be at least 3 characters.';
  if (value.length > 20) return 'Username must be 20 characters or fewer.';
  return null;
};

export default function Onboarding({ initialName, onComplete, onSignOut }: OnboardingProps) {
  const [step, setStep] = useState<number>(1);
  const [direction, setDirection] = useState<number>(1);
  const [name, setName] = useState<string>(initialName || '');
  const [username, setUsername] = useState<string>('');
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>('idle');
  const [usernameMessage, setUsernameMessage] = useState<string>('');
  const [selectedExams, setSelectedExams] = useState<('JAMB' | 'WAEC' | 'NECO')[]>([]);
  const [examSubjects, setExamSubjects] = useState<Record<string, string[]>>({
    JAMB: [],
    WAEC: [],
    NECO: []
  });
  const [saving, setSaving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const normalizedUsername = useMemo(() => username.trim().replace(/^@+/, '').toLowerCase(), [username]);

  useEffect(() => {
    const validationMessage = validateUsername(normalizedUsername);

    if (!normalizedUsername) {
      setUsernameStatus('idle');
      setUsernameMessage('');
      return;
    }

    if (validationMessage) {
      setUsernameStatus('invalid');
      setUsernameMessage(validationMessage);
      return;
    }

    let cancelled = false;
    setUsernameStatus('checking');
    setUsernameMessage('Checking username...');

    const checkUsername = window.setTimeout(async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', normalizedUsername)
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        console.error('Username availability check failed:', error);
        setUsernameStatus('invalid');
        setUsernameMessage('Unable to check username right now. Please try again.');
        return;
      }

      if (data) {
        setUsernameStatus('taken');
        setUsernameMessage('Username already taken. Try another.');
        return;
      }

      setUsernameStatus('available');
      setUsernameMessage('✓ Username available');
    }, 450);

    return () => {
      cancelled = true;
      window.clearTimeout(checkUsername);
    };
  }, [normalizedUsername]);

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 120 : -120,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: {
        x: { type: 'spring', stiffness: 280, damping: 30 },
        opacity: { duration: 0.2 }
      }
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -120 : 120,
      opacity: 0,
      transition: {
        x: { type: 'spring', stiffness: 280, damping: 30 },
        opacity: { duration: 0.18 }
      }
    })
  };

  const canContinueStepOne = name.trim().length > 0 && usernameStatus === 'available';
  const canFinishStepTwo = selectedExams.length > 0 && selectedExams.every(exam => examSubjects[exam].length > 0);

  const goToStep = (nextStep: number) => {
    setErrorMsg(null);
    setDirection(nextStep > step ? 1 : -1);
    setStep(nextStep);
  };

  const handleContinue = () => {
    if (step === 1) {
      if (!canContinueStepOne) return;
      goToStep(2);
    }
  };

  const handleBack = () => {
    if (step === 1) return;
    goToStep(step - 1);
  };

  const toggleExam = (exam: 'JAMB' | 'WAEC' | 'NECO') => {
    setErrorMsg(null);
    setSelectedExams(prev => {
      if (prev.includes(exam)) {
        setExamSubjects(subjects => ({
          ...subjects,
          [exam]: []
        }));
        return prev.filter(item => item !== exam);
      }

      return [...prev, exam];
    });
  };

  const toggleSubject = (exam: 'JAMB' | 'WAEC' | 'NECO', subject: string) => {
    setErrorMsg(null);
    setExamSubjects(prev => {
      const current = prev[exam] || [];
      return {
        ...prev,
        [exam]: current.includes(subject)
          ? current.filter(item => item !== subject)
          : [...current, subject]
      };
    });
  };

  const handleFinish = async () => {
    setErrorMsg(null);

    if (!canFinishStepTwo) {
      setErrorMsg('Please select at least one subject for each selected exam.');
      return;
    }

    setSaving(true);
    try {
      const finalSubjects: Record<string, string[]> = {};

      selectedExams.forEach(exam => {
        finalSubjects[exam] = examSubjects[exam];
      });

      await onComplete({
        displayName: name.trim(),
        username: normalizedUsername,
        selectedExams,
        subjects: finalSubjects
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An error occurred while saving your profile. Please try again.';
      setErrorMsg(message);
    } finally {
      setSaving(false);
    }
  };

  const renderProgress = () => (
    <div className="flex items-center justify-center gap-3 pt-8 pb-10">
      {[1, 2].map(item => {
        const isActive = item === step;
        const isCompleted = item < step;

        return (
          <div
            key={item}
            className={`h-3 w-3 rounded-full transition-all duration-300 ${
              isActive || isCompleted
                ? 'bg-[#FF6B35] shadow-[0_0_20px_rgba(255,107,53,0.45)]'
                : 'bg-slate-600'
            } ${isActive ? 'scale-125' : ''}`}
            aria-label={`Step ${item}${isActive ? ' active' : isCompleted ? ' completed' : ' upcoming'}`}
          />
        );
      })}
    </div>
  );

  const renderStepOne = () => (
    <section className="flex min-h-[calc(100vh-168px)] flex-col justify-center px-6 pb-28">
      <div className="mx-auto w-full max-w-xl space-y-8 text-center">
        <div className="space-y-3">
          <h1 className="font-heading text-4xl font-extrabold tracking-tight text-white md:text-5xl">
            What should we call you?
          </h1>
          <p className="font-sans text-base leading-7 text-[#8B9CB8]">
            Set your display name and unique battle identity.
          </p>
        </div>

        <div className="space-y-5 text-left">
          <div className="space-y-2">
            <label htmlFor="full-name" className="font-heading text-sm font-extrabold uppercase tracking-[0.16em] text-white">
              Full Name
            </label>
            <p className="font-sans text-xs text-[#8B9CB8]">This is just for display in greetings.</p>
            <input
              id="full-name"
              type="text"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setErrorMsg(null);
              }}
              placeholder="Enter your full name"
              className="w-full rounded-2xl border border-white/10 bg-[#111827] px-5 py-4 font-sans text-base text-white outline-none transition-all duration-300 placeholder:text-slate-500 focus:border-[#FF6B35] focus:shadow-[0_0_0_4px_rgba(255,107,53,0.16),0_0_32px_rgba(255,107,53,0.2)]"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="username" className="font-heading text-sm font-extrabold uppercase tracking-[0.16em] text-white">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(event) => {
                setUsername(event.target.value.replace(/^@+/, '').toLowerCase());
                setErrorMsg(null);
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && canContinueStepOne) {
                  handleContinue();
                }
              }}
              placeholder="Choose a username e.g. jamb_champion"
              maxLength={21}
              className="w-full rounded-2xl border border-white/10 bg-[#111827] px-5 py-4 font-sans text-base text-white outline-none transition-all duration-300 placeholder:text-slate-500 focus:border-[#FF6B35] focus:shadow-[0_0_0_4px_rgba(255,107,53,0.16),0_0_32px_rgba(255,107,53,0.2)]"
            />
            <p className="font-sans text-xs leading-5 text-[#8B9CB8]">
              This is how you will appear on the leaderboard and in battles. Must be unique.
            </p>
            {usernameMessage && (
              <p className={`font-sans text-xs font-bold ${usernameStatus === 'available' ? 'text-emerald-400' : usernameStatus === 'checking' ? 'text-[#8B9CB8]' : 'text-red-400'}`}>
                {usernameMessage}
              </p>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={handleContinue}
          disabled={!canContinueStepOne}
          className={`w-full rounded-2xl px-6 py-4 font-heading text-sm font-extrabold uppercase tracking-[0.18em] transition-all duration-300 ${
            canContinueStepOne
              ? 'bg-[#FF6B35] text-white shadow-[0_18px_40px_rgba(255,107,53,0.32)] hover:bg-[#ff7c4d]'
              : 'cursor-not-allowed bg-[#FF6B35]/25 text-white/40'
          }`}
        >
          Continue
        </button>
      </div>
    </section>
  );

  const renderStepTwo = () => (
    <section className="flex min-h-[calc(100vh-168px)] flex-col px-6 pb-32">
      <div className="mx-auto w-full max-w-2xl flex-1 space-y-7">
        <div className="space-y-3 text-center">
          <h1 className="font-heading text-4xl font-extrabold tracking-tight text-white md:text-5xl">
            Which exams are you preparing for?
          </h1>
          <p className="font-sans text-base text-[#8B9CB8]">
            You can select more than one.
          </p>
        </div>

        <div className="space-y-4">
          {EXAMS.map(exam => {
            const isSelected = selectedExams.includes(exam.id);
            const selectedCount = examSubjects[exam.id].length;

            return (
              <div key={exam.id} className="space-y-3">
                <button
                  type="button"
                  onClick={() => toggleExam(exam.id)}
                  className={`relative w-full rounded-3xl border bg-[#111827] p-5 text-left transition-all duration-300 ${
                    isSelected
                      ? 'border-[#FF6B35] shadow-[0_0_28px_rgba(255,107,53,0.16)]'
                      : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="pr-12">
                    <h2 className="font-heading text-2xl font-extrabold text-white">{exam.title}</h2>
                    <p className="mt-1 font-sans text-sm text-[#8B9CB8]">{exam.description}</p>
                  </div>

                  {isSelected && (
                    <span className="absolute right-5 top-5 flex h-7 w-7 items-center justify-center rounded-full bg-[#FF6B35] text-white">
                      <Check className="h-4 w-4 stroke-[3]" />
                    </span>
                  )}
                </button>

                <AnimatePresence initial={false}>
                  {isSelected && (
                    <motion.div
                      initial={{ height: 0, opacity: 0, y: -8 }}
                      animate={{ height: 'auto', opacity: 1, y: 0 }}
                      exit={{ height: 0, opacity: 0, y: -8 }}
                      transition={{ duration: 0.28, ease: 'easeInOut' }}
                      className="overflow-hidden rounded-3xl border border-white/10 bg-[#111827]/75"
                    >
                      <div className="space-y-4 p-4">
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          {SUBJECTS.map(subject => {
                            const checked = examSubjects[exam.id].includes(subject);

                            return (
                              <label
                                key={`${exam.id}-${subject}`}
                                className="flex cursor-pointer items-center gap-3 rounded-2xl border border-white/5 bg-[#0A0F1E] p-3 font-sans text-sm text-slate-200 transition-colors hover:border-white/15"
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => toggleSubject(exam.id, subject)}
                                  className="sr-only"
                                />
                                <span
                                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all ${
                                    checked
                                      ? 'border-[#FF6B35] bg-[#FF6B35]'
                                      : 'border-slate-600 bg-transparent'
                                  }`}
                                >
                                  {checked && <Check className="h-3.5 w-3.5 text-white stroke-[3]" />}
                                </span>
                                <span>{subject}</span>
                              </label>
                            );
                          })}
                        </div>

                        <p className="font-sans text-sm font-bold text-[#FF6B35]">
                          {selectedCount} {selectedCount === 1 ? 'subject' : 'subjects'} selected
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#0A0F1E] text-white font-sans">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,rgba(255,107,53,0.12),transparent_36%)]" />

      <header className="relative z-20 flex items-center justify-between px-6 py-5">
        <button
          type="button"
          onClick={step === 1 ? onSignOut : handleBack}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#111827] px-4 py-2 font-sans text-sm text-slate-300 transition hover:border-white/20 hover:text-white"
        >
          {step === 1 ? <LogOut className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
          {step === 1 ? 'Sign out' : 'Back'}
        </button>
        <div className="font-heading text-xl font-extrabold tracking-tight">
          Exam<span className="text-[#FF6B35]">Ready</span>
        </div>
      </header>

      <main className="relative z-10">
        {renderProgress()}

        {errorMsg && (
          <div className="mx-auto mb-4 w-[calc(100%-3rem)] max-w-2xl rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 font-sans text-sm text-red-300">
            {errorMsg}
          </div>
        )}

        <div className="relative min-h-[calc(100vh-160px)] overflow-x-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="absolute inset-0"
            >
              {step === 1 && renderStepOne()}
              {step === 2 && renderStepTwo()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {step === 2 && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-[#0A0F1E]/90 px-6 py-4 backdrop-blur-xl">
          <button
            type="button"
            onClick={handleFinish}
            disabled={!canFinishStepTwo || saving}
            className={`mx-auto flex w-full max-w-2xl items-center justify-center gap-2 rounded-2xl px-6 py-4 font-heading text-sm font-extrabold uppercase tracking-[0.18em] transition-all duration-300 ${
              canFinishStepTwo && !saving
                ? 'bg-[#FF6B35] text-white shadow-[0_18px_40px_rgba(255,107,53,0.32)] hover:bg-[#ff7c4d]'
                : 'cursor-not-allowed bg-[#FF6B35]/25 text-white/40'
            }`}
          >
            {saving ? 'Saving...' : 'Lets Go 🚀'}
            {!saving && <Rocket className="h-4 w-4" />}
          </button>
        </div>
      )}
    </div>
  );
}
