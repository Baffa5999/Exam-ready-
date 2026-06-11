import React, { createContext, useContext, useMemo, useRef, useState } from 'react';

const AudioContext = createContext(null);

const clampTime = (time, duration) => {
  if (!Number.isFinite(time)) return 0;
  if (!Number.isFinite(duration) || duration <= 0) return Math.max(time, 0);
  return Math.min(Math.max(time, 0), duration);
};

export function AudioProvider({ children }) {
  const audioRef = useRef(null);
  const pendingStartRef = useRef(null);
  const [currentUrl, setCurrentUrl] = useState('');
  const [currentTitle, setCurrentTitle] = useState('');
  const [currentChapter, setCurrentChapter] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(1);
  const [playbackRate, setPlaybackRateState] = useState(1);

  const playChapter = (url, title, chapter = null, startAt = null) => {
    const audio = audioRef.current;
    if (!audio || !url) return;

    const isNewSource = audio.src !== new URL(url, window.location.href).href;
    const resumeAt = Number.isFinite(startAt) && startAt > 0 ? startAt : null;

    if (isNewSource) {
      pendingStartRef.current = resumeAt;
      audio.src = url;
      audio.load();
      setCurrentTime(resumeAt || 0);
      setDuration(0);
    } else if (resumeAt !== null) {
      const nextTime = clampTime(resumeAt, audio.duration);
      audio.currentTime = nextTime;
      setCurrentTime(nextTime);
    }

    audio.playbackRate = playbackRate;
    setCurrentUrl(url);
    setCurrentTitle(title || 'Audiobook chapter');
    setCurrentChapter(chapter);

    void audio.play().then(() => setIsPlaying(true)).catch(error => {
      console.warn('Unable to play audio:', error);
      setIsPlaying(false);
    });
  };

  const pause = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    setIsPlaying(false);
  };

  const seek = seconds => {
    const audio = audioRef.current;
    if (!audio) return;
    const nextTime = clampTime(seconds, audio.duration);
    audio.currentTime = nextTime;
    setCurrentTime(nextTime);
  };

  const setVolume = nextVolume => {
    const audio = audioRef.current;
    const safeVolume = Math.min(Math.max(Number(nextVolume) || 0, 0), 1);
    setVolumeState(safeVolume);
    if (audio) audio.volume = safeVolume;
  };

  const setPlaybackRate = nextRate => {
    const audio = audioRef.current;
    const safeRate = Math.min(Math.max(Number(nextRate) || 1, 0.5), 2);
    setPlaybackRateState(safeRate);
    if (audio) audio.playbackRate = safeRate;
  };

  const value = useMemo(() => ({
    currentUrl,
    currentTitle,
    currentChapter,
    currentTime,
    duration,
    isPlaying,
    volume,
    playbackRate,
    playChapter,
    pause,
    seek,
    setVolume,
    setPlaybackRate
  }), [currentUrl, currentTitle, currentChapter, currentTime, duration, isPlaying, volume, playbackRate]);

  return (
    <AudioContext.Provider value={value}>
      {children}
      <audio
        ref={audioRef}
        preload="metadata"
        onTimeUpdate={event => setCurrentTime(event.currentTarget.currentTime)}
        onLoadedMetadata={event => {
          const audio = event.currentTarget;
          const loadedDuration = audio.duration || 0;
          const startAt = pendingStartRef.current;
          setDuration(loadedDuration);

          if (startAt !== null) {
            const nextTime = clampTime(startAt, loadedDuration);
            audio.currentTime = nextTime;
            setCurrentTime(nextTime);
            pendingStartRef.current = null;
          }
        }}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
      />
    </AudioContext.Provider>
  );
}

export function useAudioPlayer() {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudioPlayer must be used within an AudioProvider');
  }
  return context;
}
