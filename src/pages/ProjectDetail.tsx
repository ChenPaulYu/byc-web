import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { loadProject, loadProjectZh, hasChineseVersion, ProjectContent } from '../utils/contentLoader';
import MarkdownRenderer from '../components/MarkdownRenderer';
import { usePageTitle } from '../utils/usePageTitle';
import LanguageToggle from '../components/LanguageToggle';

const YOUTUBE_PATTERNS = [
  /youtu\.be\/([a-zA-Z0-9_-]{11})/,
  /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
  /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
];

const getYouTubeVideoId = (url: string): string | null => {
  for (const pattern of YOUTUBE_PATTERNS) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
};

const VideoTabs: React.FC<{ videos: Array<{ label: string; url: string }> }> = ({ videos }) => {
  const [active, setActive] = useState(0);
  const videoId = getYouTubeVideoId(videos[active].url);

  return (
    <div className="max-w-[860px] mx-auto px-6 mb-12">
      {videos.length > 1 && (
        <div className="flex justify-center mb-4">
          <div className="inline-flex rounded-full border border-neutral-200 overflow-hidden">
            {videos.map((v, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={`px-5 py-2 text-sm font-medium transition-colors ${
                  i === active
                    ? 'bg-neutral-900 text-white'
                    : 'bg-white text-neutral-600 hover:bg-neutral-50'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>
      )}
      {videoId && (
        <div className="relative w-full rounded-lg overflow-hidden shadow-md" style={{ paddingBottom: '56.25%' }}>
          <iframe
            key={videoId}
            className="absolute inset-0 w-full h-full"
            src={`https://www.youtube.com/embed/${videoId}`}
            title="Video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      )}
    </div>
  );
};

const ProjectDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [project, setProject] = useState<ProjectContent | null>(null);
  usePageTitle(project?.metadata?.title || 'Projects');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lang, setLang] = useState<'en' | 'zh'>('en');
  const [hasZh, setHasZh] = useState(false);

  useEffect(() => {
    if (!slug) return;

    const loadContent = async () => {
      try {
        setLoading(true);
        const data = await loadProject(slug);
        setProject(data);
        const zhExists = await hasChineseVersion('projects', slug);
        setHasZh(zhExists);
      } catch (err) {
        setError('Project not found');
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
      const data = lang === 'zh' ? await loadProjectZh(slug) : await loadProject(slug);
      setProject(data);
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

  if (error || !project) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <p className="text-neutral-500 mb-4">{error || 'Project not found'}</p>
        <Link to="/projects" className="text-blue-600 hover:underline">
          ← Back to Projects
        </Link>
      </div>
    );
  }

  const isAcademic = !!project.metadata.venue;

  if (isAcademic) {
    return (
      <div className="min-h-screen bg-white">
        {/* Back link */}
        <div className="max-w-[860px] mx-auto px-6 pt-8">
          <Link
            to="/projects"
            className="inline-flex items-center text-sm text-neutral-400 hover:text-neutral-900 transition-colors"
          >
            <span className="mr-2">←</span> Back to Projects
          </Link>
          <div className="flex justify-end -mt-5">
            <LanguageToggle lang={lang} hasZh={hasZh} onChange={setLang} />
          </div>
        </div>

        {/* Academic Hero */}
        <header className="max-w-[860px] mx-auto px-6 pt-8 pb-8 text-center">
          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-5 font-['Space_Grotesk']">
            {project.metadata.title}
          </h1>

          {/* Authors */}
          {project.metadata.authorList && (
            <p className="text-base mb-1">
              {project.metadata.authorList.map((author, i, arr) => (
                <span key={i}>
                  {author.url ? (
                    <a href={author.url} target="_blank" rel="noopener noreferrer" className={`text-blue-600 hover:underline ${author.bold ? 'font-semibold' : ''}`}>
                      {author.name}
                    </a>
                  ) : (
                    <span className={`text-blue-600 ${author.bold ? 'font-semibold' : ''}`}>{author.name}</span>
                  )}
                  {author.sup && <sup className="text-neutral-400">{author.sup}</sup>}
                  {i < arr.length - 1 && ', '}
                </span>
              ))}
            </p>
          )}

          {/* Affiliations */}
          {project.metadata.affiliationList && (
            <p className="text-sm text-neutral-500 mb-2 flex items-center justify-center gap-x-3 flex-wrap">
              {project.metadata.affiliationList.map((aff, i) => (
                <span key={i} className="inline-flex items-center gap-1">
                  {aff.logo && <img src={aff.logo} alt={aff.name} className="h-5 w-5 inline-block" />}
                  <span><sup>{aff.sup}</sup>{aff.name}</span>
                </span>
              ))}
            </p>
          )}

          {/* Venue badge */}
          <p className="text-sm font-medium tracking-wide text-neutral-500 mb-5 flex items-center justify-center gap-2">
            <span>Accepted to <strong className="text-neutral-900">{project.metadata.venue}</strong></span>
            {project.metadata.venueLogo && (
              <img src={project.metadata.venueLogo} alt={project.metadata.venue} className="h-5 inline-block" />
            )}
          </p>

          {/* Action buttons */}
          {project.metadata.links && project.metadata.links.length > 0 && (
            <div className="flex flex-wrap justify-center gap-3 mb-2">
              {project.metadata.links.map((link, index) => (
                <a
                  key={index}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2 border border-neutral-300 text-sm font-medium rounded-full text-neutral-700 hover:bg-neutral-50 transition-colors"
                >
                  {link.icon === 'paper' && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  )}
                  {link.icon === 'video' && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  )}
                  {link.icon === 'code' && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                  )}
                  {link.icon === 'demo' && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  )}
                  {link.label}
                </a>
              ))}
            </div>
          )}
        </header>

        {/* Teaser image with caption */}
        {project.metadata.cover && (
          <figure className="max-w-[860px] mx-auto px-6 mb-12">
            <img
              src={project.metadata.cover}
              alt={project.metadata.title}
              className="w-full rounded-lg shadow-md"
            />
            {project.metadata.coverCaption && (
              <figcaption className="mt-3 text-sm text-neutral-500 leading-relaxed px-2">
                {project.metadata.coverCaption?.replace(/--/g, '\u2014')}
              </figcaption>
            )}
          </figure>
        )}

        {/* Video tabs */}
        {project.metadata.videos && project.metadata.videos.length > 0 && (
          <VideoTabs videos={project.metadata.videos} />
        )}

        {/* Abstract card */}
        {project.metadata.abstract && (
          <div className="max-w-[860px] mx-auto px-6 mb-12">
            <div className="border border-neutral-200 rounded-lg px-8 py-8">
              <h2 className="text-center text-lg font-semibold tracking-wide mb-4 font-['Space_Grotesk']">Abstract</h2>
              <p className="text-neutral-700 leading-relaxed text-[15px]"
                dangerouslySetInnerHTML={{
                  __html: (project.metadata.abstract || '')
                    .replace(/--/g, '\u2014')
                    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\*(.+?)\*/g, '<em>$1</em>')
                }}
              />
            </div>
          </div>
        )}

        {/* Markdown Content */}
        <MarkdownRenderer content={project.content} className="academic-content" />

        {/* Footer */}
        <footer className="max-w-[860px] mx-auto px-6 pt-12 pb-16 border-t border-neutral-200 mt-16">
          <Link
            to="/projects"
            className="inline-flex items-center text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            <span className="mr-2">←</span> Back to all projects
          </Link>
        </footer>
      </div>
    );
  }

  // Default non-academic layout
  return (
    <div className="min-h-screen bg-white">
      <header className="max-w-[860px] mx-auto px-6 pt-12 pb-6">
        <Link
          to="/projects"
          className="inline-flex items-center text-sm text-neutral-600 hover:text-neutral-900 mb-8 transition-colors"
        >
          <span className="mr-2">←</span> Back to Projects
        </Link>

        <h1 className="text-4xl font-bold mb-4 font-['Space_Grotesk']">
          {project.metadata.title}
        </h1>

        <div className="flex flex-wrap gap-4 text-sm text-neutral-600 mb-4">
          <span className="font-medium">{project.metadata.category}</span>
          <span>•</span>
          <span>{project.metadata.year}</span>
          <span>•</span>
          <span>{project.metadata.role}</span>
          <LanguageToggle lang={lang} hasZh={hasZh} onChange={setLang} />
        </div>

        {project.metadata.tags && project.metadata.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {project.metadata.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-neutral-100 text-neutral-700 text-xs rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {project.metadata.links && project.metadata.links.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {project.metadata.links.map((link, index) => (
              <a
                key={index}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white text-sm rounded-md hover:bg-neutral-700 transition-colors"
              >
                {link.icon === 'paper' && '📄'}
                {link.icon === 'code' && '💻'}
                {link.icon === 'demo' && '🎮'}
                {link.icon === 'video' && '🎥'}
                {link.label}
              </a>
            ))}
          </div>
        )}
      </header>

      {project.metadata.cover && (
        <div className="max-w-[860px] mx-auto px-6 mb-8">
          <img
            src={project.metadata.cover}
            alt={project.metadata.title}
            className="w-full rounded-lg shadow-md"
          />
        </div>
      )}

      <MarkdownRenderer content={project.content} />

      <footer className="max-w-[860px] mx-auto px-6 pt-12 pb-16 border-t border-neutral-200 mt-16">
        <Link
          to="/projects"
          className="inline-flex items-center text-neutral-600 hover:text-neutral-900 transition-colors"
        >
          <span className="mr-2">←</span> Back to all projects
        </Link>
      </footer>
    </div>
  );
};

export default ProjectDetail;
