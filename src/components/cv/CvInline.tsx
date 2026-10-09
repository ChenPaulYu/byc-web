/** Restricted inline CV copy: emphasis, badges and stable publication/art references. */
import React, { createContext, useContext } from 'react';
import { normalizeCvText } from '../../utils/cv';

export const CvReferences = createContext<ReadonlySet<string>>(new Set());

export function CvInline({ text }: { text: string }) {
  const references = useContext(CvReferences);
  const parts = normalizeCvText(text).split(/(\*\*[^*]+\*\*|\*[^*]+\*|\[\[[\w-]+\]\]|\{\{[^{}]+\}\})/g);
  return <>{parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={i}><CvInline text={part.slice(2, -2)} /></strong>;
    if (part.startsWith('*') && part.endsWith('*')) return <em key={i}><CvInline text={part.slice(1, -1)} /></em>;
    if (part.startsWith('[[') && part.endsWith(']]')) {
      const id = part.slice(2, -2);
      return references.has(id)
        ? <a key={i} className="cv-ref" href={`#cv-ref-${id}`} aria-label={`Go to ${id}`}>{id}</a>
        : <span key={i} className="cv-ref">{id}</span>;
    }
    if (part.startsWith('{{') && part.endsWith('}}')) return <span key={i} className="cv-badge cv-badge-award">{part.slice(2, -2)}</span>;
    return <React.Fragment key={i}>{part}</React.Fragment>;
  })}</>;
}
