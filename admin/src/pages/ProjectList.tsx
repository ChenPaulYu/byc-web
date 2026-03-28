import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ContentTable, { Column } from '../components/ContentTable';
import { listContent, deleteContent, getConfig, type ContentItem } from '../api';

const columns: Column[] = [
  { key: 'title', label: 'Title', render: (_, item) => (item.metadata as Record<string, unknown>)?.title as string ?? item.slug },
  { key: 'year', label: 'Year', render: (_, item) => (item.metadata as Record<string, unknown>)?.year as string ?? '' },
  {
    key: 'category',
    label: 'Category',
    render: (_, item) => {
      const cat = (item.metadata as Record<string, unknown>)?.category as string | undefined;
      const colors: Record<string, string> = {
        Research: 'bg-blue-50 text-blue-700',
        Engineering: 'bg-amber-50 text-amber-700',
        Creative: 'bg-purple-50 text-purple-700',
      };
      return cat ? (
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colors[cat] || 'bg-neutral-100 text-neutral-600'}`}>
          {cat}
        </span>
      ) : null;
    },
  },
  {
    key: 'enabled',
    label: 'Status',
    render: (val) => (
      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${val ? 'bg-green-50 text-green-700' : 'bg-neutral-100 text-neutral-500'}`}>
        {val ? 'Enabled' : 'Disabled'}
      </span>
    ),
  },
];

const ProjectList: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<(ContentItem & { enabled: boolean })[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const [data, config] = await Promise.all([listContent('projects'), getConfig()]);
      const enabledMap = new Map(config.projects.map((p) => [p.slug, p.enabled]));
      setItems(data.map((item) => ({ ...item, enabled: enabledMap.get(item.slug) ?? true })));
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const handleDelete = async (slug: string) => {
    if (!window.confirm(`Delete project "${slug}"? This cannot be undone.`)) return;
    try {
      await deleteContent('projects', slug);
      await fetchItems();
    } catch (err) {
      alert(`Failed to delete: ${err}`);
    }
  };

  const rows = items.map((item) => ({
    slug: item.slug,
    title: item.metadata.title,
    year: item.metadata.year,
    category: item.metadata.category,
    enabled: item.enabled,
    metadata: item.metadata,
  }));

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-neutral-900">Projects</h2>
        <button
          onClick={() => navigate('/projects/new')}
          className="px-4 py-2 text-sm font-medium text-white bg-neutral-900 rounded-lg hover:bg-neutral-700 transition-colors"
        >
          New Project
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-neutral-400">Loading...</p>
      ) : (
        <ContentTable
          columns={columns}
          rows={rows}
          onEdit={(slug) => navigate(`/projects/${slug}`)}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
};

export default ProjectList;
