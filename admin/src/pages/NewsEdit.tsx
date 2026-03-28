import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MarkdownEditor from '../components/MarkdownEditor';
import { getContent, createContent, updateContent, deleteContent, hasZhContent, getZhContent, saveZhContent } from '../api';

interface NewsMetadata {
  title: string;
  date: string;
  updated?: string;
  type: string;
  url?: string;
  status: 'pinned' | 'published' | 'draft';
}

const defaultMetadata: NewsMetadata = {
  title: '',
  date: new Date().toISOString().split('T')[0],
  updated: '',
  type: 'update',
  url: '',
  status: 'published',
};

const NewsEdit: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const isNew = slug === 'new';

  const [metadata, setMetadata] = useState<NewsMetadata>(defaultMetadata);
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!isNew);
  const [lang, setLang] = useState<'en' | 'zh'>('en');
  const [hasZh, setHasZh] = useState(false);
  const [zhContent, setZhContent] = useState('');
  const [zhStatus, setZhStatus] = useState<'pinned' | 'published' | 'draft'>('draft');

  useEffect(() => {
    if (!isNew && slug) {
      setLoading(true);
      getContent('news', slug)
        .then((item) => {
          const meta = item.metadata as unknown as NewsMetadata;
          setMetadata({
            title: meta.title || '',
            date: meta.date || '',
            updated: meta.updated || '',
            type: meta.type || 'update',
            url: meta.url || '',
            status: (meta as any).pinned ? 'pinned' : ((meta as any).draft ? 'draft' : 'published'),
          });
          setContent(item.content);
        })
        .then(async () => {
          if (!isNew && slug) {
            const zh = await hasZhContent('news', slug);
            setHasZh(zh);
          }
        })
        .catch((err) => alert(`Failed to load: ${err}`))
        .finally(() => setLoading(false));
    }
  }, [slug, isNew]);

  useEffect(() => {
    if (lang === 'zh' && hasZh && slug && !isNew && !zhContent) {
      getZhContent('news', slug)
        .then((item) => {
          setZhContent(item.content);
          const zhMeta = item.metadata as any;
          setZhStatus(zhMeta?.pinned ? 'pinned' : (zhMeta?.draft ? 'draft' : 'published'));
        })
        .catch(() => { /* new zh file, start empty */ });
    }
  }, [lang, hasZh, slug, isNew]);

  const generateSlug = (title: string) =>
    title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const handleSave = async () => {
    if (!metadata.title.trim()) {
      alert('Title is required');
      return;
    }

    setSaving(true);
    const finalSlug = isNew ? generateSlug(metadata.title) : slug!;
    const activeStatus = lang === 'zh' ? zhStatus : metadata.status;
    const finalMetadata: Record<string, unknown> = {
      title: metadata.title,
      date: metadata.date,
      type: metadata.type,
      pinned: activeStatus === 'pinned',
      draft: activeStatus === 'draft',
    };
    if (metadata.updated?.trim()) {
      finalMetadata.updated = metadata.updated.trim();
    }
    if (metadata.url?.trim()) {
      finalMetadata.url = metadata.url.trim();
    }

    try {
      if (lang === 'zh') {
        await saveZhContent('news', finalSlug, finalMetadata, zhContent);
      } else if (isNew) {
        await createContent('news', finalSlug, finalMetadata, content);
      } else {
        await updateContent('news', finalSlug, finalMetadata, content);
      }
      if (lang !== 'zh') navigate('/news');
    } catch (err) {
      alert(`Failed to save: ${err}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!slug || isNew) return;
    if (!window.confirm(`Delete "${metadata.title}"? This cannot be undone.`)) return;
    try {
      await deleteContent('news', slug);
      navigate('/news');
    } catch (err) {
      alert(`Failed to delete: ${err}`);
    }
  };

  if (loading) return <div className="p-4 md:p-8 text-neutral-400">Loading...</div>;

  return (
    <div className="p-4 md:p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/news')}
          className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
        >
          ← Back to News
        </button>
        <div className="flex gap-2">
          {!isNew && (
            <button
              onClick={handleDelete}
              className="px-4 py-2 text-sm font-medium text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
            >
              Delete
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-white bg-neutral-900 rounded-md hover:bg-neutral-800 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="col-span-2">
          <label className="block text-xs font-medium text-neutral-400 tracking-wide mb-1">Title</label>
          <input
            type="text"
            value={metadata.title}
            onChange={(e) => setMetadata({ ...metadata, title: e.target.value })}
            className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-300"
            placeholder="News item title"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-400 tracking-wide mb-1">Date</label>
          <input
            type="date"
            value={metadata.date}
            onChange={(e) => setMetadata({ ...metadata, date: e.target.value })}
            className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-300"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-400 tracking-wide mb-1">Updated (optional)</label>
          <input
            type="date"
            value={metadata.updated || ''}
            onChange={(e) => setMetadata({ ...metadata, updated: e.target.value })}
            className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-300"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-400 tracking-wide mb-1">Type</label>
          <select
            value={metadata.type}
            onChange={(e) => setMetadata({ ...metadata, type: e.target.value })}
            className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-300 bg-white"
          >
            <option value="update">Update</option>
            <option value="release">Release</option>
            <option value="announcement">Announcement</option>
            <option value="event">Event</option>
          </select>
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-medium text-neutral-400 tracking-wide mb-1">URL (optional)</label>
          <input
            type="text"
            value={metadata.url || ''}
            onChange={(e) => setMetadata({ ...metadata, url: e.target.value })}
            className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-300"
            placeholder="https://example.com/external-link"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-400 tracking-wide mb-1">Status</label>
          <select
            value={lang === 'zh' ? zhStatus : metadata.status}
            onChange={(e) => {
              const s = e.target.value as 'pinned' | 'published' | 'draft';
              if (lang === 'zh') setZhStatus(s);
              else setMetadata({ ...metadata, status: s });
            }}
            className="px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-300"
          >
            <option value="published">Published</option>
            <option value="pinned">Pinned</option>
            <option value="draft">Draft</option>
          </select>
        </div>
      </div>

      {/* Language tabs */}
      {!isNew && (
        <div className="flex items-center gap-2 mb-4">
          <div className="inline-flex items-center border border-neutral-200 rounded-md text-xs overflow-hidden">
            <button type="button" onClick={() => setLang('en')} className={`px-3 py-1.5 transition-colors ${lang === 'en' ? 'bg-neutral-900 text-white' : 'text-neutral-500 hover:text-neutral-900'}`}>EN</button>
            <button type="button" onClick={() => { setLang('zh'); if (!hasZh) setHasZh(true); }} className={`px-3 py-1.5 transition-colors ${lang === 'zh' ? 'bg-neutral-900 text-white' : 'text-neutral-500 hover:text-neutral-900'}`}>ZH</button>
          </div>
          {lang === 'zh' && !hasZh && <span className="text-xs text-neutral-400">Creating Chinese version</span>}
        </div>
      )}

      <MarkdownEditor key={lang} value={lang === 'zh' ? zhContent : content} onChange={lang === 'zh' ? setZhContent : setContent} />
    </div>
  );
};

export default NewsEdit;
