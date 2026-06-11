import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, ChevronLeft, Download, Loader2, Pause, Play, RotateCcw, RotateCw, SkipBack, SkipForward, Volume2 } from 'lucide-react';
import { useAudioPlayer } from '../../contexts/AudioContext.jsx';
import { supabase } from '../../supabase';

const AUDIOBOOK_TITLE = 'JAMB Novel 2026 – The Life Changer';
const PLAYBACK_SPEEDS = [0.75, 1, 1.25, 1.5, 2];

const fallbackChapters = [
  { id: 1, number: 1, title: 'The Arrival', durationSeconds: 930, url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  { id: 2, number: 2, title: 'The Family Meeting', durationSeconds: 885, url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
  { id: 3, number: 3, title: 'Salma at the University', durationSeconds: 970, url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
  { id: 4, number: 4, title: 'The Unexpected Visitor', durationSeconds: 1020, url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
  { id: 5, number: 5, title: "Dr. Dabo's Advice", durationSeconds: 840, url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3' },
  { id: 6, number: 6, title: 'The Examination Hall', durationSeconds: 910, url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3' },
  { id: 7, number: 7, title: 'The Missing Phone', durationSeconds: 950, url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3' },
  { id: 8, number: 8, title: 'The Confrontation', durationSeconds: 890, url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3' },
  { id: 9, number: 9, title: 'The Resolution', durationSeconds: 920, url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3' },
  { id: 10, number: 10, title: 'Graduation Day', durationSeconds: 880, url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3' },
  { id: 11, number: 11, title: 'The Life Changer – Reflection', durationSeconds: 800, url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3' },
  { id: 12, number: 12, title: "Author's Note", durationSeconds: 720, url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3' }
];

const formatTime = seconds => {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${minutes}:${remainingSeconds}`;
};

const formatChapterTitle = chapter => {
  if (!chapter) return 'Audiobook chapter';
  const title = chapter.title || `Chapter ${chapter.number}`;
  return title.toLowerCase().startsWith('chapter') ? title : `Chapter ${chapter.number}: ${title}`;
};

const mapChapterRow = row => ({
  id: row.id,
  number: row.chapter_number,
  title: row.title,
  durationSeconds: row.duration_seconds,
  url: row.audio_url
});

export default function Audiobook({ navigatePath, user }) {
  const {
    currentUrl,
    currentTitle,
    currentChapter,
    currentTime,
    duration,
    isPlaying,
    playbackRate,
    playChapter: playAudioChapter,
    pause,
    seek,
    setPlaybackRate
  } = useAudioPlayer();
  const [chapters, setChapters] = useState(fallbackChapters);
  const [progressByChapter, setProgressByChapter] = useState({});
  const [selectedChapterIndex, setSelectedChapterIndex] = useState(0);
  const [loadingChapters, setLoadingChapters] = useState(true);
  const [chapterError, setChapterError] = useState('');
  const saveBucketRef = useRef('');

  useEffect(() => {
    let active = true;

    const loadChapters = async () => {
      setLoadingChapters(true);
      setChapterError('');

      const { data, error } = await supabase
        .from('audiobook_chapters')
        .select('id, chapter_number, title, duration_seconds, audio_url')
        .order('chapter_number', { ascending: true });

      if (!active) return;

      if (error) {
        console.info('Unable to load audiobook chapters from Supabase; using placeholders.', error.message);
        setChapterError('Using placeholder chapters until Supabase audiobook tables are ready.');
        setChapters(fallbackChapters);
      } else if (Array.isArray(data) && data.length > 0) {
        setChapters(data.map(mapChapterRow));
      } else {
        setChapterError('No audiobook chapters found yet. Using placeholder chapters.');
        setChapters(fallbackChapters);
      }

      setLoadingChapters(false);
    };

    loadChapters();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!user?.id) {
      setProgressByChapter({});
      return;
    }

    let active = true;

    const loadProgress = async () => {
      const { data, error } = await supabase
        .from('user_audio_progress')
        .select('chapter_id, progress_seconds, completed, last_listened')
        .eq('user_id', user.id);

      if (!active) return;

      if (error) {
        console.info('Unable to load audiobook progress:', error.message);
        return;
      }

      const nextProgress = (data || []).reduce((acc, item) => {
        acc[item.chapter_id] = {
          progressSeconds: Number(item.progress_seconds) || 0,
          completed: Boolean(item.completed),
          lastListened: item.last_listened
        };
        return acc;
      }, {});

      setProgressByChapter(nextProgress);
    };

    loadProgress();

    return () => {
      active = false;
    };
  }, [user?.id]);

  const activeChapterIndex = chapters.findIndex(chapter => chapter.url === currentUrl);
  const currentChapterIndex = activeChapterIndex >= 0 ? activeChapterIndex : selectedChapterIndex;
  const currentChapterDetails = chapters[currentChapterIndex] || chapters[0];
  const loaded = Boolean(currentUrl);
  const playerTitle = currentTitle || formatChapterTitle(currentChapterDetails);
  const playerChapterNumber = currentChapter?.number || currentChapterDetails?.number || 1;
  const displayDuration = duration || currentChapterDetails?.durationSeconds || 0;
  const remainingTime = useMemo(() => Math.max(displayDuration - currentTime, 0), [displayDuration, currentTime]);

  const saveProgress = useCallback(async (chapter, progressSeconds, completed = false) => {
    if (!user?.id || !chapter?.id) return;

    const safeProgress = Math.max(0, Math.floor(progressSeconds || 0));
    const nextProgress = {
      progressSeconds: safeProgress,
      completed,
      lastListened: new Date().toISOString()
    };

    setProgressByChapter(current => ({
      ...current,
      [chapter.id]: nextProgress
    }));

    const { error } = await supabase
      .from('user_audio_progress')
      .upsert({
        user_id: user.id,
        chapter_id: chapter.id,
        progress_seconds: safeProgress,
        completed,
        last_listened: nextProgress.lastListened
      }, { onConflict: 'user_id,chapter_id' });

    if (error) {
      console.info('Unable to save audiobook progress:', error.message);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!currentChapter?.id || currentChapter.url !== currentUrl || !user?.id) return;

    const playableDuration = duration || currentChapter.durationSeconds || 0;
    const completed = playableDuration > 0 && currentTime >= Math.max(playableDuration - 2, playableDuration * 0.95);
    const bucket = completed ? 'complete' : Math.floor(currentTime / 10);
    const saveKey = `${currentChapter.id}-${bucket}-${completed}`;

    if (saveBucketRef.current === saveKey) return;
    saveBucketRef.current = saveKey;

    saveProgress(currentChapter, completed ? playableDuration : currentTime, completed);
  }, [currentChapter, currentTime, currentUrl, duration, saveProgress, user?.id]);

  const playChapter = index => {
    const chapter = chapters[index];
    if (!chapter) return;

    setSelectedChapterIndex(index);

    if (chapter.url === currentUrl && isPlaying) {
      pause();
      return;
    }

    const savedProgress = progressByChapter[chapter.id];
    const resumeAt = savedProgress?.completed ? 0 : savedProgress?.progressSeconds || 0;
    playAudioChapter(chapter.url, formatChapterTitle(chapter), chapter, resumeAt);
  };

  const goToChapter = nextIndex => {
    const safeIndex = Math.min(Math.max(nextIndex, 0), chapters.length - 1);
    playChapter(safeIndex);
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      pause();
      return;
    }

    const savedProgress = progressByChapter[currentChapterDetails.id];
    const resumeAt = currentUrl ? null : savedProgress?.completed ? 0 : savedProgress?.progressSeconds || 0;
    playAudioChapter(currentChapterDetails.url, formatChapterTitle(currentChapterDetails), currentChapterDetails, resumeAt);
  };

  const handleSeek = event => {
    seek(Number(event.target.value));
  };

  const skipBy = seconds => {
    seek(currentTime + seconds);
  };

  return (
    <div className="min-h-screen bg-[#0A0F1E] px-4 pb-64 pt-5 text-white sm:px-6 lg:px-8">
      <main className="mx-auto max-w-4xl">
        <button
          type="button"
          onClick={() => navigatePath('/dashboard')}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#111827]/90 px-4 py-2.5 font-sans text-sm font-bold text-[#FFB199] transition hover:border-[#FF6B35]/50 hover:text-[#FF6B35]"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Dashboard
        </button>

        <section className="mt-5 rounded-[28px] border border-[#FF6B35]/20 bg-gradient-to-br from-[#1A1A2E] via-[#141827] to-[#111827] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.32)] sm:p-6">
          <p className="font-sans text-[11px] font-bold uppercase tracking-[0.28em] text-[#FFB199]">ExamReady Audiobook</p>
          <h1 className="mt-3 font-heading text-2xl font-bold leading-tight text-white sm:text-3xl">{AUDIOBOOK_TITLE}</h1>
          <p className="mt-3 max-w-2xl font-sans text-sm leading-6 text-[#8B9CB8]">
            Listen chapter by chapter, resume where you stopped, save chapters offline, and mark your progress as you revise for JAMB.
          </p>
        </section>

        {chapterError && (
          <div className="mt-4 rounded-2xl border border-[#FF6B35]/30 bg-[#FF6B35]/10 px-4 py-3 font-sans text-sm font-semibold text-[#FFB199]">
            {chapterError}
          </div>
        )}

        <section className="mt-6 space-y-3">
          {loadingChapters ? (
            <div className="flex items-center justify-center gap-3 rounded-2xl border border-white/10 bg-[#111827] p-6 font-sans text-sm font-semibold text-[#8B9CB8]">
              <Loader2 className="h-5 w-5 animate-spin text-[#FF6B35]" />
              Loading audiobook chapters...
            </div>
          ) : chapters.map((chapter, index) => {
            const active = chapter.url === currentUrl;
            const playing = active && isPlaying;
            const progress = progressByChapter[chapter.id];
            const progressSeconds = progress?.completed ? chapter.durationSeconds : progress?.progressSeconds || 0;
            const progressPercent = Math.min(Math.round((progressSeconds / Math.max(chapter.durationSeconds, 1)) * 100), 100);

            return (
              <article
                key={chapter.id || chapter.number}
                className={`rounded-2xl border bg-[#111827] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition ${active ? 'border-[#FF6B35]/60 shadow-[0_0_24px_rgba(255,107,53,0.12)]' : 'border-white/10 hover:border-[#FF6B35]/30'}`}
              >
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => playChapter(index)}
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition ${active ? 'bg-[#FF6B35] text-white' : 'bg-[#0A0F1E] text-[#FFB199] hover:bg-[#FF6B35] hover:text-white'}`}
                    aria-label={`${playing ? 'Pause' : 'Play'} ${formatChapterTitle(chapter)}`}
                  >
                    {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-heading text-sm font-bold text-white sm:text-base">Chapter {chapter.number}</p>
                      {progress?.completed && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-1 font-sans text-[11px] font-bold text-emerald-200">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Completed
                        </span>
                      )}
                    </div>
                    <h2 className="mt-1 break-words font-sans text-sm font-semibold leading-5 text-[#C8D2E4] sm:text-base">{formatChapterTitle(chapter)}</h2>
                    <p className="mt-1 font-sans text-xs text-[#8B9CB8]">
                      Duration: {formatTime(chapter.durationSeconds)}{progressSeconds > 0 && !progress?.completed ? ` • Resume at ${formatTime(progressSeconds)}` : ''}
                    </p>
                  </div>

                  <a
                    href={chapter.url}
                    download
                    target="_blank"
                    rel="noreferrer"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 text-[#8B9CB8] transition hover:border-[#FF6B35]/50 hover:text-[#FF6B35]"
                    aria-label={`Download ${formatChapterTitle(chapter)} for offline listening`}
                  >
                    <Download className="h-4 w-4" />
                    <span className="sr-only">Download for offline listening</span>
                  </a>
                </div>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#0A0F1E]">
                  <div className="h-full rounded-full bg-[#FF6B35] transition-all" style={{ width: `${progressPercent}%` }} />
                </div>
              </article>
            );
          })}
        </section>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#0A0F1E]/95 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur-2xl">
        <div className="mx-auto max-w-4xl rounded-[22px] border border-white/10 bg-[#111827] p-4 shadow-[0_-18px_55px_rgba(0,0,0,0.28)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-[#FFB199]">Now playing</p>
              <h2 className="mt-1 truncate font-heading text-sm font-bold text-white sm:text-base">{playerTitle}</h2>
            </div>
            <div className="flex shrink-0 items-center justify-between gap-1 sm:justify-end sm:gap-2">
              <button type="button" onClick={() => goToChapter(currentChapterIndex - 1)} disabled={currentChapterIndex === 0} className="rounded-full p-2 text-[#8B9CB8] transition hover:text-[#FF6B35] disabled:cursor-not-allowed disabled:opacity-40" aria-label="Previous chapter">
                <SkipBack className="h-5 w-5" />
              </button>
              <button type="button" onClick={() => skipBy(-10)} disabled={!loaded} className="inline-flex items-center gap-1 rounded-full px-2 py-2 font-sans text-xs font-bold text-[#8B9CB8] transition hover:text-[#FF6B35] disabled:cursor-not-allowed disabled:opacity-40" aria-label="Rewind 10 seconds">
                <RotateCcw className="h-4 w-4" />
                -10
              </button>
              <button type="button" onClick={togglePlayPause} className="flex h-11 w-11 items-center justify-center rounded-full bg-[#FF6B35] text-white transition hover:bg-[#ff7c4d]" aria-label={isPlaying ? 'Pause audiobook' : 'Play audiobook'}>
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              </button>
              <button type="button" onClick={() => skipBy(10)} disabled={!loaded} className="inline-flex items-center gap-1 rounded-full px-2 py-2 font-sans text-xs font-bold text-[#8B9CB8] transition hover:text-[#FF6B35] disabled:cursor-not-allowed disabled:opacity-40" aria-label="Forward 10 seconds">
                +10
                <RotateCw className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => goToChapter(currentChapterIndex + 1)} disabled={currentChapterIndex + 1 >= chapters.length} className="rounded-full p-2 text-[#8B9CB8] transition hover:text-[#FF6B35] disabled:cursor-not-allowed disabled:opacity-40" aria-label="Next chapter">
                <SkipForward className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-3">
            <span className="w-10 text-right font-sans text-xs text-[#8B9CB8]">{formatTime(currentTime)}</span>
            <input
              type="range"
              min="0"
              max={displayDuration || 0}
              value={Math.min(currentTime, displayDuration || 0)}
              onChange={handleSeek}
              disabled={!loaded}
              className="h-2 flex-1 accent-[#FF6B35] disabled:opacity-50"
              aria-label="Seek audiobook"
            />
            <span className="w-12 font-sans text-xs text-[#8B9CB8]">-{formatTime(remainingTime)}</span>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 font-sans text-xs text-[#8B9CB8]">
            <div className="flex items-center gap-2">
              <Volume2 className="h-4 w-4 text-[#FF6B35]" />
              <span>Chapter {playerChapterNumber} of {chapters.length}</span>
            </div>

            <label className="inline-flex items-center gap-2 font-semibold text-[#C8D2E4]">
              Speed
              <select
                value={playbackRate}
                onChange={event => setPlaybackRate(Number(event.target.value))}
                className="rounded-full border border-white/10 bg-[#0A0F1E] px-3 py-1.5 text-xs font-bold text-white outline-none focus:border-[#FF6B35]"
                aria-label="Playback speed"
              >
                {PLAYBACK_SPEEDS.map(speed => (
                  <option key={speed} value={speed}>{speed}x</option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
