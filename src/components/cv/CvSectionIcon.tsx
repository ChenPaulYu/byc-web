/** Line icon shown before a CV section heading, in the SOP's run-in label style; untitled sections get none. */
import React from 'react';

const ICONS: Record<string, React.ReactNode> = {
  'Research Interests': <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></>,
  Education: <><path d="M22 10 12 5 2 10l10 5 10-5z" /><path d="M6 12v5c3 2 9 2 12 0v-5" /></>,
  'Research Experience': <><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></>,
  'Work Experience': <><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></>,
  'Selected Publications': <><path d="M4 4h12a4 4 0 0 1 4 4v12H8a4 4 0 0 1-4-4z" /><path d="M8 9h8M8 13h8" /></>,
  'Honors & Awards': <><circle cx="12" cy="9" r="6" /><path d="m8.5 14-1.5 8 5-3 5 3-1.5-8" /></>,
  'Teaching & Service': <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>,
  'Interactive Art & Installations': <><path d="M12 2 2 7l10 5 10-5-10-5z" /><path d="M2 12l10 5 10-5" /><path d="M2 17l10 5 10-5" /></>,
  'Open-Source Software & Toolkits': <><path d="m8 8-5 4 5 4" /><path d="m16 8 5 4-5 4" /><path d="m14 5-4 14" /></>,
  'Extracurricular Activities': <><circle cx="12" cy="12" r="10" /><path d="m16.2 7.8-2.2 6.2-6.2 2.2 2.2-6.2z" /></>,
};

export function CvSectionIcon({ title }: { title: string }) {
  const paths = ICONS[title];
  if (!paths) return null;
  return <svg className="cv-section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths}</svg>;
}
