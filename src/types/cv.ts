/** Shared CV content contract for the public page and both admin transports. */
export type CvLinkKind = 'paper' | 'code' | 'demo' | 'video' | 'website';
export interface CvLink { kind: CvLinkKind; url: string; label?: string; }
export interface Education { school: string; degree: string; duration: string; location: string; description?: string[]; }
export interface Experience { company: string; role: string; duration: string; location: string; description: string[]; links?: CvLink[]; }
export interface Publication { id?: string; title: string; authors: string; venue: string; year: string; acceptanceRate?: string; pdf?: string; award?: string; links?: CvLink[]; }
export interface Thesis { title: string; authors: string; institution: string; year: string; }
export interface Award { title: string; venue: string; year: string; detail?: string; }
export interface ReviewerEntry { venue: string; years: string; }
export interface ArtEntry { id: string; title: string; description: string; venue: string; year: string; links?: CvLink[]; }
export interface CustomSectionItem { text: string; detail?: string; }
export interface CustomSection { id: string; title: string; visible: boolean; items: CustomSectionItem[]; }
export interface CvConfig {
  header: { name: string; tagline: string; nativeName?: string; location?: string; email?: string; github?: string; scholar?: string; linkedin?: string; };
  researchInterests?: string;
  education: Education[];
  workExperience: Experience[];
  researchExperience: Experience[];
  teachingExperience: Experience[];
  openSource?: Experience[];
  extracurricular?: Experience[];
  publications: Publication[];
  art?: ArtEntry[];
  theses: Thesis[];
  awards: Award[];
  reviewer: ReviewerEntry[];
  visibility: Record<string, boolean>;
  customSections: CustomSection[];
}
