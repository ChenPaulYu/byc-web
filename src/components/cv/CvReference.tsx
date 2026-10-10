/** Citation and award metadata feed one shared preview with stable document anchors. */
import React, { createContext, useContext } from 'react';
import { cvAwardTarget, type CvReferencePreview } from '../../utils/cv';
import { CvLinks } from './CvLinks';
import { CvPreviewLink, CvPreviewProvider } from './CvPreviewLink';

export const CvReferences = createContext<ReadonlyMap<string, CvReferencePreview>>(new Map());

export function CvReferenceProvider({ entries, children }: { entries: ReadonlyMap<string, CvReferencePreview>; children: React.ReactNode }) {
  return <CvReferences.Provider value={entries}><CvPreviewProvider>{children}</CvPreviewProvider></CvReferences.Provider>;
}

export function CvReference({ id }: { id: string }) {
  const entry = useContext(CvReferences).get(id);
  if (!entry) return id.startsWith('award:') ? null : <span className="cv-ref">{id}</span>;
  const award = entry.kind === 'award';
  return <CvPreviewLink href={award ? `#${cvAwardTarget(entry.id)}` : `#cv-ref-${id}`}
    label={award ? `Go to award: ${entry.title}` : `Go to ${id}: ${entry.title}`} className={award ? 'cv-badge cv-badge-award cv-award-ref' : 'cv-ref'}
    title={entry.title} eyebrow={award ? `Honors & Awards · ${entry.year}` : `${id} · ${entry.kind === 'publication' ? 'Publication' : 'Interactive art'} · ${entry.year}`}
    detail={entry.detail} meta={entry.venue} resources={<CvLinks links={entry.links} />}>
    {award ? (entry.label || entry.title) : id}
  </CvPreviewLink>;
}
