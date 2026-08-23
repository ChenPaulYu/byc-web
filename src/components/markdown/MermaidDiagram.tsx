/**
 * Renders Mermaid code blocks after the Markdown surface requests them.
 * Reads: Mermaid source supplied by MarkdownRenderer.
 */

import React, { useEffect, useState } from 'react';
import mermaid from 'mermaid';

mermaid.initialize({
  startOnLoad: false,
  theme: 'neutral',
  securityLevel: 'loose',
});

const MermaidDiagram: React.FC<{ code: string }> = ({ code }) => {
  const [svgContent, setSvgContent] = useState<string | null>(null);

  useEffect(() => {
    if (!code) return;

    const renderDiagram = async () => {
      try {
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        const { svg } = await mermaid.render(id, code);
        setSvgContent(svg);
      } catch (err) {
        console.error('Mermaid rendering error:', err);
        setSvgContent(null);
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
      className="mermaid-container"
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
};

export default MermaidDiagram;
