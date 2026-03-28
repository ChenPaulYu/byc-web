import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MarkdownEditor from '../components/MarkdownEditor';
import { getContent, createContent, updateContent, deleteContent } from '../api';

interface BlogMetadata {
  title: string;
  date: string;
  category: string;
  tags: string[];
  pinned: boolean;
  draft: boolean;
}

const defaultMetadata: BlogMetadata = {
  title: '',
  date: new Date().toISOString().split('T')[0],
  category: '',
  tags: [],
  pinned: false,
  draft: false,
};

const BlogEdit: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const isNew = slug === 'new';

  const [metadata, setMetadata] = useState<BlogMetadata>(defaultMetadata);
  const [content, setContent] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!isNew);

  useEffect(() => {
    if (!isNew && slug) {
      setLoading(true);
      getContent('blog', slug)
        .then((item) => {
          const meta = item.metadata as unknown as BlogMetadata;
          setMetadata({
            title: meta.title || '',
            date: meta.date || '',
            category: meta.category || '',
            tags: meta.tags || [],
            pinned: meta.pinned || false,
            draft: meta.draft || false,
          });
          setTagsInput((meta.tags || []).join(', '));
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
    const finalMetadata = {
      ...metadata,
      tags: tagsInput.split(',').map((t) => t.trim()).filter(Boolean),
    };

    try {
      if (isNew) {
        await createContent('blog', finalSlug, finalMetadata, content);
      } else {
        await updateContent('blog', finalSlug, finalMetadata, content);
      }
      navigate('/blog');
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
      await deleteContent('blog', slug);
      navigate('/blog');
    } catch (err) {
      alert(`Failed to delete: ${err}`);
    }
  };

  if (loading) return <div className="p-8 text-neutral-400">Loading...</div>;

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/blog')}
          className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
        >
          ← Back to Blog Posts
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
            placeholder="Post title"
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
          <label className="block text-xs font-medium text-neutral-400 tracking-wide mb-1">Category</label>
          <input
            type="text"
            value={metadata.category}
            onChange={(e) => setMetadata({ ...metadata, category: e.target.value })}
            className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-300"
            placeholder="e.g. technology"
          />
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-medium text-neutral-400 tracking-wide mb-1">Tags (comma-separated)</label>
          <input
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-300"
            placeholder="react, typescript, web"
          />
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-neutral-700">
            <input
              type="checkbox"
              checked={metadata.pinned}
              onChange={(e) => setMetadata({ ...metadata, pinned: e.target.checked })}
              className="rounded"
            />
            Pinned
          </label>
          <label className="flex items-center gap-2 text-sm text-neutral-700">
            <input
              type="checkbox"
              checked={metadata.draft}
              onChange={(e) => setMetadata({ ...metadata, draft: e.target.checked })}
              className="rounded"
            />
            Draft
          </label>
        </div>
      </div>

      <MarkdownEditor value={content} onChange={setContent} />
    </div>
  );
};

export default BlogEdit;
