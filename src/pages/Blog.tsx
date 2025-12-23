import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { loadAllBlogPosts, BlogContent } from '../utils/contentLoader';

const Blog: React.FC = () => {
  const [posts, setPosts] = useState<BlogContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadContent = async () => {
      try {
        const data = await loadAllBlogPosts();
        setPosts(data);
      } catch (err) {
        console.error('Error loading blog posts:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-neutral-500">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <p className="text-red-500 mb-4">Error: {error}</p>
        <p className="text-neutral-500">Check console for details</p>
      </div>
    );
  }

  // Format date like Karpathy's blog: "Dec 2024"
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-[720px] mx-auto px-6 py-16">
        {/* Header */}
        <header className="mb-12">
          <h1 className="text-4xl font-bold mb-4 font-['Space_Grotesk']">
            Blog
          </h1>
          <p className="text-neutral-600 text-lg">
            Thoughts on music technology, AI, and creative tools.
          </p>
        </header>

        {/* Posts List (Bear Blog inspired: date + title) */}
        <div className="space-y-6">
          {posts.length === 0 ? (
            <p className="text-neutral-500">No posts yet.</p>
          ) : (
            posts.map((post) => (
              <article key={post.slug} className="group">
                <Link
                  to={`/blog/${post.slug}`}
                  className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-4 hover:opacity-70 transition-opacity"
                >
                  {/* Date (monospace, fixed width on desktop) */}
                  <time
                    dateTime={post.metadata.date}
                    className="text-sm text-neutral-500 font-mono sm:w-[130px] flex-shrink-0"
                  >
                    {formatDate(post.metadata.date)}
                  </time>

                  {/* Title and excerpt */}
                  <div className="flex-1">
                    <h2 className="text-lg font-medium text-neutral-900 group-hover:text-blue-600 transition-colors mb-1">
                      {post.metadata.pinned && (
                        <span className="inline-block mr-2">📌</span>
                      )}
                      {post.metadata.title}
                    </h2>

                    {/* Tags */}
                    {post.metadata.tags && post.metadata.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {post.metadata.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-xs text-neutral-500"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Blog;
