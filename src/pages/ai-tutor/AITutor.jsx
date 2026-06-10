import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Bot, ChevronLeft, Loader2, Send, Sparkles, UserRound } from 'lucide-react';

const SYSTEM_PROMPT = 'You are a helpful JAMB/WAEC/NECO tutor for Nigerian secondary school students. Answer exam questions clearly, with step-by-step explanations. Keep answers concise and friendly. Use Nigerian examples where helpful.';
const DAILY_LIMIT = 5;
const LIMIT_MESSAGE = "You've used your 5 free daily questions. Try again tomorrow.";

const initialMessages = [
  {
    id: 'welcome',
    role: 'assistant',
    content: 'Hi! I’m your ExamReady AI Tutor. Ask me any JAMB, WAEC, or NECO question and I’ll explain it step by step.'
  }
];

const getTodayKey = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const buildStorageKey = user => `examready-ai-tutor-usage:${user?.id || user?.email || 'guest'}`;

const readUsage = storageKey => {
  try {
    const rawUsage = window.localStorage.getItem(storageKey);
    const usage = rawUsage ? JSON.parse(rawUsage) : null;
    const today = getTodayKey();

    if (!usage || usage.date !== today) {
      return { date: today, count: 0 };
    }

    return { date: today, count: Number(usage.count) || 0 };
  } catch (error) {
    console.info('Unable to read AI Tutor usage from localStorage.', error);
    return { date: getTodayKey(), count: 0 };
  }
};

const writeUsage = (storageKey, usage) => {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(usage));
  } catch (error) {
    console.info('Unable to save AI Tutor usage to localStorage.', error);
  }
};

const responseOrThrow = async response => {
  const contentType = response.headers.get('content-type') || '';
  const body = contentType.includes('application/json') ? await response.json() : await response.text();

  if (!response.ok) {
    const message = typeof body === 'string'
      ? body
      : body?.error?.message || body?.message || 'AI provider request failed.';
    throw new Error(message);
  }

  return body;
};

const compactHistory = messages => messages
  .filter(message => message.role === 'user' || message.role === 'assistant')
  .slice(-8)
  .map(message => ({ role: message.role, content: message.content }));

const callGemini = async messages => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error('Gemini API key is not configured.');

  const contents = messages.map(message => ({
    role: message.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: message.content }]
  }));

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents,
      generationConfig: {
        temperature: 0.35,
        maxOutputTokens: 650
      }
    })
  });

  const data = await responseOrThrow(response);
  const text = data?.candidates?.[0]?.content?.parts?.map(part => part.text).filter(Boolean).join('\n').trim();
  if (!text) throw new Error('Gemini returned an empty response.');
  return text;
};

const callOpenAICompatibleProvider = async ({ apiKey, endpoint, model, messages }) => {
  if (!apiKey) throw new Error(`${model} API key is not configured.`);

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages
      ],
      temperature: 0.35,
      max_tokens: 650
    })
  });

  const data = await responseOrThrow(response);
  const text = data?.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error(`${model} returned an empty response.`);
  return text;
};

const callGroq = messages => callOpenAICompatibleProvider({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  endpoint: 'https://api.groq.com/openai/v1/chat/completions',
  model: 'llama-3.1-8b-instant',
  messages
});

const callOpenAI = messages => callOpenAICompatibleProvider({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  endpoint: 'https://api.openai.com/v1/chat/completions',
  model: 'gpt-4o-mini',
  messages
});

const getTutorReply = async messages => {
  const providers = [callGemini, callGroq, callOpenAI];
  const errors = [];

  for (const provider of providers) {
    try {
      return await provider(messages);
    } catch (error) {
      errors.push(error.message);
    }
  }

  throw new Error(errors.join(' | ') || 'All AI providers failed.');
};

export default function AITutor({ user, navigatePath, renderBottomNavigation }) {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [usage, setUsage] = useState({ date: getTodayKey(), count: 0 });
  const [limitNotice, setLimitNotice] = useState('');
  const messagesEndRef = useRef(null);
  const storageKey = useMemo(() => buildStorageKey(user), [user]);

  useEffect(() => {
    const currentUsage = readUsage(storageKey);
    setUsage(currentUsage);
    setLimitNotice(currentUsage.count >= DAILY_LIMIT ? LIMIT_MESSAGE : '');
    writeUsage(storageKey, currentUsage);
  }, [storageKey]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isTyping]);

  const remainingQuestions = Math.max(DAILY_LIMIT - usage.count, 0);
  const limitReached = remainingQuestions <= 0;
  const sendDisabled = isTyping || !input.trim() || limitReached;

  const handleSubmit = async event => {
    event.preventDefault();

    const question = input.trim();
    if (!question || isTyping) return;

    const currentUsage = readUsage(storageKey);
    if (currentUsage.count >= DAILY_LIMIT) {
      setUsage(currentUsage);
      setLimitNotice(LIMIT_MESSAGE);
      return;
    }

    const nextUsage = { date: currentUsage.date, count: currentUsage.count + 1 };
    writeUsage(storageKey, nextUsage);
    setUsage(nextUsage);
    setLimitNotice(nextUsage.count >= DAILY_LIMIT ? LIMIT_MESSAGE : '');

    const userMessage = { id: crypto.randomUUID(), role: 'user', content: question };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput('');
    setIsTyping(true);

    try {
      const reply = await getTutorReply(compactHistory(nextMessages));
      setMessages(currentMessages => [
        ...currentMessages,
        { id: crypto.randomUUID(), role: 'assistant', content: reply }
      ]);
    } catch (error) {
      console.error('AI Tutor providers failed:', error);
      setMessages(currentMessages => [
        ...currentMessages,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: 'Sorry, I could not reach the AI tutor right now. Please check your connection or try again later.'
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top_left,rgba(255,107,53,0.12),transparent_34%),#0A0F1E] text-white font-sans">
      <main className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 pb-[calc(7.5rem+env(safe-area-inset-bottom))] pt-6 sm:px-6 md:px-10 md:pt-8">
        <button
          type="button"
          onClick={() => navigatePath('/dashboard')}
          className="mb-5 inline-flex w-fit min-w-0 items-center gap-2 rounded-full border border-[rgba(255,255,255,0.08)] bg-[#111827]/90 px-4 py-2.5 font-sans text-sm font-bold text-[#FF8A66] shadow-[0_10px_30px_rgba(0,0,0,0.22)] transition hover:border-[#FF6B35]/50 hover:text-[#FF6B35]"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Dashboard
        </button>

        <section className="rounded-[28px] border border-[#FF6B35]/20 bg-gradient-to-br from-[#1A1A2E] via-[#141827] to-[#111827] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.32)] sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-[#FF6B35]/15 text-[#FF6B35] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                <Sparkles className="h-7 w-7" />
              </div>
              <div className="min-w-0">
                <p className="font-sans text-[11px] font-bold uppercase tracking-[0.28em] text-[#FFB199]">AI Tutor</p>
                <h1 className="mt-2 break-words font-heading text-2xl font-bold leading-tight text-white sm:text-3xl">Ask your exam question</h1>
                <p className="mt-2 max-w-2xl font-sans text-sm font-normal leading-6 text-[#8B9CB8]">
                  Get concise JAMB, WAEC, and NECO explanations with Nigerian examples where helpful.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#0B1324]/80 px-4 py-3 text-left sm:text-right">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#8B9CB8]">Daily free questions</p>
              <p className="mt-1 font-heading text-2xl font-bold text-[#FF6B35]">{remainingQuestions}/{DAILY_LIMIT}</p>
            </div>
          </div>
        </section>

        <section className="mt-5 flex min-h-[55vh] flex-1 flex-col overflow-hidden rounded-[28px] border border-white/10 bg-[#070B16]/80 shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-5" aria-live="polite">
            {messages.map(message => {
              const isUser = message.role === 'user';
              return (
                <div key={message.id} className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
                  {!isUser && (
                    <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#111827] text-[#FF6B35]">
                      <Bot className="h-5 w-5" />
                    </div>
                  )}
                  <div className={`max-w-[84%] whitespace-pre-wrap rounded-3xl px-4 py-3 text-sm leading-6 shadow-[0_12px_35px_rgba(0,0,0,0.20)] sm:max-w-[76%] ${isUser ? 'rounded-br-lg bg-[#FF6B35] text-white' : 'rounded-bl-lg bg-[#111827] text-[#D7DEE9]'}`}>
                    {message.content}
                  </div>
                  {isUser && (
                    <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FF6B35] text-white">
                      <UserRound className="h-5 w-5" />
                    </div>
                  )}
                </div>
              );
            })}

            {isTyping && (
              <div className="flex items-start gap-3">
                <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#111827] text-[#FF6B35]">
                  <Bot className="h-5 w-5" />
                </div>
                <div className="inline-flex items-center gap-2 rounded-3xl rounded-bl-lg bg-[#111827] px-4 py-3 text-sm text-[#D7DEE9]">
                  <Loader2 className="h-4 w-4 animate-spin text-[#FF6B35]" />
                  AI Tutor is typing...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSubmit} className="sticky bottom-0 border-t border-white/10 bg-[#0A0F1E]/95 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur sm:p-4 sm:pb-[calc(1rem+env(safe-area-inset-bottom))]">
            {limitNotice && (
              <p className="mb-3 rounded-2xl border border-[#FF6B35]/25 bg-[#FF6B35]/10 px-4 py-3 text-sm font-semibold text-[#FFB199]">
                {limitNotice}
              </p>
            )}
            <div className="flex items-end gap-3">
              <label className="sr-only" htmlFor="ai-tutor-question">Ask AI Tutor</label>
              <textarea
                id="ai-tutor-question"
                value={input}
                onChange={event => setInput(event.target.value)}
                onKeyDown={event => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    event.currentTarget.form?.requestSubmit();
                  }
                }}
                rows={1}
                disabled={limitReached || isTyping}
                placeholder={limitReached ? LIMIT_MESSAGE : 'Type your exam question...'}
                className="max-h-32 min-h-12 flex-1 resize-none rounded-2xl border border-white/10 bg-[#111827] px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-[#5F6B82] focus:border-[#FF6B35]/60 focus:ring-2 focus:ring-[#FF6B35]/20 disabled:cursor-not-allowed disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={sendDisabled}
                className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-2xl bg-[#FF6B35] px-4 font-sans text-sm font-bold text-white shadow-[0_14px_30px_rgba(255,107,53,0.24)] transition hover:bg-[#ff7c4d] disabled:cursor-not-allowed disabled:bg-[#3A4253] disabled:text-[#8B9CB8] disabled:shadow-none sm:px-5"
              >
                {isTyping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                <span className="hidden sm:inline">Send</span>
              </button>
            </div>
          </form>
        </section>
      </main>
      {renderBottomNavigation()}
    </div>
  );
}
