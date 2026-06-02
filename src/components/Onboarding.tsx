import React, { useEffect, useMemo, useState } from 'react';
import { Check, LogOut, Loader2 } from 'lucide-react';
import { supabase } from '../supabase';

interface OnboardingProps {
  initialName: string;
  onComplete: (data: {
    displayName: string;
    username: string;
  }) => Promise<void>;
  onSignOut: () => void;
}

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
  const [name, setName] = useState<string>(initialName || '');
  const [username, setUsername] = useState<string>('');
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>('idle');
  const [usernameMessage, setUsernameMessage] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const normalizedUsername = useMemo(() => username.trim().replace(/^@+/, '').toLowerCase(), [username]);
  const canSubmit = name.trim().length > 0 && usernameStatus === 'available' && !saving;

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
        setUsernameMessage('Username already taken');
        return;
      }

      setUsernameStatus('available');
      setUsernameMessage('✓ Username available');
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(checkUsername);
    };
  }, [normalizedUsername]);

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setSaving(true);
    setErrorMsg(null);

    try {
      await onComplete({
        displayName: name.trim(),
        username: normalizedUsername
      });
    } catch (error) {
      console.error('Onboarding save failed:', error);
      setErrorMsg('Something went wrong. Please try again.');
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#0A0F1E] text-white font-sans">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,rgba(255,107,53,0.12),transparent_36%)]" />

      <header className="relative z-20 flex items-center justify-between px-4 py-4 sm:px-6 sm:py-5">
        <button
          type="button"
          onClick={onSignOut}
          className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.08)] bg-[#111827] px-4 py-2 font-sans text-sm text-slate-300 transition hover:border-white/20 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
        <div className="font-heading text-xl font-bold tracking-tight">
          Exam<span className="text-[#FF6B35]">Ready</span>
        </div>
      </header>

      <main className="relative z-10 flex min-h-[calc(100vh-88px)] items-center px-4 pb-36 pt-6 sm:px-6">
        <section className="mx-auto w-full max-w-xl rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#111827]/80 p-5 shadow-[0_28px_80px_rgba(0,0,0,0.45)] sm:p-8">
          <div className="space-y-3 text-center">
            <h1 className="font-heading text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Create your profile
            </h1>
            <p className="font-sans text-sm font-normal leading-6 text-[#8B9CB8]">
              Choose the name and username students will see across ExamReady.
            </p>
          </div>

          <div className="mt-8 space-y-5 text-left">
            <div className="space-y-2">
              <label htmlFor="full-name" className="font-sans text-sm font-semibold text-white">
                Full Name
              </label>
              <input
                id="full-name"
                type="text"
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  setErrorMsg(null);
                }}
                placeholder="Enter your full name"
                className="w-full rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#111827] px-4 py-3.5 font-sans text-sm text-white outline-none transition-all duration-300 placeholder:text-slate-500 focus:border-[#FF6B35] focus:shadow-[0_0_0_4px_rgba(255,107,53,0.16),0_0_32px_rgba(255,107,53,0.2)] sm:px-5 sm:py-4 sm:text-base"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="username" className="font-sans text-sm font-semibold text-white">
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
                  if (event.key === 'Enter' && canSubmit) {
                    handleSubmit();
                  }
                }}
                placeholder="Choose a username"
                maxLength={21}
                className="w-full rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#111827] px-4 py-3.5 font-sans text-sm text-white outline-none transition-all duration-300 placeholder:text-slate-500 focus:border-[#FF6B35] focus:shadow-[0_0_0_4px_rgba(255,107,53,0.16),0_0_32px_rgba(255,107,53,0.2)] sm:px-5 sm:py-4 sm:text-base"
              />
              <p className="font-sans text-xs leading-5 text-[#8B9CB8]">
                This is how you appear on the leaderboard and in battles.
              </p>
              {usernameMessage && (
                <p className={`font-sans text-xs font-bold ${usernameStatus === 'available' ? 'text-emerald-400' : usernameStatus === 'checking' ? 'text-[#8B9CB8]' : 'text-red-400'}`}>
                  {usernameMessage}
                </p>
              )}
            </div>
          </div>

          {errorMsg && (
            <p className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-center font-sans text-sm font-bold text-red-400">
              {errorMsg}
            </p>
          )}
        </section>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[rgba(255,255,255,0.08)] bg-[#0A0F1E]/90 px-4 py-3 backdrop-blur-xl sm:px-6 sm:py-4">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={`mx-auto flex w-full max-w-xl items-center justify-center gap-2 rounded-2xl px-4 py-3 font-heading text-sm font-bold uppercase tracking-[0.18em] transition-all duration-300 sm:px-6 sm:py-4 ${
            canSubmit
              ? 'bg-[#FF6B35] text-white shadow-[0_18px_40px_rgba(255,107,53,0.32)] hover:bg-[#ff7c4d]'
              : 'cursor-not-allowed bg-slate-700 text-slate-400'
          }`}
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : canSubmit ? <Check className="h-4 w-4" /> : null}
          {saving ? 'Saving...' : 'Get Started'}
        </button>
      </div>
    </div>
  );
}
