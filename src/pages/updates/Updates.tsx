import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '../../supabase';
import {
  ChevronLeft,
  Newspaper,
  Calendar,
  Tag,
  Loader2,
  AlertCircle,
  Sparkles,
  Clock,
  ArrowRight,
} from 'lucide-react';

interface UpdatesProps {
  route: string;
  navigatePath: (path: string, state?: Record<string, unknown>, options?: { replace?: boolean }) => void;
  renderBottomNavigation: () => React.ReactNode;
}

interface UpdateItem {
  id: string;
  title: string;
  content: string;
  preview: string | null;
  category: string;
  status: string;
  created_at: string;
  published_at: string | null;
}

const categories = ['All', 'JAMB', 'WAEC', 'NECO', 'Scholarship', 'General'];

const categoryAccents: Record<string, string> = {
  JAMB: '#FF6B35',
  WAEC: '#2EC4B6',
  NECO: '#00FF87',
  Scholarship: '#9B5DE5',
  General: '#00BBF9',
};

const pageClass = 'min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top_left,rgba(255,107,53,0.10),transparent_34%),#0A0F1E] pb-36 text-white font-sans';
const mainClass = 'mx-auto max-w-3xl space-y-6 px-4 py-6 sm:px-6 md:px-10 md:py-8 animate-fade-up';
const backButtonClass = 'inline-flex min-w-0 items-center gap-2 rounded-full border border-[rgba(255,255,255,0.08)] bg-[#111827]/90 px-4 py-2.5 font-sans text-sm font-bold text-[#FF8A66] shadow-[0_10px_30px_rgba(0,0,0,0.22)] transition hover:border-[#FF6B35]/50 hover:text-[#FF6B35]';

const formatDate = (iso: string | null): string => {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
};

const formatFullDate = (iso: string | null): string => {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const getPreview = (update: UpdateItem): string => {
  if (update.preview && update.preview.trim()) return update.preview;
  const stripped = (update.content || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return stripped.length > 180 ? `${stripped.slice(0, 180)}...` : stripped;
};

// Styles for rendered Tiptap HTML content
const articleStyles = `
  .update-article { font-family: -apple-system, "SF Pro Text", Inter, "Segoe UI", sans-serif; color: #E6E9EF; line-height: 1.75; font-size: 16px; }
  .update-article p { margin: 0 0 1em 0; }
  .update-article h1, .update-article h2, .update-article h3 { font-weight: 700; color: #fff; margin: 1.5em 0 0.5em 0; line-height: 1.3; }
  .update-article h1 { font-size: 1.5em; }
  .update-article h2 { font-size: 1.25em; }
  .update-article h3 { font-size: 1.1em; }
  .update-article ul, .update-article ol { margin: 0 0 1em 1.5em; }
  .update-article li { margin-bottom: 0.5em; }
  .update-article a { color: #FF6B35; text-decoration: underline; text-underline-offset: 2px; }
  .update-article a:hover { color: #ff7c4d; }
  .update-article blockquote { border-left: 3px solid #FF6B35; padding-left: 1em; margin: 1em 0; color: #C8D2E4; font-style: italic; }
  .update-article code { background: rgba(255,255,255,0.08); padding: 0.15em 0.4em; border-radius: 4px; font-size: 0.9em; }
  .update-article pre { background: #111827; padding: 1em; border-radius: 8px; overflow-x: auto; margin: 1em 0; }
  .update-article hr { border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 1.5em 0; }
  .update-article strong { color: #fff; font-weight: 700; }
  .update-article em { font-style: italic; }
  .update-article img { max-width: 100%; height: auto; border-radius: 8px; margin: 1em 0; }
`;

export default function Updates({ route, navigatePath, renderBottomNavigation }: UpdatesProps) {
  const [updates, setUpdates] = useState<UpdateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedUpdate, setSelectedUpdate] = useState<UpdateItem | null>(null);

  // Check if we're on a detail route: /updates/<id>
  const detailId = useMemo(() => {
    if (route === '/updates' || !route.startsWith('/updates/')) return null;
    return route.replace('/updates/', '').split('?')[0];
  }, [route]);

  const loadUpdates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: qErr } = await supabase
        .from('updates')
        .select('id, title, content, preview, category, status, created_at, published_at')
        .eq('status', 'published')
        .order('published_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (qErr) throw qErr;
      setUpdates((data || []) as UpdateItem[]);
    } catch (err) {
      console.error('Failed to load updates:', err);
      setError('Unable to load updates. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUpdates();
  }, [loadUpdates]);

  // Load specific update for detail view
  useEffect(() => {
    if (!detailId) {
      setSelectedUpdate(null);
      return;
    }
    // First check if we already have it in the list
    const fromList = updates.find(u => u.id === detailId);
    if (fromList) {
      setSelectedUpdate(fromList);
      return;
    }
    // Otherwise fetch it directly (could be an unpublished draft viewed directly)
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('updates')
        .select('*')
        .eq('id', detailId)
        .maybeSingle();
      if (!cancelled) {
        if (error || !data) {
          setSelectedUpdate(null);
        } else {
          setSelectedUpdate(data as UpdateItem);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [detailId, updates]);

  const filteredUpdates = useMemo(() => {
    if (selectedCategory === 'All') return updates;
    return updates.filter(u => u.category === selectedCategory);
  }, [updates, selectedCategory]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: updates.length };
    for (const u of updates) {
      counts[u.category] = (counts[u.category] || 0) + 1;
    }
    return counts;
  }, [updates]);

  // Scroll to top on route changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [route]);

  // ── DETAIL VIEW ────────────────────────────────────────────────────────
  if (detailId) {
    if (loading) {
      return (
        <div className={pageClass}>
          <main className={mainClass}>
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-[#FF6B35]" />
            </div>
          </main>
        </div>
      );
    }

    if (!selectedUpdate) {
      return (
        <div className={pageClass}>
          <main className={mainClass}>
            <button type="button" onClick={() => navigatePath('/updates')} className={backButtonClass}>
              <ChevronLeft className="h-5 w-5" /> Back to Updates
            </button>
            <div className="rounded-[24px] border border-[rgba(255,255,255,0.08)] bg-[#0B1324]/85 p-8 text-center">
              <AlertCircle className="mx-auto h-10 w-10 text-[#8B9CB8]" />
              <h2 className="mt-4 font-heading text-xl font-bold text-white">Update not found</h2>
              <p className="mt-2 font-sans text-sm text-[#8B9CB8]">This update may have been removed or is no longer available.</p>
              <button
                type="button"
                onClick={() => navigatePath('/updates')}
                className="mt-5 rounded-full bg-[#FF6B35] px-5 py-2.5 font-sans text-sm font-bold text-white transition hover:bg-[#ff7c4d]"
              >
                Back to Updates
              </button>
            </div>
          </main>
          {renderBottomNavigation()}
        </div>
      );
    }

    const accent = categoryAccents[selectedUpdate.category] || '#FF6B35';

    return (
      <div className={pageClass}>
        <style>{articleStyles}</style>
        <main className={mainClass}>
          <button type="button" onClick={() => navigatePath('/updates')} className={backButtonClass}>
            <ChevronLeft className="h-5 w-5" /> Back to Updates
          </button>

          <article>
            {/* Category + Date */}
            <div className="flex flex-wrap items-center gap-3">
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-sans text-[11px] font-bold uppercase tracking-[0.2em]"
                style={{ backgroundColor: `${accent}1F`, color: accent }}
              >
                <Tag className="h-3 w-3" />
                {selectedUpdate.category}
              </span>
              <span className="flex items-center gap-1.5 font-sans text-xs text-[#8B9CB8]">
                <Calendar className="h-3.5 w-3.5" />
                {formatFullDate(selectedUpdate.published_at || selectedUpdate.created_at)}
              </span>
            </div>

            {/* Title */}
            <h1 className="mt-4 break-words font-heading text-3xl font-bold leading-tight text-white sm:text-4xl">
              {selectedUpdate.title}
            </h1>

            {/* Divider */}
            <div className="my-6 h-px bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.15)] to-transparent" />

            {/* Article content */}
            <div
              className="update-article"
              dangerouslySetInnerHTML={{ __html: selectedUpdate.content }}
            />

            {/* Footer */}
            <div className="mt-10 rounded-[22px] border border-[rgba(255,255,255,0.08)] bg-[#0B1324]/85 p-5">
              <p className="font-sans text-[11px] font-bold uppercase tracking-[0.28em] text-[#8B9CB8]">
                Stay updated
              </p>
              <p className="mt-2 font-sans text-sm leading-6 text-[#C8D2E4]">
                Check back for more news, tips, and updates about your exams.
              </p>
              <button
                type="button"
                onClick={() => navigatePath('/updates')}
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#FF6B35] px-5 py-2.5 font-sans text-sm font-bold text-white transition hover:bg-[#ff7c4d]"
              >
                See all updates <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </article>
        </main>
        {renderBottomNavigation()}
      </div>
    );
  }

  // ── LIST VIEW ──────────────────────────────────────────────────────────
  const featuredUpdate = filteredUpdates[0];
  const restUpdates = filteredUpdates.slice(1);

  return (
    <div className={pageClass}>
      <main className={mainClass}>
        {/* Header */}
        <section className="rounded-[28px] border border-[#FF6B35]/20 bg-gradient-to-br from-[#1A1A2E] via-[#141827] to-[#111827] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.32)] sm:p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-[#FF6B35]/15 text-[#FF6B35]">
              <Newspaper className="h-7 w-7" />
            </div>
            <div className="min-w-0">
              <p className="font-sans text-[11px] font-bold uppercase tracking-[0.28em] text-[#FFB199]">Latest News</p>
              <h1 className="mt-2 font-heading text-2xl font-bold leading-tight text-white sm:text-3xl">Updates</h1>
              <p className="mt-2 font-sans text-sm leading-6 text-[#8B9CB8]">
                Exam news, tips, scholarships, and everything you need to know.
              </p>
            </div>
          </div>
        </section>

        {/* Category filter */}
        <section className="flex flex-wrap gap-2">
          {categories.map(cat => {
            const count = categoryCounts[cat] || 0;
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 font-sans text-xs font-semibold transition ${
                  active
                    ? 'border-[#FF6B35] bg-[#FF6B35] text-white'
                    : 'border-[rgba(255,255,255,0.1)] bg-[#111827] text-[#C8D2E4] hover:border-[#FF6B35]/50'
                }`}
              >
                {cat}
                {count > 0 && (
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                      active ? 'bg-white/20 text-white' : 'bg-white/5 text-[#8B9CB8]'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </section>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="flex items-center gap-2 text-[#8B9CB8]">
              <Loader2 className="h-5 w-5 animate-spin text-[#FF6B35]" />
              <p className="font-sans text-sm">Loading updates...</p>
            </div>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
            <div className="min-w-0 flex-1">
              <p className="font-heading text-sm font-bold text-white">Unable to load</p>
              <p className="mt-1 font-sans text-xs text-[#C8D2E4]">{error}</p>
              <button
                type="button"
                onClick={() => void loadUpdates()}
                className="mt-3 rounded-full border border-white/10 px-4 py-1.5 font-sans text-xs font-semibold text-white transition hover:border-white/20"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && updates.length === 0 && (
          <div className="rounded-[24px] border border-[rgba(255,255,255,0.08)] bg-[#0B1324]/85 p-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#FF6B35]/15">
              <Sparkles className="h-8 w-8 text-[#FF6B35]" />
            </div>
            <h2 className="mt-4 font-heading text-xl font-bold text-white">No updates yet</h2>
            <p className="mt-2 font-sans text-sm leading-6 text-[#8B9CB8]">
              Check back soon — exam news, tips, and scholarship alerts are on the way.
            </p>
          </div>
        )}

        {/* Empty filtered state */}
        {!loading && !error && updates.length > 0 && filteredUpdates.length === 0 && (
          <div className="rounded-[24px] border border-[rgba(255,255,255,0.08)] bg-[#0B1324]/85 p-8 text-center">
            <p className="font-heading text-base font-bold text-white">No updates in {selectedCategory}</p>
            <p className="mt-2 font-sans text-sm text-[#8B9CB8]">
              Try a different category or check back later.
            </p>
            <button
              type="button"
              onClick={() => setSelectedCategory('All')}
              className="mt-4 rounded-full bg-[#FF6B35] px-5 py-2 font-sans text-sm font-bold text-white transition hover:bg-[#ff7c4d]"
            >
              See all updates
            </button>
          </div>
        )}

        {/* Featured (first/latest) update */}
        {!loading && !error && featuredUpdate && (
          <button
            type="button"
            onClick={() => navigatePath(`/updates/${featuredUpdate.id}`)}
            className="group block w-full overflow-hidden rounded-[24px] border border-[rgba(255,255,255,0.08)] bg-gradient-to-br from-[#1A1A2E] via-[#141827] to-[#111827] text-left shadow-[0_18px_55px_rgba(0,0,0,0.24)] transition hover:-translate-y-0.5 hover:border-[#FF6B35]/40"
          >
            <div className="p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-sans text-[10px] font-bold uppercase tracking-[0.2em]"
                  style={{
                    backgroundColor: `${categoryAccents[featuredUpdate.category] || '#FF6B35'}1F`,
                    color: categoryAccents[featuredUpdate.category] || '#FF6B35',
                  }}
                >
                  <Tag className="h-3 w-3" />
                  {featuredUpdate.category}
                </span>
                <span className="inline-flex items-center gap-1 font-sans text-[11px] text-[#8B9CB8]">
                  <Sparkles className="h-3 w-3 text-[#FF6B35]" />
                  Latest
                </span>
                <span className="ml-auto flex items-center gap-1 font-sans text-[11px] text-[#8B9CB8]">
                  <Clock className="h-3 w-3" />
                  {formatDate(featuredUpdate.published_at || featuredUpdate.created_at)}
                </span>
              </div>
              <h2 className="mt-3 break-words font-heading text-xl font-bold leading-tight text-white sm:text-2xl">
                {featuredUpdate.title}
              </h2>
              <p className="mt-2 line-clamp-3 font-sans text-sm leading-6 text-[#C8D2E4]">
                {getPreview(featuredUpdate)}
              </p>
              <div className="mt-4 flex items-center gap-1 font-sans text-xs font-bold text-[#FF6B35] transition group-hover:gap-2">
                Read full article <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </div>
          </button>
        )}

        {/* Rest of updates */}
        {!loading && !error && restUpdates.length > 0 && (
          <section className="space-y-3">
            {restUpdates.map(update => {
              const accent = categoryAccents[update.category] || '#FF6B35';
              return (
                <button
                  key={update.id}
                  type="button"
                  onClick={() => navigatePath(`/updates/${update.id}`)}
                  className="group flex w-full flex-col gap-3 rounded-2xl border border-[rgba(255,255,255,0.08)] border-l-4 bg-[#111827] p-4 text-left transition hover:border-white/15 sm:flex-row sm:items-start sm:p-5"
                  style={{ borderLeftColor: accent }}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-sans text-[10px] font-bold uppercase tracking-[0.2em]"
                        style={{ backgroundColor: `${accent}1F`, color: accent }}
                      >
                        {update.category}
                      </span>
                      <span className="flex items-center gap-1 font-sans text-[11px] text-[#8B9CB8]">
                        <Clock className="h-3 w-3" />
                        {formatDate(update.published_at || update.created_at)}
                      </span>
                    </div>
                    <h3 className="mt-2 break-words font-heading text-base font-bold leading-snug text-white sm:text-lg">
                      {update.title}
                    </h3>
                    <p className="mt-1.5 line-clamp-2 font-sans text-sm leading-6 text-[#8B9CB8]">
                      {getPreview(update)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 font-sans text-xs font-bold text-[#FF6B35] transition group-hover:gap-2 sm:shrink-0">
                    Read <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </button>
              );
            })}
          </section>
        )}
      </main>
      {renderBottomNavigation()}
    </div>
  );
}
