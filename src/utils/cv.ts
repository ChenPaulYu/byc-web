/** Lightweight CV compatibility helpers; shared by the page and regression checks. */
import type { CvConfig, CvLink, Publication } from '../types/cv';

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

export function visibleCvReferences(config: CvConfig): Set<string> {
  return new Set([
    ...(config.visibility?.publications !== false ? config.publications ?? [] : []),
    ...(config.visibility?.art !== false ? config.art ?? [] : []),
  ].flatMap(item => item.id ? [item.id] : []));
}

// Old configs used author HTML, sometimes with literal Markdown stars inside <strong>.
// Only these emphasis tags are recognized; all other markup remains escaped React text.
export function normalizeCvText(text: string): string {
  return text
    .replace(/<(?:strong|b)>(.*?)<\/(?:strong|b)>/gi, (_, value: string) => `**${value.replace(/^\*|\*$/g, '')}**`)
    .replace(/<(?:em|i)>(.*?)<\/(?:em|i)>/gi, '*$1*');
}
