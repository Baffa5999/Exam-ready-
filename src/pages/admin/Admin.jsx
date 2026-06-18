import React, { useEffect, useMemo, useState } from 'react';
import { BarChart3, CheckCircle, Edit3, FileText, Loader2, Newspaper, RefreshCw, Save, Trash2, Users } from 'lucide-react';
import { supabase } from '../../supabase';

const ADMIN_EMAIL = 'usmanbaffa7002@gmail.com';
const categories = ['JAMB', 'WAEC', 'NECO', 'Scholarship', 'General'];
const statuses = ['draft', 'published'];

const emptyForm = {
  title: '',
  content: '',
  category: 'General',
  status: 'draft'
};

export default function Admin({ user, navigatePath }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({ users: 0, questions: 0, updates: 0 });
  const [statsLoading, setStatsLoading] = useState(false);
  const [updates, setUpdates] = useState([]);
  const [updatesLoading, setUpdatesLoading] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const isAdmin = user?.email?.toLowerCase() === ADMIN_EMAIL;

  useEffect(() => {
    if (user && !isAdmin) navigatePath('/dashboard', {}, { replace: true });
  }, [isAdmin, navigatePath, user]);

  const preview = useMemo(() => form.content.trim().slice(0, 160), [form.content]);

  const showMessage = (type, text) => setMessage({ type, text });

  const loadStats = async () => {
    setStatsLoading(true);
    const [profilesResult, questionsResult, updatesResult] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('questions').select('*', { count: 'exact', head: true }),
      supabase.from('updates').select('*', { count: 'exact', head: true })
    ]);

    setStatsLoading(false);

    const firstError = profilesResult.error || questionsResult.error || updatesResult.error;
    if (firstError) {
      showMessage('error', firstError.message || 'Unable to load admin stats.');
      return;
    }

    setStats({
      users: profilesResult.count || 0,
      questions: questionsResult.count || 0,
      updates: updatesResult.count || 0
    });
  };

  const loadUpdates = async () => {
    setUpdatesLoading(true);
    const { data, error } = await supabase
      .from('updates')
      .select('id, title, content, preview, category, status, created_at, published_at')
      .order('created_at', { ascending: false });

    setUpdatesLoading(false);

    if (error) {
      showMessage('error', error.message || 'Unable to load updates.');
      return;
    }

    setUpdates(data || []);
  };

  useEffect(() => {
    if (!isAdmin) return;
    void loadStats();
    void loadUpdates();
  }, [isAdmin]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleSubmit = async event => {
    event.preventDefault();
    setMessage(null);

    if (!form.title.trim() || !form.content.trim()) {
      showMessage('error', 'Title and content are required.');
      return;
    }

    setSubmitting(true);

    const payload = {
      title: form.title.trim(),
      content: form.content.trim(),
      preview,
      category: form.category,
      status: form.status,
      published_at: form.status === 'published' ? new Date().toISOString() : null
    };

    const result = editingId
      ? await supabase.from('updates').update(payload).eq('id', editingId)
      : await supabase.from('updates').insert(payload);

    setSubmitting(false);

    if (result.error) {
      showMessage('error', result.error.message || 'Unable to save update.');
      return;
    }

    showMessage('success', editingId ? 'Update edited successfully.' : 'Update published successfully.');
    resetForm();
    await Promise.all([loadStats(), loadUpdates()]);
    setActiveTab('manage');
  };

  const handleEdit = update => {
    setEditingId(update.id);
    setForm({
      title: update.title || '',
      content: update.content || update.preview || '',
      category: update.category || 'General',
      status: update.status || 'draft'
    });
    setActiveTab('write');
    setMessage(null);
  };

  const handleDelete = async id => {
    const { error } = await supabase.from('updates').delete().eq('id', id);
    if (error) {
      showMessage('error', error.message || 'Unable to delete update.');
      return;
    }
    showMessage('success', 'Update deleted.');
    await Promise.all([loadStats(), loadUpdates()]);
  };

  const handleToggleStatus = async update => {
    const nextStatus = update.status === 'published' ? 'draft' : 'published';
    const { error } = await supabase
      .from('updates')
      .update({
        status: nextStatus,
        published_at: nextStatus === 'published' ? new Date().toISOString() : null
      })
      .eq('id', update.id);

    if (error) {
      showMessage('error', error.message || 'Unable to update status.');
      return;
    }

    showMessage('success', `Update moved to ${nextStatus}.`);
    await loadUpdates();
  };

  if (!isAdmin) return null;

  const statCards = [
    { label: 'Total Users', value: stats.users, icon: Users, accent: '#FF6B35' },
    { label: 'Total Questions', value: stats.questions, icon: FileText, accent: '#00BBF9' },
    { label: 'Updates Published', value: stats.updates, icon: Newspaper, accent: '#2EC4B6' }
  ];

  return (
    <div className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top_left,rgba(255,107,53,0.12),transparent_34%),#0A0F1E] pb-28 text-white font-sans">
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 md:px-10">
        <header className="rounded-[28px] border border-[#FF6B35]/25 bg-gradient-to-br from-[#1A1A2E] via-[#141827] to-[#111827] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.32)] sm:p-6">
          <p className="font-sans text-[11px] font-bold uppercase tracking-[0.28em] text-[#FFB199]">ExamReady Admin</p>
          <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="font-heading text-3xl font-bold leading-tight text-white sm:text-4xl">Admin Panel</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#8B9CB8]">Manage updates and track key platform totals.</p>
            </div>
            <button
              type="button"
              onClick={() => navigatePath('/dashboard')}
              className="inline-flex items-center justify-center rounded-full border border-[#FF6B35]/30 bg-[#FF6B35]/10 px-4 py-2.5 text-sm font-bold text-[#FFB199] transition hover:bg-[#FF6B35] hover:text-white"
            >
              Back to Dashboard
            </button>
          </div>
        </header>

        <nav className="grid grid-cols-3 gap-2 rounded-2xl border border-white/10 bg-[#0B1324]/80 p-2">
          {[
            ['dashboard', 'Dashboard'],
            ['write', 'Write Update'],
            ['manage', 'Manage Updates']
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={`rounded-xl px-3 py-3 text-xs font-bold transition sm:text-sm ${activeTab === key ? 'bg-[#FF6B35] text-white shadow-[0_0_22px_rgba(255,107,53,0.25)]' : 'text-[#8B9CB8] hover:bg-white/5 hover:text-white'}`}
            >
              {label}
            </button>
          ))}
        </nav>

        {message && (
          <div className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold ${message.type === 'success' ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200' : 'border-red-400/30 bg-red-500/10 text-red-200'}`}>
            <CheckCircle className="h-4 w-4" />
            {message.text}
          </div>
        )}

        {activeTab === 'dashboard' && (
          <section className="grid gap-4 sm:grid-cols-3">
            {statCards.map(card => {
              const CardIcon = card.icon;
              return (
                <article key={card.label} className="rounded-[24px] border border-white/10 bg-[#0B1324]/85 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ backgroundColor: `${card.accent}22`, color: card.accent }}>
                      <CardIcon className="h-6 w-6" />
                    </div>
                    {statsLoading && <Loader2 className="h-5 w-5 animate-spin text-[#8B9CB8]" />}
                  </div>
                  <p className="mt-5 font-heading text-4xl font-bold" style={{ color: card.accent }}>{card.value}</p>
                  <p className="mt-2 text-sm text-[#8B9CB8]">{card.label}</p>
                </article>
              );
            })}
          </section>
        )}

        {activeTab === 'write' && (
          <form onSubmit={handleSubmit} className="space-y-4 rounded-[24px] border border-white/10 bg-[#0B1324]/85 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-heading text-xl font-bold text-white">{editingId ? 'Edit Update' : 'Write Update'}</h2>
              {editingId && <button type="button" onClick={resetForm} className="text-sm font-bold text-[#FFB199] hover:text-[#FF6B35]">Cancel edit</button>}
            </div>
            <label className="block">
              <span className="text-sm font-semibold text-[#C4CAD8]">Title</span>
              <input value={form.title} onChange={event => setForm(prev => ({ ...prev, title: event.target.value }))} className="mt-2 w-full rounded-2xl border border-white/10 bg-[#111827] px-4 py-3 text-white outline-none transition focus:border-[#FF6B35]/60" />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-[#C4CAD8]">Content</span>
              <textarea value={form.content} onChange={event => setForm(prev => ({ ...prev, content: event.target.value }))} rows={8} className="mt-2 w-full resize-y rounded-2xl border border-white/10 bg-[#111827] px-4 py-3 text-white outline-none transition focus:border-[#FF6B35]/60" />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-semibold text-[#C4CAD8]">Category</span>
                <select value={form.category} onChange={event => setForm(prev => ({ ...prev, category: event.target.value }))} className="mt-2 w-full rounded-2xl border border-white/10 bg-[#111827] px-4 py-3 text-white outline-none transition focus:border-[#FF6B35]/60">
                  {categories.map(category => <option key={category} value={category}>{category}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-[#C4CAD8]">Status</span>
                <select value={form.status} onChange={event => setForm(prev => ({ ...prev, status: event.target.value }))} className="mt-2 w-full rounded-2xl border border-white/10 bg-[#111827] px-4 py-3 text-white outline-none transition focus:border-[#FF6B35]/60">
                  {statuses.map(status => <option key={status} value={status}>{status}</option>)}
                </select>
              </label>
            </div>
            <button type="submit" disabled={submitting} className="inline-flex items-center justify-center gap-2 rounded-full bg-[#FF6B35] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#ff7c4d] disabled:cursor-not-allowed disabled:opacity-60">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {editingId ? 'Save Changes' : 'Publish Update'}
            </button>
          </form>
        )}

        {activeTab === 'manage' && (
          <section className="space-y-4 rounded-[24px] border border-white/10 bg-[#0B1324]/85 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-heading text-xl font-bold text-white">Manage Updates</h2>
              <button type="button" onClick={loadUpdates} className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-sm font-bold text-[#FFB199] hover:border-[#FF6B35]/50">
                <RefreshCw className="h-4 w-4" /> Refresh
              </button>
            </div>
            {updatesLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-[#FF6B35]" /></div>
            ) : updates.length === 0 ? (
              <p className="rounded-2xl border border-white/10 bg-[#111827]/80 p-4 text-sm text-[#8B9CB8]">No updates found.</p>
            ) : (
              <div className="space-y-3">
                {updates.map(update => (
                  <article key={update.id} className="rounded-2xl border border-white/10 bg-[#111827]/80 p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0">
                        <h3 className="truncate font-heading text-base font-bold text-white">{update.title || 'Untitled update'}</h3>
                        <p className="mt-1 text-xs text-[#8B9CB8]">{update.category || 'General'} · {update.status || 'draft'} · {update.created_at ? new Date(update.created_at).toLocaleString() : 'No date'}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => handleEdit(update)} className="inline-flex items-center gap-1 rounded-full border border-white/10 px-3 py-2 text-xs font-bold text-[#C4CAD8] hover:text-white"><Edit3 className="h-3.5 w-3.5" /> Edit</button>
                        <button type="button" onClick={() => handleToggleStatus(update)} className="rounded-full border border-[#2EC4B6]/30 px-3 py-2 text-xs font-bold text-[#2EC4B6] hover:bg-[#2EC4B6]/10">Toggle Status</button>
                        <button type="button" onClick={() => handleDelete(update.id)} className="inline-flex items-center gap-1 rounded-full border border-red-400/30 px-3 py-2 text-xs font-bold text-red-200 hover:bg-red-500/10"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
