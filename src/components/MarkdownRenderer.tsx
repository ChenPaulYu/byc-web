/**
 * Renders Markdown content with syntax highlighting, Mermaid diagrams, and embedded media.
 * Reads: Markdown strings and media URLs supplied by public content pages.
 */

import React, { lazy, Suspense } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark-dimmed.css';
import {
  BibtexCopyButton,
  getYouTubeVideoId,
  isYouTubeUrl,
  parseCustomComponent,
  VideoFigure,
} from './markdown/blocks';

// Lazy load heavy components
const Lightbox = lazy(() => import('./blog/Lightbox'));
const AudioPlayer = lazy(() => import('./blog/AudioPlayer'));
const MermaidDiagram = lazy(() => import('./markdown/MermaidDiagram'));

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
              return (
                <Suspense fallback={
                  <pre className="markdown-code-block">
                    <code>{code}</code>
                  </pre>
                }>
                  <MermaidDiagram code={code} />
                </Suspense>
              );
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
            const getElementHref = (child: React.ReactNode): string | undefined => {
              if (!React.isValidElement(child)) return undefined;
              const href = (child.props as { href?: unknown }).href;
              return typeof href === 'string' ? href : undefined;
            };

            const directHref = getElementHref(children);
            if (directHref && isYouTubeUrl(directHref)) {
              youtubeUrl = directHref;
            } else if (Array.isArray(children)) {
              for (const child of children) {
                const childHref = getElementHref(child);
                if (childHref && isYouTubeUrl(childHref)) {
                  youtubeUrl = childHref;
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
