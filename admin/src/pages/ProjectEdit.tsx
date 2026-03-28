import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MarkdownEditor from '../components/MarkdownEditor';
import { getContent, createContent, updateContent, deleteContent } from '../api';

interface ProjectLink {
  label: string;
  url: string;
  icon?: 'video' | 'paper' | 'code' | 'demo';
}

interface ProjectMetadata {
  title: string;
  date: string;
  year: string;
  category: 'Research' | 'Engineering' | 'Creative';
  role: string;
  tags: string[];
  cover: string;
  pinned: boolean;
  importance: number;
  links: ProjectLink[];
}

const defaultMetadata: ProjectMetadata = {
  title: '',
  date: new Date().toISOString().split('T')[0],
  year: new Date().getFullYear().toString(),
  category: 'Research',
  role: '',
  tags: [],
  cover: '',
  pinned: false,
  importance: 5,
  links: [],
};

const ProjectEdit: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const isNew = slug === 'new';

  const [metadata, setMetadata] = useState<ProjectMetadata>(defaultMetadata);
  const [content, setContent] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!isNew);

  useEffect(() => {
    if (!isNew && slug) {
      setLoading(true);
      getContent('projects', slug)
        .then((item) => {
          const meta = item.metadata as unknown as ProjectMetadata;
          setMetadata({
            title: meta.title || '',
            date: meta.date || '',
            year: meta.year || '',
            category: meta.category || 'Research',
            role: meta.role || '',
            tags: meta.tags || [],
            cover: meta.cover || '',
            pinned: meta.pinned || false,
            importance: meta.importance ?? 5,
            links: meta.links || [],
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
        await createContent('projects', finalSlug, finalMetadata, content);
      } else {
        await updateContent('projects', finalSlug, finalMetadata, content);
      }
      navigate('/projects');
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
      await deleteContent('projects', slug);
      navigate('/projects');
    } catch (err) {
      alert(`Failed to delete: ${err}`);
    }
  };

  const addLink = () => {
    setMetadata({ ...metadata, links: [...metadata.links, { label: '', url: '', icon: 'demo' }] });
  };

  const updateLink = (index: number, field: keyof ProjectLink, value: string) => {
    const newLinks = [...metadata.links];
    newLinks[index] = { ...newLinks[index], [field]: value };
    setMetadata({ ...metadata, links: newLinks });
  };

  const removeLink = (index: number) => {
    setMetadata({ ...metadata, links: metadata.links.filter((_, i) => i !== index) });
  };

  if (loading) return <div className="p-8 text-neutral-400">Loading...</div>;

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/projects')}
          className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
        >
          ← Back to Projects
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
          <input type="text" value={metadata.title} onChange={(e) => setMetadata({ ...metadata, title: e.target.value })} className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-300" placeholder="Project title" />
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-400 tracking-wide mb-1">Date</label>
          <input type="date" value={metadata.date} onChange={(e) => setMetadata({ ...metadata, date: e.target.value })} className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-300" />
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-400 tracking-wide mb-1">Year</label>
          <input type="text" value={metadata.year} onChange={(e) => setMetadata({ ...metadata, year: e.target.value })} className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-300" placeholder="2026" />
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-400 tracking-wide mb-1">Category</label>
          <select value={metadata.category} onChange={(e) => setMetadata({ ...metadata, category: e.target.value as ProjectMetadata['category'] })} className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-300">
            <option value="Research">Research</option>
            <option value="Engineering">Engineering</option>
            <option value="Creative">Creative</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-400 tracking-wide mb-1">Role</label>
          <input type="text" value={metadata.role} onChange={(e) => setMetadata({ ...metadata, role: e.target.value })} className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-300" placeholder="Lead Developer" />
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-medium text-neutral-400 tracking-wide mb-1">Tags (comma-separated)</label>
          <input type="text" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-300" placeholder="AI, Music, WebGL" />
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-medium text-neutral-400 tracking-wide mb-1">Cover Image URL</label>
          <input type="text" value={metadata.cover} onChange={(e) => setMetadata({ ...metadata, cover: e.target.value })} className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-300" placeholder="/images/project-cover.jpg" />
        </div>
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 text-sm text-neutral-700">
            <input type="checkbox" checked={metadata.pinned} onChange={(e) => setMetadata({ ...metadata, pinned: e.target.checked })} className="rounded" />
            Pinned
          </label>
          <div className="flex items-center gap-2">
            <label className="text-sm text-neutral-700">Importance</label>
            <input type="number" min={0} max={10} value={metadata.importance} onChange={(e) => setMetadata({ ...metadata, importance: parseInt(e.target.value) || 0 })} className="w-16 px-2 py-1 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-300" />
          </div>
        </div>
        <div className="col-span-2">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-neutral-400 tracking-wide">Links</label>
            <button type="button" onClick={addLink} className="text-xs text-neutral-500 hover:text-neutral-900 transition-colors">+ Add Link</button>
          </div>
          {metadata.links.map((link, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <input type="text" value={link.label} onChange={(e) => updateLink(i, 'label', e.target.value)} className="flex-1 px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-300" placeholder="Label" />
              <input type="text" value={link.url} onChange={(e) => updateLink(i, 'url', e.target.value)} className="flex-[2] px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-300" placeholder="URL" />
              <select value={link.icon || 'demo'} onChange={(e) => updateLink(i, 'icon', e.target.value)} className="w-24 px-2 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-300">
                <option value="demo">Demo</option>
                <option value="code">Code</option>
                <option value="paper">Paper</option>
                <option value="video">Video</option>
              </select>
              <button type="button" onClick={() => removeLink(i)} className="px-2 text-neutral-400 hover:text-red-500 transition-colors">×</button>
            </div>
          ))}
        </div>
      </div>

      <MarkdownEditor value={content} onChange={setContent} />
    </div>
  );
};

export default ProjectEdit;
