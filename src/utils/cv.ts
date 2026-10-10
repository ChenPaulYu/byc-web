/** Lightweight CV compatibility helpers; shared by the page and regression checks. */
import type { ArtEntry, CvConfig, CvLink, Publication } from '../types/cv';

// Restricted Markdown links share one grammar between rendering and plain-text previews.
export const CV_INLINE_LINK_PATTERN = String.raw`\[[^\]\n]+\]\([^\s)]+\)`;

export function cvHref(value?: string): string | undefined {
  if (!value) return undefined;
  if (/^\/(?!\/)/.test(value)) return value;
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) ? value : undefined;
  } catch { return undefined; }
}

export function publicationLinks(publication: Publication): CvLink[] {
  const links = publication.links ?? [];
  return publication.pdf && !links.some(link => link.kind === 'paper')
    ? [{ kind: 'paper', url: publication.pdf, label: 'Paper' }, ...links]
    : links;
}

export interface CvReferencePreview {
  id: string;
  kind: 'publication' | 'art' | 'award';
  label?: string;
  title: string;
  detail: string;
  venue: string;
  year: string;
  links: CvLink[];
}

export function cvPreviewText(text: string): string {
  return normalizeCvText(text)
    .replace(new RegExp(CV_INLINE_LINK_PATTERN, 'g'), token => token.slice(1, token.indexOf('](')))
    .replace(/\[\[([\w-]+)\]\]/g, '[$1]')
    .replace(/\*\*([^*]+)\*\*|\*([^*]+)\*|\{\{([^{}]+)\}\}/g, '$1$2$3');
}

export function cvAwardTarget(id?: string): string | undefined {
  return id ? `cv-award-${id}` : undefined;
}

export function artPresentation(item: ArtEntry): string {
  return [item.collaborators ? `With ${item.collaborators}` : '', item.venue ? `Presented at ${item.venue}` : ''].filter(Boolean).join(' · ');
}

export function visibleCvReferences(config: CvConfig): Map<string, CvReferencePreview> {
  const references = new Map<string, CvReferencePreview>();
  if (config.visibility?.publications !== false) for (const item of config.publications ?? []) {
    if (item.id) references.set(item.id, { id: item.id, kind: 'publication', title: item.title, detail: cvPreviewText(item.authors), venue: cvPreviewText(item.venue), year: item.year, links: publicationLinks(item) });
  }
  if (config.visibility?.art !== false) for (const item of config.art ?? []) {
    references.set(item.id, { id: item.id, kind: 'art', title: item.title, detail: cvPreviewText(item.description), venue: cvPreviewText(artPresentation(item)), year: item.year, links: item.links ?? [] });
  }
  if (config.visibility?.awards !== false) for (const item of config.awards ?? []) {
    if (item.id) references.set(`award:${item.id}`, { id: item.id, kind: 'award', label: item.label, title: cvPreviewText(item.title), detail: cvPreviewText(item.detail ?? ''), venue: cvPreviewText(item.venue), year: item.year, links: [] });
  }
  return references;
}

// Old configs used author HTML, sometimes with literal Markdown stars inside <strong>.
// Only these emphasis tags are recognized; all other markup remains escaped React text.
export function normalizeCvText(text: string): string {
  return text
    .replace(/<(?:strong|b)>(.*?)<\/(?:strong|b)>/gi, (_, value: string) => `**${value.replace(/^\*|\*$/g, '')}**`)
    .replace(/<(?:em|i)>(.*?)<\/(?:em|i)>/gi, '*$1*');
}
