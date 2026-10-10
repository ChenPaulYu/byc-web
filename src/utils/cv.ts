/** Lightweight CV compatibility helpers; shared by the page and regression checks. */
import type { ArtEntry, CvConfig, CvLink, Publication } from '../types/cv';

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
  kind: 'publication' | 'art';
  title: string;
  detail: string;
  venue: string;
  year: string;
  links: CvLink[];
}

export function cvPreviewText(text: string): string {
  return normalizeCvText(text).replace(/\*\*([^*]+)\*\*|\*([^*]+)\*|\{\{([^{}]+)\}\}/g, '$1$2$3');
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
  return references;
}

// Old configs used author HTML, sometimes with literal Markdown stars inside <strong>.
// Only these emphasis tags are recognized; all other markup remains escaped React text.
export function normalizeCvText(text: string): string {
  return text
    .replace(/<(?:strong|b)>(.*?)<\/(?:strong|b)>/gi, (_, value: string) => `**${value.replace(/^\*|\*$/g, '')}**`)
    .replace(/<(?:em|i)>(.*?)<\/(?:em|i)>/gi, '*$1*');
}
