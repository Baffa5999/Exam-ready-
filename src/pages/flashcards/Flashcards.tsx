/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../../supabase';
import { ChevronLeft, ChevronRight, Layers, Loader2, RotateCcw, Check, Repeat2, ListChecks } from 'lucide-react';

type Subject = { name: string; accent: string; gradient: string };

type Flashcard = {
  id: string;
  subject: string;
  topic: string;
  subtopic: string;
  front: string;
  back: string;
};

type CardStatus = 'known' | 'learning';

type SubtopicSummary = {
  name: string;
  count: number;
};

interface FlashcardsProps {
  route: string;
  user: User | null;
  navigatePath: (path: string, state?: Record<string, unknown>, options?: { replace?: boolean }) => void;
  renderBottomNavigation: () => React.ReactNode;
  subjectLibrary: Subject[];
  slugify: (value: string) => string;
  professionalPageClass: string;
  professionalMainClass: string;
  professionalBackButtonClass: string;
  renderProfessionalHeader: (title: string, description: string, HeaderIcon: React.ElementType, accent?: string) => React.ReactNode;
}

const ACCENT = '#FF6B35';
const TEAL = '#2EC4B6';

function shuffle<T>(input: T[]): T[] {
  const arr = [...input];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function Flashcards(props: FlashcardsProps) {
  const {
    route,
    user,
    navigatePath,
    renderBottomNavigation,
    subjectLibrary,
    slugify,
    professionalPageClass,
    professionalMainClass,
    professionalBackButtonClass,
    renderProfessionalHeader
  } = props;

  const segments = route.split('/').filter(Boolean); // ['flashcards', subjectSlug?, subtopicSlug?]
  const subjectSlug = segments[1] || '';
  const subtopicSlug = segments[2] || '';
  const level = segments.length;

  const activeSubject = useMemo(
    () => subjectLibrary.find(subject => slugify(subject.name) === subjectSlug) || null,
    [subjectLibrary, slugify, subjectSlug]
  );

  // Subtopic picker state
  const [subtopics, setSubtopics] = useState<SubtopicSummary[]>([]);
  const [loadingSubtopics, setLoadingSubtopics] = useState(false);
  const [subtopicsError, setSubtopicsError] = useState<string | null>(null);

  // Deck state
  const [deckCards, setDeckCards] = useState<Flashcard[]>([]);
  const [deckSubtopicName, setDeckSubtopicName] = useState<string>('');
  const [loadingDeck, setLoadingDeck] = useState(false);
  const [deckError, setDeckError] = useState<string | null>(null);
  const [lastSession, setLastSession] = useState<{ known: number; learning: number } | null>(null);

  // Study loop state
  const [stage, setStage] = useState<'start' | 'study' | 'summary'>('start');
  const [sessionCards, setSessionCards] = useState<Flashcard[]>([]);
  const [cardIndex, setCardIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [results, setResults] = useState<Record<string, CardStatus>>({});
  const [reviewMode, setReviewMode] = useState(false);

  // Load subtopics + counts for the subject (picker screen)
  useEffect(() => {
    if (level !== 2 || !activeSubject) return;
    let cancelled = false;

    const loadSubtopics = async () => {
      setLoadingSubtopics(true);
      setSubtopicsError(null);

      const { data, error } = await supabase
        .from('flashcards')
        .select('subtopic')
        .eq('subject', activeSubject.name);

      if (cancelled) return;

      if (error) {
        console.warn('[v0] Unable to load flashcard subtopics:', error);
        setSubtopics([]);
        setSubtopicsError('We could not load flashcards yet. Make sure the flashcards table exists in Supabase.');
        setLoadingSubtopics(false);
        return;
      }

      const counts = new Map<string, number>();
      (data || []).forEach(row => {
        const subtopic = `${row.subtopic || ''}`.trim();
        if (!subtopic) return;
        counts.set(subtopic, (counts.get(subtopic) || 0) + 1);
      });

      const summaries = Array.from(counts.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => a.name.localeCompare(b.name));

      setSubtopics(summaries);
      setLoadingSubtopics(false);
    };

    void loadSubtopics();
    return () => {
      cancelled = true;
    };
  }, [level, activeSubject]);

  // Load deck cards + last session summary (deck screens)
  useEffect(() => {
    if (level !== 3 || !activeSubject) return;
    let cancelled = false;

    const loadDeck = async () => {
      setLoadingDeck(true);
      setDeckError(null);
      setStage('start');
      setReviewMode(false);
      setResults({});
      setCardIndex(0);
      setRevealed(false);

      const { data, error } = await supabase
        .from('flashcards')
        .select('id, subject, topic, subtopic, front, back')
        .eq('subject', activeSubject.name);

      if (cancelled) return;

      if (error) {
        console.warn('[v0] Unable to load flashcard deck:', error);
        setDeckCards([]);
        setDeckError('We could not load this deck. Make sure the flashcards table exists in Supabase.');
        setLoadingDeck(false);
        return;
      }

      const cards = (data || []).filter(card => slugify(`${card.subtopic || ''}`) === subtopicSlug) as Flashcard[];
      setDeckCards(cards);
      setDeckSubtopicName(cards[0]?.subtopic || '');

      // Previous session summary from stored progress
      if (user && cards.length > 0) {
        const { data: progressRows, error: progressError } = await supabase
          .from('flashcard_progress')
          .select('card_id, status')
          .eq('user_id', user.id)
          .in('card_id', cards.map(card => card.id));

        if (!cancelled && !progressError && progressRows && progressRows.length > 0) {
          const known = progressRows.filter(row => row.status === 'known').length;
          const learning = progressRows.filter(row => row.status === 'learning').length;
          setLastSession({ known, learning });
        } else if (!cancelled) {
          setLastSession(null);
        }
      } else if (!cancelled) {
        setLastSession(null);
      }

      setLoadingDeck(false);
    };

    void loadDeck();
    return () => {
      cancelled = true;
    };
  }, [level, activeSubject, subtopicSlug, slugify, user]);

  const persistProgress = useCallback(
    async (cardId: string, status: CardStatus) => {
      if (!user) return;
      const { error } = await supabase
        .from('flashcard_progress')
        .upsert(
          { user_id: user.id, card_id: cardId, status, last_seen: new Date().toISOString() },
          { onConflict: 'user_id,card_id' }
        );
      if (error) console.warn('[v0] Unable to save flashcard progress:', error);
    },
    [user]
  );

  const startDeck = (cards: Flashcard[], asReview: boolean) => {
    setSessionCards(shuffle(cards));
    setCardIndex(0);
    setRevealed(false);
    setResults({});
    setReviewMode(asReview);
    setStage('study');
  };

  const answerCard = (status: CardStatus) => {
    const current = sessionCards[cardIndex];
    if (!current) return;
    setResults(prev => ({ ...prev, [current.id]: status }));
    void persistProgress(current.id, status);

    if (cardIndex + 1 >= sessionCards.length) {
      setStage('summary');
    } else {
      setCardIndex(prev => prev + 1);
      setRevealed(false);
    }
  };

  // ---------- SUBJECTS GRID (level 1) ----------
  if (level < 2 || !activeSubject) {
    return (
      <div className={professionalPageClass}>
        <main className={professionalMainClass}>
          {renderProfessionalHeader('Flashcards', 'Study one card at a time and lock in what you know.', Layers, TEAL)}
          <section className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {subjectLibrary.map(subject => (
              <button
                key={subject.name}
                type="button"
                onClick={() => navigatePath(`/flashcards/${slugify(subject.name)}`)}
                className="group flex min-h-[132px] w-full flex-col rounded-2xl border bg-[#111827] p-4 text-left transition hover:-translate-y-0.5 hover:bg-[#141d2c]"
                style={{ borderColor: subject.accent }}
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: `${subject.accent}1F`, color: subject.accent }}>
                    <Layers className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="whitespace-normal break-words font-heading text-base font-semibold leading-5 text-white">{subject.name}</h2>
                    <p className="mt-1 font-sans text-[13px] font-normal text-[#8B9CB8]">Tap to choose a deck</p>
                  </div>
                </div>
                <div className="mt-auto flex justify-end pt-5">
                  <span className="inline-flex items-center gap-1 font-sans text-sm font-semibold text-[#FF6B35] transition group-hover:text-[#ff865f]">
                    Study now
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
  }

  // ---------- SUBTOPIC PICKER (level 2) ----------
  if (level === 2) {
    return (
      <div className={professionalPageClass}>
        <main className={professionalMainClass}>
          <button type="button" onClick={() => navigatePath('/flashcards')} className={professionalBackButtonClass}>
            <ChevronLeft className="h-5 w-5" /> Back
          </button>
          {renderProfessionalHeader(activeSubject.name, 'Pick a subtopic to start studying.', Layers, activeSubject.accent)}

          {loadingSubtopics ? (
            <div className="mt-10 flex items-center justify-center gap-3 text-[#8B9CB8]">
              <Loader2 className="h-5 w-5 animate-spin" /> Loading subtopics…
            </div>
          ) : subtopicsError ? (
            <div className="mt-8 rounded-[22px] border border-[#FF6B35]/30 bg-[#0B1324]/85 p-6 text-center">
              <p className="font-sans text-sm leading-6 text-[#C8D2E4]">{subtopicsError}</p>
            </div>
          ) : subtopics.length === 0 ? (
            <div className="mt-8 rounded-[22px] border border-[rgba(255,255,255,0.08)] bg-[#0B1324]/85 p-6 text-center">
              <p className="font-sans text-sm leading-6 text-[#8B9CB8]">No flashcards for {activeSubject.name} yet. Check back soon.</p>
            </div>
          ) : (
            <section className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {subtopics.map(subtopic => (
                <button
                  key={subtopic.name}
                  type="button"
                  onClick={() => navigatePath(`/flashcards/${slugify(activeSubject.name)}/${slugify(subtopic.name)}`)}
                  className="group flex w-full items-center justify-between gap-3 rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#111827] p-4 text-left transition hover:-translate-y-0.5 hover:border-[#FF6B35]/40 hover:bg-[#141d2c]"
                >
                  <div className="min-w-0 flex-1">
                    <h2 className="whitespace-normal break-words font-heading text-base font-semibold leading-5 text-white">{subtopic.name}</h2>
                    <p className="mt-1 font-sans text-[13px] font-normal text-[#8B9CB8]">{subtopic.count} {subtopic.count === 1 ? 'card' : 'cards'}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-[#FF6B35] transition group-hover:translate-x-1" />
                </button>
              ))}
            </section>
          )}
        </main>
        {renderBottomNavigation()}
      </div>
    );
  }

  // ---------- DECK FLOW (level 3) ----------
  const gotItCount = Object.values(results).filter(status => status === 'known').length;
  const learningCount = Object.values(results).filter(status => status === 'learning').length;
  const learningCards = sessionCards.filter(card => results[card.id] === 'learning');

  const backToSubtopics = () => navigatePath(`/flashcards/${slugify(activeSubject.name)}`);

  if (loadingDeck) {
    return (
      <div className={professionalPageClass}>
        <main className={professionalMainClass}>
          <div className="mt-10 flex items-center justify-center gap-3 text-[#8B9CB8]">
            <Loader2 className="h-5 w-5 animate-spin" /> Loading deck…
          </div>
        </main>
        {renderBottomNavigation()}
      </div>
    );
  }

  if (deckError || deckCards.length === 0) {
    return (
      <div className={professionalPageClass}>
        <main className={professionalMainClass}>
          <button type="button" onClick={backToSubtopics} className={professionalBackButtonClass}>
            <ChevronLeft className="h-5 w-5" /> Back
          </button>
          <div className="mt-8 rounded-[22px] border border-[rgba(255,255,255,0.08)] bg-[#0B1324]/85 p-6 text-center">
            <p className="font-sans text-sm leading-6 text-[#C8D2E4]">{deckError || 'This deck has no cards yet.'}</p>
          </div>
        </main>
        {renderBottomNavigation()}
      </div>
    );
  }

  // Deck Start
  if (stage === 'start') {
    return (
      <div className={professionalPageClass}>
        <main className={professionalMainClass}>
          <button type="button" onClick={backToSubtopics} className={professionalBackButtonClass}>
            <ChevronLeft className="h-5 w-5" /> Back
          </button>

          <div className="mt-6 flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl" style={{ backgroundColor: `${TEAL}1F`, color: TEAL }}>
              <Layers className="h-7 w-7" />
            </div>
            <h1 className="mt-5 font-heading text-2xl font-bold tracking-tight text-white sm:text-3xl">{deckSubtopicName}</h1>
            <p className="mt-2 font-sans text-sm font-semibold text-[#8B9CB8]">{activeSubject.name}</p>
            <p className="mt-1 font-sans text-sm text-[#8B9CB8]">{deckCards.length} {deckCards.length === 1 ? 'card' : 'cards'} in this deck</p>

            {lastSession && (
              <div className="mt-6 w-full max-w-md rounded-[22px] border border-[rgba(255,255,255,0.08)] bg-[#0B1324]/85 p-4">
                <p className="font-sans text-[13px] font-normal text-[#8B9CB8]">
                  Last time: <span className="font-semibold text-[#00FF87]">{lastSession.known} Got It</span> · <span className="font-semibold text-[#FFB199]">{lastSession.learning} Still Learning</span>
                </p>
              </div>
            )}
          </div>
        </main>

        <div className="fixed inset-x-0 bottom-[72px] z-40 px-5 pb-4 md:bottom-0 md:pb-5">
          <button
            type="button"
            onClick={() => startDeck(deckCards, false)}
            className="mx-auto flex w-full max-w-2xl items-center justify-center gap-2 rounded-2xl bg-[#FF6B35] px-6 py-4 font-heading text-base font-bold text-white shadow-[0_16px_40px_rgba(255,107,53,0.25)] transition hover:bg-[#ff7c4d]"
          >
            Start
          </button>
        </div>
      </div>
    );
  }

  // Summary
  if (stage === 'summary') {
    return (
      <div className={professionalPageClass}>
        <main className={professionalMainClass}>
          <div className="mt-8 flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl" style={{ backgroundColor: `${TEAL}1F`, color: TEAL }}>
              <Check className="h-8 w-8" />
            </div>
            <h1 className="mt-5 text-balance font-heading text-2xl font-bold tracking-tight text-white sm:text-3xl">
              You finished {deckSubtopicName}
            </h1>
            <p className="mt-2 font-sans text-sm font-semibold text-[#8B9CB8]">{sessionCards.length} {sessionCards.length === 1 ? 'card' : 'cards'}</p>

            <div className="mt-6 flex items-center gap-4">
              <div className="rounded-2xl border border-[#00FF87]/25 bg-[#00FF87]/10 px-5 py-3">
                <p className="font-heading text-2xl font-bold text-[#00FF87]">{gotItCount}</p>
                <p className="mt-1 font-sans text-xs font-semibold text-[#8B9CB8]">Got It</p>
              </div>
              <div className="rounded-2xl border border-[#FF6B35]/25 bg-[#FF6B35]/10 px-5 py-3">
                <p className="font-heading text-2xl font-bold text-[#FFB199]">{learningCount}</p>
                <p className="mt-1 font-sans text-xs font-semibold text-[#8B9CB8]">Still Learning</p>
              </div>
            </div>
          </div>

          <div className="mx-auto mt-8 flex w-full max-w-2xl flex-col gap-3">
            <button
              type="button"
              disabled={learningCards.length === 0}
              onClick={() => startDeck(learningCards, true)}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#FF6B35] px-6 py-4 font-heading text-base font-bold text-white shadow-[0_16px_40px_rgba(255,107,53,0.25)] transition hover:bg-[#ff7c4d] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ListChecks className="h-5 w-5" /> Review Still Learning ({learningCards.length})
            </button>
            <button
              type="button"
              onClick={() => startDeck(deckCards, false)}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[rgba(255,255,255,0.12)] bg-[#111827] px-6 py-4 font-heading text-base font-bold text-white transition hover:border-[#FF6B35]/40 hover:bg-[#141d2c]"
            >
              <Repeat2 className="h-5 w-5" /> Restart Deck
            </button>
            <button
              type="button"
              onClick={backToSubtopics}
              className="flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-4 font-heading text-base font-bold text-[#8B9CB8] transition hover:text-white"
            >
              Back to Subtopics
            </button>
          </div>
        </main>
      </div>
    );
  }

  // Card View (study)
  const currentCard = sessionCards[cardIndex];
  const progress = sessionCards.length > 0 ? ((cardIndex + (revealed ? 1 : 0)) / sessionCards.length) * 100 : 0;

  return (
    <div className={professionalPageClass}>
      <main className={`${professionalMainClass} flex min-h-[calc(100vh-9rem)] flex-col`}>
        <div className="flex items-center justify-between gap-4">
          <button type="button" onClick={backToSubtopics} className="flex items-center gap-1 font-sans text-sm font-semibold text-[#8B9CB8] transition hover:text-white">
            <ChevronLeft className="h-5 w-5" /> Exit
          </button>
          <span className="font-heading text-sm font-bold text-white">
            {cardIndex + 1}/{sessionCards.length}
          </span>
        </div>

        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[#1B2436]">
          <div className="h-full rounded-full bg-[#FF6B35] transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>

        {reviewMode && (
          <p className="mt-3 text-center font-sans text-xs font-semibold uppercase tracking-wide text-[#FFB199]">Reviewing still learning</p>
        )}

        <div className="flex flex-1 items-center justify-center py-6">
          <div
            key={currentCard?.id}
            className="flashcard-reveal w-full max-w-xl rounded-[26px] border border-[rgba(255,255,255,0.08)] bg-gradient-to-br from-[#141d2c] to-[#0B1324] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)] sm:p-8"
          >
            <p className="font-sans text-xs font-semibold uppercase tracking-wide" style={{ color: TEAL }}>{currentCard?.subtopic}</p>
            <p className="mt-4 text-balance font-heading text-xl font-bold leading-8 text-white sm:text-2xl">{currentCard?.front}</p>

            {revealed && (
              <div className="flashcard-answer mt-6 border-t border-white/10 pt-5">
                <p className="font-sans text-xs font-semibold uppercase tracking-wide text-[#8B9CB8]">Answer</p>
                <p className="mt-3 text-pretty font-sans text-base font-normal leading-7 text-[#C8D2E4]">{currentCard?.back}</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-[72px] z-40 px-5 pb-4 md:bottom-0 md:pb-5">
        <div className="mx-auto w-full max-w-2xl">
          {!revealed ? (
            <button
              type="button"
              onClick={() => setRevealed(true)}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#FF6B35] px-6 py-4 font-heading text-base font-bold text-white shadow-[0_16px_40px_rgba(255,107,53,0.25)] transition hover:bg-[#ff7c4d]"
            >
              View Answer
            </button>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => answerCard('learning')}
                className="flex items-center justify-center gap-2 rounded-2xl border border-[#FF6B35]/40 bg-[#111827] px-4 py-4 font-heading text-sm font-bold text-[#FFB199] transition hover:border-[#FF6B35]/70 hover:bg-[#141d2c] sm:text-base"
              >
                <RotateCcw className="h-5 w-5" /> Still Learning
              </button>
              <button
                type="button"
                onClick={() => answerCard('known')}
                className="flex items-center justify-center gap-2 rounded-2xl bg-[#00B368] px-4 py-4 font-heading text-sm font-bold text-white shadow-[0_16px_40px_rgba(0,179,104,0.25)] transition hover:bg-[#00c774] sm:text-base"
              >
                <Check className="h-5 w-5" /> Got It
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
