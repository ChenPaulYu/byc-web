import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { SOCIAL_LINKS } from '../constants';
import { GitHubIcon, ScholarIcon, MailIcon, TwitterIcon } from '../components/SocialIcons';
import { usePageTitle } from '../utils/usePageTitle';
import LanguageToggle from '../components/LanguageToggle';
import { hasChineseAbout, loadAboutContent, loadAboutContentZh, loadAllNews, NewsContent } from '../utils/contentLoader';

const About: React.FC = () => {
  usePageTitle('About');
  const [lang, setLang] = useState<'en' | 'zh'>('en');
  const [hasZh, setHasZh] = useState(false);
  const [aboutContent, setAboutContent] = useState<string>('');
  const [news, setNews] = useState<NewsContent[]>([]);

  // Manual "Now" section - update this whenever you want!
  const nowSection = {
    // Announcement banner (blue box with emoji)
    announcement: {
      text: "Starting PhD in Music Technology at XYZ University",
      date: "Fall 2025",
      show: true // Set to false to hide the banner
    },

    // Your current focus description (supports markdown + links)
    description: `
I'm currently focused on bridging digital fabrication and musical acoustics through **FlueBricks**, exploring how computational design can democratize instrument making.

Recent explorations include DDSP-based synthesis and web audio prototyping. Writing about [creative constraints](/blog/creative-constraints) and the intersection of AI and musical expression.

Also teaching workshops on interactive music systems and contributing to open-source audio tools.
    `.trim()
  };

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

      {aboutContent ? (
        <section className="prose prose-neutral prose-lg text-neutral-600 leading-relaxed space-y-6">
          <ReactMarkdown
            components={{
              a: ({ node, ...props }) => (
                <a
                  {...props}
                  className="text-blue-600 hover:text-blue-700 underline"
                />
              ),
              p: ({ node, ...props }) => (
                <p {...props} className="mb-4" />
              ),
              strong: ({ node, ...props }) => (
                <strong {...props} className="text-neutral-900 font-semibold" />
              ),
            }}
          >
            {aboutContent}
          </ReactMarkdown>
        </section>
      ) : (
        <section className="prose prose-neutral prose-lg text-neutral-600 leading-relaxed space-y-6">
          <p>
            I am a passionate researcher and educator innovating at the nexus of <strong className="text-black font-medium">AI Music</strong>, <strong className="text-black font-medium">Musical Acoustics</strong>, and <strong className="text-black font-medium">Human-Computer Interaction</strong>.
          </p>

          <p>
            Currently, I am pursuing my M.S. at National Taiwan University, where my research focuses on computational physicality—specifically, how we can use digital fabrication and algorithms to design novel musical instruments (like <em>FlueBricks</em>).
          </p>

          <p>
            Previously, I worked with the Creative AI Lab at Sony Group Corporation in Japan, where I developed <em>DJTransGAN</em>, the first AI model capable of generating smooth DJ-like transitions between tracks. My work bridges the gap between technical engineering (DSP, Deep Learning) and creative expression.
          </p>

          <p>
            I strive to build systems that are "quietly confident"—tools that empower musicians and novices alike without overwhelming them with complexity.
          </p>
        </section>
      )}

      {/* Now Section */}
      <section className="mt-16 pt-8 border-t border-neutral-100">
        <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-400 mb-8">Now</h2>

        {/* Announcement Banner */}
        {nowSection.announcement.show && (
          <div className="mb-8 p-4 bg-blue-50 border-l-4 border-blue-600 rounded-r">
            <div className="flex items-start gap-3">
              <span className="text-lg">📢</span>
              <div>
                <p className="text-base text-neutral-900 font-medium">
                  {nowSection.announcement.text}
                </p>
                <p className="text-sm text-neutral-500 mt-1">
                  {nowSection.announcement.date}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Current Focus Description (Markdown) */}
        <div className="prose prose-neutral max-w-none text-neutral-600 leading-relaxed">
          <ReactMarkdown
            components={{
              a: ({ node, ...props }) => (
                <a
                  {...props}
                  className="text-blue-600 hover:text-blue-700 underline"
                />
              ),
              p: ({ node, ...props }) => (
                <p {...props} className="mb-4" />
              ),
              strong: ({ node, ...props }) => (
                <strong {...props} className="text-neutral-900 font-semibold" />
              ),
            }}
          >
            {nowSection.description}
          </ReactMarkdown>
        </div>
      </section>

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
