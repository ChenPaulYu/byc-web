import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  className = ''
}) => {
  return (
    <article className={`markdown-content ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Custom renderers for specific elements if needed
          a: ({ node, ...props }) => (
            <a {...props} className="markdown-link" target="_blank" rel="noopener noreferrer" />
          ),
          code: ({ node, inline, ...props }: any) => (
            inline
              ? <code {...props} className="markdown-inline-code" />
              : <code {...props} className="markdown-code-block" />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </article>
  );
};

export default MarkdownRenderer;
