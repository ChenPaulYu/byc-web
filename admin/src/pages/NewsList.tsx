import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ContentTable, { Column } from '../components/ContentTable';
import { listContent, deleteContent, type ContentItem } from '../api';

const columns: Column[] = [
  { key: 'title', label: 'Title', render: (_, item) => (item.metadata as Record<string, unknown>)?.title as string ?? item.slug },
  { key: 'date', label: 'Date', render: (_, item) => (item.metadata as Record<string, unknown>)?.date as string ?? '' },
  {
    key: 'type',
    label: 'Type',
    render: (_, item) => {
      const type = (item.metadata as Record<string, unknown>)?.type as string | undefined;
      const colors: Record<string, string> = {
        update: 'bg-blue-50 text-blue-700',
        release: 'bg-green-50 text-green-700',
        announcement: 'bg-amber-50 text-amber-700',
        event: 'bg-purple-50 text-purple-700',
      };
      return type ? (
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colors[type] || 'bg-neutral-100 text-neutral-600'}`}>
          {type}
        </span>
      ) : null;
    },
  },
];

const NewsList: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const data = await listContent('news');
      setItems(data);
    } catch (err) {
      console.error('Failed to load news items:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const handleDelete = async (slug: string) => {
    if (!window.confirm(`Delete news item "${slug}"? This cannot be undone.`)) return;
    try {
      await deleteContent('news', slug);
      await fetchItems();
    } catch (err) {
      alert(`Failed to delete: ${err}`);
    }
  };

  const rows = items.map((item) => ({
    slug: item.slug,
    title: item.metadata.title,
    date: item.metadata.date,
    type: item.metadata.type,
    metadata: item.metadata,
  }));

  return (
    <div className="p-4 md:p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-neutral-900">News</h2>
        <button
          onClick={() => navigate('/news/new')}
          className="px-4 py-2 text-sm font-medium text-white bg-neutral-900 rounded-md hover:bg-neutral-800 transition-colors"
        >
          New Item
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-neutral-400">Loading...</p>
      ) : (
        <ContentTable
          columns={columns}
          rows={rows}
          onEdit={(slug) => navigate(`/news/${slug}`)}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
};

export default NewsList;
