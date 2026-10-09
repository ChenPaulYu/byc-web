/** Restricted inline CV copy: emphasis, badges and stable publication/art references. */
import React from 'react';
import { CvReference } from './CvReference';
import { normalizeCvText } from '../../utils/cv';


export function CvInline({ text }: { text: string }) {
  const parts = normalizeCvText(text).split(/(\*\*[^*]+\*\*|\*[^*]+\*|\[\[[\w-]+\]\]|\{\{[^{}]+\}\})/g);
  return <>{parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={i}><CvInline text={part.slice(2, -2)} /></strong>;
    if (part.startsWith('*') && part.endsWith('*')) return <em key={i}><CvInline text={part.slice(1, -1)} /></em>;
    if (part.startsWith('[[') && part.endsWith(']]')) {
      const id = part.slice(2, -2);
      return <CvReference key={i} id={id} />;
    }
    if (part.startsWith('{{') && part.endsWith('}}')) return <span key={i} className="cv-badge cv-badge-award">{part.slice(2, -2)}</span>;
    return <React.Fragment key={i}>{part}</React.Fragment>;
  })}</>;
}
