import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Bold, Code, Italic, Link2, List, ListOrdered, Quote, BarChart3, CheckCircle, Edit3, FileText, Heading2, Layers, Loader2, Newspaper, Plus, RefreshCw, RemoveFormatting, Save, Trash2, Users, X } from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { supabase } from '../../supabase';

// ─── Rich Text Editor ─────────────────────────────────────────────────────────
function ToolbarButton({ onClick, active, title, children }) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={e => { e.preventDefault(); onClick(); }}
      className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm transition ${
        active
          ? 'bg-[#FF6B35] text-white'
          : 'text-[#C4CAD8] hover:bg-white/10 hover:text-white'
      }`}
    >
      {children}
    </button>
  );
}

function RichEditor({ value, onChange }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false, HTMLAttributes: { class: 'text-[#2EC4B6] underline' } }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: 'min-h-[280px] w-full outline-none text-white font-sans text-sm leading-7 prose prose-invert max-w-none',
      },
    },
  });

  const addLink = useCallback(() => {
    if (!editor) return;
    const url = window.prompt('Enter URL (e.g. https://example.com)');
    if (!url) return;
    if (editor.state.selection.empty) {
      editor.chain().focus().insertContent(`<a href="${url}">${url}</a>`).run();
    } else {
      editor.chain().focus().setLink({ href: url }).run();
    }
  }, [editor]);

  if (!editor) return null;

  const toolbarGroups = [
    [
      { icon: <Bold className="h-4 w-4" />, title: 'Bold', action: () => editor.chain().focus().toggleBold().run(), active: editor.isActive('bold') },
      { icon: <Italic className="h-4 w-4" />, title: 'Italic', action: () => editor.chain().focus().toggleItalic().run(), active: editor.isActive('italic') },
      { icon: <Code className="h-4 w-4" />, title: 'Inline code', action: () => editor.chain().focus().toggleCode().run(), active: editor.isActive('code') },
    ],
    [
      { icon: <Heading2 className="h-4 w-4" />, title: 'Heading', action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), active: editor.isActive('heading', { level: 2 }) },
      { icon: <List className="h-4 w-4" />, title: 'Bullet list', action: () => editor.chain().focus().toggleBulletList().run(), active: editor.isActive('bulletList') },
      { icon: <ListOrdered className="h-4 w-4" />, title: 'Numbered list', action: () => editor.chain().focus().toggleOrderedList().run(), active: editor.isActive('orderedList') },
      { icon: <Quote className="h-4 w-4" />, title: 'Blockquote', action: () => editor.chain().focus().toggleBlockquote().run(), active: editor.isActive('blockquote') },
    ],
    [
      { icon: <Link2 className="h-4 w-4" />, title: 'Add link', action: addLink, active: editor.isActive('link') },
      { icon: <RemoveFormatting className="h-4 w-4" />, title: 'Clear formatting', action: () => editor.chain().focus().unsetAllMarks().clearNodes().run(), active: false },
    ],
  ];

  return (
    <div className="mt-2 overflow-hidden rounded-2xl border border-white/10 bg-[#111827] focus-within:border-[#FF6B35]/60">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-white/10 bg-[#0B1324]/70 px-2 py-1.5">
        {toolbarGroups.map((group, gi) => (
          <React.Fragment key={gi}>
            {gi > 0 && <div className="mx-1.5 h-5 w-px bg-white/10" />}
            {group.map(btn => (
              <ToolbarButton key={btn.title} onClick={btn.action} active={btn.active} title={btn.title}>
                {btn.icon}
              </ToolbarButton>
            ))}
          </React.Fragment>
        ))}
      </div>
      {/* Editor area */}
      <div className="px-4 py-3">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

const ADMIN_EMAIL = 'usmanbaffa7002@gmail.com';
const categories = ['JAMB', 'WAEC', 'NECO', 'Scholarship', 'General'];
const statuses = ['draft', 'published'];

const SUBJECTS = ['Mathematics', 'English Language', 'Biology', 'Chemistry', 'Physics', 'Literature'];

const SUBTOPICS_BY_SUBJECT = {
  Mathematics: ['Number and Numeration', 'Algebra', 'Geometry and Trigonometry', 'Statistics and Probability', 'Calculus'],
  Biology: ['Cell Biology', 'Genetics and Evolution', 'Ecology', 'Human Biology and Health', 'Plant Biology'],
  Chemistry: ['Physical Chemistry', 'Organic Chemistry', 'Inorganic Chemistry', 'Electrochemistry', 'Environmental Chemistry'],
  Physics: ['Mechanics', 'Waves and Optics', 'Electricity and Magnetism', 'Modern Physics', 'Thermodynamics'],
  'English Language': ['Comprehension', 'Lexis and Structure', 'Oral English', 'Essay and Letter Writing', 'Figures of Speech'],
  Literature: ['Poetry', 'Prose', 'Drama', 'Literary Devices', 'African Literature'],
};

const emptyUpdateForm = { title: '', content: '', category: 'General', status: 'draft' };
const emptyCardForm = { subject: 'Mathematics', topic: '', subtopic: 'Number and Numeration', front: '', back: '' };

export default function Admin({ user, navigatePath }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({ users: 0, questions: 0, updates: 0, flashcards: 0 });
  const [statsLoading, setStatsLoading] = useState(false);

  // Updates state
  const [updates, setUpdates] = useState([]);
  const [updatesLoading, setUpdatesLoading] = useState(false);
  const [updateForm, setUpdateForm] = useState(emptyUpdateForm);
  const [editingUpdateId, setEditingUpdateId] = useState(null);
  const [updateSubmitting, setUpdateSubmitting] = useState(false);

  // Flashcards state
  const [flashcards, setFlashcards] = useState([]);
  const [flashcardsLoading, setFlashcardsLoading] = useState(false);
  const [cardForm, setCardForm] = useState(emptyCardForm);
  const [editingCardId, setEditingCardId] = useState(null);
  const [cardSubmitting, setCardSubmitting] = useState(false);
  const [cardFormOpen, setCardFormOpen] = useState(false);
  const [filterSubject, setFilterSubject] = useState('');

  const [message, setMessage] = useState(null);

  const isAdmin = user?.email?.toLowerCase() === ADMIN_EMAIL;

  useEffect(() => {
    if (user && !isAdmin) navigatePath('/dashboard', {}, { replace: true });
  }, [isAdmin, navigatePath, user]);

  const updatePreview = useMemo(() => {
    const stripped = updateForm.content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    return stripped.slice(0, 160);
  }, [updateForm.content]);
  const availableSubtopics = SUBTOPICS_BY_SUBJECT[cardForm.subject] || [];

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  // ─── Stats ───────────────────────────────────────────────────────────────
  const loadStats = async () => {
    setStatsLoading(true);
    const [profilesRes, questionsRes, updatesRes, cardsRes] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('questions').select('*', { count: 'exact', head: true }),
      supabase.from('updates').select('*', { count: 'exact', head: true }),
      supabase.from('flashcards').select('*', { count: 'exact', head: true }),
    ]);
    setStatsLoading(false);
    const firstError = profilesRes.error || questionsRes.error || updatesRes.error || cardsRes.error;
    if (firstError) { showMessage('error', firstError.message || 'Unable to load stats.'); return; }
    setStats({
      users: profilesRes.count || 0,
      questions: questionsRes.count || 0,
      updates: updatesRes.count || 0,
      flashcards: cardsRes.count || 0,
    });
  };

  // ─── Updates ─────────────────────────────────────────────────────────────
  const loadUpdates = async () => {
    setUpdatesLoading(true);
    const { data, error } = await supabase
      .from('updates')
      .select('id, title, content, preview, category, status, created_at, published_at')
      .order('created_at', { ascending: false });
    setUpdatesLoading(false);
    if (error) { showMessage('error', error.message || 'Unable to load updates.'); return; }
    setUpdates(data || []);
  };

  useEffect(() => {
    if (!isAdmin) return;
    void loadStats();
    void loadUpdates();
    void loadFlashcards();
  }, [isAdmin]);

  const resetUpdateForm = () => { setUpdateForm(emptyUpdateForm); setEditingUpdateId(null); };

  const handleUpdateSubmit = async event => {
    event.preventDefault();
    setMessage(null);
    if (!updateForm.title.trim() || !updateForm.content.trim()) { showMessage('error', 'Title and content are required.'); return; }
    setUpdateSubmitting(true);
    const payload = {
      title: updateForm.title.trim(),
      content: updateForm.content.trim(),
      preview: updatePreview,
      category: updateForm.category,
      status: updateForm.status,
      published_at: updateForm.status === 'published' ? new Date().toISOString() : null,
    };
    const result = editingUpdateId
      ? await supabase.from('updates').update(payload).eq('id', editingUpdateId)
      : await supabase.from('updates').insert(payload);
    setUpdateSubmitting(false);
    if (result.error) { showMessage('error', result.error.message || 'Unable to save update.'); return; }
    showMessage('success', editingUpdateId ? 'Update edited successfully.' : 'Update published successfully.');
    resetUpdateForm();
    await Promise.all([loadStats(), loadUpdates()]);
    setActiveTab('manage-updates');
  };

  const handleEditUpdate = update => {
    setEditingUpdateId(update.id);
    setUpdateForm({ title: update.title || '', content: update.content || update.preview || '', category: update.category || 'General', status: update.status || 'draft' });
    setActiveTab('write');
    setMessage(null);
  };

  const handleDeleteUpdate = async id => {
    const { error } = await supabase.from('updates').delete().eq('id', id);
    if (error) { showMessage('error', error.message || 'Unable to delete update.'); return; }
    showMessage('success', 'Update deleted.');
    await Promise.all([loadStats(), loadUpdates()]);
  };

  const handleToggleStatus = async update => {
    const nextStatus = update.status === 'published' ? 'draft' : 'published';
    const { error } = await supabase.from('updates').update({ status: nextStatus, published_at: nextStatus === 'published' ? new Date().toISOString() : null }).eq('id', update.id);
    if (error) { showMessage('error', error.message || 'Unable to update status.'); return; }
    showMessage('success', `Update moved to ${nextStatus}.`);
    await loadUpdates();
  };

  // ─── Flashcards ───────────────────────────────────────────────────────────
  const loadFlashcards = async () => {
    setFlashcardsLoading(true);
    const { data, error } = await supabase
      .from('flashcards')
      .select('id, subject, topic, subtopic, front, back')
      .order('subject')
      .order('subtopic');
    setFlashcardsLoading(false);
    if (error) { showMessage('error', error.message || 'Unable to load flashcards.'); return; }
    setFlashcards(data || []);
  };

  const openNewCardForm = () => {
    setCardForm(emptyCardForm);
    setEditingCardId(null);
    setCardFormOpen(true);
  };

  const openEditCardForm = card => {
    setCardForm({ subject: card.subject, topic: card.topic || '', subtopic: card.subtopic, front: card.front, back: card.back });
    setEditingCardId(card.id);
    setCardFormOpen(true);
    setMessage(null);
  };

  const closeCardForm = () => { setCardFormOpen(false); setEditingCardId(null); setCardForm(emptyCardForm); };

  const handleCardSubjectChange = subject => {
    const firstSubtopic = (SUBTOPICS_BY_SUBJECT[subject] || [])[0] || '';
    setCardForm(prev => ({ ...prev, subject, subtopic: firstSubtopic }));
  };

  const handleCardSubmit = async event => {
    event.preventDefault();
    setMessage(null);
    if (!cardForm.front.trim() || !cardForm.back.trim()) { showMessage('error', 'Front and back are required.'); return; }
    if (!cardForm.subtopic) { showMessage('error', 'Please choose a subtopic.'); return; }
    setCardSubmitting(true);
    const payload = {
      subject: cardForm.subject,
      topic: cardForm.topic.trim() || cardForm.subtopic,
      subtopic: cardForm.subtopic,
      front: cardForm.front.trim(),
      back: cardForm.back.trim(),
    };
    const result = editingCardId
      ? await supabase.from('flashcards').update(payload).eq('id', editingCardId)
      : await supabase.from('flashcards').insert(payload);
    setCardSubmitting(false);
    if (result.error) { showMessage('error', result.error.message || 'Unable to save card.'); return; }
    showMessage('success', editingCardId ? 'Card updated.' : 'Card created.');
    closeCardForm();
    await Promise.all([loadStats(), loadFlashcards()]);
  };

  const handleDeleteCard = async id => {
    const { error } = await supabase.from('flashcards').delete().eq('id', id);
    if (error) { showMessage('error', error.message || 'Unable to delete card.'); return; }
    showMessage('success', 'Card deleted.');
    await Promise.all([loadStats(), loadFlashcards()]);
  };

  const filteredCards = filterSubject ? flashcards.filter(c => c.subject === filterSubject) : flashcards;

  // ─── Guard ────────────────────────────────────────────────────────────────
  if (!isAdmin) return null;

  const statCards = [
    { label: 'Total Users', value: stats.users, icon: Users, accent: '#FF6B35' },
    { label: 'Total Questions', value: stats.questions, icon: FileText, accent: '#00BBF9' },
    { label: 'Updates Published', value: stats.updates, icon: Newspaper, accent: '#2EC4B6' },
    { label: 'Flashcards', value: stats.flashcards, icon: Layers, accent: '#9B5DE5' },
  ];

  const tabs = [
    ['dashboard', 'Dashboard'],
    ['write', 'Write Update'],
    ['manage-updates', 'Updates'],
    ['flashcards', 'Flashcards'],
  ];

  const inputClass = 'mt-2 w-full rounded-2xl border border-white/10 bg-[#111827] px-4 py-3 text-white outline-none transition focus:border-[#FF6B35]/60';
  const labelClass = 'block text-sm font-semibold text-[#C4CAD8]';

  return (
    <div className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top_left,rgba(255,107,53,0.12),transparent_34%),#0A0F1E] pb-28 text-white font-sans">
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 md:px-10">

        {/* Header */}
        <header className="rounded-[28px] border border-[#FF6B35]/25 bg-gradient-to-br from-[#1A1A2E] via-[#141827] to-[#111827] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.32)] sm:p-6">
          <p className="font-sans text-[11px] font-bold uppercase tracking-[0.28em] text-[#FFB199]">ExamReady Admin</p>
          <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="font-heading text-3xl font-bold leading-tight text-white sm:text-4xl">Admin Panel</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#8B9CB8]">Manage updates, flashcards, and platform stats.</p>
            </div>
            <button type="button" onClick={() => navigatePath('/dashboard')} className="inline-flex items-center justify-center rounded-full border border-[#FF6B35]/30 bg-[#FF6B35]/10 px-4 py-2.5 text-sm font-bold text-[#FFB199] transition hover:bg-[#FF6B35] hover:text-white">
              Back to Dashboard
            </button>
          </div>
        </header>

        {/* Tabs */}
        <nav className="grid grid-cols-4 gap-2 rounded-2xl border border-white/10 bg-[#0B1324]/80 p-2">
          {tabs.map(([key, label]) => (
            <button key={key} type="button" onClick={() => setActiveTab(key)}
              className={`rounded-xl px-2 py-3 text-[11px] font-bold transition sm:text-sm ${activeTab === key ? 'bg-[#FF6B35] text-white shadow-[0_0_22px_rgba(255,107,53,0.25)]' : 'text-[#8B9CB8] hover:bg-white/5 hover:text-white'}`}>
              {label}
            </button>
          ))}
        </nav>

        {/* Toast */}
        {message && (
          <div className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold ${message.type === 'success' ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200' : 'border-red-400/30 bg-red-500/10 text-red-200'}`}>
            <CheckCircle className="h-4 w-4 shrink-0" />
            {message.text}
          </div>
        )}

        {/* ── Dashboard ── */}
        {activeTab === 'dashboard' && (
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

        {/* ── Write Update ── */}
        {activeTab === 'write' && (
          <form onSubmit={handleUpdateSubmit} className="space-y-5 rounded-[24px] border border-white/10 bg-[#0B1324]/85 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] sm:p-8">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-heading text-2xl font-bold text-white">{editingUpdateId ? 'Edit Update' : 'Write Update'}</h2>
              {editingUpdateId && (
                <button type="button" onClick={resetUpdateForm} className="text-sm font-bold text-[#FFB199] hover:text-[#FF6B35]">
                  Cancel edit
                </button>
              )}
            </div>

            <label className="block">
              <span className={labelClass}>Title</span>
              <input
                value={updateForm.title}
                onChange={e => setUpdateForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g. JAMB 2025 Registration Now Open"
                className={`${inputClass} text-base`}
              />
            </label>

            <div className="block">
              <span className={labelClass}>Content</span>
              <RichEditor
                key={editingUpdateId ?? 'new'}
                value={updateForm.content}
                onChange={content => setUpdateForm(prev => ({ ...prev, content }))}
              />
              <p className="mt-1.5 text-[11px] text-[#8B9CB8]">
                Supports bold, italic, headings, lists, blockquotes, and links.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className={labelClass}>Category</span>
                <select value={updateForm.category} onChange={e => setUpdateForm(prev => ({ ...prev, category: e.target.value }))} className={inputClass}>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </label>
              <label className="block">
                <span className={labelClass}>Status</span>
                <select value={updateForm.status} onChange={e => setUpdateForm(prev => ({ ...prev, status: e.target.value }))} className={inputClass}>
                  {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>
            </div>

            <button
              type="submit"
              disabled={updateSubmitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#FF6B35] px-6 py-4 text-base font-bold text-white shadow-[0_8px_28px_rgba(255,107,53,0.3)] transition hover:bg-[#ff7c4d] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {updateSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
              {editingUpdateId ? 'Save Changes' : 'Publish Update'}
            </button>
          </form>
        )}

        {/* ── Manage Updates ── */}
        {activeTab === 'manage-updates' && (
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
                        <button type="button" onClick={() => handleEditUpdate(update)} className="inline-flex items-center gap-1 rounded-full border border-white/10 px-3 py-2 text-xs font-bold text-[#C4CAD8] hover:text-white"><Edit3 className="h-3.5 w-3.5" /> Edit</button>
                        <button type="button" onClick={() => handleToggleStatus(update)} className="rounded-full border border-[#2EC4B6]/30 px-3 py-2 text-xs font-bold text-[#2EC4B6] hover:bg-[#2EC4B6]/10">Toggle Status</button>
                        <button type="button" onClick={() => handleDeleteUpdate(update.id)} className="inline-flex items-center gap-1 rounded-full border border-red-400/30 px-3 py-2 text-xs font-bold text-red-200 hover:bg-red-500/10"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── Flashcards ── */}
        {activeTab === 'flashcards' && (
          <section className="space-y-5">

            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-3">
              <button type="button" onClick={openNewCardForm} className="inline-flex items-center gap-2 rounded-full bg-[#FF6B35] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#ff7c4d]">
                <Plus className="h-4 w-4" /> New Card
              </button>
              <select value={filterSubject} onChange={e => setFilterSubject(e.target.value)} className="rounded-2xl border border-white/10 bg-[#0B1324] px-4 py-2.5 text-sm text-white outline-none focus:border-[#FF6B35]/60">
                <option value="">All Subjects</option>
                {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <button type="button" onClick={loadFlashcards} className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-2.5 text-sm font-bold text-[#FFB199] hover:border-[#FF6B35]/50">
                <RefreshCw className="h-4 w-4" />
              </button>
              <span className="ml-auto text-sm text-[#8B9CB8]">{filteredCards.length} card{filteredCards.length !== 1 ? 's' : ''}</span>
            </div>

            {/* Card Form (inline) */}
            {cardFormOpen && (
              <form onSubmit={handleCardSubmit} className="space-y-4 rounded-[24px] border border-[#FF6B35]/30 bg-[#0B1324]/95 p-5 shadow-[0_0_30px_rgba(255,107,53,0.1)]">
                <div className="flex items-center justify-between">
                  <h2 className="font-heading text-lg font-bold text-white">{editingCardId ? 'Edit Card' : 'New Flashcard'}</h2>
                  <button type="button" onClick={closeCardForm} className="rounded-full p-1.5 text-[#8B9CB8] hover:bg-white/10 hover:text-white">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <label className="block">
                    <span className={labelClass}>Subject</span>
                    <select value={cardForm.subject} onChange={e => handleCardSubjectChange(e.target.value)} className={inputClass}>
                      {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </label>
                  <label className="block">
                    <span className={labelClass}>Subtopic</span>
                    <select value={cardForm.subtopic} onChange={e => setCardForm(prev => ({ ...prev, subtopic: e.target.value }))} className={inputClass}>
                      {availableSubtopics.map(st => <option key={st} value={st}>{st}</option>)}
                    </select>
                  </label>
                  <label className="block">
                    <span className={labelClass}>Topic <span className="text-[#8B9CB8] font-normal">(optional)</span></span>
                    <input value={cardForm.topic} onChange={e => setCardForm(prev => ({ ...prev, topic: e.target.value }))} placeholder="e.g. Cell Membrane" className={inputClass} />
                  </label>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className={labelClass}>Front (Question / Term)</span>
                    <textarea value={cardForm.front} onChange={e => setCardForm(prev => ({ ...prev, front: e.target.value }))} rows={4} placeholder="e.g. What is osmosis?" className={`${inputClass} resize-none`} />
                  </label>
                  <label className="block">
                    <span className={labelClass}>Back (Answer)</span>
                    <textarea value={cardForm.back} onChange={e => setCardForm(prev => ({ ...prev, back: e.target.value }))} rows={4} placeholder="e.g. The movement of water molecules..." className={`${inputClass} resize-none`} />
                  </label>
                </div>

                <div className="flex items-center gap-3">
                  <button type="submit" disabled={cardSubmitting} className="inline-flex items-center gap-2 rounded-full bg-[#FF6B35] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#ff7c4d] disabled:opacity-60">
                    {cardSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {editingCardId ? 'Save Changes' : 'Create Card'}
                  </button>
                  <button type="button" onClick={closeCardForm} className="rounded-full border border-white/10 px-5 py-3 text-sm font-bold text-[#8B9CB8] hover:text-white">
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Cards list */}
            {flashcardsLoading ? (
              <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-[#FF6B35]" /></div>
            ) : filteredCards.length === 0 ? (
              <div className="rounded-[24px] border border-white/10 bg-[#0B1324]/85 p-10 text-center">
                <Layers className="mx-auto h-10 w-10 text-[#8B9CB8]" />
                <p className="mt-3 font-heading text-base font-bold text-white">No flashcards yet</p>
                <p className="mt-1 text-sm text-[#8B9CB8]">Click "New Card" to add your first flashcard.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredCards.map(card => (
                  <article key={card.id} className="rounded-2xl border border-white/10 bg-[#0B1324]/85 p-4 transition hover:border-white/20">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-[#FF6B35]/15 px-2.5 py-0.5 text-[11px] font-bold text-[#FFB199]">{card.subject}</span>
                          <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold text-[#8B9CB8]">{card.subtopic}</span>
                        </div>
                        <p className="mt-2 text-sm font-semibold leading-snug text-white">{card.front}</p>
                        <p className="mt-1 text-sm leading-snug text-[#8B9CB8] line-clamp-2">{card.back}</p>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <button type="button" onClick={() => openEditCardForm(card)} aria-label="Edit card" className="rounded-xl border border-white/10 p-2 text-[#C4CAD8] transition hover:bg-white/10 hover:text-white">
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button type="button" onClick={() => handleDeleteCard(card.id)} aria-label="Delete card" className="rounded-xl border border-red-400/20 p-2 text-red-300 transition hover:bg-red-500/10">
                          <Trash2 className="h-4 w-4" />
                        </button>
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
