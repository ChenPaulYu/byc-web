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

// Printed identifier line under a publication: DOI wins over arXiv; malformed values are ignored (plain text only, never free-form URLs).
const DOI_PATTERN = /^10\.\d{4,9}\/[^\s<>"]+$/;
const ARXIV_PATTERN = /^(?:\d{4}\.\d{4,5}|[a-z-]+(?:\.[A-Z]{2})?\/\d{7})(?:v\d+)?$/;
export interface CvPublicationIdentifier { label: 'DOI' | 'arXiv'; id: string; href: string; }
export function publicationIdentifier(publication: Pick<Publication, 'doi' | 'arxiv'>): CvPublicationIdentifier | undefined {
  const doi = publication.doi?.trim();
  if (doi && DOI_PATTERN.test(doi)) return { label: 'DOI', id: doi, href: `https://doi.org/${encodeURI(doi)}` };
  const arxiv = publication.arxiv?.trim();
  if (arxiv && ARXIV_PATTERN.test(arxiv)) return { label: 'arXiv', id: arxiv, href: `https://arxiv.org/abs/${arxiv}` };
  return undefined;
}

// Links shown inline on the page: a DOI/arXiv identifier replaces the paper icon (previews keep publicationLinks).
export function publicationDisplayLinks(publication: Publication): CvLink[] {
  const links = publicationLinks(publication);
  return publicationIdentifier(publication) ? links.filter(link => link.kind !== 'paper') : links;
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
