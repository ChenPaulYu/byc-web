/**
 * Defines the legacy curated project-card contract used by the public Projects page.
 * Reads: none.
 */

export interface Project {
  id: string;
  title: string;
  category: 'Research' | 'Engineering' | 'Creative';
  year: string;
  role: string;
  description: string;
  tags: string[];
  links: {
    label: string;
    url: string;
    icon?: 'video' | 'paper' | 'code' | 'demo';
  }[];
  image?: string;
}
