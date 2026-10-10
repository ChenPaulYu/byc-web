/** Restricted CV inline copy: emphasis, safe text links, badges and stable citations. */
import React from 'react';
import { CvReference } from './CvReference';
import { CV_INLINE_LINK_PATTERN, cvHref, normalizeCvText } from '../../utils/cv';

const inlineParts = new RegExp(String.raw`(${CV_INLINE_LINK_PATTERN}|\*\*[^*]+\*\*|\*[^*]+\*|\[\[[\w-]+\]\]|\{\{[^{}]+\}\})`, 'g');
const inlineLink = new RegExp(`^${CV_INLINE_LINK_PATTERN}$`);

export function CvInline({ text }: { text: string }) {
  const parts = normalizeCvText(text).split(inlineParts);
  return <>{parts.map((part, i) => {
    if (inlineLink.test(part)) {
      const boundary = part.indexOf('](');
      const label = part.slice(1, boundary);
      const href = cvHref(part.slice(boundary + 2, -1));
      return href
        ? <a key={i} className="cv-inline-link" href={href} target="_blank" rel="noopener noreferrer"><CvInline text={label} /></a>
        : <CvInline key={i} text={label} />;
    }
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
