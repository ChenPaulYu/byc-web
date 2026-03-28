import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ContentTable, { Column } from '../components/ContentTable';
import { listContent, deleteContent, type ContentItem } from '../api';

const columns: Column[] = [
  { key: 'title', label: 'Title', render: (_, item) => (item.metadata as Record<string, unknown>)?.title as string ?? item.slug },
  { key: 'date', label: 'Date', render: (_, item) => (item.metadata as Record<string, unknown>)?.date as string ?? '' },
  {
    key: 'tags',
    label: 'Tags',
    render: (_, item) => {
      const tags = (item.metadata as Record<string, unknown>)?.tags as string[] | undefined;
      return tags?.map((t) => (
        <span key={t} className="inline-block bg-neutral-100 text-neutral-600 text-xs px-2 py-0.5 rounded mr-1">{t}</span>
      )) ?? null;
    },
  },
  {
    key: 'status',
    label: 'Status',
    render: (_, item) => {
      const draft = (item.metadata as Record<string, unknown>)?.draft as boolean | undefined;
      return (
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${draft ? 'bg-neutral-100 text-neutral-500' : 'bg-green-50 text-green-700'}`}>
          {draft ? 'Draft' : 'Published'}
        </span>
      );
    },
  },
];

const BlogList: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const data = await listContent('blog');
      setItems(data);
    } catch (err) {
      console.error('Failed to load blog posts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const handleDelete = async (slug: string) => {
    if (!window.confirm(`Delete blog post "${slug}"? This cannot be undone.`)) return;
    try {
      await deleteContent('blog', slug);
      await fetchItems();
    } catch (err) {
      alert(`Failed to delete: ${err}`);
    }
  };

  const rows = items.map((item) => ({
    slug: item.slug,
    title: item.metadata.title,
    date: item.metadata.date,
    tags: item.metadata.tags,
    status: item.metadata.draft ? 'Draft' : 'Published',
    metadata: item.metadata,
  }));

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-neutral-900">Blog Posts</h2>
        <button
          onClick={() => navigate('/blog/new')}
          className="px-4 py-2 text-sm font-medium text-white bg-neutral-900 rounded-lg hover:bg-neutral-700 transition-colors"
        >
          New Post
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-neutral-400">Loading...</p>
      ) : (
        <ContentTable
          columns={columns}
          rows={rows}
          onEdit={(slug) => navigate(`/blog/${slug}`)}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
};

export default BlogList;
