import React, { useState } from 'react';
import { supabase } from '../../supabase';
import { Mail, Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react';

interface AuthProps {
  onSignIn: () => void;
  onNavigateLanding: () => void;
}

type AuthMode = 'signin' | 'signup';
type AuthErrors = Partial<Record<'fullName' | 'email' | 'password' | 'confirmPassword' | 'general', string>>;

export default function Auth({ onSignIn, onNavigateLanding }: AuthProps) {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState<AuthErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [pendingConfirmationEmail, setPendingConfirmationEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const updateField = (field: keyof typeof form, value: string) => {
    setForm(f => ({ ...f, [field]: value }));
    setErrors(e => ({ ...e, [field]: undefined, general: undefined }));
  };

  const resetMessages = () => {
    setErrors({});
  };

  const resetConfirmation = () => {
    setPendingConfirmationEmail('');
    resetMessages();
  };

  const mapSignInError = (message: string) => {
    const normalized = message.toLowerCase();
    if (normalized.includes('not found') || normalized.includes('user not found')) {
      setErrors({ email: 'No account found with this email.' });
      return;
    }
    if (normalized.includes('invalid') || normalized.includes('credentials') || normalized.includes('password')) {
      setErrors({ password: 'Incorrect password. Please try again.' });
      return;
    }
    setErrors({ general: message || 'Unable to sign in. Please try again.' });
  };

  const mapSignUpError = (message: string) => {
    const normalized = message.toLowerCase();
    if (normalized.includes('registered') || normalized.includes('already') || normalized.includes('exists')) {
      setErrors({ email: 'An account with this email already exists. Sign in instead.' });
      return;
    }
    if (normalized.includes('password')) {
      setErrors({ password: 'Password must be at least 6 characters.' });
      return;
    }
    setErrors({ general: message || 'Unable to create your account. Please try again.' });
  };

  const handleSignIn = async () => {
    resetMessages();
    const email = form.email.trim();

    if (!email) {
      setErrors({ email: 'Enter your email.' });
      return;
    }
    if (!form.password) {
      setErrors({ password: 'Enter your password.' });
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: form.password,
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
      onSignIn();
    }
    setLoading(false);
  };

  const handleSignUp = async () => {
    resetMessages();
    const fullName = form.fullName.trim();
    const email = form.email.trim();

    if (!fullName) {
      setErrors({ fullName: 'Enter your full name.' });
      return;
    }
    if (!email) {
      setErrors({ email: 'Enter your email.' });
      return;
    }
    if (form.password.length < 6) {
      setErrors({ password: 'Password must be at least 6 characters.' });
      return;
    }
    if (form.password !== form.confirmPassword) {
      setErrors({ confirmPassword: 'Passwords do not match.' });
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password: form.password,
      options: {
        data: {
          full_name: fullName,
          display_name: fullName,
        },
      },
    });

    if (error) {
      mapSignUpError(error.message);
      setLoading(false);
      return;
    }

    if (data.user && data.user.identities && data.user.identities.length === 0) {
      setErrors({ email: 'An account with this email already exists. Sign in instead.' });
      setLoading(false);
      return;
    }

    if (data.session?.user) {
      onSignIn();
    } else {
      setPendingConfirmationEmail(email);
      setForm({ fullName: '', email, password: '', confirmPassword: '' });
    }

    setLoading(false);
  };

  const handleResendConfirmation = async () => {
    if (!pendingConfirmationEmail) return;
    resetMessages();
    setLoading(true);
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: pendingConfirmationEmail,
    });

    if (error) {
      setErrors({ general: 'Unable to resend the confirmation email. Please try again.' });
      setLoading(false);
      return;
    }

    setErrors({ general: undefined });
    setErrors(e => ({ ...e, general: 'Confirmation email resent. Check your inbox.' }));
    setLoading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'signin') handleSignIn();
    else handleSignUp();
  };

  const inputClass =
    'w-full rounded-2xl border border-white/10 bg-[#111827] px-5 py-4 font-sans text-sm text-white outline-none transition-all placeholder:text-slate-500 focus:border-[#FF6B35] focus:shadow-[0_0_0_4px_rgba(255,107,53,0.15)]';

  return (
    <div className="min-h-screen flex items-center justify-center relative bg-[#0A0F1E] px-4 py-10 font-sans text-white">
      <div className="absolute h-[min(520px,90vw)] w-[min(520px,90vw)] rounded-full bg-[radial-gradient(rgba(255,107,53,0.18),transparent_70%)] blur-3xl pointer-events-none z-0" />

      <div className="w-full max-w-md bg-[#111827]/95 border border-white/10 rounded-[24px] p-5 sm:p-8 shadow-[0_45px_100px_rgba(0,0,0,0.7)] relative z-10">
        <button
          type="button"
          onClick={onNavigateLanding}
          className="absolute right-4 top-4 font-sans text-xs font-semibold text-[#8B9CB8] hover:text-white transition"
        >
          ← Back
        </button>

        <div className="text-center mb-6">
          <span className="font-heading font-bold text-[28px] tracking-tight">
            Exam<span className="text-[#FF6B35]">Ready</span>
          </span>
        </div>

        {pendingConfirmationEmail ? (
          <div className="text-center py-4">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FF6B35]/15 text-[#FF6B35]">
              <Mail className="h-7 w-7" />
            </div>
            <h2 className="font-heading font-bold text-2xl tracking-tight mb-3">Check your email</h2>
            <p className="text-sm leading-6 text-[#8B9CB8]">
              We sent a confirmation link to{' '}
              <span className="break-all font-semibold text-white">{pendingConfirmationEmail}</span>.
              Click the link to activate your account.
            </p>
            {errors.general && (
              <p className="mt-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs text-emerald-400">
                {errors.general}
              </p>
            )}
            <button
              type="button"
              onClick={handleResendConfirmation}
              disabled={loading}
              className="mt-6 w-full rounded-2xl bg-[#FF6B35] px-6 py-4 text-sm font-bold text-white transition hover:bg-[#ff7c4d] disabled:opacity-60"
            >
              {loading ? 'Sending...' : 'Resend Email'}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                resetConfirmation();
              }}
              className="mt-4 text-xs font-semibold text-[#FF6B35] hover:text-[#ff7c4d]"
            >
              Back to Sign In
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 mb-6 border-b border-white/10">
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  resetConfirmation();
                }}
                className={`pb-3 font-heading text-sm font-bold transition-colors border-b-2 ${
                  mode === 'signin'
                    ? 'border-[#FF6B35] text-white'
                    : 'border-transparent text-[#8B9CB8] hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  resetConfirmation();
                }}
                className={`pb-3 font-heading text-sm font-bold transition-colors border-b-2 ${
                  mode === 'signup'
                    ? 'border-[#FF6B35] text-white'
                    : 'border-transparent text-[#8B9CB8] hover:text-white'
                }`}
              >
                Sign Up
              </button>
            </div>

            <div className="text-center mb-6">
              <h2 className="font-heading font-bold text-2xl tracking-tight mb-2">
                {mode === 'signin' ? 'Welcome Back' : 'Create Account'}
              </h2>
              <p className="text-sm text-[#8B9CB8]">
                {mode === 'signin'
                  ? 'Sign in to continue your preparation.'
                  : 'Join thousands of students preparing for JAMB, WAEC & NECO.'}
              </p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              {mode === 'signup' && (
                <div>
                  <input
                    type="text"
                    value={form.fullName}
                    onChange={e => updateField('fullName', e.target.value)}
                    placeholder="Enter your full name"
                    className={inputClass}
                  />
                  {errors.fullName && <p className="mt-2 text-xs text-red-400">{errors.fullName}</p>}
                </div>
              )}

              <div>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => updateField('email', e.target.value)}
                  placeholder="Enter your email"
                  className={inputClass}
                />
                {errors.email && <p className="mt-2 text-xs text-red-400">{errors.email}</p>}
              </div>

              <div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => updateField('password', e.target.value)}
                    placeholder={mode === 'signin' ? 'Enter your password' : 'Create a password'}
                    className={`${inputClass} pr-12`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8B9CB8] hover:text-[#FF6B35]"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="mt-2 text-xs text-red-400">{errors.password}</p>}
              </div>

              {mode === 'signup' && (
                <div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.confirmPassword}
                    onChange={e => updateField('confirmPassword', e.target.value)}
                    placeholder="Confirm your password"
                    className={inputClass}
                  />
                  {errors.confirmPassword && (
                    <p className="mt-2 text-xs text-red-400">{errors.confirmPassword}</p>
                  )}
                </div>
              )}

              {errors.general && <p className="text-sm text-red-400">{errors.general}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-[#FF6B35] px-6 py-4 text-sm font-bold text-white transition hover:bg-[#ff7c4d] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Please wait...
                  </span>
                ) : mode === 'signin' ? (
                  'Sign In'
                ) : (
                  'Create Account'
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-[#8B9CB8]">
              {mode === 'signin' ? "Don't have an account " : 'Already have an account '}
              <button
                type="button"
                onClick={() => {
                  setMode(mode === 'signin' ? 'signup' : 'signin');
                  resetConfirmation();
                }}
                className="font-semibold text-[#FF6B35] hover:text-[#ff7c4d]"
              >
                {mode === 'signin' ? 'Create one' : 'Sign In'}
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
