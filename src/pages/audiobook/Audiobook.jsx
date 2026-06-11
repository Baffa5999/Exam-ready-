import React, { useMemo, useState } from 'react';
import { ChevronLeft, Download, Pause, Play, RotateCcw, RotateCw, SkipBack, SkipForward, Volume2 } from 'lucide-react';
import { useAudioPlayer } from '../../contexts/AudioContext.jsx';

const AUDIOBOOK_TITLE = 'JAMB Novel 2026 – The Life Changer';

const chapters = [
  { number: 1, title: 'Chapter 1: The Arrival', duration: '15:30', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  { number: 2, title: 'Chapter 2: The Family Meeting', duration: '14:45', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
  { number: 3, title: 'Chapter 3: Salma at the University', duration: '16:10', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
  { number: 4, title: 'Chapter 4: A New Beginning', duration: '13:55', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
  { number: 5, title: 'Chapter 5: Campus Lessons', duration: '17:20', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3' },
  { number: 6, title: 'Chapter 6: Choices and Consequences', duration: '12:40', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3' },
  { number: 7, title: 'Chapter 7: The Examination', duration: '18:05', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3' },
  { number: 8, title: 'Chapter 8: Lessons from Experience', duration: '15:15', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3' },
  { number: 9, title: 'Chapter 9: Trust and Trouble', duration: '14:25', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3' },
  { number: 10, title: 'Chapter 10: The Warning', duration: '16:35', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3' },
  { number: 11, title: 'Chapter 11: A Mother’s Advice', duration: '13:30', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3' },
  { number: 12, title: 'Chapter 12: The Life Changer', duration: '19:00', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3' }
];

const formatTime = seconds => {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${minutes}:${remainingSeconds}`;
};

const getChapterIndexByUrl = url => chapters.findIndex(chapter => chapter.url === url);

export default function Audiobook({ navigatePath }) {
  const {
    currentUrl,
    currentTitle,
    currentChapter,
    currentTime,
    duration,
    isPlaying,
    playChapter: playAudioChapter,
    pause,
    seek
  } = useAudioPlayer();
  const [selectedChapterIndex, setSelectedChapterIndex] = useState(0);
  const activeChapterIndex = getChapterIndexByUrl(currentUrl);
  const currentChapterIndex = activeChapterIndex >= 0 ? activeChapterIndex : selectedChapterIndex;
  const currentChapterDetails = chapters[currentChapterIndex] || chapters[0];
  const loaded = Boolean(currentUrl);
  const playerTitle = currentTitle || currentChapterDetails.title;
  const playerChapterNumber = currentChapter?.number || currentChapterDetails.number;
  const remainingTime = useMemo(() => Math.max(duration - currentTime, 0), [duration, currentTime]);

  const playChapter = index => {
    const chapter = chapters[index];
    if (!chapter) return;

    setSelectedChapterIndex(index);

    if (chapter.url === currentUrl && isPlaying) {
      pause();
      return;
    }

    playAudioChapter(chapter.url, chapter.title, chapter);
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

    playAudioChapter(currentChapterDetails.url, currentChapterDetails.title, currentChapterDetails);
  };

  const handleSeek = event => {
    seek(Number(event.target.value));
  };

  const skipBy = seconds => {
    seek(currentTime + seconds);
  };

  return (
    <div className="min-h-screen bg-[#0A0F1E] px-4 pb-52 pt-5 text-white sm:px-6 lg:px-8">
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
            Listen to chapter-by-chapter study audio while you revise for JAMB. Placeholder recordings are used for now.
          </p>
        </section>

        <section className="mt-6 space-y-3">
          {chapters.map((chapter, index) => {
            const active = chapter.url === currentUrl;
            const playing = active && isPlaying;

            return (
              <article
                key={chapter.number}
                className={`flex items-center gap-3 rounded-2xl border bg-[#111827] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition ${active ? 'border-[#FF6B35]/60 shadow-[0_0_24px_rgba(255,107,53,0.12)]' : 'border-white/10 hover:border-[#FF6B35]/30'}`}
              >
                <button
                  type="button"
                  onClick={() => playChapter(index)}
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition ${active ? 'bg-[#FF6B35] text-white' : 'bg-[#0A0F1E] text-[#FFB199] hover:bg-[#FF6B35] hover:text-white'}`}
                  aria-label={`${playing ? 'Pause' : 'Play'} ${chapter.title}`}
                >
                  {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                </button>

                <div className="min-w-0 flex-1">
                  <p className="font-heading text-sm font-bold text-white sm:text-base">Chapter {chapter.number}</p>
                  <h2 className="mt-1 break-words font-sans text-sm font-semibold leading-5 text-[#C8D2E4] sm:text-base">{chapter.title}</h2>
                  <p className="mt-1 font-sans text-xs text-[#8B9CB8]">Duration: {chapter.duration}</p>
                </div>

                <a
                  href={chapter.url}
                  download
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 text-[#8B9CB8] transition hover:border-[#FF6B35]/50 hover:text-[#FF6B35]"
                  aria-label={`Download ${chapter.title}`}
                >
                  <Download className="h-4 w-4" />
                  <span className="sr-only">Download</span>
                </a>
              </article>
            );
          })}
        </section>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#0A0F1E]/95 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur-2xl">
        <div className="mx-auto max-w-4xl rounded-[22px] border border-white/10 bg-[#111827] p-4 shadow-[0_-18px_55px_rgba(0,0,0,0.28)]">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-[#FFB199]">Now playing</p>
              <h2 className="mt-1 truncate font-heading text-sm font-bold text-white sm:text-base">{playerTitle}</h2>
            </div>
            <div className="flex shrink-0 items-center gap-1 sm:gap-2">
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
              max={duration || 0}
              value={Math.min(currentTime, duration || 0)}
              onChange={handleSeek}
              disabled={!loaded}
              className="h-2 flex-1 accent-[#FF6B35] disabled:opacity-50"
              aria-label="Seek audiobook"
            />
            <span className="w-12 font-sans text-xs text-[#8B9CB8]">-{formatTime(remainingTime)}</span>
          </div>

          <div className="mt-2 flex items-center gap-2 font-sans text-xs text-[#8B9CB8]">
            <Volume2 className="h-4 w-4 text-[#FF6B35]" />
            <span>Chapter {playerChapterNumber} of {chapters.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
