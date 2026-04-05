import React, { lazy, Suspense, useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import mermaid from 'mermaid';
import 'highlight.js/styles/github-dark-dimmed.css';

// Lazy load heavy components
const Lightbox = lazy(() => import('./blog/Lightbox'));
const AudioPlayer = lazy(() => import('./blog/AudioPlayer'));

// Initialize Mermaid with better config
mermaid.initialize({
  startOnLoad: false,
  theme: 'neutral',
  securityLevel: 'loose'
});

// Custom component patterns
const CUSTOM_COMPONENT_PATTERN = /^::(\w+)\[([^\]]*)\]$/;

const parseCustomComponent = (text: string): { type: string; content: string } | null => {
  const match = text.trim().match(CUSTOM_COMPONENT_PATTERN);
  if (!match) return null;
  return { type: match[1], content: match[2] };
};

// YouTube URL patterns
const YOUTUBE_PATTERNS = [
  /youtu\.be\/([a-zA-Z0-9_-]{11})/,
  /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
  /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
];

const getYouTubeVideoId = (url: string): string | null => {
  for (const pattern of YOUTUBE_PATTERNS) {
    const match = url.match(pattern);
    if (match?.[1]) {
      return match[1];
    }
  }
  return null;
};

const isYouTubeUrl = (text: string): boolean => {
  return YOUTUBE_PATTERNS.some(p => p.test(text));
};


// Mermaid Diagram Component
const MermaidDiagram: React.FC<{ code: string }> = ({ code }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  useEffect(() => {
    if (!code) return;

    const renderDiagram = async () => {
      try {
        setIsLoading(true);
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        const { svg } = await mermaid.render(id, code);
        setSvgContent(svg);
      } catch (err) {
        console.error('Mermaid rendering error:', err);
        // Show code block as fallback
        setSvgContent(null);
      } finally {
        setIsLoading(false);
      }
    };

    renderDiagram();
  }, [code]);

  if (!svgContent) {
    return (
      <pre className="markdown-code-block">
        <code>{code}</code>
      </pre>
    );
  }

  return (
    <div
      ref={containerRef}
      className="mermaid-container"
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
};

// BibTeX copy button (next to heading)
const BibtexCopyButton: React.FC<{ contentRef: React.RefObject<string> }> = ({ contentRef }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    if (contentRef.current) {
      navigator.clipboard.writeText(contentRef.current);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  return (
    <button onClick={handleCopy} className="bibtex-copy-btn">
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
};

// Switchable Figure/Video component
const VideoFigure: React.FC<{ videoUrl: string; imageSrc: string; caption: string }> = ({ videoUrl, imageSrc, caption }) => {
  const [mode, setMode] = useState<'figure' | 'video'>('figure');
  const videoIdMatch = videoUrl.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  const videoId = videoIdMatch?.[1];
  const dotIdx = caption.indexOf('. ');
  const captionContent = dotIdx > 0 ? (
    <><strong>{caption.slice(0, dotIdx + 1)}</strong>{caption.slice(dotIdx + 1)}</>
  ) : caption;

  return (
    <figure className="markdown-figure-captioned">
      <div className="flex justify-center mb-3">
        <div className="inline-flex rounded-full border border-neutral-200 overflow-hidden">
          <button
            onClick={() => setMode('figure')}
            className={`px-5 py-2 text-sm font-medium transition-colors ${mode === 'figure' ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-600 hover:bg-neutral-50'}`}
          >
            Figure
          </button>
          <button
            onClick={() => setMode('video')}
            className={`px-5 py-2 text-sm font-medium transition-colors ${mode === 'video' ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-600 hover:bg-neutral-50'}`}
          >
            Video
          </button>
        </div>
      </div>
      {mode === 'figure' ? (
        <img src={imageSrc} alt={caption} className="markdown-img" style={{ margin: 0 }} />
      ) : videoId ? (
        <div className="relative w-full rounded-md overflow-hidden" style={{ paddingBottom: '56.25%' }}>
          <iframe
            className="absolute inset-0 w-full h-full"
            src={`https://www.youtube.com/embed/${videoId}`}
            title="Video"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      ) : null}
      <figcaption className="markdown-figcaption-auto">{captionContent}</figcaption>
    </figure>
  );
};

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  className = ''
}) => {
  const [lightboxOpen, setLightboxOpen] = React.useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = React.useState(0);
  const [images, setImages] = React.useState<string[]>([]);
  const bibtexRef = React.useRef<string>('');

  // Extract all images from markdown content for lightbox
  const extractImages = React.useCallback((html: string) => {
    const imgRegex = /<img[^>]+src="([^">]+)"/g;
    const matches = [];
    let match;
    while ((match = imgRegex.exec(html)) !== null) {
      matches.push(match[1]);
    }
    setImages(matches);
  }, []);

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index);
    setLightboxOpen(true);
  };

  return (
    <article className={`markdown-content ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          // Links: open in new tab
          a: ({ node, href, ...props }) => (
            <a {...props} href={href} className="markdown-link" target="_blank" rel="noopener noreferrer" />
          ),
          // H2: add copy button next to BibTeX heading
          h2: ({ node, children, ...props }: any) => {
            const text = String(children);
            if (text === 'BibTeX') {
              return (
                <div className="bibtex-heading">
                  <h2 {...props}>{children}</h2>
                  <BibtexCopyButton contentRef={bibtexRef} />
                </div>
              );
            }
            return <h2 {...props}>{children}</h2>;
          },
          // Pre blocks: detect bibtex to override dark background
          pre: ({ node, children, ...props }: any) => {
            const codeChild = Array.isArray(children) ? children[0] : children;
            if (React.isValidElement(codeChild)) {
              const childProps = codeChild.props as any;
              const text = String(childProps?.children || '');
              if (text.trimStart().startsWith('@')) {
                return <div className="bibtex-wrapper">{children}</div>;
              }
            }
            return <pre {...props}>{children}</pre>;
          },
          // Code blocks with syntax highlighting and Mermaid support
          code: ({ node, inline, className: codeClassName, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(codeClassName || '');
            const language = match?.[1];
            const code = String(children).replace(/\n$/, '');

            // Handle Mermaid diagrams
            if (language === 'mermaid') {
              return <MermaidDiagram code={code} />;
            }

            // Handle BibTeX blocks
            if (!inline && code.trimStart().startsWith('@')) {
              bibtexRef.current = code;
              return <code className="bibtex-code">{children}</code>;
            }

            return inline ? (
              <code {...props} className="markdown-inline-code">
                {children}
              </code>
            ) : (
              <code {...props} className={`markdown-code-block ${codeClassName || ''}`}>
                {children}
              </code>
            );
          },
          // Figures with captions
          figure: ({ node, children, ...props }: any) => {
            const img = children?.find?.((c: any) => c?.type === 'img');
            const figCaption = children?.find?.((c: any) => c?.type === 'figcaption');
            if (img && figCaption) {
              return (
                <figure className="markdown-figure" {...props}>
                  {children}
                </figure>
              );
            }
            return <figure {...props}>{children}</figure>;
          },
          figcaption: ({ node, ...props }) => (
            <figcaption className="markdown-figcaption" {...props} />
          ),
          // Images with lightbox and caption
          img: ({ node, src, alt, title, ...props }: any) => {
            const imgEl = (
              <img
                {...props}
                src={src}
                alt={alt}
                title={title}
                className="markdown-img"
                onClick={() => {
                  const index = images.indexOf(src);
                  if (index !== -1) {
                    handleImageClick(index);
                  }
                }}
                style={{ cursor: 'pointer' }}
              />
            );
            // If title is a YouTube URL, render switchable Figure/Video
            if (title && isYouTubeUrl(title) && alt) {
              return <VideoFigure videoUrl={title} imageSrc={src} caption={alt} />;
            }
            if (alt && alt !== src) {
              const dotIdx = alt.indexOf('. ');
              const captionContent = dotIdx > 0 ? (
                <><strong>{alt.slice(0, dotIdx + 1)}</strong>{alt.slice(dotIdx + 1)}</>
              ) : alt;
              return (
                <figure className="markdown-figure-captioned">
                  {imgEl}
                  <figcaption className="markdown-figcaption-auto">{captionContent}</figcaption>
                </figure>
              );
            }
            return imgEl;
          },
          // Paragraph with custom component and YouTube URL detection
          p: ({ node, children }: any) => {
            // Check for custom components (::type[content])
            const textContent = typeof children === 'string' ? children.trim()
              : (Array.isArray(children) && children.length === 1 && typeof children[0] === 'string') ? children[0].trim()
              : null;

            if (textContent) {
              const custom = parseCustomComponent(textContent);
              if (custom) {
                switch (custom.type) {
                  case 'audio':
                    return (
                      <Suspense fallback={<div className="my-6 h-20 bg-neutral-50 rounded-lg animate-pulse" />}>
                        <AudioPlayer src={custom.content} />
                      </Suspense>
                    );
                  case 'announcement':
                    return (
                      <div className="my-6 p-4 bg-blue-50 border-l-4 border-blue-600 rounded-r">
                        <div className="flex items-start gap-3">
                          <span className="text-lg">📢</span>
                          <p className="text-base text-neutral-900 font-medium">{custom.content}</p>
                        </div>
                      </div>
                    );
                  default:
                    break;
                }
              }
            }

            let youtubeUrl: string | null = null;

            // Try to find a YouTube URL in the paragraph
            if (React.isValidElement(children) && children.props?.href) {
              if (isYouTubeUrl(children.props.href)) {
                youtubeUrl = children.props.href;
              }
            } else if (Array.isArray(children)) {
              for (const child of children) {
                if (React.isValidElement(child) && child.props?.href && isYouTubeUrl(child.props.href)) {
                  youtubeUrl = child.props.href;
                  break;
                } else if (typeof child === 'string' && isYouTubeUrl(child.trim())) {
                  youtubeUrl = child.trim();
                  break;
                }
              }
            } else if (typeof children === 'string' && isYouTubeUrl(children.trim())) {
              youtubeUrl = children.trim();
            }

            // If we found a YouTube URL, embed it
            if (youtubeUrl) {
              const videoId = getYouTubeVideoId(youtubeUrl);
              if (videoId) {
                return (
                  <div className="youtube-embed-wrapper">
                    <iframe
                      src={`https://www.youtube.com/embed/${videoId}`}
                      title="YouTube video player"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  </div>
                );
              }
            }

            return <p>{children}</p>;
          },
          // Handle YouTube embed HTML
          html: (props: any) => {
            return <>{props.children}</>;
          },
        }}
      >
        {content}
      </ReactMarkdown>

      {/* Lightbox */}
      <Suspense fallback={null}>
        {lightboxOpen && (
          <Lightbox
            slides={images.map(src => ({ src }))}
            index={selectedImageIndex}
            onClose={() => setLightboxOpen(false)}
            onIndexChange={setSelectedImageIndex}
          />
        )}
      </Suspense>
    </article>
  );
};

export default MarkdownRenderer;
