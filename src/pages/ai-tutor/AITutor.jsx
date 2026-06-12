import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Bot, ChevronLeft, Loader2, Send, UserRound } from 'lucide-react';

const DAILY_LIMIT = 5;
const LIMIT_MESSAGE = "You've used your 5 free daily questions. Try again tomorrow.";

const todayKey = () => new Date().toISOString().slice(0, 10);

async function askTutor(message) {
  const response = await fetch('/api/ai-tutor', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message })
  });

  let data = {};
  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(data.error || `AI Tutor request failed with status ${response.status}.`);
  }

  if (!data.response) {
    throw new Error('AI Tutor returned an empty response.');
  }

  return data.response;
}

export default function AITutor({ user, navigatePath }) {
  const userKey = user?.id || user?.email || 'guest';
  const storageKey = useMemo(() => `examready-ai-tutor-usage-${userKey}`, [userKey]);
  const messagesEndRef = useRef(null);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hi! I can help with JAMB, WAEC, or NECO questions. Ask me a topic, past question, or anything you want explained.'
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [usage, setUsage] = useState(() => ({ date: todayKey(), count: 0 }));

  useEffect(() => {
    const today = todayKey();
    const saved = localStorage.getItem(storageKey);

    if (!saved) {
      setUsage({ date: today, count: 0 });
      return;
    }

    try {
      const parsed = JSON.parse(saved);
      if (parsed?.date === today) {
        setUsage({ date: today, count: Number(parsed.count) || 0 });
      } else {
        const resetUsage = { date: today, count: 0 };
        localStorage.setItem(storageKey, JSON.stringify(resetUsage));
        setUsage(resetUsage);
      }
    } catch {
      const resetUsage = { date: today, count: 0 };
      localStorage.setItem(storageKey, JSON.stringify(resetUsage));
      setUsage(resetUsage);
    }
  }, [storageKey]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isTyping]);

  const questionsLeft = Math.max(DAILY_LIMIT - usage.count, 0);
  const limitReached = questionsLeft <= 0;
  const sendDisabled = isTyping || !input.trim() || limitReached;

  const updateUsage = nextUsage => {
    localStorage.setItem(storageKey, JSON.stringify(nextUsage));
    setUsage(nextUsage);
  };

  const handleSubmit = async event => {
    event.preventDefault();

    const prompt = input.trim();
    if (!prompt || isTyping) return;

    if (limitReached) {
      return;
    }

    const nextUsage = { date: todayKey(), count: usage.count + 1 };
    updateUsage(nextUsage);

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: prompt
    };
    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    setInput('');
    setIsTyping(true);

    try {
      const answer = await askTutor(prompt);

      setMessages(current => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: answer
        }
      ]);
    } catch (error) {
      console.error('AI Tutor failed:', error);
      setMessages(current => [
        ...current,
        {
          id: `assistant-error-${Date.now()}`,
          role: 'assistant',
          content: 'Sorry, I could not reach the AI tutor right now. Please try again in a few minutes.'
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#0A0F1E] text-white">
      <main className="mx-auto flex h-[100dvh] max-w-5xl flex-col px-3 pb-[calc(5.25rem+env(safe-area-inset-bottom))] pt-3 sm:px-6 sm:pb-24 lg:px-8">
        <div className="mb-3 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigatePath('/dashboard')}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#111827]/90 px-3 py-2 font-sans text-xs font-bold text-[#FFB199] transition hover:border-[#FF6B35]/50 hover:text-[#FF6B35] sm:text-sm"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </button>
          <div className="min-w-0 text-right">
            <h1 className="font-heading text-lg font-bold leading-tight text-white sm:text-2xl">AI Tutor</h1>
            <p className="hidden font-sans text-xs text-[#8B9CB8] sm:block">JAMB, WAEC & NECO step-by-step help</p>
          </div>
        </div>

        <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[24px] border border-white/10 bg-[#0B1324]/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_18px_55px_rgba(0,0,0,0.24)] sm:rounded-[28px]">
          <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-5">
            <div>
              <p className="font-heading text-sm font-bold text-white">Daily free questions</p>
              <p className="font-sans text-xs text-[#8B9CB8]">{questionsLeft} of {DAILY_LIMIT} left today</p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${limitReached ? 'bg-red-500/15 text-red-200' : 'bg-[#FF6B35]/15 text-[#FFB199]'}`}>
              {limitReached ? 'Limit reached' : 'Ready'}
            </span>
          </div>

          {limitReached && (
            <div className="border-b border-[#FF6B35]/20 bg-[#FF6B35]/10 px-4 py-3 font-sans text-sm font-semibold text-[#FFB199] sm:px-5">
              {LIMIT_MESSAGE}
            </div>
          )}

          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-5" aria-live="polite">
            {messages.map(message => {
              const isUser = message.role === 'user';

              return (
                <div key={message.id} className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
                  {!isUser && (
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-[#D1D5DB]">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}
                  <div className={`max-w-[82%] rounded-2xl px-4 py-3 font-sans text-sm leading-6 shadow-[0_12px_30px_rgba(0,0,0,0.18)] sm:max-w-[74%] ${isUser ? 'rounded-br-md bg-[#FF6B35] text-white' : 'rounded-bl-md bg-[#111827] text-[#D1D5DB]'}`}>
                    {message.content}
                  </div>
                  {isUser && (
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FF6B35] text-white">
                      <UserRound className="h-4 w-4" />
                    </div>
                  )}
                </div>
              );
            })}

            {isTyping && (
              <div className="flex justify-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-[#D1D5DB]">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="inline-flex items-center gap-2 rounded-2xl rounded-bl-md bg-[#111827] px-4 py-3 text-sm text-[#D1D5DB]">
                  <Loader2 className="h-4 w-4 animate-spin text-[#FF6B35]" />
                  Tutor is typing...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </section>
      </main>

      <form
        onSubmit={handleSubmit}
        className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#0A0F1E]/95 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur-2xl"
      >
        <div className="mx-auto flex max-w-4xl gap-2">
          <input
            type="text"
            value={input}
            onChange={event => setInput(event.target.value)}
            disabled={limitReached}
            placeholder={limitReached ? LIMIT_MESSAGE : 'Ask a JAMB, WAEC, or NECO question...'}
            className="min-h-12 flex-1 rounded-2xl border border-white/10 bg-[#111827] px-4 font-sans text-sm text-white outline-none transition placeholder:text-[#8B9CB8] focus:border-[#FF6B35]/60 disabled:cursor-not-allowed disabled:opacity-70"
          />
          <button
            type="submit"
            disabled={sendDisabled}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#FF6B35] px-4 font-sans text-sm font-bold text-white transition hover:bg-[#ff7c4d] disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400 sm:px-5"
          >
            {isTyping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            <span className="hidden sm:inline">Send</span>
          </button>
        </div>
      </form>
    </div>
  );
}
