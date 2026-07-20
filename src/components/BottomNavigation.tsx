/**
 * Bottom Navigation Component
 * Shared navigation bar for all main pages
 */

import React from 'react';
import {
  Home,
  BookOpen,
  Layers,
  Swords,
  Trophy,
} from 'lucide-react';

interface BottomNavigationProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export default function BottomNavigation({ currentPath, onNavigate }: BottomNavigationProps) {
  const navItems = [
    { icon: Home, label: 'Home', path: '/home' },
    { icon: BookOpen, label: 'Practice', path: '/practice' },
    { icon: Layers, label: 'Flashcards', path: '/flashcards' },
    { icon: Swords, label: 'Battle', path: '/battle' },
    { icon: Trophy, label: 'Leaderboard', path: '/leaderboard' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t border-[rgba(255,255,255,0.08)] bg-[#0A0F1E]/95 backdrop-blur-xl z-50">
      <div className="mx-auto flex max-w-2xl items-center justify-around px-4 py-3 sm:px-6">
        {navItems.map(({ icon: Icon, label, path }) => {
          const isActive = currentPath === path || (path === '/home' && currentPath === '/');
          return (
            <button
              key={path}
              type="button"
              onClick={() => onNavigate(path)}
              className={`flex flex-col items-center gap-1 rounded-lg px-3 py-2 transition-all duration-200 ${
                isActive
                  ? 'text-[#FF6B35]'
                  : 'text-[#8B9CB8] hover:text-white'
              }`}
              aria-label={label}
              title={label}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-semibold">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
