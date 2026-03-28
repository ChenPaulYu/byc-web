import React, { useEffect, useState } from 'react';
import { loadAllNews, NewsContent } from '../utils/contentLoader';

const News: React.FC = () => {
  const [items, setItems] = useState<NewsContent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllNews()
      .then(setItems)
      .catch((err) => console.error('Error loading news:', err))
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const typeColors: Record<string, string> = {
    update: 'text-blue-600',
    release: 'text-green-600',
    announcement: 'text-amber-600',
    event: 'text-purple-600',
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-neutral-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-[720px] mx-auto px-6 py-16">
        <header className="mb-12">
          <h1 className="text-4xl font-bold mb-4 font-['Space_Grotesk']">News</h1>
          <p className="text-neutral-600 text-lg">Latest updates and announcements.</p>
        </header>

        <div className="space-y-6">
          {items.length === 0 ? (
            <p className="text-neutral-500">No news yet.</p>
          ) : (
            items.map((item) => (
              <article key={item.slug} className="group">
                <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-4">
                  <time dateTime={item.metadata.date} className="text-sm text-neutral-500 font-mono sm:w-[130px] flex-shrink-0">
                    {formatDate(item.metadata.date)}
                  </time>
                  <div className="flex-1">
                    <h2 className="text-lg font-medium text-neutral-900 mb-1">
                      {item.metadata.url ? (
                        <a href={item.metadata.url} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors">
                          {item.metadata.title} ↗
                        </a>
                      ) : (
                        item.metadata.title
                      )}
                    </h2>
                    <span className={`text-xs font-medium ${typeColors[item.metadata.type] || 'text-neutral-500'}`}>
                      {item.metadata.type}
                    </span>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default News;
