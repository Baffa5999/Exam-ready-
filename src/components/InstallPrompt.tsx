import React, { useEffect, useRef, useState } from 'react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

const DISMISSED_KEY = 'examready_install_dismissed';

const getTodayKey = () => new Date().toISOString().slice(0, 10);

const isMobileDevice = () => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;

  return window.matchMedia('(max-width: 768px)').matches || /Android|iPhone|iPad|iPod|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

const isStandaloneDisplay = () => {
  if (typeof window === 'undefined') return false;

  return window.matchMedia('(display-mode: standalone)').matches || Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
};

export default function InstallPrompt() {
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();

      if (!isMobileDevice() || isStandaloneDisplay()) return;

      const dismissedToday = localStorage.getItem(DISMISSED_KEY) === getTodayKey();
      if (dismissedToday) return;

      deferredPromptRef.current = event as BeforeInstallPromptEvent;
      setVisible(true);
    };

    const handleAppInstalled = () => {
      deferredPromptRef.current = null;
      setVisible(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    const deferredPrompt = deferredPromptRef.current;
    if (!deferredPrompt) return;

    setVisible(false);
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice.catch(() => null);
    deferredPromptRef.current = null;
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, getTodayKey());
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-[72px] z-50 border-t border-[rgba(255,107,53,0.3)] bg-[#1A1A2E] px-4 py-3 shadow-[0_-16px_40px_rgba(0,0,0,0.35)]">
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <img src="/icon-192x192.png" alt="ExamReady app icon" className="h-10 w-10 shrink-0 rounded-[10px]" />
          <div className="min-w-0">
            <p className="font-sans text-sm font-bold leading-5 text-white">ExamReady</p>
            <p className="truncate font-sans text-xs font-normal leading-4 text-[#8B9CB8]">Install for faster access</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={handleDismiss}
            className="rounded-lg bg-transparent px-3 py-2 font-sans text-[13px] font-normal text-[#8B9CB8] transition hover:text-white"
          >
            Not Now
          </button>
          <button
            type="button"
            onClick={handleInstall}
            className="rounded-lg bg-[#FF6B35] px-4 py-2 font-sans text-[13px] font-bold text-white transition hover:bg-[#ff7c4d]"
          >
            Install
          </button>
        </div>
      </div>
    </div>
  );
}
