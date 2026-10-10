/** Restricted CV inline copy: emphasis, resource icons, advisor profiles, badges and stable citations. */
import React from 'react';
import { CvLinks } from './CvLinks';
import { CvPerson } from './CvPerson';
import { CvReference } from './CvReference';
import { CV_INLINE_LINK_PATTERN, cvHref, cvPreviewText, normalizeCvText } from '../../utils/cv';

const inlineParts = new RegExp(String.raw`(${CV_INLINE_LINK_PATTERN}|\*\*[^*]+\*\*|\*[^*]+\*|\[\[person:[\w-]+\]\]|\[\[[\w-]+\]\]|\{\{[^{}]+\}\})`, 'g');
const inlineLink = new RegExp(`^${CV_INLINE_LINK_PATTERN}$`);

export function CvInline({ text }: { text: string }) {
  const parts = normalizeCvText(text).split(inlineParts);
  return <>{parts.map((part, i) => {
    if (inlineLink.test(part)) {
      const boundary = part.indexOf('](');
      const label = part.slice(1, boundary);
      const href = cvHref(part.slice(boundary + 2, -1));
      if (!href) return <CvInline key={i} text={label} />;
      const host = new URL(href, 'https://cv.local').hostname;
      const kind = host === 'github.com' ? 'code' : 'website';
      return <span key={i} className="cv-inline-resource"><CvInline text={label} /><CvLinks inline
        links={[{ kind, url: href, label: `${cvPreviewText(label)} (${kind === 'code' ? 'GitHub' : 'Website'})` }]}
        title={label} /></span>;
    }
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={i}><CvInline text={part.slice(2, -2)} /></strong>;
    if (part.startsWith('*') && part.endsWith('*')) return <em key={i}><CvInline text={part.slice(1, -1)} /></em>;
    if (part.startsWith('[[person:') && part.endsWith(']]')) return <CvPerson key={i} id={part.slice(9, -2)} />;
    if (part.startsWith('[[') && part.endsWith(']]')) {
      const id = part.slice(2, -2);
      return <CvReference key={i} id={id} />;
    }
    if (part.startsWith('{{') && part.endsWith('}}')) return <span key={i} className="cv-badge cv-badge-award">{part.slice(2, -2)}</span>;
    return <React.Fragment key={i}>{part}</React.Fragment>;
  })}</>;
}
