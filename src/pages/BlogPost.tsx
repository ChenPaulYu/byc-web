import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { loadBlogPost, loadBlogPostZh, hasChineseVersion, BlogContent } from '../utils/contentLoader';
import MarkdownRenderer from '../components/MarkdownRenderer';
import { usePageTitle } from '../utils/usePageTitle';
import LanguageToggle from '../components/LanguageToggle';

const BlogPost: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogContent | null>(null);
  usePageTitle(post?.metadata?.title || 'Blog');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lang, setLang] = useState<'en' | 'zh'>('en');
  const [hasZh, setHasZh] = useState(false);

  useEffect(() => {
    if (!slug) return;

    const loadContent = async () => {
      try {
        setLoading(true);
        const data = await loadBlogPost(slug);
        setPost(data);
        const zhExists = await hasChineseVersion('blog', slug);
        setHasZh(zhExists);
      } catch (err) {
        setError('Post not found');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, [slug]);

  useEffect(() => {
    if (!slug || !hasZh) return;
    const loadLang = async () => {
      const data = lang === 'zh' ? await loadBlogPostZh(slug) : await loadBlogPost(slug);
      setPost(data);
    };
    loadLang();
  }, [lang, slug, hasZh]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-neutral-500">Loading...</p>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <p className="text-neutral-500 mb-4">{error || 'Post not found'}</p>
        <Link to="/blog" className="text-blue-600 hover:underline">
          ← Back to Blog
        </Link>
      </div>
    );
  }

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header Section */}
      <header className="max-w-[720px] mx-auto px-6 pt-12 pb-6">
        <Link
          to="/blog"
          className="inline-flex items-center text-sm text-neutral-600 hover:text-neutral-900 mb-8 transition-colors"
        >
          <span className="mr-2">←</span> Back to Blog
        </Link>

        <h1 className="text-4xl font-bold mb-4 font-['Space_Grotesk']">
          {post.metadata.title}
        </h1>

        <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-600 mb-6">
          <time dateTime={post.metadata.date}>
            {formatDate(post.metadata.date)}
          </time>
          {post.metadata.updated && (
            <span className="text-neutral-400 ml-2">(Updated {formatDate(post.metadata.updated)})</span>
          )}

          {post.metadata.category && (
            <>
              <span>•</span>
              <span className="capitalize">{post.metadata.category}</span>
            </>
          )}
          <LanguageToggle lang={lang} hasZh={hasZh} onChange={setLang} />
        </div>

        {/* Tags */}
        {post.metadata.tags && post.metadata.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {post.metadata.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-neutral-100 text-neutral-700 text-xs rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </header>

      {/* Markdown Content */}
      <MarkdownRenderer content={post.content} />

      {/* Footer Navigation */}
      <footer className="max-w-[720px] mx-auto px-6 pt-12 pb-16 border-t border-neutral-200 mt-16">
        <Link
          to="/blog"
          className="inline-flex items-center text-neutral-600 hover:text-neutral-900 transition-colors"
        >
          <span className="mr-2">←</span> Back to all posts
        </Link>
      </footer>
    </div>
  );
};

export default BlogPost;
