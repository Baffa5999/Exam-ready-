import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../supabase';
import {
  ChevronLeft,
  Play,
  Clock,
  WifiOff,
  Sparkles,
  Film,
  Loader2,
  AlertCircle,
} from 'lucide-react';

interface VideosProps {
  navigatePath: (path: string, state?: Record<string, unknown>, options?: { replace?: boolean }) => void;
  renderBottomNavigation: () => React.ReactNode;
}

interface VideoLesson {
  id: string;
  subject: string;
  topic: string;
  subtopic: string;
  title: string;
  youtube_video_id: string;
  duration_minutes: number;
  thumbnail_url: string | null;
  created_at: string;
}

interface SubtopicGroup {
  subtopic: string;
  videos: VideoLesson[];
  totalDuration: number;
}

interface TopicGroup {
  topic: string;
  subtopics: SubtopicGroup[];
  videoCount: number;
}

interface SubjectGroup {
  subject: string;
  accent: string;
  topics: TopicGroup[];
  videoCount: number;
}

const subjectAccents: Record<string, string> = {
  Mathematics: '#00BBF9',
  'English Language': '#2EC4B6',
  Biology: '#00FF87',
  Chemistry: '#9B5DE5',
  Physics: '#FF6B35',
  Literature: '#F15BB5',
};

const pageClass = 'min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top_left,rgba(255,107,53,0.10),transparent_34%),#0A0F1E] pb-36 text-white font-sans';
const mainClass = 'mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6 md:px-10 md:py-8 animate-fade-up';
const backButtonClass = 'inline-flex min-w-0 items-center gap-2 rounded-full border border-[rgba(255,255,255,0.08)] bg-[#111827]/90 px-4 py-2.5 font-sans text-sm font-bold text-[#FF8A66] shadow-[0_10px_30px_rgba(0,0,0,0.22)] transition hover:border-[#FF6B35]/50 hover:text-[#FF6B35]';

const getThumbnailUrl = (video: VideoLesson): string =>
  video.thumbnail_url || `https://img.youtube.com/vi/${video.youtube_video_id}/hqdefault.jpg`;

const formatDuration = (minutes: number): string => {
  if (minutes < 1) return '< 1 min';
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

function ProfessionalHeader({
  title,
  description,
  icon: Icon,
  accent = '#FF6B35',
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  accent?: string;
}) {
  return (
    <section className="rounded-[28px] border border-[#FF6B35]/20 bg-gradient-to-br from-[#1A1A2E] via-[#141827] to-[#111827] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.32)] sm:p-6">
      <div className="flex items-center gap-4">
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
          style={{ backgroundColor: `${accent}1F`, color: accent }}
        >
          <Icon className="h-7 w-7" />
        </div>
        <div className="min-w-0">
          <p className="font-sans text-[11px] font-bold uppercase tracking-[0.28em] text-[#FFB199]">ExamReady</p>
          <h1 className="mt-2 break-words font-heading text-2xl font-bold leading-tight text-white sm:text-3xl">{title}</h1>
          <p className="mt-2 max-w-2xl font-sans text-sm font-normal leading-6 text-[#8B9CB8]">{description}</p>
        </div>
      </div>
    </section>
  );
}

type View = 'picker' | 'player';

export default function Videos({ navigatePath, renderBottomNavigation }: VideosProps) {
  const [view, setView] = useState<View>('picker');
  const [subjects, setSubjects] = useState<SubjectGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState<boolean>(
    typeof navigator !== 'undefined' ? !navigator.onLine : false
  );
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<VideoLesson | null>(null);

  const loadVideos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: qErr } = await supabase
        .from('video_lessons')
        .select('*')
        .order('created_at', { ascending: false });

      if (qErr) throw qErr;

      const videos = (data || []) as VideoLesson[];

      if (videos.length === 0) {
        setSubjects([]);
        return;
      }

      // Group: subject -> topic -> subtopic
      const subjectMap = new Map<string, Map<string, Map<string, VideoLesson[]>>>();
      for (const v of videos) {
        if (!subjectMap.has(v.subject)) subjectMap.set(v.subject, new Map());
        const topicMap = subjectMap.get(v.subject)!;
        if (!topicMap.has(v.topic)) topicMap.set(v.topic, new Map());
        const subMap = topicMap.get(v.topic)!;
        if (!subMap.has(v.subtopic)) subMap.set(v.subtopic, []);
        subMap.get(v.subtopic)!.push(v);
      }

      const grouped: SubjectGroup[] = Array.from(subjectMap.entries()).map(([subject, topicMap]) => {
        const topics: TopicGroup[] = Array.from(topicMap.entries()).map(([topic, subMap]) => {
          const subtopics: SubtopicGroup[] = Array.from(subMap.entries()).map(([subtopic, vids]) => ({
            subtopic,
            videos: vids,
            totalDuration: vids.reduce((s, v) => s + (v.duration_minutes || 0), 0),
          }));
          return {
            topic,
            subtopics,
            videoCount: vids_count(subtopics),
          };
        });
        return {
          subject,
          accent: subjectAccents[subject] || '#FF6B35',
          topics,
          videoCount: topics.reduce((s, t) => s + t.videoCount, 0),
        };
      });

      // Sort subjects alphabetically, topics alphabetically
      grouped.sort((a, b) => a.subject.localeCompare(b.subject));
      grouped.forEach(g => g.topics.sort((a, b) => a.topic.localeCompare(b.topic)));

      setSubjects(grouped);
    } catch (err) {
      console.error('Failed to load videos:', err);
      setError('Unable to load video lessons. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadVideos();
  }, [loadVideos]);

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Re-fetch when coming back online
  useEffect(() => {
    if (!isOffline && subjects.length === 0 && !loading) {
      void loadVideos();
    }
  }, [isOffline, subjects.length, loading, loadVideos]);

  const toggleSubject = (subject: string) => {
    setExpandedSubject(prev => (prev === subject ? null : subject));
    setExpandedTopic(null);
  };

  const toggleTopic = (subject: string, topic: string) => {
    setExpandedTopic(prev => (prev === `${subject}::${topic}` ? null : `${subject}::${topic}`));
  };

  const openVideo = (video: VideoLesson) => {
    if (isOffline) return;
    setSelectedVideo(video);
    setView('player');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const backToPicker = () => {
    setView('picker');
    setSelectedVideo(null);
  };

  const totalVideos = subjects.reduce((s, g) => s + g.videoCount, 0);

  // ── PLAYER VIEW ────────────────────────────────────────────────────────
  if (view === 'player' && selectedVideo) {
    const accent = subjectAccents[selectedVideo.subject] || '#FF6B35';
    return (
      <div className={pageClass}>
        <main className={mainClass}>
          <button type="button" onClick={backToPicker} className={backButtonClass}>
            <ChevronLeft className="h-5 w-5" /> Back to Lessons
          </button>

          <section className="rounded-[28px] border border-[#FF6B35]/20 bg-gradient-to-br from-[#1A1A2E] via-[#141827] to-[#111827] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.32)] sm:p-6">
            <div className="flex items-start gap-4">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10"
                style={{ backgroundColor: `${accent}1F`, color: accent }}
              >
                <Film className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p
                  className="font-sans text-[11px] font-bold uppercase tracking-[0.28em]"
                  style={{ color: accent }}
                >
                  {selectedVideo.subject} · {selectedVideo.topic}
                </p>
                <h1 className="mt-2 break-words font-heading text-xl font-bold leading-tight text-white sm:text-2xl">
                  {selectedVideo.title}
                </h1>
                <p className="mt-1 font-sans text-xs text-[#8B9CB8]">
                  {selectedVideo.subtopic} • {formatDuration(selectedVideo.duration_minutes)}
                </p>
              </div>
            </div>
          </section>

          {/* YouTube Embed */}
          <section className="overflow-hidden rounded-[24px] border border-[rgba(255,255,255,0.08)] bg-black shadow-[0_24px_80px_rgba(0,0,0,0.5)]">
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              <iframe
                key={selectedVideo.youtube_video_id}
                src={`https://www.youtube.com/embed/${selectedVideo.youtube_video_id}?rel=0&modestbranding=1`}
                title={selectedVideo.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="absolute inset-0 h-full w-full"
              />
            </div>
          </section>

          <button
            type="button"
            onClick={backToPicker}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#111827] px-6 py-4 font-sans text-sm font-bold text-white transition hover:border-white/15"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Lessons
          </button>
        </main>
        {renderBottomNavigation()}
      </div>
    );
  }

  // ── PICKER VIEW ────────────────────────────────────────────────────────
  return (
    <div className={pageClass}>
      <main className={mainClass}>
        <ProfessionalHeader
          title="Video Lessons"
          description="Watch expert-taught videos organized by subject and topic. Streamed directly from YouTube."
          icon={Film}
          accent="#2EC4B6"
        />

        {/* Offline banner */}
        {isOffline && (
          <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
            <WifiOff className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
            <div className="min-w-0 flex-1">
              <p className="font-heading text-sm font-bold text-white">You&apos;re offline</p>
              <p className="mt-1 font-sans text-xs leading-5 text-[#C8D2E4]">
                Video lessons require an internet connection to stream from YouTube.
              </p>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="flex items-center gap-2 text-[#8B9CB8]">
              <Loader2 className="h-5 w-5 animate-spin text-[#FF6B35]" />
              <p className="font-sans text-sm">Loading video lessons...</p>
            </div>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
            <div className="min-w-0 flex-1">
              <p className="font-heading text-sm font-bold text-white">Something went wrong</p>
              <p className="mt-1 font-sans text-xs leading-5 text-[#C8D2E4]">{error}</p>
              <button
                type="button"
                onClick={() => void loadVideos()}
                className="mt-3 rounded-full border border-white/10 px-4 py-1.5 font-sans text-xs font-semibold text-white transition hover:border-white/20"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && subjects.length === 0 && (
          <div className="rounded-[24px] border border-[rgba(255,255,255,0.08)] bg-[#0B1324]/85 p-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#FF6B35]/15">
              <Sparkles className="h-8 w-8 text-[#FF6B35]" />
            </div>
            <h2 className="mt-4 font-heading text-xl font-bold text-white">Coming soon</h2>
            <p className="mt-2 font-sans text-sm leading-6 text-[#8B9CB8]">
              We&apos;re adding video lessons for every subject. Check back soon — new lessons are uploaded regularly.
            </p>
          </div>
        )}

        {/* Subject / Topic / Subtopic list */}
        {!loading && !error && subjects.length > 0 && (
          <>
            <p className="font-sans text-[11px] font-bold uppercase tracking-[0.28em] text-[#8B9CB8]">
              {totalVideos} video{totalVideos === 1 ? '' : 's'} available
            </p>

            <section className="space-y-3">
              {subjects.map(group => {
                const expanded = expandedSubject === group.subject;
                return (
                  <div
                    key={group.subject}
                    className="overflow-hidden rounded-[22px] border border-[rgba(255,255,255,0.08)] bg-[#0B1324]/85"
                    style={{ borderLeftColor: group.accent, borderLeftWidth: 4 }}
                  >
                    <button
                      type="button"
                      onClick={() => toggleSubject(group.subject)}
                      className="flex w-full items-center justify-between gap-4 p-4 text-left"
                    >
                      <div className="min-w-0">
                        <h2 className="break-words font-heading text-base font-semibold leading-5 text-white sm:text-lg">
                          {group.subject}
                        </h2>
                        <p className="mt-1 font-sans text-[13px] font-normal text-[#8B9CB8]">
                          {group.videoCount} video{group.videoCount === 1 ? '' : 's'}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-3 py-1 font-sans text-[11px] font-semibold transition ${
                          expanded ? 'bg-white/10 text-white' : 'bg-white/5 text-[#8B9CB8]'
                        }`}
                      >
                        {expanded ? 'Collapse' : 'View'}
                      </span>
                    </button>

                    {expanded && (
                      <div className="space-y-2 px-4 pb-4">
                        {group.topics.map(topicGroup => {
                          const topicKey = `${group.subject}::${topicGroup.topic}`;
                          const topicExpanded = expandedTopic === topicKey;
                          return (
                            <div key={topicGroup.topic} className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[#0A0F1E]/60">
                              <button
                                type="button"
                                onClick={() => toggleTopic(group.subject, topicGroup.topic)}
                                className="flex w-full items-center justify-between gap-2 p-3 text-left"
                              >
                                <span className="break-words font-sans text-sm font-semibold text-white">
                                  {topicGroup.topic}
                                </span>
                                <span className="shrink-0 rounded-full bg-white/5 px-2 py-0.5 font-sans text-[10px] font-normal text-[#8B9CB8]">
                                  {topicGroup.videoCount} video{topicGroup.videoCount === 1 ? '' : 's'}
                                </span>
                              </button>

                              {topicExpanded && (
                                <div className="space-y-2 px-3 pb-3">
                                  {topicGroup.subtopics.map(sub => (
                                    <div key={sub.subtopic}>
                                      <p className="mb-2 font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-[#6B7688]">
                                        {sub.subtopic}
                                      </p>
                                      <div className="space-y-2">
                                        {sub.videos.map(video => (
                                          <button
                                            key={video.id}
                                            type="button"
                                            onClick={() => openVideo(video)}
                                            disabled={isOffline}
                                            className={`flex w-full items-center gap-3 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#111827] p-2 text-left transition hover:border-[#FF6B35]/40 ${
                                              isOffline ? 'cursor-not-allowed opacity-50' : ''
                                            }`}
                                          >
                                            <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-black sm:h-20 sm:w-32">
                                              <img
                                                src={getThumbnailUrl(video)}
                                                alt={video.title}
                                                loading="lazy"
                                                className="h-full w-full object-cover"
                                                onError={e => {
                                                  (e.target as HTMLImageElement).style.display = 'none';
                                                }}
                                              />
                                              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                                <div
                                                  className="flex h-8 w-8 items-center justify-center rounded-full"
                                                  style={{ backgroundColor: `${group.accent}E6` }}
                                                >
                                                  <Play className="h-4 w-4 text-white" fill="white" />
                                                </div>
                                              </div>
                                            </div>
                                            <div className="min-w-0 flex-1">
                                              <p className="break-words font-heading text-xs font-semibold leading-snug text-white sm:text-sm">
                                                {video.title}
                                              </p>
                                              {video.duration_minutes > 0 && (
                                                <p className="mt-1 flex items-center gap-1 font-sans text-[11px] text-[#8B9CB8]">
                                                  <Clock className="h-3 w-3" />
                                                  {formatDuration(video.duration_minutes)}
                                                </p>
                                              )}
                                            </div>
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </section>
          </>
        )}
      </main>
      {renderBottomNavigation()}
    </div>
  );
}

// Helper: sum video counts across subtopics
function vids_count(subtopics: SubtopicGroup[]): number {
  return subtopics.reduce((s, sub) => s + sub.videos.length, 0);
}
