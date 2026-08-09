/**
 * Derives short plain-text previews from Markdown content.
 * Reads: Markdown strings supplied by the content loader.
 */

export const extractExcerpt = (content: string, maxLength: number = 150): string => {
  const firstParagraph = content
    .split('\n\n')[0]
    .replace(/^#+\s+/, '') // Remove heading markers
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove markdown links
    .replace(/[*_`]/g, '') // Remove formatting
    .trim();

  if (firstParagraph.length <= maxLength) return firstParagraph;
  return firstParagraph.substring(0, maxLength).trim() + '...';
};
