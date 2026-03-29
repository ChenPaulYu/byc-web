import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { SOCIAL_LINKS } from '../constants';
import { GitHubIcon, ScholarIcon, MailIcon, TwitterIcon, LinkedInIcon } from '../components/SocialIcons';
import { usePageTitle } from '../utils/usePageTitle';
import LanguageToggle from '../components/LanguageToggle';
import { hasChineseAbout, loadAboutContent, loadAboutContentZh, loadAllNews, NewsContent } from '../utils/contentLoader';

const About: React.FC = () => {
  usePageTitle('About');
  const [lang, setLang] = useState<'en' | 'zh'>('en');
  const [hasZh, setHasZh] = useState(false);
  const [aboutContent, setAboutContent] = useState<string>('');
  const [news, setNews] = useState<NewsContent[]>([]);

  useEffect(() => {
    const init = async () => {
      const zhExists = await hasChineseAbout();
      setHasZh(zhExists);
      const content = await loadAboutContent();
      setAboutContent(content);
      const newsData = await loadAllNews();
      setNews(newsData);
    };
    init();
  }, []);

  useEffect(() => {
    if (!hasZh) return;
    const loadLang = async () => {
      const content = lang === 'zh' ? await loadAboutContentZh() : await loadAboutContent();
      setAboutContent(content);
    };
    loadLang();
  }, [lang, hasZh]);

  return (
    <div className="max-w-2xl mx-auto px-6">
      <header className="mb-12">
        <div className="flex items-center gap-4 mb-4">
          <h1 className="text-3xl font-bold">About Me</h1>
          <LanguageToggle lang={lang} hasZh={hasZh} onChange={setLang} />
        </div>
        <div className="w-12 h-1 bg-neutral-900 mb-8"></div>
      </header>

      {aboutContent && (
        <section className="prose prose-neutral prose-lg text-neutral-600 leading-relaxed space-y-6">
          <ReactMarkdown
            components={{
              a: ({ node, ...props }) => (
                <a
                  {...props}
                  className="text-neutral-900 no-underline hover:text-blue-600 transition-colors duration-200"
                  style={{
                    backgroundImage: 'linear-gradient(#2563eb, #2563eb)',
                    backgroundSize: '100% 1px',
                    backgroundPosition: '0 100%',
                    backgroundRepeat: 'no-repeat',
                    paddingBottom: '1px',
                  }}
                />
              ),
              p: ({ node, children, ...props }: any) => {
                // Support ::announcement[text] custom component
                const childArray = Array.isArray(children) ? children : [children];
                const textContent = childArray.every((c: unknown) => typeof c === 'string')
                  ? childArray.join('').trim()
                  : (typeof children === 'string' ? children.trim() : null);
                if (textContent) {
                  const match = textContent.match(/^::announcement\[(.+)\]$/);
                  if (match) {
                    return (
                      <div className="not-prose mb-6 p-4 bg-blue-50 border-l-4 border-blue-600 rounded-r">
                        <div className="flex items-start gap-3">
                          <span className="text-lg">📢</span>
                          <p className="text-base text-neutral-900 font-medium">{match[1]}</p>
                        </div>
                      </div>
                    );
                  }
                }
                return <p {...props} className="mb-4">{children}</p>;
              },
              h2: ({ node, children, ...props }: any) => (
                <div className="not-prose mt-12 pt-8 border-t border-neutral-100 mb-6">
                  <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-400">{children}</h2>
                </div>
              ),
              em: ({ node, children, ...props }: any) => {
                const text = typeof children === 'string' ? children : Array.isArray(children) ? children.join('') : '';
                if (text.startsWith('Last updated')) {
                  return <p className="not-prose text-[11px] text-neutral-300 mt-16 text-right">{text}</p>;
                }
                return <em {...props}>{children}</em>;
              },
              strong: ({ node, ...props }) => (
                <strong {...props} className="text-neutral-900 font-semibold" />
              ),
            }}
          >
            {aboutContent}
          </ReactMarkdown>
        </section>
      )}

      {/* News Section */}
      {news.length > 0 && (
        <section className="mt-12 pt-8 border-t border-neutral-100">
          <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-400 mb-6">News</h2>
          <div className="space-y-3">
            {news.map((item) => (
              <div key={item.slug} className="flex gap-4 text-sm">
                <span className="text-neutral-400 font-mono tabular-nums shrink-0 w-24">
                  {new Date(item.metadata.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}
                </span>
                <span className="text-neutral-700">
                  {item.metadata.url ? (
                    <a href={item.metadata.url} target="_blank" rel="noreferrer" className="hover:text-blue-600 transition-colors">
                      {item.metadata.title} ↗
                    </a>
                  ) : (
                    item.metadata.title
                  )}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Connect Section */}
      <section className="mt-12 pt-8 border-t border-neutral-100">
        <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-400 mb-6">Connect</h2>
        <div className="flex flex-col gap-3">
          <a href={`mailto:${SOCIAL_LINKS.email}`} className="flex items-center gap-3 text-neutral-800 hover:text-blue-600 transition-colors group">
            <MailIcon size={18} className="text-neutral-400 group-hover:text-blue-600" />
            <span>{SOCIAL_LINKS.email}</span>
          </a>
          <a href={SOCIAL_LINKS.scholar} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-neutral-800 hover:text-blue-600 transition-colors group">
            <ScholarIcon size={18} className="text-neutral-400 group-hover:text-blue-600" />
            <span>Google Scholar</span>
          </a>
          <a href={SOCIAL_LINKS.github} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-neutral-800 hover:text-blue-600 transition-colors group">
            <GitHubIcon size={18} className="text-neutral-400 group-hover:text-blue-600" />
            <span>GitHub</span>
          </a>
          <a href={SOCIAL_LINKS.linkedin} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-neutral-800 hover:text-blue-600 transition-colors group">
            <LinkedInIcon size={18} className="text-neutral-400 group-hover:text-blue-600" />
            <span>LinkedIn</span>
          </a>
          <a href={SOCIAL_LINKS.twitter} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-neutral-800 hover:text-blue-600 transition-colors group">
            <TwitterIcon size={18} className="text-neutral-400 group-hover:text-blue-600" />
            <span>X (Twitter)</span>
          </a>
        </div>
      </section>
    </div>
  );
};

export default About;
