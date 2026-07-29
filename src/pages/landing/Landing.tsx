import React from 'react';
import {
  CheckCircle,
  Flame,
  BookOpen,
  Swords,
  Sparkles,
  Target,
  Trophy,
} from 'lucide-react';

interface LandingProps {
  onNavigateSignIn: () => void;
}

export default function Landing({ onNavigateSignIn }: LandingProps) {
  return (
    <div className="min-h-screen bg-[#0A0F1E] text-white font-sans">
      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 h-20 bg-[rgba(10,15,30,0.95)] backdrop-blur-md border-b border-[rgba(255,255,255,0.08)] z-50 flex items-center justify-between px-6 md:px-12">
        <span className="font-heading font-bold text-[22px] tracking-tight">
          Exam<span className="text-[#FF6B35]">Ready</span>
        </span>
        <button
          type="button"
          onClick={onNavigateSignIn}
          className="border border-[rgba(255,107,53,0.4)] text-[#FF6B35] font-medium text-sm rounded-full py-2 px-5 transition-all hover:bg-[#FF6B35] hover:text-white"
        >
          Sign In
        </button>
      </nav>

      {/* HERO */}
      <section className="pt-32 pb-20 md:pt-44 md:pb-32 px-6 md:px-12 max-w-7xl mx-auto relative">
        <div className="absolute top-0 left-0 w-96 h-96 bg-[radial-gradient(rgba(255,107,53,0.08),transparent_70%)] pointer-events-none -translate-x-1/2 -translate-y-1/2" />

        <div className="flex flex-col lg:flex-row items-center justify-between gap-12 relative">
          {/* Left: Content */}
          <div className="w-full lg:w-[60%] flex flex-col items-start space-y-6 text-left">
            <div className="inline-flex items-center gap-1.5 bg-[rgba(255,107,53,0.12)] border border-[rgba(255,107,53,0.3)] text-[#FF6B35] text-xs font-semibold px-3 py-1.5 rounded-full">
              <CheckCircle className="h-3.5 w-3.5" /> Built for Nigerian Students
            </div>

            <h1 className="font-heading font-bold text-3xl sm:text-4xl md:text-5xl leading-[1.1] tracking-tight">
              Pass JAMB,<br />
              WAEC & NECO.<br />
              <span className="text-[#FF6B35] block mt-1">Stop Guessing.</span>
            </h1>

            <p className="text-base md:text-lg text-[#8B9CB8] max-w-xl leading-relaxed">
              Practice with syllabus questions, master topics with smart cheatsheets, and battle your classmates. Everything you need to pass in one free app.
            </p>

            <div className="flex flex-wrap gap-4 w-full sm:w-auto">
              <button
                type="button"
                onClick={onNavigateSignIn}
                className="bg-[#FF6B35] hover:bg-[#ff7c4d] text-white font-bold py-3.5 px-7 rounded-xl transition shadow-md hover:shadow-[0_0_20px_rgba(255,107,53,0.4)] active:scale-95 text-center w-full sm:w-auto"
              >
                Start Practicing Free
              </button>
              <a
                href="#features"
                className="bg-transparent hover:bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.15)] text-white font-medium py-3.5 px-7 rounded-xl transition active:scale-95 text-center w-full sm:w-auto"
              >
                See Features
              </a>
            </div>

            <div className="flex flex-wrap gap-y-2 gap-x-6 text-xs text-[#8B9CB8] pt-2">
              <span className="flex items-center gap-1">
                <span className="text-[#FF6B35] font-bold">✓</span> Free forever to start
              </span>
              <span className="flex items-center gap-1">
                <span className="text-[#FF6B35] font-bold">✓</span> No credit card needed
              </span>
              <span className="flex items-center gap-1">
                <span className="text-[#FF6B35] font-bold">✓</span> JAMB, WAEC & NECO
              </span>
            </div>
          </div>

          {/* Right: Phone Mockup */}
          <div className="w-full lg:w-[40%] flex items-center justify-center relative pt-8 lg:pt-0">
            <div className="absolute h-[min(400px,90vw)] w-[min(400px,90vw)] rounded-full bg-[radial-gradient(rgba(255,107,53,0.15),transparent_70%)] blur-2xl pointer-events-none -z-10" />

            <div className="h-[460px] w-[230px] sm:h-[520px] sm:w-[260px] bg-[#1A1A2E] border-2 border-[rgba(255,255,255,0.1)] rounded-[36px] shadow-[0_40px_80px_rgba(0,0,0,0.6),0_0_60px_rgba(255,107,53,0.15)] overflow-hidden flex flex-col relative -rotate-[5deg] hover:rotate-0 transition-transform duration-500">
              <div className="w-full h-8 bg-[#1A1A2E] flex justify-between items-center px-6 relative z-10 text-[10px] text-[rgba(255,255,255,0.4)]">
                <span>9:41</span>
                <div className="w-12 h-3.5 bg-black rounded-full absolute left-1/2 -translate-x-1/2 top-2" />
              </div>

              <div className="flex-1 bg-[#0F0F1D] px-4 py-3 flex flex-col justify-between overflow-y-auto">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-[10px] text-[rgba(255,255,255,0.4)] block">Good morning</span>
                    <span className="text-xs font-bold text-white">Chidera</span>
                  </div>
                  <div className="w-6 h-6 bg-gradient-to-tr from-[#FF6B35] to-[#FF9500] rounded-full flex items-center justify-center text-[10px] font-bold text-white">
                    C
                  </div>
                </div>

                <div className="bg-gradient-to-br from-[#FF6B35] to-[#F15BB5] p-3 rounded-2xl shadow-lg mb-3 flex flex-col justify-between h-[100px]">
                  <div className="flex justify-between items-center text-[10px] text-white/90">
                    <span className="font-medium">JAMB 2026 Target</span>
                    <span className="bg-white/20 px-1.5 py-0.5 rounded text-[8px]">Active</span>
                  </div>
                  <div className="my-1">
                    <div className="text-xl font-bold text-white leading-none">280</div>
                    <span className="text-[8px] text-white/80">Goal Score</span>
                  </div>
                  <div className="w-full">
                    <div className="h-1.5 bg-black/20 rounded-full overflow-hidden">
                      <div className="h-full bg-white rounded-full w-[72%]" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="bg-[#111827] border border-[rgba(255,255,255,0.05)] p-2 rounded-xl text-center">
                    <span className="flex items-center justify-center gap-1 text-xs font-semibold text-white">
                      <Flame className="h-3 w-3 text-[#FF6B35]" />9
                    </span>
                    <span className="text-[8px] text-[rgba(255,255,255,0.4)] uppercase">Streak</span>
                  </div>
                  <div className="bg-[#111827] border border-[rgba(255,255,255,0.05)] p-2 rounded-xl text-center">
                    <span className="text-xs font-semibold text-white block">847</span>
                    <span className="text-[8px] text-[rgba(255,255,255,0.4)] uppercase">Qs</span>
                  </div>
                  <div className="bg-[#111827] border border-[rgba(255,255,255,0.05)] p-2 rounded-xl text-center">
                    <span className="text-xs font-semibold text-[#FF6B35] block">73%</span>
                    <span className="text-[8px] text-[rgba(255,255,255,0.4)] uppercase">Acc</span>
                  </div>
                </div>

                <div className="space-y-2 flex-1 flex flex-col justify-end">
                  <div className="text-[9px] text-[rgba(255,255,255,0.4)] font-medium uppercase tracking-wider mb-0.5">
                    Recommended
                  </div>
                  <div className="bg-[#111827] border border-[rgba(255,255,255,0.05)] p-2 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#FF6B35]" />
                      <div>
                        <div className="text-[10px] font-bold text-white">Chemistry</div>
                        <div className="text-[8px] text-[rgba(255,255,255,0.4)]">Functional Groups</div>
                      </div>
                    </div>
                    <span className="text-[6px] font-bold bg-[rgba(255,107,53,0.12)] text-[#FF6B35] border border-[rgba(255,107,53,0.3)] px-1 py-0.5 rounded">
                      WEAK
                    </span>
                  </div>
                  <div className="bg-[#111827] border border-[rgba(255,255,255,0.05)] p-2 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#00BBF9]" />
                      <div>
                        <div className="text-[10px] font-bold text-white">Mathematics</div>
                        <div className="text-[8px] text-[rgba(255,255,255,0.4)]">Circle Theorems</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-20 px-6 md:px-12 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <p className="font-sans text-[11px] font-bold uppercase tracking-[0.28em] text-[#FFB199] mb-3">
            Everything You Need
          </p>
          <h2 className="font-heading text-3xl md:text-4xl font-bold tracking-tight">
            Built to make you <span className="text-[#FF6B35]">pass</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              icon: BookOpen,
              title: 'Practice Questions',
              description: 'Thousands of past questions from JAMB, WAEC & NECO. Filter by subject, topic, and difficulty.',
              accent: '#00BBF9',
            },
            {
              icon: Sparkles,
              title: 'AI Tutor',
              description: 'Ask anything about your exam topics and get instant, clear explanations powered by AI.',
              accent: '#FF6B35',
            },
            {
              icon: Swords,
              title: 'Battle Friends',
              description: 'Challenge classmates to head-to-head quizzes. Share a code, compete, and see who knows more.',
              accent: '#9B5DE5',
            },
            {
              icon: Target,
              title: 'Weakness Assassin',
              description: 'Automatically identifies your weak topics and builds practice sessions to fix them.',
              accent: '#00FF87',
            },
            {
              icon: Trophy,
              title: 'Leaderboard',
              description: 'Climb the rankings and see how you stack up against other students across Nigeria.',
              accent: '#F15BB5',
            },
            {
              icon: Flame,
              title: 'Daily Streaks',
              description: 'Build a study habit with daily streaks. Stay consistent and watch your scores improve.',
              accent: '#FF6B35',
            },
          ].map(feature => (
            <div
              key={feature.title}
              className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#111827]/85 p-6 transition hover:border-[#FF6B35]/30"
            >
              <div
                className="flex h-12 w-12 items-center justify-center rounded-xl"
                style={{ backgroundColor: `${feature.accent}15`, color: feature.accent }}
              >
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-heading text-lg font-bold text-white">{feature.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[#8B9CB8]">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 md:px-12">
        <div className="mx-auto max-w-3xl rounded-[28px] border border-[#FF6B35]/20 bg-gradient-to-br from-[#1A1A2E] via-[#141827] to-[#111827] p-8 text-center shadow-[0_24px_80px_rgba(0,0,0,0.32)] md:p-12">
          <h2 className="font-heading text-3xl md:text-4xl font-bold tracking-tight">
            Ready to start <span className="text-[#FF6B35]">acing</span> your exams?
          </h2>
          <p className="mt-4 text-base text-[#8B9CB8] max-w-xl mx-auto">
            Join thousands of Nigerian students already using ExamReady to prepare for their exams. It&apos;s free.
          </p>
          <button
            type="button"
            onClick={onNavigateSignIn}
            className="mt-8 bg-[#FF6B35] hover:bg-[#ff7c4d] text-white font-bold py-4 px-8 rounded-xl transition shadow-md hover:shadow-[0_0_20px_rgba(255,107,53,0.4)] active:scale-95"
          >
            Get Started — It&apos;s Free
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[rgba(255,255,255,0.08)] py-8 px-6 text-center">
        <p className="text-xs text-[#6B7688]">
          © {new Date().getFullYear()} ExamReady. Built for Nigerian students.
        </p>
      </footer>
    </div>
  );
}
