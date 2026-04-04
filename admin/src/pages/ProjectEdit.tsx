import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DeleteDialog from '../components/DeleteDialog';
import MarkdownEditor from '../components/MarkdownEditor';
import { getContent, createContent, updateContent, deleteContent, hasZhContent, getZhContent, saveZhContent, getGitHubHistoryUrl } from '../api';

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
  status: 'pinned' | 'published' | 'draft';
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
  status: 'published',
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
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<unknown>(null);
  const [linkAdded, setLinkAdded] = useState(false);
  const [lang, setLang] = useState<'en' | 'zh'>('en');
  const [hasZh, setHasZh] = useState(false);
  const [zhContent, setZhContent] = useState('');
  const [zhStatus, setZhStatus] = useState<'pinned' | 'published' | 'draft'>('draft');

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
            status: (meta as any).pinned ? 'pinned' : ((meta as any).draft ? 'draft' : 'published'),
            importance: meta.importance ?? 5,
            links: meta.links || [],
          });
          setTagsInput((meta.tags || []).join(', '));
          setContent(item.content);
        })
        .then(async () => {
          if (!isNew && slug) {
            const zh = await hasZhContent('projects', slug);
            setHasZh(zh);
          }
        })
        .catch((err) => alert(`Failed to load: ${err}`))
        .finally(() => setLoading(false));
    }
  }, [slug, isNew]);

  useEffect(() => {
    if (lang === 'zh' && hasZh && slug && !isNew && !zhContent) {
      getZhContent('projects', slug)
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
    const finalMetadata: any = {
      ...metadata,
      tags: tagsInput.split(',').map((t) => t.trim()).filter(Boolean),
      pinned: activeStatus === 'pinned',
      draft: activeStatus === 'draft',
    };
    delete finalMetadata.status;

    try {
      if (lang === 'zh') {
        await saveZhContent('projects', finalSlug, finalMetadata, zhContent);
      } else if (isNew) {
        await createContent('projects', finalSlug, finalMetadata, content);
      } else {
        await updateContent('projects', finalSlug, finalMetadata, content);
      }
      if (lang !== 'zh') navigate('/projects');
    } catch (err) {
      alert(`Failed to save: ${err}`);
    } finally {
      setSaving(false);
    }
  };

  const openDeleteDialog = () => {
    setDeleteError(null);
    setDeleteOpen(true);
  };

  const closeDeleteDialog = () => {
    if (deleting) return;
    setDeleteError(null);
    setDeleteOpen(false);
  };

  const handleDelete = async () => {
    if (!slug || isNew) return;

    setDeleting(true);
    setDeleteError(null);

    try {
      await deleteContent('projects', slug);
      navigate('/projects');
    } catch (err) {
      setDeleteError(err);
    } finally {
      setDeleting(false);
    }
  };

  const addLink = () => {
    setMetadata({ ...metadata, links: [...metadata.links, { label: '', url: '', icon: 'demo' }] });
    setLinkAdded(true);
    setTimeout(() => { setLinkAdded(false); }, 700);
    setTimeout(() => { document.getElementById('project-link-last')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 50);
  };

  const updateLink = (index: number, field: keyof ProjectLink, value: string) => {
    const newLinks = [...metadata.links];
    newLinks[index] = { ...newLinks[index], [field]: value };
    setMetadata({ ...metadata, links: newLinks });
  };

  const removeLink = (index: number) => {
    setMetadata({ ...metadata, links: metadata.links.filter((_, i) => i !== index) });
  };

  if (loading) return <div className="p-4 md:p-8 text-neutral-400">Loading...</div>;

  return (
    <div className="p-4 md:p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/projects')}
          className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
        >
          ← Back to Projects
        </button>
        <div className="flex gap-2">
          {!isNew && getGitHubHistoryUrl('') && (
            <a
              href={getGitHubHistoryUrl(`public/content/projects/${slug}.md`)}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
            >
              History
            </a>
          )}
          {!isNew && (
            <button
              onClick={openDeleteDialog}
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
          <div>
            <label className="block text-xs font-medium text-neutral-400 tracking-wide mb-1">Importance</label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMetadata({ ...metadata, importance: Math.max(0, metadata.importance - 1) })}
                className="w-7 h-7 flex items-center justify-center rounded-md border border-neutral-200 text-neutral-500 hover:bg-neutral-100 transition-colors text-sm"
              >
                -
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: 10 }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setMetadata({ ...metadata, importance: i + 1 })}
                    className={`w-2.5 h-2.5 rounded-full transition-colors ${
                      i < metadata.importance ? 'bg-neutral-900' : 'bg-neutral-200'
                    }`}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => setMetadata({ ...metadata, importance: Math.min(10, metadata.importance + 1) })}
                className="w-7 h-7 flex items-center justify-center rounded-md border border-neutral-200 text-neutral-500 hover:bg-neutral-100 transition-colors text-sm"
              >
                +
              </button>
              <span className="text-xs text-neutral-400 ml-1 tabular-nums w-4">{metadata.importance}</span>
            </div>
          </div>
        </div>
        <div className="col-span-2">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-neutral-400 tracking-wide">Links</label>
            <button type="button" onClick={addLink} className="text-xs text-neutral-500 hover:text-neutral-900 transition-colors">+ Add Link</button>
          </div>
          {metadata.links.map((link, i) => (
            <div
              key={i}
              id={i === metadata.links.length - 1 ? 'project-link-last' : undefined}
              className={`flex gap-2 mb-2${linkAdded && i === metadata.links.length - 1 ? ' animate-item-added' : ''}`}
            >
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

      <DeleteDialog
        isOpen={deleteOpen}
        type="projects"
        itemName={metadata.title || slug || 'Untitled project'}
        isDeleting={deleting}
        error={deleteError}
        onConfirm={handleDelete}
        onClose={closeDeleteDialog}
      />
    </div>
  );
};

export default ProjectEdit;
