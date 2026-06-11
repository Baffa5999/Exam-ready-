import React, { createContext, useContext, useMemo, useRef, useState } from 'react';

const AudioContext = createContext(null);

const clampTime = (time, duration) => {
  if (!Number.isFinite(time)) return 0;
  if (!Number.isFinite(duration) || duration <= 0) return Math.max(time, 0);
  return Math.min(Math.max(time, 0), duration);
};

export function AudioProvider({ children }) {
  const audioRef = useRef(null);
  const [currentUrl, setCurrentUrl] = useState('');
  const [currentTitle, setCurrentTitle] = useState('');
  const [currentChapter, setCurrentChapter] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(1);

  const playChapter = (url, title, chapter = null) => {
    const audio = audioRef.current;
    if (!audio || !url) return;

    const isNewSource = audio.src !== new URL(url, window.location.href).href;

    if (isNewSource) {
      audio.src = url;
      audio.load();
      setCurrentTime(0);
      setDuration(0);
    }

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

  const value = useMemo(() => ({
    currentUrl,
    currentTitle,
    currentChapter,
    currentTime,
    duration,
    isPlaying,
    volume,
    playChapter,
    pause,
    seek,
    setVolume
  }), [currentUrl, currentTitle, currentChapter, currentTime, duration, isPlaying, volume]);

  return (
    <AudioContext.Provider value={value}>
      {children}
      <audio
        ref={audioRef}
        preload="metadata"
        onTimeUpdate={event => setCurrentTime(event.currentTarget.currentTime)}
        onLoadedMetadata={event => setDuration(event.currentTarget.duration || 0)}
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
