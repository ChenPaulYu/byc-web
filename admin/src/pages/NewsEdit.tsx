import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MarkdownEditor from '../components/MarkdownEditor';
import { getContent, createContent, updateContent, deleteContent } from '../api';

interface NewsMetadata {
  title: string;
  date: string;
  type: string;
  url?: string;
}

const defaultMetadata: NewsMetadata = {
  title: '',
  date: new Date().toISOString().split('T')[0],
  type: 'update',
  url: '',
};

const NewsEdit: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const isNew = slug === 'new';

  const [metadata, setMetadata] = useState<NewsMetadata>(defaultMetadata);
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!isNew);

  useEffect(() => {
    if (!isNew && slug) {
      setLoading(true);
      getContent('news', slug)
        .then((item) => {
          const meta = item.metadata as unknown as NewsMetadata;
          setMetadata({
            title: meta.title || '',
            date: meta.date || '',
            type: meta.type || 'update',
            url: meta.url || '',
          });
          setContent(item.content);
        })
        .catch((err) => alert(`Failed to load: ${err}`))
        .finally(() => setLoading(false));
    }
  }, [slug, isNew]);

  const generateSlug = (title: string) =>
    title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const handleSave = async () => {
    if (!metadata.title.trim()) {
      alert('Title is required');
      return;
    }

    setSaving(true);
    const finalSlug = isNew ? generateSlug(metadata.title) : slug!;
    const finalMetadata: Record<string, unknown> = {
      title: metadata.title,
      date: metadata.date,
      type: metadata.type,
    };
    if (metadata.url?.trim()) {
      finalMetadata.url = metadata.url.trim();
    }

    try {
      if (isNew) {
        await createContent('news', finalSlug, finalMetadata, content);
      } else {
        await updateContent('news', finalSlug, finalMetadata, content);
      }
      navigate('/news');
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

  if (loading) return <div className="p-8 text-neutral-400">Loading...</div>;

  return (
    <div className="p-8 max-w-4xl">
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

      <div className="grid grid-cols-2 gap-4 mb-6">
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
      </div>

      <MarkdownEditor value={content} onChange={setContent} />
    </div>
  );
};

export default NewsEdit;
