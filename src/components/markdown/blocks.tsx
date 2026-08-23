/**
 * Renders the self-contained Markdown blocks supported by public content.
 * Reads: Mermaid source, BibTeX text, and image/video URLs supplied by MarkdownRenderer.
 */

import React, { useEffect, useState } from 'react';

const CUSTOM_COMPONENT_PATTERN = /^::(\w+)\[([^\]]*)\]$/;

export const parseCustomComponent = (text: string): { type: string; content: string } | null => {
  const match = text.trim().match(CUSTOM_COMPONENT_PATTERN);
  if (!match) return null;
  return { type: match[1], content: match[2] };
};

const YOUTUBE_PATTERNS = [
  /youtu\.be\/([a-zA-Z0-9_-]{11})/,
  /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
  /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
];

export const getYouTubeVideoId = (url: string): string | null => {
  for (const pattern of YOUTUBE_PATTERNS) {
    const match = url.match(pattern);
    if (match?.[1]) {
      return match[1];
    }
  }
  return null;
};

export const isYouTubeUrl = (text: string): boolean => {
  return YOUTUBE_PATTERNS.some(p => p.test(text));
};

export const BibtexCopyButton: React.FC<{ contentRef: React.RefObject<string> }> = ({ contentRef }) => {
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

export const VideoFigure: React.FC<{ videoUrl: string; imageSrc: string; caption: string }> = ({ videoUrl, imageSrc, caption }) => {
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
